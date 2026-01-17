import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import MemberLogin from "./pages/MemberLogin";
import LoaneeLogin from "./pages/LoaneeLogin";
import Register from "./pages/Register";
import AdminRequestOTP from "./pages/AdminRequestOTP";
import AdminVerifyOTP from "./pages/AdminVerifyOTP";
import MemberRequestOTP from "./pages/MemberRequestOTP";
import MemberVerifyOTP from "./pages/MemberVerifyOTP";
import LoaneeRequestOTP from "./pages/LoaneeRequestOTP";
import LoaneeVerifyOTP from "./pages/LoaneeVerifyOTP";
import AdminForgotPassword from "./pages/AdminForgotPassword";
import MemberForgotPassword from "./pages/MemberForgotPassword";
import LoaneeForgotPassword from "./pages/LoaneeForgotPassword";
import Dashboard from "./pages/admin/Dashboard";
import Members from "./pages/admin/Members";
import AdminLoans from "./pages/admin/Loans";
import Accounts from "./pages/admin/Accounts";
import AccountTypes from "./pages/admin/AccountTypes";
import Payments from "./pages/admin/Payments";
import PaymentTypes from "./pages/admin/PaymentTypes";
import PaymentModes from "./pages/admin/PaymentModes";
import NextOfKinManagement from "./pages/admin/NextOfKinManagement";
import MemberManagement from "./pages/admin/MemberManagement";
import Disbursements from "./pages/admin/Disbursements";
import ProtectedRoute from "./components/ProtectedRoute";
import LoanProducts from "./pages/admin/LoanProducts";
import LoanPenalties from "./pages/admin/LoanPenalties";
import LoanCollateral from "./pages/admin/LoanCollateral";
import LoanRepayments from "./pages/admin/LoanRepayments";
import Groups from "./pages/admin/Groups";
import Permissions from "./pages/admin/Permissions";
import BoardMembers from "./pages/admin/BoardMembers";
import Roles from "./pages/admin/Roles";
import RepaymentSchedules from "./pages/admin/RepaymentSchedules";
import Repayments from "./pages/admin/Repayments";
import AdminSavings from "./pages/admin/Savings";
import AdminSettings from "./pages/admin/Settings";
import Notifications from "./pages/admin/Notifications";
import NotFound from "./pages/NotFound";

// User dashboard imports
import UserDashboardLayout from "./pages/user/layout/UserDashboardLayout";
import UserDashboard from "./pages/user/Dashboard";
import UserPayments from "./pages/user/Payments";
import PaymentHistory from "./pages/user/PaymentHistory";
import UserLoans from "./pages/user/Loans";
import LoanAccountHistory from "./pages/user/LoanAccountHistory";
import LoanApplicationSummary from "./pages/user/LoanApplicationSummary";
// import UserSavings from "./pages/user/Savings";
import UserStatements from "./pages/user/Statements";
import UserProfile from "./pages/user/Profile";
import UserSettings from "./pages/user/Settings";
import UserNextOfKin from "./pages/user/NextOfKin";
import LoanApplication from "./pages/user/LoanApplication";
import Users from "./pages/admin/Users";
import GroupDetails from "./pages/admin/GroupDetails";
import LoanAccounts from "./pages/admin/LoanAccounts";
import Expenses from "./pages/admin/Expenses";
import ExpenseCategoriesPage from "./pages/admin/ExpenseCategories";
import LoaneeRegister from "./pages/LoaneeRegister";
import LoaneeRegistration from "@/pages/loanee/LoaneeRegistration";
import LoaneeDashboard from "@/pages/loanee/LoaneeDashboard";
import LoaneeLoanApplication from "@/pages/loanee/LoaneeLoanApplication";
import LoaneeApplications from "@/pages/loanee/LoaneeApplications";
import LoaneeProfile from "@/pages/loanee/LoaneeProfile";
import LoaneeSettings from "@/pages/loanee/LoaneeSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* <Route path="/" element={<LandingPage />} /> */}
          <Route path="/" element={<MemberLogin />} />
          <Route path="/login" element={<MemberLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/member/login" element={<MemberLogin />} />
          <Route path="/loanee/login" element={<LoaneeLogin />} />
          <Route path="/register" element={<Register />} />
          {/* Admin OTP Routes */}
          <Route path="/admin/request-otp" element={<AdminRequestOTP />} />
          <Route path="/admin/verify-otp" element={<AdminVerifyOTP />} />
          {/* Member OTP Routes */}
          <Route path="/member/request-otp" element={<MemberRequestOTP />} />
          <Route path="/member/verify-otp" element={<MemberVerifyOTP />} />
          {/* Loanee OTP Routes */}
          <Route path="/loanee/request-otp" element={<LoaneeRequestOTP />} />
          <Route path="/loanee/verify-otp" element={<LoaneeVerifyOTP />} />
          {/* Forgot Password Routes */}
          <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
          <Route path="/member/forgot-password" element={<MemberForgotPassword />} />
          <Route path="/loanee/forgot-password" element={<LoaneeForgotPassword />} />
          <Route path="/user" element={<ProtectedRoute />}>
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="payments" element={<UserPayments />} />
            <Route path="payment-history" element={<PaymentHistory />} />
            <Route path="loans" element={<UserLoans />} />
            <Route path="loan-account-history" element={<LoanAccountHistory />} />
            <Route path="loan-application-summary" element={<LoanApplicationSummary />} />
            <Route path="loan-application" element={<LoanApplication />} />
            {/* <Route path="savings" element={<UserSavings />} /> */}
            <Route path="statements" element={<UserStatements />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="next-of-kin" element={<UserNextOfKin />} />
            <Route path="settings" element={<UserSettings />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<Dashboard />} />
            {/* User routes */}
            <Route path="/user/payments" element={<UserPayments />} />
            <Route path="/admin/members" element={<Members />} />
            <Route
              path="/admin/member-management"
              element={<MemberManagement />}
            />
            <Route path="/admin/loans" element={<AdminLoans />} />
            <Route path="/admin/loan-products" element={<LoanProducts />} />
            <Route path="/admin/loan-penalties" element={<LoanPenalties />} />

            <Route
              path="/admin/loan-collaterals"
              element={<LoanCollateral />}
            />
            
            <Route path="/admin/groups" element={<Groups />} />
            <Route path="/admin/groups/:groupId" element={<GroupDetails />} />
            <Route
              path="/admin/loan-schedules"
              element={<RepaymentSchedules />}
            />
            <Route path="/admin/loan-repayments" element={<LoanRepayments />} />
            <Route
              path="/admin/loan-disbursements"
              element={<Disbursements />}
            />
            <Route path="/admin/accounts" element={<Accounts />} />
            <Route path="/admin/account-types" element={<AccountTypes />} />
            <Route path="/admin/payments" element={<Payments />} />
            <Route path="/admin/payment-types" element={<PaymentTypes />} />
            <Route path="/admin/payment-modes" element={<PaymentModes />} />
            {/* <Route
              path="/admin/next-of-kin"
              element={<NextOfKinManagement />}
            /> */}
            <Route path="/admin/permissions" element={<Permissions />} />
            <Route path="/admin/board-members" element={<BoardMembers />} />
            <Route path="/admin/savings" element={<AdminSavings />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/roles" element={<Roles />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/notifications" element={<Notifications />} />
            <Route path="/admin/loan-accounts" element={<LoanAccounts />} />
            <Route path="/admin/expenses" element={<Expenses />} />
            <Route path="/admin/expense-categories" element={<ExpenseCategoriesPage />} />

          </Route>
          <Route path="/loanee-registration" element={<LoaneeRegistration />} />
          <Route path="/loanee-dashboard" element={<LoaneeDashboard />} />
          <Route path="/loanee/loan-application" element={<LoaneeLoanApplication />} />
          <Route path="/loanee/applications" element={<LoaneeApplications />} />
          <Route path="/loanee/profile" element={<LoaneeProfile />} />
          <Route path="/loanee/settings" element={<LoaneeSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
