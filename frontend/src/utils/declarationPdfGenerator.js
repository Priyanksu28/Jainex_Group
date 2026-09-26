import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to convert image URL to Base64 reliably
const loadImageBase64 = async (url) => {
    if (!url) return null;
    try {
        const res = await fetch(url);
        if (res.ok) {
            const blob = await res.blob();
            return await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        }
    } catch (fetchErr) {
        console.warn("Fetch failed for photo, attempting Image fallback:", fetchErr);
    }

    // Fallback via HTML Image and Canvas
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.95));
            } catch (e) {
                console.warn("Canvas conversion failed:", e);
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = url;
    });
};

const formatDateDMY = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

export const generateDeclarationPDF = async (employee, type = 'Operator') => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const baseURL = "http://localhost:8000";
    let photoUrl = employee.photo || null;
    if (photoUrl && !photoUrl.startsWith('http')) {
        photoUrl = `${baseURL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
    }

    const photoBase64 = await loadImageBase64(photoUrl);

    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'N/A';
    const fatherName = employee.father_husband_name || employee.family_members?.find(f => /father|husband|spouse/i.test(f.relationship))?.member_name || '';
    const dobFormatted = formatDateDMY(employee.dob) || '';
    const dojFormatted = formatDateDMY(employee.joining_date) || '';
    const designation = employee.designation || (type === 'Rigger' ? 'Rigger' : 'Crane Operator');
    const maritalStatus = (employee.marital_status || 'Single').toUpperCase();
    const gender = (employee.gender || 'Male').toUpperCase();
    const permanentAddress = employee.permanent_address || employee.address || '';
    const presentAddress = employee.present_address || employee.address || '';
    const unitName = employee.unit_name ? `Unit: ${employee.unit_name}` : 'Unit Name';
    const contactNo = employee.contact_no || '';
    const emergencyNo = employee.emergency_no || '';
    const email = employee.email || '';
    const aadharNo = employee.aadhar_no || employee.id_proof_no || '';
    const panNo = employee.pan_no || '';
    const pfNo = employee.pf_no ? `PF NO: ${employee.pf_no}` : 'PF NO: -';
    const esicNo = employee.esic_no ? `ESIC NO: ${employee.esic_no}` : 'ESIC NO: -';
    const uanNo = employee.uan_no ? `UAN NO: ${employee.uan_no}` : 'UAN NO:';
    const bankName = employee.bank_name ? `BANK NAME- ${employee.bank_name}` : 'BANK NAME- State Bank of India';
    const bankIfsc = employee.bank_ifsc ? `IFSC: - ${employee.bank_ifsc}` : 'IFSC: - SBIN0006309';
    const bankAcc = employee.bank_account_no ? `Bank Account No: ${employee.bank_account_no}` : 'Bank Account No: ';
    const bankAddr = employee.bank_address ? `Bank Address- ${employee.bank_address}` : 'Bank Address- Morigaon, Assam';

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("PROFESSIONAL HR SERVICES PVT.LTD.", 105, 13, { align: "center" });

    doc.setFontSize(9.5);
    doc.text("DECLARATION FORM (EMPLOYEE DETAILS FORM)", 105, 18, { align: "center" });

    const startX = 14;
    const startY = 21;
    const totalW = 182;
    const photoW = 34;
    const topTableW = totalW - photoW; // 148mm

    // --- Top Table: Rows 1 to 4 (Width 148mm, left of Photo) ---
    autoTable(doc, {
        body: [
            // Row 1
            [
                { content: '1', styles: { halign: 'center', fontStyle: 'bold' } },
                { content: 'Name', styles: { fontStyle: 'bold' } },
                { content: fullName.toUpperCase(), colSpan: 3, styles: { fontStyle: 'bold' } }
            ],
            // Row 2
            [
                { content: '2', styles: { halign: 'center', fontStyle: 'bold' } },
                { content: "Father's/ Husband Name", styles: { fontStyle: 'bold' } },
                { content: fatherName },
                { content: 'DEG:', styles: { fontStyle: 'bold' } },
                { content: designation }
            ],
            // Row 3
            [
                { content: '3', styles: { halign: 'center', fontStyle: 'bold' } },
                { content: 'Date of Birth\n(DD/MM/YYYY)', styles: { fontStyle: 'bold' } },
                { content: dobFormatted },
                { content: 'D.O.J\nDD/MM/Y', styles: { fontStyle: 'bold' } },
                { content: dojFormatted }
            ],
            // Row 4
            [
                { content: '4', styles: { halign: 'center', fontStyle: 'bold' } },
                { content: 'Marital Status: Married \\ Single', styles: { fontStyle: 'bold' } },
                { content: maritalStatus },
                { content: 'Gender:\nM / F', styles: { fontStyle: 'bold' } },
                { content: gender }
            ]
        ],
        startY: startY,
        margin: { left: startX },
        tableWidth: topTableW,
        theme: 'plain',
        styles: {
            fontSize: 7.5,
            cellPadding: 2,
            lineColor: [40, 40, 40],
            lineWidth: 0.25,
            textColor: [15, 23, 42],
            valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 7 },
            1: { cellWidth: 38 },
            2: { cellWidth: 43 },
            3: { cellWidth: 15 },
            4: { cellWidth: 45 }
        }
    });

    const topTableEndY = doc.lastAutoTable.finalY;
    const photoH = topTableEndY - startY;
    const photoX = startX + topTableW;
    const photoY = startY;

    // --- Draw Photo Box Frame (Spanning Rows 1-4 on right) ---
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.25);
    doc.rect(photoX, photoY, photoW, photoH);

    if (photoBase64) {
        try {
            const format = photoBase64.includes('image/png') ? 'PNG' : 'JPEG';
            // Maintain padding inside box
            doc.addImage(photoBase64, format, photoX + 1.5, photoY + 1.5, photoW - 3, photoH - 3);
        } catch (imgErr) {
            console.warn("Error rendering image in PDF doc:", imgErr);
        }
    } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Affix Photo", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
    }

    // --- Bottom Part of Details Table: Rows 5 to 10 (Full Width 182mm) ---
    autoTable(doc, {
        body: [
            // Row 5
            [
                { content: '5', styles: { halign: 'center', fontStyle: 'bold' } },
                { content: 'Permanent Address\n(in state, city, Pin Code)', styles: { fontStyle: 'bold' } },
                { content: permanentAddress, colSpan: 3 }
            ],
            // Row 6
            [
                { content: '6', styles: { halign: 'center', fontStyle: 'bold' } },
                { content: 'Present Address', styles: { fontStyle: 'bold' } },
                { content: presentAddress, colSpan: 3 }
            ],
            // Row 7
            [
                { content: '7', styles: { halign: 'center', fontStyle: 'bold' } },
                { content: unitName, styles: { fontStyle: 'bold' } },
                { content: `E-mail id: ${email}` },
                { content: 'Mobile No\nEmergency No', styles: { fontStyle: 'bold' } },
                { content: `${contactNo}\n${emergencyNo}` }
            ],
            // Row 8
            [
                { content: '8', styles: { halign: 'center', fontStyle: 'bold' } },
                { content: pfNo, styles: { fontStyle: 'bold' } },
                { content: esicNo, styles: { fontStyle: 'bold' } },
                { content: 'Adhar Card No', styles: { fontStyle: 'bold' } },
                { content: aadharNo }
            ],
            // Row 9
            [
                { content: '9', styles: { halign: 'center', fontStyle: 'bold' } },
                { content: uanNo, styles: { fontStyle: 'bold' } },
                { content: `PAN NO. ${panNo}`, styles: { fontStyle: 'bold' } },
                { content: 'Account No', styles: { fontStyle: 'bold' } },
                { content: employee.bank_account_no || '' }
            ],
            // Row 10
            [
                { content: '10', styles: { halign: 'center', fontStyle: 'bold' } },
                { content: `${bankName}\n${bankIfsc}\n${bankAcc}`, colSpan: 2, styles: { fontStyle: 'bold' } },
                { content: bankAddr, colSpan: 2, styles: { fontStyle: 'bold' } }
            ]
        ],
        startY: topTableEndY,
        margin: { left: startX },
        tableWidth: totalW,
        theme: 'plain',
        styles: {
            fontSize: 7.5,
            cellPadding: 2,
            lineColor: [40, 40, 40],
            lineWidth: 0.25,
            textColor: [15, 23, 42],
            valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 7 },
            1: { cellWidth: 38 },
            2: { cellWidth: 54 },
            3: { cellWidth: 25 },
            4: { cellWidth: 58 }
        }
    });

    let currentY = doc.lastAutoTable.finalY + 4;

    // --- Nominee Detail Section ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("Nominee Detail: -", startX, currentY);
    currentY += 2;

    const nomineeRows = (employee.nominees && employee.nominees.length > 0)
        ? employee.nominees.map(n => [
            n.nominee_name || '',
            n.age != null ? String(n.age) : '',
            n.relationship || '',
            n.nominee_address || (n.contact_no ? `Contact: ${n.contact_no}` : (permanentAddress || presentAddress || ''))
        ])
        : [['', '', '', '']];

    autoTable(doc, {
        head: [["Nominee Name", "Age", "Relationship", "Nominee Address"]],
        body: nomineeRows,
        startY: currentY,
        theme: 'plain',
        tableWidth: totalW,
        margin: { left: startX },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: 7.5,
            lineColor: [40, 40, 40],
            lineWidth: 0.25,
            cellPadding: 2
        },
        styles: {
            fontSize: 7.5,
            cellPadding: 2,
            lineColor: [40, 40, 40],
            lineWidth: 0.25,
            textColor: [15, 23, 42],
            valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 57 },
            1: { cellWidth: 16 },
            2: { cellWidth: 26 },
            3: { cellWidth: 83 }
        }
    });

    currentY = doc.lastAutoTable.finalY + 5;

    // --- Family Details Section ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Family details: - (only spouse, children, and parents (Parents if depend on you)", startX, currentY);
    currentY += 2;

    const actualFamily = (employee.family_members || []).map(f => [
        f.member_name || '',
        formatDateDMY(f.dob) || '',
        f.relationship || '',
        f.aadhar_card_no || (f.contact_no ? `Mob: ${f.contact_no}` : '')
    ]);

    const familyRows = [...actualFamily];
    while (familyRows.length < 7) {
        familyRows.push(['', '', '', '']);
    }

    autoTable(doc, {
        head: [["Name", "Date of Birth / year\n(this format\nD/M/Y)", "Relationship", "ADHAR CARD NO"]],
        body: familyRows,
        startY: currentY,
        theme: 'plain',
        tableWidth: totalW,
        margin: { left: startX },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: 7.5,
            lineColor: [40, 40, 40],
            lineWidth: 0.25,
            cellPadding: 2,
            halign: 'center'
        },
        styles: {
            fontSize: 7.5,
            cellPadding: 2.2,
            lineColor: [40, 40, 40],
            lineWidth: 0.25,
            textColor: [15, 23, 42],
            valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 46 },
            1: { cellWidth: 36, halign: 'center' },
            2: { cellWidth: 32 },
            3: { cellWidth: 68 }
        }
    });

    currentY = doc.lastAutoTable.finalY + 9;

    // --- Footer Signatures ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("Employee's Signature: __________________", 20, currentY);
    doc.text("Unit Head Signature ____________________", 115, currentY);

    // Save PDF
    const cleanName = fullName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Declaration_Form_${cleanName}_${new Date().toISOString().slice(0, 10)}.pdf`);
};
