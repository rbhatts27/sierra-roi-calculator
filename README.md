# Sierra ROI Calculator

A full-stack ROI calculator for Sierra customer demonstrations.

## Quick Start

### 1. Install Dependencies

```bash
# Install both server and client dependencies
cd server && npm install
cd ../client && npm install
```

### 2. Start the Application

Open **two terminal windows**:

**Terminal 1 - Backend API (Port 3001):**
```bash
cd server
npm start
```

**Terminal 2 - React Frontend (Port 3000):**
```bash
cd client
npm start
```

### 3. Open in Browser

- **App:** http://localhost:3000
- **API:** http://localhost:3001

### 4. Login Credentials

| Role  | Email              | Password  |
|-------|-------------------|-----------|
| Admin | admin@twilio.com  | admin123  |
| Sales | sales@twilio.com  | sales123  |

## Features

- **ROI Calculator:** Input customer data, calculate ROI, net savings, and payback period
- **Customer Management:** Create, edit, search, and delete calculations
- **Excel Storage:** All data saved to `server/data/roi_data.xlsx`
- **Search:** Find records by customer name, Account SID, or sales rep
- **Admin Dashboard:** Analytics, performance by tier, AE leaderboard
- **Export:** Download all data as Excel file

## Project Structure

```
sierra-roi-calculator/
├── server/               # Node.js/Express backend
│   ├── index.js          # API server
│   ├── data/             # Excel data storage
│   └── package.json
├── client/               # React frontend
│   ├── src/
│   │   ├── SierraROIApp.jsx  # Main app component
│   │   └── index.js
│   ├── public/
│   └── package.json
└── README.md
```

## Data Storage

All ROI calculations are stored in `server/data/roi_data.xlsx`. The file is created automatically on first save. You can:
- Export the file directly from the Admin Dashboard
- Open it in Excel for manual editing
- Back it up as needed
