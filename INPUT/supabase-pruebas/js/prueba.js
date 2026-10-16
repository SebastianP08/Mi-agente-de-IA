document.getElementById('btn-traer').addEventListener('click', async () => {
// "async" convierte esta función (el listener del clic) en una función
  // ASÍNCRONA: una función que PUEDE usar "await" adentro para esperar
  // algo que tarda, sin congelar el resto de la página mientras espera.
  //
  // Diferencia clave con localStorage (semana 7): localStorage.getItem()
  // y localStorage.setItem() son operaciones SINCRÓNICAS — ocurren al
  // instante, en tu propio computador, sin viajar a ningún lado. Por eso
  // nunca necesitaste "async"/"await" para leer o escribir en
  // localStorage. Una consulta a Supabase, en cambio, viaja por internet
  // hasta el servidor de Supabase y la respuesta tiene que volver — eso
  // toma un tiempo real (aunque sea poco), y JavaScript necesita una
  // forma explícita de decir "espera aquí a que llegue la respuesta".

  // "await" pausa la ejecución DE ESTA FUNCIÓN (no de toda la página)
  // hasta que la consulta a Supabase responda. Mientras tanto, el resto
  // de tu página sigue funcionando con normalidad — solo esta función
  // en particular se detiene en esta línea hasta tener respuesta real.
  const { data, error } = await db.from('productos_practica').select('*');
  // Sin "await" en la línea de arriba, "data" y "error" NO tendrían el
  // resultado todavía — tendrías una "Promise" (promesa) sin resolver,
  // no los datos reales. Eso es justo lo que "await" evita: te obliga
  // a esperar antes de seguir usando el resultado.

  console.log(data, error);

  if (error) {
    // Revisamos "error" ANTES de tocar "data": si la consulta falló,
    // "data" llega como null, y usar null más adelante (ej. null.map())
    // rompería el script.
    document.getElementById('resultado').textContent = 'Error: ' + error.message;
    return;
  }

  // JSON.stringify(data, null, 2) convierte el array completo a texto,
  // con sangría (el "2") para que se lea ordenado. Esta línea SÍ es
  // sincrónica (no necesita await) — ya no estamos esperando nada de
  // Supabase, solo transformando el array "data" que ya llegó.
  //document.getElementById('resultado').textContent = JSON.stringify(data, null, 2);

  renderGallery(data);
});

// Pequeños "formateadores": convierten el valor crudo de Supabase
// en algo legible para una persona.
// int8 → toLocaleString('es-CO') agrega los puntos de miles: 120000 → "$120.000"
const formatPrice = value => '$' + value.toLocaleString('es-CO');
// float8 guardado como fracción (0.15) → porcentaje (15%)
const formatPercent = value => Math.round(value * 100) + '%';

// Crea un elemento HTML con su clase y su texto en una sola línea.
// textContent (no innerHTML): así un texto de la BD nunca se interpreta como HTML
function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// La foto de la tarjeta. Si la URL no apunta a una imagen, el evento
// "error" la cambia por un recuadro gris con el nombre del producto,
// para que la tarjeta no quede con un ícono roto.
function createImage(product) {
  const placeholder = createEl('div', 'card-img card-img--empty', product.nombre);
  if (!product.Img_url) return placeholder;

  const img = createEl('img', 'card-img');
  img.src = product.Img_url;
  img.alt = product.nombre;
  img.loading = 'lazy'; // el navegador descarga la foto solo cuando va a aparecer en pantalla
  img.addEventListener('error', () => img.replaceWith(placeholder));
  return img;
}

// Una tarjeta = un <article> con: foto, nombre, descripción, precio,
// stock y categorías.
function createCard(product) {
  const card = createEl('article', 'card');
  // bool → si no está disponible, agregamos una clase para atenuar la tarjeta desde el CSS
  if (!product.disponible) card.classList.add('card--unavailable');

  card.appendChild(createImage(product));

  const body = createEl('div', 'card-body');
  body.appendChild(createEl('h2', 'card-title', product.nombre));
  // .trim() quita espacios y tabulaciones sobrantes al inicio/final del texto
  body.appendChild(createEl('p', 'card-desc', (product.descripcion || '').trim()));

  // Precio: si hay descuento, mostramos el precio final y el original tachado
  const price = createEl('p', 'card-price');
  if (product.descuento > 0) {
    const finalPrice = Math.round(product.precio * (1 - product.descuento));
    price.appendChild(createEl('span', 'price-final', formatPrice(finalPrice)));
    price.appendChild(createEl('s', 'price-original', formatPrice(product.precio)));
    price.appendChild(createEl('span', 'badge badge--discount', '-' + formatPercent(product.descuento)));
  } else {
    price.appendChild(createEl('span', 'price-final', formatPrice(product.precio)));
  }
  body.appendChild(price);

  const stockText = product.disponible
    ? product.unidades + ' unidades disponibles'
    : 'No disponible';
  body.appendChild(createEl('p', 'card-stock', stockText));

  // json → Supabase lo entrega ya convertido en array de JS: lo recorremos con forEach
  const tags = createEl('ul', 'card-tags');
  (Array.isArray(product.categorias) ? product.categorias : []).forEach(category => {
    tags.appendChild(createEl('li', 'tag', category));
  });
  body.appendChild(tags);

  card.appendChild(body);
  return card;
}

function renderGallery(products) {
  const container = document.getElementById('resultado');
  container.innerHTML = '';

  if (products.length === 0) {
    container.textContent = 'No hay productos.';
    return;
  }

  const gallery = createEl('div', 'gallery');
  products.forEach(product => gallery.appendChild(createCard(product)));
  container.appendChild(gallery);
}
