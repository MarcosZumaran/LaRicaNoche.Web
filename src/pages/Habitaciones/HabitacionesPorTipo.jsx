import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useHotelData } from '../../contexts/HotelDataContext';
import api from '../../api/axios';
import HabitacionCard from '../../components/ui/HabitacionCard';
import { BedDouble } from 'lucide-react';

export default function HabitacionesPorTipo() {
    const { idTipo } = useParams();
    const { tiposHabitacion, cargando: cargandoTipos } = useHotelData();

    const [habitaciones, setHabitaciones] = useState([]);
    const [cargando, setCargando] = useState(true);

    const tipoSeleccionado = tiposHabitacion.find(t => t.idTipo === parseInt(idTipo));

    useEffect(() => {
        const cargarHabitaciones = async () => {
            try {
                const res = await api.get('/Habitacion/estado-actual');
                if (idTipo === '0') {
                    setHabitaciones(res.data);
                } else {
                    const filtradas = res.data.filter(h => h.idTipo === parseInt(idTipo));
                    setHabitaciones(filtradas);
                }
            } catch (error) {
                console.error('Error al cargar habitaciones del tipo', error);
            } finally {
                setCargando(false);
            }
        };
        cargarHabitaciones();
    }, [idTipo]);

    const handleCardClick = (habitacion) => {
        window.location.href = `/habitaciones/${habitacion.idHabitacion}`;
    };

    if (cargandoTipos || cargando) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    // Si idTipo es 0, mostramos "Todas las habitaciones"
    if (idTipo === '0') {
        return (
            <div>
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
                Tipo de habitación no encontrado.
            </div>
        );
    }

    return (
        <div>
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