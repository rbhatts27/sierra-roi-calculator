import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ============= AUTH SERVICE =============
const AuthService = {
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => localStorage.getItem('token'),

  isAuthenticated: () => !!localStorage.getItem('token')
};

// ============= API SERVICE =============
const ApiService = {
  headers: () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AuthService.getToken()}`
  }),

  getCalculations: async () => {
    const response = await fetch(`${API_URL}/calculations`, {
      headers: ApiService.headers()
    });
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },

  searchCalculations: async (query) => {
    const response = await fetch(`${API_URL}/calculations/search?query=${encodeURIComponent(query)}`, {
      headers: ApiService.headers()
    });
    if (!response.ok) throw new Error('Failed to search');
    return response.json();
  },

  getCalculation: async (id) => {
    const response = await fetch(`${API_URL}/calculations/${id}`, {
      headers: ApiService.headers()
    });
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },

  saveCalculation: async (calculation) => {
    const response = await fetch(`${API_URL}/calculations`, {
      method: 'POST',
      headers: ApiService.headers(),
      body: JSON.stringify(calculation)
    });
    if (!response.ok) throw new Error('Failed to save');
    return response.json();
  },

  updateCalculation: async (id, calculation) => {
    const response = await fetch(`${API_URL}/calculations/${id}`, {
      method: 'PUT',
      headers: ApiService.headers(),
      body: JSON.stringify(calculation)
    });
    if (!response.ok) throw new Error('Failed to update');
    return response.json();
  },

  deleteCalculation: async (id) => {
    const response = await fetch(`${API_URL}/calculations/${id}`, {
      method: 'DELETE',
      headers: ApiService.headers()
    });
    if (!response.ok) throw new Error('Failed to delete');
    return response.json();
  },

  getAnalytics: async () => {
    const response = await fetch(`${API_URL}/analytics/dashboard`, {
      headers: ApiService.headers()
    });
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  },

  exportData: async () => {
    const response = await fetch(`${API_URL}/analytics/export`, {
      headers: ApiService.headers()
    });
    if (!response.ok) throw new Error('Failed to export');
    return response.blob();
  }
};

// ============= LOGIN COMPONENT =============
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await AuthService.login(email, password);
      onLogin();
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Sierra ROI Calculator</h1>
        <p className="text-slate-600 mb-6">Sign in to access your account</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="your.email@twilio.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="********"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Default admin: <span className="font-semibold">admin@twilio.com</span> / admin123
          </p>
        </div>
      </div>
    </div>
  );
}

// ============= CUSTOMER LIST COMPONENT =============
function CustomerList({ onSelect, onNew }) {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await ApiService.getCalculations();
      setCustomers(data);
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadCustomers();
      return;
    }

    try {
      const data = await ApiService.searchCalculations(query);
      setCustomers(data);
    } catch (err) {
      console.error('Error searching:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this calculation?')) return;

    try {
      await ApiService.deleteCalculation(id);
      loadCustomers();
    } catch (err) {
      alert('Error deleting calculation');
    }
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(num || 0);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by customer name, Account SID, or sales rep..."
          className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={onNew}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          + New Calculation
        </button>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-600">No calculations found</p>
          <button
            onClick={onNew}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Create Your First Calculation
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-slate-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">{customer.customer_name}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Account SID: {customer.account_sid} | Sales Rep: {customer.sales_rep || 'N/A'}
                    {customer.ae_name && ` | AE: ${customer.ae_name}`}
                  </p>
                  <div className="mt-3 flex gap-4">
                    <span className="text-sm">
                      <span className="text-slate-600">Value:</span>{' '}
                      <span className="font-semibold text-green-600">{formatCurrency(customer.total_value)}</span>
                    </span>
                    <span className="text-sm">
                      <span className="text-slate-600">ROI:</span>{' '}
                      <span className="font-semibold text-blue-600">{(customer.roi || 0).toFixed(0)}%</span>
                    </span>
                    <span className="text-sm">
                      <span className="text-slate-600">Tier:</span>{' '}
                      <span className="font-semibold">{customer.tier_profile || 'N/A'}</span>
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelect(customer.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    View/Edit
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============= CALCULATOR WITH DB COMPONENT =============
function CalculatorWithDB({ customerId, onBack }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    account_sid: '',
    sales_rep: '',
    ae_name: '',
    tier_profile: 'Growth',
    current_spend: '',
    projected_spend: '',
    messaging_volume: '',
    voice_minutes: '',
    email_volume: '',
    cost_savings: '',
    efficiency_gains: '',
    revenue_increase: '',
    notes: ''
  });

  const [results, setResults] = useState(null);

  useEffect(() => {
    if (customerId) {
      loadCalculation();
    }
  }, [customerId]);

  const loadCalculation = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getCalculation(customerId);
      setFormData({
        customer_name: data.customer_name || '',
        account_sid: data.account_sid || '',
        sales_rep: data.sales_rep || '',
        ae_name: data.ae_name || '',
        tier_profile: data.tier_profile || 'Growth',
        current_spend: data.current_spend || '',
        projected_spend: data.projected_spend || '',
        messaging_volume: data.messaging_volume || '',
        voice_minutes: data.voice_minutes || '',
        email_volume: data.email_volume || '',
        cost_savings: data.cost_savings || '',
        efficiency_gains: data.efficiency_gains || '',
        revenue_increase: data.revenue_increase || '',
        notes: data.notes || ''
      });
      if (data.total_value) {
        setResults({
          total_value: data.total_value,
          roi: data.roi,
          payback_months: data.payback_months
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load calculation' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateROI = () => {
    const currentSpend = parseFloat(formData.current_spend) || 0;
    const projectedSpend = parseFloat(formData.projected_spend) || 0;
    const costSavings = parseFloat(formData.cost_savings) || 0;
    const efficiencyGains = parseFloat(formData.efficiency_gains) || 0;
    const revenueIncrease = parseFloat(formData.revenue_increase) || 0;

    // Total value = cost savings + efficiency gains + revenue increase
    const totalValue = costSavings + efficiencyGains + revenueIncrease;

    // Implementation cost estimate based on tier
    const tierCosts = {
      'Starter': 10000,
      'Growth': 25000,
      'Enterprise': 50000,
      'Strategic': 100000
    };
    const implementationCost = tierCosts[formData.tier_profile] || 25000;

    // ROI = (Total Value - Implementation Cost) / Implementation Cost * 100
    const roi = implementationCost > 0
      ? ((totalValue - implementationCost) / implementationCost) * 100
      : 0;

    // Payback period in months
    const monthlyValue = totalValue / 12;
    const paybackMonths = monthlyValue > 0
      ? implementationCost / monthlyValue
      : 0;

    const calculatedResults = {
      total_value: totalValue,
      roi: Math.round(roi),
      payback_months: Math.round(paybackMonths * 10) / 10
    };

    setResults(calculatedResults);
    return calculatedResults;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer_name || !formData.account_sid) {
      setMessage({ type: 'error', text: 'Customer name and Account SID are required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const calculatedResults = calculateROI();

      const dataToSave = {
        ...formData,
        current_spend: parseFloat(formData.current_spend) || 0,
        projected_spend: parseFloat(formData.projected_spend) || 0,
        messaging_volume: parseFloat(formData.messaging_volume) || 0,
        voice_minutes: parseFloat(formData.voice_minutes) || 0,
        email_volume: parseFloat(formData.email_volume) || 0,
        cost_savings: parseFloat(formData.cost_savings) || 0,
        efficiency_gains: parseFloat(formData.efficiency_gains) || 0,
        revenue_increase: parseFloat(formData.revenue_increase) || 0,
        total_value: calculatedResults.total_value,
        roi: calculatedResults.roi,
        payback_months: calculatedResults.payback_months
      };

      if (customerId) {
        await ApiService.updateCalculation(customerId, dataToSave);
        setMessage({ type: 'success', text: 'Calculation updated successfully!' });
      } else {
        await ApiService.saveCalculation(dataToSave);
        setMessage({ type: 'success', text: 'Calculation saved successfully!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save calculation' });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(num || 0);
  };

  if (loading) {
    return <div className="text-center py-8">Loading calculation...</div>;
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
      >
        ← Back to Customer List
      </button>

      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        {customerId ? 'Edit Calculation' : 'New ROI Calculation'}
      </h2>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Customer Information */}
        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Customer Name *</label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Acme Corporation"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Account SID *</label>
              <input
                type="text"
                name="account_sid"
                value={formData.account_sid}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="AC123456789"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Sales Rep</label>
              <input
                type="text"
                name="sales_rep"
                value={formData.sales_rep}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">AE Name</label>
              <input
                type="text"
                name="ae_name"
                value={formData.ae_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tier Profile</label>
              <select
                name="tier_profile"
                value={formData.tier_profile}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="Starter">Starter</option>
                <option value="Growth">Growth</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Strategic">Strategic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Current Usage */}
        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Current Usage & Spend</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Current Annual Spend ($)</label>
              <input
                type="number"
                name="current_spend"
                value={formData.current_spend}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="100000"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Projected Annual Spend ($)</label>
              <input
                type="number"
                name="projected_spend"
                value={formData.projected_spend}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="150000"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Messaging Volume</label>
              <input
                type="number"
                name="messaging_volume"
                value={formData.messaging_volume}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="1000000"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Voice Minutes</label>
              <input
                type="number"
                name="voice_minutes"
                value={formData.voice_minutes}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="50000"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Email Volume</label>
              <input
                type="number"
                name="email_volume"
                value={formData.email_volume}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="500000"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Value Drivers */}
        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Annual Value Drivers ($)</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Cost Savings</label>
              <input
                type="number"
                name="cost_savings"
                value={formData.cost_savings}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="50000"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Efficiency Gains</label>
              <input
                type="number"
                name="efficiency_gains"
                value={formData.efficiency_gains}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="30000"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Revenue Increase</label>
              <input
                type="number"
                name="revenue_increase"
                value={formData.revenue_increase}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="100000"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Notes</h3>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
            rows="3"
            placeholder="Additional notes about this calculation..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={calculateROI}
            className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Calculate ROI
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : (customerId ? 'Update Calculation' : 'Save Calculation')}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="mt-8 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border-2 border-green-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">ROI Results</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-slate-600 mb-1">Total Annual Value</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(results.total_value)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-slate-600 mb-1">Return on Investment</p>
                <p className="text-3xl font-bold text-blue-600">{results.roi}%</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-slate-600 mb-1">Payback Period</p>
                <p className="text-3xl font-bold text-purple-600">{results.payback_months} months</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

// ============= ADMIN DASHBOARD =============
function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await ApiService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await ApiService.exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sierra_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
    } catch (err) {
      alert('Error exporting data');
    }
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(num || 0);
  };

  if (loading) return <div className="text-center py-8">Loading analytics...</div>;
  if (!analytics) return <div>Error loading analytics</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h2>
        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Export All Data
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <p className="text-sm text-slate-600 mb-2">Total Calculations</p>
          <p className="text-3xl font-bold text-slate-900">{analytics.overview.total_calculations}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <p className="text-sm text-slate-600 mb-2">Total Customers</p>
          <p className="text-3xl font-bold text-slate-900">{analytics.overview.total_customers}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <p className="text-sm text-slate-600 mb-2">Pipeline Value</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(analytics.overview.pipeline_value)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <p className="text-sm text-slate-600 mb-2">Average ROI</p>
          <p className="text-3xl font-bold text-blue-600">{(analytics.overview.avg_roi || 0).toFixed(0)}%</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* By Tier */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Performance by Tier</h3>
          <div className="space-y-3">
            {analytics.byTier.length === 0 ? (
              <p className="text-slate-500">No data yet</p>
            ) : (
              analytics.byTier.map((tier) => (
                <div key={tier.tier_profile} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                  <span className="font-semibold text-slate-700">{tier.tier_profile}</span>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">{tier.count} customers</p>
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(tier.avg_value)} avg</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Value Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Value Distribution</h3>
          <div className="space-y-3">
            {analytics.valueDistribution.map((range) => (
              <div key={range.value_range} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                <span className="font-semibold text-slate-700">{range.value_range}</span>
                <span className="text-lg font-bold text-blue-600">{range.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top AEs */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Top Performing AEs</h3>
        {analytics.byAE.length === 0 ? (
          <p className="text-slate-500">No data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-700">AE Name</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Calculations</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Pipeline Value</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Avg ROI</th>
                </tr>
              </thead>
              <tbody>
                {analytics.byAE.map((ae) => (
                  <tr key={ae.ae_name} className="border-t border-slate-200">
                    <td className="p-3 font-semibold text-slate-900">{ae.ae_name}</td>
                    <td className="p-3 text-right">{ae.calculation_count}</td>
                    <td className="p-3 text-right text-green-600 font-semibold">
                      {formatCurrency(ae.total_pipeline_value)}
                    </td>
                    <td className="p-3 text-right text-blue-600 font-semibold">{(ae.avg_roi || 0).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h3>
        {analytics.recentActivity.length === 0 ? (
          <p className="text-slate-500">No activity yet</p>
        ) : (
          <div className="space-y-2">
            {analytics.recentActivity.map((calc) => (
              <div key={calc.id} className="flex justify-between items-center p-3 border-b border-slate-200">
                <div>
                  <p className="font-semibold text-slate-900">{calc.customer_name}</p>
                  <p className="text-sm text-slate-600">by {calc.ae_name || 'Unknown'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{formatCurrency(calc.total_value)}</p>
                  <p className="text-xs text-slate-500">{new Date(calc.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============= MAIN APP =============
export default function SierraROIApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(AuthService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  const [currentView, setCurrentView] = useState('list'); // 'list', 'calculator', 'dashboard'
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentUser(AuthService.getCurrentUser());
    setCurrentView('list');
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('list');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-2xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Sierra ROI Calculator</h1>
              <p className="text-slate-600">Welcome, {currentUser?.name}</p>
            </div>
            <div className="flex gap-4">
              {isAdmin && (
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-6 py-2 rounded-lg font-semibold ${
                    currentView === 'dashboard'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Dashboard
                </button>
              )}
              <button
                onClick={() => { setCurrentView('list'); setSelectedCustomerId(null); }}
                className={`px-6 py-2 rounded-lg font-semibold ${
                  currentView === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Customers
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {currentView === 'dashboard' && isAdmin && <AdminDashboard />}
          {currentView === 'list' && (
            <CustomerList
              onSelect={(id) => { setSelectedCustomerId(id); setCurrentView('calculator'); }}
              onNew={() => { setSelectedCustomerId(null); setCurrentView('calculator'); }}
            />
          )}
          {currentView === 'calculator' && (
            <CalculatorWithDB
              customerId={selectedCustomerId}
              onBack={() => { setCurrentView('list'); setSelectedCustomerId(null); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
