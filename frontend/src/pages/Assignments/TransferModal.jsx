import { useState } from 'react';
import API from '../../api/axios';
import './TransferModal.css';

const TransferModal = ({ resourceItem, currentSite, allSites = [], closeModal, refreshData }) => {
    const [targetSiteId, setTargetSiteId] = useState('');
    const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const otherSites = allSites.filter(s => s.id !== currentSite?.id);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!targetSiteId) {
            setError('Please select a target site to transfer to.');
            return;
        }

        setSubmitting(true);
        try {
            await API.post('/assignments/transfer', {
                deploymentId: resourceItem.id,
                newSiteId: targetSiteId,
                transferDate,
                remarks
            });
            alert(`${resourceItem.resource_type} transferred successfully!`);
            refreshData();
            closeModal();
        } catch (err) {
            console.error('Error transferring resource:', err);
            setError(err.response?.data?.error || 'Failed to transfer resource.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <div className="modal-content transfer-modal">
                <div className="modal-header">
                    <h3>Transfer {resourceItem.resource_type}</h3>
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

                    <div style={{
                        background: '#f8fafc',
                        padding: '14px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                    }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                            Resource to Move
                        </span>
                        <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                            {resourceItem.resource_name} ({resourceItem.resource_subtitle || resourceItem.resource_type})
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: '600' }}>
                            Current Site: {currentSite?.site_name}
                        </span>
                    </div>

                    <div className="form-field">
                        <label>Transfer Destination (New Site) <span className="required">*</span></label>
                        <select
                            value={targetSiteId}
                            onChange={(e) => setTargetSiteId(e.target.value)}
                            required
                        >
                            <option value="">-- Choose Target Site --</option>
                            {otherSites.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.site_name} ({s.site_code || `SITE-${s.id}`}) - {s.city || 'No city'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Effective Transfer Date <span className="required">*</span></label>
                        <input
                            type="date"
                            value={transferDate}
                            onChange={(e) => setTransferDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label>Transfer Reason / Note</label>
                        <textarea
                            placeholder="e.g. Relocated for priority phase 2 lifting"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows="2"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={closeModal} className="btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={submitting}>
                            {submitting ? 'Transferring...' : '🚀 Confirm Transfer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransferModal;
