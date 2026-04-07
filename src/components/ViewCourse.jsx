import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/viewCourse.css";

// ✅ Axios with token
const api = axios.create({
  baseURL: "http://192.168.1.7:5045/ims",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ViewCourse = () => {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses");
      setCourses(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Filter
  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  // ❌ Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this course?")) return;

    try {
      await api.delete(`/courses/${id}`);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // ✏️ Update
  const handleUpdate = async () => {
    try {
      await api.put(`/courses/${editData.id}`, editData);
      setEditData(null);
      fetchCourses();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="VC-container">
      <div className="VC-card">
        <div className="VC-header">
          <h3>View Course</h3>

          <input
            type="text"
            placeholder="Search course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="VC-table-wrapper">
          {loading ? (
            <p className="VC-loading">Loading...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Sl_No.</th>
                  <th>Title</th>
                  <th>Code</th>
                  <th>Duration</th>
                  <th>Fees</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6">No Data Found</td>
                  </tr>
                ) : (
                  filtered.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.title}</td>
                      <td>{item.code}</td>
                      <td>{item.duration}</td>
                      <td>{item.fees}</td>

                      <td>
                        <span
                          className="VC-edit"
                          onClick={() => setEditData(item)}
                        >
                          ✏️
                        </span>
                        <span
                          className="VC-delete"
                          onClick={() => handleDelete(item.id)}
                        >
                          ❌
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ✏️ Edit Modal */}
      {editData && (
        <div className="VC-modal">
          <div className="VC-modal-content">
            <h4>Edit Course</h4>

            <input
              type="text"
              value={editData.title}
              onChange={(e) =>
                setEditData({ ...editData, title: e.target.value })
              }
              placeholder="Title"
            />

            <input
              type="text"
              value={editData.code}
              onChange={(e) =>
                setEditData({ ...editData, code: e.target.value })
              }
              placeholder="Code"
            />

            <input
              type="text"
              value={editData.duration}
              onChange={(e) =>
                setEditData({ ...editData, duration: e.target.value })
              }
              placeholder="Duration"
            />

            <input
              type="number"
              value={editData.fees}
              onChange={(e) =>
                setEditData({ ...editData, fees: e.target.value })
              }
              placeholder="Fees"
            />

            <div className="VC-modal-actions">
              <button onClick={handleUpdate}>Update</button>
              <button onClick={() => setEditData(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewCourse;