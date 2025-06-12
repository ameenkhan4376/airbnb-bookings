require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); // for parsing form data

// MongoDB connection setup
const client = new MongoClient(process.env.DB_URI);
let listingsCol, bookingsCol;

async function start() {
  await client.connect();
  const db = client.db('sample_airbnb');
  listingsCol = db.collection('listingsAndReviews');
  bookingsCol = db.collection('bookings');
  console.log('✅ Connected to MongoDB');

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🚀 Server listening on http://localhost:${port}`));
}

start().catch(err => {
  console.error('🔴 Failed to start server:', err);
  process.exit(1);
});

// GET distinct markets for dropdown
app.get('/api/markets', async (req, res) => {
  try {
    const markets = await listingsCol.distinct('address.market');
    res.json(markets.filter(m => m)); // remove empty strings
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching markets');
  }
});

// GET listings (random sample if no filters, else apply filters)
app.get('/api/listings', async (req, res) => {
  try {
    const { market, property_type, bedrooms } = req.query;
    const pipeline = [];

    if (!market && !property_type && !bedrooms) {
      pipeline.push({ $sample: { size: 10 } });
    } else {
      const match = {};
      if (market)        match['address.market'] = market;
      if (property_type) match.property_type     = property_type;
      if (bedrooms)      match.bedrooms          = +bedrooms;
      pipeline.push({ $match: match });
    }

    pipeline.push({
      $project: {
        name: 1,
        price: { $toDouble: '$price' }
      }
    });

    const results = await listingsCol.aggregate(pipeline).toArray();
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching listings');
  }
});

// GET a single listing by ID
app.get('/api/listing/:id', async (req, res) => {
  try {
    const doc = await listingsCol.findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: { name: 1, price: { $toDouble: '$price' } } }
    );
    if (!doc) return res.status(404).send('Listing not found');
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching listing');
  }
});

// POST create a new booking
app.post('/api/bookings', async (req, res) => {
  try {
    const { listing_id, guest_name, arrival, departure, contact } = req.body;
    const booking = {
      listing_id: new ObjectId(listing_id),
      guest_name,
      start_date: new Date(arrival),
      end_date:   new Date(departure),
      contact
    };
    const result = await bookingsCol.insertOne(booking);
    res.redirect(`/confirmation.html?booking_id=${result.insertedId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating booking');
  }
});

// GET a single booking by ID
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const bk = await bookingsCol.findOne({ _id: new ObjectId(req.params.id) });
    if (!bk) return res.status(404).send('Booking not found');
    res.json(bk);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching booking');
  }
});
