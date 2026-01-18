# Business Dashboard

A modern business metrics dashboard built with Next.js, TypeScript, Tailwind CSS, and MongoDB.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB
- **Authentication**: JWT with 3-day sessions
- **Deployment**: Vercel-ready

## Features

✅ **Secure Authentication** - Login with hardcoded credentials, 3-day session
✅ **Sales Performance** - Track total sales, orders, AOV, WoW changes
✅ **Time-Based Demand** - Hourly and daily sales patterns
✅ **Site Comparison** - Multi-location performance metrics
✅ **Buying & Spend** - Stock spend tracking per site
✅ **Product Performance** - Revenue analysis with Food/Drinks split
✅ **Customer Behaviour** - New vs returning customer insights
✅ **Settings** - Change password functionality
✅ **MongoDB Storage** - All data persists in database

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- MongoDB database (MongoDB Atlas or local instance)

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Configure MongoDB:**

Update the `.env.local` file with your MongoDB connection string:

```env
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
```

**To get a MongoDB connection string:**
- Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a free cluster
- Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
- Replace `your_mongodb_connection_string_here` with your actual connection string

3. **Start the development server:**

```bash
npm run dev
```

4. **Access the dashboard:**

Open [http://localhost:3000](http://localhost:3000) and login with:

- **Email:** kpriyesh1908@gmail.com
- **Password:** 12345678

## Login Credentials

**Email:** `kpriyesh1908@gmail.com`  
**Password:** `12345678`

Session expires after 3 days. To change credentials, edit `lib/auth.ts`.

## Project Structure

```
noasDashboard/
├── app/
│   ├── api/                 # API routes for MongoDB operations
│   │   ├── auth/           # Authentication endpoints
│   │   ├── sales/          # Sales data endpoints
│   │   ├── customers/      # Customer data endpoints
│   │   ├── products/       # Product data endpoints
│   │   ├── sites/          # Site data endpoints
│   │   ├── spend/          # Spend data endpoints
│   │   └── time-demand/    # Time demand data endpoints
│   ├── components/         # React components
│   ├── login/             # Login page
│   ├── settings/          # Settings page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard home page
│   └── globals.css        # Global styles
├── lib/
│   ├── auth.ts            # Authentication logic
│   ├── db.ts              # Database utilities
│   └── mongodb.ts         # MongoDB client
├── middleware.ts          # Route protection
├── .env.local            # Environment variables
└── package.json          # Dependencies
```

## MongoDB Collections

The dashboard uses the following collections:

- `sales` - Sales performance data
- `customers` - Customer behaviour data
- `products` - Product performance data
- `sites` - Site comparison data
- `spend` - Buying & spend data
- `time_demand_hourly` - Hourly sales data
- `time_demand_daily` - Daily sales data

## Deployment

This project is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
4. Deploy with one click

## Usage

1. **Login** - Access the dashboard with provided credentials
2. **View Metrics** - Navigate using the sidebar
3. **Update Data** - Click "+ Update Data" or "+ Add" buttons in each section
4. **Manage Sites/Products** - Add, edit, or delete items as needed
5. **Settings** - Access via sidebar to change password
6. **Logout** - Use the logout button at the bottom of the sidebar

## Security Notes

- Session expires after 3 days of inactivity
- All routes except `/login` are protected
- Passwords are hardcoded for single-user access
- JWT tokens are HTTP-only cookies

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Support

For issues or questions, contact: kpriyesh1908@gmail.com
