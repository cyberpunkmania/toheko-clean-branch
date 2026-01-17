import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Eye, EyeOff, Mail, Phone, User, Lock, CreditCard, ArrowRight } from "lucide-react";

const registerSchema = z
  .object({
    userFirstname: z
      .string()
      .min(2, "First name must be at least 2 characters"),
    userLastname: z.string().min(2, "Last name must be at least 2 characters"),
    userIdNumber: z
      .string()
      .max(9, "ID NO not more than 9 characters")
      .min(8, "ID NO must be at least 8 characters"),
    userEmail: z.string().email("Please enter a valid email address"),
    userPhoneNumber: z
      .string()
      .min(10, "Phone number must be at least 10 characters"),
    userPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    confirmuserPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.userPassword === data.confirmuserPassword, {
    message: "Passwords don't match",
    path: ["confirmuserPassword"],
  });

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    userFirstname: "",
    userLastname: "",
    userEmail: "",
    userPhoneNumber: "",
    userUsername: "",
    userPassword: "",
    userIdNumber: "",
    confirmuserPassword: "",
    roleId: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      registerSchema.parse(formData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const registerData = {
        userFirstname: formData.userFirstname,
        userLastname: formData.userLastname,
        userEmail: formData.userEmail,
        userPhoneNumber: formData.userPhoneNumber,
        userIdNumber: formData.userIdNumber,
        userPassword: formData.userPassword,
        roleId: 1,
      };

      const response = await authService.register(registerData);
      
      // Check if OTP verification is required
      if (response.otp_required) {
        toast.success(response.message || "Registration successful! Please verify OTP sent to your email.");
        navigate("/member/verify-otp", { state: { email: formData.userEmail } });
      } else {
        toast.success("Registration successful! Redirecting to dashboard...");
        navigate("/member/login");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sacco-500 via-sacco-600 to-sacco-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sacco-500/30">
              M
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
        </div>

        {/* Card */}
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sacco-500 via-sacco-600 to-sacco-700"></div>
          
          <CardHeader className="pb-4 pt-6">
            <CardTitle className="text-xl font-bold text-center text-gray-900">Register</CardTitle>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name Fields */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="userFirstname" className="text-sm font-medium">First Name</Label>
                  <Input
                    id="userFirstname"
                    placeholder="John"
                    value={formData.userFirstname}
                    onChange={handleInputChange}
                    required
                    className={`h-10 transition-all ${errors.userFirstname ? "border-red-500" : ""}`}
                  />
                  {errors.userFirstname && <p className="text-xs text-red-500">{errors.userFirstname}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="userLastname" className="text-sm font-medium">Last Name</Label>
                  <Input
                    id="userLastname"
                    placeholder="Doe"
                    value={formData.userLastname}
                    onChange={handleInputChange}
                    required
                    className={`h-10 transition-all ${errors.userLastname ? "border-red-500" : ""}`}
                  />
                  {errors.userLastname && <p className="text-xs text-red-500">{errors.userLastname}</p>}
                </div>
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="userEmail" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="userEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.userEmail}
                      onChange={handleInputChange}
                      required
                      className={`h-10 pl-9 transition-all ${errors.userEmail ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.userEmail && <p className="text-xs text-red-500">{errors.userEmail}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="userPhoneNumber" className="text-sm font-medium">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="userPhoneNumber"
                      type="tel"
                      placeholder="0712345678"
                      value={formData.userPhoneNumber}
                      onChange={handleInputChange}
                      required
                      className={`h-10 pl-9 transition-all ${errors.userPhoneNumber ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.userPhoneNumber && <p className="text-xs text-red-500">{errors.userPhoneNumber}</p>}
                </div>
              </div>

              {/* ID Number Field */}
              <div className="space-y-1.5">
                <Label htmlFor="userIdNumber" className="text-sm font-medium">ID Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="userIdNumber"
                    type="text"
                    placeholder="12345678"
                    value={formData.userIdNumber}
                    onChange={handleInputChange}
                    required
                    className={`h-10 pl-9 transition-all ${errors.userIdNumber ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.userIdNumber && <p className="text-xs text-red-500">{errors.userIdNumber}</p>}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="userPassword" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="userPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.userPassword}
                      onChange={handleInputChange}
                      required
                      className={`h-10 pl-9 pr-9 transition-all ${errors.userPassword ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.userPassword && <p className="text-xs text-red-500">{errors.userPassword}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmuserPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmuserPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmuserPassword}
                      onChange={handleInputChange}
                      required
                      className={`h-10 pl-9 pr-9 transition-all ${errors.confirmuserPassword ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmuserPassword && <p className="text-xs text-red-500">{errors.confirmuserPassword}</p>}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-sacco-600 to-sacco-700 hover:from-sacco-700 hover:to-sacco-800 shadow-lg hover:shadow-xl transition-all group" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </span>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 bg-gray-50 border-t py-4">
            <p className="text-sm text-gray-600 text-center">
              Already have an account?{" "}
              <Link to="/member/login" className="font-semibold text-sacco-600 hover:text-sacco-700 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;