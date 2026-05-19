import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../../contexts/AuthContext';
import { useHotelData } from '../../contexts/HotelDataContext';
import api from '../../api/axios';
import swal from '../../lib/swal';
import LoadingButton from '../../components/ui/LoadingButton';
import {
    Bed, Edit, Trash2, UserCheck, DoorOpen, Wrench, RotateCcw, CalendarX, ArrowLeft,
    ShoppingCart, UserPlus, CalendarDays
} from 'lucide-react';

const coloresInsignia = {
    1: 'badge-success',
    2: 'badge-warning',
    3: 'badge-info',
    4: 'badge-error',
    5: 'badge-warning',
};

export default function HabitacionDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { tiposHabitacion } = useHotelData();
    const esAdmin = user?.nombreRol === 'Administrador';

    const [habitacion, setHabitacion] = useState(null);
    const [estanciaActiva, setEstanciaActiva] = useState(null);
    const [reservas, setReservas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoAccion, setCargandoAccion] = useState(false);
    const [tooltip, setTooltip] = useState({ visible: false, contenido: null, x: 0, y: 0 });

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const habRes = await api.get('/Habitacion/estado-actual');
                const habEncontrada = habRes.data.find(h => h.idHabitacion === parseInt(id));
                if (!habEncontrada) throw new Error('Habitación no encontrada');
                setHabitacion(habEncontrada);

                const reservasRes = await api.get(`/Estancia/reservas/${id}`);
                const eventos = reservasRes.data.map(r => ({
                    title: r.clienteNombre ?? 'Reserva',
                    start: new Date(r.fechaEntradaPrevista),
                    end: new Date(r.fechaSalidaPrevista),
                    backgroundColor:
                        r.estado === 'Cancelada' ? '#6b7280' :
                            (r.esNoShow ? '#dc2626' :
                                (r.estado === 'Confirmada' &&
                                    new Date(r.fechaEntradaPrevista).toDateString() === new Date().toDateString()
                                    ? '#f59e0b' : '#22c55e')),
                    borderColor: 'transparent',
                    extendedProps: {
                        idReserva: r.idReserva,
                        cliente: r.clienteNombre,
                        entrada: r.fechaEntradaPrevista,
                        salida: r.fechaSalidaPrevista,
                        monto: r.montoTotal,
                        estado: r.estado,
                        documento: r.documentoCliente,
                        observaciones: r.observaciones,
                        esNoShow: r.esNoShow
                    }
                }));
                setReservas(eventos);

                if (habEncontrada.idEstanciaActiva) {
                    const estRes = await api.get(`/Estancia/${habEncontrada.idEstanciaActiva}`);
                    setEstanciaActiva(estRes.data);
                }
            } catch (error) {
                swal.fire('Error', 'No se pudo cargar la información de la habitación', 'error');
                navigate('/habitaciones');
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();
    }, [id, navigate]);

    const confirmarAccion = async (titulo, texto, accionApi, callbackExito) => {
        const resultado = await swal.fire({
            title: titulo,
            text: texto,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'Cancelar',
        });
        if (!resultado.isConfirmed) return;

        setCargandoAccion(true);
        try {
            await accionApi();
            if (callbackExito) callbackExito();
            swal.fire('Éxito', 'Acción realizada correctamente', 'success');
            const habRes = await api.get('/Habitacion/estado-actual');
            const habActualizada = habRes.data.find(h => h.idHabitacion === parseInt(id));
            setHabitacion(habActualizada);
            if (habActualizada?.idEstanciaActiva) {
                const estRes = await api.get(`/Estancia/${habActualizada.idEstanciaActiva}`);
                setEstanciaActiva(estRes.data);
            } else {
                setEstanciaActiva(null);
            }
        } catch (error) {
            swal.fire('Error', error.response?.data?.mensaje || 'Error al ejecutar la acción', 'error');
        } finally {
            setCargandoAccion(false);
        }
    };

    const cambiarEstado = (nuevoIdEstado, etiqueta) => {
        confirmarAccion(
            `¿${etiqueta}?`,
            `Confirmas que deseas ${etiqueta.toLowerCase()} la habitación ${habitacion.numeroHabitacion}`,
            () => api.patch(`/Habitacion/${id}`, { idEstado: nuevoIdEstado })
        );
    };

    const cancelarReserva = async () => {
        const reservaHoy = reservas.find(r =>
            r.extendedProps.estado === 'Confirmada' &&
            new Date(r.start).toDateString() === new Date().toDateString()
        );
        if (!reservaHoy) {
            swal.fire('Error', 'No se encontró una reserva activa para hoy', 'error');
            return;
        }
        confirmarAccion(
            'Cancelar reserva',
            `¿Estás seguro de cancelar la reserva de ${reservaHoy.extendedProps.cliente}?`,
            () => api.put(`/Estancia/reserva/${reservaHoy.extendedProps.idReserva}/cancelar`)
        );
    };

    const eliminarHabitacion = async () => {
        confirmarAccion(
            'Eliminar habitación',
            'Esta acción no se puede deshacer. ¿Continuar?',
            () => api.delete(`/Habitacion/${id}`),
            () => navigate('/habitaciones')
        );
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (!habitacion) return null;

    return (
        <div>
            <button
                className="btn btn-ghost btn-sm mb-4 gap-2"
                onClick={() => navigate('/habitaciones')}   // ← Vuelve a la lista de tipos
            >
                <ArrowLeft size={18} /> Volver
            </button>

            <div className="card bg-white border border-base-300 shadow-sm mb-6">
                <div className="card-body p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                                <Bed size={32} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-light text-base-content">
                                    Habitación {habitacion.numeroHabitacion}
                                </h2>
                                <p className="text-base text-base-content/60">
                                    {habitacion.nombreTipo} · Piso {habitacion.piso ?? '—'} · S/ {habitacion.precioNoche?.toFixed(2)}/noche
                                </p>
                            </div>
                        </div>
                        <span className={`badge badge-lg ${coloresInsignia[habitacion.idEstado] || 'badge-ghost'}`}>
                            {habitacion.nombreEstado}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="card bg-white border border-base-300 shadow-sm">
                        <div className="card-body p-4">
                            <h4 className="card-title text-base font-medium mb-3">Información</h4>
                            {habitacion.descripcion && (
                                <p className="text-sm text-base-content/70 mb-3">{habitacion.descripcion}</p>
                            )}
                            {estanciaActiva && (
                                <div className="p-3 bg-base-200 rounded-lg">
                                    <p className="text-sm font-semibold text-base-content mb-2 flex items-center gap-1">
                                        <UserPlus size={16} /> Estancia activa
                                    </p>
                                    <p className="text-sm text-base-content/80">{estanciaActiva.clienteNombreCompleto}</p>
                                    <div className="flex justify-between text-xs text-base-content/60 mt-2">
                                        <span>Entrada: {format(new Date(estanciaActiva.fechaCheckin), 'dd/MM/yy')}</span>
                                        <span>Salida: {format(new Date(estanciaActiva.fechaCheckoutPrevista), 'dd/MM/yy')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card bg-white border border-base-300 shadow-sm">
                        <div className="card-body p-4">
                            <h4 className="card-title text-base font-medium mb-3">Acciones</h4>
                            <div className="flex flex-wrap gap-2">
                                {esAdmin && (
                                    <>
                                        <button
                                            className="btn btn-outline btn-sm gap-1"
                                            onClick={() => navigate(`/habitaciones/${id}/editar`)}
                                        >
                                            <Edit size={16} /> Editar
                                        </button>
                                        <button
                                            className="btn btn-outline btn-sm text-error border-error hover:bg-error/10 gap-1"
                                            onClick={eliminarHabitacion}
                                        >
                                            <Trash2 size={16} /> Eliminar
                                        </button>
                                    </>
                                )}

                                {habitacion.accionesDisponibles?.includes('CheckIn') && (
                                    <>
                                        <button className="btn btn-primary btn-sm gap-1" onClick={() => navigate(`/habitaciones/${id}/entrada`)}>
                                            <UserCheck size={16} /> Entrada
                                        </button>
                                        <button className="btn btn-outline btn-sm gap-1" onClick={() => navigate(`/habitaciones/${id}/reservar`)}>
                                            <CalendarDays size={16} /> Reservar
                                        </button>
                                    </>
                                )}
                                {habitacion.accionesDisponibles?.includes('CheckOut') && (
                                    <>
                                        <button className="btn btn-success btn-sm gap-1" onClick={() => navigate(`/habitaciones/${id}/salida`)}>
                                            <DoorOpen size={16} /> Salida
                                        </button>
                                        <button className="btn btn-outline btn-sm gap-1" onClick={() => navigate(`/habitaciones/${id}/consumos`)}>
                                            <ShoppingCart size={16} /> Consumos
                                        </button>
                                    </>
                                )}
                                {habitacion.accionesDisponibles?.includes('Mantenimiento') && (
                                    <button className="btn btn-warning btn-sm gap-1" onClick={() => cambiarEstado(4, 'Poner en Mantenimiento')}>
                                        <Wrench size={16} /> Mantenimiento
                                    </button>
                                )}
                                {habitacion.accionesDisponibles?.includes('Habilitar') && (
                                    <button className="btn btn-success btn-sm gap-1" onClick={() => cambiarEstado(1, 'Habilitar Habitación')}>
                                        <RotateCcw size={16} /> Habilitar
                                    </button>
                                )}
                                {habitacion.accionesDisponibles?.includes('CancelarReserva') && (
                                    <button className="btn btn-error btn-sm gap-1" onClick={cancelarReserva}>
                                        <CalendarX size={16} /> Cancelar reserva
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="card bg-white border border-base-300 shadow-sm h-full">
                        <div className="card-body p-4 flex flex-col">
                            <h4 className="card-title text-base font-medium mb-3 flex items-center gap-2">
                                <CalendarDays size={18} /> Calendario de reservas
                            </h4>
                            <div className="flex-1 min-h-[400px] rounded-xl overflow-hidden border border-base-200 bg-base-100">
                                <FullCalendar
                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                    initialView="dayGridMonth"
                                    headerToolbar={{
                                        left: 'prev,next today',
                                        center: 'title',
                                        right: 'dayGridMonth,timeGridWeek',
                                    }}
                                    events={reservas}
                                    height="100%"
                                    locale="es"
                                    buttonText={{
                                        today: 'Hoy',
                                        month: 'Mes',
                                        week: 'Semana',
                                        day: 'Día',
                                    }}
                                    eventMouseEnter={(info) => {
                                        const rect = info.el.getBoundingClientRect();
                                        const { idReserva, cliente, entrada, salida, monto, estado } = info.event.extendedProps;
                                        setTooltip({
                                            visible: true,
                                            x: rect.left + window.scrollX + rect.width / 2,
                                            y: rect.top + window.scrollY - 10,
                                            contenido: {
                                                idReserva,
                                                cliente,
                                                entrada: new Date(entrada).toLocaleDateString('es-PE'),
                                                salida: new Date(salida).toLocaleDateString('es-PE'),
                                                monto,
                                                estado
                                            }
                                        });
                                    }}
                                    eventMouseLeave={() => setTooltip({ visible: false, contenido: null, x: 0, y: 0 })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {tooltip.visible && tooltip.contenido && (
                <div
                    className="fixed z-[9999] pointer-events-none"
                    style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
                >
                    <div className="card bg-base-100 shadow-xl border border-base-300 p-3 rounded-xl text-sm min-w-[200px]">
                        <div className="space-y-1">
                            <p className="font-bold text-primary">Reserva #{tooltip.contenido.idReserva}</p>
                            <p><span className="text-base-content/70">Cliente:</span> {tooltip.contenido.cliente}</p>
                            <p><span className="text-base-content/70">Entrada:</span> {tooltip.contenido.entrada}</p>
                            <p><span className="text-base-content/70">Salida:</span> {tooltip.contenido.salida}</p>
                            <p><span className="text-base-content/70">Monto:</span> S/ {parseFloat(tooltip.contenido.monto).toFixed(2)}</p>
                            <span className={`badge badge-sm ${tooltip.contenido.estado === 'Confirmada' ? 'badge-success' :
                                tooltip.contenido.estado === 'Cancelada' ? 'badge-ghost' : 'badge-warning'
                                }`}>
                                {tooltip.contenido.estado}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}