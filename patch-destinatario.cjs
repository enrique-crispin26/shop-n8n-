const fs = require('fs');
const imported = JSON.parse(fs.readFileSync('verificar-final.json', 'utf8'));
const workflow = Array.isArray(imported) ? imported[0] : imported;
const node = (name) => workflow.nodes.find((n) => n.name === name);
const add = (target, name, value, type = 'string') => node(target).parameters.assignments.assignments.push({ id: crypto.randomUUID(), name, value, type });
add('SolicitudCliente', 'wa_from', '={{ $json.wa_from }}');
const code = node('Code in JavaScript');
code.parameters.jsCode = code.parameters.jsCode
  .replace('const presupuesto = Number(\n  solicitud.presupuesto ?? 0\n);', "const presupuesto = Number(\n  solicitud.presupuesto ?? 0\n);\n\nconst wa_from = String(solicitud.wa_from ?? '').replace(/\\D/g, '');")
  .replace('      cliente,\n      producto_buscado:', '      cliente,\n      wa_from,\n      producto_buscado:');
add('Preparar respuesta final', 'wa_from', "={{ $('Code in JavaScript').first().json.wa_from }}");
add('Preparar sin resultados', 'wa_from', '={{ $json.wa_from }}');
add('error de validación', 'wa_from', '={{ $json.wa_from }}');
node('Send message').parameters.recipientPhoneNumber = '={{ $json.wa_from }}';
fs.writeFileSync('workflow-meta-webhook-destinatario.json', JSON.stringify(workflow, null, 2));
