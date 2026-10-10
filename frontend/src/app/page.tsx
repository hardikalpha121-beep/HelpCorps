"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { helpRequests } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useState } from "react";
import GPSLocationInput from "@/components/GPSLocationInput";
import { Coordinates } from "@/lib/location";

const CATEGORY_ICONS: Record<string, string> = {
  disability_deaf: "sign_language",
  disability_blind: "visibility",
  disability_mobility: "accessible",
  elderly_care: "elderly",
  women_safety: "fmd_bad",
  general: "handshake",
};

interface HelpRequest {
  _id: string;
  category: string;
  description: string;
  status: string;
  address?: string;
  createdAt: string;
  requesterId: { fullName: string; city?: string } | null;
  volunteerId?: { fullName?: string } | null;
}

export default function Home() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "general", description: "", address: "" });
  const [formCoords, setFormCoords] = useState<Coordinates | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Fetch recent public help requests
  const { data, isLoading } = useQuery({
    queryKey: ["help-requests-public"],
    queryFn: () => helpRequests.list({ limit: 6 }),
    refetchInterval: 20_000,
  });

  const recentRequests: HelpRequest[] =
    (data as { data?: { data?: HelpRequest[] } } | undefined)?.data?.data ?? [];

  // Submit new help request
  const submitMutation = useMutation({
    mutationFn: (body: { category: string; description: string; address?: string; location: { latitude: number; longitude: number } }) =>
      helpRequests.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["help-requests-public"] });
      setShowForm(false);
      setForm({ category: "general", description: "", address: "" });
      setFormCoords(null);
    },
  });

  function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeoError(null);

    // If coordinates were already auto-detected by GPS input, use them directly
    if (formCoords) {
      submitMutation.mutate({
        ...form,
        location: formCoords,
      });
      return;
    }

    // Otherwise check browser geolocation
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          submitMutation.mutate({
            ...form,
            location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          });
        },
        () => {
          // If permission denied, use default safe community coordinates (Hamirpur / Delhi region)
          submitMutation.mutate({
            ...form,
            location: { latitude: 31.7061, longitude: 76.5266 },
          });
        },
        { timeout: 8000 }
      );
    } else {
      submitMutation.mutate({
        ...form,
        location: { latitude: 31.7061, longitude: 76.5266 },
      });
    }
  }

  const CATEGORIES = [
    { value: "disability_deaf", label: "Deaf & ASL Support", icon: "sign_language", href: "/disability-assistance" },
    { value: "disability_blind", label: "Blind & Vision Guide", icon: "visibility", href: "/disability-assistance" },
    { value: "disability_mobility", label: "Mobility & Senior Care", icon: "accessible", href: "/disability-assistance" },
    { value: "women_safety", label: "Women Safety (SOS)", icon: "fmd_bad", href: "/women-safety-sos", urgent: true },
    { value: "elderly_care", label: "Elderly Care", icon: "elderly", href: "/elderly-care" },
    { value: "general", label: "General Assistance", icon: "handshake", href: "/" },
  ];

  return (
    <div className="w-full pt-20 bg-surface min-h-screen">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-gutter py-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="inline-flex items-center gap-space-xs bg-surface-container-low text-primary px-space-sm py-1 rounded-full w-max">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span className="font-label-sm text-label-sm font-semibold">Community Care & Mutual Assistance</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
              Dignified, rapid support for every neighbor in need.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              HelpCorps links individuals needing mobility, visual, hearing, senior companionship, or urgent safety escorts with vetted, compassionate local responders.
            </p>
            <div className="flex flex-wrap items-center gap-space-md mt-space-md">
              {user ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="min-h-[56px] px-space-xl py-space-sm bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm rounded-xl flex items-center justify-center gap-space-sm transition-colors shadow-sm"
                >
                  <span>Request Assistance</span>
                  <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
                </button>
              ) : (
                <Link
                  href="/auth"
                  className="min-h-[56px] px-space-xl py-space-sm bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm rounded-xl flex items-center justify-center gap-space-sm transition-colors shadow-sm"
                >
                  <span>Sign In to Request Help</span>
                  <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
                </Link>
              )}
              <Link
                href="/volunteer-portal"
                className="min-h-[56px] px-space-xl py-space-sm bg-surface-container-low hover:bg-surface-container text-on-surface font-headline-sm text-headline-sm rounded-xl flex items-center justify-center gap-space-sm transition-colors border border-outline-variant/30"
              >
                <span className="material-symbols-outlined text-[24px] text-primary">handshake</span>
                <span>Join as Volunteer</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 flex items-center justify-center p-space-md">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-space-lg w-full max-w-lg">
            <div className="flex items-center justify-between mb-space-md">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Request Assistance</h2>
              <button onClick={() => setShowForm(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleRequestSubmit} className="space-y-space-md">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-surface text-on-surface p-space-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  rows={3}
                  placeholder="Describe your situation and what kind of help you need..."
                  className="w-full bg-surface text-on-surface p-space-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <GPSLocationInput
                label="Address / Pickup Location"
                placeholder="e.g. 482 Maple St, Apt 2B or landmark"
                value={form.address}
                onChange={(address, coords) => {
                  setForm({ ...form, address });
                  if (coords) setFormCoords(coords);
                }}
                autoDetectOnMount={true}
                helperText="Auto-detects via GPS or enter custom landmark"
              />

              {geoError && (
                <p className="text-error font-body-sm text-body-sm">{geoError}</p>
              )}
              {submitMutation.isError && (
                <div className="p-2.5 rounded-lg bg-error-container/20 border border-error/30 text-error font-body-sm text-body-sm">
                  {(submitMutation.error as any)?.response?.data?.error?.message ??
                    (submitMutation.error as any)?.response?.data?.message ??
                    "Submission failed. Please try again."}
                </div>
              )}
              <div className="flex gap-space-sm justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-space-md py-space-xs bg-surface-container text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-high">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="px-space-md py-space-xs bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container disabled:opacity-50 flex items-center gap-1"
                >
                  {submitMutation.isPending ? (
                    <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Locating...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">send</span> Submit Request</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Grid */}
      <section className="w-full bg-surface py-space-xl" id="services-grid">
        <div className="max-w-7xl mx-auto px-gutter flex flex-col gap-space-xl">
          <div>
            <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">Direct Care Services</span>
            <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold mt-1">Select Specialized Assistance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={cat.href}
                className={`bg-surface-container-lowest rounded-xl p-space-md border flex flex-col gap-space-sm hover:shadow-md transition-shadow ${cat.urgent ? "border-error-container" : "border-outline-variant/30"}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.urgent ? "bg-error-container text-error" : "bg-primary-fixed text-primary"}`}>
                  <span className="material-symbols-outlined text-[26px]">{cat.icon}</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{cat.label}</h3>
                <div className="mt-auto">
                  <span className={`inline-flex items-center gap-1 font-label-md text-label-md ${cat.urgent ? "text-error" : "text-primary"}`}>
                    <span>Go to portal</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Live Help Requests Feed */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg border border-outline-variant/30">
            <div className="flex items-center gap-space-sm mb-space-md">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Live Community Requests</h3>
              <span className="font-label-sm text-label-sm text-on-surface-variant">(auto-refreshes every 20s)</span>
            </div>
            {isLoading ? (
              <div className="space-y-space-sm">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-surface-container-low rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] block mb-2">inbox</span>
                <p className="font-body-md text-body-md">No help requests in the community yet. Be the first to ask!</p>
              </div>
            ) : (
              <div className="space-y-space-sm">
                {recentRequests.map((req) => (
                  <div key={req._id} className="bg-surface-container-low rounded-xl p-space-md flex items-start gap-space-sm hover:bg-surface-container transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        {CATEGORY_ICONS[req.category] ?? "help"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-space-xs mb-1">
                        <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded font-label-sm text-label-sm capitalize">
                          {req.category.replace(/_/g, " ")}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold ${req.status === "pending" ? "text-secondary bg-secondary-fixed" : req.status === "accepted" ? "text-tertiary bg-tertiary-fixed" : "text-on-surface-variant bg-surface-container"}`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface line-clamp-1">{req.description}</p>
                      {req.address && (
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {req.address}
                        </p>
                      )}
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Volunteer CTA */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">handshake</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">Volunteer with HelpCorps</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Earn Kindness Points and give back in your local neighborhood.</p>
              </div>
            </div>
            <Link href="/volunteer-portal" className="min-h-[44px] px-space-lg py-space-xs bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md rounded-lg flex items-center gap-space-xs transition-colors shrink-0">
              <span>Sign Up to Volunteer</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
