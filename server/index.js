const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'sierra-roi-secret-key-2024';
const DATA_FILE = path.join(__dirname, 'data', 'roi_data.xlsx');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// ============= USERS (In-memory for prototype) =============
const users = [
  { id: 1, email: 'admin@twilio.com', password: bcrypt.hashSync('admin123', 10), name: 'Admin User', role: 'admin' },
  { id: 2, email: 'sales@twilio.com', password: bcrypt.hashSync('sales123', 10), name: 'Sales Rep', role: 'user' }
];

// ============= EXCEL HELPERS =============
function initExcel() {
  if (!fs.existsSync(DATA_FILE)) {
    const wb = XLSX.utils.book_new();
    const headers = [
      'id', 'customer_name', 'account_sid', 'sales_rep', 'ae_name',
      'tier_profile', 'current_spend', 'projected_spend',
      'messaging_volume', 'voice_minutes', 'email_volume',
      'cost_savings', 'efficiency_gains', 'revenue_increase',
      'total_value', 'roi', 'payback_months',
      'notes', 'created_at', 'updated_at', 'created_by'
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(wb, ws, 'Calculations');
    XLSX.writeFile(wb, DATA_FILE);
  }
}

function readExcel() {
  initExcel();
  const wb = XLSX.readFile(DATA_FILE);
  const ws = wb.Sheets['Calculations'];
  const data = XLSX.utils.sheet_to_json(ws);
  return data;
}

function writeExcel(data) {
  initExcel();
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Calculations');
  XLSX.writeFile(wb, DATA_FILE);
}

function getNextId() {
  const data = readExcel();
  if (data.length === 0) return 1;
  return Math.max(...data.map(d => d.id || 0)) + 1;
}

// ============= AUTH MIDDLEWARE =============
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ============= AUTH ROUTES =============
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
});

// ============= CALCULATIONS ROUTES =============
app.get('/api/calculations', authMiddleware, (req, res) => {
  try {
    const data = readExcel();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calculations' });
  }
});

app.get('/api/calculations/search', authMiddleware, (req, res) => {
  try {
    const { query } = req.query;
    const data = readExcel();

    if (!query) {
      return res.json(data);
    }

    const lowerQuery = query.toLowerCase();
    const filtered = data.filter(row =>
      (row.customer_name && row.customer_name.toLowerCase().includes(lowerQuery)) ||
      (row.account_sid && row.account_sid.toLowerCase().includes(lowerQuery)) ||
      (row.sales_rep && row.sales_rep.toLowerCase().includes(lowerQuery)) ||
      (row.ae_name && row.ae_name.toLowerCase().includes(lowerQuery))
    );

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search calculations' });
  }
});

app.get('/api/calculations/:id', authMiddleware, (req, res) => {
  try {
    const data = readExcel();
    const calc = data.find(d => d.id === parseInt(req.params.id));

    if (!calc) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(calc);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calculation' });
  }
});

app.post('/api/calculations', authMiddleware, (req, res) => {
  try {
    const data = readExcel();
    const newCalc = {
      id: getNextId(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: req.user.email
    };

    data.push(newCalc);
    writeExcel(data);

    res.json(newCalc);
  } catch (err) {
    console.error('Error saving:', err);
    res.status(500).json({ error: 'Failed to save calculation' });
  }
});

app.put('/api/calculations/:id', authMiddleware, (req, res) => {
  try {
    const data = readExcel();
    const index = data.findIndex(d => d.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({ error: 'Not found' });
    }

    data[index] = {
      ...data[index],
      ...req.body,
      id: parseInt(req.params.id),
      updated_at: new Date().toISOString()
    };

    writeExcel(data);
    res.json(data[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update calculation' });
  }
});

app.delete('/api/calculations/:id', authMiddleware, (req, res) => {
  try {
    const data = readExcel();
    const filtered = data.filter(d => d.id !== parseInt(req.params.id));

    if (filtered.length === data.length) {
      return res.status(404).json({ error: 'Not found' });
    }

    writeExcel(filtered);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete calculation' });
  }
});

// ============= ANALYTICS ROUTES =============
app.get('/api/analytics/dashboard', authMiddleware, (req, res) => {
  try {
    const data = readExcel();

    // Overview stats
    const overview = {
      total_calculations: data.length,
      total_customers: new Set(data.map(d => d.customer_name)).size,
      pipeline_value: data.reduce((sum, d) => sum + (parseFloat(d.total_value) || 0), 0),
      avg_roi: data.length > 0
        ? data.reduce((sum, d) => sum + (parseFloat(d.roi) || 0), 0) / data.length
        : 0
    };

    // By Tier
    const tierGroups = {};
    data.forEach(d => {
      const tier = d.tier_profile || 'Unknown';
      if (!tierGroups[tier]) tierGroups[tier] = { count: 0, total: 0 };
      tierGroups[tier].count++;
      tierGroups[tier].total += parseFloat(d.total_value) || 0;
    });
    const byTier = Object.entries(tierGroups).map(([tier, stats]) => ({
      tier_profile: tier,
      count: stats.count,
      avg_value: stats.total / stats.count
    }));

    // Value Distribution
    const ranges = [
      { min: 0, max: 50000, label: '$0 - $50K' },
      { min: 50000, max: 100000, label: '$50K - $100K' },
      { min: 100000, max: 250000, label: '$100K - $250K' },
      { min: 250000, max: 500000, label: '$250K - $500K' },
      { min: 500000, max: Infinity, label: '$500K+' }
    ];
    const valueDistribution = ranges.map(range => ({
      value_range: range.label,
      count: data.filter(d => {
        const val = parseFloat(d.total_value) || 0;
        return val >= range.min && val < range.max;
      }).length
    }));

    // By AE
    const aeGroups = {};
    data.forEach(d => {
      const ae = d.ae_name || 'Unknown';
      if (!aeGroups[ae]) aeGroups[ae] = { count: 0, total: 0, roiSum: 0 };
      aeGroups[ae].count++;
      aeGroups[ae].total += parseFloat(d.total_value) || 0;
      aeGroups[ae].roiSum += parseFloat(d.roi) || 0;
    });
    const byAE = Object.entries(aeGroups)
      .map(([ae, stats]) => ({
        ae_name: ae,
        calculation_count: stats.count,
        total_pipeline_value: stats.total,
        avg_roi: stats.roiSum / stats.count
      }))
      .sort((a, b) => b.total_pipeline_value - a.total_pipeline_value)
      .slice(0, 10);

    // Recent Activity
    const recentActivity = [...data]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    res.json({ overview, byTier, valueDistribution, byAE, recentActivity });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/analytics/export', authMiddleware, (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      initExcel();
    }
    res.download(DATA_FILE, `sierra_roi_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// ============= START SERVER =============
initExcel();
app.listen(PORT, () => {
  console.log(`\n🚀 Sierra ROI API Server running on http://localhost:${PORT}`);
  console.log(`\n📊 Data stored in: ${DATA_FILE}`);
  console.log(`\n🔑 Default users:`);
  console.log(`   Admin: admin@twilio.com / admin123`);
  console.log(`   Sales: sales@twilio.com / sales123\n`);
});
