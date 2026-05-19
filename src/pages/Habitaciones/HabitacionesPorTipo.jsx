import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHotelData } from '../../contexts/HotelDataContext';
import api from '../../api/axios';
import HabitacionCard from '../../components/ui/HabitacionCard';
import { BedDouble, ArrowLeft } from 'lucide-react';

export default function HabitacionesPorTipo() {
    const { idTipo } = useParams();
    const navigate = useNavigate();
    const { tiposHabitacion, cargando: cargandoTipos } = useHotelData();

    const [habitaciones, setHabitaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const tipoSeleccionado = tiposHabitacion.find(t => t.idTipo === parseInt(idTipo));

    useEffect(() => {
        const cargarHabitaciones = async () => {
            setCargando(true);
            setError(null);
            try {
                const res = await api.get('/Habitacion/estado-actual');
                if (idTipo === '0') {
                    setHabitaciones(res.data);
                } else {
                    const idTipoNum = parseInt(idTipo);
                    const filtradas = res.data.filter(h => h.idTipo === idTipoNum);
                    setHabitaciones(filtradas);
                }
            } catch (err) {
                console.error('Error al cargar habitaciones:', err);
                setError(err.message);
            } finally {
                setCargando(false);
            }
        };
        cargarHabitaciones();
    }, [idTipo]);

    const handleCardClick = (habitacion) => {
        navigate(`/habitaciones/${habitacion.idHabitacion}`);
    };

    if (cargandoTipos || cargando) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <p>Error al cargar habitaciones: {error}</p>
            </div>
        );
    }

    // Botón de volver reutilizable
    const botonVolver = (
        <button className="btn btn-ghost btn-sm mb-4 gap-2" onClick={() => navigate('/habitaciones')}>
            <ArrowLeft size={18} /> Volver
        </button>
    );

    if (idTipo === '0') {
        return (
            <div>
                {botonVolver}
                <div className="mb-10">
                    <div className="flex items-center gap-4 mb-2">
                        <BedDouble size={36} className="text-amber-600 dark:text-amber-400" />
                        <h2 className="text-3xl font-light text-base-content">Todas las habitaciones</h2>
                    </div>
                    <p className="text-base text-base-content/60">{habitaciones.length} habitación(es) en total</p>
                    <div className="mt-4 w-20 h-1 bg-amber-500/60"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {habitaciones.map(h => (
                        <HabitacionCard key={h.idHabitacion} habitacion={h} onCardClick={handleCardClick} />
                    ))}
                </div>
            </div>
        );
    }

    if (!tipoSeleccionado) {
        return (
            <div className="text-center py-16 text-base-content/70">
                Tipo de habitación no encontrado (id: {idTipo})
            </div>
        );
    }

    return (
        <div>
            {botonVolver}
            <div className="mb-10">
                <div className="flex items-center gap-4 mb-2">
                    <BedDouble size={36} className="text-amber-600 dark:text-amber-400" />
                    <h2 className="text-3xl font-light text-base-content">{tipoSeleccionado.nombre}</h2>
                </div>
                <p className="text-base text-base-content/60">{tipoSeleccionado.descripcion || 'Sin descripción'}</p>
                <div className="mt-4 w-20 h-1 bg-amber-500/60"></div>
                <p className="text-sm text-base-content/50 mt-4">
                    {habitaciones.length} habitación(es) de este tipo
                </p>
            </div>

            {habitaciones.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {habitaciones.map(h => (
                        <HabitacionCard
                            key={h.idHabitacion}
                            habitacion={h}
                            onCardClick={handleCardClick}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-base-content/50 italic">
                    No hay habitaciones de este tipo registradas.
                </div>
            )}
        </div>
    );
}