// controllers/bookingsController.js
const { validationResult } = require('express-validator');
const { ObjectId }          = require('mongodb');

async function createBooking(req, res) {
  const { bookingsCol } = req.app.locals.db;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { listing_id, guest_name, arrival, departure, contact } = req.body;

  // Ensure arrival is before departure
  const startDate = new Date(arrival);
  const endDate   = new Date(departure);
  if (startDate >= endDate) {
    return res.status(400).send('Arrival date must be before departure date');
  }

  // Ensure arrival is not in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (startDate < today) {
    return res.status(400).send('Arrival date cannot be in the past');
  }

  const session = req.app.locals.client.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      // Check for overlapping bookings
      const conflict = await bookingsCol.findOne(
        {
          listing_id,
          start_date: { $lt: endDate },
          end_date:   { $gt: startDate }
        },
        { session }
      );
      if (conflict) throw new Error('Selected dates overlap an existing booking');

      // Insert the new booking
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

    // Redirect to confirmation page
    res.redirect(`/confirmation.html?booking_id=${result.insertedId}`);
  } catch (err) {
    console.error('Error in createBooking:', err);
    res.status(400).send(err.message);
  } finally {
    await session.endSession();
  }
}

async function getBookingById(req, res) {
  const { bookingsCol } = req.app.locals.db;
  try {
    const booking = await bookingsCol.findOne({ _id: new ObjectId(req.params.id) });
    if (!booking) return res.status(404).send('Booking not found');
    res.json(booking);
  } catch (err) {
    console.error('Error in getBookingById:', err);
    res.status(500).send('Error fetching booking');
  }
}

module.exports = {
  createBooking,
  getBookingById
};
