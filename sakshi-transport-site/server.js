const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'enquiries.json');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

app.disable('x-powered-by');
app.use(express.json({ limit: '30kb' }));
app.use(express.urlencoded({ extended: false, limit: '30kb' }));
app.use(express.static(path.join(__dirname, 'public')));
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, '[]\n', { flag: 'wx' });

function clean(value, max = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
function readLeads() {
  try { return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8')); }
  catch { return []; }
}
function writeLeads(leads) {
  const temp = LEADS_FILE + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(leads, null, 2));
  fs.renameSync(temp, LEADS_FILE);
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Sakshi Transport API' }));
app.post('/api/enquiries', (req, res) => {
  const body = req.body || {};
  const enquiry = {
    name: clean(body.name, 100),
    phone: clean(body.phone, 30),
    email: clean(body.email, 150),
    service: clean(body.service, 80),
    pickup: clean(body.pickup, 150),
    destination: clean(body.destination, 150),
    cargo: clean(body.cargo, 500),
    message: clean(body.message, 1500)
  };
  if (!enquiry.name || !enquiry.phone || !enquiry.service || !enquiry.pickup || !enquiry.destination) {
    return res.status(400).json({ error: 'Please provide name, phone, service, pickup and destination.' });
  }
  if (!/^[0-9+()\-\s]{7,20}$/.test(enquiry.phone)) {
    return res.status(400).json({ error: 'Please provide a valid phone number.' });
  }
  if (enquiry.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  const leads = readLeads();
  const record = { id: require('crypto').randomUUID(), createdAt: new Date().toISOString(), status: 'new', ...enquiry };
  leads.push(record);
  writeLeads(leads);
  return res.status(201).json({ message: 'Enquiry received. Sakshi Transport can follow up using the contact details provided.', id: record.id });
});

// Protect the private enquiry list with an environment token. Never expose it publicly.
app.get('/api/enquiries', (req, res) => {
  if (!ADMIN_TOKEN || req.get('authorization') !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized. Configure ADMIN_TOKEN and send Authorization: Bearer <token>.' });
  }
  res.json(readLeads());
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`Sakshi Transport website running at http://localhost:${PORT}`));
