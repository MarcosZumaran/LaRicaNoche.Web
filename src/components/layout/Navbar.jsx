import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Menu } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <header className="navbar bg-base-100 shadow-sm px-6 sticky top-0 z-50">
            <div className="flex-1">
                <label htmlFor="drawer-toggle" className="btn btn-ghost drawer-button lg:hidden">
                    <Menu size={24} />
                </label>
            </div>
            <div className="flex-none gap-4">
                <span className="text-sm hidden sm:block">
                    {user?.username}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={logout}>
                    <LogOut size={18} /> Salir
                </button>
            </div>
        </header>
    );
}