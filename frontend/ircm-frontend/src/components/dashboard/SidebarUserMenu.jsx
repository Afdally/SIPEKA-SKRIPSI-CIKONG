export default function SidebarUserMenu({ user, roleLabel, onLogout }) {
  const inisial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="sidebar-user">
      <div className="sidebar-user-card">
        <span className="sidebar-user-avatar" aria-hidden="true">{inisial}</span>
        <span className="sidebar-user-copy">
          <strong>{user?.name || 'Pengguna SIPEKA'}</strong>
          <small>{roleLabel}</small>
        </span>
        <button
          type="button"
          className="sidebar-logout-button"
          onClick={onLogout}
          aria-label="Keluar dari akun"
          title="Keluar"
        >
          <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
}
