import { useAuth } from '../../contexts/AuthContext';
import useTheme from '../../hooks/useTheme';
import ConnectionIndicator from '../ui/ConnectionIndicator';
import NotificationBell from '../ui/NotificationBell'; // ← NUEVO
import { LogOut, Menu, Sun, Moon } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="navbar bg-base-100 border-b border-base-300 shadow-sm sticky top-0 z-40 h-16">
            <div className="flex-1">
                <button className="btn btn-ghost lg:hidden" onClick={onMenuClick}>
                    <Menu size={24} />
                </button>
            </div>
            <div className="flex-none gap-4 items-center">
                <button className="btn btn-ghost btn-circle" onClick={toggleTheme}>
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <ConnectionIndicator />
                <NotificationBell />

                <div className="hidden sm:flex items-center gap-2">
                    <div className="avatar placeholder">
                        <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center">
                            <span className="text-sm font-semibold">{user?.username?.[0]?.toUpperCase()}</span>
                        </div>
                    </div>
                    <span className="text-sm font-medium text-base-content/70">{user?.username}</span>
                </div>
                <button className="btn btn-ghost btn-sm text-error/80 hover:text-error" onClick={logout}>
                    <LogOut size={18} /> Salir
                </button>
            </div>
        </header>
    );
}