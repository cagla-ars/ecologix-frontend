import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username.trim() || !form.password.trim()) {
      setError('Kullanıcı adı ve şifre zorunludur.');
      return;
    }

    try {
      setLoading(true);

      const data = await ApiService.login(
        form.username.trim(),
        form.password.trim()
      );

      saveSession(data);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Giriş işlemi başarısız.');
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
          width: min(100%, 930px);
          display: grid;
          grid-template-columns: 1fr 420px;
          border-radius: 28px;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(17,24,39,.96), rgba(8,13,24,.99));
          border: 1px solid rgba(45,212,191,.15);
          box-shadow: 0 28px 70px rgba(0,0,0,.48);
        }

        .auth-info {
          padding: 42px;
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
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(16,185,129,.10);
          border: 1px solid rgba(16,185,129,.22);
          box-shadow: 0 0 13px rgba(16,185,129,.10);
        }

        .brand-icon svg {
          width: 18px;
          height: 18px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .hero-title {
          margin: 0;
          color: #f8fafc;
          font-size: 38px;
          line-height: 1.08;
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
          font-size: 14px;
          line-height: 1.7;
          margin: 18px 0 0;
          max-width: 440px;
        }

        .auth-card {
          padding: 36px;
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
          margin: 0 0 24px;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.5;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 14px;
        }

        label {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 900;
        }

        .input {
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

        .input:focus {
          border-color: rgba(16,185,129,.48);
          box-shadow: 0 0 0 3px rgba(16,185,129,.065);
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
          margin-top: 4px;
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
          margin-top: 18px;
          text-align: center;
          color: #94a3b8;
          font-size: 12.5px;
        }

        .auth-link a {
          color: #6ee7b7;
          font-weight: 900;
          text-decoration: none;
        }

        @media (max-width: 850px) {
          .auth-shell {
            grid-template-columns: 1fr;
          }

          .auth-info {
            padding: 30px;
          }

          .auth-card {
            border-left: none;
            border-top: 1px solid rgba(45,212,191,.11);
          }
        }
      `}</style>

      <div className="auth-shell">
        <section className="auth-info">
          <div className="brand">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 2l7 4v6c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-4z" />
                <path d="M9 12l2 2 4-5" />
              </svg>
            </div>

            EcoLogix TMS
          </div>

          <h1 className="hero-title">
            Lojistik operasyonlara <span>güvenli erişim</span>
          </h1>

          <p className="hero-desc">
            Giriş yapılan kullanıcıya ait şube bilgisi sistemde tutulur. Ürün kayıt,
            ürün kontrol ve rota optimizasyon süreçleri bu şubeye göre çalışır.
          </p>
        </section>

        <form className="auth-card" onSubmit={handleSubmit}>
          <h2 className="auth-title">Giriş Yap</h2>

          <p className="auth-subtitle">
            EcoLogix yönetim paneline erişmek için kullanıcı bilgilerinizle giriş yapın.
          </p>

          {error && <div className="error-box">{error}</div>}

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

          <button className="primary-btn" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>

          <div className="auth-link">
            Hesabınız yok mu? <Link to="/register">Kayıt oluştur</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
