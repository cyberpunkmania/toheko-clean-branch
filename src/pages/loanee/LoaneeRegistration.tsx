import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Eye, EyeOff, Mail, Phone, User, Lock, CreditCard, ArrowRight } from "lucide-react";
import axios from "axios";

const LoaneeRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    userFirstname: "",
    userLastname: "",
    userEmail: "",
    userPassword: "",
    confirmPassword: "",
    userPhoneNumber: "",
    userIdNumber: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.userFirstname.trim()) {
      newErrors.userFirstname = "First name is required";
    }

    if (!formData.userLastname.trim()) {
      newErrors.userLastname = "Last name is required";
    }

    if (!formData.userEmail.trim()) {
      newErrors.userEmail = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.userEmail)) {
      newErrors.userEmail = "Email is invalid";
    }

    if (!formData.userPassword) {
      newErrors.userPassword = "Password is required";
    } else if (formData.userPassword.length < 6) {
      newErrors.userPassword = "Password must be at least 6 characters";
    }

    if (formData.userPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.userPhoneNumber.trim()) {
      newErrors.userPhoneNumber = "Phone number is required";
    }

    if (!formData.userIdNumber.trim()) {
      newErrors.userIdNumber = "ID number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      
      const response = await axios.post(
        "https://sacco-app-production.up.railway.app/api/v1/auth/register-loanees",
        registrationData
      );

      if (response.data.otp_required) {
        toast.success(response.data.message || "Registration successful! Please verify OTP.");
        navigate("/loanee/verify-otp", {
          state: {
            email: formData.userEmail,
            userType: "loanee",
            password: formData.userPassword
          }
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sacco-500 via-sacco-600 to-sacco-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sacco-500/30">
              L
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Loanee Registration</h2>
        </div>

        {/* Card */}
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sacco-500 via-sacco-600 to-sacco-700"></div>
          
          <CardHeader className="pb-4 pt-6">
            <CardTitle className="text-xl font-bold text-center text-gray-900">Create Loanee Account</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name Fields */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="userFirstname" className="text-sm font-medium">First Name</Label>
                  <Input
                    id="userFirstname"
                    name="userFirstname"
                    placeholder="John"
                    value={formData.userFirstname}
                    onChange={handleChange}
                    required
                    className={`h-10 transition-all ${errors.userFirstname ? "border-red-500" : ""}`}
                  />
                  {errors.userFirstname && <p className="text-xs text-red-500">{errors.userFirstname}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="userLastname" className="text-sm font-medium">Last Name</Label>
                  <Input
                    id="userLastname"
                    name="userLastname"
                    placeholder="Doe"
                    value={formData.userLastname}
                    onChange={handleChange}
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
                      name="userEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.userEmail}
                      onChange={handleChange}
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
                      name="userPhoneNumber"
                      type="tel"
                      placeholder="0712345678"
                      value={formData.userPhoneNumber}
                      onChange={handleChange}
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
                    name="userIdNumber"
                    type="text"
                    placeholder="12345678"
                    value={formData.userIdNumber}
                    onChange={handleChange}
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
                      name="userPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.userPassword}
                      onChange={handleChange}
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
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className={`h-10 pl-9 pr-9 transition-all ${errors.confirmPassword ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-sacco-600 to-sacco-700 hover:from-sacco-700 hover:to-sacco-800 shadow-lg hover:shadow-xl transition-all group" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registering...
                    </span>
                  ) : (
                    <>
                      Register as Loanee
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
              <Link to="/loanee/login" className="font-semibold text-sacco-600 hover:text-sacco-700 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoaneeRegistration;
