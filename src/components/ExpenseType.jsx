import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/ExpenseManagement.css";

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

const ExpenseType = () => {
  const [branches, setBranches] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentExpenseId, setCurrentExpenseId] = useState(null);
  
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
    name: ""
  });

  // 📥 Fetch branches and expense types on load
  useEffect(() => {
    fetchBranches();
    fetchExpenseTypes();
  }, []);

  // Fetch expense types when page or search changes
  useEffect(() => {
    fetchExpenseTypes();
  }, [pagination.currentPage, pagination.pageSize, searchTerm]);

  const fetchBranches = async () => {
    try {
      const res = await api.get("/view_branches");
      setBranches(res.data.data || []);
    } catch (err) {
      console.error("Branch fetch error", err);
    }
  };

  const fetchExpenseTypes = async () => {
    try {
      setFetchLoading(true);
      
      let params = {
        page: pagination.currentPage,
        page_size: pagination.pageSize
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const res = await api.get("/view_expense_types", { params });
      
      let expenseData = res.data.data || [];
      
      // Client-side search filter if backend doesn't support search
      if (searchTerm && !res.data.total) {
        expenseData = expenseData.filter(expense => 
          expense.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.branch_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setExpenseTypes(expenseData);
      setPagination({
        currentPage: res.data.page || 1,
        pageSize: res.data.page_size || 10,
        total: res.data.total || expenseData.length,
        totalPages: res.data.total_pages || Math.ceil((res.data.total || expenseData.length) / (res.data.page_size || 10))
      });
      
    } catch (err) {
      console.error("Error fetching expense types", err);
      setMsg({ type: "error", text: "Failed to fetch expense types" });
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
    setCurrentExpenseId(null);
    setForm({
      branch_id: "",
      name: ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // ✏️ Open modal for Edit
  const openEditModal = (expense) => {
    setIsEditMode(true);
    setCurrentExpenseId(expense.id);
    setForm({
      branch_id: expense.branch || expense.branch_id || "",
      name: expense.name || ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // 🚀 Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentExpenseId(null);
    setForm({
      branch_id: "",
      name: ""
    });
    setMsg({ type: "", text: "" });
  };

  // 🚀 Submit form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!form.branch_id || !form.name) {
      return setMsg({ type: "error", text: "Branch and Expense Type Name are required" });
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name,
        branch_id: form.branch_id
      };

      if (isEditMode && currentExpenseId) {
        // Update existing expense type
        await api.put(`/update_expense_types/${currentExpenseId}`, payload);
        setMsg({ type: "success", text: "Expense type updated successfully ✅" });
        
        // Refresh expense types list
        await fetchExpenseTypes();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        // Create new expense type
        await api.post("/create_expense_types", payload);
        setMsg({ type: "success", text: "Expense type added successfully ✅" });
        
        // Reset form
        setForm({
          branch_id: "",
          name: ""
        });
        
        // Refresh expense types list
        await fetchExpenseTypes();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error saving expense type ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete expense type
  const handleDelete = async (expenseId, expenseName) => {
    if (!window.confirm(`Are you sure you want to delete expense type "${expenseName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/delete_expense_types/${expenseId}`);
      setMsg({ type: "success", text: "Expense type deleted successfully ✅" });
      await fetchExpenseTypes();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting expense type ❌";
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

  // Get icon for expense type
  const getExpenseIcon = (expenseName) => {
    const name = expenseName.toLowerCase();
    if (name.includes('salary') || name.includes('payroll')) return '💰';
    if (name.includes('rent')) return '🏢';
    if (name.includes('utility')) return '💡';
    if (name.includes('electricity')) return '⚡';
    if (name.includes('water')) return '💧';
    if (name.includes('internet') || name.includes('broadband')) return '🌐';
    if (name.includes('maintenance')) return '🔧';
    if (name.includes('supplies')) return '📦';
    if (name.includes('marketing') || name.includes('advertising')) return '📢';
    if (name.includes('travel')) return '✈️';
    if (name.includes('training')) return '📚';
    return '💸';
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
    <div className="EXpnsMG-management">
      {/* Header Section */}
      <div className="EXpnsMG-header">
        <div className="EXpnsMG-header-title">
          <h1>Expense Type Management</h1>
          <p>Manage expense categories, track spending, and organize financial records</p>
        </div>
        <button className="EXpnsMG-add-btn" onClick={openAddModal}>
          + Add New Expense Type
        </button>
      </div>

      {/* Message Alert */}
      {msg.text && (
        <div className={`EXpnsMG-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="EXpnsMG-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Stats Cards */}
      {/* <div className="EXpnsMG-stats">
        <div className="EXpnsMG-stat-card">
          <div className="EXpnsMG-stat-icon">📊</div>
          <div className="EXpnsMG-stat-info">
            <h4>Total Categories</h4>
            <p className="EXpnsMG-stat-count">{expenseTypes.length}</p>
          </div>
        </div>
        <div className="EXpnsMG-stat-card">
          <div className="EXpnsMG-stat-icon">🏢</div>
          <div className="EXpnsMG-stat-info">
            <h4>Branches</h4>
            <p className="EXpnsMG-stat-count">{branches.length}</p>
          </div>
        </div>
      </div> */}

      {/* Search Bar */}
      <div className="EXpnsMG-search-bar">
        <input
          type="text"
          placeholder="🔍 Search by expense type or branch..."
          value={searchTerm}
          onChange={handleSearch}
          className="EXpnsMG-search-input"
        />
      </div>

      {/* Expense Types List Table */}
      <div className="EXpnsMG-table-container">
        <div className="EXpnsMG-table-header">
          <h3>All Expense Types</h3>
          <span className="EXpnsMG-record-badge">
            Total: {pagination.total} expense type(s) | Page {pagination.currentPage} of {pagination.totalPages}
          </span>
        </div>
        
        {fetchLoading && expenseTypes.length === 0 ? (
          <div className="EXpnsMG-loading-state">
            <div className="EXpnsMG-spinner"></div>
            <p>Loading expense types...</p>
          </div>
        ) : expenseTypes.length === 0 ? (
          <div className="EXpnsMG-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <p>No expense types found. Click "Add New Expense Type" to get started.</p>
          </div>
        ) : (
          <>
            <div className="EXpnsMG-table-responsive">
              <table className="EXpnsMG-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Expense Type</th>
                    <th>Branch</th>
                    {/* <th>Expense ID</th> */}
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseTypes.map((expense, index) => (
                    <tr key={expense.id}>
                      <td className="EXpnsMG-sno">
                        {(pagination.currentPage - 1) * pagination.pageSize + index + 1}
                      </td>
                      <td className="EXpnsMG-name-cell">
                        <div className="EXpnsMG-name-wrapper">
                          <span className="EXpnsMG-icon">{getExpenseIcon(expense.name)}</span>
                          <strong>{expense.name}</strong>
                        </div>
                      </td>
                      <td className="EXpnsMG-branch-cell">
                        <span className="EXpnsMG-branch-badge">
                          {expense.branch_name || getBranchName(expense.branch)}
                        </span>
                      </td>
                      {/* <td className="EXpnsMG-id-cell">
                        <code className="EXpnsMG-id-code">{expense.id?.substring(0, 8)}...</code>
                      </td> */}
                      <td className="EXpnsMG-date-cell">
                        {expense.created_at ? new Date(expense.created_at).toLocaleDateString('en-IN') : "—"}
                      </td>
                      <td>
                        <div className="EXpnsMG-action-btns">
                          <button 
                            className="EXpnsMG-btn-edit" 
                            onClick={() => openEditModal(expense)}
                            title="Edit expense type"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="EXpnsMG-btn-delete" 
                            onClick={() => handleDelete(expense.id, expense.name)}
                            title="Delete expense type"
                          >
                            🗑️ Delete
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
              <div className="EXpnsMG-pagination">
                <button 
                  className="EXpnsMG-page-btn"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  ← Previous
                </button>
                
                <div className="EXpnsMG-page-numbers">
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
                        className={`EXpnsMG-page-number ${pagination.currentPage === pageNum ? "EXpnsMG-active-page" : ""}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  className="EXpnsMG-page-btn"
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
        <div className="EXpnsMG-modal-overlay" onClick={closeModal}>
          <div className="EXpnsMG-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="EXpnsMG-modal-header">
              <h2>{isEditMode ? "✏️ Edit Expense Type" : "➕ Add New Expense Type"}</h2>
              <button className="EXpnsMG-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="EXpnsMG-modal-form">
              <div className="EXpnsMG-form-row">
                <div className="EXpnsMG-form-group">
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
                </div>

                <div className="EXpnsMG-form-group">
                  <label>Expense Type Name <span className="required-star">*</span></label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g., Salary, Rent, Utilities, Supplies, Marketing"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <small className="EXpnsMG-field-hint">Enter a descriptive name for the expense category</small>
                </div>
              </div>

              {msg.text && (
                <div className={`EXpnsMG-form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="EXpnsMG-modal-actions">
                <button type="submit" className="EXpnsMG-btn-submit" disabled={loading}>
                  {loading ? "Saving..." : (isEditMode ? "Update Expense Type" : "Create Expense Type")}
                </button>
                <button type="button" className="EXpnsMG-btn-cancel" onClick={closeModal}>
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

export default ExpenseType;