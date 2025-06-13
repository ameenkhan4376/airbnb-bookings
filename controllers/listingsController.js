const { ObjectId } = require('mongodb');

async function getMarkets(req, res) {
  try {
    const { listingsCol } = req.app.locals.db;
    const markets = await listingsCol.distinct('address.market');
    res.json(markets.filter(m => m));
  } catch (err) {
    console.error('Error in getMarkets:', err);
    res.status(500).send('Error fetching markets');
  }
}

async function getPropertyTypes(req, res) {
  try {
    const { listingsCol } = req.app.locals.db;
    const types = await listingsCol.distinct('property_type');
    res.json(types.filter(t => t));
  } catch (err) {
    console.error('Error in getPropertyTypes:', err);
    res.status(500).send('Error fetching property types');
  }
}

async function getListings(req, res) {
  try {
    const { listingsCol } = req.app.locals.db;
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
    pipeline.push({ $project: { _id:1, name:1, price:{ $toDouble:'$price' } } });
    const results = await listingsCol.aggregate(pipeline).toArray();
    res.json(results);
  } catch (err) {
    console.error('Error in getListings:', err);
    res.status(500).send('Error fetching listings');
  }
}

async function getListingById(req, res) {
  try {
    const { listingsCol } = req.app.locals.db;
    const id = req.params.id;
    const doc = await listingsCol.findOne(
      { _id: id },
      { projection: { name:1, price:{ $toDouble:'$price' } } }
    );
    if (!doc) return res.status(404).send('Listing not found');
    res.json(doc);
  } catch (err) {
    console.error('Error in getListingById:', err);
    res.status(500).send('Error fetching listing');
  }
}

module.exports = {
  getMarkets,
  getPropertyTypes,
  getListings,
  getListingById
};
