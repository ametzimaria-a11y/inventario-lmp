import { useState } from 'react';

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');

    if (!usuario.trim() || !password.trim()) {
      setError('Escribe tu usuario y contraseña');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.trim(), password }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        onLogin(data.usuario);
      } else {
        setError(data.error || 'Usuario o contraseña incorrectos');
      }
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-pagina">
      <form className="login-tarjeta" onSubmit={enviar}>
       <h1>Inventario <span>LMP</span></h1>
        <p className="subtitulo">Control de productos · Inicia sesión</p>

        {error && <div className="mensaje-error">{error}</div>}

        <div className="campo">
          <label htmlFor="usuario">Usuario</label>
          <input
            id="usuario"
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="admin"
            autoComplete="username"
          />
        </div>

        <div className="campo">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            autoComplete="current-password"
          />
        </div>

        <button className="boton" type="submit" disabled={cargando}>
          {cargando ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}