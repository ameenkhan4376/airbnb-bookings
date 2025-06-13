const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const c = require('../controllers/bookingsController');

router.post(
  '/',
  [
    body('listing_id').notEmpty(),
    body('guest_name').trim().notEmpty(),
    body('arrival').isISO8601(),
    body('departure').isISO8601(),
    body('contact').isEmail()
  ],
  c.createBooking
);
router.get('/:id', c.getBookingById);

module.exports = router;