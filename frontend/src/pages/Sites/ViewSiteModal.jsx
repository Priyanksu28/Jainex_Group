import { useState } from 'react';
import API from '../../api/axios';
import './ViewSiteModal.css';

const ViewSiteModal = ({ site, closeModal, refreshData, onEditClick }) => {
    const [status, setStatus] = useState(site?.status || 'Active');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    if (!site) return null;

    const handleStatusChange = async (newStatus) => {
        setStatus(newStatus);
        setUpdatingStatus(true);
        try {
            await API.patch(`/sites/status/${site.id}`, { status: newStatus });
            refreshData();
        } catch (err) {
            console.error('Failed to update status', err);
            alert(err.response?.data?.error || 'Failed to update site status');
            setStatus(site.status);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Not Specified';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <div className="modal-content view-site-modal">
                <div className="modal-header">
                    <div className="site-badge-header">
                        <h3>Site Overview</h3>
                    </div>
                    <button type="button" className="modal-close-btn" onClick={closeModal} aria-label="Close modal">×</button>
                </div>

                <div className="view-site-body">
                    <div className="site-hero-card">
                        <div>
                            <div className="hero-code">{site.site_code || `SITE-#${site.id}`}</div>
                            <h2 className="hero-title">{site.site_name}</h2>
                            <div className="hero-client">
                                {site.client_name ? `Client: ${site.client_name}` : 'Internal Project'}
                            </div>
                        </div>
                        <div>
                            <span className={`status-pill ${status.toLowerCase().replace(' ', '-')}`}>
                                {status}
                            </span>
                        </div>
                    </div>

                    {/* Status update box */}
                    <div className="status-change-box">
                        <label>Update Site Status:</label>
                        <select
                            className="status-select"
                            value={status}
                            disabled={updatingStatus}
                            onChange={(e) => handleStatusChange(e.target.value)}
                        >
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="site-details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Site Incharge</span>
                            <span className="detail-value">{site.site_incharge_name || 'Unassigned'}</span>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">City / State</span>
                            <span className="detail-value">
                                {[site.city, site.state].filter(Boolean).join(', ') || 'N/A'}
                            </span>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">Pincode</span>
                            <span className="detail-value">{site.pincode || 'N/A'}</span>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">Created By</span>
                            <span className="detail-value">{site.created_by || 'Admin'}</span>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">Start Date</span>
                            <span className="detail-value">{formatDate(site.start_date)}</span>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">Expected End Date</span>
                            <span className="detail-value">{formatDate(site.end_date)}</span>
                        </div>

                        <div className="detail-item full-width">
                            <span className="detail-label">Full Location / Landmark</span>
                            <span className="detail-value">{site.location || 'No specific address provided.'}</span>
                        </div>

                        <div className="detail-item full-width">
                            <span className="detail-label">Registered Date</span>
                            <span className="detail-value">{formatDate(site.created_at)}</span>
                        </div>
                    </div>
                </div>

                <div className="modal-actions" style={{ padding: '16px 24px' }}>
                    <button type="button" onClick={closeModal} className="btn-cancel">
                        Close
                    </button>
                    {onEditClick && (
                        <button
                            type="button"
                            onClick={() => {
                                closeModal();
                                onEditClick(site);
                            }}
                            className="btn-submit"
                        >
                            Edit Site
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewSiteModal;
