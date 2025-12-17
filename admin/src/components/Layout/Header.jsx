import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = ({ title }) => {
    const { user } = useAuth();

    return (
        <header className="header">
            <div className="header-left">
                <h2>{title}</h2>
            </div>

            <div className="header-right">
                <div className="search-box">
                    <Search size={18} />
                    <input type="text" placeholder="Search..." />
                </div>

                <button className="notification-btn">
                    <Bell size={20} />
                    <span className="badge">3</span>
                </button>

                <div className="user-info">
                    <div className="avatar">
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <span>{user?.name || 'Admin'}</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
