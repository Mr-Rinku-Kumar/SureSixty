import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/BalanceSheet.css";

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

const BalanceSheet = () => {
  const [branches, setBranches] = useState([]);
  const [branch, setBranch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // ✅ Set default dates (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setToDate(today.toISOString().split('T')[0]);
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // ✅ Fetch Branches
  const fetchBranches = async () => {
    try {
      const res = await api.get("/view_branches");
      const branchData = res.data.data || [];
      setBranches(branchData);

      if (branchData.length > 0) {
        setBranch(branchData[0].id || branchData[0].branch_id);
      }
    } catch (err) {
      console.error("Branch API Error:", err);
      setMsg({ type: "error", text: "Failed to fetch branches" });
    }
  };

  // ✅ Fetch Balance Sheet
  const fetchBalanceSheet = async () => {
    if (!branch || !fromDate || !toDate) {
      setMsg({ type: "error", text: "Please select branch and date range" });
      return;
    }

    try {
      setLoading(true);
      setMsg({ type: "", text: "" });

      const res = await api.get("/view_balance_sheet", {
        params: {
          branch_id: branch,
          from_date: fromDate,
          to_date: toDate,
        },
      });

      setData(res.data);
    } catch (err) {
      console.error("Balance API Error:", err);
      const errorMsg = err.response?.data?.message || "Failed to load balance sheet";
      setMsg({ type: "error", text: errorMsg });
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₹ 0";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="BS-management">
      {/* Header Section */}
      <div className="BS-header">
        <div className="BS-header-title">
          <h1>Balance Sheet</h1>
          <p>View income, expenses, and financial summary</p>
        </div>
      </div>

      {/* Message Alert */}
      {msg.text && (
        <div className={`BS-alert-message ${msg.type}`}>
          <span>{msg.text}</span>
          {msg.type === "success" && (
            <button className="BS-close-alert" onClick={() => setMsg({ type: "", text: "" })}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Filters Card */}
      <div className="BS-card">
        <div className="BS-filters">
          {/* Branch Dropdown */}
          <div className="BS-filter-group">
            <label>Select Branch</label>
            <select
              className="BS-select"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            >
              {branches.map((b) => (
                <option key={b.id || b.branch_id} value={b.id || b.branch_id}>
                  {b.name || b.branch_name} ({b.id || b.branch_id})
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div className="BS-filter-group">
            <label>From Date</label>
            <input
              type="date"
              className="BS-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          {/* To Date */}
          <div className="BS-filter-group">
            <label>To Date</label>
            <input
              type="date"
              className="BS-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {/* Button */}
          <div className="BS-filter-group">
            <label>&nbsp;</label>
            <button className="BS-btn" onClick={fetchBalanceSheet} disabled={loading}>
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* Data Section */}
      {data && (
        <div className="BS-data-container">
          {/* Income and Expenses Section */}
          <div className="BS-data-grid">
            {/* Income Box */}
            <div className="BS-box BS-income-box">
              <h3 className="BS-box-title">Income</h3>
              
              <div className="BS-row">
                <span>Company Investment</span>
                <span className="BS-amount">
                  {formatCurrency(data.investments?.total_investment)}
                </span>
              </div>

              <div className="BS-row">
                <span>Student Fees Collection</span>
                <span className="BS-amount">
                  {formatCurrency(data.investments?.total_students_fees_collected)}
                </span>
              </div>

              <div className="BS-divider"></div>
              
              <div className="BS-row BS-total-row">
                <span>Total Income</span>
                <span className="BS-total-amount">
                  {formatCurrency(data.total_income)}
                </span>
              </div>
            </div>

            {/* Expenses Box */}
            <div className="BS-box BS-expense-box">
              <h3 className="BS-box-title">Expenses</h3>
              
              {data.expenses?.all_expenses?.length === 0 ? (
                <div className="BS-empty-state">
                  <p>No expenses found for this period</p>
                </div>
              ) : (
                <>
                  {data.expenses?.all_expenses?.map((item, index) => (
                    <div className="BS-row" key={index}>
                      <span>{item[0]}</span>
                      <span className="BS-amount">
                        {formatCurrency(item[1])}
                      </span>
                    </div>
                  ))}
                  
                  <div className="BS-divider"></div>
                  
                  <div className="BS-row BS-total-row">
                    <span>Total Expenses</span>
                    <span className="BS-total-amount">
                      {formatCurrency(data.total_expenses)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Balance Card */}
          <div className="BS-balance-card">
            <div className="BS-balance-content">
              <span className="BS-balance-label">Net Balance</span>
              <span className={`BS-balance-value ${data.balance_amount >= 0 ? 'BS-positive' : 'BS-negative'}`}>
                {formatCurrency(data.balance_amount)}
              </span>
            </div>
          </div>

          {/* Date Range Info */}
          <div className="BS-date-info">
            <span>📅 Period: {new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()}</span>
            <span>🏢 Branch: {branches.find(b => (b.id || b.branch_id) === branch)?.name || branch}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !data && (
        <div className="BS-loading-state">
          <div className="BS-spinner"></div>
          <p>Loading balance sheet...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !data && !msg.text && (
        <div className="BS-empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <p>Select branch and date range to view balance sheet</p>
        </div>
      )}
    </div>
  );
};

export default BalanceSheet;