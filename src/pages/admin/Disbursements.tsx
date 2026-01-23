/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DashboardLayout from "@/pages/admin/DashboardLayout";
import { disbursementService, DisbursementKPI } from "@/services/disbursementService";
import { loanService } from "@/services/loanService";
import { memberService } from "@/services/memberService";
import { Disbursement, DisbursementRequest, DisbursementCompleteRequest, DisbursementFailCancelRequest, LoanApplication } from "@/types/api";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign, AlertTriangle, CheckCircle, XCircle, CreditCard, Clock, Search, Trash2, Edit, TrendingUp, Users, BarChart3 } from "lucide-react";
import { format } from "date-fns";

// Form schemas
const disbursementFormSchema = z.object({
  disbursementCode: z.string().min(1, "Disbursement code is required"),
  loanApplicationId: z.number().min(1, "Loan application is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  disbursementDate: z.string().min(1, "Date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentReference: z.string().optional(),
  bankAccount: z.string().optional(),
  mobileNumber: z.string().optional(),
  remarks: z.string().optional(),
  status: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Form schema for completing a disbursement
const completeFormSchema = z.object({
  paymentReference: z.string().min(1, "Payment reference is required"),
});

// Form schema for failing or canceling a disbursement
const remarksFormSchema = z.object({
  remarks: z.string().min(1, "Remarks are required"),
});

type DisbursementFormValues = z.infer<typeof disbursementFormSchema>;
type CompleteFormValues = z.infer<typeof completeFormSchema>;
type RemarksFormValues = z.infer<typeof remarksFormSchema>;

const Disbursements = () => {
  // State for disbursements data
  const [showDetails, setShowDetails] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showFailForm, setShowFailForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDisbursement, setSelectedDisbursement] = useState<Disbursement | null>(null);
  const [disbursementToDelete, setDisbursementToDelete] = useState<Disbursement | null>(null);
  
  // Loading states
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isProcessLoading, setIsProcessLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const { toast } = useToast();

  // Form hooks
  const disbursementForm = useForm<DisbursementFormValues>({
    resolver: zodResolver(disbursementFormSchema),
    defaultValues: {
      disbursementCode: "",
      loanApplicationId: 0,
      amount: 0,
      disbursementDate: new Date().toISOString().split("T")[0],
      paymentMethod: "",
      paymentReference: "",
      bankAccount: "",
      mobileNumber: "",
      remarks: "",
      status: "PENDING",
      isActive: true,
    },
  });

  const completeForm = useForm<CompleteFormValues>({
    resolver: zodResolver(completeFormSchema),
    defaultValues: {
      paymentReference: "",
    },
  });

  const remarksForm = useForm<RemarksFormValues>({
    resolver: zodResolver(remarksFormSchema),
    defaultValues: {
      remarks: "",
    },
  });

  // Queries
  const { data: disbursementsData = [], isLoading: isDisbursementsLoading, refetch: refetchDisbursements } = useQuery({
    queryKey: ["disbursements"],
    queryFn: disbursementService.getAllDisbursements,
  });
const disbursements = disbursementsData?.content || [];
  //console.log('Disbursements data:', disbursements);

  const { data: loanApplications = [], isLoading: isLoanApplicationsLoading } = useQuery({
    queryKey: ["loan-applications"],
    queryFn: loanService.getAllLoanApplications,
  });

  // Fetch KPIs
  const { data: kpis, isLoading: isKPIsLoading } = useQuery({
    queryKey: ["disbursement-kpis"],
    queryFn: disbursementService.getKPIs,
  });

  // Helper to get loan application by ID
  const getLoanApplication = (id: number): LoanApplication | undefined => {
    return loanApplications.find(loan => loan.id === id);
  };

  // Handler functions for CRUD operations
  const handleViewDetails = (disbursement: Disbursement) => {
    setSelectedDisbursement(disbursement);
    setShowDetails(true);
  };

  const handleEditDisbursement = (disbursement: Disbursement) => {
    setSelectedDisbursement(disbursement);
    
    // Reset form with disbursement data
    disbursementForm.reset({
      disbursementCode: disbursement.disbursementCode,
      loanApplicationId: disbursement.loanApplicationId,
      amount: disbursement.amount,
      disbursementDate: disbursement.disbursementDate.split('T')[0],
      paymentMethod: disbursement.paymentMethod,
      paymentReference: disbursement.paymentReference,
      bankAccount: disbursement.bankAccount,
      mobileNumber: disbursement.mobileNumber,
      remarks: disbursement.remarks,
      status: disbursement.status,
      isActive: disbursement.isActive,
    });
    
    setShowEditForm(true);
  };

  const handleAddDisbursement = () => {
    disbursementForm.reset({
      disbursementCode: '',
      loanApplicationId: 0,
      amount: 0,
      disbursementDate: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      paymentReference: '',
      bankAccount: '',
      mobileNumber: '',
      remarks: '',
      status: 'PENDING',
      isActive: true,
    });
    setShowAddForm(true);
  };

  const handleProcessDisbursement = async (id: number) => {
    try {
      setIsProcessLoading(true);
      await disbursementService.processDisbursement(id);
      toast({
        title: 'Success',
        description: 'Disbursement has been processed successfully.',
      });
      refetchDisbursements();
    } catch (error) {
      console.error('Error processing disbursement:', error);
      toast({
        title: 'Error',
        description: 'Failed to process disbursement.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessLoading(false);
    }
  };

  const handleCompleteDisbursement = (disbursement: Disbursement) => {
    setSelectedDisbursement(disbursement);
    completeForm.reset({
      paymentReference: '',
    });
    setShowCompleteForm(true);
  };

  const handleFailDisbursement = (disbursement: Disbursement) => {
    setSelectedDisbursement(disbursement);
    remarksForm.reset({
      remarks: '',
    });
    setShowFailForm(true);
  };

  const handleCancelDisbursement = (disbursement: Disbursement) => {
    setSelectedDisbursement(disbursement);
    remarksForm.reset({
      remarks: '',
    });
    setShowCancelForm(true);
  };

  const handleConfirmDelete = (disbursement: Disbursement) => {
    setDisbursementToDelete(disbursement);
    setShowDeleteConfirm(true);
  };

  const handleDeleteDisbursement = async () => {
    if (!disbursementToDelete) return;

    try {
      setIsDeleteLoading(true);
      await disbursementService.deleteDisbursement(disbursementToDelete.id);
      toast({
        title: 'Success',
        description: 'Disbursement has been deleted successfully.',
      });
      setShowDeleteConfirm(false);
      refetchDisbursements();
    } catch (error) {
      console.error('Error deleting disbursement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete disbursement.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteLoading(false);
      setDisbursementToDelete(null);
    }
  };

  // Form submission handlers
  const onSubmitEdit = async (values: DisbursementFormValues) => {
    if (!selectedDisbursement) return;

    try {
      setIsEditLoading(true);
      // Ensure all required fields are provided for DisbursementRequest
      const disbursementData: DisbursementRequest = {
        disbursementCode: values.disbursementCode,
        loanApplicationId: values.loanApplicationId || selectedDisbursement.loanApplicationId,
        amount: values.amount,
        disbursementDate: values.disbursementDate,
        paymentMethod: values.paymentMethod,
        disbursedBy: selectedDisbursement.disbursedBy,
        paymentReference: values.paymentReference,
        bankAccount: values.bankAccount,
        mobileNumber: values.mobileNumber,
        remarks: values.remarks,
        status: values.status,
        isActive: values.isActive
      };
      
      await disbursementService.updateDisbursement(selectedDisbursement.id, disbursementData);
      toast({
        title: 'Success',
        description: 'Disbursement has been updated successfully.',
      });
      setShowEditForm(false);
      refetchDisbursements();
    } catch (error) {
      console.error("Error updating disbursement:", error);
      toast({
        title: "Error",
        description: "Failed to update disbursement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditLoading(false);
    }
  };

  const onSubmitAdd = async (values: DisbursementFormValues) => {
    try {
      setIsAddLoading(true);
      // Ensure all required fields are provided for DisbursementRequest
      const disbursementData: DisbursementRequest = {
        disbursementCode: values.disbursementCode,
        loanApplicationId: values.loanApplicationId,
        amount: values.amount,
        disbursementDate: values.disbursementDate,
        paymentMethod: values.paymentMethod,
        disbursedBy: 1, // This should be the current user's ID in a real app
        paymentReference: values.paymentReference,
        bankAccount: values.bankAccount,
        mobileNumber: values.mobileNumber,
        remarks: values.remarks,
        status: values.status,
        isActive: values.isActive
      };
      
      await disbursementService.createDisbursement(disbursementData);
      toast({
        title: 'Success',
        description: 'Disbursement has been created successfully.',
      });
      setShowAddForm(false);
      refetchDisbursements();
    } catch (error) {
      console.error("Error creating disbursement:", error);
      toast({
        title: "Error",
        description: "Failed to create disbursement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddLoading(false);
    }
  };

  const onSubmitComplete = async (values: CompleteFormValues) => {
    if (!selectedDisbursement) return;

    try {
      await disbursementService.completeDisbursement(selectedDisbursement.id, {
        id: selectedDisbursement.id,
        paymentReference: values.paymentReference,
      });
      toast({
        title: 'Success',
        description: 'Disbursement has been completed successfully.',
      });
      setShowCompleteForm(false);
      refetchDisbursements();
    } catch (error) {
      console.error("Error completing disbursement:", error);
      toast({
        title: "Error",
        description: "Failed to complete disbursement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmitFail = async (values: RemarksFormValues) => {
    if (!selectedDisbursement) return;

    try {
      await disbursementService.failDisbursement(selectedDisbursement.id, {
        id: selectedDisbursement.id,
        remarks: values.remarks,
      });
      toast({
        title: 'Success',
        description: 'Disbursement has been marked as failed.',
      });
      setShowFailForm(false);
      refetchDisbursements();
    } catch (error) {
      console.error("Error failing disbursement:", error);
      toast({
        title: "Error",
        description: "Failed to mark disbursement as failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmitCancel = async (values: RemarksFormValues) => {
    if (!selectedDisbursement) return;

    try {
      await disbursementService.cancelDisbursement(selectedDisbursement.id, {
        id: selectedDisbursement.id,
        remarks: values.remarks,
      });
      toast({
        title: 'Success',
        description: 'Disbursement has been cancelled successfully.',
      });
      setShowCancelForm(false);
      refetchDisbursements();
    } catch (error) {
      console.error("Error cancelling disbursement:", error);
      toast({
        title: "Error",
        description: "Failed to cancel disbursement. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper for status badge variant
  const getStatusVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "default";
      case "PROCESSING":
        return "default";
      case "PENDING":
        return "secondary";
      case "FAILED":
        return "destructive";
      case "CANCELLED":
        return "outline";
      default:
        return "outline";
    }
  };

  // DataTable column definitions
  const columns: Column<any>[] = [
    { header: "ID", accessorKey: "id", sortable: true },
    { header: "Member ID", accessorKey: "memberName", sortable: true },
    { header: "Loan Account No", accessorKey: "accountNo", sortable: true },
    { header: "Loan Application", accessorKey: "loanApplicationCode", sortable: true },
    { header: "Phone", accessorKey: "msisdnMasked", cell: (row) => row.msisdnMasked || "--" },
    { header: "Amount", accessorKey: "amount", sortable: true },
    { header: "Channel", accessorKey: "channel", sortable: true },
    { header: "Status", accessorKey: "status", sortable: true },
    { header: "Error Message", accessorKey: "errorMessage" },
    { header: "Remarks", accessorKey: "remarks" },
    { header: "Requested At", accessorKey: "requestedAt", cell: (row) => row.requestedAt ? format(new Date(row.requestedAt), "dd/MM/yyyy HH:mm") : "--" },
    { header: "Executed At", accessorKey: "executedAt", cell: (row) => row.executedAt ? format(new Date(row.executedAt), "dd/MM/yyyy HH:mm") : "--" },
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto px-2 py-3 sm:px-4 sm:py-4 md:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Disbursements Management</h1>
          <Button onClick={handleAddDisbursement} className="flex items-center gap-2 w-full sm:w-auto">
            <DollarSign className="h-4 w-4" />
            New Disbursement
          </Button>
        </div>

        {/* KPI Section */}
        <Accordion type="single" collapsible defaultValue="kpis" className="w-full">
          <AccordionItem value="kpis">
            <AccordionTrigger className="text-lg font-semibold">
              Disbursement KPIs
            </AccordionTrigger>
            <AccordionContent>
              {isKPIsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading KPIs...</span>
                </div>
              ) : kpis ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Disbursements */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Total Disbursements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpis.totalCount}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        KES {kpis.totalAmount.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Average Amount */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Average Amount
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">KES {kpis.avgAmount.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Range: {kpis.minAmount.toLocaleString()} - {kpis.maxAmount.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Success Rate */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Success Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpis.successRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {kpis.executedCount} executed / {kpis.failedCount} failed
                      </p>
                    </CardContent>
                  </Card>

                  {/* Unique Members */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Unique Members
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpis.uniqueMembers}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Active recipients
                      </p>
                    </CardContent>
                  </Card>

                  {/* By Status */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        By Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {kpis.byStatus.map((status) => (
                          <div key={status.status} className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1">
                              <Badge variant={
                                status.status === 'COMPLETED' ? 'default' :
                                status.status === 'PENDING' ? 'secondary' :
                                status.status === 'PROCESSING' ? 'outline' : 'destructive'
                              } className="text-xs">
                                {status.status}
                              </Badge>
                            </span>
                            <span className="font-medium">{status.count} (KES {status.amount.toLocaleString()})</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Channel */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        By Channel
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {kpis.byChannel.map((channel) => (
                          <div key={channel.channel} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{channel.channel}</span>
                            <span className="font-medium">{channel.count} (KES {channel.amount.toLocaleString()})</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No KPI data available
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* All Disbursements Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>All Disbursements</CardTitle>
            <CardDescription>View and manage all disbursements</CardDescription>
          </CardHeader>
          <CardContent>
            {isDisbursementsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading disbursements...</span>
              </div>
            ) : disbursements.length === 0 ? (
              <div className="text-center py-10">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No disbursements found
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get started by creating a new disbursement.
                </p>
              </div>
            ) : (
              <DataTable
                data={disbursements}
                columns={columns}
                keyField="id"
                pagination={true}
                searchable={true}
                pageSize={10}
                pageSizeOptions={[5, 10, 25, 50]}
                emptyMessage="No disbursements found"
                loading={isDisbursementsLoading}
              />
            )}
          </CardContent>
        </Card>

        {/* View Disbursement Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Disbursement Details</DialogTitle>
              <DialogDescription>
                Complete information about the selected disbursement
              </DialogDescription>
            </DialogHeader>
            {selectedDisbursement && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-500">Disbursement ID</h3>
                    <p>{selectedDisbursement.id}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Code</h3>
                    <p>{selectedDisbursement.disbursementCode}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Loan Application</h3>
                    <p>{selectedDisbursement.loanApplicationCode}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Member</h3>
                    <p>{selectedDisbursement.memberName}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Amount</h3>
                    <p>KES {selectedDisbursement.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Date</h3>
                    <p>{format(new Date(selectedDisbursement.disbursementDate), "PPP")}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Status</h3>
                    <Badge variant={getStatusVariant(selectedDisbursement.status)}>
                      {selectedDisbursement.status}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Payment Method</h3>
                    <p>{selectedDisbursement.paymentMethod}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Payment Reference</h3>
                    <p>{selectedDisbursement.paymentReference || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Bank Account</h3>
                    <p>{selectedDisbursement.bankAccount || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Mobile Number</h3>
                    <p>{selectedDisbursement.mobileNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Disbursed By</h3>
                    <p>{selectedDisbursement.disbursedByName}</p>
                  </div>
                  <div className="col-span-2">
                    <h3 className="font-medium text-gray-500">Remarks</h3>
                    <p>{selectedDisbursement.remarks || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Created At</h3>
                    <p>{format(new Date(selectedDisbursement.createdAt), "PPP")}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Updated At</h3>
                    <p>{format(new Date(selectedDisbursement.updatedAt), "PPP")}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Disbursement Form Dialog */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Disbursement</DialogTitle>
              <DialogDescription>
                Update the disbursement details below
              </DialogDescription>
            </DialogHeader>
            <Form {...disbursementForm}>
              <form onSubmit={disbursementForm.handleSubmit(onSubmitEdit)} className="space-y-4">
                <FormField
                  control={disbursementForm.control}
                  name="disbursementCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disbursement Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="disbursementDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disbursement Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                          <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="CHEQUE">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="paymentReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Reference</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="bankAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isEditLoading}
                  >
                    {isEditLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Disbursement'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Add Disbursement Form Dialog */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
            <DialogHeader className="space-y-3 pb-2 border-b">
              <div className="flex items-center space-x-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Add New Disbursement</DialogTitle>
                  <DialogDescription className="text-sm opacity-80">
                    Enter the disbursement details to create a new disbursement record
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <Form {...disbursementForm}>
              <form onSubmit={disbursementForm.handleSubmit(onSubmitAdd)} className="space-y-5 py-4">
                <FormField
                  control={disbursementForm.control}
                  name="disbursementCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disbursement Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="loanApplicationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Application</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select loan application" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loanApplications.map((loan) => (
                            // <SelectItem key={loan.loanApplicationId} value={loan.loanApplicationId}>
                            //   {loan.loanApplicationCode || `Loan #${loan.loanApplicationId}`}
                            // </SelectItem>
                            <SelectItem key={loan.loanApplicationId} value={loan.loanApplicationId}>
                              {loan.loanApplicationCode || `Loan #${loan.loanApplicationId}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="disbursementDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disbursement Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                          <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="CHEQUE">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="paymentReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Reference</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="bankAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={disbursementForm.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isAddLoading}
                  >
                    {isAddLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Disbursement'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Complete Disbursement Dialog */}
        <Dialog open={showCompleteForm} onOpenChange={setShowCompleteForm}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Complete Disbursement</DialogTitle>
              <DialogDescription>
                Enter the payment reference to complete this disbursement.
              </DialogDescription>
            </DialogHeader>
            <Form {...completeForm}>
              <form onSubmit={completeForm.handleSubmit(onSubmitComplete)} className="space-y-4">
                <FormField
                  control={completeForm.control}
                  name="paymentReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Reference</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter payment reference" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" variant="default">
                    Complete Disbursement
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Fail Disbursement Dialog */}
        <Dialog open={showFailForm} onOpenChange={setShowFailForm}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Mark as Failed</DialogTitle>
              <DialogDescription>
                Provide a reason for marking this disbursement as failed.
              </DialogDescription>
            </DialogHeader>
            <Form {...remarksForm}>
              <form onSubmit={remarksForm.handleSubmit(onSubmitFail)} className="space-y-4">
                <FormField
                  control={remarksForm.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter reason for failure" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" variant="destructive">
                    Mark as Failed
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Cancel Disbursement Dialog */}
        <Dialog open={showCancelForm} onOpenChange={setShowCancelForm}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Cancel Disbursement</DialogTitle>
              <DialogDescription>
                Provide a reason for cancelling this disbursement.
              </DialogDescription>
            </DialogHeader>
            <Form {...remarksForm}>
              <form onSubmit={remarksForm.handleSubmit(onSubmitCancel)} className="space-y-4">
                <FormField
                  control={remarksForm.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter reason for cancellation" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" variant="outline">
                    Cancel Disbursement
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this disbursement? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteDisbursement}
                disabled={isDeleteLoading}
              >
                {isDeleteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Disbursements;
