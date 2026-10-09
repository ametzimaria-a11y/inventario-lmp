const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Método no permitido' });
  }

  try {
    const { usuario, password } = JSON.parse(event.body || '{}');

    if (!usuario || !password) {
      return json(400, { ok: false, error: 'Usuario y contraseña son obligatorios' });
    }

    if (usuario === process.env.ADMIN_USER && password === process.env.ADMIN_PASSWORD) {
      return json(200, { ok: true, usuario });
    }

    return json(401, { ok: false, error: 'Usuario o contraseña incorrectos' });
  } catch (error) {
    console.error(error);
    return json(500, { ok: false, error: 'Error en el servidor' });
  }
};