# SplitCampus

SplitCampus is a premium student-focused group expense tracker built with a modern MERN stack:
- **Frontend**: React 18 SPA, Vite, React Router, Lucide Icons, Custom Chart dashboards
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB Atlas (or local MongoDB)
- **Authentication**: JWT (JSON Web Tokens) with Secure HTTP Header context
- **Styling**: Native Vanilla CSS with Zinc Dark/Light design tokens (Zero Tailwind/shadcn-ui dependencies)
- **Uploads**: Multer (Receipt image handling)

Designed for roommates, travel groups, flats, and college clubs, SplitCampus offers a high-end, responsive, SaaS-style user experience inspired by leading platforms like Linear and Vercel.

---

## Core Features

### 🔐 Authentication & Session Security
- Secure signup, login, and logout.
- JWT-based protected route wrappers on the frontend and middleware protection on the backend.
- Password encryption using `bcryptjs`.
- Profile dashboard allowing users to update their name, email, avatar/photo, and password.

### 🎒 Squad (Group) Management
- Create squads with dedicated names, categories, and optional cover images.
- Shareable invitation codes for instant squad onboarding.
- Dynamic member list showing user roles (Admin vs. Member).
- **Squad Deletion (Admin Only)**: Squad leaders can permanently delete a squad. Doing so triggers a cascade delete, removing all associated expenses, settlements, and activity logs to maintain database integrity.
- **Leave Group**: Members can leave a group freely (admin roles are automatically handed over to the next member if the leader leaves).

### 💸 Group Expense Workflow
- Record shared expenses with title, amount, date, optional note description, category, and receipt uploads.
- **Flexible Split Configurations**:
  - **Equal Division**: Splits the total equally among selected group members.
  - **Exact Amounts**: Splits by specifying precise rupee amounts per member.
  - **Percentage Share**: Splits by setting percentage coefficients (must total 100%).
- Select specific squad members to participate in individual expenses.
- Real-time ledger lookup: Search, filter by category or member, sort (highest, lowest, latest, oldest), edit, and delete entries.

### ⚖️ Roommate Balances & Cash Settlements
- Real-time calculation of total paid and total owed by each member.
- **Simplified Debts Engine**: Recommends the mathematically optimal, minimum-transaction "who owes whom" flow to clear outstanding squad balances.
- Partial and full cash settlement logging.
- Settlement history registry containing historical transaction records.

### 📊 Personal Money Manager (Separate Module)
- Fully isolated personal expense tracker separate from shared group ledgers.
- Add, edit, and delete personal monthly bills.
- Real-time calculations of current month vs. previous month spending.
- Custom dropdown category selectors and private note fields (mapped via a fallback string to preserve database schema integrity).
- Grouped category summaries and interactive analytics charts.

### 📈 SaaS Dashboards & Analytics Panels
- Dynamic time-of-day greetings (e.g. *"Good Morning, Jayant 👋"*) customized by user details.
- Vercel-style metrics cards displaying total balances, active squads, and monthly expenditures.
- Live group activity log timeline.
- Custom Chart analytics tracking monthly category expenditures and individual member contributions.

---

## Project Structure

```text
SplitCampus/
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── scripts/
│   │   └── seedSampleData.js (Sample database generator)
│   └── src/
│       ├── app.js            (App bootstrap and middleware configurations)
│       ├── server.js         (Server listener)
│       ├── config/           (Database connection settings)
│       ├── controllers/      (Route business logic handlers)
│       ├── middleware/       (Authentication & file upload filters)
│       ├── models/           (Mongoose schemas: User, Group, Expense, PersonalExpense, etc.)
│       ├── routes/           (API routes: auth, group, settlement, personalExpense, etc.)
│       ├── services/         (Balance calculation & action activity logging)
│       ├── uploads/          (Locally saved receipt image files)
│       └── utils/            (AppError classes, helpers, and validation)
├── frontend/
│   ├── package.json
│   ├── index.html            (SPA mount point)
│   ├── vite.config.js        (Dev port configuration and backend proxies)
│   └── src/
│       ├── main.jsx          (Vite entrypoint)
│       ├── App.jsx           (Routes registry & layout wrapper)
│       ├── index.css         (Custom CSS Design system and Zinc design tokens)
│       ├── api/              (Base HTTP client and api endpoints)
│       ├── components/       (Reusable layouts, models, modal forms)
│       ├── context/          (AuthContext for session state propagation)
│       ├── pages/            (Dashboard, Groups, SingleGroup, PersonalExpenses, Profile, Login, Signup)
│       └── utils/            (Currency formatting & date time converters)
└── README.md
```

---

## Database Schemas (Mongoose)

- **`User`**: Profile name, email, encrypted password, and uploaded avatar path.
- **`Group`**: Name, description, type, cover image, invite code, creator ID, and members array (embedded with roles & join dates).
- **`Expense`**: Title, total amount, date, note description, category tag, payer ID, receipt path, split style (equal/exact/percentage), and split members details.
- **`PersonalExpense`**: Isolated user expenses containing amount, title, category, date, and description.
- **`Settlement`**: Registry of payments cleared between roommates (payer ID, receiver ID, amount, and date).
- **`Activity`**: Log registry tracking actions performed in a group (joins, expense additions, updates) shown on the squad timeline.

---

## REST API Summary

### Authentication & Profiles
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Authenticate user & receive session token
- `POST /api/auth/logout` - Clear user session token
- `GET /api/auth/me` - Fetch authenticated user profile details

### User Settings
- `GET /api/users/profile` - Fetch current user information
- `PUT /api/users/profile` - Edit user avatar and profile details
- `PUT /api/users/password` - Change secure password

### Squad (Group) Management
- `GET /api/groups` - Retrieve all squads current user is member of
- `POST /api/groups` - Create a new squad (creator is set as Admin)
- `POST /api/groups/join` - Join an existing squad using an invite code
- `GET /api/groups/:groupId` - Retrieve squad metadata
- `PUT /api/groups/:groupId` - Update squad metadata (Admin only)
- `DELETE /api/groups/:groupId` - Permanently delete a squad, cascading to purge associated ledger items (Admin only)
- `GET /api/groups/:groupId/dashboard` - Fetch squad overview (balances, timeline logs, members)
- `GET /api/groups/:groupId/balances` - Fetch calculated squad balances and debt suggestions
- `POST /api/groups/:groupId/members` - Invite a user to the squad by email (Admin only)
- `DELETE /api/groups/:groupId/members/:userId` - Kick a member out of the squad (Admin only)
- `POST /api/groups/:groupId/leave` - Leave the squad

### Group Expenses
- `GET /api/groups/:groupId/expenses` - Retrieve all expenses in a squad (supports search, sort, filter)
- `POST /api/groups/:groupId/expenses` - Create a new group expense (handles receipt uploads)
- `GET /api/groups/:groupId/expenses/:expenseId` - Fetch details for a specific group expense
- `PUT /api/groups/:groupId/expenses/:expenseId` - Update an existing group expense
- `DELETE /api/groups/:groupId/expenses/:expenseId` - Delete an expense and recalculate group balances

### Cash Settlements
- `GET /api/groups/:groupId/settlements` - Retrieve historical settlement logs
- `POST /api/groups/:groupId/settlements` - Log a new payment between roommates

### Personal Ledger Module
- `GET /api/personal-expenses` - Retrieve user's personal expenses list
- `POST /api/personal-expenses` - Add a personal expense (fallbacks append payment method to notes)
- `PUT /api/personal-expenses/:expenseId` - Edit personal expense details
- `DELETE /api/personal-expenses/:expenseId` - Delete a personal expense
- `GET /api/personal-expenses/summary` - Calculate current month personal spending totals
- `GET /api/personal-expenses/analytics` - Group personal spending details by category

---

## Setup & Running Locally

### 1. Configure the Environment
Copy `backend/.env.example` into a new file `backend/.env` and update the values:
```env
PORT=5002
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/splitcampus
JWT_SECRET=use_a_long_cryptographically_secure_random_string
JWT_EXPIRES_IN=7d
```

### 2. Start the Backend Server
```bash
cd backend
npm install
npm run seed  # Optional: Seeds sample mock data (credentials below)
npm run dev   # Starts backend on http://localhost:5002
```

### 3. Start the Frontend Application
In a separate terminal:
```bash
cd frontend
npm install
npm run dev   # Starts Vite Dev Server on http://localhost:3000
```
Visit `http://localhost:3000` to interact with the application. Vite automatically proxies API requests to the backend server.

---

## Notes for Interview Preparation

- **Dynamic Balances**: The database does *not* store static, pre-computed group balances. Instead, balances and debt recommendations are calculated dynamically upon request. This prevents data inconsistency and race conditions.
- **Cascade Deletions**: Deleting a squad removes its expenses, settlements, and activities in a single transaction-like batch to avoid dangling foreign keys (database orphans) in MongoDB.
- **Proxy Configuration**: The frontend React app runs on port `3000` and uses Vite's proxy configs to map `/api` and `/uploads` routes to port `5002` transparently, bypassing CORS issues without messy origin header configurations in production.
- **Custom CSS Design Tokens**: Replaced standard frameworks with customized CSS custom properties (`--bg`, `--surface`, `--primary`, `--border`) to provide a consistent, responsive, high-fidelity Zinc UI layout from scratch.

---

## Seed Credentials
After running `npm run seed`, you can log in using these mock accounts (Password: `password123`):
- `aarav@example.com`
- `riya@example.com`
- `kabir@example.com`
