"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";

const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
const INDONESIA_CENTER: [number, number] = [118, -2.5];
const DEFAULT_ZOOM = 4;
const ADDRESS_ZOOM = 15;
const PIN_COLOR = "#0a61d7";

type Coordinates = { latitude: number; longitude: number };

type Props = {
  coordinates: Coordinates | null;
  className?: string;
};

/** Mapbox streets-v12 canvas used by the address preview (matches mobile MapComponent). */
export default function MapboxAddressMap({ coordinates, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const readyRef = useRef(false);
  const coordinatesRef = useRef(coordinates);

  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";

  useEffect(() => {
    coordinatesRef.current = coordinates;
  }, [coordinates]);

  useEffect(() => {
    if (!token) return;
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container,
      style: MAP_STYLE,
      center: INDONESIA_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: true,
      logoPosition: "bottom-left",
      pitchWithRotate: false,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false }),
      "top-right",
    );

    map.on("load", () => {
      readyRef.current = true;
      applyCamera(map, coordinatesRef.current);
      syncMarker(map, coordinatesRef.current, markerRef);
    });

    mapRef.current = map;

    return () => {
      readyRef.current = false;
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applyCamera(map, coordinates);
    syncMarker(map, coordinates, markerRef);
  }, [coordinates]);

  if (!token) {
    return (
      <div
        className={`flex items-center justify-center bg-[#dbe7f3] px-4 text-center text-sm text-laku-muted ${className ?? ""}`}
      >
        Mapbox token missing. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}

function applyCamera(map: mapboxgl.Map, coordinates: Coordinates | null) {
  if (coordinates) {
    map.easeTo({
      center: [coordinates.longitude, coordinates.latitude],
      zoom: ADDRESS_ZOOM,
      duration: 700,
    });
    return;
  }

  map.easeTo({
    center: INDONESIA_CENTER,
    zoom: DEFAULT_ZOOM,
    duration: 500,
  });
}

function syncMarker(
  map: mapboxgl.Map,
  coordinates: Coordinates | null,
  markerRef: { current: mapboxgl.Marker | null },
) {
  if (!coordinates) {
    markerRef.current?.remove();
    markerRef.current = null;
    return;
  }

  const lngLat: [number, number] = [coordinates.longitude, coordinates.latitude];

  if (markerRef.current) {
    markerRef.current.setLngLat(lngLat);
    return;
  }

  markerRef.current = new mapboxgl.Marker({
    element: createPinElement(),
    anchor: "center",
  })
    .setLngLat(lngLat)
    .addTo(map);
}

/** Plain DOM pin — avoids createRoot/unmount races with Mapbox marker lifecycle. */
function createPinElement(): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;pointer-events:none;";

  const ring = document.createElement("span");
  ring.style.cssText = [
    "position:absolute",
    "width:28px",
    "height:28px",
    `background:${PIN_COLOR}`,
    "border-radius:9999px",
    "opacity:0.35",
    "animation:laku-map-pin-ping 1.8s cubic-bezier(0,0,0.2,1) infinite",
  ].join(";");

  const pin = document.createElement("span");
  pin.style.cssText = [
    "position:relative",
    "width:28px",
    "height:28px",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    `background:${PIN_COLOR}`,
    "border:2px solid #fff",
    "border-radius:9999px",
    "box-shadow:0 2px 6px rgba(0,0,0,0.25)",
  ].join(";");
  pin.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#0a61d7" stroke="#fff"/></svg>';

  if (!document.getElementById("laku-map-pin-ping-style")) {
    const style = document.createElement("style");
    style.id = "laku-map-pin-ping-style";
    style.textContent =
      "@keyframes laku-map-pin-ping{75%,100%{transform:scale(2.2);opacity:0}}";
    document.head.appendChild(style);
  }

  wrap.append(ring, pin);
  return wrap;
}
