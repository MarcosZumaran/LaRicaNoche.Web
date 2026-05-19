import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useSignalR } from '../../hooks/useSignalR';
import toast from 'react-hot-toast';
import { TrendingUp, CalendarDays, DollarSign, FileText, Send } from 'lucide-react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import swal from '../../lib/swal';
import PdfViewerModal from '../../components/ui/PdfViewerModal';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
} from '@tanstack/react-table';
import { FileSpreadsheet } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';

const columnHelper = createColumnHelper();

export default function CierreCaja() {
  const hoy = new Date();
  const [fecha, setFecha] = useState(format(hoy, 'yyyy-MM-dd'));
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [mostrarPdf, setMostrarPdf] = useState(false);

  // Estados para SUNAT
  const [estadoEnvio, setEstadoEnvio] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const columns = useMemo(
    () => [
      columnHelper.accessor('concepto', {
        header: 'Concepto',
        enableSorting: true,
      }),
      columnHelper.accessor('metodoPago', {
        header: 'Método de Pago',
        enableSorting: true,
        cell: info => {
          const metodosPagoTraducidos = {
            'Efectivo': 'Efectivo',
            'Tarjeta de Crédito / Débito': 'Tarjeta',
            'Transferencia bancaria (Yape/Plin)': 'Yape / Plin',
            'Depósito en cuenta': 'Depósito',
            'Otros': 'Otros',
          };
          return metodosPagoTraducidos[info.getValue()] || info.getValue();
        },
      }),
      columnHelper.accessor('ingresos', {
        header: 'Ingresos',
        enableSorting: true,
        cell: info => `S/ ${(info.getValue() ?? 0).toFixed(2)}`,
      }),
    ],
    []
  );

  const table = useReactTable({
    data: datos,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const cargarCierre = async (fechaConsulta) => {
    setCargando(true);
    try {
      const res = await api.get('/Reporte/cierre-caja', {
        params: { fecha: fechaConsulta },
      });
      setDatos(res.data);
    } catch (error) {
      swal.fire('Error', 'No se pudo cargar el cierre de caja', 'error');
    } finally {
      setCargando(false);
    }
  };

  // ------------------------------------------------
  // Descomentar cuando exista el endpoint real
  // const cargarEstadoEnvio = async (fechaConsulta) => {
  //   try {
  //     const res = await api.get('/Reporte/cierre-caja/estado-envio', {
  //       params: { fecha: fechaConsulta },
  //     });
  //     setEstadoEnvio(res.data);
  //   } catch (error) {
  //     console.error('Error al cargar estado de envío:', error);
  //   }
  // };
  // ------------------------------------------------

  useEffect(() => {
    cargarCierre(fecha);
    // cargarEstadoEnvio(fecha);   // Se activará cuando el endpoint exista
  }, [fecha]);

  useSignalR('CierreCajaEnviado', (data) => {
    const fechaFormateada = new Date(data.fecha).toLocaleDateString('es-PE');
    toast.success(`📤 Cierre de caja del ${fechaFormateada} enviado a SUNAT.`);
    cargarCierre(fecha);
    // cargarEstadoEnvio(fecha);
  });

  const totalGeneral = datos.reduce((sum, item) => sum + (item.ingresos || 0), 0);

  const generarPdf = async () => {
    try {
      const response = await api.get('/Pdf/CierreCaja', {
        params: { fecha },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setMostrarPdf(true);
    } catch (error) {
      swal.fire('Error', 'No se pudo generar el PDF', 'error');
    }
  };

  const exportarExcel = async () => {
    try {
      const response = await api.get('/Reporte/cierre-caja/excel', {
        params: { fecha },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cierre_caja_${fecha}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      swal.fire('Error', 'No se pudo exportar el Excel', 'error');
    }
  };

  const enviarASunat = async () => {
    const confirmacion = await swal.fire({
      title: '¿Simular envío a SUNAT?',
      text: 'Se marcará el cierre de caja como enviado.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmacion.isConfirmed) return;

    setEnviando(true);
    try {
      await api.post('/Reporte/cierre-caja/enviar', null, {
        params: { fecha },
      });
      swal.fire('Enviado', 'El cierre de caja fue marcado como enviado a SUNAT.', 'success');
      // cargarEstadoEnvio(fecha);  // Refrescar estado cuando exista
    } catch (error) {
      swal.fire('Error', 'No se pudo simular el envío', 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp size={28} /> Cierre de Caja
          </h2>
          <p className="text-sm text-base-content/60 mt-1">Consultá el detalle de ingresos por fecha</p>
        </div>
      </div>

      {/* Selector de fecha */}
      <div className="card bg-base-100 shadow-sm border border-base-200 mb-6">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="form-control">
              <label className="label justify-center">
                <span className="label-text flex items-center gap-1">
                  <CalendarDays size={16} /> Fecha
                </span>
              </label>
              <div className="flex justify-center">
                <DayPicker
                  mode="single"
                  selected={fecha ? new Date(fecha + 'T00:00:00') : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setFecha(format(date, 'yyyy-MM-dd'));
                    } else {
                      setFecha('');
                    }
                  }}
                  captionLayout="dropdown"
                  startMonth={new Date(1960, 0)}
                  endMonth={new Date(2100, 11)}
                  className="bg-base-100 p-4 rounded-lg shadow-sm border border-base-300"
                />
              </div>
            </div>
            <div className="flex items-center">
              <button
                className="btn btn-primary"
                onClick={() => {
                  cargarCierre(fecha);
                  // cargarEstadoEnvio(fecha);
                }}
                disabled={cargando}
              >
                {cargando ? 'Cargando...' : 'Consultar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de ingresos */}
      <div className="card bg-base-100 shadow-sm border border-base-200 mb-6">
        <div className="card-body">
          <h3 className="card-title text-lg font-semibold mb-4">
            Ingresos del {fecha ? format(new Date(fecha + 'T00:00:00'), 'dd/MM/yyyy') : '—'}
          </h3>
          <DataTable
            table={table}
            columns={columns}
            emptyMessage={cargando ? 'Cargando...' : 'Sin movimientos para esta fecha'}
            isLoading={cargando}
          />

          {/* Totales y acciones */}
          {datos.length > 0 && (
            <div className="mt-4 space-y-4">
              <div className="text-right">
                <p className="text-lg font-bold text-base-content">
                  <DollarSign size={20} className="inline mr-1" />
                  Total General: S/ {totalGeneral.toFixed(2)}
                </p>
              </div>

              {/* Estado SUNAT y acciones */}
              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                {/* Estado de envío */}
                {estadoEnvio && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-base-content/80">Estado SUNAT:</span>
                    <span className={`badge ${estadoEnvio.idEstadoSunat === 2 ? 'badge-info' : estadoEnvio.idEstadoSunat === 3 ? 'badge-success' : 'badge-warning'}`}>
                      {estadoEnvio.nombreEstadoSunat ?? 'Pendiente'}
                    </span>
                    {estadoEnvio.fechaEnvio && (
                      <span className="text-xs text-base-content/50">
                        ({new Date(estadoEnvio.fechaEnvio).toLocaleString('es-PE')})
                      </span>
                    )}
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-2 flex-wrap">
                  {estadoEnvio && estadoEnvio.idEstadoSunat === 1 && (
                    <button
                      className="btn btn-sm btn-info gap-1"
                      onClick={enviarASunat}
                      disabled={enviando}
                    >
                      {enviando ? 'Enviando...' : <><Send size={16} /> Enviar a SUNAT</>}
                    </button>
                  )}
                  <button className="btn btn-primary btn-sm gap-1" onClick={generarPdf}>
                    <FileText size={16} /> Generar PDF
                  </button>
                  <button className="btn btn-sm btn-success gap-1" onClick={exportarExcel}>
                    <FileSpreadsheet size={16} /> Exportar Excel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de PDF */}
      {mostrarPdf && (
        <PdfViewerModal pdfUrl={pdfUrl} onClose={() => { setMostrarPdf(false); setPdfUrl(null); }} />
      )}
    </div>
  );
}