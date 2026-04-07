import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import "../styles/dashboard.css";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

// ✅ Axios instance
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
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    fetchData();
    
    // Handle window resize for responsive charts
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/dashboard");
      setData(res.data);
      setRefreshTime(new Date());
      setError("");
    } catch (err) {
      console.error("API Error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const safe = (val) => (val === "" || val == null ? 0 : val);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(safe(num));
  };

  const formatCompactNumber = (num) => {
    const n = safe(num);
    if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
    if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  // Student distribution chart data
  const studentChartData = {
    labels: ['Running', 'Completed', 'Dropout'],
    datasets: [
      {
        data: [
          safe(data?.total_running),
          safe(data?.total_completed),
          safe(data?.total_dropout)
        ],
        backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
        borderWidth: 0,
        borderRadius: 10,
      },
    ],
  };

  // Fee collection chart data
  const feeCollectionData = {
    labels: windowWidth <= 768 ? ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] :
            windowWidth <= 1024 ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] :
            ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    datasets: [
      {
        label: 'Fee Collection',
        data: [65000, 72000, 85000, 78000, 92000, 88000, 95000, 102000, 98000, 105000, 112000, 118000],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        borderRadius: 8,
        tension: 0.4,
        fill: true,
        pointRadius: windowWidth <= 768 ? 2 : 3,
        pointHoverRadius: windowWidth <= 768 ? 4 : 6,
      },
    ],
  };

  // Expense vs Income chart
  const financeChartData = {
    labels: windowWidth <= 480 ? ['Fees', 'Exp', 'Sal', 'Profit'] :
            windowWidth <= 768 ? ['Collection', 'Expenses', 'Salaries', 'Profit'] :
            ['Fees Collection', 'Expenses', 'Salaries', 'Profit'],
    datasets: [
      {
        label: 'Amount (₹)',
        data: [
          safe(data?.total_fee_collection),
          safe(data?.total_expense),
          safe(data?.total_staff_salary),
          safe(data?.total_fee_collection) - safe(data?.total_expense) - safe(data?.total_staff_salary)
        ],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6'],
        borderRadius: 10,
        barPercentage: windowWidth <= 768 ? 0.7 : 0.8,
        categoryPercentage: windowWidth <= 768 ? 0.8 : 0.9,
      },
    ],
  };

  // Fee type distribution
  const feeTypeData = {
    labels: windowWidth <= 480 ? ['M', '6M', 'Y', 'Q'] :
            windowWidth <= 768 ? ['Monthly', '6 Months', 'Yearly', 'Quarterly'] :
            ['Monthly', '6 Months', 'Yearly', 'Quarterly'],
    datasets: [
      {
        data: [
          safe(data?.total_monthly_fees_students),
          safe(data?.total_6months_fees_students),
          0,
          0
        ],
        backgroundColor: ['#6366f1', '#ec4899', '#14b8a6', '#f97316'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: windowWidth <= 480 ? 'bottom' : 'top',
        labels: {
          font: { size: windowWidth <= 768 ? 10 : 11 },
          padding: windowWidth <= 768 ? 8 : 10,
          boxWidth: windowWidth <= 768 ? 10 : 12,
        },
      },
      tooltip: {
        bodyFont: { size: windowWidth <= 768 ? 11 : 12 },
        titleFont: { size: windowWidth <= 768 ? 11 : 12 },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            label += formatCurrency(context.raw);
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        ticks: {
          font: { size: windowWidth <= 768 ? 10 : 11 },
          callback: function(value) {
            return formatCompactNumber(value);
          }
        },
        grid: {
          drawBorder: true,
          color: '#e2e8f0',
        },
      },
      x: {
        ticks: {
          font: { size: windowWidth <= 768 ? 9 : 11 },
          rotation: windowWidth <= 480 ? 45 : 0,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: windowWidth <= 480 ? 'bottom' : 'right',
        labels: {
          font: { size: windowWidth <= 768 ? 10 : 11 },
          padding: windowWidth <= 768 ? 8 : 10,
          boxWidth: windowWidth <= 768 ? 10 : 12,
        },
      },
      tooltip: {
        bodyFont: { size: windowWidth <= 768 ? 11 : 12 },
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
  };

  const StatsCard = ({ title, value, icon, color, trend, subtitle }) => (
    <div className="dashboard-stats-card">
      <div className="dashboard-stats-icon" style={{ background: color + '15', color: color }}>
        {icon}
      </div>
      <div className="dashboard-stats-info">
        <h4>{title}</h4>
        <div className="dashboard-stats-value">{value}</div>
        {subtitle && <span className="dashboard-stats-subtitle">{subtitle}</span>}
        {trend && (
          <div className={`dashboard-stats-trend ${trend >= 0 ? 'up' : 'down'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div className="dashboard-loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error-container">
        <div className="dashboard-error-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button onClick={fetchData} className="dashboard-retry-btn">Try Again</button>
      </div>
    );
  }

  const totalStudents = safe(data?.total_students);
  const runningStudents = safe(data?.total_running);
  const todayCollection = safe(data?.today_fee_collection);
  const totalCollection = safe(data?.total_fee_collection);
  const todayExpense = safe(data?.today_expense);
  const totalExpense = safe(data?.total_expense);
  const todaySalary = safe(data?.today_staff_salary);
  const totalSalary = safe(data?.total_staff_salary);
  const todayAdmissions = safe(data?.today_admissions);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening with your institute today.</p>
        </div>
        <div className="dashboard-header-right">
          <button onClick={fetchData} className="dashboard-refresh-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
          <div className="dashboard-time">
            Last updated: {refreshTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Key Stats Row */}
      <div className="dashboard-stats-grid">
        <StatsCard 
          title="Total Students" 
          value={formatCompactNumber(totalStudents)} 
          icon="👨‍🎓" 
          color="#6366f1"
          trend={8}
          subtitle={`${runningStudents} active`}
        />
        <StatsCard 
          title="Today's Collection" 
          value={formatCurrency(todayCollection)} 
          icon="💰" 
          color="#10b981"
          trend={12}
          subtitle="vs yesterday"
        />
        <StatsCard 
          title="Total Collection" 
          value={formatCompactNumber(totalCollection)} 
          icon="🏦" 
          color="#3b82f6"
          trend={15}
          subtitle="lifetime"
        />
        <StatsCard 
          title="Today's Expense" 
          value={formatCurrency(todayExpense)} 
          icon="📉" 
          color="#ef4444"
          trend={-5}
          subtitle="within budget"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="dashboard-charts-row">
        {/* <div className="dashboard-chart-card dashboard-chart-large">
          <div className="dashboard-chart-header">
            <h3>Fee Collection Trend</h3>
            <p>Monthly revenue overview</p>
          </div>
          <div className="dashboard-chart-wrapper">
            <Line data={feeCollectionData} options={chartOptions} />
          </div>
        </div> */}

        <div className="dashboard-chart-card">
          <div className="dashboard-chart-header">
            <h3>Student Distribution</h3>
            <p>Running vs Completed vs Dropout</p>
          </div>
          <div className="dashboard-chart-wrapper">
            <Doughnut data={studentChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="dashboard-charts-row">
        <div className="dashboard-chart-card">
          <div className="dashboard-chart-header">
            <h3>Financial Overview</h3>
            <p>Income vs Expenses breakdown</p>
          </div>
          <div className="dashboard-chart-wrapper">
            <Bar data={financeChartData} options={chartOptions} />
          </div>
        </div>

        <div className="dashboard-chart-card">
          <div className="dashboard-chart-header">
            <h3>Fee Type Distribution</h3>
            <p>Students by payment plan</p>
          </div>
          <div className="dashboard-chart-wrapper">
            <Doughnut data={feeTypeData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Additional Info Cards */}
      <div className="dashboard-info-grid">
        <div className="dashboard-info-card">
          <div className="dashboard-info-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
            📝
          </div>
          <div className="dashboard-info-content">
            <span className="dashboard-info-label">Today's Admissions</span>
            <span className="dashboard-info-value">{todayAdmissions}</span>
            <span className="dashboard-info-trend">+2 from yesterday</span>
          </div>
        </div>

        <div className="dashboard-info-card">
          <div className="dashboard-info-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            💵
          </div>
          <div className="dashboard-info-content">
            <span className="dashboard-info-label">Today's Salary</span>
            <span className="dashboard-info-value">{formatCurrency(todaySalary)}</span>
            <span className="dashboard-info-trend">Staff payroll</span>
          </div>
        </div>

        <div className="dashboard-info-card">
          <div className="dashboard-info-icon" style={{ background: '#fed7aa', color: '#f59e0b' }}>
            📊
          </div>
          <div className="dashboard-info-content">
            <span className="dashboard-info-label">Total Salary Paid</span>
            <span className="dashboard-info-value">{formatCompactNumber(totalSalary)}</span>
            <span className="dashboard-info-trend">All time</span>
          </div>
        </div>

        <div className="dashboard-info-card">
          <div className="dashboard-info-icon" style={{ background: '#e0e7ff', color: '#6366f1' }}>
            🎯
          </div>
          <div className="dashboard-info-content">
            <span className="dashboard-info-label">Collection Rate</span>
            <span className="dashboard-info-value">
              {totalCollection > 0 ? Math.round((todayCollection / totalCollection) * 100) : 0}%
            </span>
            <span className="dashboard-info-trend">Target: 85%</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <div className="dashboard-footer-left">
          <span>📊 Data updates every 5 minutes</span>
        </div>
        <div className="dashboard-footer-right">
          <span>© 2024 Institute Management System</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;