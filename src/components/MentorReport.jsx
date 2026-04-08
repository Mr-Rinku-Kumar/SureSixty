import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/MentorReport.css";

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

const MentorReport = () => {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(ALL_BRANCHES);
  const [mentorName, setMentorName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [mentorData, setMentorData] = useState([]);
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
    fetchMentorReport();
  }, [branchId, mentorName, studentId, pagination.currentPage]);

  const fetchBranches = async () => {
    try {
      const res = await api.get("/view_branches");
      setBranches(res.data.data || []);
    } catch (err) {
      console.error("Branch fetch error", err);
      setMsg({ type: "error", text: "Failed to fetch branches" });
    }
  };

  const fetchMentorReport = async () => {
    try {
      setLoading(true);
      setMsg({ type: "", text: "" });

      const params = {
        page: pagination.currentPage,
        page_size: pagination.pageSize,
      };

      if (branchId !== ALL_BRANCHES) params.branch_id = branchId;
      if (mentorName) params.mentor_name = mentorName;
      if (studentId) params.student_id = studentId;

      const res = await api.get("/view_mentor_report", { params });

      setMentorData(res.data.data || []);
      setPagination({
        currentPage: res.data.page || 1,
        pageSize: res.data.page_size || 10,
        total: res.data.total || 0,
        totalPages: res.data.total_pages || 1,
      });
    } catch (err) {
      console.error("Mentor report fetch error", err);
      setMsg({ type: "error", text: "Failed to fetch mentor report" });
      setMentorData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (e) => {
    setBranchId(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleMentorSearch = (e) => {
    setMentorName(e.target.value);
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

  // Total students across all mentor cards on current page
  const totalStudentsOnPage = mentorData.reduce(
    (sum, m) => sum + (m.students?.length || 0),
    0
  );

  return (
    <div className="mentorreport-container">
      <div className="mentorreport-card">

        {/* Header */}
        <div className="mentorreport-header">
          <h2>Mentor Report</h2>
          <p>View mentor assignments, library seats, and student allocations</p>
        </div>

        {/* Filters */}
        <div className="mentorreport-filters">
          <div className="mentorreport-filter-group">
            <label>Select Branch</label>
            <select
              className="mentorreport-input"
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

          <div className="mentorreport-filter-group">
            <label>Search by Mentor Name</label>
            <input
              type="text"
              placeholder="Enter mentor name..."
              className="mentorreport-input"
              value={mentorName}
              onChange={handleMentorSearch}
            />
          </div>

          <div className="mentorreport-filter-group">
            <label>Search by Student ID</label>
            <input
              type="text"
              placeholder="Enter student ID..."
              className="mentorreport-input"
              value={studentId}
              onChange={handleStudentSearch}
            />
          </div>
        </div>

        {/* Message Alert */}
        {msg.text && (
          <div className={`mentorreport-alert ${msg.type}`}>
            <span>{msg.text}</span>
            {msg.type === "success" && (
              <button
                className="mentorreport-close"
                onClick={() => setMsg({ type: "", text: "" })}
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mentorreport-loading">
            <div className="mentorreport-spinner"></div>
            <p>Loading mentor report...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && mentorData.length === 0 && (
          <div className="mentorreport-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              <path d="M17 11l2 2 4-4" />
            </svg>
            <p>No mentors found{branchId !== ALL_BRANCHES ? " for this branch" : ""}</p>
            {(mentorName || studentId) && <p>Try adjusting your search criteria</p>}
          </div>
        )}

        {/* Data */}
        {!loading && mentorData.length > 0 && (
          <>
            {/* Mentor Cards */}
            {mentorData.map((mentor, idx) => (
              <div key={mentor.mentor_id || idx} className="mentorreport-mentor-card">
                <div className="mentorreport-mentor-header">
                  <div className="mentorreport-mentor-info">
                    <div className="mentorreport-mentor-avatar">
                      {mentor.mentor_name?.charAt(0).toUpperCase() || "M"}
                    </div>
                    <div>
                      <h3>{mentor.mentor_name}</h3>
                      <span className="mentorreport-branch-badge">{mentor.branch_name}</span>
                    </div>
                  </div>
                  <div className="mentorreport-mentor-meta">
                    <span className="mentorreport-student-count">
                      👥 {mentor.total_students} Student{mentor.total_students !== 1 ? "s" : ""} Assigned
                    </span>
                  </div>
                </div>

                {/* Students Table */}
                {mentor.students && mentor.students.length > 0 ? (
                  <table className="mentorreport-students-table">
                    <thead>
                      <tr>
                        <th>Sl.No.</th>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th>Library</th>
                        <th>Seat No.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mentor.students.map((student, sIdx) => (
                        <tr key={student.student_id || sIdx}>
                          <td>{sIdx + 1}</td>
                          <td>
                            <span className="mentorreport-student-name">
                              {student.student_name || "—"}
                            </span>
                          </td>
                          <td>
                            <code className="mentorreport-student-id">
                              {student.student_id || "—"}
                            </code>
                          </td>
                          <td>
                            <span className="mentorreport-library-name">
                              {student.library_name || "—"}
                            </span>
                          </td>
                          <td>
                            <span className="mentorreport-seat-badge">
                              {student.seat_number || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="mentorreport-no-students">No students assigned yet.</p>
                )}
              </div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mentorreport-pagination">
                <button
                  className="mentorreport-page-btn"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  ← Previous
                </button>

                <div className="mentorreport-page-numbers">
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
                        className={`mentorreport-page-number ${
                          pagination.currentPage === pageNum ? "mentorreport-active-page" : ""
                        }`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="mentorreport-page-btn"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next →
                </button>
              </div>
            )}

            {/* Footer Summary */}
            <div className="mentorreport-footer">
              <div className="mentorreport-summary">
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

export default MentorReport;