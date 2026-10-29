const fs = require('fs');
const imported = JSON.parse(fs.readFileSync('busqueda-verificada.json', 'utf8'));
const wf = Array.isArray(imported) ? imported[0] : imported;
const code = wf.nodes.find((node) => node.name === 'Code in JavaScript').parameters.jsCode;
const input = [
  { json: { 'IDENTIFICACIÓN': 1, Marca: 'Samsung', Modelo: 'A27', Precio: 2200, Stock: 3 } },
  { json: { 'IDENTIFICACIÓN': 2, Marca: 'Xiaomi', Modelo: 'Redmi Note 15', Precio: 1800, Stock: 2 } },
];
const request = { cliente: 'Prueba', producto: 'Tienes el A 27?', presupuesto: 0, wa_from: '59170000000' };
const run = new Function('$input', '$', code);
const result = run({ all: () => input }, (name) => ({ first: () => ({ json: request }) }));
console.log(JSON.stringify({active: wf.active, estado: result[0].json.estado, encontrados: result[0].json.productos.map((p) => `${p.marca} ${p.modelo}`)}, null, 2));
