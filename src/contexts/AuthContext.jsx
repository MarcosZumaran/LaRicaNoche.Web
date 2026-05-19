import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Comienza cargando mientras verifica sesión

    // Al montar el componente, intenta recuperar la sesión con /me
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await api.get('/Usuario/me');
                setUser(res.data);
            } catch (error) {
                // No autenticado o token inválido/expirado - sin usuario
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (username, password) => {
        const res = await api.post('/Usuario/login', { username, password });
        const usuario = res.data; // Solo recibimos el objeto usuario (sin token)
        setUser(usuario);
        return usuario; // Para que el Login pueda redirigir según el rol
    };

    const logout = async () => {
        try {
            await api.post('/Usuario/logout');
        } catch (error) {
            // Si falla, limpiamos igual
        }
        setUser(null);
    };

    // Efecto para detectar errores 401 globales y cerrar sesión
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    setUser(null);
                }
                return Promise.reject(error);
            }
        );

        // Cleanup del interceptor
        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, []);

    // Escucha eventos personalizados de cierre de sesión
    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return context;
}