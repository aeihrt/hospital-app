import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Building2 } from 'lucide-react';
import '../styles/pages/DoctorProfile.css';
import AppLayout from '../components/AppLayout';
import { getJson, postJson } from '../utils/api';

const DEFAULT_PROFILE = {
    fullName: 'Dr. Michael Jones',
    specialty: 'Cardiology',
    yearsOfExperience: '15+ years',
    email: 'michael@hospital.com',
    phone: '09181234567',
    address: '123 Medical Plaza, West Wing, Suite 402, Metro City',
};

function DoctorProfile() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(DEFAULT_PROFILE);
    const [formData, setFormData] = useState(DEFAULT_PROFILE);
    const [doctorId, setDoctorId] = useState('');
    const [saveMsg, setSaveMsg] = useState('');

    const [settings, setSettings] = useState({
        emailNotification: true,
    });

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) { navigate('/login'); return; }
        const name = localStorage.getItem('user_name') || 'Doctor';
        setUserName(name);
        // load doctor data from backend
        (async () => {
            try {
                const res = await getJson('doctors.php');
                const found = (res.doctors || []).find((d) => d.userId === userId);
                if (found) {
                    const loaded = {
                        fullName: found.name || DEFAULT_PROFILE.fullName,
                        specialty: found.specialty || DEFAULT_PROFILE.specialty,
                        yearsOfExperience: DEFAULT_PROFILE.yearsOfExperience,
                        email: found.email || DEFAULT_PROFILE.email,
                        phone: found.phone || DEFAULT_PROFILE.phone,
                        address: DEFAULT_PROFILE.address,
                    };

                    setProfile(loaded);
                    setFormData(loaded);
                    setDoctorId(found.doctorId || '');
                }
            } catch (err) {
                // ignore and keep defaults
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

    const handleSave = async (e) => {
        e.preventDefault();
        setSaveMsg('');
        try {
            const payload = {
                doctorId: doctorId || undefined,
                name: formData.fullName,
                department: formData.specialty,
                room: '',
                phone: formData.phone,
                email: formData.email,
                status: 'Active',
            };
            const res = await postJson('doctors.php', payload);
            if (res.success) {
                setProfile(formData);
                setDoctorId(res.doctor?.doctorId || doctorId);
                setSaveMsg('Changes saved!');
            } else {
                setSaveMsg('Save failed');
            }
        } catch (err) {
            setSaveMsg('Save failed');
        }
        setTimeout(() => setSaveMsg(''), 2500);
    };

    const initials = profile.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('');

    if (loading) return <div className="dp-loading"><span>Loading...</span></div>;

    return (
        <AppLayout activePage="doctor-profile" title="My Profile" userName={userName} onLogout={handleLogout}>
            <main className="dp-main">
                <h1 className="dp-title">My Profile</h1>

                <div className="dp-grid">
                    {/* Left — Profile card */}
                    <aside className="dp-profile-card">
                        <div className="dp-avatar-wrap">
                            <div className="dp-avatar">{initials}</div>
                        </div>
                        <h2 className="dp-card-name">{profile.fullName}</h2>
                        <p className="dp-card-role">Senior {profile.specialty}ist</p>
                        <div className="dp-badges">
                            <span className="dp-badge dp-badge-verified"><ShieldCheck size={13} /> Verified Professional</span>
                            <span className="dp-badge dp-badge-dept"><Building2 size={13} /> {profile.specialty} Department</span>
                        </div>
                        <div className="dp-info-list">
                            <div className="dp-info-item">
                                <span className="dp-info-label">SPECIALTY</span>
                                <span className="dp-info-val">{profile.specialty}</span>
                            </div>
                            <div className="dp-info-item">
                                <span className="dp-info-label">YEARS OF EXPERIENCE</span>
                                <span className="dp-info-val">{profile.yearsOfExperience}</span>
                            </div>
                            <div className="dp-info-section-label">Personal Information</div>
                            <div className="dp-info-item">
                                <span className="dp-info-label">EMAIL ADDRESS</span>
                                <span className="dp-info-val">{profile.email}</span>
                            </div>
                            <div className="dp-info-item">
                                <span className="dp-info-label">PHONE NUMBER</span>
                                <span className="dp-info-val">{profile.phone}</span>
                            </div>
                            <div className="dp-info-item">
                                <span className="dp-info-label">ADDRESS</span>
                                <span className="dp-info-val">{profile.address}</span>
                            </div>
                        </div>
                    </aside>

                    {/* Right — Edit form + Account settings */}
                    <div className="dp-right-col">
                        <section className="dp-edit-card">
                            <div className="dp-edit-header">
                                <h3 className="dp-edit-title">Edit Profile</h3>
                                <button type="submit" form="profile-form" className="dp-save-btn">
                                    {saveMsg || 'Save Changes'}
                                </button>
                            </div>
                            <form id="profile-form" className="dp-form" onSubmit={handleSave}>
                                <div className="dp-field">
                                    <label className="dp-field-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="dp-input"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                                <div className="dp-field-row">
                                    <div className="dp-field">
                                        <label className="dp-field-label">Specialty</label>
                                        <input
                                            type="text"
                                            className="dp-input"
                                            value={formData.specialty}
                                            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                        />
                                    </div>
                                    <div className="dp-field">
                                        <label className="dp-field-label">Years of Experience</label>
                                        <input
                                            type="text"
                                            className="dp-input"
                                            value={formData.yearsOfExperience}
                                            onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="dp-field-row">
                                    <div className="dp-field">
                                        <label className="dp-field-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="dp-input"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="dp-field">
                                        <label className="dp-field-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="dp-input"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="dp-field">
                                    <label className="dp-field-label">Address</label>
                                    <input
                                        type="text"
                                        className="dp-input"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </form>
                        </section>

                        <section className="dp-settings-card">
                            <h3 className="dp-settings-title">Account Settings</h3>
                            <div className="dp-settings-grid">
                                <div className="dp-settings-row">
                                    <span className="dp-settings-label">Change Password</span>
                                    <button type="button" className="dp-settings-arrow">›</button>
                                </div>
                                <div className="dp-settings-row">
                                    <span className="dp-settings-label">Email Notification</span>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={settings.emailNotification}
                                        className={`dp-toggle${settings.emailNotification ? ' dp-toggle-on' : ''}`}
                                        onClick={() => setSettings((s) => ({ ...s, emailNotification: !s.emailNotification }))}
                                    >
                                        <span className="dp-toggle-thumb" />
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}

export default DoctorProfile;
