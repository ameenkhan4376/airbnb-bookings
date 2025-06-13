const { MongoClient } = require('mongodb');
let client, listingsCol, bookingsCol;

async function connectDB(uri) {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db('sample_airbnb');
    listingsCol = db.collection('listingsAndReviews');
    bookingsCol = db.collection('bookings');
    // create indexes
    await listingsCol.createIndex({ 'address.market': 1 });
    await listingsCol.createIndex({ property_type: 1 });
    await listingsCol.createIndex({ bedrooms: 1 });
    await bookingsCol.createIndex({ listing_id: 1, start_date: 1, end_date: 1 });
  }
  return { client, listingsCol, bookingsCol };
}

module.exports = { connectDB };
