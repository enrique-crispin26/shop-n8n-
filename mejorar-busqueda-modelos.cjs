const fs = require('fs');
const imported = JSON.parse(fs.readFileSync('busqueda-actual.json', 'utf8'));
const workflow = Array.isArray(imported) ? imported[0] : imported;
const node = workflow.nodes.find((n) => n.name === 'Code in JavaScript');
if (!node) throw new Error('No se encontró Code in JavaScript');
node.parameters.jsCode = `// Busca productos aunque el cliente escriba "A27", "A 27" o "tienes el A 27".
const productosSheets = $input.all().map((item) => item.json);
const solicitud = $('SolicitudCliente').first().json;

const cliente = String(solicitud.cliente ?? '').trim();
const consultaOriginal = String(solicitud.producto ?? '').trim();
const presupuesto = Number(solicitud.presupuesto ?? 0);
const wa_from = String(solicitud.wa_from ?? '').replace(/\\D/g, '');

const palabrasIgnoradas = new Set([
  'hola', 'buenas', 'busco', 'quiero', 'necesito', 'me', 'interesa',
  'tienes', 'tiene', 'tendras', 'hay', 'el', 'la', 'los', 'las', 'un', 'una',
  'por', 'favor', 'dame', 'disponible', 'disponibles', 'precio', 'de', 'para',
  'con', 'quiero', 'modelo'
]);

function palabras(valor) {
  return String(valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\\s+/)
    .filter((palabra) => palabra && !palabrasIgnoradas.has(palabra));
}

function clave(valor) {
  return palabras(valor).join('');
}

const consultaPalabras = palabras(consultaOriginal);
const claveConsulta = consultaPalabras.join('');

const inventario = productosSheets.map((producto) => ({
  identificacion: producto['IDENTIFICACIÓN'] ?? producto.ID ?? null,
  marca: String(producto.Marca ?? '').trim(),
  modelo: String(producto.Modelo ?? '').trim(),
  precio: Number(producto.Precio ?? 0),
  existencias: Number(producto.Stock ?? producto.Existencias ?? 0),
}));

const tienePresupuesto = presupuesto > 0;
const disponibles = inventario.filter((producto) =>
  producto.precio > 0 &&
  producto.existencias > 0 &&
  (!tienePresupuesto || producto.precio <= presupuesto),
);

function puntaje(producto) {
  const marcaClave = clave(producto.marca);
  const modeloClave = clave(producto.modelo);
  const combinado = marcaClave + modeloClave;
  const palabrasProducto = new Set([...palabras(producto.marca), ...palabras(producto.modelo)]);

  // Coincidencias de modelo/marca normalizadas: A27 = A 27.
  if (claveConsulta && (modeloClave === claveConsulta || combinado === claveConsulta)) return 100;
  if (claveConsulta && (modeloClave.includes(claveConsulta) || combinado.includes(claveConsulta))) return 95;
  if (claveConsulta && claveConsulta.includes(modeloClave) && modeloClave.length >= 2) return 85;

  const coincidencias = consultaPalabras.filter((palabra) => palabrasProducto.has(palabra)).length;
  const proporcion = consultaPalabras.length ? coincidencias / consultaPalabras.length : 0;
  if (coincidencias >= 2 && proporcion >= 0.6) return 60 + coincidencias;
  if (consultaPalabras.length === 1 && coincidencias === 1) return 40;
  return 0;
}

const evaluados = disponibles.map((producto) => ({ ...producto, _puntaje: puntaje(producto) }));
const coincidencias = evaluados
  .filter((producto) => producto._puntaje > 0)
  .sort((a, b) => b._puntaje - a._puntaje || a.precio - b.precio)
  .map(({ _puntaje, ...producto }) => producto);

const idsCoincidentes = new Set(coincidencias.map((producto) => producto.identificacion));
const alternativas = evaluados
  .filter((producto) => !idsCoincidentes.has(producto.identificacion))
  .sort((a, b) => a.precio - b.precio)
  .map(({ _puntaje, ...producto }) => producto);

const productosEncontrados = coincidencias.slice(0, 3);
const productosAlternativos = alternativas.slice(0, 3);
const estado = productosEncontrados.length > 0
  ? 'encontrado'
  : productosAlternativos.length > 0
    ? 'solo_alternativas'
    : 'sin_resultados';

return [{
  json: {
    cliente,
    wa_from,
    producto_buscado: consultaOriginal,
    presupuesto,
    estado,
    cantidad_encontrada: productosEncontrados.length,
    productos: productosEncontrados,
    cantidad_alternativas: productosAlternativos.length,
    alternativas: productosAlternativos,
  },
}];`;
fs.writeFileSync('workflow-busqueda-normalizada.json', JSON.stringify(workflow, null, 2));
