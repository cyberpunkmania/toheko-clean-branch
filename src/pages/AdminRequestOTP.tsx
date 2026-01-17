import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { otpService } from "@/services/otpService";
import { toast } from "@/components/ui/sonner";
import { Loader2, Mail, ArrowRight, Shield } from "lucide-react";

const AdminRequestOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fromLogin = location.state?.fromLogin || false;

  // Mask email for display
  const maskEmail = (email: string) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (!localPart || !domain) return email;
    const maskedLocal = localPart.slice(0, 2) + "*".repeat(Math.max(localPart.length - 2, 0));
    return `${maskedLocal}@${domain}`;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    try {
      await otpService.sendOTP({ email });
      toast.success("OTP sent successfully! Please check your email.");
      setIsOtpSent(true);

      // Focus first OTP input after a short delay
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.errorMessage ||
        error.message ||
        "Failed to send OTP. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
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

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setIsVerifying(true);
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
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.errorMessage ||
        error.message ||
        "Invalid OTP. Please try again.";
      toast.error(errorMessage);

      // Clear OTP inputs on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsSending(true);
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
      setIsSending(false);
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
            {!isOtpSent ? (
              <>
                {/* Email Input Section */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    <span className="text-blue-600">Request</span> OTP
                  </h1>
                  {fromLogin ? (
                    <p className="text-sm text-gray-600">
                      Your account requires <span className="font-semibold text-blue-600">OTP verification</span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Enter your email to receive a verification code
                    </p>
                  )}
                </div>

                <form onSubmit={handleSendOTP} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 pl-10 text-base"
                        disabled={isSending}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSending || !email}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Send OTP
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <>
                {/* OTP Verification Section */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    <span className="text-blue-600">Verify</span> OTP
                  </h1>
                  <p className="text-sm text-gray-600 mb-1">
                    We have sent a <span className="font-semibold text-blue-600">One Time Password</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    to <span className="font-semibold">{maskEmail(email)}</span>
                  </p>
                  <button
                    onClick={() => setIsOtpSent(false)}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Change email?
                  </button>
                </div>

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
                        disabled={isVerifying}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={isVerifying || otp.some((digit) => !digit)}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?{" "}
                    <button
                      onClick={handleResendOTP}
                      disabled={isSending || isVerifying}
                      className="text-blue-600 font-semibold hover:text-blue-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSending ? "Sending..." : "Resend OTP"}
                    </button>
                  </p>
                </div>
              </>
            )}
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

export default AdminRequestOTP;
