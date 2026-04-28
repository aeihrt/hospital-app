import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, CheckCircle2, Search } from 'lucide-react';
import '../styles/pages/DoctorAppointments.css';
import AppLayout from '../components/AppLayout';
import { getJson } from '../utils/api';

// appointments will be loaded from backend

function normalizeStatus(status) {
    const value = String(status || '').toUpperCase();
    if (value === 'BOOKED') return 'Upcoming';
    if (value === 'COMPLETED') return 'Completed';
    if (value === 'CANCELED' || value === 'CANCELLED') return 'Cancelled';
    if (value === 'NO_SHOW') return 'Cancelled';
    return status || 'Upcoming';
}

const STATUS_BADGE = {
    Booked: 'da-badge-booked',
    Completed: 'da-badge-completed',
    Cancelled: 'da-badge-cancelled',
    Upcoming: 'da-badge-upcoming',
};

const FILTERS = ['All', 'Today', 'Upcoming', 'Completed', 'Cancelled'];

function DoctorAppointments() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) { navigate('/login'); return; }
        setUserName(localStorage.getItem('user_name') || 'Doctor');
        (async () => {
            try {
                const res = await getJson(`appointments.php?doctorUserId=${userId}`);
                const mapped = (res.appointments || []).map((appointment) => ({
                    ...appointment,
                    status: normalizeStatus(appointment.status),
                }));
                setAppointments(mapped);
            } catch (err) {
                // ignore
            } finally {
                setLoading(false);
            }
        })();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        navigate('/login');
    };

    const filtered = useMemo(() => {
        let list = appointments;
        if (activeFilter !== 'All') {
            list = list.filter((a) => a.status === activeFilter);
        }
        const q = searchTerm.trim().toLowerCase();
        if (q) {
            list = list.filter((a) =>
                `${a.patientName || a.patient} ${a.reason} ${a.status} ${a.bookedBy}`.toLowerCase().includes(q)
            );
        }
        return list;
    }, [appointments, activeFilter, searchTerm]);

    const todayCount = appointments.filter((a) => a.date === (new Date()).toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' })).length;
    const upcomingCount = appointments.filter((a) => a.status === 'Upcoming' || a.status === 'Booked').length;
    const completedCount = appointments.filter((a) => a.status === 'Completed').length;

    if (loading) return <div className="da-loading"><span>Loading...</span></div>;

    return (
        <AppLayout activePage="doctor-appointments" title="My Appointments" userName={userName} onLogout={handleLogout}>
            <main className="da-main">
                <h1 className="da-title">My Appointments</h1>

                <section className="da-stats-row">
                    <article className="da-stat-card">
                        <div className="da-stat-icon da-stat-icon-blue"><CalendarDays size={20} /></div>
                        <div>
                            <p className="da-stat-label">TODAY'S APPOINTMENTS</p>
                            <p className="da-stat-value">{todayCount}</p>
                        </div>
                    </article>
                    <article className="da-stat-card">
                        <div className="da-stat-icon da-stat-icon-orange"><ClipboardCheck size={20} /></div>
                        <div>
                            <p className="da-stat-label">UPCOMING</p>
                            <p className="da-stat-value">{upcomingCount}</p>
                        </div>
                    </article>
                    <article className="da-stat-card">
                        <div className="da-stat-icon da-stat-icon-green"><CheckCircle2 size={20} /></div>
                        <div>
                            <p className="da-stat-label">COMPLETED</p>
                            <p className="da-stat-value">{completedCount}</p>
                        </div>
                    </article>
                </section>

                <section className="da-filter-bar">
                    <div className="da-search-wrap">
                        <Search size={15} className="da-search-icon" />
                        <input
                            type="search"
                            className="da-search-input"
                            placeholder="Search here"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="da-filter-btns">
                        {FILTERS.map((f) => (
                            <button
                                key={f}
                                type="button"
                                className={`da-filter-btn${activeFilter === f ? ' da-filter-btn-active' : ''}`}
                                onClick={() => setActiveFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="da-table-wrap">
                    <p className="da-table-count">Showing {filtered.length} appointment{filtered.length !== 1 ? 's' : ''}</p>
                    <div className="da-table-scroll">
                        <table className="da-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Date &amp; Time</th>
                                    <th>End Time</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Booked By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="da-empty">No appointments found.</td>
                                    </tr>
                                ) : (
                                    filtered.map((a) => (
                                        <tr key={a.appointmentId || a.id}>
                                            <td className="da-td-patient">{a.patientName}</td>
                                            <td className="da-td-date">{a.date}<br /><span>{a.time}</span></td>
                                            <td>{a.endTime}</td>
                                            <td>{a.reason}</td>
                                            <td>
                                                <span className={`da-badge ${STATUS_BADGE[a.status] || ''}`}>
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td>{a.bookedBy}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </AppLayout>
    );
}

export default DoctorAppointments;
