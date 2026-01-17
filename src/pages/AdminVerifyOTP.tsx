import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { otpService } from "@/services/otpService";
import { toast } from "@/components/ui/sonner";
import { Loader2, Shield } from "lucide-react";

const AdminVerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get email and source from navigation state
  const email = location.state?.email || "";
  const fromLogin = location.state?.fromLogin || false;

  useEffect(() => {
    // If no email, redirect back to admin login
    if (!email) {
      navigate("/admin/login");
    }
  }, [email, navigate]);

  // Mask email for display
  const maskEmail = (email: string) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    const maskedLocal = localPart.slice(0, 2) + "*".repeat(localPart.length - 2);
    return `${maskedLocal}@${domain}`;
  };

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);
    try {
      await otpService.verifyOTP({
        email,
        otp: otpCode,
      });

      toast.success("OTP verified successfully!");

      if (fromLogin) {
        toast.info("You can now log in with your credentials.");
      }

      navigate("/admin/login");
    } catch (error: any) {
      console.error("OTP verification failed:", error);
      const errorMessage = error.response?.data?.message || "Invalid OTP. Please try again.";
      toast.error(errorMessage);

      // Clear OTP inputs on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await otpService.sendOTP({ email });
      toast.success("OTP sent successfully! Check your email.");

      // Clear existing OTP
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      console.error("Resend OTP failed:", error);
      const errorMessage = error.response?.data?.message || "Failed to resend OTP. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Shield className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-700">Admin Portal</h2>
        </div>

        {/* OTP Card */}
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700"></div>

          <CardContent className="px-6 py-8">
            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                <span className="text-blue-600">OTP</span> Verification
              </h1>
              {fromLogin ? (
                <p className="text-sm text-gray-600 mb-1">
                  Your account requires <span className="font-semibold text-blue-600">OTP verification</span> before login
                </p>
              ) : (
                <p className="text-sm text-gray-600 mb-1">
                  We have sent a <span className="font-semibold text-blue-600">One Time Password</span>
                </p>
              )}
              <p className="text-sm text-gray-600">
                to <span className="font-semibold">{maskEmail(email)}</span>
              </p>
            </div>

            {/* OTP Input */}
            <div className="mb-6">
              <p className="text-center text-sm font-medium text-gray-700 mb-4">
                Please Enter OTP
              </p>

              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    aria-label={`OTP digit ${index + 1}`}
                    className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold text-blue-600 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              disabled={isLoading || otp.some((digit) => !digit)}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>

            {/* Resend OTP */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Have a problem with verification?{" "}
                <button
                  onClick={handleResendOTP}
                  disabled={isResending || isLoading}
                  className="text-blue-600 font-semibold hover:text-blue-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? "Sending..." : "Resend OTP"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/admin/login")}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Back to Admin Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminVerifyOTP;
