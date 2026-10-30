// ---------- Modo claro / oscuro ----------
// Copiado de prueba-2.js: JS solo cambia data-theme en el <html> y el CSS
// (:root[data-theme="light"]) cambia las variables de color. Usa la misma
// clave "tema" en localStorage, así las dos páginas recuerdan el mismo tema
const btnTema = document.getElementById('btn-tema');

function aplicarTema(tema) {
  document.documentElement.dataset.theme = tema; // documentElement = la etiqueta <html>
  const etiqueta = tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  btnTema.textContent = tema === 'dark' ? '☀' : '☾';
  btnTema.setAttribute('aria-label', etiqueta);
  btnTema.title = etiqueta;
}

aplicarTema(localStorage.getItem('tema') || 'dark');

btnTema.addEventListener('click', () => {
  const nuevo = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  aplicarTema(nuevo);
  localStorage.setItem('tema', nuevo);
});

// ---------- Ojito de la contraseña ----------
// El truco: un input type="password" muestra puntitos y uno type="text"
// muestra las letras. Cambiar el type desde JS es todo lo que hace falta.
// previousElementSibling = el elemento justo antes del botón (el input)
document.querySelectorAll('.btn-ojo').forEach((boton) => {
  boton.addEventListener('click', () => {
    const input = boton.previousElementSibling;
    const mostrar = input.type === 'password';
    input.type = mostrar ? 'text' : 'password';
    // aria-pressed: le dice al CSS qué ícono mostrar y a los lectores de
    // pantalla si el botón está "activado"
    boton.setAttribute('aria-pressed', mostrar);
    boton.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });
});

// Muestra un formulario y oculta el otro con el atributo hidden — la
// misma idea que mostrarVista() en prueba-2.js. cual = 'login' o 'registro'
function mostrarFormulario(cual) {
  document.getElementById('vista-login').hidden = cual !== 'login';
  document.getElementById('vista-registro').hidden = cual !== 'registro';
}

// Los links "Crea una" / "Inicia sesión" dicen a dónde ir en data-ir
document.querySelectorAll('[data-ir]').forEach((boton) => {
  boton.addEventListener('click', () => mostrarFormulario(boton.dataset.ir));
});

async function registrarCliente(nombre, correo, contrasena) {

  // db.auth.signUp() NO toca ninguna tabla tuya todavía — habla directo con
  // el sistema de autenticación interno de Supabase (algo así como una
  // tabla especial, auth.users, que tú no administras a mano). Le mandas
  // correo y contraseña, y Supabase por detrás: valida el formato del
  // correo, guarda la contraseña de forma segura (nunca en texto plano),
  // y crea un identificador único nuevo (un uuid) para esta persona.
  //
  // El resultado llega en dos partes, igual que en todas las llamadas a
  // Supabase que ya conoces (data / error):
  //   - data.user   → los datos del usuario recién creado. data.user.id
  //                   es el uuid real — EL MISMO que vamos a usar como id
  //                   en clientes_practica, dos líneas más abajo.
  //   - data.session → si tu proyecto exige confirmar el correo antes de
  //                   dejar entrar (ver guía, sección 7), esto llega en
  //                   null: el usuario ya existe, pero todavía no hay
  //                   sesión iniciada hasta que confirme.
  const { data, error } = await db.auth.signUp({
    email: correo,
    password: contrasena,
  });

  // Mismo patrón de "revisar error antes de seguir" que ya usaste en el
  // CRUD de productos — si signUp() falló (correo repetido, contraseña
  // muy corta, etc.), ni siquiera intentamos el segundo paso.
  if (error) {
    console.log('Error al registrar:', error);
    return null;
  }

  // Ahora sí tocamos una tabla tuya: clientes_practica. Este insert() es
  // igual al que ya usaste en agregarProducto() — la única diferencia es
  // que aquí SÍ mandamos el id a mano (data.user.id), en vez de dejar que
  // Supabase lo autogenere, porque este id tiene que coincidir exactamente
  // con el que Auth le acaba de asignar al usuario.
  const { data: cliente, error: errorCliente } = await db
    .from('clientes_practica')
    .insert([{ id: data.user.id, nombre, correo, rol: 'cliente' }])
    .select();

  if (errorCliente) {
    console.log('Error al crear el perfil:', errorCliente);
    return null;
  }

  return cliente[0];
}

// 'submit' es el evento que dispara un <form> cuando alguien hace clic en
// su botón de tipo submit (o presiona Enter dentro de un campo). Por
// defecto, ese evento hace que el navegador RECARGUE la página entera —
// comportamiento heredado de cuando los formularios mandaban sus datos a
// otra página de servidor, décadas atrás. Como aquí todo lo manejamos con
// JavaScript (sin recargar nada), hay que apagar ese comportamiento a
// propósito.
document.getElementById('form-registro').addEventListener('submit', async (event) => {

  // event.preventDefault() le dice al navegador "no hagas lo que harías
  // normalmente con este evento" — en este caso, no recargues la página.
  // Sin esta línea, la página se refrescaría apenas se hiciera clic en
  // "Crear cuenta", y perderías cualquier mensaje que fueras a mostrar.
  event.preventDefault();

  // event.target es el elemento que disparó el evento — en un 'submit',
  // siempre es el propio <form>. Lo guardamos en una variable para poder
  // usarlo más abajo (form.reset()) sin tener que volver a buscarlo.
  const form = event.target;

  const cliente = await registrarCliente(
    document.getElementById('registro-nombre').value.trim(),
    document.getElementById('registro-correo').value.trim(),
    document.getElementById('registro-password').value
  );

  if (cliente) {
    document.getElementById('estado-sesion').textContent =
      'Cuenta creada. Ahora inicia sesión con ese correo y contraseña.';
    form.reset(); // vacía los 3 campos del formulario, para la próxima persona
    mostrarFormulario('login'); // el mensaje dice "ahora inicia sesión": lo llevamos ahí
  } else {
    document.getElementById('estado-sesion').textContent =
      'No se pudo crear la cuenta. Revisa la consola.';
  }
});

async function iniciarSesion(correo, contrasena) {

  // db.auth.signInWithPassword() es para alguien que YA se registró antes
  // (sección 4.1) — no crea ningún usuario nuevo, solo verifica que el
  // correo y la contraseña coincidan con uno que ya existe en Auth.
  //
  // Lo importante pasa "por detrás", sin que se vea en este código: si la
  // verificación sale bien, el cliente de Supabase (la variable db, la
  // misma de siempre) GUARDA la sesión internamente — normalmente en el
  // almacenamiento del navegador — y, desde este momento, la adjunta sola
  // a cada petición futura que hagas con db, sea a productos_practica, a
  // clientes_practica o a cualquier otra tabla. No hay que "pasarle" el
  // usuario a mano a ninguna otra función.
  const { data, error } = await db.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  });

  if (error) {
    console.log('Error al iniciar sesión:', error);
    return null;
  }

  // Aquí data.user también trae el id real del usuario — el mismo valor
  // que auth.uid() va a devolver dentro de cualquier política de RLS
  // mientras esta sesión siga activa.
  return data.user;
}

// Mismo patrón explicado en el formulario de registro: 'submit' es el
// evento del <form>, y hay que apagar la recarga automática de página.
document.getElementById('form-login').addEventListener('submit', async (event) => {
  event.preventDefault(); // evita que el navegador recargue la página
  const form = event.target; // el propio <form>, guardado para usar después

  const usuario = await iniciarSesion(
    document.getElementById('login-correo').value.trim(),
    document.getElementById('login-password').value
  );

  if (usuario) {
    form.reset();
    mostrarEstadoSesion(); // definida en la sección 5
  } else {
    document.getElementById('estado-sesion').textContent =
      'Correo o contraseña incorrectos.';
  }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
  await db.auth.signOut();
  mostrarEstadoSesion();
});

// ---------- Perfil del cliente (READ + UPDATE) ----------

// El id del cliente con sesión iniciada. Lo guarda mostrarEstadoSesion()
// después de leerlo, y lo usa el submit de "Guardar cambios" para saber
// QUÉ fila actualizar. null = no hay nadie con sesión.
let idClienteActual = null;

async function leerCliente(id) {
  // Mismo select() del READ de productos, pero filtrado con eq() a UNA
  // fila: la que tiene el mismo id que el usuario de Auth (es el id que
  // se guardó a mano en el insert() de registrarCliente).
  //
  // .single() → en vez de un array con 1 elemento ([{...}]), devuelve el
  // objeto directo ({...}). Si no encuentra ninguna fila (o encuentra
  // más de una), lo trata como error.
  const { data, error } = await db
    .from('clientes_practica')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.log('Error al leer el perfil:', error);
    return null;
  }

  return data;
}

function llenarFormularioPerfil(cliente) {
  // form.elements.nombre = el <input name="nombre"> de ese form.
  // ?? '' → si la columna viene en null (teléfono y dirección nunca se
  // llenaron en el registro), el campo queda vacío en vez de mostrar "null"
  const campos = document.getElementById('form-perfil').elements;
  campos.nombre.value = cliente.nombre ?? '';
  campos.telefono.value = cliente.telefono ?? '';
  campos.direccion.value = cliente.direccion ?? '';
  campos.correo.value = cliente.correo ?? '';
  campos.rol.value = cliente.rol ?? '';
}

// Vista Inicio (solo lectura): pone cada dato en su <dd> con textContent.
// || '—' → si el dato está vacío o en null, se ve un guion en vez de nada
function renderizarInicio(cliente) {
  document.getElementById('saludo-nombre').textContent = cliente.nombre || 'cliente';
  document.getElementById('dato-nombre').textContent = cliente.nombre || '—';
  document.getElementById('dato-correo').textContent = cliente.correo || '—';
  document.getElementById('dato-telefono').textContent = cliente.telefono || '—';
  document.getElementById('dato-direccion').textContent = cliente.direccion || '—';
  document.getElementById('dato-rol').textContent = cliente.rol || '—';

  // Círculo de perfil: la primera letra del nombre, en mayúscula.
  // charAt(0) = el primer carácter del texto
  document.getElementById('btn-perfil').textContent =
    (cliente.nombre || cliente.correo || '?').trim().charAt(0).toUpperCase();
  document.getElementById('menu-nombre').textContent = cliente.nombre || 'Cliente';
}

// ---------- Cambiar de vista ----------
// Mismo patrón que mostrarVista() en prueba-2.js: deja visible solo la
// <section class="vista"> cuyo data-vista coincide con el nombre
function mostrarVista(nombre) {
  document.querySelectorAll('section.vista').forEach((vista) => {
    vista.hidden = vista.dataset.vista !== nombre;
  });
  cerrarMenuPerfil(); // si se eligió desde el menú, el menú se cierra solo
}

// "Mi cuenta" y "Editar datos" del menú, y "Editar mis datos" en Inicio
document.querySelectorAll('[data-ir-vista]').forEach((boton) => {
  boton.addEventListener('click', () => mostrarVista(boton.dataset.irVista));
});

// ---------- Menú del círculo de perfil ----------
const btnPerfil = document.getElementById('btn-perfil');
const menuPerfil = document.getElementById('menu-perfil');

function abrirMenuPerfil() {
  menuPerfil.hidden = false;
  btnPerfil.setAttribute('aria-expanded', 'true');
}

function cerrarMenuPerfil() {
  menuPerfil.hidden = true;
  btnPerfil.setAttribute('aria-expanded', 'false');
}

btnPerfil.addEventListener('click', () => {
  if (menuPerfil.hidden) {
    abrirMenuPerfil();
  } else {
    cerrarMenuPerfil();
  }
});

// Clic FUERA del menú → se cierra. El listener va en todo el document, y
// contains() revisa si el clic cayó dentro de .perfil (el círculo o el
// menú). Si cayó dentro, no hacemos nada: eso lo maneja el listener de arriba
document.addEventListener('click', (event) => {
  if (!document.getElementById('perfil').contains(event.target)) {
    cerrarMenuPerfil();
  }
});

// Esc → se cierra, y el foco vuelve al círculo para que quien usa teclado
// no quede "perdido" en la página
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !menuPerfil.hidden) {
    cerrarMenuPerfil();
    btnPerfil.focus();
  }
});

async function actualizarCliente(id, cambios) {
  // Mismo patrón que el UPDATE de productos: update() dice QUÉ cambiar,
  // eq() dice EN CUÁL fila. Sin el eq(), intentaría cambiar todas.
  const { data, error } = await db
    .from('clientes_practica')
    .update(cambios)
    .eq('id', id)
    .select();

  if (error) {
    console.log('Error al actualizar el perfil:', error);
    return null;
  }

  // Si RLS no deja actualizar, Supabase NO devuelve error: solo actualiza
  // 0 filas y data llega vacío. Por eso hay que revisarlo aparte
  if (data.length === 0) {
    console.log('No se actualizó ninguna fila. ¿Falta una política de UPDATE (RLS) en clientes_practica?');
    return null;
  }

  return data[0];
}

document.getElementById('form-perfil').addEventListener('submit', async (event) => {
  event.preventDefault();
  const campos = event.target.elements;
  const mensaje = document.getElementById('notificacion-perfil');

  // Solo mandamos lo editable. correo y rol NO van aquí aunque estén en el
  // form: el correo de verdad vive en Auth, y el rol no lo decide el cliente.
  // || null → un campo vacío se guarda como null, igual que si nunca se llenó
  const cambios = {
    nombre: campos.nombre.value.trim(),
    telefono: campos.telefono.value.trim() || null,
    direccion: campos.direccion.value.trim() || null,
  };

  const cliente = await actualizarCliente(idClienteActual, cambios);

  if (cliente) {
    // Lo que quedó guardado de verdad en Supabase, en las dos vistas
    llenarFormularioPerfil(cliente);
    renderizarInicio(cliente);
    mensaje.className = 'message message--success';
    mensaje.textContent = 'Datos actualizados.';
  } else {
    mensaje.className = 'message message--error';
    mensaje.textContent = 'No se pudieron guardar los cambios. Revisa la consola.';
  }
});

// Decide qué se ve en la página según haya sesión o no. Se llama al
// cargar, después de iniciar sesión y después de cerrarla
async function mostrarEstadoSesion() {
  const { data } = await db.auth.getUser();
  const estado = document.getElementById('estado-sesion');
  const haySesion = Boolean(data.user);

  // Con sesión: vistas + círculo de perfil. Sin sesión: login/registro
  document.getElementById('zona-auth').hidden = haySesion;
  document.getElementById('zona-cuenta').hidden = !haySesion;
  document.getElementById('perfil').hidden = !haySesion;
  cerrarMenuPerfil(); // al cerrar sesión desde el menú, que no quede abierto
  // Borra los mensajes de la sesión anterior
  document.getElementById('notificacion-perfil').textContent = '';
  document.getElementById('notificacion-inicio').textContent = '';

  if (!haySesion) {
    idClienteActual = null;
    estado.textContent = 'No has iniciado sesión.';
    return;
  }

  // El correo sale de Auth, así el menú lo muestra aunque falle la lectura
  document.getElementById('menu-correo').textContent = data.user.email;

  // Siempre se entra por Inicio
  mostrarVista('inicio');

  // Primero LEER, después mostrar: las dos vistas se llenan con lo que hay
  // en Supabase, no con lo que se escribió en el login
  const cliente = await leerCliente(data.user.id);

  if (!cliente) {
    const aviso = document.getElementById('notificacion-inicio');
    aviso.className = 'message message--error';
    aviso.textContent = 'Iniciaste sesión, pero no se pudieron leer tus datos. Revisa la consola.';
    return;
  }

  idClienteActual = cliente.id;
  renderizarInicio(cliente);
  llenarFormularioPerfil(cliente);
}

// Al cargar la página, revisa si ya había una sesión activa
mostrarEstadoSesion();