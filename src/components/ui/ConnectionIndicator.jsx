import { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

const isDevelopment = import.meta.env.DEV;

export function useSignalR(eventName, callback) {
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Configurar opciones. En desarrollo forzamos Long Polling.
    const options = { withCredentials: true };
    if (isDevelopment) {
      options.transport = signalR.HttpTransportType.LongPolling;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hotelhub', options)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    const handler = (data) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    connection.on(eventName, handler);

    connection.start()
      .then(() => setIsConnected(true))
      .catch(err => console.error('SignalR connection error:', err));

    connection.onreconnecting(() => setIsConnected(false));
    connection.onreconnected(() => setIsConnected(true));
    connection.onclose(() => setIsConnected(false));

    return () => {
      connection.off(eventName, handler);
      connection.stop();
    };
  }, [eventName]);

  return { isConnected };
}

export default useSignalR;