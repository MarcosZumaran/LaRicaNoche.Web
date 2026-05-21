import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Bed, Hash, DollarSign, Layers, Clock } from 'lucide-react';
import { format } from 'date-fns';
import swal from '../../lib/swal';
import { useSignalR } from '../../hooks/useSignalR'; // ← NUEVO

export default function EstadoHabitaciones() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    try {
      const res = await api.get('/Reporte/estado-habitaciones');
      setHabitaciones(res.data);
    } catch (error) {
      swal.fire('Error', 'No se pudo cargar el estado de habitaciones', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Tiempo real: recargar ante cambios de estado
  useSignalR('EstadoHabitacionCambiado', () => {
    cargarDatos();
  });

  // Tiempo real: recargar ante nuevas estancias (cambia ocupación)
  useSignalR('NuevaEstancia', () => {
    cargarDatos();
  });

  const estadoBadge = (estado) => {
    const clases = {
      'Disponible': 'badge-success',
      'Ocupada': 'badge-warning',
      'Limpieza': 'badge-info',
      'Mantenimiento': 'badge-error',
    };
    return <span className={`badge ${clases[estado] || 'badge-ghost'}`}>{estado}</span>;
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
      <h2 className="text-2xl font-bold mb-6">
        <Bed className="inline mr-2" size={28} />
        Estado de Habitaciones
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="card bg-success text-success-content shadow-md">
          <div className="card-body text-center">
            <h3 className="text-lg font-bold">Disponibles</h3>
            <p className="text-3xl font-extrabold">
              {habitaciones.filter((h) => h.estado === 'Disponible').length}
            </p>
          </div>
        </div>
        <div className="card bg-warning text-warning-content shadow-md">
          <div className="card-body text-center">
            <h3 className="text-lg font-bold">Ocupadas</h3>
            <p className="text-3xl font-extrabold">
              {habitaciones.filter((h) => h.estado === 'Ocupada').length}
            </p>
          </div>
        </div>
        <div className="card bg-info text-info-content shadow-md">
          <div className="card-body text-center">
            <h3 className="text-lg font-bold">Limpieza</h3>
            <p className="text-3xl font-extrabold">
              {habitaciones.filter((h) => h.estado === 'Limpieza').length}
            </p>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th><Hash size={16} className="inline mr-1" />N°</th>
                  <th><Layers size={16} className="inline mr-1" />Tipo</th>
                  <th><DollarSign size={16} className="inline mr-1" />Precio</th>
                  <th>Estado</th>
                  <th><Clock size={16} className="inline mr-1" />Último Cambio</th>
                </tr>
              </thead>
              <tbody>
                {habitaciones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-8">
                      No hay habitaciones registradas
                    </td>
                  </tr>
                ) : (
                  habitaciones.map((h) => (
                    <tr key={h.numeroHabitacion}>
                      <td className="font-bold">{h.numeroHabitacion}</td>
                      <td>{h.tipoHabitacion}</td>
                      <td>S/ {h.precioNoche.toFixed(2)}</td>
                      <td>{estadoBadge(h.estado)}</td>
                      <td>
                        {h.fechaUltimoCambio
                          ? format(new Date(h.fechaUltimoCambio), 'dd/MM/yyyy HH:mm')
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}