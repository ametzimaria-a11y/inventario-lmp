# Inventario LMP

Sistema web de inventario de productos con **login**, **CRUD completo** y base de datos en la nube con **Google Sheets**. Proyecto de la materia Cloud Computing, Unidad 2 (ITS Puruándiro, TecNM).

## Funcionalidades

- Inicio de sesión (usuario y contraseña validados en el servidor)
- **Crear**, **leer**, **actualizar** y **eliminar** productos (con confirmación al eliminar)
- Validación de campos en el formulario
- Búsqueda por nombre, filtro por categoría y contadores (total de productos, valor del inventario y stock bajo)
- Los datos se guardan en una hoja de Google Sheets

## Tecnologías

- **Frontend:** React + Vite
- **API REST:** Netlify Functions (Node.js)
- **Base de datos:** Google Sheets (Google Sheets API con cuenta de servicio)
- **Control de versiones:** Git y GitHub
- **Despliegue:** Netlify

## Arquitectura

```
Navegador (React)  →  Netlify Functions (/.netlify/functions/...)  →  Google Sheets API  →  Hoja de cálculo
```

| Método | Ruta | Acción |
|--------|------|--------|
| POST | `/.netlify/functions/login` | Validar usuario y contraseña |
| GET | `/.netlify/functions/productos` | Leer productos |
| POST | `/.netlify/functions/productos` | Crear producto |
| PUT | `/.netlify/functions/productos` | Actualizar producto |
| DELETE | `/.netlify/functions/productos?id=ID` | Eliminar producto |

## Estructura de la hoja de Google Sheets

Pestaña `Productos` con las columnas: `ID | Nombre | Precio | Categoria | Stock`

## Variables de entorno

Las credenciales **no se incluyen en el repositorio**. Se configuran en un archivo `.env` local y en las variables de entorno de Netlify:

```
GOOGLE_SHEET_ID=
GOOGLE_SHEET_TAB=Productos
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
ADMIN_USER=
ADMIN_PASSWORD=
```

## Ejecutar en local

```bash
npm install
npx netlify dev
```

Después abrir `http://localhost:8888`.

## Despliegue

Aplicación desplegada: _(se agrega la URL de Netlify)_

## Autora

Metzi María Arévalo Villavicencio · 22011019 · Ing. en Tecnologías de la Información y Comunicaciones