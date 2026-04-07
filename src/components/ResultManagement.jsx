import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import "../styles/ResultManagement.css";

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
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const ResultManagement = () => {
  // State for dropdown data
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  
  // State for results
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentResultId, setCurrentResultId] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState("all"); // all, toppers
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  
  // Bulk upload state
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadErrors, setUploadErrors] = useState([]);
  const fileInputRef = useRef(null);
  
  // Form state for single result
  const [form, setForm] = useState({
    student_id: "",
    date: "",
    exam_marks: ""
  });
  
  // Update form state
  const [updateForm, setUpdateForm] = useState({
    exam_marks: "",
    exam_date: ""
  });

  // 📥 Fetch dropdown data on load
  useEffect(() => {
    fetchActiveStudents();
    fetchBranches();
  }, []);

  // Fetch results when page, filter, or search changes
  useEffect(() => {
    fetchResults();
  }, [pagination.currentPage, pagination.pageSize, activeFilter, searchTerm, dateFilter, monthFilter, branchFilter]);

  // Fetch only active students (status = 0)
  const fetchActiveStudents = async () => {
    try {
      console.log("Fetching active students...");
      const res = await api.get("/running_students", {
        //params: { status: 0, page_size: 1000 } // Fetch up to 1000 active students
      });
      console.log("Students fetched:", res.data);
      
      // Extract students from response
      let studentData = res.data.students || res.data.data || [];
      setStudents(studentData);
    } catch (err) {
      console.error("Student fetch error", err);
      setMsg({ type: "error", text: "Failed to fetch students list" });
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get("/view_branches");
      setBranches(res.data.data || []);
    } catch (err) {
      console.error("Branch fetch error", err);
    }
  };

  const fetchResults = async () => {
    try {
      setFetchLoading(true);
      
      // Build query parameters
      let params = {
        page: pagination.currentPage,
        page_size: pagination.pageSize
      };
      
      // Add filters
      if (searchTerm) {
        params.student_id = searchTerm;
      }
      
      if (dateFilter) {
        params.date = dateFilter;
      }
      
      if (monthFilter) {
        params.month = monthFilter;
      }
      
      if (branchFilter) {
        params.branch_id = branchFilter;
      }
      
      if (activeFilter === "toppers") {
        params.toppers = true;
      }
      
      console.log("Fetching results with params:", params);
      
      const res = await api.get("/view_results", { params });
      
      console.log("API Response:", res.data);
      
      let resultData = res.data.data || [];
      
      setResults(resultData);
      setPagination({
        currentPage: res.data.page || 1,
        pageSize: res.data.page_size || 10,
        total: res.data.total || resultData.length,
        totalPages: res.data.total_pages || Math.ceil((res.data.total || resultData.length) / (res.data.page_size || 10))
      });
      
    } catch (err) {
      console.error("Error fetching results", err);
      setMsg({ type: "error", text: "Failed to fetch results" });
    } finally {
      setFetchLoading(false);
    }
  };

  // ✏️ Handle input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdateChange = (e) => {
    setUpdateForm({ ...updateForm, [e.target.name]: e.target.value });
  };

  // 🚀 Open modal for Add
  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentResultId(null);
    setForm({
      student_id: "",
      date: new Date().toISOString().slice(0, 10),
      exam_marks: ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // ✏️ Open modal for Edit
  const openEditModal = (result) => {
    setIsEditMode(true);
    setCurrentResultId(result.exam_number);
    setUpdateForm({
      exam_marks: result.exam_marks,
      exam_date: result.date
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // 🚀 Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentResultId(null);
    setForm({
      student_id: "",
      date: new Date().toISOString().slice(0, 10),
      exam_marks: ""
    });
    setUpdateForm({
      exam_marks: "",
      exam_date: ""
    });
    setMsg({ type: "", text: "" });
  };

  // 🚀 Submit form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (isEditMode) {
      // Update existing result
      if (!updateForm.exam_marks && !updateForm.exam_date) {
        return setMsg({ type: "error", text: "At least one field (marks or date) is required for update" });
      }
      
      const payload = {};
      if (updateForm.exam_marks) payload.exam_marks = parseFloat(updateForm.exam_marks);
      if (updateForm.exam_date) payload.exam_date = updateForm.exam_date;
      
      try {
        setLoading(true);
        await api.put(`/update_result/${currentResultId}`, payload);
        setMsg({ type: "success", text: "Result updated successfully ✅" });
        
        await fetchResults();
        
        setTimeout(() => {
          closeModal();
        }, 1500);
      } catch (err) {
        console.error(err);
        const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error updating result ❌";
        setMsg({ type: "error", text: errorMsg });
      } finally {
        setLoading(false);
      }
    } else {
      // Create new result
      if (!form.student_id || !form.date || !form.exam_marks) {
        return setMsg({ type: "error", text: "Student, Date, and Marks are required" });
      }
      
      const marksNum = parseFloat(form.exam_marks);
      if (isNaN(marksNum) || marksNum < 0) {
        return setMsg({ type: "error", text: "Marks must be a number >= 0" });
      }
      
      try {
        setLoading(true);
        await api.post("/create_single_result", {
          student_id: form.student_id,
          date: form.date,
          exam_marks: marksNum
        });
        setMsg({ type: "success", text: "Result added successfully ✅" });
        
        await fetchResults();
        
        setTimeout(() => {
          closeModal();
        }, 1500);
      } catch (err) {
        console.error(err);
        const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error adding result ❌";
        setMsg({ type: "error", text: errorMsg });
      } finally {
        setLoading(false);
      }
    }
  };

  // 🗑️ Delete result
  const handleDelete = async (resultId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete result for "${studentName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/delete_result?result_id=${resultId}`);
      setMsg({ type: "success", text: "Result deleted successfully ✅" });
      await fetchResults();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting result ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };
  
  // 🗑️ Delete all results by date
  const handleDeleteByDate = async (date) => {
    if (!window.confirm(`Are you sure you want to delete ALL results for ${date}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      const res = await api.delete(`/delete_result?date=${date}`);
      setMsg({ type: "success", text: res.data.message || "Results deleted successfully ✅" });
      await fetchResults();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting results ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // 📂 Bulk upload handler
  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    setUploadStatus("Uploading...");
    setUploadErrors([]);
    
    try {
      const res = await api.post("/create_bulk_results", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setUploadStatus(`✅ Upload complete. Created: ${res.data.created}, Updated: ${res.data.updated}, Errors: ${res.data.error_count}`);
      setUploadErrors(res.data.errors || []);
      await fetchResults();
      
      setTimeout(() => {
        setUploadStatus(null);
      }, 5000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Bulk upload failed ❌";
      setUploadStatus(`❌ ${errorMsg}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 📥 Download template
  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/download_bulk_results_template", {
        responseType: "blob"
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "results_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setMsg({ type: "success", text: "Template downloaded successfully ✅" });
      setTimeout(() => setMsg({ type: "", text: "" }), 2000);
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Failed to download template ❌" });
    }
  };

  // Get student name by ID (for display in results table)
  const getStudentName = (studentId) => {
    const student = students.find(s => s.student_id === studentId);
    return student ? student.name : studentId || "—";
  };

  // Get branch name by ID
  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? (branch.name || branch.branch_name) : branchId || "—";
  };

  // Get rank badge style
  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="resultMNG-rank-badge resultMNG-rank-1">🥇 #{rank}</span>;
    if (rank === 2) return <span className="resultMNG-rank-badge resultMNG-rank-2">🥈 #{rank}</span>;
    if (rank === 3) return <span className="resultMNG-rank-badge resultMNG-rank-3">🥉 #{rank}</span>;
    return <span className="resultMNG-rank-badge resultMNG-rank-other">#{rank}</span>;
  };

  // Get marks badge
  const getMarksBadge = (marks) => {
    if (marks >= 90) return <span className="resultMNG-marks-badge resultMNG-marks-excellent">{marks}</span>;
    if (marks >= 75) return <span className="resultMNG-marks-badge resultMNG-marks-good">{marks}</span>;
    if (marks >= 60) return <span className="resultMNG-marks-badge resultMNG-marks-average">{marks}</span>;
    if (marks >= 40) return <span className="resultMNG-marks-badge resultMNG-marks-pass">{marks}</span>;
    return <span className="resultMNG-marks-badge resultMNG-marks-fail">{marks}</span>;
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, currentPage: newPage });
    }
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setPagination({ ...pagination, currentPage: 1 });
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination({ ...pagination, currentPage: 1 });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setMonthFilter("");
    setBranchFilter("");
    setActiveFilter("all");
    setPagination({ ...pagination, currentPage: 1 });
  };

  // Get count text for filters
  const getFilterCount = () => {
    if (activeFilter === "toppers") return "Top Performers";
    return "All Results";
  };

  return (
    <div className="resultMNG-management">
      {/* Header Section */}
      <div className="resultMNG-header">
        <div className="resultMNG-header-title">
          <h1>Result Management</h1>
          <p>Manage exam results, track performance, and analyze student progress</p>
        </div>
        <div className="resultMNG-header-buttons">
          <button className="resultMNG-bulk-btn" onClick={() => document.getElementById("bulkFileInput").click()}>
            📤 Bulk Upload
          </button>
          <button className="resultMNG-add-btn" onClick={openAddModal}>
            + Add New Result
          </button>
        </div>
      </div>

      {/* Hidden file input for bulk upload */}
      <input
        type="file"
        id="bulkFileInput"
        ref={fileInputRef}
        accept=".xlsx, .xls"
        style={{ display: "none" }}
        onChange={handleBulkUpload}
      />

      {/* Message Alert */}
      {msg.text && (
        <div className={`resultMNG-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="resultMNG-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Upload Status */}
      {uploadStatus && (
        <div className={`resultMNG-upload-status ${uploadStatus.includes("✅") ? "success" : "error"}`}>
          <span>{uploadStatus}</span>
          {uploadErrors.length > 0 && (
            <div className="resultMNG-upload-errors">
              <strong>Errors:</strong>
              <ul>
                {uploadErrors.slice(0, 5).map((err, idx) => (
                  <li key={idx}>Row {err.row}: {err.student_id} - {err.reason}</li>
                ))}
                {uploadErrors.length > 5 && <li>...and {uploadErrors.length - 5} more errors</li>}
              </ul>
            </div>
          )}
          <button className="resultMNG-close-alert" onClick={() => setUploadStatus(null)}>×</button>
        </div>
      )}

      {/* Download Template Button */}
      <div className="resultMNG-template-bar">
        <button className="resultMNG-template-btn" onClick={handleDownloadTemplate}>
          📎 Download Excel Template
        </button>
        <span className="resultMNG-template-hint">Use this template for bulk upload</span>
      </div>

      {/* Search and Filters Bar */}
      <div className="resultMNG-search-bar">
        <input
          type="text"
          placeholder="🔍 Search by Student ID..."
          value={searchTerm}
          onChange={handleSearch}
          className="resultMNG-search-input"
        />
        <input
          type="date"
          placeholder="Filter by Date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="resultMNG-filter-input"
        />
        <input
          type="month"
          placeholder="Filter by Month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="resultMNG-filter-input"
        />
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="resultMNG-filter-select"
        >
          <option value="">All Branches</option>
          {branches.map((branch) => (
            <option key={branch.id || branch.branch_id} value={branch.id || branch.branch_id}>
              {branch.name || branch.branch_name}
            </option>
          ))}
        </select>
        <button className="resultMNG-clear-btn" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="resultMNG-filter-tabs">
        <button 
          className={`resultMNG-filter-tab ${activeFilter === "all" ? "resultMNG-active" : ""}`}
          onClick={() => handleFilterChange("all")}
        >
          📊 {getFilterCount()}
        </button>
        <button 
          className={`resultMNG-filter-tab ${activeFilter === "toppers" ? "resultMNG-active" : ""}`}
          onClick={() => handleFilterChange("toppers")}
        >
          🏆 Toppers Mode
        </button>
      </div>

      {/* Results List Table */}
      <div className="resultMNG-table-container">
        <div className="resultMNG-table-header">
          <h3>Results List - {getFilterCount()}</h3>
          <span className="resultMNG-record-badge">
            Total: {pagination.total} result(s) | Page {pagination.currentPage} of {pagination.totalPages}
          </span>
        </div>
        
        {fetchLoading ? (
          <div className="resultMNG-loading-state">
            <div className="resultMNG-spinner"></div>
            <p>Loading results...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="resultMNG-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No results found.</p>
            {(searchTerm || dateFilter || monthFilter || branchFilter) && <p>Try adjusting your search criteria or clear filters.</p>}
          </div>
        ) : (
          <>
            <div className="resultMNG-table-responsive">
              <table className="resultMNG-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Exam Number</th>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Branch</th>
                    <th>Exam Date</th>
                    <th>Marks</th>
                    <th>Rank</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={result.exam_number}>
                      <td className="resultMNG-sno">
                        {(pagination.currentPage - 1) * pagination.pageSize + index + 1}
                       </td>
                      <td className="resultMNG-id-cell">
                        <code className="resultMNG-id-code">#{result.exam_number}</code>
                       </td>
                      <td className="resultMNG-student-id">
                        {result.student_id}
                       </td>
                      <td className="resultMNG-name-cell">
                        <div className="resultMNG-name-wrapper">
                          <span className="resultMNG-icon">👨‍🎓</span>
                          <div>
                            <strong>{result.student_name}</strong>
                          </div>
                        </div>
                       </td>
                      <td className="resultMNG-branch-cell">
                        <span className="resultMNG-branch-badge">
                          {result.branch_name}
                        </span>
                       </td>
                      <td className="resultMNG-date-cell">
                        {result.date}
                       </td>
                      <td className="resultMNG-marks-cell">
                        {getMarksBadge(result.exam_marks)}
                       </td>
                      <td className="resultMNG-rank-cell">
                        {getRankBadge(result.rank)}
                       </td>
                      <td>
                        <div className="resultMNG-action-btns">
                          <button 
                            className="resultMNG-btn-edit" 
                            onClick={() => openEditModal(result)}
                            title="Edit result"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="resultMNG-btn-delete" 
                            onClick={() => handleDelete(result.exam_number, result.student_name)}
                            title="Delete result"
                          >
                            🗑️ Delete
                          </button>
                          <button 
                            className="resultMNG-btn-delete-date" 
                            onClick={() => handleDeleteByDate(result.date)}
                            title="Delete all results on this date"
                          >
                            📅 Del All
                          </button>
                        </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="resultMNG-pagination">
                <button 
                  className="resultMNG-page-btn"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  ← Previous
                </button>
                
                <div className="resultMNG-page-numbers">
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
                        className={`resultMNG-page-number ${pagination.currentPage === pageNum ? "resultMNG-active-page" : ""}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  className="resultMNG-page-btn"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Popup for Add/Edit */}
      {showModal && (
        <div className="resultMNG-modal-overlay" onClick={closeModal}>
          <div className="resultMNG-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="resultMNG-modal-header">
              <h2>{isEditMode ? "✏️ Edit Result" : "➕ Add New Result"}</h2>
              <button className="resultMNG-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="resultMNG-modal-form">
              {!isEditMode ? (
                <>
                  <div className="resultMNG-form-group">
                    <label>Select Student *</label>
                    <select 
                      name="student_id" 
                      value={form.student_id} 
                      onChange={handleChange} 
                      required
                      className="resultMNG-student-select"
                    >
                      <option value="">-- Select a student --</option>
                      {students.length === 0 ? (
                        <option value="" disabled>Loading students...</option>
                      ) : (
                        students.map((student) => (
                          <option key={student.id || student.student_id} value={student.student_id}>
                            {student.name} ({student.student_id})
                          </option>
                        ))
                      )}
                    </select>
                    {students.length === 0 && (
                      <small className="resultMNG-field-hint">No active students found. Please check student records.</small>
                    )}
                  </div>

                  <div className="resultMNG-form-group">
                    <label>Exam Date *</label>
                    <input 
                      type="date" 
                      name="date" 
                      value={form.date} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>

                  <div className="resultMNG-form-group">
                    <label>Marks Obtained *</label>
                    <input 
                      type="number" 
                      name="exam_marks" 
                      placeholder="Enter marks (0-100)" 
                      step="0.01"
                      min="0"
                      max="100"
                      value={form.exam_marks} 
                      onChange={handleChange} 
                      required 
                    />
                    <small className="resultMNG-field-hint">Maximum 2 decimal places, between 0 and 100</small>
                  </div>
                </>
              ) : (
                <>
                  <div className="resultMNG-form-group">
                    <label>New Marks (optional)</label>
                    <input 
                      type="number" 
                      name="exam_marks" 
                      placeholder="Leave empty to keep current" 
                      step="0.01"
                      min="0"
                      max="100"
                      value={updateForm.exam_marks} 
                      onChange={handleUpdateChange} 
                    />
                  </div>

                  <div className="resultMNG-form-group">
                    <label>New Exam Date (optional)</label>
                    <input 
                      type="date" 
                      name="exam_date" 
                      value={updateForm.exam_date} 
                      onChange={handleUpdateChange} 
                    />
                  </div>
                </>
              )}

              {msg.text && (
                <div className={`resultMNG-form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="resultMNG-modal-actions">
                <button type="submit" className="resultMNG-btn-submit" disabled={loading}>
                  {loading ? "Saving..." : (isEditMode ? "Update Result" : "Create Result")}
                </button>
                <button type="button" className="resultMNG-btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultManagement;