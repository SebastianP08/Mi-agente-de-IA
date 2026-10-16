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
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);