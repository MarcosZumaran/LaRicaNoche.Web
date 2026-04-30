import { z } from 'zod';

export const habitacionSchema = z.object({
    numeroHabitacion: z.string().min(1, 'El número de habitación es obligatorio'),
    piso: z.preprocess(
        (val) => (val === '' ? null : Number(val)),
        z.number().int().nullable()
    ),
    descripcion: z.string().nullable().optional(),
    idTipo: z.preprocess(
        (val) => Number(val),
        z.number().int().min(1, 'Seleccioná un tipo de habitación')
    ),
    precioNoche: z.preprocess(
        (val) => Number(val),
        z.number().min(0.01, 'El precio debe ser mayor a 0')
    ),
});