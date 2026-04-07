import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/StudentManagement.css";

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
  
  if (branchId && (
    config.url.includes("/view_students") || 
    config.url.includes("/create_students") || 
    config.url.includes("/update_students") ||
    config.url.includes("/view_courses") ||
    config.url.includes("/view_batches") ||
    config.url.includes("/view_mentors") ||
    config.url.includes("/view_durations") ||
    config.url.includes("/view_rooms") ||
    config.url.includes("/view_beds") ||
    config.url.includes("/view_libraries") ||
    config.url.includes("/view_seats")
  )) {
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

const StudentManagement = () => {
  const [branches, setBranches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [durations, setDurations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [allSeats, setAllSeats] = useState([]);
  const [filteredSeats, setFilteredSeats] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  
  const [activeFilter, setActiveFilter] = useState("running");
  const [searchTerm, setSearchTerm] = useState("");
  
  const userBranchId = localStorage.getItem("branch_id");
  
  const [form, setForm] = useState({
    branch: "",
    name: "",
    gender: "",
    phone: "",
    email: "",
    dob: "",
    admission: "",
    duration_id: "",
    course: "",
    mentor: "",
    batch: "",
    fname: "",
    address: "",
    room: "",
    bed: "",
    feetype: "", // This will store the name string, not ID
    document: "",
    fnumber: "",
    mnumber: "",
    library: "",
    seat: "",
    lastqua: ""
  });

  useEffect(() => {
    fetchBranches();
    fetchFeeTypes();
  }, []);

  useEffect(() => {
    if (form.branch) {
      fetchCourses();
      fetchBatches();
      fetchMentors();
      fetchDurations();
      fetchRooms();
      fetchLibraries();
      fetchSeats();
    } else {
      setCourses([]);
      setBatches([]);
      setMentors([]);
      setDurations([]);
      setRooms([]);
      setLibraries([]);
      setAllSeats([]);
      setFilteredSeats([]);
      setBeds([]);
    }
  }, [form.branch]);

  useEffect(() => {
    if (form.room) {
      fetchBedsByRoom(form.room);
    } else {
      setBeds([]);
      setForm(prev => ({ ...prev, bed: "" }));
    }
  }, [form.room]);

  useEffect(() => {
    if (form.library) {
      const filtered = allSeats.filter(seat => seat.library_id === form.library);
      setFilteredSeats(filtered);
      if (form.seat && !filtered.find(s => s.id === form.seat)) {
        setForm(prev => ({ ...prev, seat: "" }));
      }
    } else {
      setFilteredSeats([]);
      setForm(prev => ({ ...prev, seat: "" }));
    }
  }, [form.library, allSeats]);

  useEffect(() => {
    fetchStudents();
  }, [pagination.currentPage, pagination.pageSize, activeFilter, searchTerm]);

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/view_branches", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(res.data.data || []);
    } catch (err) {
      console.error("Branch fetch error", err);
    }
  };

  const fetchFeeTypes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/view_fees-types", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeeTypes(res.data.data || []);
    } catch (err) {
      console.error("Fee types fetch error", err);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/view_courses", {
        params: { branch_id: form.branch },
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(res.data.data || []);
    } catch (err) {
      console.error("Course fetch error", err);
    }
  };

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/view_batches", {
        params: { branch_id: form.branch },
        headers: { Authorization: `Bearer ${token}` }
      });
      setBatches(res.data.data || []);
    } catch (err) {
      console.error("Batch fetch error", err);
    }
  };

  const fetchMentors = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/view_mentors", {
        params: { branch_id: form.branch },
        headers: { Authorization: `Bearer ${token}` }
      });
      setMentors(res.data.data || []);
    } catch (err) {
      console.error("Mentor fetch error", err);
    }
  };

  const fetchDurations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/view_durations", {
        params: { branch_id: form.branch },
        headers: { Authorization: `Bearer ${token}` }
      });
      setDurations(res.data.data || []);
    } catch (err) {
      console.error("Duration fetch error", err);
    }
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/view_rooms", {
        params: { branch_id: form.branch },
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(res.data.data || []);
    } catch (err) {
      console.error("Room fetch error", err);
    }
  };

  const fetchBedsByRoom = async (roomId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/view_beds", {
        params: { 
          branch_id: form.branch,
          room_id: roomId 
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setBeds(res.data.data || []);
    } catch (err) {
      console.error("Bed fetch error", err);
      setBeds([]);
    }
  };

  const fetchLibraries = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/view_libraries", {
        params: { branch_id: form.branch },
        headers: { Authorization: `Bearer ${token}` }
      });
      setLibraries(res.data.data || []);
    } catch (err) {
      console.error("Library fetch error", err);
    }
  };

  const fetchSeats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/view_seats", {
        params: { branch_id: form.branch },
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllSeats(res.data.data || []);
    } catch (err) {
      console.error("Seat fetch error", err);
    }
  };

  const fetchStudents = async () => {
    try {
      setFetchLoading(true);
      const token = localStorage.getItem("token");
      const branchId = localStorage.getItem("branch_id") || form.branch;
      
      let params = {
        page: pagination.currentPage,
        page_size: pagination.pageSize,
        branch_id: branchId
      };
      
      if (activeFilter === "running") {
        params.status = 0;
      } else if (activeFilter === "completed") {
        params.status = 1;
      } else if (activeFilter === "dropout") {
        params.status = 2;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const res = await api.get("/view_students", { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let studentData = res.data.students || res.data.data || [];
      
      setStudents(studentData);
      setPagination({
        currentPage: res.data.page || 1,
        pageSize: res.data.page_size || 10,
        total: res.data.total || studentData.length,
        totalPages: res.data.total_pages || Math.ceil((res.data.total || studentData.length) / (res.data.page_size || 10))
      });
      
    } catch (err) {
      console.error("Error fetching students", err);
      setMsg({ type: "error", text: "Failed to fetch students" });
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (name === "branch") {
      setForm(prev => ({
        ...prev,
        course: "",
        batch: "",
        mentor: "",
        duration_id: "",
        room: "",
        bed: "",
        library: "",
        seat: ""
      }));
    }
    
    if (name === "room") {
      setForm(prev => ({ ...prev, bed: "" }));
    }
    
    if (name === "library") {
      setForm(prev => ({ ...prev, seat: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentStudentId(null);
    setSelectedFile(null);
    setPreviewUrl("");
    const today = new Date().toISOString().split('T')[0];
    setForm({
      branch: userBranchId || "",
      name: "",
      gender: "",
      phone: "",
      email: "",
      dob: today,
      admission: today,
      duration_id: "",
      course: "",
      mentor: "",
      batch: "",
      fname: "",
      address: "",
      room: "",
      bed: "",
      feetype: "",
      document: "",
      fnumber: "",
      mnumber: "",
      library: "",
      seat: "",
      lastqua: ""
    });
    setFilteredSeats([]);
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setIsEditMode(true);
    setCurrentStudentId(student.id);
    setSelectedFile(null);
    setPreviewUrl(student.document_path || "");
    const formatDate = (dateString) => {
      if (!dateString) return "";
      return dateString.split('T')[0];
    };
    setForm({
      branch: student.branch_id || userBranchId || "",
      name: student.name || "",
      gender: student.gender || "",
      phone: student.phone || "",
      email: student.email || "",
      dob: formatDate(student.dob),
      admission: formatDate(student.admission_date),
      duration_id: student.duration_id || "",
      course: student.course_id || "",
      mentor: student.mentor_id || "",
      batch: student.batch_id || "",
      fname: student.fname || student.father_name || "",
      address: student.address || "",
      room: student.room_id || "",
      bed: student.bed_id || "",
      feetype: student.feetype || "", // Store the name string
      document: student.document || "",
      fnumber: student.fnumber || student.father_phone || "",
      mnumber: student.mnumber || student.mother_phone || "",
      library: student.library_id || "",
      seat: student.seat_id || "",
      lastqua: student.lastqua || student.last_qualification || ""
    });
    
    if (student.library_id) {
      const filtered = allSeats.filter(seat => seat.library_id === student.library_id);
      setFilteredSeats(filtered);
    }
    
    if (student.room_id) {
      fetchBedsByRoom(student.room_id);
    }
    
    setMsg({ type: "", text: "" });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentStudentId(null);
    setSelectedFile(null);
    setPreviewUrl("");
    setFilteredSeats([]);
    setMsg({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    const requiredFields = {
      branch: "Branch",
      name: "Student Name",
      gender: "Gender",
      phone: "Phone",
      email: "Email",
      dob: "Date of Birth",
      admission: "Admission Date",
      duration_id: "Duration",
      course: "Course",
      mentor: "Mentor",
      batch: "Batch",
      fname: "Father's Name",
      address: "Address",
      room: "Room",
      bed: "Bed",
      feetype: "Fee Type"
    };

    const missingFields = [];
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!form[field]) {
        missingFields.push(label);
      }
    }

    if (missingFields.length > 0) {
      return setMsg({ type: "error", text: `Required fields missing: ${missingFields.join(", ")}` });
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const branchId = localStorage.getItem("branch_id") || form.branch;

      const formData = new FormData();
      
      formData.append("name", form.name);
      formData.append("gender", form.gender);
      formData.append("phone", form.phone);
      formData.append("email", form.email);
      formData.append("dob", form.dob);
      formData.append("admission", form.admission);
      formData.append("duration_id", form.duration_id);
      formData.append("course", form.course);
      formData.append("mentor", form.mentor);
      formData.append("batch", form.batch);
      formData.append("fname", form.fname);
      formData.append("address", form.address);
      formData.append("room", form.room);
      formData.append("bed", form.bed);
      formData.append("feetype", form.feetype); // Send the name string, not ID
      formData.append("branch", form.branch);
      
      if (form.fnumber) formData.append("fnumber", form.fnumber);
      if (form.mnumber) formData.append("mnumber", form.mnumber);
      if (form.library) formData.append("library", form.library);
      if (form.seat) formData.append("seat", form.seat);
      if (form.lastqua) formData.append("lastqua", form.lastqua);
      
      if (selectedFile) {
        formData.append("document", selectedFile);
      }

      console.log("Sending FormData with feetype:", form.feetype);

      if (isEditMode && currentStudentId) {
        await api.put(`/update_students/${currentStudentId}`, formData, {
          params: { branch_id: branchId },
          headers: { 
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          }
        });
        setMsg({ type: "success", text: "Student updated successfully ✅" });
        await fetchStudents();
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        await api.post("/create_students", formData, {
          params: { branch_id: branchId },
          headers: { 
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          }
        });
        setMsg({ type: "success", text: "Student added successfully ✅" });
        await fetchStudents();
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error("Error details:", err.response?.data);
      
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          setMsg({ type: "error", text: err.response.data.detail });
        } else if (Array.isArray(err.response.data.detail)) {
          const errors = err.response.data.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', ');
          setMsg({ type: "error", text: errors });
        } else {
          setMsg({ type: "error", text: JSON.stringify(err.response.data.detail) });
        }
      } else if (err.response?.data?.message) {
        setMsg({ type: "error", text: err.response.data.message });
      } else if (err.response?.data?.error) {
        setMsg({ type: "error", text: err.response.data.error });
      } else {
        setMsg({ type: "error", text: "Error saving student ❌" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete student "${studentName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const branchId = localStorage.getItem("branch_id");
      
      await api.delete(`/delete_students/${studentId}`, {
        params: { branch_id: branchId },
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg({ type: "success", text: "Student deleted successfully ✅" });
      await fetchStudents();
      
      setTimeout(() => {
        setMsg({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error deleting student ❌";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? (branch.name || branch.branch_name) : branchId || "—";
  };

  const getStatusBadge = (status) => {
    if (status === 0) {
      return <span className="studentMNG-status-badge studentMNG-status-running">Running</span>;
    } else if (status === 1) {
      return <span className="studentMNG-status-badge studentMNG-status-completed">Completed</span>;
    } else if (status === 2) {
      return <span className="studentMNG-status-badge studentMNG-status-dropout">Dropout</span>;
    }
    return <span className="studentMNG-status-badge">Unknown</span>;
  };

  const getFeeTypeName = (feeTypeValue) => {
    if (!feeTypeValue) return "—";
    // If it's already a name, return it
    if (typeof feeTypeValue === 'string' && !feeTypeValue.match(/^\d+$/)) {
      return feeTypeValue;
    }
    // If it's an ID, find the name
    const feeType = feeTypes.find(ft => ft.id === parseInt(feeTypeValue));
    return feeType ? feeType.name : feeTypeValue;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, currentPage: newPage });
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setPagination({ ...pagination, currentPage: 1 });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination({ ...pagination, currentPage: 1 });
  };

  const getFilterCount = (status) => {
    if (status === "running") return "Running Students";
    if (status === "completed") return "Completed Students";
    return "Dropout Students";
  };

  const isBranchSelected = !!form.branch;

  return (
    <div className="studentMNG-management">
      <div className="studentMNG-header">
        <div className="studentMNG-header-title">
          <h1>Student Management</h1>
          <p>Manage students, track progress, and monitor academic records</p>
        </div>
        <button className="studentMNG-add-btn" onClick={openAddModal}>
          + Add New Student
        </button>
      </div>

      {msg.text && (
        <div className={`studentMNG-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="studentMNG-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      <div className="studentMNG-search-bar">
        <input
          type="text"
          placeholder="🔍 Search by name, email, phone, or student ID..."
          value={searchTerm}
          onChange={handleSearch}
          className="studentMNG-search-input"
        />
      </div>

      <div className="studentMNG-filter-tabs">
        <button 
          className={`studentMNG-filter-tab ${activeFilter === "running" ? "studentMNG-active" : ""}`}
          onClick={() => handleFilterChange("running")}
        >
          🟢 {getFilterCount("running")}
        </button>
        <button 
          className={`studentMNG-filter-tab ${activeFilter === "completed" ? "studentMNG-active" : ""}`}
          onClick={() => handleFilterChange("completed")}
        >
          ✅ {getFilterCount("completed")}
        </button>
        <button 
          className={`studentMNG-filter-tab ${activeFilter === "dropout" ? "studentMNG-active" : ""}`}
          onClick={() => handleFilterChange("dropout")}
        >
          ⚠️ {getFilterCount("dropout")}
        </button>
      </div>

      <div className="studentMNG-table-container">
        <div className="studentMNG-table-header">
          <h3>Student List - {getFilterCount(activeFilter)}</h3>
          <span className="studentMNG-record-badge">
            Total: {pagination.total} student(s) | Page {pagination.currentPage} of {pagination.totalPages}
          </span>
        </div>
        
        {fetchLoading ? (
          <div className="studentMNG-loading-state">
            <div className="studentMNG-spinner"></div>
            <p>Loading {getFilterCount(activeFilter).toLowerCase()}...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="studentMNG-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p>No {getFilterCount(activeFilter).toLowerCase()} found.</p>
            {searchTerm && <p>Try adjusting your search criteria.</p>}
          </div>
        ) : (
          <>
            <div className="studentMNG-table-responsive">
              <table className="studentMNG-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Branch</th>
                    <th>Course</th>
                    <th>Batch</th>
                    <th>Mentor</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.id}>
                      <td className="studentMNG-sno">
                        {(pagination.currentPage - 1) * pagination.pageSize + index + 1}
                       </td>
                      <td className="studentMNG-name-cell">
                        <div className="studentMNG-name-wrapper">
                          {student.document_path ? (
                            <img src={student.document_path} alt={student.name} className="studentMNG-avatar" />
                          ) : (
                            <span className="studentMNG-icon">👨‍🎓</span>
                          )}
                          <div>
                            <strong>{student.name}</strong>
                            {student.email && <small className="studentMNG-email">{student.email}</small>}
                            {student.phone && <small className="studentMNG-phone">{student.phone}</small>}
                          </div>
                        </div>
                       </td>
                      <td className="studentMNG-id-cell">
                        <code className="studentMNG-id-code">{student.student_id?.substring(0, 8)}</code>
                       </td>
                      <td className="studentMNG-branch-cell">
                        <span className="studentMNG-branch-badge">
                          {getBranchName(student.branch_id)}
                        </span>
                       </td>
                      <td>{student.course || "—"}</td>
                      <td>{student.batch || "—"}</td>
                      <td>{student.mentor || "—"}</td>
                      <td>{getStatusBadge(student.status)}</td>
                      <td>
                        <div className="studentMNG-action-btns">
                          <button 
                            className="studentMNG-btn-edit" 
                            onClick={() => openEditModal(student)}
                            title="Edit student"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="studentMNG-btn-delete" 
                            onClick={() => handleDelete(student.id, student.name)}
                            title="Delete student"
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

            {pagination.totalPages > 1 && (
              <div className="studentMNG-pagination">
                <button 
                  className="studentMNG-page-btn"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  ← Previous
                </button>
                
                <div className="studentMNG-page-numbers">
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`studentMNG-page-number ${pagination.currentPage === pageNum ? "studentMNG-active-page" : ""}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  className="studentMNG-page-btn"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Popup for Add/Edit */}
      {showModal && (
        <div className="studentMNG-modal-overlay" onClick={closeModal}>
          <div className="studentMNG-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="studentMNG-modal-header">
              <h2>{isEditMode ? "✏️ Edit Student" : "➕ Add New Student"}</h2>
              <button className="studentMNG-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="studentMNG-modal-form">
              <div className="studentMNG-form-section">
                <h4>Basic Information <span className="required-star">*</span></h4>
                
                <div className="studentMNG-form-group full-width">
                  <label>Student Image/Document</label>
                  <div className="studentMNG-file-upload">
                    <input
                      type="file"
                      id="document"
                      name="document"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="studentMNG-file-input"
                    />
                    <label htmlFor="document" className="studentMNG-file-label">
                      📁 Choose File
                    </label>
                    {selectedFile && (
                      <span className="studentMNG-file-name">{selectedFile.name}</span>
                    )}
                    {!selectedFile && form.document && isEditMode && (
                      <span className="studentMNG-file-name">Current: {form.document}</span>
                    )}
                  </div>
                  {previewUrl && (
                    <div className="studentMNG-image-preview">
                      <img src={previewUrl} alt="Preview" className="studentMNG-preview-img" />
                    </div>
                  )}
                  <small className="studentMNG-field-hint">Upload student photo (Optional - JPG, PNG, PDF up to 5MB)</small>
                </div>

                <div className="studentMNG-form-row">
                  <div className="studentMNG-form-group">
                    <label>Branch <span className="required-star">*</span></label>
                    <select 
                      name="branch" 
                      value={form.branch} 
                      onChange={handleChange} 
                      required
                      disabled={!isEditMode && !!userBranchId}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id || branch.branch_id} value={branch.id || branch.branch_id}>
                          {branch.name || branch.branch_name}
                        </option>
                      ))}
                    </select>
                    <small className="studentMNG-field-hint">
                      {!isEditMode && userBranchId 
                        ? "Branch is auto-selected based on your profile" 
                        : "Select branch first to load related data"}
                    </small>
                  </div>
                  <div className="studentMNG-form-group">
                    <label>Student Name <span className="required-star">*</span></label>
                    <input type="text" name="name" placeholder="Enter full name" value={form.name} onChange={handleChange} required />
                  </div>
                </div>

                <div className="studentMNG-form-row">
                  <div className="studentMNG-form-group">
                    <label>Gender <span className="required-star">*</span></label>
                    <select name="gender" value={form.gender} onChange={handleChange} required>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="studentMNG-form-group">
                    <label>Date of Birth <span className="required-star">*</span></label>
                    <input type="date" name="dob" value={form.dob} onChange={handleChange} required />
                  </div>
                </div>

                <div className="studentMNG-form-row">
                  <div className="studentMNG-form-group">
                    <label>Phone <span className="required-star">*</span></label>
                    <input type="tel" name="phone" placeholder="Mobile number" value={form.phone} onChange={handleChange} required />
                  </div>
                  <div className="studentMNG-form-group">
                    <label>Email <span className="required-star">*</span></label>
                    <input type="email" name="email" placeholder="Email address" value={form.email} onChange={handleChange} required />
                  </div>
                </div>

                <div className="studentMNG-form-row">
                  <div className="studentMNG-form-group">
                    <label>Father's Name <span className="required-star">*</span></label>
                    <input type="text" name="fname" placeholder="Father's name" value={form.fname} onChange={handleChange} required />
                  </div>
                  <div className="studentMNG-form-group">
                    <label>Father's Phone</label>
                    <input type="tel" name="fnumber" placeholder="Father's phone (Optional)" value={form.fnumber} onChange={handleChange} />
                  </div>
                </div>

                <div className="studentMNG-form-row">
                  <div className="studentMNG-form-group">
                    <label>Mother's Phone</label>
                    <input type="tel" name="mnumber" placeholder="Mother's phone (Optional)" value={form.mnumber} onChange={handleChange} />
                  </div>
                  <div className="studentMNG-form-group">
                    <label>Last Qualification</label>
                    <input type="text" name="lastqua" placeholder="Last qualification (Optional)" value={form.lastqua} onChange={handleChange} />
                  </div>
                </div>

                <div className="studentMNG-form-group full-width">
                  <label>Address <span className="required-star">*</span></label>
                  <textarea name="address" placeholder="Complete address" value={form.address} onChange={handleChange} rows="2" required />
                </div>
              </div>

              <div className="studentMNG-form-section">
                <h4>Academic Information <span className="required-star">*</span></h4>
                <div className="studentMNG-form-row">
                  <div className="studentMNG-form-group">
                    <label>Course <span className="required-star">*</span></label>
                    <select 
                      name="course" 
                      value={form.course} 
                      onChange={handleChange} 
                      required
                      disabled={!isBranchSelected}
                    >
                      <option value="">{isBranchSelected ? "Select Course" : "Please select branch first"}</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="studentMNG-form-group">
                    <label>Duration <span className="required-star">*</span></label>
                    <select 
                      name="duration_id" 
                      value={form.duration_id} 
                      onChange={handleChange} 
                      required
                      disabled={!isBranchSelected}
                    >
                      <option value="">{isBranchSelected ? "Select Duration" : "Please select branch first"}</option>
                      {durations.map((duration) => (
                        <option key={duration.id} value={duration.id}>{duration.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="studentMNG-form-row">
                  <div className="studentMNG-form-group">
                    <label>Batch <span className="required-star">*</span></label>
                    <select 
                      name="batch" 
                      value={form.batch} 
                      onChange={handleChange} 
                      required
                      disabled={!isBranchSelected}
                    >
                      <option value="">{isBranchSelected ? "Select Batch" : "Please select branch first"}</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>{batch.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="studentMNG-form-group">
                    <label>Mentor <span className="required-star">*</span></label>
                    <select 
                      name="mentor" 
                      value={form.mentor} 
                      onChange={handleChange} 
                      required
                      disabled={!isBranchSelected}
                    >
                      <option value="">{isBranchSelected ? "Select Mentor" : "Please select branch first"}</option>
                      {mentors.map((mentor) => (
                        <option key={mentor.id} value={mentor.id}>{mentor.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="studentMNG-form-row">
                  <div className="studentMNG-form-group">
                    <label>Admission Date <span className="required-star">*</span></label>
                    <input type="date" name="admission" value={form.admission} onChange={handleChange} required />
                  </div>
                  <div className="studentMNG-form-group">
                    <label>Fee Type <span className="required-star">*</span></label>
                    <select 
                      name="feetype" 
                      value={form.feetype} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select Fee Type</option>
                      {feeTypes.map((feeType) => (
                        <option key={feeType.id} value={feeType.name}>
                          {feeType.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="studentMNG-form-section">
                <h4>Facility Assignment <span className="required-star">*</span></h4>
                
                <div className="studentMNG-form-row">
                  <div className="studentMNG-form-group">
                    <label>Room <span className="required-star">*</span></label>
                    <select 
                      name="room" 
                      value={form.room} 
                      onChange={handleChange} 
                      required
                      disabled={!isBranchSelected}
                    >
                      <option value="">{isBranchSelected ? "Select Room" : "Please select branch first"}</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>{room.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="studentMNG-form-group">
                    <label>Bed <span className="required-star">*</span></label>
                    <select 
                      name="bed" 
                      value={form.bed} 
                      onChange={handleChange} 
                      required
                      disabled={!form.room}
                    >
                      <option value="">
                        {form.room ? "Select Bed" : "Please select room first"}
                      </option>
                      {beds.map((bed) => (
                        <option key={bed.id} value={bed.id}>{bed.name}</option>
                      ))}
                    </select>
                    {!form.room && isBranchSelected && (
                      <small className="studentMNG-field-hint error-hint">⚠️ Please select room first</small>
                    )}
                    {form.room && beds.length === 0 && (
                      <small className="studentMNG-field-hint">No beds available for this room</small>
                    )}
                  </div>
                </div>

                <div className="studentMNG-form-row">
                  <div className="studentMNG-form-group">
                    <label>Library</label>
                    <select 
                      name="library" 
                      value={form.library} 
                      onChange={handleChange}
                      disabled={!isBranchSelected}
                    >
                      <option value="">{isBranchSelected ? "Select Library (Optional)" : "Please select branch first"}</option>
                      {libraries.map((library) => (
                        <option key={library.id} value={library.id}>{library.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="studentMNG-form-group">
                    <label>Seat</label>
                    <select 
                      name="seat" 
                      value={form.seat} 
                      onChange={handleChange}
                      disabled={!form.library}
                    >
                      <option value="">
                        {form.library ? "Select Seat (Optional)" : "Please select library first"}
                      </option>
                      {filteredSeats.map((seat) => (
                        <option key={seat.id} value={seat.id}>{seat.name}</option>
                      ))}
                    </select>
                    {form.library && filteredSeats.length === 0 && (
                      <small className="studentMNG-field-hint">No seats available for this library</small>
                    )}
                  </div>
                </div>
              </div>

              {msg.text && (
                <div className={`studentMNG-form-message ${msg.type}`}>
                  {msg.text}
                </div>
              )}

              <div className="studentMNG-modal-actions">
                <button type="submit" className="studentMNG-btn-submit" disabled={loading}>
                  {loading ? "Saving..." : (isEditMode ? "Update Student" : "Create Student")}
                </button>
                <button type="button" className="studentMNG-btn-cancel" onClick={closeModal}>
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

export default StudentManagement;