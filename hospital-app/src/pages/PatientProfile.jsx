import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/PatientProfile.css';
import AppLayout from '../components/AppLayout';
import { getJson, postJson } from '../utils/api';

const DEFAULT_PROFILE = {
    fullName: 'Maria Reyes',
    email: 'maria@email.com',
    dateOfBirth: '',
    sex: '',
    phone: '09171234567',
    address: '',
    emergencyPhone: '',
};

function PatientProfile() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(DEFAULT_PROFILE);
    const [formData, setFormData] = useState(DEFAULT_PROFILE);
    const [saveMsg, setSaveMsg] = useState('');
    const [saveError, setSaveError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        emailNotification: true,
        twoFactor: false,
    });

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) { navigate('/login'); return; }
        const name = localStorage.getItem('user_name') || 'Patient';
        setUserName(name);

        setUserId(userId);

        const loadProfile = async () => {
            try {
                const result = await getJson(`patient_profile.php?userId=${encodeURIComponent(userId)}`);
                const nextProfile = {
                    fullName: result.profile?.fullName || name,
                    email: result.profile?.email || '',
                    dateOfBirth: result.profile?.dateOfBirth || '',
                    sex: result.profile?.sex || '',
                    phone: result.profile?.phone || '',
                    address: result.profile?.address || '',
                    emergencyPhone: result.profile?.emergencyPhone || '',
                };
                setProfile(nextProfile);
                setFormData(nextProfile);
            } catch (error) {
                console.error('Error loading patient profile:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        navigate('/login');
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaveError('');

        const saveProfile = async () => {
            try {
                setIsSaving(true);
                const result = await postJson('patient_profile.php', {
                    userId,
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    dateOfBirth: formData.dateOfBirth,
                    sex: formData.sex,
                    address: formData.address,
                    emergencyPhone: formData.emergencyPhone,
                });

                setProfile(result.profile || formData);
                setSaveMsg('Changes saved!');
                setTimeout(() => setSaveMsg(''), 2500);
            } catch (error) {
                setSaveError(error?.message || 'Failed to save profile.');
            } finally {
                setIsSaving(false);
            }
        };

        saveProfile();
    };

    const initials = profile.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('');

    if (loading) return <div className="pp-loading"><span>Loading...</span></div>;

    return (
        <AppLayout activePage="patient-profile" title="My Profile" userName={userName} onLogout={handleLogout}>
            <main className="pp-main">
                <h1 className="pp-title">My Profile</h1>

                <div className="pp-grid">
                    {/* Left — Profile card */}
                    <aside className="pp-profile-card">
                        <div className="pp-avatar-wrap">
                            <div className="pp-avatar">{initials}</div>
                        </div>
                        <h2 className="pp-card-name">{profile.fullName}</h2>
                        <p className="pp-card-email">{profile.email}</p>
                        <div className="pp-patient-badge-wrap">
                            <span className="pp-patient-badge">Patient</span>
                        </div>
                        <div className="pp-info-list">
                            <div className="pp-info-item">
                                <span className="pp-info-label">DATE OF BIRTH</span>
                                <span className="pp-info-val">{profile.dateOfBirth}</span>
                            </div>
                            <div className="pp-info-item">
                                <span className="pp-info-label">SEX</span>
                                <span className="pp-info-val">{profile.sex}</span>
                            </div>
                            <div className="pp-info-item">
                                <span className="pp-info-label">ADDRESS</span>
                                <span className="pp-info-val">{profile.address}</span>
                            </div>
                            <div className="pp-info-item">
                                <span className="pp-info-label">PHONE</span>
                                <span className="pp-info-val">{profile.phone}</span>
                            </div>
                            <div className="pp-info-item">
                                <span className="pp-info-label">EMERGENCY CONTACT NUMBER</span>
                                <span className="pp-info-val">{profile.emergencyPhone}</span>
                            </div>
                        </div>
                    </aside>

                    {/* Right — Edit form + Account settings */}
                    <div className="pp-right-col">
                        <section className="pp-edit-card">
                            <div className="pp-edit-header">
                                <h3 className="pp-edit-title">Edit Profile</h3>
                                <button type="submit" form="patient-profile-form" className="pp-save-btn" disabled={isSaving}>
                                    {saveMsg || (isSaving ? 'Saving...' : 'Save Changes')}
                                </button>
                            </div>
                            {saveError && <p className="pp-save-error">{saveError}</p>}
                            <form id="patient-profile-form" className="pp-form" onSubmit={handleSave}>
                                <div className="pp-field">
                                    <label className="pp-field-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="pp-input"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                                <div className="pp-field-row">
                                    <div className="pp-field">
                                        <label className="pp-field-label">Date of Birth</label>
                                        <input
                                            type="date"
                                            className="pp-input"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                        />
                                    </div>
                                    <div className="pp-field">
                                        <label className="pp-field-label">Sex</label>
                                        <input
                                            type="text"
                                            className="pp-input"
                                            value={formData.sex}
                                            onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="pp-field-row">
                                    <div className="pp-field">
                                        <label className="pp-field-label">Phone</label>
                                        <input
                                            type="tel"
                                            className="pp-input"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="pp-field">
                                        <label className="pp-field-label">Email</label>
                                        <input
                                            type="email"
                                            className="pp-input"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="pp-field">
                                    <label className="pp-field-label">Emergency Contact Number</label>
                                    <input
                                        type="tel"
                                        className="pp-input"
                                        value={formData.emergencyPhone}
                                        onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                                    />
                                </div>
                                <div className="pp-field">
                                    <label className="pp-field-label">Address</label>
                                    <input
                                        type="text"
                                        className="pp-input"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </form>
                        </section>

                        <section className="pp-settings-card">
                            <h3 className="pp-settings-title">Account Settings</h3>
                            <div className="pp-settings-grid">
                                <div className="pp-settings-row">
                                    <span className="pp-settings-label">Change Password</span>
                                    <button type="button" className="pp-settings-arrow">›</button>
                                </div>
                                <div className="pp-settings-row">
                                    <span className="pp-settings-label">Email Notification</span>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={settings.emailNotification}
                                        className={`pp-toggle${settings.emailNotification ? ' pp-toggle-on' : ''}`}
                                        onClick={() => setSettings((s) => ({ ...s, emailNotification: !s.emailNotification }))}
                                    >
                                        <span className="pp-toggle-thumb" />
                                    </button>
                                </div>
                                <div className="pp-settings-row">
                                    <span className="pp-settings-label">Two-Factor Authentication</span>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={settings.twoFactor}
                                        className={`pp-toggle${settings.twoFactor ? ' pp-toggle-on' : ''}`}
                                        onClick={() => setSettings((s) => ({ ...s, twoFactor: !s.twoFactor }))}
                                    >
                                        <span className="pp-toggle-thumb" />
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

export default PatientProfile;
