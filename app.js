// Load environment variables from a .env file into process.env
require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const morgan  = require('morgan');

// Import our database connection helper
const { connectDB }      = require('./services/db');
// Import the routers for listings and bookings endpoints
const listingsRoutes    = require('./routes/listings');
const bookingsRoutes    = require('./routes/bookings');

/**
 * start
 * -----
 * Initializes the Express application, connects to MongoDB,
 * sets up middleware, mounts routes, and begins listening.
 */
async function start() {
  // 1) Create the Express app instance
  const app = express();

  // 2) Security & logging middleware
  //    - helmet: sets various HTTP headers for security; disable CSP for dev ease
  //    - morgan: HTTP request logger in 'dev' format
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(morgan('dev'));

  // 3) Static file serving
  //    Serves all files in the `public/` folder (HTML, CSS, JS, images)
  app.use(express.static('public'));

  // 4) Body parsing middleware
  //    - express.urlencoded: parses URL-encoded form submissions
  //    - express.json: parses JSON request bodies
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // 5) Connect to MongoDB and initialize collections + indexes
  //    - connectDB returns { client, listingsCol, bookingsCol }
  const db = await connectDB(process.env.DB_URI);

  // 6) Store collection handles and client in app.locals for use in controllers
  app.locals.db     = {
    listingsCol: db.listingsCol,
    bookingsCol:  db.bookingsCol
  };
  app.locals.client = db.client;

  // 7) Mount routers under appropriate paths
  //    - All listings-related endpoints under `/api/listings` and `/api/listing`
  //    - All booking-related endpoints under `/api/bookings`
  app.use('/api/listings', listingsRoutes);
  app.use('/api/listing',  listingsRoutes);  // single-listing route uses same controller
  app.use('/api/bookings', bookingsRoutes);

  // 8) Start the HTTP server on the configured port (default 3000)
  const port = process.env.PORT || 3000;
  app.listen(port, () =>
    console.log(`🚀 Server listening on http://localhost:${port}`)
  );
}

// Kick off the application and handle any startup errors
start().catch(err => {
  console.error('❌ Startup error:', err);
  process.exit(1);
});
