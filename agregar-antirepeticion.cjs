const fs = require('fs');
const imported = JSON.parse(fs.readFileSync('flujo-antes-antirepeticion-20261028.json', 'utf8'));
const workflow = Array.isArray(imported) ? imported[0] : imported;
const node = workflow.nodes.find((n) => n.name === 'Interpretar mensaje Meta');
if (!node) throw new Error('No se encontró el nodo Interpretar mensaje Meta');
node.parameters.jsCode = `// Solo procesa mensajes de texto recibidos; ignora estados de WhatsApp.
const cambios = ($json.body?.entry ?? []).flatMap((entry) => entry.changes ?? []);
const valor = cambios.map((change) => change.value).find((value) => value?.messages?.[0]?.type === 'text');
if (!valor) return [];

const mensajeMeta = valor.messages[0];
const idMensaje = String(mensajeMeta.id ?? '');
const marcaDeTiempo = Number(mensajeMeta.timestamp ?? 0);
const ahora = Math.floor(Date.now() / 1000);
const antiguedadMaximaSegundos = 10 * 60;

// Memoria persistente del flujo: evita responder dos veces al mismo webhook.
const memoria = $getWorkflowStaticData('global');
const yaProcesados = Array.isArray(memoria.whatsappIdsProcesados)
  ? memoria.whatsappIdsProcesados
  : [];

if (idMensaje && yaProcesados.includes(idMensaje)) return [];

// Al reconectar Meta puede entregar mensajes pendientes. No respondemos los de más de 10 minutos.
if (marcaDeTiempo && ahora - marcaDeTiempo > antiguedadMaximaSegundos) return [];

if (idMensaje) {
  memoria.whatsappIdsProcesados = [...yaProcesados, idMensaje].slice(-200);
}

const mensaje = String(mensajeMeta.text?.body ?? '').trim();
const cliente = valor.contacts?.[0]?.profile?.name ?? 'Cliente WhatsApp';
const numero = mensajeMeta.from ?? '';
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

return [{ json: { body: { cliente, producto, presupuesto }, wa_from: numero } }];`;
fs.writeFileSync('workflow-antirepeticion.json', JSON.stringify(workflow, null, 2));
