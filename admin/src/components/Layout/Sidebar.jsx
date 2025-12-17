import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CheckCircle,
    Gift,
    Calendar,
    Briefcase,
    LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { logout } = useAuth();

    const menuItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/pending-startups', icon: CheckCircle, label: 'Pending Startups' },
        { path: '/users', icon: Users, label: 'Users' },
        { path: '/grants', icon: Gift, label: 'Grants' },
        { path: '/events', icon: Calendar, label: 'Events' },
        { path: '/holdings', icon: Briefcase, label: 'Holdings' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1>Atmosphere</h1>
                <span>Admin</span>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button onClick={logout} className="logout-btn">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
