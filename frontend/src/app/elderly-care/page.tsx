"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { helpRequests, CreateHelpRequestInput } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";
import GPSLocationInput from "@/components/GPSLocationInput";
import { Coordinates } from "@/lib/location";
import { VoiceDictationButton } from "@/components/VoiceDictationButton";

const ELDERLY_SERVICES = [
  { value: "grocery_run", label: "Grocery & Pharmacy Run", icon: "shopping_cart" },
  { value: "friendly_visit", label: "Friendly Companion Visit", icon: "volunteer_activism" },
  { value: "medical_transport", label: "Medical Transport Escort", icon: "local_hospital" },
  { value: "tech_help", label: "Tech & Device Help", icon: "devices" },
  { value: "emergency_checkin", label: "Urgent Wellness Check-In", icon: "emergency_home" },
];

export default function ElderlyCare() {
  const { user } = useAuthStore();
  const [selectedService, setSelectedService] = useState("grocery_run");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const requestMutation = useMutation({
    mutationFn: (body: CreateHelpRequestInput) => helpRequests.create(body),
    onSuccess: () => setSubmitted(true),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { setGeoError("Please sign in first."); return; }
    setGeoError(null);
    const serviceName = selectedService.replace(/_/g, " ");
    const payload: CreateHelpRequestInput = {
      category: "elderly",
      serviceType: serviceName,
      description: `[${serviceName}] ${description.trim() || "Senior assistance requested"}`,
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
      <aside className="w-full bg-tertiary text-on-tertiary px-gutter py-space-xs shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-space-sm">
          <span className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
            <span className="w-2 h-2 rounded-full bg-surface-bright animate-ping" />
            Senior Care Network Active
          </span>
          <a className="px-space-sm py-1 bg-error text-on-error font-label-sm text-label-sm rounded-lg flex items-center gap-1 font-bold" href="tel:18004357669">
            <span className="material-symbols-outlined text-[16px]">call</span> Emergency Line
          </a>
        </div>
      </aside>

      <section className="max-w-7xl mx-auto w-full px-gutter pt-space-lg pb-space-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-md border-b border-surface-container">
          <div>
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Senior Support Services</span>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight mt-1">Elderly Care Hub</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mt-1">
              Compassionate, verified assistance for seniors — grocery runs, companions, medical transport, and wellness check-ins.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto w-full px-gutter py-space-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          {/* Service Selection */}
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Choose Service Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              {ELDERLY_SERVICES.map((svc) => (
                <button
                  key={svc.value}
                  onClick={() => setSelectedService(svc.value)}
                  className={`text-left p-space-md rounded-xl transition-all flex items-center gap-space-sm shadow-sm ${selectedService === svc.value ? "bg-surface-container-lowest ring-2 ring-primary-container" : "bg-surface-container-low hover:bg-surface-container"}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined text-[22px]">{svc.icon}</span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface font-bold">{svc.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Request Form */}
          <div className="lg:col-span-5">
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-lg border border-surface-container sticky top-24">
              <div className="text-xs uppercase font-bold tracking-widest text-secondary mb-1">RAPID DISPATCH</div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-md">
                Request: {ELDERLY_SERVICES.find((s) => s.value === selectedService)?.label}
              </h3>

              {submitted ? (
                <div className="bg-secondary-fixed text-on-secondary-fixed rounded-xl p-space-md text-center">
                  <span className="material-symbols-outlined text-[36px] text-secondary block mb-2">check_circle</span>
                  <p className="font-headline-sm text-headline-sm font-bold">Request Submitted!</p>
                  <p className="font-body-sm text-body-sm mt-1">A verified volunteer has been notified and will respond shortly.</p>
                  <button onClick={() => setSubmitted(false)} className="mt-space-sm px-space-md py-1.5 bg-surface-container-lowest text-on-surface rounded-lg font-label-md text-label-md">New Request</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-space-md">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-label-md text-label-md text-on-surface">Describe your need</label>
                      <VoiceDictationButton
                        onTranscript={(text) => setDescription((prev) => (prev ? `${prev} ${text}` : text))}
                        title="Speak to dictate your elderly care need"
                      />
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={3}
                      placeholder={`e.g. Need help with ${selectedService.replace(/_/g, " ")}...`}
                      className="w-full bg-surface text-on-surface p-space-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container font-body-md text-body-md"
                    />
                  </div>
                  <GPSLocationInput
                    label="Address / Pickup Location"
                    placeholder="e.g. 482 Maple St, Apt 2B or landmark"
                    value={address}
                    onChange={(val, newCoords) => {
                      setAddress(val);
                      if (newCoords) setCoords(newCoords);
                    }}
                    autoDetectOnMount={true}
                    helperText="Encrypted peer beacon — auto-locates via GPS"
                  />

                  {geoError && <p className="text-error font-body-sm text-body-sm">{geoError}</p>}
                  {requestMutation.isError && (
                    <div className="p-3 rounded-lg bg-error-container/20 border border-error/30 text-error font-body-sm text-body-sm">
                      {(requestMutation.error as any)?.response?.data?.error?.message ??
                        (requestMutation.error as any)?.response?.data?.message ??
                        "Submission failed. Please try again."}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-on-surface-variant mt-space-xs">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">lock</span> Encrypted peer beacon
                    </span>
                    <span>Dispatches to nearest 12 volunteers</span>
                  </div>
                  <button
                    type="submit"
                    disabled={requestMutation.isPending}
                    className="w-full min-h-[54px] rounded-xl bg-primary-container hover:bg-surface-tint text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-space-sm shadow-xl transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[24px]">elderly</span>
                    {requestMutation.isPending ? "Locating & Sending..." : "Send Care Request"}
                  </button>
                  {!user && (
                    <p className="text-on-surface-variant font-body-sm text-body-sm text-center">
                      <Link href="/auth" className="text-primary font-semibold underline">Sign in or Register as a Citizen</Link> to submit.
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
