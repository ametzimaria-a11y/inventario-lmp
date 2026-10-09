import { useEffect, useMemo, useState } from 'react';

const API = '/.netlify/functions/productos';
const VACIO = { nombre: '', precio: '', categoria: '', stock: '' };

export default function Inventario({ usuario, onLogout }) {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar los productos');
      setProductos(data);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const categorias = useMemo(
    () => [...new Set(productos.map((p) => p.categoria))].filter(Boolean).sort(),
    [productos]
  );

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      const coincideNombre = p.nombre.toLowerCase().includes(texto);
      const coincideCategoria = filtroCategoria === 'Todas' || p.categoria === filtroCategoria;
      return coincideNombre && coincideCategoria;
    });
  }, [productos, busqueda, filtroCategoria]);

  const valorTotal = productos.reduce((suma, p) => suma + p.precio * p.stock, 0);
  const stockBajo = productos.filter((p) => p.stock < 10).length;

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validar = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio';
    if (form.precio === '' || Number(form.precio) <= 0) return 'El precio debe ser mayor a 0';
    if (!form.categoria.trim()) return 'La categoría es obligatoria';
    if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) {
      return 'El stock debe ser un número entero de 0 o más';
    }
    return '';
  };

  const mostrarAviso = (texto) => {
    setAviso(texto);
    setTimeout(() => setAviso(''), 3000);
  };

  const guardar = async (e) => {
    e.preventDefault();
    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }

    setError('');
    setGuardando(true);
    try {
      const editando = editandoId !== null;
      const res = await fetch(API, {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editando && { id: editandoId }),
          nombre: form.nombre.trim(),
          precio: Number(form.precio),
          categoria: form.categoria.trim(),
          stock: Number(form.stock),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar');

      await cargar();
      setForm(VACIO);
      setEditandoId(null);
      mostrarAviso(editando ? 'Producto actualizado ✔' : 'Producto agregado ✔');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const editar = (p) => {
    setEditandoId(p.id);
    setForm({
      nombre: p.nombre,
      precio: String(p.precio),
      categoria: p.categoria,
      stock: String(p.stock),
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setForm(VACIO);
    setError('');
  };

  const eliminar = async (p) => {
    if (!window.confirm(`¿Seguro que quieres eliminar "${p.nombre}"?`)) return;
    try {
      const res = await fetch(`${API}?id=${p.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar');
      if (editandoId === p.id) cancelarEdicion();
      await cargar();
      mostrarAviso('Producto eliminado ✔');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="contenedor">
      <header className="encabezado">
        <div>
          <h1>Inventario <span>LMP</span></h1>
          <p className="subtitulo">Control de productos</p>
        </div>
        <div className="usuario-caja">
          <span>👤 {usuario}</span>
          <button className="boton-secundario" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </header>

      <section className="resumen">
        <div className="dato"><strong>{productos.length}</strong><span>Productos</span></div>
        <div className="dato"><strong>${valorTotal.toLocaleString('es-MX')}</strong><span>Valor del inventario</span></div>
        <div className="dato alerta"><strong>{stockBajo}</strong><span>Con stock bajo (&lt;10)</span></div>
      </section>

      {aviso && <div className="mensaje-ok">{aviso}</div>}
      {error && <div className="mensaje-error">{error}</div>}

      <section className="panel">
        <h2>{editandoId !== null ? `Editar producto #${editandoId}` : 'Agregar producto'}</h2>
        <form className="formulario" onSubmit={guardar}>
          <div className="campo">
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" name="nombre" value={form.nombre} onChange={cambiar} placeholder="Ej. Proteína Whey 2kg" />
          </div>
          <div className="campo">
            <label htmlFor="precio">Precio ($)</label>
            <input id="precio" name="precio" type="number" min="0" step="0.01" value={form.precio} onChange={cambiar} placeholder="850" />
          </div>
          <div className="campo">
            <label htmlFor="categoria">Categoría</label>
            <input id="categoria" name="categoria" list="lista-categorias" value={form.categoria} onChange={cambiar} placeholder="Proteínas" />
            <datalist id="lista-categorias">
              {categorias.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="campo">
            <label htmlFor="stock">Stock</label>
            <input id="stock" name="stock" type="number" min="0" step="1" value={form.stock} onChange={cambiar} placeholder="15" />
          </div>
          <div className="acciones-form">
            <button className="boton" type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : editandoId !== null ? 'Actualizar' : 'Agregar'}
            </button>
            {editandoId !== null && (
              <button type="button" className="boton-secundario" onClick={cancelarEdicion}>Cancelar</button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="barra-herramientas">
          <input
            className="buscador"
            type="search"
            placeholder="🔍 Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
            <option value="Todas">Todas las categorías</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="contador">Mostrando {filtrados.length} de {productos.length}</span>
        </div>

        {cargando ? (
          <p className="vacio">Cargando productos desde Google Sheets...</p>
        ) : filtrados.length === 0 ? (
          <p className="vacio">No hay productos que coincidan.</p>
        ) : (
          <div className="tabla-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.nombre}</td>
                    <td>${p.precio.toLocaleString('es-MX')}</td>
                    <td><span className="etiqueta">{p.categoria}</span></td>
                    <td className={p.stock < 10 ? 'stock-bajo' : ''}>{p.stock}</td>
                    <td className="acciones">
                      <button className="boton-editar" onClick={() => editar(p)}>Editar</button>
                      <button className="boton-eliminar" onClick={() => eliminar(p)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}