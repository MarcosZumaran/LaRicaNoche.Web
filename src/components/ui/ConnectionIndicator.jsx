import { useSignalR } from '../../hooks/useSignalR';
import { Wifi, WifiOff } from 'lucide-react';

export default function ConnectionIndicator() {
  const { isConnected } = useSignalR('EstadoHabitacionCambiado', () => {});

  return (
    <div className="flex items-center gap-1 text-xs">
      {isConnected ? (
        <Wifi size={16} className="text-success" />
      ) : (
        <WifiOff size={16} className="text-error" />
      )}
      <span className="hidden sm:inline">
        {isConnected ? 'En Linea' : 'Desconectado'}
      </span>
    </div>
  );
}