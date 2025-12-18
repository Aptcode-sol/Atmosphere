import { useState, useEffect } from 'react';
import { Briefcase, DollarSign, FileText, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import Header from '../components/Layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import { getPendingHoldings, approveHolding, rejectHolding } from '../services/api';
import './Holdings.css';

const Holdings = () => {
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadHoldings();
    }, []);

    const loadHoldings = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getPendingHoldings();
            setHoldings(response.data?.holdings || []);
        } catch (err) {
            console.error('Failed to load holdings:', err);
            setError(err.response?.data?.error || 'Failed to load pending holdings. Make sure you are logged in as admin.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (holding) => {
        try {
            await approveHolding(holding.investorId, holding.investmentIndex);
            setHoldings(holdings.filter(h =>
                !(h.investorId === holding.investorId && h.investmentIndex === holding.investmentIndex)
            ));
        } catch (err) {
            console.error('Failed to approve holding:', err);
            setError(err.response?.data?.error || 'Failed to approve holding');
        }
    };

    const handleReject = async (holding) => {
        const reason = window.prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            await rejectHolding(holding.investorId, holding.investmentIndex, reason);
            setHoldings(holdings.filter(h =>
                !(h.investorId === holding.investorId && h.investmentIndex === holding.investmentIndex)
            ));
        } catch (err) {
            console.error('Failed to reject holding:', err);
            setError(err.response?.data?.error || 'Failed to reject holding');
        }
    };

    const openDocument = (url) => {
        window.open(url, '_blank');
    };

    const totalAmount = holdings.reduce((sum, h) => sum + (h.amount || 0), 0);

    return (
        <div className="holdings-page">
            <Header title="Investor Holdings" />

            <div className="page-content">
                {error && <div className="error-banner">{error}</div>}

                <div className="stats-row">
                    <Card className="stat-card-small">
                        <CardContent>
                            <div className="stat-small">
                                <Briefcase size={24} />
                                <div>
                                    <span className="stat-value-small">{holdings.length}</span>
                                    <span className="stat-label-small">Pending Approval</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="stat-card-small">
                        <CardContent>
                            <div className="stat-small">
                                <DollarSign size={24} />
                                <div>
                                    <span className="stat-value-small">₹{totalAmount.toLocaleString()}</span>
                                    <span className="stat-label-small">Total Amount</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pending Holdings Approval</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : holdings.length === 0 ? (
                            <div className="empty-state">
                                <CheckCircle size={48} />
                                <h3>All caught up!</h3>
                                <p>No pending holdings to approve.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableHeader>Investor</TableHeader>
                                        <TableHeader>Company</TableHeader>
                                        <TableHeader>Amount</TableHeader>
                                        <TableHeader>Date</TableHeader>
                                        <TableHeader>Documents</TableHeader>
                                        <TableHeader>Actions</TableHeader>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {holdings.map((holding, idx) => (
                                        <TableRow key={`${holding.investorId}-${holding.investmentIndex}-${idx}`}>
                                            <TableCell>
                                                <div className="investor-cell">
                                                    <div className="investor-avatar">
                                                        {(holding.investorName || 'U').charAt(0)}
                                                    </div>
                                                    <div className="investor-info">
                                                        <span className="investor-name">{holding.investorName}</span>
                                                        <span className="investor-email">{holding.investorEmail}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{holding.companyName}</TableCell>
                                            <TableCell>
                                                <span className="amount">₹{(holding.amount || 0).toLocaleString()}</span>
                                            </TableCell>
                                            <TableCell>
                                                {holding.date ? new Date(holding.date).toLocaleDateString() : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="documents-cell">
                                                    {holding.docs?.length > 0 ? (
                                                        holding.docs.map((doc, docIdx) => (
                                                            <Button
                                                                key={docIdx}
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openDocument(doc)}
                                                                title="View document"
                                                            >
                                                                <FileText size={16} />
                                                                <ExternalLink size={12} />
                                                            </Button>
                                                        ))
                                                    ) : (
                                                        <span className="no-docs">No docs</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="action-buttons">
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleApprove(holding)}
                                                    >
                                                        <CheckCircle size={16} />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleReject(holding)}
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

export default Holdings;
