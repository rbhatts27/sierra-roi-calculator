import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function SimplifiedSierraROICalculator() {
  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    accountSID: '',
    accountExecutive: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Section 1: Current Channel Spend
  const [channelSpend, setChannelSpend] = useState({
    voiceSpend: 15000,     // Reduced from 30,000
    smsSpend: 8000,        // Reduced from 15,000
    whatsappSpend: 2000,   // Reduced from 3,000
    emailSpend: 1000       // Reduced from 2,000
  });

  // Section 2: Current State Metrics
  const [costMetrics, setCostMetrics] = useState({
    monthlyContacts: 5000,           // Reduced from 10,000
    containmentRate: 50,             // Increased from 40 (less room for improvement)
    runningCostPerAIAgent: 50,
    vendorCostPerHumanAgent: 3500,   // Reduced from 4,000
    numberOfHumanAgents: 25,         // Reduced from 50
    avgHandleTime: 12                // Reduced from 15
  });

  const [revenueMetrics, setRevenueMetrics] = useState({
    currentUpsellRate: 3,            // Reduced from 5
    currentConversionRate: 10,       // Reduced from 15
    customerChurnRate: 3,            // Reduced from 5
    avgDealSize: 300                 // Reduced from 500
  });

  // Section 3: Sierra-Enabled Impact Assumptions
  const [sierraImpact, setSierraImpact] = useState({
    aiContainmentRate: 60,           // Reduced from 70
    handleTimeReduction: 30,         // Reduced from 50
    crossChannelPull: 10,            // Reduced from 25
    churnImprovement: 0.5,           // Reduced from 1
    upsellImprovement: 1,            // Reduced from 3
    conversionImprovement: 2         // Reduced from 5
  });

  // Section 4: Sierra Usage Estimates
  const [sierraUsage, setSierraUsage] = useState({
    uniqueContactsPerMonth: 25000,        // Reduced from 50,000
    conversationsPerContactPerMonth: 1.5, // Reduced from 2
    avgVoiceConversationMinutes: 4,       // Reduced from 5
    avgMessagingPerConversation: 8,       // Reduced from 10
    avgParticipantsPerConversation: 1.2,  // Reduced from 1.3
    knowledgeDocsSizeMB: 50,              // Reduced from 100
    languageOperators: {
      sentiment: true,
      nextBestAction: true,
      scriptAdherence: false,
      summary: false,                     // Changed from true
      custom: false
    },
    memoryRecallTiming: 'per_conversation', // at_start, at_end, per_X_utterances
    recallsPerConversation: 2,            // Reduced from 3
    totalStoredProfilesPerMonth: 25000,   // Reduced from 50,000
    profilesWithCRMActivity: 5000         // Reduced from 10,000
  });

  // AE Feedback (no longer includes target payback)
  const [aeFeedback, setAEFeedback] = useState({
    notes: '',
    confidenceLevel: 'medium', // low, medium, high
    nextSteps: ''
  });

  const [savedCalculations, setSavedCalculations] = useState([]);

  // Tooltip Component
  const Tooltip = ({ text, children }) => (
    <div className="relative inline-block group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-72 z-50 whitespace-normal">
        {text}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );

  // Calculate number of language operators
  const getOperatorCount = () => {
    return Object.values(sierraUsage.languageOperators).filter(Boolean).length;
  };

  // Calculate ROI
  const calculateROI = () => {
    const totalChannelSpend = channelSpend.voiceSpend + channelSpend.smsSpend +
                              channelSpend.whatsappSpend + channelSpend.emailSpend;

    // VALUE CALCULATIONS

    // 1. Agent Cost Reduction
    const currentHumanContacts = costMetrics.monthlyContacts * (1 - costMetrics.containmentRate / 100);
    const futureHumanContacts = costMetrics.monthlyContacts * (1 - sierraImpact.aiContainmentRate / 100);
    const contactsShiftedToAI = currentHumanContacts - futureHumanContacts;
    const costPerContact = currentHumanContacts > 0
      ? (costMetrics.numberOfHumanAgents * costMetrics.vendorCostPerHumanAgent) / currentHumanContacts
      : 0;
    const agentCostReduction = contactsShiftedToAI * costPerContact * 12;

    // AI Agent Running Costs (offset)
    const aiAgentsNeeded = Math.ceil(contactsShiftedToAI / 1000);
    const aiAgentCosts = aiAgentsNeeded * costMetrics.runningCostPerAIAgent * 12;

    // 2. Handle Time Efficiency
    const denominator = currentHumanContacts * costMetrics.avgHandleTime;
    const avgCostPerMinute = denominator > 0
      ? (costMetrics.numberOfHumanAgents * costMetrics.vendorCostPerHumanAgent) / denominator
      : 0;
    const timeSavingsPerContact = costMetrics.avgHandleTime * (sierraImpact.handleTimeReduction / 100);
    const handleTimeEfficiency = futureHumanContacts * timeSavingsPerContact * avgCostPerMinute * 12;

    // 3. Churn Reduction Revenue Protection
    const monthlyCustomerBase = costMetrics.monthlyContacts;
    const customersPreventedFromChurning = monthlyCustomerBase * (sierraImpact.churnImprovement / 100);
    const churnReductionValue = customersPreventedFromChurning * revenueMetrics.avgDealSize * 12;

    // 4. Upsell Revenue Increase
    const additionalUpsells = costMetrics.monthlyContacts * (sierraImpact.upsellImprovement / 100);
    const upsellRevenue = additionalUpsells * revenueMetrics.avgDealSize * 12;

    // 5. Conversion Revenue Increase
    const additionalConversions = costMetrics.monthlyContacts * (sierraImpact.conversionImprovement / 100);
    const conversionRevenue = additionalConversions * revenueMetrics.avgDealSize * 12;

    const totalValue = agentCostReduction - aiAgentCosts + handleTimeEfficiency +
                       churnReductionValue + upsellRevenue + conversionRevenue;

    // COST CALCULATIONS (Sierra Products)
    // Pricing based on survey - see pricing table

    const totalConversations = sierraUsage.uniqueContactsPerMonth * sierraUsage.conversationsPerContactPerMonth;

    // Calculate conversation characters based on channel type
    // Voice: ~150 chars per minute of transcription
    // Messaging: ~100 chars per message
    let avgConversationChars = 0;
    if (sierraUsage.avgVoiceConversationMinutes > 0 && sierraUsage.avgMessagingPerConversation > 0) {
      // Mixed: Both voice and messaging
      avgConversationChars = (sierraUsage.avgVoiceConversationMinutes * 150) +
                             (sierraUsage.avgMessagingPerConversation * 100);
    } else if (sierraUsage.avgVoiceConversationMinutes > 0) {
      // Voice only
      avgConversationChars = sierraUsage.avgVoiceConversationMinutes * 150;
    } else if (sierraUsage.avgMessagingPerConversation > 0) {
      // Messaging only
      avgConversationChars = sierraUsage.avgMessagingPerConversation * 100;
    } else {
      // Default if both are 0
      avgConversationChars = 500;
    }

    // Conversational Memory - 1K Characters: $0.01
    const memoryCreation = (totalConversations * avgConversationChars / 1000) * 0.01;

    // Conversational Memory - Smart Search: $0.007 per 1K characters
    const memoryRecall = (totalConversations * sierraUsage.recallsPerConversation * avgConversationChars / 1000) * 0.007;

    // Advanced Profiles - Monthly Active Profiles: $0.01
    const profiles = sierraUsage.uniqueContactsPerMonth * 0.01;

    // Language Operators - 1K Characters: $0.005
    const cintel = (totalConversations * avgConversationChars * getOperatorCount() / 1000) * 0.005;

    // Conversation Orchestrator (Maestro) - Monthly Conv. Part.: $0.01
    const maestro = (totalConversations * sierraUsage.avgParticipantsPerConversation) * 0.01;

    // Enterprise Knowledge - MB Stored: $2.50
    const knowledge = sierraUsage.knowledgeDocsSizeMB * 2.50;

    // CRM Integration Activity (estimated cost)
    const crmActivity = sierraUsage.profilesWithCRMActivity * 0.005;

    const sierraMonthly = memoryCreation + memoryRecall + profiles + cintel + maestro + knowledge + crmActivity;
    const sierraAnnual = sierraMonthly * 12;

    const channelIncrease = totalChannelSpend * (sierraImpact.crossChannelPull / 100);
    const voiceReduction = channelSpend.voiceSpend * (sierraImpact.handleTimeReduction / 100) * 0.5;
    const netChannelChange = (channelIncrease - voiceReduction) * 12;

    const totalSpend = sierraAnnual + netChannelChange;

    const netValue = totalValue - totalSpend;
    const roi = totalSpend > 0 ? ((totalValue - totalSpend) / totalSpend) * 100 : 0;
    const paybackMonths = totalSpend > 0 ? totalSpend / (totalValue / 12) : 0;
    const captureRate = totalValue > 0 ? (totalSpend / totalValue) * 100 : 0;

    return {
      value: {
        agentCostReduction,
        aiAgentCosts,
        netAgentSavings: agentCostReduction - aiAgentCosts,
        handleTimeEfficiency,
        churnReductionValue,
        upsellRevenue,
        conversionRevenue,
        total: totalValue
      },
      spend: {
        sierraMonthly,
        sierraAnnual,
        netChannelChange,
        total: totalSpend
      },
      metrics: {
        netValue,
        roi,
        paybackMonths,
        captureRate
      },
      breakdown: {
        memoryCreation: memoryCreation * 12,
        memoryRecall: memoryRecall * 12,
        profiles: profiles * 12,
        cintel: cintel * 12,
        maestro: maestro * 12,
        knowledge: knowledge * 12,
        crmActivity: crmActivity * 12,
        channelIncrease: channelIncrease * 12,
        voiceReduction: voiceReduction * 12
      },
      breakdownDetails: {
        memoryCreation: {
          meter: `${totalConversations.toLocaleString()} convos × ${avgConversationChars.toLocaleString()} chars`,
          price: '$0.01 per 1K chars',
          formula: `${totalConversations.toLocaleString()} × ${avgConversationChars.toLocaleString()} / 1,000 × $0.01 × 12`
        },
        memoryRecall: {
          meter: `${totalConversations.toLocaleString()} convos × ${sierraUsage.recallsPerConversation} recalls × ${avgConversationChars.toLocaleString()} chars`,
          price: '$0.007 per 1K chars',
          formula: `${totalConversations.toLocaleString()} × ${sierraUsage.recallsPerConversation} × ${avgConversationChars.toLocaleString()} / 1,000 × $0.007 × 12`
        },
        profiles: {
          meter: `${sierraUsage.uniqueContactsPerMonth.toLocaleString()} active profiles/mo`,
          price: '$0.01 per profile',
          formula: `${sierraUsage.uniqueContactsPerMonth.toLocaleString()} × $0.01 × 12`
        },
        cintel: {
          meter: `${totalConversations.toLocaleString()} convos × ${avgConversationChars.toLocaleString()} chars × ${getOperatorCount()} operators`,
          price: '$0.005 per 1K chars',
          formula: `${totalConversations.toLocaleString()} × ${avgConversationChars.toLocaleString()} × ${getOperatorCount()} / 1,000 × $0.005 × 12`
        },
        maestro: {
          meter: `${totalConversations.toLocaleString()} convos × ${sierraUsage.avgParticipantsPerConversation} participants`,
          price: '$0.01 per participant',
          formula: `${totalConversations.toLocaleString()} × ${sierraUsage.avgParticipantsPerConversation} × $0.01 × 12`
        },
        knowledge: {
          meter: `${sierraUsage.knowledgeDocsSizeMB.toLocaleString()} MB stored`,
          price: '$2.50 per MB',
          formula: `${sierraUsage.knowledgeDocsSizeMB.toLocaleString()} × $2.50 × 12`
        },
        crmActivity: {
          meter: `${sierraUsage.profilesWithCRMActivity.toLocaleString()} active profiles/mo`,
          price: '$0.005 per profile',
          formula: `${sierraUsage.profilesWithCRMActivity.toLocaleString()} × $0.005 × 12`
        }
      },
      calculations: {
        totalConversations,
        avgConversationChars,
        contactsShiftedToAI,
        aiAgentsNeeded,
        operatorCount: getOperatorCount()
      },
      formulas: {
        agentCostReduction: `(${currentHumanContacts.toFixed(0)} current contacts - ${futureHumanContacts.toFixed(0)} future contacts) × $${costPerContact.toFixed(2)}/contact × 12 months`,
        aiAgentCosts: `${aiAgentsNeeded} AI agents × $${costMetrics.runningCostPerAIAgent}/month × 12 months`,
        handleTimeEfficiency: `${futureHumanContacts.toFixed(0)} remaining contacts × ${timeSavingsPerContact.toFixed(1)} min saved × $${avgCostPerMinute.toFixed(2)}/min × 12 months`,
        churnReduction: `${monthlyCustomerBase.toLocaleString()} customers × ${sierraImpact.churnImprovement}% improvement × $${revenueMetrics.avgDealSize} avg deal × 12 months`,
        upsellRevenue: `${costMetrics.monthlyContacts.toLocaleString()} contacts × ${sierraImpact.upsellImprovement}% improvement × $${revenueMetrics.avgDealSize} avg deal × 12 months`,
        conversionRevenue: `${costMetrics.monthlyContacts.toLocaleString()} contacts × ${sierraImpact.conversionImprovement}% improvement × $${revenueMetrics.avgDealSize} avg deal × 12 months`,
        channelIncrease: `$${totalChannelSpend.toLocaleString()} total spend × ${sierraImpact.crossChannelPull}% pull × 12 months`,
        voiceReduction: `$${channelSpend.voiceSpend.toLocaleString()} voice spend × ${sierraImpact.handleTimeReduction}% efficiency × 50% conversion × 12 months`
      }
    };
  };

  const results = calculateROI();

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const getTierProfile = () => {
    const { crossChannelPull, aiContainmentRate } = sierraImpact;
    if (crossChannelPull < 15 && aiContainmentRate < 65) return 'Conservative';
    if (crossChannelPull > 35 && aiContainmentRate > 75) return 'Optimal';
    return 'Balanced';
  };

  const saveCalculation = () => {
    if (!customerInfo.customerName || !customerInfo.accountSID) {
      alert('Please enter Customer Name and Account SID');
      return;
    }

    const calculation = {
      ...customerInfo,
      ...channelSpend,
      ...costMetrics,
      ...revenueMetrics,
      ...sierraImpact,
      ...sierraUsage,
      ...aeFeedback,
      tierProfile: getTierProfile(),
      ...results.value,
      ...results.spend,
      ...results.metrics,
      timestamp: new Date().toISOString()
    };

    setSavedCalculations([...savedCalculations, calculation]);
    alert(`Calculation saved for ${customerInfo.customerName}`);
  };

  const exportToExcel = () => {
    if (savedCalculations.length === 0) {
      alert('No calculations to export');
      return;
    }

    const exportData = savedCalculations.map(calc => ({
      // Customer Info
      'Date': calc.date,
      'Customer Name': calc.customerName,
      'Account SID': calc.accountSID,
      'Account Executive': calc.accountExecutive,

      // AE Feedback
      'Confidence Level': calc.confidenceLevel,
      'AE Notes': calc.notes,
      'Next Steps': calc.nextSteps,

      // Tier
      'Tier Profile': calc.tierProfile,

      // Results
      'Total Value': calc.total,
      'Total Spend': calc.total, // This gets the second 'total' from spend
      'Net Value': calc.netValue,
      'ROI %': calc.roi,
      'Actual Payback (months)': calc.paybackMonths,
      'Capture Rate %': calc.captureRate,

      // Value Breakdown
      'Agent Cost Reduction': calc.agentCostReduction,
      'AI Agent Costs': calc.aiAgentCosts,
      'Net Agent Savings': calc.netAgentSavings,
      'Handle Time Efficiency': calc.handleTimeEfficiency,
      'Churn Reduction Value': calc.churnReductionValue,
      'Upsell Revenue': calc.upsellRevenue,
      'Conversion Revenue': calc.conversionRevenue,

      // All other fields...
      'Monthly Contacts': calc.monthlyContacts,
      'Containment Rate %': calc.containmentRate,
      'Running Cost per AI Agent': calc.runningCostPerAIAgent,
      'Vendor Cost per Human Agent': calc.vendorCostPerHumanAgent,
      'Number of Human Agents': calc.numberOfHumanAgents,
      'Avg Handle Time': calc.avgHandleTime,
      'Current Upsell Rate %': calc.currentUpsellRate,
      'Current Conversion Rate %': calc.currentConversionRate,
      'Customer Churn Rate %': calc.customerChurnRate,
      'Avg Deal Size': calc.avgDealSize
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Calculations');
    XLSX.writeFile(workbook, `Sierra_ROI_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Sierra ROI Calculator</h1>
              <p className="text-slate-600">Simplified Version - Easy for AEs</p>
            </div>
            <button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              📊 Export ({savedCalculations.length})
            </button>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-4 gap-4 p-6 bg-blue-50 rounded-lg">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Customer Name *</label>
              <input
                type="text"
                value={customerInfo.customerName}
                onChange={(e) => setCustomerInfo({...customerInfo, customerName: e.target.value})}
                className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Account SID *</label>
              <input
                type="text"
                value={customerInfo.accountSID}
                onChange={(e) => setCustomerInfo({...customerInfo, accountSID: e.target.value})}
                className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Account Executive</label>
              <input
                type="text"
                value={customerInfo.accountExecutive}
                onChange={(e) => setCustomerInfo({...customerInfo, accountExecutive: e.target.value})}
                className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
              <input
                type="date"
                value={customerInfo.date}
                onChange={(e) => setCustomerInfo({...customerInfo, date: e.target.value})}
                className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Left Column - Inputs */}
          <div className="space-y-6">
            {/* Section 1: Channel Spend */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-slate-200 pb-3">
                💰 Current Monthly Channel Spend
              </h2>
              <div className="space-y-4">
                {[
                  { key: 'voiceSpend', label: 'Voice Spend', tooltip: 'Monthly spend on voice calls (inbound/outbound minutes + transcription)' },
                  { key: 'smsSpend', label: 'SMS Spend', tooltip: 'Monthly spend on SMS messages' },
                  { key: 'whatsappSpend', label: 'WhatsApp Spend', tooltip: 'Monthly spend on WhatsApp messages' },
                  { key: 'emailSpend', label: 'Email Spend', tooltip: 'Monthly spend on email (API calls + delivery)' }
                ].map(({ key, label, tooltip }) => (
                  <div key={key}>
                    <Tooltip text={tooltip}>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {label}: {formatCurrency(channelSpend[key])} ℹ️
                      </label>
                    </Tooltip>
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      step="1000"
                      value={channelSpend[key]}
                      onChange={(e) => setChannelSpend({...channelSpend, [key]: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                ))}
                <div className="pt-4 border-t-2 border-slate-200">
                  <div className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                    <span className="font-bold">Total Monthly Spend:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(channelSpend.voiceSpend + channelSpend.smsSpend + channelSpend.whatsappSpend + channelSpend.emailSpend)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Current State Metrics */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <Tooltip text="Relevant cost and revenue metrics that allow customers to decide which would have a positive impact by Sierra products for their business">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-purple-200 pb-3">
                  📊 Current State Metrics ℹ️
                </h2>
              </Tooltip>

              <h3 className="text-lg font-bold text-slate-700 mb-4">Cost Metrics</h3>
              <div className="space-y-4 mb-6">
                {[
                  { key: 'monthlyContacts', label: 'Monthly 2-way Conversation Contacts', min: 1000, max: 1000000, step: 1000, tooltip: 'Total 2-way conversation contacts per month' },
                  { key: 'containmentRate', label: 'Containment Rate (%)', min: 0, max: 80, step: 1, tooltip: 'Current % resolved without human agent' },
                  { key: 'runningCostPerAIAgent', label: 'Running Cost for AI Agent(s)/Month', min: 10, max: 1000000, step: 10, tooltip: 'Monthly cost to run AI agent(s) (compute, hosting, maintenance)' },
                  { key: 'vendorCostPerHumanAgent', label: 'Vendor Cost per Human Agent/Month', min: 2000, max: 8000, step: 500, tooltip: 'Fully loaded monthly cost per human agent' },
                  { key: 'numberOfHumanAgents', label: 'Number of Human Agents', min: 10, max: 500, step: 10, tooltip: 'Current human agent count' },
                  { key: 'avgHandleTime', label: 'Avg Handle Time (min)', min: 5, max: 45, step: 1, tooltip: 'Average time per human contact' }
                ].map(({ key, label, min, max, step, tooltip }) => (
                  <div key={key}>
                    <Tooltip text={tooltip}>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {label}: {key.includes('Cost') || key.includes('cost') ? formatCurrency(costMetrics[key]) : costMetrics[key].toLocaleString()}{key.includes('Rate') || key.includes('Time') ? '' : ''} ℹ️
                      </label>
                    </Tooltip>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={costMetrics[key]}
                      onChange={(e) => setCostMetrics({...costMetrics, [key]: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-bold text-slate-700 mb-4 pt-4 border-t-2 border-slate-200">Revenue Metrics</h3>
              <div className="space-y-4">
                {[
                  { key: 'currentUpsellRate', label: 'Current Upsell Rate (%)', min: 0, max: 30, step: 1, tooltip: '% of conversations that result in upsell' },
                  { key: 'currentConversionRate', label: 'Current Conversion Rate (%)', min: 0, max: 50, step: 1, tooltip: '% of conversations that convert to sale' },
                  { key: 'customerChurnRate', label: 'Customer Churn Rate (%)', min: 0, max: 20, step: 0.5, tooltip: 'Annual customer churn %' },
                  { key: 'avgDealSize', label: 'Avg Deal/Transaction Size', min: 50, max: 1000000, step: 50, tooltip: 'Average revenue per transaction' }
                ].map(({ key, label, min, max, step, tooltip }) => (
                  <div key={key}>
                    <Tooltip text={tooltip}>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {label}: {key === 'avgDealSize' ? formatCurrency(revenueMetrics[key]) : revenueMetrics[key]} ℹ️
                      </label>
                    </Tooltip>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={revenueMetrics[key]}
                      onChange={(e) => setRevenueMetrics({...revenueMetrics, [key]: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Sierra Impact */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-green-200 pb-3">
                🎯 Sierra-Enabled Impact Assumptions
              </h2>
              <div className="space-y-4">
                {[
                  { key: 'aiContainmentRate', label: 'AI Containment Rate (%)', min: 0, max: 85, step: 1, tooltip: 'Target % resolved by AI', range: '60-80%' },
                  { key: 'handleTimeReduction', label: 'Handle Time Reduction (%)', min: 0, max: 70, step: 1, tooltip: 'Reduction in human handle time', range: '40-60%' },
                  { key: 'crossChannelPull', label: 'Cross-Channel Pull (%)', min: 0, max: 40, step: 1, tooltip: 'Increase in channel usage', range: 'Y1: 5-10%, Y2: 20-30%' },
                  { key: 'churnImprovement', label: 'Churn Improvement (% points)', min: 0, max: 3, step: 0.5, tooltip: 'Reduction in churn rate', range: '0-3%' },
                  { key: 'upsellImprovement', label: 'Upsell Improvement (% points)', min: 0, max: 10, step: 1, tooltip: 'Increase in upsell rate', range: '2-5%' },
                  { key: 'conversionImprovement', label: 'Conversion Improvement (% points)', min: 0, max: 15, step: 1, tooltip: 'Increase in conversion rate', range: '3-10%' }
                ].map(({ key, label, min, max, step, tooltip, range }) => (
                  <div key={key}>
                    <Tooltip text={tooltip}>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {label}: {sierraImpact[key]} ℹ️
                      </label>
                    </Tooltip>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={sierraImpact[key]}
                      onChange={(e) => setSierraImpact({...sierraImpact, [key]: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">Typical: {range}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Sierra Usage */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-orange-200 pb-3">
                📐 Sierra Usage Estimates
              </h2>
              <div className="space-y-4">
                {[
                  { key: 'uniqueContactsPerMonth', label: 'Unique Customers in Conversations (Profiles)/Month', min: 0, max: 200000, step: 5000, tooltip: 'Number of unique customer profiles in conversations' },
                  { key: 'conversationsPerContactPerMonth', label: 'Conversations per Customer/Month', min: 0, max: 10, step: 0.5, tooltip: 'Average conversations per unique customer' },
                  { key: 'avgVoiceConversationMinutes', label: 'Avg Voice Conversation (min)', min: 0, max: 30, step: 1, tooltip: 'Average voice call length. Set to 0 if messaging-only' },
                  { key: 'avgMessagingPerConversation', label: 'Avg Messages per Conversation', min: 0, max: 50, step: 1, tooltip: 'Average messages exchanged. Set to 0 if voice-only' },
                  { key: 'avgParticipantsPerConversation', label: 'Avg Customer Participants/Conversation', min: 0, max: 3, step: 0.1, tooltip: '1.0 = customer only, 1.3 = occasionally +1 person' },
                  { key: 'knowledgeDocsSizeMB', label: 'Knowledge Docs Size (MB)', min: 0, max: 1000, step: 50, tooltip: 'Size of knowledge base documents' },
                  { key: 'recallsPerConversation', label: 'Memory Recalls per Conversation', min: 0, max: 10, step: 1, tooltip: 'How often memory is retrieved per conversation' },
                  { key: 'totalStoredProfilesPerMonth', label: 'Total Stored Profiles/Month', min: 0, max: 5000000, step: 10000, tooltip: 'Total profiles maintained in database' },
                  { key: 'profilesWithCRMActivity', label: 'Active Profiles (CRM Activity)/Month', min: 0, max: 5000000, step: 10000, tooltip: 'Active profiles that trigger CRM integrations' }
                ].map(({ key, label, min, max, step, tooltip }) => (
                  <div key={key}>
                    <Tooltip text={tooltip}>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {label}: {sierraUsage[key].toLocaleString()} ℹ️
                      </label>
                    </Tooltip>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={sierraUsage[key]}
                      onChange={(e) => setSierraUsage({...sierraUsage, [key]: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                ))}

                <div className="pt-4 border-t-2 border-slate-200">
                  <Tooltip text="Select which language operators to include: sentiment analysis, next-best-action recommendations, script adherence monitoring, conversation summary, or custom operators">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Language Operators ℹ️ (Selected: {getOperatorCount()})
                    </label>
                  </Tooltip>
                  <div className="space-y-2">
                    {[
                      { key: 'sentiment', label: 'Sentiment Analysis' },
                      { key: 'nextBestAction', label: 'Next-Best-Action' },
                      { key: 'scriptAdherence', label: 'Script Adherence' },
                      { key: 'summary', label: 'Summary Generation' },
                      { key: 'custom', label: 'Custom Operators' }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={sierraUsage.languageOperators[key]}
                          onChange={(e) => setSierraUsage({
                            ...sierraUsage,
                            languageOperators: {
                              ...sierraUsage.languageOperators,
                              [key]: e.target.checked
                            }
                          })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* ROI Summary - No longer sticky */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-2xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-6">💰 ROI Summary</h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm opacity-90 mb-1">Net Value</p>
                  <p className="text-3xl font-bold">{formatCurrency(results.metrics.netValue)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm opacity-90 mb-1">ROI</p>
                  <p className="text-3xl font-bold">{results.metrics.roi.toFixed(0)}%</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm opacity-90 mb-1">Actual Payback Period</p>
                  <p className="text-3xl font-bold">{results.metrics.paybackMonths.toFixed(1)} mo</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm opacity-90 mb-1">Capture Rate</p>
                  <p className="text-3xl font-bold">{results.metrics.captureRate.toFixed(1)}%</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                <p className="text-sm mb-2">Tier Profile: <span className="font-bold">{getTierProfile()}</span></p>
                <p className="text-xs">Industry benchmark: 10-30% of value</p>
                <p className="text-sm font-semibold mt-1">
                  {results.metrics.captureRate < 10 ? '✅ HIGHLY DEFENSIBLE' : '⚠️ COMPETITIVE'}
                </p>
              </div>

              <button
                onClick={saveCalculation}
                className="w-full bg-white text-green-600 py-3 rounded-lg font-bold text-lg hover:bg-green-50 transition-all"
              >
                💾 Save Calculation
              </button>
            </div>

            {/* Value Breakdown */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-green-200 pb-3">
                📈 Annual Value Created
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Agent Cost Reduction</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(results.value.agentCostReduction)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{results.formulas.agentCostReduction}</p>
                  <div className="flex justify-between items-center mt-1 text-sm">
                    <span className="text-slate-600">- AI Agent Running Costs</span>
                    <span className="text-orange-600">-{formatCurrency(results.value.aiAgentCosts)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{results.formulas.aiAgentCosts}</p>
                  <div className="flex justify-between items-center mt-1 pt-2 border-t border-green-200">
                    <span className="font-semibold text-slate-700">Net Agent Savings</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(results.value.netAgentSavings)}</span>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Handle Time Efficiency</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(results.value.handleTimeEfficiency)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{results.formulas.handleTimeEfficiency}</p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Churn Reduction (Revenue Protection)</span>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(results.value.churnReductionValue)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{results.formulas.churnReduction}</p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Upsell Revenue Increase</span>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(results.value.upsellRevenue)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{results.formulas.upsellRevenue}</p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Conversion Revenue Increase</span>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(results.value.conversionRevenue)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{results.formulas.conversionRevenue}</p>
                </div>

                <div className="flex justify-between items-center p-4 bg-green-600 text-white rounded-lg mt-4">
                  <span className="text-lg font-bold">TOTAL VALUE</span>
                  <span className="text-2xl font-bold">{formatCurrency(results.value.total)}</span>
                </div>
              </div>
            </div>

            {/* Additional Spend */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-orange-200 pb-3">
                💸 Additional Annual Spend
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Sierra Products</span>
                    <span className="text-lg font-bold text-orange-600">{formatCurrency(results.spend.sierraAnnual)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">See detailed breakdown below</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Net Channel Change</span>
                    <span className={`text-lg font-bold ${results.spend.netChannelChange > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {results.spend.netChannelChange > 0 ? '+' : ''}{formatCurrency(results.spend.netChannelChange)}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <p className="flex justify-between">
                      <span>+ Channel Increase (cross-channel pull):</span>
                      <span className="font-semibold">{formatCurrency(results.breakdown.channelIncrease)}</span>
                    </p>
                    <p className="text-xs italic pl-2">{results.formulas.channelIncrease}</p>
                    <p className="flex justify-between mt-1">
                      <span>- Voice Reduction (efficiency gains):</span>
                      <span className="font-semibold">-{formatCurrency(results.breakdown.voiceReduction)}</span>
                    </p>
                    <p className="text-xs italic pl-2">{results.formulas.voiceReduction}</p>
                    <p className="flex justify-between pt-1 mt-1 border-t border-orange-200 font-semibold">
                      <span>Net Impact:</span>
                      <span>{results.spend.netChannelChange > 0 ? '+' : ''}{formatCurrency(results.spend.netChannelChange)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-orange-600 text-white rounded-lg mt-4">
                  <span className="text-lg font-bold">TOTAL SPEND</span>
                  <span className="text-2xl font-bold">{formatCurrency(results.spend.total)}</span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-semibold text-slate-700 mb-3">Sierra Product Breakdown (Annual):</p>
                <div className="space-y-4 text-sm">
                  {[
                    { label: 'Memory Creation', key: 'memoryCreation', value: results.breakdown.memoryCreation },
                    { label: 'Memory Recall', key: 'memoryRecall', value: results.breakdown.memoryRecall },
                    { label: 'Profiles', key: 'profiles', value: results.breakdown.profiles },
                    { label: 'CINTEL Operators', key: 'cintel', value: results.breakdown.cintel },
                    { label: 'Maestro Participants', key: 'maestro', value: results.breakdown.maestro },
                    { label: 'Knowledge Docs', key: 'knowledge', value: results.breakdown.knowledge },
                    { label: 'Active Profiles (CRM Activity)', key: 'crmActivity', value: results.breakdown.crmActivity }
                  ].map(({ label, key, value }) => (
                    <div key={label} className="p-3 bg-white rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-700">{label}</span>
                        <span className="font-bold text-orange-600">{formatCurrency(value)}</span>
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-slate-500">
                        <p><span className="font-medium text-slate-600">Meter:</span> {results.breakdownDetails[key].meter}</p>
                        <p><span className="font-medium text-slate-600">Price:</span> {results.breakdownDetails[key].price}</p>
                        <p><span className="font-medium text-slate-600">Formula:</span> {results.breakdownDetails[key].formula}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Stats */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-slate-700 mb-2">Usage Summary:</p>
                <div className="text-xs space-y-1">
                  <p>• {results.calculations.totalConversations.toLocaleString()} total conversations/month</p>
                  <p>• ~{results.calculations.avgConversationChars.toLocaleString()} chars per conversation</p>
                  <p>• {results.calculations.contactsShiftedToAI.toFixed(0)} contacts shifted to AI</p>
                  <p>• {results.calculations.aiAgentsNeeded} AI agents needed</p>
                  <p>• {results.calculations.operatorCount} language operators selected</p>
                </div>
              </div>
            </div>

            {/* AE Feedback Section */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-blue-200 pb-3">
                📝 Account Executive Feedback
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Confidence Level in This Calculation
                  </label>
                  <select
                    value={aeFeedback.confidenceLevel}
                    onChange={(e) => setAEFeedback({...aeFeedback, confidenceLevel: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="low">Low - Needs more customer data</option>
                    <option value="medium">Medium - Good estimates</option>
                    <option value="high">High - Solid data from customer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Notes on Calculation Assumptions
                  </label>
                  <textarea
                    value={aeFeedback.notes}
                    onChange={(e) => setAEFeedback({...aeFeedback, notes: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                    rows="4"
                    placeholder="Key assumptions, customer concerns, areas where we need more data..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Next Steps with Customer
                  </label>
                  <textarea
                    value={aeFeedback.nextSteps}
                    onChange={(e) => setAEFeedback({...aeFeedback, nextSteps: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                    rows="3"
                    placeholder="Follow-up actions, questions to answer, meetings to schedule..."
                  />
                </div>

                <div className="pt-4 border-t-2 border-slate-200">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-900 mb-2">Deal Status Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Actual Payback:</p>
                        <p className="font-bold text-slate-900">{results.metrics.paybackMonths.toFixed(1)} months</p>
                      </div>
                      <div>
                        <p className="text-slate-600">ROI:</p>
                        <p className="font-bold text-slate-900">{results.metrics.roi.toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Confidence:</p>
                        <p className="font-bold text-slate-900 capitalize">{aeFeedback.confidenceLevel}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Net Value:</p>
                        <p className="font-bold text-green-600">{formatCurrency(results.metrics.netValue)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
