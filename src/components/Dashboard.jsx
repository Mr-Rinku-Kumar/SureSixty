import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/dashboard.css";

// ✅ Axios instance (MERGED HERE)
const api = axios.create({
  baseURL: "http://192.168.1.3:5045/ims",
});

// 🔐 Attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🚨 Handle unauthorized globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/dashboard");
      setData(res.data);
    } catch (err) {
      console.error("API Error:", err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ Safe handler
  const safe = (val) => (val === "" || val == null ? 0 : val);

  // 💰 Currency formatter
  const formatCurrency = (num) => {
    return Number(safe(num)).toLocaleString("en-IN");
  };

  const stats = data
    ? [
        { title: "Total Student", value: safe(data.total_students), icon: "👤", color: "#e91e63" },
        { title: "Running Student", value: safe(data.total_running), icon: "👤", color: "#009688" },
        { title: "Completed Student", value: safe(data.total_completed), icon: "👤", color: "#ff5722" },
        { title: "Dropout Student", value: safe(data.total_dropout), icon: "👤", color: "#ff5722" },

        { title: "Monthly Students", value: safe(data.total_monthly_fees_students), icon: "👤", color: "#3f51b5" },
        { title: "6 Months Students", value: safe(data.total_6months_fees_students), icon: "👤", color: "#673ab7" },

        { title: "Today Fees", value: formatCurrency(data.today_fee_collection), icon: "💼", color: "#00bcd4" },
        { title: "Total Fees", value: formatCurrency(data.total_fee_collection), icon: "💼", color: "#e91e63" },

        { title: "Today Expense", value: formatCurrency(data.today_expense), icon: "📊", color: "#009688" },
        { title: "Total Expense", value: formatCurrency(data.total_expense), icon: "📊", color: "#ff5722" },

        { title: "Today Salary", value: formatCurrency(data.today_staff_salary), icon: "💵", color: "#00bcd4" },
        { title: "Total Salary", value: formatCurrency(data.total_staff_salary), icon: "💵", color: "#3f51b5" },

        { title: "Today Admission", value: safe(data.today_admissions), icon: "👤", color: "#e91e63" },
      ]
    : [];

  return (
    <>
     <div className="page-header">
        <h1>Dashboard</h1>
        <p>Track and manage your Dashboard</p>
      </div>
    <div className="dashboard">
      <div className="grid">
        {loading ? (
          <p className="loading">Loading dashboard...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          stats.map((item, index) => (
            <div className="card" key={index}>
              <div className="card-left">
                <h2 style={{ color: item.color }}>{item.value}</h2>
                <p>{item.title}</p>
              </div>

              <div
                className="card-icon"
                style={{
                  borderColor: item.color,
                  color: item.color,
                }}
              >
                {item.icon}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </>
  );
};

export default Dashboard;