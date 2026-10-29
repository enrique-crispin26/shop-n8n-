import { readFile, writeFile } from 'node:fs/promises';

const source = JSON.parse(await readFile('n8n-integracion-meta/respaldo-buscador-20260907-publicado.json', 'utf8'));
const workflow = Array.isArray(source) ? source[0] : source;

const remove = new Set(['WhatsApp Trigger1', 'Edit Fields', 'Responder al cliente']);
workflow.nodes = workflow.nodes.filter((node) => !remove.has(node.name));

const verifyToken = 'alissonshop-verify-2026-meta';
workflow.nodes.push(
  {
    id: 'e6efb645-28e2-443f-9d0f-4d9c443d3fa1',
    name: 'Meta verificación GET',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2.1,
    position: [-720, 760],
    webhookId: 'meta-whatsapp-verificacion-2026',
    parameters: { httpMethod: 'GET', path: 'meta-whatsapp', responseMode: 'responseNode', options: {} },
  },
  {
    id: 'd7f8d892-a1d7-4e5e-91d0-fc2f9a5fd0c8',
    name: 'Validar verificación Meta',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [-496, 760],
    parameters: {
      jsCode: `const query = $json.query ?? {};
if (query['hub.mode'] !== 'subscribe' || query['hub.verify_token'] !== '${verifyToken}') {
  throw new Error('Token de verificación de Meta inválido');
}
return [{ json: { challenge: String(query['hub.challenge'] ?? '') } }];`,
    },
  },
  {
    id: '349cfc48-e75f-4e44-a0a3-2f11be6e817b',
    name: 'Responder verificación Meta',
    type: 'n8n-nodes-base.respondToWebhook',
    typeVersion: 1.5,
    position: [-272, 760],
    parameters: { respondWith: 'text', responseBody: '={{ $json.challenge }}', options: { responseCode: 200 } },
  },
  {
    id: '5bff63de-d1e5-4d4f-8be9-cb864471e1ae',
    name: 'Meta mensajes POST',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2.1,
    position: [-720, 1120],
    webhookId: 'meta-whatsapp-mensajes-2026',
    parameters: { httpMethod: 'POST', path: 'meta-whatsapp', responseMode: 'onReceived', options: {} },
  },
  {
    id: '6af251a2-48cf-4824-ad5f-5326952a5f81',
    name: 'Interpretar mensaje Meta',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [-496, 1120],
    parameters: {
      jsCode: `const cambios = ($json.body?.entry ?? []).flatMap((entry) => entry.changes ?? []);
const valor = cambios.map((change) => change.value).find((value) => value?.messages?.[0]?.type === 'text');

if (!valor) return [];

const mensaje = String(valor.messages[0].text?.body ?? '').trim();
const cliente = valor.contacts?.[0]?.profile?.name ?? 'Cliente WhatsApp';
const numero = valor.messages[0].from ?? '';
const presupuestoMatch = mensaje.match(/(?:presupuesto|hasta|tengo|cuento con)\\s*(?:de\\s*)?(?:bs\\.?\\s*)?([\\d.,]+)/i)
  ?? mensaje.match(/([\\d.,]+)\\s*(?:bs|bolivianos?)/i);
const presupuesto = presupuestoMatch
  ? Number(presupuestoMatch[1].replace(/\\./g, '').replace(',', '.'))
  : 0;
const producto = mensaje
  .replace(/^(hola[!,. ]*)?(busco|quiero|necesito|me interesa|tienes?)\\s+/i, '')
  .replace(/[,;. ]*(?:con\\s+)?(?:un\\s+)?(?:presupuesto|hasta|tengo|cuento con)\\s*(?:de\\s*)?(?:bs\\.?\\s*)?[\\d.,]+(?:\\s*(?:bs|bolivianos?))?.*$/i, '')
  .replace(/[,;. ]*[\\d.,]+\\s*(?:bs|bolivianos?).*$/i, '')
  .trim();

return [{ json: { body: { cliente, producto, presupuesto }, wa_from: numero } }];`,
    },
  },
);

workflow.connections = Object.fromEntries(
  Object.entries(workflow.connections).filter(([name]) => !remove.has(name)),
);

for (const [name, connection] of Object.entries(workflow.connections)) {
  connection.main = connection.main.map((branch) => branch?.filter((item) => item.node !== 'Responder al cliente') ?? branch);
}

workflow.connections['Meta verificación GET'] = { main: [[{ node: 'Validar verificación Meta', type: 'main', index: 0 }]] };
workflow.connections['Validar verificación Meta'] = { main: [[{ node: 'Responder verificación Meta', type: 'main', index: 0 }]] };
workflow.connections['Meta mensajes POST'] = { main: [[{ node: 'Interpretar mensaje Meta', type: 'main', index: 0 }]] };
workflow.connections['Interpretar mensaje Meta'] = { main: [[{ node: 'SolicitudCliente', type: 'main', index: 0 }]] };

await writeFile('workflow-meta-webhook-profesional.json', JSON.stringify([workflow], null, 2));
