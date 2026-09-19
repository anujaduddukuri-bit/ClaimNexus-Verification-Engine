import React, { useState, useEffect } from 'react';
import { AnalyticsSummary } from '../types';
import { getAnalytics, getExecutions } from '../services/api';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import {
  BarChart3,
  RefreshCw,
  PieChart as PieIcon,
} from 'lucide-react';


// ============================================================
// VERDICT COLORS
// ============================================================

const VERDICT_COLORS: Record<string, string> = {
  Supported: '#4E8752',
  'Likely Supported': '#6A9B67',
  'Partially Supported': '#C29B5B',
  Contradicted: '#B44C43',
  'Likely Contradicted': '#9E4038',
  Inconclusive: '#9A9B91',
  'Insufficient Evidence': '#706F68',
};


// ============================================================
// CUSTOM TOOLTIP
// ============================================================

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const item = payload[0];

  const name =
    item.payload?.name ||
    item.name ||
    'Metric';

  const value = Number(item.value ?? 0);

  const total = Number(
    item.payload?.total ?? 0
  );

  const percentage =
    total > 0
      ? ((value / total) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="bg-[#0D1512] border-2 border-[#B46A45] p-3 rounded-xl shadow-2xl font-mono text-xs text-[#E5DED0] space-y-1 z-50">

      <p className="font-bold text-[#C29B5B] uppercase tracking-wider">
        {name}
      </p>

      <p className="text-[#E5DED0]">
        Count:
        <span className="font-bold text-white text-sm ml-1">
          {value}
        </span>
      </p>

      <p className="text-[#E5DED0]">
        Percentage:
        <span className="font-bold text-[#C29B5B] text-sm ml-1">
          {percentage}%
        </span>
      </p>

    </div>
  );
};


// ============================================================
// CUSTOM PIE LABEL
// ============================================================

const renderPieLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
}: any) => {

  if (!percent || percent < 0.04) {
    return null;
  }

  const RADIAN = Math.PI / 180;

  const radius =
    outerRadius + 18;

  const x =
    cx +
    radius *
      Math.cos(-midAngle * RADIAN);

  const y =
    cy +
    radius *
      Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#E5DED0"
      textAnchor={
        x > cx ? 'start' : 'end'
      }
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
      fontFamily="monospace"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


// ============================================================
// CUSTOM LEGEND
// ============================================================

const CustomLegend = ({
  payload,
  total,
}: any) => {

  if (!payload || !payload.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 pt-4">

      {payload.map(
        (entry: any, index: number) => {

          const value =
            Number(
              entry.payload?.value ?? 0
            );

          const percentage =
            total > 0
              ? (
                  (value / total) *
                  100
                ).toFixed(0)
              : '0';

          return (
            <div
              key={`legend-${index}`}
              className="flex items-center justify-between gap-3"
            >

              <div className="flex items-center min-w-0">

                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 mr-2"
                  style={{
                    backgroundColor:
                      entry.color,
                  }}
                />

                <span className="text-[#E5DED0] font-mono text-[10px] truncate">
                  {entry.value}
                </span>

              </div>

              <span className="text-[#C29B5B] font-mono text-[10px] font-bold flex-shrink-0">
                {value} ({percentage}%)
              </span>

            </div>
          );
        }
      )}

    </div>
  );
};


// ============================================================
// ANALYTICS DASHBOARD
// ============================================================

export const AnalyticsDashboard: React.FC = () => {

  const [analytics, setAnalytics] =
    useState<AnalyticsSummary | null>(null);

  const [totalEvidence, setTotalEvidence] =
    useState<number>(0);

  const [refreshing, setRefreshing] =
    useState<boolean>(false);


  // ==========================================================
  // LOAD ANALYTICS
  // ==========================================================

  const loadAnalytics = async (
    isSilent = false
  ) => {

    try {

      if (!isSilent) {
        setRefreshing(true);
      }

      const [
        analyticsData,
        executionsData,
      ] = await Promise.all([
        getAnalytics(),
        getExecutions(50),
      ]);

      setAnalytics(
        analyticsData
      );


      const evidenceCount =
        executionsData.reduce(
          (acc, exec) =>
            acc +
            (exec.evidence_items?.length || 0),
          0
        );

      setTotalEvidence(
        evidenceCount
      );

    } catch (err) {

      console.error(
        'Failed loading analytics:',
        err
      );

    } finally {

      setRefreshing(false);

    }
  };


  // ==========================================================
  // AUTO REFRESH
  // ==========================================================

  useEffect(() => {

    loadAnalytics();

    const interval =
      setInterval(() => {
        loadAnalytics(true);
      }, 5000);

    return () =>
      clearInterval(interval);

  }, []);


  // ==========================================================
  // LATENCY DATA
  // ==========================================================

  const overallLatency =
    Number(
      analytics?.avg_latency ?? 0
    );

  const geminiLatency =
    Number(
      analytics?.model_performance?.Gemini?.latency ?? 0
    );

  const groqLatency =
    Number(
      analytics?.model_performance?.Groq?.latency ?? 0
    );

  const geminiRuns =
    Number(
      analytics?.model_performance?.Gemini?.total_runs ?? 0
    );

  const groqRuns =
    Number(
      analytics?.model_performance?.Groq?.total_runs ?? 0
    );


  const modelData = [
    {
      name: 'Gemini',
      latency:
        geminiLatency > 0
          ? geminiLatency
          : geminiRuns > 0
            ? overallLatency
            : 0,
      runs: geminiRuns,
    },

    {
      name: 'Groq',
      latency:
        groqLatency > 0
          ? groqLatency
          : groqRuns > 0
            ? overallLatency
            : 0,
      runs: groqRuns,
    },
  ];


  // ==========================================================
  // VERDICT DATA
  // ==========================================================

  const verdictData =
    analytics?.verdict_distribution
      ? Object.entries(
          analytics.verdict_distribution
        )
          .map(
            ([name, value]) => ({
              name,
              value:
                Number(value) || 0,
              total:
                0,
              color:
                VERDICT_COLORS[name] ||
                '#C29B5B',
            })
          )
          .filter(
            (item) =>
              item.value > 0
          )
      : [];


  // ==========================================================
  // TOTAL VERDICTS
  // ==========================================================

  const totalVerdicts =
    verdictData.reduce(
      (acc, item) =>
        acc + item.value,
      0
    );


  // Add total to every pie item
  const pieData =
    verdictData.map(
      (item) => ({
        ...item,
        total:
          totalVerdicts,
      })
    );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="pt-20 pb-16 px-6 max-w-7xl mx-auto space-y-6">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between border-b border-[#304036] pb-4">

        <div>

          <h1 className="text-xl font-bold font-sans text-[#E5DED0] tracking-wider flex items-center space-x-2">

            <BarChart3 className="w-5 h-5 text-[#B46A45]" />

            <span>
              VERIFICATION ANALYTICS
            </span>

          </h1>


          <p className="text-xs text-[#9A9B91]">

            Claim Verification Performance &amp;
            Evidence Metrics • Live Auto-Sync (5s)

          </p>

        </div>


        <div className="flex items-center space-x-3 text-xs font-mono">


          <button
            onClick={() =>
              loadAnalytics(false)
            }
            className="p-1.5 rounded bg-[#15201A] hover:bg-[#20372B] text-[#C29B5B] border border-[#304036] transition-all"
            title="Refresh Analytics"
          >

            <RefreshCw
              className={`w-3.5 h-3.5 ${
                refreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

          </button>


          <span className="px-3 py-1 rounded bg-[#15201A] text-[#C29B5B] text-xs font-mono font-bold border border-[#304036]">

            LIVE AGGREGATION

          </span>

        </div>

      </div>


      {/* ======================================================
          METRIC CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">


        {/* TOTAL EXECUTIONS */}

        <div className="bg-[#15201A] p-4 rounded-xl border border-[#304036] space-y-1 shadow-subtle">

          <span className="text-[10px] font-mono text-[#9A9B91] uppercase">

            Total Executions

          </span>

          <p className="text-2xl font-bold font-mono text-[#E5DED0]">

            {analytics?.total_executions || 0}

          </p>

        </div>


        {/* AVG LATENCY */}

        <div className="bg-[#15201A] p-4 rounded-xl border border-[#304036] space-y-1 shadow-subtle">

          <span className="text-[10px] font-mono text-[#9A9B91] uppercase">

            Avg Latency

          </span>

          <p className="text-2xl font-bold font-mono text-[#B46A45]">

            {Number(
              analytics?.avg_latency ?? 0
            ).toFixed(2)}

            s

          </p>

        </div>


        {/* CONFIDENCE */}

        <div className="bg-[#15201A] p-4 rounded-xl border border-[#304036] space-y-1 shadow-subtle">

          <span className="text-[10px] font-mono text-[#9A9B91] uppercase">

            Avg Confidence Score

          </span>

          <p className="text-2xl font-bold font-mono text-[#4E8752]">

            {Number(
              analytics?.avg_confidence_score ?? 0
            ).toFixed(1)}

            %

          </p>

        </div>


        {/* EVIDENCE */}

        <div className="bg-[#15201A] p-4 rounded-xl border border-[#304036] space-y-1 shadow-subtle">

          <span className="text-[10px] font-mono text-[#9A9B91] uppercase">

            Evidence Items Evaluated

          </span>

          <p className="text-2xl font-bold font-mono text-[#C29B5B]">

            {totalEvidence}

          </p>

        </div>

      </div>


      {/* ======================================================
          CHART GRID
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


        {/* ====================================================
            RESEARCH AGENT LATENCY
        ==================================================== */}

        <div className="bg-[#15201A] p-6 rounded-xl border border-[#304036] space-y-4 shadow-subtle">


          <h3 className="font-mono text-xs font-bold text-[#E5DED0] uppercase tracking-wider flex items-center space-x-2 border-b border-[#304036] pb-3">

            <BarChart3 className="w-4 h-4 text-[#B46A45]" />

            <span>
              RESEARCH AGENT AVERAGE LATENCY (SECONDS)
            </span>

          </h3>


          <div className="h-64 min-h-[256px] w-full">


            {modelData.some(
              (d) =>
                d.latency > 0 ||
                d.runs > 0
            ) ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={256}
              >

                <BarChart
                  data={modelData}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 10,
                    bottom: 10,
                  }}
                >

                  <XAxis
                    dataKey="name"
                    stroke="#9A9B91"
                    tick={{
                      fontSize: 12,
                      fill: '#E5DED0',
                    }}
                  />

                  <YAxis
                    stroke="#9A9B91"
                    tick={{
                      fontSize: 12,
                      fill: '#E5DED0',
                    }}
                    domain={[
                      0,
                      'auto',
                    ]}
                  />

                  <Tooltip
                    content={
                      <CustomTooltip />
                    }
                  />

                  <Bar
                    dataKey="latency"
                    fill="#B46A45"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                    barSize={55}
                  />

                </BarChart>

              </ResponsiveContainer>

            ) : (

              <div className="h-full flex items-center justify-center font-mono text-xs text-[#9A9B91] text-center px-4">

                No research agent runs recorded yet.
                Execute a claim verification to populate
                live latency metrics.

              </div>

            )}

          </div>

        </div>


        {/* ====================================================
            VERDICT DONUT CHART
        ==================================================== */}

        <div className="bg-[#15201A] p-6 rounded-xl border border-[#304036] space-y-4 shadow-subtle">


          <h3 className="font-mono text-xs font-bold text-[#E5DED0] uppercase tracking-wider flex items-center space-x-2 border-b border-[#304036] pb-3">

            <PieIcon className="w-4 h-4 text-[#C29B5B]" />

            <span>
              VERDICT CATEGORY DISTRIBUTION
            </span>

          </h3>


          {pieData.length > 0 ? (

            <div className="space-y-4">


              {/* DONUT */}

              <div className="relative h-64 min-h-[256px] w-full">


                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={256}
                >

                  <PieChart>

                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      innerRadius={72}
                      outerRadius={105}
                      paddingAngle={
                        pieData.length > 1
                          ? 3
                          : 0
                      }
                      startAngle={90}
                      endAngle={-270}
                      labelLine={
                        pieData.length > 1
                      }
                      label={
                        pieData.length > 1
                          ? renderPieLabel
                          : false
                      }
                      isAnimationActive={true}
                      animationDuration={700}
                    >

                      {pieData.map(
                        (
                          entry,
                          index
                        ) => (

                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.color
                            }
                            stroke="#15201A"
                            strokeWidth={2}
                          />

                        )
                      )}

                    </Pie>


                    <Tooltip
                      content={
                        <CustomTooltip />
                      }
                    />


                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      content={
                        <CustomLegend
                          total={
                            totalVerdicts
                          }
                        />
                      }
                    />

                  </PieChart>

                </ResponsiveContainer>


                {/* CENTER CONTENT */}

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">

                  <div className="text-center">

                    <p className="text-3xl font-bold font-mono text-[#E5DED0]">

                      {totalVerdicts}

                    </p>

                    <p className="text-[9px] font-mono text-[#9A9B91] uppercase tracking-widest">

                      TOTAL RUNS

                    </p>

                  </div>

                </div>


              </div>


              {/* =================================================
                  SINGLE CATEGORY MESSAGE
              ================================================= */}

              {pieData.length === 1 && (

                <div className="bg-[#0D1512] border border-[#304036] rounded-xl p-3 text-center">

                  <p className="text-[10px] font-mono text-[#9A9B91] uppercase tracking-wider">

                    Current distribution

                  </p>

                  <p
                    className="text-sm font-mono font-bold mt-1"
                    style={{
                      color:
                        pieData[0].color,
                    }}
                  >

                    {pieData[0].name}

                    <span className="text-[#E5DED0] ml-2">

                      {pieData[0].value}

                    </span>

                    <span className="text-[#C29B5B] ml-2">

                      (100%)

                    </span>

                  </p>

                </div>

              )}


              {/* =================================================
                  CATEGORY BREAKDOWN
              ================================================= */}

              <div className="bg-[#0D1512] rounded-xl border border-[#304036] p-4">


                <div className="flex items-center justify-between mb-3">

                  <span className="text-[10px] text-[#9A9B91] uppercase font-mono tracking-wider">

                    CATEGORY BREAKDOWN

                  </span>

                  <span className="text-[10px] text-[#C29B5B] uppercase font-mono font-bold">

                    {totalVerdicts} TOTAL RUNS

                  </span>

                </div>


                <div className="space-y-3">


                  {pieData.map(
                    (v) => {

                      const pct =
                        totalVerdicts >
                        0
                          ? (
                              (v.value /
                                totalVerdicts) *
                              100
                            ).toFixed(0)
                          : '0';


                      return (

                        <div
                          key={
                            v.name
                          }
                          className="space-y-1.5"
                        >


                          <div className="flex justify-between items-center">


                            <span className="flex items-center space-x-2">

                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor:
                                    v.color,
                                }}
                              />


                              <span className="text-[#E5DED0] font-mono text-[11px] font-semibold">

                                {v.name}

                              </span>

                            </span>


                            <span className="text-[#C29B5B] font-mono text-[11px] font-bold">

                              {v.value}

                              {' '}

                              ({pct}%)

                            </span>

                          </div>


                          <div className="w-full bg-[#15201A] rounded-full h-1.5 border border-[#304036] overflow-hidden">


                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width:
                                  `${pct}%`,
                                backgroundColor:
                                  v.color,
                              }}
                            />


                          </div>


                        </div>

                      );

                    }
                  )}

                </div>

              </div>

            </div>

          ) : (

            <div className="h-64 flex items-center justify-center font-mono text-xs text-[#9A9B91] text-center px-4">

              No verdict distribution data recorded yet.
              Run claim verifications to populate verdict metrics.

            </div>

          )}

        </div>

      </div>

    </div>

  );
};