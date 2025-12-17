import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, Building2 } from 'lucide-react';
import Header from '../components/Layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import { getPendingStartups, verifyStartup, rejectStartup } from '../services/api';
import './PendingStartups.css';

const PendingStartups = () => {
    const [startups, setStartups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStartups();
    }, []);

    const loadStartups = async () => {
        try {
            // Mock data until backend is ready
            setStartups([
                {
                    _id: '1',
                    companyName: 'TechFlow Inc',
                    email: 'contact@techflow.com',
                    industry: 'SaaS',
                    stage: 'Seed',
                    createdAt: '2024-12-15',
                },
                {
                    _id: '2',
                    companyName: 'CloudSync',
                    email: 'hello@cloudsync.io',
                    industry: 'Cloud Infrastructure',
                    stage: 'Pre-Seed',
                    createdAt: '2024-12-14',
                },
                {
                    _id: '3',
                    companyName: 'AI Analytics Pro',
                    email: 'info@aianalytics.com',
                    industry: 'AI/ML',
                    stage: 'Seed',
                    createdAt: '2024-12-13',
                },
            ]);
        } catch (error) {
            console.error('Failed to load startups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id) => {
        try {
            await verifyStartup(id);
            setStartups(startups.filter(s => s._id !== id));
        } catch (error) {
            console.error('Failed to verify startup:', error);
        }
    };

    const handleReject = async (id) => {
        if (window.confirm('Are you sure you want to reject this startup?')) {
            try {
                await rejectStartup(id);
                setStartups(startups.filter(s => s._id !== id));
            } catch (error) {
                console.error('Failed to reject startup:', error);
            }
        }
    };

    return (
        <div className="pending-startups">
            <Header title="Pending Startups" />

            <div className="page-content">
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
                                        <TableHeader>Industry</TableHeader>
                                        <TableHeader>Stage</TableHeader>
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
                                                        <span className="company-email">{startup.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{startup.industry}</TableCell>
                                            <TableCell>
                                                <span className="stage-badge">{startup.stage}</span>
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
