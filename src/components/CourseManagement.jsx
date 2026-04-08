import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/CourseManagement.css";

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
      localStorage.removeItem("branch_id");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const CourseManagement = () => {
  const [branches, setBranches] = useState([]);
  const [durations, setDurations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCourseId, setCurrentCourseId] = useState(null);
  
  const [form, setForm] = useState({
    branch_id: "",
    duration_id: "",
    name: "",
    code: "",
    description: "",
    course_fee: ""
  });

  // 📥 Fetch branches, durations, and courses on load
  useEffect(() => {
    fetchBranches();
    fetchDurations();
    fetchCourses();
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

  const fetchDurations = async () => {
    try {
      const res = await api.get("/view_durations");
      setDurations(res.data.data || []);
    } catch (err) {
      console.error("Duration fetch error", err);
      setMsg({ type: "error", text: "Failed to fetch durations" });
    }
  };

  const fetchCourses = async () => {
    try {
      setFetchLoading(true);
      const res = await api.get("/view_courses");
      setCourses(res.data.data || []);
    } catch (err) {
      console.error("Error fetching courses", err);
      setMsg({ type: "error", text: "Failed to fetch courses" });
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
    setCurrentCourseId(null);
    setForm({
      branch_id: "",
      duration_id: "",
      name: "",
      code: "",
      description: "",
      course_fee: ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // ✏️ Open modal for Edit
  const openEditModal = (course) => {
    setIsEditMode(true);
    setCurrentCourseId(course.id);
    setForm({
      branch_id: course.branch || course.branch_id || "",
      duration_id: course.duration_id || "",
      name: course.name || "",
      code: course.code || "",
      description: course.description || "",
      course_fee: course.course_fee || ""
    });
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  // 🚀 Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentCourseId(null);
    setForm({
      branch_id: "",
      duration_id: "",
      name: "",
      code: "",
      description: "",
      course_fee: ""
    });
    setMsg({ type: "", text: "" });
  };

  // 🚀 Submit form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!form.name || !form.code) {
      return setMsg({ type: "error", text: "Course Name and Course Code are required" });
    }

    if (!form.course_fee || parseFloat(form.course_fee) <= 0) {
      return setMsg({ type: "error", text: "Course Fee is required and must be greater than 0" });
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name,
        code: form.code,
        description: form.description || "",
        duration_id: form.duration_id || null,
        branch_id: form.branch_id || null,
        course_fee: parseFloat(form.course_fee)
      };

      if (isEditMode && currentCourseId) {
        // Update existing course
        await api.put(`/update_courses/${currentCourseId}`, payload);
        setMsg({ type: "success", text: "Course updated successfully ✅" });
        
        // Refresh course list
        await fetchCourses();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        // Create new course
        await api.post("/create_courses", payload);
        setMsg({ type: "success", text: "Course added successfully ✅" });
        
        // Reset form
        setForm({
          branch_id: "",
          duration_id: "",
          name: "",
          code: "",
          description: "",
          course_fee: ""
        });
        
        // Refresh course list
        await fetchCourses();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error saving course ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete course
  const handleDelete = async (courseId, courseName) => {
    if (!window.confirm(`Are you sure you want to delete course "${courseName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/delete_courses/${courseId}`);
      setMsg({ type: "success", text: "Course deleted successfully ✅" });
      await fetchCourses();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting course ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Helper to get duration name by ID
  const getDurationName = (durationId) => {
    const duration = durations.find(d => d.id === durationId);
    return duration ? duration.name : "—";
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "—";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="course-management">
      {/* Header Section */}
      <div className="course-header">
        <div className="course-header-title">
          <h1>Course Management</h1>
          <p>Manage courses, assign durations and branches, organize curriculum</p>
        </div>
        <button className="course-add-btn" onClick={openAddModal}>
          + Add New Course
        </button>
      </div>

      {/* Message Alert */}
      {msg.text && (
        <div className={`course-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="course-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Courses List Table */}
      <div className="course-table-container">
        <div className="course-table-header">
          <h3>All Courses</h3>
          <span className="course-record-badge">{courses.length} course(s) found</span>
        </div>
        
        {fetchLoading && courses.length === 0 ? (
          <div className="course-loading-state">
            <div className="course-spinner"></div>
            <p>Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="course-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p>No courses found. Click "Add New Course" to get started.</p>
          </div>
        ) : (
          <div className="course-table-responsive">
            <table className="course-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Course Fee</th>
                  <th>Duration</th>
                  <th>Branch</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course, index) => (
                  <tr key={course.id}>
                    <td className="course-sno">{index + 1}</td>
                    <td className="course-code-cell">
                      <span className="course-code-badge">{course.code}</span>
                    </td>
                    <td className="course-name-cell">
                      <strong>{course.name}</strong>
                    </td>
                    <td className="course-fee-cell">
                      <span className="course-fee-amount">{formatCurrency(course.course_fee)}</span>
                    </td>
                    <td>{getDurationName(course.duration_id)}</td>
                    <td>{course.branch_name || course.branch || "—"}</td>
                    <td className="course-description-cell">
                      {course.description ? (
                        <span className="course-description-text">
                          {course.description.length > 60 
                            ? `${course.description.substring(0, 60)}...` 
                            : course.description}
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      <div className="course-action-btns">
                        <button 
                          className="course-btn-edit" 
                          onClick={() => openEditModal(course)}
                          title="Edit course"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="course-btn-delete" 
                          onClick={() => handleDelete(course.id, course.name)}
                          title="Delete course"
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
        <div className="course-modal-overlay" onClick={closeModal}>
          <div className="course-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="course-modal-header">
              <h2>{isEditMode ? "✏️ Edit Course" : "➕ Add New Course"}</h2>
              <button className="course-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="course-modal-form">
              <div className="course-form-row">
                <div className="course-form-group full-width">
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
                  <small className="course-field-hint">Select the branch for this course</small>
                </div>
              </div>

              <div className="course-form-row">
                <div className="course-form-group">
                  <label>Course Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g., Mathematics, Physics, Computer Science"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="course-form-group">
                  <label>Course Code *</label>
                  <input
                    type="text"
                    name="code"
                    placeholder="e.g., MATH101, CS201, PHY301"
                    value={form.code}
                    onChange={handleChange}
                    required
                  />
                  <small className="course-field-hint">Unique identifier for the course</small>
                </div>
              </div>

              <div className="course-form-row">
                <div className="course-form-group">
                  <label>Course Fee *</label>
                  <input
                    type="number"
                    name="course_fee"
                    placeholder="e.g., 10000, 25000, 50000"
                    value={form.course_fee}
                    onChange={handleChange}
                    required
                    min="0"
                    step="1"
                  />
                  <small className="course-field-hint">Enter the course fee amount in INR</small>
                </div>

                <div className="course-form-group">
                  <label>Duration</label>
                  <select
                    name="duration_id"
                    value={form.duration_id}
                    onChange={handleChange}
                  >
                    <option value="">Select Duration (Optional)</option>
                    {durations.map((duration) => (
                      <option key={duration.id} value={duration.id}>
                        {duration.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="course-form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Enter course description, objectives, and key topics..."
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                />
              </div>

              {msg.text && (
                <div className={`course-form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="course-modal-actions">
                <button type="submit" className="course-btn-submit" disabled={loading}>
                  {loading ? "Saving..." : (isEditMode ? "Update Course" : "Create Course")}
                </button>
                <button type="button" className="course-btn-cancel" onClick={closeModal}>
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

export default CourseManagement;