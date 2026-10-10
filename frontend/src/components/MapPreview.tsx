"use client";

import { useEffect, useRef, useState } from "react";

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markerTitle?: string;
  className?: string;
  height?: string;
}

export default function MapPreview({
  latitude,
  longitude,
  zoom = 14,
  markerTitle = "Current Location",
  className = "",
  height = "240px",
}: MapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(false);
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // If no Google key, immediately use fallback OSM
    if (!googleKey) {
      setUseFallback(true);
      return;
    }

    // Try loading Google Maps JavaScript API
    const scriptId = "google-maps-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initGoogleMap = () => {
      try {
        if ((window as any).google && (window as any).google.maps && mapRef.current) {
          const map = new (window as any).google.maps.Map(mapRef.current, {
            center: { lat: latitude, lng: longitude },
            zoom,
            disableDefaultUI: false,
          });
          new (window as any).google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map,
            title: markerTitle,
          });
        }
      } catch {
        setUseFallback(true);
      }
    };

    // Listen for Google Maps auth failures (e.g. billing not enabled)
    (window as any).gm_authFailure = () => {
      setUseFallback(true);
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleKey}`;
      script.async = true;
      script.onload = () => initGoogleMap();
      script.onerror = () => setUseFallback(true);
      document.head.appendChild(script);
    } else if ((window as any).google?.maps) {
      initGoogleMap();
    }
  }, [googleKey, latitude, longitude, zoom, markerTitle]);

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.01}%2C${longitude + 0.01}%2C${latitude + 0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border border-surface-container shadow-inner ${className}`}
      style={{ height }}
    >
      {!useFallback ? (
        <div ref={mapRef} className="w-full h-full" />
      ) : (
        <iframe
          title="Location Map"
          width="100%"
          height="100%"
          src={osmUrl}
          className="border-0"
          loading="lazy"
        />
      )}
      <div className="absolute bottom-2 left-2 bg-surface-container-lowest/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] font-label-sm text-on-surface shadow-sm border border-surface-container flex items-center gap-1.5 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
        <span>{markerTitle}: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
      </div>
    </div>
  );
}
