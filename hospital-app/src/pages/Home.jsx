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
} from 'lucide-react';
import '../styles/pages/Home.css';
import AppLayout from '../components/AppLayout';
import { postJson } from '../utils/api';

function Home() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
    const [addAppointmentError, setAddAppointmentError] = useState('');
    const [newAppointment, setNewAppointment] = useState({
        patientName: '',
        doctor: '',
        department: '',
        date: '',
        time: '',
        notes: '',
    });

    const [appointments, setAppointments] = useState([
        {
            time: '9:30am',
            date: 'March 24, 2026',
            patientName: 'John Doe',
            patientMeta: 'P - 12345 | Male, 35yrs old',
            doctor: 'Dr. Michael Jones',
            department: 'Cardiology',
            status: 'Active',
        },
        {
            time: '10:00am',
            date: 'March 24, 2026',
            patientName: 'Alice Smith',
            patientMeta: 'P - 12345 | Female, 28yrs old',
            doctor: 'Dr. Sarah Smith',
            department: 'Cardiology',
            status: 'Active',
        },
        {
            time: '11:30am',
            date: 'March 24, 2026',
            patientName: 'Robert White',
            patientMeta: 'P - 12345 | Male, 54yrs old',
            doctor: 'Dr. David Lee',
            department: 'Cardiology',
            status: 'Active',
        },
        {
            time: '1:15pm',
            date: 'March 24, 2026',
            patientName: 'Emily Miller',
            patientMeta: 'P - 12345 | Female, 42yrs old',
            doctor: 'Dr. Maria Garcia',
            department: 'Cardiology',
            status: 'Inactive',
        },
        {
            time: '3:00pm',
            date: 'March 24, 2026',
            patientName: 'Thomas King',
            patientMeta: 'P - 12345 | Male, 61yrs old',
            doctor: 'Dr. Michael Jones',
            department: 'Cardiology',
            status: 'Active',
        },
        {
            time: '4:10pm',
            date: 'March 24, 2026',
            patientName: 'Laura Johnson',
            patientMeta: 'P - 12345 | Female, 31yrs old',
            doctor: 'Dr. Jose Santos',
            department: 'Cardiology',
            status: 'Active',
        },
    ]);

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

            setUserName(localStorage.getItem('user_name') || 'User');
            setUserRole(localStorage.getItem('user_role') || 'USER');
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
                <section className="home-stats-grid">
                    <article className="home-stat-card">
                        <div className="home-stat-icon home-stat-icon-blue">
                            <CalendarCheck size={18} />
                        </div>
                        <div>
                            <p className="home-stat-caption">TODAY'S VISITS</p>
                            <p className="home-stat-number">42</p>
                        </div>
                    </article>

                    <article className="home-stat-card">
                        <div className="home-stat-icon home-stat-icon-green">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <p className="home-stat-caption">CONFIRMED</p>
                            <p className="home-stat-number">38</p>
                        </div>
                    </article>

                    <article className="home-stat-card">
                        <div className="home-stat-icon home-stat-icon-orange">
                            <Clock3 size={18} />
                        </div>
                        <div>
                            <p className="home-stat-caption">WAITLIST</p>
                            <p className="home-stat-number">12</p>
                        </div>
                    </article>

                    <article className="home-stat-card">
                        <div className="home-stat-icon home-stat-icon-red">
                            <CalendarX size={18} />
                        </div>
                        <div>
                            <p className="home-stat-caption">CANCELLATIONS</p>
                            <p className="home-stat-number">4</p>
                        </div>
                    </article>
                </section>

                <section className="home-filters">
                    <div className="home-filter-group">
                        <button type="button" className="home-filter-btn home-filter-btn-dark">Today</button>
                        <button type="button" className="home-filter-btn">Week</button>
                        <button type="button" className="home-filter-btn">Month</button>
                    </div>

                    <div className="home-filter-group home-filter-group-end">
                        <select className="select-dark">
                            <option>All Roles</option>
                            <option>Admin</option>
                            <option>Doctor</option>
                            <option>Patient</option>
                        </select>
                        <button type="button" className="home-filter-btn home-filter-btn-dark">All</button>
                        <button type="button" className="home-filter-btn">Inactive</button>
                        <button type="button" className="home-filter-btn">Active</button>
                        <button type="button" className="home-add-btn" onClick={() => setIsAddModalOpen(true)}>
                            <Plus size={17} />
                            <span>Add New Appointment</span>
                        </button>
                    </div>
                </section>

                <section className="home-table-wrap">
                    <div className="home-table-top">Showing {appointments.length} of 128 users</div>
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
                                {appointments.map((row, index) => (
                                    <tr key={`${row.patientName}-${index}`}>
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
                                            <span
                                                className={`home-status ${
                                                    row.status === 'Active' ? 'home-status-active' : 'home-status-inactive'
                                                }`}
                                            >
                                                {row.status}
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

                <p className="home-footer-meta">Signed in as {mappedRole}</p>
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
                            <Plus size={26} />
                            <h2>Add New Appointment</h2>
                        </div>

                        <form className="home-add-modal-form" onSubmit={handleCreateAppointment}>
                            {addAppointmentError && <p className="home-add-error">{addAppointmentError}</p>}

                            <div className="home-add-field home-add-field-full">
                                <label htmlFor="patientName">Patient Name</label>
                                <input
                                    id="patientName"
                                    name="patientName"
                                    type="text"
                                    placeholder="Search Patient Name"
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
                                    placeholder="e.g. Maria"
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
                                    placeholder="e.g. Reyes"
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
                                    placeholder="Active"
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
