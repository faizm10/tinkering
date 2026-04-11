/**
 * GTA Update feeds do not ship lat/lng. We approximate pins so the map is useful:
 * 1) If the location string includes a Canadian FSA like `(M5B)`, use a neighbourhood
 *    centroid (tight jitter).
 * 2) Else for TFS, use GTA Update `city_code` centroid (moderate jitter).
 * 3) Else for TPS, use a metro / highway-patrol centroid (wider jitter).
 * These are still not street-precise dispatch coordinates.
 */

const TORONTO_METRO: [number, number] = [-79.3832, 43.6532]

/** GTA Update `city_code` → approximate center (lng, lat). */
export const GTA_CITY_CENTROIDS: Record<string, [number, number]> = {
  "": TORONTO_METRO,
  TO: TORONTO_METRO,
  TT: [-79.3901, 43.6536],
  SC: [-79.2587, 43.774],
  NY: [-79.414, 43.7615],
  ET: [-79.543, 43.643],
  YK: [-79.478, 43.694],
  PE: [-79.347, 43.778],
  MI: [-79.644, 43.59],
  MK: [-79.649, 43.556],
  BH: [-79.798, 43.325],
  AJ: [-79.732, 43.65],
  OS: [-79.744, 43.897],
  PD: [-79.463, 44.103],
}

/**
 * Rough neighbourhood centroids for FSAs that commonly appear in GTA Update
 * location text `(M5B) …`. Lng/lat are approximate (~block–district scale).
 */
const FSA_CENTROIDS: Record<string, [number, number]> = (() => {
  const rows: [string, number, number][] = [
    ["M1B", -79.22, 43.815],
    ["M1C", -79.155, 43.785],
    ["M1E", -79.18, 43.755],
    ["M1G", -79.215, 43.765],
    ["M1H", -79.235, 43.77],
    ["M1J", -79.22, 43.745],
    ["M1K", -79.265, 43.695],
    ["M1L", -79.28, 43.715],
    ["M1M", -79.255, 43.725],
    ["M1N", -79.28, 43.69],
    ["M1P", -79.32, 43.755],
    ["M1R", -79.265, 43.74],
    ["M1S", -79.27, 43.795],
    ["M1T", -79.355, 43.785],
    ["M1V", -79.325, 43.855],
    ["M1W", -79.355, 43.805],
    ["M1X", -79.245, 43.835],
    ["M2H", -79.355, 43.805],
    ["M2J", -79.33, 43.775],
    ["M2K", -79.35, 43.795],
    ["M2L", -79.395, 43.755],
    ["M2M", -79.415, 43.725],
    ["M2N", -79.415, 43.765],
    ["M2P", -79.415, 43.745],
    ["M2R", -79.445, 43.775],
    ["M3A", -79.315, 43.755],
    ["M3B", -79.365, 43.745],
    ["M3C", -79.35, 43.73],
    ["M3H", -79.435, 43.76],
    ["M3J", -79.505, 43.765],
    ["M3K", -79.465, 43.72],
    ["M3L", -79.485, 43.715],
    ["M3N", -79.495, 43.755],
    ["M4A", -79.32, 43.72],
    ["M4B", -79.3, 43.71],
    ["M4C", -79.3, 43.69],
    ["M4E", -79.28, 43.67],
    ["M4G", -79.36, 43.71],
    ["M4H", -79.35, 43.705],
    ["M4J", -79.33, 43.685],
    ["M4K", -79.33, 43.67],
    ["M4L", -79.29, 43.66],
    ["M4M", -79.34, 43.665],
    ["M4N", -79.4, 43.725],
    ["M4P", -79.4, 43.715],
    ["M4R", -79.4, 43.705],
    ["M4S", -79.395, 43.695],
    ["M4T", -79.385, 43.685],
    ["M4V", -79.395, 43.675],
    ["M4W", -79.4, 43.665],
    ["M4X", -79.36, 43.665],
    ["M4Y", -79.38, 43.665],
    ["M4Z", -79.35, 43.67],
    ["M5A", -79.36, 43.655],
    ["M5B", -79.379, 43.6547],
    ["M5C", -79.38, 43.65],
    ["M5E", -79.36, 43.645],
    ["M5G", -79.39, 43.6555],
    ["M5H", -79.385, 43.65],
    ["M5J", -79.38, 43.64],
    ["M5K", -79.385, 43.645],
    ["M5L", -79.385, 43.65],
    ["M5M", -79.42, 43.73],
    ["M5N", -79.425, 43.71],
    ["M5P", -79.415, 43.695],
    ["M5R", -79.405, 43.675],
    ["M5S", -79.4, 43.66],
    ["M5T", -79.4, 43.655],
    ["M5V", -79.395, 43.645],
    ["M5W", -79.345, 43.725],
    ["M5X", -79.38, 43.645],
    ["M6A", -79.45, 43.72],
    ["M6B", -79.445, 43.705],
    ["M6C", -79.44, 43.69],
    ["M6E", -79.435, 43.675],
    ["M6G", -79.42, 43.665],
    ["M6H", -79.43, 43.655],
    ["M6J", -79.42, 43.645],
    ["M6K", -79.41, 43.635],
    ["M6L", -79.48, 43.715],
    ["M6M", -79.465, 43.695],
    ["M6N", -79.47, 43.665],
    ["M6P", -79.465, 43.655],
    ["M6R", -79.45, 43.645],
    ["M6S", -79.475, 43.655],
    ["M8V", -79.53, 43.615],
    ["M8W", -79.535, 43.595],
    ["M8X", -79.515, 43.625],
    ["M8Y", -79.5, 43.635],
    ["M8Z", -79.565, 43.625],
    ["M9A", -79.545, 43.695],
    ["M9B", -79.535, 43.655],
    ["M9C", -79.58, 43.645],
    ["M9L", -79.52, 43.765],
    ["M9M", -79.535, 43.725],
    ["M9N", -79.515, 43.705],
    ["M9P", -79.545, 43.695],
    ["M9R", -79.57, 43.685],
    ["M9V", -79.605, 43.745],
    ["M9W", -79.615, 43.715],
    ["L4T", -79.62, 43.695],
    ["L4V", -79.62, 43.655],
    ["L4W", -79.64, 43.58],
    ["L5B", -79.72, 43.58],
    ["L5M", -79.68, 43.58],
    ["L6P", -79.73, 43.72],
    ["L6R", -79.78, 43.68],
    ["L6S", -79.72, 43.67],
    ["L6T", -79.72, 43.7],
    ["L6W", -79.78, 43.65],
    ["L6X", -79.75, 43.62],
    ["L6Y", -79.77, 43.61],
    ["L6Z", -79.76, 43.64],
  ]
  const out: Record<string, [number, number]> = {}
  for (const [k, lng, lat] of rows) {
    out[k] = [lng, lat]
  }
  return out
})()

/** Extract Canadian FSA from strings like "(M5B) Garden District". */
export function parseFsaFromLocation(location: string): string | null {
  const m = /\(([A-Za-z])([0-9])([A-Za-z])\)/.exec(location)
  if (!m) return null
  const fsa = `${m[1].toUpperCase()}${m[2]}${m[3].toUpperCase()}`
  if (fsa.length !== 3) return null
  return fsa
}

export function jitterCoords(
  lng: number,
  lat: number,
  id: string,
  spreadDeg = 0.042,
): [number, number] {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(31, h) + id.charCodeAt(i)
  }
  const u = ((h >>> 0) % 1001) / 1000 - 0.5
  const v = ((((h / 1000) >>> 0) % 1001) / 1000 - 0.5) * 0.78
  return [lng + u * spreadDeg, lat + v * spreadDeg]
}

export function coordsForTfsCity(
  cityCode: string | undefined,
  id: string,
  spreadDeg = 0.024,
) {
  const key = (cityCode ?? "").toUpperCase()
  const [lng, lat] = GTA_CITY_CENTROIDS[key] ?? TORONTO_METRO
  return jitterCoords(lng, lat, id, spreadDeg)
}

export function coordsForPolice(
  id: string,
  division?: string,
  spreadDeg = 0.032,
) {
  const d = (division ?? "").toLowerCase()
  let base = TORONTO_METRO
  if (d.includes("highway")) base = [-79.35, 43.71]
  return jitterCoords(base[0], base[1], id, spreadDeg)
}

export type FeedService = "TPS" | "TFS"

/**
 * Best-effort map coordinates for a GTA Update row (no true dispatch lat/lng).
 */
export function approximateFeedCoordinates(
  id: string,
  service: FeedService,
  location: string,
  cityCode: string | undefined,
  division: string | undefined,
): [number, number] {
  const fsa = parseFsaFromLocation(location)
  if (fsa) {
    const c = FSA_CENTROIDS[fsa]
    if (c) {
      return jitterCoords(c[0], c[1], id, 0.006)
    }
  }
  if (service === "TFS") {
    return coordsForTfsCity(cityCode, id)
  }
  return coordsForPolice(id, division)
}

export function classifyTfsIncidentType(description: string): "fire" | "medical" {
  const t = description.trim().toLowerCase()
  if (
    t === "medical" ||
    t === "medical upd" ||
    t === "medical update" ||
    t.startsWith("medical ")
  ) {
    return "medical"
  }
  return "fire"
}
