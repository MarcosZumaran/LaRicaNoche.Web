import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import swal from '../../lib/swal';
import LoadingButton from '../../components/ui/LoadingButton';
import { habitacionSchema } from './habitacionSchema';
import {
  Plus, Edit, Trash2, Hash, DollarSign, Layers,
  CheckCircle, Wrench, RotateCcw, UserPlus, DoorOpen,
  ShoppingCart
} from 'lucide-react';
import useSignalR from '../../hooks/useSignalR';

// Colores de fondo para cada estado (Tailwind)
const cardClases = {
  1: 'bg-success/10 border-success/40 hover:bg-success/20',
  2: 'bg-warning/10 border-warning/40 hover:bg-warning/20',
  3: 'bg-info/10 border-info/40 hover:bg-info/20',
  4: 'bg-error/10 border-error/40 hover:bg-error/20',
};

const colorBadge = {
  1: 'badge-success',
  2: 'badge-warning',
  3: 'badge-info',
  4: 'badge-error',
};

export default function HabitacionList() {
  const { user } = useAuth();
  const esAdmin = user?.nombreRol === 'Administrador';
  const esLimpieza = user?.nombreRol === 'Limpieza';

  const [habitaciones, setHabitaciones] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(null);
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(null);
  const [cargandoAccion, setCargandoAccion] = useState(false);

  // Estados para el formulario de consumo
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidadConsumo, setCantidadConsumo] = useState(1);
  const [agregandoConsumo, setAgregandoConsumo] = useState(false);

  const [modoCheckIn, setModoCheckIn] = useState('inmediato');
  const [consumos, setConsumos] = useState([]);
  const [estanciaActiva, setEstanciaActiva] = useState(null); // datos de la estancia activa (fechas, monto)

  // Estado para las reservas del calendario
  const [reservas, setReservas] = useState([]);

  const [editandoId, setEditandoId] = useState(null);
  const [editCantidad, setEditCantidad] = useState(1);
  const [eliminandoId, setEliminandoId] = useState(null);

  // Formulario de edición/creación
  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(habitacionSchema),
  });

  // Formulario de Check‑In (simplificado, reutilizando estados locales)
  const [checkinData, setCheckinData] = useState({
    tipoDocumento: '1',
    documento: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    fechaEntradaPrevista: format(new Date(), 'yyyy-MM-dd'),
    fechaCheckoutPrevista: format(new Date(), 'yyyy-MM-dd'),
    metodoPago: '005',
    usarClienteAnonimo: false,
  });

  const cargarDatos = async () => {
    try {
      const [habRes, tiposRes, productosRes] = await Promise.all([
        api.get('/Habitacion/estado-actual'),
        api.get('/TiposHabitacion'),
        api.get('/Producto'),
      ]);
      setHabitaciones(habRes.data);
      setTipos(tiposRes.data);
      setProductos(productosRes.data);
    } catch (error) {
      swal.fire('Error', 'No se pudieron cargar los datos', 'error');
    } finally {
      setCargando(false);
    }
  };

  const cargarReservas = async (idHabitacion) => {
    try {
      const res = await api.get(`/Estancia/reservas/${idHabitacion}`);
      const eventos = res.data.map(r => ({
        title: `${r.clienteNombre ?? 'Reserva'} (${r.estado})`,
        start: new Date(r.fechaEntradaPrevista),
        end: new Date(r.fechaSalidaPrevista),
        backgroundColor: r.estado === 'Confirmada' ? '#22c55e' : r.estado === 'Check‑in realizado' ? '#f59e0b' : '#6b7280',
        borderColor: r.estado === 'Confirmada' ? '#16a34a' : r.estado === 'Check‑in realizado' ? '#d97706' : '#4b5563',
      }));
      setReservas(eventos);
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      setReservas([]);
    }
  };

  const cargarConsumos = async (idEstancia) => {
    try {
      const res = await api.get(`/Estancia/${idEstancia}/consumos`);
      setConsumos(res.data);
    } catch (error) {
      console.error('Error al cargar consumos:', error);
      setConsumos([]);
    }
  };

  const cargarDetalleEstancia = async (idEstancia) => {
    try {
      const res = await api.get(`/Estancia/${idEstancia}`);
      setEstanciaActiva(res.data);
    } catch (error) {
      console.error('Error al cargar detalle de estancia:', error);
      setEstanciaActiva(null);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    cargarDatos();
  }, []);

  // SignalR: escuchar cambios de estado en tiempo real
  useSignalR((data) => {
    console.log('Cambio recibido:', data);
    cargarDatos();
  });

  const ejecutarAccion = async (accion) => {
    if (!habitacionSeleccionada) return;
    switch (accion) {
      case 'CheckIn':
        setModalAbierto('checkin');
        break;
      case 'CheckOut':
      case 'PasarLimpieza':
        setModalAbierto('checkout');
        break;
      case 'Mantenimiento':
        await cambiarEstado(habitacionSeleccionada.idHabitacion, 4, 'Poner en Mantenimiento');
        break;
      case 'FinalizarLimpieza':
        await cambiarEstado(habitacionSeleccionada.idHabitacion, 1, 'Finalizar limpieza');
        break;
      case 'Habilitar':
        await cambiarEstado(habitacionSeleccionada.idHabitacion, 1, 'Habilitar habitación');
        break;
      default:
        break;
    }
  };

  const cambiarEstado = async (idHabitacion, nuevoIdEstado, accion) => {
    setCambiandoEstado(idHabitacion);
    try {
      await api.patch(`/Habitacion/${idHabitacion}`, { idEstado: nuevoIdEstado });
      swal.fire('Éxito', `Habitación actualizada: ${accion}`, 'success');
      cargarDatos();
      setModalAbierto(null);
    } catch (error) {
      swal.fire('Error', error.response?.data?.mensaje || 'Error al cambiar el estado', 'error');
    } finally {
      setCambiandoEstado(null);
    }
  };

  const ejecutarCheckIn = async () => {
    setCargandoAccion(true);
    try {
      const res = await api.post('/Estancia/checkin', {
        idHabitacion: habitacionSeleccionada.idHabitacion,
        ...checkinData,
        fechaCheckoutPrevista: checkinData.fechaCheckoutPrevista,
      });
      swal.fire({
        icon: 'success',
        title: '¡Check‑In exitoso!',
        html: `<p>Estancia N° <strong>${res.data.idEstancia}</strong></p><p>Monto: <strong>S/ ${res.data.montoTotal.toFixed(2)}</strong></p>`,
        confirmButtonText: 'Aceptar',
      });
      cargarDatos();
      setModalAbierto(null);
    } catch (error) {
      swal.fire('Error', error.response?.data?.mensaje || 'Error al realizar el Check‑In', 'error');
    } finally {
      setCargandoAccion(false);
    }
  };

  const ejecutarCheckOut = async () => {
    if (!habitacionSeleccionada?.idEstanciaActiva) {
      swal.fire('Error', 'No se encontró la estancia activa', 'error');
      return;
    }
    setCargandoAccion(true);
    try {
      await api.post(`/Estancia/${habitacionSeleccionada.idEstanciaActiva}/checkout`);
      swal.fire('Éxito', 'Check‑Out realizado. La habitación pasa a Limpieza.', 'success');
      cargarDatos();
      setModalAbierto(null);
    } catch (error) {
      swal.fire('Error', error.response?.data?.mensaje || 'Error al realizar el Check‑Out', 'error');
    } finally {
      setCargandoAccion(false);
    }
  };

  const ejecutarReserva = async () => {
    setCargandoAccion(true);
    try {
      const res = await api.post('/Estancia/reserva', {
        idHabitacion: habitacionSeleccionada.idHabitacion,
        tipoDocumento: checkinData.tipoDocumento,
        documento: checkinData.documento,
        nombres: checkinData.nombres,
        apellidos: checkinData.apellidos,
        telefono: checkinData.telefono,
        fechaEntradaPrevista: checkinData.fechaEntradaPrevista,
        fechaSalidaPrevista: checkinData.fechaCheckoutPrevista,
        metodoPago: checkinData.metodoPago,
        usarClienteAnonimo: checkinData.usarClienteAnonimo,
      });
      swal.fire({
        icon: 'success',
        title: '¡Reserva creada!',
        html: `<p>Reserva N° <strong>${res.data.idReserva}</strong></p><p>Entrada: <strong>${new Date(checkinData.fechaEntradaPrevista).toLocaleDateString('es-PE')}</strong></p>`,
        confirmButtonText: 'Aceptar',
      });
      cargarDatos();
      setModalAbierto(null);
    } catch (error) {
      swal.fire('Error', error.response?.data?.mensaje || 'Error al crear la reserva', 'error');
    } finally {
      setCargandoAccion(false);
    }
  };

  const agregarConsumo = async () => {
    if (!productoSeleccionado || cantidadConsumo < 1) {
      swal.fire('Atención', 'Seleccione un producto y una cantidad válida', 'warning');
      return;
    }
    setAgregandoConsumo(true);
    try {
      await api.post(`/Estancia/${habitacionSeleccionada.idEstanciaActiva}/consumo`, {
        idProducto: parseInt(productoSeleccionado),
        cantidad: cantidadConsumo,
      });
      swal.fire('Agregado', 'Consumo registrado exitosamente', 'success');
      cargarDatos();
      cargarConsumos(habitacionSeleccionada.idEstanciaActiva);
      cargarDetalleEstancia(habitacionSeleccionada.idEstanciaActiva); // actualiza el monto total
      setProductoSeleccionado('');
      setCantidadConsumo(1);
    } catch (error) {
      swal.fire('Error', error.response?.data?.mensaje || 'Error al registrar el consumo', 'error');
    } finally {
      setAgregandoConsumo(false);
    }
  };

  const abrirModalCrear = () => {
    resetForm({ numeroHabitacion: '', piso: '', descripcion: '', idTipo: '', precioNoche: '' });
    setHabitacionSeleccionada(null);
    setModalAbierto('crear');
  };

  const abrirModalEditar = (h) => {
    resetForm({
      numeroHabitacion: h.numeroHabitacion,
      piso: h.piso ?? '',
      descripcion: h.descripcion ?? '',
      idTipo: h.idTipo,
      precioNoche: h.precioNoche,
    });
    setHabitacionSeleccionada(h);
    setModalAbierto('editar');
  };

  const onSubmitAdmin = async (data) => {
    const payload = { ...data, piso: data.piso ?? null, descripcion: data.descripcion || null };
    try {
      if (modalAbierto === 'editar' && habitacionSeleccionada) {
        await api.patch(`/Habitacion/${habitacionSeleccionada.idHabitacion}`, payload);
        swal.fire('Actualizado', 'La habitación fue actualizada', 'success');
      } else {
        await api.post('/Habitacion', payload);
        swal.fire('Creado', 'La habitación fue creada', 'success');
      }
      cargarDatos();
      setModalAbierto(null);
    } catch (error) {
      swal.fire('Error', error.response?.data?.mensaje || 'Error al guardar', 'error');
    }
  };

  const eliminarHabitacion = async (id) => {
    const confirmacion = await swal.fire({
      title: '¿Eliminar habitación?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirmacion.isConfirmed) return;
    try {
      await api.delete(`/Habitacion/${id}`);
      swal.fire('Eliminado', 'La habitación fue eliminada', 'success');
      cargarDatos();
    } catch (error) {
      swal.fire('Error', error.response?.data?.mensaje || 'Error al eliminar', 'error');
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Habitaciones</h2>
        {esAdmin && (
          <button className="btn btn-primary" onClick={abrirModalCrear}>
            <Plus size={20} /> Nueva Habitación
          </button>
        )}
      </div>

      {/* Grid de cartas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {habitaciones.map((h) => (
          <div
            key={h.idHabitacion}
            className={`card border-2 ${cardClases[h.idEstado] || 'bg-base-200 border-base-300'} shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`}
            onClick={() => {
              setHabitacionSeleccionada(h);
              setModalAbierto('detalle');
              cargarReservas(h.idHabitacion);
              if (h.idEstanciaActiva) {
                cargarDetalleEstancia(h.idEstanciaActiva);
                cargarConsumos(h.idEstanciaActiva);
              } else {
                setEstanciaActiva(null);
                setConsumos([]);
              }
            }}
          >
            <div className="card-body p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-bold">{h.numeroHabitacion}</h3>
                <span className={`badge ${colorBadge[h.idEstado] || 'badge-ghost'}`}>{h.nombreEstado}</span>
              </div>
              <p className="text-sm mb-1"><Layers size={14} className="inline mr-1" />{h.nombreTipo}</p>
              <p className="text-sm mb-1"><Hash size={14} className="inline mr-1" />Piso: {h.piso ?? '—'}</p>
              <p className="text-lg font-bold mt-auto"><DollarSign size={16} className="inline mr-1" />S/ {h.precioNoche.toFixed(2)}</p>
              {h.clienteHuesped && <p className="text-xs text-gray-500 mt-1 truncate">👤 {h.clienteHuesped}</p>}
            </div>
          </div>
        ))}
      </div>

      {habitaciones.length === 0 && (
        <div className="text-center text-gray-500 py-16">No hay habitaciones registradas.</div>
      )}

      {/* Modal de detalle */}
      {modalAbierto === 'detalle' && habitacionSeleccionada && (
        <div className="modal modal-open modal-middle">
          <div className="modal-box w-full max-w-[95vw] h-[95vh] bg-base-100/80 backdrop-blur-xl shadow-2xl border border-base-300 rounded-2xl p-0 flex flex-col">
            {/* Cabecera con degradado */}
            <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 p-6 rounded-t-2xl border-b border-base-300 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <span className="text-3xl">{habitacionSeleccionada.numeroHabitacion}</span>
                    <span className="text-lg font-normal text-base-content/70">— {habitacionSeleccionada.nombreTipo}</span>
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`badge badge-lg ${colorBadge[habitacionSeleccionada.idEstado] || 'badge-ghost'}`}>
                      {habitacionSeleccionada.nombreEstado}
                    </span>
                    {habitacionSeleccionada.clienteHuesped && (
                      <span className="text-sm font-medium text-base-content/80 flex items-center gap-1">
                        <UserPlus size={14} /> {habitacionSeleccionada.clienteHuesped}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm btn-circle"
                  onClick={() => setModalAbierto(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Cuerpo con flex-1 para ocupar el espacio restante */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col lg:grid lg:grid-cols-2 gap-8 pb-24">
              {/* Columna izquierda: datos y acciones */}
              <div className="space-y-6">
                {/* Información de la habitación */}
                <div className="card bg-base-200/50 border border-base-300 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="card-title text-base mb-2">Información</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Hash size={18} className="text-primary" />
                        <span>Piso {habitacionSeleccionada.piso ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign size={18} className="text-success" />
                        <span>S/ {habitacionSeleccionada.precioNoche.toFixed(2)} / noche</span>
                      </div>
                      {habitacionSeleccionada.descripcion && (
                        <div className="col-span-2 mt-2 p-3 bg-base-100 rounded-lg border border-base-300">
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Descripción</p>
                          <p className="text-sm text-base-content/80">{habitacionSeleccionada.descripcion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Estancia activa (fechas y duración) */}
                {estanciaActiva && (
                  <div className="card bg-base-200/50 border border-base-300 shadow-sm">
                    <div className="card-body p-4">
                      <h4 className="card-title text-base mb-2">Estancia Activa</h4>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Cliente:</strong> {estanciaActiva.clienteNombreCompleto}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span>
                            <strong>Check‑In:</strong> {format(new Date(estanciaActiva.fechaCheckin), 'dd/MM/yy')}
                          </span>
                          <span>
                            <strong>Salida:</strong> {format(new Date(estanciaActiva.fechaCheckoutPrevista), 'dd/MM/yy')}
                          </span>
                        </div>
                        {/* Barra de progreso de días */}
                        <div className="mt-2">
                          <progress
                            className="progress progress-success w-full"
                            value={(() => {
                              const total = new Date(estanciaActiva.fechaCheckoutPrevista) - new Date(estanciaActiva.fechaCheckin);
                              const transcurrido = new Date() - new Date(estanciaActiva.fechaCheckin);
                              return Math.min(Math.round((transcurrido / total) * 100), 100);
                            })()}
                            max="100"
                          ></progress>
                          <p className="text-xs text-base-content/60 mt-1">
                            {(() => {
                              const total = (new Date(estanciaActiva.fechaCheckoutPrevista) - new Date(estanciaActiva.fechaCheckin)) / (1000 * 60 * 60 * 24);
                              const transcurrido = (new Date() - new Date(estanciaActiva.fechaCheckin)) / (1000 * 60 * 60 * 24);
                              return `${Math.floor(transcurrido)} de ${total} noches transcurridas`;
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Acciones disponibles */}
                <div className="card bg-base-200/50 border border-base-300 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="card-title text-base mb-3">Acciones</h4>
                    <div className="flex flex-wrap gap-2">
                      {esAdmin && (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => abrirModalEditar(habitacionSeleccionada)}>
                            <Edit size={16} /> Editar
                          </button>
                          <button
                            className="btn btn-outline btn-sm text-error border-error hover:bg-error/10"
                            onClick={() => eliminarHabitacion(habitacionSeleccionada.idHabitacion)}
                          >
                            <Trash2 size={16} /> Eliminar
                          </button>
                        </>
                      )}
                      {habitacionSeleccionada.accionesDisponibles?.map((accion) => (
                        <button
                          key={accion}
                          className={`btn btn-sm ${accion === 'CheckIn'
                            ? 'btn-primary'
                            : accion === 'CheckOut' || accion === 'PasarLimpieza'
                              ? 'btn-success'
                              : accion === 'Mantenimiento'
                                ? 'btn-warning'
                                : accion === 'FinalizarLimpieza'
                                  ? 'btn-info'
                                  : 'btn-primary'
                            }`}
                          onClick={() => ejecutarAccion(accion)}
                          disabled={cambiandoEstado === habitacionSeleccionada.idHabitacion}
                        >
                          {accion === 'CheckIn' && <UserPlus size={16} />}
                          {accion === 'CheckOut' && <DoorOpen size={16} />}
                          {accion === 'PasarLimpieza' && <CheckCircle size={16} />}
                          {accion === 'Mantenimiento' && <Wrench size={16} />}
                          {accion === 'FinalizarLimpieza' && <CheckCircle size={16} />}
                          {accion === 'Habilitar' && <RotateCcw size={16} />}
                          <span className="ml-1">{accion}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna derecha: consumos y calendario */}
              <div className="space-y-6 flex flex-col">
                {/* Consumos */}
                {habitacionSeleccionada.idEstanciaActiva && (
                  <div className="card bg-base-200/50 border border-base-300 shadow-sm">
                    <div className="card-body p-4">
                      <h4 className="card-title text-base mb-2">
                        <ShoppingCart size={18} className="text-warning" /> Consumos
                      </h4>

                      {/* Formulario para agregar */}
                      <div className="flex gap-2 items-end mb-4">
                        <div className="form-control flex-1">
                          <label className="label py-1">
                            <span className="label-text text-xs">Producto</span>
                          </label>
                          <select
                            className="select select-bordered select-sm w-full"
                            value={productoSeleccionado}
                            onChange={(e) => setProductoSeleccionado(e.target.value)}
                          >
                            <option value="">Seleccionar producto</option>
                            {productos.map((p) => (
                              <option key={p.idProducto} value={p.idProducto}>
                                {p.nombre} (S/ {p.precioUnitario.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-control w-24">
                          <label className="label py-1">
                            <span className="label-text text-xs">Cantidad</span>
                          </label>
                          <input
                            type="number"
                            className="input input-bordered input-sm w-full"
                            min="1"
                            value={cantidadConsumo}
                            onChange={(e) => setCantidadConsumo(parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={agregarConsumo}
                          disabled={agregandoConsumo}
                        >
                          {agregandoConsumo ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <Plus size={16} />
                          )}
                        </button>
                      </div>

                      {/* Tabla de consumos ya registrados */}
                      {consumos.length > 0 && (
                        <div className="overflow-x-auto mt-3">
                          <table className="table table-zebra table-sm">
                            <thead>
                              <tr>
                                <th>Producto</th>
                                <th>Cant.</th>
                                <th>P.U.</th>
                                <th>Subtotal</th>
                                <th className="w-24">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {consumos.map((c) => (
                                <tr key={c.idItem}>
                                  <td>{c.nombreProducto}</td>
                                  <td>
                                    {editandoId === c.idItem ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          className="input input-bordered input-xs w-16"
                                          value={editCantidad}
                                          min="1"
                                          onChange={(e) => setEditCantidad(parseInt(e.target.value) || 1)}
                                        />
                                        <button
                                          className="btn btn-ghost btn-xs text-success"
                                          onClick={async () => {
                                            if (editCantidad < 1) return;
                                            try {
                                              await api.put(`/Estancia/${habitacionSeleccionada.idEstanciaActiva}/consumo/${c.idItem}`, {
                                                cantidad: editCantidad,
                                              });
                                              swal.fire('Actualizado', 'Consumo modificado', 'success');
                                              cargarConsumos(habitacionSeleccionada.idEstanciaActiva);
                                              cargarDetalleEstancia(habitacionSeleccionada.idEstanciaActiva);
                                              cargarDatos();
                                              setEditandoId(null);
                                            } catch (err) {
                                              swal.fire('Error', err.response?.data?.mensaje || 'Error al actualizar', 'error');
                                            }
                                          }}
                                        >
                                          <CheckCircle size={14} />
                                        </button>
                                        <button
                                          className="btn btn-ghost btn-xs"
                                          onClick={() => setEditandoId(null)}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ) : (
                                      c.cantidad
                                    )}
                                  </td>
                                  <td>S/ {c.precioUnitario.toFixed(2)}</td>
                                  <td className="font-semibold">S/ {c.subtotal.toFixed(2)}</td>
                                  <td>
                                    {editandoId !== c.idItem && (
                                      <div className="flex gap-1">
                                        <button
                                          className="btn btn-ghost btn-xs"
                                          onClick={() => {
                                            setEditandoId(c.idItem);
                                            setEditCantidad(c.cantidad);
                                          }}
                                          title="Editar"
                                        >
                                          <Edit size={14} />
                                        </button>
                                        <button
                                          className="btn btn-ghost btn-xs text-error"
                                          disabled={eliminandoId === c.idItem}
                                          onClick={async () => {
                                            const confirmacion = await swal.fire({
                                              title: '¿Eliminar consumo?',
                                              text: 'Esta acción no se puede deshacer',
                                              icon: 'warning',
                                              showCancelButton: true,
                                              confirmButtonColor: '#d33',
                                              confirmButtonText: 'Sí, eliminar',
                                              cancelButtonText: 'Cancelar',
                                            });
                                            if (!confirmacion.isConfirmed) return;
                                            setEliminandoId(c.idItem);
                                            try {
                                              await api.delete(`/Estancia/${habitacionSeleccionada.idEstanciaActiva}/consumo/${c.idItem}`);
                                              swal.fire('Eliminado', 'El consumo fue eliminado', 'success');
                                              cargarConsumos(habitacionSeleccionada.idEstanciaActiva);
                                              cargarDetalleEstancia(habitacionSeleccionada.idEstanciaActiva);
                                              cargarDatos();
                                            } catch (err) {
                                              swal.fire('Error', err.response?.data?.mensaje || 'Error al eliminar', 'error');
                                            } finally {
                                              setEliminandoId(null);
                                            }
                                          }}
                                          title="Eliminar"
                                        >
                                          {eliminandoId === c.idItem ? (
                                            <span className="loading loading-spinner loading-xs"></span>
                                          ) : (
                                            <Trash2 size={14} />
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {consumos.length === 0 && (
                        <p className="text-xs text-base-content/50 italic">Sin consumos registrados.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Calendario de reservas */}
                {reservas.length > 0 && (
                  <div className="card bg-base-200/50 border border-base-300 shadow-sm flex-1">
                    <div className="card-body p-4 flex flex-col">
                      <h4 className="card-title text-base mb-2">Reservas</h4>
                      <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-base-300 shadow-inner">
                        <FullCalendar
                          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                          initialView="dayGridMonth"
                          headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay',
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
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer con total acumulado */}
            {estanciaActiva && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-base-100/90 backdrop-blur-xl border-t border-base-300 rounded-b-2xl z-10">
                <div className="flex justify-between items-center max-w-[95vw] mx-auto px-4">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">Total Estancia:</span>
                    <span className="text-lg font-bold text-success">
                      S/ {estanciaActiva.montoTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-base-content/70">
                      + Consumos: S/ {consumos.reduce((sum, c) => sum + c.subtotal, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Check‑In */}
      {modalAbierto === 'checkin' && habitacionSeleccionada && (
        <div className="modal modal-open modal-middle">
          <div className={`modal-box w-full overflow-x-hidden max-w-[95vw] max-h-[90vh] overflow-y-auto ${modoCheckIn === 'reserva' ? 'md:max-w-5xl' : 'md:max-w-3xl'}`}>
            <h3 className="text-lg font-bold mb-4">
              <UserPlus className="inline mr-2" />
              {modoCheckIn === 'inmediato' ? 'Check‑In' : 'Nueva Reserva'}
              {' — Hab. ' + habitacionSeleccionada.numeroHabitacion}
            </h3>
            <div className="form-control mb-4">
              <label className="label cursor-pointer">
                <span className="label-text font-semibold">Tipo de operación</span>
                <div className="flex gap-2">
                  <button type="button" className={`btn btn-sm ${modoCheckIn === 'inmediato' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setModoCheckIn('inmediato')}>Ahora (Check‑In)</button>
                  <button type="button" className={`btn btn-sm ${modoCheckIn === 'reserva' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setModoCheckIn('reserva')}>Reserva</button>
                </div>
              </label>
            </div>
            <div className={`grid grid-cols-1 ${modoCheckIn === 'reserva' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
              <div>
                <label className="label">Tipo Documento</label>
                <select className="select select-bordered w-full" value={checkinData.tipoDocumento} onChange={e => setCheckinData({ ...checkinData, tipoDocumento: e.target.value })}>
                  <option value="1">DNI</option>
                  <option value="7">Pasaporte</option>
                </select>
                <label className="label mt-2">Número Documento</label>
                <input className="input input-bordered w-full" value={checkinData.documento} onChange={e => setCheckinData({ ...checkinData, documento: e.target.value })} />
                <label className="label mt-2">Nombres</label>
                <input className="input input-bordered w-full" value={checkinData.nombres} onChange={e => setCheckinData({ ...checkinData, nombres: e.target.value })} />
                <label className="label mt-2">Apellidos</label>
                <input className="input input-bordered w-full" value={checkinData.apellidos} onChange={e => setCheckinData({ ...checkinData, apellidos: e.target.value })} />
                <label className="label mt-2">Teléfono</label>
                <input className="input input-bordered w-full" value={checkinData.telefono} onChange={e => setCheckinData({ ...checkinData, telefono: e.target.value })} />
              </div>
              <div className={modoCheckIn === 'reserva' ? 'md:col-span-2' : ''}>
                {modoCheckIn === 'inmediato' ? (
                  <>
                    <label className="label">Fecha de salida</label>
                    <DayPicker mode="single" selected={checkinData.fechaCheckoutPrevista ? new Date(checkinData.fechaCheckoutPrevista + 'T00:00:00') : undefined} onSelect={(date) => setCheckinData({ ...checkinData, fechaCheckoutPrevista: date ? format(date, 'yyyy-MM-dd') : '' })} captionLayout="dropdown" startMonth={new Date()} endMonth={new Date(2100, 11)} className="bg-base-100 p-2 rounded-lg shadow" />
                  </>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="label">Fecha de entrada</label>
                      <DayPicker mode="single" selected={checkinData.fechaEntradaPrevista ? new Date(checkinData.fechaEntradaPrevista + 'T00:00:00') : undefined} onSelect={(date) => setCheckinData({ ...checkinData, fechaEntradaPrevista: date ? format(date, 'yyyy-MM-dd') : '' })} captionLayout="dropdown" startMonth={new Date()} endMonth={new Date(2100, 11)} className="bg-base-100 p-2 rounded-lg shadow" />
                    </div>
                    <div className="divider divider-horizontal mx-0" />
                    <div className="flex-1">
                      <label className="label">Fecha de salida</label>
                      <DayPicker mode="single" selected={checkinData.fechaCheckoutPrevista ? new Date(checkinData.fechaCheckoutPrevista + 'T00:00:00') : undefined} onSelect={(date) => setCheckinData({ ...checkinData, fechaCheckoutPrevista: date ? format(date, 'yyyy-MM-dd') : '' })} captionLayout="dropdown" startMonth={new Date()} endMonth={new Date(2100, 11)} className="bg-base-100 p-2 rounded-lg shadow" />
                    </div>
                  </div>
                )}
                <label className="label mt-2">Método de Pago</label>
                <select className="select select-bordered w-full" value={checkinData.metodoPago} onChange={e => setCheckinData({ ...checkinData, metodoPago: e.target.value })}>
                  <option value="005">Efectivo</option>
                  <option value="006">Tarjeta</option>
                  <option value="008">Yape/Plin</option>
                </select>
                <label className="label cursor-pointer mt-2">
                  <input type="checkbox" className="checkbox checkbox-primary" checked={checkinData.usarClienteAnonimo} onChange={e => setCheckinData({ ...checkinData, usarClienteAnonimo: e.target.checked })} />
                  <span className="ml-2">Cliente anónimo (≤ S/700)</span>
                </label>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setModalAbierto(null)}>Cancelar</button>
              <LoadingButton type="button" isLoading={cargandoAccion} onClick={modoCheckIn === 'inmediato' ? ejecutarCheckIn : ejecutarReserva}>
                {modoCheckIn === 'inmediato' ? 'Confirmar Check‑In' : 'Crear Reserva'}
              </LoadingButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Check‑Out */}
      {modalAbierto === 'checkout' && habitacionSeleccionada && (
        <div className="modal modal-open modal-middle">
          <div className="modal-box max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4"><DoorOpen className="inline mr-2" /> Check‑Out — Hab. {habitacionSeleccionada.numeroHabitacion}</h3>
            <p>¿Confirmar la salida del cliente <strong>{habitacionSeleccionada.clienteHuesped || 'desconocido'}</strong>?</p>
            <p className="text-sm text-gray-500 mt-2">La habitación pasará a estado <strong>Limpieza</strong>.</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setModalAbierto(null)}>Cancelar</button>
              <LoadingButton type="button" isLoading={cargandoAccion} onClick={ejecutarCheckOut} className="btn-success">Confirmar Check‑Out</LoadingButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear/Editar */}
      {(modalAbierto === 'crear' || modalAbierto === 'editar') && (
        <div className="modal modal-open modal-middle">
          <div className="modal-box max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{modalAbierto === 'editar' ? 'Editar Habitación' : 'Nueva Habitación'}</h3>
            <form onSubmit={handleSubmit(onSubmitAdmin)} noValidate>
              <div className="form-control mb-4">
                <label className="label">Número de Habitación</label>
                <input className={`input input-bordered ${errors.numeroHabitacion ? 'input-error' : ''}`} {...register('numeroHabitacion')} />
                {errors.numeroHabitacion && <span className="label-text-alt text-error">{errors.numeroHabitacion.message}</span>}
              </div>
              <div className="form-control mb-4">
                <label className="label">Piso</label>
                <input type="number" className={`input input-bordered ${errors.piso ? 'input-error' : ''}`} {...register('piso')} />
              </div>
              <div className="form-control mb-4">
                <label className="label">Tipo de Habitación</label>
                <select className={`select select-bordered ${errors.idTipo ? 'select-error' : ''}`} {...register('idTipo')} defaultValue="">
                  <option value="" disabled>Seleccioná un tipo</option>
                  {tipos.map(t => <option key={t.idTipo} value={t.idTipo}>{t.nombre}</option>)}
                </select>
              </div>
              <div className="form-control mb-4">
                <label className="label">Precio por Noche</label>
                <input type="number" step="0.01" className={`input input-bordered ${errors.precioNoche ? 'input-error' : ''}`} {...register('precioNoche')} />
              </div>
              <div className="form-control mb-4">
                <label className="label">Descripción</label>
                <textarea className="textarea textarea-bordered" {...register('descripcion')}></textarea>
              </div>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setModalAbierto(null)}>Cancelar</button>
                <LoadingButton type="submit" isLoading={isSubmitting}>
                  {modalAbierto === 'editar' ? 'Actualizar' : 'Crear'}
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}