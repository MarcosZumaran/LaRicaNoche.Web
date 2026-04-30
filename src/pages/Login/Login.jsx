import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loginSchema } from './loginSchema';
import Swal from 'sweetalert2';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        showConfirmButton: false,
        timer: 1500,
      });
      navigate('/dashboard');
    } catch (error) {
      const mensaje =
        error.response?.status === 401
          ? 'Usuario o contraseña incorrectos'
          : 'Error al conectar con el servidor';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="text-3xl font-bold text-center mb-2">La Rica Noche</h1>
          <p className="text-center text-sm text-gray-500 mb-6">
            Inicia sesión para continuar
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Username */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Usuario</span>
              </label>
              <input
                type="text"
                placeholder="marcosz"
                className={`input input-bordered ${errors.username ? 'input-error' : ''}`}
                {...register('username')}
                autoFocus
              />
              {errors.username && (
                <span className="label-text-alt text-error mt-1">
                  {errors.username.message}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text">Contraseña</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
                {...register('password')}
              />
              {errors.password && (
                <span className="label-text-alt text-error mt-1">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}