// routes/bookings.js

// Import Express and the express-validator `body` function for request validation
const express = require('express');
const { body } = require('express-validator');

// Create a new router instance; all routes defined here will be mounted under `/api/bookings`
const router = express.Router();

// Import the controller functions that handle the business logic for bookings
const c = require('../controllers/bookingsController');

/**
 * POST /
 * Route to create a new booking.
 * Validation middleware runs first, then `c.createBooking` handles the request.
 */
router.post(
  '/',
  [
    // Validate that `listing_id` is provided (non-empty string)
    body('listing_id')
      .notEmpty()
      .withMessage('Listing ID is required.'),

    // Validate that `guest_name` is provided and trimmed of whitespace
    body('guest_name')
      .trim()
      .notEmpty()
      .withMessage('Guest name is required.'),

    // Validate that `arrival` is a valid ISO8601 date string
    body('arrival')
      .isISO8601()
      .withMessage('Arrival date must be a valid date (YYYY-MM-DD).'),

    // Validate that `departure` is a valid ISO8601 date string
    body('departure')
      .isISO8601()
      .withMessage('Departure date must be a valid date (YYYY-MM-DD).'),

    // Validate that `contact` is a properly formatted email address
    body('contact')
      .isEmail()
      .withMessage('Contact must be a valid email address.')
  ],
  // After validation, this controller function will run to process the booking
  c.createBooking
);

/**
 * GET /:id
 * Route to retrieve a single booking by its unique identifier.
 * The `:id` parameter is extracted and passed to `c.getBookingById`.
 */
router.get('/:id', c.getBookingById);

// Export the router so it can be mounted in the main application (e.g. under `/api/bookings`)
module.exports = router;
