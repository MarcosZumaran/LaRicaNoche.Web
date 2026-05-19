import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../api/axios';
import swal from '../../lib/swal';
import LoadingButton from '../../components/ui/LoadingButton';
import { ArrowLeft, DoorOpen, Bed, User, CalendarDays, DollarSign } from 'lucide-react';

export default function Salida() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [habitacion, setHabitacion] = useState(null);
    const [estancia, setEstancia] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [cargandoAccion, setCargandoAccion] = useState(false);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [habRes, estRes] = await Promise.all([
                    api.get('/Habitacion/estado-actual'),
                    api.get(`/Estancia/${id}/detalle`) // Asumimos que existe, si no usamos otro
                ]);

                const habEncontrada = habRes.data.find(h => h.idHabitacion === parseInt(id));
                if (!habEncontrada || !habEncontrada.idEstanciaActiva) {
                    throw new Error('No hay estancia activa en esta habitación');
                }

                setHabitacion(habEncontrada);

                // Si no hay endpoint directo, obtén la estancia activa desde la lista
                if (estRes.data) {
                    setEstancia(estRes.data);
                }
            } catch (error) {
                swal.fire('Error', error.message || 'No se pudo cargar la información', 'error');
                navigate(`/habitaciones/${id}`);
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();
    }, [id, navigate]);

    const confirmarSalida = async () => {
        const resultado = await swal.fire({
            title: '¿Confirmar salida?',
            html: `Estás por registrar la salida de <strong>${estancia?.clienteNombreCompleto || 'el huésped'}</strong>.<br/>La habitación pasará a estado <strong>Limpieza</strong>.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, registrar salida',
            cancelButtonText: 'Cancelar',
        });

        if (!resultado.isConfirmed) return;

        setCargandoAccion(true);
        try {
            await api.post(`/Estancia/${estancia.idEstancia}/checkout`);
            swal.fire('Salida registrada', 'La habitación ha pasado a Limpieza.', 'success');
            navigate(`/habitaciones/${id}`);
        } catch (error) {
            swal.fire('Error', error.response?.data?.mensaje || 'Error al registrar la salida', 'error');
        } finally {
            setCargandoAccion(false);
        }
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (!estancia || !habitacion) return null;

    // Evento para el calendario (rango de estancia)
    const eventoEstancia = {
        title: estancia.clienteNombreCompleto || 'Estancia',
        start: new Date(estancia.fechaCheckin),
        end: new Date(estancia.fechaCheckoutPrevista),
        backgroundColor: '#d97706',
        borderColor: '#d97706',
        textColor: '#ffffff',
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Botón volver */}
            <button
                className="btn btn-ghost btn-sm mb-4 gap-2"
                onClick={() => navigate(-1)}
            >
                <ArrowLeft size={18} /> Volver
            </button>

            <div className="mb-10">
                <h2 className="text-3xl font-light text-base-content flex items-center gap-3">
                    <DoorOpen size={32} className="text-amber-600" />
                    Registrar Salida
                </h2>
                <p className="text-base text-base-content/60 mt-2">
                    Confirmá la salida del huésped y liberá la habitación
                </p>
                <div className="mt-4 w-20 h-1 bg-amber-500/60"></div>
            </div>

            {/* Tarjeta resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Datos del huésped */}
                <div className="card bg-white border border-base-300 shadow-sm">
                    <div className="card-body p-6">
                        <h4 className="card-title text-base font-medium mb-4 flex items-center gap-2">
                            <User size={20} className="text-amber-600" /> Huésped
                        </h4>
                        <p className="text-xl font-light text-base-content">{estancia.clienteNombreCompleto}</p>
                        {estancia.clienteDocumento && (
                            <p className="text-sm text-base-content/60 mt-1">Doc: {estancia.clienteDocumento}</p>
                        )}
                    </div>
                </div>

                {/* Datos de la habitación */}
                <div className="card bg-white border border-base-300 shadow-sm">
                    <div className="card-body p-6">
                        <h4 className="card-title text-base font-medium mb-4 flex items-center gap-2">
                            <Bed size={20} className="text-amber-600" /> Habitación
                        </h4>
                        <p className="text-xl font-light text-base-content">{habitacion.numeroHabitacion}</p>
                        <p className="text-sm text-base-content/60">{habitacion.nombreTipo} · Piso {habitacion.piso}</p>
                    </div>
                </div>
            </div>

            {/* Fechas y monto */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="stat bg-white border border-base-300 rounded-xl p-4 shadow-sm">
                    <div className="stat-title text-xs font-medium text-base-content/60">Entrada</div>
                    <div className="stat-value text-lg font-light text-base-content">
                        {format(new Date(estancia.fechaCheckin), 'dd/MM/yyyy')}
                    </div>
                </div>
                <div className="stat bg-white border border-base-300 rounded-xl p-4 shadow-sm">
                    <div className="stat-title text-xs font-medium text-base-content/60">Salida prevista</div>
                    <div className="stat-value text-lg font-light text-base-content">
                        {format(new Date(estancia.fechaCheckoutPrevista), 'dd/MM/yyyy')}
                    </div>
                </div>
                <div className="stat bg-white border border-base-300 rounded-xl p-4 shadow-sm">
                    <div className="stat-title text-xs font-medium text-base-content/60">Monto total</div>
                    <div className="stat-value text-lg font-light text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <DollarSign size={20} /> {estancia.montoTotal?.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Calendario con el rango */}
            <div className="card bg-white border border-base-300 shadow-sm mb-8">
                <div className="card-body p-6">
                    <h4 className="card-title text-base font-medium mb-4 flex items-center gap-2">
                        <CalendarDays size={20} className="text-amber-600" /> Rango de estancia
                    </h4>
                    <div className="rounded-xl overflow-hidden border border-base-200">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            initialDate={new Date(estancia.fechaCheckin)}
                            events={[eventoEstancia]}
                            headerToolbar={{
                                left: 'prev,next',
                                center: 'title',
                                right: '',
                            }}
                            height="auto"
                            locale="es"
                        />
                    </div>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-3">
                <button className="btn btn-ghost" onClick={() => navigate(-1)}>
                    Cancelar
                </button>
                <LoadingButton
                    type="button"
                    isLoading={cargandoAccion}
                    onClick={confirmarSalida}
                    className="btn-success"
                >
                    <DoorOpen size={18} /> Confirmar Salida
                </LoadingButton>
            </div>
        </div>
    );
}