import { useState } from 'react';
import API from '../../api/axios';
import './FormGangModal.css';

const FormGangModal = ({ siteRoster, closeModal, refreshData }) => {
    const site = siteRoster?.site;
    const cranesAtSite = siteRoster?.cranesAtSite || [];
    const operatorsAtSite = siteRoster?.operatorsAtSite || [];
    const riggersAtSite = siteRoster?.riggersAtSite || [];

    const [craneId, setCraneId] = useState('');
    const [primaryOperatorId, setPrimaryOperatorId] = useState('');
    const [coOperatorId, setCoOperatorId] = useState('');
    const [selectedRiggerIds, setSelectedRiggerIds] = useState([]);
    const [shift, setShift] = useState('General');
    const [assignedDate, setAssignedDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState('');
    
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const toggleRigger = (riggerId) => {
        setSelectedRiggerIds(prev => 
            prev.includes(riggerId) ? prev.filter(id => id !== riggerId) : [...prev, riggerId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!site?.id) {
            setError('No active site selected.');
            return;
        }

        if (!craneId) {
            setError('Please select a Crane.');
            return;
        }

        if (!primaryOperatorId) {
            setError('Please select a Lead Operator.');
            return;
        }

        if (primaryOperatorId === coOperatorId) {
            setError('Primary Operator and Co-Operator cannot be the same person.');
            return;
        }

        setSubmitting(true);
        try {
            await API.post('/assignments/pair-gang', {
                site_id: site.id,
                crane_id: parseInt(craneId),
                primary_operator_id: parseInt(primaryOperatorId),
                co_operator_id: coOperatorId ? parseInt(coOperatorId) : null,
                rigger_ids: selectedRiggerIds,
                shift,
                assigned_date: assignedDate,
                notes
            });
            alert('Crane Crew Gang formed successfully!');
            refreshData();
            closeModal();
        } catch (err) {
            console.error('Error forming crew gang:', err);
            setError(err.response?.data?.error || 'Failed to form crew gang.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <div className="modal-content gang-modal">
                <div className="modal-header">
                    <div>
                        <h3>Form Crane Crew Gang</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                            Site: <strong>{site?.site_name}</strong> ({site?.site_code || `SITE-${site?.id}`})
                        </p>
                    </div>
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
                        <label>
                            Select Crane at this Site <span className="required">*</span>
                        </label>
                        <select
                            value={craneId}
                            onChange={(e) => setCraneId(e.target.value)}
                            required
                        >
                            <option value="">-- Choose Crane ({cranesAtSite.length} deployed) --</option>
                            {cranesAtSite.map(c => (
                                <option key={c.resource_id} value={c.resource_id}>
                                    {c.resource_subtitle || 'Crane'} (Reg: {c.resource_name}) - Cap: {c.capacity || 'N/A'} {c.is_assigned_to_gang ? '⚠️ (Already Operating - will replace)' : '🟢 (Idle/Free)'}
                                </option>
                            ))}
                        </select>
                        {cranesAtSite.length === 0 && (
                            <span style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '4px' }}>
                                No cranes are currently deployed to this site. Deploy a crane first.
                            </span>
                        )}
                    </div>

                    <div className="form-grid">
                        <div className="form-field">
                            <label>Lead / Primary Operator <span className="required">*</span></label>
                            <select
                                value={primaryOperatorId}
                                onChange={(e) => setPrimaryOperatorId(e.target.value)}
                                required
                            >
                                <option value="">-- Choose Operator ({operatorsAtSite.length} at site) --</option>
                                {operatorsAtSite.map(op => (
                                    <option key={op.resource_id} value={op.resource_id}>
                                        {op.resource_name} {op.is_assigned_to_gang ? '(Operating another crane)' : '(Free at site)'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-field">
                            <label>Co-Operator / Reliever (Optional)</label>
                            <select
                                value={coOperatorId}
                                onChange={(e) => setCoOperatorId(e.target.value)}
                            >
                                <option value="">-- None / Single Operator --</option>
                                {operatorsAtSite
                                    .filter(op => op.resource_id !== parseInt(primaryOperatorId))
                                    .map(op => (
                                        <option key={op.resource_id} value={op.resource_id}>
                                            {op.resource_name} {op.is_assigned_to_gang ? '(Busy)' : '(Free)'}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    {/* Riggers Attachment */}
                    <div className="form-field">
                        <label>
                            Attach Riggers / Signalmen ({selectedRiggerIds.length} selected)
                        </label>
                        {riggersAtSite.length === 0 ? (
                            <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.88rem' }}>
                                No riggers deployed at this site. You can still form the gang and attach riggers later.
                            </div>
                        ) : (
                            <div className="rigger-checkbox-list">
                                {riggersAtSite.map(r => {
                                    const isChecked = selectedRiggerIds.includes(r.resource_id);
                                    return (
                                        <label
                                            key={r.resource_id}
                                            className={`rigger-checkbox-item ${isChecked ? 'checked' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleRigger(r.resource_id)}
                                            />
                                            <span>{r.resource_name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="form-grid">
                        <div className="form-field">
                            <label>Assigned Shift</label>
                            <select value={shift} onChange={(e) => setShift(e.target.value)}>
                                <option value="General">General Shift (Day)</option>
                                <option value="Day">Day Shift</option>
                                <option value="Night">Night Shift</option>
                                <option value="24 Hours">24 Hours Rotation</option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label>Gang Assignment Date</label>
                            <input
                                type="date"
                                value={assignedDate}
                                onChange={(e) => setAssignedDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Assignment Notes</label>
                        <input
                            placeholder="e.g. Assigned for Foundation Pile driving"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={closeModal} className="btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={submitting || cranesAtSite.length === 0 || operatorsAtSite.length === 0}>
                            {submitting ? 'Creating...' : '⚡ Form Crew Gang'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormGangModal;
