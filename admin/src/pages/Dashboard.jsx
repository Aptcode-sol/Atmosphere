import { useState, useEffect } from 'react';
import { Users, Rocket, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import Header from '../components/Layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { getStats, getPendingStartups } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        startups: 0,
        investors: 0,
        pendingVerifications: 0,
    });
    const [recentSignups, setRecentSignups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // For now, use mock data until backend is ready
            setStats({
                totalUsers: 1247,
                startups: 89,
                investors: 156,
                pendingVerifications: 12,
            });
            setRecentSignups([
                { id: 1, name: 'TechFlow Inc', type: 'startup', date: '2 hours ago' },
                { id: 2, name: 'John Anderson', type: 'investor', date: '5 hours ago' },
                { id: 3, name: 'CloudSync', type: 'startup', date: '1 day ago' },
            ]);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: '#6366f1' },
        { label: 'Startups', value: stats.startups, icon: Rocket, color: '#10b981' },
        { label: 'Investors', value: stats.investors, icon: TrendingUp, color: '#f59e0b' },
        { label: 'Pending Verifications', value: stats.pendingVerifications, icon: Clock, color: '#ef4444' },
    ];

    return (
        <div className="dashboard">
            <Header title="Dashboard" />

            <div className="dashboard-content">
                <div className="stats-grid">
                    {statCards.map((stat, index) => (
                        <Card key={index} className="stat-card">
                            <CardContent>
                                <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                                    <stat.icon size={24} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-value">{stat.value.toLocaleString()}</span>
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
                            {recentSignups.map((signup) => (
                                <div key={signup.id} className="signup-item">
                                    <div className="signup-avatar">
                                        {signup.name.charAt(0)}
                                    </div>
                                    <div className="signup-info">
                                        <span className="signup-name">{signup.name}</span>
                                        <span className="signup-type">{signup.type}</span>
                                    </div>
                                    <span className="signup-date">{signup.date}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="quick-actions">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="action-buttons">
                                <button className="action-btn">
                                    <CheckCircle size={20} />
                                    <span>Review Startups</span>
                                </button>
                                <button className="action-btn">
                                    <Rocket size={20} />
                                    <span>Add Grant</span>
                                </button>
                                <button className="action-btn">
                                    <Users size={20} />
                                    <span>View Users</span>
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
