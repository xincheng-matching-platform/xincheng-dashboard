'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 修正 Leaflet 圖示在 Next.js 中的路徑問題
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function JobMap({ jobs }) {
  return (
    <div className="h-[400px] w-full rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl relative z-0">
      <MapContainer 
        center={[25.033, 121.565]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {jobs?.filter(j => j.coords).map((job, idx) => (
          <Marker 
            key={idx} 
            position={[job.coords.lat, job.coords.lng]} 
            icon={icon}
          >
            <Popup>
              <div className="font-bold text-blue-600">{job.company}</div>
              <div className="text-xs">{job.location}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}