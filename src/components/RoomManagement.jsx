import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/RoomManagement.css";

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

const RoomManagement = () => {
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  
  const [form, setForm] = useState({
    branch_id: "",
    name: ""
  });

  // 📥 Fetch branches and rooms on load
  useEffect(() => {
    fetchBranches();
    fetchRooms();
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

  const fetchRooms = async () => {
    try {
      setFetchLoading(true);
      const res = await api.get("/view_rooms");
      setRooms(res.data.data || []);
    } catch (err) {
      console.error("Error fetching rooms", err);
      setMsg({ type: "error", text: "Failed to fetch rooms" });
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
    setCurrentRoomId(null);
    setForm({
      branch_id: "",
      name: ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // ✏️ Open modal for Edit
  const openEditModal = (room) => {
    setIsEditMode(true);
    setCurrentRoomId(room.id);
    setForm({
      branch_id: room.branch_id || "",
      name: room.name || ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // 🚀 Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentRoomId(null);
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
      return setMsg({ type: "error", text: "Branch and Room Name are required" });
    }

    try {
      setLoading(true);

      if (isEditMode && currentRoomId) {
        // Update existing room
        await api.put(`/update_rooms/${currentRoomId}`, {
          name: form.name,
          branch_id: form.branch_id
        });
        setMsg({ type: "success", text: "Room updated successfully ✅" });
        
        // Refresh room list
        await fetchRooms();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        // Create new room
        await api.post("/create_rooms", {
          name: form.name,
          branch_id: form.branch_id
        });
        setMsg({ type: "success", text: "Room added successfully ✅" });
        
        // Reset form
        setForm({
          branch_id: "",
          name: ""
        });
        
        // Refresh room list
        await fetchRooms();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error saving room ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete room
  const handleDelete = async (roomId, roomName) => {
    if (!window.confirm(`Are you sure you want to delete room "${roomName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/delete_rooms/${roomId}`);
      setMsg({ type: "success", text: "Room deleted successfully ✅" });
      await fetchRooms();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting room ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="room-management">
      {/* Header Section */}
      <div className="room-header">
        <div className="room-header-title">
          <h1>Room Management</h1>
          <p>Manage classrooms, labs, and facilities across branches</p>
        </div>
        <button className="room-add-btn" onClick={openAddModal}>
          + Add New Room
        </button>
      </div>

      {/* Message Alert */}
      {msg.text && (
        <div className={`room-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="room-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Rooms List Table */}
      <div className="room-table-container">
        <div className="room-table-header">
          <h3>All Rooms</h3>
          <span className="room-record-badge">{rooms.length} room(s) found</span>
        </div>
        
        {fetchLoading && rooms.length === 0 ? (
          <div className="room-loading-state">
            <div className="room-spinner"></div>
            <p>Loading rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="room-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
              <path d="M4 7h16" />
              <path d="M4 11h16" />
            </svg>
            <p>No rooms found. Click "Add New Room" to get started.</p>
          </div>
        ) : (
          <div className="room-table-responsive">
            <table className="room-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Room Name</th>
                  <th>Branch</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room, index) => (
                  <tr key={room.id}>
                    <td className="room-sno">{index + 1}</td>
                    <td className="room-name-cell">
                      <div className="room-name-wrapper">
                        <span className="room-icon">🏠</span>
                        <strong>{room.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="room-branch-badge">
                        {room.branch_name || room.branch || "—"}
                      </span>
                    </td>
                    <td>
                      {room.created_at ? new Date(room.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <div className="room-action-btns">
                        <button 
                          className="room-btn-edit" 
                          onClick={() => openEditModal(room)}
                          title="Edit room"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="room-btn-delete" 
                          onClick={() => handleDelete(room.id, room.name)}
                          title="Delete room"
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
        <div className="room-modal-overlay" onClick={closeModal}>
          <div className="room-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="room-modal-header">
              <h2>{isEditMode ? "✏️ Edit Room" : "➕ Add New Room"}</h2>
              <button className="room-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="room-modal-form">
              <div className="room-form-row">
                <div className="room-form-group full-width">
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
                  <small className="room-field-hint">Select the branch for this room</small>
                </div>
              </div>

              <div className="room-form-row">
                <div className="room-form-group full-width">
                  <label>Room Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g., Room 101, Lab 202, Auditorium, Conference Hall"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <small className="room-field-hint">Enter a descriptive name for the room</small>
                </div>
              </div>

              {msg.text && (
                <div className={`room-form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="room-modal-actions">
                <button type="submit" className="room-btn-submit" disabled={loading}>
                  {loading ? "Saving..." : (isEditMode ? "Update Room" : "Create Room")}
                </button>
                <button type="button" className="room-btn-cancel" onClick={closeModal}>
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

export default RoomManagement;