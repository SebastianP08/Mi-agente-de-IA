// 3° Data functions: the only file that talks to the database.
// Depends on `supabaseClient` (2°).

const TABLE_NAME = "items";

// Read all rows, newest first
async function getItems() {
  const { data, error } = await supabaseClient
    .from(TABLE_NAME)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error reading items:", error.message);
    return [];
  }
  return data;
}

// Insert one row and return it
async function addItem(name) {
  const { data, error } = await supabaseClient
    .from(TABLE_NAME)
    .insert({ name: name })
    .select();

  if (error) {
    console.error("Error adding item:", error.message);
    return null;
  }
  return data[0];
}

//https://oyfpqeidrxikznocfrjs.supabase.co/rest/v1/productos_practica URL importante