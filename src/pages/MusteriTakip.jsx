import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 14, { animate: true });
    }
  }, [coords]);
  return null;
}

const courierIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3004/3004739.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

export default function MusteriTakip() {
  const [trackingNo, setTrackingNo] = useState('');
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shipment || shipment.status !== 'IN_TRANSIT') return;

    const interval = setInterval(async () => {
      try {
        const data = await ApiService.trackShipmentByCustomer(shipment.trackingNumber);
        setShipment(data);
      } catch (err) {
        console.error('Canlı konum senkronizasyon hatası:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [shipment]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!trackingNo.trim()) return;
    
    setLoading(true);
    setError('');
    setShipment(null);

    try {
      const data = await ApiService.trackShipmentByCustomer(trackingNo.trim());
      setShipment(data);
    } catch (err) {
      setError('Kargo bulunamadı. Lütfen takip numarasını kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    if (status === 'HUB_TRANSFER') return 'ŞEHİRLER ARASI SEVKİYATTA';
    if (status === 'PENDING') return 'MERKEZ ŞUBEDE / HAZIRLANIYOR';
    if (status === 'IN_TRANSIT') return 'KURYEDE / DAĞITIMDA';
    if (status === 'DELIVERED') return 'TESLİM EDİLDİ';
    return status;
  };

  return (
    <div className="track-container">
      
      <style>{`
        .track-container {
          display: flex;
          flex: 1;
          height: calc(100vh - 70px);
          overflow: hidden;
          background: #070a13;
          color: #cbd5e1;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .search-input::placeholder { color: #4b5563; }
        
        .cyber-card-blink {
          background: rgba(30, 41, 59, 0.25) !important;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(59, 130, 246, 0.15) !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.4) !important;
          animation: luxuryNeonBlink 3s infinite ease-in-out;
        }

        .cyber-card {
          background: rgba(30, 41, 59, 0.4) !important;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.4) !important;
        }

        .luxury-button {
          background: #2563eb;
          color: white;
          border: none;
          padding: 0 20px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
        }

        .route-line-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          padding: 20px 10px 10px;
        }
        .route-base-line {
          position: absolute;
          left: 12%;
          right: 12%;
          top: 29px;
          height: 3px;
          background: #1e293b;
          z-index: 1;
        }
        .route-progress-line {
          position: absolute;
          left: 12%;
          right: 50%;
          top: 29px;
          height: 3px;
          background: linear-gradient(90deg, #10b981, #8b5cf6);
          box-shadow: 0 0 8px #8b5cf6;
          z-index: 1;
        }
        .node-label {
          font-size: 11px;
          display: block;
          margin-top: 8px;
          font-weight: 600;
        }

        @media (max-width: 992px) {
          .track-container { flex-direction: column; overflow-y: auto; }
          .sidebar-panel { width: 100% !important; height: auto !important; overflow-y: visible !important; border-right: none !important; border-bottom: 1px solid #141b2d; }
          .map-panel { height: 400px !important; flex: none !important; }
        }

        @keyframes luxuryNeonBlink {
          0% { border-color: rgba(59, 130, 246, 0.15); box-shadow: 0 10px 35px rgba(0, 0, 0, 0.4); }
          50% { border-color: rgba(37, 99, 235, 0.4); box-shadow: 0 0 20px rgba(37, 99, 235, 0.15); }
          100% { border-color: rgba(59, 130, 246, 0.15); box-shadow: 0 10px 35px rgba(0, 0, 0, 0.4); }
        }
        @keyframes flowPulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; filter: drop-shadow(0 0 4px #10b981); }
          100% { opacity: 0.4; }
        }
      `}</style>

      {/* 📂 SOL PANEL */}
      <aside className="sidebar-panel" style={{ width: '450px', background: '#05070f', borderRight: '1px solid #141b2d', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 10, overflowY: 'auto' }}>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#f3f4f6', margin: 0, textTransform: 'uppercase', letterSpacing: '0.75px' }}>EcoLogix Cargo Track</h2>
          </div>
          <p style={{ fontSize: '11px', color: '#4b5563', margin: '4px 0 0', fontWeight: '500' }}>Müşteri anlık gönderi sorgulama portalı.</p>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text"
            className="search-input"
            placeholder="Kargo Takip Numarası (Örn: TRK-2B9E193F)"
            value={trackingNo}
            onChange={(e) => setTrackingNo(e.target.value)}
            style={{ flex: 1, background: '#0a0d1a', border: '1px solid #1e293b', color: '#f3f4f6', padding: '13px 14px', borderRadius: '10px', fontSize: '13px', outline: 'none' }}
          />
          <button type="submit" disabled={loading} className="luxury-button">
            {loading ? '...' : 'Sorgula'}
          </button>
        </form>

        {error && <div style={{ color: '#ef4444', fontSize: '12px', background: 'rgba(239, 68, 68, 0.04)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.15)', fontWeight: '600' }}>{error}</div>}

        {shipment ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* GÜNCEL DURUM */}
            <div className="cyber-card-blink" style={{ padding: '16px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GÜNCEL DURUM</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: shipment.status === 'DELIVERED' ? '#10b981' : '#f59e0b', marginTop: '6px', letterSpacing: '0.5px' }}>
                {getStatusText(shipment.status)}
              </div>
            </div>

            {/* MÜŞTERI ODAKLI BILGI KÜNYESI */}
            <div style={{ background: '#090d16', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div><span style={{ color: '#4b5563', fontSize: '11px', fontWeight: '600', display: 'block' }}>Gönderici Taraf:</span><span style={{ fontWeight: '600', color: '#cbd5e1' }}>{shipment.senderName}</span></div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '8px' }}><span style={{ color: '#4b5563', fontSize: '11px', fontWeight: '600', display: 'block' }}>Alıcı Ad Soyad:</span><span style={{ fontWeight: '600', color: '#cbd5e1' }}>{shipment.receiverName}</span></div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '8px' }}><span style={{ color: '#4b5563', fontSize: '11px', fontWeight: '600', display: 'block' }}>Lojistik Hattı:</span><span style={{ fontWeight: '700', color: '#2563eb' }}>{shipment.originCity} → {shipment.destinationCity}</span></div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '8px' }}><span style={{ color: '#4b5563', fontSize: '11px', fontWeight: '600', display: 'block' }}>Paket Kütlesi:</span><span style={{ fontWeight: '600', color: '#10b981' }}>{shipment.weight ? `${shipment.weight} kg` : '-'}</span></div>
            </div>

            {/* BIZZAT BACKENDDEN GELEN ŞEHIRLERE GÖRE ÇIZILEN TRANSFER HATTI */}
            <div className="cyber-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>KARGO TAKİP</div>
              <div className="route-line-container">
                <div className="route-base-line" />
                <div className="route-progress-line" style={{ right: shipment.status === 'HUB_TRANSFER' ? '50%' : '12%' }} />
                
                <div style={{ textAlign: 'center', zIndex: 2 }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', margin: '0 auto', boxShadow: '0 0 10px #10b981' }} />
                  <span className="node-label" style={{ color: '#cbd5e1' }}>{shipment.originCity}</span>
                </div>
                
                <div style={{ textAlign: 'center', zIndex: 2 }}>
                  <div className={shipment.status === 'HUB_TRANSFER' ? "pulse-node-purple" : ""} style={{ width: '14px', height: '14px', borderRadius: '50%', background: shipment.status !== 'HUB_TRANSFER' ? '#10b981' : '#8b5cf6', margin: '0 auto', border: '2px solid #070a13', boxShadow: shipment.status !== 'HUB_TRANSFER' ? '0 0 10px #10b981' : 'none' }} />
                  <span className="node-label" style={{ color: shipment.status === 'HUB_TRANSFER' ? '#8b5cf6' : '#cbd5e1' }}>{shipment.currentHub || 'Aktarma'}</span>
                </div>
                
                <div style={{ textAlign: 'center', zIndex: 2 }}>
                  <div className={(shipment.status === 'PENDING' || shipment.status === 'IN_TRANSIT' || shipment.status === 'DELIVERED') ? "pulse-node-green" : ""} style={{ width: '12px', height: '12px', borderRadius: '50%', background: shipment.status === 'DELIVERED' ? '#10b981' : (shipment.status === 'PENDING' || shipment.status === 'IN_TRANSIT' ? '#f59e0b' : '#121824'), margin: '0 auto', border: '2px solid #1e293b' }} />
                  <span className="node-label" style={{ color: shipment.status === 'DELIVERED' ? '#10b981' : ((shipment.status === 'PENDING' || shipment.status === 'IN_TRANSIT') ? '#f59e0b' : '#4b5563') }}>{shipment.destinationCity}</span>
                </div>
              </div>
            </div>

            {/* 📋 GEREKSIZ YAZILARDAN ARINMIŞ SADECE GÜNCEL BACKEND VERILI SÜREÇ AKIŞI */}
            <div className="cyber-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                GÖNDERİ YOLCULUK AKIŞI
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '4px' }}>
                
                {/* Durak 1 */}
                <div style={{ display: 'flex', gap: '14px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '5px', top: '14px', bottom: '-14px', width: '2px', background: '#10b981' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', zIndex: 2, boxShadow: '0 0 8px #10b981' }} />
                  <div style={{ paddingBottom: '18px', fontSize: '12px' }}>
                    <div style={{ fontWeight: '700', color: '#cbd5e1' }}>Kargo Kabul Edildi</div>
                    <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '3px' }}>{shipment.originCity}</div>
                  </div>
                </div>

                {/* Durak 2 */}
                <div style={{ display: 'flex', gap: '14px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '5px', top: '14px', bottom: '-14px', width: '2px', background: shipment.status !== 'HUB_TRANSFER' ? '#10b981' : '#1e293b' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: shipment.status !== 'HUB_TRANSFER' ? '#10b981' : '#8b5cf6', zIndex: 2, boxShadow: shipment.status === 'HUB_TRANSFER' ? '0 0 8px #8b5cf6' : 'none' }} />
                  <div style={{ paddingBottom: '18px', fontSize: '12px' }}>
                    <div style={{ fontWeight: '700', color: shipment.status === 'HUB_TRANSFER' ? '#8b5cf6' : '#cbd5e1' }}>Ana Aktarma Merkezinde</div>
                    <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '3px' }}>{shipment.currentHub}</div>
                  </div>
                </div>

                {/* Durak 3 */}
                <div style={{ display: 'flex', gap: '14px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '5px', top: '14px', bottom: '-14px', width: '2px', background: shipment.status === 'IN_TRANSIT' || shipment.status === 'DELIVERED' ? '#10b981' : '#1e293b' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: shipment.status === 'PENDING' ? '#f59e0b' : (shipment.status === 'IN_TRANSIT' || shipment.status === 'DELIVERED' ? '#10b981' : '#070a12'), border: shipment.status === 'HUB_TRANSFER' ? '2px solid #334155' : 'none', zIndex: 2, boxShadow: shipment.status === 'PENDING' ? '0 0 8px #f59e0b' : 'none' }} />
                  <div style={{ paddingBottom: '18px', fontSize: '12px' }}>
                    <div style={{ fontWeight: '700', color: shipment.status === 'PENDING' ? '#f59e0b' : (shipment.status === 'HUB_TRANSFER' ? '#4b5563' : '#cbd5e1') }}>Varış Dağıtım Merkezinde</div>
                    <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '3px' }}>{shipment.destinationCity} Şubesi</div>
                  </div>
                </div>

                {/* Durak 4 */}
                <div style={{ display: 'flex', gap: '14px', position: 'relative' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: shipment.status === 'IN_TRANSIT' ? '#10b981' : (shipment.status === 'DELIVERED' ? '#10b981' : '#070a12'), border: shipment.status === 'DELIVERED' || shipment.status === 'IN_TRANSIT' ? 'none' : '2px solid #334155', zIndex: 2, animation: shipment.status === 'IN_TRANSIT' ? 'flowPulse 2s infinite' : 'none' }} />
                  <div style={{ fontSize: '12px' }}>
                    <div style={{ fontWeight: '700', color: shipment.status === 'IN_TRANSIT' ? '#10b981' : (shipment.status === 'DELIVERED' ? '#cbd5e1' : '#4b5563') }}>Kurye Dağıtıma Çıktı</div>
                    <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '3px' }}>
                      {shipment.status === 'IN_TRANSIT' ? `Dağıtım Sorumlusu: ${shipment.courierName || 'Kurye'}` : (shipment.status === 'DELIVERED' ? 'Teslimat Başarıyla Gerçekleşti.' : 'Transfer Onayı Bekleniyor.')}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#475569', fontSize: '12px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.03)', borderRadius: '14px', padding: '20px' }}>
            <span style={{ color: '#2563eb', fontWeight: '700', fontSize: '10px', marginBottom: '4px' }}>AWAITING VERIFICATION</span>
            Sistemdeki aktif gönderiyi listelemek için takip kodunu girin.
          </div>
        )}
      </aside>

      {/* 🗺️ HARİTA PANELİ */}
      <main className="map-panel" style={{ flex: 1, position: 'relative', background: '#090d16' }}>
        {shipment && shipment.status === 'IN_TRANSIT' && shipment.courierLat ? (
          <MapContainer center={[shipment.courierLat, shipment.courierLon]} zoom={14} style={{ width: '100%', height: '100%', background: '#070a13' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
            <Marker position={[shipment.courierLat, shipment.courierLon]} icon={courierIcon}>
              <Popup>
                <div style={{ color: '#020617', fontWeight: '600', fontSize: '12px' }}>
                  <span style={{ fontWeight: '800' }}>{shipment.courierName}</span><br/>
                  <span style={{ color: '#2563eb', marginTop: '2px', display: 'block' }}>Kargonuz Dağıtımda!</span>
                </div>
              </Popup>
            </Marker>
            <RecenterMap coords={[shipment.courierLat, shipment.courierLon]} />
          </MapContainer>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#334155', gap: '10px', padding: '20px', boxSizing: 'border-box' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', maxWidth: '320px', textAlign: 'center', lineheight: '1.6' }}>
              {shipment && shipment.status !== 'IN_TRANSIT' 
                ? `${shipment.destinationCity} ambarına makro hat transferi devam ediyor. Canlı takip sinyali dağıtım anında aktifleşecektir.` 
                : 'Canlı harita konumu için kurye GPS sinyali bekleniyor.'}
            </span>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', padding: '10px 16px', borderRadius: '8px', fontSize: '11px', color: '#10b981', zIndex: 1000, border: '1px solid rgba(16, 185, 129, 0.15)', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          🟢 Live Tracking Engine
        </div>
      </main>

    </div>
  );
}