import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';   // <-- Importante
import api from '../api/axios';

const HotelDataContext = createContext(undefined);

export function HotelDataProvider({ children }) {
    const { user } = useAuth();               // Obtenemos el usuario del contexto de autenticación
    const [tiposHabitacion, setTiposHabitacion] = useState([]);
    const [productos, setProductos] = useState([]);
    const [configuracionHotel, setConfiguracionHotel] = useState({ nombre: 'Hotel' });
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if (!user) {
            // Si no hay usuario autenticado, no intentamos cargar nada
            setCargando(false);
            return;
        }

        const cargarDatosGlobales = async () => {
            try {
                const [tiposRes, productosRes, configRes] = await Promise.all([
                    api.get('/TiposHabitacion'),
                    api.get('/Producto'),
                    api.get('/ConfiguracionHotel'),
                ]);
                setTiposHabitacion(tiposRes.data);
                setProductos(productosRes.data);
                setConfiguracionHotel(configRes.data);
            } catch (error) {
                console.error('Error al cargar datos globales del hotel', error);
            } finally {
                setCargando(false);
            }
        };

        cargarDatosGlobales();
    }, [user]);   // Se vuelve a ejecutar si el usuario cambia (login/logout)

    return (
        <HotelDataContext.Provider value={{
            tiposHabitacion,
            productos,
            configuracionHotel,
            cargando,
        }}>
            {children}
        </HotelDataContext.Provider>
    );
}

export function useHotelData() {
    const context = useContext(HotelDataContext);
    if (!context) throw new Error('useHotelData debe usarse dentro de HotelDataProvider');
    return context;
}