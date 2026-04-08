import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/viewBranch.css";

// ✅ Axios instance with token
const api = axios.create({
  baseURL: "http://192.168.1.10:5045/ims",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ViewBranch = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await api.get("/view_branches"); // ✅ fixed endpoint
      setBranches(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("❌ Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Safe Search Filter
  const filtered = branches.filter((b) =>
    b.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="branch-container">
      <h2>View Branches 🏫</h2>

      {/* 🔍 Search */}
      <div className="branch-header">
        <input
          type="text"
          placeholder="Search Branch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ❌ Error */}
      {error && <p className="error">{error}</p>}

      {/* 📊 Table */}
      <div className="table-wrapper">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sl No.</th>
                <th>Branch ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7">No Data Found</td>
                </tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.contact_number}</td>

                    {/* 📅 Date */}
                    <td>
                      {new Date(item.created_at).toLocaleDateString("en-IN")}
                    </td>

                    {/* 🟢 Status (dynamic ready) */}
                    <td>
                      <span
                        className={`status ${
                          item.status === "inactive" ? "inactive" : "active"
                        }`}
                      ></span>
                    </td>

                    {/* ⚙️ Actions */}
                    <td>
                      <button className="view-btn">👁️</button>
                      <button className="edit-btn">✏️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ViewBranch;