import { useState, useEffect, useContext } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar/Sidebar';
import AddRiggerModal from './AddRiggerModal';
import ViewRiggerModal from './ViewRiggerModal';
import { generateDeclarationPDF } from '../../utils/declarationPdfGenerator';
import './Riggers.css';

const Riggers = () => {
    const { user } = useContext(AuthContext);
    const [riggers, setRiggers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedRigger, setSelectedRigger] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);

    const fetchRiggers = async () => {
        try {
            const res = await API.get('/riggers/list');
            setRiggers(res.data);
        } catch (err) {
            console.error("Error fetching riggers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRiggers(); }, []);

    const handleViewClick = (rig, index) => {
        setSelectedRigger({ ...rig, index });
        setShowViewModal(true);
    };

    const handleDownloadSinglePDF = async (rig) => {
        setDownloadingId(rig.emp_id);
        try {
            let rigData = rig;
            if (!rig.family_members || !rig.nominees) {
                const res = await API.get(`/riggers/details/${rig.emp_id}`);
                rigData = {
                    ...res.data.details,
                    family_members: res.data.family,
                    nominees: res.data.nominees
                };
            }
            await generateDeclarationPDF(rigData, 'Rigger');
        } catch (err) {
            console.error("Error downloading PDF", err);
            alert("Could not generate PDF declaration form.");
        } finally {
            setDownloadingId(null);
        }
    };

    const filteredRiggers = riggers.filter(rig => 
        `${rig.first_name || ''} ${rig.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rig.contact_no && rig.contact_no.includes(searchTerm)) ||
        (rig.email && rig.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleExportExcel = () => {
        if (!riggers || riggers.length === 0) {
            alert("No rigger data available to export.");
            return;
        }

        const workbook = XLSX.utils.book_new();

        // 1. Primary Riggers Sheet
        const riggersData = filteredRiggers.map((rig, index) => {
            const familySummary = (rig.family_members || [])
                .map(f => `${f.member_name} (${f.relationship || 'Relative'}${f.aadhar_card_no ? ' - Aadhar: ' + f.aadhar_card_no : ''})`)
                .join('; ');

            const nomineeSummary = (rig.nominees || [])
                .map(n => `${n.nominee_name} (${n.relationship || 'Nominee'}${n.age ? ' - Age: ' + n.age : ''})`)
                .join('; ');

            return {
                "Rigger ID": `RIG-${String(index + 1).padStart(3, '0')}`,
                "Full Name": `${rig.first_name || ''} ${rig.last_name || ''}`.trim(),
                "First Name": rig.first_name || '',
                "Last Name": rig.last_name || '',
                "Father / Husband Name": rig.father_husband_name || '',
                "Gender": rig.gender || 'Male',
                "Marital Status": rig.marital_status || 'Single',
                "Designation": rig.designation || 'Rigger',
                "Unit Name": rig.unit_name || '',
                "Date of Birth": rig.dob ? new Date(rig.dob).toLocaleDateString() : 'N/A',
                "Joining Date": rig.joining_date ? new Date(rig.joining_date).toLocaleDateString() : 'N/A',
                "Mobile Number": rig.contact_no || '',
                "Email": rig.email || '',
                "Present Address": rig.present_address || 'N/A',
                "Permanent Address": rig.permanent_address || 'N/A',
                "Adhar Card No": rig.aadhar_no || 'N/A',
                "PAN No": rig.pan_no || '',
                "PF No": rig.pf_no || '',
                "ESIC No": rig.esic_no || '',
                "UAN No": rig.uan_no || '',
                "Bank Name": rig.bank_name || '',
                "Bank Account No": rig.bank_account_no || '',
                "Bank IFSC": rig.bank_ifsc || '',
                "Bank Address": rig.bank_address || '',
                "Status": rig.status || 'Active',
                "Family Members Summary": familySummary || 'None',
                "Nominees Summary": nomineeSummary || 'None',
                "Registration Date": rig.created_at ? new Date(rig.created_at).toLocaleDateString() : 'N/A'
            };
        });

        const rigWorksheet = XLSX.utils.json_to_sheet(riggersData);
        XLSX.utils.book_append_sheet(workbook, rigWorksheet, "Riggers Details");

        // 2. Family Members Detailed Sheet
        const familyRows = [];
        filteredRiggers.forEach((rig, index) => {
            const rigId = `RIG-${String(index + 1).padStart(3, '0')}`;
            const rigName = `${rig.first_name || ''} ${rig.last_name || ''}`.trim();
            (rig.family_members || []).forEach(f => {
                familyRows.push({
                    "Rigger ID": rigId,
                    "Rigger Name": rigName,
                    "Member Name": f.member_name || '',
                    "Relationship": f.relationship || '',
                    "Date of Birth": f.dob ? new Date(f.dob).toLocaleDateString() : 'N/A',
                    "Adhar Card No": f.aadhar_card_no || 'N/A'
                });
            });
        });

        if (familyRows.length > 0) {
            const familyWorksheet = XLSX.utils.json_to_sheet(familyRows);
            XLSX.utils.book_append_sheet(workbook, familyWorksheet, "Family Members");
        }

        // 3. Nominees Detailed Sheet
        const nomineeRows = [];
        filteredRiggers.forEach((rig, index) => {
            const rigId = `RIG-${String(index + 1).padStart(3, '0')}`;
            const rigName = `${rig.first_name || ''} ${rig.last_name || ''}`.trim();
            (rig.nominees || []).forEach(n => {
                nomineeRows.push({
                    "Rigger ID": rigId,
                    "Rigger Name": rigName,
                    "Nominee Name": n.nominee_name || '',
                    "Age": n.age || '',
                    "Relationship": n.relationship || '',
                    "Nominee Address": n.nominee_address || ''
                });
            });
        });

        if (nomineeRows.length > 0) {
            const nomineeWorksheet = XLSX.utils.json_to_sheet(nomineeRows);
            XLSX.utils.book_append_sheet(workbook, nomineeWorksheet, "Nominees");
        }

        XLSX.writeFile(workbook, `Riggers_Complete_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!riggers || riggers.length === 0) {
            alert("No rigger data available to export.");
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });

        // Header Title
        doc.setFontSize(18);
        doc.setTextColor(26, 45, 66);
        doc.text("Riggers Complete Directory Report", 14, 18);

        // Subtitle
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on: ${new Date().toLocaleString()} | Total Riggers: ${filteredRiggers.length}`, 14, 25);

        // 1. Primary Riggers Table
        const tableColumn = ["ID", "Name", "Mobile", "Email", "DOB", "Joining Date", "Aadhar No", "PAN No", "Status"];
        const tableRows = filteredRiggers.map((rig, index) => [
            `RIG-${String(index + 1).padStart(3, '0')}`,
            `${rig.first_name || ''} ${rig.last_name || ''}`.trim(),
            rig.contact_no || 'N/A',
            rig.email || 'N/A',
            rig.dob ? new Date(rig.dob).toLocaleDateString() : 'N/A',
            rig.joining_date ? new Date(rig.joining_date).toLocaleDateString() : 'N/A',
            rig.aadhar_no || 'N/A',
            rig.pan_no || 'N/A',
            rig.status || 'Active'
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
                fontSize: 9
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            styles: {
                fontSize: 8,
                cellPadding: 3,
                textColor: [30, 41, 59]
            }
        });

        // 2. Family Members Detailed Table (if any)
        const familyRows = [];
        filteredRiggers.forEach((rig, index) => {
            const rigId = `RIG-${String(index + 1).padStart(3, '0')}`;
            const rigName = `${rig.first_name || ''} ${rig.last_name || ''}`.trim();
            (rig.family_members || []).forEach(f => {
                familyRows.push([
                    rigId,
                    rigName,
                    f.member_name || 'N/A',
                    f.relationship || 'N/A',
                    f.dob ? new Date(f.dob).toLocaleDateString() : 'N/A',
                    f.aadhar_card_no || 'N/A'
                ]);
            });
        });

        if (familyRows.length > 0) {
            let finalY = doc.lastAutoTable.finalY || 30;
            if (finalY > 160) {
                doc.addPage();
                finalY = 15;
            } else {
                finalY += 12;
            }

            doc.setFontSize(14);
            doc.setTextColor(26, 45, 66);
            doc.text("Family Members Directory", 14, finalY);

            autoTable(doc, {
                head: [["Rigger ID", "Rigger Name", "Member Name", "Relationship", "DOB", "Aadhar Card No"]],
                body: familyRows,
                startY: finalY + 4,
                theme: 'grid',
                headStyles: {
                    fillColor: [30, 58, 138],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 3
                }
            });
        }

        // 3. Nominees Detailed Table (if any)
        const nomineeRows = [];
        filteredRiggers.forEach((rig, index) => {
            const rigId = `RIG-${String(index + 1).padStart(3, '0')}`;
            const rigName = `${rig.first_name || ''} ${rig.last_name || ''}`.trim();
            (rig.nominees || []).forEach(n => {
                nomineeRows.push([
                    rigId,
                    rigName,
                    n.nominee_name || 'N/A',
                    n.age ? String(n.age) : 'N/A',
                    n.relationship || 'N/A',
                    n.nominee_address || 'N/A'
                ]);
            });
        });

        if (nomineeRows.length > 0) {
            let finalY = doc.lastAutoTable.finalY || 30;
            if (finalY > 160) {
                doc.addPage();
                finalY = 15;
            } else {
                finalY += 12;
            }

            doc.setFontSize(14);
            doc.setTextColor(26, 45, 66);
            doc.text("Nominees Directory", 14, finalY);

            autoTable(doc, {
                head: [["Rigger ID", "Rigger Name", "Nominee Name", "Age", "Relationship", "Nominee Address"]],
                body: nomineeRows,
                startY: finalY + 4,
                theme: 'grid',
                headStyles: {
                    fillColor: [15, 118, 110],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 3
                }
            });
        }

        doc.save(`Riggers_Complete_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="main-content">
                <div className="module-container">
                    <header className="module-header">
                        <div className="header-titles">
                            <h1>Riggers</h1>
                            <p>Rigger records</p>
                        </div>
                        <div className="header-actions">
                            <button className="btn-export-pdf" onClick={handleExportPDF} title="Export riggers to PDF">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                Export as PDF
                            </button>
                            <button className="btn-export-excel" onClick={handleExportExcel} title="Export riggers to Excel">
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
                            {user?.role === 'Admin' && (
                                <button className="btn-add-rigger" onClick={() => setShowModal(true)}>
                                    + Add Rigger
                                </button>
                            )}
                        </div>

                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Mobile Number</th>
                                    <th>Email</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="table-empty">Loading...</td></tr>
                                ) : filteredRiggers.length === 0 ? (
                                    <tr><td colSpan="5" className="table-empty">No riggers found.</td></tr>
                                ) : (
                                    filteredRiggers.map((rig, index) => (
                                        <tr key={rig.emp_id}>
                                            <td className="id-cell">{`RIG-${String(index + 1).padStart(3, '0')}`}</td>
                                            <td className="bold-text">{`${rig.first_name || ''} ${rig.last_name || ''}`.trim()}</td>
                                            <td>{rig.contact_no || 'N/A'}</td>
                                            <td>{rig.email || 'N/A'}</td>
                                            <td className="action-cell">
                                                <button className="btn-view-action" onClick={() => handleViewClick(rig, index)}>View</button>
                                                <button 
                                                    className="btn-pdf-action" 
                                                    onClick={() => handleDownloadSinglePDF(rig)} 
                                                    title="Download Employee Declaration Form PDF"
                                                    disabled={downloadingId === rig.emp_id}
                                                >
                                                    {downloadingId === rig.emp_id ? "..." : "PDF"}
                                                </button>
                                                <button className="btn-edit-action">Edit</button>
                                                <button className="btn-delete-action">Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </section>

                    {showModal && (
                        <AddRiggerModal 
                            closeModal={() => setShowModal(false)} 
                            refreshData={fetchRiggers} 
                        />
                    )}

                    {showViewModal && (
                        <ViewRiggerModal 
                            rigger={selectedRigger} 
                            closeModal={() => setShowViewModal(false)} 
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default Riggers;
