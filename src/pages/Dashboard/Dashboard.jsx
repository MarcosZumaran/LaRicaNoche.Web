import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { useSignalR } from '../../hooks/useSignalR';
import toast from 'react-hot-toast';
import { Bed, DollarSign, TrendingUp, Users, Wrench, Calendar } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

export default function Dashboard() {
  const { user } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState({
    totalHabitaciones: 0,
    ocupadas: 0,
    disponibles: 0,
    enLimpieza: 0,
    enMantenimiento: 0,
    enReserva: 0,
    ingresosHoy: 0,
    estadoHabitaciones: [],
  });
  const [topProductos, setTopProductos] = useState([]);

  const coloresGrafico = {
    ocupadas: '#f59e0b',
    disponibles: '#22c55e',
    limpieza: '#3b82f6',
    mantenimiento: '#ef4444',
    enReserva: '#f97316',
  };

  const cargarDatos = async () => {
    try {
      const [habRes, cierreRes, topRes] = await Promise.all([
        api.get('/Reporte/estado-habitaciones'),
        api.get('/Reporte/cierre-caja', { params: { fecha: new Date().toISOString().split('T')[0] } }),
        api.get('/Reporte/top-productos', { params: { dias: 30 } }),
      ]);

      const habitaciones = habRes.data;
      const cierre = cierreRes.data;

      setDatos({
        totalHabitaciones: habitaciones.length,
        ocupadas: habitaciones.filter((h) => h.estado === 'Ocupada').length,
        disponibles: habitaciones.filter((h) => h.estado === 'Disponible').length,
        enLimpieza: habitaciones.filter((h) => h.estado === 'Limpieza').length,
        enMantenimiento: habitaciones.filter((h) => h.estado === 'Mantenimiento').length,
        enReserva: habitaciones.filter((h) => h.estado === 'En Reserva').length,
        ingresosHoy: cierre.reduce((sum, item) => sum + (item.ingresos || 0), 0),
        estadoHabitaciones: habitaciones,
      });
      setTopProductos(topRes.data);
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Tiempo real: cambios de estado
  useSignalR('EstadoHabitacionCambiado', (data) => {
    toast.success(`Habitación ${data.numero} ahora está: ${data.nuevoEstado}`);
    cargarDatos();
  });

  // Tiempo real: nuevas estancias (check‑in)
  useSignalR('NuevaEstancia', (data) => {
    toast.success(`Nueva estancia en ${data.numeroHabitacion} para ${data.cliente}`);
    cargarDatos();
  });

  const datosOcupacion = {
    labels: ['Ocupadas', 'Disponibles', 'Limpieza', 'Mantenimiento', 'En Reserva'],
    datasets: [
      {
        data: [
          datos.ocupadas,
          datos.disponibles,
          datos.enLimpieza || 0,
          datos.enMantenimiento || 0,
          datos.enReserva || 0,
        ],
        backgroundColor: [
          coloresGrafico.ocupadas,
          coloresGrafico.disponibles,
          coloresGrafico.limpieza,
          coloresGrafico.mantenimiento,
          coloresGrafico.enReserva,
        ],
        borderWidth: 0,
      },
    ],
  };

  const opcionesOcupacion = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
    },
    cutout: '65%',
  };

  const datosTopProductos = {
    labels: topProductos.map((p) => p.nombre),
    datasets: [
      {
        label: 'Cantidad vendida',
        data: topProductos.map((p) => p.cantidadTotal),
        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderRadius: 8,
      },
    ],
  };

  const opcionesTopProductos = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { stepSize: 1 } },
      y: { grid: { display: false } },
    },
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const tarjetas = [
    {
      titulo: 'Total Habitaciones',
      valor: datos.totalHabitaciones,
      icono: <Bed size={28} />,
      color: 'text-primary bg-primary/10',
    },
    {
      titulo: 'Ocupadas',
      valor: datos.ocupadas,
      icono: <Users size={28} />,
      color: 'text-warning bg-warning/10',
    },
    {
      titulo: 'Disponibles',
      valor: datos.disponibles,
      icono: <TrendingUp size={28} />,
      color: 'text-success bg-success/10',
    },
    {
      titulo: 'En Reserva',
      valor: datos.enReserva || 0,
      icono: <Calendar size={28} />,
      color: 'text-orange-500 bg-orange-500/10',
    },
    {
      titulo: 'En Mantenimiento',
      valor: datos.enMantenimiento || 0,
      icono: <Wrench size={28} />,
      color: 'text-error bg-error/10',
    },
    {
      titulo: 'Ingresos Hoy',
      valor: `S/ ${datos.ingresosHoy.toFixed(2)}`,
      icono: <DollarSign size={28} />,
      color: 'text-info bg-info/10',
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Panel principal</h2>
      <p className="text-base-content/70 mb-6">Bienvenido, {user?.username}</p>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {tarjetas.map((tarjeta, idx) => (
          <div
            key={idx}
            className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow"
          >
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tarjeta.color}`}>
                  {tarjeta.icono}
                </div>
                <div>
                  <h3 className="text-xs font-medium text-base-content/70">
                    {tarjeta.titulo}
                  </h3>
                  <p className="text-xl font-bold text-base-content mt-1">
                    {tarjeta.valor}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h3 className="card-title text-lg font-semibold mb-4">
              Ocupación actual
            </h3>
            <div className="h-64 flex items-center justify-center">
              {datos.totalHabitaciones > 0 ? (
                <Doughnut data={datosOcupacion} options={opcionesOcupacion} />
              ) : (
                <p className="text-base-content/50">Sin datos de ocupación</p>
              )}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h3 className="card-title text-lg font-semibold mb-4">
              Productos más consumidos (30 días)
            </h3>
            <div className="h-64">
              {topProductos.length > 0 ? (
                <Bar data={datosTopProductos} options={opcionesTopProductos} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-base-content/50">Sin datos de consumo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de estado de habitaciones */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <h3 className="card-title text-lg font-semibold mb-4">
            Estado de Habitaciones
          </h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Tipo</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Último Cambio</th>
                </tr>
              </thead>
              <tbody>
                {datos.estadoHabitaciones.map((h) => (
                  <tr key={h.numeroHabitacion}>
                    <td>{h.numeroHabitacion}</td>
                    <td>{h.tipoHabitacion}</td>
                    <td>S/ {h.precioNoche.toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge ${h.estado === 'Disponible' ? 'badge-success' :
                          h.estado === 'Ocupada' ? 'badge-warning' :
                            h.estado === 'Limpieza' ? 'badge-info' :
                              h.estado === 'Mantenimiento' ? 'badge-error' :
                                h.estado === 'En Reserva' ? 'badge-warning' : 'badge-ghost'
                          }`}
                      >
                        {h.estado}
                      </span>
                    </td>
                    <td>{new Date(h.fechaUltimoCambio).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}