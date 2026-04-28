import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Users,
	UserRoundCog,
	UserRound,
	CalendarCheck2,
	Search,
} from 'lucide-react';
import '../styles/pages/Dashboard.css';
import AppLayout from '../components/AppLayout';
import { getJson } from '../utils/api';

function Dashboard() {
	const navigate = useNavigate();
	const [userName, setUserName] = useState('');
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [summary, setSummary] = useState({
		totalUsers: 0,
		totalDoctors: 0,
		totalPatients: 0,
		totalAppointments: 0,
	});
	const [statusCounts, setStatusCounts] = useState({});
	const [recentAppointments, setRecentAppointments] = useState([]);

	const statusData = useMemo(() => {
		const statusRows = [
			{ key: 'BOOKED', label: 'Booked', className: 'dashboard-status-booked' },
			{ key: 'COMPLETED', label: 'Completed', className: 'dashboard-status-completed' },
			{ key: 'CANCELED', label: 'Canceled', className: 'dashboard-status-canceled' },
			{ key: 'NO_SHOW', label: 'No-show', className: 'dashboard-status-noshow' },
		];
		const maxCount = Math.max(...statusRows.map(({ key }) => statusCounts[key] || 0), 0);

		return statusRows.map(({ key, label, className }) => ({
			label,
			count: statusCounts[key] || 0,
			className,
			width: maxCount > 0 ? `${Math.max(8, Math.round(((statusCounts[key] || 0) / maxCount) * 100))}%` : '0%',
		}));
	}, [statusCounts]);

	const filteredUpcomingAppointments = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();

		if (!normalizedSearch) {
			return recentAppointments;
		}

		return recentAppointments.filter((appointment) => {
			const searchableText = `${appointment.patient} ${appointment.doctor} ${appointment.department} ${appointment.day} ${appointment.time}`
				.toLowerCase();

			return searchableText.includes(normalizedSearch);
		});
	}, [searchTerm, recentAppointments]);

	useEffect(() => {
		loadDashboard();
	}, []);

	const loadDashboard = async () => {
		try {
			const userId = localStorage.getItem('user_id');
			if (!userId) {
				navigate('/login');
				return;
			}

			setUserName(localStorage.getItem('user_name') || 'Juan');

			const result = await getJson('dashboard.php');
			setSummary(result.summary || {});
			setStatusCounts(result.statusCounts || {});
			setRecentAppointments(result.recentAppointments || []);
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
		<AppLayout activePage="dashboard" title="Dashboard" userName={userName} onLogout={handleLogout}>
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
						<div><p className="dashboard-stat-value">{summary.totalUsers}</p><p className="dashboard-stat-label">Total Users</p></div>
					</article>
					<article className="dashboard-stat-card">
						<div className="dashboard-stat-icon"><UserRoundCog size={20} /></div>
						<div><p className="dashboard-stat-value">{summary.totalDoctors}</p><p className="dashboard-stat-label">Total Doctors</p></div>
					</article>
					<article className="dashboard-stat-card">
						<div className="dashboard-stat-icon"><UserRound size={20} /></div>
						<div><p className="dashboard-stat-value">{summary.totalPatients}</p><p className="dashboard-stat-label">Total Patients</p></div>
					</article>
					<article className="dashboard-stat-card dashboard-stat-card-last">
						<div className="dashboard-stat-icon dashboard-stat-icon-muted"><CalendarCheck2 size={20} /></div>
						<div><p className="dashboard-stat-value">{summary.totalAppointments}</p><p className="dashboard-stat-label">Total Appointments</p></div>
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
								<div key={`${appointment.appointmentId}-${appointment.time}`} className="dashboard-appointment-item">
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
		</AppLayout>
	);
}

export default Dashboard;
