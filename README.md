# Tienda de celulares con n8n 

Desarrollé un workflow de automatización para gestionar consultas de clientes mediante WhatsApp. El sistema recibe mensajes a través de un webhook de Meta, procesa la solicitud y consulta un catálogo de productos almacenado en Google Sheets.

Mediante JavaScript, normaliza los datos, filtra los productos disponibles y evalúa coincidencias considerando la búsqueda y el presupuesto del cliente.

Posteriormente, utiliza un modelo de inteligencia artificial de OpenAI para generar respuestas comerciales claras y naturales basadas en la información obtenida. Finalmente, envía la respuesta al cliente y contempla el registro de consultas para su seguimient



## Qué hace cada módulo

- Clientes: registra clientes y permite usarlos en un pedido.
- Productos: muestra el catálogo, búsqueda, filtros, stock y precios.
- Pedidos: crea pedidos desde el carrito y permite cambiar su estado.
- Pagos: controla método de pago y estado del cobro.
- Delivery: sigue pedidos con entrega a domicilio.
- Administrador: gestiona inventario y agrega productos.
- Reportes: calcula ventas, pedidos, pagos pendientes, stock bajo y gráficos simples.





## Siguiente mejora profesional

Para convertir este prototipo en una app completa, puedes agregar:

- Backend con Node.js y Express.
- Base de datos PostgreSQL o MySQL.
- Login real para administrador.
- API REST para productos, clientes, pedidos y pagos.
- Validación de formularios más estricta.
- Exportación de reportes a PDF o Excel.
