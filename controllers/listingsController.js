// controllers/listingsController.js

// Import ObjectId if you ever need to convert string IDs to MongoDB ObjectId.
// (In this app, listing IDs remain strings, so ObjectId isn’t used below, but is available if needed.)
const { ObjectId } = require('mongodb');

/**
 * getMarkets
 * -----------
 * GET /api/listings/markets
 * Retrieves a list of all distinct markets (i.e., cities or regions)
 * in which Airbnb listings are available.
 */
async function getMarkets(req, res) {
  try {
    // Pull the MongoDB collection reference from app.locals (initialized in app.js)
    const { listingsCol } = req.app.locals.db;

    // Use MongoDB's distinct operator to fetch unique 'address.market' values
    const markets = await listingsCol.distinct('address.market');

    // Filter out any empty or null entries, then send as JSON array
    res.json(markets.filter(m => m));
  } catch (err) {
    // Log server-side for debugging
    console.error('Error in getMarkets:', err);
    // Respond with 500 Internal Server Error
    res.status(500).send('Error fetching markets');
  }
}

/**
 * getPropertyTypes
 * -----------------
 * GET /api/listings/propertyTypes
 * Retrieves a list of all distinct property types
 * (e.g., "Apartment", "House") from the listings.
 */
async function getPropertyTypes(req, res) {
  try {
    const { listingsCol } = req.app.locals.db;

    // Fetch distinct 'property_type' values
    const types = await listingsCol.distinct('property_type');

    // Remove any falsy values and return as JSON
    res.json(types.filter(t => t));
  } catch (err) {
    console.error('Error in getPropertyTypes:', err);
    res.status(500).send('Error fetching property types');
  }
}

/**
 * getListings
 * -----------
 * GET /api/listings
 * Returns either:
 *   - A random sample of 10 listings if no filters are provided, or
 *   - A filtered list based on 'market', 'property_type', and/or 'bedrooms'
 *
 * Query parameters (all optional):
 *   - market: string matching address.market
 *   - property_type: string matching property_type
 *   - bedrooms: integer matching bedrooms
 */
async function getListings(req, res) {
  try {
    const { listingsCol } = req.app.locals.db;
    const { market, property_type, bedrooms } = req.query;

    // Build an aggregation pipeline dynamically
    const pipeline = [];

    if (!market && !property_type && !bedrooms) {
      // No filters → return 10 random documents
      pipeline.push({ $sample: { size: 10 } });
    } else {
      // Build a $match stage based on provided query params
      const match = {};
      if (market)        match['address.market'] = market;
      if (property_type) match.property_type     = property_type;
      if (bedrooms)      match.bedrooms          = +bedrooms;   // convert to number
      pipeline.push({ $match: match });
    }

    // Project only the fields we need, converting 'price' from Decimal128 to double
    pipeline.push({
      $project: {
        _id:   1,                             // include the document ID for linking
        name:  1,                             // include listing name
        price: { $toDouble: '$price' }       // convert price field to JS Number
      }
    });

    // Execute the pipeline and return the result as JSON
    const results = await listingsCol.aggregate(pipeline).toArray();
    res.json(results);
  } catch (err) {
    console.error('Error in getListings:', err);
    res.status(500).send('Error fetching listings');
  }
}

/**
 * getListingById
 * --------------
 * GET /api/listing/:id
 * Fetches the details for a single listing specified by its `_id` (string).
 * Returns { name, price, description }.
 */
async function getListingById(req, res) {
  try {
    const { listingsCol } = req.app.locals.db;
    const id = req.params.id;  // the listing ID passed in the URL

    // Query for the specific document by its string `_id`
    // Project only the fields we need plus convert price to double
    const doc = await listingsCol.findOne(
      { _id: id },
      {
        projection: {
          name:        1,
          price:       { $toDouble: '$price' },
          description: 1  // include the full description text
        }
      }
    );

    // If no document was found, return 404 Not Found
    if (!doc) {
      return res.status(404).send('Listing not found');
    }

    // Otherwise, send the document as JSON
    res.json(doc);
  } catch (err) {
    console.error('Error in getListingById:', err);
    res.status(500).send('Error fetching listing');
  }
}

// Export all controller functions for use in the listings router
module.exports = {
  getMarkets,
  getPropertyTypes,
  getListings,
  getListingById
};
