const { validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');

async function createBooking(req, res) {
  const { bookingsCol } = req.app.locals.db;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { listing_id, guest_name, arrival, departure, contact } = req.body;
  const session = req.app.locals.client.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const conflict = await bookingsCol.findOne(
        { listing_id, start_date:{ $lt:new Date(departure) }, end_date:{ $gt:new Date(arrival) } },
        { session }
      );
      if (conflict) throw new Error('Dates overlap existing booking');
      result = await bookingsCol.insertOne(
        { listing_id, guest_name, start_date:new Date(arrival), end_date:new Date(departure), contact },
        { session }
      );
    });
    res.redirect(`/confirmation.html?booking_id=${result.insertedId}`);
  } catch (err) {
    console.error('Error in createBooking:', err);
    res.status(400).send(err.message);
  } finally {
    await session.endSession();
  }
}

async function getBookingById(req, res) {
  try {
    const { bookingsCol } = req.app.locals.db;
    const bk = await bookingsCol.findOne({ _id: new ObjectId(req.params.id) });
    if (!bk) return res.status(404).send('Booking not found');
    res.json(bk);
  } catch (err) {
    console.error('Error in getBookingById:', err);
    res.status(500).send('Error fetching booking');
  }
}

module.exports = { createBooking, getBookingById };
