import { google } from 'googleapis';

function getSheets() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  try {
    const sheets = getSheets();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const tab = process.env.GOOGLE_SHEET_TAB || 'Productos';

    // LEER: GET /productos
    if (event.httpMethod === 'GET') {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tab}!A2:E`,
      });
      const filas = res.data.values || [];
      const productos = filas.map((f) => ({
        id: Number(f[0]),
        nombre: f[1],
        precio: Number(f[2]),
        categoria: f[3],
        stock: Number(f[4]),
      }));
      return json(200, productos);
    }

    // CREAR: POST /productos
    if (event.httpMethod === 'POST') {
      const { nombre, precio, categoria, stock } = JSON.parse(event.body || '{}');
      if (!nombre || precio === undefined || precio === '' || !categoria || stock === undefined || stock === '') {
        return json(400, { error: 'Faltan campos: nombre, precio, categoria y stock son obligatorios' });
      }

      const ids = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tab}!A2:A`,
      });
      const numeros = (ids.data.values || []).map((r) => Number(r[0])).filter((n) => !isNaN(n));
      const id = numeros.length ? Math.max(...numeros) + 1 : 1;

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${tab}!A:E`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[id, nombre, Number(precio), categoria, Number(stock)]] },
      });
      return json(201, { id, nombre, precio: Number(precio), categoria, stock: Number(stock) });
    }

    // ACTUALIZAR: PUT /productos
    if (event.httpMethod === 'PUT') {
      const { id, nombre, precio, categoria, stock } = JSON.parse(event.body || '{}');
      if (!id || !nombre || precio === undefined || precio === '' || !categoria || stock === undefined || stock === '') {
        return json(400, { error: 'Faltan campos para actualizar' });
      }

      const ids = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tab}!A2:A`,
      });
      const idx = (ids.data.values || []).findIndex((r) => Number(r[0]) === Number(id));
      if (idx === -1) return json(404, { error: 'Producto no encontrado' });

      const fila = idx + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tab}!A${fila}:E${fila}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[Number(id), nombre, Number(precio), categoria, Number(stock)]] },
      });
      return json(200, { id: Number(id), nombre, precio: Number(precio), categoria, stock: Number(stock) });
    }

    // ELIMINAR: DELETE /productos?id=3
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters && event.queryStringParameters.id;
      if (!id) return json(400, { error: 'Falta el id' });

      const ids = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tab}!A2:A`,
      });
      const idx = (ids.data.values || []).findIndex((r) => Number(r[0]) === Number(id));
      if (idx === -1) return json(404, { error: 'Producto no encontrado' });

      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const hoja = meta.data.sheets.find((s) => s.properties.title === tab);

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
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
        },
      });
      return json(200, { mensaje: 'Producto eliminado', id: Number(id) });
    }

    return json(405, { error: 'Método no permitido' });
  } catch (error) {
    console.error(error);
    return json(500, { error: error.message });
  }
};