// Thin wrapper around the browser Geolocation API — used by every "Use my
// current location" control so address forms can capture real coordinates
// instead of leaving latitude/longitude null.
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function getCurrentPosition(timeoutMs = 10000): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("This browser does not support location access."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("Location access was denied. You can still enter your address manually."));
        } else if (error.code === error.TIMEOUT) {
          reject(new Error("Getting your location took too long. Try again or enter your address manually."));
        } else {
          reject(new Error("Could not get your current location."));
        }
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 },
    );
  });
}
