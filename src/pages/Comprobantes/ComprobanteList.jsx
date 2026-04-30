import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { Receipt, Eye, SendHorizontal } from 'lucide-react';
import swal from '../../lib/swal';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

const columnHelper = createColumnHelper();

export default function ComprobanteList() {
  const { user } = useAuth();
  const esAdmin = user?.nombreRol === 'Administrador';

  const [comprobantes, setComprobantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviandoId, setEnviandoId] = useState(null);
  const [sorting, setSorting] = useState([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('idComprobante', {
        header: 'N°',
        enableSorting: true,
        cell: info => <span className="font-bold">{info.getValue()}</span>,
      }),
      columnHelper.accessor('serie', {
        header: 'Serie',
        enableSorting: true,
        cell: info => `${info.getValue()}-${info.row.original.correlativo}`,
      }),
      columnHelper.accessor('tipoComprobante', {
        header: 'Tipo',
        enableSorting: true,
        cell: info => (info.getValue() === '03' ? 'Boleta' : 'Factura'),
      }),
      columnHelper.accessor('fechaEmision', {
        header: 'Fecha',
        enableSorting: true,
        cell: info => new Date(info.getValue()).toLocaleDateString('es-PE'),
      }),
      columnHelper.accessor('montoTotal', {
        header: 'Monto',
        enableSorting: true,
        cell: info => `S/ ${info.getValue().toFixed(2)}`,
      }),
      columnHelper.accessor('clienteNombre', {
        header: 'Cliente',
        enableSorting: true,
      }),
      columnHelper.accessor('nombreEstadoSunat', {
        header: 'Estado SUNAT',
        enableSorting: true,
        cell: info => {
          const idEstado = info.row.original.idEstadoSunat;
          const clases = {
            1: 'badge-warning',
            2: 'badge-info',
            3: 'badge-success',
            4: 'badge-error',
            5: 'badge-ghost',
            6: 'badge-outline',
          };
          return (
            <span className={`badge ${clases[idEstado] || 'badge-ghost'}`}>
              {info.getValue() ?? '—'}
            </span>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: comprobantes,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const cargarComprobantes = async () => {
    try {
      const res = await api.get('/Comprobante');
      setComprobantes(res.data);
    } catch (error) {
      swal.fire('Error', 'No se pudieron cargar los comprobantes', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarComprobantes();
  }, []);

  const verDetalle = async (id) => {
    try {
      const res = await api.get(`/Comprobante/${id}`);
      const c = res.data;
      swal.fire({
        title: `Comprobante ${c.serie}-${c.correlativo}`,
        html: `
          <div class="text-left space-y-2">
            <p><strong>Tipo:</strong> ${c.tipoComprobante === '03' ? 'Boleta' : 'Factura'}</p>
            <p><strong>Fecha:</strong> ${new Date(c.fechaEmision).toLocaleString('es-PE')}</p>
            <p><strong>Monto:</strong> S/ ${c.montoTotal.toFixed(2)}</p>
            <p><strong>IGV:</strong> S/ ${c.igvMonto.toFixed(2)}</p>
            <p><strong>Cliente:</strong> ${c.clienteNombre}</p>
            <p><strong>Documento:</strong> ${c.clienteDocumentoTipo === '1' ? 'DNI' : 'PAS'}: ${c.clienteDocumentoNum}</p>
            <p><strong>Método de pago:</strong> ${c.metodoPago}</p>
            <p><strong>Estado SUNAT:</strong> <span class="badge ${c.idEstadoSunat === 3 ? 'badge-success' : 'badge-warning'}">${c.nombreEstadoSunat ?? 'Pendiente'}</span></p>
            ${c.fechaEnvio ? `<p><strong>Enviado:</strong> ${new Date(c.fechaEnvio).toLocaleString('es-PE')}</p>` : ''}
          </div>
        `,
        confirmButtonText: 'Cerrar',
      });
    } catch (error) {
      swal.fire('Error', 'No se pudo cargar el detalle del comprobante', 'error');
    }
  };

  const marcarEnviado = async (id) => {
    const confirmacion = await swal.fire({
      title: '¿Marcar como enviado a SUNAT?',
      text: 'Simulá la confirmación de envío electrónico.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar como enviado',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmacion.isConfirmed) return;

    setEnviandoId(id);
    try {
      await api.post(`/Comprobante/${id}/enviar`, '"hash_simulado"', {
        headers: { 'Content-Type': 'application/json' },
      });
      swal.fire('Enviado', 'Comprobante marcado como enviado a SUNAT.', 'success');
      cargarComprobantes();
    } catch (error) {
      swal.fire('Error', 'No se pudo actualizar el estado del comprobante', 'error');
    } finally {
      setEnviandoId(null);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          <Receipt className="inline mr-2" size={28} />
          Comprobantes
        </h2>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && ' 🔼'}
                        {header.column.getIsSorted() === 'desc' && ' 🔽'}
                      </th>
                    ))}
                    <th>Acciones</th>
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-500 py-8">
                      No se encontraron comprobantes.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => verDetalle(row.original.idComprobante)}
                            title="Ver detalle"
                          >
                            <Eye size={16} />
                          </button>
                          {esAdmin && row.original.idEstadoSunat === 1 && (
                            <button
                              className="btn btn-ghost btn-xs text-info"
                              onClick={() => marcarEnviado(row.original.idComprobante)}
                              disabled={enviandoId === row.original.idComprobante}
                              title="Marcar como enviado"
                            >
                              {enviandoId === row.original.idComprobante ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <SendHorizontal size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}