import { useState } from 'react';
import MapComponent from '../components/MapComponent';

export default function KuryeAtama({
  showNotification,
  stats,
  setStats,
  reports,
  setReports,
  pendingShipments,
  setPendingShipments,
  couriers,
  selectedCourierId,
  setSelectedCourierId,
  activeCourier,
  setActiveCourier,
  loading,
  setLoading,
  handleCompare,
  handleAssign
}) {
  const [isRouteCalculated, setIsRouteCalculated] = useState(false);

  const COURIER_MAX_SHIPMENT = 30;

  const isCourierBusy =
    activeCourier?.status === 'ON_DELIVERY' ||
    activeCourier?.status === 'BUSY';

  const sortedReports = [...(reports || [])].sort((a, b) => {
    const distanceA = Number(a.totalDistance || 0);
    const distanceB = Number(b.totalDistance || 0);
    const carbonA = Number(a.totalCarbon || 0);
    const carbonB = Number(b.totalCarbon || 0);

    if (distanceA !== distanceB) return distanceA - distanceB;
    return carbonA - carbonB;
  });

  const bestReport = sortedReports.length > 0 ? sortedReports[0] : null;

  const readyShipmentCount = pendingShipments?.length || 0;
  const routeShipments = (pendingShipments || []).slice(0, COURIER_MAX_SHIPMENT);
  const routeShipmentCount = routeShipments.length;
  const waitingShipmentCount = Math.max(0, readyShipmentCount - COURIER_MAX_SHIPMENT);

  const bestRoute = bestReport?.route || routeShipments || [];
  const hasReadyShipments = readyShipmentCount > 0;

  const routeEngineMessage = (() => {
    if (!hasReadyShipments) {
      return 'Dağıtıma hazır ürün bulunmuyor.';
    }

    if (!activeCourier) {
      return `${routeShipmentCount} ürün rota için hazır. Kurye seçimi bekleniyor.`;
    }

    if (isCourierBusy) {
      return 'Seçili kurye aktif görevde. Yeni rota atanamaz.';
    }

    if (waitingShipmentCount > 0) {
      return `${routeShipmentCount} ürün rotaya alınacak. ${waitingShipmentCount} ürün havuzda kalacak.`;
    }

    return `${routeShipmentCount} ürün rotaya alınacak.`;
  })();

  const handleCourierChange = (e) => {
    const id = e.target.value;
    setSelectedCourierId(id);

    const courier = couriers.find((c) => c.id === parseInt(id));
    setActiveCourier(courier || null);

    setReports([]);
    setIsRouteCalculated(false);

    setStats({
      winnerAlgo: '-',
      totalCarbon: '0.00 kg',
      execTime: '0 ms',
      fitnessScore: '-'
    });
  };

  const triggerCompare = async () => {
    if (!activeCourier) {
      showNotification('Rota oluşturmak için önce uygun bir kurye seçin.', 'warning');
      return;
    }

    if (isCourierBusy) {
      showNotification('Bu kurye zaten aktif görevde.', 'warning');
      return;
    }

    if (!hasReadyShipments) {
      showNotification('Dağıtıma hazır ürün bulunamadı.', 'warning');
      setIsRouteCalculated(false);
      return;
    }

    const result = await handleCompare(routeShipments);

    if (!result || result.length === 0) {
      showNotification('Algoritma karşılaştırması için uygun ürün bulunamadı.', 'warning');
      setIsRouteCalculated(false);
      return;
    }

    setIsRouteCalculated(true);
  };

  const triggerAssign = async () => {
    if (!activeCourier) {
      showNotification('Lütfen önce kurye seçin.', 'warning');
      return;
    }

    if (isCourierBusy) return;

    await handleAssign(routeShipments);
    setIsRouteCalculated(false);
  };

  const formatStatusText = (status) => {
    if (status === 'ON_DELIVERY') return 'DAĞITIMDA';
    if (status === 'AVAILABLE') return 'MÜSAİT';
    if (status === 'BUSY') return 'MEŞGUL';
    return status || 'MÜSAİT';
  };

  const formatVehicleText = (type) => {
    switch (type) {
      case 'ELECTRIC': return 'Elektrikli';
      case 'DIESEL': return 'Dizel';
      case 'GASOLINE': return 'Benzinli';
      case 'HYBRID': return 'Hibrit';
      case 'MOTORCYCLE': return 'Motosiklet';
      default: return type || '-';
    }
  };

  const bestRouteDistance = bestReport?.totalDistance
    ? bestReport.totalDistance.toFixed(2)
    : '0.00';

  const bestCarbon = bestReport?.totalCarbon
    ? bestReport.totalCarbon.toFixed(2)
    : '0.00';

  const bestExecTime = bestReport?.executionTime ?? bestReport?.calculationTime ?? 0;

  const worstDistance =
    sortedReports.length > 1
      ? Math.max(...sortedReports.map((r) => Number(r.totalDistance || 0)))
      : Number(bestReport?.totalDistance || 0);

  const distanceSaved =
    bestReport && worstDistance
      ? Math.max(0, worstDistance - Number(bestReport.totalDistance || 0)).toFixed(2)
      : '0.00';

  return (
    <div className="kurye-atama-page">
      <style>{`
        .kurye-atama-page {
          height: calc(100vh - 70px);
          background:
            radial-gradient(circle at 15% 20%, rgba(16,185,129,.10), transparent 32%),
            radial-gradient(circle at 40% 90%, rgba(59,130,246,.08), transparent 36%),
            #050914;
          color: #e5e7eb;
          display: grid;
          grid-template-columns: 430px minmax(0, 1fr);
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
          0%, 100% { transform: translateY(0); filter: drop-shadow(0 0 6px rgba(16,185,129,.25)); }
          50% { transform: translateY(-2px); filter: drop-shadow(0 0 12px rgba(16,185,129,.45)); }
        }

        .left-panel {
          background:
            linear-gradient(180deg, rgba(15,23,42,.96), rgba(3,7,18,.98)),
            #070b16;
          border-right: 1px solid rgba(45,212,191,.14);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 11px;
          overflow: hidden;
        }

       .map-panel {
        min-width: 0;
        position: relative;
        background: #020617;
        display: grid;
        grid-template-rows: minmax(0, 1fr) 300px;
        overflow: hidden;
      }

        .map-area {
          min-height: 0;
          position: relative;
        }

        .wide-report-panel {
          background:
            linear-gradient(180deg, rgba(17,24,39,.98), rgba(8,13,24,.98));
          border-top: 1px solid rgba(45,212,191,.18);
          padding: 12px 16px;
          box-shadow: 0 -12px 32px rgba(0,0,0,.35);
          display: flex;
          flex-direction: column;
          gap: 9px;
          overflow: hidden;
        }

        .card {
          background:
            linear-gradient(180deg, rgba(17,24,39,.96) 0%, rgba(8,13,24,.98) 100%);
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

        .summary-card {
          padding: 15px;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          animation: softPulse 5s infinite ease-in-out;
        }

        .section-head {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 6px;
          position: relative;
          z-index: 1;
        }

        .section-title {
          font-size: 12px;
          font-weight: 900;
          color: #f8fafc;
          text-transform: uppercase;
          letter-spacing: .45px;
          margin: 0;
        }

        .section-text {
          font-size: 10.8px;
          color: #94a3b8;
          margin: 0 0 12px;
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

        .courier-select-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(8,13,24,.88);
          border: 1px solid rgba(37,49,77,.92);
          padding: 10px 12px;
          border-radius: 14px;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
        }

        .courier-select-box:focus-within {
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

        .status-badge {
          font-size: 9px;
          padding: 4px 8px;
          border-radius: 999px;
          font-weight: 900;
          white-space: nowrap;
        }

        .status-ok {
          background: rgba(16,185,129,.13);
          color: #34d399;
          border: 1px solid rgba(16,185,129,.34);
          box-shadow: 0 0 12px rgba(16,185,129,.16);
        }

        .status-busy {
          background: rgba(245,158,11,.12);
          color: #fbbf24;
          border: 1px solid rgba(245,158,11,.34);
          box-shadow: 0 0 12px rgba(245,158,11,.16);
        }

        .mini-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          position: relative;
          z-index: 1;
        }

        .mini-box {
          background: rgba(8,13,24,.82);
          border: 1px solid rgba(31,42,68,.95);
          border-radius: 13px;
          padding: 9px 6px;
          text-align: center;
          transition: all .25s ease;
        }

        .mini-box:hover {
          transform: translateY(-1px);
          border-color: rgba(16,185,129,.28);
          box-shadow: 0 0 14px rgba(16,185,129,.08);
        }

        .mini-label {
          font-size: 9.5px;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .mini-value {
          font-size: 13px;
          font-weight: 900;
          color: #f8fafc;
        }

        .blue-text { color: #60a5fa; }
        .green-text { color: #34d399; }
        .purple-text { color: #c4b5fd; }
        .earth-text { color: #fbbf24; }

        .primary-btn {
          width: 100%;
          border: none;
          background: linear-gradient(135deg, #10b981 0%, #059669 55%, #047857 100%);
          color: white;
          padding: 12px 14px;
          border-radius: 13px;
          font-weight: 900;
          font-size: 12px;
          cursor: pointer;
          transition: all .25s ease;
          box-shadow: 0 0 18px rgba(16,185,129,.20);
          position: relative;
          z-index: 1;
        }

        .primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 22px rgba(16,185,129,.30), 0 10px 22px rgba(5,150,105,.16);
        }

        .primary-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .assign-box {
          background: rgba(16,185,129,.075);
          border: 1px solid rgba(16,185,129,.27);
          padding: 10px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 0 16px rgba(16,185,129,.11);
          position: relative;
          z-index: 1;
        }

        .assign-check {
          width: 27px;
          height: 27px;
          border-radius: 50%;
          background: rgba(16,185,129,.14);
          color: #34d399;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          flex-shrink: 0;
          box-shadow: 0 0 12px rgba(16,185,129,.18);
        }

        .assign-text {
          flex: 1;
          font-size: 11px;
        }

        .assign-title {
          color: #34d399;
          font-weight: 900;
        }

        .small-btn {
          border: none;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 8px 11px;
          border-radius: 10px;
          font-size: 10.5px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 0 12px rgba(16,185,129,.18);
        }

        .locked-box {
          padding: 11px;
          border-radius: 14px;
          font-size: 11px;
          text-align: center;
          line-height: 1.5;
          border: 1px solid rgba(245,158,11,.24);
          color: #fbbf24;
          background: rgba(245,158,11,.065);
          box-shadow: 0 0 16px rgba(245,158,11,.12);
          position: relative;
          z-index: 1;
        }

        .empty-ready-box {
          padding: 11px;
          border-radius: 14px;
          font-size: 11px;
          text-align: center;
          line-height: 1.5;
          border: 1px solid rgba(16,185,129,.24);
          color: #6ee7b7;
          background: rgba(16,185,129,.065);
          box-shadow: 0 0 16px rgba(16,185,129,.10);
          position: relative;
          z-index: 1;
        }

        .winner-box {
          background: linear-gradient(135deg, rgba(16,185,129,.10), rgba(139,92,246,.07));
          border: 1px solid rgba(16,185,129,.24);
          border-radius: 15px;
          padding: 11px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          box-shadow: 0 0 18px rgba(16,185,129,.12);
          position: relative;
          z-index: 1;
        }

        .winner-label {
          color: #94a3b8;
          font-size: 10px;
          font-weight: 800;
          margin-bottom: 3px;
        }

        .winner-name {
          color: #34d399;
          font-size: 12px;
          font-weight: 900;
        }

        .winner-chip {
          padding: 6px 9px;
          border-radius: 999px;
          background: rgba(16,185,129,.13);
          color: #34d399;
          border: 1px solid rgba(16,185,129,.28);
          font-size: 9.5px;
          font-weight: 900;
          white-space: nowrap;
          box-shadow: 0 0 12px rgba(16,185,129,.14);
        }

        .wide-table-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .wide-title {
          color: #f8fafc;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .45px;
        }

        .wide-subtitle {
          color: #94a3b8;
          font-size: 10.5px;
          margin-top: 2px;
        }

        .wide-chip {
          border-radius: 999px;
          padding: 6px 10px;
          background: rgba(16,185,129,.11);
          border: 1px solid rgba(16,185,129,.26);
          color: #6ee7b7;
          font-size: 10px;
          font-weight: 900;
          white-space: nowrap;
        }

        .table-wrap {
          flex: 1;
          min-height: 0;
          overflow: auto;
          border: 1px solid rgba(31,42,68,.95);
          border-radius: 14px;
          background: rgba(8,13,24,.86);
          position: relative;
          z-index: 1;
        }

        .algo-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        .algo-table th {
          position: sticky;
          top: 0;
          z-index: 1;
          text-align: left;
          background: #0b1220;
          color: #94a3b8;
          padding: 9px 11px;
          font-size: 9.5px;
          text-transform: uppercase;
          border-bottom: 1px solid #1f2a44;
        }

        .algo-table td {
          padding: 10px 11px;
          border-bottom: 1px solid rgba(31,42,68,.8);
          color: #cbd5e1;
          vertical-align: middle;
        }

        .algo-table tr.best-row td {
          background: rgba(16,185,129,.08);
          color: #f8fafc;
        }

        .rank {
          width: 26px;
          height: 26px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59,130,246,.11);
          color: #60a5fa;
          font-weight: 900;
        }

        .best-row .rank {
          background: rgba(16,185,129,.15);
          color: #34d399;
          box-shadow: 0 0 12px rgba(16,185,129,.16);
        }

        .algo-name {
          font-weight: 900;
          color: #f8fafc;
        }

        .selected-note {
          color: #34d399;
          font-size: 9px;
          margin-top: 3px;
          font-weight: 900;
        }

        .empty-table {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #64748b;
          font-size: 11px;
          line-height: 1.55;
          padding: 18px;
        }

        .map-badge {
          position: absolute;
          right: 18px;
          bottom: 18px;
          z-index: 500;
          background: rgba(8,13,24,.92);
          border: 1px solid rgba(16,185,129,.26);
          color: #6ee7b7;
          border-radius: 14px;
          padding: 10px 13px;
          font-size: 11px;
          font-weight: 900;
          box-shadow: 0 10px 30px rgba(0,0,0,.35), 0 0 16px rgba(16,185,129,.14);
        }
      `}</style>

      <aside className="left-panel">
        <div className="card section-card">
          <div className="section-head">
            <div className="icon-box icon-blue">
              <svg viewBox="0 0 24 24" className="icon-svg">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 className="section-title">Kurye Seçimi</h3>
          </div>

          <p className="section-text">Rota atanacak müsait kuryeyi seçin.</p>

          <div className="courier-select-box">
            <select
              value={selectedCourierId || ''}
              onChange={handleCourierChange}
              className="select"
            >
              <option value="">Kurye seçin</option>
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.surname || ''} - {formatVehicleText(c.vehicleType)}
                </option>
              ))}
            </select>

            <span className={`status-badge ${isCourierBusy ? 'status-busy' : 'status-ok'}`}>
              {activeCourier ? formatStatusText(activeCourier.status) : 'SEÇİLMEDİ'}
            </span>
          </div>

          <div className="mini-grid">
            <div className="mini-box">
              <div className="mini-label">Plaka</div>
              <div className="mini-value">{activeCourier?.plateNumber || '-'}</div>
            </div>

            <div className="mini-box">
              <div className="mini-label">Rota Havuzu</div>
              <div className="mini-value blue-text">{routeShipmentCount}</div>
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
                <circle cx="12" cy="12" r="10" />
                <path d="M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3 6.3-2.1z" />
              </svg>
            </div>
            <h3 className="section-title">Akıllı Rota Motoru</h3>
          </div>

          <p className="section-text">
          Dağıtıma çıkacak ürünler için en uygun rota otomatik olarak oluşturulur.
        </p>

          {!hasReadyShipments || !activeCourier || isCourierBusy ? (
            <>
              <div className="empty-ready-box">
                {routeEngineMessage}
              </div>
            </>
          ) : !isRouteCalculated ? (
            <button
              onClick={triggerCompare}
              disabled={loading || !hasReadyShipments || !activeCourier || isCourierBusy}
              className="primary-btn"
            >
              {loading ? 'Algoritmalar Karşılaştırılıyor...' : `Algoritmaları Yarıştır (${routeShipmentCount} ürün)`}
            </button>
          ) : (
            <div className="assign-box">
              <div className="assign-check">✓</div>
              <div className="assign-text">
                <div className="assign-title">En uygun rota hesaplandı</div>
                <div style={{ color: '#94a3b8', marginTop: 2 }}>
                  Haritada seçilen rota gösteriliyor.
                </div>
              </div>
              <button onClick={triggerAssign} className="small-btn">
                Kuryeye Ata
              </button>
            </div>
          )}

          <div className="mini-grid" style={{ marginTop: 10 }}>
            <div className="mini-box">
              <div className="mini-label">Mesafe</div>
              <div className="mini-value blue-text">{bestRouteDistance} km</div>
            </div>

            <div className="mini-box">
              <div className="mini-label">Karbon</div>
              <div className="mini-value green-text">{bestCarbon} kg</div>
            </div>

            <div className="mini-box">
              <div className="mini-label">Kazanç</div>
              <div className="mini-value earth-text">{distanceSaved} km</div>
            </div>
          </div>
        </div>

        <div className="card summary-card">
          <div>
            <div className="section-head">
              <div className="icon-box icon-purple">
                <svg viewBox="0 0 24 24" className="icon-svg">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <path d="M3.3 7l8.7 5 8.7-5" />
                  <path d="M12 22V12" />
                </svg>
              </div>
              <h3 className="section-title">Seçilen Rota Özeti</h3>
            </div>

          </div>

          <div className="winner-box">
            <div>
              <div className="winner-label">Seçilen Algoritma</div>
              <div className="winner-name">
                {bestReport?.algorithmName || (hasReadyShipments ? 'Kurye seçimi bekleniyor' : 'Ürün bekleniyor')}
              </div>
            </div>

            <div className="winner-chip">
              {bestReport ? `${bestExecTime} ms` : hasReadyShipments ? `${routeShipmentCount} ürün` : 'Beklemede'}
            </div>
          </div>
        </div>
      </aside>

      <main className="map-panel">
        <div className="map-area">
          <MapComponent
            courier={activeCourier}
            shipments={bestRoute}
          />

          <div className="map-badge">
            {bestReport
              ? `Aktif Rota: ${bestReport.algorithmName}`
              : hasReadyShipments ? `${routeShipmentCount} ürün rota havuzunda` : 'Rota bekleniyor'}
          </div>
        </div>

        <section className="wide-report-panel">
          <div className="wide-table-head">
            <div>
              <div className="wide-title">Algoritma Karşılaştırma Sonuçları</div>
              <div className="wide-subtitle">
                Mesafe, karbon salınımı ve çalışma süresine göre algoritma sonuçları
              </div>
            </div>

            <div className="wide-chip">
              {bestReport ? `Seçilen: ${bestReport.algorithmName}` : hasReadyShipments ? `${routeShipmentCount} ürün rotada` : 'Hesaplama bekleniyor'}
            </div>
          </div>

          <div className="table-wrap">
            {sortedReports.length === 0 ? (
              <div className="empty-table">
                {hasReadyShipments
                  ? 'Rota hesaplaması için kurye seçip algoritmaları çalıştırın. Seçilen kuryeye en fazla 30 ürün atanır.'
                  : 'Dağıtıma hazır ürün bulunmadığı için rota hesaplaması yapılamıyor.'}
              </div>
            ) : (
              <table className="algo-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Algoritma</th>
                    <th>Toplam Mesafe</th>
                    <th>Karbon Salınımı</th>
                    <th>Çalışma Süresi</th>
                    <th>Sonuç</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedReports.map((report, index) => {
                    const time = report.executionTime ?? report.calculationTime ?? 0;

                    return (
                      <tr key={`${report.algorithmName}-${index}`} className={index === 0 ? 'best-row' : ''}>
                        <td>
                          <div className="rank">{index + 1}</div>
                        </td>

                        <td>
                          <div className="algo-name">{report.algorithmName}</div>
                          {index === 0 && <div className="selected-note">SEÇİLEN ROTA</div>}
                        </td>

                        <td>{Number(report.totalDistance || 0).toFixed(2)} km</td>
                        <td>{Number(report.totalCarbon || 0).toFixed(2)} kg CO₂</td>
                        <td>{time} ms</td>
                        <td>{index === 0 ? 'En uygun' : 'Alternatif'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}