import { useState, useEffect, useContext } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar/Sidebar';
import AddOperatorModal from './AddOperatorModal';
import ViewOperatorModal from './ViewOperatorModal';
import { generateDeclarationPDF } from '../../utils/declarationPdfGenerator';
import './Operators.css';

const Operators = () => {
    const { user } = useContext(AuthContext);
    const [operators, setOperators] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedOperator, setSelectedOperator] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);

    const fetchOperators = async () => {
        try {
            setLoading(true);
            const res = await API.get('/operators/list');
            setOperators(res.data || []);
        } catch (err) {
            console.error("Error fetching operators", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOperators(); }, []);

    const handleViewClick = (op, index) => {
        setSelectedOperator({ ...op, index });
        setShowViewModal(true);
    };

    const handleDownloadSinglePDF = async (op) => {
        setDownloadingId(op.emp_id);
        try {
            // Fetch complete details if not fully present
            let opData = op;
            if (!op.family_members || !op.nominees) {
                const res = await API.get(`/operators/details/${op.emp_id}`);
                opData = {
                    ...res.data.details,
                    family_members: res.data.family,
                    nominees: res.data.nominees
                };
            }
            await generateDeclarationPDF(opData, 'Operator');
        } catch (err) {
            console.error("Error downloading PDF", err);
            alert("Could not generate PDF declaration form.");
        } finally {
            setDownloadingId(null);
        }
    };

    const filteredOperators = operators.filter(op => 
        `${op.first_name || ''} ${op.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (op.contact_no && op.contact_no.includes(searchTerm)) ||
        (op.email && op.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleExportExcel = () => {
        if (!operators || operators.length === 0) {
            alert("No operator data available to export.");
            return;
        }

        const workbook = XLSX.utils.book_new();

        // 1. Primary Operators Sheet
        const operatorsData = filteredOperators.map((op, index) => {
            const familySummary = (op.family_members || [])
                .map(f => `${f.member_name} (${f.relationship || 'Relative'}${f.aadhar_card_no ? ' - Aadhar: ' + f.aadhar_card_no : ''})`)
                .join('; ');

            const nomineeSummary = (op.nominees || [])
                .map(n => `${n.nominee_name} (${n.relationship || 'Nominee'}${n.age ? ' - Age: ' + n.age : ''})`)
                .join('; ');

            return {
                "Operator ID": `OP-${String(index + 1).padStart(3, '0')}`,
                "Full Name": `${op.first_name || ''} ${op.last_name || ''}`.trim(),
                "First Name": op.first_name || '',
                "Last Name": op.last_name || '',
                "Father / Husband Name": op.father_husband_name || '',
                "Gender": op.gender || 'Male',
                "Marital Status": op.marital_status || 'Single',
                "Designation": op.designation || 'Crane Operator',
                "Unit Name": op.unit_name || '',
                "Date of Birth": op.dob ? new Date(op.dob).toLocaleDateString() : 'N/A',
                "Joining Date": op.joining_date ? new Date(op.joining_date).toLocaleDateString() : 'N/A',
                "Mobile Number": op.contact_no || '',
                "Email": op.email || '',
                "Present Address": op.present_address || 'N/A',
                "Permanent Address": op.permanent_address || 'N/A',
                "Adhar Card No": op.aadhar_no || 'N/A',
                "PAN No": op.pan_no || '',
                "PF No": op.pf_no || '',
                "ESIC No": op.esic_no || '',
                "UAN No": op.uan_no || '',
                "Bank Name": op.bank_name || '',
                "Bank Account No": op.bank_account_no || '',
                "Bank IFSC": op.bank_ifsc || '',
                "Bank Address": op.bank_address || '',
                "Status": op.status || 'Active',
                "Family Members Summary": familySummary || 'None',
                "Nominees Summary": nomineeSummary || 'None',
                "Registration Date": op.created_at ? new Date(op.created_at).toLocaleDateString() : 'N/A'
            };
        });

        const opWorksheet = XLSX.utils.json_to_sheet(operatorsData);
        XLSX.utils.book_append_sheet(workbook, opWorksheet, "Operators Details");

        // 2. Family Members Detailed Sheet
        const familyRows = [];
        filteredOperators.forEach((op, index) => {
            const opId = `OP-${String(index + 1).padStart(3, '0')}`;
            const opName = `${op.first_name || ''} ${op.last_name || ''}`.trim();
            (op.family_members || []).forEach(f => {
                familyRows.push({
                    "Operator ID": opId,
                    "Operator Name": opName,
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
        filteredOperators.forEach((op, index) => {
            const opId = `OP-${String(index + 1).padStart(3, '0')}`;
            const opName = `${op.first_name || ''} ${op.last_name || ''}`.trim();
            (op.nominees || []).forEach(n => {
                nomineeRows.push({
                    "Operator ID": opId,
                    "Operator Name": opName,
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

        XLSX.writeFile(workbook, `Operators_Complete_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!operators || operators.length === 0) {
            alert("No operator data available to export.");
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });

        // Header Title
        doc.setFontSize(18);
        doc.setTextColor(26, 45, 66);
        doc.text("Operators Complete Directory Report", 14, 18);

        // Subtitle
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on: ${new Date().toLocaleString()} | Total Operators: ${filteredOperators.length}`, 14, 25);

        // 1. Primary Operators Table
        const tableColumn = ["ID", "Name", "Mobile", "Email", "DOB", "Joining Date", "Aadhar No", "PAN No", "Status"];
        const tableRows = filteredOperators.map((op, index) => [
            `OP-${String(index + 1).padStart(3, '0')}`,
            `${op.first_name || ''} ${op.last_name || ''}`.trim(),
            op.contact_no || 'N/A',
            op.email || 'N/A',
            op.dob ? new Date(op.dob).toLocaleDateString() : 'N/A',
            op.joining_date ? new Date(op.joining_date).toLocaleDateString() : 'N/A',
            op.aadhar_no || 'N/A',
            op.pan_no || 'N/A',
            op.status || 'Active'
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
        filteredOperators.forEach((op, index) => {
            const opId = `OP-${String(index + 1).padStart(3, '0')}`;
            const opName = `${op.first_name || ''} ${op.last_name || ''}`.trim();
            (op.family_members || []).forEach(f => {
                familyRows.push([
                    opId,
                    opName,
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
                head: [["Operator ID", "Operator Name", "Member Name", "Relationship", "DOB", "Aadhar Card No"]],
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
        filteredOperators.forEach((op, index) => {
            const opId = `OP-${String(index + 1).padStart(3, '0')}`;
            const opName = `${op.first_name || ''} ${op.last_name || ''}`.trim();
            (op.nominees || []).forEach(n => {
                nomineeRows.push([
                    opId,
                    opName,
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
                head: [["Operator ID", "Operator Name", "Nominee Name", "Age", "Relationship", "Nominee Address"]],
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

        doc.save(`Operators_Complete_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="main-content">
                <div className="module-container">
                    <header className="module-header">
                        <div className="header-titles">
                            <h1>Operators</h1>
                            <p>Operator records</p>
                        </div>
                        <div className="header-actions">
                            <button className="btn-export-pdf" onClick={handleExportPDF} title="Export operators to PDF">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                Export as PDF
                            </button>
                            <button className="btn-export-excel" onClick={handleExportExcel} title="Export operators to Excel">
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
                                <button className="btn-add-operator" onClick={() => setShowModal(true)}>
                                    + Add Operator
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
                                ) : filteredOperators.length === 0 ? (
                                    <tr><td colSpan="5" className="table-empty">No operators found.</td></tr>
                                ) : (
                                    filteredOperators.map((op, index) => (
                                        <tr key={op.emp_id}>
                                            <td className="id-cell">{`OP-${String(index + 1).padStart(3, '0')}`}</td>
                                            <td className="bold-text">{`${op.first_name || ''} ${op.last_name || ''}`.trim()}</td>
                                            <td>{op.contact_no || 'N/A'}</td>
                                            <td>{op.email || 'N/A'}</td>
                                            <td className="action-cell">
                                                <button className="btn-view-action" onClick={() => handleViewClick(op, index)}>View</button>
                                                <button 
                                                    className="btn-pdf-action" 
                                                    onClick={() => handleDownloadSinglePDF(op)} 
                                                    title="Download Employee Declaration Form PDF"
                                                    disabled={downloadingId === op.emp_id}
                                                >
                                                    {downloadingId === op.emp_id ? "..." : "PDF"}
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
                        <AddOperatorModal 
                            closeModal={() => setShowModal(false)} 
                            refreshData={fetchOperators} 
                        />
                    )}

                    {showViewModal && (
                        <ViewOperatorModal 
                            operator={selectedOperator} 
                            closeModal={() => setShowViewModal(false)} 
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default Operators;