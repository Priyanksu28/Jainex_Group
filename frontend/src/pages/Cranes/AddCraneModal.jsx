import { useState } from 'react';
import API from '../../api/axios';
import './AddCraneModal.css';

const AddCraneModal = ({ closeModal, refreshData }) => {
    const [formData, setFormData] = useState({
        owner_name: '', reg_no: '', crane_type: '', engine_no: '',
        chassis_no: '', serial_no: '', model: '', mfg_year: '', capacity: ''
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Prepare Multipart Form Data
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (file) data.append('crane_image', file);

        try {
            await API.post('/cranes/add', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Crane Added Successfully!");
            refreshData();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Error adding crane");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Add New Crane</h3>
                    <button type="button" className="modal-close-btn" onClick={closeModal} aria-label="Close">×</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-grid">
                        <input name="owner_name" placeholder="Owner Name" onChange={handleChange} required />
                        <input name="reg_no" placeholder="Registration No" onChange={handleChange} required />
                        <input name="crane_type" placeholder="Crane Type (e.g. Tyre Mounted)" onChange={handleChange} required />
                        <input name="engine_no" placeholder="Engine No" onChange={handleChange} />
                        <input name="chassis_no" placeholder="Chassis No" onChange={handleChange} />
                        <input name="serial_no" placeholder="Serial No" onChange={handleChange} required />
                        <input name="model" placeholder="Model (e.g. SANY STC600)" onChange={handleChange} required />
                        <input name="mfg_year" type="number" placeholder="Mfg Year" onChange={handleChange} />
                        <input name="capacity" placeholder="Capacity (e.g. 60 TON)" onChange={handleChange} required />
                        <div className="file-input">
                            <label>Crane Photo:</label>
                            <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={closeModal} className="btn-cancel">Cancel</button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? "Saving..." : "Add Crane"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCraneModal;