# SplitCampus

SplitCampus is a student-focused group expense tracker built with a clean MERN-style stack:
- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Authentication: JWT
- Charts: Chart.js
- Uploads: Multer

It is designed for hostel roommates, flatmates, college trips, and event groups where members need a simple but professional way to create groups, add expenses, split bills, track balances, record settlements, upload receipts, and view analytics.

## Core Features

### Authentication and profile
- Signup, login, logout
- JWT-based protected routes
- Secure password hashing with `bcryptjs`
- Profile page with name, email, photo update, and password change

### Group management
- Create groups with type and optional image
- Invite using email or join with invite code
- Admin-controlled member management
- Leave group support with admin handover

### Expense workflow
- Add expense with title, amount, date, description, category, payer, and receipt
- Split by equal, exact amount, or percentage
- Support for selected members only
- Expense search, filter, sort, edit, and delete
- Default categories plus optional custom category

### Personal monthly expenses module
- Separate personal money-manager page
- Add, edit, and delete individual expenses
- Track current month total and selected month total
- Filter personal history by month and category
- Category-wise monthly totals
- Monthly spending chart for yearly analytics

### Balances and settlements
- Total paid by each member
- Total owed by each member
- Net balance calculation
- Simplified "who owes whom" suggestions
- Partial and full settlement recording
- Settlement history page

### Dashboards and analytics
- Personal dashboard for current user
- Group dashboard with members, activity, balances, and expenses
- Monthly total spend
- Category-wise spend
- Member-wise contribution
- Highest spending month
- Chart.js analytics page

## Project Structure

```text
SplitCampus/
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── scripts/
│   │   └── seedSampleData.js
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── uploads/
│       └── utils/
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── main.css
│   ├── pages/
│   └── js/
│       ├── api/
│       ├── components/
│       ├── pages/
│       └── utils/
└── README.md
```

## Database Models

- `User`
  Name, email, hashed password, profile photo
- `Group`
  Group info, invite code, admin/member structure, optional image
- `Expense`
  Expense details, payer, category, receipt path, split type, split member array
- `PersonalExpense`
  User-owned personal expenses kept fully separate from shared group expenses
- `Settlement`
  Payment records between members
- `Activity`
  Recent group actions for dashboard timeline

## REST API Summary

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### User
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `PUT /api/users/password`

### Groups
- `GET /api/groups`
- `POST /api/groups`
- `POST /api/groups/join`
- `GET /api/groups/:groupId`
- `PUT /api/groups/:groupId`
- `GET /api/groups/:groupId/dashboard`
- `GET /api/groups/:groupId/balances`
- `POST /api/groups/:groupId/members`
- `DELETE /api/groups/:groupId/members/:userId`
- `POST /api/groups/:groupId/leave`

### Expenses
- `GET /api/groups/:groupId/expenses`
- `POST /api/groups/:groupId/expenses`
- `GET /api/groups/:groupId/expenses/:expenseId`
- `PUT /api/groups/:groupId/expenses/:expenseId`
- `DELETE /api/groups/:groupId/expenses/:expenseId`

### Settlements
- `GET /api/groups/:groupId/settlements`
- `POST /api/groups/:groupId/settlements`

### Dashboard and analytics
- `GET /api/dashboard/personal`
- `GET /api/groups/:groupId/analytics/monthly`

### Personal expenses
- `GET /api/personal-expenses`
- `POST /api/personal-expenses`
- `PUT /api/personal-expenses/:expenseId`
- `DELETE /api/personal-expenses/:expenseId`
- `GET /api/personal-expenses/summary`
- `GET /api/personal-expenses/analytics`

## Setup Steps

### 1. Open the project
- Open the `SplitCampus` folder in VS Code

### 2. Configure backend environment
- Copy `backend/.env.example` to `backend/.env`
- Update:
  - `MONGODB_URI`
  - `JWT_SECRET`

### 3. Install backend dependencies
```bash
cd backend
npm install
```

### 4. Start MongoDB
- Make sure MongoDB is running locally
- Example local connection string:
  `mongodb://127.0.0.1:27017/splitcampus`

### 5. Optional: seed sample data
```bash
cd backend
npm run seed
```

### 6. Run the project
```bash
cd backend
npm run dev
```

### 7. Open the app
- Visit `http://localhost:<PORT>`
- In the current local `.env`, the app runs at `http://localhost:5001`
- The backend serves both the API and the frontend pages

## Frontend Pages

- `/` landing page
- `/pages/login.html`
- `/pages/signup.html`
- `/pages/dashboard.html`
- `/pages/profile.html`
- `/pages/groups.html`
- `/pages/single-group.html?group=<groupId>`
- `/pages/add-expense.html?group=<groupId>`
- `/pages/settlements.html?group=<groupId>`
- `/pages/analytics.html?group=<groupId>`
- `/personal-expenses/index.html`

## Notes for Interview Explanation

- The project keeps balance logic dynamic instead of storing computed balances in the database
- Group members and expense splits use embedded arrays to keep the schema easier to understand
- Activity tracking is kept simple and readable for dashboard use
- The frontend is intentionally built without React to show strong vanilla JavaScript fundamentals
- The backend serves the frontend statically, so the app is easy to run on a laptop

## Future Improvements

- Email-based invitation sending
- Receipt OCR or text extraction
- Pagination for large groups
- Role promotion beyond a single admin flow
- Export reports as PDF or CSV
- Real-time updates with WebSockets

## Sample Seed Credentials

After running `npm run seed`:
- `aarav@example.com` / `password123`
- `riya@example.com` / `password123`
- `kabir@example.com` / `password123`

## Important Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/splitcampus
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
```

## Tech Notes

- Frontend requests use the Fetch API
- Auth state is stored in `localStorage`
- Uploaded files are served from `/uploads`
- Chart.js is loaded from CDN on the analytics page
