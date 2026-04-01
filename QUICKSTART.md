# Quick Start Guide

## Prerequisites
Make sure you have Node.js, Git, and PostgreSQL installed on your system:
```bash
node --version  # Should be v14+
npm --version
git --version
psql --version  # PostgreSQL
```

## Installation & Setup (10 minutes)

### 1. Setup PostgreSQL Database
```bash
# Start PostgreSQL
# macOS: brew services start postgresql
# Ubuntu: sudo service postgresql start

# Create database using psql
psql -U postgres -f backend/setup.sql
```

### 2. Configure Backend Environment
```bash
cd backend
cp .env.example .env

# Edit .env with your PostgreSQL credentials:
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=git_simulator
```

### 3. Install Dependencies
From the root directory:
```bash
npm run install-all
```

### 4. Start Backend Server
```bash
cd backend
npm start
```
You should see: `Backend server running on port 5000`

### 5. Start Frontend Application
In a new terminal:
```bash
cd frontend
npm start
```
The frontend will automatically open at http://localhost:3000

## Using the Application

### First Time Setup
1. Click "Register" to create a new account
2. Enter a username and password
3. You'll be redirected to the web terminal

### Working with Git in Terminal
1. **Open Terminal**: You're in `/repos` (root directory)
2. **Create Repository**: Type `git init my-project` to initialize a repo
3. **Switch Repositories**: Use `cd my-project` to enter a repository
4. **Create Branches**: `git branch feature/new-feature`
5. **Make Commits**: `git add .` then `git commit -m "message"`
6. **View History**: `git log`

## File Structure Explanation

```
git-simulator/
├── backend/              # Node.js server (port 5000)
│   ├── .env             # Configuration (PostgreSQL credentials)
│   ├── setup.sql        # PostgreSQL schema setup script
│   └── src/
├── frontend/            # React app (port 3000)
└── README.md            # Full documentation
```

## Troubleshooting

### PostgreSQL Connection Error
```bash
# Check if PostgreSQL is running
psql -U postgres

# If connection fails:
psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed
# Solution: Make sure PostgreSQL service is running
# macOS: brew services start postgresql
# Ubuntu: sudo service postgresql start
```

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Database Not Found
- Run: `psql -U postgres -f backend/setup.sql`
- Or manually create: `CREATE DATABASE git_simulator;`

## Testing the Application

1. **Register**: Create account `testuser` / `password123`
2. **Create Repository**: Type `git init my-learning-repo`
3. **Enter Repository**: Type `cd my-learning-repo`
4. **Create Branch**: Type `git branch feature/test`
5. **Switch Branch**: Type `git checkout feature/test`
6. **View Branches**: Type `git branch`

## Tips

- Each user has completely isolated repositories
- All repositories are stored in `/backend/repos/{userId}/`
- Database: PostgreSQL running on localhost:5432
- Terminal: VS Code-like dark theme interface
- Commands: Type `git --help` in the terminal for git help

## Next Steps

- Read the full [README.md](./README.md) for detailed API documentation
- Check [Terminal Commands](./README.md#-%20Terminal%20Commands) for all available commands
- Explore the backend code in `backend/src/services/` to understand git operations

---

Happy learning! 🚀
