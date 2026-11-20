// 2° Creates the Supabase client.
// Depends on the CDN library (1°), which defines the global `supabase` object.

// Find these in Supabase: Project Settings → API
const SUPABASE_URL = "https://oyfpqeidrxikznocfrjs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZnBxZWlkcnhpa3pub2NmcmpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwODg1NDgsImV4cCI6MjEwNzY2NDU0OH0.YqZX2aN1mT4SuSIJhqFiFX4DrpbzlXXWHB_IIJMiFaE";

// El script del CDN crea una variable global "supabase" que trae
// la función createClient(). La usamos para crear NUESTRO propio
// cliente, y lo guardamos en una variable con otro nombre (db) para
// no confundirla con el objeto global de la librería.
const { createClient } = supabase;

// Sesiones separadas para admin y cliente.
// Por defecto Supabase guarda UNA sola sesión por sitio en localStorage
// (clave sb-<proyecto>-auth-token): el último que inicia sesión pisa la
// sesión de todas las páginas, y admin y cliente se cruzan.
// Con storageKey cada lado guarda su sesión en su propia clave:
//   admin.html            → 'sb-admin-auth'
//   el resto de páginas   → 'sb-cliente-auth'
// Así se puede tener el admin y un cliente abiertos a la vez en el mismo navegador.
const isAdminPage = /\/admin(\.html)?$/.test(location.pathname);
const AUTH_STORAGE_KEY = isAdminPage ? 'sb-admin-auth' : 'sb-cliente-auth';

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storageKey: AUTH_STORAGE_KEY },
});