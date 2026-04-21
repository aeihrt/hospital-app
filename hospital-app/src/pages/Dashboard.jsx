import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	LogOut,
	LayoutDashboard,
	ClipboardList,
	Stethoscope,
	CalendarDays,
	Users,
	UserRoundCog,
	UserRound,
	CalendarCheck2,
	Search,
	Menu,
	X,
} from 'lucide-react';
import '../styles/pages/Dashboard.css';
import '../styles/pages/Home.css';
import appLogo from '../assets/app-logo.png';

function Dashboard() {
	const navigate = useNavigate();
	const [userName, setUserName] = useState('');
	const [userRole, setUserRole] = useState('');
	const [loading, setLoading] = useState(true);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');

	const mappedRole = useMemo(() => {
		const roles = {
			R001: 'Admin',
			R002: 'Doctor',
			R003: 'Patient',
			ADMIN: 'Admin',
			DOCTOR: 'Doctor',
			PATIENT: 'Patient',
		};

		return roles[userRole] || 'User';
	}, [userRole]);

	const upcomingAppointments = [
		{ patient: 'Maria Reyes', doctor: 'Dr. Jones', department: 'Cardiology', day: 'Today', time: '9:00am' },
		{ patient: 'Jose Cruz', doctor: 'Dr. Lee', department: 'Neurology', day: 'Today', time: '10:30am' },
		{ patient: 'Ana Lim', doctor: 'Dr. Garcia', department: 'Pediatrics', day: 'Tomorrow', time: '2:00pm' },
		{ patient: 'Pedro Bautista', doctor: 'Dr. Garcia', department: 'Cardiology', day: 'Tomorrow', time: '2:00pm' },
	];

	const statusData = [
		{ label: 'Booked', count: 52, width: '58%', className: 'dashboard-status-booked' },
		{ label: 'Completed', count: 21, width: '33%', className: 'dashboard-status-completed' },
		{ label: 'Canceled', count: 9, width: '18%', className: 'dashboard-status-canceled' },
		{ label: 'No-show', count: 5, width: '11%', className: 'dashboard-status-noshow' },
	];

	const filteredUpcomingAppointments = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();

		if (!normalizedSearch) {
			return upcomingAppointments;
		}

		return upcomingAppointments.filter((appointment) => {
			const searchableText = `${appointment.patient} ${appointment.doctor} ${appointment.department} ${appointment.day} ${appointment.time}`
				.toLowerCase();

			return searchableText.includes(normalizedSearch);
		});
	}, [searchTerm, upcomingAppointments]);

	useEffect(() => {
		loadUserData();
	}, []);

	const loadUserData = async () => {
		try {
			const userId = localStorage.getItem('user_id');
			if (!userId) {
				navigate('/login');
				return;
			}

			setUserName(localStorage.getItem('user_name') || 'Juan');
			setUserRole(localStorage.getItem('user_role') || 'ADMIN');
		} catch (error) {
			console.error('Error loading user data:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		localStorage.removeItem('user_role');
		localStorage.removeItem('user_id');
		localStorage.removeItem('user_name');
		navigate('/login');
	};

	const handleSearchSubmit = (event) => {
		event.preventDefault();
	};

	if (loading) {
		return (
			<div className="dashboard-loading">
				<div className="dashboard-loading-text">Loading...</div>
			</div>
		);
	}

	return (
		<div className="dashboard-page">
			{isSidebarOpen && <button type="button" className="home-sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

			<aside className={`home-sidebar ${isSidebarOpen ? 'home-sidebar-open' : ''}`}>
				<div className="home-sidebar-top">
					<button type="button" className="home-sidebar-close" onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar">
						<X size={18} />
					</button>
					<div className="home-sidebar-brand">
						<img src={appLogo} alt="App Logo" className="home-app-logo" />
						<span>Hospital App</span>
					</div>
				</div>

				<nav className="home-menu">
					<button type="button" className="home-menu-item home-menu-item-active">
						<LayoutDashboard size={20} />
						<span>Dashboard</span>
					</button>
					<button type="button" className="home-menu-item" onClick={() => navigate('/manage')}>
						<ClipboardList size={20} />
						<span>Manage</span>
					</button>
					<button type="button" className="home-menu-item">
						<Stethoscope size={20} />
						<span>Doctors</span>
					</button>
					<button type="button" className="home-menu-item" onClick={() => navigate('/home')}>
						<CalendarDays size={20} />
						<span>Appointment</span>
					</button>
				</nav>

				<button type="button" onClick={handleLogout} className="home-sidebar-logout">
					<LogOut size={18} />
					<span>Logout</span>
				</button>
			</aside>

			<div className="dashboard-content">
				<header className="dashboard-topbar">
					<div className="dashboard-topbar-left">
						<button type="button" className="dashboard-menu-toggle" onClick={() => setIsSidebarOpen(true)}>
							<Menu size={20} />
						</button>
						<h1 className="dashboard-title">Dashboard</h1>
					</div>
					<div className="dashboard-avatar" title={userName}>
						{userName ? userName.charAt(0).toUpperCase() : 'J'}
					</div>
				</header>

				<main className="dashboard-main">
					<section className="dashboard-header-row">
						<div>
							<h2 className="dashboard-welcome">Welcome back, {userName || 'Juan'}</h2>
							<p className="dashboard-subtitle">Here's what's happening in your hospital today.</p>
						</div>
						<form className="dashboard-date-search" onSubmit={handleSearchSubmit}>
							<input
								type="search"
								className="dashboard-date-search-input"
								placeholder="Search appointments"
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
							/>
							<button type="submit" className="dashboard-date-search-btn" aria-label="Search appointments">
								<Search size={15} />
								<span>Search</span>
							</button>
						</form>
					</section>

					<section className="dashboard-stats-grid">
						<article className="dashboard-stat-card">
							<div className="dashboard-stat-icon"><Users size={20} /></div>
							<div><p className="dashboard-stat-value">128</p><p className="dashboard-stat-label">Total Users</p></div>
						</article>
						<article className="dashboard-stat-card">
							<div className="dashboard-stat-icon"><UserRoundCog size={20} /></div>
							<div><p className="dashboard-stat-value">24</p><p className="dashboard-stat-label">Total Doctors</p></div>
						</article>
						<article className="dashboard-stat-card">
							<div className="dashboard-stat-icon"><UserRound size={20} /></div>
							<div><p className="dashboard-stat-value">340</p><p className="dashboard-stat-label">Total Patients</p></div>
						</article>
						<article className="dashboard-stat-card dashboard-stat-card-last">
							<div className="dashboard-stat-icon dashboard-stat-icon-muted"><CalendarCheck2 size={20} /></div>
							<div><p className="dashboard-stat-value">128</p><p className="dashboard-stat-label">Total Appointments</p></div>
						</article>
					</section>

					<section className="dashboard-panels-grid">
						<article className="dashboard-panel">
							<div className="dashboard-panel-head">
								<h3>Upcoming Appointments</h3>
								<button type="button">View all</button>
							</div>
							<div className="dashboard-appointments-list">
								{filteredUpcomingAppointments.map((appointment) => (
									<div key={`${appointment.patient}-${appointment.time}`} className="dashboard-appointment-item">
										<div>
											<p className="dashboard-appointment-name">{appointment.patient}</p>
											<p className="dashboard-appointment-meta">{appointment.doctor} - {appointment.department}</p>
										</div>
										<div className="dashboard-appointment-time-block">
											<p className="dashboard-appointment-day">{appointment.day}</p>
											<p className="dashboard-appointment-time">{appointment.time}</p>
										</div>
									</div>
								))}
								{filteredUpcomingAppointments.length === 0 && (
									<p className="dashboard-empty-state">No appointments match your search.</p>
								)}
							</div>
						</article>

						<article className="dashboard-panel">
							<div className="dashboard-panel-head">
								<h3>Appointment by Status</h3>
								<button type="button">This Month</button>
							</div>
							<div className="dashboard-status-list">
								{statusData.map((status) => (
									<div key={status.label} className="dashboard-status-row">
										<div className="dashboard-status-label-wrap">
											<span className={`dashboard-status-dot ${status.className}`} />
											<span>{status.label}</span>
										</div>
										<div className="dashboard-status-track">
											<div className={`dashboard-status-fill ${status.className}`} style={{ width: status.width }} />
										</div>
										<span className="dashboard-status-count">{status.count}</span>
									</div>
								))}
							</div>
						</article>
					</section>
				</main>
			</div>
		</div>
	);
}

export default Dashboard;
