import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { forgotPasswordService } from "@/services/forgotPasswordService";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Users, Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
  email: z.string().email("Invalid email address"),
});

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  repeatPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.repeatPassword, {
  message: "Passwords do not match",
  path: ["repeatPassword"],
});

const MemberForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    password: "",
    repeatPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateStep = () => {
    try {
      if (step === 1) {
        emailSchema.parse({ email: formData.email });
      } else if (step === 2) {
        otpSchema.parse({ otp: formData.otp, email: formData.email });
      } else {
        passwordSchema.parse({
          password: formData.password,
          repeatPassword: formData.repeatPassword,
        });
      }
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

  const handleVerifyEmail = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    try {
      const response = await forgotPasswordService.verifyEmail(formData.email);
      if (response.status === 200) {
        toast.success("OTP sent to your email!");
        setStep(2);
      } else {
        throw new Error("Unexpected response status: " + response.status);
      }
    } catch (error: any) {
      console.error("Email verification failed:", error.response ? error.response.data : error.message);
      toast.error(error.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    try {
      const response = await forgotPasswordService.verifyOtp(formData.email, parseInt(formData.otp));
      if (response.status === 200) {
        toast.success("OTP verified!");
        setStep(3);
      } else {
        throw new Error("Unexpected response status: " + response.status);
      }
    } catch (error: any) {
      console.error("OTP verification failed:", error.response ? error.response.data : error.message);
      toast.error(error.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    try {
      const response = await forgotPasswordService.changePassword(formData.email, formData.password);
      if (response.status === 200) {
        toast.success("Password changed successfully!");
        navigate("/member/login");
      } else {
        throw new Error("Unexpected response status: " + response.status);
      }
    } catch (error: any) {
      console.error("Password change failed:", error.response ? error.response.data : error.message);
      toast.error(error.response?.data?.message || "Failed to change password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIcon = () => {
    if (step === 1) return <Mail className="w-6 h-6" />;
    if (step === 2) return <KeyRound className="w-6 h-6" />;
    return <Lock className="w-6 h-6" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
              <Users className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-700">Member Portal</h2>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Reset Password</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step >= s
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-8 h-1 rounded transition-all ${
                      step > s ? "bg-green-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Card */}
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-green-600 to-green-700"></div>

          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                {getStepIcon()}
              </div>
            </div>
            <CardTitle>
              {step === 1 ? "Verify Email" : step === 2 ? "Enter OTP" : "Set New Password"}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? "Enter your member email to receive an OTP"
                : step === 2
                ? "Enter the 6-digit OTP sent to your email"
                : "Create a new secure password"}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="member@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`pl-10 h-11 ${errors.email ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                <Button
                  onClick={handleVerifyEmail}
                  className="w-full h-11 bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">One-Time Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={formData.otp}
                      onChange={handleInputChange}
                      maxLength={6}
                      required
                      className={`pl-10 h-11 ${errors.otp ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.otp && (
                    <p className="text-sm text-red-500">{errors.otp}</p>
                  )}
                </div>
                <Button
                  onClick={handleVerifyOtp}
                  className="w-full h-11 bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>
                <button
                  onClick={() => setStep(1)}
                  className="w-full text-sm text-green-600 hover:text-green-700 hover:underline"
                >
                  Change email address
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className={`pl-10 pr-10 h-11 ${errors.password ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repeatPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="repeatPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={formData.repeatPassword}
                      onChange={handleInputChange}
                      required
                      className={`pl-10 pr-10 h-11 ${errors.repeatPassword ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.repeatPassword && (
                    <p className="text-sm text-red-500">{errors.repeatPassword}</p>
                  )}
                </div>
                <Button
                  onClick={handleChangePassword}
                  className="w-full h-11 bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Changing Password..." : "Change Password"}
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-center pb-6">
            <Link
              to="/member/login"
              className="flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Member Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default MemberForgotPassword;
