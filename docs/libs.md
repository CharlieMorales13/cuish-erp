Base del proyecto
Librería	Para qué	Nota
vite + @vitejs/plugin-react	Bundler y dev server	Ya decidido
typescript	Tipado, compartir tipos con el backend después	Desde el día uno, no lo dejes para después
react-router	Navegación entre módulos (Inventario, Lotes, Recetas, Compras)	Un ERP tiene muchas pantallas, esto es obligatorio
PWA
Librería	Para qué
vite-plugin-pwa	Genera el service worker y el manifest automáticamente, es el estándar para PWA en Vite

Ojo con esto, y es importante para tu caso específico: vite-plugin-pwa te da la PWA "instalable" y el caché de los archivos de la app (que la interfaz cargue sin internet). Eso no es lo mismo que la cola offline de datos que necesita el POS de Mario. Para tu ERP, el caché de la app probablemente basta, porque el ERP se usa desde un dispositivo con conexión (no en la barra durante el servicio). Vale la pena que lo aclares con el equipo, para no invertir tiempo construyendo cola offline en el ERP si en realidad solo el POS la necesita.

UI y estilos
Librería	Para qué
tailwindcss	Estilos utilitarios, base de shadcn
shadcn/ui	Componentes copiables (tablas, diálogos, formularios, selects), no es dependencia npm, se copian al proyecto
lucide-react	Iconos, viene por defecto con shadcn
Datos y formularios (el corazón de un ERP)
Librería	Para qué
@tanstack/react-table	Tablas con orden, filtro y paginación (inventario, lotes, movimientos)
react-hook-form	Formularios de alta/edición, buen rendimiento con formularios grandes
zod	Validación de esquemas. Doble uso: mismas reglas en frontend y en las Lambdas después
@hookform/resolvers	Pegamento entre react-hook-form y zod
Estado y datos remotos
Librería	Para qué
@tanstack/react-query	Manejo de datos del servidor (caché, refetch, estados de carga/error)

Esta es la que más te va a ahorrar trabajo en la migración de mocks a backend real. Si escribes tus llamadas dentro de React Query desde ahora (aunque devuelvan tus datos estáticos), cuando cambies a las Lambdas solo cambia la función que hace el fetch, todo lo demás (caché, loading, errores) sigue igual.

No necesitas Redux ni Zustand por ahora. El 90% del estado de un ERP es estado del servidor, que React Query ya maneja. Solo agrega un manejador de estado global si aparece una necesidad real (ej. estado de sesión compartido), no de entrada.

Mocks (tu punto sobre datos estáticos)
Librería	Para qué
msw (Mock Service Worker)	Simula el backend interceptando peticiones HTTP

Aquí un consejo concreto sobre tu plan de "primero estáticos, después migrar": si pones los datos estáticos como imports directos dentro de los componentes (import productos from './data/productos.json'), después vas a tener que tocar cada componente al migrar. Con MSW, tus componentes desde el día uno hacen fetch('/api/productos') (vía React Query), y MSW responde con tus datos estáticos. Al migrar, no tocas ningún componente, solo apagas MSW. Es media hora extra de configuración ahora que te ahorra un día de refactor después.

Alerta de conflicto técnico: MSW y vite-plugin-pwa ambos registran un service worker, y pueden pelearse entre ellos en desarrollo. La solución normal es desactivar la PWA en modo desarrollo (devOptions.enabled: false en la config del plugin) y solo probarla en builds de producción. Vale la pena que lo sepas antes de perder una tarde debuggeando por qué el mock dejó de responder.

Extras que probablemente vas a necesitar pronto
Librería	Para qué
date-fns	Manejo de fechas (caducidad, fechas de lote, cortes por turno)
recharts	Gráficas para el dashboard del gerente (consumo, mermas, rotación)