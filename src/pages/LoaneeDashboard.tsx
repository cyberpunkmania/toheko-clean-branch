import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string;
  role: string[];
  exp: number;
}

const LoaneeDashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<{ email: string; role: string[] } | null>(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Loanee Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>Logged in as {userInfo.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Role: {userInfo.role.join(", ")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Loans</CardTitle>
              <CardDescription>View your loan applications</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Loans</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Apply for Loan</CardTitle>
              <CardDescription>Submit a new loan application</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Apply Now</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Track your loan payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View History
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
              <CardDescription>Get help and support</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoaneeDashboard;
