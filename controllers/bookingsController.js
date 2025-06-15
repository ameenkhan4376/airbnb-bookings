// controllers/bookingsController.js

// Import validationResult to gather errors from express-validator middleware
const { validationResult } = require('express-validator');
// Import ObjectId to convert string IDs to MongoDB ObjectId where needed
const { ObjectId }          = require('mongodb');

/**
 * createBooking
 * --------------
 * Handles POST /api/bookings to create a new booking.
 * Steps:
 *   1. Validate input fields using express-validator.
 *   2. Ensure arrival < departure and arrival is not in the past.
 *   3. Start a MongoDB transaction to:
 *      a) Check for overlapping bookings.
 *      b) Insert the new booking document.
 *   4. Redirect to the confirmation page on success.
 *   5. Return errors with appropriate HTTP status codes on failure.
 */
async function createBooking(req, res) {
  // Get the bookings collection from app.locals (initialized in app.js)
  const { bookingsCol } = req.app.locals.db;

  // 1) Input validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return 400 with details about which fields failed validation
    return res.status(400).json({ errors: errors.array() });
  }

  // Extract fields from the request body
  const { listing_id, guest_name, arrival, departure, contact } = req.body;

  // 2) Business rule: arrival date must be before departure date
  const startDate = new Date(arrival);
  const endDate   = new Date(departure);
  if (startDate >= endDate) {
    return res.status(400).send('Arrival date must be before departure date');
  }

  // 3) Business rule: arrival date cannot be in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize to midnight for date-only comparison
  if (startDate < today) {
    return res.status(400).send('Arrival date cannot be in the past');
  }

  // 4) Start a session for transaction support
  const session = req.app.locals.client.startSession();
  try {
    let result;

    // 5) Execute booking operations within a transaction
    await session.withTransaction(async () => {
      // 5a) Check for any existing booking conflicts on this listing
      const conflict = await bookingsCol.findOne(
        {
          listing_id,
          start_date: { $lt: endDate },  // new start < existing end
          end_date:   { $gt: startDate } // new end > existing start
        },
        { session }
      );
      if (conflict) {
        // Abort if overlap is found
        throw new Error('Selected dates overlap an existing booking');
      }

      // 5b) Insert the new booking document
      result = await bookingsCol.insertOne(
        {
          listing_id,
          guest_name,
          start_date: startDate,
          end_date:   endDate,
          contact
        },
        { session }
      );
    });

    // 6) On success, redirect user to the confirmation page
    res.redirect(`/confirmation.html?booking_id=${result.insertedId}`);
  } catch (err) {
    // Log the error for debugging and return a 400 with the message
    console.error('Error in createBooking:', err);
    res.status(400).send(err.message);
  } finally {
    // End the session regardless of transaction outcome
    await session.endSession();
  }
}

/**
 * getBookingById
 * ----------------
 * Handles GET /api/bookings/:id to retrieve a booking by its ID.
 * Steps:
 *   1. Convert the route parameter to ObjectId.
 *   2. Fetch the booking document.
 *   3. Return it as JSON, or 404 if not found.
 */
async function getBookingById(req, res) {
  const { bookingsCol } = req.app.locals.db;
  try {
    // Convert route param to ObjectId and fetch the document
    const booking = await bookingsCol.findOne({
      _id: new ObjectId(req.params.id)
    });
    if (!booking) {
      // No document found → respond with 404 Not Found
      return res.status(404).send('Booking not found');
    }
    // Return the booking details as JSON
    res.json(booking);
  } catch (err) {
    // Log any unexpected errors and respond with 500
    console.error('Error in getBookingById:', err);
    res.status(500).send('Error fetching booking');
  }
}

// Export the controller functions for use in the bookings router
module.exports = {
  createBooking,
  getBookingById
};
