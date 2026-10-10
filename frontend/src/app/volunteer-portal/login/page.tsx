'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { auth, LoginInput } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VolunteerLoginPage() {
  const router = useRouter();
  const { setAuth, user } = useAuthStore();
  const [form, setForm] = useState<LoginInput>({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: (body: LoginInput) => auth.login(body),
    onSuccess: (res: any) => {
      const { user: u, accessToken } = res.data.data;
      setAuth(u, accessToken);
      router.push('/volunteer-portal');
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          'Invalid volunteer credentials. Please check your email and password.'
      );
    },
  });

  if (user?.isVolunteer) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-gutter bg-surface flex items-center justify-center">
        <div className="bg-surface-container-lowest max-w-md w-full p-space-xl rounded-2xl border border-surface-container shadow-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">verified</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Active Volunteer Session</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2 mb-6">
            You are logged in as responder <strong className="text-on-surface">{user.fullName}</strong>.
          </p>
          <Link
            href="/volunteer-portal"
            className="w-full py-3 px-6 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2"
          >
            <span>Open Volunteer Command Center</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-surface font-body-md text-body-md text-on-surface antialiased flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto px-gutter flex flex-col gap-space-md">
        {/* Citizen Redirection Banner */}
        <div className="bg-surface-container-low border border-surface-container-high rounded-2xl p-space-sm flex items-center justify-between text-xs text-on-surface-variant">
          <span className="flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[16px] text-primary">person</span>
            Looking to request citizen assistance?
          </span>
          <Link href="/auth" className="text-primary hover:underline font-bold shrink-0 ml-2">
            Citizen Sign In →
          </Link>
        </div>

        {/* Volunteer Login Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-xl shadow-md border border-surface-container-high">
          <div className="text-center mb-space-lg">
            <div className="w-14 h-14 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[32px]">volunteer_activism</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight">
              Volunteer Responder Login
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Access the HelpCorps Volunteer Command Center & Live Dispatch Radar
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setErrorMsg(null);
              loginMutation.mutate(form);
            }}
            className="space-y-space-md"
          >
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">
                Volunteer Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="volunteer@helpcorps.community"
                className="w-full bg-surface-container-low text-on-surface p-space-sm rounded-xl border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary text-body-md"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                className="w-full bg-surface-container-low text-on-surface p-space-sm rounded-xl border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary text-body-md"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-error-container/20 border border-error/30 text-error font-body-sm text-body-sm">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              {loginMutation.isPending ? 'Authenticating...' : 'Sign In as Responder'}
            </button>
          </form>

          <div className="mt-space-lg pt-space-md border-t border-surface-container text-center text-xs text-on-surface-variant">
            <span>Want to join our civic responder force? </span>
            <Link
              href="/volunteer-portal/register"
              className="text-primary font-bold hover:underline"
            >
              Register as New Volunteer →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
