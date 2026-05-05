import { z } from 'zod';

export const loginSchema = z.object({
    username: z.string().min(1, 'El usuario es obligatorio'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const setupSchema = z.object({
    username: z.string().min(1, 'El usuario es obligatorio'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmarPassword: z.string().min(1, 'Debe confirmar la contraseña'),
}).refine((data) => data.password === data.confirmarPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarPassword'],
});