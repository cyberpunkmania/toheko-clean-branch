import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  CreditCard,
  PiggyBank,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Wallet,
  History,
  Building2,
  TrendingUp,
  Users,
} from "lucide-react";
import { authService } from "@/services/authService";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import UserDashboardHeader from "./UserDashboardHeader";

interface UserDashboardLayoutProps {
  children: React.ReactNode;
}

const UserDashboardLayout: React.FC<UserDashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarState, setSidebarState] = useState({
    collapsed: false,
    isMobile: false,
    isOpen: true,
  });

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarState(prev => ({ ...prev, isMobile: true, isOpen: false }));
      } else {
        setSidebarState(prev => ({ ...prev, isMobile: false, isOpen: true }));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuSections = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/user/dashboard" },
      ]
    },
    {
      title: "Financial",
      items: [
        { label: "Payments", icon: <Wallet size={18} />, path: "/user/payments" },
        { label: "Savings", icon: <PiggyBank size={18} />, path: "/user/payment-history" },
        { label: "My Loans", icon: <CreditCard size={18} />, path: "/user/loans" },
        { label: "Loan Summary", icon: <TrendingUp size={18} />, path: "/user/loan-application-summary" },
        { label: "Apply for Loan", icon: <FileText size={18} />, path: "/user/loan-application" },
        { label: "Statements", icon: <History size={18} />, path: "/user/statements" },
      ]
    },
    {
      title: "Account",
      items: [
        { label: "Profile", icon: <User size={18} />, path: "/user/profile" },
        { label: "Next of Kin", icon: <Users size={18} />, path: "/user/next-of-kin" },
        { label: "Settings", icon: <Settings size={18} />, path: "/user/settings" },
      ]
    }
  ];

  const handleLogout = () => {
    authService.logout();
    toast.success("You have been logged out successfully");
    navigate("/member/login");
  };

  const toggleSidebar = () => {
    setSidebarState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarState.isOpen ? "translate-x-0" : "-translate-x-full"}
                ${sidebarState.collapsed && !sidebarState.isMobile ? "w-16" : "w-60"}
                fixed left-0 top-0 z-20 h-screen flex flex-col border-r bg-background
                transition-all duration-300 ease-in-out md:translate-x-0 shadow-sm`}
      >
        {/* Header */}
        <div className="flex h-14 items-center border-b px-3 justify-between">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              TS
            </div>
            {!sidebarState.collapsed && (
              <div className="ml-3">
                <h1 className="text-sm font-semibold leading-none">TohekoSACCO</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Member Portal</p>
              </div>
            )}
          </div>
          {!sidebarState.isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarState(prev => ({ ...prev, collapsed: !prev.collapsed }))}
              className="h-8 w-8 text-muted-foreground hover:text-foreground">
              {sidebarState.collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? "mt-6" : ""}>
              {!sidebarState.collapsed && (
                <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => sidebarState.isMobile && toggleSidebar()}
                      className={`flex items-center px-2 py-2 text-sm rounded-lg transition-all duration-150 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      title={sidebarState.collapsed ? item.label : ""}
                    >
                      <span className={`flex-shrink-0 ${!sidebarState.collapsed ? "mr-3" : "mx-auto"}`}>
                        {item.icon}
                      </span>
                      {!sidebarState.collapsed && (
                        <span className="truncate font-medium">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t p-3">
          <Button
            variant="ghost"
            className={`w-full flex items-center ${sidebarState.collapsed ? "justify-center" : "justify-start"} px-2 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors`}
            onClick={handleLogout}
            title={sidebarState.collapsed ? "Logout" : ""}
          >
            <LogOut className={`h-4 w-4 ${!sidebarState.collapsed ? "mr-3" : ""}`} />
            {!sidebarState.collapsed && <span className="font-medium">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarState.isOpen && sidebarState.isMobile && (
        <div
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Content area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out
                   ${sidebarState.isOpen && !sidebarState.isMobile
                       ? sidebarState.collapsed ? "md:ml-16" : "md:ml-60"
                       : "ml-0"
                   }`}
      >
        <UserDashboardHeader toggleSidebar={toggleSidebar} sidebarOpen={sidebarState.isOpen} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default UserDashboardLayout;
