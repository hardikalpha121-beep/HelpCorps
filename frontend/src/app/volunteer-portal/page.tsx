'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { volunteers, helpRequests } from '@/lib/api';
import Link from 'next/link';

interface CitizenRequest {
  _id: string;
  category: string;
  subCategory?: string;
  serviceType: string;
  description: string;
  status: string;
  address?: string;
  createdAt: string;
  requesterId?: {
    fullName: string;
    city?: string;
    mobile?: string;
    disabilityType?: string;
  };
}

export default function VolunteerPortalDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // 1. Fetch Volunteer Profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['volunteer-profile'],
    queryFn: () => volunteers.myProfile(),
    enabled: !!user?.isVolunteer,
  });

  const volunteerProfile = (profileData as any)?.data?.data;

  // 2. Fetch Incoming Citizen Requests (Live Dispatches)
  const { data: incomingData, isLoading: incomingLoading } = useQuery({
    queryKey: ['incoming-dispatches'],
    queryFn: () => helpRequests.list({ status: 'pending', limit: 20 }),
    enabled: !!user?.isVolunteer,
    refetchInterval: 10000, // Live poll every 10s for new citizen requests
  });

  const incomingRequests: CitizenRequest[] = (incomingData as any)?.data?.data ?? [];

  // 3. Fetch Tasks Assigned to THIS Volunteer
  const { data: assignedData, isLoading: assignedLoading } = useQuery({
    queryKey: ['assigned-missions'],
    queryFn: () => helpRequests.assigned(),
    enabled: !!user?.isVolunteer,
    refetchInterval: 10000,
  });

  const assignedMissions: CitizenRequest[] = (assignedData as any)?.data?.data ?? [];

  // 4. Accept Mission Mutation
  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => helpRequests.accept(requestId),
    onSuccess: () => {
      setActionSuccess('Mission accepted! You are now assigned to this citizen request.');
      qc.invalidateQueries({ queryKey: ['incoming-dispatches'] });
      qc.invalidateQueries({ queryKey: ['assigned-missions'] });
      setTimeout(() => setActionSuccess(null), 5000);
    },
  });

  // 5. Complete Mission Mutation
  const completeMutation = useMutation({
    mutationFn: (requestId: string) => helpRequests.complete(requestId),
    onSuccess: () => {
      setActionSuccess('Mission completed! +70 Kindness Points awarded to your balance.');
      qc.invalidateQueries({ queryKey: ['assigned-missions'] });
      qc.invalidateQueries({ queryKey: ['volunteer-profile'] });
      setTimeout(() => setActionSuccess(null), 5000);
    },
  });

  // 6. Update Status Mutation (Online / Busy / Offline)
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => {
      if (!volunteerProfile?._id) return Promise.reject('No profile ID');
      return volunteers.update(volunteerProfile._id, { activeStatus: newStatus });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteer-profile'] });
    },
  });

  // Not logged in view
  if (!user) {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-surface font-body-md text-body-md text-on-surface antialiased flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-gutter text-center">
          <div className="bg-surface-container-lowest rounded-2xl p-space-xl shadow-md border border-surface-container-high space-y-space-md">
            <div className="w-16 h-16 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-[36px]">volunteer_activism</span>
            </div>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
              Volunteer Responder Portal
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              This portal is exclusively for verified HelpCorps volunteers and civic responders.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/volunteer-portal/login"
                className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">login</span>
                <span>Sign In as Volunteer</span>
              </Link>
              <Link
                href="/volunteer-portal/register"
                className="w-full py-2.5 bg-surface-container text-on-surface hover:bg-surface-container-high rounded-xl font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span>Register as New Volunteer</span>
              </Link>
            </div>
            <div className="pt-space-sm border-t border-surface-container text-xs text-on-surface-variant">
              <span>Looking for assistance instead? </span>
              <Link href="/auth" className="text-primary font-bold hover:underline">
                Citizen Portal →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged in as citizen, not yet volunteer
  if (!user.isVolunteer) {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-surface font-body-md text-body-md text-on-surface antialiased flex items-center justify-center">
        <div className="max-w-lg w-full mx-auto px-gutter text-center">
          <div className="bg-surface-container-lowest rounded-2xl p-space-xl shadow-md border border-surface-container-high space-y-space-md">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-[36px]">badge</span>
            </div>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
              Become a Volunteer Responder
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Hello <strong className="text-on-surface">{user.fullName}</strong>. Your account is currently registered as a citizen. Complete your volunteer onboarding to start receiving live citizen help requests and earning Kindness Points.
            </p>
            <div className="flex flex-col sm:flex-row gap-space-sm justify-center pt-2">
              <Link
                href="/volunteer-portal/register"
                className="px-6 py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                <span>Complete Volunteer Onboarding</span>
              </Link>
              <Link
                href="/"
                className="px-5 py-3 bg-surface-container text-on-surface hover:bg-surface-container-high rounded-xl font-label-md text-label-md font-semibold transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeStatus = volunteerProfile?.activeStatus || 'online';
  const kindnessScore = volunteerProfile?.kindnessScore ?? user?.kindnessScore ?? 140;
  const completedTasks = volunteerProfile?.completedTasks ?? 0;
  const rating = volunteerProfile?.rating ?? 5.0;

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-gutter w-full flex flex-col gap-space-lg">
        {/* Success Alert Banner */}
        {actionSuccess && (
          <div className="p-space-sm bg-secondary-fixed text-on-secondary-fixed-variant rounded-xl border border-secondary flex items-center justify-between text-sm font-semibold animate-in fade-in">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              {actionSuccess}
            </span>
            <button onClick={() => setActionSuccess(null)} className="text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Command Center Header */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold text-xl shadow-md">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface tracking-tight">
                  {user.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Verified Responder
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Base: {volunteerProfile?.address || user.city || 'Hamirpur'} • Skills: {(volunteerProfile?.skills || []).join(', ') || 'General Responder'}
              </p>
            </div>
          </div>

          {/* Responder Status Switch */}
          <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-xl border border-surface-container-high self-start lg:self-auto">
            <span className="text-xs font-semibold text-on-surface-variant px-2">Responder Status:</span>
            {(['online', 'busy', 'offline'] as const).map((st) => (
              <button
                key={st}
                onClick={() => statusMutation.mutate(st)}
                disabled={statusMutation.isPending}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all flex items-center gap-1 ${
                  activeStatus === st
                    ? st === 'online'
                      ? 'bg-secondary text-on-secondary shadow-xs'
                      : st === 'busy'
                      ? 'bg-error text-on-error shadow-xs'
                      : 'bg-surface-container-highest text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    st === 'online' ? 'bg-green-400' : st === 'busy' ? 'bg-amber-400' : 'bg-gray-400'
                  }`}
                />
                <span>{st}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Kindness Economics & Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Volunteer Points */}
          <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-surface-container-high shadow-xs">
            <div className="flex items-center justify-between text-secondary mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Responder Earnings</span>
              <span className="material-symbols-outlined text-[20px]">volunteer_activism</span>
            </div>
            <p className="font-headline-lg text-headline-lg font-black text-on-surface">
              {kindnessScore} <span className="text-xs font-medium text-on-surface-variant">PTS</span>
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">70% direct volunteer share</p>
          </div>

          {/* Civic Pool Share */}
          <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-surface-container-high shadow-xs">
            <div className="flex items-center justify-between text-primary mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Civic Safety Pool</span>
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <p className="font-headline-lg text-headline-lg font-black text-on-surface">
              {Math.round(kindnessScore * 0.43)} <span className="text-xs font-medium text-on-surface-variant">PTS</span>
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">30% pooled for equipment & relief</p>
          </div>

          {/* Missions Completed */}
          <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-surface-container-high shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Missions Completed</span>
              <span className="material-symbols-outlined text-[20px]">task_alt</span>
            </div>
            <p className="font-headline-lg text-headline-lg font-black text-on-surface">
              {completedTasks}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">Citizen requests resolved</p>
          </div>

          {/* Rating */}
          <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-surface-container-high shadow-xs">
            <div className="flex items-center justify-between text-amber-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Community Trust</span>
              <span className="material-symbols-outlined text-[20px]">star</span>
            </div>
            <p className="font-headline-lg text-headline-lg font-black text-on-surface">
              {rating.toFixed(1)} ★
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">5.0 peer feedback average</p>
          </div>
        </div>

        {/* Active Missions Section (Tasks Accepted by this Volunteer) */}
        {assignedMissions.length > 0 && (
          <div className="bg-secondary-fixed/20 border border-secondary/40 rounded-2xl p-space-lg shadow-sm">
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary animate-ping" />
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  My Active Assigned Missions ({assignedMissions.length})
                </h2>
              </div>
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">In Progress</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {assignedMissions.map((task) => (
                <div
                  key={task._id}
                  className="bg-surface-container-lowest rounded-xl p-space-md border border-secondary/30 shadow-xs flex flex-col justify-between gap-space-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary text-xs font-bold uppercase">
                        {task.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {new Date(task.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <h3 className="font-label-lg text-label-lg font-bold text-on-surface">
                      {task.serviceType || 'Citizen Assistance'}
                    </h3>
                    <p className="text-sm text-on-surface mt-1">{task.description}</p>
                    <div className="mt-3 p-2.5 bg-surface-container-low rounded-lg text-xs space-y-1">
                      <p>
                        <strong className="text-on-surface">Citizen:</strong> {task.requesterId?.fullName || 'Community Member'}
                        {task.requesterId?.mobile && (
                          <span className="ml-2 text-primary font-bold">({task.requesterId.mobile})</span>
                        )}
                      </p>
                      {task.address && (
                        <p>
                          <strong className="text-on-surface">Location:</strong> {task.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => completeMutation.mutate(task._id)}
                    disabled={completeMutation.isPending}
                    className="w-full py-2.5 bg-secondary hover:bg-secondary/90 text-on-secondary rounded-xl font-label-md text-label-md font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Mark Completed (+70 Points)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Citizen Dispatch Radar (Incoming Requests Feed) */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-space-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Live Citizen Dispatch Radar
                </h2>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Incoming neighborhood requests awaiting volunteer responders (auto-refreshes every 10s)
              </p>
            </div>

            <span className="text-xs bg-surface-container px-3 py-1 rounded-full font-semibold text-on-surface-variant self-start sm:self-auto">
              {incomingRequests.length} Requests Available
            </span>
          </div>

          {incomingLoading ? (
            <div className="space-y-space-sm">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 bg-surface-container-low rounded-xl animate-pulse" />
              ))}
            </div>
          ) : incomingRequests.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] block mb-2 text-primary opacity-60">
                radar
              </span>
              <p className="font-body-md text-body-md font-semibold text-on-surface">
                Radar Active: All neighborhood requests are currently served!
              </p>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1">
                Keep this window open while on shift. When a citizen requests disability assistance or elderly care, their dispatch beacon will appear here immediately.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
              {incomingRequests.map((req) => (
                <div
                  key={req._id}
                  className="bg-surface-container-low p-space-md rounded-xl border border-surface-container-high hover:border-primary/40 transition-all flex flex-col justify-between gap-space-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
                        {req.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h3 className="font-label-lg text-label-lg font-bold text-on-surface">
                      {req.serviceType || 'Neighbor Help Request'}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-3">
                      {req.description}
                    </p>
                    <div className="mt-3 pt-2 border-t border-surface-container text-xs text-on-surface-variant space-y-0.5">
                      <p>
                        <strong className="text-on-surface">Citizen:</strong> {req.requesterId?.fullName || 'Neighbor in need'}
                      </p>
                      {req.address && (
                        <p className="truncate">
                          <strong className="text-on-surface">Area:</strong> {req.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => acceptMutation.mutate(req._id)}
                    disabled={acceptMutation.isPending}
                    className="w-full mt-2 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-md text-label-md font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">handshake</span>
                    <span>Accept Mission</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
