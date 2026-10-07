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
                minHeight: '100vh',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                textAlign: 'center',
                padding: '24px',
                background: 'var(--bg-app)'
            }}>
                <div style={{
                    background: '#FFFFFF',
                    padding: '40px 32px',
                    borderRadius: 'var(--radius-xl, 24px)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-subtle)',
                    maxWidth: '440px',
                    width: '100%'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: 'var(--radius-full)',
                        background: '#FEE2E2',
                        color: '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        margin: '0 auto 18px'
                    }}>
                        🚫
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                        Access Restricted
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
                        Your role (<strong>{user.role || 'Staff'}</strong>) is not authorized to access this module.
                    </p>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        style={{
                            background: 'var(--primary)',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '12px 28px',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px var(--primary-shadow)',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;