import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
  let location;
  const navigate = useNavigate();

  try {
    location = useLocation();
  } catch (e) {
    location = { pathname: '/' };
  }

  const username = localStorage.getItem('username') || 'Kullanıcı';
  const role = localStorage.getItem('role') || '';

  const getInitials = (value) => {
    if (!value) return 'U';

    const cleaned = value
      .replace(/[_.-]/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean);

    if (cleaned.length >= 2) {
      return `${cleaned[0][0]}${cleaned[1][0]}`.toUpperCase();
    }

    return value.slice(0, 2).toUpperCase();
  };

  const formatUsername = (value) => {
    if (!value) return 'Kullanıcı';

    return value
      .replace(/[_.-]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1))
      .join(' ');
  };

  const formatRole = (value) => {
    if (value === 'ADMIN') return 'Yönetici';
    if (value === 'COURIER') return 'Kurye';
    if (value === 'CUSTOMER') return 'Müşteri';
    return 'Kullanıcı';
  };

  const navItemStyle = (path) => ({
    color: location.pathname === path ? '#34d399' : '#9ca3af',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '800',
    padding: '9px 14px',
    borderRadius: '12px',
    background: location.pathname === path ? 'rgba(16,185,129,0.11)' : 'transparent',
    border: location.pathname === path ? '1px solid rgba(16,185,129,0.22)' : '1px solid transparent',
    transition: 'all 0.25s ease',
    whiteSpace: 'nowrap'
  });

  const handleLogout = () => {
    localStorage.removeItem('id');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('courierId');
    localStorage.removeItem('branchName');
    localStorage.removeItem('branchCity');
    localStorage.removeItem('branchAddress');
    localStorage.removeItem('branchLat');
    localStorage.removeItem('branchLon');

    navigate('/login');
  };

  return (
    <header className="ecologix-navbar">
      <style>{`
        .ecologix-navbar {
          background:
            linear-gradient(180deg, rgba(17,24,39,.98), rgba(8,13,24,.99));
          border-bottom: 1px solid rgba(45,212,191,.13);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 28px;
          height: 70px;
          box-sizing: border-box;
          box-shadow: 0 10px 28px rgba(0,0,0,.28);
          gap: 18px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 170px;
        }

        .brand-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          line-height: 1;
          filter: drop-shadow(0 0 8px rgba(16,185,129,.22));
        }

        .brand-title {
          font-size: 20px;
          font-weight: 950;
          margin: 0;
          color: #34d399;
          letter-spacing: .2px;
        }

        .nav-links {
          display: flex;
          gap: 6px;
          align-items: center;
          flex: 1;
          justify-content: center;
          min-width: 0;
        }

        .session-box {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 250px;
          justify-content: flex-end;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 6px 9px 6px 7px;
          border-radius: 999px;
          background: rgba(15,23,42,.62);
          border: 1px solid rgba(148,163,184,.13);
          box-shadow: inset 0 0 18px rgba(255,255,255,.012);
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(16,185,129,.10);
          border: 1px solid rgba(16,185,129,.24);
          color: #6ee7b7;
          font-size: 11px;
          font-weight: 950;
          box-shadow: 0 0 12px rgba(16,185,129,.10);
        }

        .user-info {
          line-height: 1.15;
          max-width: 145px;
        }

        .user-name {
          color: #f8fafc;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          color: #94a3b8;
          font-size: 10.5px;
          font-weight: 800;
          margin-top: 3px;
        }

        .logout-btn {
          background: rgba(180,83,9,.10);
          border: 1px solid rgba(180,83,9,.35);
          color: #d97706;
          padding: 8px 13px;
          border-radius: 11px;
          font-weight: 900;
          cursor: pointer;
          font-size: 12px;
          transition: all .25s ease;
        }

        .logout-btn:hover {
          background: rgba(180,83,9,.16);
          border-color: rgba(217,119,6,.45);
          transform: translateY(-1px);
        }

        @media (max-width: 1100px) {
          .nav-links {
            gap: 2px;
          }

          .session-box {
            min-width: auto;
          }

          .user-info {
            display: none;
          }
        }
      `}</style>

      <div className="brand">
        <div className="brand-icon" aria-label="EcoLogix doğa ikonu">
          🌱
        </div>

        <h1 className="brand-title">EcoLogix</h1>
      </div>

      <nav className="nav-links">
        <Link to="/" style={navItemStyle('/')}>Ana Sayfa</Link>
        <Link to="/kurye-atama" style={navItemStyle('/kurye-atama')}>Kurye Atama</Link>
        <Link to="/kurye-takip" style={navItemStyle('/kurye-takip')}>Kurye Takip</Link>
        <Link to="/urun-kontrol" style={navItemStyle('/urun-kontrol')}>Ürün Kontrol</Link>
        <Link to="/kurye-kayit" style={navItemStyle('/kurye-kayit')}>Kurye Kayıt</Link>
        <Link to="/urun-kayit" style={navItemStyle('/urun-kayit')}>Ürün Kayıt</Link>
      </nav>

      <div className="session-box">
        <div className="user-profile">
          <div className="avatar">{getInitials(username)}</div>

          <div className="user-info">
            <div className="user-name">{formatUsername(username)}</div>
            <div className="user-role">{formatRole(role)}</div>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Çıkış
        </button>
      </div>
    </header>
  );
}
