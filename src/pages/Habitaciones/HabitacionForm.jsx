import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useHotelData } from '../../contexts/HotelDataContext';
import api from '../../api/axios';
import swal from '../../lib/swal';
import LoadingButton from '../../components/ui/LoadingButton';
import SelectorTipoHabitacion from '../../components/ui/SelectorTipoHabitacion';
import { habitacionSchema } from './habitacionSchema';

export default function HabitacionForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { tiposHabitacion } = useHotelData();

    const [cargandoInicial, setCargandoInicial] = useState(!!id);
    const [cargandoAccion, setCargandoAccion] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        watch,
    } = useForm({
        resolver: zodResolver(habitacionSchema),
        defaultValues: {
            numeroHabitacion: '',
            piso: '',
            descripcion: '',
            idTipo: '',
            precioNoche: '',
        },
    });

    const idTipoActual = watch('idTipo');

    useEffect(() => {
        if (!id) return;

        const cargarHabitacion = async () => {
            try {
                const res = await api.get(`/Habitacion/${id}`);
                const hab = res.data;
                setValue('numeroHabitacion', hab.numeroHabitacion);
                setValue('piso', hab.piso ?? '');
                setValue('descripcion', hab.descripcion ?? '');
                setValue('idTipo', hab.idTipo);
                setValue('precioNoche', hab.precioNoche);
            } catch (error) {
                swal.fire('Error', 'No se pudo cargar la información de la habitación', 'error');
                navigate('/habitaciones');
            } finally {
                setCargandoInicial(false);
            }
        };

        cargarHabitacion();
    }, [id, setValue, navigate]);

    const onSubmit = async (data) => {
        setCargandoAccion(true);
        try {
            const payload = {
                ...data,
                piso: data.piso || null,
                descripcion: data.descripcion || null,
                idTipo: parseInt(data.idTipo),
                precioNoche: parseFloat(data.precioNoche),
            };

            if (id) {
                await api.patch(`/Habitacion/${id}`, payload);
                swal.fire('Actualizada', 'Habitación actualizada correctamente', 'success');
                navigate(`/habitaciones/${id}`);
            } else {
                const res = await api.post('/Habitacion', payload);
                swal.fire('Creada', 'Habitación creada correctamente', 'success');
                navigate(`/habitaciones/${res.data.idHabitacion}`);
            }
        } catch (error) {
            swal.fire('Error', error.response?.data?.mensaje || 'Error al guardar la habitación', 'error');
        } finally {
            setCargandoAccion(false);
        }
    };

    if (cargandoInicial) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-10">
                <h2 className="text-3xl font-light text-base-content">
                    {id ? 'Editar Habitación' : 'Nueva Habitación'}
                </h2>
                <p className="text-base text-base-content/60 mt-2">
                    {id ? 'Modifica los datos de la habitación' : 'Registra una nueva habitación en el sistema'}
                </p>
                <div className="mt-4 w-20 h-1 bg-amber-500/60"></div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-medium text-base-content/70">Número de Habitación</span>
                    </label>
                    <input
                        type="text"
                        className={`input input-bordered w-full ${errors.numeroHabitacion ? 'input-error' : ''}`}
                        placeholder="Ej: 101"
                        {...register('numeroHabitacion')}
                    />
                    {errors.numeroHabitacion && (
                        <span className="label-text-alt text-error mt-1">{errors.numeroHabitacion.message}</span>
                    )}
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-medium text-base-content/70">Piso</span>
                    </label>
                    <input
                        type="number"
                        className={`input input-bordered w-full ${errors.piso ? 'input-error' : ''}`}
                        placeholder="Ej: 1"
                        {...register('piso')}
                    />
                    {errors.piso && (
                        <span className="label-text-alt text-error mt-1">{errors.piso.message}</span>
                    )}
                </div>
                <div className="form-control">
                    <SelectorTipoHabitacion
                        value={idTipoActual ? parseInt(idTipoActual) : null}
                        onChange={(newIdTipo) => setValue('idTipo', String(newIdTipo))}
                    />
                    {errors.idTipo && (
                        <span className="label-text-alt text-error mt-1">{errors.idTipo.message}</span>
                    )}
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-medium text-base-content/70">Precio por Noche (S/)</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        className={`input input-bordered w-full ${errors.precioNoche ? 'input-error' : ''}`}
                        placeholder="0.00"
                        {...register('precioNoche')}
                    />
                    {errors.precioNoche && (
                        <span className="label-text-alt text-error mt-1">{errors.precioNoche.message}</span>
                    )}
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-medium text-base-content/70">Descripción</span>
                    </label>
                    <textarea
                        className="textarea textarea-bordered w-full"
                        rows={3}
                        placeholder="Descripción opcional..."
                        {...register('descripcion')}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => navigate('/habitaciones')}   // ← Vuelve a la lista de tipos
                    >
                        Cancelar
                    </button>
                    <LoadingButton
                        type="submit"
                        isLoading={isSubmitting || cargandoAccion}
                        className="btn-primary"
                    >
                        {id ? 'Actualizar Habitación' : 'Crear Habitación'}
                    </LoadingButton>
                </div>
            </form>
        </div>
    );
}