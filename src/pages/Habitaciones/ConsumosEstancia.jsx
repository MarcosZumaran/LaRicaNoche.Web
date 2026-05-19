import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHotelData } from '../../contexts/HotelDataContext';
import api from '../../api/axios';
import swal from '../../lib/swal';
import LoadingButton from '../../components/ui/LoadingButton';
import {
    ArrowLeft, ShoppingCart, Plus, Edit, Trash2, CheckCircle, X
} from 'lucide-react';

export default function ConsumosEstancia() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { productos } = useHotelData();

    const [estancia, setEstancia] = useState(null);
    const [consumos, setConsumos] = useState([]);
    const [cargando, setCargando] = useState(true);

    const [productoSeleccionado, setProductoSeleccionado] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [agregando, setAgregando] = useState(false);

    const [idEditando, setIdEditando] = useState(null);
    const [editarCantidad, setEditarCantidad] = useState(1);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const habRes = await api.get('/Habitacion/estado-actual');
                const habitacion = habRes.data.find(h => h.idHabitacion === parseInt(id));
                if (!habitacion || !habitacion.idEstanciaActiva) {
                    throw new Error('No hay estancia activa en esta habitación');
                }

                const [estRes, consRes] = await Promise.all([
                    api.get(`/Estancia/${habitacion.idEstanciaActiva}`),
                    api.get(`/Estancia/${habitacion.idEstanciaActiva}/consumos`),
                ]);

                setEstancia(estRes.data);
                setConsumos(consRes.data);
            } catch (error) {
                swal.fire('Error', error.message || 'No se pudo cargar la información', 'error');
                navigate(`/habitaciones/${id}`);
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();
    }, [id, navigate]);

    const agregarConsumo = async () => {
        if (!productoSeleccionado || cantidad < 1) {
            swal.fire('Atención', 'Seleccioná un producto y una cantidad válida', 'warning');
            return;
        }

        setAgregando(true);
        try {
            await api.post(`/Estancia/${estancia.idEstancia}/consumo`, {
                idProducto: parseInt(productoSeleccionado),
                cantidad,
            });

            const res = await api.get(`/Estancia/${estancia.idEstancia}/consumos`);
            setConsumos(res.data);
            setProductoSeleccionado('');
            setCantidad(1);
            swal.fire('Agregado', 'Consumo registrado exitosamente', 'success');
        } catch (error) {
            swal.fire('Error', error.response?.data?.mensaje || 'Error al registrar el consumo', 'error');
        } finally {
            setAgregando(false);
        }
    };

    const actualizarConsumo = async (idItem, nuevaCantidad) => {
        if (nuevaCantidad < 1) return;
        try {
            await api.put(`/Estancia/${estancia.idEstancia}/consumo/${idItem}`, {
                cantidad: nuevaCantidad,
            });
            const res = await api.get(`/Estancia/${estancia.idEstancia}/consumos`);
            setConsumos(res.data);
            setIdEditando(null);
            swal.fire('Actualizado', 'Cantidad modificada', 'success');
        } catch (error) {
            swal.fire('Error', error.response?.data?.mensaje || 'Error al actualizar', 'error');
        }
    };

    const eliminarConsumo = async (idItem) => {
        const confirmacion = await swal.fire({
            title: 'Eliminar consumo',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });
        if (!confirmacion.isConfirmed) return;

        try {
            await api.delete(`/Estancia/${estancia.idEstancia}/consumo/${idItem}`);
            const res = await api.get(`/Estancia/${estancia.idEstancia}/consumos`);
            setConsumos(res.data);
            swal.fire('Eliminado', 'El consumo fue eliminado', 'success');
        } catch (error) {
            swal.fire('Error', error.response?.data?.mensaje || 'Error al eliminar', 'error');
        }
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (!estancia) return null;

    return (
        <div className="max-w-3xl mx-auto">
            <button
                className="btn btn-ghost btn-sm mb-4 gap-2"
                onClick={() => navigate(`/habitaciones/${id}`)}   // ← Vuelve al detalle
            >
                <ArrowLeft size={18} /> Volver
            </button>

            <div className="mb-10">
                <h2 className="text-3xl font-light text-base-content flex items-center gap-3">
                    <ShoppingCart size={32} className="text-amber-600" />
                    Consumos
                </h2>
                <p className="text-base text-base-content/60 mt-2">
                    Habitación {id} · {estancia.clienteNombreCompleto}
                </p>
                <div className="mt-4 w-20 h-1 bg-amber-500/60"></div>
            </div>

            <div className="card bg-white border border-base-300 shadow-sm mb-8">
                <div className="card-body p-6">
                    <h4 className="card-title text-base font-medium mb-4">Agregar producto</h4>
                    <div className="flex gap-3 items-end">
                        <div className="form-control flex-1">
                            <label className="label py-1">
                                <span className="label-text text-xs font-medium">Producto</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={productoSeleccionado}
                                onChange={(e) => setProductoSeleccionado(e.target.value)}
                            >
                                <option value="">Seleccionar producto</option>
                                {productos.map((p) => (
                                    <option key={p.idProducto} value={p.idProducto}>
                                        {p.nombre} — S/ {p.precioUnitario?.toFixed(2)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-control w-28">
                            <label className="label py-1">
                                <span className="label-text text-xs font-medium">Cantidad</span>
                            </label>
                            <input
                                type="number"
                                className="input input-bordered w-full"
                                min="1"
                                value={cantidad}
                                onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                            />
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={agregarConsumo}
                            disabled={agregando}
                        >
                            {agregando ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                <Plus size={20} />
                            )}
                            Agregar
                        </button>
                    </div>
                </div>
            </div>

            <div className="card bg-white border border-base-300 shadow-sm">
                <div className="card-body p-6">
                    <h4 className="card-title text-base font-medium mb-4">Consumos registrados</h4>

                    {consumos.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th className="text-center">Cantidad</th>
                                        <th className="text-right">Precio Unit.</th>
                                        <th className="text-right">Subtotal</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {consumos.map((c) => (
                                        <tr key={c.idItem}>
                                            <td className="font-medium">{c.nombreProducto}</td>
                                            <td className="text-center">
                                                {idEditando === c.idItem ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <input
                                                            type="number"
                                                            className="input input-bordered input-sm w-20 text-center"
                                                            value={editarCantidad}
                                                            min="1"
                                                            onChange={(e) => setEditarCantidad(parseInt(e.target.value) || 1)}
                                                        />
                                                        <button
                                                            className="btn btn-ghost btn-xs text-success"
                                                            onClick={() => actualizarConsumo(c.idItem, editarCantidad)}
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                        <button
                                                            className="btn btn-ghost btn-xs"
                                                            onClick={() => setIdEditando(null)}
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    c.cantidad
                                                )}
                                            </td>
                                            <td className="text-right">S/ {c.precioUnitario?.toFixed(2)}</td>
                                            <td className="text-right font-semibold">S/ {c.subtotal?.toFixed(2)}</td>
                                            <td className="text-center">
                                                {idEditando !== c.idItem && (
                                                    <div className="flex justify-center gap-1">
                                                        <button
                                                            className="btn btn-ghost btn-xs"
                                                            onClick={() => {
                                                                setIdEditando(c.idItem);
                                                                setEditarCantidad(c.cantidad);
                                                            }}
                                                            title="Editar"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            className="btn btn-ghost btn-xs text-error"
                                                            onClick={() => eliminarConsumo(c.idItem)}
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="text-right mt-4 text-lg font-semibold text-base-content">
                                Total consumos: S/ {consumos.reduce((sum, c) => sum + (c.subtotal || 0), 0).toFixed(2)}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-base-content/50 italic py-8">
                            No hay consumos registrados para esta estancia.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}