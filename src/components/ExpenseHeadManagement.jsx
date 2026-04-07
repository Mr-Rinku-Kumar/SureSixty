import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/ExpenseHeadManagement.css";

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

const ExpenseHeadManagement = () => {
  const [branches, setBranches] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [expenseHeads, setExpenseHeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentExpenseHeadId, setCurrentExpenseHeadId] = useState(null);
  
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
    expense_type_id: "",
    name: "",
    remarks: ""
  });

  // 📥 Fetch branches on load only
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch expense types when branch is selected in modal
  useEffect(() => {
    if (form.branch_id && showModal) {
      fetchExpenseTypesByBranch(form.branch_id);
    } else if (!form.branch_id && showModal) {
      setExpenseTypes([]);
    }
  }, [form.branch_id, showModal]);

  // Fetch expense heads when page or search changes
  useEffect(() => {
    fetchExpenseHeads();
  }, [pagination.currentPage, pagination.pageSize, searchTerm]);

  const fetchBranches = async () => {
    try {
      const res = await api.get("/view_branches");
      setBranches(res.data.data || []);
    } catch (err) {
      console.error("Branch fetch error", err);
    }
  };

  const fetchExpenseTypesByBranch = async (branchId) => {
    try {
      const res = await api.get("/view_expense_types", {
        params: { branch_id: branchId }
      });
      setExpenseTypes(res.data.data || []);
    } catch (err) {
      console.error("Expense type fetch error", err);
      setExpenseTypes([]);
    }
  };

  const fetchExpenseHeads = async () => {
    try {
      setFetchLoading(true);
      
      let params = {
        page: pagination.currentPage,
        page_size: pagination.pageSize
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const res = await api.get("/view_expense_heads", { params });
      
      let expenseHeadData = res.data.data || [];
      
      // Client-side search filter if backend doesn't support search
      if (searchTerm && !res.data.total) {
        expenseHeadData = expenseHeadData.filter(head => 
          head.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          head.expense_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          head.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          head.branch_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setExpenseHeads(expenseHeadData);
      setPagination({
        currentPage: res.data.page || 1,
        pageSize: res.data.page_size || 10,
        total: res.data.total || expenseHeadData.length,
        totalPages: res.data.total_pages || Math.ceil((res.data.total || expenseHeadData.length) / (res.data.page_size || 10))
      });
      
    } catch (err) {
      console.error("Error fetching expense heads", err);
      setMsg({ type: "error", text: "Failed to fetch expense heads" });
    } finally {
      setFetchLoading(false);
    }
  };

  // ✏️ Handle input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear expense type selection when branch changes
    if (name === "branch_id") {
      setForm(prev => ({
        ...prev,
        expense_type_id: ""
      }));
    }
  };

  // 🚀 Open modal for Add
  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentExpenseHeadId(null);
    setForm({
      branch_id: "",
      expense_type_id: "",
      name: "",
      remarks: ""
    });
    setExpenseTypes([]);
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // ✏️ Open modal for Edit
  const openEditModal = (head) => {
    setIsEditMode(true);
    setCurrentExpenseHeadId(head.id);
    setForm({
      branch_id: head.branch || head.branch_id || "",
      expense_type_id: head.expense_type_id || "",
      name: head.name || "",
      remarks: head.remarks || ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
    
    // Fetch expense types for the selected branch
    if (head.branch || head.branch_id) {
      fetchExpenseTypesByBranch(head.branch || head.branch_id);
    }
  };

  // 🚀 Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentExpenseHeadId(null);
    setForm({
      branch_id: "",
      expense_type_id: "",
      name: "",
      remarks: ""
    });
    setExpenseTypes([]);
    setMsg({ type: "", text: "" });
  };

  // 🚀 Submit form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!form.branch_id || !form.expense_type_id || !form.name) {
      return setMsg({ type: "error", text: "Branch, Expense Type, and Expense Head Name are required" });
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name,
        expense_type_id: form.expense_type_id,
        remarks: form.remarks || "",
        branch_id: form.branch_id
      };

      if (isEditMode && currentExpenseHeadId) {
        // Update existing expense head
        await api.put(`/update_expense_heads/${currentExpenseHeadId}`, payload);
        setMsg({ type: "success", text: "Expense head updated successfully ✅" });
        
        // Refresh expense heads list
        await fetchExpenseHeads();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        // Create new expense head
        await api.post("/create_expense_heads", payload);
        setMsg({ type: "success", text: "Expense head added successfully ✅" });
        
        // Reset form
        setForm({
          branch_id: "",
          expense_type_id: "",
          name: "",
          remarks: ""
        });
        
        // Refresh expense heads list
        await fetchExpenseHeads();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error saving expense head ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete expense head
  const handleDelete = async (headId, headName) => {
    if (!window.confirm(`Are you sure you want to delete expense head "${headName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/delete_expense_heads/${headId}`);
      setMsg({ type: "success", text: "Expense head deleted successfully ✅" });
      await fetchExpenseHeads();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting expense head ❌";
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

  // Helper to get expense type name by ID
  const getExpenseTypeName = (typeId) => {
    const type = expenseTypes.find(t => t.id === typeId);
    return type ? type.name : "—";
  };

  // Get icon for expense head
  const getExpenseIcon = (headName) => {
    const name = headName.toLowerCase();
    if (name.includes('electricity')) return '⚡';
    if (name.includes('water')) return '💧';
    if (name.includes('internet') || name.includes('broadband')) return '🌐';
    if (name.includes('salary') || name.includes('payroll')) return '💰';
    if (name.includes('rent')) return '🏢';
    if (name.includes('maintenance')) return '🔧';
    if (name.includes('repair')) return '🛠️';
    if (name.includes('supplies')) return '📦';
    if (name.includes('stationery')) return '✏️';
    if (name.includes('printing')) return '🖨️';
    if (name.includes('travel')) return '✈️';
    if (name.includes('food') || name.includes('catering')) return '🍽️';
    if (name.includes('marketing') || name.includes('advertising')) return '📢';
    if (name.includes('training')) return '📚';
    if (name.includes('equipment')) return '🖥️';
    return '📋';
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

  // Check if branch is selected in form
  const isBranchSelected = !!form.branch_id;

  return (
    <div className="EHMNG-management">
      {/* Header Section */}
      <div className="EHMNG-header">
        <div className="EHMNG-header-title">
          <h1>Expense Head Management</h1>
          <p>Manage detailed expense categories, track spending, and organize financial records</p>
        </div>
        <button className="EHMNG-add-btn" onClick={openAddModal}>
          + Add New Expense Head
        </button>
      </div>

      {/* Message Alert */}
      {msg.text && (
        <div className={`EHMNG-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="EHMNG-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="EHMNG-search-bar">
        <input
          type="text"
          placeholder="🔍 Search by expense head, type, remarks, or branch..."
          value={searchTerm}
          onChange={handleSearch}
          className="EHMNG-search-input"
        />
      </div>

      {/* Expense Heads List Table */}
      <div className="EHMNG-table-container">
        <div className="EHMNG-table-header">
          <h3>All Expense Heads</h3>
          <span className="EHMNG-record-badge">
            Total: {pagination.total} expense head(s) | Page {pagination.currentPage} of {pagination.totalPages}
          </span>
        </div>
        
        {fetchLoading && expenseHeads.length === 0 ? (
          <div className="EHMNG-loading-state">
            <div className="EHMNG-spinner"></div>
            <p>Loading expense heads...</p>
          </div>
        ) : expenseHeads.length === 0 ? (
          <div className="EHMNG-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <p>No expense heads found. Click "Add New Expense Head" to get started.</p>
          </div>
        ) : (
          <>
            <div className="EHMNG-table-responsive">
              <table className="EHMNG-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Expense Head</th>
                    <th>Expense Type</th>
                    <th>Remarks</th>
                    <th>Branch</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseHeads.map((head, index) => (
                    <tr key={head.id}>
                      <td className="EHMNG-sno">
                        {(pagination.currentPage - 1) * pagination.pageSize + index + 1}
                      </td>
                      <td className="EHMNG-name-cell">
                        <div className="EHMNG-name-wrapper">
                          <span className="EHMNG-icon">{getExpenseIcon(head.name)}</span>
                          <strong>{head.name}</strong>
                        </div>
                      </td>
                      <td className="EHMNG-type-cell">
                        <span className="EHMNG-type-badge">
                          {head.expense_type_name || getExpenseTypeName(head.expense_type_id)}
                        </span>
                      </td>
                      <td className="EHMNG-remarks-cell">
                        {head.remarks || "—"}
                      </td>
                      <td className="EHMNG-branch-cell">
                        <span className="EHMNG-branch-badge">
                          {head.branch_name || getBranchName(head.branch)}
                        </span>
                      </td>
                      <td className="EHMNG-date-cell">
                        {head.created_at ? new Date(head.created_at).toLocaleDateString('en-IN') : "—"}
                      </td>
                      <td>
                        <div className="EHMNG-action-btns">
                          <button 
                            className="EHMNG-btn-edit" 
                            onClick={() => openEditModal(head)}
                            title="Edit expense head"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="EHMNG-btn-delete" 
                            onClick={() => handleDelete(head.id, head.name)}
                            title="Delete expense head"
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
              <div className="EHMNG-pagination">
                <button 
                  className="EHMNG-page-btn"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  ← Previous
                </button>
                
                <div className="EHMNG-page-numbers">
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
                        className={`EHMNG-page-number ${pagination.currentPage === pageNum ? "EHMNG-active-page" : ""}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  className="EHMNG-page-btn"
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
        <div className="EHMNG-modal-overlay" onClick={closeModal}>
          <div className="EHMNG-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="EHMNG-modal-header">
              <h2>{isEditMode ? "✏️ Edit Expense Head" : "➕ Add New Expense Head"}</h2>
              <button className="EHMNG-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="EHMNG-modal-form">
              <div className="EHMNG-form-row">
                <div className="EHMNG-form-group">
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
                  <small className="EHMNG-field-hint">Select branch first to load expense types</small>
                </div>

                <div className="EHMNG-form-group">
                  <label>Expense Type <span className="required-star">*</span></label>
                  <select
                    name="expense_type_id"
                    value={form.expense_type_id}
                    onChange={handleChange}
                    required
                    disabled={!isBranchSelected}
                  >
                    <option value="">
                      {isBranchSelected ? "Select Expense Type" : "Please select branch first"}
                    </option>
                    {expenseTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {/* {!isBranchSelected && (
                    <small className="EHMNG-field-hint error-hint">⚠️ Please select branch first</small>
                  )} */}
                  {isBranchSelected && expenseTypes.length === 0 && (
                    <small className="EHMNG-field-hint">No expense types available for this branch</small>
                  )}
                </div>
              </div>

              <div className="EHMNG-form-row">
                <div className="EHMNG-form-group">
                  <label>Expense Head Name <span className="required-star">*</span></label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g., Electricity Bill, Water Bill, Internet Charges"
                    value={form.name}
                    onChange={handleChange}
                    required
                    disabled={!isBranchSelected}
                  />
                  {/* {!isBranchSelected && (
                    <small className="EHMNG-field-hint error-hint">⚠️ Please select branch first</small>
                  )} */}
                  {isBranchSelected && (
                    <small className="EHMNG-field-hint">Enter a descriptive name for the expense head</small>
                  )}
                </div>

                <div className="EHMNG-form-group">
                  <label>Remarks</label>
                  <input
                    type="text"
                    name="remarks"
                    placeholder="e.g., Monthly, Quarterly, Annual"
                    value={form.remarks}
                    onChange={handleChange}
                    disabled={!isBranchSelected}
                  />
                  <small className="EHMNG-field-hint">Optional remarks or notes</small>
                </div>
              </div>

              {msg.text && (
                <div className={`EHMNG-form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="EHMNG-modal-actions">
                <button 
                  type="submit" 
                  className="EHMNG-btn-submit" 
                  disabled={loading || !isBranchSelected}
                >
                  {loading ? "Saving..." : (isEditMode ? "Update Expense Head" : "Create Expense Head")}
                </button>
                <button type="button" className="EHMNG-btn-cancel" onClick={closeModal}>
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

export default ExpenseHeadManagement;