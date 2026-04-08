import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/LibraryReport.css";

// ✅ Axios instance with token
const api = axios.create({
  baseURL: "http://192.168.1.10:5045/ims",
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

const LibraryReport = () => {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(ALL_BRANCHES);
  const [libraryName, setLibraryName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [libraryData, setLibraryData] = useState([]);
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
    fetchLibraryReport();
  }, [branchId, libraryName, studentId, pagination.currentPage]);

  const fetchBranches = async () => {
    try {
      const res = await api.get("/view_branches");
      setBranches(res.data.data || []);
    } catch (err) {
      console.error("Branch fetch error", err);
      setMsg({ type: "error", text: "Failed to fetch branches" });
    }
  };

  const fetchLibraryReport = async () => {
    try {
      setLoading(true);
      setMsg({ type: "", text: "" });

      const params = {
        page: pagination.currentPage,
        page_size: pagination.pageSize,
      };

      if (branchId !== ALL_BRANCHES) params.branch_id = branchId;
      if (libraryName) params.library_name = libraryName;
      if (studentId) params.student_id = studentId;

      const res = await api.get("/view_library_report", { params });

      setLibraryData(res.data.data || []);
      setPagination({
        currentPage: res.data.page || 1,
        pageSize: res.data.page_size || 10,
        total: res.data.total || 0,
        totalPages: res.data.total_pages || 1,
      });
    } catch (err) {
      console.error("Library report fetch error", err);
      setMsg({ type: "error", text: "Failed to fetch library report" });
      setLibraryData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (e) => {
    setBranchId(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleLibrarySearch = (e) => {
    setLibraryName(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleStudentSearch = (e) => {
    setStudentId(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const getStatusBadge = (isAvailable) =>
    isAvailable ? (
      <span className="libraryreport-status available">Available</span>
    ) : (
      <span className="libraryreport-status occupied">Occupied</span>
    );

  return (
    <div className="libraryreport-container">
      <div className="libraryreport-card">

        {/* Header */}
        <div className="libraryreport-header">
          <h2>Library Report</h2>
          <p>View library seat occupancy and student allocations</p>
        </div>

        {/* Filters */}
        <div className="libraryreport-filters">
          <div className="libraryreport-filter-group">
            <label>Select Branch</label>
            <select
              className="libraryreport-input"
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

          <div className="libraryreport-filter-group">
            <label>Search by Library Name</label>
            <input
              type="text"
              placeholder="Enter library name..."
              className="libraryreport-input"
              value={libraryName}
              onChange={handleLibrarySearch}
            />
          </div>

          <div className="libraryreport-filter-group">
            <label>Search by Student ID</label>
            <input
              type="text"
              placeholder="Enter student ID..."
              className="libraryreport-input"
              value={studentId}
              onChange={handleStudentSearch}
            />
          </div>
        </div>

        {/* Alert */}
        {msg.text && (
          <div className={`libraryreport-alert ${msg.type}`}>
            <span>{msg.text}</span>
            {msg.type === "success" && (
              <button
                className="libraryreport-close"
                onClick={() => setMsg({ type: "", text: "" })}
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="libraryreport-loading">
            <div className="libraryreport-spinner"></div>
            <p>Loading library report...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && libraryData.length === 0 && (
          <div className="libraryreport-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="12" y1="7" x2="16" y2="7" />
              <line x1="12" y1="11" x2="16" y2="11" />
            </svg>
            <p>No libraries found{branchId !== ALL_BRANCHES ? " for this branch" : ""}</p>
            {(libraryName || studentId) && <p>Try adjusting your search criteria</p>}
          </div>
        )}

        {/* Data */}
        {!loading && libraryData.length > 0 && (
          <>
            {/* Stats Bar */}
            <div className="libraryreport-stats">
              <div className="libraryreport-stat-card">
                <span className="libraryreport-stat-label">Total Libraries</span>
                <span className="libraryreport-stat-value">{libraryData.length}</span>
              </div>
              <div className="libraryreport-stat-card">
                <span className="libraryreport-stat-label">Total Seats</span>
                <span className="libraryreport-stat-value">
                  {libraryData.reduce((s, l) => s + (l.total_seats || 0), 0)}
                </span>
              </div>
              <div className="libraryreport-stat-card">
                <span className="libraryreport-stat-label">Occupied Seats</span>
                <span className="libraryreport-stat-value occupied-val">
                  {libraryData.reduce((s, l) => s + (l.occupied_seats || 0), 0)}
                </span>
              </div>
              <div className="libraryreport-stat-card">
                <span className="libraryreport-stat-label">Available Seats</span>
                <span className="libraryreport-stat-value available-val">
                  {libraryData.reduce((s, l) => s + (l.available_seats || 0), 0)}
                </span>
              </div>
            </div>

            {/* Library Cards */}
            {libraryData.map((library, idx) => (
              <div key={library.library_id || idx} className="libraryreport-library-card">
                <div className="libraryreport-library-header">
                  <div className="libraryreport-library-info">
                    <div className="libraryreport-library-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3>{library.library_name}</h3>
                      <span className="libraryreport-branch-badge">{library.branch_name}</span>
                    </div>
                  </div>
                  <div className="libraryreport-occupancy">
                    <div className="libraryreport-occupancy-bar-wrap">
                      <div
                        className="libraryreport-occupancy-bar"
                        style={{
                          width: library.total_seats
                            ? `${Math.round((library.occupied_seats / library.total_seats) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <span className={`libraryreport-seats-count ${library.available_seats === 0 ? "full" : "partial"}`}>
                      📊 {library.occupied_seats}/{library.total_seats} Seats Occupied
                    </span>
                  </div>
                </div>

                {/* Seats Table */}
                {library.seats && library.seats.length > 0 ? (
                  <table className="libraryreport-seats-table">
                    <thead>
                      <tr>
                        <th>Sl.No.</th>
                        <th>Seat Number</th>
                        <th>Status</th>
                        <th>Student Name</th>
                        <th>Student ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {library.seats.map((seat, sIdx) => (
                        <tr
                          key={seat.seat_id || sIdx}
                          className={seat.is_available ? "libraryreport-available-row" : "libraryreport-occupied-row"}
                        >
                          <td>{sIdx + 1}</td>
                          <td>
                            <span className="libraryreport-seat-number">{seat.seat_number}</span>
                          </td>
                          <td>{getStatusBadge(seat.is_available)}</td>
                          <td>
                            {!seat.is_available ? (
                              <span className="libraryreport-student-name">{seat.student_name || "—"}</span>
                            ) : (
                              <span className="libraryreport-empty-text">—</span>
                            )}
                          </td>
                          <td>
                            {!seat.is_available ? (
                              <code className="libraryreport-student-id">{seat.student_id || "—"}</code>
                            ) : (
                              <span className="libraryreport-empty-text">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="libraryreport-no-seats">No seat data available.</p>
                )}
              </div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="libraryreport-pagination">
                <button
                  className="libraryreport-page-btn"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  ← Previous
                </button>

                <div className="libraryreport-page-numbers">
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
                        className={`libraryreport-page-number ${
                          pagination.currentPage === pageNum ? "libraryreport-active-page" : ""
                        }`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="libraryreport-page-btn"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next →
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="libraryreport-footer">
              <div className="libraryreport-summary">
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

export default LibraryReport;