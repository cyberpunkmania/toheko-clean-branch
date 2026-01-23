/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/pages/admin/DashboardLayout";
import { loanService } from "@/services/loanService";
import { LoanApplication, LoanProduct } from "@/types/api";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { memberService } from "@/services/memberService";
import { paymentTypeService } from "@/services/paymentTypeService";
import { Column, DataTable } from "@/components/ui/data-table";
import { Plus, FileText, Clock, CheckCircle, XCircle, AlertCircle, Loader2, TrendingUp, DollarSign } from "lucide-react";
import LoanApplicationForm from "./loans/LoanApplication";
import { useForm } from "react-hook-form";
import LoanDetailsModal from "./LoanDetailsModal";
import ReviewLoanModal from "./ReviewLoanModal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const Loans = () => {
  const [showForm, setShowForm] = useState(false);
  const [editLoan, setEditLoan] = useState<LoanApplication | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [decision, setDecision] = useState("APPROVE");

  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loanTypes, setLoanTypes] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(
    null
  );
  const [approveLoanId, setApproveLoanId] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  const approveForm = useForm({ defaultValues: { comments: "" } });
  const [loanStats, setLoanStats] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");

  // Filter form state
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [filterCreatedFrom, setFilterCreatedFrom] = useState("");
  const [filterCreatedTo, setFilterCreatedTo] = useState("");

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: memberService.getAllMembers,
  });
  const getMemberName = (memberId: number) => {
    const member = members?.find((m) => m.memberId === memberId);
    return member ? `${member.firstName} ${member.lastName}` : "Unknown Member";
  };

  const { data: paymenttypes } = useQuery({
    queryKey: ["payment-types"],
    queryFn: paymentTypeService.getAllPaymentTypes,
  });
  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = { page: page - 1, pageSize: pageSize, search };
        const [loansResponse, loanTypesData] = await Promise.all([
          loanService.getAllLoanApplications(params),
          loanService.getAllLoanTypes(),
        ]);
        const loansData = loansResponse.content || loansResponse.data?.content || [];
        setLoans(loansData);
        setLoanTypes(loanTypesData);
        if (loansResponse.totalPages) setTotalPages(loansResponse.totalPages);
        else if (loansResponse.data?.totalPages) setTotalPages(loansResponse.data.totalPages);
      } catch (error) {
        console.error("Error fetching loan data:", error);
        toast({
          title: "Error fetching loan data",
          description: "There was an error loading the loans information. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast, page, pageSize, search]);

  useEffect(() => {
    const fetchLoanStats = async () => {
      try {
        const stats = await loanService.getLoanDashboardSummary();
        setLoanStats(stats);
      } catch (error) {
      }
    };
    fetchLoanStats();
  }, []);

  const handleViewDetails = (loan: LoanApplication) => {
    setSelectedLoan(loan);
    setShowDetails(true);
  };

  const handleOpenReviewModal = (loanId: number) => {
    setApproveLoanId(loanId);
    setDecision("APPROVE");
    setShowApproveModal(true);
  };

  const handleReviewSubmit = async (data) => {
    if (!approveLoanId) return;
    try {
      await loanService.submitLoanApprovalDecision({
        applicationId: approveLoanId,
        decision: decision === "APPROVE" ? "APPROVE" : "REJECT",
        comments: data.comments,
        approverType: userRole,
        approverUserId: Number(userId),
      });
      toast({ title: `Loan ${decision === "APPROVE" ? "Approved" : "Rejected"}` });
      setShowApproveModal(false);
      setApproveLoanId(null);
      approveForm.reset();
      // Refresh loans
      const params = { page: page - 1, size: pageSize, search };
      const [loansResponse] = await Promise.all([
        loanService.getAllLoanApplications(params)
      ]);
      const loansData = loansResponse.content || loansResponse.data?.content || [];
      setLoans(loansData);
    } catch (error) {
      toast({ title: "Error", description: `Failed to ${decision.toLowerCase()} loan.`, variant: "destructive" });
    }
  };

  // Get userId and role from JWT token in localStorage
  const getTokenPayload = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Error decoding token:", e);
      return null;
    }
  };

  const tokenPayload = getTokenPayload();
  const userId = tokenPayload?.userId || localStorage.getItem("userId");
  const userRole = tokenPayload?.role || localStorage.getItem("role");
  
  // Debug: Log the role to check what value is stored
  // useEffect(() => {
    // //console.log("Token Payload:", tokenPayload);
    // //console.log("User Role from token:", userRole);
    // //console.log("Is ADMIN?", userRole === "ADMIN");
    // //console.log("Is LOAN_OFFICIAL?", userRole === "LOAN_OFFICIAL");
    // //console.log("Includes check result:", ["ADMIN", "LOAN_OFFICIAL"].includes(userRole));
  // }, [userRole]);

  const columns: Column<LoanApplication>[] = [
    {
      header: "ID",
      accessorKey: "loanApplicationId",
      sortable: true,
    },
    {
      header: "Member",
      accessorKey: "memberId",
      sortable: true,
      cell: (saving) => {
        const member = members?.find((m) => m.memberId === saving.memberId);
        return (
          <span className="font-medium">
            {member
              ? `${member.firstName} ${member.lastName}`
              : `Member #${saving.memberId}`}
          </span>
        );
      },
    },
    {
      header: "Phone Number",
      accessorKey: (loan: LoanApplication) => loan.mobileNumber,
      cell: (loan) => (
        <span className="font-medium">{loan?.mobileNumber}</span>
      ),
    },
    {
      header: "loanApplicationCode",
      accessorKey: "loanApplicationCode",
      sortable: true,
      cell: (loan) => (
        <span className="font-medium">{loan?.loanApplicationCode}</span>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      sortable: true,
      cell: (loan) => (
        <span className="font-medium">{loan?.amount}</span>
      ),
    },
    {
      header: "termDays",
      accessorKey: "termDays",
      sortable: true,
      cell: (loan) => <span>{loan?.termDays || "--"}</span>,
    },

    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (loan) => (
        <Badge variant={
          loan.status === "APPROVED" || loan.status === "DISBURSED" ? 'default' :
          loan.status === "PENDING" ? 'secondary' :
          loan.status === "UNDER_REVIEW" ? 'outline' : 'destructive'
        }>
          {loan.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      header: "Created Date",
      accessorKey: "createDate",
      sortable: true,
      cell: (loan) => (
        <span>{format(new Date(loan.createDate), "dd/MM/yyyy")}</span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "loanApplicationId",
      cell: (loan) => (
        <div className="flex gap-2">
          <Button
            className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded px-3 py-1 transition-all duration-150 shadow-none"
            size="sm"
            onClick={() => handleViewDetails(loan)}
            title="View Details"
          >
            View
          </Button>
          <Button
            className={`bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 rounded px-3 py-1 transition-all duration-150 shadow-none ${loan.status !== "PENDING" ? 'opacity-50 cursor-not-allowed' : ''}`}
            size="sm"
            onClick={() => {
              setEditLoan(loan);
              setShowForm(true);
            }}
            disabled={loan.status !== "PENDING"}
            title="Edit Loan"
          >
            Edit
          </Button>
          {(loan.status === "PENDING" || loan.status === "UNDER_REVIEW") &&
            ["ADMIN", "LOAN_OFFICIAL"].includes(userRole) && (
              <Button
                className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded px-3 py-1 transition-all duration-150 shadow-none"
                size="sm"
                onClick={() => handleOpenReviewModal(loan.loanApplicationId)}
                title="Review Loan"
              >
                Review
              </Button>
            )}
        </div>
      ),
    },
  ];

  const loantypescolumns: Column<LoanProduct>[] = [
    {
      header: "ID",
      accessorKey: "id",
      sortable: true,
    },

    {
      header: "Name",
      accessorKey: "name",
      sortable: true,
      cell: (loant) => <span className="font-medium">{loant?.name}</span>,
    },
    {
      header: "MinAmount",
      accessorKey: "minAmount",
      sortable: true,
      cell: (loant) => <span>{loant?.minAmount}</span>,
    },
    {
      header: "Maximum AMount",
      accessorKey: "maxAmount",
      sortable: true,
      cell: (loant) => <span>{loant.maxAmount}</span>,
    },
    {
      header: "InterestRate",
      accessorKey: "interestRate",
      sortable: true,
      cell: (loant) => <span>{loant?.interestRate}</span>,
    },
    {
      header: "Interest Method",
      accessorKey: "interestMethod",
      sortable: true,
      cell: (loant) => <span>{loant?.interestMethod}</span>,
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (loant) => (
        <div className="flex space-x-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
          // onClick={() => handleViewDetails(loan)}
          >
            View
          </Button>

          <Button
            variant="ghost"
            size="sm"
          // onClick={() => {
          //   setEditLoan(loan);
          //   setShowForm(true);
          // }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];
  // Fetch loan details by application ID
  const [loanDetails, setLoanDetails] = useState(null);
  const fetchLoanDetails = async (applicationId) => {
    try {
      const response = await loanService.getLoanApplicationById(applicationId);
      setLoanDetails(response);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch loan details.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (showDetails && selectedLoan) {
      fetchLoanDetails(selectedLoan.loanApplicationId);
    }
  }, [showDetails, selectedLoan]);

  // Filter handler
  const handleFilterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchLoading(true);
    try {
      const params: any = {
        page: page - 1,
        size: pageSize,
        minAmount: filterMinAmount || undefined,
        maxAmount: filterMaxAmount || undefined,
        createdFrom: filterCreatedFrom || undefined,
        createdTo: filterCreatedTo || undefined,
        search: filterSearch || undefined,
      };
      // Remove undefined params
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
      const loansResponse = await loanService.getAllLoanApplications(params);
      const loansData = loansResponse.content || loansResponse.data?.content || [];
      setLoans(loansData);
      if (loansResponse.totalPages) setTotalPages(loansResponse.totalPages);
      else if (loansResponse.data?.totalPages) setTotalPages(loansResponse.data.totalPages);
    } catch (error) {
      toast({ title: "Error", description: "Failed to filter loans.", variant: "destructive" });
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-2 py-3 sm:px-4 sm:py-4 md:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Loans Management</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              View and manage all loan applications and loan types
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            New Loan Application
          </Button>
        </div>

        <LoanApplicationForm showForm={showForm} setShowForm={setShowForm} editLoan={editLoan} />

        {/* KPI Section */}
        <Accordion type="single" collapsible defaultValue="kpis" className="w-full">
          <AccordionItem value="kpis">
            <AccordionTrigger className="text-lg font-semibold">
              Loan Application KPIs
            </AccordionTrigger>
            <AccordionContent>
              {!loanStats ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading KPIs...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Applications */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Total Applications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{loanStats.totalApplications || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        All loan applications
                      </p>
                    </CardContent>
                  </Card>

                  {/* Pending */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{loanStats.totalPending || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Awaiting review
                      </p>
                    </CardContent>
                  </Card>

                  {/* Approved */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Approved
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{loanStats.totalApproved || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        KES {Number(loanStats.totalAmountApproved || 0).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Disbursed */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Disbursed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{loanStats.totalDisbursed || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Successfully disbursed
                      </p>
                    </CardContent>
                  </Card>

                  {/* Under Review */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Under Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{loanStats.totalUnderReview || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Being reviewed
                      </p>
                    </CardContent>
                  </Card>

                  {/* Rejected */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Rejected
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{loanStats.totalRejected || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        KES {Number(loanStats.totalAmountRejected || 0).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Total Amount Applied */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Total Amount Applied
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">KES {Number(loanStats.totalAmountApplied || 0).toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Avg: KES {Number(loanStats.averageLoanAmount || 0).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Highest Loan */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Highest Loan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">KES {Number(loanStats.highestLoanAmount || 0).toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lowest: KES {Number(loanStats.lowestLoanAmount || 0).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Loan Applications Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Loan Applications</CardTitle>
            <CardDescription>Filter and manage loan applications</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6" onSubmit={handleFilterSubmit}>
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input id="search" type="text" value={filterSearch} onChange={e => setFilterSearch(e.target.value)} placeholder="Search loans..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minAmount">Min Amount</Label>
                <Input id="minAmount" type="number" value={filterMinAmount} onChange={e => setFilterMinAmount(e.target.value)} placeholder="0" min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Max Amount</Label>
                <Input id="maxAmount" type="number" value={filterMaxAmount} onChange={e => setFilterMaxAmount(e.target.value)} placeholder="0" min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="createdFrom">Created From</Label>
                <Input id="createdFrom" type="date" value={filterCreatedFrom} onChange={e => setFilterCreatedFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="createdTo">Created To</Label>
                <Input id="createdTo" type="date" value={filterCreatedTo} onChange={e => setFilterCreatedTo(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="secondary" disabled={searchLoading} className="w-full">
                  {searchLoading ? "Filtering..." : "Apply Filters"}
                </Button>
              </div>
            </form>
            <DataTable
              data={loans}
              columns={columns}
              keyField="loanApplicationId"
              pagination={false}
              searchable={false}
              pageSize={10}
              emptyMessage="No loans found"
              loading={searchLoading}
              onSearch={async (searchValue) => {
                setSearchLoading(true);
                const params = { page: 0, size: pageSize, search: searchValue };
                const [loansResponse] = await Promise.all([
                  loanService.getAllLoanApplications(params)
                ]);
                const loansData = loansResponse.content || loansResponse.data?.content || [];
                setLoans(loansData);
                if (loansResponse.totalPages) setTotalPages(loansResponse.totalPages);
                else if (loansResponse.data?.totalPages) setTotalPages(loansResponse.data.totalPages);
                setSearchLoading(false);
              }}
            />
            <div className="flex justify-between items-center mt-4">
              <div>
                <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <span className="mx-2">Page {page} of {totalPages}</span>
                <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
              <div>
                <label className="mr-2">Rows per page:</label>
                <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="border rounded px-2 py-1">
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>


        <LoanDetailsModal
          open={showDetails}
          onOpenChange={setShowDetails}
          loanDetails={loanDetails}
          getMemberName={getMemberName}
        />

        <ReviewLoanModal
          open={showApproveModal}
          onOpenChange={setShowApproveModal}
          approveForm={approveForm}
          handleReviewSubmit={handleReviewSubmit}
          decision={decision}
          setDecision={setDecision}
          disburseLoading={false}
        />

      </div>
    </DashboardLayout>
  );
};

export default Loans;
