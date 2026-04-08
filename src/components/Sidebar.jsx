import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaCog,
  FaBuilding,
  FaUserGraduate,
  FaMoneyBillWave,
  FaChartLine,
  FaWallet,
  FaBook,
  FaClipboardList,
  FaFileAlt,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaBars,
  FaUniversity,
  FaChalkboardTeacher,
  FaBed,
  FaClock,
  FaCreditCard,
  FaPercent,
  FaHandHoldingUsd,
  FaBoxes,
  FaTag,
  FaShoppingCart,
  FaRegBuilding,
  FaRegCalendarAlt,
  FaRegMoneyBillAlt,
  FaRegChartBar,
  FaTachometerAlt,
  FaUsers,
  FaRegClipboard,
  FaRegFileAlt,
  FaRegBookmark,
  FaRegAddressCard,
  FaRegCalendarCheck,
  FaRegCreditCard,
  FaChartPie,
  FaRegHandshake
} from "react-icons/fa";
import { MdDashboard, MdLogout, MdSettings, MdSchool, MdLibraryBooks, MdAirlineSeatReclineNormal } from "react-icons/md";
import { GiExpense, GiTakeMyMoney, GiTakeMyMoney as GiFees } from "react-icons/gi";
import { BiGitBranch, BiMoney, BiBarChart, BiBookOpen, BiBriefcase, BiCalendar } from "react-icons/bi";
import { IoSchoolOutline, IoPeopleOutline, IoStatsChart } from "react-icons/io5";
import { logout as apiLogout } from "../utils/api";
import "../styles/sidebar.css";

const menuItems = [
  {
    title: "Home",
    icon: <FaHome />,
    submenu: [
      { title: "Dashboard", path: "/dashboard", icon: <MdDashboard /> },
      { title: "Due Reports", path: "/due-reports", icon: <FaRegMoneyBillAlt /> },
      { title: "Change Password", path: "/change-password", icon: <FaRegBookmark /> },
      { title: "Transaction Password", path: "/transaction-password", icon: <FaRegCreditCard /> },
      { title: "Logout", path: "/logout", isLogout: true, icon: <MdLogout /> }
    ]
  },
  {
    title: "Settings",
    icon: <FaCog />,
    submenu: [
      { title: "Mentor Management", path: "/mentormamagement", icon: <FaChalkboardTeacher /> },
      { title: "Batch Management", path: "/batchmanagement", icon: <FaUsers /> },
      { title: "Course Management", path: "/coursemanagement", icon: <MdSchool /> },
      { title: "Room Management", path: "/roommanagement", icon: <FaRegBuilding /> },
      { title: "Bed Management", path: "/bedmanagement", icon: <FaBed /> },
      { title: "Duration Management", path: "/durationmanagement", icon: <FaClock /> },
      { title: "Payment Management", path: "/paymentmanagement", icon: <FaCreditCard /> },
      { title: "Library Management", path: "/librarymanagement", icon: <MdLibraryBooks /> },
      { title: "Seat Management", path: "/seatmanagement", icon: <MdAirlineSeatReclineNormal /> }
    ]
  },
  {
    title: "Branch",
    icon: <FaBuilding />,
    submenu: [
      { title: "View Branch", path: "/branch/view", icon: <BiGitBranch /> }
    ]
  },
  {
    title: "Student",
    icon: <FaUserGraduate />,
    submenu: [
      { title: "Student Management", path: "/studentmanagement", icon: <IoPeopleOutline /> }
    ]
  },
  {
    title: "Fees Collection",
    icon: <FaMoneyBillWave />,
    submenu: [
      { title: "Fee Management", path: "/feemanagement", icon: <GiFees /> }
    ]
  },
  {
    title: "Invest",
    icon: <FaChartLine />,
    submenu: [
      { title: "Invest Management", path: "/investmanagement", icon: <FaHandHoldingUsd /> }
    ]
  },
  {
    title: "Expense Head",
    icon: <FaWallet />,
    submenu: [
      { title: "Expense Head", path: "/expenseheadmanagement", icon: <FaTag /> },
      { title: "Expense Type", path: "/expensetype", icon: <FaBoxes /> }
    ]
  },
  {
    title: "Expense",
    icon: <GiExpense />,
    submenu: [
      { title: "View Expense", path: "/viewexpense", icon: <FaRegClipboard /> }
    ]
  },
  {
    title: "Result",
    icon: <IoStatsChart />,
    submenu: [
      { title: "Result Management", path: "/resultmanagement", icon: <BiBarChart /> }
    ]
  },
  {
    title: "Balance Sheet",
    icon: <FaClipboardList />,
    submenu: [
      { title: "Balance Sheet", path: "/balance-sheet", icon: <FaRegChartBar /> }
    ]
  },
  {
    title: "Report",
    icon: <FaFileAlt />,
    submenu: [
      // { title: "Fees Collection", path: "/report/fees", icon: <FaRegMoneyBillAlt /> },
      // { title: "Expenses", path: "/report/expenses", icon: <GiExpense /> },
      { title: "Room Report", path: "/roomreport", icon: <FaRegBuilding /> },
      { title: "Library", path: "/report/library", icon: <MdLibraryBooks /> },
      { title: "Mentor", path: "/report/mentor", icon: <FaChalkboardTeacher /> }
    ]
  }
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
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsed !== null && window.innerWidth > 768) {
      setCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // Save collapsed state
  useEffect(() => {
    if (window.innerWidth > 768) {
      localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
    }
  }, [collapsed]);

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

  // Check if a submenu item is active
  const isSubmenuActive = (submenu) => {
    return submenu.some(sub => location.pathname === sub.path);
  };

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
        <FaBars />
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
          {collapsed && window.innerWidth > 768 ? <FaBars /> : <FaChevronLeft />}
        </button>

        <div className="sidebar-logo">
          {!collapsed ? (
            <>
              <img src="https://gurukulsure60.com/sure60fees/images/logo.png" alt="sure60" />
              <span className="logo-text">Sure60 IMS</span>
            </>
          ) : (
            <div className="logo-icon">
              <img src="https://gurukulsure60.com/sure60fees/images/logo.png" alt="sure60" style={{ width: '40px' }} />
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {menuItems.map((item, index) => (
              <li key={index} className="sidebar-item">
                <button
                  className={`menu-item ${openIndex === index ? "active-parent" : ""} ${isSubmenuActive(item.submenu) ? "has-active-child" : ""}`}
                  onClick={() => toggleDropdown(index)}
                  aria-expanded={openIndex === index}
                >
                  <span className="menu-icon">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="menu-title">{item.title}</span>
                      {item.submenu && (
                        <span className="dropdown-arrow">
                          {openIndex === index ? <FaChevronRight className="rotate" /> : <FaChevronRight />}
                        </span>
                      )}
                    </>
                  )}
                </button>

                {openIndex === index && item.submenu && !collapsed && (
                  <ul className="submenu">
                    {item.submenu.map((sub, i) => (
                      <li
                        key={i}
                        className={`submenu-item ${location.pathname === sub.path ? "active" : ""}`}
                        onClick={() => handleNavigation(sub.path, sub.isLogout)}
                      >
                        <span className="submenu-icon">{sub.icon}</span>
                        <span className="submenu-title">{sub.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer Section */}
        {!collapsed && (
          <div className="sidebar-footer">
            <div className="sidebar-footer-content">
              <span className="footer-copyright">© 2024 Sure60 IMS</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;