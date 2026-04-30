import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { habitacionSchema } from './habitacionSchema';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Plus, Edit, Trash2, Bed, Hash, DollarSign, Layers } from 'lucide-react';

export default function HabitacionList() {
  const { user } = useAuth();
  const [habitaciones, setHabitaciones] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const esAdmin = user?.nombreRol === 'Administrador';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(habitacionSchema),
  });

  const cargarDatos = async () => {
    try {
      const [habRes, tiposRes] = await Promise.all([
        api.get('/Habitacion'),
        api.get('/TiposHabitacion'),
      ]);
      setHabitaciones(habRes.data);
      setTipos(tiposRes.data);
    } catch (error) {
      Swal.fire('Error', 'No se pudieron cargar las habitaciones', 'error');
    } finally {
      setCargando(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModalCrear = () => {
    setEditando(null);
    reset({
      numeroHabitacion: '',
      piso: '',
      descripcion: '',
      idTipo: '',
      precioNoche: '',
    });
    setMostrarModal(true);
  };

  const abrirModalEditar = (habitacion) => {
    setEditando(habitacion);
    reset({
      numeroHabitacion: habitacion.numeroHabitacion,
      piso: habitacion.piso ?? '',
      descripcion: habitacion.descripcion ?? '',
      idTipo: habitacion.idTipo,
      precioNoche: habitacion.precioNoche,
    });
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEditando(null);
    reset();
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      piso: data.piso ?? null,
      descripcion: data.descripcion || null,
    };

    try {
      if (editando) {
        await api.put(`/Habitacion/${editando.idHabitacion}`, payload);
        Swal.fire('Actualizado', 'La habitación fue actualizada', 'success');
      } else {
        await api.post('/Habitacion', payload);
        Swal.fire('Creado', 'La habitación fue creada', 'success');
      }
      cerrarModal();
      cargarDatos();
    } catch (error) {
      const mensaje =
        error.response?.data?.mensaje || 'Error al guardar la habitación';
      Swal.fire('Error', mensaje, 'error');
    }
  };

  const eliminarHabitacion = async (id) => {
    const confirmacion = await Swal.fire({
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
      Swal.fire('Eliminado', 'La habitación fue eliminada', 'success');
      cargarDatos();
    } catch (error) {
      const mensaje =
        error.response?.data?.mensaje || 'Error al eliminar la habitación';
      Swal.fire('Error', mensaje, 'error');
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

      {/* Tabla */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th><Hash size={16} className="inline mr-1" />N°</th>
                  <th><Bed size={16} className="inline mr-1" />Tipo</th>
                  <th><Layers size={16} className="inline mr-1" />Piso</th>
                  <th><DollarSign size={16} className="inline mr-1" />Precio</th>
                  <th>Estado</th>
                  {esAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {habitaciones.length === 0 ? (
                  <tr>
                    <td colSpan={esAdmin ? 6 : 5} className="text-center text-gray-500 py-8">
                      No hay habitaciones registradas
                    </td>
                  </tr>
                ) : (
                  habitaciones.map((h) => (
                    <tr key={h.idHabitacion}>
                      <td className="font-bold">{h.numeroHabitacion}</td>
                      <td>{h.nombreTipo}</td>
                      <td>{h.piso ?? '—'}</td>
                      <td>S/ {h.precioNoche.toFixed(2)}</td>
                      <td>
                        <span
                          className={`badge ${
                            h.nombreEstado === 'Disponible'
                              ? 'badge-success'
                              : h.nombreEstado === 'Ocupada'
                              ? 'badge-warning'
                              : 'badge-ghost'
                          }`}
                        >
                          {h.nombreEstado}
                        </span>
                      </td>
                      {esAdmin && (
                        <td>
                          <div className="flex gap-1">
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => abrirModalEditar(h)}
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => eliminarHabitacion(h.idHabitacion)}
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de creación/edición */}
      {mostrarModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold mb-4">
              {editando ? 'Editar Habitación' : 'Nueva Habitación'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Número de habitación */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Número de Habitación</span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered ${
                    errors.numeroHabitacion ? 'input-error' : ''
                  }`}
                  {...register('numeroHabitacion')}
                />
                {errors.numeroHabitacion && (
                  <span className="label-text-alt text-error">
                    {errors.numeroHabitacion.message}
                  </span>
                )}
              </div>

              {/* Piso */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Piso</span>
                </label>
                <input
                  type="number"
                  className={`input input-bordered ${
                    errors.piso ? 'input-error' : ''
                  }`}
                  {...register('piso')}
                />
                {errors.piso && (
                  <span className="label-text-alt text-error">
                    {errors.piso.message}
                  </span>
                )}
              </div>

              {/* Tipo de habitación */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Tipo de Habitación</span>
                </label>
                <select
                  className={`select select-bordered ${
                    errors.idTipo ? 'select-error' : ''
                  }`}
                  {...register('idTipo')}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Seleccioná un tipo
                  </option>
                  {tipos.map((t) => (
                    <option key={t.idTipo} value={t.idTipo}>
                      {t.nombre} (capacidad: {t.capacidad})
                    </option>
                  ))}
                </select>
                {errors.idTipo && (
                  <span className="label-text-alt text-error">
                    {errors.idTipo.message}
                  </span>
                )}
              </div>

              {/* Precio por noche */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Precio por Noche (S/)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={`input input-bordered ${
                    errors.precioNoche ? 'input-error' : ''
                  }`}
                  {...register('precioNoche')}
                />
                {errors.precioNoche && (
                  <span className="label-text-alt text-error">
                    {errors.precioNoche.message}
                  </span>
                )}
              </div>

              {/* Descripción */}
              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text">Descripción</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  {...register('descripcion')}
                ></textarea>
              </div>

              {/* Botones */}
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${
                    isSubmitting ? 'loading' : ''
                  }`}
                  disabled={isSubmitting}
                >
                  {editando ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}