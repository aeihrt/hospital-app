import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CalendarCheck,
    ShieldCheck,
    Clock3,
    CalendarX,
    Pencil,
    RefreshCcw,
    KeyRound,
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
                                                <button type="button" className="home-action-icon" aria-label="Edit">
                                                    <Pencil size={15} />
                                                </button>
                                                <button type="button" className="home-action-icon" aria-label="Refresh">
                                                    <RefreshCcw size={15} />
                                                </button>
                                                <button type="button" className="home-action-icon" aria-label="Access">
                                                    <KeyRound size={15} />
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
                                    placeholder="Search patient name"
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
                                    placeholder="Add appointment notes"
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
        </AppLayout>
    );
}

export default Home;
