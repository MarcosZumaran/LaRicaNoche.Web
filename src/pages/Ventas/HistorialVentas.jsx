import { useState, useEffect, useMemo } from 'react';
import {
    useReactTable, getCoreRowModel, getSortedRowModel,
    flexRender, createColumnHelper,
} from '@tanstack/react-table';
import api from '../../api/axios';
import swal from '../../lib/swal';
import { ShoppingCart } from 'lucide-react';

const columnHelper = createColumnHelper();

export default function HistorialVentas() {
    const [ventas, setVentas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [sorting, setSorting] = useState([]);

    useEffect(() => {
        api.get('/Venta')
            .then(res => setVentas(res.data))
            .catch(() => swal.fire('Error', 'No se pudo cargar el historial de ventas', 'error'))
            .finally(() => setCargando(false));
    }, []);

    const columns = useMemo(() => [
        columnHelper.accessor('idVenta', { header: 'N° Venta', enableSorting: true }),
        columnHelper.accessor('clienteNombre', { header: 'Cliente', enableSorting: true }),
        columnHelper.accessor('fechaVenta', {
            header: 'Fecha',
            enableSorting: true,
            cell: info => new Date(info.getValue()).toLocaleString('es-PE'),
        }),
        columnHelper.accessor('total', {
            header: 'Total',
            enableSorting: true,
            cell: info => `S/ ${info.getValue().toFixed(2)}`,
        }),
        columnHelper.accessor('metodoPago', {
            header: 'Método de Pago',
            enableSorting: true,
        }),
    ], []);

    const table = useReactTable({
        data: ventas,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (cargando) return <div className="flex justify-center items-center h-64"><span className="loading loading-spinner loading-lg"></span></div>;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">
                <ShoppingCart className="inline mr-2" size={28} />
                Historial de Ventas
            </h2>
            <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
                            <thead>
                                {table.getHeaderGroups().map(hg => (
                                    <tr key={hg.id}>
                                        {hg.headers.map(header => (
                                            <th key={header.id} onClick={header.column.getToggleSortingHandler()}
                                                className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}>
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getIsSorted() === 'asc' && ' 🔼'}
                                                {header.column.getIsSorted() === 'desc' && ' 🔽'}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.map(row => (
                                    <tr key={row.id}>
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}