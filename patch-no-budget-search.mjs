import { readFile, writeFile } from 'node:fs/promises';

const source = JSON.parse(await readFile('n8n-integracion-meta/respaldo-buscador-20260907-sin-presupuesto.json', 'utf8'));
const workflow = Array.isArray(source) ? source[0] : source;

const validation = workflow.nodes.find((node) => node.name === 'If');
validation.parameters.conditions.conditions = validation.parameters.conditions.conditions
  .filter((condition) => condition.id !== '7cf36d37-1c2a-4af5-acfc-23f9b28c5a9c');

const search = workflow.nodes.find((node) => node.name === 'Code in JavaScript');
search.parameters.jsCode = search.parameters.jsCode.replace(
  "const disponibles = inventario.filter(producto =>\n  producto.precio > 0 &&\n  producto.precio <= presupuesto &&\n  producto.existencias > 0\n);",
  "const tienePresupuesto = presupuesto > 0;\n\nconst disponibles = inventario.filter(producto =>\n  producto.precio > 0 &&\n  producto.existencias > 0 &&\n  (!tienePresupuesto || producto.precio <= presupuesto)\n);",
);

const invalid = workflow.nodes.find((node) => node.name === 'error de validación');
const message = invalid.parameters.assignments.assignments.find((assignment) => assignment.name === 'respuesta_final');
message.value = 'Por favor indícame qué equipo o accesorio buscas para revisar nuestro inventario.';

await writeFile('workflow-no-budget-search.json', JSON.stringify([workflow], null, 2));
