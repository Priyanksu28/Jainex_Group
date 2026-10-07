import { useState, useEffect } from 'react';
import API from '../../api/axios';
import './AddSiteModal.css';

const AddSiteModal = ({ closeModal, refreshData, siteToEdit = null }) => {
    const isEditMode = Boolean(siteToEdit);

    const [formData, setFormData] = useState({
        site_code: '',
        site_name: '',
        client_name: '',
        location: '',
        city: '',
        state: '',
        pincode: '',
        site_incharge_name: '',
        start_date: '',
        end_date: '',
        status: 'Active'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (siteToEdit) {
            setFormData({
                site_code: siteToEdit.site_code || '',
                site_name: siteToEdit.site_name || '',
                client_name: siteToEdit.client_name || '',
                location: siteToEdit.location || '',
                city: siteToEdit.city || '',
                state: siteToEdit.state || '',
                pincode: siteToEdit.pincode || '',
                site_incharge_name: siteToEdit.site_incharge_name || '',
                start_date: siteToEdit.start_date ? siteToEdit.start_date.slice(0, 10) : '',
                end_date: siteToEdit.end_date ? siteToEdit.end_date.slice(0, 10) : '',
                status: siteToEdit.status || 'Active'
            });
        } else {
            // Auto-fetch next generated site code
            const fetchNextCode = async () => {
                try {
                    const res = await API.get('/sites/next-code');
                    if (res.data?.nextCode) {
                        setFormData(prev => ({ ...prev, site_code: res.data.nextCode }));
                    }
                } catch (err) {
                    console.error('Could not pre-fetch next site code', err);
                }
            };
            fetchNextCode();
        }
    }, [siteToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.site_name.trim()) {
            setError('Please enter the Site Name.');
            return;
        }

        setLoading(true);

        try {
            if (isEditMode) {
                await API.put(`/sites/${siteToEdit.id}`, formData);
            } else {
                await API.post('/sites/add', formData);
            }

            if (refreshData) {
                await refreshData();
            }
            closeModal();
            alert(isEditMode ? 'Site details updated successfully!' : 'Site created successfully!');
        } catch (err) {
            console.error('Error saving site:', err);
            setError(err.response?.data?.error || 'Failed to save site. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{isEditMode ? 'Edit Site Details' : 'Add New Site'}</h3>
                    <button type="button" className="modal-close-btn" onClick={closeModal} aria-label="Close modal">×</button>
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

                    <div className="form-grid">
                        <div className="form-field">
                            <label>
                                Site Code <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 'normal' }}>(Auto-Generated)</span>
                            </label>
                            <input
                                name="site_code"
                                placeholder="e.g. SITE-001"
                                value={formData.site_code}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>Site Name <span className="required">*</span></label>
                            <input
                                name="site_name"
                                placeholder="e.g. Metro Line 4 Pier Yard"
                                value={formData.site_name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>Client Name</label>
                            <input
                                name="client_name"
                                placeholder="e.g. L&T Construction / Adani Infra"
                                value={formData.client_name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>Site Incharge Name</label>
                            <input
                                name="site_incharge_name"
                                placeholder="e.g. Rajesh Sharma"
                                value={formData.site_incharge_name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field form-group-full">
                            <label>Site Address / Landmark</label>
                            <textarea
                                name="location"
                                placeholder="Detailed address or milestone landmark"
                                value={formData.location}
                                onChange={handleChange}
                                rows="2"
                            />
                        </div>

                        <div className="form-field">
                            <label>City</label>
                            <input
                                name="city"
                                placeholder="e.g. Mumbai"
                                value={formData.city}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>State</label>
                            <input
                                name="state"
                                placeholder="e.g. Maharashtra"
                                value={formData.state}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>Pincode</label>
                            <input
                                name="pincode"
                                placeholder="e.g. 400001"
                                value={formData.pincode}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label>Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={closeModal} className="btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Saving...' : isEditMode ? 'Update Site' : 'Add Site'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSiteModal;
