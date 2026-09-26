import { useState, useEffect, useContext } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import AddCraneModal from './AddCraneModal';
import ViewCraneModal from './ViewCraneModal'; // Import the new modal
import Sidebar from '../../components/Sidebar/Sidebar';
import './Cranes.css';

const Cranes = () => {
    const { user } = useContext(AuthContext);
    const [cranes, setCranes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false); // State for View Modal
    const [selectedCrane, setSelectedCrane] = useState(null); // State for selected data
    const [loading, setLoading] = useState(true);

    const fetchCranes = async () => {
        try {
            const res = await API.get('/cranes/list');
            setCranes(res.data);
        } catch (err) {
            console.error("Error fetching cranes", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCranes(); }, []);

    const handleViewClick = (crane) => {
        setSelectedCrane(crane);
        setShowViewModal(true);
    };

    const filteredCranes = cranes.filter(crane => 
        (crane.reg_no && crane.reg_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (crane.model && crane.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (crane.owner_name && crane.owner_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleExportExcel = () => {
        if (!cranes || cranes.length === 0) {
            alert("No crane data available to export.");
            return;
        }

        const dataToExport = filteredCranes.map((crane, index) => ({
            "ID": `CR-${String(index + 1).padStart(3, '0')}`,
            "Registration No": crane.reg_no || '',
            "Owner Name": crane.owner_name || '',
            "Crane Type": crane.crane_type || '',
            "Model": crane.model || '',
            "Capacity": crane.capacity || '',
            "Site": crane.site_name || 'ABC Construction Site',
            "Operator": crane.operator_name || 'Raj Kumar',
            "Mfg Year": crane.mfg_year || 'N/A',
            "Engine No": crane.engine_no || 'N/A',
            "Chassis No": crane.chassis_no || 'N/A',
            "Serial No": crane.serial_no || 'N/A',
            "Status": crane.status || '',
            "Registration Date": crane.created_at ? new Date(crane.created_at).toLocaleDateString() : 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Crane Fleet");
        XLSX.writeFile(workbook, `Crane_Fleet_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!cranes || cranes.length === 0) {
            alert("No crane data available to export.");
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });

        // Header Title
        doc.setFontSize(18);
        doc.setTextColor(26, 45, 66);
        doc.text("Crane Fleet Report", 14, 18);

        // Subtitle
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${filteredCranes.length}`, 14, 25);

        const tableColumn = ["ID", "Registration", "Model", "Capacity", "Site", "Operator", "Status"];
        const tableRows = filteredCranes.map((crane, index) => [
            `CR-${String(index + 1).padStart(3, '0')}`,
            crane.reg_no || 'N/A',
            crane.model || 'N/A',
            crane.capacity || 'N/A',
            crane.site_name || 'ABC Construction Site',
            crane.operator_name || 'Raj Kumar',
            crane.status || 'N/A'
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            headStyles: {
                fillColor: [26, 45, 66],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            styles: {
                fontSize: 9,
                cellPadding: 4,
                textColor: [30, 41, 59]
            }
        });

        doc.save(`Crane_Fleet_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="main-content">
                <div className="module-container">
                    <header className="module-header">
                        <div className="header-titles">
                            <h1>Cranes</h1>
                            <p>Manage crane fleet</p>
                        </div>
                        <div className="header-actions">
                            <button className="btn-export-pdf" onClick={handleExportPDF} title="Export data to PDF">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                Export as PDF
                            </button>
                            <button className="btn-export-excel" onClick={handleExportExcel} title="Export data to Excel">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="8" y1="13" x2="16" y2="17"></line>
                                    <line x1="16" y1="13" x2="8" y2="17"></line>
                                </svg>
                                Export as Excel
                            </button>
                        </div>
                    </header>

                    <section className="table-card">
                        <div className="table-controls">
                            <div className="search-box">
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            {(user?.role === 'Admin' || !user) && (
                                <button className="btn-add-crane" onClick={() => setShowModal(true)}>
                                    + Add Crane
                                </button>
                            )}
                        </div>

                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Registration</th>
                                    <th>Model</th>
                                    <th>Capacity</th>
                                    <th>Site</th>
                                    <th>Operator</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" className="table-empty">Loading fleet data...</td></tr>
                                ) : filteredCranes.length === 0 ? (
                                    <tr><td colSpan="8" className="table-empty">No cranes found.</td></tr>
                                ) : (
                                    filteredCranes.map((crane, index) => (
                                        <tr key={crane.id}>
                                            <td className="id-cell">{`CR-${String(index + 1).padStart(3, '0')}`}</td>
                                            <td className="reg-cell">{crane.reg_no}</td>
                                            <td>{crane.model}</td>
                                            <td>{crane.capacity}</td>
                                            <td>{crane.site_name || 'ABC Construction Site'}</td>
                                            <td>{crane.operator_name || 'Raj Kumar'}</td>
                                            <td><span className={`status-pill ${crane.status.toLowerCase()}`}>{crane.status}</span></td>
                                            <td className="action-cell">
                                                <button className="btn-view-action" onClick={() => handleViewClick(crane)}>View</button>
                                                <button className="btn-edit-action">Edit</button>
                                                <button className="btn-delete-action">Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </section>

                    {showModal && <AddCraneModal closeModal={() => setShowModal(false)} refreshData={fetchCranes} />}
                    
                    {/* View Modal Integration */}
                    {showViewModal && (
                        <ViewCraneModal 
                            crane={selectedCrane} 
                            closeModal={() => setShowViewModal(false)}
                            refreshData={fetchCranes}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default Cranes;