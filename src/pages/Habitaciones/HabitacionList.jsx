import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import swal from '../../lib/swal';
import LoadingButton from '../../components/ui/LoadingButton';
import { habitacionSchema } from './habitacionSchema';
import {
  Plus, Edit, Trash2, Bed, Hash, DollarSign, Layers,
  CheckCircle, Wrench, RotateCcw, UserPlus, DoorOpen,
  ShoppingCart, Search, Phone, Calendar
} from 'lucide-react';

// Colores de fondo para cada estado (Tailwind)
const cardClases = {
  1: 'bg-success/10 border-success/40 hover:bg-success/20',   // Disponible
  2: 'bg-warning/10 border-warning/40 hover:bg-warning/20',   // Ocupada
  3: 'bg-info/10 border-info/40 hover:bg-info/20',            // Limpieza
  4: 'bg-error/10 border-error/40 hover:bg-error/20',         // Mantenimiento
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
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(null); // 'checkin', 'checkout', 'editar', 'crear', 'detalle'
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(null);
  const [cargandoAccion, setCargandoAccion] = useState(false);

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
    fechaCheckoutPrevista: format(new Date(), 'yyyy-MM-dd'),
    metodoPago: '005',
    usarClienteAnonimo: false,
  });

  const cargarDatos = async () => {
    try {
      const [habRes, tiposRes] = await Promise.all([
        api.get('/Habitacion/estado-actual'),
        api.get('/TiposHabitacion'),
      ]);
      setHabitaciones(habRes.data);
      setTipos(tiposRes.data);
    } catch (error) {
      swal.fire('Error', 'No se pudieron cargar las habitaciones', 'error');
    } finally {
      setCargando(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    cargarDatos();
  }, []);

  // --- Acciones genéricas disparadas desde el modal ---
  const ejecutarAccion = async (accion) => {
    if (!habitacionSeleccionada) return;
    const h = habitacionSeleccionada;

    switch (accion) {
      case 'CheckIn':
        setModalAbierto('checkin');
        break;
      case 'CheckOut':
      case 'PasarLimpieza':
        setModalAbierto('checkout');
        break;
      case 'Mantenimiento':
        await cambiarEstado(h.idHabitacion, 4, 'Poner en Mantenimiento');
        break;
      case 'FinalizarLimpieza':
        await cambiarEstado(h.idHabitacion, 1, 'Finalizar limpieza');
        break;
      case 'Habilitar':
        await cambiarEstado(h.idHabitacion, 1, 'Habilitar habitación');
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

  // --- Check‑In desde el modal ---
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
        html: `
          <p>Estancia N° <strong>${res.data.idEstancia}</strong></p>
          <p>Monto: <strong>S/ ${res.data.montoTotal.toFixed(2)}</strong></p>
        `,
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

  // --- Check‑Out desde el modal ---
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

  // --- Modal de Crear/Editar (administrativo) ---
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
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Habitaciones</h2>
        {esAdmin && (
          <button className="btn btn-primary" onClick={abrirModalCrear}>
            <Plus size={20} /> Nueva Habitación
          </button>
        )}
      </div>

      {/* Grid de cartas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 cursor-pointer">
        {habitaciones.map((h) => (
          <div
            key={h.idHabitacion}
            className={`card border-2 ${cardClases[h.idEstado] || 'bg-base-200 border-base-300'} shadow-sm hover:shadow-md transition-all duration-200 ...`}
            onClick={() => {
              setHabitacionSeleccionada(h);
              setModalAbierto('detalle');
            }}
          >
            <div className="card-body p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-bold">{h.numeroHabitacion}</h3>
                <span className={`badge ${colorBadge[h.idEstado] || 'badge-ghost'}`}>
                  {h.nombreEstado}
                </span>
              </div>
              <p className="text-sm mb-1"><Layers size={14} className="inline mr-1" />{h.nombreTipo}</p>
              <p className="text-sm mb-1"><Hash size={14} className="inline mr-1" />Piso: {h.piso ?? '—'}</p>
              <p className="text-lg font-bold mt-auto"><DollarSign size={16} className="inline mr-1" />S/ {h.precioNoche.toFixed(2)}</p>
              {h.clienteHuesped && (
                <p className="text-xs text-gray-500 mt-1 truncate">👤 {h.clienteHuesped}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {habitaciones.length === 0 && (
        <div className="text-center text-gray-500 py-16">
          No hay habitaciones registradas.
        </div>
      )}

      {/* ==================== MODALES ==================== */}

      {/* Modal de detalle + acciones contextuales */}
      {modalAbierto === 'detalle' && habitacionSeleccionada && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">
                {habitacionSeleccionada.numeroHabitacion} — {habitacionSeleccionada.nombreTipo}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModalAbierto(null)}>✕</button>
            </div>

            <div className="space-y-2 mb-4">
              <p><strong>Piso:</strong> {habitacionSeleccionada.piso ?? '—'}</p>
              <p><strong>Estado:</strong> <span className={`badge ${colorBadge[habitacionSeleccionada.idEstado]}`}>{habitacionSeleccionada.nombreEstado}</span></p>
              <p><strong>Precio por noche:</strong> S/ {habitacionSeleccionada.precioNoche.toFixed(2)}</p>
              {habitacionSeleccionada.descripcion && <p><strong>Descripción:</strong> {habitacionSeleccionada.descripcion}</p>}
              {habitacionSeleccionada.clienteHuesped && <p><strong>Cliente:</strong> {habitacionSeleccionada.clienteHuesped}</p>}
            </div>

            {/* Botones de acción según DTO */}
            <div className="flex flex-wrap gap-2">
              {esAdmin && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => abrirModalEditar(habitacionSeleccionada)}>
                    <Edit size={16} /> Editar
                  </button>
                  <button className="btn btn-ghost btn-sm text-error" onClick={() => eliminarHabitacion(habitacionSeleccionada.idHabitacion)}>
                    <Trash2 size={16} /> Eliminar
                  </button>
                </>
              )}
              {habitacionSeleccionada.accionesDisponibles?.map((accion) => (
                <button
                  key={accion}
                  className={`btn btn-sm ${accion === 'CheckIn' ? 'btn-primary' :
                    accion === 'CheckOut' || accion === 'PasarLimpieza' ? 'btn-success' :
                      accion === 'Mantenimiento' ? 'btn-warning' :
                        accion === 'FinalizarLimpieza' ? 'btn-info' :
                          'btn-primary'
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
      )}

      {/* Modal de Check‑In */}
      {modalAbierto === 'checkin' && habitacionSeleccionada && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="text-lg font-bold mb-4">
              <UserPlus className="inline mr-2" /> Check‑In — Hab. {habitacionSeleccionada.numeroHabitacion}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo Documento</label>
                <select className="select select-bordered w-full" value={checkinData.tipoDocumento}
                  onChange={e => setCheckinData({ ...checkinData, tipoDocumento: e.target.value })}>
                  <option value="1">DNI</option>
                  <option value="7">Pasaporte</option>
                </select>
                <label className="label mt-2">Número Documento</label>
                <input className="input input-bordered w-full" value={checkinData.documento}
                  onChange={e => setCheckinData({ ...checkinData, documento: e.target.value })} />
                <label className="label mt-2">Nombres</label>
                <input className="input input-bordered w-full" value={checkinData.nombres}
                  onChange={e => setCheckinData({ ...checkinData, nombres: e.target.value })} />
                <label className="label mt-2">Apellidos</label>
                <input className="input input-bordered w-full" value={checkinData.apellidos}
                  onChange={e => setCheckinData({ ...checkinData, apellidos: e.target.value })} />
                <label className="label mt-2">Teléfono</label>
                <input className="input input-bordered w-full" value={checkinData.telefono}
                  onChange={e => setCheckinData({ ...checkinData, telefono: e.target.value })} />
              </div>
              <div>
                <label className="label">Fecha de salida</label>
                <Controller
                  name="fechaCheckoutPrevista"
                  control={undefined} // No usamos RHF aquí, es estado local
                  render={() => (
                    <DayPicker
                      mode="single"
                      selected={checkinData.fechaCheckoutPrevista ? new Date(checkinData.fechaCheckoutPrevista + 'T00:00:00') : undefined}
                      onSelect={(date) => setCheckinData({ ...checkinData, fechaCheckoutPrevista: date ? format(date, 'yyyy-MM-dd') : '' })}
                      captionLayout="dropdown"
                      startMonth={new Date()}
                      endMonth={new Date(2100, 11)}
                      className="bg-base-100 p-2 rounded-lg shadow"
                    />
                  )}
                />
                <label className="label mt-2">Método de Pago</label>
                <select className="select select-bordered w-full" value={checkinData.metodoPago}
                  onChange={e => setCheckinData({ ...checkinData, metodoPago: e.target.value })}>
                  <option value="005">Efectivo</option>
                  <option value="006">Tarjeta</option>
                  <option value="008">Yape/Plin</option>
                </select>
                <label className="label cursor-pointer mt-2">
                  <input type="checkbox" className="checkbox checkbox-primary" checked={checkinData.usarClienteAnonimo}
                    onChange={e => setCheckinData({ ...checkinData, usarClienteAnonimo: e.target.checked })} />
                  <span className="ml-2">Cliente anónimo (≤ S/700)</span>
                </label>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setModalAbierto(null)}>Cancelar</button>
              <LoadingButton type="button" isLoading={cargandoAccion} onClick={ejecutarCheckIn}>
                Confirmar Check‑In
              </LoadingButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Check‑Out */}
      {modalAbierto === 'checkout' && habitacionSeleccionada && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold mb-4">
              <DoorOpen className="inline mr-2" /> Check‑Out — Hab. {habitacionSeleccionada.numeroHabitacion}
            </h3>
            <p>¿Confirmar la salida del cliente <strong>{habitacionSeleccionada.clienteHuesped || 'desconocido'}</strong>?</p>
            <p className="text-sm text-gray-500 mt-2">La habitación pasará a estado <strong>Limpieza</strong>.</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setModalAbierto(null)}>Cancelar</button>
              <LoadingButton type="button" isLoading={cargandoAccion} onClick={ejecutarCheckOut} className="btn-success">
                Confirmar Check‑Out
              </LoadingButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear/Editar (admin) */}
      {(modalAbierto === 'crear' || modalAbierto === 'editar') && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold mb-4">
              {modalAbierto === 'editar' ? 'Editar Habitación' : 'Nueva Habitación'}
            </h3>
            <form onSubmit={handleSubmit(onSubmitAdmin)} noValidate>
              <div className="form-control mb-4">
                <label className="label">Número de Habitación</label>
                <input className={`input input-bordered ${errors.numeroHabitacion ? 'input-error' : ''}`}
                  {...register('numeroHabitacion')} />
                {errors.numeroHabitacion && <span className="label-text-alt text-error">{errors.numeroHabitacion.message}</span>}
              </div>
              <div className="form-control mb-4">
                <label className="label">Piso</label>
                <input type="number" className={`input input-bordered ${errors.piso ? 'input-error' : ''}`}
                  {...register('piso')} />
              </div>
              <div className="form-control mb-4">
                <label className="label">Tipo de Habitación</label>
                <select className={`select select-bordered ${errors.idTipo ? 'select-error' : ''}`}
                  {...register('idTipo')} defaultValue="">
                  <option value="" disabled>Seleccioná un tipo</option>
                  {tipos.map(t => <option key={t.idTipo} value={t.idTipo}>{t.nombre}</option>)}
                </select>
              </div>
              <div className="form-control mb-4">
                <label className="label">Precio por Noche</label>
                <input type="number" step="0.01" className={`input input-bordered ${errors.precioNoche ? 'input-error' : ''}`}
                  {...register('precioNoche')} />
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