import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import {
  UserPlus,
  Search,
  Loader2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  Shield,
  Clock,
  Mail,
} from "lucide-react";
import { usePagination } from "../../hooks/usePagination";

const API_BASE_URL = "http://localhost:8000";

interface SignupRequest {
  email: string;
  username: string;
  name: string;
  dob?: string;
  status: "pending" | "approved" | "rejected";
  email_verified?: boolean;
  created_at: string;
  verified_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { icon: any; text: string; bgColor: string; textColor: string }> = {
    pending: {
      icon: Clock,
      text: "Pending",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
    },
    approved: {
      icon: CheckCircle2,
      text: "Approved",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
    },
    rejected: {
      icon: X,
      text: "Rejected",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
    },
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${config.bgColor}`}>
      <Icon className={`w-3.5 h-3.5 ${config.textColor}`} />
      <span className={`text-xs font-medium ${config.textColor}`}>{config.text}</span>
    </div>
  );
};

export default function AdminSignupRequestsPage() {
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<string | null>(null);
  const [approveModal, setApproveModal] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [viewRequest, setViewRequest] = useState<SignupRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const pagination = usePagination({ initialPage: 1, initialLimit: 50 });

  useEffect(() => {
    fetchRequests();
  }, [pagination.page, searchTerm, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`${API_BASE_URL}/admin/signup-requests?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch signup requests");
      }

      const data = await response.json();
      // Filter by search term on client side if needed
      let filteredRequests = data.requests || [];
      if (searchTerm) {
        filteredRequests = filteredRequests.filter((req: SignupRequest) =>
          req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      setRequests(filteredRequests);
      pagination.setPaginationData({
        hasMore: data.has_more || false,
        total: data.total || 0,
      });
    } catch (err: any) {
      console.error("Error fetching signup requests:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = async (email: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/admin/signup-requests/${email}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch request details");
      }

      const requestData = await response.json();
      setViewRequest(requestData);
      setViewModal(email);
    } catch (err: any) {
      alert("Failed to fetch request details: " + err.message);
    }
  };

  const handleApprove = async () => {
    if (!approveModal) return;

    try {
      setApproving(true);
      setActionError(null);

      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/admin/signup-requests/${approveModal}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to approve request");
      }

      setApproveModal(null);
      fetchRequests();
    } catch (err: any) {
      setActionError(err.message || "Failed to approve request");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;

    try {
      setRejecting(true);
      setActionError(null);

      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/admin/signup-requests/${rejectModal}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectionReason || undefined }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to reject request");
      }

      setRejectModal(null);
      setRejectionReason("");
      fetchRequests();
    } catch (err: any) {
      setActionError(err.message || "Failed to reject request");
    } finally {
      setRejecting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-[var(--color-bg-primary)] custom-scrollbar">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
              Admin Signup Requests
            </h1>
            <p className="text-base text-[var(--color-text-secondary)]">
              Review and approve admin account signup requests
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
              />
            </div>
            <select
              value={statusFilter || ""}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="px-4 py-2.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[var(--color-accent-primary)] animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-1">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4" />
              <p className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                No signup requests found
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                All admin signup requests will appear here
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.email}
                    className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                            {request.name}
                          </h3>
                          <StatusBadge status={request.status} />
                          {request.email_verified && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              ✓ Email Verified
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                            <Mail className="w-4 h-4" />
                            <span>{request.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                            <UserPlus className="w-4 h-4" />
                            <span>@{request.username}</span>
                          </div>
                          {request.dob && (
                            <div className="text-xs text-[var(--color-text-tertiary)]">
                              DOB: {new Date(request.dob).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-[var(--color-text-tertiary)]">
                          Requested: {formatDate(request.created_at)}
                        </div>
                        {request.rejection_reason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <strong>Rejection Reason:</strong> {request.rejection_reason}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewRequest(request.email)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {request.status === "pending" && request.email_verified && (
                          <>
                            <button
                              onClick={() => {
                                setApproveModal(request.email);
                                setActionError(null);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setRejectModal(request.email);
                                setRejectionReason("");
                                setActionError(null);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} requests
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => pagination.prevPage()}
                      disabled={pagination.page === 1}
                      className="p-2 border border-[var(--color-border-primary)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-surface-secondary)]"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => pagination.nextPage()}
                      disabled={!pagination.hasMore}
                      className="p-2 border border-[var(--color-border-primary)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-surface-secondary)]"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Request Modal */}
      {viewModal && viewRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Signup Request Details
              </h3>
              <button
                onClick={() => {
                  setViewModal(null);
                  setViewRequest(null);
                }}
                className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Name
                  </label>
                  <p className="text-base text-[var(--color-text-primary)]">{viewRequest.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Username
                  </label>
                  <p className="text-base text-[var(--color-text-primary)]">@{viewRequest.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Email
                  </label>
                  <p className="text-base text-[var(--color-text-primary)]">{viewRequest.email}</p>
                </div>
                {viewRequest.dob && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      Date of Birth
                    </label>
                    <p className="text-base text-[var(--color-text-primary)]">
                      {new Date(viewRequest.dob).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Status
                  </label>
                  <StatusBadge status={viewRequest.status} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Email Verified
                  </label>
                  <p className="text-base text-[var(--color-text-primary)]">
                    {viewRequest.email_verified ? "✓ Yes" : "✗ No"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Requested At
                  </label>
                  <p className="text-base text-[var(--color-text-primary)]">
                    {formatDate(viewRequest.created_at)}
                  </p>
                </div>
                {viewRequest.verified_at && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      Verified At
                    </label>
                    <p className="text-base text-[var(--color-text-primary)]">
                      {formatDate(viewRequest.verified_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {viewRequest.status === "pending" && viewRequest.email_verified && (
                <>
                  <button
                    onClick={() => {
                      setViewModal(null);
                      setApproveModal(viewRequest.email);
                      setActionError(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Request
                  </button>
                  <button
                    onClick={() => {
                      setViewModal(null);
                      setRejectModal(viewRequest.email);
                      setRejectionReason("");
                      setActionError(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject Request
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setViewModal(null);
                  setViewRequest(null);
                }}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-surface-secondary)] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 bg-green-50 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                  Approve Signup Request
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Are you sure you want to approve this admin signup request? The account will be created and the user will be notified via email.
                </p>
                {actionError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{actionError}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {approving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      "Approve"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setApproveModal(null);
                      setActionError(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-surface-secondary)] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 bg-red-50 rounded-full">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                  Reject Signup Request
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Are you sure you want to reject this admin signup request? This action cannot be undone.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Rejection Reason (Optional)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] resize-none"
                    placeholder="Optional reason for rejection..."
                  />
                </div>
                {actionError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{actionError}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={rejecting}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {rejecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      "Reject"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setRejectModal(null);
                      setRejectionReason("");
                      setActionError(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-surface-secondary)] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

