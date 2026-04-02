import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, User, Clock } from 'lucide-react';
import '../styles/pages/Home.css';

function Home() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div className="home-loading">
                <div className="home-loading-text">Loading...</div>
            </div>
        );
    }

    return (
        <div className="home-page">
            <nav className="home-nav">
                <div className="home-nav-inner">
                    <div className="home-nav-row">
                        <div className="home-brand">
                            <div className="home-brand-icon">H</div>
                            <h1 className="home-brand-title">Hospital Appointment Management</h1>
                        </div>
                        <div className="home-user-panel">
                            <div className="home-user-text">
                                <p className="home-user-name">{userName}</p>
                                <p className="home-user-role">{userRole}</p>
                            </div>
                            <button onClick={handleLogout} className="home-logout-btn">
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="home-main">
                <div className="home-welcome">
                    <h2 className="home-welcome-title">Welcome back, {userName.split(' ')[0]}!</h2>
                    <p className="home-welcome-subtitle">Manage your appointments and schedule with ease</p>
                </div>

                <div className="home-stats-grid">
                    <div className="home-stat-card">
                        <div className="home-stat-row">
                            <div className="home-stat-icon-teal">
                                <Calendar className="text-teal-600" size={24} />
                            </div>
                            <div>
                                <p className="home-stat-number">0</p>
                                <p className="home-stat-label">Total Appointments</p>
                            </div>
                        </div>
                    </div>

                    <div className="home-stat-card">
                        <div className="home-stat-row">
                            <div className="home-stat-icon-blue">
                                <Clock className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="home-stat-number">0</p>
                                <p className="home-stat-label">Upcoming</p>
                            </div>
                        </div>
                    </div>

                    <div className="home-stat-card">
                        <div className="home-stat-row">
                            <div className="home-stat-icon-green">
                                <User className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="home-stat-number">Active</p>
                                <p className="home-stat-label">Account Status</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="home-actions-card">
                    <h3 className="home-actions-title">Quick Actions</h3>
                    <div className="home-actions-grid">
                        {userRole === 'PATIENT' && (
                            <>
                                <button className="home-action-btn-primary">Book New Appointment</button>
                                <button className="home-action-btn-secondary">View Medical History</button>
                            </>
                        )}
                        {userRole === 'DOCTOR' && (
                            <>
                                <button className="home-action-btn-primary">View Schedule</button>
                                <button className="home-action-btn-secondary">Manage Patients</button>
                            </>
                        )}
                        {userRole === 'ADMIN' && (
                            <>
                                <button className="home-action-btn-primary">Manage Users</button>
                                <button className="home-action-btn-secondary">View Reports</button>
                            </>
                        )}
                    </div>
                </div>

                <div className="home-note">
                    <h4 className="home-note-title">Protected Route Active</h4>
                    <p className="home-note-text">
                        This page is only accessible to authenticated users. Try logging out and accessing /home directly in the URL - you will be redirected to the login page.
                    </p>
                </div>
            </main>
        </div>
    );
}

export default Home;
