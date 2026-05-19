import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reservaSchema } from './reservaSchema';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { format } from 'date-fns';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import {
    Plus, Edit, Trash2, Search, XCircle, Calendar
} from 'lucide-react';
import swal from '../../lib/swal';
import LoadingButton from '../../components/ui/LoadingButton';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    createColumnHelper,
} from '@tanstack/react-table';
import DataTable from '../../components/ui/DataTable';
import TableFilters from '../../components/ui/TableFilters';
import { useDateFilter } from '../../hooks/useDateFilter';
import { sanitizeText } from '../../lib/sanitize';

const columnHelper = createColumnHelper();

export default function ReservaList() {
    const { user } = useAuth();
    const puedeGestionar = user?.nombreRol === 'Administrador' || user?.nombreRol === 'Recepcion';

    const [reservas, setReservas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [editando, setEditando] = useState(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [dateFilter, setDateFilter] = useState({ type: 'none', date: null, dateEnd: null });
    const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
    const [cargandoHabitaciones, setCargandoHabitaciones] = useState(false);

    // Cliente
    const [buscarDni, setBuscarDni] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

    const [parentRef] = useAutoAnimate();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(reservaSchema),
        defaultValues: {
            idHabitacion: '',
            idCliente: null,
            fechaEntradaPrevista: '',
            fechaSalidaPrevista: '',
            metodoPago: '005',
            observaciones: '',
        },
    });

    const fechaEntrada = watch('fechaEntradaPrevista');
    const fechaSalida = watch('fechaSalidaPrevista');

    // Cargar lista de reservas
    const cargarReservas = async () => {
        setCargando(true);
        try {
            const res = await api.get('/Reserva');
            setReservas(Array.isArray(res.data) ? res.data : []);
        } catch {
            // error global
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarReservas(); }, []);

    // Cargar habitaciones disponibles cuando cambian las fechas
    useEffect(() => {
        if (!fechaEntrada || !fechaSalida) {
            setHabitacionesDisponibles([]);
            return;
        }
        const buscarDisponibles = async () => {
            setCargandoHabitaciones(true);
            try {
                const res = await api.get('/Habitacion/disponibles', {
                    params: {
                        fechaEntrada: new Date(fechaEntrada).toISOString(),
                        fechaSalida: new Date(fechaSalida).toISOString(),
                    },
                });
                setHabitacionesDisponibles(res.data);
            } catch {
                setHabitacionesDisponibles([]);
            } finally {
                setCargandoHabitaciones(false);
            }
        };
        buscarDisponibles();
    }, [fechaEntrada, fechaSalida]);

    // Buscar cliente por DNI
    const buscarCliente = async () => {
        if (!buscarDni.trim()) return;
        try {
            const res = await api.get(`/Cliente/documento/1/${buscarDni}`);
            if (res.data) {
                setClienteSeleccionado(res.data);
                setValue('idCliente', res.data.idCliente);
                swal.fire('Cliente encontrado', `${res.data.nombres} ${res.data.apellidos}`, 'success');
            }
        } catch (error) {
            if (error.response?.status === 404) {
                swal.fire('Cliente no encontrado', 'Verificá el DNI o creá el cliente primero', 'warning');
                setClienteSeleccionado(null);
                setValue('idCliente', null);
            }
        }
    };

    // Filtro por fecha (usando nuestro hook)
    const dataFiltrada = useDateFilter(reservas, dateFilter, (item) =>
        item.fechaEntradaPrevista ? new Date(item.fechaEntradaPrevista) : null
    );

    // Definición de columnas
    const columns = useMemo(
        () => [
            columnHelper.accessor('idReserva', {
                header: 'N°',
                enableSorting: true,
                cell: info => <span className="font-bold">#{info.getValue()}</span>,
            }),
            columnHelper.accessor('numeroHabitacion', {
                header: 'Hab.',
                enableSorting: true,
                cell: info => info.getValue() ?? '—',
            }),
            columnHelper.accessor('clienteNombre', {
                header: 'Cliente',
                enableSorting: true,
                cell: info => sanitizeText(info.getValue() ?? '—'),
            }),
            columnHelper.accessor('fechaEntradaPrevista', {
                header: 'Entrada',
                enableSorting: true,
                cell: info => format(new Date(info.getValue()), 'dd/MM/yyyy HH:mm'),
            }),
            columnHelper.accessor('fechaSalidaPrevista', {
                header: 'Salida',
                enableSorting: true,
                cell: info => format(new Date(info.getValue()), 'dd/MM/yyyy HH:mm'),
            }),
            columnHelper.accessor('montoTotal', {
                header: 'Total',
                enableSorting: true,
                cell: info => `S/ ${info.getValue().toFixed(2)}`,
            }),
            columnHelper.accessor('estado', {
                header: 'Estado',
                enableSorting: true,
                cell: info => {
                    const estado = info.getValue();
                    const clases = {
                        'Pendiente': 'badge-warning',
                        'Confirmada': 'badge-success',
                        'Cancelada': 'badge-error',
                        'No Show': 'badge-ghost',
                    };
                    return <span className={`badge ${clases[estado] || 'badge-ghost'}`}>{estado}</span>;
                },
            }),
        ],
        []
    );

    const table = useReactTable({
        data: dataFiltrada,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    // Modal handlers
    const abrirModalCrear = () => {
        setEditando(null);
        reset({
            idHabitacion: '',
            idCliente: null,
            fechaEntradaPrevista: '',
            fechaSalidaPrevista: '',
            metodoPago: '005',
            observaciones: '',
        });
        setClienteSeleccionado(null);
        setBuscarDni('');
        setHabitacionesDisponibles([]);
        setMostrarModal(true);
    };

    const abrirModalEditar = (reserva) => {
        setEditando(reserva);
        reset({
            idHabitacion: reserva.idHabitacion,
            idCliente: reserva.idCliente,
            fechaEntradaPrevista: reserva.fechaEntradaPrevista?.split('.')[0],
            fechaSalidaPrevista: reserva.fechaSalidaPrevista?.split('.')[0],
            metodoPago: reserva.metodoPago || '005',
            observaciones: reserva.observaciones || '',
        });
        setClienteSeleccionado({ idCliente: reserva.idCliente, nombres: reserva.clienteNombre?.split(' ')[0], apellidos: reserva.clienteNombre?.split(' ').slice(1).join(' ') });
        setBuscarDni('');
        setMostrarModal(true);
    };

    const cerrarModal = () => {
        setMostrarModal(false);
        setEditando(null);
        setClienteSeleccionado(null);
    };

    const onSubmit = async (data) => {
        const payload = {
            ...data,
            fechaEntradaPrevista: new Date(data.fechaEntradaPrevista).toISOString(),
            fechaSalidaPrevista: new Date(data.fechaSalidaPrevista).toISOString(),
        };

        try {
            if (editando) {
                await api.put(`/Reserva/${editando.idReserva}`, payload);
                swal.fire('Actualizada', 'Reserva actualizada exitosamente', 'success');
            } else {
                await api.post('/Reserva', payload);
                swal.fire('Creada', 'Reserva registrada exitosamente', 'success');
            }
            cerrarModal();
            cargarReservas();
        } catch {
            // error global
        }
    };

    const cancelarReserva = async (id) => {
        const confirmacion = await swal.fire({
            title: '¿Cancelar reserva?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'Volver',
        });
        if (!confirmacion.isConfirmed) return;
        try {
            await api.put(`/Estancia/reserva/${id}/cancelar`); // usa el endpoint de cancelación en EstanciaController
            swal.fire('Cancelada', 'La reserva fue cancelada', 'success');
            cargarReservas();
        } catch {
            // error global
        }
    };

    const metodosPago = [
        { codigo: '005', descripcion: 'Efectivo' },
        { codigo: '006', descripcion: 'Tarjeta' },
        { codigo: '008', descripcion: 'Yape / Plin' },
    ];

    return (
        <div>
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar size={28} /> Reservas
                    </h2>
                    <p className="text-sm text-base-content/60 mt-1">Administrá las reservas del hotel</p>
                </div>
                {puedeGestionar && (
                    <button className="btn btn-primary gap-2" onClick={abrirModalCrear}>
                        <Plus size={20} /> Nueva Reserva
                    </button>
                )}
            </div>

            {/* Filtros */}
            <TableFilters
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                placeholder="Buscar por N°, cliente, habitación..."
                showDateFilter={true}
            />

            {/* Tabla */}
            <DataTable
                table={table}
                columns={columns}
                emptyMessage="No se encontraron reservas"
                isLoading={cargando}
                showActions={puedeGestionar}
                renderActions={(row) => (
                    <div className="flex gap-1">
                        <button className="btn btn-ghost btn-xs" onClick={() => abrirModalEditar(row)} title="Editar">
                            <Edit size={16} />
                        </button>
                        <button className="btn btn-ghost btn-xs text-error" onClick={() => cancelarReserva(row.idReserva)} title="Cancelar">
                            <XCircle size={16} />
                        </button>
                    </div>
                )}
                parentRef={parentRef}
            />

            {/* Modal Crear/Editar */}
            {mostrarModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-2xl bg-base-100 border border-base-200 shadow-xl">
                        <h3 className="text-lg font-bold mb-4">
                            {editando ? 'Editar Reserva' : 'Nueva Reserva'}
                        </h3>
                        <form onSubmit={handleSubmit(onSubmit)} noValidate>
                            {/* Rango de fechas */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Fecha Entrada</span></label>
                                    <input
                                        type="datetime-local"
                                        className={`input input-bordered ${errors.fechaEntradaPrevista ? 'input-error' : ''}`}
                                        {...register('fechaEntradaPrevista')}
                                    />
                                    {errors.fechaEntradaPrevista && (
                                        <span className="label-text-alt text-error">{errors.fechaEntradaPrevista.message}</span>
                                    )}
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Fecha Salida</span></label>
                                    <input
                                        type="datetime-local"
                                        className={`input input-bordered ${errors.fechaSalidaPrevista ? 'input-error' : ''}`}
                                        {...register('fechaSalidaPrevista')}
                                    />
                                    {errors.fechaSalidaPrevista && (
                                        <span className="label-text-alt text-error">{errors.fechaSalidaPrevista.message}</span>
                                    )}
                                </div>
                            </div>

                            {/* Habitación (solo si hay fechas) */}
                            {fechaEntrada && fechaSalida && (
                                <div className="form-control mb-4">
                                    <label className="label"><span className="label-text">Habitación disponible</span></label>
                                    {cargandoHabitaciones ? (
                                        <span className="loading loading-spinner loading-sm"></span>
                                    ) : (
                                        <select
                                            className={`select select-bordered ${errors.idHabitacion ? 'select-error' : ''}`}
                                            {...register('idHabitacion', { valueAsNumber: true })}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {habitacionesDisponibles.map(h => (
                                                <option key={h.idHabitacion} value={h.idHabitacion}>
                                                    {h.numeroHabitacion} - {h.tipoHabitacion} (S/ {h.precioNoche?.toFixed(2)})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {errors.idHabitacion && (
                                        <span className="label-text-alt text-error">{errors.idHabitacion.message}</span>
                                    )}
                                </div>
                            )}

                            {/* Cliente (búsqueda por DNI) */}
                            <div className="card bg-base-200 p-4 mb-4">
                                <h4 className="font-semibold mb-2">Cliente</h4>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="DNI del cliente"
                                        className="input input-bordered flex-1"
                                        value={buscarDni}
                                        onChange={(e) => setBuscarDni(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && buscarCliente()}
                                    />
                                    <button type="button" className="btn btn-primary gap-2" onClick={buscarCliente}>
                                        <Search size={18} /> Buscar
                                    </button>
                                </div>
                                {clienteSeleccionado && (
                                    <p className="mt-2 text-sm">
                                        Cliente: <strong>{sanitizeText(clienteSeleccionado.nombres)} {sanitizeText(clienteSeleccionado.apellidos)}</strong>
                                    </p>
                                )}
                                <input type="hidden" {...register('idCliente')} />
                                {errors.idCliente && (
                                    <span className="label-text-alt text-error">{errors.idCliente.message}</span>
                                )}
                            </div>

                            {/* Método de pago y observaciones */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Método de Pago</span></label>
                                    <select className={`select select-bordered ${errors.metodoPago ? 'select-error' : ''}`} {...register('metodoPago')}>
                                        {metodosPago.map(m => (
                                            <option key={m.codigo} value={m.codigo}>{m.descripcion}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Observaciones</span></label>
                                    <input type="text" className="input input-bordered" {...register('observaciones')} />
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="modal-action">
                                <button type="button" className="btn btn-ghost" onClick={cerrarModal}>Cancelar</button>
                                <LoadingButton type="submit" isLoading={isSubmitting}>
                                    {editando ? 'Actualizar' : 'Crear Reserva'}
                                </LoadingButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}