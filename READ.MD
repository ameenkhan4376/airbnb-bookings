 AirBnB Bookings Web Application

 Overview
A fullstack web application allowing users to search AirBnB listings, make bookings, and view confirmations.  
Backend: Node.js, Express, MongoDB  
Frontend: React with Vite & Bootstrap  
DevOps: Docker Compose for local development



 Quick Start

1. Clone the repository  
   bash
   git clone https://github.com/ameenkhan4376/airbnb-bookings
   cd airbnbbookings
   

2. Environment Variables  
   Copy .env.example to .env and set:
   env
   DB_URI=mongodb+srv://asmash646:Am33nr1d3r@dba-cluster.sgtulk5.mongodb.ne
   PORT=3000
   

3. Install dependencies  
   bash
   npm install
   cd airbnbreact
   npm install
   cd ..
   

4. Run using Docker  
    Express API at http://localhost:3000  
    React SPA at http://localhost:5173

   Or run locally without Docker:
   bash
    In project root
   npm run dev

    In airbnbreact
   cd airbnbreact
   npm run dev
   



 Running Tests & Lint

bash
npm run lint         ESLint checks
npm run format       Prettier formatting
npm test             Jest & Supertest integration tests




 API Endpoints

 Listings
 GET /api/listings  
   Params: market, property_type, bedrooms (optional)  
   Returns: Array of { _id, name, price }

 GET /api/listings/markets  
   Returns: ["Paris", "New York", ...]

 GET /api/listings/propertyTypes  
   Returns: ["House", "Apartment", ...]

 GET /api/listing/:id  
   Returns: { _id, name, price, description }

 Bookings
 POST /api/bookings  
   Body (formencoded):
     listing_id (string)
     guest_name (string)
     arrival (ISO8601 date)
     departure (ISO8601 date)
     contact (email)
   Redirects to /confirmation.html?booking_id=<id>

 GET /api/bookings/:id  
   Returns: { _id, listing_id, guest_name, start_date, end_date, contact }



 Frontend

 Source in /airbnbreact
 Entry: src/main.js
 Components in src/App.jsx
 Routing with React Router


