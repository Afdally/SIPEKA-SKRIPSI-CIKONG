import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

const roleConfig = {
  admin_dp3a: {
    label:    'Admin DP3A',
    color:    '#1a56db',
    bg:       '#eff6ff',
    emoji:    '🏛️',
    desc:     'Anda masuk sebagai Admin DP3A. Kelola penanganan kasus kekerasan terhadap perempuan dan anak.',
    menus: [
      {
        icon:  '📋',
        title: 'Daftar Kasus',
        desc:  'Lihat semua kasus yang telah diverifikasi dan perlu ditangani',
        color: '#1a56db',
      },
      {
        icon:  '🤝',
        title: 'Konsultasi / Mediasi',
        desc:  'Input penanganan kasus melalui jalur konsultasi atau mediasi',
        color: '#7c3aed',
      },
      {
        icon:  '🧠',
        title: 'Psikososial',
        desc:  'Input penanganan kasus melalui layanan dukungan psikososial',
        color: '#0891b2',
      },
      {
        icon:  '⚖️',
        title: 'Bantuan Hukum',
        desc:  'Input penanganan kasus melalui jalur bantuan dan pendampingan hukum',
        color: '#059669',
      },
      {
        icon:  '📊',
        title: 'Laporan & Statistik',
        desc:  'Ringkasan data kasus dan rekap penanganan per periode',
        color: '#d97706',
      },
      {
        icon:  '👥',
        title: 'Manajemen Akun',
        desc:  'Kelola akun admin kelurahan dan pengguna sistem',
        color: '#dc2626',
      },
    ],
    stats: [
      { label: 'Kasus Masuk',     color: 'blue'   },
      { label: 'Sedang Ditangani',color: 'yellow'  },
      { label: 'Selesai',         color: 'green'   },
      { label: 'Kasus Urgen',     color: 'red'     },
    ],
  },

  admin_kelurahan: {
    label: 'Admin Kelurahan',
    color: '#059669',
    bg:    '#f0fdf4',
    emoji: '🏘️',
    desc:  'Anda masuk sebagai Admin Kelurahan. Verifikasi laporan kekerasan yang masuk dari masyarakat.',
    menus: [
      {
        icon:  '📥',
        title: 'Laporan Masuk',
        desc:  'Lihat laporan baru yang belum diverifikasi dari masyarakat',
        color: '#1a56db',
      },
      {
        icon:  '✅',
        title: 'Verifikasi Laporan',
        desc:  'Proses verifikasi keabsahan dan kelengkapan laporan',
        color: '#059669',
      },
      {
        icon:  '📁',
        title: 'Riwayat Verifikasi',
        desc:  'Laporan yang sudah diverifikasi dan diteruskan ke DP3A',
        color: '#7c3aed',
      },
      {
        icon:  '📊',
        title: 'Rekap Laporan',
        desc:  'Statistik laporan masuk berdasarkan periode dan wilayah',
        color: '#d97706',
      },
    ],
    stats: [
      { label: 'Laporan Masuk',      color: 'blue'   },
      { label: 'Perlu Diverifikasi', color: 'yellow'  },
      { label: 'Sudah Diverifikasi', color: 'green'   },
    ],
  },
}

export default function Dashboard() {
  const navigate        = useNavigate()
  const { user, logout} = useAuth()

  if (!user) return null

  const cfg = roleConfig[user.role] || roleConfig.admin_kelurahan

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="dashboard-wrapper">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <svg viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" fill="#1a56db"/>
              <path d="M14 34V18l10-8 10 8v16H28v-8h-8v8H14z" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="sidebar-title">IRCM</div>
            <div className="sidebar-subtitle">DPPPA Kendari</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Menu Utama</div>
          {cfg.menus.map((m, i) => (
            <button key={i} className={`sidebar-nav-item ${i === 0 ? 'active' : ''}`}>
              <span className="sidebar-nav-icon">{m.icon}</span>
              <span>{m.title}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar" style={{ background: cfg.color }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role" style={{ color: cfg.color }}>
                {cfg.label}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-logout">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
            </svg>
            Keluar
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-header-title">
              Selamat Datang, {user.name.split(' ')[0]}
            </h1>
            <p className="dashboard-header-sub">Sistem IRCM DPPPA Kota Kendari</p>
          </div>
          <span className="role-badge" style={{ color: cfg.color, background: cfg.bg }}>
            {cfg.label}
          </span>
        </header>

        {/* Welcome Card */}
        <div className="welcome-card" style={
          user.role === 'admin_dp3a'
            ? { background: 'linear-gradient(135deg, #1a56db 0%, #7c3aed 100%)' }
            : { background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)' }
        }>
          <div className="welcome-card-text">
            <h2 className="welcome-card-title">Dashboard {cfg.label}</h2>
            <p className="welcome-card-desc">{cfg.desc}</p>
          </div>
          <div className="welcome-card-icon">{cfg.emoji}</div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          {cfg.stats.map((s, i) => (
            <div key={i} className="stat-card">
              <div className={`stat-card-num ${s.color}`}>0</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Jenis Penanganan (khusus admin_dp3a) */}
        {user.role === 'admin_dp3a' && (
          <div className="handling-section">
            <h3 className="menu-section-title">Jenis Penanganan Kasus</h3>
            <div className="handling-grid">
              <div className="handling-card handling-konsultasi">
                <div className="handling-icon">🤝</div>
                <div className="handling-info">
                  <h4>Konsultasi / Mediasi</h4>
                  <p>Penanganan melalui sesi konsultasi langsung atau proses mediasi antara pihak terkait</p>
                </div>
                <button className="handling-btn">Input Penanganan</button>
              </div>
              <div className="handling-card handling-psikososial">
                <div className="handling-icon">🧠</div>
                <div className="handling-info">
                  <h4>Psikososial</h4>
                  <p>Dukungan pemulihan psikologis dan sosial bagi korban kekerasan</p>
                </div>
                <button className="handling-btn">Input Penanganan</button>
              </div>
              <div className="handling-card handling-hukum">
                <div className="handling-icon">⚖️</div>
                <div className="handling-info">
                  <h4>Bantuan Hukum</h4>
                  <p>Pendampingan dan bantuan hukum bagi korban yang membutuhkan proses hukum</p>
                </div>
                <button className="handling-btn">Input Penanganan</button>
              </div>
            </div>
          </div>
        )}

        {/* Menu Grid */}
        <div className="menu-section">
          <h3 className="menu-section-title">Akses Cepat</h3>
          <div className="menu-grid">
            {cfg.menus.map((m, i) => (
              <div key={i} className="menu-card" style={{ '--accent': m.color }}>
                <div className="menu-card-icon" style={{ background: m.color + '15', color: m.color }}>
                  {m.icon}
                </div>
                <h4 className="menu-card-title">{m.title}</h4>
                <p className="menu-card-desc">{m.desc}</p>
                <button className="menu-card-btn" style={{ color: m.color }}>
                  Buka
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
