import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roleService } from "@/services/roleService";
import { Role, RoleDTO } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import DashboardLayout from "./DashboardLayout";
import { Loader2, Pencil, Trash2 } from "lucide-react";

// Schema for validation
const roleSchema = z.object({
  roleName: z.string().min(2, "Name must be at least 2 characters"),
  roleDescription: z.string().min(5, "Description must be at least 5 characters"),
  roleStatus: z.string(),
});

const Roles = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRoleCode, setDeletingRoleCode] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<RoleDTO>({
    roleName: "",
    roleDescription: "",
    roleStatus: "ACTIVE",
  });

  const queryClient = useQueryClient();

  // Fetch all roles
  const { data: roles = [], isLoading, isError, error } = useQuery({
    queryKey: ["roles"],
    queryFn: roleService.getAllRoles,
    retry: 3,
    staleTime: 60000, // 1 minute
  });

  // Log roles data for debugging
  useEffect(() => {
    //console.log("Roles data:", roles);
  }, [roles]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: roleService.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setIsDialogOpen(false);
      toast.success("Role added successfully");
      resetForm();
    },
    onError: (error) => {
      console.error("Error creating role:", error);
      toast.error("Failed to add role");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ roleCode, data }: { roleCode: number; data: RoleDTO }) =>
      roleService.updateRole(roleCode, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setIsDialogOpen(false);
      toast.success("Role updated successfully");
      resetForm();
    },
    onError: (error) => {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (roleCode: number) => roleService.deleteRole(roleCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setIsDeleteDialogOpen(false);
      toast.success("Role deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting role:", error);
      toast.error("Failed to delete role");
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user changes input
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const handleStatusChange = (value: string) => {
    setFormData({ ...formData, roleStatus: value });

    // Clear error
    if (formErrors.roleStatus) {
      setFormErrors({ ...formErrors, roleStatus: "" });
    }
  };

  const validateForm = () => {
    try {
      roleSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path[0].toString();
          errors[field] = err.message;
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (editingRole) {
      updateMutation.mutate({ roleCode: editingRole.roleCode, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      roleName: role.roleName,
      roleDescription: role.roleDescription,
      roleStatus: role.roleStatus,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (roleCode: number) => {
    setDeletingRoleCode(roleCode);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingRoleCode !== null) {
      deleteMutation.mutate(deletingRoleCode);
    }
  };

  const resetForm = () => {
    setFormData({
      roleName: "",
      roleDescription: "",
      roleStatus: "ACTIVE",
    });
    setFormErrors({});
    setEditingRole(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Define columns for the DataTable
  const columns: Column<Role>[] = [
    {
      header: "Code",
      accessorKey: "roleCode",
      sortable: true,
    },
    {
      header: "Name",
      accessorKey: "roleName",
      sortable: true,
    },
    {
      header: "Description",
      accessorKey: "roleDescription",
      sortable: true,
    },
    {
      header: "Status",
      accessorKey: "roleStatus",
      sortable: true,
      cell: (role) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            role.roleStatus === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {role.roleStatus}
        </span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "roleCode",
      cell: (role) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(role);
            }}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(role.roleCode);
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Role Management</h1>
          <Button onClick={openAddDialog} className="w-full sm:w-auto">Add Role</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading role data...</span>
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-red-500">
            Error loading roles: {(error as Error)?.message || "Unknown error"}
          </div>
        ) : (
          <DataTable
            data={Array.isArray(roles) ? roles : []}
            columns={columns}
            keyField="roleCode"
            pagination={true}
            searchable={true}
            pageSize={10}
            pageSizeOptions={[5, 10, 25, 50]}
            emptyMessage="No roles found"
            loading={isLoading}
            onRowClick={handleEdit}
          />
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRole ? "Edit Role" : "Add Role"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="roleName">Name</Label>
                <Input
                  id="roleName"
                  name="roleName"
                  value={formData.roleName}
                  onChange={handleInputChange}
                  className={formErrors.roleName ? "border-red-500" : ""}
                />
                {formErrors.roleName && (
                  <p className="text-sm text-red-500">{formErrors.roleName}</p>
                )}
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="roleDescription">Description</Label>
                <Input
                  id="roleDescription"
                  name="roleDescription"
                  value={formData.roleDescription}
                  onChange={handleInputChange}
                  className={formErrors.roleDescription ? "border-red-500" : ""}
                />
                {formErrors.roleDescription && (
                  <p className="text-sm text-red-500">
                    {formErrors.roleDescription}
                  </p>
                )}
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="roleStatus">Status</Label>
                <Select
                  value={formData.roleStatus}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger
                    className={formErrors.roleStatus ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.roleStatus && (
                  <p className="text-sm text-red-500">{formErrors.roleStatus}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingRole ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  editingRole ? "Update" : "Add"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p>
              Are you sure you want to delete this role? This action cannot be
              undone.
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Roles;
