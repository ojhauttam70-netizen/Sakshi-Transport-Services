
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();

const PORT = process.env.PORT || 3000;

// Vercel writable temporary directory
// Local development uses the project data directory
const DATA_DIR = process.env.VERCEL
    ? path.join('/tmp', 'sakshi-transport-data')
    : path.join(__dirname, 'data');

const LEADS_FILE = path.join(DATA_DIR, 'enquiries.json');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

app.disable('x-powered-by');

app.use(express.json({ limit: '30kb' }));
app.use(express.urlencoded({ extended: false, limit: '30kb' }));

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Create data directory and file
try {
    fs.mkdirSync(DATA_DIR, { recursive: true });

    if (!fs.existsSync(LEADS_FILE)) {
        fs.writeFileSync(LEADS_FILE, '[]\n');
    }
} catch (error) {
    console.error('Data directory initialization error:', error);
}

// Clean user input
function clean(value, max = 1000) {
    return typeof value === 'string'
        ? value.trim().slice(0, max)
        : '';
}

// Read enquiries
function readLeads() {
    try {
        if (!fs.existsSync(LEADS_FILE)) {
            return [];
        }

        return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
    } catch (error) {
        console.error('Read leads error:', error);
        return [];
    }
}

// Save enquiries
function writeLeads(leads) {
    const tempFile = LEADS_FILE + '.tmp';

    fs.writeFileSync(tempFile, JSON.stringify(leads, null, 2));
    fs.renameSync(tempFile, LEADS_FILE);
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        service: 'Sakshi Transport API'
    });
});

// Submit enquiry
app.post('/api/enquiries', (req, res) => {
    try {
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

        // Required fields validation
        if (
            !enquiry.name ||
            !enquiry.phone ||
            !enquiry.service ||
            !enquiry.pickup ||
            !enquiry.destination
        ) {
            return res.status(400).json({
                error: 'Please provide name, phone, service, pickup and destination.'
            });
        }

        // Phone validation
        if (!/^[0-9+()\-\s]{7,20}$/.test(enquiry.phone)) {
            return res.status(400).json({
                error: 'Please provide a valid phone number.'
            });
        }

        // Email validation
        if (
            enquiry.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)
        ) {
            return res.status(400).json({
                error: 'Please provide a valid email address.'
            });
        }

        const leads = readLeads();

        const record = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            status: 'new',
            ...enquiry
        };

        leads.push(record);

        writeLeads(leads);

        return res.status(201).json({
            message: 'Enquiry received successfully. Sakshi Transport will contact you soon.',
            id: record.id
        });

    } catch (error) {
        console.error('Enquiry submission error:', error);

        return res.status(500).json({
            error: 'Unable to submit enquiry. Please try again later.'
        });
    }
});

// Admin-only enquiry list
app.get('/api/enquiries', (req, res) => {
    if (
        !ADMIN_TOKEN ||
        req.get('authorization') !== `Bearer ${ADMIN_TOKEN}`
    ) {
        return res.status(401).json({
            error: 'Unauthorized access.'
        });
    }

    return res.json(readLeads());
});

// Frontend fallback
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Local development server
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Sakshi Transport running at http://localhost:${PORT}`);
    });
}

// Export Express app for Vercel
module.exports = app;
