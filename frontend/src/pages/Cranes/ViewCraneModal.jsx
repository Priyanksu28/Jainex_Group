import { useState, useEffect, useRef } from 'react';
import API from '../../api/axios';
import './ViewCraneModal.css';

const ViewCraneModal = ({ crane, closeModal, refreshData }) => {
    const [status, setStatus] = useState(crane?.status || 'Inactive');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const dropdownRef = useRef(null);

    const statusOptions = ['Working', 'Assigned', 'Maintenance', 'Inactive'];

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!crane) return null;

    const baseURL = "http://localhost:8000"; // Your backend URL
    const craneImgSrc = crane.crane_image ? `${baseURL}${crane.crane_image}` : null;

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleString();
    };

    const handleStatusSelect = async (newStatus) => {
        if (newStatus === status || updating) {
            setDropdownOpen(false);
            return;
        }

        const oldStatus = status;
        setStatus(newStatus);
        setDropdownOpen(false);
        setUpdating(true);

        try {
            await API.patch(`/cranes/status/${crane.id}`, { status: newStatus });
            if (refreshData) {
                refreshData();
            }
        } catch (err) {
            console.error("Error updating status:", err);
            alert(err.response?.data?.error || "Failed to update crane status");
            setStatus(oldStatus); // Revert on failure
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="view-crane-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <div className="view-crane-content">
                <div className="view-crane-header">
                    <h2>Crane Details - {crane.reg_no}</h2>
                    <button type="button" className="view-crane-close-btn" onClick={closeModal} aria-label="Close">
                        &times;
                    </button>
                </div>

                <div className="view-crane-body">
                    {/* Profile Header Banner */}
                    <div className="view-crane-profile-card">
                        <div className="view-crane-profile-info">
                            <div className="view-crane-avatar">
                                {craneImgSrc ? (
                                    <img src={craneImgSrc} alt={crane.model} />
                                ) : (
                                    <span>🏗️</span>
                                )}
                            </div>
                            <div className="view-crane-title">
                                <h3>{crane.model || 'Crane Model'}</h3>
                                <span>Reg No: {crane.reg_no} &bull; {crane.crane_type || 'Fleet'} &bull; {crane.capacity || ''}</span>
                            </div>
                        </div>

                        {/* Interactive Status Dropdown */}
                        <div className="crane-status-dropdown-wrapper" ref={dropdownRef}>
                            <button
                                type="button"
                                className={`crane-status-btn ${status.toLowerCase()} ${dropdownOpen ? 'open' : ''}`}
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                title="Click to change status"
                                disabled={updating}
                            >
                                <span className={`status-dot ${status.toLowerCase()}`}></span>
                                {status}
                                {updating ? (
                                    <span className="status-updating-loader">...</span>
                                ) : (
                                    <span className="status-arrow">&#9662;</span>
                                )}
                            </button>

                            {dropdownOpen && (
                                <div className="crane-status-menu">
                                    {statusOptions.map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            className={`crane-status-option ${opt === status ? 'selected' : ''}`}
                                            onClick={() => handleStatusSelect(opt)}
                                        >
                                            <span className={`status-dot ${opt.toLowerCase()}`}></span>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Small / Compact Crane Image Preview */}
                    {craneImgSrc && (
                        <div className="view-crane-image-box">
                            <img 
                                src={craneImgSrc} 
                                alt={`Crane ${crane.reg_no}`} 
                                className="view-crane-photo"
                            />
                        </div>
                    )}

                    {/* Section 1: General & Registration Details */}
                    <div className="view-crane-section">
                        <div className="view-crane-section-header">
                            <h4>General & Registration Information</h4>
                        </div>
                        <div className="view-crane-grid">
                            <div className="view-crane-item">
                                <label>Owner Name</label>
                                <p>{crane.owner_name || 'N/A'}</p>
                            </div>
                            <div className="view-crane-item">
                                <label>Registration Number</label>
                                <p>{crane.reg_no || 'N/A'}</p>
                            </div>
                            <div className="view-crane-item">
                                <label>Crane Type</label>
                                <p>{crane.crane_type || 'N/A'}</p>
                            </div>
                            <div className="view-crane-item">
                                <label>Model</label>
                                <p>{crane.model || 'N/A'}</p>
                            </div>
                            <div className="view-crane-item">
                                <label>Capacity</label>
                                <p>{crane.capacity || 'N/A'}</p>
                            </div>
                            <div className="view-crane-item">
                                <label>Manufacturing Year</label>
                                <p>{crane.mfg_year || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Technical Specifications & System Info */}
                    <div className="view-crane-section">
                        <div className="view-crane-section-header">
                            <h4>Technical Specifications & Serial Numbers</h4>
                        </div>
                        <div className="view-crane-grid">
                            <div className="view-crane-item">
                                <label>Engine Number</label>
                                <p>{crane.engine_no || 'N/A'}</p>
                            </div>
                            <div className="view-crane-item">
                                <label>Chassis Number</label>
                                <p>{crane.chassis_no || 'N/A'}</p>
                            </div>
                            <div className="view-crane-item">
                                <label>Serial Number</label>
                                <p>{crane.serial_no || 'N/A'}</p>
                            </div>
                            <div className="view-crane-item">
                                <label>Added By</label>
                                <p>{crane.created_by || 'Admin'}</p>
                            </div>
                            <div className="view-crane-item span-2">
                                <label>System Registration Date</label>
                                <p>{formatDate(crane.created_at)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="view-crane-footer">
                    <button type="button" className="btn-close-view-crane" onClick={closeModal}>
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewCraneModal;