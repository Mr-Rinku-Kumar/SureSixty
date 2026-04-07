import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Roomreport.css";

// ✅ Axios instance with token
const api = axios.create({
  baseURL: "http://192.168.1.3:5045/ims",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("tenant_id");
      localStorage.removeItem("branch_id");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const ALL_BRANCHES = "all";

const RoomReport = () => {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(ALL_BRANCHES);
  const [roomNumber, setRoomNumber] = useState("");   // ← new filter
  const [searchTerm, setSearchTerm] = useState("");
  const [roomData, setRoomData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchRoomReport();
  }, [branchId, roomNumber, searchTerm, pagination.currentPage]);

  const fetchBranches = async () => {
    try {
      const res = await api.get("/view_branches");
      setBranches(res.data.data || []);
    } catch (err) {
      console.error("Branch fetch error", err);
      setMsg({ type: "error", text: "Failed to fetch branches" });
    }
  };

  const fetchRoomReport = async () => {
    try {
      setLoading(true);
      setMsg({ type: "", text: "" });

      const params = {
        page: pagination.currentPage,
        page_size: pagination.pageSize,
      };

      if (branchId !== ALL_BRANCHES) params.branch_id   = branchId;
      if (roomNumber)               params.room_number  = roomNumber;  // ← new param
      if (searchTerm)               params.student_id   = searchTerm;

      const res = await api.get("/view_room_report", { params });

      setRoomData(res.data.data || []);
      setPagination({
        currentPage: res.data.page || 1,
        pageSize:    res.data.page_size || 10,
        total:       res.data.total || 0,
        totalPages:  res.data.total_pages || 1,
      });
    } catch (err) {
      console.error("Room report fetch error", err);
      setMsg({ type: "error", text: "Failed to fetch room report" });
      setRoomData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (e) => {
    setBranchId(e.target.value);
    setRoomNumber("");
    setSearchTerm("");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleRoomNumberSearch = (e) => {
    setRoomNumber(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, currentPage: newPage });
    }
  };

  const getStatusBadge = (isAvailable) =>
    isAvailable ? (
      <span className="roomreport-status available">Available</span>
    ) : (
      <span className="roomreport-status occupied">Occupied</span>
    );

  return (
    <div className="roomreport-container">
      <div className="roomreport-card">

        {/* Header */}
        <div className="roomreport-header">
          <h2>Room Statement Report</h2>
          <p>View room occupancy, bed allocation, and student details</p>
        </div>

        {/* Filters */}
        <div className="roomreport-filters">
          <div className="roomreport-filter-group">
            <label>Select Branch</label>
            <select
              className="roomreport-input"
              value={branchId}
              onChange={handleBranchChange}
            >
              <option value={ALL_BRANCHES}>All Branches</option>
              {branches.map((branch) => (
                <option
                  key={branch.id || branch.branch_id}
                  value={branch.id || branch.branch_id}
                >
                  {branch.name || branch.branch_name}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ New: Room Number filter */}
          <div className="roomreport-filter-group">
            <label>Search by Room Number</label>
            <input
              type="text"
              placeholder="Enter room number..."
              className="roomreport-input"
              value={roomNumber}
              onChange={handleRoomNumberSearch}
            />
          </div>

          <div className="roomreport-filter-group">
            <label>Search by Roll No / Student ID</label>
            <input
              type="text"
              placeholder="Enter Roll No..."
              className="roomreport-input"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Message Alert */}
        {msg.text && (
          <div className={`roomreport-alert ${msg.type}`}>
            <span>{msg.text}</span>
            {msg.type === "success" && (
              <button
                className="roomreport-close"
                onClick={() => setMsg({ type: "", text: "" })}
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="roomreport-loading">
            <div className="roomreport-spinner"></div>
            <p>Loading room report...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && roomData.length === 0 && (
          <div className="roomreport-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="8" width="18" height="12" rx="2" />
              <path d="M7 8V4h10v4" />
              <path d="M7 12h10" />
              <path d="M7 16h4" />
              <path d="M13 16h4" />
            </svg>
            <p>No rooms found{branchId !== ALL_BRANCHES ? " for this branch" : ""}</p>
            {(roomNumber || searchTerm) && <p>Try adjusting your search criteria</p>}
          </div>
        )}

        {/* Room Cards */}
        {!loading && roomData.length > 0 && (
          <>
            <div className="roomreport-stats">
              <div className="roomreport-stat-card">
                <span className="roomreport-stat-label">Total Rooms</span>
                <span className="roomreport-stat-value">{roomData.length}</span>
              </div>
              <div className="roomreport-stat-card">
                <span className="roomreport-stat-label">Total Beds</span>
                <span className="roomreport-stat-value">
                  {roomData.reduce((sum, room) => sum + (room.total_beds || 0), 0)}
                </span>
              </div>
              <div className="roomreport-stat-card">
                <span className="roomreport-stat-label">Occupied Beds</span>
                <span className="roomreport-stat-value">
                  {roomData.reduce((sum, room) => sum + (room.occupied_beds || 0), 0)}
                </span>
              </div>
              <div className="roomreport-stat-card">
                <span className="roomreport-stat-label">Available Beds</span>
                <span className="roomreport-stat-value">
                  {roomData.reduce((sum, room) => sum + (room.available_beds || 0), 0)}
                </span>
              </div>
            </div>

            {roomData.map((room, roomIndex) => (
              <div key={room.room_id || roomIndex} className="roomreport-room-card">
                <div className="roomreport-room-header">
                  <div className="roomreport-room-info">
                    <h3>Room: {room.room_number}</h3>
                    <span className="roomreport-branch-badge">{room.branch_name}</span>
                  </div>
                  <div className="roomreport-room-stats">
                    <span
                      className={`roomreport-beds-count ${
                        room.available_beds === 0 ? "full" : "available"
                      }`}
                    >
                      📊 {room.occupied_beds}/{room.total_beds} Beds Occupied
                    </span>
                  </div>
                </div>

                <div className="roomreport-beds-grid">
                  <table className="roomreport-beds-table">
                    <thead>
                      <tr>
                        <th>Sl.No.</th>
                        <th>Bed Number</th>
                        <th>Status</th>
                        <th>Student Name</th>
                        <th>Roll No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {room.beds &&
                        room.beds.map((bed, bedIndex) => (
                          <tr
                            key={bed.bed_id || bedIndex}
                            className={bed.is_available ? "available-row" : "occupied-row"}
                          >
                            <td>{bedIndex + 1}</td>
                            <td>
                              <span className="roomreport-bed-number">{bed.bed_number}</span>
                            </td>
                            <td>{getStatusBadge(bed.is_available)}</td>
                            <td>
                              {!bed.is_available ? (
                                <span className="roomreport-student-name">
                                  {bed.student_name || "—"}
                                </span>
                              ) : (
                                <span className="roomreport-empty-text">—</span>
                              )}
                            </td>
                            <td>
                              {!bed.is_available ? (
                                <code className="roomreport-student-id">
                                  {bed.student_id || "—"}
                                </code>
                              ) : (
                                <span className="roomreport-empty-text">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="roomreport-pagination">
                <button
                  className="roomreport-page-btn"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  ← Previous
                </button>

                <div className="roomreport-page-numbers">
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`roomreport-page-number ${
                          pagination.currentPage === pageNum ? "roomreport-active-page" : ""
                        }`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="roomreport-page-btn"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next →
                </button>
              </div>
            )}

            {/* Summary Footer */}
            <div className="roomreport-footer">
              <div className="roomreport-summary">
                <span>Total Records: {pagination.total}</span>
                <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RoomReport;