/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/pages/admin/DashboardLayout";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { paymentTypeService, PaymentTypeFormValues } from "@/services/paymentTypeService";
import { PaymentType } from "@/types/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const PaymentTypes = () => {
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const paymentTypeFormSchema = z.object({
    name: z.string().min(3, "Name is required"),
    paymentShortDesc: z.string().optional(),
    paymentDescription: z.string().optional(),
  });

  type FormValues = z.infer<typeof paymentTypeFormSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(paymentTypeFormSchema),
    defaultValues: {
      name: "",
      paymentShortDesc: "",
      paymentDescription: "",
    },
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(paymentTypeFormSchema),
    defaultValues: {
      name: "",
      paymentShortDesc: "",
      paymentDescription: "",
    },
  });

  useEffect(() => {
    fetchPaymentTypes();
  }, []);

  useEffect(() => {
    if (selectedPaymentType && showEditDialog) {
      editForm.reset({
        name: selectedPaymentType.name || "",
        paymentShortDesc: selectedPaymentType.paymentShortDesc || "",
        paymentDescription: selectedPaymentType.paymentDescription || "",
      });
      
      // Log the selected payment type for debugging
      //console.log("Selected payment type for editing:", selectedPaymentType);
    }
  }, [selectedPaymentType, showEditDialog, editForm]);

  const fetchPaymentTypes = async () => {
    try {
      setLoading(true);
      const response = await paymentTypeService.getAllPaymentTypes();
      setPaymentTypes(response || []);
    } catch (error) {
      console.error("Error fetching payment types:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payment types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentType = async (values: FormValues) => {
    try {
      setSubmitting(true);
      // Make sure all required fields are provided
      const paymentTypeData: PaymentTypeFormValues = {
        name: values.name,
        paymentShortDesc: values.paymentShortDesc || "",
        paymentDescription: values.paymentDescription || ""
      };
      await paymentTypeService.createPaymentType(paymentTypeData);
      toast({
        title: "Success",
        description: "Payment type added successfully",
      });
      setShowAddDialog(false);
      form.reset();
      fetchPaymentTypes();
    } catch (error) {
      console.error("Error adding payment type:", error);
      toast({
        title: "Error",
        description: "Failed to add payment type",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPaymentType = async (values: FormValues) => {
    if (!selectedPaymentType) return;
    
    try {
      setSubmitting(true);
      
      // Make sure all required fields are provided
      const paymentTypeData: PaymentTypeFormValues = {
        name: values.name,
        paymentShortDesc: values.paymentShortDesc || "",
        paymentDescription: values.paymentDescription || ""
      };
      
      await paymentTypeService.updatePaymentType(
        selectedPaymentType.paymentTypeId,
        paymentTypeData
      );
      
      toast({
        title: "Success",
        description: "Payment type updated successfully",
      });
      
      setShowEditDialog(false);
      editForm.reset();
      fetchPaymentTypes();
    } catch (error) {
      console.error("Error updating payment type:", error);
      toast({
        title: "Error",
        description: "Failed to update payment type",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePaymentType = async () => {
    if (!selectedPaymentType) return;
    
    try {
      setSubmitting(true);
      await paymentTypeService.deletePaymentType(selectedPaymentType.paymentTypeId);
      toast({
        title: "Success",
        description: "Payment type deleted successfully",
      });
      setShowDeleteDialog(false);
      fetchPaymentTypes();
    } catch (error) {
      console.error("Error deleting payment type:", error);
      toast({
        title: "Error",
        description: "Failed to delete payment type",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Define columns for DataTable
  const columns: Column<PaymentType>[] = [
    {
      header: "ID",
      accessorKey: "paymentTypeId",
      sortable: true,
    },
    {
      header: "Name",
      accessorKey: "name",
      sortable: true,
      cell: (paymentType) => (
        <span className="font-medium">{paymentType.name}</span>
      ),
    },
    {
      header: "Short Description",
      accessorKey: "paymentShortDesc",
      sortable: true,
      cell: (paymentType) => (
        <span>{paymentType.paymentShortDesc || "-"}</span>
      ),
    },
    {
      header: "Description",
      accessorKey: "paymentDescription",
      sortable: true,
      cell: (paymentType) => (
        <span>{paymentType.paymentDescription || "-"}</span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "paymentTypeId",
      cell: (paymentType) => (
        <div className="flex space-x-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPaymentType(paymentType);
              setShowEditDialog(true);
            }}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPaymentType(paymentType);
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto px-2 py-3 sm:px-4 sm:py-4 md:py-8">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <CardTitle className="text-lg sm:text-xl">Payment Types</CardTitle>
            <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Type
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading payment types...</span>
              </div>
            ) : paymentTypes.length === 0 ? (
              <div className="text-center py-10">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No payment types found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get started by creating a new payment type.
                </p>
                <Button 
                  onClick={() => setShowAddDialog(true)} 
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Payment Type
                </Button>
              </div>
            ) : (
              <DataTable
                data={paymentTypes}
                columns={columns}
                keyField="paymentTypeId"
                pagination={true}
                searchable={true}
                pageSize={10}
                pageSizeOptions={[5, 10, 25, 50]}
                emptyMessage="No payment types found"
                loading={loading}
                onRowClick={(paymentType) => {
                  setSelectedPaymentType(paymentType);
                  setShowEditDialog(true);
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Add Payment Type Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Type</DialogTitle>
              <DialogDescription>
                Create a new payment type for transactions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleAddPaymentType)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input
                  id="name"
                  placeholder="Enter payment type name"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="shortDesc" className="text-sm font-medium">Short Description</label>
                <Input
                  id="shortDesc"
                  placeholder="Enter short description"
                  {...form.register("paymentShortDesc")}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  placeholder="Enter detailed description"
                  {...form.register("paymentDescription")}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Payment Type"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Payment Type Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Payment Type</DialogTitle>
              <DialogDescription>
                Update the payment type details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editForm.handleSubmit(handleEditPaymentType)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium">Name</label>
                <Input
                  id="edit-name"
                  placeholder="Enter payment type name"
                  {...editForm.register("name")}
                />
                {editForm.formState.errors.name && (
                  <p className="text-sm text-red-500">{editForm.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="edit-shortDesc" className="text-sm font-medium">Short Description</label>
                <Input
                  id="edit-shortDesc"
                  placeholder="Enter short description"
                  {...editForm.register("paymentShortDesc")}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="edit-description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter detailed description"
                  {...editForm.register("paymentDescription")}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Payment Type"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the payment type
                and remove it from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeletePaymentType} 
                className="bg-red-600 hover:bg-red-700"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default PaymentTypes;
