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
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="dashboard-wrapper">
            <Sidebar />

            <main className="main-content">
                {/* --- HEADER --- */}
                <header className="content-header">
                    <div className="header-titles">
                        <h1>{isStaff ? `Welcome, ${user?.name || user?.user_id}` : `${user?.role || 'Admin'} Dashboard`}</h1>
                        <p>{todayDateStr} &bull; Jainex Fleet & Workforce Portal {idPrefix ? `(${idPrefix})` : ''}</p>
                    </div>
                    {isStaff && (
                        <div className="header-actions">
                            <button 
                                className="btn-attendance-nav" 
                                onClick={() => navigate(idPrefix ? `/${idPrefix}/attendance` : '/attendance')}
                            >
                                📋 Open Attendance Log
                            </button>
                        </div>
                    )}
                </header>

                {/* --- OPERATOR / RIGGER DASHBOARD VIEW --- */}
                {isStaff ? (
                    <>
                        {/* Greeting & Today's Attendance Banner */}
                        <div className="staff-welcome-banner">
                            <div className="staff-info-block">
                                <div className="staff-avatar">
                                    {user?.name ? user.name[0].toUpperCase() : '👤'}
                                </div>
                                <div>
                                    <h2>{user?.name || user?.user_id}</h2>
                                    <span className="staff-role-badge">{user?.designation || user?.role}</span>
                                    {user?.unit_name && <span className="staff-unit-badge">Unit: {user.unit_name}</span>}
                                </div>
                            </div>

                            <div className="today-status-card">
                                <span className="today-label">Today's Attendance</span>
                                {stats?.todayRecord ? (
                                    <div className="status-marked-wrap">
                                        <span className={`status-pill ${stats.todayRecord.status.toLowerCase().replace(' ', '-')}`}>
                                            ✓ {stats.todayRecord.status}
                                        </span>
                                        <span className="punch-time">
                                            Punch Time: {stats.todayRecord.check_in_time || 'Recorded'}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="status-unmarked-wrap">
                                        <span className="unmarked-text">⚠️ Not Marked Yet</span>
                                        <div className="quick-punch-btns">
                                            <button 
                                                className="btn-punch-present"
                                                onClick={() => handleQuickPunch('Present')}
                                                disabled={marking}
                                            >
                                                {marking ? 'Saving...' : '✓ Punch Present'}
                                            </button>
                                            <button 
                                                className="btn-punch-leave"
                                                onClick={() => handleQuickPunch('Leave')}
                                                disabled={marking}
                                            >
                                                Mark Leave
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Monthly Summary Statistics Grid */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <p className="stat-label">Days Present (This Month)</p>
                                <h2 className="stat-value text-green">
                                    {stats?.monthlyStats?.present_days || 0}
                                </h2>
                            </div>
                            <div className="stat-card">
                                <p className="stat-label">Half Days</p>
                                <h2 className="stat-value text-amber">
                                    {stats?.monthlyStats?.half_days || 0}
                                </h2>
                            </div>
                            <div className="stat-card">
                                <p className="stat-label">Leaves Taken</p>
                                <h2 className="stat-value text-blue">
                                    {stats?.monthlyStats?.leave_days || 0}
                                </h2>
                            </div>
                            <div className="stat-card">
                                <p className="stat-label">Total Logged Days</p>
                                <h2 className="stat-value">
                                    {stats?.monthlyStats?.total_records || 0}
                                </h2>
                            </div>
                        </div>

                        {/* Quick Action & Info Container */}
                        <section className="dashboard-action-section">
                            {/* <div className="action-card">
                                <h3>📋 Daily Attendance & Timesheet</h3>
                                <p>Record your presence, check your monthly working history, or update attendance notes.</p>
                                <button 
                                    className="btn-primary-action"
                                    onClick={() => navigate(idPrefix ? `/${idPrefix}/attendance` : '/attendance')}
                                >
                                    Go to Attendance Module &rarr;
                                </button>
                            </div> */}
                            <div className="action-card">
                                <h3>🪪 Employee Profile & Declaration</h3>
                                <p>Your employee credentials are tied to your official declaration on file with Professional HR Services Pvt. Ltd.</p>
                                <span className="profile-hint">Designation: <strong>{user?.designation || user?.role}</strong></span>
                            </div>
                        </section>
                    </>
                ) : (
                    /* --- ADMIN DASHBOARD VIEW --- */
                    <>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <p className="stat-label">Total Active Staff</p>
                                <h2 className="stat-value">
                                    {stats?.overall?.total_active_employees || 0}
                                </h2>
                            </div>
                            <div className="stat-card">
                                <p className="stat-label">Today's Attendance Marked</p>
                                <h2 className="stat-value text-green">
                                    {stats?.overall?.attendance_marked || 0}
                                </h2>
                            </div>
                            <div className="stat-card">
                                <p className="stat-label">Present Today</p>
                                <h2 className="stat-value text-green">
                                    {stats?.overall?.present || 0}
                                </h2>
                            </div>
                            <div className="stat-card">
                                <p className="stat-label">On Leave Today</p>
                                <h2 className="stat-value text-blue">
                                    {stats?.overall?.leave || 0}
                                </h2>
                            </div>
                        </div>

                        <section className="table-section">
                            <div className="table-header">
                                <h3>Workforce & Operations Center</h3>
                            </div>
                            <div className="admin-quick-links">
                                <button className="admin-tile" onClick={() => navigate('/operators')}>
                                    <span className="tile-icon">👷</span>
                                    <h4>Manage Operators</h4>
                                    <p>View, register & print operator declaration forms</p>
                                </button>
                                <button className="admin-tile" onClick={() => navigate('/riggers')}>
                                    <span className="tile-icon">🪢</span>
                                    <h4>Manage Riggers</h4>
                                    <p>View, register & print rigger declaration forms</p>
                                </button>
                                <button className="admin-tile" onClick={() => navigate('/attendance')}>
                                    <span className="tile-icon">📋</span>
                                    <h4>Attendance Directory</h4>
                                    <p>Monitor daily attendance records across units</p>
                                </button>
                                <button className="admin-tile" onClick={() => navigate('/cranes')}>
                                    <span className="tile-icon">🏗️</span>
                                    <h4>Cranes Fleet</h4>
                                    <p>Track crane deployments and site status</p>
                                </button>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;