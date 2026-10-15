// 4° Page logic: connects the HTML with the data functions.
// Depends on `getItems()` and `addItem()` (3°).

const itemForm = document.getElementById("item-form");
const itemInput = document.getElementById("item-name");
const itemList = document.getElementById("item-list");

// Draw the list from an array of items
function renderItems(items) {
  itemList.innerHTML = "";

  if (items.length === 0) {
    itemList.innerHTML = "<li>No items yet.</li>";
    return;
  }

  items.forEach(function (item) {
    const li = document.createElement("li");
    li.textContent = item.name; // textContent, not innerHTML: avoids injecting HTML from the DB
    itemList.appendChild(li);
  });
}

async function loadItems() {
  const items = await getItems();
  renderItems(items);
}

itemForm.addEventListener("submit", async function (event) {
  event.preventDefault(); // stop the page from reloading

  const name = itemInput.value.trim();
  if (name === "") return;

  const newItem = await addItem(name);
  if (newItem) {
    itemInput.value = "";
    loadItems();
  }
});

// Load the list as soon as the page opens
loadItems();
