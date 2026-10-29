const fs = require('fs');
const crypto = require('crypto');
const imported = JSON.parse(fs.readFileSync('flujo-reservas-base.json', 'utf8'));
const workflow = Array.isArray(imported) ? imported[0] : imported;
const node = (name) => workflow.nodes.find((n) => n.name === name);
const id = () => crypto.randomUUID();

// 1) Receiver: detect a reservation intent and load the last exact offer for this WhatsApp number.
const parser = node('Interpretar mensaje Meta');
parser.parameters.jsCode = `// Recibe solo mensajes de texto y descarta estados de entrega/lectura.
const cambios = ($json.body?.entry ?? []).flatMap((entry) => entry.changes ?? []);
const valor = cambios.map((change) => change.value).find((value) => value?.messages?.[0]?.type === 'text');
if (!valor) return [];

const mensajeMeta = valor.messages[0];
const idMensaje = String(mensajeMeta.id ?? '');
const marcaDeTiempo = Number(mensajeMeta.timestamp ?? 0);
const ahora = Math.floor(Date.now() / 1000);
const antiguedadMaximaSegundos = 10 * 60;
const memoria = $getWorkflowStaticData('global');
const yaProcesados = Array.isArray(memoria.whatsappIdsProcesados) ? memoria.whatsappIdsProcesados : [];
if (idMensaje && yaProcesados.includes(idMensaje)) return [];
if (marcaDeTiempo && ahora - marcaDeTiempo > antiguedadMaximaSegundos) return [];
if (idMensaje) memoria.whatsappIdsProcesados = [...yaProcesados, idMensaje].slice(-200);

const mensaje = String(mensajeMeta.text?.body ?? '').trim();
const cliente = valor.contacts?.[0]?.profile?.name ?? 'Cliente WhatsApp';
const numero = String(mensajeMeta.from ?? '').replace(/\\D/g, '');
const textoNormalizado = mensaje.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/\\s+/g, ' ').trim();
const esReserva = /^(si|quiero reservar(?:lo|la)?|reserv(?:a|alo|ala)|me lo llevo|quiero (?:ese|este))\\b/.test(textoNormalizado);
const ofertas = memoria.ultimaOfertaPorCliente ?? {};
const oferta = ofertas[numero];
const ofertaVigente = oferta && Date.now() - Number(oferta.guardadaEn ?? 0) <= 30 * 60 * 1000;

if (esReserva) {
  return [{ json: {
    intent: ofertaVigente ? 'reserva' : 'reserva_sin_contexto',
    reserva: ofertaVigente ? oferta : null,
    wa_from: numero,
    body: { cliente, producto: ofertaVigente ? oferta.modelo : '', presupuesto: 0 },
  } }];
}

const presupuestoMatch = mensaje.match(/(?:presupuesto|hasta|tengo|cuento con)\\s*(?:de\\s*)?(?:bs\\.?\\s*)?([\\d.,]+)/i)
  ?? mensaje.match(/([\\d.,]+)\\s*(?:bs|bolivianos?)/i);
const presupuesto = presupuestoMatch ? Number(presupuestoMatch[1].replace(/\\./g, '').replace(',', '.')) : 0;
const producto = mensaje
  .replace(/^(hola[!,. ]*)?(busco|quiero|necesito|me interesa|tienes?)\\s+/i, '')
  .replace(/[,;. ]*(?:con\\s+)?(?:un\\s+)?(?:presupuesto|hasta|tengo|cuento con)\\s*(?:de\\s*)?(?:bs\\.?\\s*)?[\\d.,]+(?:\\s*(?:bs|bolivianos?))?.*$/i, '')
  .replace(/[,;. ]*[\\d.,]+\\s*(?:bs|bolivianos?).*$/i, '')
  .trim();

return [{ json: { intent: 'buscar', body: { cliente, producto, presupuesto }, wa_from: numero } }];`;

// 2) Inventory search remembers only the first exact/strong match so “resérvalo” is unambiguous.
const search = node('Code in JavaScript');
search.parameters.jsCode = search.parameters.jsCode.replace(
  "const estado = productosEncontrados.length > 0\n  ? 'encontrado'\n  : productosAlternativos.length > 0\n    ? 'solo_alternativas'\n    : 'sin_resultados';",
  "const estado = productosEncontrados.length > 0\n  ? 'encontrado'\n  : productosAlternativos.length > 0\n    ? 'solo_alternativas'\n    : 'sin_resultados';\n\n// Guarda la primera coincidencia exacta para una posible reserva posterior.\nif (wa_from && productosEncontrados.length > 0) {\n  const memoria = $getWorkflowStaticData('global');\n  memoria.ultimaOfertaPorCliente ??= {};\n  const producto = productosEncontrados[0];\n  memoria.ultimaOfertaPorCliente[wa_from] = {\n    identificacion: producto.identificacion,\n    marca: producto.marca,\n    modelo: producto.modelo,\n    precio: producto.precio,\n    existencias: producto.existencias,\n    guardadaEn: Date.now(),\n  };\n}"
);

// 3) New routing and reservation nodes.
const decision = {
  id: id(), name: '¿Es mensaje de reserva?', type: 'n8n-nodes-base.if', typeVersion: 2.3,
  position: [-190, 1120],
  parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 3 }, conditions: [{ id: id(), leftValue: '={{ $json.intent }}', rightValue: 'buscar', operator: { type: 'string', operation: 'notEquals', singleValue: true } }], combinator: 'and' }, options: {} },
};
const prepare = {
  id: id(), name: 'Preparar reserva', type: 'n8n-nodes-base.code', typeVersion: 2, position: [40, 1330],
  parameters: { jsCode: `const esValida = $json.intent === 'reserva' && $json.reserva;\nconst cliente = $json.body?.cliente ?? 'Cliente';\nconst wa_from = $json.wa_from ?? '';\n\nif (!esValida) {\n  return [{ json: {\n    cliente, wa_from, producto_buscado: '', presupuesto: 0,\n    estado: 'reserva_sin_producto',\n    respuesta_final: 'Para reservar necesito que me indiques la identificación del producto o que primero consultes el modelo que te interesa.',\n    cantidad_encontrada: 0, cantidad_alternativas: 0,\n  } }];\n}\n\nconst producto = $json.reserva;\nreturn [{ json: {\n  cliente, wa_from,\n  producto_buscado: producto.marca + ' ' + producto.modelo,\n  presupuesto: producto.precio,\n  estado: 'reserva_solicitada',\n  respuesta_final: '✅ Solicitud de reserva registrada para: ' + producto.marca + ' ' + producto.modelo + ' (ID ' + producto.identificacion + ', Bs ' + producto.precio + '). Te contactaremos para confirmar disponibilidad y completar la reserva.',\n  cantidad_encontrada: 1, cantidad_alternativas: 0,\n  identificacion_producto: producto.identificacion,\n} }];` },
};
const save = {
  id: id(), name: 'Guardar reserva', type: 'n8n-nodes-base.googleSheets', typeVersion: 4.7, position: [370, 1390],
  credentials: node('Guardar consulta').credentials,
  parameters: JSON.parse(JSON.stringify(node('Guardar consulta').parameters)),
};
save.parameters.columns.value = {
  'Fecha': '={{ $now.toISO() }}',
  'Cliente': '={{ $json.cliente }}',
  'Producto_buscado': '={{ $json.producto_buscado }}',
  'Presupuesto ': '={{ $json.presupuesto }}',
  'Estado': '={{ $json.estado }}',
  'Respuesta': '={{ $json.respuesta_final }}',
  'ID_consulta': "={{ 'RES-' + $execution.id }}",
  'Canal': 'whatsapp',
  'Cantidad_encontrada': '={{ $json.cantidad_encontrada }}',
  'Cantidad_alternativas': '={{ $json.cantidad_alternativas }}',
};
workflow.nodes.push(decision, prepare, save);

// Replace parser output path with the decision; retain normal search unchanged.
workflow.connections['Interpretar mensaje Meta'] = { main: [[{ node: '¿Es mensaje de reserva?', type: 'main', index: 0 }]] };
workflow.connections['¿Es mensaje de reserva?'] = { main: [
  [{ node: 'Preparar reserva', type: 'main', index: 0 }],
  [{ node: 'SolicitudCliente', type: 'main', index: 0 }],
] };
workflow.connections['Preparar reserva'] = { main: [[
  { node: 'Guardar reserva', type: 'main', index: 0 },
  { node: 'Send message', type: 'main', index: 0 },
]] };
workflow.connections['Guardar reserva'] = { main: [[]] };

fs.writeFileSync('workflow-con-reservas.json', JSON.stringify(workflow, null, 2));
