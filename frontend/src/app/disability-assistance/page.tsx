"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { helpRequests, volunteers, CreateHelpRequestInput } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";
import GPSLocationInput from "@/components/GPSLocationInput";
import { Coordinates } from "@/lib/location";
import { VoiceDictationButton } from "@/components/VoiceDictationButton";

const DISABILITY_CATEGORIES = [
  { value: "disability_deaf", label: "Deaf & ASL", icon: "sign_language", tab: "deaf" },
  { value: "disability_blind", label: "Blind & Vision", icon: "graphic_eq", tab: "blind" },
  { value: "disability_mobility", label: "Mobility Escort", icon: "accessible", tab: "mobility" },
];

interface Volunteer {
  _id: string;
  user: { fullName: string; city?: string; profilePhoto?: string };
  skills: string[];
  distance: number;
  rating: number;
  kindnessScore: number;
  activeStatus: string;
}

export default function DisabilityAssistance() {
  const [activeTab, setActiveTab] = useState<"deaf" | "blind" | "mobility">("deaf");
  const { user } = useAuthStore();

  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Fetch nearby volunteers filtered to disability categories
  const { data: nearbyData, isLoading: nearbyLoading } = useQuery({
    queryKey: ["nearby-volunteers-disability"],
    queryFn: () =>
      navigator.geolocation
        ? new Promise<unknown>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) =>
                resolve(
                  volunteers.nearby({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    maxDistance: 10000,
                  }),
                ),
              () => resolve(volunteers.list({ limit: 10 })),
            );
          })
        : volunteers.list({ limit: 10 }),
    staleTime: 60_000,
  });

  const nearbyVolunteers: Volunteer[] =
    (nearbyData as { data?: { data?: { volunteers?: Volunteer[] } | Volunteer[] } } | undefined)
      ?.data?.data
      ? Array.isArray((nearbyData as { data?: { data?: Volunteer[] } } | undefined)?.data?.data)
        ? ((nearbyData as { data?: { data?: Volunteer[] } } | undefined)?.data?.data ?? [])
        : ((nearbyData as { data?: { data?: { volunteers?: Volunteer[] } } } | undefined)?.data?.data?.volunteers ?? [])
      : [];

  const requestMutation = useMutation({
    mutationFn: (body: CreateHelpRequestInput) => helpRequests.create(body),
    onSuccess: () => setSubmitted(true),
  });

  function handleRequest() {
    if (!user) { setGeoError("Please sign in first."); return; }
    setGeoError(null);
    const category = DISABILITY_CATEGORIES.find((c) => c.tab === activeTab)?.value ?? "disability_deaf";
    const subCategory = activeTab === "mobility" ? "handicapped" : (activeTab as "deaf" | "blind" | "handicapped");
    const payload: CreateHelpRequestInput = {
      category,
      subCategory,
      serviceType: `${activeTab.toUpperCase()} Assistance`,
      description: description.trim() || `${activeTab} assistance requested`,
      address: address.trim() || undefined,
      location: coords ?? { latitude: 31.7061, longitude: 76.5266 },
    };

    if (coords) {
      requestMutation.mutate(payload);
    } else if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          requestMutation.mutate({
            ...payload,
            location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          });
        },
        () => {
          requestMutation.mutate(payload);
        },
        { timeout: 8000 }
      );
    } else {
      requestMutation.mutate(payload);
    }
  }

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen pt-20">
      {/* Status Bar */}
      <aside className="w-full bg-tertiary text-on-tertiary px-gutter py-space-xs shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-md">
            <span className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
              <span className="w-2 h-2 rounded-full bg-surface-bright animate-ping" />
              WCAG 2.1 AAA PROTOCOL LIVE
            </span>
          </div>
          <a className="px-space-sm py-1 bg-error hover:bg-on-error-container text-on-error font-label-sm text-label-sm rounded-lg flex items-center gap-1 font-bold" href="tel:18004357669">
            <span className="material-symbols-outlined text-[16px]">call</span>
            Priority TTY Line
          </a>
        </div>
      </aside>

      <section className="max-w-7xl mx-auto w-full px-gutter pt-space-lg pb-space-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-md border-b border-surface-container">
          <div>
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Accessible Assistance Portal</span>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight mt-1">Disability Assistance Hub</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mt-1">Select your accommodation and find verified nearby volunteers.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm mt-space-md">
          {DISABILITY_CATEGORIES.map((cat) => (
            <button
              key={cat.tab}
              onClick={() => { setActiveTab(cat.tab as typeof activeTab); setSubmitted(false); }}
              className={`text-left p-space-md rounded-xl transition-all flex items-center gap-space-sm shadow-sm ${activeTab === cat.tab ? "bg-surface-container-lowest ring-2 ring-primary-container" : "bg-surface-container-low hover:bg-surface-container"}`}
            >
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[24px]">{cat.icon}</span>
              </div>
              <div>
                <div className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">{cat.label}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Volunteers + Request Panel */}
      <section className="max-w-7xl mx-auto w-full px-gutter py-space-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          {/* Volunteers */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-space-md">
              <span className="font-label-lg text-label-lg font-bold text-on-surface">Verified Volunteers Nearby</span>
              {nearbyLoading && <span className="font-label-sm text-label-sm text-on-surface-variant animate-pulse">Locating...</span>}
            </div>

            {nearbyLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-surface-container-low rounded-xl animate-pulse" />
                ))}
              </div>
            ) : nearbyVolunteers.length === 0 ? (
              <div className="text-center py-12 bg-surface-container-lowest rounded-xl border border-surface-container text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] block mb-2">person_search</span>
                <p className="font-body-md text-body-md">No volunteers found nearby. Enable location for better results.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                {nearbyVolunteers.slice(0, 6).map((v) => (
                  <article key={v._id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="space-y-space-sm">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary text-xs font-semibold">
                          {v.distance ? `${(v.distance / 1000).toFixed(1)} km away` : v.user.city ?? "Nearby"}
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium">{v.rating ?? 0} ★</span>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold shrink-0">
                          {v.user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <h3 className="font-headline-sm text-headline-sm text-base text-on-surface font-bold">{v.user.fullName}</h3>
                            <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">{v.skills.slice(0, 2).join(", ")}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {v.skills.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 bg-surface-container rounded text-[10px] font-medium text-on-surface">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="pt-space-md grid grid-cols-2 gap-space-xs">
                      <button className="w-full py-2 bg-primary-container hover:bg-surface-tint text-on-primary font-label-sm text-label-sm rounded-lg flex items-center justify-center gap-1 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">chat</span>Request Help
                      </button>
                      <button className="w-full py-2 bg-surface-container-low hover:bg-surface-container text-primary font-label-sm text-label-sm rounded-lg flex items-center justify-center gap-1 transition-colors font-medium">
                        <span className="material-symbols-outlined text-[16px]">phone_in_talk</span>Call
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Request Form */}
          <div className="lg:col-span-4">
            <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-lg border border-surface-container sticky top-24">
              <h3 className="font-label-lg text-label-lg text-on-surface font-bold mb-space-md">
                Request {DISABILITY_CATEGORIES.find((c) => c.tab === activeTab)?.label} Help
              </h3>

              {submitted ? (
                <div className="bg-secondary-fixed text-on-secondary-fixed rounded-xl p-space-md text-center">
                  <span className="material-symbols-outlined text-[36px] text-secondary block mb-2">check_circle</span>
                  <p className="font-headline-sm text-headline-sm font-bold">Request Sent!</p>
                  <p className="font-body-sm text-body-sm mt-1">Nearby volunteers have been notified. Average response under 5 mins.</p>
                  <button onClick={() => setSubmitted(false)} className="mt-space-sm px-space-md py-1.5 bg-surface-container-lowest text-on-surface rounded-lg font-label-md text-label-md">Send Another</button>
                </div>
              ) : (
                <div className="space-y-space-md">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-label-md text-label-md text-on-surface">Describe your need</label>
                      <VoiceDictationButton
                        onTranscript={(text) => setDescription((prev) => (prev ? `${prev} ${text}` : text))}
                        title="Speak to dictate your disability assistance requirements"
                      />
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder={`e.g. I need ${activeTab === "deaf" ? "ASL interpretation" : activeTab === "blind" ? "a human guide" : "wheelchair assistance"} at...`}
                      className="w-full bg-surface text-on-surface p-space-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container font-body-md text-body-md"
                    />
                  </div>
                  <GPSLocationInput
                    label="Address / Landmark"
                    placeholder="e.g. Hamirpur, Gate B or landmark"
                    value={address}
                    onChange={(val, newCoords) => {
                      setAddress(val);
                      if (newCoords) setCoords(newCoords);
                    }}
                    autoDetectOnMount={true}
                    helperText="Auto-detected via GPS"
                  />

                  {geoError && <p className="text-error font-body-sm text-body-sm">{geoError}</p>}
                  {requestMutation.isError && (
                    <div className="p-3 rounded-lg bg-error-container/20 border border-error/30 text-error font-body-sm text-body-sm">
                      {(requestMutation.error as any)?.response?.data?.error?.message ??
                        (requestMutation.error as any)?.response?.data?.message ??
                        "Request failed. Please try again."}
                    </div>
                  )}
                  <button
                    onClick={handleRequest}
                    disabled={requestMutation.isPending}
                    className="w-full min-h-[48px] py-space-sm rounded-xl bg-primary-container hover:bg-surface-tint text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-space-sm shadow-xl transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[22px]">fmd_bad</span>
                    {requestMutation.isPending ? "Locating & Sending..." : "Dispatch Help Request"}
                  </button>
                  {!user && (
                    <p className="text-on-surface-variant font-body-sm text-body-sm text-center">
                      <Link href="/auth" className="text-primary font-semibold underline">Sign in or Register as a Citizen</Link> to submit a request.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
