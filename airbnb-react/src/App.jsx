import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useSearchParams
} from 'react-router-dom';

// Home page: search listings
function Home() {
  const [markets, setMarkets] = useState([]);
  const [types, setTypes]   = useState([]);
  const [filters, setFilters] = useState({ market:'', property_type:'', bedrooms:'' });
  const [listings, setListings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/listings/markets')
      .then(r => r.json())
      .then(setMarkets);
    fetch('/api/listings/propertyTypes')
      .then(r => r.json())
      .then(setTypes);
    load();
  }, []);

  function handleChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }
  function load(e) {
    if (e) e.preventDefault();
    const params = new URLSearchParams(filters);
    fetch('/api/listings?' + params)
      .then(r => r.json())
      .then(setListings);
  }

  return (
    <div className="container p-4">
      <h1>Search Listings</h1>
      <form className="row g-2 mb-4" onSubmit={load}>
        <div className="col-md-4">
          <label className="form-label">Market</label>
          <select name="market" className="form-select" onChange={handleChange}>
            <option value="">Any market</option>
            {markets.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Property Type</label>
          <select name="property_type" className="form-select" onChange={handleChange}>
            <option value="">Any type</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label">Bedrooms</label>
          <input type="number" name="bedrooms" className="form-control" onChange={handleChange} placeholder="Any" />
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <button className="btn btn-primary w-100">Search</button>
        </div>
      </form>
      <ul className="list-group">
        {listings.map(l => (
          <li key={l._id} className="list-group-item d-flex justify-content-between align-items-center">
            <Link to={`/booking?listing_id=${l._id}`} className="fw-bold">{l.name}</Link>
            <span>${l.price}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Booking page: show details + form
function Booking() {
  const [params] = useSearchParams();
  const id = params.get('listing_id');
  const [listing, setListing] = useState(null);
  const [form, setForm] = useState({ guest_name:'', arrival:'', departure:'', contact:'' });
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/listing/' + id)
      .then(r => r.json())
      .then(setListing);
  }, [id]);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    const data = new URLSearchParams({ ...form, listing_id: id });
    const res = await fetch('/api/bookings', { method:'POST', body:data });
    if (!res.ok) { alert(await res.text()); return; }
    // redirect to confirmation
    navigate('/confirmation?booking_id=' + new URL(res.url).searchParams.get('booking_id'));
  }

  if (!listing) return <p className="p-4">Loading listing...</p>;

  return (
    <div className="container p-4">
      <h1>Book Your Stay</h1>
      <div className="mb-4">
        <h2>{listing.name}</h2>
        <p><strong>Price:</strong> ${listing.price}</p>
        <p>{listing.description}</p>
      </div>
      <form className="row g-2" onSubmit={submit}>
        <input type="hidden" name="listing_id" value={id} />
        <div className="col-12">
          <label className="form-label">Your Name</label>
          <input name="guest_name" className="form-control" onChange={change} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Arrival Date</label>
          <input name="arrival" type="date" className="form-control" onChange={change} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Departure Date</label>
          <input name="departure" type="date" className="form-control" onChange={change} required />
        </div>
        <div className="col-12">
          <label className="form-label">Contact Email</label>
          <input name="contact" type="email" className="form-control" onChange={change} required />
        </div>
        <div className="col-12">
          <button className="btn btn-success">Confirm Booking</button>
        </div>
      </form>
    </div>
  );
}

// Confirmation page
function Confirmation() {
  const [params] = useSearchParams();
  const id = params.get('booking_id');
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const bk = await (await fetch('/api/bookings/' + id)).json();
      const listing = await (await fetch('/api/listing/' + bk.listing_id)).json();
      setData({ bk, listing });
    })();
  }, [id]);

  if (!data) return <p className="p-4">Loading confirmation...</p>;

  const { bk, listing } = data;
  return (
    <div className="container p-4">
      <h1>Booking Confirmed!</h1>
      <div className="card p-4">
        <h2>{listing.name}</h2>
        <p><strong>Guest:</strong> {bk.guest_name}</p>
        <p><strong>From:</strong> {new Date(bk.start_date).toDateString()}</p>
        <p><strong>To:</strong> {new Date(bk.end_date).toDateString()}</p>
        <p><strong>Contact:</strong> {bk.contact}</p>
      </div>
      <Link to="/" className="btn btn-link mt-3">&larr; Back to Search</Link>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/confirmation" element={<Confirmation />} />
      </Routes>
    </Router>
  );
}
