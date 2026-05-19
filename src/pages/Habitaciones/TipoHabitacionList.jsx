import { useHotelData } from '../../contexts/HotelDataContext';
import TipoHabitacionCard from '../../components/ui/TipoHabitacionCard';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function TipoHabitacionList() {
    const { tiposHabitacion, cargando } = useHotelData();

    if (cargando) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-10">
                <h2 className="text-3xl font-light text-base-content">Habitaciones</h2>
                <p className="text-base text-base-content/60 mt-2">Selecciona un tipo de habitación para gestionar</p>
                <div className="mt-4 w-20 h-1 bg-amber-500/60"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tiposHabitacion.map(tipo => (
                    <TipoHabitacionCard key={tipo.idTipo} tipo={tipo} />
                ))}

                <Link
                    to="/habitaciones/tipo/0"
                    className="card border-2 border-dashed border-base-300 hover:border-amber-500/60 hover:shadow-lg transition-all duration-300 flex items-center justify-center p-10 group"
                >
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-base-200 flex items-center justify-center mb-4 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                            <ArrowRight size={28} className="text-base-content/50 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
                        </div>
                        <h3 className="text-lg font-medium text-base-content/70 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                            Ver todas las habitaciones
                        </h3>
                    </div>
                </Link>
            </div>
        </div>
    );
}