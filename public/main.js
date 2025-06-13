// main.js (client-side script)

// DEBUG – confirm this script loads in the browser
console.log('🐛 main.js loaded');

// Fetch an array of strings from the API and populate a <select> element
async function fetchAndFill(path, selectEl) {
  try {
    const res = await fetch(path);
    console.log('GET', path, '→', res.status);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();
    console.log(path, items);

    // Preserve the default option and clear the rest
    const defaultOpt = selectEl.querySelector('option').outerHTML;
    selectEl.innerHTML = defaultOpt;

    // Populate fetched items
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = item;
      selectEl.appendChild(opt);
    });
  } catch (err) {
    console.error('Error loading', path, err);
  }
}

// Fetch and render listings, based on form filters or random sample
async function loadListings(e) {
  if (e) e.preventDefault();
  const form = document.getElementById('filterForm');
  const params = new URLSearchParams(new FormData(form));

  const res = await fetch('/api/listings?' + params);
  const listings = await res.json();

  const results = document.getElementById('results');
  results.innerHTML = '';
  if (!listings.length) {
    results.innerHTML = '<li class="list-group-item">No results found.</li>';
    return;
  }

  listings.forEach(l => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerHTML = `
      <a href="bookings.html?listing_id=${l._id}" class="fw-bold">${l.name}</a>
      <span class="float-end">$${l.price}</span>
    `;
    results.appendChild(li);
  });
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🐛 DOMContentLoaded in main.js');
  const marketSelect = document.getElementById('marketSelect');
  console.log('🐛 marketSelect exists?', !!marketSelect);
  const typeSelect = document.getElementById('typeSelect');
  const form = document.getElementById('filterForm');

  // Populate dropdowns
  await fetchAndFill('/api/markets', marketSelect);
  await fetchAndFill('/api/propertyTypes', typeSelect);

  // Hook up form and initial load
  form.addEventListener('submit', loadListings);
  loadListings();
});
