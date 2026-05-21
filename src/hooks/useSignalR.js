import { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

// Singleton: una única conexión compartida para toda la app
let sharedConnection = null;
let sharedConnectionPromise = null;

function getOrCreateConnection() {
  if (!sharedConnection) {
    sharedConnection = new signalR.HubConnectionBuilder()
      .withUrl('/hotelhub', { withCredentials: true })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    sharedConnectionPromise = sharedConnection.start()
      .catch(err => console.error('SignalR global connection error:', err));
  }
  return sharedConnection;
}

export function useSignalR(eventName, callback) {
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const connection = getOrCreateConnection();

    // Si la conexión ya está lista, actualizamos el estado de una vez
    if (connection.state === signalR.HubConnectionState.Connected) {
      setIsConnected(true);
    } else {
      sharedConnectionPromise?.then(() => setIsConnected(true)).catch(() => { });
    }

    const handler = (data) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    connection.on(eventName, handler);

    const onReconnecting = () => setIsConnected(false);
    const onReconnected = () => setIsConnected(true);
    const onClose = () => setIsConnected(false);

    connection.onreconnecting(onReconnecting);
    connection.onreconnected(onReconnected);
    connection.onclose(onClose);

    return () => {
      connection.off(eventName, handler);
      connection.onreconnecting(onReconnecting);
      connection.onreconnected(onReconnected);
      connection.onclose(onClose);
    };
  }, [eventName]);

  return { isConnected };
}

export default useSignalR;