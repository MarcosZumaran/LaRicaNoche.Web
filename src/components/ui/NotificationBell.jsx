import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignalR } from '../../hooks/useSignalR';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
    const navigate = useNavigate();
    const [notificaciones, setNotificaciones] = useState([]);
    const [mostrarDropdown, setMostrarDropdown] = useState(false);

    // Suscripción a cambios de estado
    useSignalR('EstadoHabitacionCambiado', (data) => {
        const nueva = {
            id: Date.now() + Math.random(),
            mensaje: `Habitación ${data.numero} ahora está: ${data.nuevoEstado}`,
            fecha: new Date(),
            leida: false,
            ruta: `/habitaciones/${data.idHabitacion}`,
            data,
        };
        setNotificaciones(prev => [nueva, ...prev].slice(0, 20));
    });

    // Suscripción a nuevas estancias
    useSignalR('NuevaEstancia', (data) => {
        const nueva = {
            id: Date.now() + Math.random(),
            mensaje: `Nueva estancia en ${data.numeroHabitacion} para ${data.cliente}`,
            fecha: new Date(),
            leida: false,
            ruta: `/habitaciones/${data.idHabitacion}`,
            data,
        };
        setNotificaciones(prev => [nueva, ...prev].slice(0, 20));
    });

    const sinLeer = notificaciones.filter(n => !n.leida).length;

    const marcarLeida = (id) => {
        setNotificaciones(prev =>
            prev.map(n => (n.id === id ? { ...n, leida: true } : n))
        );
    };

    const limpiarTodas = () => setNotificaciones([]);

    const handleClickNotificacion = (notif) => {
        marcarLeida(notif.id);
        setMostrarDropdown(false);
        if (notif.ruta) {
            navigate(notif.ruta);
        }
    };

    return (
        <div className="relative">
            <button
                className="btn btn-ghost btn-circle relative"
                onClick={() => setMostrarDropdown(!mostrarDropdown)}
            >
                <Bell size={20} />
                {sinLeer > 0 && (
                    <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {sinLeer}
                    </span>
                )}
            </button>

            {mostrarDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-base-100 border border-base-300 shadow-xl rounded-xl z-50">
                    <div className="p-3 border-b border-base-200 flex justify-between items-center">
                        <h3 className="font-semibold text-base-content">Notificaciones</h3>
                        {sinLeer > 0 && (
                            <button
                                className="text-xs text-primary underline"
                                onClick={limpiarTodas}
                            >
                                Limpiar ({sinLeer})
                            </button>
                        )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notificaciones.length === 0 ? (
                            <p className="p-4 text-center text-base-content/60 text-sm">
                                No hay notificaciones
                            </p>
                        ) : (
                            notificaciones.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`p-3 border-b border-base-100 hover:bg-base-200 cursor-pointer flex items-start gap-2 ${!notif.leida ? 'bg-primary/5' : ''
                                        }`}
                                    onClick={() => handleClickNotificacion(notif)}
                                >
                                    <div className="flex-1">
                                        <p className="text-sm text-base-content/80">{notif.mensaje}</p>
                                        <p className="text-xs text-base-content/50 mt-1">
                                            {notif.fecha.toLocaleTimeString()}
                                        </p>
                                    </div>
                                    {!notif.leida && (
                                        <span className="w-2 h-2 mt-1 bg-primary rounded-full" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-2 border-t border-base-200">
                        <button
                            className="btn btn-ghost btn-xs w-full"
                            onClick={() => setMostrarDropdown(false)}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}