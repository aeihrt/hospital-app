import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/DoctorSchedule.css';
import AppLayout from '../components/AppLayout';

const INITIAL_SCHEDULE = {
    Monday: [
        { time: '8:00 AM', status: 'Taken' },
        { time: '8:30 AM', status: 'Taken' },
        { time: '9:00 AM', status: 'Taken' },
        { time: '9:30 AM', status: 'Taken' },
        { time: '10:00 AM', status: 'Open' },
        { time: '10:30 AM', status: 'Open' },
    ],
    Wednesday: [
        { time: '1:00 PM', status: 'Open' },
        { time: '1:30 PM', status: 'Open' },
        { time: '2:00 PM', status: 'Open' },
        { time: '2:30 PM', status: 'Taken' },
        { time: '3:00 PM', status: 'Taken' },
        { time: '3:30 PM', status: 'Taken' },
    ],
    Friday: [
        { time: '8:00 AM', status: 'Open' },
        { time: '8:30 AM', status: 'Open' },
        { time: '9:00 AM', status: 'Taken' },
        { time: '9:30 AM', status: 'Taken' },
    ],
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function DoctorSchedule() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
    const [form, setForm] = useState({
        day: 'Monday',
        startTime: '8:00 AM',
        endTime: '12:00 PM',
        slotDuration: '30',
        status: 'Active',
    });
    const [saveMsg, setSaveMsg] = useState('');

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) { navigate('/login'); return; }
        setUserName(localStorage.getItem('user_name') || 'Doctor');
        setLoading(false);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        navigate('/login');
    };

    const allSlots = Object.values(schedule).flat();
    const totalSlots = allSlots.length;
    const bookedSlots = allSlots.filter((s) => s.status === 'Taken').length;

    const handleSave = (e) => {
        e.preventDefault();
        const start = parseInt(form.startTime.split(':')[0], 10);
        const end = parseInt(form.endTime.split(':')[0], 10);
        const duration = parseInt(form.slotDuration, 10) || 30;
        const slots = [];
        for (let h = start; h < end; ) {
            const ampm = h < 12 ? 'AM' : 'PM';
            const display = `${h > 12 ? h - 12 : h || 12}:00 ${ampm}`;
            slots.push({ time: display, status: 'Open' });
            h += duration / 60;
        }
        setSchedule((prev) => ({ ...prev, [form.day]: slots }));
        setSaveMsg('Schedule saved!');
        setTimeout(() => setSaveMsg(''), 2500);
    };

    if (loading) return <div className="ds-loading"><span>Loading...</span></div>;

    return (
        <AppLayout activePage="doctor-schedule" title="My Schedule" userName={userName} onLogout={handleLogout}>
            <main className="ds-main">
                <h1 className="ds-title">My Schedule</h1>

                <div className="ds-grid">
                    {/* Left — daily schedule */}
                    <div className="ds-days-col">
                        {Object.entries(schedule).map(([day, slots]) => (
                            <section key={day} className="ds-day-card">
                                <h3 className="ds-day-name">{day}</h3>
                                <div className="ds-slots">
                                    {slots.map((slot, i) => (
                                        <div key={i} className="ds-slot-row">
                                            <span className="ds-slot-time">{slot.time}</span>
                                            <div className={`ds-slot-bar${slot.status === 'Taken' ? ' ds-slot-bar-taken' : ''}`} />
                                            <span className={`ds-slot-status${slot.status === 'Taken' ? ' ds-slot-status-taken' : ' ds-slot-status-open'}`}>
                                                {slot.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>

                    {/* Right — summary + add schedule */}
                    <div className="ds-right-col">
                        <section className="ds-summary-card">
                            <h3 className="ds-summary-title">Weekly Summary</h3>
                            <div className="ds-summary-rows">
                                <div className="ds-summary-row">
                                    <span>Active Days</span>
                                    <span className="ds-summary-val">{Object.keys(schedule).length} days</span>
                                </div>
                                <div className="ds-summary-row">
                                    <span>Total Slot</span>
                                    <span className="ds-summary-val">{totalSlots} slots</span>
                                </div>
                                <div className="ds-summary-row">
                                    <span>Slot Duration</span>
                                    <span className="ds-summary-val">30mins</span>
                                </div>
                                <div className="ds-summary-row">
                                    <span>Booked Slots</span>
                                    <span className="ds-summary-val">{bookedSlots}/{totalSlots}</span>
                                </div>
                            </div>
                        </section>

                        <section className="ds-add-card">
                            <h3 className="ds-add-title">Add Schedule</h3>
                            <form className="ds-add-form" onSubmit={handleSave}>
                                <div className="ds-field">
                                    <label className="ds-field-label">Day of Week</label>
                                    <select
                                        className="ds-input"
                                        value={form.day}
                                        onChange={(e) => setForm({ ...form, day: e.target.value })}
                                    >
                                        {DAYS.map((d) => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="ds-field-row">
                                    <div className="ds-field">
                                        <label className="ds-field-label">Start Time</label>
                                        <input
                                            type="text"
                                            className="ds-input"
                                            value={form.startTime}
                                            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                        />
                                    </div>
                                    <div className="ds-field">
                                        <label className="ds-field-label">End Time</label>
                                        <input
                                            type="text"
                                            className="ds-input"
                                            value={form.endTime}
                                            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="ds-field">
                                    <label className="ds-field-label">Slot Duration</label>
                                    <input
                                        type="number"
                                        className="ds-input"
                                        value={form.slotDuration}
                                        onChange={(e) => setForm({ ...form, slotDuration: e.target.value })}
                                        min="15"
                                        step="15"
                                    />
                                </div>
                                <div className="ds-field">
                                    <label className="ds-field-label">Status</label>
                                    <select
                                        className="ds-input"
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    >
                                        <option>Active</option>
                                        <option>Inactive</option>
                                    </select>
                                </div>
                                {saveMsg && <p className="ds-save-msg">{saveMsg}</p>}
                                <button type="submit" className="ds-save-btn">Save Schedule</button>
                            </form>
                        </section>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}

export default DoctorSchedule;
