# PostgreSQL Setup Guide

This guide will help you set up PostgreSQL for the Git Simulator project.

## 📦 Installation

### macOS (Using Homebrew)
```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Verify installation
psql --version
```

### Ubuntu/Debian
```bash
# Update package manager
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo service postgresql start

# Verify installation
psql --version
```

### Windows
1. Download installer from: https://www.postgresql.org/download/windows/
2. Run the installer and follow the installation wizard
3. Remember the password for the `postgres` user
4. PostgreSQL runs as a Windows service automatically

### Docker (Alternative)
```bash
# Run PostgreSQL in a Docker container
docker run --name git-simulator-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=git_simulator \
  -p 5432:5432 \
  -d postgres:15-alpine

# Verify it's running
docker ps | grep git-simulator-db
```

## 🗄️ Database Setup

### Method 1: Using Setup Script (Recommended)
```bash
# Navigate to backend directory
cd backend

# Run the setup script
psql -U postgres -f setup.sql

# You may be prompted for the postgres password
```

### Method 2: Manual Setup
```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# In the psql prompt, run these commands:
CREATE DATABASE git_simulator;

CREATE USER git_user WITH PASSWORD 'git_password';

ALTER ROLE git_user SET client_encoding TO 'utf8';
ALTER ROLE git_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE git_user SET default_transaction_deferrable TO on;
ALTER ROLE git_user SET timezone TO 'UTC';

GRANT ALL PRIVILEGES ON DATABASE git_simulator TO git_user;

# Exit psql
\q
```

### Method 3: Using Docker
```bash
# If using Docker container
docker exec -it git-simulator-db psql -U postgres -c "CREATE DATABASE git_simulator;"

docker exec -it git-simulator-db psql -U postgres -c \
  "CREATE USER git_user WITH PASSWORD 'git_password';"

docker exec -it git-simulator-db psql -U postgres -c \
  "GRANT ALL PRIVILEGES ON DATABASE git_simulator TO git_user;"
```

## ⚙️ Configuration

### Create Environment File
```bash
cd backend

# Copy example file
cp .env.example .env

# Edit .env with your PostgreSQL credentials
nano .env  # or use your preferred editor
```

### Environment Variables
```env
# PostgreSQL Connection
DB_USER=git_user          # or postgres for superuser
DB_PASSWORD=git_password  # your password
DB_HOST=localhost         # localhost or IP address
DB_PORT=5432              # default PostgreSQL port
DB_NAME=git_simulator     # database name

# Application
SESSION_SECRET=your-secret-key-here
PORT=5000
NODE_ENV=development
```

## 🔍 Verification

### Verify PostgreSQL is Running
```bash
# macOS
brew services list | grep postgresql

# Ubuntu
sudo service postgresql status

# Windows
sc query postgresql-x64-15  # (version number may vary)
```

### Test Database Connection
```bash
# Connect as git_user
psql -U git_user -h localhost -d git_simulator

# Run a test query
SELECT version();

# Exit
\q
```

### Verify Tables Were Created
```bash
psql -U git_user -h localhost -d git_simulator

# List tables
\dt

# Check users table
\d users

# Check repositories table
\d repositories

# Exit
\q
```

## 🛠️ Common Operations

### Backup Database
```bash
pg_dump -U git_user -h localhost git_simulator > backup.sql
```

### Restore Database
```bash
psql -U git_user -h localhost git_simulator < backup.sql
```

### Reset Database (Warning: Deletes All Data)
```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS git_simulator;"
psql -U postgres -f backend/setup.sql
```

### View Database Size
```bash
psql -U git_user -h localhost -d git_simulator

# Check database size
SELECT pg_database.datname,
       pg_size_pretty(pg_database_size(pg_database.datname))
FROM pg_database;

\q
```

## 🐛 Troubleshooting

### "Connection refused"
```
Error: could not connect to server: Connection refused
```
**Solution**: PostgreSQL is not running
- macOS: `brew services start postgresql`
- Ubuntu: `sudo service postgresql start`
- Windows: Start PostgreSQL from Services

### "FATAL: Ident authentication failed"
**Solution**: PostgreSQL authentication issue
```bash
# Try with password prompt
psql -U postgres -h localhost

# Or specify password in .env
PGPASSWORD=your_password psql -U postgres -h localhost
```

### "Database does not exist"
**Solution**: Create database first
```bash
psql -U postgres -c "CREATE DATABASE git_simulator;"
```

### "Role does not exist"
**Solution**: Create the user first
```bash
psql -U postgres -c "CREATE USER git_user WITH PASSWORD 'git_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE git_simulator TO git_user;"
```

### Connection Timeout
**Solution**: Check if PostgreSQL is listening on the correct port
```bash
psql -U postgres -h 127.0.0.1 -p 5432
```

## 📊 Useful PostgreSQL Commands

```bash
# Connect to a database
psql -U username -h host -d database_name

# List all databases
\l

# List all users
\du

# List tables in current database
\dt

# Describe a table
\d table_name

# Get table information
\d+ table_name

# View indexes
\di

# Drop a database (WARNING!)
DROP DATABASE database_name;

# Create a user
CREATE USER username WITH PASSWORD 'password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE database_name TO username;

# Exit
\q
```

## 📚 Additional Resources

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- PostgreSQL Download: https://www.postgresql.org/download/
- pgAdmin (GUI Tool): https://www.pgadmin.org/
- DBeaver (GUI Tool): https://dbeaver.io/

## ✅ Next Steps

Once PostgreSQL is set up:

1. **Install Dependencies**: `npm run install-all`
2. **Start Backend**: `cd backend && npm start`
3. **Start Frontend**: `cd frontend && npm start`
4. **Access Application**: http://localhost:3000

Happy coding! 🚀
