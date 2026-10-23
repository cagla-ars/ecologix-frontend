import { useEffect, useMemo, useState } from 'react';
import { ApiService } from '../services/api';

export default function UrunKayit() {
  const ACTIVE_BRANCH = localStorage.getItem('branchName') || '';
  const ACTIVE_BRANCH_CITY = localStorage.getItem('branchCity') || '';

  const [branches, setBranches] = useState([]);

  const [formData, setFormData] = useState({
    senderName: '',
    receiverName: '',
    transferBranchId: '',
    destinationBranchId: '',
    destinationCity: '',
    deliveryAddress: '',
    weight: '',
    cargoType: 'KOLİ',
    priority: 2,
    lat: '',
    lon: ''
  });

  const [loading, setLoading] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [createdShipment, setCreatedShipment] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setBranchLoading(true);
      const data = await ApiService.getAllBranches();
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Şubeler alınamadı:', error);
      alert('Kayıtlı şubeler alınamadı. Lütfen backend bağlantısını kontrol edin.');
    } finally {
      setBranchLoading(false);
    }
  };

  const selectableBranches = useMemo(() => {
    return branches.filter(
      (branch) =>
        branch.branchName &&
        branch.branchName.trim().toLowerCase() !== ACTIVE_BRANCH.trim().toLowerCase()
    );
  }, [branches, ACTIVE_BRANCH]);

  const selectedTransferBranch = useMemo(() => {
    return branches.find((branch) => String(branch.id) === String(formData.transferBranchId));
  }, [branches, formData.transferBranchId]);

  const selectedDestinationBranch = useMemo(() => {
    return branches.find((branch) => String(branch.id) === String(formData.destinationBranchId));
  }, [branches, formData.destinationBranchId]);

  const transferOptions = useMemo(() => {
    return selectableBranches.filter(
      (branch) => String(branch.id) !== String(formData.destinationBranchId)
    );
  }, [selectableBranches, formData.destinationBranchId]);

  const destinationOptions = useMemo(() => {
    return selectableBranches.filter(
      (branch) => String(branch.id) !== String(formData.transferBranchId)
    );
  }, [selectableBranches, formData.transferBranchId]);

  const getRoutePreview = () => {
    if (!selectedDestinationBranch) return `${ACTIVE_BRANCH_CITY || '-'} → -`;

    if (selectedTransferBranch) {
      return `${ACTIVE_BRANCH_CITY || '-'} → ${selectedTransferBranch.branchCity || '-'} → ${selectedDestinationBranch.branchCity || '-'}`;
    }

    return `${ACTIVE_BRANCH_CITY || '-'} → ${selectedDestinationBranch.branchCity || '-'}`;
  };

  const getDetailedRoutePreview = () => {
    if (!selectedDestinationBranch) return '-';

    if (selectedTransferBranch) {
      return `${ACTIVE_BRANCH || '-'} → ${selectedTransferBranch.branchName} → ${selectedDestinationBranch.branchName}`;
    }

    return `${ACTIVE_BRANCH || '-'} → ${selectedDestinationBranch.branchName}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'destinationBranchId') {
      const selectedBranch = branches.find((branch) => String(branch.id) === String(value));

      setFormData((prev) => ({
        ...prev,
        destinationBranchId: value,
        destinationCity: selectedBranch?.branchCity || ''
      }));

      setCreatedShipment(null);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setCreatedShipment(null);
  };

  const resetForm = () => {
    setFormData({
      senderName: '',
      receiverName: '',
      transferBranchId: '',
      destinationBranchId: '',
      destinationCity: '',
      deliveryAddress: '',
      weight: '',
      cargoType: 'KOLİ',
      priority: 2,
      lat: '',
      lon: ''
    });

    setCreatedShipment(null);
  };

  const getPriorityText = (priority) => {
    switch (Number(priority)) {
      case 1: return 'Düşük';
      case 2: return 'Normal';
      case 3: return 'Yüksek';
      case 4: return 'Acil';
      default: return 'Normal';
    }
  };

  const getShipmentTypeText = () => {
    if (!selectedDestinationBranch) return 'Teslimat şubesi bekleniyor';
    if (selectedTransferBranch) return 'Aktarmalı gönderi';
    return 'Doğrudan gönderi';
  };

  const validateForm = () => {
    if (!ACTIVE_BRANCH || !ACTIVE_BRANCH_CITY) {
      alert('Şube bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return false;
    }

    if (!formData.senderName.trim()) {
      alert('Gönderici adı zorunludur.');
      return false;
    }

    if (!formData.receiverName.trim()) {
      alert('Alıcı adı zorunludur.');
      return false;
    }

    if (!formData.destinationBranchId || !selectedDestinationBranch) {
      alert('Teslimat şubesi seçilmelidir.');
      return false;
    }

    if (!formData.deliveryAddress.trim()) {
      alert('Teslimat adresi zorunludur.');
      return false;
    }

    if (!formData.weight || Number(formData.weight) <= 0) {
      alert('Geçerli bir ağırlık giriniz.');
      return false;
    }

    if (!formData.lat || !formData.lon) {
      alert('Teslimat enlemi ve boylamı zorunludur.');
      return false;
    }

    if (Number.isNaN(Number(formData.lat)) || Number.isNaN(Number(formData.lon))) {
      alert('Teslimat enlemi ve boylamı sayısal değer olmalıdır.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      senderName: formData.senderName.trim(),
      receiverName: formData.receiverName.trim(),

      originBranchName: ACTIVE_BRANCH,
      originCity: ACTIVE_BRANCH_CITY,

      currentHub: ACTIVE_BRANCH,
      currentHubCity: ACTIVE_BRANCH_CITY,

      destinationBranchName: selectedDestinationBranch.branchName,
      destinationCity: selectedDestinationBranch.branchCity,

      transferBranchName: selectedTransferBranch ? selectedTransferBranch.branchName : null,
      transferCity: selectedTransferBranch ? selectedTransferBranch.branchCity : null,

      currentStep: 0,

      deliveryAddress: formData.deliveryAddress.trim(),

      weight: Number(formData.weight),
      cargoType: formData.cargoType,
      priority: Number(formData.priority),

      lat: Number(formData.lat),
      lon: Number(formData.lon)
    };

    try {
      setLoading(true);
      const created = await ApiService.createShipment(payload);

      alert('Ürün kaydı başarıyla oluşturuldu.');

      resetForm();
      setCreatedShipment(created);
    } catch (error) {
      console.error('Ürün kaydı oluşturulamadı:', error);
      alert('Ürün kaydı oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="urun-kayit-page">
      <style>{`
        .urun-kayit-page {
          height: calc(100vh - 105px);
          background:
            radial-gradient(circle at 12% 18%, rgba(16,185,129,.08), transparent 30%),
            radial-gradient(circle at 86% 80%, rgba(59,130,246,.045), transparent 34%),
            #070b16;
          color: #e5e7eb;
          padding: 12px 18px;
          box-sizing: border-box;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 14px;
        }

        .card {
          background: linear-gradient(180deg, rgba(17,24,39,.96) 0%, rgba(11,17,32,.99) 100%);
          border: 1px solid rgba(45,212,191,.12);
          border-radius: 20px;
          box-shadow: 0 14px 38px rgba(0,0,0,.38), inset 0 0 18px rgba(45,212,191,.018);
          min-height: 0;
        }

        .form-card {
          padding: 18px;
          overflow: auto;
        }

        .side-card {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow: hidden;
        }

        .page-title {
          font-size: 20px;
          font-weight: 950;
          color: #f8fafc;
          margin-bottom: 4px;
          letter-spacing: -.2px;
        }

        .page-subtitle {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 18px;
          line-height: 1.5;
        }

        .section-title {
          font-size: 11px;
          color: #cbd5e1;
          font-weight: 950;
          text-transform: uppercase;
          margin: 18px 0 10px;
          letter-spacing: .45px;
        }

        .section-title:first-of-type {
          margin-top: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group.full {
          grid-column: span 2;
        }

        label {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 850;
        }

        .input,
        .select,
        .textarea {
          width: 100%;
          background: rgba(8,13,24,.92);
          border: 1px solid rgba(37,49,77,.92);
          color: #e5e7eb;
          padding: 10px 12px;
          border-radius: 13px;
          outline: none;
          box-sizing: border-box;
          font-size: 12px;
          transition: all .2s ease;
        }

        .input::placeholder,
        .textarea::placeholder {
          color: rgba(148,163,184,.38);
        }

        .select option {
          background: #111827;
          color: #e5e7eb;
        }

        .textarea {
          resize: none;
          min-height: 92px;
          line-height: 1.45;
        }

        .input:focus,
        .select:focus,
        .textarea:focus {
          border-color: rgba(16,185,129,.50);
          box-shadow: 0 0 0 3px rgba(16,185,129,.065);
        }

        .auto-box {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 4px;
        }

        .auto-item {
          padding: 13px;
          border-radius: 15px;
          background: rgba(16,185,129,.055);
          border: 1px solid rgba(16,185,129,.15);
        }

        .auto-label {
          color: #94a3b8;
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .auto-value {
          color: #6ee7b7;
          font-size: 13px;
          font-weight: 950;
        }

        .branch-info-box {
          padding: 12px;
          border-radius: 14px;
          background: rgba(59,130,246,.045);
          border: 1px solid rgba(59,130,246,.13);
          color: #94a3b8;
          font-size: 11.5px;
          line-height: 1.55;
        }

        .branch-info-box strong {
          color: #bfdbfe;
          font-weight: 900;
        }

        .route-note {
          padding: 12px;
          border-radius: 14px;
          background: rgba(16,185,129,.045);
          border: 1px solid rgba(16,185,129,.14);
          color: #94a3b8;
          font-size: 11.5px;
          line-height: 1.55;
        }

        .route-note strong {
          color: #6ee7b7;
          font-weight: 900;
        }

        .button-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
          border-top: 1px solid rgba(31,42,68,.85);
          padding-top: 16px;
        }

        .primary-btn {
          border: none;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 11px 18px;
          border-radius: 12px;
          font-weight: 950;
          cursor: pointer;
          transition: all .25s ease;
        }

        .primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 14px rgba(16,185,129,.20), 0 8px 18px rgba(5,150,105,.15);
        }

        .primary-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .secondary-btn {
          border: 1px solid rgba(37,49,77,.95);
          background: rgba(16,24,39,.88);
          color: #cbd5e1;
          padding: 11px 18px;
          border-radius: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        @keyframes ecoPulse {
          0%, 100% {
            box-shadow: 0 0 8px rgba(16,185,129,.055);
            border-color: rgba(16,185,129,.16);
          }

          50% {
            box-shadow: 0 0 16px rgba(16,185,129,.13);
            border-color: rgba(52,211,153,.28);
          }
        }

        .preview-box {
          padding: 16px;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(16,185,129,.06) 0%, rgba(5,150,105,.025) 100%);
          border: 1px solid rgba(16,185,129,.18);
          animation: ecoPulse 3.2s infinite ease-in-out;
        }

        .preview-title {
          color: #6ee7b7;
          font-size: 13px;
          font-weight: 950;
          margin-bottom: 12px;
          letter-spacing: .4px;
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(148,163,184,.11);
          font-size: 12px;
        }

        .preview-row:last-child {
          border-bottom: none;
        }

        .preview-label {
          color: #94a3b8;
        }

        .preview-value {
          color: #f8fafc;
          font-weight: 850;
          text-align: right;
        }

        .type-badge {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 950;
          background: rgba(16,185,129,.10);
          color: #34d399;
          border: 1px solid rgba(16,185,129,.26);
          line-height: 1.3;
          text-align: center;
        }

        .created-box {
          padding: 14px;
          border-radius: 15px;
          background: rgba(16,185,129,.07);
          border: 1px solid rgba(16,185,129,.21);
        }

        .created-title {
          color: #6ee7b7;
          font-size: 13px;
          font-weight: 950;
          margin-bottom: 8px;
        }

        .barcode-text {
          font-family: monospace;
          color: #f8fafc;
          font-weight: 950;
          font-size: 13px;
        }

        @media (max-width: 1200px) {
          .urun-kayit-page {
            grid-template-columns: 1fr;
            overflow: auto;
          }
        }
      `}</style>

      <div className="card form-card">
        <div className="page-title">Ürün Kaydı Ekle</div>
        <div className="page-subtitle">
          Yeni ürün/kargo kaydı oluştur. Barkod ve takip numarası sistem tarafından otomatik üretilir.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="section-title">Şube Bilgisi</div>

          <div className="auto-box">
            <div className="auto-item">
              <div className="auto-label">Çıkış Şubesi</div>
              <div className="auto-value">{ACTIVE_BRANCH || '-'}</div>
            </div>

            <div className="auto-item">
              <div className="auto-label">Çıkış Şehri</div>
              <div className="auto-value">{ACTIVE_BRANCH_CITY || '-'}</div>
            </div>
          </div>

          <div className="section-title">Gönderici ve Alıcı Bilgileri</div>

          <div className="form-grid">
            <div className="form-group">
              <label>Gönderici Adı</label>
              <input className="input" name="senderName" value={formData.senderName} onChange={handleChange} placeholder="Gönderici adı" />
            </div>

            <div className="form-group">
              <label>Alıcı Adı</label>
              <input className="input" name="receiverName" value={formData.receiverName} onChange={handleChange} placeholder="Alıcı adı" />
            </div>

            <div className="form-group full">
              <label>Aktarma Şubesi / Opsiyonel</label>
              <select
                className="select"
                name="transferBranchId"
                value={formData.transferBranchId}
                onChange={handleChange}
                disabled={branchLoading}
              >
                <option value="">Aktarma şubesi seçmeden devam et</option>

                {transferOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName} / {branch.branchCity}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full">
              <label>Teslimat Şubesi</label>
              <select
                className="select"
                name="destinationBranchId"
                value={formData.destinationBranchId}
                onChange={handleChange}
                disabled={branchLoading}
              >
                <option value="">
                  {branchLoading ? 'Şubeler yükleniyor...' : 'Teslimat şubesi seçin'}
                </option>

                {destinationOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName} / {branch.branchCity}
                  </option>
                ))}
              </select>
            </div>

            {selectedDestinationBranch && (
              <div className="form-group full">
                <div className="branch-info-box">
                  Teslimat şubesi: <strong>{selectedDestinationBranch.branchName}</strong> ·
                  Şehir: <strong>{selectedDestinationBranch.branchCity}</strong> ·
                  Şube adresi: <strong>{selectedDestinationBranch.branchAddress}</strong>
                </div>
              </div>
            )}

            {selectedDestinationBranch && (
              <div className="form-group full">
                <div className="route-note">
                  Güzergah: <strong>{getDetailedRoutePreview()}</strong>
                  <br />
                  Aktarma şubesi seçilirse ürün önce aktarma merkezine, sonra teslimat şubesine yönlendirilir.
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Ağırlık / Kütle</label>
              <input className="input" type="number" step="0.1" min="0" name="weight" value={formData.weight} onChange={handleChange} placeholder="Ağırlık kg" />
            </div>

            <div className="form-group">
              <label>Kargo Tipi</label>
              <select className="select" name="cargoType" value={formData.cargoType} onChange={handleChange}>
                <option value="KOLİ">Koli</option>
                <option value="DOSYA">Dosya</option>
                <option value="KIRILGAN EŞYA">Kırılgan Eşya</option>
                <option value="SOĞUK ZİNCİR">Soğuk Zincir</option>
                <option value="TEKSTİL">Tekstil</option>
                <option value="ELEKTRONİK">Elektronik</option>
                <option value="MEDİKAL">Medikal</option>
              </select>
            </div>

            <div className="form-group full">
              <label>Teslimat Adresi</label>
              <textarea className="textarea" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleChange} placeholder="Mahalle, cadde, sokak, bina no..." />
            </div>
          </div>

          <div className="section-title">Rota ve Teslimat Noktası</div>

          <div className="form-grid">
            <div className="form-group">
              <label>Öncelik</label>
              <select className="select" name="priority" value={formData.priority} onChange={handleChange}>
                <option value={1}>Düşük</option>
                <option value={2}>Normal</option>
                <option value={3}>Yüksek</option>
                <option value={4}>Acil</option>
              </select>
            </div>

            <div className="form-group">
              <label>Teslimat Şehri</label>
              <input className="input" name="destinationCity" value={formData.destinationCity} readOnly placeholder="Şube seçilince otomatik gelir" />
            </div>

            <div className="form-group">
              <label>Teslimat Enlemi</label>
              <input className="input" type="number" step="any" name="lat" value={formData.lat} onChange={handleChange} placeholder="Teslimat noktasının enlemi" />
            </div>

            <div className="form-group">
              <label>Teslimat Boylamı</label>
              <input className="input" type="number" step="any" name="lon" value={formData.lon} onChange={handleChange} placeholder="Teslimat noktasının boylamı" />
            </div>
          </div>

          <div className="button-row">
            <button className="secondary-btn" type="button" onClick={resetForm} disabled={loading}>
              Temizle
            </button>

            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Ürün Kaydını Oluştur'}
            </button>
          </div>
        </form>
      </div>

      <aside className="card side-card">
        <div className="preview-box">
          <div className="preview-title">Kayıt Önizleme</div>

          <div className="preview-row">
            <span className="preview-label">İşlem Türü</span>
            <span className="preview-value">
              <span className="type-badge">{getShipmentTypeText()}</span>
            </span>
          </div>

          <div className="preview-row">
            <span className="preview-label">Çıkış Şubesi</span>
            <span className="preview-value">{ACTIVE_BRANCH || '-'}</span>
          </div>

          <div className="preview-row">
            <span className="preview-label">Aktarma Şubesi</span>
            <span className="preview-value">{selectedTransferBranch?.branchName || 'Yok'}</span>
          </div>

          <div className="preview-row">
            <span className="preview-label">Teslimat Şubesi</span>
            <span className="preview-value">{selectedDestinationBranch?.branchName || '-'}</span>
          </div>

          <div className="preview-row">
            <span className="preview-label">Gönderici</span>
            <span className="preview-value">{formData.senderName || '-'}</span>
          </div>

          <div className="preview-row">
            <span className="preview-label">Alıcı</span>
            <span className="preview-value">{formData.receiverName || '-'}</span>
          </div>

          <div className="preview-row">
            <span className="preview-label">Güzergah</span>
            <span className="preview-value">{getRoutePreview()}</span>
          </div>

          <div className="preview-row">
            <span className="preview-label">Koordinat</span>
            <span className="preview-value">{formData.lat && formData.lon ? `${formData.lat}, ${formData.lon}` : '-'}</span>
          </div>

          <div className="preview-row">
            <span className="preview-label">Ağırlık</span>
            <span className="preview-value">{formData.weight ? `${formData.weight} kg` : '-'}</span>
          </div>

          <div className="preview-row">
            <span className="preview-label">Kargo Tipi</span>
            <span className="preview-value">{formData.cargoType}</span>
          </div>

          <div className="preview-row">
            <span className="preview-label">Öncelik</span>
            <span className="preview-value">{getPriorityText(formData.priority)}</span>
          </div>
        </div>

        {createdShipment && (
          <div className="created-box">
            <div className="created-title">Kayıt Oluşturuldu</div>

            <div className="preview-row">
              <span className="preview-label">Barkod</span>
              <span className="preview-value barcode-text">{createdShipment.barcode || '-'}</span>
            </div>

            <div className="preview-row">
              <span className="preview-label">Takip No</span>
              <span className="preview-value barcode-text">{createdShipment.trackingNumber || '-'}</span>
            </div>

            <div className="preview-row">
              <span className="preview-label">Durum</span>
              <span className="preview-value">{createdShipment.status || '-'}</span>
            </div>

            <div className="preview-row">
              <span className="preview-label">Mevcut Merkez</span>
              <span className="preview-value">{createdShipment.currentHub || '-'}</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
