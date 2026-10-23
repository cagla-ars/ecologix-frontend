import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';

export default function Register() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'ADMIN',
    branchId: ''
  });

  const [loading, setLoading] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setBranchLoading(true);
      const data = await ApiService.getAllBranches();
      setBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Şube listesi alınamadı. Lütfen backend bağlantısını kontrol edin.');
    } finally {
      setBranchLoading(false);
    }
  };

  const selectedBranch = useMemo(() => {
    return branches.find((branch) => String(branch.id) === String(form.branchId));
  }, [branches, form.branchId]);

  const saveSession = (data) => {
    localStorage.setItem('id', data.id ?? '');
    localStorage.setItem('username', data.username ?? '');
    localStorage.setItem('role', data.role ?? '');
    localStorage.setItem('courierId', data.courierId ?? '');

    localStorage.setItem('branchName', data.branchName ?? '');
    localStorage.setItem('branchCity', data.branchCity ?? '');
    localStorage.setItem('branchAddress', data.branchAddress ?? '');
    localStorage.setItem('branchLat', data.branchLat ?? '');
    localStorage.setItem('branchLon', data.branchLon ?? '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    setError('');
  };

  const validateForm = () => {
    if (!form.username.trim() || !form.password.trim()) {
      return 'Kullanıcı adı ve şifre zorunludur.';
    }

    if (!form.branchId || !selectedBranch) {
      return 'Bağlı şube seçilmelidir.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const payload = {
    username: form.username.trim(),
    password: form.password.trim(),
    role: 'ADMIN',
    courierId: null,

    branchName: selectedBranch.branchName,
    branchCity: selectedBranch.branchCity,
    branchAddress: selectedBranch.branchAddress,
    branchLat: selectedBranch.branchLat,
    branchLon: selectedBranch.branchLon
    };

    try {
      setLoading(true);
      const createdUser = await ApiService.register(payload);

      saveSession(createdUser);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Kullanıcı kaydı oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <style>{`
        .auth-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 18% 20%, rgba(16,185,129,.11), transparent 34%),
            radial-gradient(circle at 82% 80%, rgba(59,130,246,.06), transparent 36%),
            #050914;
          color: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .auth-shell {
          width: min(100%, 980px);
          display: grid;
          grid-template-columns: 360px 1fr;
          border-radius: 28px;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(17,24,39,.96), rgba(8,13,24,.99));
          border: 1px solid rgba(45,212,191,.15);
          box-shadow: 0 28px 70px rgba(0,0,0,.48);
        }

        .auth-info {
          padding: 38px;
          background:
            radial-gradient(circle at 30% 25%, rgba(16,185,129,.10), transparent 36%),
            rgba(8,13,24,.44);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #34d399;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: .55px;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        .brand-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          filter: drop-shadow(0 0 8px rgba(16,185,129,.22));
        }

        .hero-title {
          margin: 0;
          color: #f8fafc;
          font-size: 32px;
          line-height: 1.12;
          font-weight: 950;
          letter-spacing: -1px;
        }

        .hero-title span {
          background: linear-gradient(90deg, #34d399, #60a5fa);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hero-desc {
          color: #94a3b8;
          font-size: 13.5px;
          line-height: 1.7;
          margin: 18px 0 0;
        }

        .auth-card {
          padding: 34px;
          background: rgba(3,7,18,.32);
          border-left: 1px solid rgba(45,212,191,.11);
        }

        .auth-title {
          margin: 0 0 6px;
          color: #f8fafc;
          font-size: 24px;
          font-weight: 950;
        }

        .auth-subtitle {
          margin: 0 0 22px;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.5;
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

        .full {
          grid-column: 1 / -1;
        }

        label {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 900;
        }

        .input,
        .select {
          width: 100%;
          background: rgba(8,13,24,.88);
          border: 1px solid rgba(37,49,77,.92);
          color: #e5e7eb;
          padding: 12px 13px;
          border-radius: 13px;
          outline: none;
          box-sizing: border-box;
          font-size: 13px;
        }

        .input::placeholder {
          color: rgba(148,163,184,.42);
        }

        .input:focus,
        .select:focus {
          border-color: rgba(16,185,129,.48);
          box-shadow: 0 0 0 3px rgba(16,185,129,.065);
        }

        .select option {
          background: #111827;
          color: #e5e7eb;
        }

        .error-box {
          background: rgba(239,68,68,.08);
          border: 1px solid rgba(239,68,68,.24);
          color: #fca5a5;
          border-radius: 13px;
          padding: 11px 12px;
          font-size: 12px;
          margin-bottom: 14px;
        }

        .preview-box {
          margin-top: 16px;
          border-radius: 16px;
          border: 1px solid rgba(16,185,129,.14);
          background: rgba(16,185,129,.045);
          padding: 14px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .preview-item {
          font-size: 11px;
          color: #94a3b8;
        }

        .preview-item strong {
          display: block;
          color: #e5e7eb;
          font-size: 12px;
          margin-top: 4px;
        }

        .info-note {
          margin-top: 12px;
          color: #94a3b8;
          background: rgba(59,130,246,.055);
          border: 1px solid rgba(59,130,246,.14);
          border-radius: 14px;
          padding: 12px 13px;
          font-size: 11.5px;
          line-height: 1.55;
        }

        .primary-btn {
          width: 100%;
          border: none;
          background: linear-gradient(135deg, #34d399, #10b981 55%, #059669);
          color: #02120c;
          padding: 13px 16px;
          border-radius: 14px;
          font-weight: 950;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 0 12px rgba(16,185,129,.13), 0 8px 18px rgba(5,150,105,.10);
          transition: all .25s ease;
          margin-top: 18px;
        }

        .primary-btn:hover {
          transform: translateY(-1px);
        }

        .primary-btn:disabled {
          opacity: .55;
          cursor: not-allowed;
          transform: none;
        }

        .auth-link {
          margin-top: 16px;
          text-align: center;
          color: #94a3b8;
          font-size: 12.5px;
        }

        .auth-link a {
          color: #6ee7b7;
          font-weight: 900;
          text-decoration: none;
        }

        @media (max-width: 900px) {
          .auth-shell {
            grid-template-columns: 1fr;
          }

          .auth-info {
            padding: 28px;
          }

          .auth-card {
            border-left: none;
            border-top: 1px solid rgba(45,212,191,.11);
          }
        }

        @media (max-width: 650px) {
          .form-grid,
          .preview-box {
            grid-template-columns: 1fr;
          }

          .full {
            grid-column: auto;
          }
        }
      `}</style>

      <div className="auth-shell">
        <section className="auth-info">
          <div className="brand">
            <div className="brand-icon">🌱</div>
            EcoLogix TMS
          </div>

          <h1 className="hero-title">
            Kullanıcı <span>kaydı oluştur</span>
          </h1>

          <p className="hero-desc">
            Kullanıcılar mevcut fiziksel şubelere bağlanır. Şubeler sistemde önceden tanımlıdır.
          </p>
        </section>

        <form className="auth-card" onSubmit={handleSubmit}>
          <h2 className="auth-title">Kayıt Ol</h2>

          <p className="auth-subtitle">
            Yeni kullanıcı hesabı oluşturun ve mevcut şubelerden birine bağlayın.
          </p>

          {error && <div className="error-box">{error}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label>Kullanıcı Adı</label>
              <input
                className="input"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Kullanıcı adı"
              />
            </div>

            <div className="form-group">
              <label>Şifre</label>
              <input
                className="input"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Şifre"
              />
            </div>


            <div className="form-group">
              <label>Bağlı Şube</label>
              <select
                className="select"
                name="branchId"
                value={form.branchId}
                onChange={handleChange}
                disabled={branchLoading}
              >
                <option value="">
                  {branchLoading ? 'Şubeler yükleniyor...' : 'Şube seçin'}
                </option>

                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName} / {branch.branchCity}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="preview-box">
            <div className="preview-item">
              Kullanıcı
              <strong>{form.username || '-'}</strong>
            </div>

            <div className="preview-item">
              Rol
              <strong>{form.role === 'ADMIN' ? 'Yönetici' : 'Kurye Kullanıcısı'}</strong>
            </div>

            <div className="preview-item">
              Bağlı Şube
              <strong>{selectedBranch?.branchName || '-'}</strong>
            </div>

            <div className="preview-item">
              Şube Şehri
              <strong>{selectedBranch?.branchCity || '-'}</strong>
            </div>
          </div>


          <button className="primary-btn" disabled={loading}>
            {loading ? 'Kayıt oluşturuluyor...' : 'Kayıt Ol'}
          </button>

          <div className="auth-link">
            Hesabınız var mı? <Link to="/login">Giriş yap</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
