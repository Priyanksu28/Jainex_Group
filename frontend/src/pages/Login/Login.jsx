import { useState, useContext } from 'react';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({ user_id: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);
        try {
            const res = await API.post('/auth/login', formData);
            login(res.data.user, res.data.token);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        alert("To reset or recover your password, please contact the Jainex System Administrator.");
    };

    return (
        <div className="login-page-container">
            <div className="login-card-panel">
                {/* Top Logo Container (Jainex Lift with Scissors Icon) */}
                <div className="login-logo-wrapper">
                    <div className="login-logo-badge">
                        <div className="dummy-logo-layout">
                            <div className="dummy-logo-symbol">
                                <div className="brand-scissors-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="6" cy="6" r="3"></circle>
                                        <circle cx="6" cy="18" r="3"></circle>
                                        <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                                        <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                                        <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                                    </svg>
                                </div>
                            </div>
                            <div className="dummy-logo-text-group">
                                <div className="dummy-logo-main">
                                    <span className="dummy-logo-name">Jainex</span>
                                    <span className="dummy-logo-highlight">Lift</span>
                                </div>
                                <span className="dummy-logo-tagline">Heavy Fleet & Workforce</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Welcome Heading */}
                <div className="login-heading-section">
                    <h1 className="login-welcome-title">
                        Welcome
                    </h1>
                    <p className="login-welcome-subtitle">Sign in to access your dashboard</p>
                </div>

                {/* Error Banner if any */}
                {errorMsg && (
                    <div className="login-error-alert" role="alert">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="login-form-body">
                    <div className="login-field-group">
                        <label htmlFor="user_id" className="login-field-label">Username</label>
                        <div className="login-input-wrapper">
                            <input
                                id="user_id"
                                name="user_id"
                                type="text"
                                className="login-input-control"
                                placeholder="Enter your Username"
                                value={formData.user_id}
                                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                required
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="login-field-group">
                        <label htmlFor="password" className="login-field-label">Password</label>
                        <div className="login-input-wrapper password-input-wrap">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                className="login-input-control"
                                placeholder="••••••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-visibility-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* <div className="login-forgot-wrap">
                        <a href="#forgot" onClick={handleForgotPassword} className="login-forgot-link">
                            Forgot Password?
                        </a>
                    </div> */}

                    <button type="submit" className="login-submit-btn" disabled={loading}>
                        {loading ? "Signing in..." : "Login"}
                    </button>
                </form>

                {/* Subtle Quick Guide for field crew & admin */}
                {/* <div className="login-help-footer">
                    <div className="login-help-header">
                        <span className="help-icon">ℹ️</span>
                        <span>Need sign-in assistance?</span>
                    </div>
                    <p className="help-text">
                        <strong>Crew (Operators & Riggers):</strong> Username is your <strong>Name</strong> & Password is your <strong>DOB</strong>.
                    </p>
                </div> */}
            </div>
        </div>
    );
};

export default Login;