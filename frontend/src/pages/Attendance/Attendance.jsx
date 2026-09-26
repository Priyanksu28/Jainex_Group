import { useState, useEffect, useContext } from 'react';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar/Sidebar';
import './Attendance.css';

const Attendance = () => {
    const { user } = useContext(AuthContext);
    const isStaff = user?.role === 'Operator' || user?.role === 'Rigger';

    // State for Staff View
    const [todayStatus, setTodayStatus] = useState(null);
    const [staffHistory, setStaffHistory] = useState([]);
    const [staffStats, setStaffStats] = useState(null);
    const [formStatus, setFormStatus] = useState('Present');
    const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
    const [formNotes, setFormNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // State for Admin View
    const [adminRecords, setAdminRecords] = useState([]);
    const [adminStats, setAdminStats] = useState(null);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));
    const [filterRole, setFilterRole] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const loadStaffData = async () => {
        try {
            setLoading(true);
            const [statusRes, historyRes] = await Promise.all([
                API.get('/attendance/today-status'),
                API.get('/attendance/my-history')
            ]);
            setTodayStatus(statusRes.data.record);
            if (statusRes.data.record) {
                setFormStatus(statusRes.data.record.status);
                setFormNotes(statusRes.data.record.notes || '');
            }
            setStaffHistory(historyRes.data.history || []);
            setStaffStats(historyRes.data.stats || null);
        } catch (err) {
            console.error("Error loading staff attendance data:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadAdminData = async () => {
        try {
            setLoading(true);
            const res = await API.get('/attendance/all', {
                params: {
                    date: filterDate,
                    role: filterRole,
                    search: searchTerm
                }
            });
            setAdminRecords(res.data.records || []);
            setAdminStats(res.data.stats || null);
        } catch (err) {
            console.error("Error loading admin attendance data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isStaff) {
            loadStaffData();
        } else {
            loadAdminData();
        }
    }, [isStaff, filterDate, filterRole]);

    const handleStaffSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await API.post('/attendance/mark', {
                status: formStatus,
                date: formDate,
                notes: formNotes
            });
            alert(res.data.message || "Attendance recorded successfully!");
            loadStaffData();
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data?.error || "Failed to mark attendance.");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDateDMY = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB');
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />

            <main className="main-content">
                <header className="module-header">
                    <div className="header-titles">
                        <h1>Attendance Management</h1>
                        <p>{isStaff ? "Record your daily attendance and view history" : "Workforce attendance tracking & directory"}</p>
                    </div>
                </header>

                {isStaff ? (
                    /* ================= STAFF VIEW (OPERATOR & RIGGER) ================= */
                    <div className="staff-attendance-layout">
                        {/* Attendance Marking Card */}
                        <div className="attendance-card mark-card">
                            <div className="card-header">
                                <h3>📝 Mark Daily Attendance</h3>
                                <span className="date-badge">{formatDateDMY(formDate)}</span>
                            </div>

                            {todayStatus && (
                                <div className="already-marked-alert">
                                    <span>✓ Attendance is currently marked as <strong>{todayStatus.status}</strong> for today. You can update it below if needed.</span>
                                </div>
                            )}

                            <form onSubmit={handleStaffSubmit} className="mark-form">
                                <div className="form-group">
                                    <label>Select Status <span className="req">*</span></label>
                                    <div className="status-selector-grid">
                                        {['Present', 'Half Day', 'Leave'].map((st) => (
                                            <button
                                                key={st}
                                                type="button"
                                                className={`btn-status-option ${st.toLowerCase().replace(' ', '-')} ${formStatus === st ? 'active' : ''}`}
                                                onClick={() => setFormStatus(st)}
                                            >
                                                {st === 'Present' && '✓ Present'}
                                                {st === 'Half Day' && '⏳ Half Day'}
                                                {st === 'Leave' && '🏖️ Leave'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Attendance Date</label>
                                    <input 
                                        type="date" 
                                        value={formDate} 
                                        onChange={(e) => setFormDate(e.target.value)}
                                        max={new Date().toISOString().slice(0, 10)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Optional Notes / Shift Remarks</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Unit 1 Crane Duty, Site deployment, etc."
                                        value={formNotes}
                                        onChange={(e) => setFormNotes(e.target.value)}
                                    />
                                </div>

                                <button type="submit" className="btn-save-attendance" disabled={submitting}>
                                    {submitting ? "Saving Attendance..." : (todayStatus ? "Update Today's Attendance" : "Submit & Mark Attendance")}
                                </button>
                            </form>
                        </div>

                        {/* Monthly Summary & History */}
                        <div className="attendance-card history-card">
                            <div className="card-header">
                                <h3>📊 Monthly Attendance Summary</h3>
                            </div>

                            <div className="mini-stats-grid">
                                <div className="mini-stat present">
                                    <span className="mini-num">{staffStats?.present_days || 0}</span>
                                    <span className="mini-lbl">Present</span>
                                </div>
                                <div className="mini-stat half-day">
                                    <span className="mini-num">{staffStats?.half_days || 0}</span>
                                    <span className="mini-lbl">Half Day</span>
                                </div>
                                <div className="mini-stat leave">
                                    <span className="mini-num">{staffStats?.leave_days || 0}</span>
                                    <span className="mini-lbl">Leaves</span>
                                </div>
                                <div className="mini-stat total">
                                    <span className="mini-num">{staffStats?.total_records || 0}</span>
                                    <span className="mini-lbl">Total Days</span>
                                </div>
                            </div>

                            <h4 className="sub-title">Recent Attendance Log</h4>
                            {loading ? (
                                <p className="loading-text">Loading attendance log...</p>
                            ) : staffHistory.length === 0 ? (
                                <p className="empty-text">No attendance records logged yet.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="att-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th>Punch Time</th>
                                                <th>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {staffHistory.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="bold-cell">{formatDateDMY(item.date)}</td>
                                                    <td>
                                                        <span className={`att-badge ${item.status.toLowerCase().replace(' ', '-')}`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td>{item.check_in_time || 'N/A'}</td>
                                                    <td>{item.notes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* ================= ADMIN VIEW ================= */
                    <div className="admin-attendance-layout">
                        {/* Summary Bar */}
                        <div className="admin-summary-bar">
                            <div className="admin-stat-item">
                                <span className="lbl">Total Active Workforce</span>
                                <span className="val">{adminStats?.total_active_employees || 0}</span>
                            </div>
                            <div className="admin-stat-item green">
                                <span className="lbl">Present on {formatDateDMY(filterDate)}</span>
                                <span className="val">{adminStats?.present || 0}</span>
                            </div>
                            <div className="admin-stat-item amber">
                                <span className="lbl">Half Days</span>
                                <span className="val">{adminStats?.half_day || 0}</span>
                            </div>
                            <div className="admin-stat-item blue">
                                <span className="lbl">On Leave</span>
                                <span className="val">{adminStats?.leave || 0}</span>
                            </div>
                        </div>

                        {/* Controls Bar */}
                        <div className="admin-controls-card">
                            <div className="control-group">
                                <label>Date Filter:</label>
                                <input 
                                    type="date" 
                                    value={filterDate} 
                                    onChange={(e) => setFilterDate(e.target.value)}
                                />
                            </div>

                            <div className="control-group">
                                <label>Role Filter:</label>
                                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                                    <option value="All">All Roles</option>
                                    <option value="Operator">Operators</option>
                                    <option value="Rigger">Riggers</option>
                                </select>
                            </div>

                            <div className="control-group search-group">
                                <label>Search Employee:</label>
                                <input 
                                    type="text" 
                                    placeholder="Search by name or contact..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && loadAdminData()}
                                />
                                <button className="btn-search-apply" onClick={loadAdminData}>
                                    Filter
                                </button>
                            </div>
                        </div>

                        {/* Records Table */}
                        <div className="table-card">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Staff Name</th>
                                        <th>Designation / Role</th>
                                        <th>Unit Name</th>
                                        <th>Contact No</th>
                                        <th>Status</th>
                                        <th>Check-In Time</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="8" className="table-empty">Loading records...</td></tr>
                                    ) : adminRecords.length === 0 ? (
                                        <tr><td colSpan="8" className="table-empty">No attendance records found for this date/criteria.</td></tr>
                                    ) : (
                                        adminRecords.map((rec) => (
                                            <tr key={rec.id}>
                                                <td className="bold-cell">{formatDateDMY(rec.date)}</td>
                                                <td className="bold-cell">{`${rec.first_name || ''} ${rec.last_name || ''}`.trim()}</td>
                                                <td>
                                                    <span className="role-tag">{rec.designation || 'Staff'}</span>
                                                </td>
                                                <td>{rec.unit_name || 'N/A'}</td>
                                                <td>{rec.contact_no || 'N/A'}</td>
                                                <td>
                                                    <span className={`att-badge ${rec.status.toLowerCase().replace(' ', '-')}`}>
                                                        {rec.status}
                                                    </span>
                                                </td>
                                                <td>{rec.check_in_time || 'N/A'}</td>
                                                <td>{rec.notes || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Attendance;
