import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/ViewExpense.css";

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

const ViewExpense = () => {
  const [branches, setBranches] = useState([]);
  const [expenseHeads, setExpenseHeads] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentExpenseId, setCurrentExpenseId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterExpenseHead, setFilterExpenseHead] = useState("");
  
  const [form, setForm] = useState({
    branch_id: "",
    expense_head_id: "",
    amount: "",
    remarks: "",
    document_path: ""
  });

  // 📥 Fetch branches, expense heads, and expenses on load
  useEffect(() => {
    fetchBranches();
    fetchExpenseHeads();
    fetchExpenses();
  }, []);

  // Fetch expenses when page, search, or filters change
  useEffect(() => {
    fetchExpenses();
  }, [pagination.currentPage, pagination.pageSize, searchTerm, filterBranch, filterExpenseHead]);

  const fetchBranches = async () => {
    try {
      const res = await api.get("/view_branches");
      setBranches(res.data.data || []);
    } catch (err) {
      console.error("Branch fetch error", err);
    }
  };

  const fetchExpenseHeads = async () => {
    try {
      const res = await api.get("/view_expense_heads");
      setExpenseHeads(res.data.data || []);
    } catch (err) {
      console.error("Expense head fetch error", err);
    }
  };

  const fetchExpenses = async () => {
    try {
      setFetchLoading(true);
      
      let params = {
        page: pagination.currentPage,
        page_size: pagination.pageSize
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      if (filterBranch) {
        params.branch_id = filterBranch;
      }
      const res = await api.get("/view_expenses", { params });
      
      let expenseData = res.data.data || [];
      
      setExpenses(expenseData);
      setPagination({
        currentPage: res.data.page || 1,
        pageSize: res.data.page_size || 10,
        total: res.data.total || expenseData.length,
        totalPages: res.data.total_pages || Math.ceil((res.data.total || expenseData.length) / (res.data.page_size || 10))
      });
      
    } catch (err) {
      console.error("Error fetching expenses", err);
      setMsg({ type: "error", text: "Failed to fetch expenses" });
    } finally {
      setFetchLoading(false);
    }
  };

  // ✏️ Handle input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 🚀 Open modal for Add
  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentExpenseId(null);
    setSelectedFile(null);
    setPreviewUrl("");
    setForm({
      branch_id: "",
      expense_head_id: "",
      amount: "",
      remarks: "",
      document_path: ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // ✏️ Open modal for Edit
  const openEditModal = (expense) => {
    setIsEditMode(true);
    setCurrentExpenseId(expense.id);
    setSelectedFile(null);
    setPreviewUrl(expense.document_path || "");
    setForm({
      branch_id: expense.branch || expense.branch_id || "",
      expense_head_id: expense.expense_head_id || "",
      amount: expense.amount || "",
      remarks: expense.remarks || "",
      document_path: expense.document_path || ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // 🚀 Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentExpenseId(null);
    setSelectedFile(null);
    setPreviewUrl("");
    setForm({
      branch_id: "",
      expense_head_id: "",
      amount: "",
      remarks: "",
      document_path: ""
    });
    setMsg({ type: "", text: "" });
  };

  // 🚀 Submit form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!form.branch_id || !form.expense_head_id || !form.amount) {
      return setMsg({ type: "error", text: "Branch, Expense Head, and Amount are required" });
    }

    if (parseFloat(form.amount) <= 0) {
      return setMsg({ type: "error", text: "Amount must be greater than 0" });
    }

    try {
      setLoading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("branch_id", form.branch_id);
      formData.append("expense_head_id", form.expense_head_id);
      formData.append("amount", parseFloat(form.amount));
      formData.append("remarks", form.remarks || "");
      
      if (selectedFile) {
        formData.append("document", selectedFile);
      }

      if (isEditMode && currentExpenseId) {
        await api.put(`/update_expenses/${currentExpenseId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setMsg({ type: "success", text: "Expense updated successfully ✅" });
        
        await fetchExpenses();
        
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        await api.post("/create_expenses", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setMsg({ type: "success", text: "Expense added successfully ✅" });
        
        setForm({
          branch_id: "",
          expense_head_id: "",
          amount: "",
          remarks: "",
          document_path: ""
        });
        
        await fetchExpenses();
        
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error saving expense ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete expense
  const handleDelete = async (expenseId, amount) => {
    if (!window.confirm(`Are you sure you want to delete expense of ₹${formatCurrency(amount)}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/delete_expenses/${expenseId}`);
      setMsg({ type: "success", text: "Expense deleted successfully ✅" });
      await fetchExpenses();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting expense ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? (branch.name || branch.branch_name) : "—";
  };

  const getExpenseHeadName = (headId) => {
    const head = expenseHeads.find(h => h.id === headId);
    return head ? head.name : "—";
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "—";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getExpenseIcon = () => {
    return "💸";
  };

  // Calculate total expenses
  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + (expense.amount || 0), 0);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, currentPage: newPage });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilterBranch("");
    setFilterExpenseHead("");
    setPagination({ ...pagination, currentPage: 1 });
  };

  return (
    <div className="VIEWW-management">
      {/* Header Section */}
      <div className="VIEWW-header">
        <div className="VIEWW-header-title">
          <h1>Expense Management</h1>
          <p>Track expenses, manage payments, and monitor financial outflows</p>
        </div>
        <button className="VIEWW-add-btn" onClick={openAddModal}>
          + Add New Expense
        </button>
      </div>

      {/* Message Alert */}
      {msg.text && (
        <div className={`VIEWW-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="VIEWW-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Stats Cards */}
      {/* <div className="VIEWW-stats">
        <div className="VIEWW-stat-card">
          <div className="VIEWW-stat-icon">💰</div>
          <div className="VIEWW-stat-info">
            <h4>Total Expenses</h4>
            <p className="VIEWW-stat-amount">{formatCurrency(getTotalExpenses())}</p>
          </div>
        </div>
        <div className="VIEWW-stat-card">
          <div className="VIEWW-stat-icon">📊</div>
          <div className="VIEWW-stat-info">
            <h4>Total Transactions</h4>
            <p className="VIEWW-stat-count">{expenses.length}</p>
          </div>
        </div>
      </div> */}

      {/* Search and Filters */}
      <div className="VIEWW-filters">
        <div className="VIEWW-search-bar">
          <input
            type="text"
            placeholder="🔍 Search by remarks or expense head..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="VIEWW-search-input"
          />
        </div>
        
        {/* <div className="VIEWW-filter-group">
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="VIEWW-filter-select"
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch.id || branch.branch_id} value={branch.id || branch.branch_id}>
                {branch.name || branch.branch_name}
              </option>
            ))}
          </select>

          <select
            value={filterExpenseHead}
            onChange={(e) => setFilterExpenseHead(e.target.value)}
            className="VIEWW-filter-select"
          >
            <option value="">All Expense Heads</option>
            {expenseHeads.map((head) => (
              <option key={head.id} value={head.id}>
                {head.name}
              </option>
            ))}
          </select>

          <button className="VIEWW-reset-btn" onClick={resetFilters}>
            Reset Filters
          </button>
        </div> */}
      </div>

      {/* Expenses List Table */}
      <div className="VIEWW-table-container">
        <div className="VIEWW-table-header">
          <h3>All Expenses</h3>
          <span className="VIEWW-record-badge">
            Total: {pagination.total} expense(s) | Page {pagination.currentPage} of {pagination.totalPages}
          </span>
        </div>
        
        {fetchLoading && expenses.length === 0 ? (
          <div className="VIEWW-loading-state">
            <div className="VIEWW-spinner"></div>
            <p>Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="VIEWW-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <p>No expenses found. Click "Add New Expense" to get started.</p>
          </div>
        ) : (
          <>
            <div className="VIEWW-table-responsive">
              <table className="VIEWW-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Expense Head</th>
                    <th>Expense Type</th>
                    <th>Amount</th>
                    <th>Remarks</th>
                    <th>Branch</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense, index) => (
                    <tr key={expense.id}>
                      <td className="VIEWW-sno">
                        {(pagination.currentPage - 1) * pagination.pageSize + index + 1}
                      </td>
                      <td className="VIEWW-head-cell">
                        <div className="VIEWW-name-wrapper">
                          <span className="VIEWW-icon">{getExpenseIcon()}</span>
                          <strong>{expense.expense_head_name || getExpenseHeadName(expense.expense_head_id)}</strong>
                        </div>
                      </td>
                      <td className="VIEWW-type-cell">
                        <span className="VIEWW-type-badge">
                          {expense.expense_type_name || "—"}
                        </span>
                      </td>
                      <td className="VIEWW-amount-cell">
                        <span className="VIEWW-amount-badge">
                          {formatCurrency(expense.amount)}
                        </span>
                      </td>
                      <td className="VIEWW-remarks-cell">
                        {expense.remarks || "—"}
                      </td>
                      <td className="VIEWW-branch-cell">
                        <span className="VIEWW-branch-badge">
                          {expense.branch_name || getBranchName(expense.branch)}
                        </span>
                      </td>
                      <td className="VIEWW-date-cell">
                        {formatDate(expense.created_at)}
                      </td>
                      <td>
                        <div className="VIEWW-action-btns">
                          <button 
                            className="VIEWW-btn-edit" 
                            onClick={() => openEditModal(expense)}
                            title="Edit expense"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="VIEWW-btn-delete" 
                            onClick={() => handleDelete(expense.id, expense.amount)}
                            title="Delete expense"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="VIEWW-total-row">
                    <td colSpan="3"><strong>Total</strong></td>
                    <td><strong>{formatCurrency(getTotalExpenses())}</strong></td>
                    <td colSpan="4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="VIEWW-pagination">
                <button 
                  className="VIEWW-page-btn"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  ← Previous
                </button>
                
                <div className="VIEWW-page-numbers">
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
                        className={`VIEWW-page-number ${pagination.currentPage === pageNum ? "VIEWW-active-page" : ""}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  className="VIEWW-page-btn"
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
        <div className="VIEWW-modal-overlay" onClick={closeModal}>
          <div className="VIEWW-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="VIEWW-modal-header">
              <h2>{isEditMode ? "✏️ Edit Expense" : "➕ Add New Expense"}</h2>
              <button className="VIEWW-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="VIEWW-modal-form">
              <div className="VIEWW-form-row">
                <div className="VIEWW-form-group">
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

                <div className="VIEWW-form-group">
                  <label>Expense Head <span className="required-star">*</span></label>
                  <select
                    name="expense_head_id"
                    value={form.expense_head_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Expense Head</option>
                    {expenseHeads.map((head) => (
                      <option key={head.id} value={head.id}>
                        {head.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="VIEWW-form-row">
                <div className="VIEWW-form-group">
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
                </div>

                <div className="VIEWW-form-group">
                  <label>Document (Optional)</label>
                  <div className="VIEWW-file-upload">
                    <input
                      type="file"
                      id="document"
                      name="document"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="VIEWW-file-input"
                    />
                    <label htmlFor="document" className="VIEWW-file-label">
                      📁 Choose File
                    </label>
                    {selectedFile && (
                      <span className="VIEWW-file-name">{selectedFile.name}</span>
                    )}
                    {!selectedFile && form.document_path && isEditMode && (
                      <span className="VIEWW-file-name">Current document exists</span>
                    )}
                  </div>
                  {previewUrl && previewUrl.startsWith('blob:') && (
                    <div className="VIEWW-image-preview">
                      <img src={previewUrl} alt="Preview" className="VIEWW-preview-img" />
                    </div>
                  )}
                </div>
              </div>

              <div className="VIEWW-form-group full-width">
                <label>Remarks</label>
                <textarea
                  name="remarks"
                  placeholder="Enter remarks or description (optional)"
                  value={form.remarks}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              {msg.text && (
                <div className={`VIEWW-form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="VIEWW-modal-actions">
                <button type="submit" className="VIEWW-btn-submit" disabled={loading}>
                  {loading ? "Saving..." : (isEditMode ? "Update Expense" : "Create Expense")}
                </button>
                <button type="button" className="VIEWW-btn-cancel" onClick={closeModal}>
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

export default ViewExpense;