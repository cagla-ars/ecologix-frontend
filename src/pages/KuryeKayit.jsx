import { useState } from 'react';
import { ApiService } from '../services/api';

export default function CourierRegister() {
  const ACTIVE_BRANCH = localStorage.getItem('branchName') || '';
  const ACTIVE_BRANCH_CITY = localStorage.getItem('branchCity') || '';
  const ACTIVE_BRANCH_ADDRESS = localStorage.getItem('branchAddress') || '';
  const ACTIVE_BRANCH_LAT = localStorage.getItem('branchLat') || '';
  const ACTIVE_BRANCH_LON = localStorage.getItem('branchLon') || '';

  const [form, setForm] = useState({
    name: '',
    surname: '',
    plateNumber: '',
    vehicleType: 'ELECTRIC',
  });

  const [loading, setLoading] = useState(false);
  const [generatedAccount, setGeneratedAccount] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const normalizeText = (value) => {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replaceAll('ç', 'c')
      .replaceAll('ğ', 'g')
      .replaceAll('ı', 'i')
      .replaceAll('ö', 'o')
      .replaceAll('ş', 's')
      .replaceAll('ü', 'u')
      .replace(/[^a-z0-9]/g, '');
  };

  const generateUsername = (name, surname) => {
    const cleanName = normalizeText(name);
    const cleanSurname = normalizeText(surname);
    const randomCode = Math.floor(100 + Math.random() * 900);

    return `kurye.${cleanName}.${cleanSurname}${randomCode}`;
  };

  const generatePassword = () => {
    const randomCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `Eco${randomCode}!`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setGeneratedAccount(null);
  };

  const resetForm = () => {
    setForm({
      name: '',
      surname: '',
      plateNumber: '',
      vehicleType: 'ELECTRIC',
    });
    setGeneratedAccount(null);
  };

  const copyAccountInfo = async () => {
    if (!generatedAccount) return;

    const text = `Kullanıcı Adı: ${generatedAccount.username}\nGeçici Şifre: ${generatedAccount.password}`;

    try {
      await navigator.clipboard.writeText(text);
      showToast('Giriş bilgileri panoya kopyalandı.', 'success');
    } catch (error) {
      console.error('Kopyalama hatası:', error);
      showToast('Kopyalama yapılamadı. Bilgileri manuel seçebilirsiniz.', 'error');
    }
  };

  const getVehicleText = (type) => {
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
        return type;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setToast(null);

    if (!ACTIVE_BRANCH || !ACTIVE_BRANCH_CITY) {
      showToast('Şube bilgisi bulunamadı. Lütfen tekrar giriş yapın.', 'error');
      return;
    }

    if (!form.name.trim() || !form.surname.trim() || !form.plateNumber.trim()) {
      showToast('Kurye adı, soyadı ve plaka zorunludur.', 'error');
      return;
    }

    const payload = {
      name: form.name.trim(),
      surname: form.surname.trim(),
      plateNumber: form.plateNumber.trim().toUpperCase(),
      vehicleType: form.vehicleType,

      branchInfo: {
        branchName: ACTIVE_BRANCH,
        branchCity: ACTIVE_BRANCH_CITY,
        branchAddress: ACTIVE_BRANCH_ADDRESS,
        branchLat: ACTIVE_BRANCH_LAT ? Number(ACTIVE_BRANCH_LAT) : null,
        branchLon: ACTIVE_BRANCH_LON ? Number(ACTIVE_BRANCH_LON) : null,
      },
    };

    try {
      setLoading(true);

      const createdCourier = await ApiService.createCourier(payload);
      const courierId = createdCourier?.id ?? createdCourier?.courierId;

      if (!courierId) {
        showToast('Kurye oluşturuldu ancak kurye ID bilgisi alınamadı.', 'error');
        return;
      }

      const username = generateUsername(form.name, form.surname);
      const password = generatePassword();

      const userPayload = {
        username,
        password,
        role: 'COURIER',
        courierId,

        branchName: ACTIVE_BRANCH,
        branchCity: ACTIVE_BRANCH_CITY,
        branchAddress: ACTIVE_BRANCH_ADDRESS,
        branchLat: ACTIVE_BRANCH_LAT ? Number(ACTIVE_BRANCH_LAT) : null,
        branchLon: ACTIVE_BRANCH_LON ? Number(ACTIVE_BRANCH_LON) : null,
      };

      await ApiService.register(userPayload);

      setGeneratedAccount({
        username,
        password,
      });

      setForm({
        name: '',
        surname: '',
        plateNumber: '',
        vehicleType: 'ELECTRIC',
      });

      showToast('Kurye kaydı ve giriş hesabı başarıyla oluşturuldu.', 'success');
    } catch (error) {
      console.error('Kurye kaydı oluşturulamadı:', error);

      const message =
        error.message?.includes('duplicate') ||
        error.message?.includes('plate_number') ||
        error.message?.includes('already exists')
          ? 'Bu plaka numarası zaten kayıtlı.'
          : error.message || 'Kurye kaydı oluşturulamadı.';

      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="courier-register-page">
      <style>{`
        .courier-register-page {
          min-height: calc(100vh - 70px);
          background: #070b16;
          color: #e5e7eb;
          padding: 20px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          position: relative;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .toast {
          position: fixed;
          right: 24px;
          top: 88px;
          z-index: 9999;
          min-width: 310px;
          max-width: 420px;
          padding: 14px 16px;
          border-radius: 16px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          box-shadow: 0 18px 45px rgba(0,0,0,.45);
          animation: toastSlide .25s ease-out;
        }

        .toast.success {
          background: linear-gradient(180deg, rgba(6,78,59,.98), rgba(6,95,70,.95));
          border: 1px solid rgba(52,211,153,.35);
        }

        .toast.error {
          background: linear-gradient(180deg, rgba(127,29,29,.98), rgba(69,10,10,.95));
          border: 1px solid rgba(248,113,113,.35);
        }

        .toast-icon {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 14px;
          font-weight: 900;
          background: rgba(255,255,255,.10);
        }

        .toast-message {
          color: #f8fafc;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.45;
        }

        @keyframes toastSlide {
          from {
            transform: translateY(-8px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .page-header {
          margin-bottom: 18px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 900;
          color: #f8fafc;
          margin-bottom: 5px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 16px;
          align-items: start;
        }

        .card {
          background: linear-gradient(180deg, #111827 0%, #0b1120 100%);
          border: 1px solid rgba(45, 212, 191, 0.13);
          border-radius: 18px;
          box-shadow: 0 14px 40px rgba(0,0,0,.35);
          min-width: 0;
        }

        .form-card {
          padding: 20px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 900;
          color: #cbd5e1;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        label {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 800;
        }

        .input,
        .select {
          width: 100%;
          background: #080d18;
          border: 1px solid #25314d;
          color: #e5e7eb;
          padding: 11px 12px;
          border-radius: 12px;
          outline: none;
          box-sizing: border-box;
          font-size: 13px;
        }

        .input:focus,
        .select:focus {
          border-color: rgba(16,185,129,.6);
          box-shadow: 0 0 0 3px rgba(16,185,129,.08);
        }

        .branch-box {
          margin-bottom: 18px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .branch-item {
          padding: 13px;
          border-radius: 14px;
          background: rgba(16,185,129,.065);
          border: 1px solid rgba(16,185,129,.18);
        }

        .branch-label {
          color: #94a3b8;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .branch-value {
          color: #6ee7b7;
          font-size: 13px;
          font-weight: 900;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .primary-btn {
          border: none;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 11px 18px;
          border-radius: 12px;
          font-weight: 900;
          cursor: pointer;
          transition: all .25s ease;
        }

        .primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 14px rgba(16,185,129,.24), 0 8px 18px rgba(5,150,105,.18);
        }

        .primary-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .secondary-btn {
          border: 1px solid #25314d;
          background: #101827;
          color: #cbd5e1;
          padding: 11px 18px;
          border-radius: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .info-card {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: calc(100vh - 130px);
          overflow-y: auto;
        }

        @keyframes ecoPulse {
          0% {
            box-shadow: 0 0 10px rgba(16,185,129,.08), 0 0 18px rgba(16,185,129,.04);
            border-color: rgba(16,185,129,.20);
          }

          50% {
            box-shadow: 0 0 18px rgba(16,185,129,.20), 0 0 35px rgba(16,185,129,.08);
            border-color: rgba(52,211,153,.42);
          }

          100% {
            box-shadow: 0 0 10px rgba(16,185,129,.08), 0 0 18px rgba(16,185,129,.04);
            border-color: rgba(16,185,129,.20);
          }
        }

        .profile-box {
          padding: 14px;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(16,185,129,.08) 0%, rgba(5,150,105,.03) 100%);
          border: 1px solid rgba(16,185,129,.22);
          animation: ecoPulse 2.8s infinite ease-in-out;
        }

        .profile-icon {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(16,185,129,.13);
          color: #6ee7b7;
          border: 1px solid rgba(16,185,129,.25);
          margin-bottom: 10px;
        }

        .icon-svg {
          width: 23px;
          height: 23px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.9;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .info-title {
          font-size: 14px;
          font-weight: 900;
          color: #f8fafc;
        }

        .preview-list {
          border-top: 1px solid #1f2a44;
          padding-top: 8px;
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 9px 0;
          border-bottom: 1px solid #1f2a44;
          font-size: 12px;
        }

        .preview-label {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .preview-value {
          color: #f8fafc;
          font-weight: 800;
          text-align: right;
          word-break: break-word;
        }

        .generated-box {
          padding: 13px;
          border-radius: 16px;
          background:
            radial-gradient(circle at 15% 20%, rgba(59,130,246,.13), transparent 34%),
            rgba(59,130,246,.075);
          border: 1px solid rgba(59,130,246,.25);
        }

        .generated-title {
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 10px;
        }

        .copy-btn {
          width: 100%;
          border: 1px solid rgba(96,165,250,.35);
          background: rgba(59,130,246,.12);
          color: #bfdbfe;
          padding: 10px 12px;
          border-radius: 12px;
          font-weight: 900;
          cursor: pointer;
          transition: all .2s ease;
        }

        .copy-btn:hover {
          background: rgba(59,130,246,.18);
          box-shadow: 0 0 14px rgba(59,130,246,.12);
        }

        @media (max-width: 900px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .form-grid,
          .branch-box {
            grid-template-columns: 1fr;
          }

          .info-card {
            max-height: none;
          }

          .toast {
            left: 16px;
            right: 16px;
            top: 82px;
            min-width: unset;
            max-width: unset;
          }
        }
      `}</style>

      {toast && (
        <div className={`toast ${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' ? '✓' : '!'}
          </div>

          <div className="toast-message">
            {toast.message}
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="page-title">Kurye Kaydı Ekle</div>
      </div>

      <div className="content-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="section-title">Şube Bilgisi</div>

          <div className="branch-box">
            <div className="branch-item">
              <div className="branch-label">Bağlı Şube</div>
              <div className="branch-value">{ACTIVE_BRANCH || '-'}</div>
            </div>

            <div className="branch-item">
              <div className="branch-label">Şube Şehri</div>
              <div className="branch-value">{ACTIVE_BRANCH_CITY || '-'}</div>
            </div>
          </div>

          <div className="section-title">Kurye Bilgileri</div>

          <div className="form-grid">
            <div className="form-group">
              <label>Kurye Adı</label>
              <input
                className="input"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Örn: Ahmet"
              />
            </div>

            <div className="form-group">
              <label>Kurye Soyadı</label>
              <input
                className="input"
                name="surname"
                value={form.surname}
                onChange={handleChange}
                placeholder="Örn: Yılmaz"
              />
            </div>

            <div className="form-group">
              <label>Plaka Numarası</label>
              <input
                className="input"
                name="plateNumber"
                value={form.plateNumber}
                onChange={handleChange}
                placeholder="Örn: 38 ABC 123"
              />
            </div>

            <div className="form-group">
              <label>Araç Tipi</label>
              <select
                className="select"
                name="vehicleType"
                value={form.vehicleType}
                onChange={handleChange}
              >
                <option value="ELECTRIC">Elektrikli</option>
                <option value="DIESEL">Dizel</option>
                <option value="MOTORCYCLE">Motosiklet</option>
                <option value="HYBRID">Hibrit</option>
                <option value="GASOLINE">Benzinli</option>
              </select>
            </div>
          </div>

          <div className="actions">
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Temizle
            </button>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kurye Kaydet'}
            </button>
          </div>
        </form>

        <aside className="card info-card">
          <div className="profile-box">
            <div className="profile-icon">
              <svg viewBox="0 0 24 24" className="icon-svg">
                <path d="M10 17h4" />
                <path d="M5 17h1" />
                <path d="M18 17h1" />
                <path d="M6 13h12l-1.2-4.2A2.5 2.5 0 0 0 14.4 7H9.6a2.5 2.5 0 0 0-2.4 1.8L6 13z" />
                <path d="M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                <path d="M17 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
              </svg>
            </div>

            <div className="info-title">Yeni Kurye Önizleme</div>
          </div>

          {generatedAccount && (
            <div className="generated-box">
              <div className="generated-title">Oluşturulan Giriş Bilgileri</div>

              <button type="button" className="copy-btn" onClick={copyAccountInfo}>
                Giriş Bilgilerini Kopyala
              </button>
            </div>
          )}

          <div className="preview-list">
            <div className="preview-row">
              <span className="preview-label">Ad Soyad</span>
              <span className="preview-value">
                {form.name || '-'} {form.surname || ''}
              </span>
            </div>

            <div className="preview-row">
              <span className="preview-label">Plaka</span>
              <span className="preview-value">{form.plateNumber || '-'}</span>
            </div>

            <div className="preview-row">
              <span className="preview-label">Araç Tipi</span>
              <span className="preview-value">{getVehicleText(form.vehicleType)}</span>
            </div>

            <div className="preview-row">
              <span className="preview-label">Bağlı Şube</span>
              <span className="preview-value">{ACTIVE_BRANCH || '-'}</span>
            </div>

            <div className="preview-row">
              <span className="preview-label">Şube Şehri</span>
              <span className="preview-value">{ACTIVE_BRANCH_CITY || '-'}</span>
            </div>

            {generatedAccount && (
              <>
                <div className="preview-row">
                  <span className="preview-label">Kullanıcı Adı</span>
                  <span className="preview-value">{generatedAccount.username}</span>
                </div>

                <div className="preview-row">
                  <span className="preview-label">Geçici Şifre</span>
                  <span className="preview-value">{generatedAccount.password}</span>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
