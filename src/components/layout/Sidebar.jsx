import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard, Bed, Users, Receipt,
    FileText, TrendingUp, Package, ShoppingCart, DoorOpen
} from 'lucide-react';
import api from '../../api/axios';

const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrador', 'Recepcionista', 'Limpieza'] },
    { path: '/habitaciones', label: 'Habitaciones', icon: Bed, roles: ['Administrador', 'Recepcionista', 'Limpieza'] },
    { path: '/clientes', label: 'Clientes', icon: Users, roles: ['Administrador', 'Recepcionista'] },
    { path: '/productos', label: 'Productos', icon: Package, roles: ['Administrador'] },
    { path: '/comprobantes', label: 'Comprobantes', icon: Receipt, roles: ['Administrador'] },
    { path: '/reportes/cierre-caja', label: 'Cierre de Caja', icon: TrendingUp, roles: ['Administrador'] },
    { path: '/ventas', label: 'Ventas', icon: ShoppingCart, roles: ['Administrador', 'Recepcionista'] },
    { path: '/ventas/historial', label: 'Historial de Ventas', icon: ShoppingCart, roles: ['Administrador', 'Recepcionista'] },
    { path: '/estancias/historial', label: 'Historial de Estancias', icon: DoorOpen, roles: ['Administrador', 'Recepcionista'] },
];

export default function Sidebar() {
    const location = useLocation();
    const { user } = useAuth();
    const [nombreHotel, setNombreHotel] = useState('Hotel');

    useEffect(() => {
        const cargarConfiguracion = async () => {
            try {
                const res = await api.get('/ConfiguracionHotel');
                setNombreHotel(res.data.nombre);
            } catch (error) {
                console.error('No se pudo cargar la configuración del hotel', error);
            }
        };
        cargarConfiguracion();
    }, []);

    return (
        <aside className="w-64 bg-base-100 min-h-screen p-4 shadow-xl">
            <div className="mb-6 px-2">
                <h1 className="text-2xl font-bold text-primary break-words">{nombreHotel}</h1>
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