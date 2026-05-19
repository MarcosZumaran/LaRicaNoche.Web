import { z } from 'zod';

export const reservaSchema = z.object({
    idHabitacion: z.number({ required_error: 'Seleccioná una habitación' }),
    idCliente: z.number({ required_error: 'Debe seleccionar un cliente' }).nullable(),
    fechaEntradaPrevista: z.string().min(1, 'Fecha de entrada obligatoria'),
    fechaSalidaPrevista: z.string().min(1, 'Fecha de salida obligatoria'),
    metodoPago: z.string().min(1, 'Seleccioná un método de pago'),
    observaciones: z.string().optional(),
}).refine(data => {
    if (data.fechaEntradaPrevista && data.fechaSalidaPrevista) {
        return new Date(data.fechaSalidaPrevista) > new Date(data.fechaEntradaPrevista);
    }
    return true;
}, {
    message: 'La fecha de salida debe ser posterior a la de entrada',
    path: ['fechaSalidaPrevista'],
});