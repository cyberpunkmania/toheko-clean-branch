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

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [isLoading, setIsLoading] = useState(false);
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
      //console.log("API Response:", response); // Log the response for debugging
      if (response.status === 200) {
        toast.success("OTP sent to your email!");
        setStep(2);
      } else {
        throw new Error("Unexpected response status: " + response.status);
      }
    } catch (error) {
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
      //console.log("API Response:", response); // Log the response for debugging
      if (response.status === 200) {
        toast.success("OTP verified!");
        setStep(3);
      } else {
        throw new Error("Unexpected response status: " + response.status);
      }
    } catch (error) {
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
      //console.log("API Response:", response); // Log the response for debugging
      if (response.status === 200) {
        toast.success("Password changed successfully!");
        navigate("/login");
      } else {
        throw new Error("Unexpected response status: " + response.status);
      }
    } catch (error) {
      console.error("Password change failed:", error.response ? error.response.data : error.message);
      toast.error(error.response?.data?.message || "Failed to change password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-sacco-500 to-success-500 flex items-center justify-center text-white font-bold text-xl">
            M
          </div>
        </div>
        <h2 className="mt-3 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            return to login
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {step === 1 ? "Verify Email" : step === 2 ? "Enter OTP" : "Set New Password"}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 1
                ? "Enter your email to receive an OTP"
                : step === 2
                ? "Enter the OTP sent to your email"
                : "Enter your new password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                <Button
                  onClick={handleVerifyEmail}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter the 6-digit OTP"
                    value={formData.otp}
                    onChange={handleInputChange}
                    required
                    className={errors.otp ? "border-red-500" : ""}
                  />
                  {errors.otp && (
                    <p className="text-sm text-red-500">{errors.otp}</p>
                  )}
                </div>
                <Button
                  onClick={handleVerifyOtp}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your new password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className={errors.password ? "border-red-500" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repeatPassword">Confirm Password</Label>
                  <Input
                    id="repeatPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={formData.repeatPassword}
                    onChange={handleInputChange}
                    required
                    className={errors.repeatPassword ? "border-red-500" : ""}
                  />
                  {errors.repeatPassword && (
                    <p className="text-sm text-red-500">{errors.repeatPassword}</p>
                  )}
                </div>
                <Button
                  onClick={handleChangePassword}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Changing Password..." : "Change Password"}
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Remembered your password?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;