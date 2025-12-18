import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, MapPin } from 'lucide-react';
import Header from '../components/Layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../services/api';
import './Events.css';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        organizer: '',
        location: '',
        date: '',
        time: '',
        description: '',
        url: '',
    });

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getEvents();
            setEvents(response.data?.events || response.data || []);
        } catch (err) {
            console.error('Failed to load events:', err);
            setError(err.response?.data?.error || 'Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (editingEvent) {
                await updateEvent(editingEvent._id, formData);
            } else {
                await createEvent(formData);
            }
            loadEvents();
            closeModal();
        } catch (err) {
            console.error('Failed to save event:', err);
            setError(err.response?.data?.error || 'Failed to save event');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setFormData({
            name: event.name || '',
            organizer: event.organizer || '',
            location: event.location || '',
            date: event.date?.split('T')[0] || '',
            time: event.time || '',
            description: event.description || '',
            url: event.url || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await deleteEvent(id);
                setEvents(events.filter(e => e._id !== id));
            } catch (err) {
                console.error('Failed to delete event:', err);
                setError(err.response?.data?.error || 'Failed to delete event');
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEvent(null);
        setFormData({
            name: '', organizer: '', location: '', date: '', time: '', description: '', url: '',
        });
    };

    return (
        <div className="events-page">
            <Header title="Events" />

            <div className="page-content">
                {error && <div className="error-banner">{error}</div>}

                <Card>
                    <CardHeader>
                        <div className="card-header-row">
                            <CardTitle>All Events ({events.length})</CardTitle>
                            <Button onClick={() => setShowModal(true)}>
                                <Plus size={18} />
                                Add Event
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : events.length === 0 ? (
                            <div className="empty-state">
                                <Calendar size={48} />
                                <h3>No events yet</h3>
                                <p>Click "Add Event" to create one</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableHeader>Event</TableHeader>
                                        <TableHeader>Organizer</TableHeader>
                                        <TableHeader>Location</TableHeader>
                                        <TableHeader>Date & Time</TableHeader>
                                        <TableHeader>Actions</TableHeader>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {events.map((event) => (
                                        <TableRow key={event._id}>
                                            <TableCell>
                                                <div className="event-name">
                                                    <Calendar size={18} />
                                                    <span>{event.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{event.organizer}</TableCell>
                                            <TableCell>
                                                <div className="location-cell">
                                                    <MapPin size={14} />
                                                    <span>{event.location}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="datetime-cell">
                                                    <span className="date">{new Date(event.date).toLocaleDateString()}</span>
                                                    <span className="time">{event.time}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="action-buttons">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(event._id)}>
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
                        <h2>{editingEvent ? 'Edit Event' : 'Add Event'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Event Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Organizer</label>
                                    <input
                                        type="text"
                                        value={formData.organizer}
                                        onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                                        required
                                    />
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
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Time</label>
                                    <input
                                        type="text"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        placeholder="e.g. 10:00 AM"
                                        required
                                    />
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
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : (editingEvent ? 'Update' : 'Create')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
