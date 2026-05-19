import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const closeMobile = () => setMobileOpen(false);

    return (
        // El contenedor más externo ocupa toda la pantalla y previene scroll del body
        <div className="flex h-screen overflow-hidden bg-base-200">
            {/* Sidebar de escritorio (fijo a la izquierda) */}
            <div className="relative hidden lg:flex lg:flex-shrink-0 h-full z-50">
                <aside
                    className={`h-full flex flex-col bg-base-100 border-r border-base-300 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
                        }`}
                >
                    <Sidebar collapsed={collapsed} />
                </aside>

                {/* Botón para colapsar/expandir */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute top-4 -right-3 z-50 btn btn-circle btn-sm shadow-lg bg-base-100 hover:bg-base-200 border border-base-300"
                    title={collapsed ? 'Expandir menú' : 'Contraer menú'}
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Contenido principal (Navbar + páginas) */}
            <div className="flex flex-col flex-1 w-0 min-w-0">
                <Navbar onMenuClick={() => setMobileOpen(true)} />

                {/* Este main debe tener overflow-y-auto para scrollear */}
                <main className="flex-1 overflow-y-auto p-6 bg-base-200">
                    <Outlet />
                </main>
            </div>

            {/* Overlay + drawer móvil (solo en pantallas pequeñas) */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Overlay oscuro */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeMobile}
                    ></div>

                    {/* Panel lateral móvil */}
                    <div className="relative w-64 h-full bg-base-100 overflow-y-auto shadow-xl">
                        <Sidebar
                            collapsed={false}
                            onToggle={closeMobile}
                            onNavigate={closeMobile}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}