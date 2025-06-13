const express = require('express');
const router = express.Router();
const c = require('../controllers/listingsController');

router.get('/markets',        c.getMarkets);
router.get('/propertyTypes',  c.getPropertyTypes);
router.get('/',               c.getListings);
router.get('/:id',            c.getListingById);

module.exports = router;
