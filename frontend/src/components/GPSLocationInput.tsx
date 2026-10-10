"use client";

import { useState, useEffect } from "react";
import { autoDetectLocation, Coordinates } from "@/lib/location";
import { VoiceDictationButton } from "@/components/VoiceDictationButton";

interface GPSLocationInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (address: string, coords?: Coordinates) => void;
  required?: boolean;
  autoDetectOnMount?: boolean;
  className?: string;
  helperText?: string;
}

export default function GPSLocationInput({
  label = "Address / Pickup Location",
  placeholder = "e.g. 482 Maple St, Apt 2B or Landmark",
  value,
  onChange,
  required = false,
  autoDetectOnMount = false,
  className = "",
  helperText,
}: GPSLocationInputProps) {
  const [detecting, setDetecting] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDetect = async () => {
    setDetecting(true);
    setError(null);
    try {
      const loc = await autoDetectLocation();
      setDetectedCoords(loc.coordinates);
      onChange(loc.address, loc.coordinates);
    } catch (err: any) {
      setError(err?.message || "Could not detect GPS location.");
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    if (autoDetectOnMount && !value) {
      handleDetect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDetectOnMount]);

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block font-label-md text-label-md text-on-surface">
            {label} {required && <span className="text-error">*</span>}
          </label>
          <button
            type="button"
            onClick={handleDetect}
            disabled={detecting}
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-label-sm text-label-sm font-semibold transition-colors disabled:opacity-50"
            title="Auto-detect current GPS pickup location"
          >
            <span className={`material-symbols-outlined text-[16px] ${detecting ? "animate-spin" : ""}`}>
              {detecting ? "sync" : "my_location"}
            </span>
            {detecting ? "Detecting GPS..." : "Auto-Detect GPS"}
          </button>
        </div>
      )}

      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">
          location_on
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value, detectedCoords || undefined);
            if (error) setError(null);
          }}
          required={required}
          placeholder={placeholder}
          className="w-full bg-surface text-on-surface pl-10 pr-28 py-2.5 rounded-lg border border-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary text-body-md"
        />
        <div className="absolute right-2 flex items-center gap-1">
          <VoiceDictationButton
            onTranscript={(spokenText) => {
              onChange(spokenText, detectedCoords || undefined);
              if (error) setError(null);
            }}
            title="Speak your location or address"
            className="!p-1.5"
          />
          <button
            type="button"
            onClick={handleDetect}
            disabled={detecting}
            className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-md font-label-sm text-label-sm font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[14px] ${detecting ? "animate-spin" : ""}`}>
              {detecting ? "progress_activity" : "near_me"}
            </span>
            {detecting ? "GPS..." : "Locate"}
          </button>
        </div>
      </div>

      {detectedCoords && (
        <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm mt-0.5">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          <span>
            GPS locked: {detectedCoords.latitude.toFixed(4)}°, {detectedCoords.longitude.toFixed(4)}°
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1 text-error font-body-sm text-body-sm mt-0.5">
          <span className="material-symbols-outlined text-[16px]">error</span>
          <span>{error}</span>
          <button
            type="button"
            onClick={handleDetect}
            className="underline ml-1 font-semibold hover:text-error/80"
          >
            Retry
          </button>
        </div>
      )}

      {helperText && !error && !detectedCoords && (
        <p className="font-body-sm text-body-sm text-on-surface-variant">{helperText}</p>
      )}
    </div>
  );
}
