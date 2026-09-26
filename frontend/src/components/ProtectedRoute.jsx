import { Navigate, useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();

    if (!token) return <Navigate to="/login" replace />;

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
                padding: '20px',
                background: '#f8fafc'
            }}>
                <h2 style={{ fontSize: '1.8rem', color: '#1e293b', marginBottom: '8px' }}>🚫 Access Denied</h2>
                <p style={{ color: '#64748b', maxWidth: '420px', marginBottom: '20px' }}>
                    Your account role (<strong>{user.role || 'Staff'}</strong>) does not have permission to view this module.
                </p>
                <button 
                    onClick={() => navigate('/dashboard')}
                    style={{
                        background: '#1a2d42',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 22px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        cursor: 'pointer'
                    }}
                >
                    &larr; Back to Dashboard
                </button>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;