import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard, Bed, Users, LogIn, Receipt,
    FileText, TrendingUp, DoorOpen, Package
} from 'lucide-react';

const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrador', 'Recepcionista'] },
    { path: '/habitaciones', label: 'Habitaciones', icon: Bed, roles: ['Administrador', 'Recepcionista'] },
    { path: '/clientes', label: 'Clientes', icon: Users, roles: ['Administrador', 'Recepcionista'] },
    { path: '/checkin', label: 'Check-In', icon: LogIn, roles: ['Administrador', 'Recepcionista'] },
    { path: '/checkout', label: 'Check-Out', icon: DoorOpen, roles: ['Administrador', 'Recepcionista'] },
    { path: '/productos', label: 'Productos', icon: Package, roles: ['Administrador'] },
    { path: '/comprobantes', label: 'Comprobantes', icon: Receipt, roles: ['Administrador'] },
    { path: '/reportes/cierre-caja', label: 'Cierre de Caja', icon: TrendingUp, roles: ['Administrador'] },
    { path: '/reportes/estado-habitaciones', label: 'Estado de Hab.', icon: FileText, roles: ['Administrador', 'Recepcionista'] },
];

export default function Sidebar() {
    const location = useLocation();
    const { user } = useAuth();

    return (
        <aside className="w-64 bg-base-100 min-h-screen p-4 shadow-xl">
            <div className="mb-6 px-2">
                <h1 className="text-2xl font-bold text-primary">🏨 La Rica Noche</h1>
                <p className="text-xs text-gray-500 mt-1">{user?.nombreRol}</p>
            </div>
            <ul className="menu menu-md gap-1">
                {menuItems
                    .filter(item => item.roles.includes(user?.nombreRol || ''))
                    .map(item => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={location.pathname === item.path ? 'active' : ''}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </Link>
                        </li>
                    ))}
            </ul>
        </aside>
    );
}