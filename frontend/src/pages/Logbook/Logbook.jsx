import { useState, useEffect, useContext, useRef } from 'react';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar/Sidebar';
import './Logbook.css';

const QUICK_WORK_PRESETS = [
    { label: 'Bracing Erection Working', text: 'Bresing eraction working' },
    { label: 'Beam Erection', text: 'Beem eraction' },
    { label: 'Store Material Working', text: 'Store material working' },
    { label: 'Material Shifting', text: 'metireal shifting' },
    { label: 'Beam Erection & Unloading', text: 'Beem eraction and metrial unloding' },
    { label: 'Idle / Standby', text: 'Ideal' },
    { label: 'Weekly Holiday', text: 'Holiday weekly' },
    { label: 'Crane Maintenance', text: 'Crane maintenance and servicing' },
    { label: 'Breakdown / Mechanical Repair', text: 'Breakdown - under mechanical repair' }
];

const formatMonthYearStr = (dateStr) => {
    if (!dateStr) {
        const d = new Date();
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "August 2026";
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatDateDMY = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const Logbook = () => {
    const { user } = useContext(AuthContext);
    const isOperator = user?.role === 'Operator';

    // View Tabs: 'sheet' (Physical Log Sheet), 'form' (Daily Entry Form), 'table' (Records Register)
    const [activeTab, setActiveTab] = useState(isOperator ? 'form' : 'sheet');

    // Filter Options from Server
    const [filterOptions, setFilterOptions] = useState({
        registered_cranes: [],
        sites: [],
        logged_months: []
    });

    // Active Selection for Monthly Sheet View
    const [selectedMonth, setSelectedMonth] = useState('August 2026');
    const [selectedCraneId, setSelectedCraneId] = useState('');
    const [selectedSiteId, setSelectedSiteId] = useState('');

    // Sheet Data & Summary
    const [sheetData, setSheetData] = useState({
        header: {
            company_name: "JAINEX PARIWAHAN PVT. LTD.",
            company_address: "Chatribari Road, Guwahati-1",
            month: "August 2026",
            party_name: "Vaksim Contraction Pvt Ltd",
            site_name: "",
            crane_reg_no: ""
        },
        entries: [],
        summary: {
            total_entries: 0,
            total_hours_worked: '0.00',
            total_kmh_run: '0.00',
            initial_hours_reading: null,
            final_hours_reading: null,
            initial_kmh_reading: null,
            final_kmh_reading: null
        }
    });

    // All Records List Data (Register View)
    const [recordsList, setRecordsList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Overall stats
    const [overallStats, setOverallStats] = useState(null);

    // Daily Form State (Matches exact new table columns)
    const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
    const [formMonth, setFormMonth] = useState(formatMonthYearStr(new Date().toISOString().slice(0, 10)));
    const [formSiteId, setFormSiteId] = useState('');
    const [formCraneId, setFormCraneId] = useState('');
    const [formStartTime, setFormStartTime] = useState('8:00 AM');
    const [formEndTime, setFormEndTime] = useState('5:00 PM');
    const [formHoursStart, setFormHoursStart] = useState('');
    const [formHoursEnd, setFormHoursEnd] = useState('');
    const [formKmhStart, setFormKmhStart] = useState('');
    const [formKmhEnd, setFormKmhEnd] = useState('');
    const [formWorkDesc, setFormWorkDesc] = useState('');
    const [formSiteInchargeSign, setFormSiteInchargeSign] = useState('');
    const [formOperatorSign, setFormOperatorSign] = useState(user?.name || '');
    const [formRemarks, setFormRemarks] = useState('');
    const [editingEntryId, setEditingEntryId] = useState(null);

    // Operator assignment details
    const [operatorAssignment, setOperatorAssignment] = useState(null);

    // UI Loading & Feedback states
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Printable Sheet Ref
    const printAreaRef = useRef(null);

    // Live calculated total hours & total KM in form
    const calculatedFormHours = (formHoursStart !== '' && formHoursEnd !== '' && parseFloat(formHoursEnd) >= parseFloat(formHoursStart))
        ? (parseFloat(formHoursEnd) - parseFloat(formHoursStart)).toFixed(2)
        : null;

    const calculatedFormKm = (formKmhStart !== '' && formKmhEnd !== '' && parseFloat(formKmhEnd) >= parseFloat(formKmhStart))
        ? (parseFloat(formKmhEnd) - parseFloat(formKmhStart)).toFixed(2)
        : null;

    // 1. Load Filter Options and Operator Assignment on mount
    useEffect(() => {
        loadFilterOptions();
        loadOperatorAssignment();
        loadSummaryStats();
    }, []);

    // 2. Auto-derive month when formDate changes
    useEffect(() => {
        if (formDate) {
            setFormMonth(formatMonthYearStr(formDate));
        }
    }, [formDate]);

    // 3. Load Sheet Data whenever filters change
    useEffect(() => {
        loadMonthlySheet();
    }, [selectedMonth, selectedCraneId, selectedSiteId]);

    // 4. Load Records List whenever activeTab is 'table'
    useEffect(() => {
        if (activeTab === 'table') {
            loadAllRecords();
        }
    }, [activeTab, selectedCraneId, selectedSiteId, selectedMonth, dateFrom, dateTo]);

    const loadFilterOptions = async () => {
        try {
            const res = await API.get('/logbook/filter-options');
            setFilterOptions(res.data);
            
            if (res.data.logged_months && res.data.logged_months.length > 0 && !selectedMonth) {
                setSelectedMonth(res.data.logged_months[0]);
            }
            if (res.data.registered_cranes && res.data.registered_cranes.length > 0 && !selectedCraneId) {
                setSelectedCraneId(res.data.registered_cranes[0].id);
                setFormCraneId(res.data.registered_cranes[0].id);
            }
            if (res.data.sites && res.data.sites.length > 0 && !selectedSiteId) {
                setFormSiteId(res.data.sites[0].id);
            }
        } catch (err) {
            console.error("Error loading filter options:", err);
        }
    };

    const loadOperatorAssignment = async () => {
        try {
            const res = await API.get('/logbook/operator-assignment');
            if (res.data && res.data.has_assignment) {
                setOperatorAssignment(res.data);
                if (res.data.crane_number_id || res.data.crane_id) {
                    const cid = res.data.crane_number_id || res.data.crane_id;
                    setFormCraneId(cid);
                    setSelectedCraneId(cid);
                }
                if (res.data.site_id) {
                    setFormSiteId(res.data.site_id);
                    setSelectedSiteId(res.data.site_id);
                }
                if (res.data.site_incharge_sign) {
                    setFormSiteInchargeSign(res.data.site_incharge_sign);
                }
                if (res.data.last_hours_reading) {
                    setFormHoursStart(String(res.data.last_hours_reading));
                }
                if (res.data.last_kmh_reading) {
                    setFormKmhStart(String(res.data.last_kmh_reading));
                }
            }
        } catch (err) {
            console.error("Error loading operator assignment:", err);
        }
    };

    const loadMonthlySheet = async (m = selectedMonth, c = selectedCraneId, s = selectedSiteId) => {
        try {
            setLoading(true);
            const res = await API.get('/logbook/monthly-sheet', {
                params: {
                    month: m,
                    crane_number_id: c,
                    site_id: s
                }
            });
            setSheetData(res.data);
        } catch (err) {
            console.error("Error loading monthly sheet:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadAllRecords = async (c = selectedCraneId, s = selectedSiteId, m = selectedMonth) => {
        try {
            setLoading(true);
            const res = await API.get('/logbook/entries', {
                params: {
                    crane_number_id: c,
                    site_id: s,
                    month: m,
                    date_from: dateFrom,
                    date_to: dateTo,
                    search: searchTerm
                }
            });
            setRecordsList(res.data.rows || []);
        } catch (err) {
            console.error("Error loading all records:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadSummaryStats = async () => {
        try {
            const res = await API.get('/logbook/summary-stats');
            setOverallStats(res.data);
        } catch (err) {
            console.error("Error loading stats:", err);
        }
    };

    // Quick Apply Preset Work Activity
    const handleSelectPreset = (preset) => {
        setFormWorkDesc(preset.text);
        if (preset.text.toLowerCase().includes('holiday')) {
            setFormStartTime('');
            setFormEndTime('');
            setFormRemarks('Weekly Holiday');
        } else if (preset.text.toLowerCase().includes('ideal') || preset.text.toLowerCase().includes('idle')) {
            if (!formStartTime) setFormStartTime('8:00 AM');
            if (!formEndTime) setFormEndTime('5:00 PM');
            setFormRemarks('Site crane idle');
        } else {
            if (!formStartTime) setFormStartTime('8:00 AM');
            if (!formEndTime) setFormEndTime('5:00 PM');
        }
    };

    // Autofill from active assignment button
    const handleAutofillActiveAssignment = () => {
        if (operatorAssignment && operatorAssignment.has_assignment) {
            if (operatorAssignment.crane_number_id || operatorAssignment.crane_id) {
                setFormCraneId(operatorAssignment.crane_number_id || operatorAssignment.crane_id);
            }
            if (operatorAssignment.site_id) setFormSiteId(operatorAssignment.site_id);
            if (operatorAssignment.site_incharge_sign) setFormSiteInchargeSign(operatorAssignment.site_incharge_sign);
            if (operatorAssignment.last_hours_reading) setFormHoursStart(String(operatorAssignment.last_hours_reading));
            if (operatorAssignment.last_kmh_reading) setFormKmhStart(String(operatorAssignment.last_kmh_reading));
            setFormOperatorSign(user?.name || 'Operator');
            setSuccessMessage("Autofilled details from your active Site & Crane assignment!");
            setTimeout(() => setSuccessMessage(''), 3500);
        } else {
            setErrorMessage("No active crane crew deployment found for your account.");
            setTimeout(() => setErrorMessage(''), 3500);
        }
    };

    // Handle Form Submit (Create or Edit)
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');

        if (!formSiteId) {
            setErrorMessage("Please select a Site.");
            setSubmitting(false);
            return;
        }

        if (!formCraneId) {
            setErrorMessage("Please select a Crane.");
            setSubmitting(false);
            return;
        }

        try {
            const payload = {
                month: formMonth || formatMonthYearStr(formDate),
                logbook_date: formDate,
                site_id: parseInt(formSiteId, 10),
                crane_number_id: parseInt(formCraneId, 10),
                start_time: formStartTime || null,
                end_time: formEndTime || null,
                hours_start: formHoursStart !== '' ? formHoursStart : null,
                hours_end: formHoursEnd !== '' ? formHoursEnd : null,
                kmh_start: formKmhStart !== '' ? formKmhStart : null,
                kmh_end: formKmhEnd !== '' ? formKmhEnd : null,
                work_description: formWorkDesc,
                site_incharge_sign: formSiteInchargeSign || null,
                operator_sign: formOperatorSign || user?.name || 'Operator',
                remarks: formRemarks || null
            };

            const targetMonth = formMonth || formatMonthYearStr(formDate);
            const targetCraneId = parseInt(formCraneId, 10);
            const targetSiteId = parseInt(formSiteId, 10);

            if (editingEntryId) {
                await API.put(`/logbook/${editingEntryId}`, payload);
                setSuccessMessage("Logbook entry updated successfully!");
                setEditingEntryId(null);
            } else {
                await API.post('/logbook', payload);
                setSuccessMessage("Daily logbook entry recorded successfully!");
            }

            // Synchronize active filter states with the target entry
            setSelectedMonth(targetMonth);
            setSelectedCraneId(targetCraneId);
            setSelectedSiteId(targetSiteId);

            // Directly refresh the sheets & stats with target parameters
            await Promise.all([
                loadMonthlySheet(targetMonth, targetCraneId, targetSiteId),
                loadFilterOptions(),
                loadSummaryStats(),
                loadAllRecords(targetCraneId, targetSiteId, targetMonth)
            ]);

            // Next day suggestions: carry forward hours_end to hours_start
            if (!editingEntryId && formHoursEnd) {
                setFormHoursStart(formHoursEnd);
                setFormHoursEnd('');
            }
            if (!editingEntryId && formKmhEnd) {
                setFormKmhStart(formKmhEnd);
                setFormKmhEnd('');
            }
            if (!editingEntryId) {
                setFormWorkDesc('');
                setFormRemarks('');
            }

            setTimeout(() => {
                setSuccessMessage('');
                setActiveTab('sheet');
            }, 600);
        } catch (err) {
            setErrorMessage(err.response?.data?.message || err.response?.data?.error || "Failed to save logbook entry.");
        } finally {
            setSubmitting(false);
        }
    };

    // Start editing an entry
    const handleEditEntry = (entry) => {
        setEditingEntryId(entry.id);
        setFormDate(entry.logbook_date ? entry.logbook_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
        setFormMonth(entry.month || formatMonthYearStr(entry.logbook_date));
        setFormSiteId(entry.site_id || '');
        setFormCraneId(entry.crane_number_id || '');
        setFormStartTime(entry.start_time || '');
        setFormEndTime(entry.end_time || '');
        setFormHoursStart(entry.hours_start !== null && entry.hours_start !== undefined ? String(entry.hours_start) : '');
        setFormHoursEnd(entry.hours_end !== null && entry.hours_end !== undefined ? String(entry.hours_end) : '');
        setFormKmhStart(entry.kmh_start !== null && entry.kmh_start !== undefined ? String(entry.kmh_start) : '');
        setFormKmhEnd(entry.kmh_end !== null && entry.kmh_end !== undefined ? String(entry.kmh_end) : '');
        setFormWorkDesc(entry.work_description || '');
        setFormSiteInchargeSign(entry.site_incharge_sign || '');
        setFormOperatorSign(entry.operator_sign || '');
        setFormRemarks(entry.remarks || '');
        setActiveTab('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Cancel edit
    const handleCancelEdit = () => {
        setEditingEntryId(null);
        setFormWorkDesc('');
        setFormRemarks('');
    };

    // Delete an entry
    const handleDeleteEntry = async (id) => {
        if (!window.confirm("Are you sure you want to delete this logbook entry?")) return;
        try {
            await API.delete(`/logbook/${id}`);
            alert("Entry deleted successfully.");
            await Promise.all([
                loadMonthlySheet(),
                loadAllRecords(),
                loadSummaryStats()
            ]);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete entry.");
        }
    };

    // Print Log Sheet
    const handlePrintSheet = () => {
        window.print();
    };

    // Export Sheet as CSV
    const handleExportCSV = () => {
        if (!sheetData.entries || sheetData.entries.length === 0) {
            alert("No log entries to export.");
            return;
        }

        const headers = [
            "Date",
            "Start Time",
            "End Time",
            "HMR Start",
            "HMR End",
            "Total Hours",
            "KM Start",
            "KM End",
            "Total KM",
            "Work Description",
            "Site Incharge Sign",
            "Operator Sign",
            "Remarks"
        ];
        
        const rows = sheetData.entries.map(e => [
            formatDateDMY(e.logbook_date),
            `"${e.start_time || ''}"`,
            `"${e.end_time || ''}"`,
            e.hours_start !== null ? e.hours_start : '',
            e.hours_end !== null ? e.hours_end : '',
            e.total_hours !== null ? e.total_hours : '',
            e.kmh_start !== null ? e.kmh_start : '',
            e.kmh_end !== null ? e.kmh_end : '',
            e.total_kmh !== null ? e.total_kmh : '',
            `"${(e.work_description || '').replace(/"/g, '""')}"`,
            `"${e.site_incharge_sign || ''}"`,
            `"${e.operator_sign || ''}"`,
            `"${(e.remarks || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Logbook_${(sheetData.header?.crane_reg_no || 'Crane').replace(/\s+/g, '_')}_${(selectedMonth || 'Month').replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Find selected crane & site objects for labels
    const currentCrane = filterOptions.registered_cranes?.find(c => String(c.id) === String(selectedCraneId));
    const currentSite = filterOptions.sites?.find(s => String(s.id) === String(selectedSiteId));

    return (
        <div className="dashboard-wrapper">
            <Sidebar />

            <main className="main-content logbook-container">
                {/* Header Section */}
                <header className="module-header no-print">
                    <div className="header-titles">
                        <div className="title-row">
                            <h1>Crane Daily Logbook</h1>
                            <span className="live-status-pill">
                                <span className="status-dot"></span>
                                {isOperator ? `Operator Portal: ${user?.name || user?.user_id}` : 'Admin & Fleet Control'}
                            </span>
                        </div>
                        <p>Daily shift operation logs, HMR start/end hours, KM odometer readings & official physical monthly log sheet</p>
                    </div>

                    {/* Top Action Buttons */}
                    <div className="header-actions">
                        <button 
                            className="btn-action-outline" 
                            onClick={handleExportCSV}
                            title="Export to CSV spreadsheet"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Export CSV
                        </button>
                        <button 
                            className="btn-action-primary" 
                            onClick={handlePrintSheet}
                            title="Print official Jainex logbook sheet"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                <rect x="6" y="14" width="12" height="8"></rect>
                            </svg>
                            Print Log Sheet
                        </button>
                    </div>
                </header>

                {/* Overall Summary Stats Ribbon */}
                <div className="logbook-stats-ribbon no-print">
                    <div className="ribbon-card">
                        <div className="ribbon-icon blue">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="7" width="20" height="14" rx="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                            </svg>
                        </div>
                        <div>
                            <span className="ribbon-val">{overallStats?.active_cranes_logged || filterOptions.registered_cranes?.length || 0}</span>
                            <span className="ribbon-lbl">Cranes Logged</span>
                        </div>
                    </div>

                    <div className="ribbon-card">
                        <div className="ribbon-icon green">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                        </div>
                        <div>
                            <span className="ribbon-val">{overallStats?.active_sites_logged || filterOptions.sites?.length || 0}</span>
                            <span className="ribbon-lbl">Active Sites</span>
                        </div>
                    </div>

                    <div className="ribbon-card">
                        <div className="ribbon-icon purple">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <div>
                            <span className="ribbon-val">{overallStats?.total_hours_worked || sheetData.summary?.total_hours_worked || '0.00'} hrs</span>
                            <span className="ribbon-lbl">Total Working Hours</span>
                        </div>
                    </div>

                    <div className="ribbon-card">
                        <div className="ribbon-icon amber">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="12" x2="16" y2="8"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        <div>
                            <span className="ribbon-val">{overallStats?.total_kmh_run || sheetData.summary?.total_kmh_run || '0.00'} km</span>
                            <span className="ribbon-lbl">Total Distance / KM</span>
                        </div>
                    </div>
                </div>

                {/* Main Navigation Tabs */}
                <div className="logbook-tab-navigation no-print">
                    <button 
                        className={`tab-nav-btn ${activeTab === 'sheet' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sheet')}
                    >
                        <span className="tab-icon">📄</span>
                        <span>Monthly Sheet (Physical Layout)</span>
                        <span className="tab-count-badge">{sheetData.entries.length}</span>
                    </button>

                    <button 
                        className={`tab-nav-btn ${activeTab === 'form' ? 'active' : ''}`}
                        onClick={() => setActiveTab('form')}
                    >
                        <span className="tab-icon">✍️</span>
                        <span>{editingEntryId ? 'Edit Log Entry' : 'Daily Log Entry Form'}</span>
                        {isOperator && <span className="tab-pill-highlight">Operator Form</span>}
                    </button>

                    <button 
                        className={`tab-nav-btn ${activeTab === 'table' ? 'active' : ''}`}
                        onClick={() => setActiveTab('table')}
                    >
                        <span className="tab-icon">📋</span>
                        <span>All Records Register</span>
                    </button>
                </div>

                {/* ========================================================================= */}
                {/* TAB 1: PHYSICAL MONTHLY LOG SHEET REPLICA */}
                {/* ========================================================================= */}
                {activeTab === 'sheet' && (
                    <div className="tab-pane-sheet">
                        {/* Interactive Filter Bar */}
                        <div className="sheet-controls-bar no-print">
                            <div className="control-item">
                                <label>Select Crane:</label>
                                <select 
                                    value={selectedCraneId} 
                                    onChange={(e) => setSelectedCraneId(e.target.value)}
                                >
                                    <option value="">All Cranes</option>
                                    {filterOptions.registered_cranes?.map(rc => (
                                        <option key={rc.id} value={rc.id}>
                                            {rc.reg_no} ({rc.model})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="control-item">
                                <label>Select Site:</label>
                                <select 
                                    value={selectedSiteId} 
                                    onChange={(e) => setSelectedSiteId(e.target.value)}
                                >
                                    <option value="">All Sites</option>
                                    {filterOptions.sites?.map(st => (
                                        <option key={st.id} value={st.id}>
                                            {st.site_name} {st.client_name ? `(${st.client_name})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="control-item">
                                <label>Month:</label>
                                <select 
                                    value={selectedMonth} 
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                >
                                    {filterOptions.logged_months?.length > 0 ? (
                                        filterOptions.logged_months.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))
                                    ) : (
                                        <option value="August 2026">August 2026</option>
                                    )}
                                    <option value="September 2026">September 2026</option>
                                    <option value="October 2026">October 2026</option>
                                    <option value="November 2026">November 2026</option>
                                    <option value="December 2026">December 2026</option>
                                </select>
                            </div>

                            <div className="control-actions">
                                <button 
                                    className="btn-sheet-quick-add"
                                    onClick={() => {
                                        if (selectedCraneId) setFormCraneId(selectedCraneId);
                                        if (selectedSiteId) setFormSiteId(selectedSiteId);
                                        setActiveTab('form');
                                    }}
                                >
                                    + Add Day Entry
                                </button>
                            </div>
                        </div>

                        {/* Physical Sheet Card */}
                        <div className="physical-sheet-card" ref={printAreaRef}>
                            {/* Header: Company Title & Address */}
                            <div className="physical-sheet-header">
                                <h2 className="company-main-title">JAINEX PARIWAHAN PVT. LTD.</h2>
                                <p className="company-sub-address">Chatribari Road, Guwahati-1</p>
                            </div>

                            {/* Meta row matching handwritten physical logbook header */}
                            <div className="physical-meta-row">
                                <div className="meta-left">
                                    <div className="meta-field">
                                        <span className="field-title">Log Sheet for Month of:</span>
                                        <span className="field-value cursive-font">{sheetData.header?.month || selectedMonth}</span>
                                    </div>
                                    <div className="meta-field">
                                        <span className="field-title">Party / Client Name:</span>
                                        <span className="field-value cursive-font bold-party">
                                            {sheetData.header?.party_name || currentSite?.client_name || "Vaksim Contraction Pvt Ltd"}
                                        </span>
                                    </div>
                                    {sheetData.header?.site_name && (
                                        <div className="meta-field">
                                            <span className="field-title">Site:</span>
                                            <span className="field-value">{sheetData.header?.site_name}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="meta-right">
                                    <div className="meta-field crane-box">
                                        <span className="field-title">Crane Registration No.:</span>
                                        <span className="field-value crane-reg-highlight cursive-font">
                                            {sheetData.header?.crane_reg_no !== 'N/A' 
                                                ? sheetData.header?.crane_reg_no 
                                                : (currentCrane?.reg_no || 'NL01 DA 0280')}
                                        </span>
                                    </div>
                                    {sheetData.header?.crane_model && (
                                        <div className="meta-field">
                                            <span className="field-title">Model:</span>
                                            <span className="field-value">{sheetData.header?.crane_model}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Multi-Column Structured Grid Table (Matches new table schema) */}
                            <div className="physical-table-wrapper">
                                <table className="physical-logbook-table">
                                    <thead>
                                        <tr>
                                            <th rowSpan="2" className="col-date">Date</th>
                                            <th colSpan="2" className="col-time-group">Work Timing</th>
                                            <th colSpan="3" className="col-hmr-group">Hour Meter Reading (HMR)</th>
                                            <th colSpan="3" className="col-km-group">KM / Speedometer</th>
                                            <th rowSpan="2" className="col-work">Work Description</th>
                                            <th rowSpan="2" className="col-incharge">Site Incharge Sign</th>
                                            <th rowSpan="2" className="col-op-sign">Operator Sign</th>
                                            <th rowSpan="2" className="col-remarks">Remarks</th>
                                            <th rowSpan="2" className="col-actions no-print">Action</th>
                                        </tr>
                                        <tr>
                                            <th className="col-sub">Start</th>
                                            <th className="col-sub">End</th>
                                            <th className="col-sub">HMR Start</th>
                                            <th className="col-sub">HMR End</th>
                                            <th className="col-sub col-calc">Total Hrs</th>
                                            <th className="col-sub">KM Start</th>
                                            <th className="col-sub">KM End</th>
                                            <th className="col-sub col-calc">Total KM</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="14" className="sheet-loading-row">Loading logbook records...</td>
                                            </tr>
                                        ) : sheetData.entries.length === 0 ? (
                                            <tr>
                                                <td colSpan="14" className="sheet-empty-row">
                                                    No entries recorded for this selection. Click <strong>"+ Add Day Entry"</strong> to log the first day!
                                                </td>
                                            </tr>
                                        ) : (
                                            sheetData.entries.map((entry, idx) => (
                                                <tr key={entry.id || idx}>
                                                    <td className="col-date date-cell">{formatDateDMY(entry.logbook_date)}</td>
                                                    <td className="col-time">{entry.start_time || '-'}</td>
                                                    <td className="col-time">{entry.end_time || '-'}</td>
                                                    <td className="col-reading">{entry.hours_start !== null ? entry.hours_start : '-'}</td>
                                                    <td className="col-reading">{entry.hours_end !== null ? entry.hours_end : '-'}</td>
                                                    <td className="col-calc-val bold-reading">{entry.total_hours !== null ? `${entry.total_hours} hrs` : '-'}</td>
                                                    <td className="col-km">{entry.kmh_start !== null ? entry.kmh_start : '-'}</td>
                                                    <td className="col-km">{entry.kmh_end !== null ? entry.kmh_end : '-'}</td>
                                                    <td className="col-calc-val">{entry.total_kmh !== null ? `${entry.total_kmh} km` : '-'}</td>
                                                    <td className="col-work work-cell">
                                                        <span className="work-text cursive-font">{entry.work_description}</span>
                                                    </td>
                                                    <td className="col-incharge sign-cell">
                                                        {entry.site_incharge_sign && (
                                                            <span className="signature-pill incharge-sig">
                                                                <span className="sig-handwritten">{entry.site_incharge_sign}</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="col-op-sign sign-cell">
                                                        <span className="signature-pill op-sig">
                                                            <span className="sig-handwritten">{entry.operator_sign || 'Operator'}</span>
                                                        </span>
                                                    </td>
                                                    <td className="col-remarks">{entry.remarks || ''}</td>
                                                    <td className="col-actions no-print">
                                                        <button 
                                                            className="btn-mini-edit" 
                                                            onClick={() => handleEditEntry(entry)}
                                                            title="Edit entry"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button 
                                                            className="btn-mini-delete" 
                                                            onClick={() => handleDeleteEntry(entry.id)}
                                                            title="Delete entry"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    {/* Monthly Summary Footer */}
                                    {sheetData.entries.length > 0 && (
                                        <tfoot>
                                            <tr className="summary-total-row">
                                                <td colSpan="3" className="summary-title-cell">MONTHLY TOTALS:</td>
                                                <td colSpan="2" className="summary-range">
                                                    HMR Range: {sheetData.summary?.initial_hours_reading || '-'} → {sheetData.summary?.final_hours_reading || '-'}
                                                </td>
                                                <td className="summary-val-cell bold-reading">
                                                    <strong>{sheetData.summary?.total_hours_worked || '0.00'} hrs</strong>
                                                </td>
                                                <td colSpan="2" className="summary-range">
                                                    KM Range: {sheetData.summary?.initial_kmh_reading || '-'} → {sheetData.summary?.final_kmh_reading || '-'}
                                                </td>
                                                <td className="summary-val-cell bold-km">
                                                    <strong>{sheetData.summary?.total_kmh_run || '0.00'} km</strong>
                                                </td>
                                                <td colSpan="5" className="summary-meta-cell">
                                                    Total Days Logged: <strong>{sheetData.summary?.total_entries || 0} entries</strong>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>

                            {/* Signatures Footer */}
                            <div className="physical-sheet-signatures">
                                <div className="sig-block">
                                    <div className="sig-line"></div>
                                    <span className="sig-label">Site Incharge Signature</span>
                                    <span className="sig-sub">(Client Representative)</span>
                                </div>

                                <div className="sig-block">
                                    <div className="sig-line"></div>
                                    <span className="sig-label">Operator Signature</span>
                                    <span className="sig-sub">(Crane Operator)</span>
                                </div>

                                <div className="sig-block">
                                    <div className="sig-line"></div>
                                    <span className="sig-label">Authorized Signatory</span>
                                    <span className="sig-sub">For JAINEX PARIWAHAN PVT. LTD.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: DAILY LOG ENTRY FORM */}
                {/* ========================================================================= */}
                {activeTab === 'form' && (
                    <div className="tab-pane-form">
                        <div className="logbook-form-card">
                            <div className="form-card-header">
                                <div>
                                    <h3>{editingEntryId ? '📝 Edit Crane Logbook Entry' : '📝 Daily Crane Logbook Entry'}</h3>
                                    <p>Fill in today's site, crane, timings, HMR readings, and work description</p>
                                </div>
                                {isOperator && (
                                    <button 
                                        type="button" 
                                        className="btn-autofill" 
                                        onClick={handleAutofillActiveAssignment}
                                    >
                                        ⚡ 1-Click Autofill Assigned Site & Crane
                                    </button>
                                )}
                            </div>

                            {successMessage && (
                                <div className="form-alert success">
                                    <span>✓ {successMessage}</span>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="form-alert error">
                                    <span>⚠️ {errorMessage}</span>
                                </div>
                            )}

                            <form onSubmit={handleFormSubmit} className="daily-entry-form">
                                {/* Section 1: Date & Period & References */}
                                <div className="form-section-title">
                                    <span>1. Assignment & Date Details</span>
                                </div>

                                <div className="form-row-4">
                                    <div className="input-group">
                                        <label>Logbook Date <span className="req">*</span></label>
                                        <input 
                                            type="date" 
                                            value={formDate} 
                                            onChange={(e) => setFormDate(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Month Period <span className="req">*</span></label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. August 2026"
                                            value={formMonth}
                                            onChange={(e) => setFormMonth(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Site <span className="req">*</span></label>
                                        <select 
                                            value={formSiteId} 
                                            onChange={(e) => setFormSiteId(e.target.value)}
                                            required
                                        >
                                            <option value="">-- Select Site --</option>
                                            {filterOptions.sites?.map(st => (
                                                <option key={st.id} value={st.id}>
                                                    {st.site_name} {st.client_name ? `(${st.client_name})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label>Crane <span className="req">*</span></label>
                                        <select 
                                            value={formCraneId} 
                                            onChange={(e) => setFormCraneId(e.target.value)}
                                            required
                                        >
                                            <option value="">-- Select Crane --</option>
                                            {filterOptions.registered_cranes?.map(cr => (
                                                <option key={cr.id} value={cr.id}>
                                                    {cr.reg_no} - {cr.model} {cr.capacity ? `(${cr.capacity})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Section 2: Work Time Duration */}
                                <div className="form-section-title">
                                    <span>2. Work Timing & Duration</span>
                                </div>

                                <div className="form-row-2">
                                    <div className="input-group">
                                        <label>Start Time (Work Begin)</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. 08:00 AM or 08:00"
                                            value={formStartTime}
                                            onChange={(e) => setFormStartTime(e.target.value)}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>End Time (Work Finish)</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. 05:00 PM or 17:00"
                                            value={formEndTime}
                                            onChange={(e) => setFormEndTime(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Section 3: HMR Readings & KM Readings */}
                                <div className="form-section-title">
                                    <span>3. Hour Meter Readings (HMR) & KM Odometer</span>
                                </div>

                                <div className="readings-grid-container">
                                    {/* HMR Group */}
                                    <div className="reading-sub-box">
                                        <h4 className="reading-box-title">⏱️ Hour Meter Reading (HMR)</h4>
                                        <div className="reading-inputs-row">
                                            <div className="input-group">
                                                <label>HMR Start Reading</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    placeholder="e.g. 4650.00"
                                                    value={formHoursStart}
                                                    onChange={(e) => setFormHoursStart(e.target.value)}
                                                />
                                            </div>

                                            <div className="input-group">
                                                <label>HMR End Reading</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    placeholder="e.g. 4658.50"
                                                    value={formHoursEnd}
                                                    onChange={(e) => setFormHoursEnd(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="calculated-preview-badge">
                                            <span>Calculated Total Hours:</span>
                                            <strong>{calculatedFormHours !== null ? `${calculatedFormHours} hrs` : '--'}</strong>
                                        </div>
                                    </div>

                                    {/* KM Odometer Group */}
                                    <div className="reading-sub-box">
                                        <h4 className="reading-box-title">🚗 Speedometer / Odometer (KM)</h4>
                                        <div className="reading-inputs-row">
                                            <div className="input-group">
                                                <label>KM / KMH Start</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    placeholder="e.g. 100.00"
                                                    value={formKmhStart}
                                                    onChange={(e) => setFormKmhStart(e.target.value)}
                                                />
                                            </div>

                                            <div className="input-group">
                                                <label>KM / KMH End</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    placeholder="e.g. 125.00"
                                                    value={formKmhEnd}
                                                    onChange={(e) => setFormKmhEnd(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="calculated-preview-badge km-badge">
                                            <span>Calculated Total KM:</span>
                                            <strong>{calculatedFormKm !== null ? `${calculatedFormKm} km` : '--'}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Work Activity & Presets */}
                                <div className="form-section-title">
                                    <span>4. Work Description & Activity Details</span>
                                </div>

                                <div className="work-preset-section">
                                    <label className="section-label">⚡ Quick Activity Suggestions (Click to apply):</label>
                                    <div className="preset-chips-grid">
                                        {QUICK_WORK_PRESETS.map((preset, pIdx) => (
                                            <button
                                                key={pIdx}
                                                type="button"
                                                className={`preset-chip ${formWorkDesc === preset.text ? 'selected' : ''}`}
                                                onClick={() => handleSelectPreset(preset)}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="input-group full-width">
                                    <label>Work Description <span className="req">*</span></label>
                                    <textarea 
                                        rows="3"
                                        placeholder="e.g. Bresing eraction working, Beem eraction, Store material working, Ideal, etc."
                                        value={formWorkDesc}
                                        onChange={(e) => setFormWorkDesc(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                {/* Section 5: Signatures & Remarks */}
                                <div className="form-section-title">
                                    <span>5. Signatures & Remarks</span>
                                </div>

                                <div className="form-row-3">
                                    <div className="input-group">
                                        <label>Site Incharge Signature / Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Kuldeep"
                                            value={formSiteInchargeSign}
                                            onChange={(e) => setFormSiteInchargeSign(e.target.value)}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Operator Signature / Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Chandrajit"
                                            value={formOperatorSign}
                                            onChange={(e) => setFormOperatorSign(e.target.value)}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Remarks / Breakdown Notes</label>
                                        <input 
                                            type="text" 
                                            placeholder="Optional observations or breakdown details"
                                            value={formRemarks}
                                            onChange={(e) => setFormRemarks(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Form Submit Actions */}
                                <div className="form-actions-bar">
                                    {editingEntryId && (
                                        <button 
                                            type="button" 
                                            className="btn-cancel" 
                                            onClick={handleCancelEdit}
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                    <button 
                                        type="submit" 
                                        className="btn-submit-log"
                                        disabled={submitting}
                                    >
                                        {submitting ? "Saving Logbook..." : (editingEntryId ? "Update Entry" : "Save Daily Log Entry")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 3: ALL RECORDS REGISTER VIEW */}
                {/* ========================================================================= */}
                {activeTab === 'table' && (
                    <div className="tab-pane-table">
                        <div className="register-filter-bar no-print">
                            <div className="filter-item">
                                <label>Search:</label>
                                <input 
                                    type="text" 
                                    placeholder="Search work, site, client, remarks..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && loadAllRecords()}
                                />
                            </div>

                            <div className="filter-item">
                                <label>Crane:</label>
                                <select value={selectedCraneId} onChange={(e) => setSelectedCraneId(e.target.value)}>
                                    <option value="">All Cranes</option>
                                    {filterOptions.registered_cranes?.map(cr => (
                                        <option key={cr.id} value={cr.id}>{cr.reg_no} ({cr.model})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-item">
                                <label>Site:</label>
                                <select value={selectedSiteId} onChange={(e) => setSelectedSiteId(e.target.value)}>
                                    <option value="">All Sites</option>
                                    {filterOptions.sites?.map(st => (
                                        <option key={st.id} value={st.id}>{st.site_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-item">
                                <label>From Date:</label>
                                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                            </div>

                            <div className="filter-item">
                                <label>To Date:</label>
                                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                            </div>

                            <button className="btn-filter-apply" onClick={loadAllRecords}>
                                Filter
                            </button>
                        </div>

                        <div className="register-table-card">
                            <table className="register-data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Crane</th>
                                        <th>Site / Client</th>
                                        <th>Timing</th>
                                        <th>HMR Start → End</th>
                                        <th>Total Hours</th>
                                        <th>KM Start → End</th>
                                        <th>Total KM</th>
                                        <th>Work Description</th>
                                        <th>Signatures</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="11" className="table-loading">Loading entries...</td></tr>
                                    ) : recordsList.length === 0 ? (
                                        <tr><td colSpan="11" className="table-empty">No log records found matching the criteria.</td></tr>
                                    ) : (
                                        recordsList.map((row) => (
                                            <tr key={row.id}>
                                                <td className="bold-cell">{formatDateDMY(row.logbook_date)}</td>
                                                <td>
                                                    <span className="reg-badge">{row.crane_reg_no || `Crane #${row.crane_number_id}`}</span>
                                                    {row.crane_model && <div className="sub-detail">{row.crane_model}</div>}
                                                </td>
                                                <td>
                                                    <div className="site-name-val">{row.site_name || `Site #${row.site_id}`}</div>
                                                    {row.party_name && <div className="client-name-val">{row.party_name}</div>}
                                                </td>
                                                <td>{row.start_time && row.end_time ? `${row.start_time} - ${row.end_time}` : (row.start_time || row.end_time || '-')}</td>
                                                <td>
                                                    {row.hours_start !== null && row.hours_end !== null 
                                                        ? `${row.hours_start} → ${row.hours_end}`
                                                        : (row.hours_start || row.hours_end || '-')}
                                                </td>
                                                <td className="bold-cell">{row.total_hours !== null ? `${row.total_hours} hrs` : '-'}</td>
                                                <td>
                                                    {row.kmh_start !== null && row.kmh_end !== null 
                                                        ? `${row.kmh_start} → ${row.kmh_end}`
                                                        : (row.kmh_start || row.kmh_end || '-')}
                                                </td>
                                                <td>{row.total_kmh !== null ? `${row.total_kmh} km` : '-'}</td>
                                                <td>
                                                    <div className="work-desc-cell">{row.work_description}</div>
                                                    {row.remarks && <div className="remarks-cell">Note: {row.remarks}</div>}
                                                </td>
                                                <td>
                                                    <div className="sigs-summary">
                                                        {row.operator_sign && <div>👤 Op: <strong>{row.operator_sign}</strong></div>}
                                                        {row.site_incharge_sign && <div>👷 Inc: <strong>{row.site_incharge_sign}</strong></div>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="row-action-btns">
                                                        <button 
                                                            className="btn-action-edit" 
                                                            onClick={() => handleEditEntry(row)}
                                                            title="Edit"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            className="btn-action-del" 
                                                            onClick={() => handleDeleteEntry(row.id)}
                                                            title="Delete"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Logbook;
