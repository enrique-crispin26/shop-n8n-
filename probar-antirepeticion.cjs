const fs = require('fs');
const imported = JSON.parse(fs.readFileSync('workflow-antirepeticion.json', 'utf8'));
const wf = Array.isArray(imported) ? imported[0] : imported;
const code = wf.nodes.find((n) => n.name === 'Interpretar mensaje Meta').parameters.jsCode;
const mem = {};
function event(id, secondsAgo) {
  return { body: { entry: [{ changes: [{ value: { contacts: [{ profile: { name: 'Prueba' } }], messages: [{ id, timestamp: String(Math.floor(Date.now()/1000) - secondsAgo), from: '59170000000', type: 'text', text: { body: 'Busco Samsung A27' } }] } }] }] } };
}
const run = new Function('$json', '$getWorkflowStaticData', code);
const staticData = () => mem;
const first = run(event('abc', 0), staticData);
const repeated = run(event('abc', 0), staticData);
const old = run(event('old', 601), staticData);
console.log(JSON.stringify({primero:first.length,repetido:repeated.length,antiguo:old.length,memoria:mem.whatsappIdsProcesados}, null, 2));
