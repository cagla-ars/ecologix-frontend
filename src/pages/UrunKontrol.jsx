import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';

export default function UrunKontrol() {
  const CURRENT_BRANCH_NAME = localStorage.getItem('branchName') || '';
  const CURRENT_BRANCH_CITY = localStorage.getItem('branchCity') || '';

  const [shipments, setShipments] = useState([]);
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadShipments();
  }, []);

  const normalizeText = (value) => {
    return String(value || '')
      .toLowerCase()
      .replaceAll('ı', 'i')
      .replaceAll('ğ', 'g')
      .replaceAll('ü', 'u')
      .replaceAll('ş', 's')
      .replaceAll('ö', 'o')
      .replaceAll('ç', 'c')
      .replace('aktarma merkezi', '')
      .replace('dagitim merkezi', '')
      .replace('dağıtım merkezi', '')
      .replace('dagitim', '')
      .replace('dağıtım', '')
      .replace('aktarma', '')
      .replace('merkezi', '')
      .replace('merkez', '')
      .replace('subesi', '')
      .replace('şubesi', '')
      .replace('sube', '')
      .replace('şube', '')
      .trim();
  };

  const branchCity = normalizeText(CURRENT_BRANCH_CITY);
  const branchName = normalizeText(CURRENT_BRANCH_NAME);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getAllShipments();
      setShipments(Array.isArray(data) ? data : []);
      setSelectedShipment(null);
    } catch (error) {
      console.error('Sevkiyat verileri alınamadı:', error);
      alert('Sevkiyat verileri alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'HUB_TRANSFER':
        return 'Transfer Sürecinde';
      case 'AT_BRANCH':
        return 'Şubede Bekliyor';
      case 'PENDING':
        return 'Dağıtıma Hazır';
      case 'IN_TRANSIT':
        return 'Kuryede';
      case 'FORWARDED':
        return 'Aktarıldı';
      case 'DELIVERED':
        return 'Teslim Edildi';
      default:
        return status || 'Bilinmiyor';
    }
  };

  const isInThisBranch = (shipment) => {
    const currentHub = normalizeText(shipment?.currentHub);
    const currentHubCity = normalizeText(shipment?.currentHubCity);

    return (
      currentHubCity === branchCity ||
      currentHub === branchName ||
      currentHub.includes(branchName) ||
      currentHub.includes(branchCity)
    );
  };

  const isProductToForward = (shipment) => {
    return (
      shipment?.status === 'AT_BRANCH' &&
      isInThisBranch(shipment) &&
      normalizeText(shipment?.destinationCity) !== branchCity
    );
  };

  const isProductToDeliverLocally = (shipment) => {
    return (
      shipment?.status === 'AT_BRANCH' &&
      isInThisBranch(shipment) &&
      normalizeText(shipment?.destinationCity) === branchCity
    );
  };

  const isReadyForDelivery = (shipment) => {
    return (
      shipment?.status === 'PENDING' &&
      isInThisBranch(shipment) &&
      normalizeText(shipment?.destinationCity) === branchCity
    );
  };

  const isInCourier = (shipment) => {
    return isInThisBranch(shipment) && shipment?.status === 'IN_TRANSIT';
  };

  const isCompleted = (shipment) => {
    return (
      isInThisBranch(shipment) &&
      (shipment?.status === 'FORWARDED' || shipment?.status === 'DELIVERED')
    );
  };

  const filteredShipments = shipments.filter((s) => {
    const keyword = barcodeSearch.toLowerCase().trim();
    const matchesBarcode = !keyword || s.barcode?.toLowerCase().includes(keyword);

    if (!matchesBarcode) return false;

    if (statusFilter === 'AKTARILACAK') return isProductToForward(s);
    if (statusFilter === 'DAGITILACAK') return isProductToDeliverLocally(s) || isReadyForDelivery(s);
    if (statusFilter === 'KURYEDE') return isInCourier(s);
    if (statusFilter === 'TAMAMLANAN') return isCompleted(s);

    return isInThisBranch(s);
  });

  const handleBarcodeSearch = (e) => {
    e.preventDefault();

    const value = barcodeSearch.trim().toLowerCase();

    if (!value) {
      alert('Lütfen barkod numarası girin.');
      return;
    }

    const foundShipment = shipments.find(
      (s) => isInThisBranch(s) && s.barcode?.toLowerCase() === value
    );

    if (!foundShipment) {
      alert('Bu barkod numarasına ait ürün bu şubede bulunamadı.');
      return;
    }

    setSelectedShipment(foundShipment);
  };

  const handleForwardConfirm = async () => {
    if (!selectedShipment) {
      alert('Önce bir ürün seçmelisiniz.');
      return;
    }

    if (!isProductToForward(selectedShipment)) {
      alert('Bu ürün aktarma işlemi için uygun değil.');
      return;
    }

    try {
      setLoading(true);
      await ApiService.forwardShipment(selectedShipment.id);
      alert('Ürün başka merkeze aktarılmak üzere sevk edildi.');
      setBarcodeSearch('');
      setSelectedShipment(null);
      await loadShipments();
    } catch (error) {
      console.error('Aktarma işlemi başarısız:', error);
      alert('Aktarma işlemi tamamlanamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleReadyForDelivery = async () => {
    if (!selectedShipment) {
      alert('Önce bir ürün seçmelisiniz.');
      return;
    }

    if (!isProductToDeliverLocally(selectedShipment)) {
      alert('Bu ürün dağıtıma hazır hale getirilemez.');
      return;
    }

    try {
      setLoading(true);
      await ApiService.readyForDelivery(selectedShipment.id);
      alert('Ürün dağıtıma hazır hale getirildi.');
      setBarcodeSearch('');
      setSelectedShipment(null);
      await loadShipments();
    } catch (error) {
      console.error('Dağıtıma hazırlama işlemi başarısız:', error);
      alert('Ürün dağıtıma hazır hale getirilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const totalCount = shipments.filter(isInThisBranch).length;
  const forwardCount = shipments.filter(isProductToForward).length;
  const localDeliveryCount = shipments.filter((s) => isProductToDeliverLocally(s) || isReadyForDelivery(s)).length;
  const courierCount = shipments.filter(isInCourier).length;

  const totalWeight = filteredShipments.reduce(
    (sum, s) => sum + Number(s.weight || 0),
    0
  );

  const StatIcon = ({ type }) => {
    if (type === 'total') {
      return (
        <svg viewBox="0 0 24 24" className="icon-svg">
          <path d="M4 7.5L12 3l8 4.5v9L12 21l-8-4.5v-9z" />
          <path d="M4 7.5l8 4.5 8-4.5" />
          <path d="M12 12v9" />
        </svg>
      );
    }

    if (type === 'forward') {
      return (
        <svg viewBox="0 0 24 24" className="icon-svg">
          <path d="M5 12h13" />
          <path d="M14 8l4 4-4 4" />
          <path d="M6 6h6" />
          <path d="M6 18h6" />
        </svg>
      );
    }

    if (type === 'local') {
      return (
        <svg viewBox="0 0 24 24" className="icon-svg">
          <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" />
          <path d="M12 10.5h.01" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" className="icon-svg">
        <path d="M5 17h14" />
        <path d="M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        <path d="M17 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        <path d="M6 13h12l-1.2-4.2A2.5 2.5 0 0 0 14.4 7H9.6a2.5 2.5 0 0 0-2.4 1.8L6 13z" />
      </svg>
    );
  };

  return (
    <div className="urun-kontrol-page">
      <style>{`
        .urun-kontrol-page {
          height: calc(100vh - 105px);
          background: #070b16;
          color: #e5e7eb;
          padding: 8px 14px;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 9px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 9px;
          flex-shrink: 0;
        }

        .card {
          background: linear-gradient(180deg, #111827 0%, #0b1120 100%);
          border: 1px solid rgba(45, 212, 191, 0.12);
          border-radius: 15px;
          box-shadow: 0 12px 32px rgba(0,0,0,.35);
        }

        @keyframes pulseGlow {
          0% { transform: rotate(0deg); opacity: .35; }
          50% { opacity: .85; }
          100% { transform: rotate(360deg); opacity: .35; }
        }

        .stat-card {
          min-height: 56px;
          padding: 9px 14px;
          display: flex;
          align-items: center;
          gap: 11px;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: "";
          position: absolute;
          inset: -45%;
          background: radial-gradient(circle, rgba(255,255,255,.08), transparent 65%);
          animation: pulseGlow 5s linear infinite;
          pointer-events: none;
        }

        .stat-card > * {
          position: relative;
          z-index: 1;
        }

        .stat-icon {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .green {
          background: rgba(16,185,129,.10);
          border: 1px solid rgba(16,185,129,.28);
          color: #34d399;
          box-shadow: 0 0 18px rgba(16,185,129,.18);
        }

        .blue {
          background: rgba(59,130,246,.10);
          border: 1px solid rgba(59,130,246,.28);
          color: #60a5fa;
          box-shadow: 0 0 18px rgba(59,130,246,.18);
        }

        .purple {
          background: rgba(139,92,246,.10);
          border: 1px solid rgba(167,139,250,.30);
          color: #c4b5fd;
          box-shadow: 0 0 18px rgba(139,92,246,.18);
        }

        .earth {
          background: rgba(245,158,11,.10);
          border: 1px solid rgba(245,158,11,.28);
          color: #fbbf24;
          box-shadow: 0 0 18px rgba(245,158,11,.18);
        }

        .icon-svg {
          width: 18px;
          height: 18px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.9;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .stat-label {
          font-size: 9.5px;
          color: #94a3b8;
          font-weight: 900;
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 900;
          color: #f8fafc;
          margin-top: 1px;
        }

        .main {
          flex: 1;
          display: grid;
          grid-template-columns: 238px minmax(0, 1fr) 305px;
          gap: 9px;
          min-height: 0;
          overflow: hidden;
        }

        .sidebar,
        .center,
        .detail {
          padding: 12px;
          box-sizing: border-box;
          min-height: 0;
          overflow: hidden;
        }

        .sidebar,
        .detail {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .center {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .section-title {
          font-size: 10.5px;
          color: #cbd5e1;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .branch-box {
          padding: 12px;
          border-radius: 15px;
          background: linear-gradient(135deg, rgba(16,185,129,.08), rgba(5,150,105,.035));
          border: 1px solid rgba(16,185,129,.22);
          box-shadow: 0 0 22px rgba(16,185,129,.08), inset 0 0 25px rgba(255,255,255,.02);
        }

        .branch-label {
          color: #94a3b8;
          font-size: 9.5px;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .branch-value {
          color: #6ee7b7;
          font-size: 12.5px;
          font-weight: 900;
          line-height: 1.3;
        }

        .branch-city {
          margin-top: 4px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
        }

        .filter-btn {
          width: 100%;
          padding: 8px 11px;
          border-radius: 11px;
          background: #101827;
          border: 1px solid #1f2a44;
          color: #94a3b8;
          font-size: 11.5px;
          font-weight: 850;
          margin-bottom: 6px;
          box-sizing: border-box;
          cursor: pointer;
          text-align: left;
        }

        .filter-btn:hover {
          border-color: rgba(16,185,129,.32);
          color: #e5e7eb;
        }

        .filter-btn.active {
          background: rgba(16,185,129,.12);
          color: #34d399;
          border-color: rgba(16,185,129,.55);
        }

        .input {
          width: 100%;
          background: #080d18;
          border: 1px solid #25314d;
          color: #e5e7eb;
          padding: 8px 11px;
          border-radius: 10px;
          outline: none;
          box-sizing: border-box;
          font-size: 11.5px;
        }

        .input:focus {
          border-color: rgba(16,185,129,.55);
          box-shadow: 0 0 0 3px rgba(16,185,129,.07);
        }

        .search-box {
          padding: 10px 12px;
          border: 1px solid rgba(16,185,129,.28);
          background: rgba(16,185,129,.055);
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 11px;
          flex-shrink: 0;
        }

        .search-mark {
          width: 38px;
          height: 38px;
          border-radius: 13px;
          background: rgba(16,185,129,.13);
          color: #5eead4;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(16,185,129,.18);
        }

        .barcode-svg {
          width: 20px;
          height: 20px;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
        }

        .search-title {
          font-size: 13px;
          font-weight: 900;
          color: #f8fafc;
          letter-spacing: .4px;
        }

        .primary-btn {
          border: none;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 9px 14px;
          border-radius: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .primary-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .secondary-btn {
          border: 1px solid #25314d;
          background: #101827;
          color: #cbd5e1;
          padding: 9px;
          border-radius: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .table-wrap {
          flex: 1;
          min-height: 0;
          overflow: auto;
        }

        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 6px;
        }

        th {
          color: #94a3b8;
          font-size: 9.5px;
          text-align: left;
          padding: 7px 10px;
          background: #080d18;
          text-transform: uppercase;
          position: sticky;
          top: 0;
          z-index: 2;
        }

        td {
          padding: 8px 10px;
          background: #101827;
          border-top: 1px solid #1f2a44;
          border-bottom: 1px solid #1f2a44;
          font-size: 11.5px;
        }

        td:first-child {
          border-left: 1px solid #1f2a44;
          border-radius: 11px 0 0 11px;
        }

        td:last-child {
          border-right: 1px solid #1f2a44;
          border-radius: 0 11px 11px 0;
        }

        tr.data-row {
          cursor: pointer;
        }

        tr.data-row:hover td,
        tr.selected td {
          background: rgba(16,185,129,.1);
          border-color: rgba(52,211,153,.45);
        }

        .code {
          color: #f8fafc;
          font-weight: 900;
          font-family: monospace;
        }

        .muted {
          color: #94a3b8;
          font-size: 10.5px;
        }

        .strong {
          color: #e5e7eb;
          font-weight: 850;
        }

        .status {
          display: inline-flex;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 8.5px;
          font-weight: 900;
          background: rgba(16,185,129,.12);
          color: #34d399;
          border: 1px solid rgba(16,185,129,.35);
          white-space: nowrap;
        }

        .small-btn {
          border: 1px solid #25314d;
          background: #0b1220;
          color: #cbd5e1;
          padding: 6px 9px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 800;
          font-size: 10.5px;
        }

        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid #1f2a44;
          padding-top: 6px;
          flex-shrink: 0;
        }

        .summary-item {
          text-align: center;
        }

        .summary-label {
          color: #94a3b8;
          font-size: 9.5px;
        }

        .summary-value {
          color: #f8fafc;
          font-size: 16px;
          font-weight: 900;
        }

        .detail-header-box {
          padding: 12px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(16,185,129,.10), rgba(5,150,105,.06));
          border: 1px solid rgba(16,185,129,.18);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .detail-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: rgba(16,185,129,.13);
          border: 1px solid rgba(16,185,129,.24);
          color: #6ee7b7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .detail-title {
          color: #f8fafc;
          font-size: 14px;
          font-weight: 900;
          font-family: monospace;
        }

        .detail-subtitle {
          color: #94a3b8;
          font-size: 10.5px;
          margin-top: 3px;
        }

        .detail-status-line {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 10px rgba(52,211,153,.45);
        }

        .info-list {
          margin-top: 10px;
          overflow: auto;
          background: rgba(8,13,24,.35);
          border: 1px solid rgba(31,42,68,.85);
          border-radius: 13px;
          padding: 4px 10px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid #1f2a44;
          font-size: 11.5px;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          color: #94a3b8;
        }

        .info-value {
          color: #f8fafc;
          font-weight: 800;
          text-align: right;
          word-break: break-word;
        }

        .empty,
        .detail-empty {
          flex: 1;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 12px;
          text-align: center;
        }

        .action-area {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .warning-note {
          font-size: 10.5px;
          color: #94a3b8;
          line-height: 1.35;
          padding: 9px;
          border-radius: 10px;
          background: rgba(245,158,11,.07);
          border: 1px solid rgba(245,158,11,.16);
        }
      `}</style>

      <div className="stats">
        <div className="card stat-card">
          <div className="stat-icon green">
            <StatIcon type="total" />
          </div>
          <div>
            <div className="stat-label">Şubedeki Toplam</div>
            <div className="stat-value">{totalCount}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon blue">
            <StatIcon type="forward" />
          </div>
          <div>
            <div className="stat-label">Aktarılacak</div>
            <div className="stat-value">{forwardCount}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon purple">
            <StatIcon type="local" />
          </div>
          <div>
            <div className="stat-label">Dağıtılacak</div>
            <div className="stat-value">{localDeliveryCount}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon earth">
            <StatIcon type="courier" />
          </div>
          <div>
            <div className="stat-label">Kuryede</div>
            <div className="stat-value">{courierCount}</div>
          </div>
        </div>
      </div>

      <div className="main">
        <aside className="card sidebar">
          <div className="branch-box">
            <div className="branch-label">Aktif Şube</div>
            <div className="branch-value">{CURRENT_BRANCH_NAME || '-'}</div>
            <div className="branch-city">{CURRENT_BRANCH_CITY || '-'}</div>
          </div>

          <div>
            <div className="section-title">Filtreler</div>

            <button className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`} onClick={() => { setStatusFilter('ALL'); setSelectedShipment(null); }}>
              Şubedeki Tüm Ürünler
            </button>

            <button className={`filter-btn ${statusFilter === 'AKTARILACAK' ? 'active' : ''}`} onClick={() => { setStatusFilter('AKTARILACAK'); setSelectedShipment(null); }}>
              Aktarma Bekleyenler
            </button>

            <button className={`filter-btn ${statusFilter === 'DAGITILACAK' ? 'active' : ''}`} onClick={() => { setStatusFilter('DAGITILACAK'); setSelectedShipment(null); }}>
              Dağıtıma Hazırlar
            </button>

            <button className={`filter-btn ${statusFilter === 'KURYEDE' ? 'active' : ''}`} onClick={() => { setStatusFilter('KURYEDE'); setSelectedShipment(null); }}>
              Kuryedeki Ürünler
            </button>

            <button className={`filter-btn ${statusFilter === 'TAMAMLANAN' ? 'active' : ''}`} onClick={() => { setStatusFilter('TAMAMLANAN'); setSelectedShipment(null); }}>
              Tamamlanan Sevkiyatlar
            </button>
          </div>
        </aside>

        <main className="card center">
          <form className="search-box" onSubmit={handleBarcodeSearch}>
            <div className="search-mark">
              <svg viewBox="0 0 24 24" className="barcode-svg">
                <path d="M5 5v14" />
                <path d="M8 5v14" />
                <path d="M12 5v14" />
                <path d="M16 5v14" />
                <path d="M19 5v14" />
              </svg>
            </div>

            <div style={{ flex: 1 }}>
              <div className="search-title">BARKOD NUMARASI</div>
            </div>

            <input
              className="input"
              style={{ width: 210 }}
              placeholder="ECO-20260001"
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
            />

            <button className="primary-btn" type="submit" disabled={loading}>
              Ara
            </button>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Barkod No</th>
                  <th>Alıcı</th>
                  <th>Güzergah</th>
                  <th>Mevcut Konum</th>
                  <th>Durum</th>
                  <th>İşlem</th>
                </tr>
              </thead>

              <tbody>
                {filteredShipments.map((s) => (
                  <tr
                    key={s.id}
                    className={`data-row ${selectedShipment?.id === s.id ? 'selected' : ''}`}
                    onClick={() => setSelectedShipment(s)}
                  >
                    <td><div className="code">{s.barcode || '-'}</div></td>

                    <td>
                      <div className="strong">{s.receiverName || '-'}</div>
                      <div className="muted">{s.weight || 0} kg</div>
                    </td>

                    <td>
                      <div className="strong">{s.originCity || '-'} → {s.destinationCity || '-'}</div>
                    </td>

                    <td><div className="strong">{s.currentHub || '-'}</div></td>

                    <td><span className="status">{formatStatus(s.status)}</span></td>

                    <td>
                      <button
                        type="button"
                        className="small-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShipment(s);
                        }}
                      >
                        Detay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && filteredShipments.length === 0 && (
              <div className="empty">Bu filtreye uygun ürün bulunamadı.</div>
            )}

            {loading && <div className="empty">Veriler yükleniyor...</div>}
          </div>

          <div className="summary">
            <div className="summary-item">
              <div className="summary-label">Listelenen Ürün</div>
              <div className="summary-value">{filteredShipments.length}</div>
            </div>

            <div className="summary-item">
              <div className="summary-label">Toplam Kütle</div>
              <div className="summary-value">{totalWeight.toFixed(1)} kg</div>
            </div>

            <div className="summary-item">
              <div className="summary-label">Seçili Ürün</div>
              <div className="summary-value">{selectedShipment ? 'Var' : 'Yok'}</div>
            </div>
          </div>
        </main>

        <aside className="card detail">
          <div className="section-title">Ürün Detayı</div>

          {!selectedShipment ? (
            <div className="detail-empty">Detay görmek için listeden ürün seç.</div>
          ) : (
            <>
              <div className="detail-header-box">
                <div className="detail-icon">
                  <svg viewBox="0 0 24 24" className="icon-svg">
                    <path d="M4 7.5L12 3l8 4.5v9L12 21l-8-4.5v-9z" />
                    <path d="M4 7.5l8 4.5 8-4.5" />
                    <path d="M12 12v9" />
                  </svg>
                </div>

                <div>
                  <div className="detail-title">{selectedShipment.barcode || '-'}</div>
                  <div className="detail-subtitle">{selectedShipment.currentHub || '-'}</div>

                  <div className="detail-status-line">
                    <span className="dot"></span>
                    <span className="muted">{formatStatus(selectedShipment.status)}</span>
                  </div>
                </div>
              </div>

              <div className="info-list">
                <div className="info-row"><span className="info-label">Alıcı</span><span className="info-value">{selectedShipment.receiverName || '-'}</span></div>
                <div className="info-row"><span className="info-label">Gönderici</span><span className="info-value">{selectedShipment.senderName || '-'}</span></div>
                <div className="info-row"><span className="info-label">Çıkış Şehri</span><span className="info-value">{selectedShipment.originCity || '-'}</span></div>
                <div className="info-row"><span className="info-label">Teslimat Şehri</span><span className="info-value">{selectedShipment.destinationCity || '-'}</span></div>
                <div className="info-row"><span className="info-label">Mevcut Konum</span><span className="info-value">{selectedShipment.currentHub || '-'}</span></div>
                <div className="info-row"><span className="info-label">Adres</span><span className="info-value">{selectedShipment.deliveryAddress || '-'}</span></div>
                <div className="info-row"><span className="info-label">Kütle</span><span className="info-value">{selectedShipment.weight || 0} kg</span></div>
              </div>

              {statusFilter === 'AKTARILACAK' && (
                <div className="action-area">
                  {!isProductToForward(selectedShipment) && (
                    <div className="warning-note">
                      Bu ürün aktarma işlemi için uygun değil.
                    </div>
                  )}

                  <button
                    className="primary-btn"
                    disabled={!isProductToForward(selectedShipment) || loading}
                    onClick={handleForwardConfirm}
                  >
                    Aktarma İşlemini Onayla
                  </button>
                </div>
              )}

              {statusFilter === 'DAGITILACAK' && selectedShipment.status === 'AT_BRANCH' && (
                <div className="action-area">
                  <button
                    className="primary-btn"
                    disabled={!isProductToDeliverLocally(selectedShipment) || loading}
                    onClick={handleReadyForDelivery}
                  >
                    Dağıtıma Hazır Yap
                  </button>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}