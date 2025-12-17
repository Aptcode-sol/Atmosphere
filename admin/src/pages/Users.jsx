import { useState, useEffect } from 'react';
import { Search, Filter, User as UserIcon } from 'lucide-react';
import Header from '../components/Layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table';
import { getUsers } from '../services/api';
import './Users.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadUsers();
    }, [filter]);

    const loadUsers = async () => {
        try {
            // Mock data until backend is ready
            setUsers([
                { _id: '1', username: 'johndoe', email: 'john@example.com', roles: ['investor'], verified: true, createdAt: '2024-12-10' },
                { _id: '2', username: 'techflow', email: 'contact@techflow.com', roles: ['startup'], verified: true, createdAt: '2024-12-09' },
                { _id: '3', username: 'janedoe', email: 'jane@example.com', roles: ['personal'], verified: true, createdAt: '2024-12-08' },
                { _id: '4', username: 'cloudsync', email: 'hello@cloudsync.io', roles: ['startup'], verified: false, createdAt: '2024-12-07' },
                { _id: '5', username: 'mike_investor', email: 'mike@invest.com', roles: ['investor'], verified: true, createdAt: '2024-12-06' },
            ]);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesFilter = filter === 'all' || user.roles.includes(filter);
        const matchesSearch = user.username.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
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
                            <CardTitle>All Users</CardTitle>
                            <div className="header-actions">
                                <div className="search-input">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
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
                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableHeader>User</TableHeader>
                                        <TableHeader>Email</TableHeader>
                                        <TableHeader>Role</TableHeader>
                                        <TableHeader>Status</TableHeader>
                                        <TableHeader>Joined</TableHeader>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell>
                                                <div className="user-cell">
                                                    <div className="user-avatar">
                                                        <UserIcon size={18} />
                                                    </div>
                                                    <span>{user.username}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <span className={`role-badge role-${user.roles[0]}`}>
                                                    {user.roles[0]}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`status-badge ${user.verified ? 'verified' : 'pending'}`}>
                                                    {user.verified ? 'Verified' : 'Pending'}
                                                </span>
                                            </TableCell>
                                            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
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
