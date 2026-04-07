import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import "./styles/sidebar.css";
import { isAuthenticated as checkAuth, logout as apiLogout } from "./utils/api";
import ViewMentor from "./components/ViewMentor";
import ViewBatch from "./components/ViewBatch";
import ViewCourse from "./components/ViewCourse";
import DurationManagement from "./components/DurationManagement";
import LibraryManagement from "./components/LibraryManagement";
import SeatManagement from "./components/SeatManagement";
import PaymentManagement from "./components/PaymentManagement";
import FeeManagement from "./components/FeeManagement";
import StudentManagement from "./components/StudentManagement";
import InvestManagement from "./components/InvestManagement";
import ExpenseType from "./components/ExpenseType";
import RoomReport from "./components/RoomReport";
import ResultManagement from "./components/ResultManagement";

// Lazy load components
const Dashboard = lazy(() => import("./components/Dashboard"));
const DueReports = lazy(() => import("./components/DueReports"));
const ChangePassword = lazy(() => import("./components/ChangePassword"));
const TransactionPassword = lazy(() => import("./components/TransactionPassword"));
const NewCollection = lazy(() => import("./components/NewCollection"));
const ViewStatement = lazy(() => import("./components/ViewStatement"));
const DueFeesReport = lazy(() => import("./components/DueFeesReport"));
const NewStaff = lazy(() => import("./components/NewStaff"));
const TeachingStaff = lazy(() => import("./components/TeachingStaff"));
const NonTeachingStaff = lazy(() => import("./components/NonTeachingStaff"));
const NewStaffSalary = lazy(() => import("./components/NewStaffSalary"));
const ViewStaffSalary = lazy(() => import("./components/ViewStaffSalary"));
const AddResult = lazy(() => import("./components/AddResult"));
const OfflineResult = lazy(() => import("./components/OfflineResult"));
const OnlineResult = lazy(() => import("./components/OnlineResult"));
const OfflineToppers = lazy(() => import("./components/OfflineToppers"));
const OnlineToppers = lazy(() => import("./components/OnlineToppers"));
const AddAttendance = lazy(() => import("./components/AddAttendance"));
const ViewAttendance = lazy(() => import("./components/ViewAttendance"));
const BalanceSheet = lazy(() => import("./components/BalanceSheet"));
const FeesReport = lazy(() => import("./components/FeesReport"));
const ExpensesReport = lazy(() => import("./components/ExpensesReport"));
const LibraryReport = lazy(() => import("./components/LibraryReport"));
const MentorReport = lazy(() => import("./components/MentorReport"));
const AddSubadmin = lazy(() => import("./components/AddSubadmin"));
const ViewSubadmin = lazy(() => import("./components/ViewSubadmin"));
const NewPermission = lazy(() => import("./components/NewPermission"));
const ViewPermission = lazy(() => import("./components/ViewPermission"));
const StateManagement = lazy(() => import("./components/StateManagement"));
const DistrictManagement = lazy(() => import("./components/DistrictManagement"));
const MentorManagement = lazy(() => import("./components/MentorManagement"));
const BatchManagement = lazy(() => import("./components/BatchManagement"));
const CourseManagement = lazy(() => import("./components/CourseManagement"));
const RoomManagement = lazy(() => import("./components/RoomManagement"));
const BedManagement = lazy(() => import("./components/BedManagement"));
const NewBranch = lazy(() => import("./components/NewBranch"));
const ViewBranch = lazy(() => import("./components/ViewBranch"));
const NewDiscount = lazy(() => import("./components/NewDiscount"));
const ViewDiscount = lazy(() => import("./components/ViewDiscount"));
const NewInvest = lazy(() => import("./components/NewInvest"));
const ViewInvest = lazy(() => import("./components/InvestManagement"));
const ExpenseHeadManagement = lazy(() => import("./components/ExpenseHeadManagement"));
const ViewExpenseHead = lazy(() => import("./components/ViewExpenseHead"));
const ViewExpense = lazy(() => import("./components/ViewExpense"));
const LoginPage = lazy(() => import("./components/LoginPage"));

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Component Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoadingFallback = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuth = checkAuth();
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Main Layout with Sidebar
const MainLayout = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const handleNavigate = (path, isLogout = false) => {
    if (isLogout) {
      apiLogout();
      window.location.href = "/login";
    }
  };

  return (
    <div className="app-container">
      <Sidebar onNavigate={handleNavigate} currentPath={currentPath} />
      <main className="main-content">
        <Suspense fallback={<LoadingFallback />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
};

function App() {
  const handleLogin = (userData, token) => {
    // Data is already stored in localStorage by login function
    // Just navigate to dashboard
    window.location.href = "/dashboard";
  };

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Login Route */}
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

            {/* Protected Routes with Sidebar */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout>
                  <Navigate to="/dashboard" replace />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/due-reports" element={
              <ProtectedRoute>
                <MainLayout>
                  <DueReports />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/change-password" element={
              <ProtectedRoute>
                <MainLayout>
                  <ChangePassword />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/transaction-password" element={
              <ProtectedRoute>
                <MainLayout>
                  <TransactionPassword />
                </MainLayout>
              </ProtectedRoute>
            } />


            {/* Student Routes */}
            <Route path="/studentManagement" element={
              <ProtectedRoute>
                <MainLayout>
                  <StudentManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Fees Routes */}
            <Route path="/fees/collection/add" element={
              <ProtectedRoute>
                <MainLayout>
                  <NewCollection />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/fees/statement" element={
              <ProtectedRoute>
                <MainLayout>
                  <ViewStatement />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/fees/due-report" element={
              <ProtectedRoute>
                <MainLayout>
                  <DueFeesReport />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Library Routes */}
            <Route path="/librarymanagement" element={
              <ProtectedRoute>
                <MainLayout>
                  <LibraryManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/seatmanagement" element={
              <ProtectedRoute>
                <MainLayout>
                  <SeatManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Staff Routes */}
            <Route path="/staff/add" element={
              <ProtectedRoute>
                <MainLayout>
                  <NewStaff />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/staff/teaching" element={
              <ProtectedRoute>
                <MainLayout>
                  <TeachingStaff />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/staff/non-teaching" element={
              <ProtectedRoute>
                <MainLayout>
                  <NonTeachingStaff />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Staff Salary Routes */}
            <Route path="/staff-salary/add" element={
              <ProtectedRoute>
                <MainLayout>
                  <NewStaffSalary />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/staff-salary/view" element={
              <ProtectedRoute>
                <MainLayout>
                  <ViewStaffSalary />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Result Routes */}
            <Route path="/result/add" element={
              <ProtectedRoute>
                <MainLayout>
                  <AddResult />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/result/offline" element={
              <ProtectedRoute>
                <MainLayout>
                  <OfflineResult />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/result/online" element={
              <ProtectedRoute>
                <MainLayout>
                  <OnlineResult />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/result/offline/delete" element={
              <ProtectedRoute>
                <MainLayout>
                  <div>Delete Offline Result</div>
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/result/online/delete" element={
              <ProtectedRoute>
                <MainLayout>
                  <div>Delete Online Result</div>
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/result/toppers/offline" element={
              <ProtectedRoute>
                <MainLayout>
                  <OfflineToppers />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/resultmanagement" element={
              <ProtectedRoute>
                <MainLayout>
                  <ResultManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Attendance Routes */}
            <Route path="/attendance/add" element={
              <ProtectedRoute>
                <MainLayout>
                  <AddAttendance />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/attendance/view" element={
              <ProtectedRoute>
                <MainLayout>
                  <ViewAttendance />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Balance Sheet */}
            <Route path="/balance-sheet" element={
              <ProtectedRoute>
                <MainLayout>
                  <BalanceSheet />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Report Routes */}
            <Route path="/report/fees" element={
              <ProtectedRoute>
                <MainLayout>
                  <FeesReport />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/report/expenses" element={
              <ProtectedRoute>
                <MainLayout>
                  <ExpensesReport />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/roomreport" element={
              <ProtectedRoute>
                <MainLayout>
                  <RoomReport />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/report/library" element={
              <ProtectedRoute>
                <MainLayout>
                  <LibraryReport />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/report/mentor" element={
              <ProtectedRoute>
                <MainLayout>
                  <MentorReport />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Subadmin Routes */}
            <Route path="/subadmin/add" element={
              <ProtectedRoute>
                <MainLayout>
                  <AddSubadmin />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="durationmanagement" element={
              <ProtectedRoute>
                <MainLayout>
                  <DurationManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="paymentmanagement" element={
              <ProtectedRoute>
                <MainLayout>
                  <PaymentManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="feemanagement" element={
              <ProtectedRoute>
                <MainLayout>
                  <FeeManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/subadmin/view" element={
              <ProtectedRoute>
                <MainLayout>
                  <ViewSubadmin />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/permission/add" element={
              <ProtectedRoute>
                <MainLayout>
                  <NewPermission />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/permission/view" element={
              <ProtectedRoute>
                <MainLayout>
                  <ViewPermission />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Settings Routes */}
            <Route path="mentormamagement" element={
              <ProtectedRoute>
                <MainLayout>
                  <MentorManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/batchmanagement" element={
              <ProtectedRoute>
                <MainLayout>
                  <BatchManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/coursemanagement" element={
              <ProtectedRoute>
                <MainLayout>
                  <CourseManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="roommanagement" element={
              <ProtectedRoute>
                <MainLayout>
                  <RoomManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/bedmanagement" element={
              <ProtectedRoute>
                <MainLayout>
                  <BedManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Branch Routes */}
            <Route path="/branch/add" element={
              <ProtectedRoute>
                <MainLayout>
                  <NewBranch />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/branch/view" element={
              <ProtectedRoute>
                <MainLayout>
                  <ViewBranch />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Discount Routes */}
            <Route path="/discount/add" element={
              <ProtectedRoute>
                <MainLayout>
                  <NewDiscount />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/discount/view" element={
              <ProtectedRoute>
                <MainLayout>
                  <ViewDiscount />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Invest Routes */}
            <Route path="/investmanagement" element={
              <ProtectedRoute>
                <MainLayout>
                  <InvestManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Expense Head Routes */}
            <Route path="/expenseheadmanagement" element={
              <ProtectedRoute>
                <MainLayout>
                  <ExpenseHeadManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Expense Routes */}
            <Route path="/expensetype" element={
              <ProtectedRoute>
                <MainLayout>
                  <ExpenseType />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/viewexpense" element={
              <ProtectedRoute>
                <MainLayout>
                  <ViewExpense />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* State & District Routes */}
            <Route path="/state" element={
              <ProtectedRoute>
                <MainLayout>
                  <StateManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/district" element={
              <ProtectedRoute>
                <MainLayout>
                  <DistrictManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* 404 Not Found */}
            <Route path="*" element={
              <ProtectedRoute>
                <MainLayout>
                  <div className="not-found">
                    <h2>404 - Page Not Found</h2>
                    <p>The page you're looking for doesn't exist.</p>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;