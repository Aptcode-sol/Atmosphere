import { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, DollarSign } from 'lucide-react';
import Header from '../components/Layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table';
import { getHoldings } from '../services/api';
import './Holdings.css';

const Holdings = () => {
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHoldings();
    }, []);

    const loadHoldings = async () => {
        try {
            // Mock data until backend is ready
            setHoldings([
                {
                    _id: '1',
                    investorName: 'John Anderson',
                    startupName: 'TechFlow Inc',
                    amount: '$150,000',
                    date: '2024-12-10',
                    round: 'Seed',
                },
                {
                    _id: '2',
                    investorName: 'Sarah Miller',
                    startupName: 'CloudSync',
                    amount: '$75,000',
                    date: '2024-12-08',
                    round: 'Pre-Seed',
                },
                {
                    _id: '3',
                    investorName: 'Mike Johnson',
                    startupName: 'AI Analytics Pro',
                    amount: '$200,000',
                    date: '2024-12-05',
                    round: 'Seed',
                },
            ]);
        } catch (error) {
            console.error('Failed to load holdings:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalInvested = holdings.reduce((sum, h) => {
        const amount = parseInt(h.amount.replace(/[^0-9]/g, ''));
        return sum + amount;
    }, 0);

    return (
        <div className="holdings-page">
            <Header title="Investor Holdings" />

            <div className="page-content">
                <div className="stats-row">
                    <Card className="stat-card-small">
                        <CardContent>
                            <div className="stat-small">
                                <Briefcase size={24} />
                                <div>
                                    <span className="stat-value-small">{holdings.length}</span>
                                    <span className="stat-label-small">Total Holdings</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="stat-card-small">
                        <CardContent>
                            <div className="stat-small">
                                <DollarSign size={24} />
                                <div>
                                    <span className="stat-value-small">${totalInvested.toLocaleString()}</span>
                                    <span className="stat-label-small">Total Invested</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Holdings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableHeader>Investor</TableHeader>
                                        <TableHeader>Startup</TableHeader>
                                        <TableHeader>Amount</TableHeader>
                                        <TableHeader>Round</TableHeader>
                                        <TableHeader>Date</TableHeader>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {holdings.map((holding) => (
                                        <TableRow key={holding._id}>
                                            <TableCell>
                                                <div className="investor-cell">
                                                    <div className="investor-avatar">
                                                        {holding.investorName.charAt(0)}
                                                    </div>
                                                    <span>{holding.investorName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{holding.startupName}</TableCell>
                                            <TableCell>
                                                <span className="amount">{holding.amount}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="round-badge">{holding.round}</span>
                                            </TableCell>
                                            <TableCell>{new Date(holding.date).toLocaleDateString()}</TableCell>
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
