import { useState, useEffect } from 'react';
import API from '../../api/axios';
import './ViewRiggerModal.css';

const ViewRiggerModal = ({ rigger, closeModal }) => {
    const [fullData, setFullData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!rigger?.emp_id) return;
            try {
                const res = await API.get(`/riggers/details/${rigger.emp_id}`);
                setFullData(res.data);
            } catch (err) {
                console.error("Error fetching rigger details", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [rigger]);

    if (!rigger) return null;

    const details = fullData?.details || rigger;
    const family = fullData?.family || [];
    const nominees = fullData?.nominees || [];

    const initials = `${details.first_name?.[0] || ''}${details.last_name?.[0] || ''}`.toUpperCase();
    const baseURL = "http://localhost:8000";
    const photoUrl = details.photo ? `${baseURL}${details.photo}` : null;

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
    };

    return (
        <div className="view-rig-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <div className="view-rig-content">
                <div className="view-rig-header">
                    <div>
                        <h2>Rigger Details - {`RIG-${String(rigger.index != null ? rigger.index + 1 : rigger.emp_id).padStart(3, '0')}`}</h2>
                        <span className="view-rig-subtitle">Employee Declaration Record &bull; Professional HR Services Pvt. Ltd.</span>
                    </div>
                    <button type="button" className="view-rig-close-btn" onClick={closeModal} aria-label="Close">
                        &times;
                    </button>
                </div>

                <div className="view-rig-body">
                    {loading ? (
                        <div className="view-rig-loading">Loading rigger records...</div>
                    ) : (
                        <>
                            {/* Profile Header Banner */}
                            <div className="view-rig-profile-card">
                                <div className="view-rig-profile-info">
                                    <div className="view-rig-avatar">
                                        {photoUrl ? (
                                            <img src={photoUrl} alt={`${details.first_name} ${details.last_name}`} className="view-rig-avatar-img" />
                                        ) : (
                                            <span>{initials}</span>
                                        )}
                                    </div>
                                    <div className="view-rig-title">
                                        <h3>{`${details.first_name || ''} ${details.last_name || ''}`.trim()}</h3>
                                        <span>{details.designation || 'Rigger'} &bull; ID: RIG-{String(rigger.index != null ? rigger.index + 1 : details.emp_id).padStart(3, '0')}</span>
                                        {details.unit_name && <span className="unit-badge">Unit: {details.unit_name}</span>}
                                    </div>
                                </div>
                                <div className={`rig-status-badge ${(details.status || 'Active').toLowerCase()}`}>
                                    {details.status || 'Active'}
                                </div>
                            </div>

                            {/* Section 1: Personal & Employment Information */}
                            <div className="view-rig-section">
                                <div className="view-rig-section-header">
                                    <h4>Personal & Employment Information</h4>
                                </div>
                                <div className="view-rig-grid">
                                    <div className="view-rig-item">
                                        <label>Full Name</label>
                                        <p>{`${details.first_name || ''} ${details.last_name || ''}`.trim() || 'N/A'}</p>
                                    </div>
                                    <div className="view-rig-item">
                                        <label>Father's / Husband Name</label>
                                        <p>{details.father_husband_name || 'N/A'}</p>
                                    </div>
                                    <div className="view-rig-item">
                                        <label>Date of Birth</label>
                                        <p>{formatDate(details.dob)}</p>
                                    </div>
                                    <div className="view-rig-item">
                                        <label>Gender</label>
                                        <p>{details.gender || 'N/A'}</p>
                                    </div>
                                    <div className="view-rig-item">
                                        <label>Marital Status</label>
                                        <p>{details.marital_status || 'N/A'}</p>
                                    </div>
                                    <div className="view-rig-item">
                                        <label>Designation (DEG)</label>
                                        <p>{details.designation || 'Rigger'}</p>
                                    </div>
                                    <div className="view-rig-item">
                                        <label>Date of Joining (D.O.J)</label>
                                        <p>{formatDate(details.joining_date)}</p>
                                    </div>
                                    <div className="view-rig-item">
                                        <label>Unit Name</label>
                                        <p>{details.unit_name || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Contact & Address Details */}
                            <div className="view-rig-section">
                                <div className="view-rig-section-header">
                                    <h4>Contact & Address Details</h4>
                                </div>
                                <div className="view-rig-grid">
                                    <div className="view-rig-item">
                                        <label>Mobile Number</label>
                                        <p>{details.contact_no || 'N/A'}</p>
                                    </div>
                                    <div className="view-rig-item span-2">
                                        <label>Email Address</label>
                                        <p>{details.email || 'N/A'}</p>
                                    </div>
                                    <div className="view-rig-item span-3">
                                        <label>Present Address</label>
                                        <p>{details.present_address || 'N/A'}</p>
                                    </div>
                                    <div className="view-rig-item span-3">
                                        <label>Permanent Address</label>
                                        <p>{details.permanent_address || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Statutory & Identity Details */}
                            <div className="view-rig-section">
                                <div className="view-rig-section-header">
                                    <h4>Statutory & Identity Details</h4>
                                </div>
                                <div className="view-rig-grid">
                                    <div className="view-rig-item">
                                        <label>Adhar Card No</label>
                                        <p>{details.aadhar_no || 'N/A'}</p>
                                    </div>
                                    <div className="view-rig-item">
                                        <label>PAN NO</label>
                                        <p>{details.pan_no || 'N/A'}</p>
                                    </div>
                                    <div className="view-rig-item">
                                        <label>PF NO</label>
                                        <p>{details.pf_no || 'N/A'}</p>
                                    </div>
                                    <div className="view-rig-item">
                                        <label>ESIC NO</label>
                                        <p>{details.esic_no || 'N/A'}</p>
                                    </div>
                                    <div className="view-rig-item span-2">
                                        <label>UAN NO</label>
                                        <p>{details.uan_no || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Bank Account Details */}
                            <div className="view-rig-section">
                                <div className="view-rig-section-header">
                                    <h4>Bank Account Information</h4>
                                </div>
                                <div className="view-rig-grid">
                                    <div className="view-rig-item">
                                        <label>Bank Name</label>
                                        <p>{details.bank_name || 'N/A'}</p>
                                    </div>
                                    <div className="view-rig-item">
                                        <label>Account No / Bank Account No</label>
                                        <p>{details.bank_account_no || 'N/A'}</p>
                                    </div>
                                    <div className="view-rig-item">
                                        <label>IFSC Code</label>
                                        <p>{details.bank_ifsc || 'N/A'}</p>
                                    </div>
                                    <div className="view-rig-item span-3">
                                        <label>Bank Address</label>
                                        <p>{details.bank_address || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Nominee Details */}
                            <div className="view-rig-section">
                                <div className="view-rig-section-header">
                                    <h4>Nominee Details ({nominees.length})</h4>
                                </div>
                                {nominees.length === 0 ? (
                                    <p className="view-rig-empty">No nominees registered.</p>
                                ) : (
                                    <table className="view-rig-table">
                                        <thead>
                                            <tr>
                                                <th>Nominee Name</th>
                                                <th>Age</th>
                                                <th>Relationship</th>
                                                <th>Nominee Address</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {nominees.map((nom, i) => (
                                                <tr key={nom.id || i}>
                                                    <td style={{ fontWeight: 600 }}>{nom.nominee_name}</td>
                                                    <td>{nom.age || 'N/A'}</td>
                                                    <td>{nom.relationship || 'N/A'}</td>
                                                    <td>{nom.nominee_address || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Section 6: Family Details */}
                            <div className="view-rig-section">
                                <div className="view-rig-section-header">
                                    <h4>Family Details ({family.length})</h4>
                                </div>
                                {family.length === 0 ? (
                                    <p className="view-rig-empty">No family members registered.</p>
                                ) : (
                                    <table className="view-rig-table">
                                        <thead>
                                            <tr>
                                                <th>Member Name</th>
                                                <th>Relationship</th>
                                                <th>Date of Birth / Year</th>
                                                <th>ADHAR CARD NO</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {family.map((member, i) => (
                                                <tr key={member.id || i}>
                                                    <td style={{ fontWeight: 600 }}>{member.member_name}</td>
                                                    <td>{member.relationship || 'N/A'}</td>
                                                    <td>{formatDate(member.dob)}</td>
                                                    <td>{member.aadhar_card_no || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="view-rig-footer">
                    <button type="button" className="btn-close-view-rig" onClick={closeModal}>
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewRiggerModal;
