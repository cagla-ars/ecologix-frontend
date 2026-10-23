import { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import MapComponent from '../components/MapComponent';

export default function KuryeTakip() {
  const [couriers, setCouriers] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [activeCourier, setActiveCourier] = useState(null);
  const [activeRoute, setActiveRoute] = useState([]);
  const [lastSignal, setLastSignal] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCouriers();
  }, []);

  const loadCouriers = async () => {
    try {
      setLoading(true);
      const list = await ApiService.getAllCouriers();
      setCouriers(list || []);

      if (list && list.length > 0) {
        setSelectedId(String(list[0].id));
        setActiveCourier(list[0]);
      }
    } catch (error) {
      console.error('Kuryeler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedId) return;

    const fetchLiveData = async () => {
      try {
        const list = await ApiService.getAllCouriers();
        const current = list.find((c) => String(c.id) === String(selectedId));

        if (current) {
          setActiveCourier((prev) => {
            if (
              prev &&
              prev.id === current.id &&
              prev.status === current.status &&
              prev.currentLat === current.currentLat &&
              prev.currentLon === current.currentLon
            ) {
              return prev;
            }

            return current;
          });
        }

        const routeData = await ApiService.getActiveRoute(selectedId);
        const sortedRoute = [...(routeData || [])].sort(
          (a, b) => (a.deliveryIndex || 0) - (b.deliveryIndex || 0)
        );

        setActiveRoute((prev) => {
          const prevKey = JSON.stringify(
            prev.map((s) => ({
              id: s.id,
              deliveryIndex: s.deliveryIndex,
              status: s.status,
              lat: s.lat,
              lon: s.lon
            }))
          );

          const nextKey = JSON.stringify(
            sortedRoute.map((s) => ({
              id: s.id,
              deliveryIndex: s.deliveryIndex,
              status: s.status,
              lat: s.lat,
              lon: s.lon
            }))
          );

          return prevKey === nextKey ? prev : sortedRoute;
        });

        setLastSignal(new Date());
      } catch (error) {
        console.error('Canlı takip verileri alınamadı:', error);
      }
    };

    fetchLiveData();

    const interval = setInterval(fetchLiveData, 4000);
    return () => clearInterval(interval);
  }, [selectedId]);

  const handleCourierChange = (e) => {
    const id = e.target.value;
    setSelectedId(id);

    const current = couriers.find((c) => String(c.id) === String(id));
    setActiveCourier(current || null);
    setActiveRoute([]);
    setLastSignal(null);
  };

  const formatStatus = (status) => {
    if (status === 'ON_DELIVERY') return 'DAĞITIMDA';
    if (status === 'AVAILABLE') return 'MÜSAİT';
    if (status === 'BUSY') return 'MEŞGUL';
    return status || '-';
  };

  const formatVehicle = (type) => {
    switch (type) {
      case 'ELECTRIC':
        return 'Elektrikli';
      case 'DIESEL':
        return 'Dizel';
      case 'GASOLINE':
        return 'Benzinli';
      case 'HYBRID':
        return 'Hibrit';
      case 'MOTORCYCLE':
        return 'Motosiklet';
      default:
        return type || '-';
    }
  };

  const activeTarget = activeRoute.length > 0 ? activeRoute[0] : null;
  const isOnDelivery = activeCourier?.status === 'ON_DELIVERY';
  const completedCount = activeRoute.filter((s) => s.status === 'DELIVERED').length;
  const totalRouteCount = activeRoute.length;
  const progressPercent =
    totalRouteCount > 0 ? Math.round((completedCount / totalRouteCount) * 100) : 0;

  return (
    <div className="tracking-page">
      <style>{`
        .tracking-page {
          height: calc(100vh - 70px);
          display: grid;
          grid-template-columns: 430px minmax(0, 1fr);
          background:
            radial-gradient(circle at 18% 22%, rgba(16,185,129,.10), transparent 34%),
            radial-gradient(circle at 45% 90%, rgba(59,130,246,.08), transparent 36%),
            #050914;
          color: #e5e7eb;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        @keyframes softPulse {
          0% {
            box-shadow: 0 0 10px rgba(16,185,129,.06), inset 0 0 18px rgba(255,255,255,.015);
            border-color: rgba(45,212,191,.13);
          }
          50% {
            box-shadow: 0 0 24px rgba(16,185,129,.16), inset 0 0 22px rgba(255,255,255,.025);
            border-color: rgba(45,212,191,.28);
          }
          100% {
            box-shadow: 0 0 10px rgba(16,185,129,.06), inset 0 0 18px rgba(255,255,255,.015);
            border-color: rgba(45,212,191,.13);
          }
        }

        @keyframes shimmer {
          0% { transform: translateX(-120%); opacity: .25; }
          50% { opacity: .55; }
          100% { transform: translateX(120%); opacity: .25; }
        }

        @keyframes floatGlow {
          0%, 100% {
            transform: translateY(0);
            filter: drop-shadow(0 0 6px rgba(16,185,129,.25));
          }
          50% {
            transform: translateY(-2px);
            filter: drop-shadow(0 0 12px rgba(16,185,129,.45));
          }
        }

        @keyframes liveDot {
          0% {
            transform: scale(.9);
            opacity: .55;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(.9);
            opacity: .55;
          }
        }

        .left-panel {
          background:
            linear-gradient(180deg, rgba(15,23,42,.96), rgba(3,7,18,.98)),
            #070b16;
          border-right: 1px solid rgba(45,212,191,.14);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
        }

        .map-panel {
          position: relative;
          min-width: 0;
          background: #020617;
        }

        .card {
          background:
            linear-gradient(180deg, rgba(17,24,39,.96), rgba(8,13,24,.98));
          border: 1px solid rgba(45,212,191,.13);
          border-radius: 18px;
          box-shadow: 0 14px 34px rgba(0,0,0,.38);
          position: relative;
          overflow: hidden;
        }

        .card::before {
          content: "";
          position: absolute;
          top: 0;
          left: -70%;
          width: 55%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.045), transparent);
          animation: shimmer 6s infinite ease-in-out;
          pointer-events: none;
        }

        .section-card {
          padding: 15px;
          animation: softPulse 4.5s infinite ease-in-out;
        }

        .section-head {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 7px;
          position: relative;
          z-index: 1;
        }

        .section-title {
          margin: 0;
          color: #f8fafc;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .45px;
        }

        .section-text {
          margin: 0 0 12px;
          color: #94a3b8;
          font-size: 10.8px;
          line-height: 1.45;
          position: relative;
          z-index: 1;
        }

        .icon-box {
          width: 32px;
          height: 32px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(16,185,129,.12);
          border: 1px solid rgba(16,185,129,.28);
          color: #34d399;
          box-shadow: 0 0 14px rgba(16,185,129,.18);
          flex-shrink: 0;
          animation: floatGlow 3s infinite ease-in-out;
        }

        .icon-blue {
          background: rgba(59,130,246,.11);
          border-color: rgba(59,130,246,.28);
          color: #60a5fa;
          box-shadow: 0 0 14px rgba(59,130,246,.18);
        }

        .icon-purple {
          background: rgba(139,92,246,.12);
          border-color: rgba(167,139,250,.28);
          color: #c4b5fd;
          box-shadow: 0 0 14px rgba(139,92,246,.18);
        }

        .icon-svg {
          width: 17px;
          height: 17px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .select-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(8,13,24,.88);
          border: 1px solid rgba(37,49,77,.92);
          padding: 10px 12px;
          border-radius: 14px;
          position: relative;
          z-index: 1;
        }

        .select-box:focus-within {
          border-color: rgba(16,185,129,.55);
          box-shadow: 0 0 0 3px rgba(16,185,129,.07);
        }

        .select {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #e5e7eb;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .select option {
          background: #111827;
          color: #e5e7eb;
        }

        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 5px 9px;
          background: rgba(16,185,129,.11);
          border: 1px solid rgba(16,185,129,.26);
          color: #6ee7b7;
          font-size: 9.5px;
          font-weight: 900;
          white-space: nowrap;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 10px rgba(34,197,94,.6);
          animation: liveDot 1.5s infinite ease-in-out;
        }

        .mini-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 10px;
          position: relative;
          z-index: 1;
        }

        .mini-box {
          background: rgba(8,13,24,.82);
          border: 1px solid rgba(31,42,68,.95);
          border-radius: 13px;
          padding: 9px 6px;
          text-align: center;
        }

        .mini-label {
          font-size: 9.5px;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .mini-value {
          font-size: 12.5px;
          font-weight: 900;
          color: #f8fafc;
        }

        .green-text { color: #34d399; }
        .blue-text { color: #60a5fa; }
        .earth-text { color: #fbbf24; }
        .purple-text { color: #c4b5fd; }

        .route-card {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          padding: 15px;
          animation: softPulse 5s infinite ease-in-out;
        }

        .route-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 2px 2px 4px 4px;
        }

        .empty-route {
          height: 100%;
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.6;
          border: 1px dashed rgba(16,185,129,.20);
          border-radius: 16px;
          background: rgba(15,23,42,.35);
        }

        .stop-row {
          display: flex;
          gap: 14px;
          position: relative;
        }

        .stop-line {
          position: absolute;
          left: 12px;
          top: 28px;
          bottom: -12px;
          width: 2px;
          background: #1e293b;
          z-index: 1;
        }

        .stop-line.active {
          background: #10b981;
          box-shadow: 0 0 10px rgba(16,185,129,.75);
        }

        .stop-number {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #0f172a;
          border: 1px solid #1f2937;
          color: #64748b;
          font-size: 11px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          flex-shrink: 0;
        }

        .stop-number.active {
          background: #10b981;
          border-color: #10b981;
          color: #020617;
          box-shadow: 0 0 14px rgba(16,185,129,.45);
          animation: liveDot 1.8s infinite ease-in-out;
        }

        .shipment-card {
          flex: 1;
          background: rgba(9,13,22,.50);
          border: 1px solid rgba(255,255,255,.035);
          border-radius: 14px;
          padding: 12px;
          margin-bottom: 14px;
          transition: all .25s ease;
        }

        .shipment-card.active {
          background: rgba(16,185,129,.065);
          border-color: rgba(16,185,129,.35);
          box-shadow: 0 0 18px rgba(16,185,129,.12);
        }

        .shipment-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          margin-bottom: 7px;
        }

        .receiver {
          color: #e5e7eb;
          font-size: 13px;
          font-weight: 850;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-chip {
          font-size: 9px;
          font-weight: 900;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,.15);
          color: #94a3b8;
          background: rgba(148,163,184,.07);
          white-space: nowrap;
        }

        .status-chip.active {
          color: #34d399;
          background: rgba(16,185,129,.11);
          border-color: rgba(16,185,129,.28);
        }

        .address {
          color: #94a3b8;
          font-size: 11.5px;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .shipment-meta {
          margin-top: 8px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          font-size: 10.5px;
          color: #64748b;
        }

        .map-card {
          position: absolute;
          top: 20px;
          left: 72px;
          z-index: 1000;
          width: 285px;
          background: rgba(8,13,24,.88);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(16,185,129,.20);
          border-radius: 18px;
          padding: 15px;
          box-shadow: 0 20px 45px rgba(0,0,0,.55), 0 0 18px rgba(16,185,129,.09);
        }

        .map-card-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .map-card-title strong {
          color: #f8fafc;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .55px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255,255,255,.05);
          font-size: 11.5px;
        }

        .info-row span:first-child {
          color: #94a3b8;
        }

        .info-row span:last-child {
          color: #e5e7eb;
          font-weight: 800;
          text-align: right;
        }

        .progress-wrap {
          margin-top: 11px;
        }

        .progress-head {
          display: flex;
          justify-content: space-between;
          color: #94a3b8;
          font-size: 10.5px;
          margin-bottom: 6px;
        }

        .progress-bar {
          height: 8px;
          border-radius: 999px;
          background: rgba(30,41,59,.9);
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.04);
        }

        .progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #10b981, #22c55e);
          box-shadow: 0 0 14px rgba(16,185,129,.45);
          transition: width .35s ease;
        }

        .bottom-live {
          position: absolute;
          left: 18px;
          bottom: 18px;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 9px;
          background: rgba(8,13,24,.90);
          border: 1px solid rgba(16,185,129,.22);
          color: #6ee7b7;
          border-radius: 14px;
          padding: 10px 13px;
          font-size: 11px;
          font-weight: 900;
          box-shadow: 0 10px 30px rgba(0,0,0,.35), 0 0 16px rgba(16,185,129,.14);
        }

        @media (max-width: 1100px) {
          .tracking-page {
            grid-template-columns: 1fr;
          }

          .left-panel {
            height: 520px;
            border-right: none;
            border-bottom: 1px solid rgba(45,212,191,.14);
          }
        }
      `}</style>

      <aside className="left-panel">
        <div className="card section-card">
          <div className="section-head">
            <div className="icon-box icon-blue">
              <svg viewBox="0 0 24 24" className="icon-svg">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" />
                <path d="M2 12h20" />
              </svg>
            </div>

            <div style={{ flex: 1 }}>
              <h3 className="section-title">Canlı Kurye Takibi</h3>
            </div>

            <div className="live-badge">
              <span className="live-dot" />
              Canlı
            </div>
          </div>

          <p className="section-text">
            Rota üzerindeki kurye konumu ve aktif teslimat sırası anlık olarak izlenir.
          </p>

          <div className="select-box">
            <select
              value={selectedId}
              onChange={handleCourierChange}
              className="select"
              disabled={loading || couriers.length === 0}
            >
              {couriers.length === 0 ? (
                <option value="">Kurye bulunamadı</option>
              ) : (
                couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.surname || ''} - {formatVehicle(c.vehicleType)}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="mini-grid">
            <div className="mini-box">
              <div className="mini-label">Durum</div>
              <div className={`mini-value ${isOnDelivery ? 'earth-text' : 'green-text'}`}>
                {formatStatus(activeCourier?.status)}
              </div>
            </div>

            <div className="mini-box">
              <div className="mini-label">Kalan Durak</div>
              <div className="mini-value blue-text">{activeRoute.length}</div>
            </div>

            <div className="mini-box">
              <div className="mini-label">Karbon/km</div>
              <div className="mini-value green-text">
                {activeCourier?.carbonRatePerKm ?? '-'}
              </div>
            </div>
          </div>
        </div>

        <div className="card section-card">
          <div className="section-head">
            <div className="icon-box">
              <svg viewBox="0 0 24 24" className="icon-svg">
                <path d="M3 3v18h18" />
                <path d="M7 14l3-3 3 2 5-6" />
              </svg>
            </div>
            <h3 className="section-title">Sıradaki Teslimat</h3>
          </div>

          {activeTarget ? (
            <>
              <p className="section-text">
                Kurye şu anda listedeki ilk teslimat noktasına yönlendirildi.
              </p>

              <div className="shipment-card active" style={{ marginBottom: 0 }}>
                <div className="shipment-top">
                  <div className="receiver">{activeTarget.receiverName || 'Alıcı bilgisi yok'}</div>
                  <span className="status-chip active">SIRADAKİ</span>
                </div>

                <div className="address">
                  {activeTarget.deliveryAddress || 'Teslimat adresi bulunmuyor.'}
                </div>

                <div className="shipment-meta">
                  <span>Barkod: {activeTarget.barcode || '-'}</span>
                  <span>Ağırlık: {activeTarget.weight || 0} kg</span>
                  <span>Öncelik: {activeTarget.priority || '-'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-route" style={{ minHeight: 110 }}>
              Bu kuryeye atanmış aktif teslimat bulunmuyor.
            </div>
          )}
        </div>

        <div className="card route-card">
          <div className="section-head">
            <div className="icon-box icon-purple">
              <svg viewBox="0 0 24 24" className="icon-svg">
                <path d="M9 18l6-12" />
                <path d="M3 6h18" />
                <path d="M3 18h18" />
              </svg>
            </div>
            <h3 className="section-title">Teslimat Akış Sırası</h3>
          </div>

          <div className="route-list">
            {activeRoute.length === 0 ? (
              <div className="empty-route">
                Rota bekleniyor.
                <br />
                Kurye ataması yapıldığında teslimat sırası burada görünür.
              </div>
            ) : (
              activeRoute.map((shipment, index) => {
                const isCurrentTarget = index === 0;

                return (
                  <div key={shipment.id} className="stop-row">
                    {index !== activeRoute.length - 1 && (
                      <div className={`stop-line ${isCurrentTarget ? 'active' : ''}`} />
                    )}

                    <div className={`stop-number ${isCurrentTarget ? 'active' : ''}`}>
                      {shipment.deliveryIndex || index + 1}
                    </div>

                    <div className={`shipment-card ${isCurrentTarget ? 'active' : ''}`}>
                      <div className="shipment-top">
                        <div className="receiver">{shipment.receiverName || 'Alıcı bilgisi yok'}</div>
                        <span className={`status-chip ${isCurrentTarget ? 'active' : ''}`}>
                          {isCurrentTarget ? 'YOLDA' : 'BEKLİYOR'}
                        </span>
                      </div>

                      <div className="address">
                        {shipment.deliveryAddress || 'Teslimat adresi bulunmuyor.'}
                      </div>

                      <div className="shipment-meta">
                        <span>{shipment.weight || 0} kg</span>
                        <span>Öncelik: {shipment.priority || '-'}</span>
                        <span>{shipment.cargoType || 'Kargo'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>

      <main className="map-panel">
        <MapComponent courier={activeCourier} shipments={activeRoute} />

        {activeCourier && (
          <div className="map-card">
            <div className="map-card-title">
              <strong>Anlık Kurye Veri Paneli</strong>
              <div className="live-badge">
                <span className="live-dot" />
                Aktif
              </div>
            </div>

            <div className="info-row">
              <span>Kurye</span>
              <span>
                {activeCourier.name} {activeCourier.surname || ''}
              </span>
            </div>

            <div className="info-row">
              <span>Durum</span>
              <span className={isOnDelivery ? 'earth-text' : 'green-text'}>
                {formatStatus(activeCourier.status)}
              </span>
            </div>

            <div className="info-row">
              <span>Araç</span>
              <span>{formatVehicle(activeCourier.vehicleType)}</span>
            </div>

            <div className="info-row">
              <span>Anlık Enlem</span>
              <span>{activeCourier.currentLat?.toFixed(5) || '-'}</span>
            </div>

            <div className="info-row">
              <span>Anlık Boylam</span>
              <span>{activeCourier.currentLon?.toFixed(5) || '-'}</span>
            </div>

            <div className="info-row">
              <span>Son Sinyal</span>
              <span>
                {lastSignal
                  ? lastSignal.toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })
                  : '-'}
              </span>
            </div>

            <div className="progress-wrap">
              <div className="progress-head">
                <span>Rota ilerleme durumu</span>
                <span>{progressPercent}%</span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="bottom-live">
          <span className="live-dot" />
          Canlı takip aktif — rota verileri 4 saniyede bir yenileniyor
        </div>
      </main>
    </div>
  );
}
