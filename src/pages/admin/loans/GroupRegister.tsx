/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Trash } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoanGuarantor, LoanProduct } from "@/types/api";
import { paymentTypeService } from "@/services/paymentTypeService";
import { useMutation, useQuery } from "@tanstack/react-query";
import { loanService } from "@/services/loanService";
import { memberService } from "@/services/memberService";
import { toast } from "@/hooks/use-toast";

// Define the schema using Zod
const loanApplicationSchema = z.object({
  id: z.number().optional(),
  loanProductId: z.number().min(1, "Loan Product ID is required"),
  applicantId: z.number().min(1, "Applicant ID is required"),
  memberId: z.number().min(1, "Member ID is required"),
  name: z.string().min(1, "Loan name is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  termDays: z.number().min(1, "Term days must be greater than 0"),
  guarantors: z.array(
    z.object({
      id: z.number().optional(),
      loanApplicationId: z.number().optional(),
      guarantorName: z.string().min(1, "Guarantor name is required"),
      relationship: z.string().min(1, "Relationship is required"),
      guarantorContact: z.string().min(1, "Contact is required"),
      guarantorIdNumber: z.string().min(1, "ID Number is required"),
      guaranteedAmount: z
        .number()
        .min(1, "Guaranteed amount must be greater than 0"),
    })
  ),
  nextOfKin: z.array(
    z.object({
      id: z.number().optional(),
      loanApplicationId: z.number().optional(),
      name: z.string().min(1, "Name is required"),
      relationship: z.string().min(1, "Relationship is required"),
      phone: z.string().min(1, "Phone is required"),
      email: z.string().email("Invalid email"),
      address: z.string().min(1, "Address is required"),
    })
  ),
  collateral: z.array(
    z.object({
      id: z.number().optional(),
      loanApplicationId: z.number().optional(),
      type: z.string().min(1, "Type is required"),
      description: z.string().min(1, "Description is required"),
      estimatedValue: z
        .number()
        .min(1, "Estimated value must be greater than 0"),
      ownerName: z.string().min(1, "Owner name is required"),
      ownerContact: z.string().min(1, "Owner contact is required"),
    })
  ),
});

type LoanApplicationFormValues = z.infer<typeof loanApplicationSchema>;

const LoanApplicationForm: React.FC = () => {
  const [guarantors, setGuarantors] = useState<LoanGuarantor[]>([]);
  const [showForm, setShowForm] = useState(false);

  const { data: loanTypes } = useQuery({
    queryKey: ["loan-types"],
    queryFn: loanService.getAllLoanTypes,
  });

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: memberService.getAllMembers,
  });

  const form = useForm<LoanApplicationFormValues>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      loanProductId: 0,
      applicantId: 0,
      memberId: 0,
      name: "",
      amount: 0,
      termDays: 0,
      guarantors: [],
      nextOfKin: [],
      collateral: [],
    },
  });

  //console.log("loan", form);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const {
    fields: guarantorFields,
    append: appendGuarantor,
    remove: removeGuarantor,
  } = useFieldArray({
    control,
    name: "guarantors",
  });

  const {
    fields: nextOfKinFields,
    append: appendNextOfKin,
    remove: removeNextOfKin,
  } = useFieldArray({
    control,
    name: "nextOfKin",
  });

  const {
    control: guarantorControl,
    handleSubmit: handleAddGuarantor,
    reset: resetGuarantor,
  } = useForm<LoanGuarantor>();

  const {
    fields: collateralFields,
    append: appendCollateral,
    remove: removeCollateral,
  } = useFieldArray({
    control,
    name: "collateral",
  });

  const mutation = useMutation({
    mutationFn: loanService.createLoanApplication,
    onSuccess: () => {
      toast({ title: "Success", description: "Loan application submitted." });
      setShowForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit loan application.",
      });
      console.error("Submission error:", error);
    },
  });

  const onSubmit = (data: LoanApplicationFormValues) => {
    //console.log("Loan Application Data:", data);
    mutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-8">
      <Button onClick={() => setShowForm(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Loan Application
      </Button>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>New Loan Application</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid grid-cols-4 gap-2">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="guarantors">Guarantors</TabsTrigger>
                  <TabsTrigger value="nextOfKin">Next of Kin</TabsTrigger>
                  <TabsTrigger value="collateral">Collateral</TabsTrigger>
                </TabsList>
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <FormField
                    control={control}
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
                              {loanTypes?.map((type: any) => (
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
                    control={control}
                    name="applicantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Applicant ID</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="memberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            defaultValue={field.value.toString()}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {members?.map((member: any) => (
                                <SelectItem
                                  key={member.memberId}
                                  value={member.memberId}
                                >
                                  {member.firstName} {member.lastName}
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
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Name</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
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
                    control={control}
                    name="termDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term (Days)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Guarantors Tab */}
                <TabsContent value="guarantors" className="space-y-4 pt-4">
                  <div>
                    <h3 className="text-lg font-semibold">Add Guarantor</h3>
                    <form
                      onSubmit={handleAddGuarantor((values) => {
                        setGuarantors((prev) => [...prev, values]);
                        resetGuarantor(); // clear mini form
                      })}
                      className="space-y-2 border p-4"
                    >
                      <FormField
                        control={guarantorControl}
                        name="guarantorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={guarantorControl}
                        name="relationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={guarantorControl}
                        name="guarantorContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={guarantorControl}
                        name="guarantorIdNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={guarantorControl}
                        name="guaranteedAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Guarantor
                      </Button>
                    </form>

                    {/* List of Added Guarantors */}
                    <div className="pt-4">
                      <h3 className="text-lg font-semibold">Guarantors List</h3>
                      {guarantors.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No guarantors added yet.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {guarantors.map((g, i) => (
                            <li key={i} className="border p-3 rounded-md">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">
                                    {g.guarantorName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {g.relationship} – {g.guarantorContact}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    ID: {g.guarantorIdNumber}, Amount:{" "}
                                    {g.guaranteedAmount}
                                  </p>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    setGuarantors((prev) =>
                                      prev.filter((_, idx) => idx !== i)
                                    )
                                  }
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Next of Kin Tab */}
                <TabsContent value="nextOfKin" className="space-y-4 pt-4">
                  <div>
                    <h3 className="text-lg font-semibold">Next of Kin</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {nextOfKinFields.map((item, index) => (
                        <div
                          key={item.id}
                          className="space-y-2 border p-4 mb-4"
                        >
                          <FormField
                            control={control}
                            name={`nextOfKin.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel> Name</FormLabel>
                                <FormControl>
                                  <Input type="text" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name={`nextOfKin.${index}.relationship`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Relationship</FormLabel>
                                <FormControl>
                                  <Input type="text" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name={`nextOfKin.${index}.email`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name={`nextOfKin.${index}.phone`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input type="text" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name={`nextOfKin.${index}.address`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input type="text" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => removeGuarantor(index)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Remove NEXTOFKIN
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() =>
                          appendNextOfKin({
                            name: "",
                            relationship: "",
                            email: "",
                            phone: "",
                            address: "",
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add NextOfKin
                      </Button>
                    </div>
                  </div>{" "}
                </TabsContent>
                {/* Collateral Tab */}
                <TabsContent value="collateral" className="space-y-4 pt-4">
                  <div>
                    <h3 className="text-lg font-semibold">Collateral</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {collateralFields.map((item, index) => (
                        <div
                          key={item.id}
                          className="space-y-2 border p-4 mb-4"
                        >
                          <FormField
                            control={control}
                            name={`collateral.${index}.ownerName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel> Name</FormLabel>
                                <FormControl>
                                  <Input type="text" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={control}
                            name={`collateral.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <FormControl>
                                  <Input type="text" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name={`collateral.${index}.ownerContact`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input type="text" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name={`collateral.${index}.estimatedValue`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>EstimatedValue</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => removeGuarantor(index)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Remove NEXTOFKIN
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() =>
                          appendCollateral({
                            description: "",
                            ownerName: "",
                            type: "",
                            ownerContact: "",
                            estimatedValue: 0,
                            loanApplicationId: 0,
                            id: 0,
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Collateral
                      </Button>
                    </div>
                  </div>{" "}
                </TabsContent>
              </Tabs>
              <Button type="submit">Apply Loan</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default LoanApplicationForm;
