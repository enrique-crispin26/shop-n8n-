# Tienda de celulares con React

Esta es una aplicación web tipo prototipo para administrar una tienda de celulares. Cubre los módulos que pediste: clientes, productos, pedidos, pagos, delivery, administrador y reportes.

## Tecnologías usadas

- React: construye la interfaz por componentes.
- Vite: servidor de desarrollo rápido para proyectos React.
- Lucide React: iconos limpios para botones, navegación y métricas.
- CSS puro: estilos responsivos sin depender de frameworks pesados.
- localStorage: guarda datos en el navegador mientras aprendes antes de usar backend.

## Cómo ejecutar

En PowerShell de Windows puede fallar `npm` por política de scripts. Por eso usa `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

Luego abre la URL que muestre Vite, normalmente:

```text
http://localhost:5173/
```

## Qué hace cada módulo

- Clientes: registra clientes y permite usarlos en un pedido.
- Productos: muestra el catálogo, búsqueda, filtros, stock y precios.
- Pedidos: crea pedidos desde el carrito y permite cambiar su estado.
- Pagos: controla método de pago y estado del cobro.
- Delivery: sigue pedidos con entrega a domicilio.
- Administrador: gestiona inventario y agrega productos.
- Reportes: calcula ventas, pedidos, pagos pendientes, stock bajo y gráficos simples.

## Estructura del proyecto

```text
src/
  App.jsx       Componentes principales y lógica de la app
  data.js       Datos iniciales y funciones auxiliares
  main.jsx      Punto de entrada de React
  styles.css    Diseño visual y responsive
```

## Proceso recomendado para estudiar

1. Ejecuta la app y prueba cada módulo.
2. Abre `src/data.js` y cambia productos, clientes o precios.
3. Revisa `src/App.jsx`: ahí verás cómo React usa `useState`, `useMemo` y eventos.
4. Revisa `src/styles.css`: ahí están las grillas, tarjetas, tablas y diseño responsive.
5. Cuando entiendas el frontend, el siguiente paso sería conectar un backend.

## Siguiente mejora profesional

Para convertir este prototipo en una app completa, puedes agregar:

- Backend con Node.js y Express.
- Base de datos PostgreSQL o MySQL.
- Login real para administrador.
- API REST para productos, clientes, pedidos y pagos.
- Validación de formularios más estricta.
- Exportación de reportes a PDF o Excel.
