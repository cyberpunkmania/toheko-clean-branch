import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DashboardLayout from "@/pages/admin/DashboardLayout";
import { groupService } from "@/services/groupService";
import { Group, GroupRequest, GroupSuspensionRequest, GroupOfficial, PaginatedResponse, GroupOfficialRequest } from "@/types/api";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Edit, UserPlus, UserMinus, Loader2, UsersRound, Trash2, AlertTriangle, UserCheck, PlusCircle, MinusCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form schema for group details
const groupFormSchema = z.object({
  groupName: z.string().min(1, "Group name is required"),
  groupType: z.string().min(1, "Group type is required"),
  registrationNumber: z.string().min(1, "Registration number is required"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (value) => {
        const cleaned = value.replace(/\D/g, "");
        return cleaned.length === 10 || cleaned.length === 12;
      },
      {
        message: "Phone number must be 10 digits (07...) or 12 digits (254...)",
      }
    ),
  email: z.string().email("Please enter a valid email address"),
  physicalAddress: z.string().min(1, "Physical address is required"),
});

// Form schema for group officials
const officialFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (value) => {
        const cleaned = value.replace(/\D/g, "");
        return cleaned.length === 10 || cleaned.length === 12;
      },
      {
        message: "Phone number must be 10 digits (07...) or 12 digits (254...)",
      }
    ),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  role: z.string().min(1, "Role is required"),
  groupId: z.number({ required_error: "Group selection is required" }),
});

// Form schema for suspension
const suspensionFormSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  suspendedUntil: z.string().optional(),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;
type SuspensionFormValues = z.infer<typeof suspensionFormSchema>;
type OfficialFormValues = z.infer<typeof officialFormSchema>;

const Groups: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState("groups");
  
  // Groups state
  const [showDetails, setShowDetails] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  
  // Officials state
  const [showOfficialDetails, setShowOfficialDetails] = useState(false);
  const [showOfficialEditForm, setShowOfficialEditForm] = useState(false);
  const [showOfficialAddForm, setShowOfficialAddForm] = useState(false);
  const [showOfficialDeleteConfirm, setShowOfficialDeleteConfirm] = useState(false);
  const [selectedOfficial, setSelectedOfficial] = useState<GroupOfficial | null>(null);
  const [officialToDelete, setOfficialToDelete] = useState<GroupOfficial | null>(null);
  const [isOfficialAddLoading, setIsOfficialAddLoading] = useState(false);
  const [isOfficialEditLoading, setIsOfficialEditLoading] = useState(false);
  
  const { toast } = useToast();

  const groupForm = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      groupName: "",
      groupType: "",
      registrationNumber: "",
      phoneNumber: "",
      email: "",
      physicalAddress: "",
      // Officials removed from default values
    },
  });
  
  // Setup form for officials
  const officialForm = useForm<OfficialFormValues>({
    resolver: zodResolver(officialFormSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      email: "",
      role: "",
      groupId: undefined,
    },
  });
  
  // Handler for viewing officials tab and selecting a group
  const handleViewOfficials = (group: Group) => {
    setSelectedGroup(group);
    setActiveTab("officials");
  };
  
  // Handler for adding a new official
  const handleAddOfficial = () => {
    officialForm.reset({
      name: "",
      phoneNumber: "",
      email: "",
      role: "",
      groupId: selectedGroup?.groupId || undefined,
    });
    setShowOfficialAddForm(true);
  };
  
  // Handlers for officials moved to avoid duplication
  
  // Handler for confirming delete of an official
  const handleConfirmDeleteOfficial = (official: GroupOfficial) => {
    setOfficialToDelete(official);
    setShowOfficialDeleteConfirm(true);
  };

  // Define columns for the groups DataTable
  const groupColumns: Column<Group>[] = [
    { accessorKey: "groupId", header: "ID" },
    { accessorKey: "groupName", header: "Name" },
    { accessorKey: "groupCode", header: "Group Code" }, // Added Group Code
    // Type column removed as requested
    { accessorKey: "registrationNumber", header: "Reg No." },
    { accessorKey: "phoneNumber", header: "Phone" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "status",
      header: "Status",
      cell: (group: Group) => {
        if (!group) return null;
        let color = "bg-gray-100 text-gray-800";
        if (group.status === "ACTIVE") {
          color = "bg-green-100 text-green-800";
        } else if (group.status === "SUSPENDED") {
          color = "bg-red-100 text-red-800";
        } else if (group.status === "PENDING") {
          color = "bg-yellow-100 text-yellow-800";
        }
        return (
          <Badge variant="outline" className={`${color} rounded-full px-2 py-0.5`}>
            {group.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "groupId", // Used for key, actual rendering is custom
      header: "Actions",
      cell: (group: Group) => {
        if (!group) return null;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewDetails(group)}
              title="View Details"
              className="hover:bg-blue-100"
            >
              <UsersRound className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditGroup(group)}
              title="Edit Group"
              className="hover:bg-yellow-100"
            >
              <Edit className="h-4 w-4 text-yellow-600" />
            </Button>
            {group.status === "PENDING" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleApproveGroup(group.groupId)}
                title="Approve Group"
                className="text-green-600 hover:text-green-800 hover:bg-green-100"
              >
                <UserCheck className="h-4 w-4" />
              </Button>
            )}
            {group.status === "ACTIVE" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSuspendGroup(group)}
                title="Suspend Group"
                className="text-amber-600 hover:text-amber-800 hover:bg-amber-100"
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            )}
            {group.status === "SUSPENDED" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleUnsuspendGroup(group.groupId)}
                title="Unsuspend Group"
                className="text-sky-600 hover:text-sky-800 hover:bg-sky-100" // Using sky for a different color
              >
                <UserCheck className="h-4 w-4" /> {/* Or another icon like PlayCircle, RotateCcw */}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleConfirmDelete(group)}
              title="Delete Group"
              className="text-red-600 hover:text-red-800 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedGroup(group);
                officialForm.setValue("groupId", group.groupId);
                setShowOfficialAddForm(true);
              }}
            >
              Add Official
            </Button>
          </div>
        );
      },
    },
  ];

  const suspensionForm = useForm<SuspensionFormValues>({
    resolver: zodResolver(suspensionFormSchema),
    defaultValues: {
      reason: "",
      suspendedUntil: "",
    },
  });
  
  // Form submission handlers for official operations
  const onSubmitOfficialAdd = async (values: OfficialFormValues) => {
    if (!selectedGroup) return;
    
    setIsOfficialAddLoading(true);
    try {
      // Ensure all required fields are present for GroupOfficialRequest
      const officialData: GroupOfficialRequest = {
        name: values.name || "",
        phoneNumber: values.phoneNumber || "",
        email: values.email || "",
        role: values.role || "",
        groupId: selectedGroup.groupId
      };
      
      await groupService.createGroupOfficial(officialData);
      toast({
        title: "Success",
        description: "Official added successfully.",
        variant: "default",
      });
      refetchOfficials();
      setShowOfficialAddForm(false);
    } catch (error) {
      console.error("Failed to add official:", error);
      toast({
        title: "Error",
        description: "Failed to add official. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOfficialAddLoading(false);
    }
  };
  
  const onSubmitOfficialEdit = async (values: OfficialFormValues) => {
    if (!selectedOfficial) return;
    
    setIsOfficialEditLoading(true);
    try {
      // Ensure all required fields are present for GroupOfficialRequest
      const officialData: GroupOfficialRequest = {
        name: values.name || "",
        phoneNumber: values.phoneNumber || "",
        email: values.email || "",
        role: values.role || "",
        groupId: selectedOfficial.group?.groupId || 0
      };
      
      await groupService.updateGroupOfficial(selectedOfficial.id, officialData);
      toast({
        title: "Success",
        description: "Official updated successfully.",
        variant: "default",
      });
      refetchOfficials();
      setShowOfficialEditForm(false);
    } catch (error) {
      console.error("Failed to update official:", error);
      toast({
        title: "Error",
        description: "Failed to update official. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOfficialEditLoading(false);
    }
  };
  
  // Define the API query for groups data
  const { data: groups, isLoading, error, refetch } = useQuery<PaginatedResponse<Group>>({
    queryKey: ["groups"],
    queryFn: () => groupService.getAllGroups(),
    enabled: activeTab === "groups",
  });
  
  // Define the API query for officials data
  const { data: officials, isLoading: isOfficialsLoading, error: officialsError, refetch: refetchOfficials } = useQuery<PaginatedResponse<GroupOfficial>>({
    queryKey: ["officials", selectedGroup?.groupId],
    queryFn: () => selectedGroup 
      ? groupService.getGroupOfficials(selectedGroup.groupId) 
      : groupService.getAllGroupOfficials(),
    enabled: activeTab === "officials",
  });
  
  // Define columns for the officials DataTable
  const officialsColumns: Column<GroupOfficial>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "role", header: "Role" },
    { accessorKey: "phoneNumber", header: "Phone" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "id", // Used for key, actual rendering is custom
      header: "Actions",
      cell: (official: GroupOfficial) => {
        if (!official) return null;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewOfficialDetails(official)}
              title="View Details"
              className="hover:bg-blue-100"
            >
              <UsersRound className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditOfficial(official)}
              title="Edit Official"
              className="hover:bg-yellow-100"
            >
              <Edit className="h-4 w-4 text-yellow-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleConfirmDeleteOfficial(official)}
              title="Delete Official"
              className="text-red-600 hover:text-red-800 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleViewDetails = (group: Group) => {
    setSelectedGroup(group);
    setShowDetails(true);
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    groupForm.reset({
      groupName: group.groupName,
      groupType: group.groupType,
      registrationNumber: group.registrationNumber,
      phoneNumber: group.phoneNumber,
      email: group.email,
      physicalAddress: group.physicalAddress,
      // Officials are no longer part of the group form
    });
    setShowEditForm(true);
  };

  const handleAddGroup = () => {
    // Generate a unique registration number based on the latest group ID
    const latestGroupId = groups?.content?.length > 0 
      ? Math.max(...groups.content.map(group => group.groupId)) + 1 
      : 1;
    
    // Get current date components
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Generate a random 3-character alphanumeric string
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
    let randomString = '';
    for (let i = 0; i < 3; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Format: TOH-YYYYMMDD-ID-XXX where XXX is a random alphanumeric string
    const generatedRegNumber = `TOH-${year}${month}${day}-${String(latestGroupId).padStart(4, '0')}-${randomString}`;
    
    groupForm.reset({
      groupName: "",
      groupType: "",
      registrationNumber: generatedRegNumber, // Auto-generated registration number
      phoneNumber: "",
      email: "",
      physicalAddress: "",
    });
    setShowAddForm(true);
  };

  const handleSuspendGroup = (group: Group) => {
    setSelectedGroup(group);
    suspensionForm.reset({
      reason: "",
      suspendedUntil: "",
    });
    setShowSuspendForm(true);
  };

  const handleUnsuspendGroup = async (groupId: number) => {
    try {
      // Using approveGroup as a workaround since there's no unsuspend endpoint
      await groupService.approveGroup(groupId);
      toast({
        title: "Success",
        description: "Group has been unsuspended successfully.",
        variant: "default",
      });
      refetch();
    } catch (error) {
      console.error("Failed to unsuspend group:", error);
      toast({
        title: "Error",
        description: "Failed to unsuspend group. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = (group: Group) => {
    setGroupToDelete(group);
    setShowDeleteConfirm(true);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      await groupService.deleteGroup(groupToDelete.groupId);
      toast({
        title: "Success",
        description: `Group ${groupToDelete.groupName} has been deleted.`,
        variant: "default",
      });
      refetch();
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm(false);
      setGroupToDelete(null);
    }
  };

  const handleApproveGroup = async (groupId: number) => {
    try {
      await groupService.approveGroup(groupId);
      toast({
        title: "Success",
        description: "Group has been approved successfully.",
        variant: "default",
      });
      refetch();
    } catch (error) {
      console.error("Failed to approve group:", error);
      toast({
        title: "Error",
        description: "Failed to approve group. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add a direct event handler to debug form submission issues
  const handleUpdateClick = () => {
    //console.log('Update button was clicked directly');
    //console.log('Current form values:', groupForm.getValues());
    //console.log('Form state:', groupForm.formState);
    //console.log('Is form valid?', groupForm.formState.isValid);
    //console.log('Form errors:', groupForm.formState.errors);
  };

  const onSubmitEdit = async (values: GroupFormValues) => {
    //console.log('🔵 onSubmitEdit FUNCTION CALLED!');
    //console.log('📝 Form values received:', values);
    
    if (!selectedGroup) {
      console.error('❌ No selected group found!');
      return;
    }
    
    //console.log('✅ Selected group exists:', selectedGroup.groupId);
    setIsEditLoading(true);
    
    try {
      // Log all relevant context
      //console.log('💼 Current form state:', groupForm.formState);
      //console.log('📋 Full form values:', groupForm.getValues());
      
      // Ensure all required fields are present
      const groupData: GroupRequest = {
        groupName: values.groupName || "",
        // Preserve existing values for fields that are not in the edit form
        groupType: selectedGroup.groupType || "", 
        registrationNumber: selectedGroup.registrationNumber || "",
        phoneNumber: values.phoneNumber || "",
        email: values.email || "",
        physicalAddress: values.physicalAddress || ""
      };
      
      //console.log('⚙️ Preparing API call to update group:', selectedGroup.groupId);
      //console.log('📦 Update payload:', JSON.stringify(groupData));
      
      // Call the update service with a timeout to make sure we catch any issues
      const timeoutId = setTimeout(() => {
        //console.log('⚠️ Update operation taking longer than expected...');
      }, 3000);
      
      try {
        const updatedGroup = await groupService.updateGroup(selectedGroup.groupId, groupData);
        clearTimeout(timeoutId);
        //console.log('🎉 Update successful! Response:', updatedGroup);
        
        toast({
          title: "Success",
          description: "Group has been updated successfully.",
          variant: "default",
        });
        refetch();
        setShowEditForm(false);
      } catch (innerError) {
        clearTimeout(timeoutId);
        throw innerError; // Re-throw to be caught by outer catch
      }
      
    } catch (error) {
      console.error("❌ Failed to update group:", error);
      console.error("Error details:", JSON.stringify(error));
      
      toast({
        title: "Error",
        description: "Failed to update group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditLoading(false);
      //console.log('🏁 Update operation completed (success or failure)');
    }
  };

  // Removed duplicate handleUnsuspendGroup function

  const onSubmitAdd = async (values: GroupFormValues) => {
    setIsAddLoading(true);
    try {
      // Ensure all required fields are present
      const groupData: GroupRequest = {
        groupName: values.groupName || "",
        groupType: values.groupType || "",
        registrationNumber: values.registrationNumber || "",
        phoneNumber: values.phoneNumber || "",
        email: values.email || "",
        physicalAddress: values.physicalAddress || ""
        // Officials removed as they are no longer part of GroupRequest
      };
      
      await groupService.createGroup(groupData);
      toast({
        title: "Success",
        description: "Group has been added successfully.",
        variant: "default",
      });
      refetch();
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to add group:", error);
      toast({
        title: "Error",
        description: "Failed to add group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddLoading(false);
    }
  };

  const onSubmitSuspension = async (values: SuspensionFormValues) => {
    if (!selectedGroup) return;
    
    try {
      // Debug the values coming from the form
      //console.log('Suspension form values:', values);
      
      // Create a very simple payload with ONLY the reason field
      // According to the API docs, this is what the endpoint expects
      const suspensionData: GroupSuspensionRequest = {
        reason: values.reason
        // Removing suspendedUntil since it's not in the API docs for this endpoint
      };
      
      //console.log(`Attempting to suspend group ${selectedGroup.groupId} with reason: ${values.reason}`);
      
      // Call the service function
      await groupService.suspendGroup(selectedGroup.groupId, suspensionData);
      
      toast({
        title: "Success",
        description: "Group has been suspended successfully.",
        variant: "default",
      });
      refetch();
      setShowSuspendForm(false);
    } catch (error) {
      console.error("Failed to suspend group:", error);
      toast({
        title: "Error",
        description: "Failed to suspend group. Please try again.",
        variant: "destructive",
      });
    }
  };


  // DataTable columns
  const columns: Column<Group>[] = [
    {
      header: "Name",
      accessorKey: "groupName",
      cell: (group) => (
        <div className="font-medium">{group.groupName}</div>
      ),
    },
    {
      header: "Type",
      accessorKey: "groupType",
      cell: (group) => group.groupType,
    },
    {
      header: "Registration Number",
      accessorKey: "registrationNumber",
      cell: (group) => group.registrationNumber,
    },
    {
      header: "Contact",
      accessorKey: "phoneNumber",
      cell: (group) => (
        <div className="space-y-1">
          <div>{group.phoneNumber}</div>
          <div className="text-xs text-muted-foreground">{group.email}</div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (group) => {
        let color = "bg-gray-100 text-gray-800";
        if (group.status === "ACTIVE") {
          color = "bg-green-100 text-green-800";
        } else if (group.status === "SUSPENDED") {
          color = "bg-red-100 text-red-800";
        } else if (group.status === "PENDING") {
          color = "bg-yellow-100 text-yellow-800";
        }
        return (
          <Badge variant="outline" className={`${color} rounded-full px-2 py-0.5`}>
            {group.status}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "groupId", // Changed from id: "actions" to satisfy Column<Group> type
      cell: (group) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleViewDetails(group)}
            title="View Details"
          >
            <UsersRound className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditGroup(group)}
            title="Edit Group"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {group.status === "PENDING" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleApproveGroup(group.groupId)}
              title="Approve Group"
              className="text-green-600 hover:text-green-800 hover:bg-green-100"
            >
              <UserCheck className="h-4 w-4" />
            </Button>
          )}
          {group.status === "ACTIVE" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSuspendGroup(group)}
              title="Suspend Group"
              className="text-amber-600 hover:text-amber-800 hover:bg-amber-100"
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleConfirmDelete(group)}
            title="Delete Group"
            className="text-red-600 hover:text-red-800 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedGroup(group);
              officialForm.setValue("groupId", group.groupId);
              setShowOfficialAddForm(true);
            }}
          >
            Add Official
          </Button>
        </div>
      ),
    },
  ];

  // Group Officials handlers
  const handleViewOfficialDetails = (official: GroupOfficial) => {
    setSelectedOfficial(official);
    setShowOfficialDetails(true);
  };

  const handleEditOfficial = (official: GroupOfficial) => {
    setSelectedOfficial(official);
    
    officialForm.reset({
      name: official.name,
      phoneNumber: official.phoneNumber,
      email: official.email || "",
      role: official.role,
      groupId: official.group?.groupId,
    });
    
    setShowOfficialEditForm(true);
  };




  const handleDeleteOfficial = async () => {
    if (!officialToDelete?.id) return;

    try {
      await groupService.deleteGroupOfficial(officialToDelete.id);
      toast({
        title: "Success",
        description: `Official ${officialToDelete.name} has been deleted.`,
        variant: "default",
      });
      refetchOfficials();
    } catch (error) {
      console.error("Failed to delete official:", error);
      toast({
        title: "Error",
        description: "Failed to delete official. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowOfficialDeleteConfirm(false);
      setOfficialToDelete(null);
    }
  };

  const onSubmitEditOfficial = async (values: OfficialFormValues) => {
    if (!selectedOfficial?.id) return;
    
    setIsOfficialEditLoading(true);
    try {
      const officialData = {
        name: values.name,
        phoneNumber: values.phoneNumber,
        email: values.email,
        role: values.role,
        groupId: values.groupId
      };
      
      await groupService.updateGroupOfficial(selectedOfficial.id, officialData);
      toast({
        title: "Success",
        description: "Official has been updated successfully.",
        variant: "default",
      });
      refetchOfficials();
      setShowOfficialEditForm(false);
    } catch (error) {
      console.error("Failed to update official:", error);
      toast({
        title: "Error",
        description: "Failed to update official. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOfficialEditLoading(false);
    }
  };

  const onSubmitAddOfficial = async (values: OfficialFormValues) => {
    setIsOfficialAddLoading(true);
    try {
      const officialData = {
        name: values.name,
        phoneNumber: values.phoneNumber,
        email: values.email,
        role: values.role,
        groupId: values.groupId
      };
      
      await groupService.createGroupOfficial(officialData);
      toast({
        title: "Success",
        description: "Official has been added successfully.",
        variant: "default",
      });
      refetchOfficials();
      setShowOfficialAddForm(false);
    } catch (error) {
      console.error("Failed to add official:", error);
      toast({
        title: "Error",
        description: "Failed to add official. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOfficialAddLoading(false);
    }
  };
  
  // Using the officialsColumns defined earlier at line ~375
  
  if (error) {
    return (
      <Card className="mx-auto max-w-6xl">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load groups data.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>An error occurred while fetching the groups. Please try again later.</p>
          <Button className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-2 py-3 sm:px-4 sm:py-4 md:py-10">
        <Tabs defaultValue="groups" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 mb-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="groups" className="flex-1 sm:flex-none">Groups</TabsTrigger>
              <TabsTrigger value="officials" className="flex-1 sm:flex-none">Officials</TabsTrigger>
            </TabsList>

            {activeTab === "groups" ? (
              <Button onClick={handleAddGroup} className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Group
              </Button>
            ) : (
              <Button onClick={handleAddOfficial} className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Official
              </Button>
            )}
          </div>
          
          <TabsContent value="groups" className="mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Groups</CardTitle>
                <CardDescription>
                  Manage community groups in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={groupColumns}
                  data={groups?.content || []}
                  keyField="groupId"
                  isLoading={isLoading}
                  error={error ? "Failed to load groups" : null}
                  filterPlaceholder="Filter groups by name..."
                  filterColumn="groupName"
                  onAdd={() => {
                    setSelectedGroup(null);
                    groupForm.reset(); 
                    setShowAddForm(true);
                  }}
                  addLabel="Add New Group"
                />
              </CardContent>
            </Card>
          </TabsContent>
        
        <TabsContent value="officials" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Group Officials</CardTitle>
              <CardDescription>
                Manage officials for all community groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={officialsColumns}
                data={officials?.content || []}
                isLoading={isOfficialsLoading}
                // error={officialsError ? "Failed to load officials" : null} // Assuming you'll add officialsError state
                filterPlaceholder="Filter officials by name..."
                filterColumn="name"
                onAdd={handleAddOfficial}
                addLabel="Add New Official"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Group Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Group Details</DialogTitle>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Group Name</h3>
                  <p>{selectedGroup.groupName}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Group Type</h3>
                  <p>{selectedGroup.groupType}</p>
                </div>
              </div> {/* End of first grid */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Group Code</h3>
                <p>{selectedGroup.groupCode}</p>
              </div>
              <div className="grid grid-cols-2 gap-4"> {/* Start of second grid */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Registration Number</h3>
                  <p>{selectedGroup.registrationNumber}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Status</h3>
                  <Badge variant="outline" className={`
                    ${selectedGroup.status === "ACTIVE" ? "bg-green-100 text-green-800" : 
                      selectedGroup.status === "SUSPENDED" ? "bg-red-100 text-red-800" : 
                      "bg-yellow-100 text-yellow-800"} 
                    rounded-full px-2 py-0.5 mt-1`}
                  >
                    {selectedGroup.status}
                  </Badge>
                </div>
              </div> {/* End of second grid */}
                </div>
              )}
          </DialogContent>
        </Dialog>

        {/* Edit Group Form Dialog */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
              <DialogDescription>
                Update the group details.
              </DialogDescription>
            </DialogHeader>
            <Form {...groupForm}>
              <form onSubmit={(e) => {
                e.preventDefault();
                //console.log('🔔 Form submission event triggered');
                groupForm.handleSubmit(values => {
                  //console.log('📋 Form values being submitted:', values);
                  onSubmitEdit(values);
                })();
              }} className="space-y-4">
                {/* Same form fields as Add Group form */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={groupForm.control}
                    name="groupName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter group name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={groupForm.control}
                    name="groupType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Type</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Community, Business" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
</div>
<div className="grid grid-cols-2 gap-4">
<FormField
  control={groupForm.control}
  name="registrationNumber"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Registration Number</FormLabel>
      <FormControl>
        <Input {...field} placeholder="Enter registration number" readOnly />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
                  <FormField
                    control={groupForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 0712345678" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={groupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="group@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={groupForm.control}
                    name="physicalAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Physical Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter physical address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Officials section removed as they are now managed separately */}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isEditLoading}
                    onClick={(e) => {
                      e.preventDefault(); // Prevent default form submission
                      //console.log('Update button clicked directly');
                      handleUpdateClick();
                      // Manually trigger the form submission handler
                      groupForm.handleSubmit(onSubmitEdit)();
                    }}
                  >
                    {isEditLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Group"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Add Group Form Dialog */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Group</DialogTitle>
              <DialogDescription>
                Enter the details for the new group.
              </DialogDescription>
            </DialogHeader>
            <Form {...groupForm}>
              <form onSubmit={groupForm.handleSubmit(onSubmitAdd)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={groupForm.control}
                    name="groupName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter group name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={groupForm.control}
                    name="groupType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Type</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Community, Business" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={groupForm.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter registration number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={groupForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 0712345678" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={groupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="group@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={groupForm.control}
                    name="physicalAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Physical Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter physical address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isAddLoading}>
                    {isAddLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Group"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Group Officials Details Dialog */}
        <Dialog open={showOfficialDetails} onOpenChange={setShowOfficialDetails}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Official Details</DialogTitle>
            </DialogHeader>
            {selectedOfficial && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Name</h3>
                    <p>{selectedOfficial.name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Phone Number</h3>
                    <p>{selectedOfficial.phoneNumber}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Email</h3>
                    <p>{selectedOfficial.email || "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Role</h3>
                    <p>{selectedOfficial.role}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Group</h3>
                  <p>{selectedOfficial.group?.groupName || "N/A"}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Official Form Dialog */}
        <Dialog open={showOfficialAddForm} onOpenChange={setShowOfficialAddForm}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Official</DialogTitle>
              <DialogDescription>
                Enter the details of the new group official.
              </DialogDescription>
            </DialogHeader>
            <Form {...officialForm}>
              <form onSubmit={officialForm.handleSubmit(onSubmitAddOfficial)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={officialForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Official's name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={officialForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="e.g., 0712345678" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={officialForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" value={field.value || ""} placeholder="official@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={officialForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="e.g., Chairperson" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={officialForm.control}
                    name="groupId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group</FormLabel>
                        <FormControl>
                          <select
                            className="w-full p-2 border rounded"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          >
                            <option value="">Select a group</option>
                            {groups?.content?.map((group) => (
                              <option key={group.groupId} value={group.groupId}>
                                {group.groupName}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowOfficialAddForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isOfficialAddLoading}>
                    {isOfficialAddLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Official"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Official Form Dialog */}
        <Dialog open={showOfficialEditForm} onOpenChange={setShowOfficialEditForm}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Official</DialogTitle>
              <DialogDescription>
                Update the official details.
              </DialogDescription>
            </DialogHeader>
            <Form {...officialForm}>
              <form onSubmit={officialForm.handleSubmit(onSubmitOfficialEdit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={officialForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Official's name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={officialForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="e.g., 0712345678" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={officialForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" value={field.value || ""} placeholder="official@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={officialForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="e.g., Chairperson" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={officialForm.control}
                    name="groupId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group</FormLabel>
                        <FormControl>
                          <select
                            className="w-full p-2 border rounded"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          >
                            <option value="">Select a group</option>
                            {groups?.content?.map((group) => (
                              <option key={group.groupId} value={group.groupId}>
                                {group.groupName}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowOfficialEditForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isOfficialEditLoading}>
                    {isOfficialEditLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Official"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Official Confirmation Dialog */}
        <Dialog open={showOfficialDeleteConfirm} onOpenChange={setShowOfficialDeleteConfirm}>
          <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Are you sure you want to delete{" "}
                <span className="font-semibold">
                  {officialToDelete ? officialToDelete.name : ""}
                </span>
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOfficialDeleteConfirm(false);
                  setOfficialToDelete(null);
                }}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteOfficial}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Suspend Group Form Dialog */}
        <Dialog open={showSuspendForm} onOpenChange={setShowSuspendForm}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Suspend Group</DialogTitle>
              <DialogDescription>
                Provide a reason for suspending this group.
              </DialogDescription>
            </DialogHeader>
            <Form {...suspensionForm}>
              <form
                onSubmit={suspensionForm.handleSubmit(onSubmitSuspension)}
                className="space-y-4"
              >
                <FormField
                  control={suspensionForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Suspension</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter the reason for suspension"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={suspensionForm.control}
                  name="suspendedUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suspended Until (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowSuspendForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" type="submit">
                    Suspend Group
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Are you sure you want to delete{" "}
                <span className="font-semibold">
                  {groupToDelete ? groupToDelete.groupName : ""}
                </span>
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setGroupToDelete(null);
                }}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteGroup}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Groups;