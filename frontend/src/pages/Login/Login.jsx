import { useState, useContext } from 'react';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({ user_id: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await API.post('/auth/login', formData);
            login(res.data.user, res.data.token);
        } catch (err) {
            alert(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                {/* Header Section */}
                <div className="header-section">
                    <div className="header-text">
                        <h1 className="company-name">JAINEX</h1>
                        <p className="portal-subtext">Fleet & Workforce Management Portal</p>
                    </div>
                </div>

                <h2 className="form-title">Portal Login</h2>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label>User ID / Employee Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Admin or your Name (e.g. Jintu)"
                            value={formData.user_id}
                            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Password / Date of Birth</label>
                        <input
                            type="password"
                            placeholder="Password (DOB for Operators & Riggers)"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? "Authenticating..." : "Login to Portal"}
                    </button>
                </form>

                {/* Info Box */}
                <div className="demo-box">
                    <p className="demo-title">Role-Based Login Guidance</p>
                    <p>
                        <strong>Operators & Riggers:</strong> Enter your <strong>Name</strong> (or First Name) as User ID, and your <strong>Date of Birth (DOB)</strong> as Password (e.g., <code>YYYY-MM-DD</code> or <code>DD-MM-YYYY</code>).
                    </p>
                    <p style={{ marginTop: '6px' }}>
                        <strong>Administrators:</strong> Enter your system admin credentials.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;