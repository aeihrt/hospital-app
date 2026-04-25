import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import '../styles/pages/PatientFindDoctors.css';
import AppLayout from '../components/AppLayout';

const DEPARTMENTS = ['All Departments', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology'];

const DOCTORS = [
    { id: 1, name: 'Dr. Michael Jones', specialty: 'Cardiology', room: 'Room 204', available: 'Mon | Wed | Fri', slot: '30 minutes' },
    { id: 2, name: 'Dr. Sarah Lee', specialty: 'Neurology', room: 'Room 314', available: 'Tue | Thu', slot: '45 minutes' },
    { id: 3, name: 'Dr. James Tan', specialty: 'Pediatrics', room: 'Room 104', available: 'Mon | Wed | Fri', slot: '30 minutes' },
    { id: 4, name: 'Dr. Elena Reyes', specialty: 'Orthopedics', room: 'Room 415', available: 'Mon | Tue | Fri', slot: '60 minutes' },
    { id: 5, name: 'Dr. Carlos Bautista', specialty: 'Dermatology', room: 'Room 210', available: 'Wed | Thu', slot: '30 minutes' },
    { id: 6, name: 'Dr. Ana Santos', specialty: 'Cardiology', room: 'Room 208', available: 'Mon | Wed | Fri', slot: '30 minutes' },
];

const EMPTY_FORM = { doctor: '', department: '', date: '', time: '', reason: '' };

function getInitials(name) {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
}

function PatientFindDoctors() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedDept, setSelectedDept] = useState('All Departments');
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeptMenu, setShowDeptMenu] = useState(false);
    const [showBookModal, setShowBookModal] = useState(false);
    const [bookForm, setBookForm] = useState(EMPTY_FORM);
    const [bookMsg, setBookMsg] = useState('');

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
        let list = DOCTORS;
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
    }, [selectedDept, searchTerm]);

    const openBook = (doc) => {
        setBookForm({ doctor: doc.name, department: doc.specialty, date: '', time: '', reason: '' });
        setBookMsg('');
        setShowBookModal(true);
    };

    const closeBook = () => {
        setShowBookModal(false);
        setBookForm(EMPTY_FORM);
        setBookMsg('');
    };

    const handleBook = (e) => {
        e.preventDefault();
        setBookMsg('Appointment booked!');
        setTimeout(() => closeBook(), 1500);
    };

    if (loading) return <div className="pfd-loading"><span>Loading...</span></div>;

    return (
        <AppLayout activePage="patient-find-doctors" title="Find Doctors" userName={userName} onLogout={handleLogout}>
            <main className="pfd-main">
                <h1 className="pfd-title">Find Doctors</h1>

                {/* Filters */}
                <div className="pfd-filter-bar">
                    <div className="pfd-dept-wrap">
                        <button
                            type="button"
                            className="pfd-dept-btn"
                            onClick={() => setShowDeptMenu((v) => !v)}
                        >
                            {selectedDept}
                            <ChevronDown size={14} />
                        </button>
                        {showDeptMenu && (
                            <>
                                <div
                                    className="pfd-dept-backdrop"
                                    onClick={() => setShowDeptMenu(false)}
                                />
                                <div className="pfd-dept-menu">
                                    {DEPARTMENTS.map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            className={`pfd-dept-item${selectedDept === d ? ' pfd-dept-item-active' : ''}`}
                                            onClick={() => { setSelectedDept(d); setShowDeptMenu(false); }}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

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
                            <article key={doc.id} className="pfd-card">
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
                                        <span className="pfd-card-row-val">{doc.available}</span>
                                    </div>
                                    <div className="pfd-card-row">
                                        <span className="pfd-card-row-label">Slot</span>
                                        <span className="pfd-card-row-val">{doc.slot}</span>
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
                                <button type="submit" className="pfd-modal-submit-btn">
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
