// services/db.js

/**
 * This module handles connecting to the MongoDB database and
 * provides access to the `listingsAndReviews` and `bookings` collections,
 * ensuring indexes are created only once on initial connection.
 */

const { MongoClient } = require('mongodb');

// These variables will be initialized on the first call to connectDB()
// and then reused for subsequent calls to avoid reconnecting.
let client;
let listingsCol;
let bookingsCol;

/**
 * connectDB
 * ----------
 * Connects to the MongoDB server at the given URI (only once),
 * selects the `sample_airbnb` database, sets up the two main collections,
 * and ensures the necessary indexes exist.
 *
 * @param {string} uri - The MongoDB connection string (from .env).
 * @returns {Promise<{client: MongoClient, listingsCol: Collection, bookingsCol: Collection}>}
 *   An object containing the MongoClient instance and the two collection handles.
 */
async function connectDB(uri) {
  // If we haven't yet created a client, do so and connect
  if (!client) {
    // 1) Instantiate a new MongoClient with the provided URI
    client = new MongoClient(uri);

    // 2) Establish the connection to the MongoDB server
    await client.connect();

    // 3) Select the `sample_airbnb` database
    const db = client.db('sample_airbnb');

    // 4) Get handles to our two collections
    listingsCol = db.collection('listingsAndReviews');
    bookingsCol = db.collection('bookings');

    // 5) Create indexes to optimize query performance
    //    - Index on 'address.market' for filtering by city/region
    await listingsCol.createIndex({ 'address.market': 1 });
    //    - Index on 'property_type' for filtering by type (House, Apartment, etc.)
    await listingsCol.createIndex({ property_type: 1 });
    //    - Index on 'bedrooms' for filtering by number of bedrooms
    await listingsCol.createIndex({ bedrooms: 1 });
    //    - Compound index on bookings to speed up overlap checks and lookups
    await bookingsCol.createIndex({ listing_id: 1, start_date: 1, end_date: 1 });
  }

  // Return the connected client and collection references
  return { client, listingsCol, bookingsCol };
}

// Export the connectDB function so other modules (e.g. app.js) can initialize the DB
module.exports = { connectDB };
