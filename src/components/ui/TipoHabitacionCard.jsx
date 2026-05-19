import { BedDouble, Users, Check } from 'lucide-react';

export default function TipoHabitacionCard({ tipo, onCardClick, selected = false }) {
    const handleClick = () => {
        if (onCardClick) onCardClick(tipo);
    };

    return (
        <div
            className={`relative card bg-white border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden
        ${selected ? 'border-amber-500 ring-2 ring-amber-300' : 'border-base-300 hover:-translate-y-1'}`}
            onClick={handleClick}
        >
            {/* Check de selección */}
            {selected && (
                <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white rounded-full p-1">
                    <Check size={16} />
                </div>
            )}

            {/* Imagen decorativa */}
            <div className="h-32 bg-gradient-to-br from-amber-50 to-amber-200 dark:from-amber-900/20 dark:to-amber-800/20 flex items-center justify-center">
                <BedDouble size={48} className="text-amber-700/60 dark:text-amber-300/60" />
            </div>

            <div className="card-body p-5">
                <h3 className="card-title text-lg font-light text-base-content">{tipo.nombre}</h3>
                <p className="text-sm text-base-content/60">{tipo.descripcion || 'Sin descripción'}</p>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 text-sm text-base-content/70">
                        <Users size={16} />
                        <span>{tipo.capacidad || 2} pers.</span>
                    </div>
                    <div className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                        S/ {tipo.precioBase?.toFixed(2) || '0.00'}
                    </div>
                </div>

                {!onCardClick && (
                    <div className="mt-3 text-xs text-primary font-medium uppercase tracking-wide flex items-center gap-1">
                        Ver habitaciones <span className="text-base">→</span>
                    </div>
                )}
            </div>
        </div>
    );
}