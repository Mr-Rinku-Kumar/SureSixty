import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/DurationManagement.css";

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

const DurationManagement = () => {
  const [branches, setBranches] = useState([]);
  const [durations, setDurations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentDurationId, setCurrentDurationId] = useState(null);
  
  const [form, setForm] = useState({
    branch_id: "",
    name: ""
  });

  // 📥 Fetch branches and durations on load
  useEffect(() => {
    fetchBranches();
    fetchDurations();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await api.get("/view_branches"); // ✅ Updated endpoint to match ViewBranch
      setBranches(res.data.data || []);
    } catch (err) {
      console.error("Branch fetch error", err);
      setMsg({ type: "error", text: "Failed to fetch branches" });
    }
  };

  const fetchDurations = async () => {
    try {
      setFetchLoading(true);
      const res = await api.get("/view_durations");
      setDurations(res.data.data || []);
    } catch (err) {
      console.error("Error fetching durations", err);
      setMsg({ type: "error", text: "Failed to fetch durations" });
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
    setCurrentDurationId(null);
    setForm({
      branch_id: "",
      name: ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // ✏️ Open modal for Edit
  const openEditModal = (duration) => {
    setIsEditMode(true);
    setCurrentDurationId(duration.id);
    setForm({
      branch_id: duration.branch_id || "",
      name: duration.name || ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // 🚀 Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentDurationId(null);
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
      return setMsg({ type: "error", text: "Branch and Duration Name are required" });
    }

    try {
      setLoading(true);

      if (isEditMode && currentDurationId) {
        // Update existing duration
        await api.put(`/update_durations/${currentDurationId}`, {
          name: form.name,
          branch_id: form.branch_id
        });
        setMsg({ type: "success", text: "Duration updated successfully ✅" });
        
        // Refresh duration list
        await fetchDurations();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        // Create new duration
        await api.post("/create_durations", {
          name: form.name,
          branch_id: form.branch_id
        });
        setMsg({ type: "success", text: "Duration added successfully ✅" });
        
        // Reset form
        setForm({
          branch_id: "",
          name: ""
        });
        
        // Refresh duration list
        await fetchDurations();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error saving duration ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete duration
  const handleDelete = async (durationId, durationName) => {
    if (!window.confirm(`Are you sure you want to delete duration "${durationName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/delete_durations/${durationId}`);
      setMsg({ type: "success", text: "Duration deleted successfully ✅" });
      await fetchDurations();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting duration ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="duration-management">
      {/* Header Section */}
      <div className="duration-header">
        <div className="duration-header-title">
          <h1>Duration Management</h1>
          <p>Manage course durations, assign branches, and track academic periods</p>
        </div>
        <button className="duration-add-btn" onClick={openAddModal}>
          + Add New Duration
        </button>
      </div>

      {/* Message Alert */}
      {msg.text && (
        <div className={`duration-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="duration-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Durations List Table */}
      <div className="duration-table-container">
        <div className="duration-table-header">
          <h3>All Durations</h3>
          <span className="duration-record-badge">{durations.length} duration(s) found</span>
        </div>
        
        {fetchLoading && durations.length === 0 ? (
          <div className="duration-loading-state">
            <div className="duration-spinner"></div>
            <p>Loading durations...</p>
          </div>
        ) : durations.length === 0 ? (
          <div className="duration-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <p>No durations found. Click "Add New Duration" to get started.</p>
          </div>
        ) : (
          <div className="duration-table-responsive">
            <table className="duration-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Duration Name</th>
                  <th>Branch</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {durations.map((duration, index) => (
                  <tr key={duration.id}>
                    <td className="duration-sno">{index + 1}</td>
                    <td className="duration-name-cell">
                      <strong>{duration.name}</strong>
                    </td>
                    <td>{duration.branch_name || duration.branch || "—"}</td>
                    <td>{duration.created_at ? new Date(duration.created_at).toLocaleDateString() : "—"}</td>
                    <td>
                      <div className="duration-action-btns">
                        <button 
                          className="duration-btn-edit" 
                          onClick={() => openEditModal(duration)}
                          title="Edit duration"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="duration-btn-delete" 
                          onClick={() => handleDelete(duration.id, duration.name)}
                          title="Delete duration"
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
        <div className="duration-modal-overlay" onClick={closeModal}>
          <div className="duration-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="duration-modal-header">
              <h2>{isEditMode ? "✏️ Edit Duration" : "➕ Add New Duration"}</h2>
              <button className="duration-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="duration-modal-form">
              <div className="duration-form-row">
                <div className="duration-form-group full-width">
                  <label>Branch *</label>
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
                  <small className="duration-field-hint">Select the branch for this duration</small>
                </div>
              </div>

              <div className="duration-form-row">
                <div className="duration-form-group full-width">
                  <label>Duration Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g., 1 Year, 2 Years, 3 Years, 6 Months"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <small className="duration-field-hint">Enter the duration period (e.g., 1 Year, 2 Years)</small>
                </div>
              </div>

              {msg.text && (
                <div className={`duration-form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="duration-modal-actions">
                <button type="submit" className="duration-btn-submit" disabled={loading}>
                  {loading ? "Saving..." : (isEditMode ? "Update Duration" : "Create Duration")}
                </button>
                <button type="button" className="duration-btn-cancel" onClick={closeModal}>
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

export default DurationManagement;