"use client"

import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"

const markerIcon = L.icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

type Props = {
  latitude: number
  longitude: number
  onChange: (coords: { latitude: number; longitude: number }) => void
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

export default function LocationPickerMap({ latitude, longitude, onChange }: Props) {
  return (
    <div className="location-picker-map overflow-hidden rounded-md border">
      <MapContainer
        center={[latitude, longitude]}
        zoom={14}
        scrollWheelZoom
        className="h-64 w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[latitude, longitude]}
          icon={markerIcon}
          draggable
          eventHandlers={{
            dragend(e) {
              const marker = e.target
              const { lat, lng } = marker.getLatLng()
              onChange({
                latitude: Number(lat.toFixed(6)),
                longitude: Number(lng.toFixed(6)),
              })
            },
          }}
        />
        <ClickHandler onChange={onChange} />
        <Recenter latitude={latitude} longitude={longitude} />
      </MapContainer>
      <style jsx global>{`
        .location-picker-map .leaflet-container {
          overflow: hidden;
        }
        .location-picker-map .leaflet-container img {
          max-width: none !important;
        }
        .location-picker-map .leaflet-pane,
        .location-picker-map .leaflet-top,
        .location-picker-map .leaflet-bottom {
          z-index: 1;
        }
      `}</style>
    </div>
  )
}

