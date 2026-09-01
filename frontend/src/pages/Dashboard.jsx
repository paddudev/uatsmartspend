import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  IconButton,
  Paper,
  Stack,
  ThemeProvider,
  Typography,
  createTheme,
  useTheme,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { listTransactions } from "../api/transactions";
import { useAuth } from "../auth/AuthContext";
import {
  addMonths,
  dayOfMonth,
  daysInMonth,
  isInMonth,
  monthDateRangeLabel,
  monthLongLabel,
} from "../utils/dashboardMonth";

const PIE_COLORS = ["#1976d2", "#42a5f5", "#90caf9", "#546e7a", "#b0bec5", "#cfd8dc"];

const inrWhole = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrPrecise = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

function formatINR(amount, { precise = false } = {}) {
  const value = Number(amount) || 0;
  return precise ? inrPrecise.format(value) : inrWhole.format(value);
}
const FUNNEL_COLORS = ["#0d47a1", "#1565c0", "#1976d2", "#42a5f5", "#90caf9"];

function summarizeMonth(transactions, monthDate) {
  const inMonth = transactions.filter((t) => isInMonth(t.transaction_date, monthDate));
  const days = daysInMonth(monthDate);

  const dailyGains = Array(days + 1).fill(0);
  const dailyExpenses = Array(days + 1).fill(0);
  const byCategory = new Map();
  const byProduct = new Map();

  let gains = 0;
  let expenses = 0;

  inMonth.forEach((t) => {
    const amount = Number(t.amount) || 0;
    const d = dayOfMonth(t.transaction_date);
    if (t.commonmaster_name === "Gains") {
      gains += amount;
      if (d >= 1 && d <= days) dailyGains[d] += amount;
    } else {
      expenses += amount;
      if (d >= 1 && d <= days) dailyExpenses[d] += amount;
      const cat = t.category_name || "Uncategorized";
      byCategory.set(cat, (byCategory.get(cat) || 0) + amount);
      const prod = t.product_name || "Unknown";
      byProduct.set(prod, (byProduct.get(prod) || 0) + amount);
    }
  });

  const net = gains - expenses;
  const avgPerDay = net / days;

  let cumGains = 0;
  let cumExpenses = 0;
  let cumNetSum = 0;
  const dailySeries = [];
  for (let d = 1; d <= days; d++) {
    cumGains += dailyGains[d];
    cumExpenses += dailyExpenses[d];
    cumNetSum += dailyGains[d] - dailyExpenses[d];
    dailySeries.push({
      day: d,
      gains: dailyGains[d],
      expenses: dailyExpenses[d],
      net: dailyGains[d] - dailyExpenses[d],
      cumGains,
      cumExpenses,
      cumAvg: cumNetSum / d,
    });
  }

  return {
    gains,
    expenses,
    net,
    avgPerDay,
    dailySeries,
    byCategory,
    byProduct,
    transactionCount: inMonth.length,
  };
}

function Sparkline({ data, dataKey, color }) {
  return (
    <Box sx={{ width: 110, height: 36, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

function ChangeBadge({ current, previous, positiveIsGood = true }) {
  if (previous === 0 && current === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        flat
      </Typography>
    );
  }
  if (previous === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        new
      </Typography>
    );
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(pct) < 1) {
    return (
      <Typography variant="body2" color="text.secondary">
        flat
      </Typography>
    );
  }
  const isUp = pct > 0;
  const good = isUp === positiveIsGood;
  const color = good ? "success.main" : "error.main";
  const Icon = isUp ? ArrowUpwardIcon : ArrowDownwardIcon;
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
      <Icon sx={{ fontSize: 16, color }} />
      <Typography variant="body2" sx={{ color }}>
        {Math.abs(pct).toFixed(0)}%
      </Typography>
    </Stack>
  );
}

function StatCard({ label, value, sparklineData, sparklineKey, sparklineColor, current, previous, positiveIsGood }) {
  return (
    <Paper sx={{ p: 2.5, flex: "1 1 220px", minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        <Sparkline data={sparklineData} dataKey={sparklineKey} color={sparklineColor} />
      </Stack>
      <Box sx={{ mt: 1 }}>
        <ChangeBadge current={current} previous={previous} positiveIsGood={positiveIsGood} />
      </Box>
    </Paper>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const outerTheme = useTheme();
  const dashboardTheme = useMemo(
    () =>
      createTheme(outerTheme, {
        typography: { fontFamily: '"Times New Roman", Times, serif' },
      }),
    [outerTheme]
  );

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthCursor, setMonthCursor] = useState(() => new Date());

  useEffect(() => {
    listTransactions({ userid_fk: user.id })
      .then(setTransactions)
      .catch(() => setError("Unable to load dashboard data."))
      .finally(() => setLoading(false));
  }, [user.id]);

  const prevMonthCursor = useMemo(() => addMonths(monthCursor, -1), [monthCursor]);
  const current = useMemo(() => summarizeMonth(transactions, monthCursor), [transactions, monthCursor]);
  const previous = useMemo(() => summarizeMonth(transactions, prevMonthCursor), [transactions, prevMonthCursor]);

  const categoryEntries = useMemo(
    () => [...current.byCategory.entries()].sort((a, b) => b[1] - a[1]),
    [current]
  );
  const totalCategorySpend = categoryEntries.reduce((sum, [, v]) => sum + v, 0);
  const topCategories = categoryEntries.slice(0, 4);
  const moreCategoriesCount = categoryEntries.length - topCategories.length;

  const pieSlices = useMemo(() => {
    const top5 = categoryEntries.slice(0, 5);
    const rest = categoryEntries.slice(5);
    const restSum = rest.reduce((sum, [, v]) => sum + v, 0);
    const slices = top5.map(([name, value]) => ({ name, value }));
    if (restSum > 0) slices.push({ name: "Other", value: restSum });
    return slices;
  }, [categoryEntries]);

  const compareData = [
    { label: "In", prev: previous.gains, curr: current.gains },
    { label: "Out", prev: previous.expenses, curr: current.expenses },
    { label: "Net", prev: previous.net, curr: current.net },
  ];

  const funnelData = useMemo(() => {
    const top = [...current.byProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return top.map(([name, value], i) => ({
      name: `${name}  ${formatINR(value)}`,
      value,
      fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
    }));
  }, [current]);

  return (
    <ThemeProvider theme={dashboardTheme}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3, width: "100%" }}>
        <Typography variant="h4">Overview · {monthLongLabel(monthCursor)}</Typography>
        <Paper
          variant="outlined"
          sx={{ display: "flex", alignItems: "center", px: 1, borderRadius: 5 }}
        >
          <IconButton size="small" onClick={() => setMonthCursor((d) => addMonths(d, -1))} aria-label="Previous month">
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" sx={{ minWidth: 120, textAlign: "center" }}>
            {monthDateRangeLabel(monthCursor)}
          </Typography>
          <IconButton size="small" onClick={() => setMonthCursor((d) => addMonths(d, 1))} aria-label="Next month">
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {!loading && !error && current.transactionCount === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No transactions recorded for {monthLongLabel(monthCursor)}.
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap" }}>
        <StatCard
          label="Gains"
          value={formatINR(current.gains)}
          sparklineData={current.dailySeries}
          sparklineKey="gains"
          sparklineColor="#2e7d32"
          current={current.gains}
          previous={previous.gains}
          positiveIsGood
        />
        <StatCard
          label="Expenses"
          value={formatINR(current.expenses)}
          sparklineData={current.dailySeries}
          sparklineKey="expenses"
          sparklineColor="#c62828"
          current={current.expenses}
          previous={previous.expenses}
          positiveIsGood={false}
        />
        <StatCard
          label="Net"
          value={formatINR(current.net)}
          sparklineData={current.dailySeries}
          sparklineKey="net"
          sparklineColor="#1976d2"
          current={current.net}
          previous={previous.net}
          positiveIsGood
        />
        <StatCard
          label="Avg / day"
          value={formatINR(current.avgPerDay, { precise: true })}
          sparklineData={current.dailySeries}
          sparklineKey="cumAvg"
          sparklineColor="#757575"
          current={current.avgPerDay}
          previous={previous.avgPerDay}
          positiveIsGood
        />
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Transactions · daily flow
        </Typography>
        <Box sx={{ width: "100%", height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={current.dailySeries} margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontFamily: "inherit", fontSize: 12 }} />
              <YAxis
                tick={{ fontFamily: "inherit", fontSize: 12 }}
                tickFormatter={(v) => formatINR(v)}
                width={90}
              />
              <Tooltip formatter={(v) => formatINR(v, { precise: true })} labelFormatter={(d) => `Day ${d}`} />
              <Line type="monotone" dataKey="cumGains" name="In" stroke="#1976d2" strokeWidth={2} dot={false} />
              <Line
                type="monotone"
                dataKey="cumExpenses"
                name="Out"
                stroke="#9e9e9e"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
        <Paper sx={{ p: 3, flex: "2 1 320px", minWidth: 0 }}>
          <Typography variant="h6" gutterBottom>
            By category
          </Typography>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Box sx={{ width: 180, height: 180, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieSlices} dataKey="value" nameKey="name" innerRadius={0} outerRadius={80}>
                    {pieSlices.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatINR(v, { precise: true })} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 140 }}>
              {topCategories.map(([name, value]) => (
                <Typography key={name} variant="body2" sx={{ mb: 0.5 }}>
                  • {name} {totalCategorySpend ? Math.round((value / totalCategorySpend) * 100) : 0}%
                </Typography>
              ))}
              {moreCategoriesCount > 0 && (
                <Typography variant="body2" color="text.secondary">
                  + {moreCategoriesCount} more
                </Typography>
              )}
              {categoryEntries.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No expenses this month
                </Typography>
              )}
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, flex: "1 1 260px", minWidth: 0 }}>
          <Typography variant="h6" gutterBottom>
            {monthLongLabel(prevMonthCursor).split(" ")[0]} → {monthLongLabel(monthCursor).split(" ")[0]}
          </Typography>
          <Box sx={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData}>
                <XAxis dataKey="label" tick={{ fontFamily: "inherit", fontSize: 12 }} />
                <YAxis tick={{ fontFamily: "inherit", fontSize: 12 }} tickFormatter={(v) => formatINR(v)} width={80} />
                <Tooltip formatter={(v) => formatINR(v, { precise: true })} />
                <Bar dataKey="prev" name="Previous" fill="#cfd8dc" />
                <Bar dataKey="curr" name="Current" fill="#263238" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, flex: "1 1 280px", minWidth: 0 }}>
          <Typography variant="h6" gutterBottom>
            Top services ↓
          </Typography>
          {funnelData.length > 0 ? (
            <Box sx={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip formatter={(v) => formatINR(v, { precise: true })} />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive={false}>
                    <LabelList
                      position="center"
                      dataKey="name"
                      fill="#fff"
                      stroke="none"
                      style={{ fontFamily: "inherit", fontSize: 12 }}
                    />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No product/service spend this month
            </Typography>
          )}
        </Paper>
      </Stack>
    </ThemeProvider>
  );
}
