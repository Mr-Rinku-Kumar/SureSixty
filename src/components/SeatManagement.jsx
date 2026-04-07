import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/SeatManagement.css";

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

const SeatManagement = () => {
  const [branches, setBranches] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSeatId, setCurrentSeatId] = useState(null);
  
  const [form, setForm] = useState({
    branch_id: "",
    library_id: "",
    name: ""
  });

  // 📥 Fetch branches, libraries, and seats on load
  useEffect(() => {
    fetchBranches();
    fetchLibraries();
    fetchSeats();
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
      const res = await api.get("/view_libraries");
      setLibraries(res.data.data || []);
    } catch (err) {
      console.error("Library fetch error", err);
      setMsg({ type: "error", text: "Failed to fetch libraries" });
    }
  };

  const fetchSeats = async () => {
    try {
      setFetchLoading(true);
      const res = await api.get("/view_seats");
      setSeats(res.data.data || []);
    } catch (err) {
      console.error("Error fetching seats", err);
      setMsg({ type: "error", text: "Failed to fetch seats" });
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
    setCurrentSeatId(null);
    setForm({
      branch_id: "",
      library_id: "",
      name: ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // ✏️ Open modal for Edit
  const openEditModal = (seat) => {
    setIsEditMode(true);
    setCurrentSeatId(seat.id);
    setForm({
      branch_id: seat.branch_id || "",
      library_id: seat.library_id || "",
      name: seat.name || ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // 🚀 Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentSeatId(null);
    setForm({
      branch_id: "",
      library_id: "",
      name: ""
    });
    setMsg({ type: "", text: "" });
  };

  // 🚀 Submit form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!form.branch_id || !form.name) {
      return setMsg({ type: "error", text: "Branch and Seat Name are required" });
    }

    try {
      setLoading(true);

      if (isEditMode && currentSeatId) {
        // Update existing seat
        await api.put(`/update_seats/${currentSeatId}`, {
          name: form.name,
          library_id: form.library_id || null,
          branch_id: form.branch_id
        });
        setMsg({ type: "success", text: "Seat updated successfully ✅" });
        
        // Refresh seat list
        await fetchSeats();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        // Create new seat
        await api.post("/create_seats", {
          name: form.name,
          library_id: form.library_id || null,
          branch_id: form.branch_id
        });
        setMsg({ type: "success", text: "Seat added successfully ✅" });
        
        // Reset form
        setForm({
          branch_id: "",
          library_id: "",
          name: ""
        });
        
        // Refresh seat list
        await fetchSeats();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error saving seat ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete seat
  const handleDelete = async (seatId, seatName) => {
    if (!window.confirm(`Are you sure you want to delete seat "${seatName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/delete_seats/${seatId}`);
      setMsg({ type: "success", text: "Seat deleted successfully ✅" });
      await fetchSeats();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting seat ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Helper to get library name by ID
  const getLibraryName = (libraryId) => {
    const library = libraries.find(l => l.id === libraryId);
    return library ? library.name : "—";
  };

  return (
    <div className="SEATMNG-management">
      {/* Header Section */}
      <div className="SEATMNG-header">
        <div className="SEATMNG-header-title">
          <h1>Seat Management</h1>
          <p>Manage library seats, assign branches and libraries, track availability</p>
        </div>
        <button className="SEATMNG-add-btn" onClick={openAddModal}>
          + Add New Seat
        </button>
      </div>

      {/* Message Alert */}
      {msg.text && (
        <div className={`SEATMNG-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="SEATMNG-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Seats List Table */}
      <div className="SEATMNG-table-container">
        <div className="SEATMNG-table-header">
          <h3>All Seats</h3>
          <span className="SEATMNG-record-badge">{seats.length} seat(s) found</span>
        </div>
        
        {fetchLoading && seats.length === 0 ? (
          <div className="SEATMNG-loading-state">
            <div className="SEATMNG-spinner"></div>
            <p>Loading seats...</p>
          </div>
        ) : seats.length === 0 ? (
          <div className="SEATMNG-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="4" y="6" width="16" height="12" rx="2" />
              <path d="M8 6V4h8v2" />
              <path d="M12 10v4" />
              <path d="M8 14h8" />
            </svg>
            <p>No seats found. Click "Add New Seat" to get started.</p>
          </div>
        ) : (
          <div className="SEATMNG-table-responsive">
            <table className="SEATMNG-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Seat Name</th>
                  <th>Library</th>
                  <th>Branch</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {seats.map((seat, index) => (
                  <tr key={seat.id}>
                    <td className="SEATMNG-sno">{index + 1}</td>
                    <td className="SEATMNG-name-cell">
                      <div className="SEATMNG-name-wrapper">
                        <span className="SEATMNG-icon">💺</span>
                        <strong>{seat.name}</strong>
                      </div>
                    </td>
                    <td>
                      {seat.library_id ? (
                        <span className="SEATMNG-library-badge">
                          {getLibraryName(seat.library_id)}
                        </span>
                      ) : (
                        <span className="SEATMNG-unassigned">Not Assigned</span>
                      )}
                    </td>
                    <td>
                      <span className="SEATMNG-branch-badge">
                        {seat.branch_name || seat.branch || "—"}
                      </span>
                    </td>
                    <td>
                      {seat.created_at ? new Date(seat.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <div className="SEATMNG-action-btns">
                        <button 
                          className="SEATMNG-btn-edit" 
                          onClick={() => openEditModal(seat)}
                          title="Edit seat"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="SEATMNG-btn-delete" 
                          onClick={() => handleDelete(seat.id, seat.name)}
                          title="Delete seat"
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
        <div className="SEATMNG-modal-overlay" onClick={closeModal}>
          <div className="SEATMNG-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="SEATMNG-modal-header">
              <h2>{isEditMode ? "✏️ Edit Seat" : "➕ Add New Seat"}</h2>
              <button className="SEATMNG-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="SEATMNG-modal-form">
              <div className="SEATMNG-form-row">
                <div className="SEATMNG-form-group full-width">
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
                  <small className="SEATMNG-field-hint">Select the branch for this seat</small>
                </div>
              </div>

              <div className="SEATMNG-form-row">
                <div className="SEATMNG-form-group">
                  <label>Library (Optional)</label>
                  <select
                    name="library_id"
                    value={form.library_id}
                    onChange={handleChange}
                  >
                    <option value="">Select Library (Optional)</option>
                    {libraries.map((library) => (
                      <option key={library.id} value={library.id}>
                        {library.name}
                      </option>
                    ))}
                  </select>
                  <small className="SEATMNG-field-hint">Assign seat to a specific library</small>
                </div>

                <div className="SEATMNG-form-group">
                  <label>Seat Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g., Seat 1, Seat A1, Reading Corner, Window Seat"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <small className="SEATMNG-field-hint">Enter a descriptive name for the seat</small>
                </div>
              </div>

              {msg.text && (
                <div className={`SEATMNG-form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="SEATMNG-modal-actions">
                <button type="submit" className="SEATMNG-btn-submit" disabled={loading}>
                  {loading ? "Saving..." : (isEditMode ? "Update Seat" : "Create Seat")}
                </button>
                <button type="button" className="SEATMNG-btn-cancel" onClick={closeModal}>
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

export default SeatManagement;