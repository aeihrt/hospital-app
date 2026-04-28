import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, CheckCircle2, Search, Eye, X } from 'lucide-react';
import '../styles/pages/PatientAppointments.css';
import AppLayout from '../components/AppLayout';
import { getJson, postJson } from '../utils/api';

const STATUS_BADGE = {
    BOOKED: 'pa-badge-booked',
    COMPLETED: 'pa-badge-completed',
    CANCELED: 'pa-badge-cancelled',
    NO_SHOW: 'pa-badge-upcoming',
};

const FILTERS = ['All', 'Booked', 'Completed', 'Canceled'];

function formatStatusLabel(status) {
    return String(status || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function PatientAppointments() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [viewAppt, setViewAppt] = useState(null);
    const [cancelAppt, setCancelAppt] = useState(null);
    const [cancelError, setCancelError] = useState('');
    const [isCanceling, setIsCanceling] = useState(false);

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) { navigate('/login'); return; }
        setUserName(localStorage.getItem('user_name') || 'Patient');
        setUserId(userId);

        const loadAppointments = async () => {
            try {
                const result = await getJson(`appointments.php?patientUserId=${encodeURIComponent(userId)}`);
                setAppointments(result.appointments || []);
            } catch (error) {
                console.error('Error loading patient appointments:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAppointments();
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
            list = list.filter((a) => formatStatusLabel(a.status) === activeFilter);
        }
        const q = searchTerm.trim().toLowerCase();
        if (q) {
            list = list.filter((a) =>
                `${a.doctor} ${a.specialty} ${a.reason} ${a.status}`.toLowerCase().includes(q)
            );
        }
        return list;
    }, [activeFilter, searchTerm, appointments]);

    const todayCount = appointments.filter((a) => a.date === new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })).length;
    const upcomingCount = appointments.filter((a) => ['BOOKED', 'NO_SHOW'].includes(a.status)).length;
    const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

    const confirmCancel = async () => {
        try {
            setIsCanceling(true);
            setCancelError('');
            await postJson('appointments.php', {
                appointmentId: cancelAppt.appointmentId,
                patientUserId: userId,
                status: 'CANCELED',
            });

            setAppointments((prev) =>
                prev.map((a) => (a.appointmentId === cancelAppt.appointmentId ? { ...a, status: 'CANCELED' } : a))
            );
            if (viewAppt?.appointmentId === cancelAppt.appointmentId) setViewAppt(null);
            setCancelAppt(null);
        } catch (error) {
            setCancelError(error?.message || 'Failed to cancel appointment.');
        } finally {
            setIsCanceling(false);
        }
    };

    const canCancel = (a) => a.status !== 'CANCELED' && a.status !== 'COMPLETED';

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
                                                    {formatStatusLabel(a.status)}
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
                                    <input type="text" className="pa-input" readOnly value={formatStatusLabel(viewAppt.status)} />
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
                            {cancelError && <p className="pa-cancel-error">{cancelError}</p>}
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
                            <button type="button" className="pa-modal-danger-btn" onClick={confirmCancel} disabled={isCanceling}>
                                {isCanceling ? 'Canceling...' : 'Yes, Cancel It'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

export default PatientAppointments;
