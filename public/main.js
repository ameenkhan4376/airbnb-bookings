// public/main.js

/**
 * Main client-side script for the AirBnB Listings page.
 * Responsibilities:
 *  1. Confirm script has loaded (debug)
 *  2. Fetch and populate filter dropdowns (markets & property types)
 *  3. Fetch and render listings based on filter criteria
 *  4. Wire up form submission to refresh the listings
 */

// DEBUG – confirm this script file is being executed in the browser console
console.log(' main.js loaded');

/**
 * Fetch an array of strings from a given API endpoint and populate a <select> element.
 *
 * @param {string} path       - The API URL path to fetch (e.g. '/api/listings/markets').
 * @param {HTMLSelectElement} selectEl - The <select> element to populate.
 */
async function fetchAndFill(path, selectEl) {
  try {
    // Issue the GET request to the API
    const res = await fetch(path);
    console.log('GET', path, '→', res.status);

    // If the response is not OK (status code outside 200–299), throw to be caught below
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Parse the JSON payload (expected to be an array of strings)
    const items = await res.json();
    console.log(path, items);

    // Preserve the first <option> (default blank choice), then clear all others
    const defaultOpt = selectEl.querySelector('option').outerHTML;
    selectEl.innerHTML = defaultOpt;

    // For each item (e.g. "Paris", "Apartment"), create and append an <option>
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = item;
      selectEl.appendChild(opt);
    });
  } catch (err) {
    // Log any errors (network issues, JSON parse errors, etc.)
    console.error('Error loading', path, err);
  }
}

/**
 * Fetch filtered listings from the server and render them into the page.
 *
 * @param {Event} [e] - The form submit event (if triggered via submission).
 */
async function loadListings(e) {
  // Prevent the default form submission behavior (which would reload the page)
  if (e) e.preventDefault();

  // Grab the form element and serialize its fields into URLSearchParams
  const form = document.getElementById('filterForm');
  const params = new URLSearchParams(new FormData(form));

  // Fetch listings matching the filter criteria
  const res = await fetch('/api/listings?' + params);
  const listings = await res.json();

  // Locate the <ul> container for results and clear any previous entries
  const results = document.getElementById('results');
  results.innerHTML = '';

  // If no listings are returned, show a friendly “no results” message
  if (!listings.length) {
    results.innerHTML = '<li class="list-group-item">No results found.</li>';
    return;
  }

  // For each listing object { _id, name, price }, create a styled list item
  listings.forEach(l => {
    const li = document.createElement('li');
    li.className = 'list-group-item';

    // Build the inner HTML: a link to the booking page and a price span
    li.innerHTML = `
      <a href="bookings.html?listing_id=${l._id}" class="fw-bold">
        ${l.name}
      </a>
      <span class="float-end">$${l.price}</span>
    `;

    // Append the fully populated <li> to the results list
    results.appendChild(li);
  });
}

// ------------------------------------------------------------
// Initialize behavior after the DOM content is fully loaded:
// 1. Populate the market and property-type dropdowns
// 2. Attach the form submit handler to reload listings
// 3. Perform an initial load to show random listings
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🐛 DOMContentLoaded in main.js');

  // Cache references to the <select> and <form> elements
  const marketSelect = document.getElementById('marketSelect');
  const typeSelect   = document.getElementById('typeSelect');
  const form         = document.getElementById('filterForm');

  // Populate the filters from their respective API endpoints
  await fetchAndFill('/api/listings/markets',       marketSelect);
  await fetchAndFill('/api/listings/propertyTypes', typeSelect);

  // When the user submits the form, call loadListings()
  form.addEventListener('submit', loadListings);

  // Perform an initial listings load (random sample) on page load
  loadListings();
});
