# Paluwagan Tracker - Full Stack Setup Guide

## Prerequisites
- ✅ PostgreSQL installed (you have this!)
- Node.js installed (download from nodejs.org)
- Terminal/Command Prompt access

---

## 🔧 Setup Steps

### 1. Create Database & Schema

```bash
# Open PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE paluwagan;

# Connect to database
\c paluwagan

# Copy and paste the entire content of paluwagan_schema.sql
# Then run it
```

**Or do it in one command:**
```bash
psql -U postgres -c "CREATE DATABASE paluwagan;"
psql -U postgres -d paluwagan -f paluwagan_schema.sql
```

---

### 2. Setup Node.js Backend

```bash
# Create a folder for your project
mkdir paluwagan-tracker
cd paluwagan-tracker

# Copy these files into the folder:
# - server.js
# - package.json
# - .env.example (rename to .env)

# Install dependencies
npm install

# Edit .env file with your PostgreSQL credentials
# Example:
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=paluwagan
```

**Install required packages individually (if needed):**
```bash
npm install express pg cors body-parser multer dotenv
npm install -D nodemon  # for development
```

---

### 3. Start the Backend Server

```bash
# Development (with auto-reload)
npm run dev

# Or production
npm start
```

**Expected output:**
```
🎉 Paluwagan Tracker Backend running on http://localhost:3001
📊 Database: paluwagan
✅ Check health: http://localhost:3001/health
```

---

### 4. Test the Backend

**Check if server is running:**
```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "OK",
  "database": "Connected"
}
```

**Get all members:**
```bash
curl http://localhost:3001/api/members
```

---

## 📊 API Endpoints

### Members
- `GET /api/members` - Get all members with balances
- `GET /api/members/:id` - Get single member
- `POST /api/members` - Create new member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Transactions
- `GET /api/transactions` - Get all transactions (with filters)
- `POST /api/transactions/hulog` - Record hulog
- `POST /api/transactions/sahod` - Record sahod
- `DELETE /api/transactions/:id` - Delete transaction

### Proofs
- `POST /api/proofs` - Upload proof file
- `GET /api/proofs/:transactionId` - Download proof

### Statistics
- `GET /api/stats/monthly` - Monthly stats
- `GET /api/stats/todays-hulog` - Today's contributors
- `GET /api/stats/missing-hulog` - Missing hulog (max 3)

---

## 📝 Example API Calls

### Add a Member
```bash
curl -X POST http://localhost:3001/api/members \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos",
    "email": "maria@example.com",
    "phone": "09123456789"
  }'
```

### Record Hulog
```bash
curl -X POST http://localhost:3001/api/transactions/hulog \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": 1,
    "amount": 500,
    "description": "Daily contribution"
  }'
```

### Record Sahod
```bash
curl -X POST http://localhost:3001/api/transactions/sahod \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": 1,
    "amount": 5000,
    "description": "Monthly payout"
  }'
```

### Upload Proof
```bash
curl -X POST http://localhost:3001/api/proofs \
  -F "transactionId=1" \
  -F "file=@/path/to/proof.jpg"
```

---

## 🗄️ Database Schema

### Members Table
```
id (INT) - Primary Key
name (VARCHAR) - Member name
email (VARCHAR) - Email address
phone (VARCHAR) - Phone number
created_at (TIMESTAMP) - Created date
updated_at (TIMESTAMP) - Last updated
```

### Transactions Table
```
id (INT) - Primary Key
member_id (INT) - Foreign Key to members
type (VARCHAR) - 'hulog' or 'sahod'
amount (DECIMAL) - Transaction amount
description (TEXT) - Notes
transaction_date (TIMESTAMP) - When transaction occurred
created_at (TIMESTAMP) - Created date
```

### Proofs Table
```
id (INT) - Primary Key
transaction_id (INT) - Foreign Key to transactions
file_name (VARCHAR) - Original filename
file_type (VARCHAR) - MIME type (image/jpeg, etc)
file_data (BYTEA) - Binary file data
uploaded_at (TIMESTAMP) - Upload time
```

---

## 🐛 Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:5432"
- PostgreSQL is not running
- Solution: Start PostgreSQL service

### Error: "database paluwagan does not exist"
- Database wasn't created
- Solution: Run the CREATE DATABASE command

### Error: "role 'postgres' does not exist"
- Your PostgreSQL username is different
- Solution: Update DB_USER in .env

### Port 3001 already in use
- Another app is using the port
- Solution: Change PORT in .env or kill the process

---

## 🚀 Next Steps

1. Update the frontend (paluwagan-tracker-pro.html) to connect to `http://localhost:3001/api`
2. Replace RAM storage with API calls
3. Add authentication if needed
4. Deploy to cloud (Heroku, Railway, Render)

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Start server | `npm run dev` |
| Stop server | `Ctrl + C` |
| Check health | `curl http://localhost:3001/health` |
| View logs | Check terminal output |
| Reset database | `psql -U postgres -d paluwagan < paluwagan_schema.sql` |

---

Enjoy your Paluwagan Tracker! 💰🎉
