import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Gift, ExternalLink } from 'lucide-react';
import Header from '../components/Layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import { getGrants, createGrant, updateGrant, deleteGrant } from '../services/api';
import './Grants.css';

const Grants = () => {
    const [grants, setGrants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGrant, setEditingGrant] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        organization: '',
        sector: '',
        location: '',
        amount: '',
        deadline: '',
        type: 'grant',
        description: '',
        url: '',
    });

    useEffect(() => {
        loadGrants();
    }, []);

    const loadGrants = async () => {
        try {
            const response = await getGrants();
            setGrants(response.data || []);
        } catch (error) {
            // Mock data for demo
            setGrants([
                { _id: '1', name: 'Startup India Seed Fund', organization: 'Govt of India', amount: '₹50L', deadline: '2025-01-15', type: 'grant' },
                { _id: '2', name: 'Y Combinator W25', organization: 'YC', amount: '$500K', deadline: '2025-02-01', type: 'accelerator' },
                { _id: '3', name: 'T-Hub Incubation', organization: 'T-Hub', amount: '₹25L', deadline: '2025-01-30', type: 'incubator' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingGrant) {
                await updateGrant(editingGrant._id, formData);
            } else {
                await createGrant(formData);
            }
            loadGrants();
            closeModal();
        } catch (error) {
            console.error('Failed to save grant:', error);
        }
    };

    const handleEdit = (grant) => {
        setEditingGrant(grant);
        setFormData(grant);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this grant?')) {
            try {
                await deleteGrant(id);
                setGrants(grants.filter(g => g._id !== id));
            } catch (error) {
                console.error('Failed to delete grant:', error);
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingGrant(null);
        setFormData({
            name: '', organization: '', sector: '', location: '',
            amount: '', deadline: '', type: 'grant', description: '', url: '',
        });
    };

    return (
        <div className="grants-page">
            <Header title="Grants & Programs" />

            <div className="page-content">
                <Card>
                    <CardHeader>
                        <div className="card-header-row">
                            <CardTitle>All Grants</CardTitle>
                            <Button onClick={() => setShowModal(true)}>
                                <Plus size={18} />
                                Add Grant
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableHeader>Name</TableHeader>
                                        <TableHeader>Organization</TableHeader>
                                        <TableHeader>Amount</TableHeader>
                                        <TableHeader>Type</TableHeader>
                                        <TableHeader>Deadline</TableHeader>
                                        <TableHeader>Actions</TableHeader>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {grants.map((grant) => (
                                        <TableRow key={grant._id}>
                                            <TableCell>
                                                <div className="grant-name">
                                                    <Gift size={18} />
                                                    <span>{grant.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{grant.organization}</TableCell>
                                            <TableCell><strong>{grant.amount}</strong></TableCell>
                                            <TableCell>
                                                <span className={`type-badge type-${grant.type}`}>{grant.type}</span>
                                            </TableCell>
                                            <TableCell>{new Date(grant.deadline).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <div className="action-buttons">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(grant)}>
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(grant._id)}>
                                                        <Trash2 size={16} />
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

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingGrant ? 'Edit Grant' : 'Add Grant'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Organization</label>
                                    <input
                                        type="text"
                                        value={formData.organization}
                                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Amount</label>
                                    <input
                                        type="text"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="grant">Grant</option>
                                        <option value="incubator">Incubator</option>
                                        <option value="accelerator">Accelerator</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Deadline</label>
                                    <input
                                        type="date"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>URL</label>
                                <input
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                                <Button type="submit">{editingGrant ? 'Update' : 'Create'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Grants;
