-- Paluwagan Tracker Database Schema
-- PostgreSQL

-- Create Members Table
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Transactions Table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('hulog', 'sahod')),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    transaction_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Proofs Table (for sahod proof images/documents)
CREATE TABLE proofs (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_data BYTEA NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(transaction_id)
);

-- Create Indexes for faster queries
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_transactions_member_id ON transactions(member_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_proofs_transaction_id ON proofs(transaction_id);

-- Create View for Member Balances
CREATE VIEW member_balances AS
SELECT 
    m.id,
    m.name,
    m.email,
    COALESCE(SUM(CASE WHEN t.type = 'hulog' THEN t.amount ELSE 0 END), 0) as total_hulog,
    COALESCE(SUM(CASE WHEN t.type = 'sahod' THEN t.amount ELSE 0 END), 0) as total_sahod,
    COALESCE(SUM(CASE WHEN t.type = 'hulog' THEN t.amount ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN t.type = 'sahod' THEN t.amount ELSE 0 END), 0) as balance
FROM members m
LEFT JOIN transactions t ON m.id = t.member_id
GROUP BY m.id, m.name, m.email;

-- Create View for Daily Hulog
CREATE VIEW daily_hulog AS
SELECT 
    DATE(t.transaction_date) as hulog_date,
    m.id,
    m.name,
    t.amount,
    t.created_at
FROM transactions t
JOIN members m ON t.member_id = m.id
WHERE t.type = 'hulog'
ORDER BY t.transaction_date DESC;

-- Sample Data (Optional - can delete if you don't want it)
INSERT INTO members (name, email, phone) VALUES
('Maria Santos', 'maria.santos@example.com', '09123456789'),
('Juan Dela Cruz', 'juan.delacruz@example.com', '09123456790'),
('Rosa Garcia', 'rosa.garcia@example.com', '09123456791'),
('Pedro Lopez', 'pedro.lopez@example.com', '09123456792'),
('Ana Rodriguez', 'ana.rodriguez@example.com', '09123456793');

-- Check the schema
-- SELECT * FROM members;
-- SELECT * FROM member_balances;
-- SELECT * FROM daily_hulog;
