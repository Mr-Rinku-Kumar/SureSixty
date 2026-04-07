import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/InvestManagement.css";

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

const InvestManagement = () => {
  const [branches, setBranches] = useState([]);
  const [invests, setInvests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentInvestId, setCurrentInvestId] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  
  const [form, setForm] = useState({
    branch_id: "",
    amount: "",
    remarks: ""
  });

  // 📥 Fetch branches and invests on load
  useEffect(() => {
    fetchBranches();
    fetchInvests();
  }, []);

  // Fetch invests when page or search changes
  useEffect(() => {
    fetchInvests();
  }, [pagination.currentPage, pagination.pageSize, searchTerm]);

  const fetchBranches = async () => {
    try {
      const res = await api.get("/view_branches"); // ✅ Updated endpoint to match ViewBranch
      setBranches(res.data.data || []);
    } catch (err) {
      console.error("Branch fetch error", err);
      setMsg({ type: "error", text: "Failed to fetch branches" });
    }
  };

  const fetchInvests = async () => {
    try {
      setFetchLoading(true);
      
      let params = {
        page: pagination.currentPage,
        page_size: pagination.pageSize
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const res = await api.get("/view_invests", { params });
      
      let investData = res.data.data || [];
      
      // Client-side search filter if backend doesn't support search
      if (searchTerm && !res.data.total) {
        investData = investData.filter(invest => 
          invest.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invest.amount?.toString().includes(searchTerm)
        );
      }
      
      setInvests(investData);
      setPagination({
        currentPage: res.data.page || 1,
        pageSize: res.data.page_size || 10,
        total: res.data.total || investData.length,
        totalPages: res.data.total_pages || Math.ceil((res.data.total || investData.length) / (res.data.page_size || 10))
      });
      
    } catch (err) {
      console.error("Error fetching invests", err);
      setMsg({ type: "error", text: "Failed to fetch investments" });
    } finally {
      setFetchLoading(false);
    }
  };

  // ✏️ Handle input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🚀 Open modal for Add
  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentInvestId(null);
    setForm({
      branch_id: "",
      amount: "",
      remarks: ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // ✏️ Open modal for Edit
  const openEditModal = (invest) => {
    setIsEditMode(true);
    setCurrentInvestId(invest.id);
    setForm({
      branch_id: invest.branch_id || "",
      amount: invest.amount || "",
      remarks: invest.remarks || ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // 🚀 Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentInvestId(null);
    setForm({
      branch_id: "",
      amount: "",
      remarks: ""
    });
    setMsg({ type: "", text: "" });
  };

  // 🚀 Submit form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!form.branch_id || !form.amount) {
      return setMsg({ type: "error", text: "Branch and Amount are required" });
    }

    if (parseFloat(form.amount) <= 0) {
      return setMsg({ type: "error", text: "Amount must be greater than 0" });
    }

    try {
      setLoading(true);

      const payload = {
        amount: parseFloat(form.amount),
        remarks: form.remarks || "",
        branch_id: form.branch_id
      };

      if (isEditMode && currentInvestId) {
        // Update existing investment
        await api.put(`/update_invests/${currentInvestId}`, payload);
        setMsg({ type: "success", text: "Investment updated successfully ✅" });
        
        // Refresh invests list
        await fetchInvests();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        // Create new investment
        await api.post("/create_invests", payload);
        setMsg({ type: "success", text: "Investment added successfully ✅" });
        
        // Reset form
        setForm({
          branch_id: "",
          amount: "",
          remarks: ""
        });
        
        // Refresh invests list
        await fetchInvests();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error saving investment ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete investment
  const handleDelete = async (investId, amount) => {
    if (!window.confirm(`Are you sure you want to delete investment of ₹${formatCurrency(amount)}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/delete_invests/${investId}`);
      setMsg({ type: "success", text: "Investment deleted successfully ✅" });
      await fetchInvests();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting investment ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Helper to get branch name by ID
  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? (branch.name || branch.branch_name) : "—";
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "—";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calculate total investment
  const getTotalInvestment = () => {
    return invests.reduce((total, invest) => total + (invest.amount || 0), 0);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, currentPage: newPage });
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination({ ...pagination, currentPage: 1 });
  };

  return (
    <div className="investMNG-management">
      {/* Header Section */}
      <div className="investMNG-header">
        <div className="investMNG-header-title">
          <h1>Investment Management</h1>
          <p>Track investments, manage capital, and monitor financial growth</p>
        </div>
        <button className="investMNG-add-btn" onClick={openAddModal}>
          + Add New Investment
        </button>
      </div>

      {/* Message Alert */}
      {msg.text && (
        <div className={`investMNG-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="investMNG-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="investMNG-search-bar">
        <input
          type="text"
          placeholder="🔍 Search by remarks or amount..."
          value={searchTerm}
          onChange={handleSearch}
          className="investMNG-search-input"
        />
      </div>

      {/* Invests List Table */}
      <div className="investMNG-table-container">
        <div className="investMNG-table-header">
          <h3>All Investments</h3>
          <span className="investMNG-record-badge">
            Total: {pagination.total} investment(s) | Page {pagination.currentPage} of {pagination.totalPages}
          </span>
        </div>
        
        {fetchLoading && invests.length === 0 ? (
          <div className="investMNG-loading-state">
            <div className="investMNG-spinner"></div>
            <p>Loading investments...</p>
          </div>
        ) : invests.length === 0 ? (
          <div className="investMNG-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <p>No investments found. Click "Add New Investment" to get started.</p>
          </div>
        ) : (
          <>
            <div className="investMNG-table-responsive">
              <table className="investMNG-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Amount</th>
                    <th>Remarks</th>
                    <th>Branch</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invests.map((invest, index) => (
                    <tr key={invest.id}>
                      <td className="investMNG-sno">
                        {(pagination.currentPage - 1) * pagination.pageSize + index + 1}
                      </td>
                      <td className="investMNG-amount-cell">
                        <span className="investMNG-amount-badge">
                          {formatCurrency(invest.amount)}
                        </span>
                      </td>
                      <td className="investMNG-remarks-cell">
                        {invest.remarks || "—"}
                      </td>
                      <td className="investMNG-branch-cell">
                        <span className="investMNG-branch-badge">
                          {invest.branch_name || getBranchName(invest.branch_id)}
                        </span>
                      </td>
                      <td className="investMNG-date-cell">
                        {formatDate(invest.created_at)}
                      </td>
                      <td>
                        <div className="investMNG-action-btns">
                          <button 
                            className="investMNG-btn-edit" 
                            onClick={() => openEditModal(invest)}
                            title="Edit investment"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="investMNG-btn-delete" 
                            onClick={() => handleDelete(invest.id, invest.amount)}
                            title="Delete investment"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="investMNG-total-row">
                    <td colSpan="1"><strong>Total</strong></td>
                    <td><strong>{formatCurrency(getTotalInvestment())}</strong></td>
                    <td colSpan="4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="investMNG-pagination">
                <button 
                  className="investMNG-page-btn"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  ← Previous
                </button>
                
                <div className="investMNG-page-numbers">
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
                        className={`investMNG-page-number ${pagination.currentPage === pageNum ? "investMNG-active-page" : ""}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  className="investMNG-page-btn"
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
        <div className="investMNG-modal-overlay" onClick={closeModal}>
          <div className="investMNG-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="investMNG-modal-header">
              <h2>{isEditMode ? "✏️ Edit Investment" : "➕ Add New Investment"}</h2>
              <button className="investMNG-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="investMNG-modal-form">
              <div className="investMNG-form-row">
                <div className="investMNG-form-group full-width">
                  <label>Branch <span className="required-star">*</span></label>
                  <select
                    name="branch_id"
                    value={form.branch_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id || branch.branch_id} value={branch.id || branch.branch_id}>
                        {branch.name || branch.branch_name}
                      </option>
                    ))}
                  </select>
                  <small className="investMNG-field-hint">Select the branch for this investment</small>
                </div>
              </div>

              <div className="investMNG-form-row">
                <div className="investMNG-form-group">
                  <label>Amount (₹) <span className="required-star">*</span></label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="Enter amount"
                    value={form.amount}
                    onChange={handleChange}
                    required
                    min="1"
                    step="1"
                  />
                  <small className="investMNG-field-hint">Enter positive amount only</small>
                </div>

                <div className="investMNG-form-group">
                  <label>Remarks</label>
                  <textarea
                    name="remarks"
                    placeholder="Enter remarks or description (optional)"
                    value={form.remarks}
                    onChange={handleChange}
                    rows="3"
                  />
                  <small className="investMNG-field-hint">Add any notes about this investment</small>
                </div>
              </div>

              {msg.text && (
                <div className={`investMNG-form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="investMNG-modal-actions">
                <button type="submit" className="investMNG-btn-submit" disabled={loading}>
                  {loading ? "Saving..." : (isEditMode ? "Update Investment" : "Create Investment")}
                </button>
                <button type="button" className="investMNG-btn-cancel" onClick={closeModal}>
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

export default InvestManagement;