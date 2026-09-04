export type GeoCoords = { latitude: number; longitude: number };

function getPositionOnce(options: PositionOptions): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      reject,
      options
    );
  });
}

function mapGeoError(err: GeolocationPositionError): Error {
  if (err.code === err.PERMISSION_DENIED) {
    return new Error("Location permission denied. Please tap Allow in app/browser permission popup.");
  }
  if (err.code === err.TIMEOUT) {
    return new Error("Unable to get location (timeout). Please enable GPS and try again.");
  }
  return new Error("Unable to access location. Please enable location services and try again.");
}

/**
 * Request device location (mandatory). Tries high accuracy first, then a looser
 * fallback for weak signal — still throws if both fail.
 */
export async function requireCurrentPosition(): Promise<GeoCoords> {
  if (!navigator?.geolocation) {
    throw new Error("Location is not supported on this device/browser.");
  }

  if (!window.isSecureContext) {
    throw new Error("Location requires HTTPS or secure app context.");
  }

  try {
    return await getPositionOnce({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  } catch {
    try {
      return await getPositionOnce({
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 60_000,
      });
    } catch (err) {
      throw err instanceof GeolocationPositionError
        ? mapGeoError(err)
        : err instanceof Error
          ? err
          : new Error("Unable to access location. Please enable location services and try again.");
    }
  }
}
