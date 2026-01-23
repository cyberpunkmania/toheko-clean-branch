/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { BoardMember, BoardMemberRequest, LoanPenalty } from "@/types/api";
import { boardMemberService } from "@/services/boardMemberService";
import { memberService } from "@/services/memberService";
import { loanService } from "@/services/loanService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const formSchema = z.object({
  id: z.number().optional(),
  penaltyType: z.string().min(1, "penaltyType is required"),
  isActive: z.boolean(),
  loanProductId: z.coerce.number().min(0),
  penaltyValue: z.coerce.number().min(0),
});
type FormValues = z.infer<typeof formSchema>;

const LoanPenalties = () => {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<LoanPenalty | null>(
    null
  );
  const { toast } = useToast();
  const { data: loanTypes } = useQuery({
    queryKey: ["loan-types"],
    queryFn: loanService.getAllLoanPenalties,
  });

  const { data: loanProducts } = useQuery({
    queryKey: ["loan-products"],
    queryFn: loanService.getAllLoanTypes,
  });

  //console.log("loan product", loanTypes);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: 0,
      loanProductId: 0,
      penaltyType: "",
      penaltyValue: 0,
      isActive: true,
    },
  });

  // Fetch Loan Productss
  const {
    data: LoanPenaltys,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["loanPenalties"],
    queryFn: async () => {
      try {
        return await loanService.getAllLoanPenalties();
      } catch (error) {
        console.error("Failed to fetch Loan Productss:", error);
        return [] as LoanPenalty[];
      }
    },
  });
  const handleAddNew = () => {
    form.reset({
      id: undefined,
      loanProductId: 0,
      penaltyType: "",
      penaltyValue: 0,
      isActive: true,
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEdit = (product: LoanPenalty) => {
    form.reset({
      id: product.id,
      loanProductId: product.loanProductId,
      penaltyType: product.penaltyType,
      penaltyValue: product.penaltyValue,
      isActive: product.isActive,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = (product: LoanPenalty) => {
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
      const LoanPenaltyData: LoanPenalty = {
        id: values.id || 0,
        loanProductId: values.loanProductId,
        penaltyType: values.penaltyType,
        penaltyValue: values.penaltyValue,
        isActive: values.isActive,
      };

      if (isEditing) {
        await loanService.updateLoanPenalty(LoanPenaltyData);
        toast({
          title: "Success",
          description: "Loan Products updated successfully",
        });
      } else {
        await loanService.createLoanPenanlty(LoanPenaltyData);
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
  const columns: Column<LoanPenalty & { PenaltyType?: string }>[] = [
    {
      header: "ID",
      accessorKey: "id",
      sortable: true,
    },
    {
      header: "PenaltyType",
      accessorKey: "penaltyType",
      sortable: true,
      cell: (LoanPenalty) => (
        <span className="font-medium">{LoanPenalty.penaltyType}</span>
      ),
    },
    {
      header: "PenaltyValue",
      accessorKey: "penaltyValue",
      sortable: true,
      cell: (LoanPenalty) => (
        <span className="font-medium">{LoanPenalty.penaltyValue}</span>
      ),
    },

    {
      header: "Active",
      accessorKey: "isActive",
      cell: (LoanPenalty) => <span>{LoanPenalty.isActive ? "Yes" : "No"}</span>,
    },

    {
      header: "Actions",
      accessorKey: "id",
      cell: (LoanPenalty) => (
        <div className="flex space-x-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(LoanPenalty);
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
              handleDelete(LoanPenalty);
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
              <CardTitle className="text-lg sm:text-xl">Loan Penalties</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage the SACCO Loan Penalties</CardDescription>
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Loan Penalties
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading Loan Penalties...</span>
              </div>
            ) : LoanPenaltys?.length === 0 ? (
              <div className="text-center py-10">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No loan Penalties found
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get started by adding a new Loan Penalties
                </p>
                <Button
                  onClick={handleAddNew}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Loan Penalties
                </Button>
              </div>
            ) : (
              <DataTable
                data={LoanPenaltys}
                columns={columns}
                keyField="id"
                pagination={true}
                searchable={true}
                pageSize={10}
                pageSizeOptions={[5, 10, 25, 50]}
                emptyMessage="No Loan Penaltis found"
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
                {isEditing ? "Edit Loan Penalties" : "Add New Loan Penalties"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the Loan Penalties's information below."
                  : "Add a new Loan Penalties by filling in the information below."}
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
                  </TabsList>
                  <TabsContent value="basic" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="loanProductId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Product</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(parseInt(value))
                              }
                              defaultValue={field.value.toString()}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select loan product" />
                              </SelectTrigger>
                              <SelectContent>
                                {loanProducts?.map((type: any) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="penaltyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Penalty Type</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select penalty type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DAILY_PERCENTAGE">
                                  Daily Percentage
                                </SelectItem>
                                <SelectItem value="FLAT">Flat</SelectItem>
                                <SelectItem value="PERCENTAGE">
                                  Percentage
                                </SelectItem>
                                <SelectItem value="NONE">None</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="penaltyValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PenaltyValue</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
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

export default LoanPenalties;
