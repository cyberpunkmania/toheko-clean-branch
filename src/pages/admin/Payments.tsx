/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/pages/admin/DashboardLayout";
import { paymentService, PaymentFormSchemaType, PaymentPromptSchemaType } from "@/services/paymentService";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Bell, Search } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Payment, PaymentType, ModeOfPayment, Account } from "@/types/api";
import { paymentTypeService } from "@/services/paymentTypeService";
import { accountService } from "@/services/accountService";
import { modeOfPaymentService } from "@/services/modeOfPaymentService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Payments = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("payments");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredAccount, setFilteredAccount] = useState<number | null>(null);
  const [accountSearchTerm, setAccountSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddPaymentTypeDialog, setShowAddPaymentTypeDialog] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  // Enhanced payment form schema with required fields
  const paymentFormSchema = z.object({
    remarks: z.string().optional(),
    phoneNumber: z.string().min(1, "Phone number is required"),
    referenceNumber: z.string().min(1, "Reference number is required"),
    modeOfPaymentId: z.coerce.number().positive("Mode of payment is required"),
    paymentTypeId: z.coerce.number().positive("Payment type is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    accountId: z.coerce.number().positive("Account is required"),
  });

  // Schema for payment prompts
  const promptFormSchema = z.object({
    accountId: z.coerce.number().positive("Account is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    paymentTypeId: z.coerce.number().positive("Payment type is required"),
    message: z.string().optional(),
    dueDate: z.date().optional(),
  });

  // Payment type form schema
  const paymentTypeFormSchema = z.object({
    name: z.string().min(3, "Name is required"),
    paymentShortDesc: z.string().optional(),
    paymentDescription: z.string().optional(),
  });

  // Fetch all needed data using React Query
  const { data: allAccounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountService.getAllAccounts,
  });

  const { data: paymentTypes, isLoading: isLoadingPaymentTypes } = useQuery({
    queryKey: ["payment-types"],
    queryFn: paymentTypeService.getAllPaymentTypes,
  });

  const { data: modesOfPayment, isLoading: isLoadingModes } = useQuery({
    queryKey: ["modes-of-payment"],
    queryFn: modeOfPaymentService.getAllModesOfPayment,
  });

  // Fetch all payments or filtered by accountId if specified
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        let response;
        
        if (filteredAccount) {
          //console.log(`Fetching payments for account ID: ${filteredAccount}`);
          response = await paymentService.getPaymentsByAccountId(filteredAccount);
        } else {
          //console.log('Fetching all payments');
          response = await paymentService.getAllPayments();
        }
        
        //console.log("Payments response:", response);
        // Extract content array from paginated response or use empty array if undefined
        setPayments(response?.content || []);
      } catch (error) {
        console.error("Error fetching payments:", error);
        toast({
          title: "Error fetching payments",
          description: "There was an error loading the payments. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [toast, filteredAccount]);
  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };
  
  const handleAccountFilter = (value: string | null) => {
    // If 'all' is selected, clear the filter
    if (value === 'all' || value === null) {
      setFilteredAccount(null);
    } else {
      // Otherwise convert the value to a number
      setFilteredAccount(Number(value));
    }
  };

  // Define form value types
  type PaymentFormValues = z.infer<typeof paymentFormSchema>;
  type PaymentTypeFormValues = z.infer<typeof paymentTypeFormSchema>;
  type PromptFormValues = z.infer<typeof promptFormSchema>;

  // Initialize payment form
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      phoneNumber: "",
      referenceNumber: "",
      amount: 0,
      accountId: 0,
      modeOfPaymentId: 0,
      paymentTypeId: 0,
      remarks: "",
    },
  });

  // Initialize payment type form
  const paymentTypeForm = useForm<PaymentTypeFormValues>({
    resolver: zodResolver(paymentTypeFormSchema),
    defaultValues: {
      name: "",
      paymentShortDesc: "",
      paymentDescription: "",
    },
  });
  
  // Initialize payment prompt form
  const promptForm = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      accountId: 0,
      amount: 0,
      paymentTypeId: 0,
      message: "",
    },
  });

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  // Handle payment form submission
  const onSubmitPayment = async (values: PaymentFormValues) => {
    try {
      setIsSubmitting(true);
      //console.log("Submitting Payment:", values);
      const response = await paymentService.createPayment(values);
      //console.log('Payment creation response:', response);
      
      toast({ 
        title: "Payment Added",
        description: "The payment was successfully recorded.", 
      });
      
      // Refresh payments list
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      
      // Close dialog and reset form
      setShowAddPaymentDialog(false);
      paymentForm.reset();
      
      // Refetch payments
      const updatedPayments = await paymentService.getAllPayments();
      setPayments(updatedPayments || []);
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast({ 
        title: "Error", 
        description: "Failed to create payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment type form submission
  const onSubmitPaymentType = async (values: PaymentTypeFormValues) => {
    try {
      //console.log("Submitting Payment Type:", values);
      const response = await paymentTypeService.createPaymentType(values);
      //console.log('Payment type creation response:', response);
      
      toast({ 
        title: "Payment Type Added",
        description: "The payment type was successfully created.", 
      });
      
      // Refresh payment types list
      queryClient.invalidateQueries({ queryKey: ["payment-types"] });
      
      // Close dialog and reset form
      setShowAddPaymentTypeDialog(false);
      paymentTypeForm.reset();
    } catch (error) {
      console.error("Error submitting payment type:", error);
      toast({ 
        title: "Error", 
        description: "Failed to create payment type. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle payment prompt form submission
  const onSubmitPrompt = async (values: PromptFormValues) => {
    try {
      //console.log("Submitting Payment Prompt:", values);
      
      // Convert form values to the expected format for the API
      const promptData: PaymentPromptSchemaType = {
        accountId: values.accountId,
        amount: values.amount,
        paymentTypeId: values.paymentTypeId,
        message: values.message,
        dueDate: values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : undefined,
      };
      
      const response = await paymentService.promptPayment(promptData);
      //console.log('Payment prompt response:', response);
      
      toast({ 
        title: "Payment Prompt Sent",
        description: "The payment prompt was successfully sent to the user.", 
      });
      
      // Close dialog and reset form
      setShowPromptDialog(false);
      promptForm.reset();
    } catch (error) {
      console.error("Error sending payment prompt:", error);
      toast({ 
        title: "Error", 
        description: "Failed to send payment prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Refresh payments data to reflect any potential new payments created by the prompt
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-2 py-3 sm:px-4 sm:py-4 md:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
            Payments Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">View and manage all SACCO payments</p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mb-6"
        >
          <TabsList>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="types">Payment Types</TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Payments List</CardTitle>
              </CardHeader>
              <div className="flex justify-between items-center mb-4 px-6">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search accounts..."
                      value={accountSearchTerm}
                      onChange={(e) => setAccountSearchTerm(e.target.value)}
                      className="w-[300px] pl-9"
                    />
                    {accountSearchTerm && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <div
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                          onClick={() => {
                            handleAccountFilter('all');
                            setAccountSearchTerm("");
                          }}
                        >
                          All Accounts
                        </div>
                        {allAccounts
                          ?.filter((account) =>
                            `${account.name} ${account.accountNumber}`
                              .toLowerCase()
                              .includes(accountSearchTerm.toLowerCase())
                          )
                          .map((account) => (
                            <div
                              key={account.accountId}
                              className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                              onClick={() => {
                                handleAccountFilter(account.accountId.toString());
                                setAccountSearchTerm(`${account.name} - ${account.accountNumber}`);
                              }}
                            >
                              {account.name} - {account.accountNumber}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  {filteredAccount && (
                    <Button variant="outline" size="sm" onClick={() => {
                      handleAccountFilter('all');
                      setAccountSearchTerm("");
                    }}>
                      Clear Filter
                    </Button>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setShowPromptDialog(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Send Payment Prompt
                  </Button>
                  <Button onClick={() => setShowAddPaymentDialog(true)}>
                    Add Payment
                  </Button>
                </div>
              </div>

              <CardContent>
                {loading || isLoadingAccounts ? (
                  <p>Loading payments...</p>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {filteredAccount ? 
                      "No payments found for this account." : 
                      "No payments found. Add a payment to get started."}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Type</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.transactionReference}</TableCell>
                          <TableCell>
                            {payment.account?.accountNumber || "--"}
                          </TableCell>
                          <TableCell>
                            {payment?.account?.member
                              ? `${payment?.account?.member.firstName} ${payment?.account?.member.lastName}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            {payment.paymentType?.name || "--"}
                          </TableCell>
                          <TableCell>
                            {payment.modeOfPayment ?
                              payment.modeOfPayment.name : "--"}
                          </TableCell>
                          <TableCell>
                            {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                payment.status === "COMPLETED"
                                  ? "default"
                                  : payment.status === "PENDING"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(payment)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="types">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Payment Types List</CardTitle>
              </CardHeader>
              <div className="flex justify-end mb-4 px-6">
                <Button onClick={() => setShowAddPaymentTypeDialog(true)}>
                  Add Payment Type
                </Button>
              </div>

              <CardContent>
                {isLoadingPaymentTypes ? (
                  <p>Loading payment types...</p>
                ) : paymentTypes?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No payment types found. Add a payment type to get started.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Payment Description</TableHead>
                        <TableHead>Short Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentTypes?.map((paymentType) => (
                        <TableRow key={paymentType.paymentTypeId}>
                          <TableCell>{paymentType.name}</TableCell>
                          <TableCell>{paymentType.paymentDescription}</TableCell>
                          <TableCell>{paymentType.paymentShortDesc}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(paymentType)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <Dialog
          open={showAddPaymentDialog}
          onOpenChange={setShowAddPaymentDialog}
        >
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-xl font-bold text-primary">Add New Payment</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Enter the payment details below to record a payment made to an account.
                Make sure to select the correct account and payment type.
              </DialogDescription>
            </DialogHeader>
            <Form {...paymentForm}>
              <form
                onSubmit={paymentForm.handleSubmit(onSubmitPayment)}
                className="py-4 space-y-6"
              >
                <div className="mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">ACCOUNT INFORMATION</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                {/* Account Selection */}
                <FormField
                  control={paymentForm.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Account <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                        disabled={isLoadingAccounts}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select an account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allAccounts?.map((account) => (
                            <SelectItem key={account.accountId} value={account.accountId.toString()}>
                              {account.name} - {account.accountNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Select the account owner making this payment
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Type Selection */}
                <FormField
                  control={paymentForm.control}
                  name="paymentTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Payment Type <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                        disabled={isLoadingPaymentTypes}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select a payment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentTypes?.map((type) => (
                            <SelectItem key={type.paymentTypeId} value={type.paymentTypeId.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Select the type of payment being made
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Mode of Payment Selection */}
                <FormField
                  control={paymentForm.control}
                  name="modeOfPaymentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Mode of Payment <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                        disabled={isLoadingModes}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {modesOfPayment?.map((mode) => (
                            <SelectItem key={mode.modeOfPaymentId} value={mode.modeOfPaymentId.toString()}>
                              {mode.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Select the method used to make the payment (if using M-Pesa or mobile payment, Phone Number will be required)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount */}
                <FormField
                  control={paymentForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Amount <span className="text-red-500">*</span></FormLabel>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          KSh
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-10 h-10"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </div>
                      <FormDescription className="text-xs">
                        Enter the exact payment amount
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="mb-2 mt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">REFERENCE INFORMATION</h3>
                </div>

                {/* Reference Number */}
                <FormField
                  control={paymentForm.control}
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Reference Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Transaction reference number"
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Enter the transaction reference or receipt number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Number */}
                <FormField
                  control={paymentForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Phone number used for payment"
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Required for M-Pesa and mobile payments - enter the phone number used for the transaction
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                </div>
                {/* Remarks */}
                <FormField
                // add required validation
                  control={paymentForm.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="font-medium">Remarks</FormLabel>
                      <FormControl>
                        <Textarea
                          required
                          placeholder="Additional notes about this payment"
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Optional: Add any relevant details such as reason for payment, special circumstances, or follow-up actions needed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="flex gap-4 justify-end mt-6 pt-5 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddPaymentDialog(false)}
                    className="min-w-[100px] transition-all hover:bg-secondary"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="min-w-[120px] transition-all"
                  >
                    {isSubmitting ? <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      <span>Saving...</span>
                    </div> : "Save Payment"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showAddPaymentTypeDialog}
          onOpenChange={setShowAddPaymentTypeDialog}
        >
          <DialogContent className="max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader className="mb-4 pb-2 border-b">
              <DialogTitle className="text-xl font-semibold">Add Payment Type</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Create a new payment type for the SACCO. Please fill in all required fields below.
              </DialogDescription>
            </DialogHeader>
            <Form {...paymentTypeForm}>
              <form
                onSubmit={paymentTypeForm.handleSubmit(onSubmitPaymentType)}
                className="space-y-4"
              >
                {/* Payment Type Name */}
                <FormField
                  control={paymentTypeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Payment type name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Description */}
                <FormField
                  control={paymentTypeForm.control}
                  name="paymentDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed description of this payment type"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Short Description */}
                <FormField
                  control={paymentTypeForm.control}
                  name="paymentShortDesc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Brief description (for display in lists)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddPaymentTypeDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add Payment Type</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Payment Prompt Dialog */}
        <Dialog
          open={showPromptDialog}
          onOpenChange={setShowPromptDialog}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Send Payment Prompt</DialogTitle>
              <DialogDescription>
                Send a payment prompt to a member's account with details.
              </DialogDescription>
            </DialogHeader>
            <Form {...promptForm}>
              <form
                onSubmit={promptForm.handleSubmit(onSubmitPrompt)}
                className="space-y-4"
              >
                {/* Account Selection */}
                <FormField
                  control={promptForm.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                        disabled={isLoadingAccounts}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allAccounts?.map((account) => (
                            <SelectItem key={account.accountId} value={account.accountId.toString()}>
                              {account.name} - {account.accountNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Type Selection */}
                <FormField
                  control={promptForm.control}
                  name="paymentTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Type</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                        disabled={isLoadingPaymentTypes}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a payment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentTypes?.map((type) => (
                            <SelectItem key={type.paymentTypeId} value={type.paymentTypeId.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount */}
                <FormField
                  control={promptForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Amount to be paid"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Message */}
                <FormField
                  control={promptForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Message to send with the payment prompt"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date */}
                <FormField
                  control={promptForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Select due date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date?.toISOString())}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowPromptDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Send Prompt</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>
                Complete information about the selected payment
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-500">
                      Reference Number
                    </h3>
                    <p>{selectedPayment.transactionReference}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Payment Date</h3>
                    <p>
                      {new Date(
                        selectedPayment.paymentDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Member</h3>
                    <p>
                      {selectedPayment.account?.member
                        ? `${selectedPayment.account.member.firstName} ${selectedPayment.account.member.lastName}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Amount</h3>
                    <p>{formatCurrency(selectedPayment.amount)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Payment Type</h3>
                    <p>{selectedPayment.paymentType?.name || "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">
                      Mode of Payment
                    </h3>
                    <p>{selectedPayment.modeOfPayment?.name || "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Status</h3>
                    <Badge
                      variant={
                        selectedPayment.status === "COMPLETED"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedPayment.status}
                    </Badge>
                  </div>
                </div>
                {selectedPayment.remarks && (
                  <div>
                    <h3 className="font-medium text-gray-500">Remarks</h3>
                    <p>{selectedPayment.remarks}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
