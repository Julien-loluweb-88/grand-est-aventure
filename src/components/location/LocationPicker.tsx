"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { LocationPickerContextMarker } from "./location-picker-types"

export type { LocationPickerContextMarker } from "./location-picker-types"

const Map = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full animate-pulse rounded-md border bg-muted" />
  ),
})

type AdresseFeature = {
  geometry?: {
    coordinates?: [number, number]
  }
  properties?: {
    label?: string
  }
}

type Props = {
  latitude: number
  longitude: number
  onChange: (coords: { latitude: number; longitude: number }) => void
  helperText?: string
  /** Points en lecture seule (énigmes numérotées, trésor), style distinct du marqueur d’édition. */
  contextMarkers?: LocationPickerContextMarker[]
  /** Tracé routier ORS [lat, lng], ordre départ → énigmes → trésor. */
  routePolyline?: [number, number][] | null
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  helperText = "Cliquez sur la carte ou recherchez une adresse.",
  contextMarkers,
  routePolyline,
}: Props) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<
    Array<{ label: string; latitude: number; longitude: number }>
  >([])

  const isValidCoords = useMemo(
    () =>
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180,
    [latitude, longitude]
  )

  const effectiveLatitude = isValidCoords ? latitude : 48.4072318295932
  const effectiveLongitude = isValidCoords ? longitude : 6.843844487240165

  const fetchAddressSuggestions = async (q: string) => {
    const response = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5`
    )
    if (!response.ok) {
      throw new Error("Impossible de joindre le service d'adresse.")
    }
    const json = (await response.json()) as { features?: AdresseFeature[] }
    const nextSuggestions = (json.features ?? [])
      .map((feature) => {
        const coords = feature.geometry?.coordinates
        const label = feature.properties?.label ?? ""
        return {
          label,
          latitude: coords?.[1],
          longitude: coords?.[0],
        }
      })
      .filter(
        (item): item is { label: string; latitude: number; longitude: number } =>
          Boolean(item.label) &&
          Number.isFinite(item.latitude) &&
          Number.isFinite(item.longitude)
      )

    return nextSuggestions
  }

  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setSuggestions([])
      return
    }
    const timeout = setTimeout(() => {
      void (async () => {
        try {
          setError(null)
          const nextSuggestions = await fetchAddressSuggestions(q)
          setSuggestions(nextSuggestions)
        } catch (e) {
          setSuggestions([])
          setError(e instanceof Error ? e.message : "Erreur lors de la recherche.")
        }
      })()
    }, 250)

    return () => clearTimeout(timeout)
  }, [query])

  const handleSearch = async () => {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    try {
      const nextSuggestions = await fetchAddressSuggestions(q)
      setSuggestions(nextSuggestions)
      if (nextSuggestions.length === 0) {
        setError("Aucun résultat trouvé.")
        return
      }
      const first = nextSuggestions[0]
      onChange({
        latitude: Number(first.latitude.toFixed(6)),
        longitude: Number(first.longitude.toFixed(6)),
      })
      setQuery(first.label)
      setSuggestions([])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la recherche.")
    } finally {
      setLoading(false)
    }
  }

  const handleUseMyLocation = () => {
    setError(null)
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur ce navigateur.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        })
      },
      (geoError) => {
        setError(geoError.message || "Impossible de récupérer votre position.")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setError(null)
          }}
          placeholder="Rechercher une adresse ou un lieu"
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              void handleSearch()
            }
          }}
        />
        <Button type="button" variant="outline" onClick={() => void handleSearch()} disabled={loading}>
          {loading ? "Recherche..." : "Rechercher"}
        </Button>
        <Button type="button" onClick={handleUseMyLocation}>
          Ma position
        </Button>
      </div>
      {suggestions.length > 0 && (
        <div className="rounded-md border bg-background">
          <ul className="max-h-48 overflow-y-auto py-1">
            {suggestions.map((item) => (
              <li key={`${item.label}-${item.latitude}-${item.longitude}`}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    onChange({
                      latitude: Number(item.latitude.toFixed(6)),
                      longitude: Number(item.longitude.toFixed(6)),
                    })
                    setQuery(item.label)
                    setSuggestions([])
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{helperText}</p>
      <Map
        latitude={effectiveLatitude}
        longitude={effectiveLongitude}
        onChange={onChange}
        contextMarkers={contextMarkers}
        routePolyline={routePolyline}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

