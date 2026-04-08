import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/LibraryManagement.css";

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

const LibraryManagement = () => {
  const [branches, setBranches] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentLibraryId, setCurrentLibraryId] = useState(null);
  
  const [form, setForm] = useState({
    branch_id: "",
    name: ""
  });

  // 📥 Fetch branches and libraries on load
  useEffect(() => {
    fetchBranches();
    fetchLibraries();
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

  const fetchLibraries = async () => {
    try {
      setFetchLoading(true);
      const res = await api.get("/view_libraries");
      setLibraries(res.data.data || []);
    } catch (err) {
      console.error("Error fetching libraries", err);
      setMsg({ type: "error", text: "Failed to fetch libraries" });
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
    setCurrentLibraryId(null);
    setForm({
      branch_id: "",
      name: ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // ✏️ Open modal for Edit
  const openEditModal = (library) => {
    setIsEditMode(true);
    setCurrentLibraryId(library.id);
    setForm({
      branch_id: library.branch_id || "",
      name: library.name || ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // 🚀 Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentLibraryId(null);
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
      return setMsg({ type: "error", text: "Branch and Library Name are required" });
    }

    try {
      setLoading(true);

      if (isEditMode && currentLibraryId) {
        // Update existing library
        await api.put(`/update_libraries/${currentLibraryId}`, {
          name: form.name,
          branch_id: form.branch_id
        });
        setMsg({ type: "success", text: "Library updated successfully ✅" });
        
        // Refresh library list
        await fetchLibraries();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        // Create new library
        await api.post("/create_libraries", {
          name: form.name,
          branch_id: form.branch_id
        });
        setMsg({ type: "success", text: "Library added successfully ✅" });
        
        // Reset form
        setForm({
          branch_id: "",
          name: ""
        });
        
        // Refresh library list
        await fetchLibraries();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error saving library ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete library
  const handleDelete = async (libraryId, libraryName) => {
    if (!window.confirm(`Are you sure you want to delete library "${libraryName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/delete_libraries/${libraryId}`);
      setMsg({ type: "success", text: "Library deleted successfully ✅" });
      await fetchLibraries();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting library ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="LMNG-management">
      {/* Header Section */}
      <div className="LMNG-header">
        <div className="LMNG-header-title">
          <h1>Library Management</h1>
          <p>Manage libraries, branches, and reading resources</p>
        </div>
        <button className="LMNG-add-btn" onClick={openAddModal}>
          + Add New Library
        </button>
      </div>

      {/* Message Alert */}
      {msg.text && (
        <div className={`LMNG-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="LMNG-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Libraries List Table */}
      <div className="LMNG-table-container">
        <div className="LMNG-table-header">
          <h3>All Libraries</h3>
          <span className="LMNG-record-badge">{libraries.length} library(s) found</span>
        </div>
        
        {fetchLoading && libraries.length === 0 ? (
          <div className="LMNG-loading-state">
            <div className="LMNG-spinner"></div>
            <p>Loading libraries...</p>
          </div>
        ) : libraries.length === 0 ? (
          <div className="LMNG-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M8 7h8" />
              <path d="M8 11h8" />
              <path d="M8 15h5" />
            </svg>
            <p>No libraries found. Click "Add New Library" to get started.</p>
          </div>
        ) : (
          <div className="LMNG-table-responsive">
            <table className="LMNG-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Library Name</th>
                  <th>Branch</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                  </tr>
                </thead>
              <tbody>
                {libraries.map((library, index) => (
                  <tr key={library.id}>
                    <td className="LMNG-sno">{index + 1}</td>
                    <td className="LMNG-name-cell">
                      <div className="LMNG-name-wrapper">
                        <span className="LMNG-icon">📚</span>
                        <strong>{library.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="LMNG-branch-badge">
                        {library.branch_name || library.branch || "—"}
                      </span>
                    </td>
                    <td>
                      {library.created_at ? new Date(library.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <div className="LMNG-action-btns">
                        <button 
                          className="LMNG-btn-edit" 
                          onClick={() => openEditModal(library)}
                          title="Edit library"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="LMNG-btn-delete" 
                          onClick={() => handleDelete(library.id, library.name)}
                          title="Delete library"
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
        <div className="LMNG-modal-overlay" onClick={closeModal}>
          <div className="LMNG-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="LMNG-modal-header">
              <h2>{isEditMode ? "✏️ Edit Library" : "➕ Add New Library"}</h2>
              <button className="LMNG-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="LMNG-modal-form">
              <div className="LMNG-form-row">
                <div className="LMNG-form-group full-width">
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
                  <small className="LMNG-field-hint">Select the branch for this library</small>
                </div>
              </div>

              <div className="LMNG-form-row">
                <div className="LMNG-form-group full-width">
                  <label>Library Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g., Main Library, Digital Library, Reference Library"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <small className="LMNG-field-hint">Enter a descriptive name for the library</small>
                </div>
              </div>

              {msg.text && (
                <div className={`LMNG-form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="LMNG-modal-actions">
                <button type="submit" className="LMNG-btn-submit" disabled={loading}>
                  {loading ? "Saving..." : (isEditMode ? "Update Library" : "Create Library")}
                </button>
                <button type="button" className="LMNG-btn-cancel" onClick={closeModal}>
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

export default LibraryManagement;