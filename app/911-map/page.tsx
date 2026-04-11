"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { FeatureCollection, Point } from "geojson"
import {
  Activity,
  Clock3,
  Flame,
  MapPinned,
  Radio,
  ShieldAlert,
} from "lucide-react"
import type { GeoJSONSource } from "mapbox-gl"

import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerPopup,
  MarkerTooltip,
  useMap,
} from "@/components/ui/map"
import { cn } from "@/lib/utils"

type IncidentType = "police" | "fire" | "medical"

type Incident = {
  id: string
  type: IncidentType
  minutesAgo: number
  division: string
  description: string
  location: string
  units: number
  coordinates: [number, number]
}

type LiveIncident = {
  id: string
  sourceId: string
  type: IncidentType
  service: "TPS" | "TFS"
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

type GtaIncidentsResponse = {
  window: number
  sourceLastIngest: string | null
  fetchedAt: string
  incidents: LiveIncident[]
  error?: string
}

type LiveStatus = "loading" | "connected" | "stale" | "error"

type NewAlertBanner = {
  count: number
  incident: LiveIncident
}

type HotZone = {
  id: string
  name: string
  count: number
  trend: string
  dominant: IncidentType
  coordinates: [number, number]
}

type CityLabel = {
  label: string
  coordinates: [number, number]
}

const timeWindows = [1, 3, 6, 12, 24] as const

const incidents: Incident[] = [
  {
    id: "TPS-2417",
    type: "police",
    minutesAgo: 7,
    division: "52",
    description: "Priority response",
    location: "Queen St W / University Ave",
    units: 4,
    coordinates: [-79.3893, 43.6507],
  },
  {
    id: "TFS-1089",
    type: "fire",
    minutesAgo: 12,
    division: "TFS",
    description: "Alarm highrise residential",
    location: "Bay St / Wellesley St W",
    units: 5,
    coordinates: [-79.3848, 43.6632],
  },
  {
    id: "TFS-1091",
    type: "medical",
    minutesAgo: 18,
    division: "TFS",
    description: "Medical assist",
    location: "Dundas St W / Spadina Ave",
    units: 2,
    coordinates: [-79.3988, 43.6535],
  },
  {
    id: "TPS-2420",
    type: "police",
    minutesAgo: 27,
    division: "14",
    description: "Break and enter",
    location: "College St / Ossington Ave",
    units: 3,
    coordinates: [-79.4203, 43.6556],
  },
  {
    id: "TFS-1094",
    type: "fire",
    minutesAgo: 43,
    division: "TFS",
    description: "Smoke investigation",
    location: "King St W / Dufferin St",
    units: 3,
    coordinates: [-79.4278, 43.6386],
  },
  {
    id: "TPS-2428",
    type: "police",
    minutesAgo: 58,
    division: "51",
    description: "Disturbance",
    location: "Parliament St / Gerrard St E",
    units: 2,
    coordinates: [-79.3654, 43.6621],
  },
  {
    id: "TFS-1100",
    type: "medical",
    minutesAgo: 71,
    division: "TFS",
    description: "Medical assist",
    location: "Yonge St / Eglinton Ave",
    units: 2,
    coordinates: [-79.3986, 43.7065],
  },
  {
    id: "TPS-2434",
    type: "police",
    minutesAgo: 88,
    division: "53",
    description: "Traffic hazard",
    location: "Eglinton Ave E / Mount Pleasant Rd",
    units: 2,
    coordinates: [-79.3898, 43.7088],
  },
  {
    id: "TFS-1106",
    type: "fire",
    minutesAgo: 96,
    division: "TFS",
    description: "Vehicle collision",
    location: "Lake Shore Blvd W / Bathurst St",
    units: 4,
    coordinates: [-79.3997, 43.6365],
  },
  {
    id: "TPS-2441",
    type: "police",
    minutesAgo: 118,
    division: "55",
    description: "Priority response",
    location: "Danforth Ave / Broadview Ave",
    units: 3,
    coordinates: [-79.3587, 43.6773],
  },
  {
    id: "TFS-1112",
    type: "medical",
    minutesAgo: 143,
    division: "TFS",
    description: "Medical assist",
    location: "Pape Ave / Gerrard St E",
    units: 2,
    coordinates: [-79.3452, 43.6692],
  },
  {
    id: "TPS-2453",
    type: "police",
    minutesAgo: 176,
    division: "41",
    description: "Suspicious incident",
    location: "Kennedy Rd / Eglinton Ave E",
    units: 2,
    coordinates: [-79.2628, 43.7321],
  },
  {
    id: "TFS-1120",
    type: "fire",
    minutesAgo: 221,
    division: "TFS",
    description: "Alarm commercial",
    location: "Scarborough Town Centre",
    units: 4,
    coordinates: [-79.2587, 43.7764],
  },
  {
    id: "TPS-2460",
    type: "police",
    minutesAgo: 264,
    division: "23",
    description: "Assist citizen",
    location: "Rexdale Blvd / Islington Ave",
    units: 2,
    coordinates: [-79.5638, 43.7179],
  },
  {
    id: "TFS-1128",
    type: "medical",
    minutesAgo: 315,
    division: "TFS",
    description: "Medical assist",
    location: "Jane St / Finch Ave W",
    units: 2,
    coordinates: [-79.5176, 43.7576],
  },
  {
    id: "TPS-2471",
    type: "police",
    minutesAgo: 392,
    division: "22",
    description: "Collision investigation",
    location: "Kipling Ave / Bloor St W",
    units: 3,
    coordinates: [-79.5314, 43.6378],
  },
  {
    id: "TFS-1141",
    type: "fire",
    minutesAgo: 486,
    division: "TFS",
    description: "Wires down",
    location: "Leslie St / Sheppard Ave E",
    units: 3,
    coordinates: [-79.365, 43.7717],
  },
  {
    id: "TPS-2482",
    type: "police",
    minutesAgo: 602,
    division: "32",
    description: "Unknown trouble",
    location: "Yonge St / Sheppard Ave",
    units: 4,
    coordinates: [-79.4107, 43.7615],
  },
]

const hotZones: HotZone[] = [
  {
    id: "downtown-core",
    name: "Downtown Core",
    count: 38,
    trend: "+18% over normal",
    dominant: "police",
    coordinates: [-79.3874, 43.6553],
  },
  {
    id: "west-end",
    name: "West End",
    count: 24,
    trend: "steady activity",
    dominant: "fire",
    coordinates: [-79.4251, 43.6468],
  },
  {
    id: "midtown",
    name: "Midtown",
    count: 19,
    trend: "+9% over normal",
    dominant: "medical",
    coordinates: [-79.3982, 43.7075],
  },
  {
    id: "scarborough-centre",
    name: "Scarborough Centre",
    count: 16,
    trend: "cluster forming",
    dominant: "police",
    coordinates: [-79.2597, 43.774],
  },
]

const typeStyles: Record<
  IncidentType,
  {
    label: string
    marker: string
    text: string
    ring: string
    Icon: typeof ShieldAlert
  }
> = {
  police: {
    label: "Police",
    marker: "bg-[#ef4056]",
    text: "text-[#ff6477]",
    ring: "ring-[#ef4056]/35",
    Icon: ShieldAlert,
  },
  fire: {
    label: "Fire",
    marker: "bg-[#ffb23f]",
    text: "text-[#ffbf5c]",
    ring: "ring-[#ffb23f]/35",
    Icon: Flame,
  },
  medical: {
    label: "Medical",
    marker: "bg-[#28d0b8]",
    text: "text-[#36dec8]",
    ring: "ring-[#28d0b8]/35",
    Icon: Activity,
  },
}

const filterOptions = ["all", "police", "fire", "medical"] as const

const torontoLightStyle = "mapbox://styles/mapbox/light-v11"

const roadTraces: [number, number][][] = [
  [
    [-79.548, 43.632],
    [-79.49, 43.637],
    [-79.43, 43.638],
    [-79.38, 43.646],
    [-79.33, 43.657],
    [-79.28, 43.697],
  ],
  [
    [-79.455, 43.706],
    [-79.425, 43.699],
    [-79.398, 43.684],
    [-79.382, 43.662],
    [-79.371, 43.646],
  ],
  [
    [-79.54, 43.649],
    [-79.48, 43.651],
    [-79.42, 43.655],
    [-79.37, 43.666],
    [-79.315, 43.686],
    [-79.25, 43.701],
  ],
  [
    [-79.523, 43.661],
    [-79.463, 43.66],
    [-79.405, 43.656],
    [-79.35, 43.653],
    [-79.286, 43.666],
  ],
  [
    [-79.498, 43.676],
    [-79.442, 43.672],
    [-79.392, 43.665],
    [-79.344, 43.666],
    [-79.292, 43.677],
  ],
  [
    [-79.471, 43.707],
    [-79.418, 43.707],
    [-79.366, 43.708],
    [-79.306, 43.718],
    [-79.246, 43.737],
  ],
  [
    [-79.414, 43.612],
    [-79.406, 43.642],
    [-79.398, 43.676],
    [-79.397, 43.708],
    [-79.41, 43.762],
  ],
  [
    [-79.442, 43.635],
    [-79.424, 43.649],
    [-79.412, 43.665],
    [-79.398, 43.684],
    [-79.384, 43.704],
  ],
  [
    [-79.383, 43.645],
    [-79.385, 43.663],
    [-79.391, 43.685],
    [-79.397, 43.707],
    [-79.405, 43.739],
  ],
]

const shorelineTrace: [number, number][] = [
  [-79.55, 43.588],
  [-79.494, 43.596],
  [-79.447, 43.612],
  [-79.402, 43.626],
  [-79.356, 43.637],
  [-79.308, 43.661],
  [-79.263, 43.688],
]

const cityLabels: CityLabel[] = [
  { label: "Etobicoke", coordinates: [-79.531, 43.671] },
  { label: "North York", coordinates: [-79.414, 43.758] },
  { label: "Midtown", coordinates: [-79.398, 43.706] },
  { label: "Downtown", coordinates: [-79.387, 43.655] },
  { label: "East York", coordinates: [-79.344, 43.69] },
  { label: "Scarborough", coordinates: [-79.257, 43.762] },
]

function HotZoneLayer({
  zones,
  visible,
}: {
  zones: HotZone[]
  visible: boolean
}) {
  const { map, isLoaded } = useMap()
  const zoneData = useMemo<FeatureCollection<Point>>(
    () => ({
      type: "FeatureCollection",
      features: zones.map((zone) => ({
        type: "Feature",
        properties: {
          id: zone.id,
          count: zone.count,
          weight: Math.max(0.2, Math.min(zone.count / 40, 1)),
        },
        geometry: {
          type: "Point",
          coordinates: zone.coordinates,
        },
      })),
    }),
    [zones]
  )

  useEffect(() => {
    if (!map || !isLoaded) return

    const sourceId = "gta-hot-zone-source"
    const heatLayerId = "gta-hot-zone-heat"
    const pulseLayerId = "gta-hot-zone-pulse"

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: zoneData,
      })

      map.addLayer({
        id: heatLayerId,
        type: "heatmap",
        source: sourceId,
        paint: {
          "heatmap-weight": ["get", "weight"],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            0.65,
            13,
            1.35,
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            42,
            13,
            86,
          ],
          "heatmap-opacity": visible ? 0.62 : 0,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(10,10,10,0)",
            0.22,
            "rgba(40,208,184,0.28)",
            0.48,
            "rgba(255,178,63,0.5)",
            0.76,
            "rgba(239,64,86,0.64)",
            1,
            "rgba(255,142,92,0.74)",
          ],
        },
      })

      map.addLayer({
        id: pulseLayerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "count"],
            12,
            28,
            40,
            58,
          ],
          "circle-color": "rgba(255,245,214,0)",
          "circle-stroke-color": "rgba(255,178,63,0.5)",
          "circle-stroke-width": 1.5,
          "circle-opacity": visible ? 0.32 : 0,
          "circle-stroke-opacity": visible ? 0.54 : 0,
        },
      })
    }

    const source = map.getSource(sourceId) as GeoJSONSource | undefined
    if (source) {
      source.setData(zoneData)
    }

    if (map.getLayer(heatLayerId)) {
      map.setPaintProperty(heatLayerId, "heatmap-opacity", visible ? 0.62 : 0)
    }

    if (map.getLayer(pulseLayerId)) {
      map.setPaintProperty(pulseLayerId, "circle-opacity", visible ? 0.32 : 0)
      map.setPaintProperty(
        pulseLayerId,
        "circle-stroke-opacity",
        visible ? 0.54 : 0
      )
    }

    return () => {
      if (!map.getLayer(heatLayerId)) return
    }
  }, [isLoaded, map, visible, zoneData])

  return null
}

function CityTraceLayer() {
  return (
    <>
      <MapRoute
        id="shoreline-trace"
        coordinates={shorelineTrace}
        color="#163c42"
        width={4}
        opacity={0.72}
        interactive={false}
      />
      {roadTraces.map((route, index) => (
        <MapRoute
          key={`road-trace-${index}`}
          id={`road-trace-${index}`}
          coordinates={route}
          color={index < 2 ? "#244241" : "#1a2f2e"}
          width={index < 2 ? 2.4 : 1.3}
          opacity={index < 2 ? 0.62 : 0.42}
          interactive={false}
        />
      ))}
      {cityLabels.map((item) => (
        <MapMarker
          key={item.label}
          longitude={item.coordinates[0]}
          latitude={item.coordinates[1]}
          anchor="center"
        >
          <MarkerContent className="pointer-events-none">
            <span className="rounded-sm border border-[#7ad9cd]/12 bg-[#050707]/44 px-2 py-1 font-mono text-[10px] text-[#7ad9cd]/42 uppercase shadow-[0_0_18px_rgba(5,7,7,0.7)] backdrop-blur-sm">
              {item.label}
            </span>
          </MarkerContent>
        </MapMarker>
      ))}
    </>
  )
}

function formatAge(minutes: number) {
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining ? `${hours}h ${remaining}m ago` : `${hours}h ago`
}

function formatTimestampAge(timestamp: number) {
  if (!timestamp) return "unknown"

  const diffSeconds = Math.max(0, Math.floor(Date.now() / 1000) - timestamp)
  const minutes = Math.floor(diffSeconds / 60)

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining ? `${hours}h ${remaining}m ago` : `${hours}h ago`
}

function formatUpdateTime(value: string | null, fallback?: string) {
  const raw = value || fallback
  if (!raw) return "waiting"

  const date = new Date(raw.replace(" ", "T"))
  if (Number.isNaN(date.getTime())) return raw

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function Page() {
  const [selectedWindow, setSelectedWindow] =
    useState<(typeof timeWindows)[number]>(3)
  const [selectedType, setSelectedType] =
    useState<(typeof filterOptions)[number]>("all")
  const [showHotZones, setShowHotZones] = useState(true)
  const [liveIncidents, setLiveIncidents] = useState<LiveIncident[]>([])
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("loading")
  const [liveError, setLiveError] = useState<string | null>(null)
  const [sourceLastIngest, setSourceLastIngest] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [newAlert, setNewAlert] = useState<NewAlertBanner | null>(null)
  const hasLiveDataRef = useRef(false)
  const knownIncidentIdsRef = useRef<Set<string>>(new Set())
  const alertTimerRef = useRef<number | null>(null)

  useEffect(() => {
    let isActive = true
    let activeController: AbortController | null = null
    knownIncidentIdsRef.current = new Set()
    setNewAlert(null)
    if (alertTimerRef.current) {
      window.clearTimeout(alertTimerRef.current)
      alertTimerRef.current = null
    }

    async function loadIncidents() {
      activeController?.abort()
      activeController = new AbortController()

      try {
        const response = await fetch(
          `/api/gta-incidents?window=${selectedWindow}`,
          {
            cache: "no-store",
            signal: activeController.signal,
          }
        )
        const data = (await response.json()) as GtaIncidentsResponse

        if (!response.ok) {
          throw new Error(data.error || "Failed to load live incidents")
        }

        if (!isActive) return

        const nextIncidents = Array.isArray(data.incidents)
          ? data.incidents
          : []
        const knownIds = knownIncidentIdsRef.current
        const newIncidents =
          knownIds.size > 0
            ? nextIncidents.filter((incident) => !knownIds.has(incident.id))
            : []

        knownIncidentIdsRef.current = new Set(
          nextIncidents.map((incident) => incident.id)
        )

        if (newIncidents.length > 0) {
          const latestNewIncident = [...newIncidents].sort(
            (a, b) => b.timestamp - a.timestamp
          )[0]

          setNewAlert({
            count: newIncidents.length,
            incident: latestNewIncident,
          })

          if (alertTimerRef.current) {
            window.clearTimeout(alertTimerRef.current)
          }
          alertTimerRef.current = window.setTimeout(() => {
            setNewAlert(null)
            alertTimerRef.current = null
          }, 5_000)
        }

        setLiveIncidents(nextIncidents)
        setSourceLastIngest(data.sourceLastIngest)
        setFetchedAt(data.fetchedAt)
        setLiveStatus("connected")
        setLiveError(null)
        hasLiveDataRef.current = true
      } catch (error) {
        if (!isActive) return
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        setLiveError(
          error instanceof Error ? error.message : "Failed to load live feed"
        )
        setLiveStatus((current) =>
          current === "connected" || current === "stale" ? "stale" : "error"
        )
      }
    }

    setLiveStatus((current) =>
      hasLiveDataRef.current && current !== "error" ? "stale" : "loading"
    )
    loadIncidents()
    const intervalId = window.setInterval(loadIncidents, 60_000)

    return () => {
      isActive = false
      activeController?.abort()
      window.clearInterval(intervalId)
      if (alertTimerRef.current) {
        window.clearTimeout(alertTimerRef.current)
        alertTimerRef.current = null
      }
    }
  }, [selectedWindow])

  const mapIncidents = useMemo(() => {
    const maxAge = selectedWindow * 60
    return incidents.filter((incident) => {
      const inWindow = incident.minutesAgo <= maxAge
      const matchesType =
        selectedType === "all" || incident.type === selectedType
      return inWindow && matchesType
    })
  }, [selectedType, selectedWindow])

  const liveFilteredIncidents = useMemo(
    () =>
      liveIncidents.filter(
        (incident) => selectedType === "all" || incident.type === selectedType
      ),
    [liveIncidents, selectedType]
  )

  const totals = useMemo(
    () => ({
      police: liveIncidents.filter((incident) => incident.type === "police")
        .length,
      fire: liveIncidents.filter((incident) => incident.type === "fire").length,
      medical: liveIncidents.filter((incident) => incident.type === "medical")
        .length,
    }),
    [liveIncidents]
  )
  const leadZone = hotZones[0]
  const newestIncident = liveIncidents[0]
  const liveStatusLabel =
    liveStatus === "connected"
      ? "Live feed connected"
      : liveStatus === "stale"
        ? "Live feed stale"
        : liveStatus === "loading"
          ? "Connecting live feed"
          : "Live feed offline"

  return (
    <main className="dark relative min-h-[100dvh] overflow-hidden font-mono text-[#f5f2ea]">
      <div className="absolute inset-0">
        <Map
          theme="light"
          styles={{
            dark: torontoLightStyle,
            light: torontoLightStyle,
          }}
          center={[-79.3832, 43.6532]}
          zoom={10.8}
          minZoom={8.5}
          maxZoom={17}
          pitch={42}
          bearing={-17}
          className="h-full w-full"
        >
          <CityTraceLayer />
          <HotZoneLayer zones={hotZones} visible={showHotZones} />
          <MapControls
            position="bottom-right"
            showZoom
            showCompass
            showLocate
            showFullscreen
            className="right-4 bottom-5 xl:right-[356px] 2xl:right-[376px]"
          />

          {mapIncidents.map((incident) => {
            const style = typeStyles[incident.type]
            const Icon = style.Icon

            return (
              <MapMarker
                key={incident.id}
                longitude={incident.coordinates[0]}
                latitude={incident.coordinates[1]}
                anchor="center"
              >
                <MarkerContent>
                  <div
                    className={cn(
                      "relative grid size-6 rotate-45 place-items-center rounded-sm shadow-[0_0_26px_rgba(255,255,255,0.16)] ring-8",
                      style.marker,
                      style.ring
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.9)]" />
                    <span className="absolute -inset-2 rounded-sm border border-white/18" />
                  </div>
                </MarkerContent>
                <MarkerTooltip className="border border-white/10 bg-[#111313] text-[#f5f2ea]">
                  {incident.description}
                </MarkerTooltip>
                <MarkerPopup className="w-[260px] border border-white/12 bg-[#101212]/95 p-0 text-[#f5f2ea] shadow-2xl backdrop-blur-md">
                  <div className="border-b border-white/10 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={cn(
                          "flex items-center gap-2 text-sm font-semibold",
                          style.text
                        )}
                      >
                        <Icon className="size-4" />
                        {style.label}
                      </span>
                      <span className="font-mono text-[11px] text-white/52">
                        {incident.id}
                      </span>
                    </div>
                    <p className="mt-2 text-base leading-tight font-semibold">
                      {incident.description}
                    </p>
                  </div>
                  <div className="space-y-2 px-4 py-3 text-sm text-white/70">
                    <p>{incident.location}</p>
                    <div className="flex items-center justify-between font-mono text-[11px] uppercase">
                      <span>Div. {incident.division}</span>
                      <span>{incident.units} units</span>
                      <span>{formatAge(incident.minutesAgo)}</span>
                    </div>
                  </div>
                </MarkerPopup>
              </MapMarker>
            )
          })}
        </Map>
      </div>

      {/* Targeted gradients to protect content legibility over light map */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[72%] bg-[linear-gradient(90deg,rgba(5,7,7,0.60)_0%,rgba(5,7,7,0.28)_55%,transparent_88%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(5,7,7,0.52),transparent)]" />

      {newAlert && <NewAlertToast alert={newAlert} />}

      <section className="pointer-events-none relative z-10 flex min-h-[100dvh] flex-col justify-between p-4 sm:p-6 lg:p-8 xl:pr-[380px] 2xl:pr-[400px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="pointer-events-auto max-w-2xl">
            <div className="mb-5 flex items-start gap-4">
              <span className="relative grid size-12 place-items-center rounded-md border border-[#28d0b8]/30 bg-[#071312]/92 shadow-[0_0_34px_rgba(40,208,184,0.16)] backdrop-blur">
                <span className="absolute inset-0 animate-[ping_2.8s_ease-out_infinite] rounded-md bg-[#28d0b8]/10" />
                <span className="absolute inset-1 rounded-sm border border-[#28d0b8]/10" />
                <Radio className="size-5 text-[#28d0b8]" />
              </span>
              <div>
                <p className="text-[11px] text-[#7ad9cd]/70 uppercase">
                  Toronto dispatch surface
                </p>
                <h1 className="mt-1 text-5xl leading-none font-black text-pretty text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:text-7xl">
                  911 Map
                </h1>
              </div>
            </div>
            <div className="grid max-w-2xl grid-cols-1 border-y border-[#7ad9cd]/16 bg-[#07100f]/62 text-sm text-white/70 backdrop-blur-sm sm:grid-cols-3">
              <SignalStat label="Window" value={`${selectedWindow}h`} />
              <SignalStat
                label="Lead zone"
                value={leadZone.name}
                tone="text-[#ffbf5c]"
              />
              <SignalStat
                label="Latest"
                value={
                  newestIncident
                    ? formatTimestampAge(newestIncident.timestamp)
                    : "clear"
                }
                tone="text-[#36dec8]"
              />
            </div>
            <div className="mt-3 flex max-w-2xl flex-wrap gap-2 text-[10px] uppercase">
              <StatusPill
                label={liveStatusLabel}
                tone={
                  liveStatus === "connected"
                    ? "border-[#28d0b8]/28 text-[#36dec8]"
                    : liveStatus === "stale"
                      ? "border-[#ffb23f]/28 text-[#ffbf5c]"
                      : "border-[#ef4056]/28 text-[#ff6477]"
                }
              />
              <StatusPill
                label="Map layer prototype"
                tone="border-[#7ad9cd]/18 text-white/52"
              />
              <StatusPill
                label={`Updated ${formatUpdateTime(sourceLastIngest, fetchedAt ?? undefined)}`}
                tone="border-[#7ad9cd]/18 text-white/52"
              />
              {liveError && (
                <StatusPill
                  label={liveError}
                  tone="max-w-[300px] truncate border-[#ef4056]/28 text-[#ff6477]"
                />
              )}
            </div>
            <p className="mt-3 max-w-xl text-[11px] leading-5 text-white/46">
              Awareness only. Not affiliated with Toronto Police, Toronto Fire,
              the City of Toronto, or GTA Update. In an emergency, call 911.
            </p>
          </div>

          <div className="pointer-events-auto grid w-full max-w-[340px] grid-cols-3 overflow-hidden rounded-md border border-[#7ad9cd]/16 bg-[#080c0c]/92 text-center shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-md xl:hidden">
            <Metric
              label="Police"
              value={totals.police}
              tone="text-[#ff6477]"
            />
            <Metric label="Fire" value={totals.fire} tone="text-[#ffbf5c]" />
            <Metric
              label="Medical"
              value={totals.medical}
              tone="text-[#36dec8]"
            />
          </div>
        </div>

        <div className="pointer-events-none flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="pointer-events-auto w-full max-w-2xl rounded-md border border-[#7ad9cd]/16 bg-[#070b0b]/94 p-3 shadow-[0_28px_90px_rgba(0,0,0,0.46)] backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2">
              <ControlLabel
                icon={<Clock3 className="size-4" />}
                label="Window"
              />
              {timeWindows.map((window) => (
                <button
                  key={window}
                  type="button"
                  onClick={() => setSelectedWindow(window)}
                  className={cn(
                    "h-9 rounded-md border px-3 font-mono text-xs transition",
                    selectedWindow === window
                      ? "border-[#28d0b8] bg-[#28d0b8] text-[#06110f] shadow-[0_0_24px_rgba(40,208,184,0.22)]"
                      : "border-[#7ad9cd]/14 bg-[#0d1413] text-white/62 hover:border-[#7ad9cd]/38 hover:text-white"
                  )}
                >
                  {window}h
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ControlLabel
                icon={<MapPinned className="size-4" />}
                label="Layer"
              />
              <button
                type="button"
                onClick={() => setShowHotZones((value) => !value)}
                className={cn(
                  "h-9 rounded-md border px-3 font-mono text-xs transition",
                  showHotZones
                    ? "border-[#ffb23f] bg-[#ffb23f] text-[#191006] shadow-[0_0_24px_rgba(255,178,63,0.2)]"
                    : "border-[#7ad9cd]/14 bg-[#0d1413] text-white/62 hover:border-[#7ad9cd]/38 hover:text-white"
                )}
              >
                Hot zones
              </button>

              {filterOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedType(option)}
                  className={cn(
                    "h-9 rounded-md border px-3 font-mono text-xs capitalize transition",
                    selectedType === option
                      ? "border-[#f4efe6] bg-[#f4efe6] text-[#101212]"
                      : "border-[#7ad9cd]/14 bg-[#0d1413] text-white/62 hover:border-[#7ad9cd]/38 hover:text-white"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <aside className="pointer-events-auto w-full max-w-[360px] overflow-hidden rounded-md border border-[#7ad9cd]/16 bg-[#070b0b]/94 shadow-[0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-md xl:hidden">
            <PressurePanel hotZones={hotZones} />
          </aside>

          <div className="pointer-events-auto w-full max-w-2xl xl:hidden">
            <UsePolicyPanel />
          </div>
        </div>
      </section>

      <aside className="pointer-events-auto absolute top-4 right-4 bottom-4 z-20 hidden w-[320px] flex-col gap-3 xl:flex 2xl:w-[340px]">
        <div className="grid grid-cols-3 overflow-hidden rounded-md border border-[#7ad9cd]/16 bg-[#080c0c]/92 text-center shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-md">
          <Metric label="Police" value={totals.police} tone="text-[#ff6477]" />
          <Metric label="Fire" value={totals.fire} tone="text-[#ffbf5c]" />
          <Metric
            label="Medical"
            value={totals.medical}
            tone="text-[#36dec8]"
          />
        </div>

        <LiveFeedPanel
          incidents={liveFilteredIncidents}
          liveStatus={liveStatus}
        />

        <UsePolicyPanel />

        <section className="min-h-0 flex-1 overflow-hidden rounded-md border border-[#7ad9cd]/16 bg-[#070b0b]/94 shadow-[0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-md">
          <PressurePanel hotZones={hotZones} />
        </section>
      </aside>
    </main>
  )
}

function MapAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(122,217,205,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(122,217,205,0.16)_1px,transparent_1px)] [background-size:72px_72px] opacity-[0.16]" />
      <div className="absolute inset-0 [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_7px,rgba(244,239,230,0.45)_8px)] opacity-[0.08]" />
      <div className="absolute top-1/2 left-1/2 h-[64vmin] w-[64vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#7ad9cd]/12" />
      <div className="absolute top-1/2 left-1/2 h-[38vmin] w-[38vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ffb23f]/10" />
      <div className="absolute top-1/2 left-0 h-px w-full bg-[#7ad9cd]/10" />
      <div className="absolute top-0 left-1/2 h-full w-px bg-[#7ad9cd]/10" />
    </div>
  )
}

function NewAlertToast({ alert }: { alert: NewAlertBanner }) {
  const style = typeStyles[alert.incident.type]
  const Icon = style.Icon
  const countLabel =
    alert.count === 1 ? "1 new alert" : `${alert.count} new alerts`

  return (
    <div className="pointer-events-none absolute top-3 right-4 left-4 z-30 flex justify-center xl:right-[380px] 2xl:right-[400px]">
      <div className="flex w-full max-w-[560px] animate-in items-center gap-3 rounded-md border border-[#ffb23f]/42 bg-[#080c0c]/96 px-3 py-2.5 text-[#f4efe6] shadow-[0_20px_80px_rgba(0,0,0,0.55),0_0_38px_rgba(255,178,63,0.16)] backdrop-blur-md duration-300 fade-in-0 slide-in-from-top-2">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-md bg-white/[0.06]",
            style.text
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-[#ffbf5c] uppercase">{countLabel}</p>
            <span className="h-px flex-1 bg-[#7ad9cd]/16" />
            <p className="text-[10px] whitespace-nowrap text-white/42">
              {alert.incident.timeLabel ||
                formatTimestampAge(alert.incident.timestamp)}
            </p>
          </div>
          <p className="mt-1 truncate text-sm font-bold">
            {alert.incident.description}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-white/50">
            {alert.incident.location}
          </p>
        </div>
      </div>
    </div>
  )
}

function LiveFeedPanel({
  incidents,
  liveStatus,
}: {
  incidents: LiveIncident[]
  liveStatus: LiveStatus
}) {
  return (
    <section className="max-h-[28vh] overflow-hidden rounded-md border border-[#7ad9cd]/16 bg-[#070b0b]/94 shadow-[0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-[#7ad9cd]/14 px-3 py-2.5">
        <p className="font-mono text-[10px] text-white/48 uppercase">
          Live feed
        </p>
        <p className="font-mono text-[10px] text-white/48">
          {incidents.length} calls
        </p>
      </div>
      <div className="max-h-[22vh] overflow-auto">
        {incidents.slice(0, 4).map((incident) => {
          const style = typeStyles[incident.type]
          const Icon = style.Icon

          return (
            <div
              key={incident.id}
              className="grid grid-cols-[auto_1fr_auto] gap-2 border-b border-[#7ad9cd]/10 px-3 py-2.5 last:border-b-0"
            >
              <span
                className={cn(
                  "mt-0.5 grid size-7 place-items-center rounded-md bg-white/[0.06]",
                  style.text
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">
                  {incident.description}
                </p>
                <p className="mt-1 truncate text-[11px] text-white/50">
                  {incident.location}
                </p>
              </div>
              <span className="font-mono text-[10px] whitespace-nowrap text-white/48">
                {formatTimestampAge(incident.timestamp)}
              </span>
            </div>
          )
        })}
        {incidents.length === 0 && (
          <div className="px-3 py-4 text-xs text-white/48">
            {liveStatus === "loading"
              ? "Connecting to GTA Update..."
              : "No live calls match the current filters."}
          </div>
        )}
      </div>
    </section>
  )
}

function PressurePanel({ hotZones }: { hotZones: HotZone[] }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-[#7ad9cd]/14 px-3 py-2.5">
        <div>
          <p className="font-mono text-[10px] text-white/48 uppercase">
            Activity zones
          </p>
          <h2 className="text-base font-bold">Current pressure</h2>
        </div>
        <span className="rounded-md border border-[#ef4056]/35 bg-[#ef4056]/12 px-2 py-1 font-mono text-[10px] whitespace-nowrap text-[#ff6477]">
          Not safety advice
        </span>
      </div>

      <div className="min-h-0 flex-1 divide-y divide-[#7ad9cd]/12 overflow-auto">
        {hotZones.map((zone) => {
          const style = typeStyles[zone.dominant]
          return (
            <div
              key={zone.id}
              className="grid grid-cols-[1fr_auto] gap-3 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-semibold">{zone.name}</p>
                <p className="mt-1 text-xs text-white/56">{zone.trend}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg leading-none font-bold">
                  {zone.count}
                </p>
                <p
                  className={cn(
                    "mt-1 font-mono text-[10px] uppercase",
                    style.text
                  )}
                >
                  {style.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function UsePolicyPanel() {
  return (
    <section className="rounded-md border border-[#ef4056]/18 bg-[#070b0b]/94 p-3 shadow-[0_22px_70px_rgba(0,0,0,0.38)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-[#ff6477] uppercase">Use policy</p>
        <span className="rounded-md border border-[#ffb23f]/24 px-2 py-1 text-[9px] whitespace-nowrap text-[#ffbf5c]">
          Not safety advice
        </span>
      </div>
      <div className="mt-2 space-y-1.5 text-[11px] leading-4 text-white/50">
        <p>Unofficial public-awareness view. Not an emergency service.</p>
        <p>
          Live feed data is attributed to GTA Update. Map signals are prototype
          activity layers, not exact incident locations.
        </p>
        <p>No safety, routing, crime-risk, or danger-zone decisions.</p>
      </div>
    </section>
  )
}

function SignalStat({
  label,
  value,
  tone = "text-[#f4efe6]",
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="min-w-0 border-b border-[#7ad9cd]/12 px-4 py-3 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
      <p className="text-[10px] text-white/42 uppercase">{label}</p>
      <p className={cn("mt-1 truncate text-sm font-bold", tone)}>{value}</p>
    </div>
  )
}

function StatusPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={cn(
        "rounded-md border bg-[#050707]/70 px-2 py-1 backdrop-blur-sm",
        tone
      )}
      title={label}
    >
      {label}
    </span>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: string
}) {
  return (
    <div className="border-r border-white/10 px-3 py-3 last:border-r-0">
      <p className={cn("font-mono text-2xl leading-none font-black", tone)}>
        {value}
      </p>
      <p className="mt-1 font-mono text-[9px] text-white/45 uppercase">
        {label}
      </p>
    </div>
  )
}

function ControlLabel({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <span className="mr-1 flex h-9 items-center gap-2 px-1 font-mono text-[11px] text-white/48 uppercase">
      {icon}
      {label}
    </span>
  )
}
