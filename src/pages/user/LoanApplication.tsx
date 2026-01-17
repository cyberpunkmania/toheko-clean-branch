import React, { useState, useEffect } from 'react';
import UserDashboardLayout from './layout/UserDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/sonner';
import { ArrowRight, ArrowLeft, CheckCircle, CreditCard, User, Shield, FileText, Plus, Trash2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import {
  userLoanService,
  LoanProduct,
  LoanApplicationRequest,
  GuarantorRequest,
  CollateralRequest,
  NextOfKinRequest,
  LoanApplicationResponse
} from '@/services/user-services/userLoanService';
import { userMemberService, MemberDetails } from '@/services/user-services/userMemberService';

// JWT token interface
interface TohekoJwtPayload {
  sub: string;
  userId: number;
  role: string;
  exp?: number;
  iat?: number;
}

const LoanApplication = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [selectedLoanProduct, setSelectedLoanProduct] = useState<LoanProduct | null>(null);
  const [loanApplicationId, setLoanApplicationId] = useState<number | null>(null);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false); // Track if main application is submitted
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // Track confirmation modal state
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null);
  const [loadingMemberDetails, setLoadingMemberDetails] = useState(false);
  
  // Application form data (only fields shown in UI)
  const [applicationForm, setApplicationForm] = useState({
    amount: '',
    termDays: '',
    mobileNumber: '',
    occupation: '',
    loanPurpose: '',
    groupId: 0
  });
  
  // Validation error states
  const [amountError, setAmountError] = useState('');
  const [termError, setTermError] = useState('');

  // Guarantors, Collaterals, Next of Kin
  const [guarantors, setGuarantors] = useState<GuarantorRequest[]>([]);
  const [collaterals, setCollaterals] = useState<CollateralRequest[]>([]);
  const [nextOfKin, setNextOfKin] = useState<NextOfKinRequest[]>([]);

  // Function to reset application state
  const resetApplication = () => {
    setCurrentStep(1);
    setSelectedLoanProduct(null);
    setLoanApplicationId(null);
    setApplicationSubmitted(false);
    setApplicationForm({
      amount: '',
      termDays: '',
      mobileNumber: '',
      occupation: '',
      loanPurpose: '',
      groupId: 0
    });
    setGuarantors([]);
    setCollaterals([]);
    setNextOfKin([]);
    setMemberDetails(null); // Reset member details too
  };

  // Fetch loan products when component mounts
  useEffect(() => {
    const fetchLoanProducts = async () => {
      try {
        setLoading(true);
        // Fetch active loan products for MEMBER applicant type
        const productsData = await userLoanService.getActiveLoanProductsByApplicantType('MEMBER');
        setLoanProducts(productsData.content.filter(product => product.isActive));
      } catch (error) {
        console.error('Error fetching loan products:', error);
        setError('Failed to load loan products');
      } finally {
        setLoading(false);
      }
    };

    fetchLoanProducts();
  }, []);

  // Fetch member details when component mounts or when reaching step 2
  useEffect(() => {
    if (currentStep === 2 && !memberDetails && !loadingMemberDetails) {
      fetchMemberDetails();
    }
  }, [currentStep, memberDetails, loadingMemberDetails]);

  // Get user ID from JWT token
  const getUserId = (): number | null => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decoded = jwtDecode<TohekoJwtPayload>(token);
      return decoded.userId;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Fetch member details for background use
  const fetchMemberDetails = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      setLoadingMemberDetails(true);
      const details = await userMemberService.getMemberDetails(userId);
      setMemberDetails(details);

      // Only populate the mobile number field (which remains editable)
      setApplicationForm(prev => ({
        ...prev,
        mobileNumber: details.phoneNumber || ''
      }));
    } catch (error) {
      console.error('Error fetching member details:', error);
      toast.error('Failed to load member details');
    } finally {
      setLoadingMemberDetails(false);
    }
  };

  // Validation function for loan amount
  const validateAmount = (value: string): boolean => {
    setAmountError('');
    
    if (!value || value.trim() === '') {
      setAmountError('Loan amount is required');
      return false;
    }
    
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      setAmountError('Please enter a valid number');
      return false;
    }
    
    if (numValue <= 0) {
      setAmountError('Amount must be greater than 0');
      return false;
    }
    
    if (selectedLoanProduct) {
      if (numValue < selectedLoanProduct.minAmount) {
        setAmountError(`Amount cannot be less than KES ${selectedLoanProduct.minAmount.toLocaleString()}`);
        return false;
      }
      
      if (numValue > selectedLoanProduct.maxAmount) {
        setAmountError(`Amount cannot exceed KES ${selectedLoanProduct.maxAmount.toLocaleString()}`);
        return false;
      }
    }
    
    return true;
  };

  // Validation function for term days
  const validateTermDays = (value: string): boolean => {
    setTermError('');
    
    if (!value || value.trim() === '') {
      setTermError('Loan term is required');
      return false;
    }
    
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      setTermError('Please enter a valid number');
      return false;
    }
    
    if (numValue <= 0 || !Number.isInteger(numValue)) {
      setTermError('Term must be a positive whole number');
      return false;
    }
    
    if (selectedLoanProduct) {
      if (numValue < selectedLoanProduct.minTermDays) {
        setTermError(`Term cannot be less than ${selectedLoanProduct.minTermDays} days`);
        return false;
      }
      
      if (numValue > selectedLoanProduct.maxTermDays) {
        setTermError(`Term cannot exceed ${selectedLoanProduct.maxTermDays} days`);
        return false;
      }
    }
    
    return true;
  };

  const nextStep = () => {
    // Validation logic for each step
    if (currentStep === 1 && !selectedLoanProduct) {
      toast.error('Please select a loan product');
      return;
    }
    
    if (currentStep === 2) {
      // Validate amount
      if (!validateAmount(applicationForm.amount)) {
        toast.error(amountError || 'Please enter a valid loan amount');
        return;
      }

      // Validate term days
      if (!validateTermDays(applicationForm.termDays)) {
        toast.error(termError || 'Please enter a valid loan term');
        return;
      }

      if (!applicationForm.mobileNumber || !applicationForm.occupation || !applicationForm.loanPurpose) {
        toast.error('Please fill in all required fields (marked with *)');
        return;
      }
    }
    
    if (currentStep < getTotalSteps()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    // If application is submitted, only allow navigation between guarantor/collateral/next of kin steps
    if (applicationSubmitted) {
      const minStep = getMinStepAfterSubmission();
      if (currentStep > minStep) {
        setCurrentStep(currentStep - 1);
      }
    } else {
      // Before submission, normal navigation
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  // Get the minimum step number after application submission (first step after application details)
  const getMinStepAfterSubmission = () => {
    if (!selectedLoanProduct) return 3;
    
    let minStep = 3; // Start after application details step
    
    if (selectedLoanProduct.requiresGuarantor) return minStep;
    minStep++;
    
    if (selectedLoanProduct.requiresCollateral) return minStep;
    minStep++;
    
    if (selectedLoanProduct.requiresNextOfKin) return minStep;
    
    return minStep; // Review step
  };

  const getTotalSteps = () => {
    if (!selectedLoanProduct) return 5;
    
    let steps = 3; // Product selection + Application details + Review/Submit
    
    if (selectedLoanProduct.requiresGuarantor) steps++;
    if (selectedLoanProduct.requiresCollateral) steps++;
    if (selectedLoanProduct.requiresNextOfKin) steps++;
    
    return steps;
  };

  const getCurrentStepInfo = () => {
    if (!selectedLoanProduct) {
      return {
        1: 'Product',
        2: 'Details', 
        3: 'Review'
      };
    }

    const steps: { [key: number]: string } = {
      1: 'Product',
      2: 'Details'
    };

    let stepCounter = 3;
    
    if (selectedLoanProduct.requiresGuarantor) {
      steps[stepCounter] = 'Guarantor';
      stepCounter++;
    }
    
    if (selectedLoanProduct.requiresCollateral) {
      steps[stepCounter] = 'Collateral';
      stepCounter++;
    }
    
    if (selectedLoanProduct.requiresNextOfKin) {
      steps[stepCounter] = 'Next of Kin';
      stepCounter++;
    }
    
    steps[stepCounter] = 'Review';
    
    return steps;
  };

  const handleSubmitApplication = () => {
    // Show confirmation modal instead of submitting directly
    setShowConfirmationModal(true);
  };

  const confirmSubmitApplication = async () => {
    setIsLoading(true);
    setShowConfirmationModal(false);
    
    try {
      const userId = getUserId();
      if (!userId) {
        toast.error('User not authenticated');
        return;
      }

      const applicationData: LoanApplicationRequest = {
        loanProductId: selectedLoanProduct!.id,
        applicationNo: `LA-${Date.now()}`, // Generate application number
        memberId: userId,
        amount: Number(applicationForm.amount),
        firstName: memberDetails?.firstName || '',
        lastName: memberDetails?.lastName || '',
        middleName: memberDetails?.otherNames || '',
        termDays: Number(applicationForm.termDays),
        email: memberDetails?.email || '',
        groupId: applicationForm.groupId,
        mobileNumber: applicationForm.mobileNumber,
        address: memberDetails?.address || '',
        occupation: applicationForm.occupation,
        dob: memberDetails?.dob || '',
        gender: memberDetails?.gender || '',
        loanPurpose: applicationForm.loanPurpose,
        status: 'PENDING'
      };

      const response = await userLoanService.createLoanApplication(applicationData);
      setLoanApplicationId(response.data.loanApplicationId);
      setApplicationSubmitted(true); // Mark application as submitted
      
      toast.success('Loan application submitted successfully!');
      
      // Move to next step (guarantors/collaterals/review)
      setCurrentStep(currentStep + 1);
      
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit loan application');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubmitApplication = () => {
    setShowConfirmationModal(false);
  };

  const handleSubmitGuarantors = async () => {
    if (guarantors.length === 0) {
      toast.error('Please add at least one guarantor');
      return;
    }

    setIsLoading(true);
    try {
      for (const guarantor of guarantors) {
        await userLoanService.addGuarantor({
          ...guarantor,
          loanApplicationId: loanApplicationId!
        });
      }
      toast.success('Guarantors added successfully!');
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Error adding guarantors:', error);
      toast.error('Failed to add guarantors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitCollaterals = async () => {
    if (collaterals.length === 0) {
      toast.error('Please add at least one collateral');
      return;
    }

    setIsLoading(true);
    try {
      for (const collateral of collaterals) {
        await userLoanService.addCollateral({
          ...collateral,
          loanApplicationId: loanApplicationId!
        });
      }
      toast.success('Collaterals added successfully!');
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Error adding collaterals:', error);
      toast.error('Failed to add collaterals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitNextOfKin = async () => {
    if (nextOfKin.length === 0) {
      toast.error('Please add at least one next of kin');
      return;
    }

    setIsLoading(true);
    try {
      for (const nok of nextOfKin) {
        await userLoanService.addNextOfKin({
          ...nok,
          loanApplicationId: loanApplicationId!
        });
      }
      toast.success('Next of kin added successfully!');
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Error adding next of kin:', error);
      toast.error('Failed to add next of kin');
    } finally {
      setIsLoading(false);
    }
  };

  const addGuarantor = () => {
    setGuarantors([...guarantors, {
      loanApplicationId: 0,
      guarantorName: '',
      relationship: '',
      guarantorContact: '',
      guarantorIdNumber: '',
      guaranteedAmount: 0,
      memberCode: ''
    }]);
  };

  const removeGuarantor = (index: number) => {
    setGuarantors(guarantors.filter((_, i) => i !== index));
  };

  const updateGuarantor = (index: number, field: keyof GuarantorRequest, value: string | number) => {
    const updated = [...guarantors];
    updated[index] = { ...updated[index], [field]: value };
    setGuarantors(updated);
  };

  const addCollateral = () => {
    setCollaterals([...collaterals, {
      loanApplicationId: 0,
      type: '',
      description: '',
      estimatedValue: 0,
      ownerName: '',
      ownerContact: '',
      memberCode: ''
    }]);
  };

  const removeCollateral = (index: number) => {
    setCollaterals(collaterals.filter((_, i) => i !== index));
  };

  const updateCollateral = (index: number, field: keyof CollateralRequest, value: string | number) => {
    const updated = [...collaterals];
    updated[index] = { ...updated[index], [field]: value };
    setCollaterals(updated);
  };

  const addNextOfKinItem = () => {
    setNextOfKin([...nextOfKin, {
      loanApplicationId: 0,
      name: '',
      relationship: '',
      phone: '',
      email: '',
      address: '',
      memberCode: ''
    }]);
  };

  const removeNextOfKin = (index: number) => {
    setNextOfKin(nextOfKin.filter((_, i) => i !== index));
  };

  const updateNextOfKin = (index: number, field: keyof NextOfKinRequest, value: string) => {
    const updated = [...nextOfKin];
    updated[index] = { ...updated[index], [field]: value };
    setNextOfKin(updated);
  };

  // Render different steps based on current step
  const renderStep = () => {
    const stepInfo = getCurrentStepInfo();
    
    switch (currentStep) {
      case 1:
        return (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {applicationSubmitted ? 'Current Application' : 'Select Loan Product'}
              </CardTitle>
              <CardDescription className="text-xs">
                {applicationSubmitted ? 
                  'You have an active loan application. You can start a new application or continue with the current one.' :
                  'Choose the loan product that best fits your needs'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              {applicationSubmitted ? (
                // Show current application summary when application is submitted
                <div className="space-y-4">
                  <div className="border rounded-md p-4 bg-primary/5 border-primary/20">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{selectedLoanProduct?.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">Application ID: {loanApplicationId}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Amount: </span>
                            <span>KES {applicationForm.amount}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Term: </span>
                            <span>{applicationForm.termDays} days</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status: </span>
                            <span className="text-orange-600 font-medium">PENDING</span>
                          </div>
                        </div>

                        <div className="flex gap-1 mt-2">
                          {selectedLoanProduct?.requiresGuarantor && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Guarantor Required</span>
                          )}
                          {selectedLoanProduct?.requiresCollateral && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Collateral Required</span>
                          )}
                          {selectedLoanProduct?.requiresNextOfKin && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Next of Kin Required</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={resetApplication}
                      className="w-full"
                      size="sm"
                    >
                      Start New Application
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(2)}
                      className="w-full"
                      size="sm"
                    >
                      Continue Current Application
                    </Button>
                  </div>
                </div>
              ) : (
                // Show loan product selection when no application is submitted
                loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-4 text-destructive text-sm">
                    <p>{error}</p>
                  </div>
                ) : loanProducts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <p>No loan products available</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {loanProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`p-4 border rounded-md cursor-pointer transition-colors ${
                          selectedLoanProduct?.id === product.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedLoanProduct(product)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-sm">{product.name}</h3>
                            <p className="text-xs text-muted-foreground mb-2">{product.description}</p>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Amount: </span>
                                <span>KES {product.minAmount} - KES {product.maxAmount}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Interest: </span>
                                <span>{product.interestRate}% ({product.interestMethod})</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Term: </span>
                                <span>{product.minTermDays} - {product.maxTermDays} days</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Code: </span>
                                <span>{product.loanProductCode}</span>
                              </div>
                            </div>

                            <div className="flex gap-1 mt-2">
                              {product.requiresGuarantor && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Guarantor Required</span>
                              )}
                              {product.requiresCollateral && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Collateral Required</span>
                              )}
                              {product.requiresNextOfKin && (
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Next of Kin Required</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </CardContent>
            <CardFooter className="pt-2">
              {!applicationSubmitted && (
                <Button 
                  disabled={!selectedLoanProduct || loading} 
                  onClick={nextStep}
                  className="ml-auto"
                  size="sm"
                >
                  Next <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </CardFooter>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
              <CardDescription>
                {applicationSubmitted ? 
                  'Your application has been submitted. You can now add guarantors, collaterals, or next of kin if required.' :
                  `Enter your loan application details for ${selectedLoanProduct?.name}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applicationSubmitted ? (
                // Show read-only summary when application is submitted
                <div className="space-y-4">
                  <div className="border rounded-md p-4 bg-muted/30">
                    <h3 className="font-medium text-sm mb-3">Submitted Application Details</h3>
                    <div className="grid gap-3 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-muted-foreground">Loan Amount: </span>
                          <span className="font-medium">KES {applicationForm.amount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Term: </span>
                          <span className="font-medium">{applicationForm.termDays} days</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="text-muted-foreground">Name: </span>
                          <span className="font-medium">{memberDetails?.firstName} {memberDetails?.otherNames} {memberDetails?.lastName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email: </span>
                          <span className="font-medium">{memberDetails?.email}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Phone: </span>
                          <span className="font-medium">{applicationForm.mobileNumber}</span>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Application ID: </span>
                        <span className="font-medium text-primary">{loanApplicationId}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      ✓ Your loan application has been successfully submitted. 
                      {selectedLoanProduct?.requiresGuarantor || selectedLoanProduct?.requiresCollateral || selectedLoanProduct?.requiresNextOfKin ? 
                        ' Please complete the additional requirements below.' : 
                        ' You can now review your complete application.'}
                    </p>
                  </div>
                </div>
              ) : (
                // Show editable form when application is not submitted yet
                <div className="grid gap-4">
                  {loadingMemberDetails && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        <p className="text-sm text-blue-800">Loading your member details...</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Loan Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder={`KES ${selectedLoanProduct?.minAmount.toLocaleString()} - KES ${selectedLoanProduct?.maxAmount.toLocaleString()}`}
                        value={applicationForm.amount}
                        min={selectedLoanProduct?.minAmount}
                        max={selectedLoanProduct?.maxAmount}
                        onChange={(e) => {
                          setApplicationForm({...applicationForm, amount: e.target.value});
                          if (e.target.value) {
                            validateAmount(e.target.value);
                          } else {
                            setAmountError('');
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value) {
                            validateAmount(e.target.value);
                          }
                        }}
                        className={amountError ? 'border-red-500' : ''}
                      />
                      {amountError && (
                        <p className="text-xs text-red-500 mt-1">{amountError}</p>
                      )}
                      {applicationForm.amount && !amountError && Number(applicationForm.amount) > 0 && (
                        <p className="text-xs text-green-600 mt-1">✓ Valid amount: KES {Number(applicationForm.amount).toLocaleString()}</p>
                      )}
                      {selectedLoanProduct && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Range: KES {selectedLoanProduct.minAmount.toLocaleString()} - KES {selectedLoanProduct.maxAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="termDays">Term (Days)</Label>
                      <Input
                        id="termDays"
                        type="number"
                        placeholder={`${selectedLoanProduct?.minTermDays} - ${selectedLoanProduct?.maxTermDays}`}
                        value={applicationForm.termDays}
                        min={selectedLoanProduct?.minTermDays}
                        max={selectedLoanProduct?.maxTermDays}
                        step="1"
                        onChange={(e) => {
                          setApplicationForm({...applicationForm, termDays: e.target.value});
                          if (e.target.value) {
                            validateTermDays(e.target.value);
                          } else {
                            setTermError('');
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value) {
                            validateTermDays(e.target.value);
                          }
                        }}
                        className={termError ? 'border-red-500' : ''}
                      />
                      {termError && (
                        <p className="text-xs text-red-500 mt-1">{termError}</p>
                      )}
                      {applicationForm.termDays && !termError && Number(applicationForm.termDays) > 0 && (
                        <p className="text-xs text-green-600 mt-1">✓ Valid term: {applicationForm.termDays} days</p>
                      )}
                      {selectedLoanProduct && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Range: {selectedLoanProduct.minTermDays} - {selectedLoanProduct.maxTermDays} days
                        </p>
                      )}
                    </div>
                  </div>



                  <div className="grid gap-2">
                    <Label htmlFor="mobileNumber">Mobile Number *</Label>
                    <Input
                      id="mobileNumber"
                      value={applicationForm.mobileNumber}
                      onChange={(e) => setApplicationForm({...applicationForm, mobileNumber: e.target.value})}
                      placeholder={loadingMemberDetails ? "Loading..." : "Enter mobile number (254XXXXXXXXX)"}
                    />
                    <p className="text-xs text-muted-foreground">
                      {memberDetails ? "Pre-filled from your profile, you can edit if needed" : "Enter your mobile number"}
                    </p>
                  </div>



                  <div className="grid gap-2">
                    <Label htmlFor="occupation">Occupation *</Label>
                    <Input
                      id="occupation"
                      value={applicationForm.occupation}
                      onChange={(e) => setApplicationForm({...applicationForm, occupation: e.target.value})}
                      placeholder="Enter your occupation"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="loanPurpose">Loan Purpose *</Label>
                    <Textarea
                      id="loanPurpose"
                      placeholder="Describe the purpose of this loan"
                      value={applicationForm.loanPurpose}
                      onChange={(e) => setApplicationForm({...applicationForm, loanPurpose: e.target.value})}
                      required
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={applicationSubmitted} // Disable back button when application is submitted
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {!applicationSubmitted ? (
                <Button onClick={handleSubmitApplication} disabled={isLoading}>
                  {isLoading ? 'Submitting...' : 'Submit Application'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={nextStep}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        );

      default: {
        // Handle guarantor, collateral, next of kin, and review steps
        const stepName = stepInfo[currentStep];
        
        if (stepName === 'Guarantor') {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Add Guarantors</CardTitle>
                <CardDescription>
                  Add guarantors for your loan application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {guarantors.map((guarantor, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium">Guarantor {index + 1}</h3>
                        <Button variant="outline" size="sm" onClick={() => removeGuarantor(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Guarantor Name</Label>
                          <Input
                            value={guarantor.guarantorName}
                            onChange={(e) => updateGuarantor(index, 'guarantorName', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Relationship</Label>
                          <Input
                            value={guarantor.relationship}
                            onChange={(e) => updateGuarantor(index, 'relationship', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Contact</Label>
                          <Input
                            value={guarantor.guarantorContact}
                            onChange={(e) => updateGuarantor(index, 'guarantorContact', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>ID Number</Label>
                          <Input
                            value={guarantor.guarantorIdNumber}
                            onChange={(e) => updateGuarantor(index, 'guarantorIdNumber', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Guaranteed Amount</Label>
                          <Input
                            type="number"
                            value={guarantor.guaranteedAmount}
                            onChange={(e) => updateGuarantor(index, 'guaranteedAmount', Number(e.target.value))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Member Code</Label>
                          <Input
                            value={guarantor.memberCode}
                            onChange={(e) => updateGuarantor(index, 'memberCode', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" onClick={addGuarantor}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Guarantor
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleSubmitGuarantors} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Continue'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          );
        }

        if (stepName === 'Collateral') {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Add Collaterals</CardTitle>
                <CardDescription>
                  Add collateral items for your loan application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {collaterals.map((collateral, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium">Collateral {index + 1}</h3>
                        <Button variant="outline" size="sm" onClick={() => removeCollateral(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Type</Label>
                          <Input
                            value={collateral.type}
                            onChange={(e) => updateCollateral(index, 'type', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Estimated Value</Label>
                          <Input
                            type="number"
                            value={collateral.estimatedValue}
                            onChange={(e) => updateCollateral(index, 'estimatedValue', Number(e.target.value))}
                          />
                        </div>
                        <div className="grid gap-2 col-span-2">
                          <Label>Description</Label>
                          <Textarea
                            value={collateral.description}
                            onChange={(e) => updateCollateral(index, 'description', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Owner Name</Label>
                          <Input
                            value={collateral.ownerName}
                            onChange={(e) => updateCollateral(index, 'ownerName', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Owner Contact</Label>
                          <Input
                            value={collateral.ownerContact}
                            onChange={(e) => updateCollateral(index, 'ownerContact', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Member Code</Label>
                          <Input
                            value={collateral.memberCode}
                            onChange={(e) => updateCollateral(index, 'memberCode', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" onClick={addCollateral}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Collateral
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleSubmitCollaterals} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Continue'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          );
        }

        if (stepName === 'Next of Kin') {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Add Next of Kin</CardTitle>
                <CardDescription>
                  Add next of kin information for your loan application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nextOfKin.map((nok, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium">Next of Kin {index + 1}</h3>
                        <Button variant="outline" size="sm" onClick={() => removeNextOfKin(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Name</Label>
                          <Input
                            value={nok.name}
                            onChange={(e) => updateNextOfKin(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Relationship</Label>
                          <Input
                            value={nok.relationship}
                            onChange={(e) => updateNextOfKin(index, 'relationship', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Phone</Label>
                          <Input
                            value={nok.phone}
                            onChange={(e) => updateNextOfKin(index, 'phone', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={nok.email}
                            onChange={(e) => updateNextOfKin(index, 'email', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2 col-span-2">
                          <Label>Address</Label>
                          <Textarea
                            value={nok.address}
                            onChange={(e) => updateNextOfKin(index, 'address', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Member Code</Label>
                          <Input
                            value={nok.memberCode}
                            onChange={(e) => updateNextOfKin(index, 'memberCode', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" onClick={addNextOfKinItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Next of Kin
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleSubmitNextOfKin} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Continue'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          );
        }

        if (stepName === 'Review') {
          return (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="text-center text-lg">Application Complete!</CardTitle>
                <CardDescription className="text-center text-xs">
                  Your loan application has been submitted successfully and all requirements have been completed.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="border rounded-md p-3 bg-muted/30">
                  <h3 className="font-medium text-sm mb-2">Application Summary</h3>
                  <div className="grid gap-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loan Product:</span>
                      <span className="font-medium">{selectedLoanProduct?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium">KES {applicationForm.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Term:</span>
                      <span className="font-medium">{applicationForm.termDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest Rate:</span>
                      <span className="font-medium">{selectedLoanProduct?.interestRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Application ID:</span>
                      <span className="font-medium text-primary">{loanApplicationId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium text-orange-600">PENDING</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Submitted:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                    {selectedLoanProduct?.requiresGuarantor && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Guarantors:</span>
                        <span className="font-medium">{guarantors.length} added</span>
                      </div>
                    )}
                    {selectedLoanProduct?.requiresCollateral && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Collaterals:</span>
                        <span className="font-medium">{collaterals.length} added</span>
                      </div>
                    )}
                    {selectedLoanProduct?.requiresNextOfKin && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Next of Kin:</span>
                        <span className="font-medium">{nextOfKin.length} added</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  onClick={() => window.location.href = '/user/dashboard'}
                  size="sm"
                  className="mx-auto"
                >
                  Return to Dashboard
                </Button>
              </CardFooter>
            </Card>
          );
        }

        return null;
      }
    }
  };

  return (
    <UserDashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">Apply for Loan</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Complete the steps below to apply for a loan</p>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="mb-4 bg-card rounded-md p-2 border">
          <div className="flex items-center">
            {Array.from({ length: getTotalSteps() }, (_, index) => index + 1).map((step) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      currentStep === step 
                        ? 'bg-primary text-primary-foreground' 
                        : currentStep > step 
                          ? 'bg-primary/80 text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step}
                  </div>
                  <span className="text-[10px] mt-1 text-muted-foreground hidden md:inline">
                    {getCurrentStepInfo()[step]}
                  </span>
                </div>
                {step < getTotalSteps() && (
                  <div 
                    className={`flex-1 h-0.5 mx-1 ${
                      currentStep > step ? 'bg-primary/80' : 'bg-muted'
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {renderStep()}

        {/* Confirmation Modal for Application Submission */}
        <AlertDialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-sm sm:text-base">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Confirm Loan Application Submission
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm">
                Please review your application details before submission. Once submitted, you cannot modify these details.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-2 sm:py-4">
              <div className="space-y-3 sm:space-y-4">
                {/* Loan Product Information */}
                <div className="border rounded-lg p-3 sm:p-4 bg-muted/30">
                  <h3 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 text-primary">Loan Product</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-muted-foreground">Product: </span>
                      <span className="font-medium">{selectedLoanProduct?.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Interest Rate: </span>
                      <span className="font-medium">{selectedLoanProduct?.interestRate}% ({selectedLoanProduct?.interestMethod})</span>
                    </div>
                  </div>
                </div>

                {/* Loan Details */}
                <div className="border rounded-lg p-3 sm:p-4 bg-muted/30">
                  <h3 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 text-primary">Loan Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-muted-foreground">Amount: </span>
                      <span className="font-medium">KES {applicationForm.amount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Term: </span>
                      <span className="font-medium">{applicationForm.termDays} days</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Purpose: </span>
                      <span className="font-medium">{applicationForm.loanPurpose || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="border rounded-lg p-3 sm:p-4 bg-muted/30">
                  <h3 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 text-primary">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Name: </span>
                      <span className="font-medium">{memberDetails?.firstName} {memberDetails?.otherNames} {memberDetails?.lastName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email: </span>
                      <span className="font-medium">{memberDetails?.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone: </span>
                      <span className="font-medium">{applicationForm.mobileNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gender: </span>
                      <span className="font-medium">{memberDetails?.gender || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date of Birth: </span>
                      <span className="font-medium">{memberDetails?.dob || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Occupation: </span>
                      <span className="font-medium">{applicationForm.occupation || 'Not specified'}</span>
                    </div>
                  </div>
                  {memberDetails?.address && (
                    <div className="mt-2 sm:mt-3">
                      <span className="text-muted-foreground text-xs sm:text-sm">Address: </span>
                      <span className="font-medium text-xs sm:text-sm">{memberDetails.address}</span>
                    </div>
                  )}
                </div>

                {/* Additional Requirements */}
                {(selectedLoanProduct?.requiresGuarantor || selectedLoanProduct?.requiresCollateral || selectedLoanProduct?.requiresNextOfKin) && (
                  <div className="border rounded-lg p-3 sm:p-4 bg-blue-50 border-blue-200">
                    <h3 className="font-semibold text-xs sm:text-sm mb-2 text-blue-800">Additional Requirements</h3>
                    <p className="text-xs text-blue-700 mb-2">After submission, you will need to complete:</p>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {selectedLoanProduct?.requiresGuarantor && (
                        <span className="text-[10px] sm:text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Guarantor Information</span>
                      )}
                      {selectedLoanProduct?.requiresCollateral && (
                        <span className="text-[10px] sm:text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Collateral Details</span>
                      )}
                      {selectedLoanProduct?.requiresNextOfKin && (
                        <span className="text-[10px] sm:text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Next of Kin Information</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel
                onClick={cancelSubmitApplication}
                disabled={isLoading}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmSubmitApplication}
                disabled={isLoading}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isLoading ? 'Submitting...' : 'Confirm & Submit Application'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </UserDashboardLayout>
  );
};

export default LoanApplication;
