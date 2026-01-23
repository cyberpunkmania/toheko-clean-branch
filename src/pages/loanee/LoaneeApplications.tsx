import React, { useState, useEffect } from 'react';
import LoaneeDashboardLayout from './layout/LoaneeDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/data-table';
import { 
  FileText, 
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '@/services/api';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface JwtPayload {
  sub: string;
  userId: number;
  role: string;
}

interface LoanApplication {
  loanApplicationId: number;
  loanApplicationCode: string;
  loanProductCode: string;
  memberId: number;
  lastName: string;
  email: string;
  mobileNumber: string;
  amount: number;
  termDays: number;
  status: string;
  createDate: string;
  approvalDate: string | null;
  adminComments: string | null;
}

interface PageableResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
}

interface LoanApplicationStatusSummary {
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  disbursed: number;
}

const LoaneeApplications = () => {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [kpis, setKpis] = useState<LoanApplicationStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 10;

  // Get user info from JWT token
  const getUserInfo = (): { userId: number; email: string } | null => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return {
        userId: decoded.userId,
        email: decoded.sub
      };
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  };

  // Fetch KPIs and loan applications
  const fetchData = async () => {
    const userInfo = getUserInfo();
    if (!userInfo) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First, fetch the first page to get total pages
      const firstPageResponse = await apiClient.get<PageableResponse<LoanApplication>>(
        `/api/v1/loan-applications/get-all?page=0&size=${pageSize}&sort=createDate,DESC&q=${userInfo.email.toUpperCase().replace('@', '%')}`
      );
      
      let allApplications: LoanApplication[] = firstPageResponse.data.content;
      const totalPagesFromResponse = firstPageResponse.data.totalPages;
      
      // Fetch all remaining pages
      if (totalPagesFromResponse > 1) {
        const additionalPageRequests: Promise<{ data: PageableResponse<LoanApplication> }>[] = [];

        for (let p = 1; p < totalPagesFromResponse; p++) {
          additionalPageRequests.push(
            apiClient.get<PageableResponse<LoanApplication>>(
              `/api/v1/loan-applications/get-all?page=${p}&size=${pageSize}&sort=createDate,DESC&q=${userInfo.email.toUpperCase().replace('@', '%')}`
            )
          );
        }

        try {
          const additionalResponses = await Promise.all(additionalPageRequests);
          additionalResponses.forEach(response => {
            allApplications = allApplications.concat(response.data.content);
          });
        } catch (aggregationError) {
          console.error('Error fetching all applications:', aggregationError);
        }
      }
      
      // Try to fetch KPIs, but don't fail if it errors
      try {
        const kpisResponse = await apiClient.get<LoanApplicationStatusSummary>(
          `/api/v1/loan-applications/kpis?email=${userInfo.email.toUpperCase().replace('@', '%')}`
        );
        setKpis(kpisResponse.data);
      } catch (kpiError) {
        //console.log('KPIs endpoint not available, calculating from applications');
        setKpis({
          pending: allApplications.filter(a => a.status?.toUpperCase() === 'PENDING').length,
          underReview: allApplications.filter(a => a.status?.toUpperCase() === 'UNDER_REVIEW').length,
          approved: allApplications.filter(a => a.status?.toUpperCase() === 'APPROVED').length,
          rejected: allApplications.filter(a => a.status?.toUpperCase() === 'REJECTED').length,
          disbursed: allApplications.filter(a => a.status?.toUpperCase() === 'DISBURSED').length,
        });
      }
      
      setApplications(allApplications);
      setTotalPages(totalPagesFromResponse);
      setTotalElements(allApplications.length);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700"><AlertCircle className="w-3 h-3 mr-1" />Under Review</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'DISBURSED':
        return <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700"><CreditCard className="w-3 h-3 mr-1" />Disbursed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  // Define columns for DataTable
  const columns: Column<LoanApplication>[] = [
    {
      header: 'Application ID',
      accessorKey: 'loanApplicationCode',
      sortable: true,
      cell: (row) => (
        <span className="font-medium">{row.loanApplicationCode}</span>
      ),
    },
    {
      header: 'Product',
      accessorKey: 'loanProductCode',
      sortable: true,
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (row) => (
        <span>KES {row.amount?.toLocaleString()}</span>
      ),
    },
    {
      header: 'Term',
      accessorKey: 'termDays',
      sortable: true,
      cell: (row) => (
        <span>{row.termDays} days</span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Date',
      accessorKey: 'createDate',
      sortable: true,
      cell: (row) => formatDate(row.createDate),
    },
  ];

  if (loading && applications.length === 0) {
    return (
      <LoaneeDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading applications...</span>
        </div>
      </LoaneeDashboardLayout>
    );
  }

  return (
    <LoaneeDashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">My Applications</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              View and track all your loan applications
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => fetchData()}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/loanee/loan-application">
              <Button size="sm">
                <CreditCard className="mr-2 h-4 w-4" />
                New Application
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-xl font-bold text-yellow-600">{kpis.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Under Review</p>
                    <p className="text-xl font-bold text-blue-600">{kpis.underReview}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-600/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Approved</p>
                    <p className="text-xl font-bold text-green-600">{kpis.approved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Rejected</p>
                    <p className="text-xl font-bold text-red-600">{kpis.rejected}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Disbursed</p>
                    <p className="text-xl font-bold text-purple-600">{kpis.disbursed}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-purple-600/20" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Applications Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Loan Applications
              <span className="text-sm font-normal text-muted-foreground">
                ({totalElements} total)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 && !loading ? (
              <div className="text-center py-10">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No applications yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You haven't submitted any loan applications.
                </p>
                <Link to="/loanee/loan-application">
                  <Button className="mt-4">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Apply for a Loan
                  </Button>
                </Link>
              </div>
            ) : (
              <DataTable
                data={applications}
                columns={columns}
                keyField="loanApplicationId"
                loading={loading}
                searchable={true}
                pagination={true}
                pageSize={pageSize}
                emptyMessage="No applications found"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </LoaneeDashboardLayout>
  );
};

export default LoaneeApplications;
