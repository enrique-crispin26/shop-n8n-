#  AlisonShop — Automatización de consultas comerciales con n8n

##  Descripción del proyecto

AlisonShop es un proyecto personal de automatización desarrollado con **n8n**, orientado a optimizar la atención de consultas comerciales de una tienda de celulares mediante WhatsApp.

El workflow integra webhooks, Google Sheets, JavaScript y un modelo de inteligencia artificial de OpenAI para procesar solicitudes, consultar productos disponibles y generar respuestas automáticas basadas en la información del catálogo.

El objetivo es reducir las tareas repetitivas asociadas con la atención de consultas y proporcionar información organizada sobre los productos disponibles.

##  Objetivo

Diseñar e implementar un flujo de automatización capaz de recibir consultas comerciales, interpretar la información proporcionada por el cliente, buscar productos en un catálogo y generar respuestas automáticas.

##  Funcionamiento del workflow

El proceso se divide en las siguientes etapas:

### 1. Recepción del mensaje

El workflow utiliza un webhook configurado en n8n para recibir solicitudes HTTP POST provenientes de la integración con Meta WhatsApp.

Cuando un cliente envía un mensaje, Meta notifica al webhook y se inicia el procesamiento de la consulta.

### 2. Extracción y validación de información

Mediante un nodo de código JavaScript, se extraen los datos relevantes del mensaje recibido, incluyendo el nombre del cliente, el producto solicitado y el presupuesto, cuando se proporciona.

Posteriormente, una condición valida que la solicitud contenga información suficiente para continuar.

### 3. Consulta del catálogo

El workflow utiliza la integración con Google Sheets para recuperar los registros del catálogo de celulares.

La información incluye:

* Identificación del producto.
* Marca y modelo.
* Precio.
* Existencias disponibles.

### 4. Normalización y procesamiento de datos

Mediante JavaScript, se transforman los registros obtenidos para trabajar con una estructura de datos uniforme.

Se realizan operaciones de limpieza, conversión de tipos y normalización de texto para facilitar las comparaciones.

### 5. Búsqueda y filtrado de productos

Se implementa lógica de búsqueda para identificar coincidencias entre la solicitud del cliente y los productos registrados.

El procesamiento considera criterios como:

* Coincidencias de marca o modelo.
* Disponibilidad de existencias.
* Precio del producto.
* Presupuesto del cliente.

El workflow puede seleccionar productos coincidentes y preparar alternativas disponibles.

### 6. Clasificación de resultados

Mediante lógica condicional, el workflow diferencia tres escenarios:

**Producto encontrado:** existen productos disponibles que coinciden con la búsqueda.

**Solo alternativas:** no se encontraron coincidencias, pero existen otros productos disponibles.

**Sin resultados:** no existen productos que cumplan los criterios evaluados.

Cada escenario permite preparar una respuesta adecuada.

### 7. Generación de respuestas con IA

Cuando existen productos coincidentes o alternativas, el workflow utiliza un modelo de OpenAI para redactar una respuesta comercial en lenguaje natural.

El modelo recibe información previamente procesada y se le indica que utilice únicamente los datos proporcionados sobre productos, precios y existencias.

De esta manera, la lógica de búsqueda se mantiene separada de la generación del mensaje.

### 8. Envío de respuesta y registro

La respuesta se envía automáticamente al cliente mediante la integración con WhatsApp.

El workflow también contempla el registro de consultas en Google Sheets, almacenando información que permite realizar un seguimiento de las solicitudes procesadas.

## 🛠️ Tecnologías utilizadas

| Tecnología      | Aplicación                                               |
| --------------- | -------------------------------------------------------- |
| n8n             | Orquestación y automatización del workflow               |
| JavaScript      | Extracción, normalización, búsqueda y filtrado de datos  |
| Google Sheets   | Catálogo de productos y registro de consultas            |
| Meta / WhatsApp | Recepción y envío de mensajes                            |
| OpenAI          | Generación de respuestas comerciales en lenguaje natural |
| Webhooks        | Recepción de eventos mediante solicitudes HTTP           |
| JSON            | Intercambio y estructuración de datos                    |

## Arquitectura general

```text
CLIENTE (WHATSAPP)
        |
        v
META / WEBHOOK HTTP POST
        |
        v
EXTRACCIÓN DEL MENSAJE
        |
        v
VALIDACIÓN DE LA SOLICITUD
        |
        v
CONSULTA A GOOGLE SHEETS
        |
        v
PROCESAMIENTO CON JAVASCRIPT
- Normalización
- Filtrado
- Búsqueda de coincidencias
- Validación de disponibilidad
        |
        v
CLASIFICACIÓN DEL RESULTADO
        |
        +---- Productos encontrados
        |              |
        +---- Solo alternativas
        |              |
        |              v
        |          OPENAI
        |      Redactar respuesta
        |              |
        +---- Sin resultados
                       |
                       v
               RESPUESTA FINAL
                       |
              +--------+--------+
              |                 |
              v                 v
           WHATSAPP        GOOGLE SHEETS
        Enviar mensaje     Registrar consulta
```

##  Validación y pruebas

El proyecto cuenta con evidencias de consultas realizadas mediante WhatsApp, incluyendo búsquedas de productos y recomendaciones alternativas.

Como parte de su evolución, se contempla incorporar pruebas funcionales para verificar:

* Coincidencias correctas entre consultas y productos.
* Validación de precios y existencias.
* Tratamiento de solicitudes incompletas.
* Comportamiento cuando no existen resultados.
* Consistencia de las respuestas generadas.

Los resultados de estas pruebas se documentarán a medida que sean ejecutadas.

## 📈 Estado del proyecto

Proyecto personal de automatización desarrollado con fines de aprendizaje y demostración técnica.

Cuenta con un workflow exportado de n8n y evidencias de interacción con clientes a través de WhatsApp.

No se presenta como una solución comercial desplegada en producción.

## 🔒 Seguridad

Las credenciales de servicios externos, los tokens de acceso y la información personal de los clientes no deben formar parte de las versiones públicas de los workflows.

Para utilizar el proyecto es necesario configurar credenciales propias para los servicios integrados.

## 👨‍💻 Autor

**Enrique Crispín**

GitHub: [enrique-crispin26](https://github.com/enrique-crispin26)

Proyecto desarrollado como parte de mi aprendizaje en automatización de procesos, programación e integración de servicios.
