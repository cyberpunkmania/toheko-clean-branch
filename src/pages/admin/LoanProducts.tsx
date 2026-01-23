import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Edit, Trash, Plus, Loader2, Users } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DashboardLayout from "./DashboardLayout";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BoardMember, BoardMemberRequest, LoanProduct } from "@/types/api";
import { boardMemberService } from "@/services/boardMemberService";
import { memberService } from "@/services/memberService";
import { loanService } from "@/services/loanService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const formSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  minAmount: z.coerce.number().min(1, "Minimum amount must be greater than 0"),
  maxAmount: z.coerce.number().min(1, "Maximum amount must be greater than 0"),
  interestRate: z.coerce.number().min(0, "Interest rate must be 0 or higher"),
  interestMethod: z.enum(["SIMPLE", "COMPOUND"]),
  minTermDays: z.coerce.number().min(1, "Minimum term is required"),
  maxTermDays: z.coerce.number().min(1, "Maximum term is required"),
  gracePeriodDays: z.coerce.number().min(0, "Grace period cannot be negative"),
  requiresCollateral: z.boolean(),
  requiresGuarantor: z.boolean(),
  requiresNextOfKin: z.boolean(),
  allowPenalties: z.boolean(),
  isActive: z.boolean(),
  maxGuarantors: z.coerce.number().min(0),
  maxCollateralItems: z.coerce.number().min(0),
  applicantType: z.enum(["MEMBER", "GROUP", "LOANEE"]),
});
type FormValues = z.infer<typeof formSchema>;

const LoanProducts = () => {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<LoanProduct | null>(
    null
  );
  const { toast } = useToast();
  const { data: loanTypes } = useQuery({
    queryKey: ["loan-types"],
    queryFn: loanService.getAllLoanTypes,
  });

  //console.log("loan product", loanTypes);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: 0,
      name: "",
      description: "",
      minAmount: 0,
      maxAmount: 0,
      interestRate: 0,
      interestMethod: "SIMPLE",
      minTermDays: 0,
      maxTermDays: 0,
      gracePeriodDays: 0,
      requiresCollateral: false,
      requiresGuarantor: false,
      requiresNextOfKin: false,
      allowPenalties: false,
      isActive: true,
      maxGuarantors: 0,
      maxCollateralItems: 0,
      applicantType: "MEMBER",
    },
  });

  // Fetch Loan Productss
  const {
    data: loanProducts,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["loanProducts"],
    queryFn: async () => {
      try {
        return await loanService.getAllLoanTypes();
      } catch (error) {
        console.error("Failed to fetch Loan Productss:", error);
        return [] as LoanProduct[];
      }
    },
  });
  const handleAddNew = () => {
    form.reset({
      id: undefined,
      name: "",
      description: "",
      minAmount: 0,
      maxAmount: 0,
      interestRate: 0,
      interestMethod: "SIMPLE",
      minTermDays: 0,
      maxTermDays: 0,
      gracePeriodDays: 0,
      requiresCollateral: false,
      requiresGuarantor: false,
      requiresNextOfKin: false,
      allowPenalties: false,
      isActive: true,
      maxGuarantors: 0,
      maxCollateralItems: 0,
      applicantType: "MEMBER",
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEdit = (product: LoanProduct) => {
    form.reset({
      id: product.id,
      name: product.name,
      description: product.description,
      minAmount: product.minAmount,
      maxAmount: product.maxAmount,
      interestRate: product.interestRate,
      interestMethod: product.interestMethod,
      minTermDays: product.minTermDays,
      maxTermDays: product.maxTermDays,
      gracePeriodDays: product.gracePeriodDays,
      requiresCollateral: product.requiresCollateral,
      requiresGuarantor: product.requiresGuarantor,
      requiresNextOfKin: product.requiresNextOfKin,
      allowPenalties: product.allowPenalties,
      isActive: product.isActive,
      maxGuarantors: product.maxGuarantors,
      maxCollateralItems: product.maxCollateralItems,
      applicantType: product.applicantType || "MEMBER",
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = (product: LoanProduct) => {
    setSelectedMember(product);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedMember) return;

    try {
      await loanService.deleteLoanType(selectedMember.id);
      toast({
        title: "Success",
        description: "Loan Products deleted successfully",
      });
      refetch();
    } catch (error) {
      console.error("Error deleting Loan Products:", error);
      toast({
        title: "Error",
        description: "Failed to delete Loan Products",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedMember(null);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const loanProductData: LoanProduct = {
        id: values.id || 0,
        name: values.name,
        description: values.description,
        minAmount: values.minAmount,
        maxAmount: values.maxAmount,
        interestRate: values.interestRate,
        interestMethod: values.interestMethod,
        minTermDays: values.minTermDays,
        maxTermDays: values.maxTermDays,
        gracePeriodDays: values.gracePeriodDays,
        requiresCollateral: values.requiresCollateral,
        requiresGuarantor: values.requiresGuarantor,
        requiresNextOfKin: values.requiresNextOfKin,
        allowPenalties: values.allowPenalties,
        isActive: values.isActive,
        maxGuarantors: values.maxGuarantors,
        maxCollateralItems: values.maxCollateralItems,
        applicantType: values.applicantType,
      };

      if (isEditing) {
        await loanService.updateLoanProduct(loanProductData);
        toast({
          title: "Success",
          description: "Loan Products updated successfully",
        });
      } else {
        await loanService.createLoanProduct(loanProductData);
        toast({
          title: "Success",
          description: "Loan Products added successfully",
        });
      }

      setShowForm(false);
      form.reset();
      refetch();
    } catch (error) {
      console.error("Error saving Loan Products:", error);
      toast({
        title: "Error",
        description: isEditing
          ? "Failed to update Loan Products"
          : "Failed to add Loan Products",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Define columns for DataTable
  const columns: Column<LoanProduct & { name?: string }>[] = [
    {
      header: "ID",
      accessorKey: "id",
      sortable: true,
    },
    {
      header: "Name",
      accessorKey: "name",
      sortable: true,
      cell: (loanProduct) => (
        <span className="font-medium">{loanProduct.name}</span>
      ),
    },
    {
      header: "Description",
      accessorKey: "description",
      sortable: true,
      cell: (loanProduct) => (
        <span className="font-medium">{loanProduct.description}</span>
      ),
    },
    {
      header: "Min AMount",
      accessorKey: "minAmount",
      sortable: true,
      cell: (loanProduct) => (
        <span className="font-medium">{loanProduct.minAmount}</span>
      ),
    },
    {
      header: "Max AMount",
      accessorKey: "maxAmount",
      sortable: true,
      cell: (loanProduct) => (
        <span className="font-medium">{loanProduct.minAmount}</span>
      ),
    },
    {
      header: "Interest Rate",
      accessorKey: "interestRate",
      sortable: true,
      cell: (loanProduct) => (
        <span className="font-medium">{loanProduct.interestRate}</span>
      ),
    },
    {
      header: "Interest Method",
      accessorKey: "interestMethod",
      sortable: true,
      cell: (loanProduct) => (
        <span className="font-medium">{loanProduct.interestMethod}</span>
      ),
    },
    {
      header: "Min Term Days",
      accessorKey: "minTermDays",
      sortable: true,
      cell: (loanProduct) => (
        <span className="font-medium">{loanProduct.minTermDays}</span>
      ),
    },

    {
      header: "Max Term Days",
      accessorKey: "maxTermDays",
      sortable: true,
      cell: (loanProduct) => (
        <span className="font-medium">{loanProduct.maxTermDays}</span>
      ),
    },
    {
      header: "Grace Period",
      accessorKey: "gracePeriodDays",
      sortable: true,
      cell: (loanProduct) => (
        <span className="font-medium">{loanProduct.gracePeriodDays}</span>
      ),
    },
    {
      header: "Requires Collateral",
      accessorKey: "requiresCollateral",
      cell: (loanProduct) => (
        <span>{loanProduct.requiresCollateral ? "Yes" : "No"}</span>
      ),
    },
    {
      header: "Requires Guarantor",
      accessorKey: "requiresGuarantor",
      cell: (loanProduct) => (
        <span>{loanProduct.requiresGuarantor ? "Yes" : "No"}</span>
      ),
    },
    {
      header: "Requires Next of Kin",
      accessorKey: "requiresNextOfKin",
      cell: (loanProduct) => (
        <span>{loanProduct.requiresNextOfKin ? "Yes" : "No"}</span>
      ),
    },
    {
      header: "Allow Penalties",
      accessorKey: "allowPenalties",
      cell: (loanProduct) => (
        <span>{loanProduct.allowPenalties ? "Yes" : "No"}</span>
      ),
    },
    {
      header: "Active",
      accessorKey: "isActive",
      cell: (loanProduct) => <span>{loanProduct.isActive ? "Yes" : "No"}</span>,
    },
    {
      header: "Max Guarantors",
      accessorKey: "maxGuarantors",
      cell: (loanProduct) => <span>{loanProduct.maxGuarantors}</span>,
    },
    {
      header: "Max Collateral Items",
      accessorKey: "maxCollateralItems",
      cell: (loanProduct) => <span>{loanProduct.maxCollateralItems}</span>,
    },
    {
      header: "Applicant Type",
      accessorKey: "applicantType",
      sortable: true,
      cell: (loanProduct) => (
        <Badge variant="outline" className="font-medium">
          {loanProduct.applicantType || "N/A"}
        </Badge>
      ),
    },

    {
      header: "Actions",
      accessorKey: "id",
      cell: (loanProduct) => (
        <div className="flex space-x-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(loanProduct);
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
              handleDelete(loanProduct);
            }}
          >
            <Trash className="h-4 w-4 mr-1" />
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
            <div>
              <CardTitle className="text-lg sm:text-xl">Loan Products</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage the SACCO Loan Products</CardDescription>
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Loan Products
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading Loan Products...</span>
              </div>
            ) : loanTypes?.length === 0 ? (
              <div className="text-center py-10">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No loan Products found
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get started by adding a new Loan Products
                </p>
                <Button
                  onClick={handleAddNew}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Loan Products
                </Button>
              </div>
            ) : (
              <DataTable
                data={loanTypes}
                columns={columns}
                keyField="id"
                pagination={true}
                searchable={true}
                pageSize={10}
                pageSizeOptions={[5, 10, 25, 50]}
                emptyMessage="No Loan Productss found"
                loading={isLoading}
                onRowClick={(boardMember) => handleEdit(boardMember)}
              />
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[600px] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Loan Products" : "Add New Loan Products"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the Loan Products's information below."
                  : "Add a new Loan Products by filling in the information below."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 overflow-y-auto pr-2"
              >
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid grid-cols-4 gap-2">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="Requirements">Requirements</TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter loan product name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Amount</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Amount</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="interestRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interest Rate (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="interestMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interest Method</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select interest method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SIMPLE">Simple</SelectItem>
                              <SelectItem value="COMPOUND">Compound</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="applicantType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Applicant Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select applicant type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MEMBER">MEMBER</SelectItem>
                              <SelectItem value="GROUP">GROUP</SelectItem>
                              <SelectItem value="LOANEE">LOANEE</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Who can apply for this loan product
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  <TabsContent value="Requirements" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="minTermDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Term (Days)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxTermDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Term (Days)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gracePeriodDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grace Period (Days)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="requiresCollateral"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Requires Collateral</FormLabel>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="requiresGuarantor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Requires Guarantor</FormLabel>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="requiresNextOfKin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Requires Next of Kin</FormLabel>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="allowPenalties"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Allow Penalties</FormLabel>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Is Active</FormLabel>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="maxGuarantors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Guarantors</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxCollateralItems"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Collateral Items</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>

                <DialogFooter className="pt-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">{isEditing ? "Update" : "Add"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this Loan Products? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default LoanProducts;
