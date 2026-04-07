import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/FeeManagement.css";

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
      localStorage.removeItem("branch_id");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const FeeManagement = () => {
  const [branches, setBranches] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [paymentModes, setPaymentModes] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [feeCollections, setFeeCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentFeeId, setCurrentFeeId] = useState(null);
  const [studentSearchId, setStudentSearchId] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  
  // Months array for Monthly fee type
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const [form, setForm] = useState({
    branch_id: "",
    employee_app_id: "",
    fees_type: "",
    admission_fees: "",
    security_fees: "",
    course_fees: "",
    payment_mode_id: "",
    fee_collection_date: "",
    fee_collection_month: "",
    fee_collection_from_date: "",
    fee_collection_to_date: "",
    month: "",
    year: new Date().getFullYear().toString()
  });

  // 📥 Fetch branches, payment modes, fee types on load
  useEffect(() => {
    fetchBranches();
    fetchPaymentModes();
    fetchFeeTypes();
  }, []);

  // Fetch fee collections when branch filter changes
  useEffect(() => {
    fetchFeeCollections();
  }, [branchFilter]);

  // ✅ Search student by ID from DB
  const searchStudentById = async () => {
    if (!studentSearchId.trim()) {
      setSelectedStudent(null);
      setStudentDetails(null);
      setForm(prev => ({ ...prev, employee_app_id: "", branch_id: "", fees_type: "", course_fees: "" }));
      return;
    }

    setStudentSearchLoading(true);
    try {
      const res = await api.get("/view_students", {
        params: { id: studentSearchId.trim() }
      });
      
      const students = res.data.students || [];
      if (students.length > 0) {
        const student = students[0];
        setSelectedStudent(student);
        
        const employeeAppId = student.student_id || student.id || studentSearchId.trim();
        
        setStudentDetails({
          id: student.id,
          name: student.name,
          student_id: student.student_id,
          branch_id: student.branch_id,
          branch_name: student.branch_name,
          course: student.course || "Not Assigned",
          course_fee: student.course_fee || 0,
          duration: student.duration || "Not Assigned",
          fees_type_id: student.fees_type,
          fees_type_name: student.fees_type_name || "Not Assigned",
          phone: student.parent_contact || student.phone,
        });
        
        setForm(prev => ({
          ...prev,
          employee_app_id: employeeAppId,
          branch_id: student.branch_id,
          fees_type: student.fees_type?.toString() || "",
          course_fees: student.course_fee?.toString() || ""
        }));
        
        setMsg({ type: "success", text: `Student found: ${student.name} (ID: ${employeeAppId})` });
        setTimeout(() => setMsg({ type: "", text: "" }), 3000);
      } else {
        setSelectedStudent(null);
        setStudentDetails(null);
        setForm(prev => ({ ...prev, employee_app_id: "", branch_id: "", fees_type: "", course_fees: "" }));
        setMsg({ type: "error", text: "No student found with this ID" });
      }
    } catch (err) {
      console.error("Student search error", err);
      setSelectedStudent(null);
      setStudentDetails(null);
      setForm(prev => ({ ...prev, employee_app_id: "", branch_id: "", fees_type: "", course_fees: "" }));
      setMsg({ type: "error", text: "Error searching student" });
    } finally {
      setStudentSearchLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get("/view_branches");
      setBranches(res.data.data || []);
    } catch (err) {
      console.error("Branch fetch error", err);
      setMsg({ type: "error", text: "Failed to fetch branches" });
    }
  };

  const fetchPaymentModes = async () => {
    try {
      const res = await api.get("/view_payment_modes");
      setPaymentModes(res.data.data || []);
    } catch (err) {
      console.error("Payment mode fetch error", err);
    }
  };

  const fetchFeeTypes = async () => {
    try {
      const res = await api.get("/view_fees-types");
      setFeeTypes(res.data.data || []);
    } catch (err) {
      console.error("Fee type fetch error", err);
    }
  };

  const fetchFeeCollections = async () => {
    try {
      setFetchLoading(true);
      const params = {};
      if (branchFilter) {
        params.branch_id = branchFilter;
      }
      const res = await api.get("/view_fee_collections", { params });
      setFeeCollections(res.data.data || []);
    } catch (err) {
      console.error("Error fetching fee collections", err);
      setMsg({ type: "error", text: "Failed to fetch fee collections" });
    } finally {
      setFetchLoading(false);
    }
  };

  // ✏️ Handle input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Get fee type name by ID
  const getFeeTypeName = (feeTypeId) => {
    const feeType = feeTypes.find(ft => ft.id === feeTypeId);
    return feeType ? feeType.name : "—";
  };

  // Get student's fee type name
  const getStudentFeeTypeName = () => {
    const feeType = feeTypes.find(ft => ft.id === parseInt(form.fees_type));
    return feeType ? feeType.name : "Not Assigned";
  };

  // Check if fee type is Monthly (id=0)
  const isMonthlyFeeType = () => {
    return parseInt(form.fees_type) === 0;
  };

  // Render dynamic fee collection fields based on fee type
  const renderDynamicFeeFields = () => {
    const feeTypeId = parseInt(form.fees_type);
    
    if (!form.fees_type || isNaN(feeTypeId)) {
      return (
        <div className="FeeMNG-form-row">
          <div className="FeeMNG-form-group full-width">
            <div className="FeeMNG-warning-message">
              ⚠️ No fee type assigned to this student. Please update student's fee type first.
            </div>
          </div>
        </div>
      );
    }
    
    // For Monthly fee type (id=0) - show only month dropdown
    if (feeTypeId === 0) {
      return (
        <div className="FeeMNG-form-row">
          <div className="FeeMNG-form-group">
            <label>Select Month <span className="required-star">*</span></label>
            <select
              name="month"
              value={form.month}
              onChange={handleChange}
              required
            >
              <option value="">Select Month</option>
              {months.map((month, index) => (
                <option key={index} value={month}>
                  {month} - {form.year}
                </option>
              ))}
            </select>
          </div>
          <div className="FeeMNG-form-group">
            <label>Year</label>
            <select name="year" value={form.year} onChange={handleChange}>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
        </div>
      );
    }
    
    // For all other fee types (Quarterly, Yearly, Full-Time, 6 Months) - show from date and to date
    return (
      <div className="FeeMNG-form-row">
        <div className="FeeMNG-form-group">
          <label>Fee Collection From Date</label>
          <input
            type="datetime-local"
            name="fee_collection_from_date"
            value={form.fee_collection_from_date}
            onChange={handleChange}
          />
        </div>
        <div className="FeeMNG-form-group">
          <label>Fee Collection To Date</label>
          <input
            type="datetime-local"
            name="fee_collection_to_date"
            value={form.fee_collection_to_date}
            onChange={handleChange}
          />
        </div>
      </div>
    );
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentFeeId(null);
    setStudentSearchId("");
    setSelectedStudent(null);
    setStudentDetails(null);
    const today = new Date().toISOString().slice(0, 16);
    setForm({
      branch_id: "",
      employee_app_id: "",
      fees_type: "",
      admission_fees: "",
      security_fees: "",
      course_fees: "",
      payment_mode_id: "",
      fee_collection_date: today,
      fee_collection_month: "",
      fee_collection_from_date: "",
      fee_collection_to_date: "",
      month: "",
      year: new Date().getFullYear().toString()
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  const openEditModal = (fee) => {
    setIsEditMode(true);
    setCurrentFeeId(fee.id);
    setStudentSearchId(fee.employee_app_id || "");
    setSelectedStudent({
      id: fee.employee_app_id,
      name: fee.name,
      student_id: fee.employee_app_id
    });
    setStudentDetails({
      name: fee.name,
      student_id: fee.employee_app_id,
      course: fee.course_name || "—",
      duration: fee.duration_name || "—"
    });
    setForm({
      branch_id: fee.branch || fee.branch_id || "",
      employee_app_id: fee.employee_app_id || "",
      fees_type: fee.fees_type?.toString() || "",
      admission_fees: fee.admission_fees?.toString() || "",
      security_fees: fee.security_fees?.toString() || "",
      course_fees: fee.course_fees?.toString() || "",
      payment_mode_id: fee.payment_mode_id || "",
      fee_collection_date: fee.date ? fee.date.slice(0, 16) : new Date().toISOString().slice(0, 16),
      fee_collection_month: fee.fee_collection_month || "",
      fee_collection_from_date: fee.fee_collection_from_date || "",
      fee_collection_to_date: fee.fee_collection_to_date || "",
      month: fee.month || "",
      year: fee.year || new Date().getFullYear().toString()
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentFeeId(null);
    setStudentSearchId("");
    setSelectedStudent(null);
    setStudentDetails(null);
    setForm({
      branch_id: "",
      employee_app_id: "",
      fees_type: "",
      admission_fees: "",
      security_fees: "",
      course_fees: "",
      payment_mode_id: "",
      fee_collection_date: "",
      fee_collection_month: "",
      fee_collection_from_date: "",
      fee_collection_to_date: "",
      month: "",
      year: new Date().getFullYear().toString()
    });
    setMsg({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!form.branch_id || !form.employee_app_id || !form.payment_mode_id || !form.fees_type) {
      return setMsg({ type: "error", text: "Branch, Student, Fee Type, and Payment Mode are required" });
    }

    const feeTypeId = parseInt(form.fees_type);
    
    // Prepare fee collection month based on selection
    let feeCollectionMonth = "";
    if (feeTypeId === 0 && form.month) {
      feeCollectionMonth = `${form.month} ${form.year}`;
    }

    const courseFee = parseFloat(form.course_fees) || 0;
    if (courseFee <= 0) {
      return setMsg({ type: "error", text: "Course fee amount must be greater than 0" });
    }

    try {
      setLoading(true);

      const payload = {
        employee_app_id: form.employee_app_id,
        fees_type: parseInt(form.fees_type),
        admission_fees: parseFloat(form.admission_fees) || 0,
        security_fees: parseFloat(form.security_fees) || 0,
        course_fees: courseFee,
        payment_mode_id: form.payment_mode_id,
        fee_collection_date: form.fee_collection_date,
        fee_collection_month: feeCollectionMonth,
        fee_collection_from_date: form.fee_collection_from_date || null,
        fee_collection_to_date: form.fee_collection_to_date || null,
        branch_id: form.branch_id
      };

      console.log("Sending payload:", payload);

      if (isEditMode && currentFeeId) {
        await api.put(`/update_fee_collections/${currentFeeId}`, payload);
        setMsg({ type: "success", text: "Fee collection updated successfully ✅" });
        await fetchFeeCollections();
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        await api.post("/create_fee_collections", payload);
        setMsg({ type: "success", text: "Fee collection added successfully ✅" });
        setForm({
          branch_id: "",
          employee_app_id: "",
          fees_type: "",
          admission_fees: "",
          security_fees: "",
          course_fees: "",
          payment_mode_id: "",
          fee_collection_date: new Date().toISOString().slice(0, 16),
          fee_collection_month: "",
          fee_collection_from_date: "",
          fee_collection_to_date: "",
          month: "",
          year: new Date().getFullYear().toString()
        });
        setStudentSearchId("");
        setSelectedStudent(null);
        setStudentDetails(null);
        await fetchFeeCollections();
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error saving fee collection ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feeId) => {
    if (!window.confirm(`Are you sure you want to delete this fee collection record? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/delete_fee_collections/${feeId}`);
      setMsg({ type: "success", text: "Fee collection deleted successfully ✅" });
      await fetchFeeCollections();
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting fee collection ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentModeName = (paymentId) => {
    const payment = paymentModes.find(p => p.id === paymentId);
    return payment ? payment.name : "—";
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

  const calculateTotal = (admission, security, course) => {
    return (admission || 0) + (security || 0) + (course || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
    <div className="FeeMNG-management">
      <div className="FeeMNG-header">
        <div className="FeeMNG-header-title">
          <h1>Fee Management</h1>
          <p>Manage fee collections based on student's fee type</p>
        </div>
        <button className="FeeMNG-add-btn" onClick={openAddModal}>
          + Add Fee Collection
        </button>
      </div>

      {msg.text && (
        <div className={`FeeMNG-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="FeeMNG-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      <div className="FeeMNG-branch-filter">
        <label>Filter Fee Collections by Branch:</label>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="FeeMNG-branch-select"
        >
          <option value="">All Branches</option>
          {branches.map((branch) => (
            <option key={branch.id || branch.branch_id} value={branch.id || branch.branch_id}>
              {branch.name || branch.branch_name}
            </option>
          ))}
        </select>
      </div>

      <div className="FeeMNG-table-container">
        <div className="FeeMNG-table-header">
          <h3>Fee Collection History</h3>
          <span className="FeeMNG-record-badge">{feeCollections.length} record(s) found</span>
        </div>
        
        {fetchLoading && feeCollections.length === 0 ? (
          <div className="FeeMNG-loading-state">
            <div className="FeeMNG-spinner"></div>
            <p>Loading fee collections...</p>
          </div>
        ) : feeCollections.length === 0 ? (
          <div className="FeeMNG-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <p>No fee collections found. Click "Add Fee Collection" to get started.</p>
          </div>
        ) : (
          <div className="FeeMNG-table-responsive">
            <table className="FeeMNG-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Fee Type</th>
                  <th>Month/Period</th>
                  <th>Course Fee</th>
                  <th>Admission Fee</th>
                  <th>Security Fee</th>
                  <th>Total</th>
                  <th>Payment Mode</th>
                  <th>Collection Date</th>
                  <th>From Date</th>
                  <th>To Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeCollections.map((fee, index) => {
                  const total = calculateTotal(fee.admission_fees, fee.security_fees, fee.course_fees);
                  return (
                    <tr key={fee.id}>
                      <td className="FeeMNG-sno">{index + 1}</td>
                      <td className="FeeMNG-student-id-cell">
                        <code className="FeeMNG-id-code">{fee.employee_app_id}</code>
                      </td>
                      <td className="FeeMNG-student-cell">
                        <div className="FeeMNG-student-wrapper">
                          <span className="FeeMNG-icon">👨‍🎓</span>
                          <strong>{fee.name || "—"}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="FeeMNG-fee-type-badge">
                          {getFeeTypeName(fee.fees_type)}
                        </span>
                      </td>
                      <td className="FeeMNG-period-cell">
                        {fee.fee_collection_month || "—"}
                      </td>
                      <td className="FeeMNG-amount">{formatCurrency(fee.course_fees)}</td>
                      <td className="FeeMNG-amount">{formatCurrency(fee.admission_fees)}</td>
                      <td className="FeeMNG-amount">{formatCurrency(fee.security_fees)}</td>
                      <td className="FeeMNG-total-amount">
                        <strong>{formatCurrency(total)}</strong>
                      </td>
                      <td>
                        <span className="FeeMNG-payment-badge">
                          {getPaymentModeName(fee.payment_mode_id)}
                        </span>
                      </td>
                      <td className="FeeMNG-date-cell">
                        {formatDate(fee.date)}
                      </td>
                      <td className="FeeMNG-date-cell">
                        {formatDate(fee.fee_collection_from_date)}
                      </td>
                      <td className="FeeMNG-date-cell">
                        {formatDate(fee.fee_collection_to_date)}
                      </td>
                      <td>
                        <div className="FeeMNG-action-btns">
                          <button className="FeeMNG-btn-edit" onClick={() => openEditModal(fee)}>✏️ Edit</button>
                          <button className="FeeMNG-btn-delete" onClick={() => handleDelete(fee.id)}>🗑️ Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="FeeMNG-modal-overlay" onClick={closeModal}>
          <div className="FeeMNG-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="FeeMNG-modal-header">
              <h2>{isEditMode ? "✏️ Edit Fee Collection" : "➕ New Fees Collection"}</h2>
              <button className="FeeMNG-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="FeeMNG-modal-form">
              <div className="FeeMNG-form-row">
                <div className="FeeMNG-form-group">
                  <label>Roll No <span className="required-star">*</span></label>
                  <div className="FeeMNG-student-search-wrapper">
                    <input
                      type="text"
                      placeholder="Enter Roll No"
                      value={studentSearchId}
                      onChange={(e) => setStudentSearchId(e.target.value)}
                      className="FeeMNG-student-search-input"
                      disabled={isEditMode}
                    />
                    <button
                      type="button"
                      onClick={searchStudentById}
                      className="FeeMNG-search-btn"
                      disabled={studentSearchLoading || !studentSearchId.trim() || isEditMode}
                    >
                      {studentSearchLoading ? "🔍 Searching..." : "Check"}
                    </button>
                  </div>
                  <small className="FeeMNG-field-hint">Enter student roll number and click Check</small>
                </div>

                <div className="FeeMNG-form-group">
                  <label>Branch <span className="required-star">*</span></label>
                  <select
                    name="branch_id"
                    value={form.branch_id}
                    onChange={handleChange}
                    required
                    disabled={!selectedStudent && !isEditMode}
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id || branch.branch_id} value={branch.id || branch.branch_id}>
                        {branch.name || branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {studentDetails && (
                <div className="FeeMNG-student-details-card">
                  <div className="FeeMNG-student-details-row">
                    <div className="FeeMNG-student-detail-item">
                      <strong>Student Name:</strong> {studentDetails.name}
                    </div>
                    <div className="FeeMNG-student-detail-item">
                      <strong>Student ID:</strong> {studentDetails.student_id}
                    </div>
                  </div>
                  <div className="FeeMNG-student-details-row">
                    <div className="FeeMNG-student-detail-item">
                      <strong>Course:</strong> {studentDetails.course}
                    </div>
                    <div className="FeeMNG-student-detail-item">
                      <strong>Duration:</strong> {studentDetails.duration}
                    </div>
                  </div>
                </div>
              )}

              {form.fees_type && (
                <div className="FeeMNG-fee-type-section">
                  <h4>Fees Type: <span className="FeeMNG-fee-type-value">{getStudentFeeTypeName()}</span></h4>
                </div>
              )}

              {renderDynamicFeeFields()}

              <div className="FeeMNG-form-row">
                <div className="FeeMNG-form-group">
                  <label>Fees Collection Date <span className="required-star">*</span></label>
                  <input
                    type="datetime-local"
                    name="fee_collection_date"
                    value={form.fee_collection_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="FeeMNG-form-group">
                  <label>Course Fees <span className="required-star">*</span></label>
                  <input
                    type="number"
                    name="course_fees"
                    placeholder="Fees"
                    value={form.course_fees}
                    onChange={handleChange}
                    required
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              <div className="FeeMNG-form-row">
                <div className="FeeMNG-form-group">
                  <label>Admission Fees</label>
                  <input
                    type="number"
                    name="admission_fees"
                    placeholder="0"
                    value={form.admission_fees}
                    onChange={handleChange}
                    min="0"
                    step="1"
                  />
                </div>

                <div className="FeeMNG-form-group">
                  <label>Security Money</label>
                  <input
                    type="number"
                    name="security_fees"
                    placeholder="0"
                    value={form.security_fees}
                    onChange={handleChange}
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              <div className="FeeMNG-form-row">
                <div className="FeeMNG-form-group">
                  <label>Mode of Payment <span className="required-star">*</span></label>
                  <select
                    name="payment_mode_id"
                    value={form.payment_mode_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Any Payment Mode</option>
                    {paymentModes.map((mode) => (
                      <option key={mode.id} value={mode.id}>
                        {mode.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="FeeMNG-total-preview">
                <span>Total Amount: </span>
                <strong>
                  {formatCurrency(
                    (parseFloat(form.admission_fees) || 0) +
                    (parseFloat(form.security_fees) || 0) +
                    (parseFloat(form.course_fees) || 0)
                  )}
                </strong>
              </div>

              {msg.text && (
                <div className={`FeeMNG-form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="FeeMNG-modal-actions">
                <button 
                  type="submit" 
                  className="FeeMNG-btn-submit" 
                  disabled={loading || (!selectedStudent && !isEditMode)}
                >
                  {loading ? "Saving..." : (isEditMode ? "Update Fee Collection" : "Submit")}
                </button>
                <button type="button" className="FeeMNG-btn-cancel" onClick={closeModal}>
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

export default FeeManagement;