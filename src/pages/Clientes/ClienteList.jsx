import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteSchema } from './clienteSchema';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Plus, Edit, Trash2, Search, User } from 'lucide-react';
import swal from '../../lib/swal';
import LoadingButton from '../../components/ui/LoadingButton';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

const columnHelper = createColumnHelper();

export default function ClienteList() {
  const { user } = useAuth();
  const esAdmin = user?.nombreRol === 'Administrador';

  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [sorting, setSorting] = useState([]);

  // Búsqueda
  const [buscarTipo, setBuscarTipo] = useState('');
  const [buscarDocumento, setBuscarDocumento] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(clienteSchema),
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('documento', {
        header: 'Documento',
        enableSorting: true,
        cell: info => {
          const c = info.row.original;
          const prefijo = c.tipoDocumento === '1' ? 'DNI' : 'PAS';
          return <span className="font-bold">{prefijo}: {c.documento}</span>;
        },
      }),
      columnHelper.accessor('nombres', {
        header: 'Nombres',
        enableSorting: true,
      }),
      columnHelper.accessor('apellidos', {
        header: 'Apellidos',
        enableSorting: true,
      }),
      columnHelper.accessor('telefono', {
        header: 'Teléfono',
        enableSorting: true,
        cell: info => info.getValue() ?? '—',
      }),
      columnHelper.accessor('email', {
        header: 'Correo',
        enableSorting: true,
        cell: info => info.getValue() ?? '—',
      }),
    ],
    []
  );

  const table = useReactTable({
    data: clientes,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const cargarClientes = async () => {
    try {
      const res = await api.get('/Cliente');
      setClientes(res.data);
    } catch (error) {
      swal.fire('Error', 'No se pudieron cargar los clientes', 'error');
    } finally {
      setCargando(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    cargarClientes();
  }, []);

  // Buscar por documento
  const buscarCliente = async () => {
    if (!buscarTipo || !buscarDocumento) {
      cargarClientes();
      return;
    }
    try {
      const res = await api.get(`/Cliente/documento/${buscarTipo}/${buscarDocumento}`);
      setClientes(res.data ? [res.data] : []);
    } catch (error) {
      if (error.response?.status === 404) {
        setClientes([]);
        swal.fire('Sin resultados', 'No se encontró ningún cliente con ese documento', 'info');
      } else {
        swal.fire('Error', 'Error al buscar cliente', 'error');
      }
    }
  };

  const limpiarBusqueda = () => {
    setBuscarTipo('');
    setBuscarDocumento('');
    cargarClientes();
  };

  // Modal
  const abrirModalCrear = () => {
    setEditando(null);
    reset({
      tipoDocumento: '1',
      documento: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      email: '',
      nacionalidad: 'PERUANA',
      direccion: '',
      fechaNacimiento: '',
    });
    setMostrarModal(true);
  };

  const abrirModalEditar = (cliente) => {
    setEditando(cliente);
    reset({
      tipoDocumento: cliente.tipoDocumento,
      documento: cliente.documento,
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      telefono: cliente.telefono ?? '',
      email: cliente.email ?? '',
      nacionalidad: cliente.nacionalidad ?? 'PERUANA',
      direccion: cliente.direccion ?? '',
      fechaNacimiento: cliente.fechaNacimiento
        ? cliente.fechaNacimiento.split('T')[0]
        : '',
    });
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEditando(null);
    reset();
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      fechaNacimiento: data.fechaNacimiento || null,
      telefono: data.telefono || null,
      email: data.email || null,
      nacionalidad: data.nacionalidad || 'PERUANA',
      direccion: data.direccion || null,
    };

    try {
      if (editando) {
        await api.put(`/Cliente/${editando.idCliente}`, payload);
        swal.fire('Actualizado', 'Cliente actualizado exitosamente', 'success');
      } else {
        await api.post('/Cliente', payload);
        swal.fire('Creado', 'Cliente registrado exitosamente', 'success');
      }
      cerrarModal();
      cargarClientes();
    } catch (error) {
      const mensaje =
        error.response?.data?.mensaje || 'Error al guardar el cliente';
      swal.fire('Error', mensaje, 'error');
    }
  };

  const eliminarCliente = async (id) => {
    const confirmacion = await swal.fire({
      title: '¿Eliminar cliente?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await api.delete(`/Cliente/${id}`);
      swal.fire('Eliminado', 'El cliente fue eliminado', 'success');
      cargarClientes();
    } catch (error) {
      const mensaje =
        error.response?.data?.mensaje || 'Error al eliminar el cliente';
      swal.fire('Error', mensaje, 'error');
    }
  };

  const tiposDocumento = [
    { codigo: '1', descripcion: 'DNI' },
    { codigo: '7', descripcion: 'Pasaporte' },
    { codigo: '6', descripcion: 'RUC' },
  ];

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Clientes</h2>
        {esAdmin && (
          <button className="btn btn-primary" onClick={abrirModalCrear}>
            <Plus size={20} /> Nuevo Cliente
          </button>
        )}
      </div>

      {/* Barra de búsqueda */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="form-control flex-1">
              <label className="label">
                <span className="label-text">Tipo de Documento</span>
              </label>
              <select
                className="select select-bordered"
                value={buscarTipo}
                onChange={(e) => setBuscarTipo(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="1">DNI</option>
                <option value="7">Pasaporte</option>
              </select>
            </div>
            <div className="form-control flex-1">
              <label className="label">
                <span className="label-text">Número de Documento</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Ingresá el documento"
                value={buscarDocumento}
                onChange={(e) => setBuscarDocumento(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscarCliente()}
              />
            </div>
            <button className="btn btn-primary" onClick={buscarCliente}>
              <Search size={20} /> Buscar
            </button>
            <button className="btn btn-ghost" onClick={limpiarBusqueda}>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla con ordenamiento */}
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
                    {esAdmin && <th>Acciones</th>}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={esAdmin ? 6 : 5} className="text-center text-gray-500 py-8">
                      No se encontraron clientes
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
                      {esAdmin && (
                        <td>
                          <div className="flex gap-1">
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => abrirModalEditar(row.original)}
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => eliminarCliente(row.original.idCliente)}
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de creación/edición (sin cambios) */}
      {mostrarModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="text-lg font-bold mb-4">
              {editando ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Tipo de documento */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Tipo de Documento</span>
                </label>
                <select
                  className={`select select-bordered ${errors.tipoDocumento ? 'select-error' : ''}`}
                  {...register('tipoDocumento')}
                >
                  {tiposDocumento.map((t) => (
                    <option key={t.codigo} value={t.codigo}>
                      {t.descripcion}
                    </option>
                  ))}
                </select>
                {errors.tipoDocumento && (
                  <span className="label-text-alt text-error">
                    {errors.tipoDocumento.message}
                  </span>
                )}
              </div>

              {/* Documento */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Número de Documento</span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered ${errors.documento ? 'input-error' : ''}`}
                  {...register('documento')}
                />
                {errors.documento && (
                  <span className="label-text-alt text-error">
                    {errors.documento.message}
                  </span>
                )}
              </div>

              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Nombres</span>
                  </label>
                  <input
                    type="text"
                    className={`input input-bordered ${errors.nombres ? 'input-error' : ''}`}
                    {...register('nombres')}
                  />
                  {errors.nombres && (
                    <span className="label-text-alt text-error">
                      {errors.nombres.message}
                    </span>
                  )}
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Apellidos</span>
                  </label>
                  <input
                    type="text"
                    className={`input input-bordered ${errors.apellidos ? 'input-error' : ''}`}
                    {...register('apellidos')}
                  />
                  {errors.apellidos && (
                    <span className="label-text-alt text-error">
                      {errors.apellidos.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Teléfono y Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Teléfono</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    {...register('telefono')}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Correo electrónico</span>
                  </label>
                  <input
                    type="text"
                    className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
                    {...register('email')}
                  />
                  {errors.email && (
                    <span className="label-text-alt text-error">
                      {errors.email.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Nacionalidad */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Nacionalidad</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  {...register('nacionalidad')}
                />
              </div>

              {/* Dirección */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Dirección</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  {...register('direccion')}
                ></textarea>
              </div>

              {/* Fecha de nacimiento */}
              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text">Fecha de Nacimiento</span>
                </label>
                <Controller
                  name="fechaNacimiento"
                  control={control}
                  render={({ field }) => (
                    <div className="flex justify-center">
                      <DayPicker
                        mode="single"
                        selected={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(format(date, 'yyyy-MM-dd'));
                          } else {
                            field.onChange('');
                          }
                        }}
                        captionLayout="dropdown"
                        startMonth={new Date(1960, 0)}
                        endMonth={new Date(2100, 11)}
                        className="bg-base-100 p-4 rounded-lg shadow-lg"
                      />
                    </div>
                  )}
                />
              </div>

              {/* Botones */}
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>
                <LoadingButton
                  type="submit"
                  isLoading={isSubmitting}
                  className="btn-primary"
                >
                  {editando ? 'Actualizar' : 'Crear'}
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}