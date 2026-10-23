import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ApiService } from './services/api';

import Navbar from './components/Navbar';
import AnaSayfa from './pages/AnaSayfa';
import KuryeAtama from './pages/KuryeAtama';
import KuryeTakip from './pages/KuryeTakip';
import UrunKontrol from './pages/UrunKontrol';
import MusteriTakip from './pages/MusteriTakip';
import UrunKayit from './pages/UrunKayit';
import KuryeKayit from './pages/KuryeKayit';
import Login from './pages/Login';
import Register from './pages/Register';

import 'leaflet/dist/leaflet.css';

function isLoggedIn() {
  return Boolean(localStorage.getItem('username'));
}

function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function LayoutWrapper({ children }) {
  const location = useLocation();

  const isPublicPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/kargo-takip';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        background: '#0b0f19',
        overflow: 'hidden'
      }}
    >
      {!isPublicPage && <Navbar />}

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {children}
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();

  const [couriers, setCouriers] = useState([]);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [activeCourier, setActiveCourier] = useState(null);
  const [pendingShipments, setPendingShipments] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'info'
  });

  const [stats, setStats] = useState({
    winnerAlgo: '-',
    totalCarbon: '0.00 kg',
    execTime: '0 ms',
    fitnessScore: '-'
  });

  const [systemLogs, setSystemLogs] = useState([
    {
      id: 1,
      title: 'Dağıtım Merkezi Aktif',
      desc: 'EcoLogix merkez üssü sevkiyat emirleri ve kargo yönetimi için hazır duruma getirildi.',
      time: 'Şimdi',
      color: '#3b82f6'
    },
    {
      id: 2,
      title: 'Sipariş Listeleri Alındı',
      desc: 'Güncel teslimat paketleri sisteme başarıyla aktarıldı, planlama bekleniyor.',
      time: '1 dk önce',
      color: '#f59e0b'
    }
  ]);

  const fetchReadyShipments = useCallback(async () => {
    if (!isLoggedIn()) {
      setPendingShipments([]);
      return;
    }

    const activeBranchCity = localStorage.getItem('branchCity') || '';
    const activeBranchName = localStorage.getItem('branchName') || '';

    if (!activeBranchCity) {
      setPendingShipments([]);
      return;
    }

    try {
      const shipmentList = await ApiService.getAllShipments();
      const safeShipmentList = Array.isArray(shipmentList) ? shipmentList : [];

      const readyList = safeShipmentList.filter((shipment) => {
        const statusOk = shipment.status === 'PENDING';
        const cityOk =
          shipment.currentHubCity?.trim().toLowerCase() ===
          activeBranchCity.trim().toLowerCase();

        const destinationCityOk =
          shipment.destinationCity?.trim().toLowerCase() ===
          activeBranchCity.trim().toLowerCase();

        const hubNameOk = activeBranchName
          ? shipment.currentHub?.trim().toLowerCase() ===
            activeBranchName.trim().toLowerCase()
          : true;

        const notAssigned = !shipment.courierId;

        return statusOk && notAssigned;
      });
      console.log("TÜM ÜRÜNLER:", safeShipmentList);
      console.log("PENDING ÜRÜNLER:", safeShipmentList.filter(s => s.status === "PENDING"));
      console.log("READY LIST:", readyList);
      console.log("AKTİF ŞUBE:", activeBranchCity, activeBranchName);
      console.table(
  safeShipmentList.map(s => ({
    id: s.id,
    status: s.status,
    courierId: s.courierId,
    currentHub: s.currentHub,
    currentHubCity: s.currentHubCity,
    destinationCity: s.destinationCity
  }))
);

      setPendingShipments(readyList);
    } catch (error) {
      console.error('Dağıtıma hazır ürünler alınamadı:', error);
      setPendingShipments([]);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    if (!isLoggedIn()) {
      setCouriers([]);
      setSelectedCourierId('');
      setActiveCourier(null);
      setPendingShipments([]);
      return;
    }

    try {
      const courierList = await ApiService.getAllCouriers();
      const safeCourierList = Array.isArray(courierList) ? courierList : [];

      setCouriers(safeCourierList);

      setSelectedCourierId((prevSelectedId) => {
        if (safeCourierList.length === 0) {
          setActiveCourier(null);
          return '';
        }

        const current =
          safeCourierList.find((courier) => String(courier.id) === String(prevSelectedId)) ||
          safeCourierList[0];

        setActiveCourier(current);

        return String(current.id);
      });

      await fetchReadyShipments();
    } catch (error) {
      console.error('Başlangıç verileri alınamadı:', error);
      setCouriers([]);
      setSelectedCourierId('');
      setActiveCourier(null);
      setPendingShipments([]);
    }
  }, [fetchReadyShipments]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData, location.pathname]);

  useEffect(() => {
    if (!toast.show) return;

    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast.show]);

  const showNotification = (message, type = 'info') => {
    setToast({
      show: true,
      message,
      type
    });
  };

  const handleCompare = async () => {
    if (!selectedCourierId) {
      showNotification('Lütfen önce kurye seçin.', 'warning');
      return [];
    }

    setLoading(true);

    try {
      const data = await ApiService.compareAlgorithms(selectedCourierId);

      const sortedReports = [...(data || [])].sort((a, b) => {
        const distanceA = Number(a.totalDistance || 0);
        const distanceB = Number(b.totalDistance || 0);
        const carbonA = Number(a.totalCarbon || 0);
        const carbonB = Number(b.totalCarbon || 0);

        if (distanceA !== distanceB) return distanceA - distanceB;
        return carbonA - carbonB;
      });

      setReports(sortedReports);

      if (sortedReports.length > 0) {
        const champion = sortedReports[0];

        setPendingShipments(champion.route || []);

        setStats({
          winnerAlgo: champion.algorithmName || '-',
          totalCarbon: `${(champion.totalCarbon || 0).toFixed(2)} kg`,
          execTime: `${champion.executionTime ?? champion.calculationTime ?? 0} ms`,
          fitnessScore: (champion.fitnessScore || 0).toFixed(1)
        });

        showNotification('Yarış tamamlandı. En uygun rota hesaplandı.', 'success');

        const newLog = {
          id: Date.now(),
          title: 'En Uygun Rota Hesaplandı',
          desc: `${activeCourier?.name || 'Görevli'} için düşük mesafe ve düşük karbon odaklı sevkiyat rotası belirlendi.`,
          time: 'Şimdi',
          color: '#3b82f6'
        };

        setSystemLogs((prev) =>
          [
            newLog,
            ...prev.map((log) =>
              log.time === 'Şimdi' ? { ...log, time: 'Az önce' } : log
            )
          ].slice(0, 4)
        );
      }

      return sortedReports;
    } catch (error) {
      console.error('Algoritma karşılaştırma hatası:', error);
      showNotification('Hata: Dağıtıma hazır paket bulunamadı.', 'error');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    try {
      const shipmentIds = pendingShipments.map((shipment) => shipment.id);
      const distanceValue = parseFloat(reports[0]?.totalDistance || 0);
      const carbonEmittedValue = parseFloat(stats.totalCarbon.replace(' kg', '')) || 0;
      const carbonSavedValue = parseFloat(stats.fitnessScore) || 0;

      await ApiService.assignBestRoute(
        shipmentIds,
        String(selectedCourierId),
        stats.winnerAlgo,
        distanceValue,
        carbonEmittedValue,
        carbonSavedValue
      );

      showNotification(`Rota ${stats.winnerAlgo} olarak kuryeye atandı.`, 'success');

      const newLog = {
        id: Date.now(),
        title: `${activeCourier?.name || 'Kurye'} Göreve Çıktı`,
        desc: 'Akıllı teslimat planı onaylandı. Kurye, paketleri adrese ulaştırmak üzere dağıtıma çıktı.',
        time: 'Şimdi',
        color: '#10b981'
      };

      setSystemLogs((prev) =>
        [
          newLog,
          ...prev.map((log) =>
            log.time === 'Şimdi' ? { ...log, time: 'Az önce' } : log
          )
        ].slice(0, 4)
      );

      setCouriers((prevCouriers) => {
        const updated = prevCouriers.map((courier) =>
          String(courier.id) === String(selectedCourierId)
            ? { ...courier, status: 'ON_DELIVERY' }
            : courier
        );

        const currentActive = updated.find(
          (courier) => String(courier.id) === String(selectedCourierId)
        );

        if (currentActive) {
          setActiveCourier(currentActive);
        }

        return updated;
      });

      setPendingShipments([]);
      setTimeout(fetchInitialData, 600);
    } catch (error) {
      console.error('Atama işlemi esnasında ağ bağlantı hatası:', error);
      showNotification('Atama sırasında veritabanı hatası oluştu.', 'error');
    }
  };

  return (
    <LayoutWrapper>
      {toast.show && (
        <div
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background:
              toast.type === 'success'
                ? '#10b981'
                : toast.type === 'error'
                ? '#ef4444'
                : '#f59e0b',
            color: 'white',
            padding: '14px 24px',
            borderRadius: '12px',
            fontWeight: '800',
            fontSize: '14px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}
        >
          {toast.message}
        </div>
      )}

      <Routes>
        <Route
          path="/login"
          element={isLoggedIn() ? <Navigate to="/" replace /> : <Login />}
        />

        <Route
          path="/register"
          element={isLoggedIn() ? <Navigate to="/" replace /> : <Register />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AnaSayfa
                systemLogs={systemLogs}
                setSystemLogs={setSystemLogs}
                couriers={couriers}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kurye-atama"
          element={
            <ProtectedRoute>
              <KuryeAtama
                showNotification={showNotification}
                stats={stats}
                setStats={setStats}
                reports={reports}
                setReports={setReports}
                pendingShipments={pendingShipments}
                setPendingShipments={setPendingShipments}
                couriers={couriers}
                setCouriers={setCouriers}
                selectedCourierId={selectedCourierId}
                setSelectedCourierId={setSelectedCourierId}
                activeCourier={activeCourier}
                setActiveCourier={setActiveCourier}
                loading={loading}
                setLoading={setLoading}
                handleCompare={handleCompare}
                handleAssign={handleAssign}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kurye-takip"
          element={
            <ProtectedRoute>
              <KuryeTakip />
            </ProtectedRoute>
          }
        />

        <Route
          path="/urun-kontrol"
          element={
            <ProtectedRoute>
              <UrunKontrol />
            </ProtectedRoute>
          }
        />

        <Route
          path="/urun-kayit"
          element={
            <ProtectedRoute>
              <UrunKayit showNotification={showNotification} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kurye-kayit"
          element={
            <ProtectedRoute>
              <KuryeKayit showNotification={showNotification} />
            </ProtectedRoute>
          }
        />

        <Route path="/kargo-takip" element={<MusteriTakip />} />

        <Route
          path="*"
          element={<Navigate to={isLoggedIn() ? '/' : '/login'} replace />}
        />
      </Routes>
    </LayoutWrapper>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
