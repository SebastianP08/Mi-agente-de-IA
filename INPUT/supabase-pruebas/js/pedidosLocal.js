// =====================================================================
// pedidosLocal.js — pedidos guardados en localStorage (TEMPORAL).
//
// Mientras no conectemos las tablas de sql/pedidos.sql, los pedidos viven
// en el navegador. Cada función devuelve { data, error }, la MISMA forma
// que devuelve Supabase. Así, el día que conectemos, solo se cambia el
// cuerpo de cada función por la consulta a db (va comentada al lado) y
// pago.js, pedido.js y admin.js no se enteran.
//
// Ojo: localStorage es de ESTE navegador. Si abres la página en otro
// navegador o en el celular, no vas a ver estos pedidos.
// La usan: pago.html, pedido.html y admin.html
// =====================================================================

const CLAVE_PEDIDOS = 'pedidos';

function leerPedidosGuardados() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_PEDIDOS)) ?? [];
  } catch (_) {
    return [];
  }
}

function guardarPedidos(lista) {
  localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(lista));
}

// Crea el pedido con sus items.
// Supabase: insert en pedidos_practica → .select().single(), y después
// insert en pedido_items_practica con el pedido_id (ver crearPedido en pago.js)
async function crearPedidoLocal(datos, items) {
  try {
    const pedidos = leerPedidosGuardados();

    // El id lo inventamos nosotros: el más alto + 1. En Supabase lo pone
    // la base de datos sola (generated always as identity)
    const id = pedidos.reduce((max, p) => Math.max(max, p.id), 0) + 1;

    const pedido = {
      id,
      estado: 'pagado',
      created_at: new Date().toISOString(), // en Supabase: default now()
      preparando_at: null,
      en_camino_at: null,
      entregado_at: null,
      ...datos, // "..." copia todas las propiedades de datos aquí adentro
      // Mismo nombre que devuelve el select anidado de Supabase, así
      // pedido.js lee los items igual en los dos casos
      pedido_items_practica: items.map((item, i) => ({ id: i + 1, pedido_id: id, ...item })),
    };

    pedidos.push(pedido);
    guardarPedidos(pedidos);
    return { data: pedido, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Todos los pedidos, el más reciente primero.
// Supabase: db.from('pedidos_practica').select('*, pedido_items_practica(*)').order('created_at', { ascending: false })
async function listarPedidosLocal() {
  const lista = leerPedidosGuardados()
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { data: lista, error: null };
}

// Un solo pedido por id (null si no existe).
// Supabase: ...select('*, pedido_items_practica(*)').eq('id', id).maybeSingle()
async function leerPedidoLocal(id) {
  // El id llega como texto desde la URL ("5"): Number() lo vuelve número
  const pedido = leerPedidosGuardados().find((p) => p.id === Number(id)) ?? null;
  return { data: pedido, error: null };
}

// Cambia la etapa y pone la fecha de esa etapa.
// En Supabase la fecha la pone el trigger marcar_fecha_estado(); aquí lo
// imitamos a mano. Supabase: db.from('pedidos_practica').update({ estado }).eq('id', id).select()
async function cambiarEstadoLocal(id, estado) {
  const pedidos = leerPedidosGuardados();
  const pedido = pedidos.find((p) => p.id === Number(id));
  if (!pedido) return { data: [], error: null }; // como Supabase: 0 filas actualizadas

  const campoFecha = { preparando: 'preparando_at', en_camino: 'en_camino_at', entregado: 'entregado_at' }[estado];
  pedido.estado = estado;
  if (campoFecha && !pedido[campoFecha]) pedido[campoFecha] = new Date().toISOString();

  guardarPedidos(pedidos);
  return { data: [pedido], error: null };
}
