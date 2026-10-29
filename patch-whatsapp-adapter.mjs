import { readFile, writeFile } from 'node:fs/promises';

const source = JSON.parse(await readFile('workflow-before-whatsapp-parser.json', 'utf8'));
const workflow = Array.isArray(source) ? source[0] : source;
const adapter = workflow.nodes.find((node) => node.name === 'Edit Fields');

if (!adapter) throw new Error('No se encontró el adaptador Edit Fields.');

adapter.parameters.jsonOutput = `={{ (() => {
  const mensaje = String($json.messages?.[0]?.text?.body ?? '').trim();
  const cliente = $json.contacts?.[0]?.profile?.name ?? 'Cliente WhatsApp';
  const numero = $json.messages?.[0]?.from ?? '';
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
  return { body: { cliente, producto, presupuesto }, wa_from: numero };
})() }}`;

const invalidConnections = workflow.connections['error de validación'].main[0];
if (!invalidConnections.some((item) => item.node === 'Send message')) {
  invalidConnections.push({ node: 'Send message', type: 'main', index: 0 });
}

await writeFile('workflow-whatsapp-parser.json', JSON.stringify([workflow], null, 2));
