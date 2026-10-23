import { Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import { useEffect, useRef } from 'react';

export default function AnaSayfa({ systemLogs = [], setSystemLogs, couriers = [] }) {
    const previousShipmentsRef = useRef([]);
  const previousCouriersRef = useRef([]);

  useEffect(() => {
    const addSystemLog = (newLog) => {
      setSystemLogs((prev) => [
        {
          id: Date.now() + Math.random(),
          time: 'Şimdi',
          ...newLog,
        },
        ...(prev || []).map((log) => {
          if (log.time === 'Şimdi') return { ...log, time: '1 dk önce' };
          if (log.time === '1 dk önce') return { ...log, time: '2 dk önce' };
          if (log.time === '2 dk önce') return { ...log, time: '3 dk önce' };
          return log;
        }),
      ].slice(0, 20));
    };

    const fetchLiveFlow = async () => {
      try {
        const [courierList, shipmentList] = await Promise.all([
          ApiService.getAllCouriers(),
          ApiService.getAllShipments(),
        ]);

        const previousShipments = previousShipmentsRef.current;
        const previousCouriers = previousCouriersRef.current;

        if (previousShipments.length > 0) {
          shipmentList.forEach((shipment) => {
            const oldShipment = previousShipments.find(
              (item) => item.id === shipment.id
            );

            if (!oldShipment) return;

            if (
              oldShipment.status !== 'DELIVERED' &&
              shipment.status === 'DELIVERED'
            ) {
              const courier = courierList.find(
                (item) => Number(item.id) === Number(shipment.courierId)
              );

              const courierName = courier
                ? `${courier.name || ''} ${courier.surname || ''}`.trim()
                : 'Kurye';

              addSystemLog({
                title: 'Teslimat tamamlandı',
                desc: `${courierName}, ${shipment.receiverName || 'bir alıcı'} teslimatını tamamladı.`,
                type: 'shipment',
                color: '#22c55e',
              });
            }

            if (
              oldShipment.status !== 'IN_TRANSIT' &&
              shipment.status === 'IN_TRANSIT'
            ) {
              addSystemLog({
                title: 'Yeni rota atandı',
                desc: `${shipment.receiverName || 'Bir teslimat'} kuryeye atandı ve dağıtıma çıkarıldı.`,
                type: 'route',
                color: '#38bdf8',
              });
            }
          });
        }

        if (previousCouriers.length > 0) {
          courierList.forEach((courier) => {
            const oldCourier = previousCouriers.find(
              (item) => item.id === courier.id
            );

            if (!oldCourier) return;

            if (
              oldCourier.status !== courier.status &&
              courier.status === 'ON_DELIVERY'
            ) {
              addSystemLog({
                title: 'Kurye dağıtıma çıktı',
                desc: `${courier.name || ''} ${courier.surname || ''} aktif rotaya başladı.`,
                type: 'courier',
                color: '#fbbf24',
              });
            }
          });
        }

        previousShipmentsRef.current = shipmentList || [];
        previousCouriersRef.current = courierList || [];
      } catch (error) {
        console.error('Canlı akış verileri alınamadı:', error);
      }
    };

    fetchLiveFlow();

    const interval = setInterval(fetchLiveFlow, 5000);

    return () => clearInterval(interval);
  }, [setSystemLogs]);

  const activeCourierCount = couriers.filter(
    (courier) => courier.status === 'ON_DELIVERY' || courier.status === 'BUSY'
  ).length;

  const availableCourierCount = couriers.filter(
    (courier) => courier.status === 'AVAILABLE'
  ).length;

  const cleanLogTitle = (title = '') => {
    return String(title)
      .replace(/[🚀📦🟢🔴🟡📡⚡✅❌🌱]/g, '')
      .trim();
  };

  const getLogIcon = (type = '') => {
    const value = String(type).toLowerCase();

    if (value.includes('route') || value.includes('rota')) {
      return (
        <svg viewBox="0 0 24 24" className="log-icon-svg">
          <path d="M4 19c3-5 5-5 8-2s5 3 8-2" />
          <path d="M5 5h.01" />
          <path d="M19 19h.01" />
          <path d="M8 8l8 8" />
        </svg>
      );
    }

    if (value.includes('courier') || value.includes('kurye')) {
      return (
        <svg viewBox="0 0 24 24" className="log-icon-svg">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    }

    if (value.includes('shipment') || value.includes('ürün') || value.includes('kargo')) {
      return (
        <svg viewBox="0 0 24 24" className="log-icon-svg">
          <path d="M21 8l-9-5-9 5 9 5 9-5z" />
          <path d="M3 8v8l9 5 9-5V8" />
          <path d="M12 13v8" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" className="log-icon-svg">
        <path d="M4 19V5" />
        <path d="M8 19v-7" />
        <path d="M12 19V9" />
        <path d="M16 19v-4" />
        <path d="M20 19V7" />
      </svg>
    );
  };

  return (
    <div className="home-page">
      <style>{`
        .home-page {
          min-height: calc(100vh - 70px);
          background:
            radial-gradient(circle at 14% 18%, rgba(16,185,129,.10), transparent 30%),
            radial-gradient(circle at 78% 14%, rgba(59,130,246,.07), transparent 34%),
            radial-gradient(circle at 55% 95%, rgba(120,113,108,.07), transparent 42%),
            #050914;
          color: #e5e7eb;
          padding: 22px;
          box-sizing: border-box;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        @keyframes softPulse {
          0% {
            box-shadow: 0 0 10px rgba(16,185,129,.05), inset 0 0 18px rgba(255,255,255,.012);
            border-color: rgba(45,212,191,.12);
          }
          50% {
            box-shadow: 0 0 22px rgba(16,185,129,.12), inset 0 0 22px rgba(255,255,255,.018);
            border-color: rgba(45,212,191,.24);
          }
          100% {
            box-shadow: 0 0 10px rgba(16,185,129,.05), inset 0 0 18px rgba(255,255,255,.012);
            border-color: rgba(45,212,191,.12);
          }
        }

        @keyframes shimmer {
          0% { transform: translateX(-130%); opacity: .16; }
          50% { opacity: .42; }
          100% { transform: translateX(130%); opacity: .16; }
        }

        @keyframes liveDot {
          0% { transform: scale(.86); opacity: .55; }
          50% { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(.86); opacity: .55; }
        }

        @keyframes orbitRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes lineMove {
          0% { stroke-dashoffset: 140; opacity: .35; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: .35; }
        }

        @keyframes nodePulse {
          0%, 100% { r: 4; opacity: .55; }
          50% { r: 6; opacity: 1; }
        }

        @keyframes fadeInLog {
          0% { transform: translateY(-8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        .home-grid {
          height: calc(100vh - 114px);
          display: grid;
          grid-template-columns: 410px minmax(0, 1fr);
          gap: 18px;
        }

        .glass-card {
          background:
            linear-gradient(180deg, rgba(17,24,39,.94), rgba(8,13,24,.98));
          border: 1px solid rgba(45,212,191,.13);
          border-radius: 22px;
          box-shadow: 0 18px 45px rgba(0,0,0,.42);
          position: relative;
          overflow: hidden;
        }

        .glass-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: -72%;
          width: 55%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.035), transparent);
          animation: shimmer 7s infinite ease-in-out;
          pointer-events: none;
        }

        .flow-panel {
          display: flex;
          flex-direction: column;
          padding: 16px;
          gap: 13px;
          min-height: 0;
          animation: softPulse 5s infinite ease-in-out;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          position: relative;
          z-index: 1;
        }

        .panel-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .icon-box {
          width: 34px;
          height: 34px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(16,185,129,.12);
          border: 1px solid rgba(16,185,129,.28);
          color: #34d399;
          box-shadow: 0 0 14px rgba(16,185,129,.18);
          flex-shrink: 0;
        }

        .icon-blue {
          background: rgba(59,130,246,.10);
          border-color: rgba(59,130,246,.26);
          color: #60a5fa;
          box-shadow: 0 0 14px rgba(59,130,246,.16);
        }

        .icon-svg {
          width: 18px;
          height: 18px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .section-title {
          margin: 0;
          color: #f8fafc;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .55px;
        }

        .section-subtitle {
          margin: 2px 0 0;
          color: #94a3b8;
          font-size: 10.5px;
        }

        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 999px;
          padding: 6px 10px;
          background: rgba(16,185,129,.10);
          border: 1px solid rgba(16,185,129,.24);
          color: #6ee7b7;
          font-size: 10px;
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

        .flow-list {
          min-height: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 11px;
          padding-right: 4px;
          position: relative;
          z-index: 1;
        }

        .empty-flow {
          height: 100%;
          min-height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.6;
          border: 1px dashed rgba(16,185,129,.22);
          border-radius: 18px;
          background:
            radial-gradient(circle at center, rgba(16,185,129,.08), rgba(15,23,42,.30));
        }

        .flow-card {
          background:
            linear-gradient(180deg, rgba(15,23,42,.86), rgba(8,13,24,.94));
          border: 1px solid rgba(31,42,68,.92);
          border-radius: 16px;
          padding: 13px;
          box-shadow: 0 10px 24px rgba(0,0,0,.28);
          transition: all .25s ease;
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 11px;
          animation: fadeInLog .45s ease-out forwards;
        }

        .flow-card.now {
          border-color: rgba(16,185,129,.30);
          background:
            linear-gradient(180deg, rgba(16,185,129,.065), rgba(8,13,24,.94));
          box-shadow: 0 12px 28px rgba(0,0,0,.35), 0 0 20px rgba(16,185,129,.09);
        }

        .flow-card:hover {
          transform: translateY(-2px);
          border-color: rgba(16,185,129,.22);
        }

        .log-icon {
          width: 34px;
          height: 34px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--log-color);
          background: color-mix(in srgb, var(--log-color) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--log-color) 22%, transparent);
        }

        .log-icon-svg {
          width: 17px;
          height: 17px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .flow-content {
          min-width: 0;
        }

        .flow-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          margin-bottom: 6px;
        }

        .flow-title {
          margin: 0;
          color: #f8fafc;
          font-size: 13px;
          font-weight: 900;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .time-chip {
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 9.5px;
          font-weight: 900;
          color: var(--log-color);
          background: color-mix(in srgb, var(--log-color) 13%, transparent);
          border: 1px solid color-mix(in srgb, var(--log-color) 22%, transparent);
          white-space: nowrap;
        }

        .flow-desc {
          margin: 0;
          color: #94a3b8;
          font-size: 11.6px;
          line-height: 1.5;
        }

        .operation-panel {
          padding: 24px;
          display: grid;
          grid-template-rows: auto auto minmax(0, 1fr);
          gap: 16px;
          min-width: 0;
        }

        .operation-head {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 310px;
          gap: 24px;
          align-items: center;
        }

        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #6ee7b7;
          background: rgba(16,185,129,.095);
          border: 1px solid rgba(16,185,129,.22);
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 900;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: .5px;
        }

        .page-title {
          margin: 0;
          color: #f8fafc;
          font-size: clamp(28px, 3.2vw, 42px);
          line-height: 1.10;
          font-weight: 950;
          letter-spacing: -1px;
        }

        .gradient-text {
          background: linear-gradient(90deg, #34d399, #60a5fa);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .page-desc {
          margin: 12px 0 0;
          color: #94a3b8;
          font-size: 13.5px;
          line-height: 1.65;
          max-width: 760px;
        }

        .network-visual {
          height: 178px;
          border-radius: 22px;
          background:
            radial-gradient(circle at 25% 30%, rgba(16,185,129,.18), transparent 32%),
            radial-gradient(circle at 70% 66%, rgba(59,130,246,.14), transparent 34%),
            rgba(8,13,24,.72);
          border: 1px solid rgba(45,212,191,.16);
          box-shadow: inset 0 0 35px rgba(255,255,255,.02), 0 18px 35px rgba(0,0,0,.30);
          position: relative;
          overflow: hidden;
        }

        .network-visual::after {
          content: "";
          position: absolute;
          width: 230px;
          height: 230px;
          border-radius: 50%;
          border: 1px solid rgba(16,185,129,.12);
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          animation: orbitRotate 18s linear infinite;
        }

        .network-svg {
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 1;
        }

        .network-line {
          fill: none;
          stroke: rgba(52,211,153,.65);
          stroke-width: 2.2;
          stroke-dasharray: 9 8;
          animation: lineMove 3.5s linear infinite;
          filter: drop-shadow(0 0 5px rgba(16,185,129,.45));
        }

        .network-line-blue {
          stroke: rgba(96,165,250,.55);
          animation-duration: 4.5s;
        }

        .node {
          fill: #10b981;
          filter: drop-shadow(0 0 7px rgba(16,185,129,.75));
          animation: nodePulse 2.2s infinite ease-in-out;
        }

        .node.blue {
          fill: #60a5fa;
          filter: drop-shadow(0 0 7px rgba(96,165,250,.65));
          animation-delay: .4s;
        }

        .node.stone {
          fill: #d6d3d1;
          filter: drop-shadow(0 0 7px rgba(214,211,209,.45));
          animation-delay: .8s;
        }

        .visual-label {
          position: absolute;
          left: 16px;
          bottom: 14px;
          color: #6ee7b7;
          font-size: 10.5px;
          font-weight: 900;
          background: rgba(16,185,129,.10);
          border: 1px solid rgba(16,185,129,.20);
          border-radius: 999px;
          padding: 6px 10px;
          z-index: 2;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .stat-card {
          padding: 15px;
          border-radius: 18px;
          background: rgba(8,13,24,.72);
          border: 1px solid rgba(31,42,68,.95);
          box-shadow: 0 12px 28px rgba(0,0,0,.22);
          transition: all .25s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(16,185,129,.25);
          box-shadow: 0 16px 32px rgba(0,0,0,.30), 0 0 18px rgba(16,185,129,.07);
        }

        .stat-label {
          color: #94a3b8;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .45px;
          margin-bottom: 8px;
        }

        .stat-value {
          color: #f8fafc;
          font-size: 24px;
          font-weight: 950;
          line-height: 1;
        }

        .stat-help {
          color: #64748b;
          font-size: 10.5px;
          margin-top: 7px;
        }

        .green-text { color: #34d399; }
        .blue-text { color: #60a5fa; }
        .amber-text { color: #fbbf24; }

        @keyframes scanFlow {
          0% { transform: translateX(-110%); opacity: .15; }
          40% { opacity: .55; }
          100% { transform: translateX(110%); opacity: .15; }
        }

        @keyframes aiNodePulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 10px rgba(16,185,129,.18);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 0 20px rgba(16,185,129,.42);
          }
        }

        @keyframes chipFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        .ai-card {
          min-height: 0;
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 1;
          border-color: rgba(16,185,129,.14);
          background:
            radial-gradient(circle at 16% 18%, rgba(16,185,129,.055), transparent 38%),
            radial-gradient(circle at 86% 84%, rgba(59,130,246,.035), transparent 42%),
            linear-gradient(180deg, rgba(17,24,39,.965), rgba(8,13,24,.992));
          box-shadow:
            0 0 18px rgba(16,185,129,.045),
            inset 0 1px 0 rgba(255,255,255,.025);
        }

        .ai-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(52,211,153,.025), transparent);
          animation: scanFlow 7s infinite ease-in-out;
          pointer-events: none;
        }

        .ai-content {
          position: relative;
          z-index: 1;
          max-width: 880px;
        }

        .ai-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .ai-mark {
          width: 40px;
          height: 40px;
          border-radius: 15px;
          background: rgba(16,185,129,.085);
          border: 1px solid rgba(16,185,129,.20);
          color: #6ee7b7;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 12px rgba(16,185,129,.10);
          animation: aiNodePulse 5s infinite ease-in-out;
          flex-shrink: 0;
        }

        .ai-mark svg {
          width: 20px;
          height: 20px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .ai-title {
          margin: 0;
          color: #f8fafc;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -.3px;
        }

        .ai-subtitle {
          margin-top: 3px;
          color: #6ee7b7;
          font-size: 10.5px;
          font-weight: 900;
          letter-spacing: .45px;
          text-transform: uppercase;
          opacity: .88;
        }

        .ai-text {
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.7;
          margin: 0;
          max-width: 850px;
        }

        .algo-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 16px;
        }

        .algo-tag {
          border-radius: 999px;
          padding: 8px 11px;
          font-size: 10.5px;
          font-weight: 900;
          color: #cbd5e1;
          background: rgba(16,185,129,.045);
          border: 1px solid rgba(16,185,129,.13);
          box-shadow: 0 0 8px rgba(16,185,129,.035);
          animation: chipFloat 6s infinite ease-in-out;
        }

        .algo-tag:nth-child(2) {
          color: #bfdbfe;
          background: rgba(59,130,246,.045);
          border-color: rgba(59,130,246,.13);
          animation-delay: .4s;
        }

        .algo-tag:nth-child(3) {
          color: #ddd6fe;
          background: rgba(139,92,246,.045);
          border-color: rgba(139,92,246,.13);
          animation-delay: .8s;
        }

        .algo-tag:nth-child(4) {
          color: #d6d3d1;
          background: rgba(120,113,108,.045);
          border-color: rgba(168,162,158,.12);
          animation-delay: 1.2s;
        }

        .ai-footer {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 22px;
          flex-wrap: wrap;
        }

        .main-action {
          text-decoration: none;
          color: #02120c;
          background: linear-gradient(135deg, #34d399, #10b981 55%, #059669);
          box-shadow:
            0 0 10px rgba(16,185,129,.12),
            0 6px 14px rgba(5,150,105,.10);
          border-radius: 15px;
          padding: 14px 18px;
          font-weight: 950;
          font-size: 13px;
          transition: all .25s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: 230px;
          box-sizing: border-box;
        }

        .main-action:hover {
          transform: translateY(-1px);
          box-shadow:
            0 0 14px rgba(16,185,129,.18),
            0 8px 18px rgba(5,150,105,.14);
        }

        .action-note {
          color: #64748b;
          font-size: 11px;
          line-height: 1.5;
          max-width: 440px;
        }

        @media (max-width: 1150px) {
          .home-page {
            overflow: auto;
          }

          .home-grid {
            height: auto;
            grid-template-columns: 1fr;
          }

          .flow-panel {
            max-height: 480px;
          }

          .operation-head,
          .ai-card {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 680px) {
          .home-page {
            padding: 14px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="home-grid">
        <aside className="glass-card flow-panel">
          <div className="panel-header">
            <div className="panel-title-row">
              <div className="icon-box icon-blue">
                <svg viewBox="0 0 24 24" className="icon-svg">
                  <path d="M4 19V5" />
                  <path d="M8 19v-7" />
                  <path d="M12 19V9" />
                  <path d="M16 19v-4" />
                  <path d="M20 19V7" />
                </svg>
              </div>

              <div>
                <h3 className="section-title">Canlı Akış</h3>
                <p className="section-subtitle">Sistemde oluşan son işlem hareketleri</p>
              </div>
            </div>

            <div className="live-badge">
              <span className="live-dot" />
              Canlı
            </div>
          </div>

          <div className="flow-list">
            {systemLogs.length === 0 ? (
              <div className="empty-flow">
                Sistem hareket verisi bekleniyor.
                <br />
                Yeni işlem oluştuğunda akış burada görünür.
              </div>
            ) : (
              systemLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className={`flow-card ${log.time === 'Şimdi' ? 'now' : ''}`}
                  style={{ '--log-color': log.color || '#10b981' }}
                >
                  <div className="log-icon">
                    {getLogIcon(log.type || log.title)}
                  </div>

                  <div className="flow-content">
                    <div className="flow-top">
                      <h4 className="flow-title">{cleanLogTitle(log.title)}</h4>
                      <span className="time-chip">{log.time}</span>
                    </div>

                    <p className="flow-desc">{log.desc}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="glass-card operation-panel">
          <section className="operation-head">
            <div>
              <div className="kicker">
                <span className="live-dot" />
                EcoLogix TMS v2.0
              </div>

              <h1 className="page-title">
                Lojistik <span className="gradient-text">Kontrol Paneli</span>
              </h1>

              <p className="page-desc">
                Şube operasyonlarını, kurye durumlarını, ürün akışını ve rota optimizasyon süreçlerini
                tek merkezden izleyin. Sistem; mesafe, karbon salınımı ve çalışma süresini karşılaştırarak
                en uygun dağıtım planını oluşturur.
              </p>
            </div>

            <div className="network-visual">
              <svg viewBox="0 0 300 180" className="network-svg">
                <path className="network-line" d="M42 132 C85 60, 118 128, 150 88 S224 44, 258 104" />
                <path className="network-line network-line-blue" d="M54 54 C96 92, 110 38, 152 76 S222 126, 246 62" />
                <circle className="node" cx="42" cy="132" r="4" />
                <circle className="node blue" cx="92" cy="72" r="4" />
                <circle className="node stone" cx="150" cy="88" r="4" />
                <circle className="node blue" cx="212" cy="60" r="4" />
                <circle className="node" cx="258" cy="104" r="4" />
                <circle className="node stone" cx="54" cy="54" r="4" />
                <circle className="node" cx="246" cy="62" r="4" />
              </svg>

              <div className="visual-label">Algoritmik Rota Ağı</div>
            </div>
          </section>

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Toplam Kurye</div>
              <div className="stat-value">{couriers.length}</div>
              <div className="stat-help">Sisteme kayıtlı kurye</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Aktif Kurye</div>
              <div className="stat-value amber-text">{activeCourierCount}</div>
              <div className="stat-help">Dağıtımda veya meşgul</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Müsait Kurye</div>
              <div className="stat-value green-text">{availableCourierCount}</div>
              <div className="stat-help">Yeni rota atanabilir</div>
            </div>
          </section>

          <section className="glass-card ai-card">
            <div className="ai-content">
              <div className="ai-title-row">
                <div className="ai-mark">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2v4" />
                    <path d="M12 18v4" />
                    <path d="M4.93 4.93l2.83 2.83" />
                    <path d="M16.24 16.24l2.83 2.83" />
                    <path d="M2 12h4" />
                    <path d="M18 12h4" />
                    <path d="M4.93 19.07l2.83-2.83" />
                    <path d="M16.24 7.76l2.83-2.83" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>

                <div>
                  <h2 className="ai-title">Yapay Zeka Destekli Rota Planlama</h2>
                  <div className="ai-subtitle">Çoklu algoritma karşılaştırma motoru</div>
                </div>
              </div>

              <p className="ai-text">
                EcoLogix, dağıtıma hazır ürünler için farklı rota optimizasyon algoritmalarını aynı anda
                karşılaştırır. Mesafe, karbon salınımı ve çalışma süresi birlikte değerlendirilerek
                en uygun dağıtım rotası seçilir.
              </p>

              <div className="algo-tags">
                <span className="algo-tag">ACO</span>
                <span className="algo-tag">Genetik Algoritma</span>
                <span className="algo-tag">SGO</span>
                <span className="algo-tag">Greedy</span>
              </div>

              <div className="ai-footer">
                <Link to="/kurye-atama" className="main-action">
                  Rota Planlamaya Git
                  <span>→</span>
                </Link>

                <div className="action-note">
                  Kurye atama ekranında algoritmalar karşılaştırılır ve seçilen rota harita üzerinde görüntülenir.
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
