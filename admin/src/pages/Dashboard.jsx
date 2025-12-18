import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Rocket, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Header from '../components/Layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { getStats } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        startups: 0,
        investors: 0,
        pendingVerifications: 0,
        pendingHoldings: 0,
    });
    const [recentSignups, setRecentSignups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getStats();
            if (response.data) {
                setStats(response.data.stats || {});
                setRecentSignups(response.data.recentSignups || []);
            }
        } catch (err) {
            console.error('Failed to load stats:', err);
            setError(err.response?.data?.error || 'Failed to load dashboard data. Make sure you are logged in as admin.');
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: '#6366f1' },
        { label: 'Startups', value: stats.startups, icon: Rocket, color: '#10b981' },
        { label: 'Investors', value: stats.investors, icon: TrendingUp, color: '#f59e0b' },
        { label: 'Pending Startups', value: stats.pendingVerifications, icon: Clock, color: '#ef4444', link: '/pending-startups' },
        { label: 'Pending Holdings', value: stats.pendingHoldings, icon: AlertCircle, color: '#8b5cf6', link: '/holdings' },
    ];

    const getTimeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHrs < 1) return 'Just now';
        if (diffHrs < 24) return `${diffHrs}h ago`;
        return `${Math.floor(diffHrs / 24)}d ago`;
    };

    if (loading) {
        return (
            <div className="dashboard">
                <Header title="Dashboard" />
                <div className="dashboard-content">
                    <div className="loading">Loading dashboard...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <Header title="Dashboard" />

            <div className="dashboard-content">
                {error && <div className="error-banner">{error}</div>}

                <div className="stats-grid">
                    {statCards.map((stat, index) => (
                        <Card
                            key={index}
                            className={`stat-card ${stat.link ? 'clickable' : ''}`}
                            onClick={() => stat.link && navigate(stat.link)}
                        >
                            <CardContent>
                                <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                                    <stat.icon size={24} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-value">{(stat.value || 0).toLocaleString()}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="dashboard-grid">
                    <Card className="recent-signups">
                        <CardHeader>
                            <CardTitle>Recent Signups</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentSignups.length === 0 ? (
                                <p style={{ color: '#666' }}>No recent signups</p>
                            ) : (
                                recentSignups.map((signup) => (
                                    <div key={signup._id} className="signup-item">
                                        <div className="signup-avatar">
                                            {(signup.username || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="signup-info">
                                            <span className="signup-name">{signup.username}</span>
                                            <span className="signup-type">{signup.roles?.[0] || 'personal'}</span>
                                        </div>
                                        <span className="signup-date">{getTimeAgo(signup.createdAt)}</span>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card className="quick-actions">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="action-buttons">
                                <button className="action-btn" onClick={() => navigate('/pending-startups')}>
                                    <CheckCircle size={20} />
                                    <span>Review Startups ({stats.pendingVerifications || 0})</span>
                                </button>
                                <button className="action-btn" onClick={() => navigate('/holdings')}>
                                    <AlertCircle size={20} />
                                    <span>Review Holdings ({stats.pendingHoldings || 0})</span>
                                </button>
                                <button className="action-btn" onClick={() => navigate('/grants')}>
                                    <Rocket size={20} />
                                    <span>Manage Grants</span>
                                </button>
                                <button className="action-btn" onClick={() => navigate('/users')}>
                                    <Users size={20} />
                                    <span>View All Users</span>
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
