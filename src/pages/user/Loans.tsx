import React, { useState, useEffect } from 'react';
import UserDashboardLayout from './layout/UserDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp
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

const Loans = () => {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [kpis, setKpis] = useState<LoanApplicationStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
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
  const emailquery = getUserInfo()?.email.replace('@', '%');

  console.log({emailquery});
  // Fetch KPIs and loan applications
  const fetchData = async (pageNum: number = 0) => {
    const userInfo = getUserInfo();
    if (!userInfo) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch both KPIs and loan applications in parallel
      const [kpiResponse, applicationsResponse] = await Promise.allSettled([
        apiClient.get<LoanApplicationStatusSummary>(`/api/v1/loan-applications/status-summary/${userInfo.userId}`),
        apiClient.get<PageableResponse<LoanApplication>>(
          `/api/v1/loan-applications/get-all?page=${pageNum}&size=${pageSize}&sort=createDate,DESC&q=${userInfo.email.replace('@', '%')}`
        )
      ]);

      if (kpiResponse.status === 'fulfilled') {
        setKpis(kpiResponse.value.data);
      }

      if (applicationsResponse.status === 'fulfilled') {
        const data = applicationsResponse.value.data;
        setApplications(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching loan data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(0);
  }, []);

  const handlePreviousPage = () => {
    if (page > 0) {
      fetchData(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) {
      fetchData(page + 1);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'approved') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
    } else if (statusLower === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    } else if (statusLower === 'rejected') {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
    } else if (statusLower === 'underreview' || statusLower === 'under_review') {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Under Review</Badge>;
    } else if (statusLower === 'disbursed') {
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Disbursed</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <UserDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              My Loan Applications
            </h1>
            <p className="text-muted-foreground mt-1">
              View all your loan applications and their status
            </p>
          </div>
          <Link to="/user/loan-application">
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              New Application
            </Button>
          </Link>
        </div>

        {/* KPIs */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-600">{kpis.pending}</div>
                  <p className="text-xs text-muted-foreground mt-1">Pending</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{kpis.underReview}</div>
                  <p className="text-xs text-muted-foreground mt-1">Under Review</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{kpis.approved}</div>
                  <p className="text-xs text-muted-foreground mt-1">Approved</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">{kpis.rejected}</div>
                  <p className="text-xs text-muted-foreground mt-1">Rejected</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">{kpis.disbursed}</div>
                  <p className="text-xs text-muted-foreground mt-1">Disbursed</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>All Applications ({totalElements})</span>
              {!loading && totalElements > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading applications...</span>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Loan Applications Found</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't submitted any loan applications yet.
                </p>
                <Link to="/user/loan-application">
                  <Button>Apply for a Loan</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Application Code</TableHead>
                        <TableHead>Product Code</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Term (Days)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied Date</TableHead>
                        <TableHead>Approval Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.loanApplicationId}>
                          <TableCell className="font-medium">
                            {app.loanApplicationCode}
                          </TableCell>
                          <TableCell>{app.loanProductCode}</TableCell>
                          <TableCell>KES {app.amount.toLocaleString()}</TableCell>
                          <TableCell>{app.termDays}</TableCell>
                          <TableCell>{getStatusBadge(app.status)}</TableCell>
                          <TableCell>{formatDate(app.createDate)}</TableCell>
                          <TableCell>{formatDate(app.approvalDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} applications
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={page === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={page >= totalPages - 1}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </UserDashboardLayout>
  );
};

export default Loans;
