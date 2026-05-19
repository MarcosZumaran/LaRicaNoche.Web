import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useHotelData } from '../../contexts/HotelDataContext';
import api from '../../api/axios';
import swal from '../../lib/swal';
import LoadingButton from '../../components/ui/LoadingButton';
import { consultarDni } from '../../api/verifica_pe';
import {
    ArrowLeft, CalendarDays, Search, CheckCircle, UserPlus
} from 'lucide-react';

export default function ReservaForm() {
    const { id } = useParams(); // id de la habitación
    const navigate = useNavigate();
    const { user } = useAuth();
    const { configuracionHotel } = useHotelData();

    const [habitacion, setHabitacion] = useState(null);
    const [cargandoHabitacion, setCargandoHabitacion] = useState(true);
    const [cargandoAccion, setCargandoAccion] = useState(false);

    // Datos del formulario
    const [tipoDocumento, setTipoDocumento] = useState('1');
    const [documento, setDocumento] = useState('');
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [telefono, setTelefono] = useState('');
    const [fechaEntrada, setFechaEntrada] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [fechaSalida, setFechaSalida] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [metodoPago, setMetodoPago] = useState('005');
    const [usarClienteAnonimo, setUsarClienteAnonimo] = useState(false);

    // Búsqueda de cliente
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [clienteEncontrado, setClienteEncontrado] = useState(null);

    // Consulta DNI
    const [consultandoDni, setConsultandoDni] = useState(false);

    useEffect(() => {
        const cargarHabitacion = async () => {
            try {
                const res = await api.get('/Habitacion/estado-actual');
                const hab = res.data.find(h => h.idHabitacion === parseInt(id));
                if (!hab) throw new Error('Habitación no encontrada');
                setHabitacion(hab);
            } catch (error) {
                swal.fire('Error', 'No se pudo cargar la información de la habitación', 'error');
                navigate('/habitaciones');
            } finally {
                setCargandoHabitacion(false);
            }
        };
        cargarHabitacion();
    }, [id, navigate]);

    // Efecto: si cambian datos del formulario manual, limpiar cliente encontrado
    useEffect(() => {
        setClienteEncontrado(null);
    }, [documento, nombres, apellidos]);

    const buscarClientes = async (termino) => {
        setBusquedaCliente(termino);
        if (termino.length < 2) {
            setResultadosBusqueda([]);
            return;
        }
        try {
            const res = await api.get('/Cliente/buscar', { params: { termino } });
            setResultadosBusqueda(res.data.slice(0, 5));
        } catch {
            setResultadosBusqueda([]);
        }
    };

    const seleccionarCliente = (cliente) => {
        setClienteEncontrado(cliente);
        setTipoDocumento(cliente.tipoDocumento);
        setDocumento(cliente.documento);
        setNombres(cliente.nombres);
        setApellidos(cliente.apellidos);
        setTelefono(cliente.telefono ?? '');
        setResultadosBusqueda([]);
        setBusquedaCliente('');
    };

    const verificarDni = async () => {
        if (!documento || documento.length !== 8) return;
        setConsultandoDni(true);
        try {
            const data = await consultarDni(documento);
            setNombres(data.names);
            setApellidos(`${data.paternalSurname} ${data.maternalSurname}`);
            swal.fire('DNI verificado', 'Datos obtenidos correctamente', 'success');
        } catch (error) {
            swal.fire('Error', 'No se pudo verificar el DNI', 'error');
        } finally {
            setConsultandoDni(false);
        }
    };

    const crearReserva = async () => {
        if (!usarClienteAnonimo && !clienteEncontrado && (!documento || !nombres)) {
            swal.fire('Atención', 'Debe seleccionar un cliente o completar los datos', 'warning');
            return;
        }

        setCargandoAccion(true);
        try {
            const payload = {
                idHabitacion: parseInt(id),
                tipoDocumento,
                documento,
                nombres,
                apellidos,
                telefono,
                fechaEntradaPrevista: fechaEntrada,
                fechaSalidaPrevista: fechaSalida,
                metodoPago,
                usarClienteAnonimo,
                guardarCliente: !!(usarClienteAnonimo || (!clienteEncontrado && (documento || nombres))),
                idClienteExistente: clienteEncontrado?.idCliente || null,
            };

            const res = await api.post('/Estancia/reserva', payload);
            swal.fire({
                icon: 'success',
                title: '¡Reserva creada!',
                html: `
          <p>Reserva N° <strong>${res.data.idReserva}</strong></p>
          <p>Entrada prevista: <strong>${new Date(fechaEntrada).toLocaleDateString('es-PE')}</strong></p>
          <p>Salida prevista: <strong>${new Date(fechaSalida).toLocaleDateString('es-PE')}</strong></p>
          <p>Monto: <strong>S/ ${res.data.montoTotal?.toFixed(2)}</strong></p>
        `,
                confirmButtonText: 'Aceptar',
            });
            navigate(`/habitaciones/${id}`);
        } catch (error) {
            swal.fire('Error', error.response?.data?.mensaje || 'Error al crear la reserva', 'error');
        } finally {
            setCargandoAccion(false);
        }
    };

    if (cargandoHabitacion) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (!habitacion) return null;

    return (
        <div className="max-w-3xl mx-auto">
            <button className="btn btn-ghost btn-sm mb-4 gap-2" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> Volver
            </button>

            <div className="mb-10">
                <h2 className="text-3xl font-light text-base-content flex items-center gap-3">
                    <CalendarDays size={32} className="text-amber-600" />
                    Nueva Reserva
                </h2>
                <p className="text-base text-base-content/60 mt-2">
                    Hab. {habitacion.numeroHabitacion} · {habitacion.nombreTipo}
                </p>
                <div className="mt-4 w-20 h-1 bg-amber-500/60"></div>
            </div>

            {/* Buscador de clientes */}
            <div className="card bg-white border border-base-300 shadow-sm mb-6">
                <div className="card-body p-6">
                    <h4 className="card-title text-base font-medium mb-3">Cliente</h4>

                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-base-content/40" />
                        <input
                            type="text"
                            placeholder="Buscar cliente por nombre, apellido o DNI..."
                            className="input input-bordered w-full pl-10"
                            value={busquedaCliente}
                            onChange={(e) => buscarClientes(e.target.value)}
                        />
                        {resultadosBusqueda.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full card bg-base-100 border shadow-md max-h-40 overflow-y-auto">
                                {resultadosBusqueda.map(cliente => (
                                    <div
                                        key={cliente.idCliente}
                                        className="p-2 hover:bg-base-200 cursor-pointer flex items-center gap-2"
                                        onClick={() => seleccionarCliente(cliente)}
                                    >
                                        <UserPlus size={16} className="text-primary" />
                                        <div>
                                            <p className="font-medium">{cliente.nombres} {cliente.apellidos}</p>
                                            <p className="text-xs text-base-content/60">
                                                {cliente.tipoDocumento === '1' ? 'DNI' : 'PAS'}: {cliente.documento}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {clienteEncontrado && (
                        <div className="alert alert-success mb-4">
                            <UserPlus size={20} />
                            <span>{clienteEncontrado.nombres} {clienteEncontrado.apellidos} — {clienteEncontrado.documento}</span>
                        </div>
                    )}

                    {!clienteEncontrado && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label py-1"><span className="label-text text-xs">Tipo Documento</span></label>
                                <select className="select select-bordered" value={tipoDocumento} onChange={e => setTipoDocumento(e.target.value)}>
                                    <option value="1">DNI</option>
                                    <option value="7">Pasaporte</option>
                                    <option value="0">Otros</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label py-1"><span className="label-text text-xs">Número</span></label>
                                <div className="flex gap-2">
                                    <input
                                        className="input input-bordered flex-1"
                                        value={documento}
                                        onChange={e => setDocumento(e.target.value)}
                                    />
                                    {tipoDocumento === '1' && documento.length === 8 && (
                                        <button className="btn btn-outline btn-primary" onClick={verificarDni} disabled={consultandoDni}>
                                            {consultandoDni ? <span className="loading loading-spinner loading-xs"></span> : <CheckCircle size={18} />}
                                            DNI
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="form-control">
                                <label className="label py-1"><span className="label-text text-xs">Nombres</span></label>
                                <input className="input input-bordered" value={nombres} onChange={e => setNombres(e.target.value)} />
                            </div>
                            <div className="form-control">
                                <label className="label py-1"><span className="label-text text-xs">Apellidos</span></label>
                                <input className="input input-bordered" value={apellidos} onChange={e => setApellidos(e.target.value)} />
                            </div>
                            <div className="form-control">
                                <label className="label py-1"><span className="label-text text-xs">Teléfono</span></label>
                                <input className="input input-bordered" value={telefono} onChange={e => setTelefono(e.target.value)} />
                            </div>
                        </div>
                    )}

                    <label className="label cursor-pointer mt-4">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={usarClienteAnonimo}
                            onChange={e => setUsarClienteAnonimo(e.target.checked)}
                        />
                        <span className="ml-2 text-sm">Cliente anónimo (≤ S/700)</span>
                    </label>
                </div>
            </div>

            {/* Fechas y método de pago */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="card bg-white border border-base-300 shadow-sm">
                    <div className="card-body p-4">
                        <h4 className="card-title text-base font-medium mb-2">Entrada</h4>
                        <DayPicker
                            mode="single"
                            selected={fechaEntrada ? new Date(fechaEntrada + 'T00:00:00') : undefined}
                            onSelect={(date) => setFechaEntrada(date ? format(date, 'yyyy-MM-dd') : '')}
                            captionLayout="dropdown"
                            startMonth={new Date()}
                            endMonth={new Date(2100, 11)}
                            className="bg-base-100 p-2 rounded-lg shadow-sm border border-base-300"
                        />
                    </div>
                </div>
                <div className="card bg-white border border-base-300 shadow-sm">
                    <div className="card-body p-4">
                        <h4 className="card-title text-base font-medium mb-2">Salida</h4>
                        <DayPicker
                            mode="single"
                            selected={fechaSalida ? new Date(fechaSalida + 'T00:00:00') : undefined}
                            onSelect={(date) => setFechaSalida(date ? format(date, 'yyyy-MM-dd') : '')}
                            captionLayout="dropdown"
                            startMonth={new Date()}
                            endMonth={new Date(2100, 11)}
                            className="bg-base-100 p-2 rounded-lg shadow-sm border border-base-300"
                        />
                    </div>
                </div>
                <div className="card bg-white border border-base-300 shadow-sm">
                    <div className="card-body p-4">
                        <h4 className="card-title text-base font-medium mb-2">Pago</h4>
                        <select className="select select-bordered w-full" value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
                            <option value="005">Efectivo</option>
                            <option value="006">Tarjeta</option>
                            <option value="008">Yape/Plin</option>
                        </select>
                        <p className="text-sm text-base-content/60 mt-4">
                            Precio por noche: <strong>S/ {habitacion.precioNoche?.toFixed(2)}</strong>
                        </p>
                    </div>
                </div>
            </div>

            {/* Acciones finales */}
            <div className="flex justify-end gap-3">
                <button className="btn btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
                <LoadingButton
                    type="button"
                    isLoading={cargandoAccion}
                    onClick={crearReserva}
                    className="btn-primary"
                >
                    Crear Reserva
                </LoadingButton>
            </div>
        </div>
    );
}