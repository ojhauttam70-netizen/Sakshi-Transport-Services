# Sakshi Transport Website

Responsive front end and a small Express backend for transport quote enquiries.

## Requirements
- Node.js 18+

## Run locally
1. Open a terminal in this folder.
2. Run `npm install`
3. Set an admin token before starting the server:
   - macOS/Linux: `export ADMIN_TOKEN='replace-with-a-long-random-secret'`
   - Windows PowerShell: `$env:ADMIN_TOKEN='replace-with-a-long-random-secret'`
4. Run `npm start`
5. Open http://localhost:3000

## API
- `GET /api/health` — server health check.
- `POST /api/enquiries` — save a transport enquiry to `data/enquiries.json`.
- `GET /api/enquiries` — protected list of enquiries; requires `Authorization: Bearer <ADMIN_TOKEN>`.

Example POST JSON:
```json
{
  "name": "Aarav Sharma",
  "phone": "+91 9876543210",
  "email": "aarav@example.com",
  "service": "Road freight",
  "pickup": "Lucknow",
  "destination": "Kanpur",
  "cargo": "Packaged goods, approx 500 kg",
  "message": "Pickup next week"
}
```

## Before publishing
The company phone, WhatsApp number, email, registered/office address, working hours, fleet details, routes, GSTIN and social links were not supplied. The site intentionally does not invent them. Update the contact section in `public/index.html` with verified company details. The enquiry form in the runnable project is connected to `POST /api/enquiries`. The separate in-chat preview uses a local demo because it cannot connect to a running server.

## Production notes
For production use HTTPS, rate limiting, spam protection, backups, and a persistent database. The included JSON file is suitable only for a small starter project, not concurrent/high-volume production traffic. Do not publish or commit your admin token.


## Business contact details
- Contact person: Umesh Ojha
- Phone: 98922 87369
- Alternate phone: 81697 64833
- Office: Room No. 108, Central Facility Building No. 2, Sector 19, Vashi, Navi Mumbai, Maharashtra – 400705
- Service locations: Maharashtra, Kerala, Karnataka, Tamil Nadu, Gujarat and Goa
