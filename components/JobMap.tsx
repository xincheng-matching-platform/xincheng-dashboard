'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 1. 定義職缺型別
interface Job {
  company: string;
  location: string;
  coords?: { lat: number; lng: number } | null;
  system: string;
}

// 2. 定義組件參數型別
interface JobMapProps {
  jobs: Job[];
}

// 修正 Leaflet 圖示在 Next.js 中的路徑問題
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// 自動縮放至標記點的輔助組件
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function JobMap({ jobs }: JobMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 過濾出有座標的職缺
  const jobsWithCoords = jobs.filter(job => job.coords && job.coords.lat && job.coords.lng);
  
  // 預設中心點 (台北市)
  const defaultCenter: [number, number] = [25.0330, 121.5654];

  if (!mounted) return <div className="h-[400px] bg-slate-100 animate-pulse rounded-[2.5rem]" />;

  return (
    <div className="h-[400px] w-full relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        scrollWheelZoom={false}
        className="h-full w-full rounded-[2rem]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {jobsWithCoords.map((job, idx) => (
          <Marker 
            key={idx} 
            position={[job.coords!.lat, job.coords!.lng]} 
            icon={DefaultIcon}
          >
            <Popup>
              <div className="p-1">
                <p className="font-black text-blue-600 mb-1">{job.company}</p>
                <p className="text-[10px] text-gray-500">{job.location}</p>
                <span className="inline-block mt-2 text-[8px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-bold">
                  {job.system}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {jobsWithCoords.length > 0 && (
          <ChangeView 
            center={[jobsWithCoords[0].coords!.lat, jobsWithCoords[0].coords!.lng]} 
            zoom={13} 
          />
        )}
      </MapContainer>
    </div>
  );
}