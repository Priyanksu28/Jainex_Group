import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/axios';
import './Dashboard.css';
import Sidebar from '../../components/Sidebar/Sidebar';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [marking, setMarking] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const isStaff = user?.role === 'Operator' || user?.role === 'Rigger';
    const idPrefix = user?.emp_id
        ? (user.role === 'Operator' 
            ? `OP-${String(user.emp_id).padStart(3, '0')}` 
            : user.role === 'Rigger' 
            ? `RIG-${String(user.emp_id).padStart(3, '0')}` 
            : '')
        : '';

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await API.get('/attendance/dashboard-stats');
            setStats(res.data);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const handleQuickPunch = async (statusType = 'Present') => {
        setMarking(true);
        try {
            await API.post('/attendance/mark', { status: statusType });
            alert(`Attendance successfully marked as ${statusType} for today!`);
            fetchDashboardData();
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data?.error || "Error marking attendance");
        } finally {
            setMarking(false);
        }
    };

    const todayDateStr = new Date().toLocaleDateString('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    const activeEmployeesCount = stats?.overall?.total_active_employees || (stats?.monthlyStats?.total_records || 34);
    const presentTodayCount = stats?.overall?.present || stats?.monthlyStats?.present_days || 28;
    const leaveCount = stats?.overall?.leave || stats?.monthlyStats?.leave_days || 3;
    const attendancePercentage = activeEmployeesCount > 0 
        ? Math.round((presentTodayCount / activeEmployeesCount) * 100) 
        : 88;

    return (
        <div className="dashboard-wrapper">
            <Sidebar />

            <main className="main-content">
                {/* --- Top Navbar Header (Search & Actions) --- */}
                <header className="dashboard-topbar">
                    <div className="topbar-search">
                        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input 
                            type="text" 
                            placeholder="Search fleet, site, operator..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="topbar-actions">
                        {/* <div className="topbar-pill-dropdown">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            </svg>
                            <span>Jainex Central HQ</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>

                        <div className="topbar-pill-dropdown">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                            </svg>
                            <span>Today</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>

                        <button className="topbar-icon-btn" title="Calendar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </button> */}

                        <button 
                            className="btn-topbar-primary"
                            onClick={() => isStaff 
                                ? navigate(idPrefix ? `/${idPrefix}/attendance` : '/attendance')
                                : navigate('/assignments')
                            }
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>{isStaff ? 'Mark Attendance' : 'New Deployment'}</span>
                        </button>
                    </div>
                </header>

                {/* --- Page Heading Title --- */}
                <div className="dashboard-title-row">
                    <h2>Dashboard</h2>
                </div>

                {/* --- Hero 4-Column KPI Stats Grid --- */}
                <div className="kpi-grid">
                    {/* Primary Hero Blue Card */}
                    <div className="kpi-card kpi-card-blue">
                        <div className="kpi-card-head">
                            <div className="kpi-icon-wrap">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <span className="kpi-title">{isStaff ? 'Logged Days' : 'Active Workforce'}</span>
                        </div>
                        <div className="kpi-body">
                            <span className="kpi-main-number">
                                {isStaff ? (stats?.monthlyStats?.present_days || 0) : activeEmployeesCount}
                            </span>
                            <span className="kpi-badge-white">+4.2%</span>
                        </div>
                        <div className="kpi-footer-text">
                            {isStaff ? 'Days present this month' : 'Active workforce on site'}
                        </div>
                    </div>

                    {/* KPI Card 2: Today's Attendance / Present */}
                    <div className="kpi-card">
                        <div className="kpi-card-head">
                            <div className="kpi-icon-wrap text-muted">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            </div>
                            <span className="kpi-title">Today's Present</span>
                        </div>
                        <div className="kpi-body">
                            <span className="kpi-main-number">{presentTodayCount}</span>
                            <span className="kpi-badge-green">+4.2%</span>
                        </div>
                        <div className="kpi-footer-text text-muted">
                            {stats?.overall?.attendance_marked ? `${stats.overall.attendance_marked} marked today` : 'On active duty'}
                        </div>
                    </div>

                    {/* KPI Card 3: Fleet & Sites Metric */}
                    <div className="kpi-card">
                        <div className="kpi-card-head">
                            <div className="kpi-icon-wrap text-muted">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 18h12M6 14h12M10 10V4h4v6M4 21h16a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1z"></path>
                                </svg>
                            </div>
                            <span className="kpi-title">{isStaff ? 'Total Records' : 'Active Cranes'}</span>
                        </div>
                        <div className="kpi-body">
                            <span className="kpi-main-number">
                                {isStaff ? (stats?.monthlyStats?.total_records || 0) : '24'}
                            </span>
                            <span className="kpi-badge-green">+3% Increase</span>
                        </div>
                        <div className="kpi-footer-text text-muted">
                            {isStaff ? 'Monthly logs updated' : 'Deployed across client sites'}
                        </div>
                    </div>

                    {/* KPI Card 4: Quick Action Tile */}
                    <div 
                        className="kpi-card kpi-card-action" 
                        onClick={() => isStaff ? handleQuickPunch('Present') : navigate('/assignments')}
                    >
                        <div className="action-tile-btn">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </div>
                        <span className="action-tile-label">
                            {isStaff ? 'Quick Check-in' : 'Deploy Resource'}
                        </span>
                    </div>
                </div>

                {/* --- Staff Today's Status Banner (if operator/rigger) --- */}
                {isStaff && (
                    <div className="staff-punch-card">
                        <div className="staff-info-compact">
                            <div className="staff-avatar-circle">
                                {user?.name ? user.name[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h3>{user?.name || user?.user_id}</h3>
                                <p>{idPrefix ? `${idPrefix} • ` : ''}{user?.designation || user?.role} {user?.unit_name ? `(${user.unit_name})` : ''}</p>
                            </div>
                        </div>

                        <div className="staff-punch-controls">
                            {stats?.todayRecord ? (
                                <div className="punch-status-badge">
                                    <span className={`pill-badge status-${stats.todayRecord.status.toLowerCase().replace(' ', '-')}`}>
                                        ✓ {stats.todayRecord.status}
                                    </span>
                                    <span className="punch-time-label">
                                        Time: {stats.todayRecord.check_in_time || 'Recorded'}
                                    </span>
                                </div>
                            ) : (
                                <div className="punch-actions-row">
                                    <button 
                                        className="btn-punch-primary"
                                        onClick={() => handleQuickPunch('Present')}
                                        disabled={marking}
                                    >
                                        {marking ? 'Saving...' : '✓ Punch Present'}
                                    </button>
                                    <button 
                                        className="btn-punch-secondary"
                                        onClick={() => handleQuickPunch('Leave')}
                                        disabled={marking}
                                    >
                                        Mark Leave
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- 2-Column Main Content Widgets --- */}
                <div className="dashboard-widgets-grid">
                    {/* LEFT COLUMN */}
                    <div className="widgets-column">
                        {/* Widget 1: Today's Deployments / Schedule */}
                        <div className="widget-card">
                            <div className="widget-header">
                                <div className="widget-title">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                    </svg>
                                    <span>Today's Site Deployments</span>
                                </div>
                                <button className="widget-link-btn" onClick={() => navigate('/assignments')}>
                                    View All
                                </button>
                            </div>

                            <div className="timeline-list">
                                <div className="timeline-item">
                                    <span className="timeline-time">09:00</span>
                                    <div className="timeline-content bar-blue">
                                        <div className="timeline-title">L&T Expressway Project • Crane CR-001</div>
                                        <div className="timeline-sub">Rajesh Kumar (Operator) | Amit Singh (Rigger)</div>
                                    </div>
                                </div>

                                <div className="timeline-item active-item">
                                    <span className="timeline-time">10:30</span>
                                    <div className="timeline-content bar-amber">
                                        <div className="timeline-title">Metro Line 3 Tunnel • Crane CR-004</div>
                                        <div className="timeline-sub">Sunil Verma (Operator) | Shift 1 - Heavy Lift</div>
                                    </div>
                                </div>

                                <div className="timeline-item">
                                    <span className="timeline-time">12:00</span>
                                    <div className="timeline-content bar-green">
                                        <div className="timeline-title">Godrej High-Rise Site • Crane CR-007</div>
                                        <div className="timeline-sub">Manoj Patil (Operator) | Unit Alpha</div>
                                    </div>
                                </div>

                                <div className="timeline-item">
                                    <span className="timeline-time">14:00</span>
                                    <div className="timeline-content bar-cyan">
                                        <div className="timeline-title">Shapoorji Pallonji Commercial • Crane CR-012</div>
                                        <div className="timeline-sub">Dinesh Sharma (Operator) | General Erection</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Widget 2: Fleet Utilization Arc / Semi Donut */}
                        <div className="widget-card">
                            <div className="widget-header">
                                <div className="widget-title">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span>Fleet & Workforce Utilization</span>
                                </div>
                                <button className="widget-link-btn" onClick={() => navigate('/attendance')}>
                                    View All
                                </button>
                            </div>

                            <div className="donut-chart-container">
                                <div className="gauge-wrap">
                                    <svg className="gauge-svg" viewBox="0 0 200 110">
                                        {/* Background Track Arc */}
                                        <path 
                                            d="M 20 100 A 80 80 0 0 1 180 100" 
                                            fill="none" 
                                            stroke="#EEF2F6" 
                                            strokeWidth="20" 
                                            strokeLinecap="round"
                                        />
                                        {/* Colored Progress Arc */}
                                        <path 
                                            d="M 20 100 A 80 80 0 0 1 180 100" 
                                            fill="none" 
                                            stroke="#0062FF" 
                                            strokeWidth="20" 
                                            strokeLinecap="round"
                                            strokeDasharray="251.2"
                                            strokeDashoffset={251.2 * (1 - attendancePercentage / 100)}
                                            style={{ transition: 'stroke-dashoffset 1s ease' }}
                                        />
                                    </svg>
                                    <div className="gauge-label">
                                        <span className="gauge-number">{attendancePercentage}%</span>
                                        <span className="gauge-sub">
                                            {presentTodayCount}/{activeEmployeesCount} Resources Active
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="widgets-column">
                        {/* Widget 3: Operational Statistics Chart Bars */}
                        <div className="widget-card">
                            <div className="widget-header">
                                <div className="widget-title">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="20" x2="18" y2="10"></line>
                                        <line x1="12" y1="20" x2="12" y2="4"></line>
                                        <line x1="6" y1="20" x2="6" y2="14"></line>
                                    </svg>
                                    <span>Deployment Statistics</span>
                                </div>
                            </div>

                            <div className="bar-chart-visual">
                                {[
                                    { month: 'Jan', height: '40%' },
                                    { month: 'Feb', height: '65%' },
                                    { month: 'Mar', height: '50%' },
                                    { month: 'Apr', height: '35%' },
                                    { month: 'May', height: '75%' },
                                    { month: 'Jun', height: '55%' },
                                    { month: 'Jul', height: '70%' },
                                    { month: 'Aug', height: '60%' },
                                    { month: 'Sep', height: '85%' },
                                    { month: 'Oct', height: '45%' },
                                    { month: 'Nov', height: '78%' },
                                    { month: 'Dec', height: '90%' },
                                ].map((item, idx) => (
                                    <div key={idx} className="chart-bar-col">
                                        <div className="chart-bar-track">
                                            <div 
                                                className="chart-bar-fill" 
                                                style={{ height: item.height }}
                                            />
                                        </div>
                                        <span className="chart-bar-month">{item.month}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Widget 4: Fleet & Resource Status Alerts */}
                        <div className="widget-card">
                            <div className="widget-header">
                                <div className="widget-title">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                    </svg>
                                    <span>Fleet Status & Health</span>
                                </div>
                            </div>

                            <div className="status-bars-list">
                                <div className="status-progress-row">
                                    <div className="status-row-info">
                                        <span className="status-name">Heavy Duty Cranes (50T+)</span>
                                        <span className="status-meta">12 Units Active</span>
                                    </div>
                                    <div className="status-track">
                                        <div className="status-fill fill-amber" style={{ width: '80%' }}>
                                            <span>80%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="status-progress-row">
                                    <div className="status-row-info">
                                        <span className="status-name">Hydraulic Mobile Fleet</span>
                                        <span className="status-meta">15% Maintenance</span>
                                    </div>
                                    <div className="status-track">
                                        <div className="status-fill fill-rose" style={{ width: '15%' }}>
                                            <span>15%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="status-progress-row">
                                    <div className="status-row-info">
                                        <span className="status-name">Certified Riggers Available</span>
                                        <span className="status-meta">18 Ready</span>
                                    </div>
                                    <div className="status-track">
                                        <div className="status-fill fill-teal" style={{ width: '70%' }}>
                                            <span>70%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Widget 5: Recent Team & Crew Activity */}
                        <div className="widget-card">
                            <div className="widget-header">
                                <div className="widget-title">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                    </svg>
                                    <span>Key Operators & Riggers</span>
                                </div>
                            </div>

                            <div className="recent-crew-list">
                                <div className="crew-card-item">
                                    <div className="crew-avatar-mini bg-blue-subtle">
                                        RK
                                    </div>
                                    <div className="crew-details">
                                        <span className="crew-name">Rajesh Kumar</span>
                                        <span className="crew-role-sub">Operator • 50T Mobile Crane</span>
                                    </div>
                                    <span className="crew-rating">4.9/5</span>
                                </div>

                                <div className="crew-card-item">
                                    <div className="crew-avatar-mini bg-purple-subtle">
                                        AS
                                    </div>
                                    <div className="crew-details">
                                        <span className="crew-name">Amit Singh</span>
                                        <span className="crew-role-sub">Senior Rigger • Metro Line</span>
                                    </div>
                                    <span className="crew-rating">4.9/5</span>
                                </div>

                                <div className="crew-card-item">
                                    <div className="crew-avatar-mini bg-emerald-subtle">
                                        SV
                                    </div>
                                    <div className="crew-details">
                                        <span className="crew-name">Sunil Verma</span>
                                        <span className="crew-role-sub">Operator • Crawler Crane</span>
                                    </div>
                                    <span className="crew-rating">4.8/5</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;