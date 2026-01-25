# 🥛 DairyFarm Biz - Frontend

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8.svg)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-orange.svg)]()

> A modern, responsive web application for comprehensive dairy farm management built with React, TypeScript, and Tailwind CSS.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Building for Production](#building-for-production)
- [PWA Features](#pwa-features)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### Core Functionality
- 🔐 **Authentication**
  - Secure login/signup
  - Email verification with OTP
  - Password reset flow
  - Profile management

- 🐄 **Animal Management**
  - Add, edit, delete animals
  - Track cow and buffalo inventory
  - View animal details and history
  - Status filtering (active, sold)

- 🥛 **Milk Collection**
  - Session-wise recording (morning/evening)
  - Automatic amount calculation
  - Fat percentage tracking
  - Date-wise filtering

- 💰 **Financial Tracking**
  - Expense management with categories
  - Milk rate configuration
  - Revenue calculations
  - Profit/loss analysis

- 🧬 **Breeding Records**
  - Insemination tracking
  - Pregnancy status updates
  - Expected delivery dates
  - Calf details

- 📊 **Dashboard**
  - Real-time analytics
  - Interactive charts (Line, Bar, Pie)
  - Key performance indicators
  - Custom date range filters

- 📥 **Excel Reports**
  - Download comprehensive reports
  - Multiple report types (weekly, monthly, custom)
  - Multi-sheet Excel exports
  - All data included

- 🔔 **Notifications**
  - View notification history
  - Email status monitoring
  - Alert management

### User Experience
- 📱 **PWA Support** - Install on mobile devices
- 🌐 **Multilingual** - English and Kannada
- 🎨 **Modern UI** - Clean, intuitive interface
- 📱 **Mobile Responsive** - Works on all devices
- 🔍 **Search & Filter** - Quick data access
- 💫 **Smooth Animations** - Polished interactions
- 🌙 **Glassmorphism** - Modern bottom navigation

## 🛠 Tech Stack

### Core
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **State**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation

### UI Components
- **Component Library**: shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Tailwind transitions

### Utilities
- **Date Handling**: date-fns
- **HTTP Client**: Native fetch with TanStack Query
- **Toast Notifications**: Built-in toast system

## 📦 Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Backend API**: Running instance of DairyFarm Biz backend

## 🚀 Installation

```bash
# Clone repository
git clone https://github.com/Rahulhanje/DairyFarmBiz-Frontend.git
cd DairyFarmBiz-Frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your backend URL

# Start development server
npm run dev
```

Application runs on `http://localhost:8080`

## 🔧 Environment Variables

Create a `.env` file:

```env
# API Configuration
VITE_API_BASE_URL=https://your-backend-url.com/api/v1

# For local development
# VITE_API_BASE_URL=http://localhost:5000/api/v1
```

**Note**: Environment variables must be prefixed with `VITE_` to be accessible in the app.

## 🏃 Running the Application

```bash
# Development mode (with HMR)
npm run dev

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check
npm run type-check
```

## 📁 Project Structure

```
frontend/
├── public/
│   ├── favicon.svg          # App icon
│   ├── icon-192.svg         # PWA icon 192x192
│   ├── icon-512.svg         # PWA icon 512x512
│   ├── manifest.json        # PWA manifest
│   ├── sw.js               # Service worker
│   └── robots.txt
│
├── src/
│   ├── components/
│   │   ├── common/          # Reusable components
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── DateRangePicker.tsx
│   │   ├── layout/          # Layout components
│   │   │   └── AppLayout.tsx
│   │   └── ui/              # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── ...
│   │
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   │
│   ├── hooks/               # Custom hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   │
│   ├── lib/                 # Utilities
│   │   ├── api.ts          # API client
│   │   ├── i18n.ts         # Translations
│   │   └── utils.ts        # Helper functions
│   │
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Animals.tsx
│   │   ├── MilkCollection.tsx
│   │   ├── Expenses.tsx
│   │   ├── Breeding.tsx
│   │   ├── MilkRates.tsx
│   │   ├── Notifications.tsx
│   │   ├── DownloadReport.tsx
│   │   ├── Profile.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── VerifyEmail.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── ResetPassword.tsx
│   │
│   ├── App.tsx              # Root component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
│
├── .env.example            # Example env file
├── components.json         # shadcn/ui config
├── index.html             # HTML template
├── package.json
├── tailwind.config.ts     # Tailwind config
├── tsconfig.json          # TypeScript config
├── vercel.json            # Vercel deployment
└── vite.config.ts         # Vite config
```

## 🏗 Building for Production

```bash
# Build for production
npm run build

# Output directory: dist/
```

The build output can be deployed to any static hosting service.

## 📱 PWA Features

This app is a Progressive Web App (PWA) with:

### Installation
Users can install the app on their devices:
- **Android**: Chrome → Menu → "Install app"
- **iOS**: Safari → Share → "Add to Home Screen"
- **Desktop**: Install button in address bar

### Features
- ✅ Offline caching
- ✅ App-like experience (fullscreen, no browser UI)
- ✅ Custom app icon
- ✅ Splash screen
- ✅ Works like native app

### Files
- `public/manifest.json` - PWA configuration
- `public/sw.js` - Service worker for caching
- `public/icon-*.svg` - App icons

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository

2. **Configure**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables**:
   - Add: `VITE_API_BASE_URL` = your backend URL

4. **Deploy**:
   - Push to `main` branch
   - Auto-deploys on every commit

### Netlify

1. Connect repository
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variable: `VITE_API_BASE_URL`
4. Deploy

### Render

1. Create Static Site
2. Connect repository
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variable
6. Deploy

### Manual Deployment

```bash
# Build
npm run build

# Upload dist/ folder to your hosting
# - AWS S3 + CloudFront
# - Firebase Hosting
# - Cloudflare Pages
# - Any static host
```

### Important Files for Deployment
- `vercel.json` - SPA routing configuration
- `public/robots.txt` - SEO
- `public/_redirects` - For Netlify (if needed)

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Getting Started

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/DairyFarmBiz-Frontend.git
cd DairyFarmBiz-Frontend

# Add upstream
git remote add upstream https://github.com/Rahulhanje/DairyFarmBiz-Frontend.git

# Create feature branch
git checkout -b feature/your-feature-name
```

### Development Guidelines

#### Code Style
- Use functional components with hooks
- Follow TypeScript strict mode
- Use Tailwind CSS for styling
- Keep components small and focused
- Extract reusable logic to custom hooks

#### Component Structure
```tsx
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types
interface Props {
  title: string;
}

// 3. Component
export const MyComponent: React.FC<Props> = ({ title }) => {
  // Hooks
  const [state, setState] = useState('');
  
  // Handlers
  const handleClick = () => {};
  
  // Render
  return <div>{title}</div>;
};
```

#### Naming Conventions
- Components: PascalCase (`MyComponent.tsx`)
- Hooks: camelCase with 'use' prefix (`useCustomHook.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Constants: UPPER_SNAKE_CASE

#### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add dark mode support
fix: resolve mobile navigation issue
docs: update installation guide
style: format code with prettier
refactor: simplify authentication logic
test: add unit tests for utils
```

### Pull Request Process

1. **Update your branch**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run checks**:
   ```bash
   npm run lint       # Check code style
   npm run type-check # TypeScript validation
   npm run build      # Production build
   ```

3. **Create PR**:
   - Clear title and description
   - Link related issues
   - Add screenshots if UI changes
   - Request review

4. **PR Checklist**:
   - [ ] Code follows style guidelines
   - [ ] No TypeScript errors
   - [ ] Tested on mobile and desktop
   - [ ] Updated documentation
   - [ ] Meaningful commit messages

### Reporting Bugs

Create GitHub issue with:

```markdown
**Describe the bug**
Clear description

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- Browser: [e.g., Chrome 120]
- Device: [e.g., iPhone 12]
- OS: [e.g., iOS 16]
```

### Feature Requests

```markdown
**Feature Description**
What feature would you like?

**Problem it solves**
What problem does this address?

**Proposed solution**
How should it work?

**Alternatives**
Other approaches considered
```

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    colors: {
      primary: {...},  // Main brand color
      secondary: {...}, // Secondary color
    }
  }
}
```

### Translations

Add new languages in `src/lib/i18n.ts`:
```typescript
const translations = {
  en: { ... },
  kn: { ... },
  hi: { ... }, // Add new language
}
```

## 📄 License

Private and proprietary. All rights reserved.

## 👥 Author

**Rahul Hanje** - [@Rahulhanje](https://github.com/Rahulhanje)

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TanStack Query](https://tanstack.com/query)

## 📧 Support

For support, create an issue or contact: your-email@example.com

---

**Made with ❤️ for dairy farmers**
