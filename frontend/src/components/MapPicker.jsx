import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function LocationMarker({ position, onLocationChange, readOnly }) {
  useMapEvents({
    click(e) {
      if (readOnly) return

      onLocationChange({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      })
    },
  })

  return position ? <Marker position={position} /> : null
}

export default function MapPicker({
  latitude,
  longitude,
  onLocationChange,
  readOnly = false,
}) {
  const hasPosition =
    latitude !== '' &&
    latitude !== null &&
    latitude !== undefined &&
    longitude !== '' &&
    longitude !== null &&
    longitude !== undefined

  const position = hasPosition
    ? [Number(latitude), Number(longitude)]
    : [20.5937, 78.9629]

  return (
    <MapContainer
      center={position}
      zoom={hasPosition ? 15 : 5}
      scrollWheelZoom={!readOnly}
      style={{
        height: '350px',
        width: '100%',
        borderRadius: '12px',
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LocationMarker
        position={hasPosition ? position : null}
        onLocationChange={onLocationChange}
        readOnly={readOnly}
      />
    </MapContainer>
  )
}