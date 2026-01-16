import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";
import EmployeesPage from "@/pages/Employees";
import AttendancePage from "@/pages/Attendance";
import LeaveApplicationsPage from "@/pages/LeaveApplications";
import PayslipsPage from "@/pages/Payslips";
import NotificationsPage from "@/pages/Notifications";
import PayrollManagement from "@/pages/PayrollManagement";
import EmployeePayslip from "@/pages/EmployeePayslip";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              }
            />
            <Route
              path="/employees"
              element={
                <AppLayout>
                  <EmployeesPage />
                </AppLayout>
              }
            />
            <Route
              path="/attendance"
              element={
                <AppLayout>
                  <AttendancePage />
                </AppLayout>
              }
            />
            <Route
              path="/leave-applications"
              element={
                <AppLayout>
                  <LeaveApplicationsPage />
                </AppLayout>
              }
            />
            <Route
              path="/payslips"
              element={
                <AppLayout>
                  <PayslipsPage />
                </AppLayout>
              }
            />
            <Route
              path="/payroll-management"
              element={
                <AppLayout>
                  <PayrollManagement />
                </AppLayout>
              }
            />
            <Route
              path="/my-payslip"
              element={
                <AppLayout>
                  <EmployeePayslip />
                </AppLayout>
              }
            />
            <Route
              path="/notifications"
              element={
                <AppLayout>
                  <NotificationsPage />
                </AppLayout>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
