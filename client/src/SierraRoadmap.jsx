import { useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

const COLORS = {
  v1: "#059669", v1Light: "#d1fae5",
  v2: "#2563eb", v2Light: "#dbeafe",
  v3: "#7c3aed", v3Light: "#ede9fe",
  spend: "#dc2626", spendLight: "#fee2e2",
  bg: "#faf9f7", card: "#ffffff",
  text: "#1a1a1a", muted: "#6b7280", light: "#9ca3af",
  border: "#e5e7eb", accent: "#f59e0b",
};

export default function SierraRoadmapCEO() {
  const [showDetail, setShowDetail] = useState(null);
  const [customerSize, setCustomerSize] = useState("large");

  const profiles = {
    small: {
      label: "Mid-Market", agents: 25, seatCost: 135, aht: 5, costPerMin: 0.45,
      monthlyConvos: 65000, voiceMix: 0.60,
      maxSeatReduction: 4, desc: "≤$100K/yr comms · 25 agents · 65K convos/mo"
    },
    mid: {
      label: "Enterprise", agents: 100, seatCost: 165, aht: 6, costPerMin: 0.50,
      monthlyConvos: 160000, voiceMix: 0.75,
      maxSeatReduction: 12, desc: ">$100K/yr comms · 100 agents · 160K convos/mo"
    },
    large: {
      label: "Large Enterprise", agents: 300, seatCost: 180, aht: 7, costPerMin: 0.55,
      monthlyConvos: 400000, voiceMix: 0.85,
      maxSeatReduction: 35, desc: ">$250K/yr comms · 300 agents · 400K convos/mo"
    },
  };

  const p = profiles[customerSize];

  const calcScenario = (adoptionPct) => {
    const sierraConvos = Math.round(p.monthlyConvos * (adoptionPct / 100));
    const containmentRate = 0.55;
    const htReductionPct = 0.25;

    const seatReduction = Math.min(p.maxSeatReduction, Math.round(p.agents * adoptionPct / 100 * 0.10));
    const seatSavings = seatReduction * p.seatCost * 12;
    const humanContacts = sierraConvos * (1 - containmentRate);
    const minSaved = p.aht * htReductionPct;
    const htSavings = humanContacts * minSaved * p.costPerMin * 12;
    const costSavings = seatSavings + htSavings;

    const weightedChars = p.voiceMix * 2825 + (1 - p.voiceMix) * 1683;
    const maestro = sierraConvos * 0.01;
    const memCreate = sierraConvos * (weightedChars / 1000) * 0.01;
    const memRecall = sierraConvos * 1 * 0.007;
    const cintel = sierraConvos * (weightedChars * 2 * 3 / 1000) * 0.005;
    const voiceTrans = sierraConvos * p.voiceMix * 5 * 0.015;
    const knowledge = 500 * 2.50;
    const profilesFee = 1000;
    const monthlySierra = maestro + memCreate + memRecall + cintel + voiceTrans + knowledge + profilesFee;
    const annualSierra = monthlySierra * 12;

    const v2Uplift = sierraConvos * 0.035 * 12;
    const v3Uplift = sierraConvos * 0.05 * 0.05 * 150 * 12;

    return {
      adoption: adoptionPct,
      convos: sierraConvos,
      costSavings: Math.round(costSavings / 1000),
      v2Value: Math.round((costSavings + v2Uplift) / 1000),
      v3Value: Math.round((costSavings + v2Uplift + v3Uplift) / 1000),
      spend: Math.round(annualSierra / 1000),
      roi_v1: costSavings > 0 ? Math.round(((costSavings - annualSierra) / annualSierra) * 100) : 0,
      roi_v3: (costSavings + v2Uplift + v3Uplift) > 0 ? Math.round((((costSavings + v2Uplift + v3Uplift) - annualSierra) / annualSierra) * 100) : 0,
      capture_v1: costSavings > 0 ? Math.round((annualSierra / costSavings) * 100) : 999,
      capture_v3: (costSavings + v2Uplift + v3Uplift) > 0 ? Math.round((annualSierra / (costSavings + v2Uplift + v3Uplift)) * 100) : 999,
      netValue_v1: Math.round((costSavings - annualSierra) / 1000),
      netValue_v3: Math.round((costSavings + v2Uplift + v3Uplift - annualSierra) / 1000),
    };
  };

  const chartData = [10, 20, 30, 40, 50, 60, 70, 80, 90].map(calcScenario);
  const crossover = chartData.find((d) => d.spend > d.costSavings);
  const crossoverPct = crossover ? crossover.adoption : null;

  const scenarios = [calcScenario(25), calcScenario(50), calcScenario(75)];

  const formatK = (v) => `$${v.toLocaleString()}K`;

  const roadmapPhases = [
    {
      version: "V1", period: "May 2026", label: "Foundation",
      color: COLORS.v1, lightColor: COLORS.v1Light,
      capabilities: [
        "Memora: memory creation/recall, profiles, knowledge",
        "CINTEL: real-time operators (sentiment, next-best-action)",
        "Maestro: conversation storage, basic orchestration",
        "Channels: Voice, SMS, WhatsApp",
      ],
      valueDrivers: "Cost savings only — seat reduction, AHT improvement, containment lift",
      packaging: "Sierra Essentials: Memora + CINTEL + Maestro at list pricing",
      acvRange: "Target ACV: $50K–$200K",
      anchors: "Anchors 2, 5 partial",
      roiStory: "Immediate, measurable agent productivity gains. 100%+ ROI on cost savings alone for most enterprise customers.",
    },
    {
      version: "V2", period: "H2 2026", label: "Orchestration",
      color: COLORS.v2, lightColor: COLORS.v2Light,
      capabilities: [
        "Maestro GA++: session scope, cross-channel stitching",
        "Outbound engagement begins (Voice & Messaging APIs)",
        "Email/Chat + Profiles integration",
        "Initial Flex/Memora feature drip",
        "Comms API integration begins",
      ],
      valueDrivers: "Cost savings + operational efficiency + early revenue metrics (cross-channel pull, reduced escalations)",
      packaging: "Sierra Orchestration: V1 + Advanced Profiles + full operator suite + outbound APIs",
      acvRange: "Target ACV: $200K–$400K",
      anchors: "Anchors 1–3 functional, 4–5 strong",
      roiStory: "Cross-channel continuity reduces duplicate contacts 15–20%. Outbound begins dripping revenue metrics. Capture rate drops, making larger deals palatable.",
    },
    {
      version: "V3", period: "2027", label: "Full Platform",
      color: COLORS.v3, lightColor: COLORS.v3Light,
      capabilities: [
        "H1: Comms API abstraction + intelligent orchestration",
        "H2: Full outbound-to-conversation activation",
        "Complete Sierra+Flex integration (AI↔Human)",
        "Email channel GA",
        "Proactive alerts → interactive conversations",
      ],
      valueDrivers: "Cost savings + operational efficiency + revenue generation (upsell/cross-sell, outbound-to-sale, CLTV expansion)",
      packaging: "Sierra Platform: Full omnichannel suite + outbound activation + Flex integration",
      acvRange: "Target ACV: $400K–$1M+",
      anchors: "All 6 anchors complete",
      roiStory: "Revenue generation removes the ceiling on deal size. Alerts become sales conversations. Customers invest at platform level because value is multiplicative, not additive.",
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        <p style={{ fontWeight: 700, marginBottom: 6 }}>{label}% Adoption</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: "2px 0" }}>
            {p.name}: {formatK(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── HEADER ── */}
        <div style={{ borderBottom: `3px solid ${COLORS.text}`, paddingBottom: 12, marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.5, color: COLORS.text }}>
            Sierra Product Roadmap: Progressive Value Justification
          </h1>
          <p style={{ fontSize: 13, color: COLORS.muted, margin: "4px 0 0", fontFamily: "system-ui, sans-serif" }}>
            CEO Summary — February 2026
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: PRODUCT ROADMAP                                     */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px", color: COLORS.text }}>
          1. Product Roadmap — Three Versioned Phases
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 36 }}>
          {roadmapPhases.map((phase) => (
            <div
              key={phase.version}
              onClick={() => setShowDetail(showDetail === phase.version ? null : phase.version)}
              style={{
                background: COLORS.card, borderRadius: 8, border: `2px solid ${phase.color}`,
                cursor: "pointer", overflow: "hidden",
                boxShadow: showDetail === phase.version ? `0 0 0 3px ${phase.lightColor}` : "0 1px 4px rgba(0,0,0,0.06)",
                transition: "box-shadow 0.2s",
              }}
            >
              <div style={{ background: phase.color, color: "#fff", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "system-ui, sans-serif" }}>{phase.version}</span>
                  <span style={{ fontSize: 12, marginLeft: 8, opacity: 0.9 }}>{phase.label}</span>
                </div>
                <span style={{ fontSize: 12, fontFamily: "system-ui, sans-serif", opacity: 0.85 }}>{phase.period}</span>
              </div>
              <div style={{ padding: "12px 14px", fontFamily: "system-ui, sans-serif", fontSize: 12 }}>
                <p style={{ fontWeight: 700, color: phase.color, margin: "0 0 6px", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Value Driver</p>
                <p style={{ margin: "0 0 10px", color: COLORS.text, lineHeight: 1.5 }}>{phase.valueDrivers}</p>
                <p style={{ fontWeight: 700, color: COLORS.muted, margin: "0 0 4px", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Packaging</p>
                <p style={{ margin: "0 0 8px", color: COLORS.muted, lineHeight: 1.4 }}>{phase.packaging}</p>
                <div style={{ background: phase.lightColor, borderRadius: 4, padding: "6px 10px", fontWeight: 600, color: phase.color }}>
                  {phase.acvRange}
                </div>
              </div>
              {showDetail === phase.version && (
                <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "12px 14px", background: "#fafafa", fontFamily: "system-ui, sans-serif", fontSize: 11 }}>
                  <p style={{ fontWeight: 700, margin: "0 0 4px", color: COLORS.text }}>Capabilities</p>
                  <ul style={{ margin: "0 0 8px", paddingLeft: 16, color: COLORS.muted, lineHeight: 1.6 }}>
                    {phase.capabilities.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                  <p style={{ fontWeight: 700, margin: "0 0 4px", color: COLORS.text }}>Anchors: <span style={{ fontWeight: 400 }}>{phase.anchors}</span></p>
                  <p style={{ fontWeight: 700, margin: "8px 0 4px", color: COLORS.text }}>ROI Story</p>
                  <p style={{ margin: 0, color: COLORS.muted, lineHeight: 1.5, fontStyle: "italic" }}>{phase.roiStory}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: VALUE CEILING                                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px", color: COLORS.text }}>
          2. The Value Ceiling — Why V2/V3 Features Are Essential
        </h2>
        <p style={{ fontSize: 13, color: COLORS.muted, margin: "0 0 16px", fontFamily: "system-ui, sans-serif", lineHeight: 1.5 }}>
          Cost savings (V1) eventually plateau — the customer's operational savings pool is finite. Revenue generation (V3) removes the ceiling.
        </p>

        {/* Customer profile selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, fontFamily: "system-ui, sans-serif" }}>
          {Object.entries(profiles).map(([key, prof]) => (
            <button
              key={key}
              onClick={() => setCustomerSize(key)}
              style={{
                padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: customerSize === key ? `2px solid ${COLORS.v2}` : `1px solid ${COLORS.border}`,
                background: customerSize === key ? COLORS.v2Light : "#fff",
                color: customerSize === key ? COLORS.v2 : COLORS.muted,
              }}
            >
              {prof.label}
              <span style={{ fontWeight: 400, marginLeft: 8, fontSize: 11, display: "block", marginTop: 2 }}>{prof.desc}</span>
            </button>
          ))}
        </div>

        {/* Chart */}
        <div style={{ background: COLORS.card, borderRadius: 8, border: `1px solid ${COLORS.border}`, padding: "16px 16px 8px", marginBottom: 12 }}>
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="adoption" tick={{ fontSize: 11, fontFamily: "system-ui" }} label={{ value: "Sierra Adoption Rate (%)", position: "insideBottom", offset: -2, style: { fontSize: 11, fontFamily: "system-ui", fill: COLORS.muted } }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "system-ui" }} tickFormatter={(v) => `$${v}K`} label={{ value: "Annual ($K)", angle: -90, position: "insideLeft", offset: 5, style: { fontSize: 11, fontFamily: "system-ui", fill: COLORS.muted } }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "system-ui, sans-serif" }} />
              <Bar dataKey="costSavings" name="V1: Cost Savings Only" fill={COLORS.v1} opacity={0.7} barSize={18} />
              <Bar dataKey="v2Value" name="V2: + Orchestration Efficiency" fill={COLORS.v2} opacity={0.7} barSize={18} />
              <Bar dataKey="v3Value" name="V3: + Revenue Generation" fill={COLORS.v3} opacity={0.7} barSize={18} />
              <Line dataKey="spend" name="Sierra Spend" stroke={COLORS.spend} strokeWidth={2.5} dot={{ fill: COLORS.spend, r: 3 }} strokeDasharray="6 3" />
              {crossoverPct && (
                <ReferenceLine x={crossoverPct} stroke={COLORS.spend} strokeDasharray="3 3" label={{ value: `V1 Ceiling (${crossoverPct}%)`, position: "top", style: { fontSize: 10, fill: COLORS.spend, fontFamily: "system-ui" } }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart insight callouts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 36, fontFamily: "system-ui, sans-serif" }}>
          <div style={{ background: COLORS.spendLight, borderRadius: 8, padding: "12px 16px", border: `1px solid ${COLORS.spend}20` }}>
            <p style={{ fontWeight: 700, fontSize: 12, color: COLORS.spend, margin: "0 0 6px" }}>
              ⚠️ The V1 Ceiling {crossoverPct ? `(~${crossoverPct}% adoption)` : ""}
            </p>
            <p style={{ fontSize: 12, color: COLORS.text, margin: 0, lineHeight: 1.5 }}>
              {crossoverPct
                ? `At ${crossoverPct}%+ adoption, Sierra spend exceeds cost savings for this profile. Without V2/V3 features, no rational basis to increase investment.`
                : "Even when cost savings technically cover spend, capture rates above 40% make large deals unjustifiable without revenue upside."}
            </p>
          </div>
          <div style={{ background: COLORS.v3Light, borderRadius: 8, padding: "12px 16px", border: `1px solid ${COLORS.v3}20` }}>
            <p style={{ fontWeight: 700, fontSize: 12, color: COLORS.v3, margin: "0 0 6px" }}>
              ✅ V3 Removes the Ceiling
            </p>
            <p style={{ fontSize: 12, color: COLORS.text, margin: 0, lineHeight: 1.5 }}>
              Revenue generation (upsell, outbound-to-sale, CLTV expansion) creates value that scales with usage, not bounded by headcount. Justifies platform-level investment.
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: ROI SCENARIOS — LARGE ENTERPRISE                    */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px", color: COLORS.text }}>
          3. ROI Scenarios — {profiles[customerSize].label} Customer
        </h2>
        <p style={{ fontSize: 13, color: COLORS.muted, margin: "0 0 16px", fontFamily: "system-ui, sans-serif" }}>
          Three adoption scenarios showing how value sources and capture rates shift across versions.
        </p>

        <div style={{ overflowX: "auto", marginBottom: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "system-ui, sans-serif", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.text}` }}>
                <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 700, width: "28%" }}>Metric</th>
                {scenarios.map((s) => (
                  <th key={s.adoption} style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, width: "24%" }}>
                    {s.adoption}% Adoption
                    <br /><span style={{ fontWeight: 400, color: COLORS.muted, fontSize: 11 }}>{(s.convos / 1000).toFixed(0)}K convos/mo</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Value rows */}
              <tr style={{ background: "#fafafa" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: COLORS.v1, borderBottom: `1px solid ${COLORS.border}` }}>V1 Value (cost savings)</td>
                {scenarios.map((s) => (
                  <td key={s.adoption} style={{ textAlign: "right", padding: "10px 12px", fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{formatK(s.costSavings)}</td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: COLORS.v2, borderBottom: `1px solid ${COLORS.border}` }}>V2 Value (+ efficiency)</td>
                {scenarios.map((s) => (
                  <td key={s.adoption} style={{ textAlign: "right", padding: "10px 12px", fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{formatK(s.v2Value)}</td>
                ))}
              </tr>
              <tr style={{ background: "#fafafa" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: COLORS.v3, borderBottom: `1px solid ${COLORS.border}` }}>V3 Value (+ revenue gen)</td>
                {scenarios.map((s) => (
                  <td key={s.adoption} style={{ textAlign: "right", padding: "10px 12px", fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{formatK(s.v3Value)}</td>
                ))}
              </tr>
              {/* Spend row */}
              <tr>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: COLORS.spend, borderBottom: `2px solid ${COLORS.text}` }}>Sierra Spend</td>
                {scenarios.map((s) => (
                  <td key={s.adoption} style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, color: COLORS.spend, borderBottom: `2px solid ${COLORS.text}` }}>{formatK(s.spend)}</td>
                ))}
              </tr>
              {/* ROI rows */}
              <tr style={{ background: COLORS.v1Light + "60" }}>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: COLORS.v1, borderBottom: `1px solid ${COLORS.border}` }}>V1 ROI</td>
                {scenarios.map((s) => (
                  <td key={s.adoption} style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, color: s.roi_v1 > 0 ? COLORS.v1 : COLORS.spend, borderBottom: `1px solid ${COLORS.border}` }}>
                    {s.roi_v1}%
                  </td>
                ))}
              </tr>
              <tr style={{ background: COLORS.v3Light + "60" }}>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: COLORS.v3, borderBottom: `1px solid ${COLORS.border}` }}>V3 ROI</td>
                {scenarios.map((s) => (
                  <td key={s.adoption} style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, color: COLORS.v3, borderBottom: `1px solid ${COLORS.border}` }}>
                    {s.roi_v3}%
                  </td>
                ))}
              </tr>
              {/* Net Value rows */}
              <tr style={{ background: "#fafafa" }}>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: COLORS.v1, borderBottom: `1px solid ${COLORS.border}` }}>V1 Net Value</td>
                {scenarios.map((s) => (
                  <td key={s.adoption} style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, color: s.netValue_v1 >= 0 ? COLORS.v1 : COLORS.spend, borderBottom: `1px solid ${COLORS.border}` }}>
                    {formatK(s.netValue_v1)} {s.netValue_v1 < 0 ? "⚠️" : ""}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: COLORS.v3, borderBottom: `1px solid ${COLORS.border}` }}>V3 Net Value</td>
                {scenarios.map((s) => (
                  <td key={s.adoption} style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, color: COLORS.v3, borderBottom: `1px solid ${COLORS.border}` }}>
                    {formatK(s.netValue_v3)}
                  </td>
                ))}
              </tr>
              {/* Capture Rate rows */}
              <tr style={{ background: COLORS.accent + "08" }}>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: COLORS.accent, borderBottom: `1px solid ${COLORS.border}` }}>
                  V1 Capture Rate
                  <span style={{ fontWeight: 400, fontSize: 10, color: COLORS.light, display: "block" }}>Spend ÷ Value (lower = better)</span>
                </td>
                {scenarios.map((s) => (
                  <td key={s.adoption} style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, borderBottom: `1px solid ${COLORS.border}`, color: s.capture_v1 > 50 ? COLORS.spend : s.capture_v1 > 35 ? COLORS.accent : COLORS.v1 }}>
                    {s.capture_v1}% {s.capture_v1 > 50 ? "🔴" : s.capture_v1 > 35 ? "🟡" : "🟢"}
                  </td>
                ))}
              </tr>
              <tr style={{ background: COLORS.accent + "08" }}>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: COLORS.accent, borderBottom: `1px solid ${COLORS.border}` }}>
                  V3 Capture Rate
                  <span style={{ fontWeight: 400, fontSize: 10, color: COLORS.light, display: "block" }}>Spend ÷ Value (lower = better)</span>
                </td>
                {scenarios.map((s) => (
                  <td key={s.adoption} style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, borderBottom: `1px solid ${COLORS.border}`, color: s.capture_v3 > 50 ? COLORS.spend : s.capture_v3 > 35 ? COLORS.accent : COLORS.v3 }}>
                    {s.capture_v3}% {s.capture_v3 > 50 ? "🔴" : s.capture_v3 > 35 ? "🟡" : "🟢"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Scenario interpretation */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28, fontFamily: "system-ui, sans-serif" }}>
          {scenarios.map((s, i) => {
            const labels = ["Conservative", "Moderate", "Aggressive"];
            const colors = [COLORS.v1, COLORS.v2, COLORS.v3];
            return (
              <div key={s.adoption} style={{ background: COLORS.card, borderRadius: 8, border: `1px solid ${COLORS.border}`, padding: "12px 14px", borderTop: `3px solid ${colors[i]}` }}>
                <p style={{ fontWeight: 700, fontSize: 12, color: colors[i], margin: "0 0 6px" }}>{labels[i]} ({s.adoption}%)</p>
                <p style={{ fontSize: 11, color: COLORS.muted, margin: "0 0 4px", lineHeight: 1.5 }}>
                  <strong>V1 only:</strong> {s.capture_v1 > 50 ? "Spend exceeds savings — deal stalls." : s.capture_v1 > 35 ? "Positive but capture rate uncomfortable for expansion." : "Healthy ROI, room to grow."}
                </p>
                <p style={{ fontSize: 11, color: COLORS.muted, margin: "0 0 4px", lineHeight: 1.5 }}>
                  <strong>With V3:</strong> {s.capture_v3 < 25 ? "Excellent capture rate — platform deal justified." : s.capture_v3 < 35 ? "Healthy capture — expansion straightforward." : "Revenue metrics needed to close at this level."}
                </p>
                <p style={{ fontSize: 11, color: colors[i], fontWeight: 600, margin: "4px 0 0" }}>
                  V3 adds {formatK(s.v3Value - s.costSavings)} in incremental value
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <p style={{ fontSize: 10, color: COLORS.light, marginTop: 16, fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
          Analysis based on Sierra ROI Calculator · List pricing · 55% AI containment · 25% AHT reduction · Click V1/V2/V3 cards for detail
        </p>
      </div>
    </div>
  );
}
