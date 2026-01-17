import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { jwtDecode } from "jwt-decode";
import { Mail, Lock, Eye, EyeOff, Users } from "lucide-react";

interface DecodedToken {
  sub: string;
  role: string[];
  exp: number;
}

const loginSchema = z.object({
  username: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const MemberLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const sessionExpired = searchParams.get("sessionExpired");
    if (sessionExpired === "true") {
      toast.error("Your session has expired. Please log in again.");
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            newErrors[error.path[0].toString()] = error.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleLoginSuccess = (response: any) => {
    const token = response.access_token;
    localStorage.setItem("token", token);

    try {
      const decoded = jwtDecode<{ sub: string; role: string[] }>(token);

      // Verify user has member role
      if (decoded.role.includes("MEMBER")) {
        toast.success("Login successful! Welcome Member.");
        navigate("/user/dashboard");
      } else {
        toast.error("Access denied. Member credentials required.");
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      toast.error("An error occurred during login. Please try again.");
      localStorage.removeItem("token");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(formData);
      handleLoginSuccess(response);
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.errorMessage || error.response?.data?.message;
      
      // Check for OTP not verified error
      if (errorMessage?.includes("OTP not verified") || errorMessage?.includes("Please request OTP")) {
        toast.error("Please verify your email with OTP first.");
        navigate("/member/request-otp", { state: { email: formData.username, fromLogin: true } });
        return;
      }
      
      if (error.response?.status === 401) {
        toast.error("Invalid email or password. Please try again.");
      } else if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.error("An error occurred during login. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Member Portal</h1>
          <p className="text-gray-600">Sign in to access your account</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">
              Member Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="email"
                    placeholder="member@example.com"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-red-600">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    to="/member/forgot-password"
                    className="font-medium text-green-600 hover:text-green-500"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In as Member"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-green-600 hover:text-green-500"
              >
                Register here
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default MemberLogin;
