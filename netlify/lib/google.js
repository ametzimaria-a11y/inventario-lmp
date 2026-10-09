import crypto from 'node:crypto';

const base64url = (input) =>
  Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

let cache = { token: null, exp: 0 };

export async function getAccessToken() {
  const ahora = Math.floor(Date.now() / 1000);
  if (cache.token && cache.exp - 60 > ahora) return cache.token;

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(
    JSON.stringify({
      iss: process.env.GOOGLE_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: ahora,
      exp: ahora + 3600,
    })
  );
  const firmaBase = `${header}.${claim}`;
  const llave = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const firma = crypto.createSign('RSA-SHA256').update(firmaBase).sign(llave);
  const jwt = `${firmaBase}.${base64url(firma)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || 'No se pudo autenticar con Google');

  cache = { token: data.access_token, exp: ahora + (data.expires_in || 3600) };
  return data.access_token;
}

export async function sheetsFetch(ruta, opciones = {}) {
  const token = await getAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID}${ruta}`;
  const res = await fetch(url, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opciones.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || 'Error de Google Sheets');
  return data;
}