// routes/listings.js

// Import Express to create a router instance
const express = require('express');
// Create a new router; all routes defined here will be mounted under the parent path (e.g. `/api/listings`)
const router = express.Router();

// Import the controller functions that contain the business logic
// for fetching markets, property types, lists of listings, and individual listing details
const c = require('../controllers/listingsController');

/**
 * GET /markets
 * Returns an array of all distinct 'address.market' values from the listings collection.
 * Handled by the `getMarkets` controller.
 */
router.get('/markets', c.getMarkets);

/**
 * GET /propertyTypes
 * Returns an array of all distinct 'property_type' values from the listings collection.
 * Handled by the `getPropertyTypes` controller.
 */
router.get('/propertyTypes', c.getPropertyTypes);

/**
 * GET /
 * Returns a list of listings. 
 * - If no query parameters are provided, returns a random sample of 10 listings.
 * - Otherwise, filters by `market`, `property_type`, and/or `bedrooms` as provided in the query string.
 * Handled by the `getListings` controller.
 */
router.get('/', c.getListings);

/**
 * GET /:id
 * Returns the details of a single listing identified by its `_id` field.
 * Expects `:id` to be the listing’s unique string key.
 * Handled by the `getListingById` controller.
 */
router.get('/:id', c.getListingById);

// Export the router so it can be mounted in app.js, e.g. `app.use('/api/listings', listingsRouter)`
module.exports = router;
