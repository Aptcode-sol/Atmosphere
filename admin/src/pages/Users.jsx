import { useState, useEffect } from 'react';
import { Search, Filter, User as UserIcon, Ban, CheckCircle, Shield } from 'lucide-react';
import Header from '../components/Layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import { getUsers, blockUser, unblockUser } from '../services/api';
import './Users.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadUsers();
    }, [filter]);

    const loadUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (filter !== 'all') params.role = filter;
            if (search) params.search = search;

            const response = await getUsers(params);
            setUsers(response.data?.users || []);
        } catch (err) {
            console.error('Failed to load users:', err);
            setError(err.response?.data?.error || 'Failed to load users. Make sure you are logged in as admin.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadUsers();
    };

    const handleBlock = async (userId) => {
        const reason = window.prompt('Enter reason for blocking (optional):');
        try {
            await blockUser(userId, reason);
            setUsers(users.map(u => u._id === userId ? { ...u, blocked: true } : u));
        } catch (err) {
            console.error('Failed to block user:', err);
            setError(err.response?.data?.error || 'Failed to block user');
        }
    };

    const handleUnblock = async (userId) => {
        try {
            await unblockUser(userId);
            setUsers(users.map(u => u._id === userId ? { ...u, blocked: false } : u));
        } catch (err) {
            console.error('Failed to unblock user:', err);
            setError(err.response?.data?.error || 'Failed to unblock user');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = !search ||
            user.username?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const filterOptions = [
        { value: 'all', label: 'All Users' },
        { value: 'startup', label: 'Startups' },
        { value: 'investor', label: 'Investors' },
        { value: 'personal', label: 'Personal' },
    ];

    return (
        <div className="users-page">
            <Header title="Users" />

            <div className="page-content">
                <Card>
                    <CardHeader>
                        <div className="card-header-row">
                            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
                            <div className="header-actions">
                                <form onSubmit={handleSearch} className="search-input">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </form>
                                <div className="filter-select">
                                    <Filter size={18} />
                                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                                        {filterOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {error && <div className="error-banner">{error}</div>}
                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="empty-state">
                                <UserIcon size={48} />
                                <h3>No users found</h3>
                                <p>Try adjusting your filters</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableHeader>User</TableHeader>
                                        <TableHeader>Email</TableHeader>
                                        <TableHeader>Role</TableHeader>
                                        <TableHeader>Status</TableHeader>
                                        <TableHeader>Joined</TableHeader>
                                        <TableHeader>Actions</TableHeader>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user._id} className={user.blocked ? 'blocked-row' : ''}>
                                            <TableCell>
                                                <div className="user-cell">
                                                    <div className="user-avatar">
                                                        <UserIcon size={18} />
                                                    </div>
                                                    <span>{user.username}</span>
                                                    {user.verified && (
                                                        <CheckCircle size={14} className="verified-icon" title="Verified" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <span className={`role-badge role-${user.roles?.[0] || 'personal'}`}>
                                                    {user.roles?.[0] || 'personal'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {user.blocked ? (
                                                    <span className="status-badge blocked">Blocked</span>
                                                ) : user.verified ? (
                                                    <span className="status-badge verified">Verified</span>
                                                ) : (
                                                    <span className="status-badge pending">Pending</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <div className="action-buttons">
                                                    {user.blocked ? (
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            onClick={() => handleUnblock(user._id)}
                                                            title="Unblock user"
                                                        >
                                                            <Shield size={16} />
                                                            Unblock
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleBlock(user._id)}
                                                            title="Block user"
                                                        >
                                                            <Ban size={16} />
                                                            Block
                                                        </Button>
                                                    )}
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

export default Users;
