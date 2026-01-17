import React, { useState, useEffect } from 'react';
import LoaneeDashboardLayout from './layout/LoaneeDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/sonner';
import { ArrowRight, ArrowLeft, CheckCircle, CreditCard, FileText, Plus, Trash2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import {
  userLoanService,
  LoanProduct,
  LoanApplicationRequest,
  GuarantorRequest,
  CollateralRequest,
  NextOfKinRequest,
} from '@/services/user-services/userLoanService';

// JWT token interface
interface TohekoJwtPayload {
  sub: string;
  userId: number;
  role: string;
  exp?: number;
  iat?: number;
}

const LoaneeLoanApplication = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [selectedLoanProduct, setSelectedLoanProduct] = useState<LoanProduct | null>(null);
  const [loanApplicationId, setLoanApplicationId] = useState<number | null>(null);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  
  // Application form data
  const [applicationForm, setApplicationForm] = useState({
    amount: '',
    termDays: '',
    mobileNumber: '',
    occupation: '',
    loanPurpose: '',
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    dob: '',
    gender: '',
    groupId: 0
  });
  
  // Validation error states
  const [amountError, setAmountError] = useState('');
  const [termError, setTermError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

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
      firstName: '',
      lastName: '',
      email: '',
      address: '',
      dob: '',
      gender: '',
      groupId: 0
    });
    setGuarantors([]);
    setCollaterals([]);
    setNextOfKin([]);
  };

  // Fetch loan products when component mounts
  useEffect(() => {
    const fetchLoanProducts = async () => {
      try {
        setLoading(true);
        // Fetch active loan products for LOANEE applicant type
        const productsData = await userLoanService.getActiveLoanProductsByApplicantType('LOANEE');
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

  // Validation function for email
  const validateEmail = (value: string): boolean => {
    setEmailError('');
    
    if (!value || value.trim() === '') {
      setEmailError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  // Validation function for phone number
  const validatePhone = (value: string): boolean => {
    setPhoneError('');
    
    if (!value || value.trim() === '') {
      setPhoneError('Phone number is required');
      return false;
    }
    
    const phoneRegex = /^(\+254|0)?[17]\d{8}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      setPhoneError('Please enter a valid Kenyan phone number');
      return false;
    }
    
    return true;
  };

  // Validate all form fields
  const validateAllFields = (): boolean => {
    const errors: {[key: string]: string} = {};
    let isValid = true;

    // Amount validation
    if (!validateAmount(applicationForm.amount)) {
      isValid = false;
    }

    // Term validation
    if (!validateTermDays(applicationForm.termDays)) {
      isValid = false;
    }

    // Email validation
    if (!validateEmail(applicationForm.email)) {
      isValid = false;
    }

    // Phone validation
    if (!validatePhone(applicationForm.mobileNumber)) {
      isValid = false;
    }

    // Required text fields
    if (!applicationForm.firstName || !applicationForm.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    }

    if (!applicationForm.lastName || !applicationForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!applicationForm.occupation || !applicationForm.occupation.trim()) {
      errors.occupation = 'Occupation is required';
      isValid = false;
    }

    if (!applicationForm.loanPurpose || !applicationForm.loanPurpose.trim()) {
      errors.loanPurpose = 'Loan purpose is required';
      isValid = false;
    }

    if (!applicationForm.address || !applicationForm.address.trim()) {
      errors.address = 'Address is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const nextStep = () => {
    if (currentStep === 1 && !selectedLoanProduct) {
      toast.error('Please select a loan product');
      return;
    }
    
    if (currentStep === 2) {
      if (!validateAllFields()) {
        // Show first error found
        if (amountError) {
          toast.error(amountError);
        } else if (termError) {
          toast.error(termError);
        } else if (emailError) {
          toast.error(emailError);
        } else if (phoneError) {
          toast.error(phoneError);
        } else {
          const firstError = Object.values(formErrors)[0];
          toast.error(firstError || 'Please fill in all required fields');
        }
        return;
      }
    }
    
    if (currentStep < getTotalSteps()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (applicationSubmitted) {
      const minStep = getMinStepAfterSubmission();
      if (currentStep > minStep) {
        setCurrentStep(currentStep - 1);
      }
    } else {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const getMinStepAfterSubmission = () => {
    if (!selectedLoanProduct) return 3;
    
    let minStep = 3;
    
    if (selectedLoanProduct.requiresGuarantor) return minStep;
    minStep++;
    
    if (selectedLoanProduct.requiresCollateral) return minStep;
    minStep++;
    
    if (selectedLoanProduct.requiresNextOfKin) return minStep;
    
    return minStep;
  };

  const getTotalSteps = () => {
    if (!selectedLoanProduct) return 5;
    
    let steps = 3;
    
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
    // Validate all fields before showing confirmation
    if (!validateAllFields()) {
      if (amountError) {
        toast.error(amountError);
      } else if (termError) {
        toast.error(termError);
      } else if (emailError) {
        toast.error(emailError);
      } else if (phoneError) {
        toast.error(phoneError);
      } else {
        const firstError = Object.values(formErrors)[0];
        toast.error(firstError || 'Please fill in all required fields');
      }
      return;
    }
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
        applicationNo: `LA-${Date.now()}`,
        memberId: userId,
        amount: Number(applicationForm.amount),
        firstName: applicationForm.firstName,
        lastName: applicationForm.lastName,
        middleName: '',
        termDays: Number(applicationForm.termDays),
        email: applicationForm.email,
        groupId: applicationForm.groupId,
        mobileNumber: applicationForm.mobileNumber,
        address: applicationForm.address,
        occupation: applicationForm.occupation,
        dob: applicationForm.dob,
        gender: applicationForm.gender,
        loanPurpose: applicationForm.loanPurpose,
        status: 'PENDING'
      };

      const response = await userLoanService.createLoanApplication(applicationData);
      setLoanApplicationId(response.data.loanApplicationId);
      setApplicationSubmitted(true);
      
      toast.success('Loan application submitted successfully!');
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

    // Validate each guarantor has all required fields
    for (let i = 0; i < guarantors.length; i++) {
      const g = guarantors[i];
      if (!g.guarantorName?.trim()) {
        toast.error(`Guarantor ${i + 1}: Name is required`);
        return;
      }
      if (!g.relationship?.trim()) {
        toast.error(`Guarantor ${i + 1}: Relationship is required`);
        return;
      }
      if (!g.guarantorContact?.trim()) {
        toast.error(`Guarantor ${i + 1}: Contact is required`);
        return;
      }
      if (!g.guarantorIdNumber?.trim()) {
        toast.error(`Guarantor ${i + 1}: ID Number is required`);
        return;
      }
      if (!g.guaranteedAmount || g.guaranteedAmount <= 0) {
        toast.error(`Guarantor ${i + 1}: Guaranteed amount must be greater than 0`);
        return;
      }
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

    // Validate each collateral has all required fields
    for (let i = 0; i < collaterals.length; i++) {
      const c = collaterals[i];
      if (!c.type?.trim()) {
        toast.error(`Collateral ${i + 1}: Type is required`);
        return;
      }
      if (!c.estimatedValue || c.estimatedValue <= 0) {
        toast.error(`Collateral ${i + 1}: Estimated value must be greater than 0`);
        return;
      }
      if (!c.description?.trim()) {
        toast.error(`Collateral ${i + 1}: Description is required`);
        return;
      }
      if (!c.ownerName?.trim()) {
        toast.error(`Collateral ${i + 1}: Owner name is required`);
        return;
      }
      if (!c.ownerContact?.trim()) {
        toast.error(`Collateral ${i + 1}: Owner contact is required`);
        return;
      }
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

    // Validate each next of kin has all required fields
    for (let i = 0; i < nextOfKin.length; i++) {
      const n = nextOfKin[i];
      if (!n.name?.trim()) {
        toast.error(`Next of Kin ${i + 1}: Name is required`);
        return;
      }
      if (!n.relationship?.trim()) {
        toast.error(`Next of Kin ${i + 1}: Relationship is required`);
        return;
      }
      if (!n.phone?.trim()) {
        toast.error(`Next of Kin ${i + 1}: Phone is required`);
        return;
      }
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

  // Guarantor helpers
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

  // Collateral helpers
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

  // Next of Kin helpers
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
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs">
                {applicationSubmitted ? 'Current Application' : 'Select Loan Product'}
              </CardTitle>
              <CardDescription className="text-[10px]">
                {applicationSubmitted ? 
                  'Active application.' :
                  'Choose a loan product'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="py-1 px-3">
              {applicationSubmitted ? (
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
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={resetApplication} className="w-full" size="sm">
                      Start New Application
                    </Button>
                    <Button onClick={() => setCurrentStep(2)} className="w-full" size="sm">
                      Continue Current Application
                    </Button>
                  </div>
                </div>
              ) : (
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
                  <div className="grid gap-1.5 max-h-[40vh] overflow-y-auto">
                    {loanProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`p-2 border rounded cursor-pointer transition-colors ${
                          selectedLoanProduct?.id === product.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedLoanProduct(product)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-[11px]">{product.name}</h3>
                            <div className="grid grid-cols-3 gap-1 text-[9px] mt-0.5">
                              <div><span className="text-muted-foreground">Amt:</span> KES {product.minAmount}-{product.maxAmount}</div>
                              <div><span className="text-muted-foreground">Int:</span> {product.interestRate}%</div>
                              <div><span className="text-muted-foreground">Term:</span> {product.minTermDays}-{product.maxTermDays}d</div>
                            </div>
                            <div className="flex gap-0.5 mt-1">
                              {product.requiresGuarantor && <span className="text-[8px] bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-1 py-0.5 rounded">Guarantor</span>}
                              {product.requiresCollateral && <span className="text-[8px] bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-1 py-0.5 rounded">Collateral</span>}
                              {product.requiresNextOfKin && <span className="text-[8px] bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 px-1 py-0.5 rounded">Next of Kin</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </CardContent>
            <CardFooter className="py-1.5 px-3">
              {!applicationSubmitted && (
                <Button disabled={!selectedLoanProduct || loading} onClick={nextStep} className="ml-auto h-6 text-[10px] px-2">
                  Next <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </CardFooter>
          </Card>
        );

      case 2:
        return (
          <Card className="shadow-sm">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs">Application Details</CardTitle>
              <CardDescription className="text-[10px]">
                {applicationSubmitted ? 
                  'Submitted.' :
                  `Details for ${selectedLoanProduct?.name}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="py-1 px-3">
              {applicationSubmitted ? (
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
                          <span className="font-medium">{applicationForm.firstName} {applicationForm.lastName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email: </span>
                          <span className="font-medium">{applicationForm.email}</span>
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
                  
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      ✓ Your loan application has been successfully submitted. 
                      {selectedLoanProduct?.requiresGuarantor || selectedLoanProduct?.requiresCollateral || selectedLoanProduct?.requiresNextOfKin ? 
                        ' Please complete the additional requirements below.' : 
                        ' You can now review your complete application.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-1.5">
                  {/* Row 1: Names */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-0.5">
                      <Label htmlFor="firstName" className="text-[10px]">First Name *</Label>
                      <Input id="firstName" value={applicationForm.firstName} onChange={(e) => setApplicationForm({...applicationForm, firstName: e.target.value})} placeholder="First name" className={`h-7 text-[11px] ${formErrors.firstName ? 'border-red-500' : ''}`} />
                      {formErrors.firstName && <p className="text-[8px] text-red-500">{formErrors.firstName}</p>}
                    </div>
                    <div className="grid gap-0.5">
                      <Label htmlFor="lastName" className="text-[10px]">Last Name *</Label>
                      <Input id="lastName" value={applicationForm.lastName} onChange={(e) => setApplicationForm({...applicationForm, lastName: e.target.value})} placeholder="Last name" className={`h-7 text-[11px] ${formErrors.lastName ? 'border-red-500' : ''}`} />
                      {formErrors.lastName && <p className="text-[8px] text-red-500">{formErrors.lastName}</p>}
                    </div>
                  </div>
                  {/* Row 2: Contact */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-0.5">
                      <Label htmlFor="email" className="text-[10px]">Email *</Label>
                      <Input id="email" type="email" value={applicationForm.email} onChange={(e) => { setApplicationForm({...applicationForm, email: e.target.value}); if (e.target.value) validateEmail(e.target.value); else setEmailError(''); }} placeholder="Email" className={`h-7 text-[11px] ${emailError ? 'border-red-500' : ''}`} />
                      {emailError && <p className="text-[8px] text-red-500">{emailError}</p>}
                    </div>
                    <div className="grid gap-0.5">
                      <Label htmlFor="mobileNumber" className="text-[10px]">Phone *</Label>
                      <Input id="mobileNumber" value={applicationForm.mobileNumber} onChange={(e) => { setApplicationForm({...applicationForm, mobileNumber: e.target.value}); if (e.target.value) validatePhone(e.target.value); else setPhoneError(''); }} placeholder="0712345678" className={`h-7 text-[11px] ${phoneError ? 'border-red-500' : ''}`} />
                      {phoneError && <p className="text-[8px] text-red-500">{phoneError}</p>}
                    </div>
                  </div>
                  {/* Row 3: Loan details */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="grid gap-0.5">
                      <Label htmlFor="amount" className="text-[10px]">Amount *</Label>
                      <Input id="amount" type="number" placeholder={`${selectedLoanProduct?.minAmount}-${selectedLoanProduct?.maxAmount}`} value={applicationForm.amount} onChange={(e) => { setApplicationForm({...applicationForm, amount: e.target.value}); if (e.target.value) validateAmount(e.target.value); else setAmountError(''); }} className={`h-7 text-[11px] ${amountError ? 'border-red-500' : ''}`} />
                      {amountError && <p className="text-[8px] text-red-500">{amountError}</p>}
                    </div>
                    <div className="grid gap-0.5">
                      <Label htmlFor="termDays" className="text-[10px]">Term (Days) *</Label>
                      <Input id="termDays" type="number" placeholder={`${selectedLoanProduct?.minTermDays}-${selectedLoanProduct?.maxTermDays}`} value={applicationForm.termDays} onChange={(e) => { setApplicationForm({...applicationForm, termDays: e.target.value}); if (e.target.value) validateTermDays(e.target.value); else setTermError(''); }} className={`h-7 text-[11px] ${termError ? 'border-red-500' : ''}`} />
                      {termError && <p className="text-[8px] text-red-500">{termError}</p>}
                    </div>
                    <div className="grid gap-0.5">
                      <Label htmlFor="occupation" className="text-[10px]">Occupation *</Label>
                      <Input id="occupation" value={applicationForm.occupation} onChange={(e) => setApplicationForm({...applicationForm, occupation: e.target.value})} placeholder="Occupation" className={`h-7 text-[11px] ${formErrors.occupation ? 'border-red-500' : ''}`} />
                      {formErrors.occupation && <p className="text-[8px] text-red-500">{formErrors.occupation}</p>}
                    </div>
                  </div>
                  {/* Row 4: Address & Purpose */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-0.5">
                      <Label htmlFor="address" className="text-[10px]">Address *</Label>
                      <Input id="address" value={applicationForm.address} onChange={(e) => setApplicationForm({...applicationForm, address: e.target.value})} placeholder="Address" className={`h-7 text-[11px] ${formErrors.address ? 'border-red-500' : ''}`} />
                      {formErrors.address && <p className="text-[8px] text-red-500">{formErrors.address}</p>}
                    </div>
                    <div className="grid gap-0.5">
                      <Label htmlFor="loanPurpose" className="text-[10px]">Purpose *</Label>
                      <Input id="loanPurpose" value={applicationForm.loanPurpose} onChange={(e) => setApplicationForm({...applicationForm, loanPurpose: e.target.value})} placeholder="Loan purpose" className={`h-7 text-[11px] ${formErrors.loanPurpose ? 'border-red-500' : ''}`} />
                      {formErrors.loanPurpose && <p className="text-[8px] text-red-500">{formErrors.loanPurpose}</p>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="py-1.5 px-3 flex justify-between">
              <Button variant="outline" onClick={prevStep} disabled={applicationSubmitted} className="h-6 text-[10px] px-2">
                <ArrowLeft className="mr-1 h-3 w-3" />Back
              </Button>
              {!applicationSubmitted ? (
                <Button onClick={handleSubmitApplication} disabled={isLoading} className="h-6 text-[10px] px-2">
                  {isLoading ? 'Submitting...' : 'Submit'}<ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              ) : (
                <Button onClick={nextStep} className="h-6 text-[10px] px-2">
                  Continue<ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </CardFooter>
          </Card>
        );

      default: {
        const stepName = stepInfo[currentStep];
        
        if (stepName === 'Guarantor') {
          return (
            <Card className="shadow-sm">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs">Add Guarantors</CardTitle>
                <CardDescription className="text-[10px]">Add guarantors for your application</CardDescription>
              </CardHeader>
              <CardContent className="py-1 px-3">
                <div className="space-y-2 max-h-[45vh] overflow-y-auto">
                  {guarantors.map((guarantor, index) => (
                    <div key={index} className="border rounded p-2">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-[10px] font-medium">Guarantor {index + 1}</h3>
                        <Button variant="ghost" size="sm" onClick={() => removeGuarantor(index)} className="h-5 w-5 p-0">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div><Label className="text-[9px]">Name</Label><Input value={guarantor.guarantorName} onChange={(e) => updateGuarantor(index, 'guarantorName', e.target.value)} className="h-6 text-[10px]" /></div>
                        <div><Label className="text-[9px]">Relationship</Label><Input value={guarantor.relationship} onChange={(e) => updateGuarantor(index, 'relationship', e.target.value)} className="h-6 text-[10px]" /></div>
                        <div><Label className="text-[9px]">Contact</Label><Input value={guarantor.guarantorContact} onChange={(e) => updateGuarantor(index, 'guarantorContact', e.target.value)} className="h-6 text-[10px]" /></div>
                        <div><Label className="text-[9px]">ID Number</Label><Input value={guarantor.guarantorIdNumber} onChange={(e) => updateGuarantor(index, 'guarantorIdNumber', e.target.value)} className="h-6 text-[10px]" /></div>
                        <div><Label className="text-[9px]">Amount</Label><Input type="number" value={guarantor.guaranteedAmount} onChange={(e) => updateGuarantor(index, 'guaranteedAmount', Number(e.target.value))} className="h-6 text-[10px]" /></div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addGuarantor} className="h-6 text-[10px] px-2">
                    <Plus className="mr-1 h-3 w-3" />Add Guarantor
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="py-1.5 px-3 flex justify-between">
                <Button variant="outline" onClick={prevStep} className="h-6 text-[10px] px-2"><ArrowLeft className="mr-1 h-3 w-3" />Back</Button>
                <Button onClick={handleSubmitGuarantors} disabled={isLoading} className="h-6 text-[10px] px-2">{isLoading ? 'Saving...' : 'Continue'}<ArrowRight className="ml-1 h-3 w-3" /></Button>
              </CardFooter>
            </Card>
          );
        }

        if (stepName === 'Collateral') {
          return (
            <Card className="shadow-sm">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs">Add Collaterals</CardTitle>
                <CardDescription className="text-[10px]">Add collateral items</CardDescription>
              </CardHeader>
              <CardContent className="py-1 px-3">
                <div className="space-y-2 max-h-[45vh] overflow-y-auto">
                  {collaterals.map((collateral, index) => (
                    <div key={index} className="border rounded p-2">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-[10px] font-medium">Collateral {index + 1}</h3>
                        <Button variant="ghost" size="sm" onClick={() => removeCollateral(index)} className="h-5 w-5 p-0">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div><Label className="text-[9px]">Type</Label><Input value={collateral.type} onChange={(e) => updateCollateral(index, 'type', e.target.value)} className="h-6 text-[10px]" /></div>
                        <div><Label className="text-[9px]">Value</Label><Input type="number" value={collateral.estimatedValue} onChange={(e) => updateCollateral(index, 'estimatedValue', Number(e.target.value))} className="h-6 text-[10px]" /></div>
                        <div><Label className="text-[9px]">Description</Label><Input value={collateral.description} onChange={(e) => updateCollateral(index, 'description', e.target.value)} className="h-6 text-[10px]" /></div>
                        <div><Label className="text-[9px]">Owner</Label><Input value={collateral.ownerName} onChange={(e) => updateCollateral(index, 'ownerName', e.target.value)} className="h-6 text-[10px]" /></div>
                        <div><Label className="text-[9px]">Contact</Label><Input value={collateral.ownerContact} onChange={(e) => updateCollateral(index, 'ownerContact', e.target.value)} className="h-6 text-[10px]" /></div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addCollateral} className="h-6 text-[10px] px-2">
                    <Plus className="mr-1 h-3 w-3" />Add Collateral
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="py-1.5 px-3 flex justify-between">
                <Button variant="outline" onClick={prevStep} className="h-6 text-[10px] px-2"><ArrowLeft className="mr-1 h-3 w-3" />Back</Button>
                <Button onClick={handleSubmitCollaterals} disabled={isLoading} className="h-6 text-[10px] px-2">{isLoading ? 'Saving...' : 'Continue'}<ArrowRight className="ml-1 h-3 w-3" /></Button>
              </CardFooter>
            </Card>
          );
        }

        if (stepName === 'Next of Kin') {
          return (
            <Card className="shadow-sm">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs">Add Next of Kin</CardTitle>
                <CardDescription className="text-[10px]">Add next of kin info</CardDescription>
              </CardHeader>
              <CardContent className="py-1 px-3">
                <div className="space-y-2 max-h-[45vh] overflow-y-auto">
                  {nextOfKin.map((nok, index) => (
                    <div key={index} className="border rounded p-2">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-[10px] font-medium">Next of Kin {index + 1}</h3>
                        <Button variant="ghost" size="sm" onClick={() => removeNextOfKin(index)} className="h-5 w-5 p-0">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div><Label className="text-[9px]">Name</Label><Input value={nok.name} onChange={(e) => updateNextOfKin(index, 'name', e.target.value)} className="h-6 text-[10px]" /></div>
                        <div><Label className="text-[9px]">Relationship</Label><Input value={nok.relationship} onChange={(e) => updateNextOfKin(index, 'relationship', e.target.value)} className="h-6 text-[10px]" /></div>
                        <div><Label className="text-[9px]">Phone</Label><Input value={nok.phone} onChange={(e) => updateNextOfKin(index, 'phone', e.target.value)} className="h-6 text-[10px]" /></div>
                        <div><Label className="text-[9px]">Email</Label><Input type="email" value={nok.email} onChange={(e) => updateNextOfKin(index, 'email', e.target.value)} className="h-6 text-[10px]" /></div>
                        <div><Label className="text-[9px]">Address</Label><Input value={nok.address} onChange={(e) => updateNextOfKin(index, 'address', e.target.value)} className="h-6 text-[10px]" /></div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addNextOfKinItem} className="h-6 text-[10px] px-2">
                    <Plus className="mr-1 h-3 w-3" />Add Next of Kin
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="py-1.5 px-3 flex justify-between">
                <Button variant="outline" onClick={prevStep} className="h-6 text-[10px] px-2"><ArrowLeft className="mr-1 h-3 w-3" />Back</Button>
                <Button onClick={handleSubmitNextOfKin} disabled={isLoading} className="h-6 text-[10px] px-2">{isLoading ? 'Saving...' : 'Continue'}<ArrowRight className="ml-1 h-3 w-3" /></Button>
              </CardFooter>
            </Card>
          );
        }

        if (stepName === 'Review') {
          return (
            <Card className="shadow-sm">
              <CardHeader className="py-2 px-3 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                <CardTitle className="text-sm mt-1">Complete!</CardTitle>
                <CardDescription className="text-[10px]">Application submitted successfully.</CardDescription>
              </CardHeader>
              <CardContent className="py-1 px-3">
                <div className="border rounded p-2 bg-muted/30">
                  <h3 className="font-medium text-[10px] mb-1">Application Summary</h3>
                  <div className="grid gap-1 text-[10px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Loan Product:</span><span className="font-medium">{selectedLoanProduct?.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Amount:</span><span className="font-medium">KES {applicationForm.amount}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Term:</span><span className="font-medium">{applicationForm.termDays} days</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Interest Rate:</span><span className="font-medium">{selectedLoanProduct?.interestRate}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Application ID:</span><span className="font-medium text-primary">{loanApplicationId}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><span className="font-medium text-orange-600">PENDING</span></div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="py-1.5 px-3">
                <Button onClick={() => window.location.href = '/loanee-dashboard'} className="h-6 text-[10px] px-3 mx-auto">Return to Dashboard</Button>
              </CardFooter>
            </Card>
          );
        }

        return null;
      }
    }
  };

  return (
    <LoaneeDashboardLayout>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold">Apply for Loan</h1>
            <p className="text-[10px] text-muted-foreground">Complete the steps to apply</p>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="bg-card rounded p-1.5 border">
          <div className="flex items-center">
            {Array.from({ length: getTotalSteps() }, (_, index) => index + 1).map((step) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      currentStep === step 
                        ? 'bg-primary text-primary-foreground' 
                        : currentStep > step 
                          ? 'bg-primary/80 text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step}
                  </div>
                  <span className="text-[8px] mt-0.5 text-muted-foreground hidden md:inline">
                    {getCurrentStepInfo()[step]}
                  </span>
                </div>
                {step < getTotalSteps() && (
                  <div className={`flex-1 h-0.5 mx-0.5 ${currentStep > step ? 'bg-primary/80' : 'bg-muted'}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {renderStep()}

        {/* Confirmation Modal */}
        <AlertDialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
          <AlertDialogContent className="max-w-md max-h-[80vh] overflow-y-auto p-3">
            <AlertDialogHeader className="pb-1">
              <AlertDialogTitle className="flex items-center gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5 text-primary" />Confirm Submission
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[10px]">Review before submitting.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-1 space-y-1.5">
              <div className="border rounded p-2 bg-muted/30">
                <h3 className="font-semibold text-[10px] mb-1 text-primary">Loan Product</h3>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div><span className="text-muted-foreground">Product: </span><span className="font-medium">{selectedLoanProduct?.name}</span></div>
                  <div><span className="text-muted-foreground">Rate: </span><span className="font-medium">{selectedLoanProduct?.interestRate}%</span></div>
                </div>
              </div>
              <div className="border rounded p-2 bg-muted/30">
                <h3 className="font-semibold text-[10px] mb-1 text-primary">Loan Details</h3>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div><span className="text-muted-foreground">Amount: </span><span className="font-medium">KES {applicationForm.amount}</span></div>
                  <div><span className="text-muted-foreground">Term: </span><span className="font-medium">{applicationForm.termDays} days</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Purpose: </span><span className="font-medium">{applicationForm.loanPurpose}</span></div>
                </div>
              </div>
              <div className="border rounded p-2 bg-muted/30">
                <h3 className="font-semibold text-[10px] mb-1 text-primary">Personal Info</h3>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="col-span-2"><span className="text-muted-foreground">Name: </span><span className="font-medium">{applicationForm.firstName} {applicationForm.lastName}</span></div>
                  <div><span className="text-muted-foreground">Email: </span><span className="font-medium">{applicationForm.email}</span></div>
                  <div><span className="text-muted-foreground">Phone: </span><span className="font-medium">{applicationForm.mobileNumber}</span></div>
                  <div><span className="text-muted-foreground">Occupation: </span><span className="font-medium">{applicationForm.occupation}</span></div>
                </div>
              </div>
            </div>
            <AlertDialogFooter className="gap-1.5 pt-1">
              <AlertDialogCancel onClick={cancelSubmitApplication} disabled={isLoading} className="h-6 text-[10px] px-2">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSubmitApplication} disabled={isLoading} className="h-6 text-[10px] px-2">{isLoading ? 'Submitting...' : 'Confirm & Submit'}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LoaneeDashboardLayout>
  );
};

export default LoaneeLoanApplication;
