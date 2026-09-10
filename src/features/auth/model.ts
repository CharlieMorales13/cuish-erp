const LLAVE = 'cuish.usuario'

/**
 * Sesión falsa en sessionStorage, un solo rol con acceso total.
 * Cuando exista la API, esto se reemplaza por el token real y aquí se agregan los roles
 * (Administrador, Encargado de Barra) si el cliente confirma que los necesita.
 */
export const usuarioActual = () => sessionStorage.getItem(LLAVE)
export const iniciarSesion = (nombre: string) => sessionStorage.setItem(LLAVE, nombre || 'Gerente')
export const cerrarSesion = () => sessionStorage.removeItem(LLAVE)
