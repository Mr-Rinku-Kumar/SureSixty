import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/BatchManagement.css";

// ✅ Axios instance with token and branch_id
const api = axios.create({
  baseURL: "http://192.168.1.3:5045/ims",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const branchId = localStorage.getItem("branch_id");
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add branch_id to params if it exists and the request is for branch-specific data
  if (branchId && (config.url.includes("/view_batches") || config.url.includes("/create_batches") || config.url.includes("/update_batches"))) {
    config.params = {
      ...config.params,
      branch_id: branchId
    };
  }
  
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

const BatchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  
  const [form, setForm] = useState({
    branch_id: "",
    name: "",
    code: ""
  });

  // Get current user's branch from localStorage
  const userBranchId = localStorage.getItem("branch_id");

  // 📥 Fetch branches and batches on load
  useEffect(() => {
    fetchBranches();
    fetchBatches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await api.get("/view_branches");
      setBranches(res.data.data || []);
    } catch (err) {
      console.error("Branch fetch error", err);
      setMsg({ type: "error", text: "Failed to fetch branches" });
    }
  };

  const fetchBatches = async () => {
    try {
      setFetchLoading(true);
      const token = localStorage.getItem("token");
      const branchId = localStorage.getItem("branch_id");
      
      const res = await api.get("/view_batches", {
        params: { branch_id: branchId },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBatches(res.data.data || []);
    } catch (err) {
      console.error("Error fetching batches", err);
      setMsg({ type: "error", text: "Failed to fetch batches" });
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
    setCurrentBatchId(null);
    setForm({
      branch_id: userBranchId || "", // Pre-fill with user's branch if available
      name: "",
      code: ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // ✏️ Open modal for Edit
  const openEditModal = (batch) => {
    setIsEditMode(true);
    setCurrentBatchId(batch.id);
    setForm({
      branch_id: batch.branch_id || userBranchId || "",
      name: batch.name || "",
      code: batch.code || ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // 🚀 Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentBatchId(null);
    setForm({
      branch_id: userBranchId || "",
      name: "",
      code: ""
    });
    setMsg({ type: "", text: "" });
  };

  // 🚀 Submit form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!form.branch_id || !form.name || !form.code) {
      return setMsg({ type: "error", text: "Branch, Batch Name, and Batch Code are required" });
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (isEditMode && currentBatchId) {
        // Update existing batch
        await api.put(`/update_batches/${currentBatchId}`, {
          name: form.name,
          code: form.code,
          branch_id: form.branch_id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMsg({ type: "success", text: "Batch updated successfully ✅" });
        
        // Refresh batch list
        await fetchBatches();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        // Create new batch
        await api.post("/create_batches", {
          name: form.name,
          code: form.code,
          branch_id: form.branch_id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMsg({ type: "success", text: "Batch added successfully ✅" });
        
        // Reset form
        setForm({
          branch_id: userBranchId || "",
          name: "",
          code: ""
        });
        
        // Refresh batch list
        await fetchBatches();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error saving batch ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete batch
  const handleDelete = async (batchId, batchName) => {
    if (!window.confirm(`Are you sure you want to delete batch "${batchName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const branchId = localStorage.getItem("branch_id");
      
      await api.delete(`/delete_batches/${batchId}`, {
        params: { branch_id: branchId },
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg({ type: "success", text: "Batch deleted successfully ✅" });
      await fetchBatches();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting batch ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="batch-management">
      {/* Header Section */}
      <div className="batch-header">
        <div className="batch-header-title">
          <h1>Batch Management</h1>
          <p>Manage batches, assign branches, and organize student groups</p>
        </div>
        <button className="batch-add-btn" onClick={openAddModal}>
          + Add New Batch
        </button>
      </div>

      {/* Message Alert */}
      {msg.text && (
        <div className={`batch-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="batch-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Batches List Table */}
      <div className="batch-table-container">
        <div className="batch-table-header">
          <h3>All Batches</h3>
          <span className="batch-record-badge">{batches.length} batch(es) found</span>
        </div>
        
        {fetchLoading && batches.length === 0 ? (
          <div className="batch-loading-state">
            <div className="batch-spinner"></div>
            <p>Loading batches...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="batch-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <circle cx="12" cy="15" r="1" />
              <circle cx="16" cy="15" r="1" />
              <circle cx="8" cy="15" r="1" />
            </svg>
            <p>No batches found. Click "Add New Batch" to get started.</p>
          </div>
        ) : (
          <div className="batch-table-responsive">
            <table className="batch-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Batch Code</th>
                  <th>Batch Name</th>
                  <th>Branch</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch, index) => (
                  <tr key={batch.id}>
                    <td className="batch-sno">{index + 1}</td>
                    <td className="batch-code-cell">
                      <span className="batch-code-badge">{batch.code}</span>
                    </td>
                    <td className="batch-name-cell">
                      <strong>{batch.name}</strong>
                    </td>
                    <td>{batch.branch_name || batch.branch_id || "—"}</td>
                    <td>{batch.created_at ? new Date(batch.created_at).toLocaleDateString() : "—"}</td>
                    <td>
                      <div className="batch-action-btns">
                        <button 
                          className="batch-btn-edit" 
                          onClick={() => openEditModal(batch)}
                          title="Edit batch"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="batch-btn-delete" 
                          onClick={() => handleDelete(batch.id, batch.name)}
                          title="Delete batch"
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
        )}
      </div>

      {/* Modal Popup for Add/Edit */}
      {showModal && (
        <div className="batch-modal-overlay" onClick={closeModal}>
          <div className="batch-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="batch-modal-header">
              <h2>{isEditMode ? "✏️ Edit Batch" : "➕ Add New Batch"}</h2>
              <button className="batch-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="batch-modal-form">
              <div className="batch-form-row">
                <div className="batch-form-group full-width">
                  <label>Branch *</label>
                  <select
                    name="branch_id"
                    value={form.branch_id}
                    onChange={handleChange}
                    required
                    disabled={!isEditMode && !!userBranchId} // Disable if adding new batch and user has branch assigned
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id || branch.branch_id} value={branch.id || branch.branch_id}>
                        {branch.name || branch.branch_name}
                      </option>
                    ))}
                  </select>
                  <small className="batch-field-hint">
                    {!isEditMode && userBranchId 
                      ? "Branch is auto-selected based on your profile" 
                      : "Select the branch for this batch"}
                  </small>
                </div>
              </div>

              <div className="batch-form-row">
                <div className="batch-form-group">
                  <label>Batch Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g., Morning Batch, Evening Batch, Weekend Batch"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="batch-form-group">
                  <label>Batch Code *</label>
                  <input
                    type="text"
                    name="code"
                    placeholder="e.g., BATCH01, MORN001, EVE001"
                    value={form.code}
                    onChange={handleChange}
                    required
                  />
                  <small className="batch-field-hint">Unique identifier for the batch</small>
                </div>
              </div>

              {msg.text && (
                <div className={`batch-form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="batch-modal-actions">
                <button type="submit" className="batch-btn-submit" disabled={loading}>
                  {loading ? "Saving..." : (isEditMode ? "Update Batch" : "Create Batch")}
                </button>
                <button type="button" className="batch-btn-cancel" onClick={closeModal}>
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

export default BatchManagement;