import { useState, useRef } from 'react';
import API from '../../api/axios';
import './AddOperatorModal.css';

const AddOperatorModal = ({ closeModal, refreshData }) => {
    const [loading, setLoading] = useState(false);
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [sameAddress, setSameAddress] = useState(false);
    const fileInputRef = useRef(null);

    const [personal, setPersonal] = useState({
        first_name: '',
        last_name: '',
        father_husband_name: '',
        dob: '',
        gender: 'Male',
        marital_status: 'Single',
        designation: 'Crane Operator',
        joining_date: '',
        unit_name: '',
        contact_no: '',
        email: '',
        present_address: '',
        permanent_address: '',
        aadhar_no: '',
        pan_no: '',
        pf_no: '',
        esic_no: '',
        uan_no: '',
        bank_name: '',
        bank_ifsc: '',
        bank_account_no: '',
        bank_address: ''
    });

    const [family, setFamily] = useState([
        { member_name: '', relationship: '', dob: '', aadhar_card_no: '' }
    ]);
    const [nominees, setNominees] = useState([
        { nominee_name: '', age: '', relationship: '', nominee_address: '' }
    ]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleRemovePhoto = () => {
        setPhoto(null);
        setPhotoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handlePresentAddressChange = (e) => {
        const val = e.target.value;
        setPersonal(prev => ({
            ...prev,
            present_address: val,
            permanent_address: sameAddress ? val : prev.permanent_address
        }));
    };

    const handleSameAddressToggle = (e) => {
        const checked = e.target.checked;
        setSameAddress(checked);
        if (checked) {
            setPersonal(prev => ({ ...prev, permanent_address: prev.present_address }));
        }
    };

    // Handlers for dynamic family rows
    const addFamilyRow = () => {
        setFamily([...family, { member_name: '', relationship: '', dob: '', aadhar_card_no: '' }]);
    };

    const removeFamilyRow = (index) => {
        if (family.length === 1) {
            setFamily([{ member_name: '', relationship: '', dob: '', aadhar_card_no: '' }]);
        } else {
            setFamily(family.filter((_, i) => i !== index));
        }
    };

    // Handlers for dynamic nominee rows
    const addNomineeRow = () => {
        setNominees([...nominees, { nominee_name: '', age: '', relationship: '', nominee_address: '' }]);
    };

    const removeNomineeRow = (index) => {
        if (nominees.length === 1) {
            setNominees([{ nominee_name: '', age: '', relationship: '', nominee_address: '' }]);
        } else {
            setNominees(nominees.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Filter out empty rows
            const validFamily = family.filter(f => f.member_name.trim() !== '');
            const validNominees = nominees.filter(n => n.nominee_name.trim() !== '');

            const formData = new FormData();
            Object.keys(personal).forEach(key => {
                if (personal[key] !== null && personal[key] !== undefined) {
                    formData.append(key, personal[key]);
                }
            });

            if (photo) {
                formData.append('photo', photo);
            }

            formData.append('family_members', JSON.stringify(validFamily));
            formData.append('nominees', JSON.stringify(validNominees));

            await API.post('/operators/add', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            alert("Operator Registered Successfully with Declaration details!");
            refreshData();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data?.error || "Error saving operator");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="operator-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <div className="operator-modal-content">
                <div className="operator-modal-header">
                    <div>
                        <h2>Declaration Form (Employee Details)</h2>
                        <span className="modal-subtitle">Professional HR Services Pvt. Ltd. &bull; Operator Registration</span>
                    </div>
                    <button type="button" className="op-close-btn" onClick={closeModal} aria-label="Close modal">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="operator-form">
                    <div className="operator-scroll-body">
                        {/* Photo Upload Card */}
                        <div className="op-photo-upload-container">
                            <div className="op-photo-preview-box">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Operator preview" className="op-photo-img" />
                                ) : (
                                    <div className="op-photo-placeholder">
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        <span>Affix Photo</span>
                                    </div>
                                )}
                            </div>
                            <div className="op-photo-controls">
                                <label className="op-upload-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                    {photo ? "Change Photo" : "Upload Operator Photo"}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        accept="image/*" 
                                        onChange={handlePhotoChange} 
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                {photo && (
                                    <button type="button" className="op-remove-photo-btn" onClick={handleRemovePhoto}>
                                        Remove Photo
                                    </button>
                                )}
                                <span className="op-photo-hint">Accepted formats: JPG, PNG, WEBP. Max size: 5MB.</span>
                            </div>
                        </div>

                        {/* Section 1: Basic & Personal Details */}
                        <div className="op-section">
                            <div className="op-section-header">
                                <div className="op-section-title-wrap">
                                    <span className="op-section-badge">1</span>
                                    <h3>Personal Details</h3>
                                </div>
                            </div>
                            <div className="op-grid-3">
                                <div className="op-field">
                                    <label>First Name <span className="req">*</span></label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Jintu" 
                                        required 
                                        value={personal.first_name}
                                        onChange={(e) => setPersonal({ ...personal, first_name: e.target.value })}
                                    />
                                </div>
                                <div className="op-field">
                                    <label>Last Name <span className="req">*</span></label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Nath" 
                                        required 
                                        value={personal.last_name}
                                        onChange={(e) => setPersonal({ ...personal, last_name: e.target.value })}
                                    />
                                </div>
                                <div className="op-field">
                                    <label>Father's / Husband Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Aniram Nath" 
                                        value={personal.father_husband_name}
                                        onChange={(e) => setPersonal({ ...personal, father_husband_name: e.target.value })}
                                    />
                                </div>
                                <div className="op-field">
                                    <label>Date of Birth (DD/MM/YYYY)</label>
                                    <input 
                                        type="date" 
                                        value={personal.dob}
                                        onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
                                    />
                                </div>
                                <div className="op-field">
                                    <label>Gender</label>
                                    <select 
                                        value={personal.gender}
                                        onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="op-field">
                                    <label>Marital Status</label>
                                    <select 
                                        value={personal.marital_status}
                                        onChange={(e) => setPersonal({ ...personal, marital_status: e.target.value })}
                                    >
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Divorced">Divorced</option>
                                        <option value="Widowed">Widowed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Employment Details */}
                        <div className="op-section">
                            <div className="op-section-header">
                                <div className="op-section-title-wrap">
                                    <span className="op-section-badge">2</span>
                                    <h3>Employment & Work Info</h3>
                                </div>
                            </div>
                            <div className="op-grid-3">
                                <div className="op-field">
                                    <label>Designation (DEG)</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Crane Operator" 
                                        value={personal.designation}
                                        onChange={(e) => setPersonal({ ...personal, designation: e.target.value })}
                                    />
                                </div>
                                <div className="op-field">
                                    <label>Date of Joining (D.O.J)</label>
                                    <input 
                                        type="date" 
                                        value={personal.joining_date}
                                        onChange={(e) => setPersonal({ ...personal, joining_date: e.target.value })}
                                    />
                                </div>
                                <div className="op-field">
                                    <label>Unit Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Guwahati Unit 1" 
                                        value={personal.unit_name}
                                        onChange={(e) => setPersonal({ ...personal, unit_name: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Contact Details */}
                        <div className="op-section">
                            <div className="op-section-header">
                                <div className="op-section-title-wrap">
                                    <span className="op-section-badge">3</span>
                                    <h3>Contact Information</h3>
                                </div>
                            </div>
                            <div className="op-grid-2">
                                <div className="op-field">
                                    <label>Mobile Number <span className="req">*</span></label>
                                    <input 
                                        type="tel" 
                                        placeholder="e.g. 8486240957" 
                                        required 
                                        value={personal.contact_no}
                                        onChange={(e) => setPersonal({ ...personal, contact_no: e.target.value })}
                                    />
                                </div>
                                <div className="op-field">
                                    <label>Email ID</label>
                                    <input 
                                        type="email" 
                                        placeholder="e.g. jintunath07577@gmail.com" 
                                        value={personal.email}
                                        onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Address Details */}
                        <div className="op-section">
                            <div className="op-section-header">
                                <div className="op-section-title-wrap">
                                    <span className="op-section-badge">4</span>
                                    <h3>Address Information</h3>
                                </div>
                            </div>
                            <div className="op-grid-2">
                                <div className="op-field span-2">
                                    <label>Present Address</label>
                                    <textarea 
                                        placeholder="Enter present address (state, city, Pin Code)..." 
                                        value={personal.present_address}
                                        onChange={handlePresentAddressChange}
                                        rows="2"
                                    ></textarea>
                                </div>
                                <div className="op-field span-2">
                                    <div className="op-checkbox-wrap">
                                        <input 
                                            type="checkbox" 
                                            id="sameAddrCheck" 
                                            checked={sameAddress} 
                                            onChange={handleSameAddressToggle} 
                                        />
                                        <label htmlFor="sameAddrCheck">Permanent Address is same as Present Address</label>
                                    </div>
                                </div>
                                <div className="op-field span-2">
                                    <label>Permanent Address (in state, city, Pin Code)</label>
                                    <textarea 
                                        placeholder="Enter permanent address (state, city, Pin Code)..." 
                                        value={personal.permanent_address}
                                        disabled={sameAddress}
                                        onChange={(e) => setPersonal({ ...personal, permanent_address: e.target.value })}
                                        rows="2"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Section 5: Statutory & Identity Details */}
                        <div className="op-section">
                            <div className="op-section-header">
                                <div className="op-section-title-wrap">
                                    <span className="op-section-badge">5</span>
                                    <h3>Statutory & Identity Details</h3>
                                </div>
                            </div>
                            <div className="op-grid-3">
                                <div className="op-field">
                                    <label>Adhar Card No</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. 4429 3558 6695" 
                                        value={personal.aadhar_no}
                                        onChange={(e) => setPersonal({ ...personal, aadhar_no: e.target.value })}
                                    />
                                </div>
                                <div className="op-field">
                                    <label>PAN NO</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. ATQPN8334H" 
                                        value={personal.pan_no}
                                        onChange={(e) => setPersonal({ ...personal, pan_no: e.target.value })}
                                    />
                                </div>
                                <div className="op-field">
                                    <label>PF NO</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. PF12345" 
                                        value={personal.pf_no}
                                        onChange={(e) => setPersonal({ ...personal, pf_no: e.target.value })}
                                    />
                                </div>
                                <div className="op-field">
                                    <label>ESIC NO</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. ESIC9876" 
                                        value={personal.esic_no}
                                        onChange={(e) => setPersonal({ ...personal, esic_no: e.target.value })}
                                    />
                                </div>
                                <div className="op-field span-2">
                                    <label>UAN NO</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. 101234567890" 
                                        value={personal.uan_no}
                                        onChange={(e) => setPersonal({ ...personal, uan_no: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 6: Bank Account Details */}
                        <div className="op-section">
                            <div className="op-section-header">
                                <div className="op-section-title-wrap">
                                    <span className="op-section-badge">6</span>
                                    <h3>Bank Account Details</h3>
                                </div>
                            </div>
                            <div className="op-grid-3">
                                <div className="op-field">
                                    <label>Bank Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. State Bank of India" 
                                        value={personal.bank_name}
                                        onChange={(e) => setPersonal({ ...personal, bank_name: e.target.value })}
                                    />
                                </div>
                                <div className="op-field">
                                    <label>Account No / Bank Account No</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. 32446090014" 
                                        value={personal.bank_account_no}
                                        onChange={(e) => setPersonal({ ...personal, bank_account_no: e.target.value })}
                                    />
                                </div>
                                <div className="op-field">
                                    <label>IFSC Code</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. SBIN0006309" 
                                        value={personal.bank_ifsc}
                                        onChange={(e) => setPersonal({ ...personal, bank_ifsc: e.target.value })}
                                    />
                                </div>
                                <div className="op-field span-3">
                                    <label>Bank Address</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Morigaon, Assam" 
                                        value={personal.bank_address}
                                        onChange={(e) => setPersonal({ ...personal, bank_address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 7: Nominee Details */}
                        <div className="op-section">
                            <div className="op-section-header">
                                <div className="op-section-title-wrap">
                                    <span className="op-section-badge">7</span>
                                    <h3>Nominee Details</h3>
                                </div>
                                <button type="button" onClick={addNomineeRow} className="btn-add-item">
                                    + Add Nominee
                                </button>
                            </div>
                            {nominees.map((nom, i) => (
                                <div key={i} className="op-row-item nominee-item-grid">
                                    <div className="op-field">
                                        <label>Nominee Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="Full Name" 
                                            value={nom.nominee_name}
                                            onChange={(e) => {
                                                const newNom = [...nominees];
                                                newNom[i].nominee_name = e.target.value;
                                                setNominees(newNom);
                                            }}
                                        />
                                    </div>
                                    <div className="op-field field-small">
                                        <label>Age</label>
                                        <input 
                                            type="number" 
                                            placeholder="e.g. 35" 
                                            min="1"
                                            max="120"
                                            value={nom.age}
                                            onChange={(e) => {
                                                const newNom = [...nominees];
                                                newNom[i].age = e.target.value;
                                                setNominees(newNom);
                                            }}
                                        />
                                    </div>
                                    <div className="op-field">
                                        <label>Relationship</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Wife / Son" 
                                            value={nom.relationship}
                                            onChange={(e) => {
                                                const newNom = [...nominees];
                                                newNom[i].relationship = e.target.value;
                                                setNominees(newNom);
                                            }}
                                        />
                                    </div>
                                    <div className="op-field field-large">
                                        <label>Nominee Address</label>
                                        <input 
                                            type="text" 
                                            placeholder="Nominee resident address" 
                                            value={nom.nominee_address}
                                            onChange={(e) => {
                                                const newNom = [...nominees];
                                                newNom[i].nominee_address = e.target.value;
                                                setNominees(newNom);
                                            }}
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        className="btn-remove-row" 
                                        onClick={() => removeNomineeRow(i)} 
                                        title="Remove nominee"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Section 8: Family Details */}
                        <div className="op-section">
                            <div className="op-section-header">
                                <div className="op-section-title-wrap">
                                    <span className="op-section-badge">8</span>
                                    <div>
                                        <h3>Family Details</h3>
                                        <span className="op-section-hint">(only spouse, children, and parents if depend on you)</span>
                                    </div>
                                </div>
                                <button type="button" onClick={addFamilyRow} className="btn-add-item">
                                    + Add Member
                                </button>
                            </div>
                            {family.map((member, i) => (
                                <div key={i} className="op-row-item family-item-grid">
                                    <div className="op-field">
                                        <label>Member Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="Full Name" 
                                            value={member.member_name}
                                            onChange={(e) => {
                                                const newFam = [...family];
                                                newFam[i].member_name = e.target.value;
                                                setFamily(newFam);
                                            }}
                                        />
                                    </div>
                                    <div className="op-field">
                                        <label>Relationship</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Spouse / Son" 
                                            value={member.relationship}
                                            onChange={(e) => {
                                                const newFam = [...family];
                                                newFam[i].relationship = e.target.value;
                                                setFamily(newFam);
                                            }}
                                        />
                                    </div>
                                    <div className="op-field">
                                        <label>Date of Birth / Year</label>
                                        <input 
                                            type="date" 
                                            value={member.dob}
                                            onChange={(e) => {
                                                const newFam = [...family];
                                                newFam[i].dob = e.target.value;
                                                setFamily(newFam);
                                            }}
                                        />
                                    </div>
                                    <div className="op-field">
                                        <label>ADHAR CARD NO</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. 1234 5678 9012" 
                                            value={member.aadhar_card_no}
                                            onChange={(e) => {
                                                const newFam = [...family];
                                                newFam[i].aadhar_card_no = e.target.value;
                                                setFamily(newFam);
                                            }}
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        className="btn-remove-row" 
                                        onClick={() => removeFamilyRow(i)} 
                                        title="Remove member"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="operator-modal-footer">
                        <button type="button" onClick={closeModal} className="op-btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="op-btn-submit" disabled={loading}>
                            {loading ? "Saving Declaration..." : "Save Operator Details"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddOperatorModal;