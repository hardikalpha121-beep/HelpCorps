"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { admin, helpRequests } from "@/lib/api";
import type { AxiosError } from "axios";

// ── Types from backend ────────────────────────────────────────────────────
interface DashboardStats {
  totalUsers: number;
  totalVolunteers: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  activeVolunteers: number;
  earnings: { totalVolunteerEarnings: number; totalPlatformFee: number; totalTransactions: number };
  requestsByCategory: { _id: string; count: number }[];
  recentRequests: {
    _id: string;
    category: string;
    status: string;
    description: string;
    createdAt: string;
    requesterId: { fullName: string; city: string } | null;
  }[];
}

const CATEGORY_ICONS: Record<string, string> = {
  disability_deaf: "sign_language",
  disability_blind: "visibility",
  disability_mobility: "accessible",
  elderly_care: "elderly",
  women_safety: "fmd_bad",
  general: "handshake",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-secondary-fixed text-on-secondary-fixed-variant",
  accepted: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  completed: "bg-surface-container text-secondary",
  cancelled: "bg-error-container text-on-error-container",
};

function StatCard({ label, value, icon, sub }: { label: string; value: string | number; icon: string; sub?: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-low flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">{label}</span>
        <span className={`p-2 rounded-lg bg-surface-container-low text-primary material-symbols-outlined text-[18px]`}>{icon}</span>
      </div>
      <div className="mt-space-sm">
        <div className="font-headline-md text-headline-md text-on-surface font-bold">{value}</div>
        {sub && <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-low animate-pulse h-28" />
  );
}

export default function AdminConsole() {
  const { data: statsRes, isLoading, error } = useQuery<{ data: { data: DashboardStats } }, AxiosError>({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => admin.dashboardStats() as Promise<{ data: { data: DashboardStats } }>,
    refetchInterval: 30_000,
  });

  const { data: volunteersRes, isLoading: volunteersLoading } = useQuery({
    queryKey: ["admin-volunteers"],
    queryFn: () => admin.volunteers({ page: 1, limit: 10 }),
    refetchInterval: 30_000,
  });

  const stats = statsRes?.data?.data;
  const volunteerList = (volunteersRes as { data?: { data?: unknown[] } } | undefined)?.data?.data ?? [];
  const volunteerArray = Array.isArray(volunteerList) ? volunteerList as {
    _id: string;
    userId: { fullName: string; email: string; city?: string; profilePhoto?: string };
    skills: string[];
    isVerified: boolean;
    completedTasks: number;
    totalPointsEarned: number;
    rating: number;
  }[] : [];

  return (
    <div className="flex w-full min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between pt-20 pb-space-lg border-r border-surface-container-low">
        <div className="px-space-md">
          <nav className="space-y-space-xs mt-space-md">
            <Link className="flex items-center gap-space-sm px-space-md py-space-sm rounded-xl bg-primary-container text-on-primary font-bold transition-all" href="/admin">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>Kindness Ledger
            </Link>
            <Link className="flex items-center gap-space-sm px-space-md py-space-sm rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-label-md text-label-md transition-all" href="/">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>Exit to Public Portal
            </Link>
          </nav>
        </div>
        {stats && (
          <div className="px-space-md">
            <div className="p-space-md bg-surface-container-low rounded-xl space-y-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Completion Rate</span>
                <span className="font-label-sm text-label-sm text-secondary font-bold">
                  {stats.totalRequests > 0 ? ((stats.completedRequests / stats.totalRequests) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div
                  className="bg-secondary h-full"
                  style={{
                    width: `${stats.totalRequests > 0 ? (stats.completedRequests / stats.totalRequests) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {stats.completedRequests} of {stats.totalRequests} requests completed
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="pl-72 w-full">
        <main className="w-full pt-28 px-space-lg min-h-screen bg-surface">
          <div className="flex flex-col w-full pb-16 space-y-8">
            {/* Header */}
            <div className="w-full bg-surface-container-lowest border border-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                  Kindness Economy & Operations Ledger
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Audited municipal rewards system and civic volunteer registry
                </p>
              </div>
              <div className="flex items-center gap-space-sm flex-wrap">
                <div className="px-3 py-1.5 bg-surface-container-low text-on-surface rounded-lg font-label-sm text-label-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span>Fixed Peg: 1 KP = $1.00 USD</span>
                </div>
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="bg-error-container rounded-xl p-space-md text-on-error-container font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-[18px] align-middle mr-1">error</span>
                Could not load dashboard data. Is the backend running at {process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5001"}?
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
              ) : stats ? (
                <>
                  <StatCard label="Active Volunteers" value={stats.activeVolunteers} icon="group" sub={`${stats.totalVolunteers} total registered`} />
                  <StatCard label="Help Requests" value={stats.totalRequests} icon="task_alt" sub={`${stats.pendingRequests} currently pending`} />
                  <StatCard
                    label="Total Kindness Points"
                    value={`${stats.earnings.totalVolunteerEarnings.toLocaleString()} KP`}
                    icon="account_balance_wallet"
                    sub={`$${stats.earnings.totalVolunteerEarnings.toLocaleString()} disbursed`}
                  />
                  <StatCard label="Protocol Split" value="70 / 30" icon="pie_chart" sub="70% Volunteer / 30% Platform" />
                </>
              ) : null}
            </div>

            {/* Split Architecture */}
            {stats && (
              <div className="bg-surface-container-lowest border border-surface-container-low rounded-xl p-space-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs mb-space-md">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">70 / 30 Protocol Split</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Volunteer yield vs Platform operations
                    </p>
                  </div>
                </div>
                <div className="space-y-space-xs">
                  <div className="flex justify-between items-center font-label-sm text-label-sm">
                    <span className="font-bold text-primary">
                      {stats.earnings.totalVolunteerEarnings.toLocaleString()} KP Volunteer Earnings
                    </span>
                    <span className="font-bold text-tertiary-container">
                      {stats.earnings.totalPlatformFee.toLocaleString()} KP Platform Reserve
                    </span>
                  </div>
                  <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: "70%" }} />
                    <div className="h-full bg-secondary-container transition-all duration-1000" style={{ width: "30%" }} />
                  </div>
                </div>
                {/* By category */}
                {stats.requestsByCategory.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm mt-space-lg pt-space-md border-t border-surface-container-low">
                    {stats.requestsByCategory.map((cat) => (
                      <div key={cat._id} className="p-space-sm bg-surface-container-low rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant capitalize">
                          {cat._id.replace(/_/g, " ")}
                        </div>
                        <div className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">
                          {cat.count} Requests
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recent Requests Stream */}
            {stats && stats.recentRequests.length > 0 && (
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
                <div className="flex items-center gap-space-sm mb-space-md">
                  <span className="w-3 h-3 rounded-full bg-error animate-ping" />
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Recent Help Requests</h3>
                </div>
                <div className="space-y-space-sm">
                  {stats.recentRequests.map((req) => (
                    <div
                      key={req._id}
                      className="bg-surface-container-low rounded-xl p-space-md flex items-start justify-between gap-space-sm"
                    >
                      <div className="flex items-start gap-space-sm">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined text-[20px]">
                            {CATEGORY_ICONS[req.category] ?? "help"}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-space-xs">
                            <span
                              className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${STATUS_COLORS[req.status] ?? ""}`}
                            >
                              {req.status.toUpperCase()}
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant capitalize">
                              {req.category.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface mt-1 line-clamp-1">
                            {req.description}
                          </p>
                          {req.requesterId && (
                            <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                              By {req.requesterId.fullName} · {req.requesterId.city}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Volunteers Table */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-low">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md mb-space-lg">
                <div>
                  <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">Accredited Force</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Master Volunteers Directory</h3>
                </div>
              </div>
              {volunteersLoading ? (
                <div className="space-y-space-sm">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-14 bg-surface-container-low rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : volunteerArray.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant font-body-md text-body-md">
                  <span className="material-symbols-outlined text-[48px] block mb-2">group_off</span>
                  No volunteers registered yet.
                </div>
              ) : (
                <div className="w-full overflow-x-auto rounded-xl">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                        <th className="py-3 px-space-md font-semibold">Volunteer</th>
                        <th className="py-3 px-space-md font-semibold">Location</th>
                        <th className="py-3 px-space-md font-semibold">Status</th>
                        <th className="py-3 px-space-md font-semibold text-center">Tasks</th>
                        <th className="py-3 px-space-md font-semibold text-right">Earned KP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low font-body-sm text-body-sm text-on-surface">
                      {volunteerArray.map((v) => (
                        <tr key={v._id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-space-sm px-space-md">
                            <div className="flex items-center gap-space-sm">
                              <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm shrink-0">
                                {v.userId?.fullName?.charAt(0).toUpperCase() ?? "?"}
                              </div>
                              <div>
                                <div className="font-label-md text-label-md font-bold">{v.userId?.fullName}</div>
                                <div className="font-label-sm text-label-sm text-on-surface-variant">{v.userId?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-space-sm px-space-md text-on-surface-variant">
                            {v.userId?.city ?? "—"}
                          </td>
                          <td className="py-space-sm px-space-md">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${v.isVerified ? "bg-secondary-fixed text-on-secondary-fixed-variant" : "bg-surface-container text-on-surface-variant"}`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {v.isVerified ? "verified" : "pending"}
                              </span>
                              {v.isVerified ? "Verified" : "Pending"}
                            </span>
                          </td>
                          <td className="py-space-sm px-space-md text-center font-semibold">{v.completedTasks}</td>
                          <td className="py-space-sm px-space-md text-right font-mono">
                            <div className="font-label-md text-label-md font-bold text-primary">
                              {v.totalPointsEarned.toLocaleString()} KP
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
