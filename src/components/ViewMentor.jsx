import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/viewMentor.css";

// ✅ Axios with token
const api = axios.create({
  baseURL: "http://192.168.1.3:5045/ims",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ViewMentor = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const res = await api.get("/mentors"); // 🔥 your API
      setMentors(res.data.data || []);
    } catch (err) {
      console.error("Error fetching mentors", err);
    } finally {
      setLoading(false);
    }
  };

  // ❌ Delete mentor
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this mentor?")) return;

    try {
      await api.delete(`/mentors/${id}`);
      setMentors((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="view-mentor">
      <div className="vm-card">
        <div className="vm-header">
          <h3>View Mentor</h3>
        </div>

        <div className="vm-table-wrapper">
          {loading ? (
            <p className="loading">Loading...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Sl_No.</th>
                  <th>Branch</th>
                  <th>Mentor</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {mentors.length === 0 ? (
                  <tr>
                    <td colSpan="4">No Data Found</td>
                  </tr>
                ) : (
                  mentors.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>

                      {/* 🔥 Show Branch like screenshot */}
                      <td>
                        {item.branch_name || item.branch}
                      </td>

                      <td>{item.mentor_name}</td>

                      <td>
                        <span className="vm-edit">✏️</span>
                        <span
                          className="vm-delete"
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
    </div>
  );
};

export default ViewMentor;