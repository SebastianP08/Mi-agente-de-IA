// Exercise file: Steps 3 and 4 of the guide.
// Depends on `db`, created in supabaseClient.js.
// Step 2 is NOT here: it is typed directly in the browser console.

// ---------------------------------------------------------------
// Step 3 — button + console only (kept commented for reference).
// Step 4 below replaces it: if both were active, every click would
// run two listeners and query Supabase twice.
// ---------------------------------------------------------------
/*
document.getElementById('btn-traer').addEventListener('click', async () => {
  const { data, error } = await db.from('productos_practica').select('*');
  console.log(data, error);
});
*/

// ---------------------------------------------------------------
// Step 4 — show raw data on screen
// ---------------------------------------------------------------
document.getElementById('btn-traer').addEventListener('click', async () => {

  // Mismo "async" que en el Paso 2: esta función necesita "await" para
  // esperar la respuesta real de Supabase antes de seguir.
  const { data, error } = await db.from('productos_practica').select('*');
  // ↑ El código se DETIENE en esta línea hasta que la base de datos
  //   responde. Compáralo con localStorage.getItem('productos'): esa
  //   llamada te devuelve el valor guardado EN EL MISMO INSTANTE, sin
  //   esperar nada, porque no sale de tu computador. Esta línea sí
  //   puede tardar (viaja a internet y vuelve) — por eso necesita await.

  console.log(data, error); // from Step 3: still useful for debugging

  if (error) {
    // Revisamos "error" ANTES de tocar "data": si la consulta falló,
    // "data" llega como null, y usar null más adelante (ej. null.map())
    // rompería el script.
    document.getElementById('resultado').textContent = 'Error: ' + error.message;
    return;
  }

  // JSON.stringify(data, null, 2) convierte el array completo a texto,
  // con sangría (el "2") para que se lea ordenado. Esta línea SÍ es
  // sincrónica (no necesita await).
  document.getElementById('resultado').textContent = JSON.stringify(data, null, 2);
});
