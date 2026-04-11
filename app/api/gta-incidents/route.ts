import { NextRequest, NextResponse } from "next/server"

type IncidentType = "police" | "fire" | "medical"
type IncidentService = "TPS" | "TFS"

type NormalizedIncident = {
  id: string
  sourceId: string
  type: IncidentType
  service: IncidentService
  timestamp: number
  timeLabel: string
  division: string
  divisionId: number | null
  description: string
  location: string
  units: string
  highlight: boolean
  alarmLevel: number
  isUpdated: boolean
  cityName: string
  sourceLastIngest: string
}

type GtaFireEvent = {
  event_id?: string | number
  time_unix?: number
  time_str?: string
  division?: string
  division_id?: number
  description?: string
  location?: string
  units?: string
  highlight?: boolean
  alarm_level?: number
  is_updated?: number | boolean
  city_name?: string
}

type GtaPoliceEvent = {
  id?: string | number
  time?: string
  division?: string
  division_id?: number
  description?: string
  location?: string
  timestamp?: number
  highlight?: boolean
}

const GTA_BASE_URL = "https://gtaupdate.com"
const CACHE_SECONDS = 60
const SUPPORTED_WINDOWS = [1, 3, 6, 12, 24] as const

export const revalidate = 60

function parseWindow(value: string | null) {
  const parsed = Number(value)
  return SUPPORTED_WINDOWS.includes(
    parsed as (typeof SUPPORTED_WINDOWS)[number]
  )
    ? parsed
    : 3
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${GTA_BASE_URL}${path}`, {
    next: { revalidate: CACHE_SECONDS },
    headers: {
      accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`GTA Update request failed: ${path} ${response.status}`)
  }

  return response.json() as Promise<T>
}

async function fetchText(path: string): Promise<string> {
  const response = await fetch(`${GTA_BASE_URL}${path}`, {
    next: { revalidate: CACHE_SECONDS },
    headers: {
      accept: "text/plain",
    },
  })

  if (!response.ok) {
    throw new Error(`GTA Update request failed: ${path} ${response.status}`)
  }

  return response.text()
}

function normalizeFireEvent(
  event: GtaFireEvent,
  sourceLastIngest: string,
  index: number
): NormalizedIncident {
  const sourceId = String(event.event_id ?? `fire-${index}`)
  const description = event.description?.trim() || "Unknown fire call"
  const type =
    description === "Medical" || description === "Medical Upd"
      ? "medical"
      : "fire"

  return {
    id: `TFS-${sourceId}`,
    sourceId,
    type,
    service: "TFS",
    timestamp: event.time_unix ?? 0,
    timeLabel: event.time_str ?? "",
    division: event.division ?? "TFS",
    divisionId: event.division_id ?? null,
    description,
    location: event.location?.trim() || "-",
    units: event.units ?? "",
    highlight: Boolean(event.highlight),
    alarmLevel: event.alarm_level ?? 0,
    isUpdated: Boolean(event.is_updated),
    cityName: event.city_name ?? "",
    sourceLastIngest,
  }
}

function normalizePoliceEvent(
  event: GtaPoliceEvent,
  sourceLastIngest: string,
  index: number
): NormalizedIncident {
  const sourceId = String(event.id ?? `police-${index}`)

  return {
    id: `TPS-${sourceId}`,
    sourceId,
    type: "police",
    service: "TPS",
    timestamp: event.timestamp ?? 0,
    timeLabel: event.time ?? "",
    division: event.division ?? "TPS",
    divisionId: event.division_id ?? null,
    description: event.description?.trim() || "Unknown police call",
    location: event.location?.trim() || "-",
    units: "",
    highlight: Boolean(event.highlight),
    alarmLevel: 0,
    isUpdated: false,
    cityName: "",
    sourceLastIngest,
  }
}

export async function GET(request: NextRequest) {
  const windowHours = parseWindow(request.nextUrl.searchParams.get("window"))

  try {
    const [sourceLastIngest, fireEvents, policeEvents] = await Promise.all([
      fetchText("/cache/last_ingest.txt").then((value) => value.trim()),
      fetchJson<GtaFireEvent[]>(`/cache/gta_fire_${windowHours}.json`),
      fetchJson<GtaPoliceEvent[]>(`/cache/gta_police_${windowHours}.json`),
    ])

    const incidents = [
      ...fireEvents.map((event, index) =>
        normalizeFireEvent(event, sourceLastIngest, index)
      ),
      ...policeEvents.map((event, index) =>
        normalizePoliceEvent(event, sourceLastIngest, index)
      ),
    ].sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json(
      {
        window: windowHours,
        sourceLastIngest,
        fetchedAt: new Date().toISOString(),
        incidents,
        counts: {
          police: incidents.filter((incident) => incident.type === "police")
            .length,
          fire: incidents.filter((incident) => incident.type === "fire").length,
          medical: incidents.filter((incident) => incident.type === "medical")
            .length,
        },
        upstream: {
          fireCount: fireEvents.length,
          policeCount: policeEvents.length,
        },
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=30`,
        },
      }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load GTA incidents"

    return NextResponse.json(
      {
        window: windowHours,
        sourceLastIngest: null,
        fetchedAt: new Date().toISOString(),
        incidents: [],
        error: message,
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  }
}
