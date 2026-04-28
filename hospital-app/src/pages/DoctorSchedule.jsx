import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/DoctorSchedule.css';
import AppLayout from '../components/AppLayout';
import { getJson, postJson } from '../utils/api';
import FilterDropdown from '../components/FilterDropdown';

const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const STATUS_OPTIONS = ['Active', 'Inactive'];

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

function DoctorSchedule() {
    const navigate = useNavigate();
    const storedUserId = localStorage.getItem('user_id') || '';
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [doctorId, setDoctorId] = useState('');
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
        const userId = storedUserId;
        if (!userId) { navigate('/login'); return; }
        setUserName(localStorage.getItem('user_name') || 'Doctor');
        (async () => {
            try {
                const res = await getJson('doctors.php');
                const found = (res.doctors || []).find((d) => d.userId === userId);
                if (found && Array.isArray(found.schedules)) {
                    setDoctorId(found.doctorId || '');
                    const mapped = {};
                    found.schedules.forEach((s) => {
                        if (!mapped[s.day]) mapped[s.day] = [];
                        mapped[s.day].push({
                            time: s.time,
                            status: s.isActive ? 'Open' : 'Inactive',
                        });
                    });
                    if (Object.keys(mapped).length > 0) {
                        setSchedule(mapped);
                    }
                }
            } catch (err) {
                // ignore
            } finally {
                setLoading(false);
            }
        })();
    }, [navigate, storedUserId]);

    const handleLogout = () => {
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        navigate('/login');
    };

    const allSlots = Object.values(schedule).flat();
    const totalSlots = allSlots.length;
    const bookedSlots = allSlots.filter((s) => s.status === 'Taken').length;

    const toMinutes = (timeValue) => {
        const value = String(timeValue || '').trim();
        const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (!match) return null;

        let hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);
        const meridiem = (match[3] || '').toUpperCase();

        if (Number.isNaN(hour) || Number.isNaN(minute) || minute > 59) return null;

        if (meridiem === 'PM' && hour < 12) hour += 12;
        if (meridiem === 'AM' && hour === 12) hour = 0;

        if (!meridiem && hour > 23) return null;

        return (hour * 60) + minute;
    };

    const toDisplay = (totalMinutes) => {
        const hour24 = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        const hour12 = hour24 % 12 || 12;
        return `${hour12}:${String(minute).padStart(2, '0')} ${ampm}`;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const start = toMinutes(form.startTime);
        const end = toMinutes(form.endTime);
        const duration = parseInt(form.slotDuration, 10) || 30;

        if (start === null || end === null || end <= start) {
            setSaveMsg('Please enter a valid time range.');
            setTimeout(() => setSaveMsg(''), 2500);
            return;
        }

        const slots = [];
        for (let minutes = start; minutes < end; minutes += duration) {
            slots.push({ time: toDisplay(minutes), status: 'Open' });
        }

        try {
            await postJson('doctors.php', {
                doctorId,
                userId: storedUserId,
                day: form.day,
                startTime: form.startTime,
                endTime: form.endTime,
                slotMinutes: duration,
                scheduleStatus: form.status,
            });

            if (!doctorId) {
                const refresh = await getJson('doctors.php');
                const found = (refresh.doctors || []).find((d) => d.userId === storedUserId);
                if (found?.doctorId) {
                    setDoctorId(found.doctorId);
                }
            }

            setSaveMsg('Schedule saved!');
        } catch (error) {
            setSaveMsg(error?.message || 'Failed to save schedule.');
        }

        setSchedule((prev) => ({ ...prev, [form.day]: slots }));
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
                                    <FilterDropdown
                                        value={form.day}
                                        options={DAY_OPTIONS}
                                        onChange={(day) => setForm({ ...form, day })}
                                        ariaLabel="Select day of week"
                                        className="ds-dropdown"
                                    />
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
                                    <FilterDropdown
                                        value={form.status}
                                        options={STATUS_OPTIONS}
                                        onChange={(status) => setForm({ ...form, status })}
                                        ariaLabel="Select schedule status"
                                        className="ds-dropdown"
                                    />
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
