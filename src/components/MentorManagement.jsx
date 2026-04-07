import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/MentorManagement.css";

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

const MentorManagement = () => {
  const [branches, setBranches] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentMentorId, setCurrentMentorId] = useState(null);
  
  const [form, setForm] = useState({
    branch_id: "",
    name: ""
  });

  // 📥 Fetch branches and mentors on load
  useEffect(() => {
    fetchBranches();
    fetchMentors();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await api.get("/view_branches");
      setBranches(res.data.data || []);
    } catch (err) {
      console.error("Branch fetch error", err);
    }
  };

  const fetchMentors = async () => {
    try {
      setFetchLoading(true);
      const res = await api.get("/view_mentors");
      setMentors(res.data.data || []);
    } catch (err) {
      console.error("Error fetching mentors", err);
      setMsg({ type: "error", text: "Failed to fetch mentors" });
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
    setCurrentMentorId(null);
    setForm({
      branch_id: "",
      name: ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // ✏️ Open modal for Edit
  const openEditModal = (mentor) => {
    setIsEditMode(true);
    setCurrentMentorId(mentor.id);
    setForm({
      branch_id: mentor.branch || "",
      name: mentor.name || ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // 🚀 Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentMentorId(null);
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
      return setMsg({ type: "error", text: "Branch and Mentor Name are required" });
    }

    try {
      setLoading(true);

      if (isEditMode && currentMentorId) {
        // Update existing mentor
        await api.put(`/update_mentors/${currentMentorId}`, {
          name: form.name,
          branch_id: form.branch_id
        });
        setMsg({ type: "success", text: "Mentor updated successfully ✅" });
        
        // Refresh mentor list
        await fetchMentors();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        // Create new mentor
        await api.post("/create_mentors", {
          name: form.name,
          branch_id: form.branch_id
        });
        setMsg({ type: "success", text: "Mentor added successfully ✅" });
        
        // Reset form
        setForm({
          branch_id: "",
          name: ""
        });
        
        // Refresh mentor list
        await fetchMentors();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error saving mentor ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete mentor
  const handleDelete = async (mentorId, mentorName) => {
    if (!window.confirm(`Are you sure you want to delete "${mentorName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/delete_mentors/${mentorId}`);
      setMsg({ type: "success", text: "Mentor deleted successfully ✅" });
      await fetchMentors();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting mentor ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mentor-management">
      {/* Header Section */}
      <div className="mentor-header">
        <div className="header-title">
          <h1>Mentor Management</h1>
          <p>Manage mentors and assign branches</p>
        </div>
        <button className="add-mentor-btn" onClick={openAddModal}>
          + Add New Mentor
        </button>
      </div>

      {/* Message Alert */}
      {msg.text && (
        <div className={`alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Mentors List Table */}
      <div className="mentors-table-container">
        <div className="table-header">
          <h3>All Mentors</h3>
          <span className="record-badge">{mentors.length} mentor(s) found</span>
        </div>
        
        {fetchLoading && mentors.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading mentors...</p>
          </div>
        ) : mentors.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <p>No mentors found. Click "Add New Mentor" to get started.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="mentors-table">
              <thead>
                <tr>
                  <th>Sl No.</th>
                  <th>Mentor Name</th>
                  <th>Branch</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mentors.map((mentor, index) => (
                  <tr key={mentor.id}>
                    <td>{index + 1}</td>
                    <td className="mentor-name-cell">
                      <strong>{mentor.name}</strong>
                    </td>
                    <td>{mentor.branch_name || mentor.branch || "—"}</td>
                    <td>
                      <div className="action-btns">
                        <button 
                          className="btn-edit" 
                          onClick={() => openEditModal(mentor)}
                          title="Edit mentor"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="btn-delete" 
                          onClick={() => handleDelete(mentor.id, mentor.name)}
                          title="Delete mentor"
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
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditMode ? "✏️ Edit Mentor" : "➕ Add New Mentor"}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group full-width">
                <label>Branch *</label>
                <select
                  name="branch_id"
                  value={form.branch_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.id || b.branch_id} value={b.id || b.branch_id}>
                      {b.name || b.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Mentor Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter mentor name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {msg.text && (
                <div className={`form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="modal-actions">
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? "Saving..." : (isEditMode ? "Update Mentor" : "Create Mentor")}
                </button>
                <button type="button" className="btn-cancel-modal" onClick={closeModal}>
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

export default MentorManagement;