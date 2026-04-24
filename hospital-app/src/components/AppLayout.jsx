import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LogOut,
    LayoutDashboard,
    ClipboardList,
    Stethoscope,
    CalendarDays,
    Menu,
} from 'lucide-react';
import '../styles/components/AppLayout.css';
import appLogo from '../assets/app-logo.png';

const NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { key: 'manage', label: 'Manage', icon: ClipboardList, path: '/manage' },
    { key: 'doctors', label: 'Doctors', icon: Stethoscope, path: '/doctors' },
    { key: 'appointment', label: 'Appointment', icon: CalendarDays, path: '/home' },
];

function AppLayout({ children, activePage, title, userName, onLogout }) {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);

    const mappedRole = useMemo(() => {
        const userRole = localStorage.getItem('user_role') || '';
        const roles = {
            R001: 'Admin',
            R002: 'Doctor',
            R003: 'Patient',
            ADMIN: 'Admin',
            DOCTOR: 'Doctor',
            PATIENT: 'Patient',
        };

        return roles[userRole] || 'User';
    }, []);

    const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

    return (
        <div className={`app-layout${isSidebarOpen ? ' app-layout-sidebar-open' : ''}`}>
            {/* Full-width topbar — burger + logo + brand always visible */}
            <header className="app-topbar">
                <div className="app-topbar-left">
                    <button
                        type="button"
                        className="app-menu-toggle"
                        onClick={toggleSidebar}
                        aria-label="Toggle sidebar"
                    >
                        <Menu size={20} />
                    </button>
                    <img src={appLogo} alt="Hospital App" className="app-topbar-logo" />
                    <span className="app-topbar-brand">Hospital App</span>
                    <span className="app-topbar-sep" aria-hidden="true">·</span>
                    <span className="app-topbar-page">{title}</span>
                </div>
                <div className="app-avatar" title={userName}>
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
            </header>

            {/* Body below topbar */}
            <div className="app-body">
                {/* Overlay — mobile only, starts below topbar */}
                {isSidebarOpen && (
                    <button
                        type="button"
                        className="app-sidebar-overlay"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close sidebar"
                    />
                )}

                {/* Sidebar — no logo section, no X close button */}
                <aside className={`app-sidebar${isSidebarOpen ? ' app-sidebar-open' : ''}`}>
                    <nav className="app-nav">
                        {NAV_ITEMS.map(({ key, label, icon: Icon, path }) => (
                            <button
                                key={key}
                                type="button"
                                className={`app-nav-item${activePage === key ? ' app-nav-item-active' : ''}`}
                                onClick={() => navigate(path)}
                            >
                                <Icon size={19} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </nav>

                    <button type="button" onClick={onLogout} className="app-sidebar-logout">
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </aside>

                {/* Page content */}
                <div className="app-content">
                    <div className="app-content-shell">
                        {children}
                        <p className="app-role-meta">Signed in as {mappedRole}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AppLayout;
