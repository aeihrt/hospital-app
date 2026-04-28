import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CalendarCheck,
    ShieldCheck,
    Clock3,
    CalendarX,
    Pencil,
    RefreshCcw,
    Plus,
    X,
} from 'lucide-react';
import '../styles/pages/Home.css';
import AppLayout from '../components/AppLayout';
import FilterDropdown from '../components/FilterDropdown';
import { getJson, postJson } from '../utils/api';

const APPOINTMENT_STATUS_FILTERS = [
    { value: 'All', label: 'All' },
    { value: 'BOOKED', label: 'Booked' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELED', label: 'Canceled' },
    { value: 'NO_SHOW', label: 'No-show' },
];

function formatStatusLabel(status) {
    return String(status || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status) {
    return ['BOOKED', 'COMPLETED'].includes(status) ? 'home-status-active' : 'home-status-inactive';
}

function Home() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
    const [addAppointmentError, setAddAppointmentError] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [appointments, setAppointments] = useState([]);
    const [editApptModal, setEditApptModal] = useState({ isOpen: false, appt: null });
    const [editApptForm, setEditApptForm] = useState({ date: '', time: '', reason: '' });
    const [editApptError, setEditApptError] = useState('');
    const [isSavingAppt, setIsSavingAppt] = useState(false);

    const [statusApptModal, setStatusApptModal] = useState({ isOpen: false, appt: null });
    const [apptStatusValue, setApptStatusValue] = useState('BOOKED');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const [newAppointment, setNewAppointment] = useState({
        patientName: '',
        doctor: '',
        department: '',
        date: '',
        time: '',
        notes: '',
    });

    const todayLabel = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    const filteredAppointments = useMemo(() => {
        if (statusFilter === 'All') {
            return appointments;
        }

        return appointments.filter((appointment) => appointment.status === statusFilter);
    }, [appointments, statusFilter]);

    const totalAppointments = appointments.length;
    const bookedAppointments = appointments.filter((appointment) => appointment.status === 'BOOKED').length;
    const completedAppointments = appointments.filter((appointment) => appointment.status === 'COMPLETED').length;
    const canceledAppointments = appointments.filter((appointment) => ['CANCELED', 'NO_SHOW'].includes(appointment.status)).length;

    useEffect(() => {
        loadUserData();
        loadAppointments();
    }, []);

    const loadUserData = async () => {
        try {
            const userId = localStorage.getItem('user_id');
            if (!userId) {
                navigate('/login');
                return;
            }

            setUserName(localStorage.getItem('user_name') || 'User');
            setUserRole(localStorage.getItem('user_role') || 'USER');
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAppointments = async () => {
        try {
            const result = await getJson('appointments.php');
            setAppointments(result.appointments || []);
        } catch (error) {
            console.error('Error loading appointments:', error);
        }
    };

    function parseDateToInput(dateStr) {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    }

    function parseTimeToInput(timeStr) {
        const m = String(timeStr).match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
        if (!m) return '';
        let h = parseInt(m[1], 10);
        if (m[3].toLowerCase() === 'pm' && h < 12) h += 12;
        if (m[3].toLowerCase() === 'am' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${m[2]}`;
    }

    const openEditApptModal = (appt) => {
        setEditApptForm({
            date: parseDateToInput(appt.date),
            time: parseTimeToInput(appt.time),
            reason: appt.reason || '',
        });
        setEditApptError('');
        setEditApptModal({ isOpen: true, appt });
    };

    const closeEditApptModal = () => {
        setEditApptModal({ isOpen: false, appt: null });
        setEditApptError('');
    };

    const handleEditApptInput = (event) => {
        const { name, value } = event.target;
        setEditApptForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveAppt = async (event) => {
        event.preventDefault();
        setEditApptError('');
        if (!editApptForm.date || !editApptForm.time) {
            setEditApptError('Date and time are required.');
            return;
        }
        try {
            setIsSavingAppt(true);
            const result = await postJson('update_appointment.php', {
                action: 'edit',
                appointmentId: editApptModal.appt.appointmentId,
                date: editApptForm.date,
                time: editApptForm.time,
                reason: editApptForm.reason,
            });
            setAppointments((prev) => prev.map((a) =>
                a.appointmentId === editApptModal.appt.appointmentId
                    ? { ...a, date: result.date, time: result.time, reason: editApptForm.reason }
                    : a,
            ));
            closeEditApptModal();
        } catch (error) {
            setEditApptError(error?.message || 'Failed to update appointment.');
        } finally {
            setIsSavingAppt(false);
        }
    };

    const openStatusApptModal = (appt) => {
        setApptStatusValue(appt.status);
        setStatusApptModal({ isOpen: true, appt });
    };

    const closeStatusApptModal = () => setStatusApptModal({ isOpen: false, appt: null });

    const handleUpdateApptStatus = async () => {
        try {
            setIsUpdatingStatus(true);
            await postJson('update_appointment.php', {
                action: 'update_status',
                appointmentId: statusApptModal.appt.appointmentId,
                status: apptStatusValue,
            });
            setAppointments((prev) => prev.map((a) =>
                a.appointmentId === statusApptModal.appt.appointmentId
                    ? { ...a, status: apptStatusValue }
                    : a,
            ));
            closeStatusApptModal();
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleLogout = async () => {
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        navigate('/login');
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        setAddAppointmentError('');
        setNewAppointment({
            patientName: '',
            doctor: '',
            department: '',
            date: '',
            time: '',
            notes: '',
        });
    };

    const handleAddInputChange = (event) => {
        const { name, value } = event.target;
        setNewAppointment((previous) => ({ ...previous, [name]: value }));
    };

    const handleCreateAppointment = async (event) => {
        event.preventDefault();
        setAddAppointmentError('');

        const requiredFields = ['patientName', 'doctor', 'department', 'date', 'time'];
        const hasAllRequiredFields = requiredFields.every((field) => newAppointment[field]?.trim());

        if (!hasAllRequiredFields) {
            setAddAppointmentError('Please fill in all required fields.');
            return;
        }

        try {
            setIsCreatingAppointment(true);

            const response = await postJson('appointments.php', {
                patientName: newAppointment.patientName.trim(),
                doctor: newAppointment.doctor.trim(),
                department: newAppointment.department.trim(),
                date: newAppointment.date,
                time: newAppointment.time,
                notes: newAppointment.notes.trim(),
                createdBy: localStorage.getItem('user_id') || null,
            });

            if (response?.appointment) {
                setAppointments((previous) => [response.appointment, ...previous]);
            }

            closeAddModal();
        } catch (error) {
            setAddAppointmentError(error?.message || 'Failed to create appointment.');
        } finally {
            setIsCreatingAppointment(false);
        }
    };

    if (loading) {
        return (
            <div className="home-loading">
                <div className="home-loading-text">Loading...</div>
            </div>
        );
    }

    return (
        <AppLayout activePage="appointment" title="Appointment" userName={userName} onLogout={handleLogout}>
            <main className="home-main">
                <section className="home-header-row">
                    <div>
                        <h2 className="home-welcome">Appointment Management</h2>
                        <p className="home-subtitle">View and manage today's appointment schedule.</p>
                    </div>
                    <button type="button" className="home-add-btn" onClick={() => setIsAddModalOpen(true)}>
                        <Plus size={16} />
                        <span>Add New Appointment</span>
                    </button>
                </section>

                <section className="home-stats-grid">
                    <article className="home-stat-card">
                        <div className="home-stat-icon home-stat-icon-blue">
                            <CalendarCheck size={18} />
                        </div>
                        <div>
                            <p className="home-stat-caption">TOTAL APPOINTMENTS</p>
                            <p className="home-stat-number">{totalAppointments}</p>
                        </div>
                    </article>

                    <article className="home-stat-card">
                        <div className="home-stat-icon home-stat-icon-green">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <p className="home-stat-caption">BOOKED</p>
                            <p className="home-stat-number">{bookedAppointments}</p>
                        </div>
                    </article>

                    <article className="home-stat-card">
                        <div className="home-stat-icon home-stat-icon-orange">
                            <Clock3 size={18} />
                        </div>
                        <div>
                            <p className="home-stat-caption">COMPLETED</p>
                            <p className="home-stat-number">{completedAppointments}</p>
                        </div>
                    </article>

                    <article className="home-stat-card">
                        <div className="home-stat-icon home-stat-icon-red">
                            <CalendarX size={18} />
                        </div>
                        <div>
                            <p className="home-stat-caption">CANCELED</p>
                            <p className="home-stat-number">{canceledAppointments}</p>
                        </div>
                    </article>
                </section>

                <section className="home-filter-row">
                    <div className="home-filter-time-group">
                        <button type="button" className="home-filter-btn home-filter-btn-dark">Today</button>
                        <button type="button" className="home-filter-btn">Week</button>
                        <button type="button" className="home-filter-btn">Month</button>
                    </div>
                    <FilterDropdown
                        value={statusFilter}
                        options={APPOINTMENT_STATUS_FILTERS}
                        onChange={setStatusFilter}
                        ariaLabel="Select appointment status"
                    />
                    <div className="home-status-filter">
                        {APPOINTMENT_STATUS_FILTERS.map((status) => (
                            <button
                                key={status.value}
                                type="button"
                                className={`home-status-btn ${statusFilter === status.value ? 'home-status-btn-active' : ''}`}
                                onClick={() => setStatusFilter(status.value)}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="home-table-wrap">
                    <div className="home-table-top">Showing {filteredAppointments.length} of {appointments.length} appointments</div>
                    <div className="home-table-scroll">
                        <table className="home-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Patient Info</th>
                                    <th>Doctor</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.map((row, index) => (
                                    <tr key={`${row.appointmentId || row.patientName}-${index}`}>
                                        <td>
                                            <p className="home-row-main">{row.time}</p>
                                            <p className="home-row-sub">{row.date}</p>
                                        </td>
                                        <td>
                                            <p className="home-row-main">{row.patientName}</p>
                                            <p className="home-row-sub">{row.patientMeta}</p>
                                        </td>
                                        <td className="home-row-main">{row.doctor}</td>
                                        <td className="home-row-main">{row.department}</td>
                                        <td>
                                            <span className={`home-status ${getStatusClass(row.status)}`}>
                                                {formatStatusLabel(row.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="home-actions-inline">
                                                <button type="button" className="home-action-icon" aria-label="Edit appointment" onClick={() => openEditApptModal(row)}>
                                                    <Pencil size={15} />
                                                </button>
                                                <button type="button" className="home-action-icon" aria-label="Update status" onClick={() => openStatusApptModal(row)}>
                                                    <RefreshCcw size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

            </main>

            {isAddModalOpen && (
                <div className="home-add-modal-overlay" onClick={closeAddModal}>
                    <div
                        className="home-add-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Add New Appointment"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="home-add-modal-head">
                            <div className="home-add-modal-title-wrap">
                                <Plus size={26} />
                                <h2>Add New Appointment</h2>
                            </div>
                            <button type="button" className="home-add-modal-close" onClick={closeAddModal} aria-label="Close modal">
                                <X size={22} />
                            </button>
                        </div>

                        <form className="home-add-modal-form" onSubmit={handleCreateAppointment}>
                            {addAppointmentError && <p className="home-add-error">{addAppointmentError}</p>}

                            <div className="home-add-field home-add-field-full">
                                <label htmlFor="patientName">Patient Name</label>
                                <input
                                    id="patientName"
                                    name="patientName"
                                    type="text"
                                    placeholder="e.g. Juan dela Cruz"
                                    value={newAppointment.patientName}
                                    onChange={handleAddInputChange}
                                    required
                                />
                            </div>

                            <div className="home-add-field">
                                <label htmlFor="doctor">Select Doctor</label>
                                <input
                                    id="doctor"
                                    name="doctor"
                                    type="text"
                                    placeholder="e.g. Dr. Maria Garcia"
                                    value={newAppointment.doctor}
                                    onChange={handleAddInputChange}
                                    required
                                />
                            </div>

                            <div className="home-add-field">
                                <label htmlFor="department">Department</label>
                                <input
                                    id="department"
                                    name="department"
                                    type="text"
                                    placeholder="e.g. Cardiology"
                                    value={newAppointment.department}
                                    onChange={handleAddInputChange}
                                    required
                                />
                            </div>

                            <div className="home-add-field">
                                <label htmlFor="date">Date</label>
                                <input id="date" name="date" type="date" value={newAppointment.date} onChange={handleAddInputChange} required />
                            </div>

                            <div className="home-add-field">
                                <label htmlFor="time">Time</label>
                                <input id="time" name="time" type="time" value={newAppointment.time} onChange={handleAddInputChange} required />
                            </div>

                            <div className="home-add-field home-add-field-full">
                                <label htmlFor="notes">Notes</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    placeholder="Optional: clinical notes or special instructions"
                                    rows={5}
                                    value={newAppointment.notes}
                                    onChange={handleAddInputChange}
                                />
                            </div>

                            <div className="home-add-actions">
                                <button type="button" className="home-add-cancel" onClick={closeAddModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="home-add-submit" disabled={isCreatingAppointment}>
                                    {isCreatingAppointment ? 'Creating...' : 'Create Appointment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editApptModal.isOpen && (
                <div className="home-add-modal-overlay" onClick={closeEditApptModal}>
                    <div className="home-add-modal" role="dialog" aria-modal="true" aria-label="Edit Appointment" onClick={(e) => e.stopPropagation()}>
                        <div className="home-add-modal-head">
                            <div className="home-add-modal-title-wrap">
                                <Pencil size={24} />
                                <h2>Edit Appointment</h2>
                            </div>
                            <button type="button" className="home-add-modal-close" onClick={closeEditApptModal} aria-label="Close">
                                <X size={22} />
                            </button>
                        </div>
                        <form className="home-add-modal-form" onSubmit={handleSaveAppt}>
                            {editApptError && <p className="home-add-error">{editApptError}</p>}
                            <div className="home-add-field home-add-field-full">
                                <label>Patient</label>
                                <input type="text" value={editApptModal.appt?.patientName || ''} readOnly />
                            </div>
                            <div className="home-add-field">
                                <label>Doctor</label>
                                <input type="text" value={editApptModal.appt?.doctor || ''} readOnly />
                            </div>
                            <div className="home-add-field">
                                <label>Department</label>
                                <input type="text" value={editApptModal.appt?.department || ''} readOnly />
                            </div>
                            <div className="home-add-field">
                                <label htmlFor="appt-date">Date</label>
                                <input id="appt-date" name="date" type="date" value={editApptForm.date} onChange={handleEditApptInput} required />
                            </div>
                            <div className="home-add-field">
                                <label htmlFor="appt-time">Time</label>
                                <input id="appt-time" name="time" type="time" value={editApptForm.time} onChange={handleEditApptInput} required />
                            </div>
                            <div className="home-add-field home-add-field-full">
                                <label htmlFor="appt-reason">Notes / Reason</label>
                                <textarea id="appt-reason" name="reason" rows={4} placeholder="Optional: clinical notes or special instructions" value={editApptForm.reason} onChange={handleEditApptInput} />
                            </div>
                            <div className="home-add-actions">
                                <button type="button" className="home-add-cancel" onClick={closeEditApptModal}>Cancel</button>
                                <button type="submit" className="home-add-submit" disabled={isSavingAppt}>{isSavingAppt ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {statusApptModal.isOpen && (
                <div className="home-add-modal-overlay" onClick={closeStatusApptModal}>
                    <div className="home-add-modal home-status-modal" role="dialog" aria-modal="true" aria-label="Update Status" onClick={(e) => e.stopPropagation()}>
                        <div className="home-add-modal-head">
                            <div className="home-add-modal-title-wrap">
                                <RefreshCcw size={24} />
                                <h2>Update Status</h2>
                            </div>
                            <button type="button" className="home-add-modal-close" onClick={closeStatusApptModal} aria-label="Close">
                                <X size={22} />
                            </button>
                        </div>
                        <div className="home-status-modal-body">
                            <p className="home-status-modal-patient"><strong>{statusApptModal.appt?.patientName}</strong> — {statusApptModal.appt?.doctor}</p>
                            <p className="home-status-modal-date">{statusApptModal.appt?.date} at {statusApptModal.appt?.time}</p>
                            <div className="home-status-options">
                                {[
                                    { value: 'BOOKED', label: 'Booked' },
                                    { value: 'COMPLETED', label: 'Completed' },
                                    { value: 'CANCELED', label: 'Canceled' },
                                    { value: 'NO_SHOW', label: 'No-show' },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        className={`home-status-option ${apptStatusValue === opt.value ? 'home-status-option-active' : ''}`}
                                        onClick={() => setApptStatusValue(opt.value)}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <div className="home-add-actions">
                                <button type="button" className="home-add-cancel" onClick={closeStatusApptModal}>Cancel</button>
                                <button type="button" className="home-add-submit" onClick={handleUpdateApptStatus} disabled={isUpdatingStatus}>
                                    {isUpdatingStatus ? 'Updating...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

export default Home;
