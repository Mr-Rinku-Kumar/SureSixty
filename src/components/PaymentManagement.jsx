import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/PaymentManagement.css";

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

const PaymentManagement = () => {
  const [branches, setBranches] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState(null);
  
  const [form, setForm] = useState({
    branch_id: "",
    name: ""
  });

  // 📥 Fetch branches and payment modes on load
  useEffect(() => {
    fetchBranches();
    fetchPaymentModes();
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

  const fetchPaymentModes = async () => {
    try {
      setFetchLoading(true);
      const res = await api.get("/view_payment_modes");
      setPaymentModes(res.data.data || []);
    } catch (err) {
      console.error("Error fetching payment modes", err);
      setMsg({ type: "error", text: "Failed to fetch payment modes" });
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
    setCurrentPaymentId(null);
    setForm({
      branch_id: "",
      name: ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // ✏️ Open modal for Edit
  const openEditModal = (paymentMode) => {
    setIsEditMode(true);
    setCurrentPaymentId(paymentMode.id);
    setForm({
      branch_id: paymentMode.branch_id || "",
      name: paymentMode.name || ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // 🚀 Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentPaymentId(null);
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
      return setMsg({ type: "error", text: "Branch and Payment Mode Name are required" });
    }

    try {
      setLoading(true);

      if (isEditMode && currentPaymentId) {
        // Update existing payment mode
        await api.put(`/update_payment_modes/${currentPaymentId}`, {
          name: form.name,
          branch_id: form.branch_id
        });
        setMsg({ type: "success", text: "Payment mode updated successfully ✅" });
        
        // Refresh payment modes list
        await fetchPaymentModes();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        // Create new payment mode
        await api.post("/create_payment_modes", {
          name: form.name,
          branch_id: form.branch_id
        });
        setMsg({ type: "success", text: "Payment mode added successfully ✅" });
        
        // Reset form
        setForm({
          branch_id: "",
          name: ""
        });
        
        // Refresh payment modes list
        await fetchPaymentModes();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error saving payment mode ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete payment mode
  const handleDelete = async (paymentId, paymentName) => {
    if (!window.confirm(`Are you sure you want to delete payment mode "${paymentName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/delete_payment_modes/${paymentId}`);
      setMsg({ type: "success", text: "Payment mode deleted successfully ✅" });
      await fetchPaymentModes();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting payment mode ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Get icon for payment mode
  const getPaymentIcon = (paymentName) => {
    const name = paymentName.toLowerCase();
    if (name.includes('cash')) return '💵';
    if (name.includes('card') || name.includes('credit') || name.includes('debit')) return '💳';
    if (name.includes('upi') || name.includes('google pay') || name.includes('phonepe')) return '📱';
    if (name.includes('net banking') || name.includes('online')) return '🏦';
    if (name.includes('cheque')) return '📝';
    if (name.includes('wallet')) return '👛';
    return '💰';
  };

  return (
    <div className="paymentMNG-management">
      {/* Header Section */}
      <div className="paymentMNG-header">
        <div className="paymentMNG-header-title">
          <h1>Payment Management</h1>
          <p>Manage payment modes, assign branches, and track transaction methods</p>
        </div>
        <button className="paymentMNG-add-btn" onClick={openAddModal}>
          + Add New Payment Mode
        </button>
      </div>

      {/* Message Alert */}
      {msg.text && (
        <div className={`paymentMNG-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="paymentMNG-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Payment Modes List Table */}
      <div className="paymentMNG-table-container">
        <div className="paymentMNG-table-header">
          <h3>All Payment Modes</h3>
          <span className="paymentMNG-record-badge">{paymentModes.length} payment mode(s) found</span>
        </div>
        
        {fetchLoading && paymentModes.length === 0 ? (
          <div className="paymentMNG-loading-state">
            <div className="paymentMNG-spinner"></div>
            <p>Loading payment modes...</p>
          </div>
        ) : paymentModes.length === 0 ? (
          <div className="paymentMNG-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <p>No payment modes found. Click "Add New Payment Mode" to get started.</p>
          </div>
        ) : (
          <div className="paymentMNG-table-responsive">
            <table className="paymentMNG-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Payment Mode</th>
                  <th>Branch</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentModes.map((payment, index) => (
                  <tr key={payment.id}>
                    <td className="paymentMNG-sno">{index + 1}</td>
                    <td className="paymentMNG-name-cell">
                      <div className="paymentMNG-name-wrapper">
                        <span className="paymentMNG-icon">{getPaymentIcon(payment.name)}</span>
                        <strong>{payment.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="paymentMNG-branch-badge">
                        {payment.branch_name || payment.branch || "—"}
                      </span>
                    </td>
                    <td>
                      {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <div className="paymentMNG-action-btns">
                        <button 
                          className="paymentMNG-btn-edit" 
                          onClick={() => openEditModal(payment)}
                          title="Edit payment mode"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="paymentMNG-btn-delete" 
                          onClick={() => handleDelete(payment.id, payment.name)}
                          title="Delete payment mode"
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
        <div className="paymentMNG-modal-overlay" onClick={closeModal}>
          <div className="paymentMNG-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="paymentMNG-modal-header">
              <h2>{isEditMode ? "✏️ Edit Payment Mode" : "➕ Add New Payment Mode"}</h2>
              <button className="paymentMNG-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="paymentMNG-modal-form">
              <div className="paymentMNG-form-row">
                <div className="paymentMNG-form-group full-width">
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
                  <small className="paymentMNG-field-hint">Select the branch for this payment mode</small>
                </div>
              </div>

              <div className="paymentMNG-form-row">
                <div className="paymentMNG-form-group full-width">
                  <label>Payment Mode Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g., Cash, Credit Card, UPI, Net Banking, Cheque, Wallet"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <small className="paymentMNG-field-hint">Enter a payment method (Cash, Card, UPI, etc.)</small>
                </div>
              </div>

              {msg.text && (
                <div className={`paymentMNG-form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="paymentMNG-modal-actions">
                <button type="submit" className="paymentMNG-btn-submit" disabled={loading}>
                  {loading ? "Saving..." : (isEditMode ? "Update Payment Mode" : "Create Payment Mode")}
                </button>
                <button type="button" className="paymentMNG-btn-cancel" onClick={closeModal}>
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

export default PaymentManagement;