import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/sidebar.css";
import { logout as apiLogout } from "../utils/api";

const menuItems = [
  {
    title: "Home",
    icon: "🏠",
    submenu: [
      { title: "Dashboard", path: "/dashboard" },
      { title: "Due Reports", path: "/due-reports" },
      { title: "Change Password", path: "/change-password" },
      { title: "Transaction Password", path: "/transaction-password" },
      { title: "Logout", path: "/logout", isLogout: true }
    ]
  },
  {
    title: "Settings",
    icon: "⚙️",
    submenu: [
      { title: "Mentor Management", path: "/mentormamagement" },
      { title: "Batch Management", path: "/batchmanagement" },
      { title: "Course Management", path: "/coursemanagement" },
      { title: "Room Management", path: "/roommanagement" },
      { title: "Bed Management", path: "/bedmanagement" },
      { title: "Duration Management", path: "/durationmanagement" },
      { title: "Payment Management", path: "/paymentmanagement" },
    ]
  },
  {
    title: "Branch",
    icon: "🏢",
    submenu: [
      { title: "View Branch", path: "/branch/view" }
    ]
  },
  {
    title: "Student",
    icon: "👨‍🎓",
    submenu: [
      { title: "Student Management", path: "/studentmanagement" }
    ]
  },
  // {
  //   title: "Student Discount",
  //   icon: "💰",
  //   submenu: [
  //     { title: "New Discount", path: "/discount/add" },
  //     { title: "View Discount", path: "/discount/view" }
  //   ]
  // },
  {
    title: "Fees Collection",
    icon: "💵",
    submenu: [
      { title: "Fee Management", path: "/feemanagement" }
    ]
  },
  {
    title: "Invest",
    icon: "📈",
    submenu: [
      { title: "Invest Management", path: "/investmanagement" },
    ]
  },
  {
    title: "Expense Head",
    icon: "📊",
    submenu: [
      { title: "Expense Head", path: "/expenseheadmanagement" },
      { title: "Expense Type", path: "/expensetype" }
    ]
  },
  {
    title: "Expense",
    icon: "💸",
    submenu: [
      { title: " View Expense", path: "/viewexpense" },

    ]
  },
  {
    title: "Library",
    icon: "📚",
    submenu: [
      { title: "Library Management", path: "/librarymanagement" },
      { title: "Seat Management", path: "/seatmanagement" },
    ]
  },
  // {
  //   title: "Staff",
  //   icon: "👔",
  //   submenu: [
  //     { title: "New Staff", path: "/staff/add" },
  //     { title: "View Teaching Staff", path: "/staff/teaching" },
  //     { title: "View Non-Teaching Staff", path: "/staff/non-teaching" }
  //   ]
  // },
  // {
  //   title: "Staff Salary",
  //   icon: "💰",
  //   submenu: [
  //     { title: "New Staff Salary", path: "/staff-salary/add" },
  //     { title: "View Staff Salary", path: "/staff-salary/view" }
  //   ]
  // },
  {
    title: "Result",
    icon: "📊",
    submenu: [
      { title: "Result Management", path: "/resultmanagement" },
      // { title: "View Offline Result", path: "/result/offline" },
      // { title: "View Online Result", path: "/result/online" },
      // { title: "Delete Offline Result", path: "/result/offline/delete" },
      // { title: "Delete Online Result", path: "/result/online/delete" },
      // { title: "View Offline Toppers", path: "/result/toppers/offline" },
      // { title: "View Online Toppers", path: "/result/toppers/online" }
    ]
  },
  // {
  //   title: "Attendance",
  //   icon: "📝",
  //   submenu: [
  //     { title: "Add Attendance", path: "/attendance/add" },
  //     { title: "View Attendance", path: "/attendance/view" }
  //   ]
  // },
  {
    title: "Balance Sheet",
    icon: "📋",
    submenu: [
      { title: "Balance Sheet", path: "/balance-sheet" }
    ]
  },
  {
    title: "Report",
    icon: "📄",
    submenu: [
      { title: "Fees Collection", path: "/report/fees" },
      { title: "Expenses", path: "/report/expenses" },
      { title: "Room Report", path: "/roomreport" },
      { title: "Library", path: "/report/library" },
      { title: "Mentor", path: "/report/mentor" }
    ]
  },
  // {
  //   title: "Subadmin",
  //   icon: "👥",
  //   submenu: [
  //     { title: "Add Subadmin", path: "/subadmin/add" },
  //     { title: "View Subadmin", path: "/subadmin/view" },
  //     { title: "New Permission", path: "/permission/add" },
  //     { title: "View Permission", path: "/permission/view" }
  //   ]
  // }
];

const Sidebar = ({ onNavigate, currentPath }) => {
  const [openIndex, setOpenIndex] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setCollapsed(false);
        setMobileOpen(false);
      } else {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load saved state from localStorage
  useEffect(() => {
    const savedOpenIndex = localStorage.getItem("sidebarOpenIndex");
    if (savedOpenIndex !== null) {
      setOpenIndex(parseInt(savedOpenIndex));
    }
  }, []);

  const toggleDropdown = useCallback((index) => {
    const newOpenIndex = openIndex === index ? null : index;
    setOpenIndex(newOpenIndex);
    localStorage.setItem("sidebarOpenIndex", newOpenIndex);
  }, [openIndex]);

  const handleNavigation = useCallback((path, isLogout = false) => {
    if (isLogout) {
      if (window.confirm("Are you sure you want to logout?")) {
        apiLogout();
        navigate("/login");
      }
      return;
    }

    navigate(path);

    // Close mobile sidebar after navigation
    if (window.innerWidth <= 768) {
      setMobileOpen(false);
    }
  }, [navigate]);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth <= 768) {
      setMobileOpen(prev => !prev);
    } else {
      setCollapsed(prev => !prev);
    }
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay active" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        aria-expanded={!collapsed}
      >
        <button
          className="toggle-btn"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed && window.innerWidth > 768 ? "☰" : "◀"}
        </button>

        <div className="sidebar-logo">
          {!collapsed && <span className="logo-text">
            <img src="https://gurukulsure60.com/sure60fees/images/logo.png" alt="sure60" />
          </span>}
        </div>

        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {menuItems.map((item, index) => (
              <li key={index} className="sidebar-item">
                <button
                  className={`menu-item ${openIndex === index ? "active-parent" : ""}`}
                  onClick={() => toggleDropdown(index)}
                  aria-expanded={openIndex === index}
                >
                  <span className="menu-icon" aria-hidden="true">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="menu-title">{item.title}</span>
                      {item.submenu && (
                        <span className="dropdown-arrow">
                          {openIndex === index ? "▲" : "▼"}
                        </span>
                      )}
                    </>
                  )}
                </button>

                {openIndex === index && item.submenu && (
                  <ul className="submenu">
                    {item.submenu.map((sub, i) => (
                      <li
                        key={i}
                        className={`submenu-item ${location.pathname === sub.path ? "active" : ""}`}
                        onClick={() => handleNavigation(sub.path, sub.isLogout)}
                      >
                        <span className="submenu-icon" aria-hidden="true">→</span>
                        {sub.title}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;