import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 🚚 CANLI TAKİP MODUNA UYGUN TASARIM: NAVİGASYON YEŞİLİ ARAÇ İKONU
const courierIcon = L.divIcon({
  className: 'custom-courier-icon',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
      <div style="
        position: absolute;
        width: 38px;
        height: 38px;
        background: rgba(16, 185, 129, 0.4);
        border-radius: 50%;
        filter: blur(4px);
        animation: pulseAnimation 2s infinite;
      "></div>
      
      <div style="
        position: relative;
        zIndex: 2;
        background: #064e3b;
        border: 2px solid #10b981;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.6);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

// 🌟 RENK DENGESİ: Durak Etiketlerini Sol Panel ile Senkronize Kehribar/Toprak (#f59e0b) Tonuna Çektik
const shipmentIcon = (index) => L.divIcon({
  className: 'custom-shipment-icon',
  html: `
    <div style="
      width: 26px;
      height: 26px;
      background: #0f172a;
      color: #f59e0b;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      box-shadow: 0 0 12px rgba(245,158,11,0.3);
      border: 2px solid #f59e0b;
    ">
      ${index}
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

// Haritayı Otomatik Odaklayan Mekanizma
function FitRouteBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (!positions || positions.length < 2) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });
  }, [positions, map]);
  return null;
}

export default function MapComponent({ courier, shipments }) {
  const defaultCenter = [38.7205, 35.4826]; // Kayseri Merkez
  const [actualRouteGeometry, setActualRouteGeometry] = useState([]);

  // Durakları teslimat sırasına göre sırala
  const sortedShipments = [...(shipments || [])].sort((a, b) => (a.deliveryIndex ?? 999) - (b.deliveryIndex ?? 999));

  // Backend'den gelen kurye koordinatları
  const courierPosition = courier?.currentLat && courier?.currentLon 
    ? [Number(courier.currentLat), Number(courier.currentLon)] 
    : null;

  // 🌟 HATA DÜZELTİLDİ: Kurye Takip sayfasında paketler IN_TRANSIT durumunda olduğu için 
  // filtreyi hem PENDING hem de IN_TRANSIT paketleri destekleyecek şekilde genişlettik!
  const shipmentPositions = sortedShipments
    .filter((s) => s.lat && s.lon && (s.status === 'PENDING' || s.status === 'IN_TRANSIT'))
    .map((s) => [Number(s.lat), Number(s.lon)]);

  // OSRM Canlı Gerçek Yol Navigasyon Çizim Motoru
  useEffect(() => {
    if (!courierPosition || shipmentPositions.length === 0) {
      setActualRouteGeometry([]);
      return;
    }

    // Kurye konumundan başlayarak sıradaki tüm teslimat noktalarını gerçek sokak haritası üzerinden bağlıyoruz
    const allCoords = [courierPosition, ...shipmentPositions];
    const coordString = allCoords.map(pos => `${pos[1]},${pos[0]}`).join(';');

    fetch(`https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          const streetPoints = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setActualRouteGeometry(streetPoints);
        }
      })
      .catch(err => console.error("Yol haritası çizilemedi:", err));
  }, [courier?.currentLat, courier?.currentLon, shipments]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      
      <style>{`
        @keyframes pulseAnimation {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 0.4; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
      `}</style>

      <MapContainer
        center={courierPosition || defaultCenter}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Kaliteli Koyu Tema */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {courierPosition && <FitRouteBounds positions={[courierPosition, ...shipmentPositions]} />}

        {/* 🚀 🌟 İSTEK: KALIN VE ŞEFFAF GERÇEK YOL ÇİZGİSİ (OSRM Navigasyon Destekli) */}
        {actualRouteGeometry.length > 0 && (
          <Polyline
            positions={actualRouteGeometry}
            pathOptions={{
              color: '#10b981',    // Canlı şeffaf yeşil (Eko teması)
              weight: 7,           // Kalın, göze çarpan profesyonel hat çizgisi
              opacity: 0.35,       // Göz yormayan, arkasını gösteren şeffaf neon katmanı
              lineJoin: 'round',
              lineCap: 'round'
            }}
          />
        )}

        {/* 🚚 CANLI KURYE MARKER'I */}
        {courierPosition && (
          <Marker position={courierPosition} icon={courierIcon}>
            <Popup>
              <div style={{ fontSize: '13px', color: '#f3f4f6', minWidth: '160px', padding: '2px' }}>
                <strong style={{ color: '#10b981', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                  {courier.name || 'Aktif Kurye'}
                </strong>
                <div style={{ borderTop: '1px solid #374151', paddingTop: '4px', lineHeight: '1.6', color: '#000' }}>
                  <strong>Araç Tipi:</strong> {courier.vehicleType || 'Elektrikli Motor'}<br />
                  <strong>Durum:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>Dağıtımda</span><br />
                  <strong>Enlem:</strong> {Number(courier.currentLat).toFixed(4)}<br />
                  <strong>Boylam:</strong> {Number(courier.currentLon).toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Sıralı Duraklar */}
        {sortedShipments.map((s, idx) => {
          if (!s.lat || !s.lon) return null;
          const position = [Number(s.lat), Number(s.lon)];
          const number = s.deliveryIndex || idx + 1;

          return (
            <Marker key={s.id || idx} position={position} icon={shipmentIcon(number)}>
              <Popup>
                <div style={{ fontSize: '12px', color: '#000' }}>
                  <strong>{number}. Durak</strong><br />
                  Müşteri: {s.receiverName}<br />
                  Adres: {s.deliveryAddress}<br />
                  Statü: {s.status === 'IN_TRANSIT' ? 'Dağıtımda' : s.status}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 1000, background: 'rgba(17, 24, 39, 0.9)', color: '#3b82f6', padding: '8px 14px', borderRadius: '8px', border: '1px solid #1e293b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
        🛰️ ECO_LINK: REAL-TIME NAVIGATION LAYER
      </div>
    </div>
  );
}