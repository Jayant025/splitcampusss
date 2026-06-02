import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "../api/client";
import { formatCurrency } from "../utils/helpers";
import { useTheme } from "../context/ThemeContext";
import Chart from "chart.js/auto";

export const AnalyticsPanel = ({ groupId, groupName }) => {
  const { theme } = useTheme();
  const [year, setYear] = useState(() => new Date().getFullYear().toString());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const monthlyChartRef = useRef(null);
  const categoryChartRef = useRef(null);
  const memberChartRef = useRef(null);

  const monthlyChartInstance = useRef(null);
  const categoryChartInstance = useRef(null);
  const memberChartInstance = useRef(null);

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  const getChartColors = () => {
    const isDark = theme === "dark";
    return {
      textColor: isDark ? "#d7e3f2" : "#314155",
      gridColor: isDark ? "rgba(154, 176, 200, 0.2)" : "rgba(97, 117, 137, 0.18)",
      tooltipBg: isDark ? "rgba(12, 23, 39, 0.96)" : "rgba(255, 255, 255, 0.96)",
      tooltipText: isDark ? "#f8fbff" : "#132238",
      primary: isDark ? "#38bdf8" : "#1f7aec",
      secondary: isDark ? "#2dd4bf" : "#14b8a6",
      palette: isDark
        ? ["#38bdf8", "#2dd4bf", "#fbbf24", "#fb7185", "#a78bfa", "#22d3ee", "#a3e635"]
        : ["#1f7aec", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"]
    };
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/groups/${groupId}/analytics/monthly?year=${year}`);
      setData(res);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Analytics data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [groupId, year]);

  useEffect(() => {
    if (!data) return;

    const colors = getChartColors();

    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: colors.textColor,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          borderColor: colors.gridColor,
          borderWidth: 1
        }
      }
    };

    // 1. Monthly Chart (Bar)
    if (monthlyChartRef.current) {
      if (monthlyChartInstance.current) monthlyChartInstance.current.destroy();
      monthlyChartInstance.current = new Chart(monthlyChartRef.current, {
        type: "bar",
        data: {
          labels: data.monthlyTotals.map((item) => item.label),
          datasets: [
            {
              label: "Monthly Spend",
              data: data.monthlyTotals.map((item) => item.totalSpend),
              backgroundColor: colors.primary,
              borderRadius: 8
            }
          ]
        },
        options: {
          ...baseOptions,
          scales: {
            x: {
              ticks: { color: colors.textColor },
              grid: { color: colors.gridColor }
            },
            y: {
              ticks: { color: colors.textColor },
              grid: { color: colors.gridColor }
            }
          }
        }
      });
    }

    // 2. Category Chart (Doughnut)
    if (categoryChartRef.current) {
      if (categoryChartInstance.current) categoryChartInstance.current.destroy();
      categoryChartInstance.current = new Chart(categoryChartRef.current, {
        type: "doughnut",
        data: {
          labels: data.categoryBreakdown.map((item) => item.category),
          datasets: [
            {
              data: data.categoryBreakdown.map((item) => item.totalSpend),
              backgroundColor: colors.palette
            }
          ]
        },
        options: baseOptions
      });
    }

    // 3. Member Contribution (Horizontal Bar)
    if (memberChartRef.current) {
      if (memberChartInstance.current) memberChartInstance.current.destroy();
      memberChartInstance.current = new Chart(memberChartRef.current, {
        type: "bar",
        data: {
          labels: data.memberContribution.map((item) => item.name),
          datasets: [
            {
              label: "Amount Paid",
              data: data.memberContribution.map((item) => item.totalPaid),
              backgroundColor: colors.secondary,
              borderRadius: 8
            }
          ]
        },
        options: {
          ...baseOptions,
          indexAxis: "y",
          scales: {
            x: {
              ticks: { color: colors.textColor },
              grid: { color: colors.gridColor }
            },
            y: {
              ticks: { color: colors.textColor },
              grid: { color: colors.gridColor }
            }
          }
        }
      });
    }

    return () => {
      if (monthlyChartInstance.current) monthlyChartInstance.current.destroy();
      if (categoryChartInstance.current) categoryChartInstance.current.destroy();
      if (memberChartInstance.current) memberChartInstance.current.destroy();
    };
  }, [data, theme]);

  const renderSummary = () => {
    if (!data) return null;
    return (
      <div className="stats-grid">
        <article className="card stat-card" style={{ borderLeft: "4px solid var(--primary)" }}>
          <span>Total Spend ({year})</span>
          <strong className="value">{formatCurrency(data.totalYearSpend)}</strong>
        </article>
        <article className="card stat-card" style={{ borderLeft: "4px solid var(--accent)" }}>
          <span>Highest Month</span>
          <strong className="value">{data.highestSpendingMonth.label}</strong>
        </article>
        <article className="card stat-card" style={{ borderLeft: "4px solid var(--danger)" }}>
          <span>Peak Month Spend</span>
          <strong className="value">{formatCurrency(data.highestSpendingMonth.totalSpend)}</strong>
        </article>
        <article className="card stat-card" style={{ borderLeft: "4px solid var(--secondary)" }}>
          <span>Year Mode</span>
          <strong className="value">{data.year}</strong>
        </article>
      </div>
    );
  };

  return (
    <div className="stack-lg">
      <div className="action-row card" style={{ background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Analytics for {groupName}</h3>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <label htmlFor="yearSelect" style={{ margin: 0, fontSize: "0.95rem" }}>Filter Year:</label>
          <select
            id="yearSelect"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={{ width: "auto", padding: "0.4rem 1.8rem 0.4rem 0.8rem", borderRadius: "10px" }}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <span className="eyebrow">Plotting spends & splits... 📊</span>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <p className="negative-text">{error}</p>
        </div>
      ) : (
        <div className="stack-lg">
          {renderSummary()}

          <div className="analytics-grid">
            <article className="card" style={{ minHeight: "320px" }}>
              <h3 style={{ marginBottom: "1rem" }}>Monthly Trend</h3>
              <div style={{ position: "relative", height: "240px", width: "100%" }}>
                <canvas ref={monthlyChartRef} />
              </div>
            </article>

            <article className="card" style={{ minHeight: "320px" }}>
              <h3 style={{ marginBottom: "1rem" }}>Category Breakdown</h3>
              <div style={{ position: "relative", height: "240px", width: "100%" }}>
                <canvas ref={categoryChartRef} />
              </div>
            </article>

            <article className="card" style={{ gridColumn: "1 / -1", minHeight: "320px" }}>
              <h3 style={{ marginBottom: "1rem" }}>Member Contribution</h3>
              <div style={{ position: "relative", height: "240px", width: "100%" }}>
                <canvas ref={memberChartRef} />
              </div>
            </article>
          </div>
        </div>
      )}
    </div>
  );
};
export default AnalyticsPanel;
