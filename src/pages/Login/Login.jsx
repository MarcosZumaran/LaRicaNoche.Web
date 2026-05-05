import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loginSchema, setupSchema } from './loginSchema';
import swal from '../../lib/swal';
import LoadingButton from '../../components/ui/LoadingButton';
import api from '../../api/axios';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [nombreHotel, setNombreHotel] = useState('Hotel');
  const [requiereSetup, setRequiereSetup] = useState(false);
  const [setupCargando, setSetupCargando] = useState(true);

  // Formulario de login (existente)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Formulario de setup con confirmación de contraseña
  const {
    register: registerSetup,
    handleSubmit: handleSubmitSetup,
    formState: { errors: errorsSetup, isSubmitting: isSubmittingSetup },
  } = useForm({
    resolver: zodResolver(setupSchema),
  });

  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const [configRes, setupRes] = await Promise.all([
          api.get('/ConfiguracionHotel'),
          api.get('/Setup/estado'),
        ]);
        setNombreHotel(configRes.data.nombre);
        setRequiereSetup(setupRes.data.requiereInicializacion);
      } catch (error) {
        console.error('Error al cargar configuración o estado del sistema', error);
      } finally {
        setSetupCargando(false);
      }
    };
    cargarConfiguracion();
  }, []);

  const onSubmitLogin = async (data, event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const usuario = await login(data.username, data.password);

      swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        showConfirmButton: false,
        timer: 1500,
      });

      if (usuario.nombreRol === 'Limpieza') {
        navigate('/habitaciones');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      const mensaje =
        error.response?.status === 401
          ? 'Usuario o contraseña incorrectos'
          : 'Error al conectar con el servidor';
      swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitSetup = async (data) => {
    try {
      await api.post('/Setup/crear-admin', {
        username: data.username,
        password: data.password,
        idRol: 1,
      });
      swal.fire({
        icon: 'success',
        title: 'Sistema inicializado',
        text: 'Usuario administrador creado exitosamente. Ya podés iniciar sesión.',
        confirmButtonText: 'Entendido',
      });
      setRequiereSetup(false);
    } catch (error) {
      const mensaje = error.response?.data?.mensaje || 'Error al crear el administrador';
      swal.fire({
        icon: 'error',
        title: 'Error de inicialización',
        text: mensaje,
      });
    }
  };

  if (setupCargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Pantalla de setup (primer inicio)
  if (requiereSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card w-full max-w-sm bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="text-3xl font-bold text-center mb-2">{nombreHotel}</h1>
            <p className="text-center text-sm text-gray-500 mb-6">
              Cree el usuario administrador
            </p>

            <form onSubmit={handleSubmitSetup(onSubmitSetup)} noValidate>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Nombre de Usuario administrador</span>
                </label>
                <input
                  type="text"
                  placeholder="Nombre de usuario administrador"
                  className={`input input-bordered ${errorsSetup.username ? 'input-error' : ''}`}
                  {...registerSetup('username')}
                  autoFocus
                />
                {errorsSetup.username && (
                  <span className="label-text-alt text-error mt-1">
                    {errorsSetup.username.message}
                  </span>
                )}
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Contraseña</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`input input-bordered ${errorsSetup.password ? 'input-error' : ''}`}
                  {...registerSetup('password')}
                />
                {errorsSetup.password && (
                  <span className="label-text-alt text-error mt-1">
                    {errorsSetup.password.message}
                  </span>
                )}
              </div>

              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text">Confirmar Contraseña</span>
                </label>
                <input
                  type="password"
                  placeholder="Repetí la contraseña"
                  className={`input input-bordered ${errorsSetup.confirmarPassword ? 'input-error' : ''}`}
                  {...registerSetup('confirmarPassword')}
                />
                {errorsSetup.confirmarPassword && (
                  <span className="label-text-alt text-error mt-1">
                    {errorsSetup.confirmarPassword.message}
                  </span>
                )}
              </div>

              <LoadingButton
                type="submit"
                isLoading={isSubmittingSetup}
                className="w-full mt-4"
              >
                Crear administrador
              </LoadingButton>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de login normal
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="text-3xl font-bold text-center mb-2">{nombreHotel}</h1>
          <p className="text-center text-sm text-gray-500 mb-6">
            Inicia sesión para continuar
          </p>

          <form onSubmit={handleSubmit(onSubmitLogin)} noValidate>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Usuario</span>
              </label>
              <input
                type="text"
                placeholder="Nombre de usuario"
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

            <LoadingButton
              type="submit"
              isLoading={isLoading}
              className="w-full"
            >
              Entrar
            </LoadingButton>
          </form>
        </div>
      </div>
    </div>
  );
}