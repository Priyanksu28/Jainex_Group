import { useState, useEffect } from 'react';
import API from '../../api/axios';
import './DeployResourceModal.css';

const DeployResourceModal = ({ siteId, sites = [], closeModal, refreshData }) => {
    const [selectedSiteId, setSelectedSiteId] = useState(siteId || (sites[0]?.id || ''));
    const [resourceType, setResourceType] = useState('Crane');
    const [resourceId, setResourceId] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState('');
    const [remarks, setRemarks] = useState('');
    
    const [pool, setPool] = useState({ cranes: [], operators: [], riggers: [] });
    const [loadingPool, setLoadingPool] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPool = async () => {
            try {
                setLoadingPool(true);
                const res = await API.get('/assignments/available-pool');
                setPool(res.data || { cranes: [], operators: [], riggers: [] });
            } catch (err) {
                console.error('Error fetching available pool:', err);
                setError('Failed to fetch available free resources.');
            } finally {
                setLoadingPool(false);
            }
        };
        fetchPool();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!selectedSiteId) {
            setError('Please select a target site.');
            return;
        }

        if (!resourceId) {
            setError(`Please select a ${resourceType} to deploy.`);
            return;
        }

        setSubmitting(true);
        try {
            await API.post('/assignments/deploy', {
                site_id: selectedSiteId,
                resource_type: resourceType,
                resource_id: resourceId,
                start_date: startDate,
                end_date: endDate || null,
                remarks
            });
            alert(`${resourceType} deployed to site successfully!`);
            refreshData();
            closeModal();
        } catch (err) {
            console.error('Error deploying resource:', err);
            setError(err.response?.data?.error || 'Failed to deploy resource.');
        } finally {
            setSubmitting(false);
        }
    };

    const getAvailableItems = () => {
        if (resourceType === 'Crane') return pool.cranes;
        if (resourceType === 'Operator') return pool.operators;
        if (resourceType === 'Rigger') return pool.riggers;
        return [];
    };

    const availableItems = getAvailableItems();

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <div className="modal-content deploy-modal">
                <div className="modal-header">
                    <h3>Deploy Resource to Site</h3>
                    <button type="button" className="modal-close-btn" onClick={closeModal} aria-label="Close">×</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {error && (
                        <div style={{
                            padding: '10px 14px',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '8px',
                            fontSize: '0.88rem',
                            fontWeight: '600'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="form-field">
                        <label>Target Site <span className="required">*</span></label>
                        <select
                            value={selectedSiteId}
                            onChange={(e) => setSelectedSiteId(e.target.value)}
                            required
                        >
                            <option value="" disabled>Select Target Site</option>
                            {sites.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.site_name} ({s.site_code || `SITE-${s.id}`})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Resource Type <span className="required">*</span></label>
                        <div className="resource-type-tabs">
                            <button
                                type="button"
                                className={`resource-tab-btn ${resourceType === 'Crane' ? 'active' : ''}`}
                                onClick={() => { setResourceType('Crane'); setResourceId(''); }}
                            >
                                🏗️ Crane
                            </button>
                            <button
                                type="button"
                                className={`resource-tab-btn ${resourceType === 'Operator' ? 'active' : ''}`}
                                onClick={() => { setResourceType('Operator'); setResourceId(''); }}
                            >
                                👷 Operator
                            </button>
                            <button
                                type="button"
                                className={`resource-tab-btn ${resourceType === 'Rigger' ? 'active' : ''}`}
                                onClick={() => { setResourceType('Rigger'); setResourceId(''); }}
                            >
                                🪢 Rigger
                            </button>
                        </div>
                    </div>

                    <div className="form-field">
                        <label>
                            Select Available {resourceType} <span className="required">*</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '6px' }}>
                                ({availableItems.length} available in pool)
                            </span>
                        </label>
                        <select
                            value={resourceId}
                            onChange={(e) => setResourceId(e.target.value)}
                            required
                            disabled={loadingPool || availableItems.length === 0}
                        >
                            <option value="">
                                {loadingPool
                                    ? 'Loading available resources...'
                                    : availableItems.length === 0
                                    ? `No free ${resourceType.toLowerCase()}s in pool`
                                    : `-- Choose ${resourceType} --`}
                            </option>
                            {availableItems.map(item => {
                                if (resourceType === 'Crane') {
                                    return (
                                        <option key={item.id} value={item.id}>
                                            {item.model} (Reg: {item.reg_no}) - Cap: {item.capacity}
                                        </option>
                                    );
                                }
                                return (
                                    <option key={item.emp_id} value={item.emp_id}>
                                        {item.first_name} {item.last_name || ''} ({item.designation}) {item.contact_no ? `- 📞 ${item.contact_no}` : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="form-grid">
                        <div className="form-field">
                            <label>Mobilization / Start Date <span className="required">*</span></label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label>Expected End Date (Optional)</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Remarks / Work Order Notes</label>
                        <textarea
                            placeholder="e.g. Deployed for Girder erection work shift A"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows="2"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={closeModal} className="btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={submitting || availableItems.length === 0}>
                            {submitting ? 'Deploying...' : `Deploy ${resourceType}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeployResourceModal;
