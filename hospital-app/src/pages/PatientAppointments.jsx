import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, CheckCircle2, Search, Eye, X } from 'lucide-react';
import '../styles/pages/PatientAppointments.css';
import AppLayout from '../components/AppLayout';

const TODAY = 'March 9, 2026';

const INITIAL_APPOINTMENTS = [
    { id: 1, doctor: 'Dr. Michael Jones', specialty: 'Cardiology', room: 'Room 204', date: 'March 9, 2026', time: '9:00am', endTime: '9:30 AM', reason: 'Chest pain follow-up after last week\'s ECG results. Patient reported mild discomfort.', status: 'Completed' },
    { id: 2, doctor: 'Dr. Michael Jones', specialty: 'Neurology', room: 'Room 314', date: 'March 9, 2026', time: '10:30am', endTime: '11:00 AM', reason: 'Headache Consultation', status: 'Completed' },
    { id: 3, doctor: 'Dr. Michael Jones', specialty: 'Pediatrics', room: 'Room 104', date: 'March 9, 2026', time: '2:00pm', endTime: '3:00 PM', reason: 'Annual Checkup', status: 'Cancelled' },
    { id: 4, doctor: 'Dr. Michael Jones', specialty: 'Cardiology', room: 'Room 204', date: 'March 12, 2026', time: '1:30pm', endTime: '2:00 PM', reason: 'Blood Pressure Check', status: 'Booked' },
    { id: 5, doctor: 'Dr. Michael Jones', specialty: 'Pediatrics', room: 'Room 104', date: 'March 12, 2026', time: '2:30pm', endTime: '3:00 PM', reason: 'Annual Checkup', status: 'Booked' },
    { id: 6, doctor: 'Dr. Michael Jones', specialty: 'Orthopedics', room: 'Room 415', date: 'March 12, 2026', time: '3:30pm', endTime: '4:00 PM', reason: 'Knee Pain', status: 'Booked' },
];

const STATUS_BADGE = {
    Booked: 'pa-badge-booked',
    Completed: 'pa-badge-completed',
    Cancelled: 'pa-badge-cancelled',
    Upcoming: 'pa-badge-upcoming',
};

const FILTERS = ['All', 'Today', 'Upcoming', 'Completed', 'Cancelled'];

function PatientAppointments() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [viewAppt, setViewAppt] = useState(null);
    const [cancelAppt, setCancelAppt] = useState(null);

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) { navigate('/login'); return; }
        setUserName(localStorage.getItem('user_name') || 'Patient');
        setLoading(false);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        navigate('/login');
    };

    const filtered = useMemo(() => {
        let list = appointments;
        if (activeFilter === 'Today') {
            list = list.filter((a) => a.date === TODAY);
        } else if (activeFilter !== 'All') {
            list = list.filter((a) => a.status === activeFilter);
        }
        const q = searchTerm.trim().toLowerCase();
        if (q) {
            list = list.filter((a) =>
                `${a.doctor} ${a.specialty} ${a.reason} ${a.status}`.toLowerCase().includes(q)
            );
        }
        return list;
    }, [activeFilter, searchTerm, appointments]);

    const todayCount = appointments.filter((a) => a.date === TODAY).length;
    const upcomingCount = appointments.filter((a) => a.status === 'Booked' || a.status === 'Upcoming').length;
    const completedCount = appointments.filter((a) => a.status === 'Completed').length;

    const confirmCancel = () => {
        setAppointments((prev) =>
            prev.map((a) => (a.id === cancelAppt.id ? { ...a, status: 'Cancelled' } : a))
        );
        if (viewAppt?.id === cancelAppt.id) setViewAppt(null);
        setCancelAppt(null);
    };

    const canCancel = (a) => a.status !== 'Cancelled' && a.status !== 'Completed';

    if (loading) return <div className="pa-loading"><span>Loading...</span></div>;

    return (
        <AppLayout activePage="patient-appointments" title="My Appointments" userName={userName} onLogout={handleLogout}>
            <main className="pa-main">
                <h1 className="pa-title">My Appointments</h1>

                {/* Stats */}
                <section className="pa-stats-row">
                    <article className="pa-stat-card">
                        <div className="pa-stat-icon pa-stat-icon-blue"><CalendarDays size={20} /></div>
                        <div>
                            <p className="pa-stat-label">TODAY'S APPOINTMENTS</p>
                            <p className="pa-stat-value">{todayCount}</p>
                        </div>
                    </article>
                    <article className="pa-stat-card">
                        <div className="pa-stat-icon pa-stat-icon-orange"><ClipboardCheck size={20} /></div>
                        <div>
                            <p className="pa-stat-label">UPCOMING</p>
                            <p className="pa-stat-value">{upcomingCount}</p>
                        </div>
                    </article>
                    <article className="pa-stat-card">
                        <div className="pa-stat-icon pa-stat-icon-green"><CheckCircle2 size={20} /></div>
                        <div>
                            <p className="pa-stat-label">COMPLETED</p>
                            <p className="pa-stat-value">{completedCount}</p>
                        </div>
                    </article>
                </section>

                {/* Filter bar */}
                <section className="pa-filter-bar">
                    <div className="pa-search-wrap">
                        <Search size={15} className="pa-search-icon" />
                        <input
                            type="search"
                            className="pa-search-input"
                            placeholder="Search here"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="pa-filter-btns">
                        {FILTERS.map((f) => (
                            <button
                                key={f}
                                type="button"
                                className={`pa-filter-btn${activeFilter === f ? ' pa-filter-btn-active' : ''}`}
                                onClick={() => setActiveFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Table */}
                <section className="pa-table-wrap">
                    <p className="pa-table-count">
                        Showing {filtered.length} appointment{filtered.length !== 1 ? 's' : ''}
                    </p>
                    <div className="pa-table-scroll">
                        <table className="pa-table">
                            <thead>
                                <tr>
                                    <th>Doctors</th>
                                    <th>Date &amp; Time</th>
                                    <th>End Time</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="pa-empty">No appointments found.</td>
                                    </tr>
                                ) : (
                                    filtered.map((a) => (
                                        <tr key={a.id}>
                                            <td className="pa-td-doctor">
                                                {a.doctor}
                                                <br />
                                                <span>{a.specialty} | {a.room}</span>
                                            </td>
                                            <td className="pa-td-date">
                                                {a.date}<br /><span>{a.time}</span>
                                            </td>
                                            <td>{a.endTime}</td>
                                            <td className="pa-td-reason">
                                                {a.reason.length > 28 ? a.reason.slice(0, 28) + '…' : a.reason}
                                            </td>
                                            <td>
                                                <span className={`pa-badge ${STATUS_BADGE[a.status] || ''}`}>
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="pa-actions">
                                                    <button
                                                        type="button"
                                                        className="pa-action-btn"
                                                        title="View details"
                                                        onClick={() => setViewAppt(a)}
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`pa-action-btn${canCancel(a) ? ' pa-action-cancel' : ' pa-action-disabled'}`}
                                                        title="Cancel appointment"
                                                        onClick={() => canCancel(a) && setCancelAppt(a)}
                                                        disabled={!canCancel(a)}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {/* View Appointment Modal */}
            {viewAppt && (
                <div className="pa-modal-backdrop" onClick={() => setViewAppt(null)}>
                    <div className="pa-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="pa-modal-title">{viewAppt.doctor}</h2>
                        <div className="pa-modal-body">
                            <div className="pa-modal-row">
                                <div className="pa-field">
                                    <label className="pa-field-label">Doctor</label>
                                    <input type="text" className="pa-input" readOnly value={viewAppt.doctor} />
                                </div>
                                <div className="pa-field">
                                    <label className="pa-field-label">Department</label>
                                    <input type="text" className="pa-input" readOnly value={viewAppt.specialty} />
                                </div>
                            </div>
                            <div className="pa-modal-row">
                                <div className="pa-field">
                                    <label className="pa-field-label">Start</label>
                                    <input type="text" className="pa-input" readOnly value={viewAppt.time} />
                                </div>
                                <div className="pa-field">
                                    <label className="pa-field-label">End</label>
                                    <input type="text" className="pa-input" readOnly value={viewAppt.endTime} />
                                </div>
                            </div>
                            <div className="pa-modal-row">
                                <div className="pa-field">
                                    <label className="pa-field-label">Status</label>
                                    <input type="text" className="pa-input" readOnly value={viewAppt.status} />
                                </div>
                                <div className="pa-field">
                                    <label className="pa-field-label">Room</label>
                                    <input type="text" className="pa-input" readOnly value={viewAppt.room} />
                                </div>
                            </div>
                            <div className="pa-field">
                                <label className="pa-field-label">Reason</label>
                                <textarea className="pa-textarea" readOnly rows={3} value={viewAppt.reason} />
                            </div>
                        </div>
                        <div className="pa-modal-footer">
                            <button type="button" className="pa-modal-close-btn" onClick={() => setViewAppt(null)}>
                                Close
                            </button>
                            {canCancel(viewAppt) && (
                                <button
                                    type="button"
                                    className="pa-modal-danger-btn"
                                    onClick={() => { setCancelAppt(viewAppt); setViewAppt(null); }}
                                >
                                    Cancel Appointment
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {cancelAppt && (
                <div className="pa-modal-backdrop" onClick={() => setCancelAppt(null)}>
                    <div className="pa-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="pa-modal-title">{cancelAppt.doctor}</h2>
                        <div className="pa-modal-body">
                            <div className="pa-cancel-warning">
                                <p className="pa-cancel-warning-title">Are you sure?</p>
                                <p className="pa-cancel-warning-text">
                                    You are about to cancel this appointment. This action will update the
                                    status to Cancelled and cannot be undone.
                                </p>
                            </div>
                            <div className="pa-modal-row">
                                <div className="pa-field">
                                    <label className="pa-field-label">Doctor</label>
                                    <input type="text" className="pa-input" readOnly value={cancelAppt.doctor} />
                                </div>
                                <div className="pa-field">
                                    <label className="pa-field-label">Date &amp; Time</label>
                                    <input
                                        type="text"
                                        className="pa-input"
                                        readOnly
                                        value={`${cancelAppt.date}, ${cancelAppt.time}`}
                                    />
                                </div>
                            </div>
                            <div className="pa-field">
                                <label className="pa-field-label">New Status</label>
                                <input type="text" className="pa-input pa-input-danger" readOnly value="Cancelled" />
                            </div>
                        </div>
                        <div className="pa-modal-footer">
                            <button type="button" className="pa-modal-close-btn" onClick={() => setCancelAppt(null)}>
                                Keep Appointment
                            </button>
                            <button type="button" className="pa-modal-danger-btn" onClick={confirmCancel}>
                                Yes, Cancel It
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

export default PatientAppointments;
