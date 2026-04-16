"use client"

import "leaflet/dist/leaflet.css"
import L from "leaflet"
import markerIconUrl from "leaflet/dist/images/marker-icon.png"
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png"
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png"
import { useEffect, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet"
import type { LocationPickerContextMarker } from "./location-picker-types"

const markerIcon = L.icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function contextDivIcon(label: string, background: string, border: string) {
  return L.divIcon({
    className: "location-picker-context-marker",
    html: `<div style="width:28px;height:28px;border-radius:9999px;background:${background};border:2px solid ${border};color:#fff;font-weight:700;font-size:12px;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgb(0 0 0 / 0.4);font-family:system-ui,sans-serif">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

const departureRefIcon = contextDivIcon("D", "#2563eb", "#1e3a8a")

const enigmaIcon = (n: number) =>
  contextDivIcon(String(n), "#ea580c", "#7c2d12")

const treasureIcon = contextDivIcon("T", "#059669", "#064e3b")

type Props = {
  latitude: number
  longitude: number
  onChange: (coords: { latitude: number; longitude: number }) => void
  contextMarkers?: LocationPickerContextMarker[]
  routePolyline?: [number, number][] | null
  /**
   * Marqueur du point édité : `departure` = pastille « D » (défaut : épingle Leaflet).
   */
  editableMarkerKind?: "default" | "departure"
  /** Si défini > 0, disque autour du point (mètres). */
  radiusMeters?: number | null
  /** Texte du popup du marqueur principal (défaut : aventure). */
  markerPopupLabel?: string
  /** Aucun clic ni déplacement : consultation uniquement */
  readOnly?: boolean
  /**
   * N’affiche pas le marqueur principal au centre (ex. carte accueil : tous les départs sont dans `contextMarkers`).
   */
  omitPrimaryMarker?: boolean
  className?: string
  /** Classes Tailwind pour le conteneur Leaflet (hauteur, etc.) */
  mapClassName?: string
}

function coordsNearlyEqual(a: number, b: number) {
  return Math.abs(a - b) < 1e-5
}

function ClickHandler({
  onChange,
}: {
  onChange: (coords: { latitude: number; longitude: number }) => void
}) {
  useMapEvents({
    click(e) {
      onChange({
        latitude: Number(e.latlng.lat.toFixed(6)),
        longitude: Number(e.latlng.lng.toFixed(6)),
      })
    },
  })
  return null
}

function Recenter({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap()
  map.setView([latitude, longitude])
  return null
}

/**
 * Boîte englobante d’un disque géodésique (rayon en mètres), sans attacher un L.Circle à la carte.
 * `L.circle(...).getBounds()` hors carte laisse `_map` à undefined et lève layerPointToLatLng.
 */
function latLngBoundsForRadiusMeters(
  lat: number,
  lng: number,
  radiusM: number
): L.LatLngBounds {
  const latRad = (lat * Math.PI) / 180
  const latDelta = radiusM / 111_320
  const cosLat = Math.cos(latRad)
  const lngDelta = radiusM / (111_320 * Math.max(Math.abs(cosLat), 1e-6))
  return L.latLngBounds(
    [lat - latDelta, lng - lngDelta],
    [lat + latDelta, lng + lngDelta]
  )
}

/** Cadre la carte sur le disque (rayon en mètres). */
function FitCircleBounds({
  latitude,
  longitude,
  radiusMeters,
}: {
  latitude: number
  longitude: number
  radiusMeters: number
}) {
  const map = useMap()
  useEffect(() => {
    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) return
    const b = latLngBoundsForRadiusMeters(latitude, longitude, radiusMeters)
    if (b.isValid()) {
      map.fitBounds(b, { padding: [28, 28], maxZoom: 14 })
    }
  }, [map, latitude, longitude, radiusMeters])
  return null
}

/**
 * Ajuste le cadre quand repères ou tracé changent (pas à chaque déplacement du point départ).
 */
function SmartFit({
  centerLat,
  centerLng,
  contextMarkers,
  routePolyline,
}: {
  centerLat: number
  centerLng: number
  contextMarkers: LocationPickerContextMarker[]
  routePolyline?: [number, number][] | null
}) {
  const map = useMap()
  const centerRef = useRef({ centerLat, centerLng })
  centerRef.current = { centerLat, centerLng }

  /* Ne pas inclure la polyline : à chaque recalcul ORS (aperçu) fitBounds reflotterait la carte,
   * pouvant perturber le marqueur et relancer des mises à jour en boucle. On cadre quand le point
   * édité ou les repères changent ; la ligne suit sans re-fit automatique. */
  const layoutKey = useMemo(() => {
    const ctx = contextMarkers
      .map((m) =>
        m.kind === "departure"
          ? `d:${m.adventureId ?? ""}:${m.latitude.toFixed(5)}:${m.longitude.toFixed(5)}`
          : m.kind === "enigma"
            ? `e:${m.id}:${m.number}:${m.latitude.toFixed(5)}:${m.longitude.toFixed(5)}`
            : `t:${m.latitude.toFixed(5)}:${m.longitude.toFixed(5)}`
      )
      .join("|")
    const c = `${centerLat.toFixed(5)},${centerLng.toFixed(5)}`
    return `${ctx}|c:${c}`
  }, [contextMarkers, centerLat, centerLng])

  useEffect(() => {
    const { centerLat: clat, centerLng: clng } = centerRef.current
    const tuples: L.LatLngTuple[] = [[clat, clng]]
    for (const m of contextMarkers) {
      tuples.push([m.latitude, m.longitude])
    }
    if (routePolyline && routePolyline.length >= 2) {
      for (const p of routePolyline) {
        tuples.push(p as L.LatLngTuple)
      }
    }

    const lineOnly =
      contextMarkers.length === 0 &&
      routePolyline &&
      routePolyline.length >= 2

    if (lineOnly) {
      const bounds = L.latLngBounds(routePolyline as L.LatLngTuple[])
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [52, 52], maxZoom: 16 })
      }
      return
    }

    if (contextMarkers.length === 0 && (!routePolyline || routePolyline.length < 2)) {
      return
    }

    const bounds = L.latLngBounds(tuples)
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [52, 52], maxZoom: 16 })
    }
  }, [map, layoutKey])

  return null
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  contextMarkers = [],
  routePolyline = null,
  editableMarkerKind = "default",
  radiusMeters = null,
  markerPopupLabel = "Point de départ de l'aventure",
  readOnly = false,
  omitPrimaryMarker = false,
  className,
  mapClassName,
}: Props) {
  const mapContextMarkers = useMemo(() => {
    if (editableMarkerKind !== "departure") return contextMarkers
    /* Édition : on évite le doublon « D » sur le point déplacé (marqueur principal).
     * Carte multi-départs (omitPrimaryMarker) : pas de marqueur principal → garder tous les départs. */
    if (omitPrimaryMarker) return contextMarkers
    return contextMarkers.filter((m) => {
      if (m.kind !== "departure") return true
      return !(
        coordsNearlyEqual(m.latitude, latitude) &&
        coordsNearlyEqual(m.longitude, longitude)
      )
    })
  }, [contextMarkers, latitude, longitude, editableMarkerKind, omitPrimaryMarker])

  const primaryIcon =
    editableMarkerKind === "departure" ? departureRefIcon : markerIcon

  const hasSmartFit =
    omitPrimaryMarker ||
    mapContextMarkers.length > 0 ||
    (routePolyline && routePolyline.length >= 2)

  const showCircle =
    radiusMeters != null &&
    Number.isFinite(radiusMeters) &&
    radiusMeters > 0

  return (
    <div
      className={cn(
        "location-picker-map overflow-hidden rounded-none border",
        className
      )}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={14}
        scrollWheelZoom
        className={cn("h-64 w-full z-0", mapClassName)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasSmartFit ? (
          <SmartFit
            centerLat={latitude}
            centerLng={longitude}
            contextMarkers={mapContextMarkers}
            routePolyline={routePolyline}
          />
        ) : showCircle ? (
          <FitCircleBounds
            latitude={latitude}
            longitude={longitude}
            radiusMeters={radiusMeters!}
          />
        ) : (
          <Recenter latitude={latitude} longitude={longitude} />
        )}
        {routePolyline && routePolyline.length >= 2 ? (
          <Polyline
            positions={routePolyline}
            pathOptions={{
              color: "#1d4ed8",
              weight: 5,
              opacity: 0.9,
              lineJoin: "round",
              lineCap: "round",
            }}
          />
        ) : null}
        {mapContextMarkers.map((m) =>
          m.kind === "departure" ? (
            <Marker
              key={`departure-${m.adventureId ?? `${m.latitude}-${m.longitude}`}`}
              position={[m.latitude, m.longitude]}
              icon={departureRefIcon}
            >
              <Tooltip
                direction="top"
                offset={[0, -12]}
                opacity={1}
                className="rounded-md border border-white/15 bg-[#281401] px-2 py-1.5 text-white shadow-lg"
              >
                <div className="max-w-56 space-y-0.5 text-xs leading-snug">
                  <p className="font-semibold">{m.name?.trim() || "Aventure"}</p>
                  {m.distanceKm != null && Number.isFinite(m.distanceKm) ? (
                    <p className="font-normal opacity-95">
                      Parcours ~{m.distanceKm.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km
                    </p>
                  ) : null}
                  {m.averageRating != null && Number.isFinite(m.averageRating) ? (
                    <p className="font-normal opacity-95">
                      Note moyenne {m.averageRating.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/5
                    </p>
                  ) : null}
                </div>
              </Tooltip>
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-[#281401]">{m.name?.trim() || "Aventure"}</p>
                  {m.distanceKm != null && Number.isFinite(m.distanceKm) ? (
                    <p>Distance du parcours : ~{m.distanceKm.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</p>
                  ) : null}
                  {m.averageRating != null && Number.isFinite(m.averageRating) ? (
                    <p>Note moyenne : {m.averageRating.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/5</p>
                  ) : (
                    <p className="text-muted-foreground">Pas encore d&apos;avis publié avec note.</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ) : m.kind === "enigma" ? (
            <Marker
              key={`enigma-${m.id}`}
              position={[m.latitude, m.longitude]}
              icon={enigmaIcon(m.number)}
            >
              <Popup>
                <span className="text-sm">
                  Énigme {m.number} — {m.name}
                </span>
              </Popup>
            </Marker>
          ) : (
            <Marker
              key={`treasure-${m.latitude}-${m.longitude}`}
              position={[m.latitude, m.longitude]}
              icon={treasureIcon}
            >
              <Popup>
                <span className="text-sm">Trésor — {m.name}</span>
              </Popup>
            </Marker>
          )
        )}
        {showCircle ? (
          <Circle
            center={[latitude, longitude]}
            radius={radiusMeters!}
            pathOptions={{
              color: "#7c3aed",
              weight: 2,
              fillColor: "#a78bfa",
              fillOpacity: 0.12,
            }}
          />
        ) : null}
        {omitPrimaryMarker ? null : (
          <Marker
            position={[latitude, longitude]}
            icon={primaryIcon}
            draggable={!readOnly}
            eventHandlers={
              readOnly
                ? undefined
                : {
                    dragend(e) {
                      const marker = e.target
                      const { lat, lng } = marker.getLatLng()
                      onChange({
                        latitude: Number(lat.toFixed(6)),
                        longitude: Number(lng.toFixed(6)),
                      })
                    },
                  }
            }
          >
            <Popup>
              <span className="text-sm">{markerPopupLabel}</span>
            </Popup>
          </Marker>
        )}
        {readOnly ? null : <ClickHandler onChange={onChange} />}
      </MapContainer>
      <style jsx global>{`
        .location-picker-map .leaflet-container {
          overflow: hidden;
        }
        .location-picker-map .leaflet-container img {
          max-width: none !important;
        }
        /* Ne pas forcer z-index sur .leaflet-pane : Leaflet dépend des couches (tuile / overlay / marqueurs).
         * Abaisser seulement les barres de contrôle pour qu’elles passent sous les modales (z-50). */
        .location-picker-map .leaflet-top,
        .location-picker-map .leaflet-bottom {
          z-index: 40;
        }
        /* Évite tuiles invisibles ou artefacts selon zoom / contexte d’empilement (blend + parents isolés). */
        .location-picker-map .leaflet-container img.leaflet-tile {
          mix-blend-mode: normal !important;
        }
        .location-picker-map .location-picker-context-marker {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  )
}
