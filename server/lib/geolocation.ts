import type { Request } from "express";

/** Get client IP from request (handles x-forwarded-for behind proxy). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = typeof forwarded === "string" ? forwarded.split(",")[0] : forwarded[0];
    if (first) return first.trim();
  }
  return req.ip || req.socket?.remoteAddress || "";
}

/** Response shape from ip-api.com JSON (free, no key required). */
interface IpApiResponse {
  status: "success" | "fail";
  city?: string;
  regionName?: string;
  country?: string;
  message?: string;
}

/**
 * Resolve IP to a human-readable location string using ip-api.com (free tier).
 * Returns e.g. "Bangalore, Karnataka, India" or null on failure.
 */
export async function getLocationFromIp(ip: string): Promise<string | null> {
  if (!ip || ip === "::1" || ip === "127.0.0.1") return null;
  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,city,regionName,country`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as IpApiResponse;
    if (data.status !== "success") return null;
    const parts = [data.city, data.regionName, data.country].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  } catch {
    return null;
  }
}

/**
 * Reverse geocode lat/lng to a human-readable address using OpenStreetMap Nominatim.
 * Rate limit: 1 request per second. Returns display_name or null.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ExpressFinLoans-Staff/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}
