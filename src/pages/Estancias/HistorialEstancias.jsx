import { useState, useEffect, useMemo } from 'react';
import {
    useReactTable, getCoreRowModel, getSortedRowModel,
    getFilteredRowModel,
    flexRender, createColumnHelper,
} from '@tanstack/react-table';
import { isBefore, isAfter, isSameDay, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import api from '../../api/axios';
import swal from '../../lib/swal';
import { DoorOpen, FileText } from 'lucide-react';
import PdfViewerModal from '../../components/ui/PdfViewerModal';
import DataTable from '../../components/ui/DataTable';
import TableFilters from '../../components/ui/TableFilters';
import { useSignalR } from '../../hooks/useSignalR'; // ← NUEVO

const columnHelper = createColumnHelper();

export default function HistorialEstancias() {
    const [estancias, setEstancias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [dateFilter, setDateFilter] = useState({ type: 'none', date: null, dateEnd: null });
    const [pdfUrl, setPdfUrl] = useState(null);
    const [mostrarPdf, setMostrarPdf] = useState(false);

    const cargarEstancias = () => {
        setCargando(true);
        api.get('/Estancia')
            .then(res => setEstancias(res.data))
            .catch(() => swal.fire('Error', 'No se pudo cargar el historial de estancias', 'error'))
            .finally(() => setCargando(false));
    };

    useEffect(() => {
        cargarEstancias();
    }, []);

    // Tiempo real: cuando se crea una nueva estancia, recargamos
    useSignalR('NuevaEstancia', () => {
        cargarEstancias();
    });

    const verPdf = (idEstancia) => {
        const url = "/Pdf/Estancia/" + idEstancia;
        setPdfUrl(url);
        setMostrarPdf(true);
    };

    const dataFiltrada = useMemo(() => {
        if (!dateFilter || dateFilter.type === 'none' || !dateFilter.date) return estancias;

        return estancias.filter(item => {
            const itemDate = new Date(item.fechaCheckin);
            const filterDate = dateFilter.date;

            if (dateFilter.type === 'before') return isBefore(itemDate, startOfDay(filterDate));
            if (dateFilter.type === 'after') return isAfter(itemDate, endOfDay(filterDate));
            if (dateFilter.type === 'on') return isSameDay(itemDate, filterDate);
            if (dateFilter.type === 'range') {
                if (!dateFilter.dateEnd) return true;
                return isWithinInterval(itemDate, {
                    start: startOfDay(filterDate),
                    end: endOfDay(dateFilter.dateEnd)
                });
            }
            return true;
        });
    }, [estancias, dateFilter]);

    const columns = useMemo(() => [
        columnHelper.accessor('idEstancia', { header: 'N° Estancia', enableSorting: true }),
        columnHelper.accessor('numeroHabitacion', { header: 'Habitación', enableSorting: true }),
        columnHelper.accessor('clienteNombreCompleto', { header: 'Cliente', enableSorting: true }),
        columnHelper.accessor('fechaCheckin', {
            header: 'Entrada',
            enableSorting: true,
            cell: info => new Date(info.getValue()).toLocaleString('es-PE'),
        }),
        columnHelper.accessor('fechaCheckoutPrevista', {
            header: 'Salida Prevista',
            enableSorting: true,
            cell: info => new Date(info.getValue()).toLocaleDateString('es-PE'),
        }),
        columnHelper.accessor('fechaCheckoutReal', {
            header: 'Salida Real',
            enableSorting: true,
            cell: info => info.getValue() ? new Date(info.getValue()).toLocaleString('es-PE') : '—',
        }),
        columnHelper.accessor('montoTotal', {
            header: 'Monto',
            enableSorting: true,
            cell: info => "S/ " + info.getValue().toFixed(2),
        }),
        columnHelper.accessor('estado', {
            header: 'Estado',
            enableSorting: true,
            cell: info => {
                const badgeClass = info.getValue() === 'Activa' ? 'badge-warning' : 'badge-success';
                return <span className={"badge " + badgeClass}>{info.getValue()}</span>;
            },
        }),
        columnHelper.display({
            id: 'pdf',
            header: 'PDF',
            cell: ({ row }) => (
                <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => verPdf(row.original.idEstancia)}
                    title="Ver PDF"
                >
                    <FileText size={16} />
                </button>
            ),
        }),
    ], []);

    const table = useReactTable({
        data: dataFiltrada,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <DoorOpen size={28} /> Historial de Estancias
                    </h2>
                    <p className="text-sm text-base-content/60 mt-1">Consultá todas las estancias registradas</p>
                </div>
            </div>

            <TableFilters
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                placeholder="Buscar por habitación, cliente, estado..."
            />

            <DataTable
                table={table}
                columns={columns}
                emptyMessage="No se encontraron estancias con los criterios de búsqueda"
                isLoading={cargando}
            />

            {mostrarPdf && (
                <PdfViewerModal pdfUrl={pdfUrl} onClose={() => { setMostrarPdf(false); setPdfUrl(null); }} />
            )}
        </div>
    );
}