import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { jwtDecode } from "jwt-decode";
import { 
  DollarSign, 
  FileText, 
  CreditCard, 
  User, 
  Clock, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import LoaneeDashboardLayout from "./layout/LoaneeDashboardLayout";

interface DecodedToken {
  sub: string;
  role: string[];
  exp: number;
}

interface LoanStats {
  activeLoans: number;
  pendingApplications: number;
  totalBorrowed: number;
  nextPayment: number;
}

const LoaneeDashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<{ email: string; role: string[] } | null>(null);
  const [loanStats, setLoanStats] = useState<LoanStats>({
    activeLoans: 0,
    pendingApplications: 0,
    totalBorrowed: 0,
    nextPayment: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to continue");
      navigate("/loanee/login");
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      if (!decoded.role.includes("LOANEE")) {
        toast.error("Unauthorized access");
        navigate("/loanee/login");
        return;
      }
      setUserInfo({ email: decoded.sub, role: decoded.role });
      
      // TODO: Fetch actual loan statistics from API
      // For now, using mock data
      setLoanStats({
        activeLoans: 2,
        pendingApplications: 1,
        totalBorrowed: 50000,
        nextPayment: 5000,
      });
    } catch (error) {
      toast.error("Invalid session");
      localStorage.removeItem("token");
      navigate("/loanee/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/loanee/login");
  };

  if (!userInfo) {
    return null;
  }

  const statsCards = [
    {
      title: "Active Loans",
      value: loanStats.activeLoans,
      icon: FileText,
      description: "Current loans",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pending Applications",
      value: loanStats.pendingApplications,
      icon: Clock,
      description: "Awaiting approval",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Total Borrowed",
      value: `KSh ${loanStats.totalBorrowed.toLocaleString()}`,
      icon: DollarSign,
      description: "Lifetime borrowing",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Next Payment",
      value: `KSh ${loanStats.nextPayment.toLocaleString()}`,
      icon: CreditCard,
      description: "Due soon",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  const quickActions = [
    {
      title: "Apply for Loan",
      description: "Submit a new loan application",
      icon: FileText,
      action: () => toast.info("Loan application feature coming soon"),
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "My Loans",
      description: "View your active loans",
      icon: DollarSign,
      action: () => toast.info("Loan list feature coming soon"),
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Payment History",
      description: "Track your loan payments",
      icon: CreditCard,
      action: () => toast.info("Payment history feature coming soon"),
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      title: "My Profile",
      description: "Update your account details",
      icon: User,
      action: () => toast.info("Profile feature coming soon"),
      color: "bg-indigo-600 hover:bg-indigo-700",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "approved",
      message: "Loan application #12345 approved",
      date: "2 days ago",
      icon: CheckCircle,
      iconColor: "text-green-600",
    },
    {
      id: 2,
      type: "payment",
      message: "Payment of KSh 5,000 received",
      date: "5 days ago",
      icon: CreditCard,
      iconColor: "text-blue-600",
    },
    {
      id: 3,
      type: "pending",
      message: "Loan application #12346 pending review",
      date: "1 week ago",
      icon: AlertCircle,
      iconColor: "text-yellow-600",
    },
  ];

  return (
    <LoaneeDashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Welcome Back! 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here's what's happening with your loans today
            </p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md">
            <FileText className="mr-2 h-4 w-4" />
            Apply for New Loan
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-all border-l-4" style={{ borderLeftColor: stat.color.replace('text-', '#') }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 justify-start hover:shadow-md transition-all group"
                      onClick={action.action}
                    >
                      <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mr-3 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-sm">{action.title}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Loan Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Summary</CardTitle>
              <CardDescription>Current month overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-100">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Approved</p>
                    <p className="text-lg font-bold">2</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-lg font-bold">1</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Borrowed</p>
                    <p className="text-lg font-bold">KSh 50K</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Recent Activities */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Your latest loan activities and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <div className={`p-2 rounded-lg bg-gray-50`}>
                        <Icon className={`h-4 w-4 ${activity.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{activity.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Need Help?</CardTitle>
              <CardDescription className="text-blue-100">
                Our support team is here to assist you with any questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="secondary" className="w-full bg-white text-blue-600 hover:bg-blue-50">
                Contact Support
              </Button>
              <Button variant="outline" className="w-full border-white text-white hover:bg-white/10">
                View FAQs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </LoaneeDashboardLayout>
  );
};

export default LoaneeDashboard;
