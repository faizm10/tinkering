/**
 * GTA Update feeds do not include lat/lng. We place markers from city / area
 * centroids with a deterministic jitter so overlapping calls separate visually.
 * Positions are indicative only — not exact incident locations.
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

export function coordsForTfsCity(cityCode: string | undefined, id: string) {
  const key = (cityCode ?? "").toUpperCase()
  const [lng, lat] = GTA_CITY_CENTROIDS[key] ?? TORONTO_METRO
  return jitterCoords(lng, lat, id)
}

/** TPS events: single metro centroid + jitter (dispatch area, not street corner). */
export function coordsForPolice(id: string, division?: string) {
  const d = (division ?? "").toLowerCase()
  let base = TORONTO_METRO
  if (d.includes("highway")) base = [-79.35, 43.71]
  return jitterCoords(base[0], base[1], id, 0.055)
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
