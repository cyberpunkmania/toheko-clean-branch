/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form
} from "@/components/ui/form";
import { User, Users, Shield, FileText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BasicInfoTab from "./BasicInfoTab";
import CollateralTab from "./CollateralTab";
import GuarantorsTab from "./GurantorsTab";
import NextOfKinTab from "./NextOfKinTab";
import FormFooter from "./FormFooter";
import { useQuery } from "@tanstack/react-query";
import { loanService } from "@/services/loanService";
import { memberService } from "@/services/memberService";
import { toast } from "@/hooks/use-toast";
import { LoanApplication } from "@/types/api";

interface LoanApplicationFormProps {
  showForm: boolean;
  setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
  editLoan?: LoanApplication | null;
  editMode?: 'basic' | 'guarantors' | 'nextOfKin' | 'collateral';
}

type EditMode = 'basic' | 'guarantors' | 'nextOfKin' | 'collateral';

// Define the schema using Zod
const loanApplicationSchema = z.object({
  id: z.number().optional(),
  loanProductId: z.number().min(1, "Loan Product ID is required"),
  applicantIdNo: z.string().min(1, "Applicant ID No is required"),
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
      guaranteedAmount: z.number().min(1, "Guaranteed amount must be greater than 0"),
    })
  ).optional().default([]),

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
  ).optional().default([]),

  collateral: z.array(
    z.object({
      id: z.number().optional(),
      loanApplicationId: z.number().optional(),
      type: z.string().min(1, "Type is required"),
      description: z.string().min(1, "Description is required"),
      estimatedValue: z.number().min(1, "Estimated value must be greater than 0"),
      ownerName: z.string().min(1, "Owner name is required"),
      ownerContact: z.string().min(1, "Owner contact is required"),

    })
  ).optional().default([]),

});

type LoanApplicationFormValues = z.infer<typeof loanApplicationSchema>;

const LoanApplicationForm: React.FC<LoanApplicationFormProps> = ({ showForm, setShowForm, editLoan }) => {
  const [currentTab, setCurrentTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSection, setIsLoadingSection] = useState(false);
  //console.log("LoanApplicationForm rendered with editLoan:", editLoan);
  // Add state for each section's data
  const [loadedSections, setLoadedSections] = useState({
    guarantors: false,
    nextOfKin: false,
    collateral: false
  });

  useEffect(() => {
    if (!editLoan) return;

    const fetchSectionData = async () => {
      try {
        setIsLoadingSection(true);

        switch (currentTab) {
          case 'guarantors':
            if (!loadedSections.guarantors) {
              const guarantors = await loanService.getLoanGuarantors(editLoan.loanApplicationId);
              //console.log("Fetched guarantors:", guarantors);
              form.setValue('guarantors', guarantors);
              setLoadedSections(prev => ({ ...prev, guarantors: true }));
            }
            break;

          case 'nextOfKin':
            if (!loadedSections.nextOfKin) {
              const nextOfKin = await loanService.getLoanNextOfKinByLoanId(editLoan.loanApplicationId);
              form.setValue('nextOfKin', nextOfKin);
              setLoadedSections(prev => ({ ...prev, nextOfKin: true }));
            }
            break;

          case 'collateral':
            if (!loadedSections.collateral) {
              const collateral = await loanService.getLoanCollateralByLoanId(editLoan.loanApplicationId);
              form.setValue('collateral', collateral);
              setLoadedSections(prev => ({ ...prev, collateral: true }));
            }
            break;
        }
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to load ${currentTab} data`,
          variant: "destructive",
        });
      } finally {
        setIsLoadingSection(false);
      }
    };

    if (currentTab !== 'basic') {
      fetchSectionData();
    }
  }, [currentTab, editLoan]);

  useEffect(() => {
    // When we get a new editLoan, reset to basic tab and clear loaded sections
    if (editLoan) {
      setCurrentTab("basic");
      setLoadedSections({
        guarantors: false,
        nextOfKin: false,
        collateral: false
      });
    }
  }, [editLoan]);

  // Fetch loan products and members from API
  const { data: loanProducts, isLoading: isLoadingLoanProducts } = useQuery({
    queryKey: ["loan-products"],
    queryFn: loanService.getAllLoanTypes,
  });

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["members"],
    queryFn: memberService.getAllMembers,
  });

  const form = useForm<LoanApplicationFormValues>({
    resolver: zodResolver(loanApplicationSchema),

    defaultValues: {
      loanProductId: editLoan?.loanProductId || 0,
      applicantIdNo: editLoan?.applicantIdNo ? String(editLoan.applicantIdNo) : "",
      memberId: editLoan?.memberId || 0,
      name: editLoan?.name || "",
      amount: editLoan?.amount || 0,
      termDays: editLoan?.termDays || 0,
      guarantors: editLoan?.guarantors || [],
      nextOfKin: editLoan?.nextOfKin || [],
      collateral: editLoan?.collateral || [],
    },
  });

  useEffect(() => {
    if (editLoan) {
      form.reset({
        loanProductId: editLoan.loanProductId,
        applicantIdNo: editLoan.applicantIdNo ? String(editLoan.applicantIdNo) : "",
        memberId: editLoan.memberId,
        name: editLoan.name,
        amount: editLoan.amount,
        termDays: editLoan.termDays,
        guarantors: editLoan.guarantors || [],
        nextOfKin: editLoan.nextOfKin || [],
        collateral: editLoan.collateral || [],
      });
    } else {
      // Reset to empty form when creating new loan
      form.reset({
        loanProductId: 0,
        applicantIdNo: "",
        memberId: 0,
        name: "",
        amount: 0,
        termDays: 0,
        guarantors: [],
        nextOfKin: [],
        collateral: [],
      });
    }
  }, [editLoan, form]);

  const { control, handleSubmit, formState: { errors }, watch } = form;

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
    formState: { errors: guarantorErrors }
  } = useForm();

  const {
    fields: collateralFields,
    append: appendCollateral,
    remove: removeCollateral,
  } = useFieldArray({
    control,
    name: "collateral",
  });

  const watchedAmount = watch("amount");
  const watchedTermDays = watch("termDays");


  const onSubmit = async (data: LoanApplicationFormValues) => {
    setIsSubmitting(true);
    try {
      if (!editLoan) {
        // Create new loan (submit all data)
        await loanService.createLoanApplication(data);
        toast({
          title: "Success",
          description: "Loan application submitted successfully!",
          variant: "default",
        });
      } else {
        // Update only the current tab's data
        switch (currentTab) {
          case 'basic':
            await loanService.updateLoanApplication({
              loanApplicationId: editLoan.loanApplicationId,
              loanProductId: data.loanProductId,
              applicantIdNo: data.applicantIdNo,
              memberId: data.memberId,
              name: data.name,
              amount: data.amount,
              termDays: data.termDays,
              guarantors: [],
              nextOfKin: [],
              collateral: [],
              mobileNumber: ''
            });
            break;

          case 'guarantors':
            await loanService.updateLoanGuarantors(
              editLoan.loanApplicationId,
              data.guarantors || []
            );
            break;

          case 'nextOfKin':
            await loanService.updateLoanNextOfKin(
              editLoan.loanApplicationId,
              data.nextOfKin || []
            );
            break;

          case 'collateral':
            await loanService.updateLoanCollateral(
              editLoan.loanApplicationId,
              data.collateral || []
            );
            break;
        }

        toast({
          title: "Success",
          description: `${currentTab} updated successfully!`,
          variant: "default",
        });
      }
      setShowForm(false);
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: `Failed to update ${currentTab}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "basic": return <FileText className="w-4 h-4" />;
      case "guarantors": return <Users className="w-4 h-4" />;
      case "nextOfKin": return <User className="w-4 h-4" />;
      case "collateral": return <Shield className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleDialogClose = () => {
    setShowForm(false);
    // Reset all states when closing
    setCurrentTab("basic");
    setLoadedSections({
      guarantors: false,
      nextOfKin: false,
      collateral: false
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  // Compute the selected loan product based on the selected loanProductId
  // const selectedLoanProduct = Array.isArray(loanProducts)
  //   ? loanProducts.find((lp: any) => lp.id === form.watch("loanProductId"))
  //   : undefined;
  const selectedLoanProductId = useWatch({ control, name: "loanProductId" });
  const selectedLoanProduct = loanProducts?.find(lp => lp.id === selectedLoanProductId);
  //console.log("Selected loan product:", selectedLoanProduct);


  useEffect(() => {
    setCurrentTab("basic");
  }, [selectedLoanProductId]);


  return (
    <div className="from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="container mx-auto max-w-6xl">
        <Dialog open={showForm} onOpenChange={(open) => {
          if (!open) {
            handleDialogClose();
          } else {
            setShowForm(true);
          }
        }}>
          {/* <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden"> */}
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300">

            <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-400 text-white -mx-6 -mt-6 px-6 py-4">
              <DialogTitle className="text-xl flex items-center gap-2">
                {/* New Loan Application */}
                {editLoan ? "Edit Loan Application" : "New Loan Application"}

              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={async (e) => {
                  //console.log("Form submit event fired"); // Debug 5
                  e.preventDefault(); // Prevent default browser behavior

                  // Get current form state before validation
                  const formData = form.getValues();
                  //console.log("Current form data:", formData);

                  // Trigger validation and get the result
                  const isValid = await form.trigger();
                  //console.log("Form validation result:", isValid);

                  // Get form errors after validation
                  const formErrors = form.formState.errors;
                  //console.log("Form errors:", formErrors);

                  if (!isValid) {
                    //console.log("❌ FORM IS INVALID - Detailed breakdown:");

                    // Log invalid fields with their error messages
                    Object.keys(formErrors).forEach((fieldName) => {
                      const error = formErrors[fieldName];
                      //console.log(`🔴 Invalid field: ${fieldName}`);

                      if (error?.message) {
                        //console.log(`   Error message: ${error.message}`);
                      }

                      if (error?.type) {
                        //console.log(`   Error type: ${error.type}`);
                      }

                      // For nested fields (arrays), log specific array item errors
                      if (Array.isArray(error)) {
                        error.forEach((item, index) => {
                          if (item) {
                            //console.log(`   Array item ${index} errors:`, item);
                          }
                        });
                      }

                      // For object errors, log nested field errors
                      if (typeof error === 'object' && error !== null && !Array.isArray(error) && !error.message) {
                        Object.keys(error).forEach((nestedField) => {
                          //console.log(`   Nested field ${nestedField}:`, error[nestedField]);
                        });
                      }
                    });

                    // Also log which required fields are missing values
                    //console.log("📋 CHECKING REQUIRED FIELDS:");
                    const requiredFields = [
                      'loanProductId',
                      'applicantIdNo',
                      'memberId',
                      'name',
                      'amount',
                      'termDays'
                    ];

                    requiredFields.forEach(field => {
                      const value = formData[field];
                      const hasError = formErrors[field];

                      //console.log(`${hasError ? '❌' : '✅'} ${field}: ${value} ${hasError ? `(Error: ${formErrors[field]?.message})` : ''}`);
                    });

                    // Check array fields
                    ['guarantors', 'nextOfKin', 'collateral'].forEach(arrayField => {
                      const arrayValue = formData[arrayField];
                      const arrayError = formErrors[arrayField];

                      //console.log(`📚 ${arrayField}: ${Array.isArray(arrayValue) ? arrayValue.length : 0} items`);

                      if (arrayError) {
                        //console.log(`   ${arrayField} errors:`, arrayError);
                      }

                      // Log individual array item validation
                      if (Array.isArray(arrayValue)) {
                        arrayValue.forEach((item, index) => {
                          //console.log(`   Item ${index}:`, item);
                        });
                      }
                    });

                    return; // Don't proceed with submission
                  }

                  //console.log("✅ Form is valid - proceeding with submission");
                  await onSubmit(formData);
                }}
                className="space-y-6">
                <Tabs
                  value={currentTab}
                  onValueChange={handleTabChange}
                  className="w-full"
                >
                  {/* <TabsList className="grid grid-cols-4 gap-2 bg-gray-100 p-1 rounded-lg">
                    {[
                      { value: "basic", label: "Basic Info", icon: "FileText" },
                      { value: "guarantors", label: "Guarantors", icon: "Users" },
                      { value: "nextOfKin", label: "Next of Kin", icon: "User" },
                      { value: "collateral", label: "Collateral", icon: "Shield" }
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        <span className="hidden sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList> */}
                  <TabsList className="grid grid-cols-4 gap-2 bg-gray-100 p-1 rounded-lg">
                    {[
                      { value: "basic", label: "Basic Info", icon: "FileText" },
                      ...(selectedLoanProduct?.requiresGuarantor
                        ? [{ value: "guarantors", label: "Guarantors", icon: "Users" }]
                        : []),
                      ...(selectedLoanProduct?.requiresNextOfKin
                        ? [{ value: "nextOfKin", label: "Next of Kin", icon: "User" }]
                        : []),
                      ...(selectedLoanProduct?.requiresCollateral
                        ? [{ value: "collateral", label: "Collateral", icon: "Shield" }]
                        : []),
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        <span className="hidden sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <BasicInfoTab
                    control={form.control}
                    currentTab={currentTab}
                    watch={form.watch}
                    loanProducts={
                      Array.isArray(loanProducts)
                        ? loanProducts.map((lp: any) => ({
                          id: lp.id,
                          name: lp.name,
                          rate: lp.rate ?? ""
                        }))
                        : []
                    }
                    members={
                      (members || []).map((m: any) => ({
                        memberId: m.memberId,
                        firstName: m.firstName,
                        lastName: m.lastName,
                        idNo: m.idNo ?? ""
                      }))
                    }
                    isLoadingLoanProducts={isLoadingLoanProducts}
                    isLoadingMembers={isLoadingMembers}
                  />

                  {selectedLoanProduct?.requiresGuarantor && (
                    <GuarantorsTab
                      control={form.control}
                      currentTab={currentTab}
                      fields={guarantorFields}
                      append={appendGuarantor}
                      remove={removeGuarantor}
                      isLoading={isLoadingSection && currentTab === 'guarantors'}
                    />
                  )}

                  {selectedLoanProduct?.requiresNextOfKin && (
                    <NextOfKinTab
                      control={form.control}
                      currentTab={currentTab}
                      fields={nextOfKinFields}
                      append={appendNextOfKin}
                      remove={removeNextOfKin}
                    />
                  )}

                  {selectedLoanProduct?.requiresCollateral && (
                    <CollateralTab
                      control={form.control}
                      currentTab={currentTab}
                      fields={collateralFields}
                      append={appendCollateral}
                      remove={removeCollateral}
                    />
                  )}

                </Tabs>

                <FormFooter
                  currentTab={currentTab}
                  setCurrentTab={setCurrentTab}
                  isSubmitting={isSubmitting}
                  setShowForm={setShowForm}
                />
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LoanApplicationForm;