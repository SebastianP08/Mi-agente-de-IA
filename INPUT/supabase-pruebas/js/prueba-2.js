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
    // rompería el script. Mismo patrón de "validar antes de operar"
    // que ya usaste en el CRUD de la semana 7.
    document.getElementById('resultado').textContent = 'Error: ' + error.message;
    return;
  }

  // JSON.stringify(data, null, 2) convierte el array completo a texto,
  // con sangría (el "2") para que se lea ordenado. Esta línea SÍ es
  // sincrónica (no necesita await) — ya no estamos esperando nada de
  // Supabase, solo transformando el array "data" que ya llegó.
  document.getElementById('resultado').textContent = JSON.stringify(data, null, 2);

  const nombres = data.map(producto => producto.nombre);
  // nombres es ahora un array de solo strings:
  // ["Audífonos Bluetooth X200", "Camiseta Básica Algodón", "Silla Gamer ProMax"]
  // — ya no objetos completos

  document.getElementById('resultado2').innerHTML =
    '<ul>' + nombres.map(n => `<li>${n}</li>`).join('') + '</ul>';

  const descripcion = data.map(producto => producto.descripcion);
  // nombres es ahora un array de solo strings:
  // ["Audífonos Bluetooth X200", "Camiseta Básica Algodón", "Silla Gamer ProMax"]
  // — ya no objetos completos

  document.getElementById('descripcion').innerHTML =
    '<ul>' + descripcion.map(n => `<li>${n}</li>`).join('') + '</ul>';


  const precio = data.map(producto => producto.precio);
  // nombres es ahora un array de solo strings:
  // ["Audífonos Bluetooth X200", "Camiseta Básica Algodón", "Silla Gamer ProMax"]
  // — ya no objetos completos

  document.getElementById('precio').innerHTML =
    '<ul>' + precio.map(n => `<li>${n}</li>`).join('') + '</ul>';
});
// ↑ Aquí termina el listener de "Traer". Todo lo de abajo queda AFUERA,
// así se registra una sola vez al cargar la página.

  //crud
  // productoPrueba ya no se usa: ahora los datos salen del formulario.
  // Se deja comentado como referencia de la forma que espera la tabla.
  // const productoPrueba = {
  //   nombre: "Zelda Tears Of The Kingdom",
  //   descripcion: "Esto es un producto de prueba",
  //   precio: 300000,
  //   unidades: 10,
  //   descuento: 0.1,
  //   disponible: true,
  //   categorias: ["videojuego", "accion", "aventura"],
  //   Img_url: "https://upload.wikimedia.org/wikipedia/en/f/fb/The_Legend_of_Zelda_Tears_of_the_Kingdom_cover.jpg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original"
  // }

    // AHORA (Supabase):
    async function agregarProducto(datos) {

    const { data, error } = await db
        .from('productos_practica')  // la tabla
        .insert([datos])             // insert() siempre recibe un ARRAY de objetos,
                                    // aunque insertes uno solo
        .select();                    // .select() le pide a Supabase que te
                                    // devuelva la fila ya creada (con su id
                                    // nuevo) — sin esto, insert() no te
                                    // devuelve nada útil

    if (error) {
        console.log("Error al agregar:", error);
        return null;
    }

    return data[0];   // data siempre es un array — tomamos el primer
                        // elemento, que es la fila recién creada
    }

    const form = document.getElementById("form-producto");

    // "submit" se dispara al hacer clic en el botón del form O al dar Enter
    form.addEventListener("submit", async (e) => {
        // Sin esto, el form recarga la página y se pierde todo
        e.preventDefault();

        // Los inputs SIEMPRE devuelven strings ("300" no 300), por eso
        // hay que convertir cada valor al tipo que espera la tabla
        const newProduct = {
            nombre: form.nombre.value.trim(),
            descripcion: form.descripcion.value.trim(),
            precio: Number(form.precio.value),
            unidades: Number(form.unidades.value),
            descuento: Number(form.descuento.value) / 100,   // 10 (%) → 0.1
            disponible: form.disponible.checked,              // checkbox: true/false, no .value
            categorias: form.categorias.value
                .split(",")                                   // "a, b" → ["a", " b"]
                .map(c => c.trim())                           // → ["a", "b"]
                .filter(c => c !== ""),                       // quita vacíos si sobra una coma
            Img_url: form.Img_url.value.trim()
        };

        const respuesta = await agregarProducto(newProduct);
        if (respuesta){
            document.getElementById("notificacion").textContent = "Producto agregado con ID: " + respuesta.id;
            form.reset();   // limpia los campos para el siguiente producto
        }else{
            document.getElementById("notificacion").textContent = "Error al agregar el producto. Revisa la consola.";
        }
    });
    // ↑ Aquí termina el listener de "agregar". Las funciones de búsqueda
    // van AFUERA para que cualquier otro listener pueda usarlas.

        async function buscarProductoPorId(id) {
        const { data, error } = await db

        
            .from('productos_practica')
            .select('*')
            .eq('id', id)    // eq = "equal" (igual a) — equivalente a find(p => p.id === id)
            .single();         // single() = "espero exactamente una fila, dámela
                                // como objeto, no como array de un elemento"

        if (error) return null;
        return data;
        }

        async function buscarProductosPorNombre(texto) {
        const { data, error } = await db
            .from('productos_practica')
            .select('*')
            .ilike('nombre', `%${texto}%`);
            // ilike = "like" insensible a mayúsculas/minúsculas.
            // los símbolos % significan "cualquier texto antes/después" —
            // equivalente a .toLowerCase().includes(texto)

        if (error) return [];
        return data;
        }

    const formBuscar = document.getElementById("form-buscar");

    formBuscar.addEventListener("submit", async (e) => {
        e.preventDefault();   // igual que en agregar: evita que se recargue la página

        const texto = formBuscar.texto.value.trim();
        const productos = await buscarProductosPorNombre(texto);

        const contenedor = document.getElementById("resultado-busqueda");
        if (productos.length === 0) {
            contenedor.textContent = "No se encontraron productos.";
            return;
        }

        contenedor.innerHTML =
            '<ul>' + productos.map(p => `<li>${p.nombre} — $${p.precio}</li>`).join('') + '</ul>';
    });
