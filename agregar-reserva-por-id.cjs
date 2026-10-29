const fs = require('fs');
const crypto = require('crypto');
const imported = JSON.parse(fs.readFileSync('flujo-reserva-id-base.json', 'utf8'));
const workflow = Array.isArray(imported) ? imported[0] : imported;
const node = (name) => workflow.nodes.find((n) => n.name === name);
const id = () => crypto.randomUUID();

// Detect a standalone numeric ID before normal product-search handling.
const parser = node('Interpretar mensaje Meta');
parser.parameters.jsCode = parser.parameters.jsCode.replace(
  "const esReserva = /^(si|quiero reservar(?:lo|la)?|reserv(?:a|alo|ala)|me lo llevo|quiero (?:ese|este))\\b/.test(textoNormalizado);",
  "const esReserva = /^(si|quiero reservar(?:lo|la)?|reserv(?:a|alo|ala)|me lo llevo|quiero (?:ese|este))\\b/.test(textoNormalizado);\nconst idReserva = textoNormalizado.match(/^(?:id|identificacion)?\\s*(\\d{1,4})$/);"
);
parser.parameters.jsCode = parser.parameters.jsCode.replace(
  "if (esReserva) {",
  "if (idReserva) {\n  return [{ json: {\n    intent: 'reservar_por_id',\n    reservaId: idReserva[1],\n    wa_from: numero,\n    body: { cliente, producto: '', presupuesto: 0 },\n  } }];\n}\n\nif (esReserva) {"
);

const ifId = {
  id: id(), name: '¿Reserva por identificación?', type: 'n8n-nodes-base.if', typeVersion: 2.3, position: [-410, 1120],
  parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 3 }, conditions: [{ id: id(), leftValue: '={{ $json.intent }}', rightValue: 'reservar_por_id', operator: { type: 'string', operation: 'equals', name: 'filter.operator.equals' } }], combinator: 'and' }, options: {} },
};
const readId = {
  id: id(), name: 'Consultar inventario para reserva', type: 'n8n-nodes-base.googleSheets', typeVersion: 4.7, position: [-180, 1370],
  credentials: node('Get row(s) in sheet').credentials,
  parameters: JSON.parse(JSON.stringify(node('Get row(s) in sheet').parameters)),
};
const findId = {
  id: id(), name: 'Buscar producto para reserva', type: 'n8n-nodes-base.code', typeVersion: 2, position: [70, 1370],
  parameters: { jsCode: `const solicitud = $('Interpretar mensaje Meta').first().json;\nconst identificacionSolicitada = String(solicitud.reservaId ?? '').trim();\nconst productos = $input.all().map((item) => item.json);\nconst encontrado = productos.find((producto) =>\n  String(producto['IDENTIFICACIÓN'] ?? producto.ID ?? '').trim() === identificacionSolicitada &&\n  Number(producto.Stock ?? producto.Existencias ?? 0) > 0 &&\n  Number(producto.Precio ?? 0) > 0\n);\n\nconst cliente = solicitud.body?.cliente ?? 'Cliente';\nconst wa_from = solicitud.wa_from ?? '';\nif (!encontrado) {\n  return [{ json: {\n    intent: 'reserva_sin_contexto', reserva: null, wa_from,\n    body: { cliente, producto: '', presupuesto: 0 },\n  } }];\n}\n\nreturn [{ json: {\n  intent: 'reserva', wa_from,\n  body: { cliente, producto: String(encontrado.Modelo ?? ''), presupuesto: Number(encontrado.Precio ?? 0) },\n  reserva: {\n    identificacion: encontrado['IDENTIFICACIÓN'] ?? encontrado.ID,\n    marca: String(encontrado.Marca ?? ''),\n    modelo: String(encontrado.Modelo ?? ''),\n    precio: Number(encontrado.Precio ?? 0),\n    existencias: Number(encontrado.Stock ?? encontrado.Existencias ?? 0),\n  },\n} }];` },
};
workflow.nodes.push(ifId, readId, findId);
workflow.connections['Interpretar mensaje Meta'] = { main: [[{ node: '¿Reserva por identificación?', type: 'main', index: 0 }]] };
workflow.connections['¿Reserva por identificación?'] = { main: [
  [{ node: 'Consultar inventario para reserva', type: 'main', index: 0 }],
  [{ node: '¿Es mensaje de reserva?', type: 'main', index: 0 }],
] };
workflow.connections['Consultar inventario para reserva'] = { main: [[{ node: 'Buscar producto para reserva', type: 'main', index: 0 }]] };
workflow.connections['Buscar producto para reserva'] = { main: [[{ node: 'Preparar reserva', type: 'main', index: 0 }]] };
fs.writeFileSync('workflow-reserva-por-id.json', JSON.stringify(workflow, null, 2));
