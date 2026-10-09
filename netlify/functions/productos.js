import { sheetsFetch } from '../lib/google.js';

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const tab = () => process.env.GOOGLE_SHEET_TAB || 'Productos';
const rango = (r) => encodeURIComponent(`${tab()}!${r}`);

async function buscarIndice(id) {
  const data = await sheetsFetch(`/values/${rango('A2:A')}`);
  return (data.values || []).findIndex((r) => Number(r[0]) === Number(id));
}

export const handler = async (event) => {
  try {
    // LEER
    if (event.httpMethod === 'GET') {
      const data = await sheetsFetch(`/values/${rango('A2:E')}`);
      const productos = (data.values || []).map((f) => ({
        id: Number(f[0]),
        nombre: f[1],
        precio: Number(f[2]),
        categoria: f[3],
        stock: Number(f[4]),
      }));
      return json(200, productos);
    }

    // CREAR
    if (event.httpMethod === 'POST') {
      const { nombre, precio, categoria, stock } = JSON.parse(event.body || '{}');
      if (!nombre || precio === undefined || precio === '' || !categoria || stock === undefined || stock === '') {
        return json(400, { error: 'Faltan campos: nombre, precio, categoria y stock son obligatorios' });
      }

      const ids = await sheetsFetch(`/values/${rango('A2:A')}`);
      const numeros = (ids.values || []).map((r) => Number(r[0])).filter((n) => !isNaN(n));
      const id = numeros.length ? Math.max(...numeros) + 1 : 1;

      await sheetsFetch(`/values/${rango('A:E')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
        method: 'POST',
        body: JSON.stringify({ values: [[id, nombre, Number(precio), categoria, Number(stock)]] }),
      });
      return json(201, { id, nombre, precio: Number(precio), categoria, stock: Number(stock) });
    }

    // ACTUALIZAR
    if (event.httpMethod === 'PUT') {
      const { id, nombre, precio, categoria, stock } = JSON.parse(event.body || '{}');
      if (!id || !nombre || precio === undefined || precio === '' || !categoria || stock === undefined || stock === '') {
        return json(400, { error: 'Faltan campos para actualizar' });
      }

      const idx = await buscarIndice(id);
      if (idx === -1) return json(404, { error: 'Producto no encontrado' });

      const fila = idx + 2;
      await sheetsFetch(`/values/${rango(`A${fila}:E${fila}`)}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        body: JSON.stringify({ values: [[Number(id), nombre, Number(precio), categoria, Number(stock)]] }),
      });
      return json(200, { id: Number(id), nombre, precio: Number(precio), categoria, stock: Number(stock) });
    }

    // ELIMINAR
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters && event.queryStringParameters.id;
      if (!id) return json(400, { error: 'Falta el id' });

      const idx = await buscarIndice(id);
      if (idx === -1) return json(404, { error: 'Producto no encontrado' });

      const meta = await sheetsFetch('?fields=sheets.properties');
      const hoja = meta.sheets.find((s) => s.properties.title === tab());

      await sheetsFetch(':batchUpdate', {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: hoja.properties.sheetId,
                  dimension: 'ROWS',
                  startIndex: idx + 1,
                  endIndex: idx + 2,
                },
              },
            },
          ],
        }),
      });
      return json(200, { mensaje: 'Producto eliminado', id: Number(id) });
    }

    return json(405, { error: 'Método no permitido' });
  } catch (error) {
    console.error(error);
    return json(500, { error: error.message });
  }
};