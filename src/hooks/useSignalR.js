import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

export default function useSignalR(onMessageReceived) {
    const connectionRef = useRef(null);

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`/hub/habitaciones`, {
                accessTokenFactory: () => localStorage.getItem('token')
            })
            .withAutomaticReconnect()
            .build();

        connection.on('EstadoHabitacionCambiado', (data) => {
            if (onMessageReceived) onMessageReceived(data);
        });

        connection.start()
            .then(() => console.log('🟢 SignalR conectado'))
            .catch(err => console.error('Error al conectar SignalR:', err));

        connectionRef.current = connection;

        return () => {
            if (connectionRef.current) {
                connectionRef.current.stop();
            }
        };
    }, []);

    return connectionRef;
}