import { useState } from 'react';
import { useHotelData } from '../../contexts/HotelDataContext';
import TipoHabitacionCard from './TipoHabitacionCard';
import { Plus, BedDouble, X } from 'lucide-react';

export default function SelectorTipoHabitacion({ value, onChange }) {
    const { tiposHabitacion } = useHotelData();
    const [modalAbierto, setModalAbierto] = useState(false);

    const tipoSeleccionado = tiposHabitacion.find(t => t.idTipo === value);

    const seleccionarTipo = (tipo) => {
        onChange(tipo.idTipo);
        setModalAbierto(false);
    };

    return (
        <div>
            <label className="label">
                <span className="label-text font-medium text-base-content/70">Tipo de Habitación</span>
            </label>

            {/* Card que muestra el tipo actual o un placeholder */}
            <div
                className={`relative w-full rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300
                        ${tipoSeleccionado
                        ? 'border-amber-500/60 bg-amber-50/30 dark:bg-amber-900/10 hover:border-amber-500'
                        : 'border-base-300 hover:border-amber-400/60 bg-base-100 hover:bg-base-200 dark:hover:bg-base-800'
                    }`}
                onClick={() => setModalAbierto(true)}
            >
                {tipoSeleccionado ? (
                    <div className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                            <BedDouble size={24} className="text-amber-700 dark:text-amber-300" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-base-content">{tipoSeleccionado.nombre}</p>
                            <p className="text-sm text-base-content/60">{tipoSeleccionado.capacidad} pers.</p>
                        </div>
                        <span className="text-xs text-primary font-medium underline">Cambiar</span>
                    </div>
                ) : (
                    <div className="p-6 flex items-center justify-center gap-3">
                        <Plus size={24} className="text-base-content/40" />
                        <span className="text-base-content/50 font-medium">Seleccionar tipo de habitación</span>
                    </div>
                )}
            </div>

            {/* Modal con grid de tipos de habitación */}
            {modalAbierto && (
                <div className="modal modal-open modal-middle">
                    <div className="modal-box max-w-3xl bg-base-100 border border-base-200 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-base-content">Seleccionar tipo de habitación</h3>
                            <button
                                className="btn btn-ghost btn-sm btn-circle"
                                onClick={() => setModalAbierto(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {tiposHabitacion.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {tiposHabitacion.map(tipo => (
                                    <TipoHabitacionCard
                                        key={tipo.idTipo}
                                        tipo={tipo}
                                        onCardClick={() => seleccionarTipo(tipo)}
                                        selected={tipo.idTipo === value}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-base-content/60 italic">No hay tipos de habitación disponibles.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}