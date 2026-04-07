import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/viewBatch.css";

// ✅ Axios
const api = axios.create({
  baseURL: "http://192.168.1.7:5045/ims",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ViewBatch = () => {
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await api.get("/batches");
      setBatches(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Search filter
  const filtered = batches.filter((b) =>
    b.batch_name.toLowerCase().includes(search.toLowerCase())
  );

  // ❌ Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this batch?")) return;

    try {
      await api.delete(`/batches/${id}`);
      setBatches((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // ✏️ Edit submit
  const handleUpdate = async () => {
    try {
      await api.put(`/batches/${editData.id}`, editData);
      setEditData(null);
      fetchBatches();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="vbp-container">
      <div className="vbp-card">
        <div className="vbp-header">
          <h3>View Batch</h3>

          {/* 🔍 Search */}
          <input
            type="text"
            placeholder="Search batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="vbp-table-wrapper">
          {loading ? (
            <p className="vbp-loading">Loading...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Sl_No.</th>
                  <th>Branch</th>
                  <th>Batch</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="4">No Data Found</td>
                  </tr>
                ) : (
                  filtered.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.branch_name}</td>
                      <td>{item.batch_name}</td>

                      <td>
                        <span
                          className="vbp-edit"
                          onClick={() => setEditData(item)}
                        >
                          ✏️
                        </span>
                        <span
                          className="vbp-delete"
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
        <div className="vbp-modal">
          <div className="vbp-modal-content">
            <h4>Edit Batch</h4>

            <input
              type="text"
              value={editData.batch_name}
              onChange={(e) =>
                setEditData({ ...editData, batch_name: e.target.value })
              }
            />

            <div className="vbp-modal-actions">
              <button onClick={handleUpdate}>Update</button>
              <button onClick={() => setEditData(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewBatch;