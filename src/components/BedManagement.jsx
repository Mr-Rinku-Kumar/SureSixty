import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/BedManagement.css";

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

const BedManagement = () => {
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBedId, setCurrentBedId] = useState(null);
  
  const [form, setForm] = useState({
    branch_id: "",
    room_id: "",
    name: ""
  });

  // 📥 Fetch branches, rooms, and beds on load
  useEffect(() => {
    fetchBranches();
    fetchRooms(); // Fetch all rooms initially
    fetchBeds(); // Fetch all beds (no branch filter)
  }, []);

  // Fetch rooms when branch is selected in modal
  useEffect(() => {
    if (form.branch_id && showModal) {
      fetchRoomsByBranch(form.branch_id);
    } else if (!form.branch_id && showModal) {
      setRooms([]);
    }
  }, [form.branch_id, showModal]);

  const fetchBranches = async () => {
    try {
      const res = await api.get("/view_branches");
      setBranches(res.data.data || []);
    } catch (err) {
      console.error("Branch fetch error", err);
      setMsg({ type: "error", text: "Failed to fetch branches" });
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get("/view_rooms");
      setRooms(res.data.data || []);
    } catch (err) {
      console.error("Room fetch error", err);
    }
  };

  const fetchRoomsByBranch = async (branchId) => {
    try {
      const res = await api.get("/view_rooms", {
        params: { branch_id: branchId }
      });
      setRooms(res.data.data || []);
    } catch (err) {
      console.error("Room fetch error", err);
      setRooms([]);
    }
  };

  const fetchBeds = async () => {
    try {
      setFetchLoading(true);
      // Fetch all beds without branch filter
      const res = await api.get("/view_beds");
      setBeds(res.data.data || []);
    } catch (err) {
      console.error("Error fetching beds", err);
      setMsg({ type: "error", text: "Failed to fetch beds" });
    } finally {
      setFetchLoading(false);
    }
  };

  // ✏️ Handle input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear room selection when branch changes
    if (name === "branch_id") {
      setForm(prev => ({
        ...prev,
        room_id: ""
      }));
    }
  };

  // 🚀 Open modal for Add
  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentBedId(null);
    setForm({
      branch_id: "",
      room_id: "",
      name: ""
    });
    setRooms([]);
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // ✏️ Open modal for Edit
  const openEditModal = (bed) => {
    setIsEditMode(true);
    setCurrentBedId(bed.id);
    setForm({
      branch_id: bed.branch_id || "",
      room_id: bed.room_id || "",
      name: bed.name || ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
    
    // Fetch rooms for the selected branch
    if (bed.branch_id) {
      fetchRoomsByBranch(bed.branch_id);
    }
  };

  // 🚀 Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentBedId(null);
    setForm({
      branch_id: "",
      room_id: "",
      name: ""
    });
    setRooms([]);
    setMsg({ type: "", text: "" });
  };

  // 🚀 Submit form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!form.branch_id || !form.name) {
      return setMsg({ type: "error", text: "Branch and Bed Name are required" });
    }

    try {
      setLoading(true);

      if (isEditMode && currentBedId) {
        // Update existing bed
        await api.put(`/update_beds/${currentBedId}`, {
          name: form.name,
          room_id: form.room_id || null,
          branch_id: form.branch_id
        });
        setMsg({ type: "success", text: "Bed updated successfully ✅" });
        
        // Refresh bed list
        await fetchBeds();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        // Create new bed
        await api.post("/create_beds", {
          name: form.name,
          room_id: form.room_id || null,
          branch_id: form.branch_id
        });
        setMsg({ type: "success", text: "Bed added successfully ✅" });
        
        // Reset form
        setForm({
          branch_id: "",
          room_id: "",
          name: ""
        });
        
        // Refresh bed list
        await fetchBeds();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error saving bed ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete bed
  const handleDelete = async (bedId, bedName) => {
    if (!window.confirm(`Are you sure you want to delete bed "${bedName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/delete_beds/${bedId}`);
      setMsg({ type: "success", text: "Bed deleted successfully ✅" });
      await fetchBeds();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting bed ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Helper to get room name by ID
  const getRoomName = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : "—";
  };

  // Helper to get branch name by ID
  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId || b.branch_id === branchId);
    return branch ? (branch.name || branch.branch_name) : branchId || "—";
  };

  // Check if branch is selected in form
  const isBranchSelected = !!form.branch_id;

  return (
    <div className="BMNG-management">
      {/* Header Section */}
      <div className="BMNG-header">
        <div className="BMNG-header-title">
          <h1>Bed Management</h1>
          <p>Manage beds, assign rooms and branches, track occupancy</p>
        </div>
        <button className="BMNG-add-btn" onClick={openAddModal}>
          + Add New Bed
        </button>
      </div>

      {/* Message Alert */}
      {msg.text && (
        <div className={`BMNG-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="BMNG-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Beds List Table - Shows ALL beds from ALL branches */}
      <div className="BMNG-table-container">
        <div className="BMNG-table-header">
          <h3>All Beds</h3>
          <span className="BMNG-record-badge">{beds.length} bed(s) found</span>
        </div>
        
        {fetchLoading && beds.length === 0 ? (
          <div className="BMNG-loading-state">
            <div className="BMNG-spinner"></div>
            <p>Loading beds...</p>
          </div>
        ) : beds.length === 0 ? (
          <div className="BMNG-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="8" width="18" height="12" rx="2" />
              <path d="M7 8V4h10v4" />
              <path d="M7 12h10" />
              <path d="M7 16h4" />
              <path d="M13 16h4" />
            </svg>
            <p>No beds found. Click "Add New Bed" to get started.</p>
          </div>
        ) : (
          <div className="BMNG-table-responsive">
            <table className="BMNG-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Bed Name</th>
                  <th>Room</th>
                  <th>Branch</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {beds.map((bed, index) => (
                  <tr key={bed.id}>
                    <td className="BMNG-sno">{index + 1}</td>
                    <td className="BMNG-name-cell">
                      <div className="BMNG-name-wrapper">
                        <span className="BMNG-icon">🛏️</span>
                        <strong>{bed.name}</strong>
                      </div>
                    </td>
                    <td>
                      {bed.room_id ? (
                        <span className="BMNG-room-badge">
                          {bed.room_name || getRoomName(bed.room_id)}
                        </span>
                      ) : (
                        <span className="BMNG-unassigned">Not Assigned</span>
                      )}
                    </td>
                    <td>
                      <span className="BMNG-branch-badge">
                        {bed.branch_name || getBranchName(bed.branch_id)}
                      </span>
                    </td>
                    <td>
                      {bed.created_at ? new Date(bed.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <div className="BMNG-action-btns">
                        <button 
                          className="BMNG-btn-edit" 
                          onClick={() => openEditModal(bed)}
                          title="Edit bed"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="BMNG-btn-delete" 
                          onClick={() => handleDelete(bed.id, bed.name)}
                          title="Delete bed"
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
        <div className="BMNG-modal-overlay" onClick={closeModal}>
          <div className="BMNG-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="BMNG-modal-header">
              <h2>{isEditMode ? "✏️ Edit Bed" : "➕ Add New Bed"}</h2>
              <button className="BMNG-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="BMNG-modal-form">
              <div className="BMNG-form-row">
                <div className="BMNG-form-group full-width">
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
                  <small className="BMNG-field-hint">Select branch first to load related rooms</small>
                </div>
              </div>

              <div className="BMNG-form-row">
                <div className="BMNG-form-group">
                  <label>Room (Optional)</label>
                  <select
                    name="room_id"
                    value={form.room_id}
                    onChange={handleChange}
                    disabled={!isBranchSelected}
                  >
                    <option value="">
                      {isBranchSelected ? "Select Room (Optional)" : "Please select branch first"}
                    </option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                  {/* {!isBranchSelected && (
                    <small className="BMNG-field-hint error-hint">⚠️ Please select branch first</small>
                  )} */}
                  {isBranchSelected && rooms.length === 0 && (
                    <small className="BMNG-field-hint">No rooms available for this branch</small>
                  )}
                  {isBranchSelected && rooms.length > 0 && (
                    <small className="BMNG-field-hint">Assign bed to a specific room (optional)</small>
                  )}
                </div>

                <div className="BMNG-form-group">
                  <label>Bed Name <span className="required-star">*</span></label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g., Bed A, Bed B, Bed 101, Upper Bunk, Lower Bunk"
                    value={form.name}
                    onChange={handleChange}
                    required
                    disabled={!isBranchSelected}
                  />
                  {/* {!isBranchSelected && (
                    <small className="BMNG-field-hint error-hint">⚠️ Please select branch first</small>
                  )} */}
                  {isBranchSelected && (
                    <small className="BMNG-field-hint">Enter a descriptive name for the bed</small>
                  )}
                </div>
              </div>

              {msg.text && (
                <div className={`BMNG-form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="BMNG-modal-actions">
                <button 
                  type="submit" 
                  className="BMNG-btn-submit" 
                  disabled={loading || !isBranchSelected}
                >
                  {loading ? "Saving..." : (isEditMode ? "Update Bed" : "Create Bed")}
                </button>
                <button type="button" className="BMNG-btn-cancel" onClick={closeModal}>
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

export default BedManagement;