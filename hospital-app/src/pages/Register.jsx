import { useState } from 'react';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/pages/Register.css';
import { validatePassword } from '../utils/validation';
import { postJson } from '../utils/api';
import appLogo from '../assets/app-logo.png';

function Register() {
    const navigate = useNavigate();
    const [role, setRole] = useState('PATIENT');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        dateOfBirth: '',
        specialization: '',
    });
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors([]);
        setSuccessMessage('');

        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            setErrors(passwordValidation.errors);
            return;
        }

        if (!formData.fullName || !formData.email || !formData.phone) {
            setErrors(['Please fill in all required fields']);
            return;
        }

        if (role === 'PATIENT' && !formData.dateOfBirth) {
            setErrors(['Date of birth is required for patients']);
            return;
        }

        if (role === 'DOCTOR' && !formData.specialization) {
            setErrors(['Specialization is required for doctors']);
            return;
        }

    setLoading(true);

        try {
            await postJson('register.php', {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                role,
                dateOfBirth: formData.dateOfBirth,
                specialization: formData.specialization,
            });

            setSuccessMessage('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            setErrors([error?.message || 'An error occurred during registration']);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-left">
                <div className="register-brand">
                    <div className="register-icon-wrap">
                        <img src={appLogo} alt="App Logo" className="register-app-logo" />
                    </div>
                    <h1 className="register-title">Doclick</h1>
                </div>
            </div>

            <div className="register-right">
                <div className="register-form-wrap">
                    <div className="register-card">
                        <h2 className="register-heading">Register</h2>
                        <p className="register-subheading">Create your account</p>

                        <div className="register-role-group">
                            <button
                                type="button"
                                onClick={() => setRole('ADMIN')}
                                className={`register-role-btn ${
                                    role === 'ADMIN' ? 'register-role-btn-active' : 'register-role-btn-inactive'
                                }`}
                            >
                                Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('PATIENT')}
                                className={`register-role-btn ${
                                    role === 'PATIENT' ? 'register-role-btn-active' : 'register-role-btn-inactive'
                                }`}
                            >
                                Patient
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('DOCTOR')}
                                className={`register-role-btn ${
                                    role === 'DOCTOR' ? 'register-role-btn-active' : 'register-role-btn-inactive'
                                }`}
                            >
                                Doctor
                            </button>
                        </div>

                        {successMessage && <div className="register-success">{successMessage}</div>}

                        {errors.length > 0 && (
                            <div className="register-error">
                                <ul className="register-error-list">
                                    {errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="register-form">
                            <div>
                                <label className="register-field-label">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="John Doe"
                                    className="register-input"
                                />
                            </div>

                            <div>
                                <label className="register-field-label">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="name@example.com"
                                    className="register-input"
                                />
                            </div>

                            <div>
                                <label className="register-field-label">Password</label>
                                <div className="register-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••••"
                                        className="register-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="register-password-toggle"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="register-field-label">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+1234567890"
                                    className="register-input"
                                />
                            </div>

                            {role === 'PATIENT' && (
                                <div>
                                    <label className="register-field-label">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                        className="register-input"
                                    />
                                </div>
                            )}

                            {role === 'DOCTOR' && (
                                <div>
                                    <label className="register-field-label">Specialization</label>
                                    <input
                                        type="text"
                                        value={formData.specialization}
                                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                        placeholder="Cardiology, Neurology, etc."
                                        className="register-input"
                                    />
                                </div>
                            )}

                            <button type="submit" disabled={loading} className="register-submit-btn">
                                {loading ? 'Registering...' : 'Register'}
                            </button>

                            <p className="register-login-row">
                                Already have an account?{' '}
                                <Link to="/login" className="register-login-link">
                                    Login here
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
