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

    // Menu sections with categorized items
    const menuSections = [
        {
            title: 'GENERAL',
            items: [
                { 
                    name: 'Dashboard', 
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                            <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                            <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                            <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                        </svg>
                    ), 
                    path: idPrefix ? `/${idPrefix}/dashboard` : '/dashboard', 
                    roles: ['Admin', 'Supervisor', 'Operator', 'Rigger'] 
                },
                { 
                    name: 'Attendance', 
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    ), 
                    path: idPrefix ? `/${idPrefix}/attendance` : '/attendance', 
                    roles: ['Admin', 'Supervisor', 'Operator', 'Rigger'] 
                },
            ]
        },
        {
            title: 'FLEET & WORKFORCE',
            items: [
                { 
                    name: 'Cranes', 
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 18h12M6 14h12M10 10V4h4v6M4 21h16a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1z"></path>
                        </svg>
                    ), 
                    path: '/cranes', 
                    roles: ['Admin', 'Supervisor'] 
                },
                { 
                    name: 'Operators', 
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    ), 
                    path: '/operators', 
                    roles: ['Admin', 'Supervisor'] 
                },
                // { 
                //     name: 'Supervisors', 
                //     icon: (
                //         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                //             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                //             <circle cx="12" cy="7" r="4"></circle>
                //         </svg>
                //     ), 
                //     path: '/supervisors', 
                //     roles: ['Admin'] 
                // },
                { 
                    name: 'Riggers', 
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                            <path d="M2 17l10 5 10-5"></path>
                            <path d="M2 12l10 5 10-5"></path>
                        </svg>
                    ), 
                    path: '/riggers', 
                    roles: ['Admin', 'Supervisor'] 
                },
            ]
        },
        {
            title: 'OPERATIONS',
            items: [
                { 
                    name: 'Sites', 
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    ), 
                    path: '/sites', 
                    roles: ['Admin', 'Supervisor'] 
                },
                { 
                    name: 'Assignments', 
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                    ), 
                    path: '/assignments', 
                    roles: ['Admin', 'Supervisor'] 
                },
                { 
                    name: 'Logbook', 
                    icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    ), 
                    path: idPrefix ? `/${idPrefix}/logbook` : '/logbook', 
                    roles: ['Admin', 'Supervisor', 'Operator'] 
                },
                // { 
                //     name: 'Clients', 
                //     icon: (
                //         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                //             <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                //             <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                //         </svg>
                //     ), 
                //     path: '/clients', 
                //     roles: ['Admin'] 
                // },
                // { 
                //     name: 'Reports', 
                //     icon: (
                //         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                //             <line x1="18" y1="20" x2="18" y2="10"></line>
                //             <line x1="12" y1="20" x2="12" y2="4"></line>
                //             <line x1="6" y1="20" x2="6" y2="14"></line>
                //         </svg>
                //     ), 
                //     path: '/reports', 
                //     roles: ['Admin', 'Supervisor'] 
                // },
            ]
        }
    ];

    const closeMobileSidebar = () => {
        setMobileOpen(false);
    };

    const displayTitle = idPrefix 
        ? `${user?.name || user?.user_id} (${idPrefix})` 
        : (user?.name ? `${user.name} (${currentRole})` : currentRole);

    return (
        <>
            {/* Mobile Header Bar */}
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
                    <div className="brand-badge-small">
                        <span>JX</span>
                    </div>
                    <div>
                        <h3>Jainex</h3>
                        <span>{idPrefix || currentRole}</span>
                    </div>
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

            {/* Main Sidebar (Light, sleek, barbara-inspired design) */}
            <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
                {/* Brand Header */}
                <div className="sidebar-brand">
                    <div className="brand-logo-wrap">
                        <div className="brand-icon-badge">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="6" cy="6" r="3"></circle>
                                <circle cx="6" cy="18" r="3"></circle>
                                <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                                <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                                <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                            </svg>
                        </div>
                        <div className="brand-text">
                            <span className="brand-title">jainex</span>
                            <span className="brand-subtitle">Heavy Fleet & Crew</span>
                        </div>
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

                {/* Navigation Links Grouped by Sections */}
                <nav className="sidebar-nav">
                    {menuSections.map((section, sIndex) => {
                        const visibleItems = section.items.filter(item => 
                            !item.roles || item.roles.includes(currentRole)
                        );
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={sIndex} className="nav-section">
                                <div className="nav-section-title">{section.title}</div>
                                {visibleItems.map((item, index) => (
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
                            </div>
                        );
                    })}
                </nav>

                {/* User Profile Footer Pill */}
                <div className="sidebar-footer">
                    <div className="user-profile-pill">
                        <div className="user-avatar-badge">
                            {user?.name ? user.name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="user-info">
                            <span className="user-name" title={user?.name || user?.user_id}>
                                {user?.name || user?.user_id || 'User'}
                            </span>
                            <span className="user-role">
                                {idPrefix || user?.designation || currentRole}
                            </span>
                        </div>
                        <button 
                            className="btn-user-logout" 
                            title="Sign out"
                            onClick={() => { closeMobileSidebar(); logout(); }}
                            aria-label="Sign out"
                        >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;