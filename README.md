# DairyFarm Biz - Dairy Farm Management System

A comprehensive web-based dairy farm management solution built with React and Node.js.

## Features

- 🐄 **Animal Management**: Track cattle inventory, health records, and breeding history
- 🥛 **Milk Collection**: Record daily milk production with session-wise tracking
- 💰 **Expense Tracking**: Manage farm expenses with category-wise breakdown
- 🧬 **Breeding Management**: Track insemination and pregnancy status
- 📊 **Dashboard**: Visual analytics and key metrics at a glance
- 📥 **Excel Reports**: Download comprehensive reports (weekly, monthly, custom ranges)
- 🔔 **Notifications**: Stay updated with important farm activities
- 🔐 **Authentication**: Secure login with email verification and password reset
- 🌐 **Multilingual**: Support for English and Kannada languages

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast development
- shadcn/ui component library
- Tailwind CSS for styling
- TanStack Query for data fetching
- Recharts for data visualization

**Backend:**
- Node.js with Express
- MongoDB with Mongoose ODM
- JWT authentication
- Email notifications (Gmail SMTP)
- ExcelJS for report generation

## Getting Started

**Use your preferred IDE**

Clone the repository and follow these steps:

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/Rahulhanje/DairyFarmBiz-Frontend.git
cd DairyFarmBiz-Frontend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Start development server
npm run dev
```

### Backend Setup

```bash
# Clone the backend repository
git clone https://github.com/Rahulhanje/DairyFarmBiz-backend.git
cd DairyFarmBiz-backend

# Install dependencies
npm install

# Create .env file with your MongoDB URI and other configs
# See .env.example for required variables

# Start the server
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Environment Variables

### Frontend (.env)
```bash
VITE_API_BASE_URL=https://your-backend-url.com/api/v1
```

### Backend (.env)
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Deployment

**Frontend (Vercel)**
- Connect your GitHub repository
- Build command: `npm run build`
- Output directory: `dist`
- Add environment variable: `VITE_API_BASE_URL`

**Backend (Render)**
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Add all required environment variables

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── contexts/       # React contexts (Auth, Language)
│   ├── lib/            # API client and utilities
│   └── hooks/          # Custom React hooks
├── public/             # Static assets
└── dist/               # Production build

backend/
├── src/
│   ├── modules/        # Feature modules (auth, animal, milk, etc.)
│   ├── middlewares/    # Express middlewares
│   ├── config/         # Configuration files
│   └── utils/          # Utility functions
└── dist/               # Compiled TypeScript
```

## License

This project is private and proprietary.
