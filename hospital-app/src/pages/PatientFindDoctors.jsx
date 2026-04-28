import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import '../styles/pages/PatientFindDoctors.css';
import AppLayout from '../components/AppLayout';
import FilterDropdown from '../components/FilterDropdown';
import { getJson, postJson } from '../utils/api';

const DEFAULT_DEPARTMENTS = ['All Departments', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology'];

const EMPTY_FORM = { doctor: '', department: '', date: '', time: '', reason: '' };

function getInitials(name) {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
}

function PatientFindDoctors() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState([]);
    const [selectedDept, setSelectedDept] = useState('All Departments');
    const [searchTerm, setSearchTerm] = useState('');
    const [showBookModal, setShowBookModal] = useState(false);
    const [bookForm, setBookForm] = useState(EMPTY_FORM);
    const [bookMsg, setBookMsg] = useState('');
    const [bookError, setBookError] = useState('');
    const [isBooking, setIsBooking] = useState(false);

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) { navigate('/login'); return; }
        setUserName(localStorage.getItem('user_name') || 'Patient');
        setUserId(userId);

        const loadDoctors = async () => {
            try {
                const result = await getJson('doctors.php');
                setDoctors((result.doctors || []).filter((doctor) => doctor.status === 'Active'));
            } catch (error) {
                console.error('Error loading doctors:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDoctors();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        navigate('/login');
    };

    const filtered = useMemo(() => {
        let list = doctors;
        if (selectedDept !== 'All Departments') {
            list = list.filter((d) => d.specialty === selectedDept);
        }
        const q = searchTerm.trim().toLowerCase();
        if (q) {
            list = list.filter((d) =>
                `${d.name} ${d.specialty} ${d.room}`.toLowerCase().includes(q)
            );
        }
        return list;
    }, [selectedDept, searchTerm, doctors]);

    const openBook = (doc) => {
        setBookForm({ doctor: doc.name, department: doc.specialty, date: '', time: '', reason: '' });
        setBookMsg('');
        setBookError('');
        setShowBookModal(true);
    };

    const closeBook = () => {
        setShowBookModal(false);
        setBookForm(EMPTY_FORM);
        setBookMsg('');
        setBookError('');
    };

    const handleBook = async (e) => {
        e.preventDefault();

        try {
            setIsBooking(true);
            setBookError('');

            await postJson('appointments.php', {
                patientName: userName,
                patientUserId: userId,
                doctor: bookForm.doctor,
                department: bookForm.department,
                date: bookForm.date,
                time: bookForm.time,
                notes: bookForm.reason,
                createdBy: userId,
                status: 'BOOKED',
            });

            setBookMsg('Appointment booked!');
            setTimeout(() => closeBook(), 1500);
        } catch (error) {
            setBookError(error?.message || 'Failed to book appointment.');
        } finally {
            setIsBooking(false);
        }
    };

    if (loading) return <div className="pfd-loading"><span>Loading...</span></div>;

    return (
        <AppLayout activePage="patient-find-doctors" title="Find Doctors" userName={userName} onLogout={handleLogout}>
            <main className="pfd-main">
                <h1 className="pfd-title">Find Doctors</h1>

                {/* Filters */}
                <div className="pfd-filter-bar">
                    <FilterDropdown
                        value={selectedDept}
                        options={DEFAULT_DEPARTMENTS}
                        onChange={setSelectedDept}
                        ariaLabel="Select department"
                        className="pfd-dept-wrap"
                    />

                    <div className="pfd-search-wrap">
                        <Search size={15} className="pfd-search-icon" />
                        <input
                            type="search"
                            className="pfd-search-input"
                            placeholder="Search here"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Doctor cards */}
                {filtered.length === 0 ? (
                    <p className="pfd-empty">No doctors found.</p>
                ) : (
                    <div className="pfd-cards-grid">
                        {filtered.map((doc) => (
                            <article key={doc.doctorId} className="pfd-card">
                                <div className="pfd-card-top">
                                    <div className="pfd-card-avatar">{getInitials(doc.name)}</div>
                                    <h3 className="pfd-card-name">{doc.name}</h3>
                                    <span className="pfd-card-specialty">{doc.specialty}</span>
                                </div>
                                <div className="pfd-card-body">
                                    <div className="pfd-card-row">
                                        <span className="pfd-card-row-label">Room</span>
                                        <span className="pfd-card-row-val">{doc.room}</span>
                                    </div>
                                    <div className="pfd-card-row">
                                        <span className="pfd-card-row-label">Available</span>
                                        <span className="pfd-card-row-val">
                                            {(doc.schedules || []).length > 0
                                                ? doc.schedules.map((schedule) => `${schedule.day} | ${schedule.time}`).join(' · ')
                                                : 'Not set'}
                                        </span>
                                    </div>
                                    <div className="pfd-card-row">
                                        <span className="pfd-card-row-label">Slot</span>
                                        <span className="pfd-card-row-val">{doc.slot ? `${doc.slot} minutes` : '30 minutes'}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="pfd-book-btn"
                                        onClick={() => openBook(doc)}
                                    >
                                        Book Appointment
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>

            {/* Book Appointment Modal */}
            {showBookModal && (
                <div className="pfd-modal-backdrop" onClick={closeBook}>
                    <div className="pfd-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="pfd-modal-title">Book Appointment</h2>
                        {bookError && <p className="pfd-modal-error">{bookError}</p>}
                        <form className="pfd-modal-form" onSubmit={handleBook}>
                            <div className="pfd-modal-row">
                                <div className="pfd-field">
                                    <label className="pfd-field-label">Select Doctor</label>
                                    <input
                                        type="text"
                                        className="pfd-input"
                                        value={bookForm.doctor}
                                        onChange={(e) => setBookForm({ ...bookForm, doctor: e.target.value })}
                                        placeholder="e.g. Dr. Jones"
                                        required
                                    />
                                </div>
                                <div className="pfd-field">
                                    <label className="pfd-field-label">Department</label>
                                    <input
                                        type="text"
                                        className="pfd-input"
                                        value={bookForm.department}
                                        onChange={(e) => setBookForm({ ...bookForm, department: e.target.value })}
                                        placeholder="e.g. Cardiology"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="pfd-modal-row">
                                <div className="pfd-field">
                                    <label className="pfd-field-label">Date</label>
                                    <input
                                        type="date"
                                        className="pfd-input"
                                        value={bookForm.date}
                                        onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="pfd-field">
                                    <label className="pfd-field-label">Time</label>
                                    <input
                                        type="time"
                                        className="pfd-input"
                                        value={bookForm.time}
                                        onChange={(e) => setBookForm({ ...bookForm, time: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="pfd-field">
                                <label className="pfd-field-label">Reason</label>
                                <textarea
                                    className="pfd-textarea"
                                    rows={4}
                                    placeholder="Reason for visit"
                                    value={bookForm.reason}
                                    onChange={(e) => setBookForm({ ...bookForm, reason: e.target.value })}
                                />
                            </div>
                            <div className="pfd-modal-footer">
                                <button type="button" className="pfd-modal-cancel-btn" onClick={closeBook}>
                                    Cancel
                                </button>
                                <button type="submit" className="pfd-modal-submit-btn" disabled={isBooking}>
                                    {bookMsg || 'Book Appointment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

export default PatientFindDoctors;
