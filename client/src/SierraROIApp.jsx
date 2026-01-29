import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function SierraROICalculator() {
  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    accountSID: '',
    salesRep: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [currentState, setCurrentState] = useState({
    monthlyContacts: 10000,
    currentContainment: 40,
    humanAgents: 50,
    costPerAgent: 4000,
    avgHandleTime: 15,
    // Channel-specific spend
    voiceSpend: 30000,
    smsSpend: 15000,
    whatsappSpend: 3000,
    emailSpend: 2000,
    // Business metrics
    churnRate: 5,
    currentCAC: 500,
    customerBase: 100000
  });

  const [sierraAssumptions, setSierra] = useState({
    aiContainment: 70,
    handleTimeReduction: 50,
    crossChannelPull: 25,
    churnImprovement: 1,
    cacImprovement: 20
  });

  // Sierra Usage Inputs - Actual usage numbers
  const [sierraUsage, setSierraUsage] = useState({
    uniqueContactsPerMonth: 50000,
    conversationsPerContact: 2,
    avgParticipantsPerConversation: 1.3,
    knowledgeDocsSizeMB: 100,
    numberOfLanguageOperators: 5,
    avgConversationChars: 5000,
    recallToCreationRatio: 3
  });

  const [savedCalculations, setSavedCalculations] = useState([]);
  const [showTooltip, setShowTooltip] = useState(null);

  // Tooltip Component
  const Tooltip = ({ text, children }) => (
    <div className="relative inline-block group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-50">
        {text}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );

  // Calculate ROI metrics with detailed formulas
  const calculateROI = () => {
    const {
      monthlyContacts,
      currentContainment,
      humanAgents,
      costPerAgent,
      avgHandleTime,
      voiceSpend,
      smsSpend,
      whatsappSpend,
      emailSpend,
      churnRate,
      currentCAC,
      customerBase
    } = currentState;

    const {
      aiContainment,
      handleTimeReduction,
      crossChannelPull,
      churnImprovement,
      cacImprovement
    } = sierraAssumptions;

    const {
      uniqueContactsPerMonth,
      conversationsPerContact,
      avgParticipantsPerConversation,
      knowledgeDocsSizeMB,
      numberOfLanguageOperators,
      avgConversationChars,
      recallToCreationRatio
    } = sierraUsage;

    const totalTwilioSpend = voiceSpend + smsSpend + whatsappSpend + emailSpend;

    // VALUE CALCULATIONS WITH FORMULAS

    // A. Agent Cost Reduction
    // Formula: (Current human contacts - Future human contacts) × Cost per contact × 12 months
    const currentHumanContacts = monthlyContacts * (1 - currentContainment / 100);
    const futureHumanContacts = monthlyContacts * (1 - aiContainment / 100);
    const contactsShiftedToAI = currentHumanContacts - futureHumanContacts;
    const costPerContact = (humanAgents * costPerAgent) / currentHumanContacts;
    const agentCostReduction = contactsShiftedToAI * costPerContact * 12;

    // B. Handle Time Efficiency
    // Formula: Remaining human contacts × Time saved per contact × Cost per minute × 12 months
    const avgCostPerMinute = (humanAgents * costPerAgent) / (currentHumanContacts * avgHandleTime);
    const timeSavingsPerContact = avgHandleTime * (handleTimeReduction / 100);
    const handleTimeEfficiency = futureHumanContacts * timeSavingsPerContact * avgCostPerMinute * 12;

    // C. Churn Reduction Value
    // Formula: Churn improvement % × Customer base × Current CAC
    // (Lower churn = fewer customers to replace = CAC savings)
    const churnReduction = (churnImprovement / 100) * customerBase * currentCAC;

    // D. CAC Reduction Value
    // Formula: New customers per year × CAC improvement % × Current CAC
    // Assume customer growth rate = 10% annually
    const newCustomersPerYear = customerBase * 0.10;
    const cacReduction = newCustomersPerYear * (cacImprovement / 100) * currentCAC;

    // E. Build Cost Avoidance (first year conservative)
    const buildCostAvoidance = 0;

    const totalValue = agentCostReduction + handleTimeEfficiency + churnReduction + cacReduction + buildCostAvoidance;

    // COST CALCULATIONS WITH ACTUAL USAGE

    // Sierra Product Costs based on usage inputs
    const totalConversations = uniqueContactsPerMonth * conversationsPerContact;

    // Memory Creation: Total conversations × Avg chars per conversation / 1000 × $0.01
    const memoryCreation = (totalConversations * avgConversationChars / 1000) * 0.01;

    // Memory Recall: Total conversations × Recall ratio × Avg chars / 1000 × $0.007
    const memoryRecall = (totalConversations * recallToCreationRatio * avgConversationChars / 1000) * 0.007;

    // Profiles: Unique contacts × $0.01
    const profiles = uniqueContactsPerMonth * 0.01;

    // CINTEL: Total conversations × Avg chars × Number of operators / 1000 × $0.005
    const cintel = (totalConversations * avgConversationChars * numberOfLanguageOperators / 1000) * 0.005;

    // Maestro: Total conversations × Avg participants × $0.01
    const maestro = (totalConversations * avgParticipantsPerConversation) * 0.01;

    // Knowledge: MB stored × $2.50
    const knowledge = knowledgeDocsSizeMB * 2.50;

    const sierraMonthly = memoryCreation + memoryRecall + profiles + cintel + maestro + knowledge;
    const sierraAnnual = sierraMonthly * 12;

    // Channel Spend Change
    // Formula: (Cross-channel pull % × Total spend) - (Voice reduction from efficiency)
    const channelIncrease = totalTwilioSpend * (crossChannelPull / 100);
    const voiceReduction = voiceSpend * (handleTimeReduction / 100) * 0.5; // 50% of handle time reduction translates to voice spend reduction
    const netChannelChange = (channelIncrease - voiceReduction) * 12;

    const totalSpend = sierraAnnual + netChannelChange;

    // ROI Metrics
    const netValue = totalValue - totalSpend;
    const roi = totalSpend > 0 ? ((totalValue - totalSpend) / totalSpend) * 100 : 0;
    const paybackMonths = totalSpend > 0 ? totalSpend / (totalValue / 12) : 0;
    const captureRate = totalValue > 0 ? (totalSpend / totalValue) * 100 : 0;

    return {
      value: {
        agentCostReduction,
        handleTimeEfficiency,
        churnReduction,
        cacReduction,
        buildCostAvoidance,
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
        channelIncrease: channelIncrease * 12,
        voiceReduction: voiceReduction * 12
      },
      formulas: {
        agentCostReductionFormula: `(${currentHumanContacts.toFixed(0)} current human - ${futureHumanContacts.toFixed(0)} future human) × $${costPerContact.toFixed(2)}/contact × 12 months`,
        handleTimeEfficiencyFormula: `${futureHumanContacts.toFixed(0)} contacts × ${timeSavingsPerContact.toFixed(1)} min saved × $${avgCostPerMinute.toFixed(2)}/min × 12`,
        churnReductionFormula: `${churnImprovement}% improvement × ${customerBase.toLocaleString()} customers × $${currentCAC} CAC`,
        cacReductionFormula: `${newCustomersPerYear.toFixed(0)} new customers × ${cacImprovement}% improvement × $${currentCAC} CAC`
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

  const formatPercent = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(num / 100);
  };

  const getTierProfile = () => {
    const { crossChannelPull, aiContainment } = sierraAssumptions;
    if (crossChannelPull < 15 && aiContainment < 65) return 'Conservative (Voice-Heavy, Low Pull)';
    if (crossChannelPull > 35 && aiContainment > 75) return 'Optimal (Messaging-Heavy, High Pull)';
    return 'Balanced (Multi-Channel, Medium Pull)';
  };

  const saveCalculation = () => {
    if (!customerInfo.customerName || !customerInfo.accountSID) {
      alert('Please enter Customer Name and Account SID');
      return;
    }

    const calculation = {
      ...customerInfo,
      ...currentState,
      ...sierraAssumptions,
      ...sierraUsage,
      tierProfile: getTierProfile(),
      // Value breakdown
      agentCostReduction: results.value.agentCostReduction,
      handleTimeEfficiency: results.value.handleTimeEfficiency,
      churnReduction: results.value.churnReduction,
      cacReduction: results.value.cacReduction,
      totalValue: results.value.total,
      // Spend breakdown
      sierraAnnual: results.spend.sierraAnnual,
      netChannelChange: results.spend.netChannelChange,
      totalSpend: results.spend.total,
      // Metrics
      netValue: results.metrics.netValue,
      roi: results.metrics.roi,
      paybackMonths: results.metrics.paybackMonths,
      captureRate: results.metrics.captureRate,
      timestamp: new Date().toISOString()
    };

    setSavedCalculations([...savedCalculations, calculation]);
    alert(`Calculation saved for ${customerInfo.customerName}`);
  };

  const exportToExcel = () => {
    if (savedCalculations.length === 0) {
      alert('No calculations to export. Save at least one calculation first.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(savedCalculations.map(calc => ({
      // Customer Info
      'Date': calc.date,
      'Customer Name': calc.customerName,
      'Account SID': calc.accountSID,
      'Sales Rep': calc.salesRep,
      'Tier Profile': calc.tierProfile,

      // Current State
      'Monthly Contacts': calc.monthlyContacts,
      'Current Containment %': calc.currentContainment,
      'Human Agents': calc.humanAgents,
      'Cost per Agent': calc.costPerAgent,
      'Avg Handle Time (min)': calc.avgHandleTime,
      'Voice Spend': calc.voiceSpend,
      'SMS Spend': calc.smsSpend,
      'WhatsApp Spend': calc.whatsappSpend,
      'Email Spend': calc.emailSpend,
      'Total Twilio Spend': calc.voiceSpend + calc.smsSpend + calc.whatsappSpend + calc.emailSpend,
      'Churn Rate %': calc.churnRate,
      'Current CAC': calc.currentCAC,
      'Customer Base': calc.customerBase,

      // Sierra Assumptions
      'AI Containment %': calc.aiContainment,
      'Handle Time Reduction %': calc.handleTimeReduction,
      'Cross-Channel Pull %': calc.crossChannelPull,
      'Churn Improvement %': calc.churnImprovement,
      'CAC Improvement %': calc.cacImprovement,

      // Sierra Usage
      'Unique Contacts/Month': calc.uniqueContactsPerMonth,
      'Conversations per Contact': calc.conversationsPerContact,
      'Avg Participants/Conversation': calc.avgParticipantsPerConversation,
      'Knowledge Docs Size (MB)': calc.knowledgeDocsSizeMB,
      'Number of Language Operators': calc.numberOfLanguageOperators,
      'Avg Conversation Chars': calc.avgConversationChars,
      'Recall-to-Creation Ratio': calc.recallToCreationRatio,

      // Results
      'Total Value': calc.totalValue,
      'Agent Cost Reduction': calc.agentCostReduction,
      'Handle Time Efficiency': calc.handleTimeEfficiency,
      'Churn Reduction Value': calc.churnReduction,
      'CAC Reduction Value': calc.cacReduction,
      'Total Spend': calc.totalSpend,
      'Sierra Annual Cost': calc.sierraAnnual,
      'Net Channel Change': calc.netChannelChange,
      'Net Value': calc.netValue,
      'ROI %': calc.roi,
      'Payback Months': calc.paybackMonths,
      'Capture Rate %': calc.captureRate
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sierra ROI Calculations');
    XLSX.writeFile(workbook, `Sierra_ROI_Calculations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Sierra ROI Calculator</h1>
              <p className="text-slate-600">Sales & Account Team Tool - Calculate Customer Value & Additional Spend</p>
            </div>
            <div className="text-right">
              <button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all"
              >
                📊 Export to Excel ({savedCalculations.length})
              </button>
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-4 gap-4 mb-6 p-6 bg-blue-50 rounded-lg">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Customer Name *</label>
              <input
                type="text"
                value={customerInfo.customerName}
                onChange={(e) => setCustomerInfo({...customerInfo, customerName: e.target.value})}
                className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Account SID *</label>
              <input
                type="text"
                value={customerInfo.accountSID}
                onChange={(e) => setCustomerInfo({...customerInfo, accountSID: e.target.value})}
                className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="AC..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Sales Rep</label>
              <input
                type="text"
                value={customerInfo.salesRep}
                onChange={(e) => setCustomerInfo({...customerInfo, salesRep: e.target.value})}
                className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Your name"
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
            {/* Current State */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-slate-200 pb-3">
                📊 Current State Metrics
              </h2>
              <div className="space-y-4">
                <div>
                  <Tooltip text="Total number of customer interactions per month across all channels (calls, messages, emails)">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Monthly Contacts: {currentState.monthlyContacts.toLocaleString()} ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={currentState.monthlyContacts}
                    onChange={(e) => setCurrentState({...currentState, monthlyContacts: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>

                <div>
                  <Tooltip text="Percentage of contacts currently resolved by automation/self-service without human agent involvement">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Current Containment Rate: {currentState.currentContainment}% ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={currentState.currentContainment}
                    onChange={(e) => setCurrentState({...currentState, currentContainment: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>

                <div>
                  <Tooltip text="Number of full-time human agents currently handling customer contacts">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Human Agents: {currentState.humanAgents} ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={currentState.humanAgents}
                    onChange={(e) => setCurrentState({...currentState, humanAgents: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>

                <div>
                  <Tooltip text="Fully loaded cost per agent per month (salary + benefits + overhead + tools)">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Cost per Agent/Month: {formatCurrency(currentState.costPerAgent)} ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="2000"
                    max="8000"
                    step="500"
                    value={currentState.costPerAgent}
                    onChange={(e) => setCurrentState({...currentState, costPerAgent: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>

                <div>
                  <Tooltip text="Average time a human agent spends on each contact from start to resolution (in minutes)">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Average Handle Time: {currentState.avgHandleTime} min ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    value={currentState.avgHandleTime}
                    onChange={(e) => setCurrentState({...currentState, avgHandleTime: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>

                {/* Channel Breakdown Section */}
                <div className="mt-6 pt-6 border-t-2 border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Monthly Twilio Spend by Channel</h3>

                  <div className="space-y-4">
                    <div>
                      <Tooltip text="Monthly spend on voice calls (inbound/outbound minutes + transcription)">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Voice Spend: {formatCurrency(currentState.voiceSpend)} ℹ️
                        </label>
                      </Tooltip>
                      <input
                        type="range"
                        min="0"
                        max="100000"
                        step="1000"
                        value={currentState.voiceSpend}
                        onChange={(e) => setCurrentState({...currentState, voiceSpend: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Tooltip text="Monthly spend on SMS messages (segments sent/received)">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          SMS Spend: {formatCurrency(currentState.smsSpend)} ℹ️
                        </label>
                      </Tooltip>
                      <input
                        type="range"
                        min="0"
                        max="50000"
                        step="1000"
                        value={currentState.smsSpend}
                        onChange={(e) => setCurrentState({...currentState, smsSpend: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Tooltip text="Monthly spend on WhatsApp messages (conversations + templates)">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          WhatsApp Spend: {formatCurrency(currentState.whatsappSpend)} ℹ️
                        </label>
                      </Tooltip>
                      <input
                        type="range"
                        min="0"
                        max="20000"
                        step="500"
                        value={currentState.whatsappSpend}
                        onChange={(e) => setCurrentState({...currentState, whatsappSpend: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Tooltip text="Monthly spend on email (API calls + delivery)">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Email Spend: {formatCurrency(currentState.emailSpend)} ℹ️
                        </label>
                      </Tooltip>
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="500"
                        value={currentState.emailSpend}
                        onChange={(e) => setCurrentState({...currentState, emailSpend: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-100 rounded-lg mt-2">
                      <span className="font-bold text-slate-700">Total Twilio Spend:</span>
                      <span className="text-lg font-bold text-slate-900">
                        {formatCurrency(currentState.voiceSpend + currentState.smsSpend + currentState.whatsappSpend + currentState.emailSpend)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Business Metrics */}
                <div className="mt-6 pt-6 border-t-2 border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Business Metrics</h3>

                  <div>
                    <Tooltip text="Percentage of customers who stop using your service annually">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Customer Churn Rate: {currentState.churnRate}% ℹ️
                      </label>
                    </Tooltip>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.5"
                      value={currentState.churnRate}
                      onChange={(e) => setCurrentState({...currentState, churnRate: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                  </div>

                  <div className="mt-4">
                    <Tooltip text="Average cost to acquire a new customer (marketing + sales costs per customer)">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Customer Acquisition Cost (CAC): {formatCurrency(currentState.currentCAC)} ℹ️
                      </label>
                    </Tooltip>
                    <input
                      type="range"
                      min="100"
                      max="2000"
                      step="50"
                      value={currentState.currentCAC}
                      onChange={(e) => setCurrentState({...currentState, currentCAC: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  </div>

                  <div className="mt-4">
                    <Tooltip text="Total number of active customers in your customer base">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Customer Base: {currentState.customerBase.toLocaleString()} ℹ️
                      </label>
                    </Tooltip>
                    <input
                      type="range"
                      min="10000"
                      max="500000"
                      step="10000"
                      value={currentState.customerBase}
                      onChange={(e) => setCurrentState({...currentState, customerBase: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sierra Assumptions */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-red-200 pb-3">
                🎯 Sierra-Enabled Assumptions
              </h2>
              <div className="space-y-4">
                <div>
                  <Tooltip text="Percentage of contacts that will be resolved by AI agents without human involvement after Sierra deployment">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      AI Containment Rate: {sierraAssumptions.aiContainment}% ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="50"
                    max="85"
                    value={sierraAssumptions.aiContainment}
                    onChange={(e) => setSierra({...sierraAssumptions, aiContainment: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Typical range: 60-80%</p>
                </div>
                <div>
                  <Tooltip text="Percentage reduction in average handle time for remaining human-handled contacts due to AI assistance and better context">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Handle Time Reduction: {sierraAssumptions.handleTimeReduction}% ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="30"
                    max="70"
                    value={sierraAssumptions.handleTimeReduction}
                    onChange={(e) => setSierra({...sierraAssumptions, handleTimeReduction: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Typical range: 40-60%</p>
                </div>
                <div>
                  <Tooltip text="Percentage increase in total communication volume due to cross-channel engagement (SMS during voice calls, follow-up messages, etc.)">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Cross-Channel Pull: {sierraAssumptions.crossChannelPull}% ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={sierraAssumptions.crossChannelPull}
                    onChange={(e) => setSierra({...sierraAssumptions, crossChannelPull: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Year 1: 5-10%, Year 2: 20-30%, Year 3+: 30-40%</p>
                </div>
                <div>
                  <Tooltip text="Percentage point reduction in customer churn rate due to improved service quality and faster resolutions">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Churn Improvement: {sierraAssumptions.churnImprovement}% points ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.5"
                    value={sierraAssumptions.churnImprovement}
                    onChange={(e) => setSierra({...sierraAssumptions, churnImprovement: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Conservative: 0-1%, Moderate: 1-2%, Aggressive: 2-3%</p>
                </div>
                <div>
                  <Tooltip text="Percentage reduction in customer acquisition cost due to word-of-mouth from improved customer experience and reduced acquisition touch points">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      CAC Improvement: {sierraAssumptions.cacImprovement}% ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="5"
                    value={sierraAssumptions.cacImprovement}
                    onChange={(e) => setSierra({...sierraAssumptions, cacImprovement: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Conservative: 10-15%, Moderate: 15-25%, Aggressive: 25-40%</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">
                  Customer Tier Profile: <span className="text-blue-600">{getTierProfile()}</span>
                </p>
              </div>
            </div>

            {/* Sierra Usage Inputs */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-purple-200 pb-3">
                📐 Sierra Usage Estimates
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                These numbers determine actual Sierra product costs. Work with customer to estimate realistic usage.
              </p>
              <div className="space-y-4">
                <div>
                  <Tooltip text="Number of unique customer profiles that will interact with Sierra each month (may be higher than monthly contacts if tracking repeat customers)">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Unique Contacts/Month: {sierraUsage.uniqueContactsPerMonth.toLocaleString()} ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="5000"
                    max="200000"
                    step="5000"
                    value={sierraUsage.uniqueContactsPerMonth}
                    onChange={(e) => setSierraUsage({...sierraUsage, uniqueContactsPerMonth: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>

                <div>
                  <Tooltip text="Average number of separate conversations each unique contact has per month (e.g., 2 = customer contacts twice per month)">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Conversations per Contact: {sierraUsage.conversationsPerContact} ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={sierraUsage.conversationsPerContact}
                    onChange={(e) => setSierraUsage({...sierraUsage, conversationsPerContact: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>

                <div>
                  <Tooltip text="Average number of participants in each conversation (1.0 = only customer, 1.3 = customer + occasionally another person, 2.0 = always customer + agent)">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Avg Participants/Conversation: {sierraUsage.avgParticipantsPerConversation} ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={sierraUsage.avgParticipantsPerConversation}
                    onChange={(e) => setSierraUsage({...sierraUsage, avgParticipantsPerConversation: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>

                <div>
                  <Tooltip text="Total size of enterprise knowledge documents to be stored in Memora (PDFs, FAQs, policies, etc.) in megabytes">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Knowledge Docs Size: {sierraUsage.knowledgeDocsSizeMB} MB ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="50"
                    value={sierraUsage.knowledgeDocsSizeMB}
                    onChange={(e) => setSierraUsage({...sierraUsage, knowledgeDocsSizeMB: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>

                <div>
                  <Tooltip text="Number of CINTEL language operators customer will use (sentiment, escalation detection, compliance, etc.). Each operator processes conversations independently.">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Number of Language Operators: {sierraUsage.numberOfLanguageOperators} ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={sierraUsage.numberOfLanguageOperators}
                    onChange={(e) => setSierraUsage({...sierraUsage, numberOfLanguageOperators: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Common operators: sentiment, escalation, compliance, intent, PII detection</p>
                </div>

                <div>
                  <Tooltip text="Average number of characters in each conversation (includes all turns). Short SMS: ~1000, Typical support: ~5000, Complex voice: ~10000">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Avg Conversation Characters: {sierraUsage.avgConversationChars.toLocaleString()} ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="1000"
                    max="15000"
                    step="500"
                    value={sierraUsage.avgConversationChars}
                    onChange={(e) => setSierraUsage({...sierraUsage, avgConversationChars: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>

                <div>
                  <Tooltip text="Ratio of memory recalls to creations. Higher ratio = better margins. 3:1 means 3 recalls for every 1 memory created. Target: 3-5 for healthy margins.">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Recall-to-Creation Ratio: {sierraUsage.recallToCreationRatio}:1 ℹ️
                    </label>
                  </Tooltip>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={sierraUsage.recallToCreationRatio}
                    onChange={(e) => setSierraUsage({...sierraUsage, recallToCreationRatio: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {sierraUsage.recallToCreationRatio < 3 ? '⚠️ Low ratio = margin risk' : '✅ Healthy margin ratio'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* ROI Summary */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-2xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-6">💰 ROI Summary</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm opacity-90 mb-1">Net Value</p>
                  <p className="text-3xl font-bold">{formatCurrency(results.metrics.netValue)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm opacity-90 mb-1">ROI</p>
                  <p className="text-3xl font-bold">{results.metrics.roi.toFixed(0)}%</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm opacity-90 mb-1">Payback Period</p>
                  <p className="text-3xl font-bold">{results.metrics.paybackMonths.toFixed(1)} mo</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm opacity-90 mb-1">Sierra Capture Rate</p>
                  <p className="text-3xl font-bold">{results.metrics.captureRate.toFixed(1)}%</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                <p className="text-sm mb-2">Industry benchmark for enabling tech: 10-30% of value</p>
                <p className="text-lg font-semibold">
                  Sierra's ask: {results.metrics.captureRate.toFixed(1)}% =
                  {results.metrics.captureRate < 10 ? ' HIGHLY DEFENSIBLE ✅' : ' COMPETITIVE ⚠️'}
                </p>
              </div>
            </div>

            {/* Value Created */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-green-200 pb-3">
                📈 Annual Value Created
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-700">Agent Cost Reduction</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(results.value.agentCostReduction)}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Formula: {results.formulas.agentCostReductionFormula}
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-700">Handle Time Efficiency</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(results.value.handleTimeEfficiency)}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Formula: {results.formulas.handleTimeEfficiencyFormula}
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-700">Churn Reduction Value</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(results.value.churnReduction)}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Formula: {results.formulas.churnReductionFormula}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Lower churn = fewer customers to replace = CAC savings
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-700">CAC Reduction Value</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(results.value.cacReduction)}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Formula: {results.formulas.cacReductionFormula}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Better CX = word-of-mouth = lower acquisition costs
                  </p>
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
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="font-semibold text-slate-700">Sierra Products</span>
                  <span className="text-lg font-bold text-orange-600">{formatCurrency(results.spend.sierraAnnual)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="font-semibold text-slate-700">Net Channel Change</span>
                  <span className={`text-lg font-bold ${results.spend.netChannelChange > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {results.spend.netChannelChange > 0 ? '+' : ''}{formatCurrency(results.spend.netChannelChange)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-orange-600 text-white rounded-lg mt-4">
                  <span className="text-lg font-bold">TOTAL SPEND</span>
                  <span className="text-2xl font-bold">{formatCurrency(results.spend.total)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-semibold text-slate-700 mb-3">Sierra Annual Breakdown by Product:</p>
                <div className="space-y-2 text-sm">
                  <Tooltip text={`Based on ${(sierraUsage.uniqueContactsPerMonth * sierraUsage.conversationsPerContact).toLocaleString()} total conversations × ${sierraUsage.avgConversationChars.toLocaleString()} avg chars / 1000 × $0.01`}>
                    <div className="flex justify-between hover:bg-slate-100 p-2 rounded">
                      <span className="text-slate-600">Memora - Memory Creation ℹ️:</span>
                      <span className="font-semibold">{formatCurrency(results.breakdown.memoryCreation)}</span>
                    </div>
                  </Tooltip>

                  <Tooltip text={`Based on ${(sierraUsage.uniqueContactsPerMonth * sierraUsage.conversationsPerContact).toLocaleString()} conversations × ${sierraUsage.recallToCreationRatio} recall ratio × ${sierraUsage.avgConversationChars.toLocaleString()} chars / 1000 × $0.007`}>
                    <div className="flex justify-between hover:bg-slate-100 p-2 rounded">
                      <span className="text-slate-600">Memora - Memory Recall ℹ️:</span>
                      <span className="font-semibold">{formatCurrency(results.breakdown.memoryRecall)}</span>
                    </div>
                  </Tooltip>

                  <Tooltip text={`Based on ${sierraUsage.uniqueContactsPerMonth.toLocaleString()} unique contacts × $0.01`}>
                    <div className="flex justify-between hover:bg-slate-100 p-2 rounded">
                      <span className="text-slate-600">Memora - Profiles ℹ️:</span>
                      <span className="font-semibold">{formatCurrency(results.breakdown.profiles)}</span>
                    </div>
                  </Tooltip>

                  <Tooltip text={`Based on ${(sierraUsage.uniqueContactsPerMonth * sierraUsage.conversationsPerContact).toLocaleString()} conversations × ${sierraUsage.avgConversationChars.toLocaleString()} chars × ${sierraUsage.numberOfLanguageOperators} operators / 1000 × $0.005`}>
                    <div className="flex justify-between hover:bg-slate-100 p-2 rounded">
                      <span className="text-slate-600">CINTEL - Language Operators ℹ️:</span>
                      <span className="font-semibold">{formatCurrency(results.breakdown.cintel)}</span>
                    </div>
                  </Tooltip>

                  <Tooltip text={`Based on ${(sierraUsage.uniqueContactsPerMonth * sierraUsage.conversationsPerContact).toLocaleString()} conversations × ${sierraUsage.avgParticipantsPerConversation} avg participants × $0.01`}>
                    <div className="flex justify-between hover:bg-slate-100 p-2 rounded">
                      <span className="text-slate-600">Maestro - Participants ℹ️:</span>
                      <span className="font-semibold">{formatCurrency(results.breakdown.maestro)}</span>
                    </div>
                  </Tooltip>

                  <Tooltip text={`Based on ${sierraUsage.knowledgeDocsSizeMB} MB stored × $2.50/MB`}>
                    <div className="flex justify-between hover:bg-slate-100 p-2 rounded">
                      <span className="text-slate-600">Memora - Knowledge Docs ℹ️:</span>
                      <span className="font-semibold">{formatCurrency(results.breakdown.knowledge)}</span>
                    </div>
                  </Tooltip>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-slate-700 mb-3">Channel Spend Impact:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Cross-channel engagement increase:</span>
                    <span className="font-semibold text-orange-600">+{formatCurrency(results.breakdown.channelIncrease)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Voice efficiency reduction:</span>
                    <span className="font-semibold text-green-600">-{formatCurrency(results.breakdown.voiceReduction)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-300">
                    <span className="font-semibold text-slate-700">Net Channel Impact:</span>
                    <span className={`font-bold ${results.spend.netChannelChange > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {results.spend.netChannelChange > 0 ? '+' : ''}{formatCurrency(results.spend.netChannelChange)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveCalculation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:scale-105"
            >
              💾 Save Calculation for {customerInfo.customerName || 'Customer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
