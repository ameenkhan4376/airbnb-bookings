require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const morgan  = require('morgan');

const { connectDB }      = require('./services/db');
const listingsRoutes    = require('./routes/listings');
const bookingsRoutes    = require('./routes/bookings');

async function start() {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(morgan('dev'));
  app.use(express.static('public'));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Initialize DB
  const db = await connectDB(process.env.DB_URI);
  app.locals.db     = { listingsCol: db.listingsCol, bookingsCol: db.bookingsCol };
  app.locals.client = db.client;

  // Mount routers
  app.use('/api/listings', listingsRoutes);
  app.use('/api/listing',  listingsRoutes);
  app.use('/api/bookings', bookingsRoutes);

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🚀 Server listening on http://localhost:${port}`));
}

start().catch(err => {
  console.error('🔴 Startup error:', err);
  process.exit(1);
});
