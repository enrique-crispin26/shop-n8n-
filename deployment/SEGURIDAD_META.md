# Protección del webhook de Meta

`meta-webhook-gate.mjs` es una puerta de entrada delante de n8n. Comprueba la cabecera `X-Hub-Signature-256` mediante HMAC-SHA256 y el App Secret de Meta antes de reenviar un POST a n8n.

La clave se guarda únicamente en `C:\Users\fabri\n8n-docker\.env` como `META_APP_SECRET`; ese archivo no se versiona ni se debe compartir.

El servicio expone solo `127.0.0.1:5680`. Cloudflare debe apuntar a ese puerto:

```powershell
cloudflared tunnel --url http://localhost:5680
```

En Meta se debe usar `https://<tunnel>/webhook/meta-whatsapp`. El puerto 5678 es solamente la interfaz local de n8n y no debe configurarse como destino público del webhook.

Pruebas realizadas el 31 de octubre de 2026:

- Firma falsa: HTTP 401.
- Firma HMAC creada con el secreto de Meta: HTTP 200 y reenvío a n8n.
- Flujo `Buscador de Celulares`: publicado y activo.
