import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, Building2, FileText } from 'lucide-react';
import Header from '../components/Layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import { getPendingStartups, verifyStartup, rejectStartup } from '../services/api';
import './PendingStartups.css';

const PendingStartups = () => {
    const [startups, setStartups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadStartups();
    }, []);

    const loadStartups = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getPendingStartups();
            setStartups(response.data?.startups || []);
        } catch (err) {
            console.error('Failed to load startups:', err);
            setError(err.response?.data?.error || 'Failed to load pending startups. Make sure you are logged in as admin.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id) => {
        try {
            await verifyStartup(id);
            setStartups(startups.filter(s => s._id !== id));
        } catch (err) {
            console.error('Failed to verify startup:', err);
            setError(err.response?.data?.error || 'Failed to verify startup');
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            await rejectStartup(id, reason);
            setStartups(startups.filter(s => s._id !== id));
        } catch (err) {
            console.error('Failed to reject startup:', err);
            setError(err.response?.data?.error || 'Failed to reject startup');
        }
    };

    const openDocument = (url) => {
        window.open(url, '_blank');
    };

    return (
        <div className="pending-startups">
            <Header title="Pending Startups" />

            <div className="page-content">
                {error && <div className="error-banner">{error}</div>}

                <Card>
                    <CardHeader>
                        <div className="card-header-row">
                            <CardTitle>Verification Queue</CardTitle>
                            <span className="badge">{startups.length} pending</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : startups.length === 0 ? (
                            <div className="empty-state">
                                <CheckCircle size={48} />
                                <h3>All caught up!</h3>
                                <p>No pending startups to verify.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableHeader>Company</TableHeader>
                                        <TableHeader>Type</TableHeader>
                                        <TableHeader>Stage</TableHeader>
                                        <TableHeader>Documents</TableHeader>
                                        <TableHeader>Applied</TableHeader>
                                        <TableHeader>Actions</TableHeader>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {startups.map((startup) => (
                                        <TableRow key={startup._id}>
                                            <TableCell>
                                                <div className="company-cell">
                                                    <div className="company-icon">
                                                        <Building2 size={20} />
                                                    </div>
                                                    <div className="company-info">
                                                        <span className="company-name">{startup.companyName}</span>
                                                        <span className="company-email">{startup.user?.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{startup.companyType || 'N/A'}</TableCell>
                                            <TableCell>
                                                <span className="stage-badge">{startup.stage || 'N/A'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="documents-cell">
                                                    {/* Main document */}
                                                    {startup.documents && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openDocument(startup.documents)}
                                                            title="View main document"
                                                        >
                                                            <FileText size={16} />
                                                            <ExternalLink size={12} />
                                                        </Button>
                                                    )}
                                                    {/* Verification documents */}
                                                    {startup.verificationDocuments?.map((doc, idx) => (
                                                        <Button
                                                            key={idx}
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openDocument(doc.url)}
                                                            title={`View ${doc.type}`}
                                                        >
                                                            <FileText size={16} />
                                                            <span className="doc-type">{doc.type}</span>
                                                        </Button>
                                                    ))}
                                                    {!startup.documents && !startup.verificationDocuments?.length && (
                                                        <span className="no-docs">No docs</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{new Date(startup.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <div className="action-buttons">
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleVerify(startup._id)}
                                                    >
                                                        <CheckCircle size={16} />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleReject(startup._id)}
                                                    >
                                                        <XCircle size={16} />
                                                        Reject
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PendingStartups;
