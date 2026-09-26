import { useState, useEffect, useContext } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar/Sidebar';
import AddSiteModal from './AddSiteModal';
import ViewSiteModal from './ViewSiteModal';
import './Sites.css';

const Sites = () => {
    const { user } = useContext(AuthContext);
    const [sites, setSites] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedSite, setSelectedSite] = useState(null);
    const [siteToEdit, setSiteToEdit] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSites = async () => {
        try {
            setLoading(true);
            const res = await API.get('/sites/list');
            setSites(res.data || []);
        } catch (err) {
            console.error('Error fetching sites:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

    // Filter sites based on search term & status filter
    const filteredSites = sites.filter(site => {
        const matchesSearch =
            (site.site_name && site.site_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (site.site_code && site.site_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (site.client_name && site.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (site.city && site.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (site.site_incharge_name && site.site_incharge_name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'All' || site.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Compute stats
    const totalSites = sites.length;
    const activeSites = sites.filter(s => s.status === 'Active').length;
    const completedSites = sites.filter(s => s.status === 'Completed').length;
    const onHoldSites = sites.filter(s => s.status === 'On Hold').length;

    const handleViewClick = (site) => {
        setSelectedSite(site);
        setShowViewModal(true);
    };

    const handleEditClick = (site) => {
        setSiteToEdit(site);
        setShowAddModal(true);
    };

    const handleDeleteClick = async (site) => {
        const confirmed = window.confirm(`Are you sure you want to delete site "${site.site_name}"? This action cannot be undone.`);
        if (!confirmed) return;

        try {
            await API.delete(`/sites/${site.id}`);
            alert('Site deleted successfully');
            fetchSites();
        } catch (err) {
            console.error('Error deleting site:', err);
            alert(err.response?.data?.error || 'Failed to delete site');
        }
    };

    const handleExportExcel = () => {
        if (!sites || sites.length === 0) {
            alert('No site data available to export.');
            return;
        }

        const dataToExport = filteredSites.map((site, index) => ({
            'S.No': index + 1,
            'Site Code': site.site_code || `SITE-${String(site.id).padStart(3, '0')}`,
            'Site Name': site.site_name || '',
            'Client Name': site.client_name || 'N/A',
            'Incharge Name': site.site_incharge_name || 'N/A',
            'City': site.city || 'N/A',
            'State': site.state || 'N/A',
            'Pincode': site.pincode || 'N/A',
            'Location': site.location || 'N/A',
            'Start Date': site.start_date ? new Date(site.start_date).toLocaleDateString() : 'N/A',
            'End Date': site.end_date ? new Date(site.end_date).toLocaleDateString() : 'N/A',
            'Status': site.status || 'Active',
            'Created By': site.created_by || 'Admin',
            'Created Date': site.created_at ? new Date(site.created_at).toLocaleDateString() : 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sites');
        XLSX.writeFile(workbook, `Sites_Master_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!sites || sites.length === 0) {
            alert('No site data available to export.');
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });

        // Header Title
        doc.setFontSize(18);
        doc.setTextColor(26, 45, 66);
        doc.text('Sites Master Report', 14, 18);

        // Subtitle
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${filteredSites.length}`, 14, 25);

        const tableColumn = ['Code', 'Site Name', 'Client', 'Incharge', 'City', 'Start Date', 'End Date', 'Status'];
        const tableRows = filteredSites.map(site => [
            site.site_code || `SITE-${String(site.id).padStart(3, '0')}`,
            site.site_name || 'N/A',
            site.client_name || 'N/A',
            site.site_incharge_name || 'N/A',
            site.city || 'N/A',
            site.start_date ? new Date(site.start_date).toLocaleDateString() : 'N/A',
            site.end_date ? new Date(site.end_date).toLocaleDateString() : 'N/A',
            site.status || 'Active'
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
                fontSize: 8.5,
                cellPadding: 4,
                textColor: [30, 41, 59]
            }
        });

        doc.save(`Sites_Master_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const canManageSites = user?.role === 'Admin' || user?.role === 'Supervisor' || !user;
    const canDeleteSites = user?.role === 'Admin' || !user;

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="main-content">
                <div className="module-container">
                    <header className="module-header">
                        <div className="header-titles">
                            <h1>Site Master</h1>
                            <p>Manage project worksites and client locations</p>
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

                    {/* Stats Overview */}
                    <div className="sites-stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">📍</div>
                            <div className="stat-info">
                                <span className="stat-value">{totalSites}</span>
                                <span className="stat-label">Total Sites</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#dcfce7' }}>🟢</div>
                            <div className="stat-info">
                                <span className="stat-value">{activeSites}</span>
                                <span className="stat-label">Active Sites</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#e0e7ff' }}>🏁</div>
                            <div className="stat-info">
                                <span className="stat-value">{completedSites}</span>
                                <span className="stat-label">Completed</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#fef9c3' }}>⏸️</div>
                            <div className="stat-info">
                                <span className="stat-value">{onHoldSites}</span>
                                <span className="stat-label">On Hold</span>
                            </div>
                        </div>
                    </div>

                    <section className="table-card">
                        <div className="table-controls">
                            <div className="search-filter-group">
                                <div className="search-box">
                                    <input
                                        type="text"
                                        placeholder="Search by site name, code, client, city..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="status-filter-select"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Completed">Completed</option>
                                    <option value="On Hold">On Hold</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            {canManageSites && (
                                <button
                                    className="btn-add-site"
                                    onClick={() => {
                                        setSiteToEdit(null);
                                        setShowAddModal(true);
                                    }}
                                >
                                    + Add Site
                                </button>
                            )}
                        </div>

                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Site Name & Client</th>
                                    <th>Incharge</th>
                                    <th>City / State</th>
                                    <th>Dates</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="table-empty">Loading sites...</td></tr>
                                ) : filteredSites.length === 0 ? (
                                    <tr><td colSpan="7" className="table-empty">No sites found. Click "+ Add Site" to create one.</td></tr>
                                ) : (
                                    filteredSites.map((site) => (
                                        <tr key={site.id}>
                                            <td>
                                                <span className="site-code-badge">
                                                    {site.site_code || `SITE-${String(site.id).padStart(3, '0')}`}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="site-name-cell">{site.site_name}</div>
                                                <div className="client-name-sub">
                                                    {site.client_name ? `Client: ${site.client_name}` : 'Internal'}
                                                </div>
                                            </td>
                                            <td>{site.site_incharge_name || '—'}</td>
                                            <td>{[site.city, site.state].filter(Boolean).join(', ') || '—'}</td>
                                            <td style={{ fontSize: '0.85rem' }}>
                                                {site.start_date ? new Date(site.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                {site.end_date ? ` to ${new Date(site.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                                            </td>
                                            <td>
                                                <span className={`status-pill ${site.status.toLowerCase().replace(' ', '-')}`}>
                                                    {site.status}
                                                </span>
                                            </td>
                                            <td className="action-cell">
                                                <button
                                                    className="btn-view-action"
                                                    onClick={() => handleViewClick(site)}
                                                    title="View site details"
                                                >
                                                    View
                                                </button>
                                                {canManageSites && (
                                                    <button
                                                        className="btn-edit-action"
                                                        onClick={() => handleEditClick(site)}
                                                        title="Edit site details"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {canDeleteSites && (
                                                    <button
                                                        className="btn-delete-action"
                                                        onClick={() => handleDeleteClick(site)}
                                                        title="Delete site"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </section>

                    {/* Add / Edit Site Modal */}
                    {showAddModal && (
                        <AddSiteModal
                            siteToEdit={siteToEdit}
                            closeModal={() => setShowAddModal(false)}
                            refreshData={fetchSites}
                        />
                    )}

                    {/* View Site Modal */}
                    {showViewModal && (
                        <ViewSiteModal
                            site={selectedSite}
                            closeModal={() => setShowViewModal(false)}
                            refreshData={fetchSites}
                            onEditClick={(site) => handleEditClick(site)}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default Sites;
