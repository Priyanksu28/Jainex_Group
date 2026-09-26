import { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);
    const [mobileOpen, setMobileOpen] = useState(false);

    const currentRole = user?.role || 'User';

    // Compute employee ID prefix if Operator or Rigger
    const idPrefix = user?.emp_id
        ? (user.role === 'Operator' 
            ? `OP-${String(user.emp_id).padStart(3, '0')}` 
            : user.role === 'Rigger' 
            ? `RIG-${String(user.emp_id).padStart(3, '0')}` 
            : '')
        : '';

    // Menu items with their corresponding routes
    const allMenuItems = [
        { 
            name: 'Dashboard', 
            icon: '📊', 
            path: idPrefix ? `/${idPrefix}/dashboard` : '/dashboard', 
            roles: ['Admin', 'Supervisor', 'Operator', 'Rigger'] 
        },
        { 
            name: 'Attendance', 
            icon: '📋', 
            path: idPrefix ? `/${idPrefix}/attendance` : '/attendance', 
            roles: ['Admin', 'Supervisor', 'Operator', 'Rigger'] 
        },
        { name: 'Cranes', icon: '🏗️', path: '/cranes', roles: ['Admin', 'Supervisor'] },
        { name: 'Operators', icon: '👷', path: '/operators', roles: ['Admin', 'Supervisor'] },
        { name: 'Supervisors', icon: '👔', path: '/supervisors', roles: ['Admin'] },
        { name: 'Riggers', icon: '🪢', path: '/riggers', roles: ['Admin', 'Supervisor'] },
        { name: 'Sites', icon: '📍', path: '/sites', roles: ['Admin', 'Supervisor'] },
        { name: 'Assignments', icon: '🔗', path: '/assignments', roles: ['Admin', 'Supervisor'] },
        { name: 'Clients', icon: '🏢', path: '/clients', roles: ['Admin'] },
        { name: 'Logbooks', icon: '📖', path: '/logbooks', roles: ['Admin', 'Supervisor', 'Operator'] },
        { name: 'Reports', icon: '📈', path: '/reports', roles: ['Admin', 'Supervisor'] },
    ];

    // Filter items based on active role
    const visibleMenuItems = allMenuItems.filter(item => 
        !item.roles || item.roles.includes(currentRole)
    );

    const closeMobileSidebar = () => {
        setMobileOpen(false);
    };

    const displayTitle = idPrefix 
        ? `${user?.name || user?.user_id} (${idPrefix})` 
        : (user?.name ? `${user.name} (${currentRole})` : currentRole);

    return (
        <>
            {/* Mobile Header Bar (Visible on mobile/tablets <= 900px) */}
            <div className="mobile-header-bar">
                <button 
                    type="button" 
                    className="mobile-menu-toggle" 
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle navigation menu"
                >
                    {mobileOpen ? '✕' : '☰'}
                </button>
                <div className="mobile-brand-title">
                    <h3>JAINEX</h3>
                    <span>{idPrefix || user?.name || currentRole}</span>
                </div>
            </div>

            {/* Mobile Backdrop Overlay */}
            {mobileOpen && (
                <div 
                    className="sidebar-backdrop" 
                    onClick={closeMobileSidebar}
                    aria-hidden="true"
                />
            )}

            {/* Main Sidebar (Drawer on mobile, fixed on desktop) */}
            <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="brand-text">
                        <h3>JAINEX</h3>
                        <p title={displayTitle}>{displayTitle}</p>
                    </div>
                    <button 
                        type="button" 
                        className="sidebar-close-btn" 
                        onClick={closeMobileSidebar}
                        aria-label="Close menu"
                    >
                        ✕
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {visibleMenuItems.map((item, index) => (
                        <NavLink 
                            key={index} 
                            to={item.path} 
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={closeMobileSidebar}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.name}</span>
                        </NavLink>
                    ))}
                    
                    <div className="nav-item logout" onClick={() => { closeMobileSidebar(); logout(); }}>
                        <span className="nav-icon">🚪</span>
                        <span className="nav-label">Logout</span>
                    </div>
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;