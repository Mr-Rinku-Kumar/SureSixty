import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../styles/DueReports.css";

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
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const DueReports = () => {
  // State for branches
  const [DueReportsbranches, setDueReportsbranches] = useState([]);
  
  // State for fees types
  const [DueReportsfeesTypes, setDueReportsfeesTypes] = useState([
    { id: 0, name: "Monthly" },
    { id: 1, name: "Yearly" },
    { id: 2, name: "Quarterly" },
    { id: 3, name: "6 Months" }
  ]);
  
  // State for due data
  const [DueReportsdata, setDueReportsdata] = useState([]);
  const [DueReportsloading, setDueReportsloading] = useState(false);
  const [DueReportserror, setDueReportserror] = useState(null);
  
  // Pagination state
  const [DueReportspagination, setDueReportspagination] = useState({
    currentPage: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  
  // Filter state
  const [DueReportsfilters, setDueReportsfilters] = useState({
    student_id: "",
    fees_type: "",
    branch_id: "",
    searchTerm: ""
  });
  
  // Export loading state
  const [DueReportsexporting, setDueReportsexporting] = useState(false);

  // Fetch branches on load
  useEffect(() => {
    DueReportsfetchBranches();
  }, []);

  // Fetch due reports when filters or pagination change
  useEffect(() => {
    DueReportsfetchDueReports();
  }, [DueReportspagination.currentPage, DueReportspagination.pageSize, DueReportsfilters]);

  const DueReportsfetchBranches = async () => {
    try {
      const res = await api.get("/view_branches");
      setDueReportsbranches(res.data.data || []);
    } catch (err) {
      console.error("Branch fetch error", err);
    }
  };

  const DueReportsfetchDueReports = async () => {
    try {
      setDueReportsloading(true);
      setDueReportserror(null);
      
      // Build query parameters
      let params = {
        page: DueReportspagination.currentPage,
        page_size: DueReportspagination.pageSize
      };
      
      // Add filters
      if (DueReportsfilters.student_id) {
        params.student_id = DueReportsfilters.student_id;
      }
      
      if (DueReportsfilters.fees_type !== "") {
        params.fees_type = DueReportsfilters.fees_type;
      }
      
      if (DueReportsfilters.branch_id) {
        params.branch_id = DueReportsfilters.branch_id;
      }
      
      console.log("Fetching due reports with params:", params);
      
      const res = await api.get("/view_due_report", { params });
      
      console.log("Due reports response:", res.data);
      
      let reportData = res.data.data || [];
      
      // Apply search filter locally if searchTerm exists
      if (DueReportsfilters.searchTerm) {
        const searchLower = DueReportsfilters.searchTerm.toLowerCase();
        reportData = reportData.filter(item => 
          item.student_name?.toLowerCase().includes(searchLower) ||
          item.student_id?.toLowerCase().includes(searchLower) ||
          item.branch_name?.toLowerCase().includes(searchLower) ||
          item.course_name?.toLowerCase().includes(searchLower)
        );
      }
      
      setDueReportsdata(reportData);
      setDueReportspagination({
        currentPage: res.data.page || 1,
        pageSize: res.data.page_size || 10,
        total: res.data.total || reportData.length,
        totalPages: res.data.total_pages || Math.ceil((res.data.total || reportData.length) / (res.data.page_size || 10))
      });
      
    } catch (err) {
      console.error("Error fetching due reports", err);
      setDueReportserror(err.response?.data?.message || "Failed to fetch due reports");
    } finally {
      setDueReportsloading(false);
    }
  };

  // Handle filter change
  const DueReportshandleFilterChange = (e) => {
    const { name, value } = e.target;
    setDueReportsfilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset to first page when filter changes
    setDueReportspagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  // Handle search input
  const DueReportshandleSearchChange = (e) => {
    setDueReportsfilters(prev => ({
      ...prev,
      searchTerm: e.target.value
    }));
    setDueReportspagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  // Clear all filters
  const DueReportsclearFilters = () => {
    setDueReportsfilters({
      student_id: "",
      fees_type: "",
      branch_id: "",
      searchTerm: ""
    });
    setDueReportspagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  // Handle page change
  const DueReportshandlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= DueReportspagination.totalPages) {
      setDueReportspagination(prev => ({
        ...prev,
        currentPage: newPage
      }));
    }
  };

  // Export to Excel
  const DueReportsexportToExcel = async () => {
    try {
      setDueReportsexporting(true);
      
      // Build query parameters for export (get all data)
      let params = {};
      
      if (DueReportsfilters.student_id) {
        params.student_id = DueReportsfilters.student_id;
      }
      
      if (DueReportsfilters.fees_type !== "") {
        params.fees_type = DueReportsfilters.fees_type;
      }
      
      if (DueReportsfilters.branch_id) {
        params.branch_id = DueReportsfilters.branch_id;
      }
      
      // Fetch all data for export
      const res = await api.get("/view_due_report", { 
        params: { ...params, page_size: 10000 }
      });
      
      let exportData = res.data.data || [];
      
      // Apply search filter
      if (DueReportsfilters.searchTerm) {
        const searchLower = DueReportsfilters.searchTerm.toLowerCase();
        exportData = exportData.filter(item => 
          item.student_name?.toLowerCase().includes(searchLower) ||
          item.student_id?.toLowerCase().includes(searchLower) ||
          item.branch_name?.toLowerCase().includes(searchLower) ||
          item.course_name?.toLowerCase().includes(searchLower)
        );
      }
      
      // Convert to CSV
      const headers = [
        "SL No", "Branch Name", "Branch ID", "Student Name", "Student ID",
        "Due Amount", "Due Date", "Course Name", "Course Fee",
        "Room No", "Bed No", "Library", "Seat No", "Fees Type"
      ];
      
      const csvRows = [headers];
      
      exportData.forEach((item, index) => {
        csvRows.push([
          index + 1,
          item.branch_name || "",
          item.branch_id || "",
          item.student_name || "",
          item.student_id || "",
          item.due_amount || 0,
          item.due_date || "",
          item.course_name || "",
          item.course_fee || "",
          item.room_no || "",
          item.bed_no || "",
          item.library || "",
          item.seat_no || "",
          item.fees_type_name || ""
        ]);
      });
      
      const csvContent = csvRows.map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `due_report_${new Date().toISOString().slice(0, 19)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Export error:", err);
      setDueReportserror("Failed to export data");
    } finally {
      setDueReportsexporting(false);
    }
  };

  // Calculate total due amount
  const DueReportstotalDue = DueReportsdata.reduce((sum, item) => sum + (item.due_amount || 0), 0);

  // Get fees type name
  const DueReportsgetFeesTypeName = (typeId) => {
    const type = DueReportsfeesTypes.find(t => t.id === parseInt(typeId));
    return type ? type.name : "All Types";
  };

  // Format currency
  const DueReportsformatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  return (
    <div className="DueReports-container">
      <div className="DueReports-page-header">
        <h1>Due Reports</h1>
        <p>Track and manage student dues efficiently</p>
      </div>

      {/* Error Message */}
      {DueReportserror && (
        <div className="DueReports-error-alert">
          <span>{DueReportserror}</span>
          <button className="DueReports-close-alert" onClick={() => setDueReportserror(null)}>×</button>
        </div>
      )}

      {/* Main Report Card */}
      <div className="DueReports-card">
        {/* Header */}
        <div className="DueReports-header">
          <div className="DueReports-header-left">
            <h3>Due Report</h3>
            <span className="DueReports-subtitle">Student dues overview with filters</span>
          </div>
          <div className="DueReports-header-stats">
            <div className="DueReports-stat-badge">
              <span className="DueReports-stat-label">Total Due:</span>
              <span className={`DueReports-stat-value ${DueReportstotalDue < 0 ? 'negative' : 'positive'}`}>
                {DueReportsformatCurrency(DueReportstotalDue)}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="DueReports-filters">
          <div className="DueReports-filter-group">
            <label>Student ID</label>
            <input
              type="text"
              name="student_id"
              placeholder="Enter student ID..."
              value={DueReportsfilters.student_id}
              onChange={DueReportshandleFilterChange}
              className="DueReports-filter-input"
            />
          </div>

          <div className="DueReports-filter-group">
            <label>Fees Type</label>
            <select
              name="fees_type"
              value={DueReportsfilters.fees_type}
              onChange={DueReportshandleFilterChange}
              className="DueReports-filter-select"
            >
              <option value="">All Types</option>
              {DueReportsfeesTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div className="DueReports-filter-group">
            <label>Branch</label>
            <select
              name="branch_id"
              value={DueReportsfilters.branch_id}
              onChange={DueReportshandleFilterChange}
              className="DueReports-filter-select"
            >
              <option value="">All Branches</option>
              {DueReportsbranches.map(branch => (
                <option key={branch.id || branch.branch_id} value={branch.id || branch.branch_id}>
                  {branch.name || branch.branch_name}
                </option>
              ))}
            </select>
          </div>

          <div className="DueReports-filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by name, ID, branch..."
              value={DueReportsfilters.searchTerm}
              onChange={DueReportshandleSearchChange}
              className="DueReports-search-input"
            />
          </div>

          <div className="DueReports-filter-actions">
            <button 
              className="DueReports-search-btn" 
              onClick={DueReportsfetchDueReports}
              disabled={DueReportsloading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Search
            </button>

            <button 
              className="DueReports-clear-btn" 
              onClick={DueReportsclearFilters}
            >
              Clear
            </button>

            <button 
              className="DueReports-excel-btn" 
              onClick={DueReportsexportToExcel}
              disabled={DueReportsexporting}
              title="Export to Excel"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="8" y1="16" x2="16" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
                <line x1="8" y1="8" x2="12" y2="8"/>
              </svg>
              {DueReportsexporting ? "Exporting..." : "Export"}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="DueReports-table-container">
          {DueReportsloading ? (
            <div className="DueReports-loading-state">
              <div className="DueReports-spinner"></div>
              <p>Loading due reports...</p>
            </div>
          ) : DueReportsdata.length === 0 ? (
            <div className="DueReports-empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p>No due records found</p>
              <p className="DueReports-empty-hint">Try adjusting your filters or search criteria</p>
            </div>
          ) : (
            <>
              <div className="DueReports-table-responsive">
                <table className="DueReports-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Branch</th>
                      <th>Student Name</th>
                      <th>Student ID</th>
                      <th>Due Amount</th>
                      <th>Due Date</th>
                      <th>Course</th>
                      <th>Course Fee</th>
                      <th>Room No</th>
                      <th>Bed No</th>
                      <th>Library</th>
                      <th>Seat No</th>
                      <th>Fees Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DueReportsdata.map((item, index) => (
                      <tr key={item.sl_no || index} className="DueReports-table-row">
                        <td className="DueReports-sl-no">
                          {(DueReportspagination.currentPage - 1) * DueReportspagination.pageSize + index + 1}
                        </td>
                        <td>{item.branch_name || "—"}</td>
                        <td className="DueReports-student-name">
                          <div className="DueReports-name-wrapper">
                            <span className="DueReports-icon">👨‍🎓</span>
                            <strong>{item.student_name || "—"}</strong>
                          </div>
                        </td>
                        <td className="DueReports-student-id">
                          <code>{item.student_id || "—"}</code>
                        </td>
                        <td className={`DueReports-amount ${(item.due_amount || 0) < 0 ? "negative" : "positive"}`}>
                          <span className="DueReports-currency">₹</span> 
                          {DueReportsformatCurrency(item.due_amount || 0)}
                          {(item.due_amount || 0) < 0 && <span className="DueReports-badge">Credit</span>}
                        </td>
                        <td className="DueReports-date-cell">
                          {item.due_date ? new Date(item.due_date).toLocaleDateString('en-IN') : "—"}
                        </td>
                        <td>{item.course_name || "—"}</td>
                        <td className="DueReports-course-fee">
                          ₹ {DueReportsformatCurrency(item.course_fee || 0)}
                        </td>
                        <td>{item.room_no || "—"}</td>
                        <td>{item.bed_no || "—"}</td>
                        <td>{item.library || "—"}</td>
                        <td>{item.seat_no || "—"}</td>
                        <td>
                          <span className="DueReports-fees-badge">
                            {item.fees_type_name || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer with Pagination */}
              <div className="DueReports-table-footer">
                <div className="DueReports-pagination">
                  <button 
                    className="DueReports-page-btn"
                    onClick={() => DueReportshandlePageChange(DueReportspagination.currentPage - 1)}
                    disabled={DueReportspagination.currentPage === 1 || DueReportsloading}
                  >
                    ← Previous
                  </button>
                  
                  <div className="DueReports-page-numbers">
                    {[...Array(Math.min(5, DueReportspagination.totalPages))].map((_, i) => {
                      let pageNum;
                      if (DueReportspagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (DueReportspagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (DueReportspagination.currentPage >= DueReportspagination.totalPages - 2) {
                        pageNum = DueReportspagination.totalPages - 4 + i;
                      } else {
                        pageNum = DueReportspagination.currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          className={`DueReports-page-number ${DueReportspagination.currentPage === pageNum ? "DueReports-active-page" : ""}`}
                          onClick={() => DueReportshandlePageChange(pageNum)}
                          disabled={DueReportsloading}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button 
                    className="DueReports-page-btn"
                    onClick={() => DueReportshandlePageChange(DueReportspagination.currentPage + 1)}
                    disabled={DueReportspagination.currentPage === DueReportspagination.totalPages || DueReportsloading}
                  >
                    Next →
                  </button>
                </div>
                
                <div className="DueReports-records-info">
                  Showing {DueReportsdata.length} of {DueReportspagination.total} records
                  {DueReportsfilters.fees_type !== "" && (
                    <span className="DueReports-active-filter">
                      Filter: {DueReportsgetFeesTypeName(DueReportsfilters.fees_type)}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DueReports;