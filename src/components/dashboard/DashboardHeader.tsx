import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { jwtDecode } from "jwt-decode";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Settings, User, LogOut, HelpCircle, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { authService } from "@/services/authService";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define a custom interface for our JWT payload
interface TohekoJwtPayload {
  sub: string;
  role: string;
  [key: string]: any; // Allow for other properties that might be in the token
}

const DashboardHeader: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode<TohekoJwtPayload>(token) : { sub: "Admin User", role: "Administrator" };
  const [notificationCount, setNotificationCount] = useState(3);
  
  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  const userInitials = getInitials(decoded.sub || "Admin User");

  const handleLogout = () => {
    authService.logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="flex items-center min-w-0 flex-shrink">
          <SidebarTrigger />
          <h1 className="ml-4 text-lg font-semibold text-gray-900 truncate">
            Admin Dashboard
          </h1>
        </div>

        <div className="flex items-center space-x-4 flex-shrink-0">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-500" />
                {notificationCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notifications</span>
                <Link to="/admin/notifications" className="text-xs text-primary hover:underline">
                  View All
                </Link>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                <DropdownMenuItem className="py-3 cursor-default">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="font-medium">New Loan Application</span>
                      <span className="text-xs text-muted-foreground">2 min ago</span>
                    </div>
                    <p className="text-sm text-muted-foreground">John Doe has submitted a new loan application.</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="py-3 cursor-default">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="font-medium">System Update</span>
                      <span className="text-xs text-muted-foreground">1 hour ago</span>
                    </div>
                    <p className="text-sm text-muted-foreground">The system has been updated to version 2.3.0.</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="py-3 cursor-default">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="font-medium">New Member</span>
                      <span className="text-xs text-muted-foreground">3 hours ago</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Jane Smith has joined the SACCO.</p>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar>
                  <AvatarImage src="/placeholder-avatar.jpg" alt={decoded.sub} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {decoded.sub}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {decoded.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <Link to="/admin/profile" className="w-full">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <Link to="/admin/settings" className="w-full">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Home className="mr-2 h-4 w-4" />
                <Link to="/" className="w-full">Back to Website</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span className="w-full">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
