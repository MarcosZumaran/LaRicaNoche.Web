import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HotelDataProvider } from './contexts/HotelDataContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Páginas generales
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import LimpiezaPanel from './pages/Limpieza/LimpiezaPanel';

// Páginas existentes
import ClienteList from './pages/Clientes/ClienteList';
import ProductoList from './pages/Productos/ProductoList';
import ComprobanteList from './pages/Comprobantes/ComprobanteList';
import CierreCaja from './pages/Reportes/CierreCaja';
import VentaList from './pages/Ventas/VentaList';
import HistorialVentas from './pages/Ventas/HistorialVentas';
import HistorialEstancias from './pages/Estancias/HistorialEstancias';

//  Páginas de habitaciones
import TipoHabitacionList from './pages/Habitaciones/TipoHabitacionList';
import HabitacionesPorTipo from './pages/Habitaciones/HabitacionesPorTipo';
import HabitacionForm from './pages/Habitaciones/HabitacionForm';
import HabitacionDetalle from './pages/Habitaciones/HabitacionDetalle';
import CheckIn from './pages/Estancias/CheckIn';
import ReservaForm from './pages/Habitaciones/ReservaForm';
import Salida from './pages/Habitaciones/Salida';
import ConsumosEstancia from './pages/Habitaciones/ConsumosEstancia';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HotelDataProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Rutas para Recepcionista y Administrador */}
            <Route element={<ProtectedRoute allowedRoles={['Recepcion', 'Administrador']} />}>
              <Route element={<DashboardLayout />}>
                {/* Redirección principal */}
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Habitaciones – NUEVA ESTRUCTURA */}
                <Route path="/habitaciones/tipo/:idTipo" element={<HabitacionesPorTipo />} />
                <Route path="/habitaciones/nueva" element={<HabitacionForm />} />
                <Route path="/habitaciones/:id/editar" element={<HabitacionForm />} />
                <Route path="/habitaciones/:id/entrada" element={<CheckIn />} />
                <Route path="/habitaciones/:id/reservar" element={<ReservaForm />} />
                <Route path="/habitaciones/:id/salida" element={<Salida />} />
                <Route path="/habitaciones/:id/consumos" element={<ConsumosEstancia />} />
                <Route path="/habitaciones/:id" element={<HabitacionDetalle />} />
                <Route path="/habitaciones" element={<TipoHabitacionList />} />

                {/* Resto de módulos */}
                <Route path="/clientes" element={<ClienteList />} />
                <Route path="/productos" element={<ProductoList />} />
                <Route path="/ventas" element={<VentaList />} />
                <Route path="/ventas/historial" element={<HistorialVentas />} />
                <Route path="/estancias/historial" element={<HistorialEstancias />} />
                <Route path="/comprobantes" element={<ComprobanteList />} />
                <Route path="/reportes/cierre-caja" element={<CierreCaja />} />
              </Route>
            </Route>

            {/* Ruta para Limpieza y Administrador */}
            <Route element={<ProtectedRoute allowedRoles={['Limpieza', 'Administrador']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Navigate to="/limpieza" />} />
                <Route path="/limpieza" element={<LimpiezaPanel />} />
              </Route>
            </Route>

            {/* Redirección si no coincide nada */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </HotelDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;