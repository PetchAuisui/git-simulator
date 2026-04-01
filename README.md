# 🔧 Git Simulator

A modern web-based multi-user git learning simulator that allows users to learn and practice git commands in a safe, interactive environment. Each user gets their own isolated git repositories with support for creating, managing, and committing to branches.

## ✨ Features

- **Multi-User Support**: Each user has their own account and isolated repositories
- **Real Git Backend**: Actual git repositories stored on the server with real `git` commands
- **Branch Management**: Create, list, and switch branches with unique namespaces per user
- **File Management**: Create, edit, and manage files within repositories
- **Commit History**: View complete commit history with messages and metadata
- **Web-Based IDE**: Simple file editor integrated into the web interface
- **User Authentication**: Secure login/register system using sessions

## 🏗️ Project Structure

```
git-simulator/
├── backend/                 # Express.js backend server
│   ├── src/
│   │   ├── index.js        # Main server file
│   │   ├── routes/         # API route handlers
│   │   │   ├── userRoutes.js
│   │   │   └── gitRoutes.js
│   │   ├── services/       # Business logic
│   │   │   ├── userService.js
│   │   │   └── gitService.js
│   │   └── db/             # Database setup
│   │       └── database.js
│   ├── repos/              # User git repositories (created at runtime)
│   └── package.json
│
├── frontend/               # React.js frontend application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   │   ├── Header.js
│   │   │   ├── RepoList.js
│   │   │   ├── CreateRepoModal.js
│   │   │   ├── BranchSelector.js
│   │   │   ├── FileEditor.js
│   │   │   └── CommitHistory.js
│   │   ├── pages/          # Page components
│   │   │   ├── AuthPage.js
│   │   │   ├── Dashboard.js
│   │   │   └── RepoDetail.js
│   │   ├── services/       # API client
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   └── package.json
│
├── .gitignore
├── package.json            # Root package.json for project management
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git installed on your system
- **PostgreSQL** (v12 or higher)

### Database Setup

1. **Install PostgreSQL** (if not already installed)
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql`
   - Windows: Download from https://www.postgresql.org/download/windows/

2. **Start PostgreSQL**
   - macOS: `brew services start postgresql`
   - Ubuntu: `sudo service postgresql start`
   - Windows: PostgreSQL runs as service automatically

3. **Create Database and User**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # In psql prompt, run:
   CREATE DATABASE git_simulator;
   CREATE USER git_user WITH PASSWORD 'git_password';
   ALTER ROLE git_user SET client_encoding TO 'utf8';
   ALTER ROLE git_user SET default_transaction_isolation TO 'read committed';
   ALTER ROLE git_user SET default_transaction_deferrable TO on;
   ALTER ROLE git_user SET timezone TO 'UTC';
   GRANT ALL PRIVILEGES ON DATABASE git_simulator TO git_user;
   \q
   ```

   Or use the setup script:
   ```bash
   psql -U postgres -f backend/setup.sql
   ```

4. **Configure Environment Variables**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials
   ```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd git-simulator
   ```

2. **Install dependencies for both frontend and backend**
   ```bash
   npm run install-all
   ```

   Or manually:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

### Running the Application

#### Option 1: Run both servers concurrently (requires `concurrently` package)
```bash
npm run dev
```

#### Option 2: Run separately

Terminal 1 - Backend:
```bash
cd backend
npm start
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📖 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/me` - Get current user info
- `POST /api/users/logout` - Logout user

### Repository Management
- `POST /api/git/repo/create` - Create new repository
- `GET /api/git/repos` - List user's repositories

### Branch Operations
- `POST /api/git/branch/create` - Create new branch
- `GET /api/git/branches/:repoName` - List branches
- `POST /api/git/branch/checkout` - Checkout branch

### File Operations
- `POST /api/git/file/write` - Write/update file
- `GET /api/git/file/read/:repoName/:filePath` - Read file content
- `GET /api/git/files/:repoName/:dirPath` - List files in directory

### Commit Operations
- `POST /api/git/commit` - Commit changes
- `GET /api/git/history/:repoName` - Get commit history

### Status
- `GET /api/git/status/:repoName` - Get repository status

## 🔑 Key Architecture Decisions

### User Isolation
- Each user's repositories are stored in separate directories: `/repos/{userId}/{repoName}`
- Session-based authentication ensures users can only access their own repositories
- Branches can have the same name across different users without conflicts

### Real Git Implementation
- Uses `simple-git` library to execute actual git commands
- Real git repositories stored on the server disk
- All git operations respect standard git workflow

### Backend Structure
- **Services**: Core business logic separated from routing
- **Routes**: Clean REST API endpoints
- **Database**: PostgreSQL for reliable user and repository metadata storage

### Frontend Architecture
- **React Hooks**: Functional components with state management
- **React Router**: Client-side routing for SPA navigation
- **Axios**: HTTP client for API communication
- **Sessions**: Cookies maintain user session across page reloads

## 💾 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Repositories Table
```sql
CREATE TABLE repositories (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "repoName" TEXT NOT NULL,
  path TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES users(id),
  UNIQUE("userId", "repoName")
)
```

### Database Configuration
The application uses PostgreSQL for data persistence. Configuration is managed through environment variables in `.env`:

```env
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=git_simulator
```

All database queries use parameterized statements to prevent SQL injection.

## 🎯 Usage Flow

1. **Register/Login**: Create account or sign in
2. **Create Repository**: Click "New Repository" on dashboard
3. **Manage Branches**: Create and switch between branches
4. **Edit Files**: Open and edit files in the web editor
5. **Commit Changes**: Stage files and create commits with messages
6. **View History**: Check commit history and track changes

## ⚠️ Important Notes

### Security Considerations (Development Only)
- **Password Storage**: Currently stores passwords in plaintext. Use bcrypt in production
- **CORS**: Currently allows all origins. Configure appropriately for production
- **Session Secret**: Uses default secret. Set `SESSION_SECRET` environment variable

### Limitations
- File size limits should be implemented for production
- Merge operations not yet implemented
- Clone/pull operations work locally only
- No SSH support

## 🚀 Future Enhancements

- [ ] Merge branch functionality
- [ ] Visual diff viewer
- [ ] Pull/push operations
- [ ] Stash functionality
- [ ] Tag support
- [ ] Collaboration features (shared repositories)
- [ ] Admin dashboard
- [ ] Repository permissions/sharing
- [ ] Markdown preview for README files
- [ ] SSH key authentication

## 📝 Development Notes

### Adding New Git Operations
1. Add method in `backend/src/services/gitService.js`
2. Add route in `backend/src/routes/gitRoutes.js`
3. Add API method in `frontend/src/services/api.js`
4. Create UI component for the feature

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

**Database Lock Error**
- Delete `database.db` and restart the server

**Git Command Not Found**
- Ensure git is installed: `git --version`

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Created for learning git concepts in an interactive, web-based environment!**
