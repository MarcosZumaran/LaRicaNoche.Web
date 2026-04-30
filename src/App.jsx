import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import HabitacionList from './pages/Habitaciones/HabitacionList';
import ClienteList from './pages/Clientes/ClienteList';
import CheckIn from './pages/Estancias/CheckIn';
import CheckOut from './pages/Estancias/CheckOut';
import ProductoList from './pages/Productos/ProductoList';
import ComprobanteList from './pages/Comprobantes/ComprobanteList';
import CierreCaja from './pages/Reportes/CierreCaja';
import EstadoHabitaciones from './pages/Reportes/EstadoHabitaciones';
import VentaList from './pages/Ventas/VentaList';
import HistorialVentas from './pages/Ventas/HistorialVentas';
import HistorialEstancias from './pages/Estancias/HistorialEstancias';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/habitaciones" element={<HabitacionList />} />
              <Route path="/clientes" element={<ClienteList />} />
              <Route path="/checkin" element={<CheckIn />} />
              <Route path="/checkout" element={<CheckOut />} />
              <Route path="/estancias/historial" element={<HistorialEstancias />} />
              <Route path="/productos" element={<ProductoList />} />
              <Route path="/ventas" element={<VentaList />} />
              <Route path="/ventas/historial" element={<HistorialVentas />} />
              <Route path="/comprobantes" element={<ComprobanteList />} />
              <Route path="/reportes/cierre-caja" element={<CierreCaja />} />
              <Route path="/reportes/estado-habitaciones" element={<EstadoHabitaciones />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;