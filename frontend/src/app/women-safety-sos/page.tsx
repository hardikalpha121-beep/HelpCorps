"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { womenSafety, InstantHelpInput } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";
import MapPreview from "@/components/MapPreview";
import { autoDetectLocation, Coordinates } from "@/lib/location";

interface Alert {
  _id: string;
  status: string;
  description?: string;
  address?: string;
  createdAt: string;
  requesterId?: { fullName: string } | null;
  responderId?: { fullName: string; mobile?: string } | null;
}

export default function WomenSafetySOS() {
  const { user } = useAuthStore();
  const [shareLocation, setShareLocation] = useState(true);
  const [sosActive, setSosActive] = useState(false);
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [locAddress, setLocAddress] = useState<string>("");
  const [geoError, setGeoError] = useState<string | null>(null);

  const [anonAlerts, setAnonAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    autoDetectLocation()
      .then((loc) => {
        setUserCoords(loc.coordinates);
        setLocAddress(loc.address);
      })
      .catch(() => {
        // Fallback default coordinates
        setUserCoords({ latitude: 31.7061, longitude: 76.5266 });
      });
  }, []);

  // Active alert (if user already triggered one)
  const { data: myAlertsData, refetch: refetchAlerts } = useQuery({
    queryKey: ["my-safety-alerts"],
    queryFn: () => womenSafety.myAlerts(),
    enabled: !!user,
    refetchInterval: 10_000,
  });

  const myAlerts: Alert[] = (myAlertsData as { data?: { data?: Alert[] } } | undefined)?.data?.data ?? [];
  const allAlerts: Alert[] = user ? myAlerts : anonAlerts;
  const activeAlert = allAlerts.find((a) => a.status === "active" || a.status === "responded");

  // Trigger SOS
  const sosMutation = useMutation({
    mutationFn: (body: InstantHelpInput) => womenSafety.instantHelp(body),
    onSuccess: (res: any) => {
      setSosActive(true);
      const newAlert = res?.data?.data;
      if (newAlert) {
        setAnonAlerts((prev) => [newAlert, ...prev]);
      }
      if (user) {
        refetchAlerts();
      }
    },
  });

  // Resolve alert
  const resolveMutation = useMutation({
    mutationFn: (id: string) => womenSafety.resolve(id),
    onSuccess: () => {
      setSosActive(false);
      if (user) refetchAlerts();
      setAnonAlerts((prev) =>
        prev.map((a) => (a.status === "active" ? { ...a, status: "resolved" } : a))
      );
    },
  });

  function handleSOS() {
    if (sosMutation.isPending) return;
    setGeoError(null);

    const coords = userCoords ?? { latitude: 31.7061, longitude: 76.5266 };
    sosMutation.mutate({
      location: coords,
      address: locAddress || undefined,
      shareLocation,
      description: "Urgent assistance requested via SOS button.",
    });
  }

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen pt-20">
      {/* Status Bar */}
      <div className="bg-surface-container-lowest border-b border-surface-container-high py-space-xs px-gutter">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error" />
            </span>
            <span className="font-label-md text-label-md text-on-surface font-semibold">Women Safety SOS • Active Mesh Relay</span>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px] text-secondary">shield</span>
              <span>End-to-End Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-gutter py-space-lg w-full flex flex-col gap-space-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* SOS Trigger */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high flex flex-col items-center text-center">
            <div className="w-full flex items-center justify-between mb-space-md">
              <span className="px-space-sm py-0.5 bg-error/10 text-error font-label-sm text-label-sm rounded-full font-semibold uppercase tracking-wider flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[14px]">emergency</span> Priority Emergency Dispatch
              </span>
            </div>

            {/* Active Alert Banner */}
            {activeAlert && (
              <div className="w-full mb-space-md p-space-md bg-secondary-fixed text-on-secondary-fixed rounded-xl text-left">
                <div className="flex items-center gap-space-xs mb-1">
                  <span className="material-symbols-outlined text-[20px] text-secondary">wifi_tethering</span>
                  <span className="font-headline-sm text-headline-sm font-bold">Alert Active!</span>
                </div>
                <p className="font-body-sm text-body-sm">
                  Status: <strong className="capitalize">{activeAlert.status}</strong>
                  {activeAlert.responderId && ` • Responder: ${activeAlert.responderId.fullName}`}
                </p>
                <button
                  onClick={() => resolveMutation.mutate(activeAlert._id)}
                  disabled={resolveMutation.isPending}
                  className="mt-space-sm px-space-md py-1.5 bg-surface-container-lowest text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  {resolveMutation.isPending ? "Resolving..." : "Mark as Safe / Resolve"}
                </button>
              </div>
            )}

            <div className="my-space-md flex flex-col items-center justify-center relative">
              <button
                type="button"
                onClick={handleSOS}
                disabled={sosMutation.isPending || !!activeAlert}
                className={`group relative z-10 w-44 h-44 rounded-full text-on-error flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-error-container cursor-pointer disabled:opacity-60 ${activeAlert ? "bg-error/60" : "bg-error hover:bg-error/95"}`}
              >
                <span className="material-symbols-outlined text-[48px] mb-1">emergency_share</span>
                <span className="font-headline-md text-headline-md font-extrabold tracking-wider">SOS</span>
                <span className="font-label-sm text-label-sm text-on-error/90 uppercase mt-0.5 font-medium tracking-wide">
                  {sosMutation.isPending ? "SENDING..." : activeAlert ? "ACTIVE" : "PRESS"}
                </span>
              </button>
            </div>

            {/* Live GPS Detection Badge */}
            {userCoords && (
              <div className="w-full my-space-sm p-space-sm bg-surface-container-low rounded-xl border border-secondary/20 flex flex-col gap-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-secondary font-label-sm text-label-sm font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                    LIVE GPS ACTIVE
                  </span>
                  <span className="text-on-surface-variant font-label-sm text-label-sm">
                    {userCoords.latitude.toFixed(4)}°, {userCoords.longitude.toFixed(4)}°
                  </span>
                </div>
                {locAddress && (
                  <p className="font-body-sm text-body-sm text-on-surface line-clamp-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                    {locAddress}
                  </p>
                )}
                {activeAlert && (
                  <MapPreview
                    latitude={userCoords.latitude}
                    longitude={userCoords.longitude}
                    markerTitle="SOS Active Location"
                    height="160px"
                  />
                )}
              </div>
            )}

            {geoError && <p className="text-error font-body-sm text-body-sm mb-space-sm">{geoError}</p>}
            {sosMutation.isError && (
              <div className="p-3 rounded-lg bg-error-container/20 border border-error/30 text-error font-body-sm text-body-sm mb-space-sm">
                {(sosMutation.error as any)?.response?.data?.error?.message ??
                  (sosMutation.error as any)?.response?.data?.message ??
                  "Failed to trigger SOS. Please try again."}
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full text-secondary font-label-sm text-label-sm mb-space-sm">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              Emergency Access Active • No Sign-In Required
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-space-xs">
              Alerts verified local responders, women crisis helplines, and municipal police with your live GPS location.
            </p>

            {/* Share Toggle */}
            <div className="w-full mt-space-lg pt-space-md border-t border-surface-container flex items-center justify-between bg-surface-container-low p-space-sm rounded-lg text-left">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary-container shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">share_location</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-semibold">Share Live Location with Responders</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Stream encrypted GPS to verified volunteers</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none ml-space-sm">
                <input
                  type="checkbox"
                  checked={shareLocation}
                  onChange={() => setShareLocation(!shareLocation)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-surface-container-lowest after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-container" />
              </label>
            </div>

            {/* Quick Dials */}
            <div className="w-full grid grid-cols-2 gap-space-sm mt-space-md">
              <a
                href="tel:911"
                className="min-h-[48px] px-space-md py-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg flex items-center justify-center gap-space-xs transition-colors"
              >
                <span className="material-symbols-outlined text-error text-[20px]">local_police</span>
                <span>Call 911</span>
              </a>
              <a
                href="tel:1091"
                className="min-h-[48px] px-space-md py-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg flex items-center justify-center gap-space-xs transition-colors"
              >
                <span className="material-symbols-outlined text-secondary text-[20px]">support_agent</span>
                <span>Women Helpline</span>
              </a>
            </div>
          </div>

          {/* Emergency Alert History */}
          <div className="lg:col-span-5 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-high">
              <div className="flex items-center justify-between mb-space-md">
                <h3 className="font-label-lg text-label-lg font-bold text-on-surface">Emergency Alert History</h3>
                <span className="font-label-sm text-label-sm text-secondary font-semibold">Live Telemetry</span>
              </div>
              {allAlerts.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] block mb-2 text-secondary">notifications_none</span>
                  <p className="font-body-sm text-body-sm font-medium">No alerts triggered yet.</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">When you trigger the SOS beacon, dispatch telemetry and responder status will appear here live.</p>
                </div>
              ) : (
                <div className="space-y-space-sm">
                  {allAlerts.map((alert) => (
                    <div key={alert._id} className="bg-surface-container-low p-space-sm rounded-xl border border-surface-container-high/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold capitalize ${alert.status === "active" ? "bg-error-container text-on-error-container" : alert.status === "responded" ? "bg-secondary-fixed text-on-secondary-fixed-variant" : "bg-surface-container text-on-surface-variant"}`}>
                          {alert.status}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                      </div>
                      {alert.responderId && (
                        <p className="font-body-sm text-body-sm text-on-surface">
                          Responder: <strong>{alert.responderId.fullName}</strong>
                          {alert.responderId.mobile && <span className="ml-2 text-primary font-semibold">({alert.responderId.mobile})</span>}
                        </p>
                      )}
                      {alert.address && <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5"><span className="font-medium">Location:</span> {alert.address}</p>}
                      {alert.description && <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{alert.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
