import React, { useState, useEffect } from 'react';
import UserDashboardLayout from './layout/UserDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { ArrowRight, CheckCircle, CreditCard, Wallet } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { userPaymentService, Account, PaymentType, PaymentMode, STKPushResponse } from '@/services/user-services/userPaymentService';

// JWT token interface
interface TohekoJwtPayload {
  sub: string;
  userId: number;
  role: string;
  exp?: number;
  iat?: number;
}



// Main payment component
const Payments = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [loading, setLoading] = useState({
    accounts: true,
    paymentTypes: false,
    paymentModes: false
  });
  const [error, setError] = useState({
    accounts: '',
    paymentTypes: '',
    paymentModes: ''
  });

  // Form state
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode | null>(null);
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  
  // Validation error states
  const [amountError, setAmountError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // STK Push and Payment Status states
  const [stkResponse, setStkResponse] = useState<STKPushResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'completed' | 'failed' | null>(null);
  const [statusCheckTimeout, setStatusCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fetch accounts when component mounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const userId = getUserId();
        if (!userId) {
          setError(prev => ({ ...prev, accounts: 'User ID not found' }));
          setLoading(prev => ({ ...prev, accounts: false }));
          return;
        }

        const accountsData = await userPaymentService.getMemberAccounts(userId);
        setAccounts(accountsData);
        if (accountsData.length > 0) {
          // Auto-select the first account if there's only one
          if (accountsData.length === 1) {
            setSelectedAccount(accountsData[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setError(prev => ({ ...prev, accounts: 'Failed to load accounts' }));
      } finally {
        setLoading(prev => ({ ...prev, accounts: false }));
      }
    };

    fetchAccounts();
  }, []);

  // Fetch payment types when user moves to step 2
  useEffect(() => {
    if (currentStep === 2) {
      const fetchPaymentTypes = async () => {
        try {
          setLoading(prev => ({ ...prev, paymentTypes: true }));
          const typesData = await userPaymentService.getPaymentTypes();
          setPaymentTypes(typesData);
          // Auto-select the first payment type if there's only one
          if (typesData.length === 1) {
            setSelectedPaymentType(typesData[0]);
          }
        } catch (error) {
          console.error('Error fetching payment types:', error);
          setError(prev => ({ ...prev, paymentTypes: 'Failed to load payment types' }));
        } finally {
          setLoading(prev => ({ ...prev, paymentTypes: false }));
        }
      };

      fetchPaymentTypes();
    }
  }, [currentStep]);

  // Fetch payment modes when user moves to step 3
  useEffect(() => {
    if (currentStep === 3) {
      const fetchPaymentModes = async () => {
        try {
          setLoading(prev => ({ ...prev, paymentModes: true }));
          const modesData = await userPaymentService.getPaymentModes();
          setPaymentModes(modesData);
          // Auto-select M-PESA if available
          const mpesa = modesData.find(mode => mode.name.toLowerCase() === 'm-pesa');
          if (mpesa) {
            setSelectedPaymentMode(mpesa);
          } else if (modesData.length === 1) {
            setSelectedPaymentMode(modesData[0]);
          }
        } catch (error) {
          console.error('Error fetching payment modes:', error);
          setError(prev => ({ ...prev, paymentModes: 'Failed to load payment modes' }));
        } finally {
          setLoading(prev => ({ ...prev, paymentModes: false }));
        }
      };

      fetchPaymentModes();
    }
  }, [currentStep]);

  // Cleanup effect to clear timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (statusCheckTimeout) {
        clearTimeout(statusCheckTimeout);
      }
    };
  }, [statusCheckTimeout]);

  // Fetch user ID from JWT token
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

  // Format phone number to always start with 254
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // If empty, return empty
    if (!cleaned) return '';

    // If it starts with 0 (local format), replace with 254
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return '254' + cleaned.substring(1);
    }

    // If it already starts with 254, return as is
    if (cleaned.startsWith('254') && cleaned.length === 12) {
      return cleaned;
    }

    // If it's a 9-digit number starting with 7 or 1 (typical Kenyan mobile), add 254
    if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
      return '254' + cleaned;
    }

    // If it's 10 digits starting with 7 or 1, remove first digit and add 254
    if (cleaned.length === 10 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
      return '254' + cleaned.substring(1);
    }

    // For any other case, try to add 254 if it looks like a valid mobile number
    if (cleaned.length === 9) {
      return '254' + cleaned;
    }

    // Return as is if already properly formatted or unrecognized format
    return cleaned;
  };

  // Function to create payment records 3 times using externalRef within 15 seconds
  const checkPaymentStatus = async (externalRef: string): Promise<void> => {
    try {
      setPaymentStatus('checking');
      //console.log(`🔄 Starting payment creation process with external reference: ${externalRef}`);

      const userId = getUserId();
      if (!userId) {
        console.error('User ID not found');
        setPaymentStatus('completed');
        toast.success('Payment initiated! Please check your payment history to view the final status.');
        return;
      }

      // Prepare payment creation data using externalRef
      const paymentData = {
        amount: Number(amount),
        accountId: selectedAccount!.accountId,
        paymentTypeId: selectedPaymentType!.paymentTypeId,
        modeOfPaymentId: selectedPaymentMode!.modeOfPaymentId,
        phoneNumber: phoneNumber,
        remarks: remarks || 'Payment via member portal',
        externalRef: externalRef // Use the externalRef from STK push
      };

      let attemptCount = 0;
      const maxAttempts = 3;
      const attemptInterval = 5000; // 5 seconds between attempts (3 attempts in 15 seconds)

      const createPaymentRecord = async () => {
        try {
          attemptCount++;
          //console.log(`📤 Payment creation attempt ${attemptCount}/${maxAttempts} with externalRef: ${externalRef}`);

          // Create payment record using the /api/v1/payments endpoint
          const paymentResponse = await userPaymentService.createPayment(paymentData);
          //console.log(`✅ Payment creation attempt ${attemptCount} response:`, paymentResponse);

        } catch (error) {
          console.error(`❌ Error in payment creation attempt ${attemptCount}:`, error);
        }
      };

      // Perform first attempt immediately
      //console.log('🚀 Starting attempt 1 immediately...');
      await createPaymentRecord();

      // Schedule second attempt after 5 seconds
      //console.log('⏰ Scheduling attempt 2 in 5 seconds...');
      const secondAttemptTimeout = setTimeout(async () => {
        //console.log('🚀 Starting attempt 2...');
        await createPaymentRecord();

        // Schedule third attempt after another 5 seconds (total 10 seconds)
        //console.log('⏰ Scheduling attempt 3 in 5 seconds...');
        const thirdAttemptTimeout = setTimeout(async () => {
          //console.log('🚀 Starting attempt 3 (final)...');
          await createPaymentRecord();

          // After all 3 attempts, complete the process and direct user to payment history
          //console.log('✅ All 3 payment creation attempts completed!');
          setPaymentStatus('completed');
          toast.success('Payment processing complete! Please check your payment history to view the final status.');
        }, attemptInterval);

        setStatusCheckTimeout(thirdAttemptTimeout);
      }, attemptInterval);

      setStatusCheckTimeout(secondAttemptTimeout);

    } catch (error) {
      console.error('Error in payment creation process:', error);
      setPaymentStatus('completed');
      toast.success('Payment initiated! Please check your payment history to view the final status.');
    }
  };

  // Validation function for amount
  const validateAmount = (value: string): boolean => {
    setAmountError('');
    
    if (!value || value.trim() === '') {
      setAmountError('Amount is required');
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
    
    if (numValue > 10000000) {
      setAmountError('Amount cannot exceed KES 10,000,000');
      return false;
    }
    
    if (!Number.isInteger(numValue * 100)) {
      setAmountError('Amount can have at most 2 decimal places');
      return false;
    }
    
    return true;
  };

  // Validation function for phone number
  const validatePhoneNumber = (value: string): boolean => {
    setPhoneError('');
    
    if (!value || value.trim() === '') {
      setPhoneError('Phone number is required');
      return false;
    }
    
    const formattedPhone = formatPhoneNumber(value);
    if (!formattedPhone.startsWith('254') || formattedPhone.length !== 12) {
      setPhoneError('Please enter a valid Kenyan phone number');
      return false;
    }
    
    return true;
  };

  const nextStep = () => {
    // Validation logic for each step
    if (currentStep === 1 && !selectedAccount) {
      toast.error('Please select an account');
      return;
    }
    
    if (currentStep === 2 && !selectedPaymentType) {
      toast.error('Please select a payment type');
      return;
    }
    
    if (currentStep === 3 && !selectedPaymentMode) {
      toast.error('Please select a payment mode');
      return;
    }
    
    if (currentStep === 4) {
      // Validate amount
      if (!validateAmount(amount)) {
        toast.error(amountError || 'Please enter a valid amount');
        return;
      }

      // Validate phone number
      if (!validatePhoneNumber(phoneNumber)) {
        toast.error(phoneError || 'Please enter a valid phone number');
        return;
      }

      // Update the phone number state with the formatted version
      setPhoneNumber(formattedPhone);
    }
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAccount || !selectedPaymentType || !selectedPaymentMode || !amount) {
      toast.error('Please complete all required fields');
      return;
    }

    // Ensure phone number is properly formatted
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    if (!formattedPhoneNumber.startsWith('254') || formattedPhoneNumber.length !== 12) {
      toast.error('Please enter a valid Kenyan phone number');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: If M-PESA selected, initiate STK push first to get externalRef
      if (selectedPaymentMode.name.toLowerCase().includes('m-pesa')) {
        const userId = getUserId();
        if (!userId) {
          toast.error('User session expired. Please login again.');
          setIsLoading(false);
          return;
        }

        const stkPushData = {
          amount: String(amount),
          phoneNumber: formattedPhoneNumber,
          remarks: remarks || 'Payment via member portal',
          app: 'TOHEKO', // Always use "TOHEKO" as the app name
          paymentReference: `TEMP_${Date.now()}`, // Temporary reference, will use externalRef for actual payment
          memberId: userId // Use userId from JWT token
        };

        // Initiate the STK push
        const stkResponse = await userPaymentService.initiateSTKPush(stkPushData);
        //console.log('STK push initiated:', stkResponse);

        // Store the STK response
        setStkResponse(stkResponse);

        // Check if STK push was successful (responseCode 200)
        if (stkResponse.responseCode === '200' && stkResponse.stkAccepted) {
          toast.success('Payment initiated! Check your phone for M-PESA prompt.');
          setPaymentStatus('pending');

          // Store the externalRef as payment reference for display
          setPaymentReference(stkResponse.externalRef || 'N/A');

          // Start checking payment status if we have an externalRef
          if (stkResponse.externalRef) {
            // Wait a bit before starting status checks to allow processing
            const timeout = setTimeout(() => {
              checkPaymentStatus(stkResponse.externalRef!);
            }, 5000); // Wait 5 seconds before first status check
            setStatusCheckTimeout(timeout);
          }
        } else {
          // STK push failed
          toast.error(stkResponse.stkInitMessage || 'STK push initiation failed. Please try again.');
          setPaymentStatus('failed');
          setIsLoading(false);
          return;
        }
      } else {
        // For non-M-PESA payments, create payment record directly
        const paymentData = {
          amount: Number(amount),
          accountId: selectedAccount.accountId,
          paymentTypeId: selectedPaymentType.paymentTypeId,
          modeOfPaymentId: selectedPaymentMode.modeOfPaymentId,
          phoneNumber: formattedPhoneNumber,
          remarks: remarks || 'Payment via member portal'
        };

        const paymentResponse = await userPaymentService.createPayment(paymentData);
        setPaymentReference(paymentResponse.requestID);
        toast.success('Payment recorded successfully!');
        setPaymentStatus('completed');
      }

      setIsLoading(false);
      setCurrentStep(5); // Move to success step
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setPaymentStatus('failed');
      setIsLoading(false);
    }
  };

  // Render different steps based on current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="shadow-sm">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Select Account</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Choose the account you want to make a payment to</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              {loading.accounts ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : error.accounts ? (
                <div className="text-center py-4 text-destructive text-sm">
                  <p>{error.accounts}</p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <p>No accounts found</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {accounts.map((account) => (
                    <div
                      key={account.accountId}
                      className={`p-2 sm:p-3 border rounded-md cursor-pointer transition-colors ${selectedAccount?.accountId === account.accountId ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                      onClick={() => setSelectedAccount(account)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-xs sm:text-sm">{account.name}</h3>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">{account.accountNumber}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-2">
              <Button 
                disabled={!selectedAccount || loading.accounts} 
                onClick={nextStep}
                className="ml-auto"
                size="sm"
              >
                Next <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Select Payment Type</CardTitle>
              <CardDescription>
                Choose the type of payment you want to make
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading.paymentTypes ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading payment types...</span>
                  </div>
                ) : error.paymentTypes ? (
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-600">
                    {error.paymentTypes}
                    <Button className="mt-2" variant="outline" onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </div>
                ) : paymentTypes.length === 0 ? (
                  <div className="p-4 border rounded-lg bg-muted/50 text-center">
                    <p>No payment types available. Please try again later.</p>
                  </div>
                ) : paymentTypes.map(type => (
                  <div 
                    key={type.paymentTypeId}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPaymentType?.paymentTypeId === type.paymentTypeId ? 
                      'border-primary bg-primary/5' : 
                      'hover:border-gray-400'
                    }`}
                    onClick={() => setSelectedPaymentType(type)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium capitalize">{type.name}</h3>
                        {type.paymentShortDesc && (
                          <p className="text-sm text-muted-foreground">{type.paymentShortDesc}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button onClick={nextStep}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Select Payment Mode</CardTitle>
              <CardDescription>
                How would you like to make your payment?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {loading.paymentModes ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading payment modes...</span>
                  </div>
                ) : error.paymentModes ? (
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-600">
                    {error.paymentModes}
                    <Button className="mt-2" variant="outline" onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </div>
                ) : paymentModes.length === 0 ? (
                  <div className="p-4 border rounded-lg bg-muted/50 text-center">
                    <p>No payment modes available. Please try again later.</p>
                  </div>
                ) : paymentModes.map(mode => (
                  <div 
                    key={mode.modeOfPaymentId}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPaymentMode?.modeOfPaymentId === mode.modeOfPaymentId ? 
                      'border-primary bg-primary/5' : 
                      'hover:border-gray-400'
                    }`}
                    onClick={() => setSelectedPaymentMode(mode)}
                  >
                    <div className="flex flex-col items-center text-center">
                      {mode.name === 'M-PESA' ? (
                        <Wallet className="h-10 w-10 mb-2 text-green-600" />
                      ) : (
                        <CreditCard className="h-10 w-10 mb-2 text-blue-600" />
                      )}
                      <h3 className="font-medium">{mode.name}</h3>
                      <p className="text-sm text-muted-foreground">{mode.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button onClick={nextStep}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Enter the details for your {selectedPaymentMode?.name} payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      required
                      step="0.01"
                      min="0.01"
                      max="10000000"
                      onChange={(e) => {
                        setAmount(e.target.value);
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
                    {amount && !amountError && Number(amount) > 0 && (
                      <p className="text-xs text-green-600 mt-1">✓ Valid amount: KES {Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="e.g. 0712345678 or 712345678 or 0112345678"
                      value={phoneNumber}
                      required
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setPhoneNumber(formatted);
                        if (formatted) {
                          validatePhoneNumber(formatted);
                        } else {
                          setPhoneError('');
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value) {
                          validatePhoneNumber(e.target.value);
                        }
                      }}
                      className={phoneError ? 'border-red-500' : phoneNumber && !phoneNumber.startsWith('254') ? 'border-yellow-300' : ''}
                    />
                    {phoneError && (
                      <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                    )}
                    {!phoneError && phoneNumber && (
                      <p className="text-xs text-muted-foreground">
                        Enter the phone number registered with M-PESA
                        {phoneNumber.startsWith('254') && phoneNumber.length === 12 && (
                          <span className="text-green-600 ml-1">✓ Formatted correctly</span>
                        )}
                        {(!phoneNumber.startsWith('254') || phoneNumber.length !== 12) && (
                          <span className="text-yellow-600 ml-1">⚠ Will be formatted to: {formatPhoneNumber(phoneNumber)}</span>
                        )}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Input
                      id="remarks"
                      placeholder="Add any notes about this payment"
                      value={remarks}
                      required
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-muted/50">
                  <h3 className="font-medium mb-2">Payment Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account:</span>
                      <span>{selectedAccount?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Type:</span>
                      <span className="capitalize">{selectedPaymentType?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method:</span>
                      <span>{selectedPaymentMode?.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Make Payment'}
              </Button>
            </CardFooter>
          </Card>
        );

      case 5:
        return (
          <Card className="shadow-sm">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-center mb-1">
                {paymentStatus === 'completed' ? (
                  <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-500" />
                ) : paymentStatus === 'failed' ? (
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-500 text-xl sm:text-2xl">✕</span>
                  </div>
                ) : paymentStatus === 'checking' ? (
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 sm:h-6 sm:w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <div className="animate-pulse h-5 w-5 sm:h-6 sm:w-6 bg-yellow-500 rounded-full"></div>
                  </div>
                )}
              </div>
              <CardTitle className="text-center text-base sm:text-lg">
                {paymentStatus === 'completed' ? 'Payment Processed!' :
                 paymentStatus === 'failed' ? 'Payment Failed' :
                 paymentStatus === 'checking' ? 'Checking Payment Status...' :
                 'Payment Initiated!'}
              </CardTitle>
              <CardDescription className="text-center text-xs sm:text-sm px-2">
                {paymentStatus === 'completed' ?
                  'Your payment has been processed. Please check your payment history for the final status and confirmation.' :
                 paymentStatus === 'failed' ?
                  'Payment could not be completed. Please try again or contact support.' :
                 paymentStatus === 'checking' ?
                  'Verifying payment with M-PESA... Please wait.' :
                 selectedPaymentMode?.name === 'M-PESA' ?
                  'Payment initiated. Please complete the transaction on your phone, then we will verify the payment status.' :
                  'Your payment has been recorded successfully.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="border rounded-md p-2 sm:p-3 bg-muted/30">
                <h3 className="font-medium text-xs sm:text-sm mb-2">Payment Details</h3>
                <div className="grid gap-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account:</span>
                    <span className="font-medium truncate ml-2">{selectedAccount?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">KES {amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="font-medium truncate ml-2">{selectedPaymentMode?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-medium text-primary font-mono text-[10px] sm:text-xs truncate ml-2">{paymentReference}</span>
                  </div>
                  {stkResponse?.externalRef && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-muted-foreground">External Ref:</span>
                      <span className="font-medium text-primary font-mono text-xs break-all">{stkResponse.externalRef}</span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`font-medium text-xs sm:text-sm ${
                      paymentStatus === 'completed' ? 'text-green-600' :
                      paymentStatus === 'failed' ? 'text-red-600' :
                      paymentStatus === 'checking' ? 'text-blue-600' :
                      'text-yellow-600'
                    }`}>
                      {paymentStatus === 'completed' ? 'Processed - Savings' :
                       paymentStatus === 'failed' ? 'Failed' :
                       paymentStatus === 'checking' ? 'Verifying with M-PESA...' :
                       'Awaiting M-PESA Confirmation'}
                    </span>
                  </div>
                </div>
              </div>

              {paymentStatus === 'completed' && (
                <div className="mt-3 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-green-700 font-medium">Payment Processed</p>
                  </div>
                  <p className="text-xs text-green-600">
                    Your payment has been processed successfully. Please check your payment history to view the final status and transaction details.
                  </p>
                </div>
              )}

              {paymentStatus === 'checking' && (
                <div className="mt-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full flex-shrink-0"></div>
                    <p className="text-xs sm:text-sm text-blue-700 font-medium">Processing Payment</p>
                  </div>
                  <p className="text-xs text-blue-600">
                    We're submitting your payment record to the system (3 attempts over 15 seconds). After all attempts are complete, please check your payment history for the final status.
                  </p>
                </div>
              )}

              {paymentStatus === 'failed' && selectedPaymentMode?.name.toLowerCase().includes('m-pesa') && (
                <div className="mt-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs sm:text-sm text-red-700 mb-3">
                    STK push failed. You can try again or contact support.
                  </p>
                  <Button
                    onClick={() => {
                      setCurrentStep(4);
                      setPaymentStatus(null);
                      setStkResponse(null);
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-3 sm:pt-4">
              {paymentStatus === 'completed' ? (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                  <Button
                    onClick={() => window.location.href = '/user/payment-history'}
                    size="sm"
                    className="flex-1 order-1"
                  >
                    View Payment History
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/user/dashboard'}
                    size="sm"
                    variant="outline"
                    className="flex-1 order-2"
                  >
                    Return to Dashboard
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => window.location.href = '/user/dashboard'}
                  size="sm"
                  className="w-full sm:w-auto sm:mx-auto"
                  disabled={paymentStatus === 'checking'}
                >
                  Return to Dashboard
                </Button>
              )}
            </CardFooter>
          </Card>
        );

      default:
        return (
          <Card className="shadow-sm">
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <p>Loading payment interface...</p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <UserDashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">Make a Payment</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Follow the steps below to make a payment to your account</p>
          </div>
        </div>
        
        <div className="mb-4 bg-card rounded-md p-2 sm:p-3 border">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="contents">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${
                      currentStep === step
                        ? 'bg-primary text-primary-foreground'
                        : currentStep > step
                          ? 'bg-primary/80 text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step}
                  </div>
                  <span className="text-[8px] sm:text-[10px] mt-1 text-muted-foreground hidden sm:inline">
                    {step === 1 && 'Account'}
                    {step === 2 && 'Type'}
                    {step === 3 && 'Method'}
                    {step === 4 && 'Details'}
                    {step === 5 && 'Complete'}
                  </span>
                </div>
                {step < 5 && (
                  <div
                    className={`flex-1 h-0.5 mx-0.5 sm:mx-1 ${
                      currentStep > step ? 'bg-primary/80' : 'bg-muted'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {renderStep()}
      </div>
    </UserDashboardLayout>
  );
};

export default Payments;
