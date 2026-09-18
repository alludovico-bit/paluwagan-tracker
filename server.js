// Paluwagan Tracker Backend
// Node.js + Express + PostgreSQL

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/paluwagan-tracker-connected.html');
});

// File upload setup
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// PostgreSQL Connection Pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'paluwagan'
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// =====================
// MEMBERS ENDPOINTS
// =====================

// GET all members with balances
app.get('/api/members', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM member_balances ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET single member
app.get('/api/members/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM member_balances WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// POST create member
app.post('/api/members', async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        const result = await pool.query(
            'INSERT INTO members (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
            [name, email || null, phone || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update member
app.put('/api/members/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone } = req.body;
        
        const result = await pool.query(
            'UPDATE members SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
            [name, email, phone, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE member
app.delete('/api/members/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM members WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        res.json({ message: 'Member deleted', data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// =====================
// TRANSACTIONS ENDPOINTS
// =====================

// GET all transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const { type, memberId, limit = 50, offset = 0 } = req.query;
        
        let query = 'SELECT t.*, m.name as member_name FROM transactions t JOIN members m ON t.member_id = m.id WHERE 1=1';
        const params = [];
        
        if (type) {
            query += ' AND t.type = $' + (params.length + 1);
            params.push(type);
        }
        if (memberId) {
            query += ' AND t.member_id = $' + (params.length + 1);
            params.push(memberId);
        }
        
        query += ' ORDER BY t.transaction_date DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// POST record hulog
app.post('/api/transactions/hulog', async (req, res) => {
    try {
        const { memberId, amount, description } = req.body;
        
        if (!memberId || !amount) {
            return res.status(400).json({ error: 'Member ID and amount are required' });
        }
        
        const result = await pool.query(
            'INSERT INTO transactions (member_id, type, amount, description, transaction_date) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
            [memberId, 'hulog', amount, description || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// POST record sahod
app.post('/api/transactions/sahod', async (req, res) => {
    try {
        const { memberId, amount, description } = req.body;
        
        if (!memberId || !amount) {
            return res.status(400).json({ error: 'Member ID and amount are required' });
        }
        
        const result = await pool.query(
            'INSERT INTO transactions (member_id, type, amount, description, transaction_date) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
            [memberId, 'sahod', amount, description || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE transaction
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted', data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// =====================
// PROOFS ENDPOINTS
// =====================

// POST upload proof
app.post('/api/proofs', upload.single('file'), async (req, res) => {
    try {
        const { transactionId } = req.body;
        
        if (!transactionId || !req.file) {
            return res.status(400).json({ error: 'Transaction ID and file are required' });
        }
        
        const result = await pool.query(
            'INSERT INTO proofs (transaction_id, file_name, file_type, file_data) VALUES ($1, $2, $3, $4) RETURNING id, transaction_id, file_name, uploaded_at',
            [transactionId, req.file.originalname, req.file.mimetype, req.file.buffer]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET proof
app.get('/api/proofs/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;
        const result = await pool.query('SELECT * FROM proofs WHERE transaction_id = $1', [transactionId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Proof not found' });
        }
        
        const proof = result.rows[0];
        res.setHeader('Content-Type', proof.file_type);
        res.setHeader('Content-Disposition', `attachment; filename="${proof.file_name}"`);
        res.send(proof.file_data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// =====================
// STATS ENDPOINTS
// =====================

// GET monthly stats
app.get('/api/stats/monthly', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                DATE_TRUNC('month', transaction_date) as month,
                type,
                SUM(amount) as total
            FROM transactions
            GROUP BY DATE_TRUNC('month', transaction_date), type
            ORDER BY month DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET today's hulog
app.get('/api/stats/todays-hulog', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.id, m.name, SUM(t.amount) as total
            FROM transactions t
            JOIN members m ON t.member_id = m.id
            WHERE t.type = 'hulog' AND DATE(t.transaction_date) = CURRENT_DATE
            GROUP BY m.id, m.name
            ORDER BY m.name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET missing hulog today
app.get('/api/stats/missing-hulog', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.id, m.name, m.email
            FROM members m
            WHERE m.id NOT IN (
                SELECT DISTINCT member_id FROM transactions 
                WHERE type = 'hulog' AND DATE(transaction_date) = CURRENT_DATE
            )
            ORDER BY m.name
            LIMIT 3
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// =====================
// HEALTH CHECK
// =====================

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT NOW()');
        res.json({ status: 'OK', database: 'Connected' });
    } catch (err) {
        res.status(500).json({ status: 'Error', database: 'Disconnected', error: err.message });
    }
});

// =====================
// START SERVER
// =====================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🎉 Paluwagan Tracker Backend running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${process.env.DB_NAME || 'paluwagan'}`);
    console.log(`✅ Check health: http://localhost:${PORT}/health`);
});
