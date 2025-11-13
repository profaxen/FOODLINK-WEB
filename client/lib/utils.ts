import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c =
    2 *
    Math.asin(
      Math.sqrt(
        sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon,
      ),
    );
  return R * c;
}

export function getSessionId() {
  const key = "foodlink_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    localStorage.setItem(key, id);
  }
  return id;
}

export function isListingExpired(expiryDate: string | undefined): boolean {
  if (!expiryDate) return false;
  try {
    return new Date(expiryDate) < new Date();
  } catch {
    return false;
  }
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineKm(
    { lat: lat1, lon: lon1 },
    { lat: lat2, lon: lon2 }
  );
}
