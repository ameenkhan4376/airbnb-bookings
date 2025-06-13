require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const { MongoClient, ObjectId } = require('mongodb');
const { body, validationResult } = require('express-validator');

const app = express();

// Security & Logging
app.use(
  helmet({ contentSecurityPolicy: false })
);
app.use(morgan('dev'));

// Static files & body parsing
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB setup
const client = new MongoClient(process.env.DB_URI);
let listingsCol;
let bookingsCol;

async function startServer() {
  try {
    await client.connect();
    const db = client.db('sample_airbnb');
    listingsCol = db.collection('listingsAndReviews');
    bookingsCol = db.collection('bookings');
    console.log('✅ Connected to MongoDB');

    // Indexes for performance
    await listingsCol.createIndex({ 'address.market': 1 });
    await listingsCol.createIndex({ property_type: 1 });
    await listingsCol.createIndex({ bedrooms: 1 });
    await bookingsCol.createIndex({ listing_id: 1, start_date: 1, end_date: 1 });

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`🚀 Server listening on http://localhost:${port}`));
  } catch (err) {
    console.error('🔴 Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

// --- Routes ---

// GET distinct markets
app.get('/api/markets', async (req, res) => {
  try {
    const markets = await listingsCol.distinct('address.market');
    res.json(markets.filter(m => m));
  } catch (err) {
    console.error('Error in GET /api/markets:', err);
    res.status(500).send('Error fetching markets');
  }
});

// GET distinct property types
app.get('/api/propertyTypes', async (req, res) => {
  try {
    const types = await listingsCol.distinct('property_type');
    res.json(types.filter(t => t));
  } catch (err) {
    console.error('Error in GET /api/propertyTypes:', err);
    res.status(500).send('Error fetching property types');
  }
});

// GET listings (random sample or filtered)
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

    // Include _id for link generation and convert price
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        price: { $toDouble: '$price' }
      }
    });

    const results = await listingsCol.aggregate(pipeline).toArray();
    res.json(results);
  } catch (err) {
    console.error('Error in GET /api/listings:', err);
    res.status(500).send('Error fetching listings');
  }
});

// GET single listing by string ID
app.get('/api/listing/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const doc = await listingsCol.findOne(
      { _id: id },
      { projection: { name: 1, price: { $toDouble: '$price' } } }
    );
    if (!doc) return res.status(404).send('Listing not found');
    res.json(doc);
  } catch (err) {
    console.error('Error in GET /api/listing/:id:', err);
    res.status(500).send('Error fetching listing');
  }
});

// POST new booking (listing_id as string)
app.post(
  '/api/bookings',
  [
    body('listing_id').notEmpty(),
    body('guest_name').trim().notEmpty(),
    body('arrival').isISO8601(),
    body('departure').isISO8601(),
    body('contact').isEmail()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { listing_id, guest_name, arrival, departure, contact } = req.body;
    const session = client.startSession();

    try {
      let bookingResult;
      await session.withTransaction(async () => {
        // Overlap check
        const conflict = await bookingsCol.findOne(
          {
            listing_id: listing_id,
            $or: [
              {
                start_date: { $lt: new Date(departure) },
                end_date:   { $gt: new Date(arrival) }
              }
            ]
          },
          { session }
        );
        if (conflict) throw new Error('Selected dates overlap an existing booking');

        // Insert booking
        bookingResult = await bookingsCol.insertOne(
          {
            listing_id,
            guest_name,
            start_date: new Date(arrival),
            end_date:   new Date(departure),
            contact
          },
          { session }
        );
      });

      res.redirect(`/confirmation.html?booking_id=${bookingResult.insertedId}`);
    } catch (err) {
      console.error('Error in POST /api/bookings:', err);
      res.status(400).send(err.message);
    } finally {
      await session.endSession();
    }
  }
);

// GET single booking by ObjectId
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const bk = await bookingsCol.findOne({ _id: new ObjectId(req.params.id) });
    if (!bk) return res.status(404).send('Booking not found');
    res.json(bk);
  } catch (err) {
    console.error('Error in GET /api/bookings/:id:', err);
    res.status(500).send('Error fetching booking');
  }
});