require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const express = require('express');
const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const client = new MongoClient(process.env.DB_URI);
(async () => {
  await client.connect();
  const db = client.db('sample_airbnb');
  const listings = db.collection('listingsAndReviews');
  const bookings = db.collection('bookings');
  console.log('DB connected');
  // Define your GET /api/listings, POST /api/bookings, etc.
})().catch(console.error);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));
