import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/pages/Landing.css';
import appLogo from '../assets/app-logo.png';

function Landing() {
    return (
        <div className="landing-page">
            <div className="landing-left">
                <div className="landing-brand">
                    <div className="landing-icon-wrap">
                        <img src={appLogo} alt="App Logo" className="landing-app-logo" />
                    </div>
                    <h1 className="landing-title">Doclick</h1>
                </div>
            </div>

            <div className="landing-right">
                <div className="landing-form-wrap">
                    <div className="landing-card">
                        <div className="landing-top-image-wrap">
                            <img
                                src="/medicine.png"
                                alt="Medicine"
                                className="landing-top-image"
                            />
                        </div>

                        <h2 className="landing-heading">Welcome!</h2>
                        <p className="landing-subheading">Manage hospital appointments with ease</p>

                        <div className="landing-actions">
                            <Link to="/login" className="landing-primary-btn">
                                Login
                            </Link>
                            <Link to="/register" className="landing-secondary-btn">
                                Register
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Landing;
