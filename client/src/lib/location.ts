export type GeoCoords = { latitude: number; longitude: number };

/**
 * Request device location and return coordinates.
 * Throws a user-friendly Error when permission is denied/unavailable.
 */
export async function requireCurrentPosition(): Promise<GeoCoords> {
  if (!navigator?.geolocation) {
    throw new Error("Location is not supported on this device/browser.");
  }

  if (!window.isSecureContext) {
    throw new Error("Location requires HTTPS or secure app context.");
  }

  return new Promise<GeoCoords>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location permission denied. Please tap Allow in app/browser permission popup."));
          return;
        }
        if (err.code === err.TIMEOUT) {
          reject(new Error("Unable to get location (timeout). Please enable GPS and try again."));
          return;
        }
        reject(new Error("Unable to access location. Please enable location services and try again."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}
