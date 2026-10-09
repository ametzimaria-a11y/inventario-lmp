import { useState } from 'react';
import Login from './Login';
import Inventario from './Inventario';
import './App.css';

export default function App() {
  const [usuario, setUsuario] = useState(() => sessionStorage.getItem('usuario'));

  const iniciarSesion = (nombre) => {
    sessionStorage.setItem('usuario', nombre);
    setUsuario(nombre);
  };

  const cerrarSesion = () => {
    sessionStorage.removeItem('usuario');
    setUsuario(null);
  };

  if (!usuario) {
    return <Login onLogin={iniciarSesion} />;
  }

  return <Inventario usuario={usuario} onLogout={cerrarSesion} />;
}