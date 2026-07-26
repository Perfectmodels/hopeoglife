// Emplacement de référence du restaurant pour le pointage géolocalisé.
// Rayon toléré autour de ce point pour qu'un pointage soit accepté.
export const RESTAURANT_LOCATION = {
  lat: 0.5139964195927991,
  lng: 9.404289663008148,
};

export const MAX_CLOCK_DISTANCE_METERS = 150;

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

export function distanceFromRestaurant(lat: number, lng: number): number {
  return distanceMeters(lat, lng, RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng);
}
