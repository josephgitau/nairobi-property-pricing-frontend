'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface GeoPoint {
  slug: string
  name: string
  lat: number
  lon: number
  sale_median: number | null
  rent_median: number | null
}

interface Props {
  points: GeoPoint[]
  pin: { lat: number; lon: number } | null
  nearest: GeoPoint | null
  getTierColor: (v: number | null) => string
  onMapClick: (lat: number, lon: number) => void
}

const PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;
    background:var(--primary,#6366f1);
    border:3px solid white;
    transform:rotate(-45deg);
    box-shadow:0 4px 12px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng) } })
  return null
}

function FlyToNearest({ nearest }: { nearest: GeoPoint | null }) {
  const map = useMap()
  useEffect(() => {
    if (nearest) map.flyTo([nearest.lat, nearest.lon], map.getZoom(), { duration: 0.6 })
  }, [nearest, map])
  return null
}

export default function PriceMapLeaflet({ points, pin, nearest, getTierColor, onMapClick }: Props) {
  return (
    <MapContainer
      center={[-1.286389, 36.817223]}
      zoom={12}
      style={{ height: '100%', width: '100%', cursor: 'crosshair', background: '#0e1a2b' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
        maxZoom={19}
      />

      <ClickHandler onMapClick={onMapClick} />
      <FlyToNearest nearest={nearest} />

      {points.map(pt => {
        const isNearest = nearest?.slug === pt.slug
        return (
          <CircleMarker
            key={pt.slug}
            center={[pt.lat, pt.lon]}
            radius={isNearest ? 12 : 8}
            pathOptions={{
              fillColor: getTierColor(pt.sale_median),
              fillOpacity: isNearest ? 0.95 : 0.75,
              color: isNearest ? '#ffffff' : 'rgba(255,255,255,0.3)',
              weight: isNearest ? 3 : 1,
            }}
          >
            <Popup className="leaflet-dark-popup">
              <div className="text-xs font-bold mb-1">{pt.name.split(',')[0]}</div>
              {pt.sale_median != null && (
                <div>Sale: <strong>KES {(pt.sale_median / 1e6).toFixed(1)}M</strong></div>
              )}
              {pt.rent_median != null && (
                <div>Rent: <strong>KES {(pt.rent_median / 1000).toFixed(0)}K/mo</strong></div>
              )}
            </Popup>
          </CircleMarker>
        )
      })}

      {pin && (
        <Marker position={[pin.lat, pin.lon]} icon={PIN_ICON} />
      )}
    </MapContainer>
  )
}
