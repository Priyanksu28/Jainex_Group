import { useState, useEffect, useContext } from 'react';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar/Sidebar';
import DeployResourceModal from './DeployResourceModal';
import FormGangModal from './FormGangModal';
import TransferModal from './TransferModal';
import './Assignments.css';

const Assignments = () => {
    const { user } = useContext(AuthContext);
    
    // Sites list & selected site
    const [sites, setSites] = useState([]);
    const [selectedSiteId, setSelectedSiteId] = useState('');
    
    // Site Roster Data & Global Overview
    const [siteRoster, setSiteRoster] = useState(null);
    const [overview, setOverview] = useState(null);
    const [availablePool, setAvailablePool] = useState({ cranes: [], operators: [], riggers: [] });
    
    // Active Tab: 'gangs' | 'roster' | 'pool'
    const [activeTab, setActiveTab] = useState('gangs');
    const [loading, setLoading] = useState(true);

    // Modals
    const [showDeployModal, setShowDeployModal] = useState(false);
    const [showGangModal, setShowGangModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [resourceToTransfer, setResourceToTransfer] = useState(null);

    // 1. Initial Load: Fetch all sites & global overview
    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [sitesRes, overviewRes] = await Promise.all([
                API.get('/sites/list'),
                API.get('/assignments/overview')
            ]);

            const fetchedSites = sitesRes.data || [];
            setSites(fetchedSites);
            setOverview(overviewRes.data || null);

            if (fetchedSites.length > 0 && !selectedSiteId) {
                setSelectedSiteId(String(fetchedSites[0].id));
            }
        } catch (err) {
            console.error('Error loading assignments data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    // 2. Fetch Site Roster when selectedSiteId changes
    const fetchSiteRoster = async (siteId) => {
        if (!siteId) return;
        try {
            const res = await API.get(`/assignments/site/${siteId}/roster`);
            setSiteRoster(res.data);
        } catch (err) {
            console.error('Error fetching site roster:', err);
            setSiteRoster(null);
        }
    };

    // 3. Fetch Global Available Pool when Tab is 'pool'
    const fetchAvailablePool = async () => {
        try {
            const res = await API.get('/assignments/available-pool');
            setAvailablePool(res.data || { cranes: [], operators: [], riggers: [] });
        } catch (err) {
            console.error('Error fetching available pool:', err);
        }
    };

    useEffect(() => {
        if (selectedSiteId) {
            fetchSiteRoster(selectedSiteId);
        }
    }, [selectedSiteId]);

    useEffect(() => {
        if (activeTab === 'pool') {
            fetchAvailablePool();
        }
    }, [activeTab]);

    const refreshAll = () => {
        if (selectedSiteId) fetchSiteRoster(selectedSiteId);
        API.get('/assignments/overview').then(res => setOverview(res.data)).catch(() => {});
        if (activeTab === 'pool') fetchAvailablePool();
    };

    const handleDisbandGang = async (gangId, craneReg) => {
        const confirmed = window.confirm(`Are you sure you want to disband the crew gang on Crane ${craneReg}? The resources will remain at this site but become idle/available.`);
        if (!confirmed) return;

        try {
            await API.patch(`/assignments/release-gang/${gangId}`);
            alert('Gang released successfully!');
            refreshAll();
        } catch (err) {
            console.error('Error releasing gang:', err);
            alert(err.response?.data?.error || 'Failed to release gang.');
        }
    };

    const handleReleaseResource = async (deployment) => {
        const confirmed = window.confirm(`Release ${deployment.resource_type} "${deployment.resource_name}" from this site back to the available inventory pool?`);
        if (!confirmed) return;

        try {
            await API.patch(`/assignments/release-deployment/${deployment.id}`);
            alert(`${deployment.resource_type} released from site successfully!`);
            refreshAll();
        } catch (err) {
            console.error('Error releasing deployment:', err);
            alert(err.response?.data?.error || 'Failed to release deployment.');
        }
    };

    const handleOpenTransfer = (deployment) => {
        setResourceToTransfer(deployment);
        setShowTransferModal(true);
    };

    const canManage = user?.role === 'Admin' || user?.role === 'Supervisor' || !user;

    const summary = siteRoster?.summary || {
        total_cranes: 0,
        working_cranes: 0,
        idle_cranes: 0,
        total_operators: 0,
        working_operators: 0,
        free_operators: 0,
        total_riggers: 0,
        working_riggers: 0,
        free_riggers: 0,
        total_gangs: 0
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="main-content">
                <div className="module-container">
                    {/* Header */}
                    <header className="module-header">
                        <div className="header-titles">
                            <h1>Assignments & Fleet Mobilization</h1>
                            <p>Manage site resource deployment, crew gang formation, and resource tracking</p>
                        </div>
                    </header>

                    {/* Site Selector Bar */}
                    <div className="site-selector-card">
                        <div className="site-picker-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                📍 Active Worksite:
                            </label>
                            <select
                                className="site-select-dropdown"
                                value={selectedSiteId}
                                onChange={(e) => setSelectedSiteId(e.target.value)}
                            >
                                {sites.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.site_name} ({s.site_code || `SITE-${s.id}`})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {canManage && (
                            <div className="site-action-btns">
                                <button
                                    className="btn-deploy-res"
                                    onClick={() => setShowDeployModal(true)}
                                >
                                    <span>📦</span> Deploy Resource to Site
                                </button>
                                <button
                                    className="btn-pair-gang"
                                    onClick={() => setShowGangModal(true)}
                                    disabled={!siteRoster?.cranesAtSite?.length}
                                    title={!siteRoster?.cranesAtSite?.length ? "Deploy at least 1 crane to this site first" : ""}
                                >
                                    <span>⚡</span> Form Crane Crew Gang
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Live Site Stats Strip */}
                    <div className="sites-stats-grid" style={{ marginBottom: '20px' }}>
                        <div className="stat-card">
                            <div className="stat-icon">🏗️</div>
                            <div className="stat-info">
                                <span className="stat-value">
                                    {summary.total_cranes}
                                    <span style={{ fontSize: '0.85rem', color: '#16a34a', marginLeft: '6px' }}>({summary.working_cranes} Working)</span>
                                </span>
                                <span className="stat-label">Cranes on Site</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#dcfce7' }}>👷</div>
                            <div className="stat-info">
                                <span className="stat-value">
                                    {summary.total_operators}
                                    <span style={{ fontSize: '0.85rem', color: '#0284c7', marginLeft: '6px' }}>({summary.free_operators} Free)</span>
                                </span>
                                <span className="stat-label">Operators on Site</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#fef3c7' }}>🪢</div>
                            <div className="stat-info">
                                <span className="stat-value">
                                    {summary.total_riggers}
                                    <span style={{ fontSize: '0.85rem', color: '#854d0e', marginLeft: '6px' }}>({summary.working_riggers} Attached)</span>
                                </span>
                                <span className="stat-label">Riggers on Site</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#e0e7ff' }}>⚡</div>
                            <div className="stat-info">
                                <span className="stat-value">{summary.total_gangs}</span>
                                <span className="stat-label">Operating Gangs</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="assignment-tabs">
                        <button
                            className={`assignment-tab ${activeTab === 'gangs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('gangs')}
                        >
                            <span>🏗️ Crane Crew Gangs</span>
                            <span className="tab-badge">{summary.total_gangs}</span>
                        </button>

                        <button
                            className={`assignment-tab ${activeTab === 'roster' ? 'active' : ''}`}
                            onClick={() => setActiveTab('roster')}
                        >
                            <span>🔍 Live Site Resource Roster</span>
                            <span className="tab-badge">{siteRoster?.deployments?.length || 0}</span>
                        </button>

                        <button
                            className={`assignment-tab ${activeTab === 'pool' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pool')}
                        >
                            <span>📦 Global Free Inventory Pool</span>
                            <span className="tab-badge">
                                {(availablePool.cranes?.length || 0) + (availablePool.operators?.length || 0) + (availablePool.riggers?.length || 0)}
                            </span>
                        </button>
                    </div>

                    {/* TAB 1: CRANE GANGS */}
                    {activeTab === 'gangs' && (
                        <div>
                            {siteRoster?.gangs?.length === 0 ? (
                                <div className="empty-state-box">
                                    <div style={{ fontSize: '2.5rem' }}>🚜</div>
                                    <h3>No Active Crane Gangs at this Site</h3>
                                    <p>Pair an idle crane with an operator and riggers to create a functional crew unit.</p>
                                    {canManage && (
                                        <button
                                            className="btn-pair-gang"
                                            style={{ marginTop: '14px' }}
                                            onClick={() => setShowGangModal(true)}
                                            disabled={!siteRoster?.cranesAtSite?.length}
                                        >
                                            ⚡ Form First Crew Gang
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="gangs-grid">
                                    {siteRoster?.gangs?.map(gang => (
                                        <div key={gang.id} className="gang-card">
                                            <div className="gang-card-header">
                                                <div>
                                                    <h3 className="gang-crane-title">{gang.crane_model}</h3>
                                                    <div className="gang-crane-reg">Reg: {gang.crane_reg_no} • {gang.crane_capacity || 'N/A'}</div>
                                                </div>
                                                <span className="shift-badge">{gang.shift}</span>
                                            </div>

                                            <div className="gang-card-body">
                                                {/* Lead Operator */}
                                                <div className="crew-section">
                                                    <span className="crew-label">Lead Operator</span>
                                                    <div className="crew-person-box">
                                                        <div className="crew-avatar">👷</div>
                                                        <div className="crew-person-info">
                                                            <span className="crew-name">{gang.op_first_name} {gang.op_last_name || ''}</span>
                                                            <span className="crew-contact">📞 {gang.op_contact_no || 'No phone'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Co-Operator if any */}
                                                {gang.coop_first_name && (
                                                    <div className="crew-section">
                                                        <span className="crew-label">Co-Operator / Reliever</span>
                                                        <div className="crew-person-box">
                                                            <div className="crew-avatar">👷‍♂️</div>
                                                            <div className="crew-person-info">
                                                                <span className="crew-name">{gang.coop_first_name} {gang.coop_last_name || ''}</span>
                                                                <span className="crew-contact">📞 {gang.coop_contact_no || 'No phone'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Attached Riggers */}
                                                <div className="crew-section">
                                                    <span className="crew-label">
                                                        Attached Riggers ({gang.riggers?.length || 0})
                                                    </span>
                                                    {gang.riggers?.length === 0 ? (
                                                        <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                                            No riggers attached to this gang.
                                                        </span>
                                                    ) : (
                                                        <div className="riggers-chips-container">
                                                            {gang.riggers?.map(r => (
                                                                <span key={r.emp_id} className="rigger-chip">
                                                                    🪢 {r.first_name} {r.last_name || ''}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {gang.notes && (
                                                    <div style={{ fontSize: '0.82rem', color: '#64748b', background: '#f1f5f9', padding: '8px 10px', borderRadius: '6px' }}>
                                                        📝 {gang.notes}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="gang-card-footer">
                                                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                                    Assigned: {new Date(gang.assigned_date).toLocaleDateString()}
                                                </span>
                                                {canManage && (
                                                    <button
                                                        className="btn-disband-gang"
                                                        onClick={() => handleDisbandGang(gang.id, gang.crane_reg_no)}
                                                    >
                                                        Disband Gang
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: LIVE SITE RESOURCE ROSTER */}
                    {activeTab === 'roster' && (
                        <div className="roster-columns-grid">
                            {/* Column 1: Cranes at Site */}
                            <div className="roster-column-card">
                                <div className="roster-column-header">
                                    <h3>🏗️ Cranes at Site ({siteRoster?.cranesAtSite?.length || 0})</h3>
                                </div>
                                <div className="roster-item-list">
                                    {siteRoster?.cranesAtSite?.length === 0 ? (
                                        <div className="empty-state-box" style={{ padding: '20px' }}>No cranes at this site.</div>
                                    ) : (
                                        siteRoster?.cranesAtSite?.map(c => (
                                            <div key={c.id} className={`roster-item-card ${c.is_assigned_to_gang ? 'operating' : 'idle'}`}>
                                                <div className="roster-item-details">
                                                    <span className="roster-item-title">{c.resource_subtitle || 'Crane'}</span>
                                                    <span className="roster-item-sub">Reg: {c.resource_name} • Cap: {c.capacity || 'N/A'}</span>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: c.is_assigned_to_gang ? '#166534' : '#854d0e', marginTop: '2px' }}>
                                                        {c.is_assigned_to_gang ? '🟢 Assigned to Crew Gang' : '🟡 Free / Idle at Site'}
                                                    </span>
                                                </div>
                                                {canManage && (
                                                    <div className="roster-item-actions">
                                                        <button className="btn-mini-transfer" onClick={() => handleOpenTransfer(c)}>Transfer</button>
                                                        <button className="btn-mini-release" onClick={() => handleReleaseResource(c)}>Release</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Column 2: Operators at Site */}
                            <div className="roster-column-card">
                                <div className="roster-column-header">
                                    <h3>👷 Operators at Site ({siteRoster?.operatorsAtSite?.length || 0})</h3>
                                </div>
                                <div className="roster-item-list">
                                    {siteRoster?.operatorsAtSite?.length === 0 ? (
                                        <div className="empty-state-box" style={{ padding: '20px' }}>No operators at this site.</div>
                                    ) : (
                                        siteRoster?.operatorsAtSite?.map(op => (
                                            <div key={op.id} className={`roster-item-card ${op.is_assigned_to_gang ? 'operating' : 'idle'}`}>
                                                <div className="roster-item-details">
                                                    <span className="roster-item-title">{op.resource_name}</span>
                                                    <span className="roster-item-sub">📞 {op.contact_no || 'No contact'}</span>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: op.is_assigned_to_gang ? '#166534' : '#854d0e', marginTop: '2px' }}>
                                                        {op.is_assigned_to_gang ? '🟢 Operating Crane' : '🟡 Available for Assignment'}
                                                    </span>
                                                </div>
                                                {canManage && (
                                                    <div className="roster-item-actions">
                                                        <button className="btn-mini-transfer" onClick={() => handleOpenTransfer(op)}>Transfer</button>
                                                        <button className="btn-mini-release" onClick={() => handleReleaseResource(op)}>Release</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Column 3: Riggers at Site */}
                            <div className="roster-column-card">
                                <div className="roster-column-header">
                                    <h3>🪢 Riggers at Site ({siteRoster?.riggersAtSite?.length || 0})</h3>
                                </div>
                                <div className="roster-item-list">
                                    {siteRoster?.riggersAtSite?.length === 0 ? (
                                        <div className="empty-state-box" style={{ padding: '20px' }}>No riggers at this site.</div>
                                    ) : (
                                        siteRoster?.riggersAtSite?.map(r => (
                                            <div key={r.id} className={`roster-item-card ${r.is_assigned_to_gang ? 'operating' : 'idle'}`}>
                                                <div className="roster-item-details">
                                                    <span className="roster-item-title">{r.resource_name}</span>
                                                    <span className="roster-item-sub">📞 {r.contact_no || 'No contact'}</span>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: r.is_assigned_to_gang ? '#166534' : '#854d0e', marginTop: '2px' }}>
                                                        {r.is_assigned_to_gang ? '🟢 Attached to Gang' : '🟡 Free on Site'}
                                                    </span>
                                                </div>
                                                {canManage && (
                                                    <div className="roster-item-actions">
                                                        <button className="btn-mini-transfer" onClick={() => handleOpenTransfer(r)}>Transfer</button>
                                                        <button className="btn-mini-release" onClick={() => handleReleaseResource(r)}>Release</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: GLOBAL FREE POOL */}
                    {activeTab === 'pool' && (
                        <div className="roster-columns-grid">
                            {/* Free Cranes */}
                            <div className="roster-column-card">
                                <div className="roster-column-header">
                                    <h3>🏗️ Free Cranes Pool ({availablePool.cranes?.length || 0})</h3>
                                </div>
                                <div className="roster-item-list">
                                    {availablePool.cranes?.length === 0 ? (
                                        <div className="empty-state-box" style={{ padding: '20px' }}>All cranes are currently deployed to sites!</div>
                                    ) : (
                                        availablePool.cranes?.map(c => (
                                            <div key={c.id} className="roster-item-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                                                <div className="roster-item-details">
                                                    <span className="roster-item-title">{c.model}</span>
                                                    <span className="roster-item-sub">Reg: {c.reg_no} • Cap: {c.capacity}</span>
                                                </div>
                                                {canManage && (
                                                    <button
                                                        className="btn-mini-transfer"
                                                        style={{ background: '#ffb41d', color: '#0f172a' }}
                                                        onClick={() => setShowDeployModal(true)}
                                                    >
                                                        + Deploy
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Free Operators */}
                            <div className="roster-column-card">
                                <div className="roster-column-header">
                                    <h3>👷 Free Operators Pool ({availablePool.operators?.length || 0})</h3>
                                </div>
                                <div className="roster-item-list">
                                    {availablePool.operators?.length === 0 ? (
                                        <div className="empty-state-box" style={{ padding: '20px' }}>All operators are currently deployed to sites!</div>
                                    ) : (
                                        availablePool.operators?.map(op => (
                                            <div key={op.emp_id} className="roster-item-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                                                <div className="roster-item-details">
                                                    <span className="roster-item-title">{op.first_name} {op.last_name || ''}</span>
                                                    <span className="roster-item-sub">📞 {op.contact_no || 'No contact'}</span>
                                                </div>
                                                {canManage && (
                                                    <button
                                                        className="btn-mini-transfer"
                                                        style={{ background: '#ffb41d', color: '#0f172a' }}
                                                        onClick={() => setShowDeployModal(true)}
                                                    >
                                                        + Deploy
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Free Riggers */}
                            <div className="roster-column-card">
                                <div className="roster-column-header">
                                    <h3>🪢 Free Riggers Pool ({availablePool.riggers?.length || 0})</h3>
                                </div>
                                <div className="roster-item-list">
                                    {availablePool.riggers?.length === 0 ? (
                                        <div className="empty-state-box" style={{ padding: '20px' }}>All riggers are currently deployed to sites!</div>
                                    ) : (
                                        availablePool.riggers?.map(r => (
                                            <div key={r.emp_id} className="roster-item-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                                                <div className="roster-item-details">
                                                    <span className="roster-item-title">{r.first_name} {r.last_name || ''}</span>
                                                    <span className="roster-item-sub">📞 {r.contact_no || 'No contact'}</span>
                                                </div>
                                                {canManage && (
                                                    <button
                                                        className="btn-mini-transfer"
                                                        style={{ background: '#ffb41d', color: '#0f172a' }}
                                                        onClick={() => setShowDeployModal(true)}
                                                    >
                                                        + Deploy
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modals */}
                    {showDeployModal && (
                        <DeployResourceModal
                            siteId={selectedSiteId}
                            sites={sites}
                            closeModal={() => setShowDeployModal(false)}
                            refreshData={refreshAll}
                        />
                    )}

                    {showGangModal && (
                        <FormGangModal
                            siteRoster={siteRoster}
                            closeModal={() => setShowGangModal(false)}
                            refreshData={refreshAll}
                        />
                    )}

                    {showTransferModal && (
                        <TransferModal
                            resourceItem={resourceToTransfer}
                            currentSite={siteRoster?.site}
                            allSites={sites}
                            closeModal={() => {
                                setShowTransferModal(false);
                                setResourceToTransfer(null);
                            }}
                            refreshData={refreshAll}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default Assignments;
