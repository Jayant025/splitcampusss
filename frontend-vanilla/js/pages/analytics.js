import { getMonthlyAnalytics } from "../api/analyticsApi.js";
import { renderAppLayout } from "../components/layout.js";
import { renderState, showToast } from "../components/ui.js";
import { escapeHtml, formatCurrency, getQueryParam } from "../utils/helpers.js";
import { requireAuth } from "../utils/guards.js";
import { getChartTheme, onThemeChange } from "../utils/theme.js";

if (requireAuth()) {
  const groupId = getQueryParam("group");

  if (!groupId) {
    window.location.href = "/pages/groups.html";
  }

  renderAppLayout({
    title: "Analytics",
    subtitle: "Visualize monthly spending, category patterns, and member contribution.",
    activeNav: "groups",
    actionsHtml: `<a class="btn btn-secondary" href="/pages/single-group.html?group=${groupId}">Back to group</a>`
  });

  const yearSelect = document.getElementById("yearSelect");
  const analyticsSummary = document.getElementById("analyticsSummary");
  const analyticsHeading = document.getElementById("analyticsHeading");
  const chartInstances = {};
  let latestAnalyticsData = null;

  const buildYearOptions = () => {
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = Array.from({ length: 5 }, (_, index) => currentYear - index)
      .map((year) => `<option value="${year}">${year}</option>`)
      .join("");
  };

  const createChart = (canvasId, config) => {
    const context = document.getElementById(canvasId);

    if (chartInstances[canvasId]) {
      chartInstances[canvasId].destroy();
    }

    chartInstances[canvasId] = new window.Chart(context, config);
  };

  const getBaseChartOptions = (options = {}) => {
    const chartTheme = getChartTheme();

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: chartTheme.textColor,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: chartTheme.tooltipBackground,
          titleColor: chartTheme.tooltipText,
          bodyColor: chartTheme.tooltipText,
          borderColor: chartTheme.gridColor,
          borderWidth: 1
        }
      },
      ...options
    };
  };

  const renderSummary = (data) => {
    analyticsHeading.textContent = `${data.group.name} analytics`;
    analyticsSummary.innerHTML = `
      <article class="card stat-card">
        <span>Total spend this year</span>
        <strong class="value">${formatCurrency(data.totalYearSpend)}</strong>
      </article>
      <article class="card stat-card">
        <span>Highest month</span>
        <strong class="value">${escapeHtml(data.highestSpendingMonth.label)}</strong>
      </article>
      <article class="card stat-card">
        <span>Highest month spend</span>
        <strong class="value">${formatCurrency(data.highestSpendingMonth.totalSpend)}</strong>
      </article>
      <article class="card stat-card">
        <span>Selected year</span>
        <strong class="value">${data.year}</strong>
      </article>
    `;
  };

  const renderCharts = (data) => {
    const chartTheme = getChartTheme();

    createChart("monthlyChart", {
      type: "bar",
      data: {
        labels: data.monthlyTotals.map((item) => item.label),
        datasets: [
          {
            label: "Monthly spend",
            data: data.monthlyTotals.map((item) => item.totalSpend),
            backgroundColor: chartTheme.primary,
            borderRadius: 12
          }
        ]
      },
      options: getBaseChartOptions({
        scales: {
          x: {
            ticks: {
              color: chartTheme.textColor
            },
            grid: {
              color: chartTheme.gridColor
            },
            border: {
              color: chartTheme.gridColor
            }
          },
          y: {
            ticks: {
              color: chartTheme.textColor
            },
            grid: {
              color: chartTheme.gridColor
            },
            border: {
              color: chartTheme.gridColor
            }
          }
        }
      })
    });

    createChart("categoryChart", {
      type: "doughnut",
      data: {
        labels: data.categoryBreakdown.map((item) => item.category),
        datasets: [
          {
            data: data.categoryBreakdown.map((item) => item.totalSpend),
            backgroundColor: chartTheme.palette
          }
        ]
      },
      options: getBaseChartOptions()
    });

    createChart("memberChart", {
      type: "bar",
      data: {
        labels: data.memberContribution.map((item) => item.name),
        datasets: [
          {
            label: "Amount paid",
            data: data.memberContribution.map((item) => item.totalPaid),
            backgroundColor: chartTheme.secondary,
            borderRadius: 12
          }
        ]
      },
      options: getBaseChartOptions({
        indexAxis: "y",
        scales: {
          x: {
            ticks: {
              color: chartTheme.textColor
            },
            grid: {
              color: chartTheme.gridColor
            },
            border: {
              color: chartTheme.gridColor
            }
          },
          y: {
            ticks: {
              color: chartTheme.textColor
            },
            grid: {
              color: chartTheme.gridColor
            },
            border: {
              color: chartTheme.gridColor
            }
          }
        }
      })
    });
  };

  const loadAnalytics = async () => {
    try {
      const selectedYear = yearSelect.value;
      const data = await getMonthlyAnalytics(groupId, selectedYear);
      latestAnalyticsData = data;
      renderSummary(data);
      renderCharts(data);
    } catch (error) {
      showToast(error.message, "error");
      renderState(
        analyticsSummary,
        "Analytics unavailable",
        "Could not load analytics for the selected group."
      );
    }
  };

  buildYearOptions();
  yearSelect.addEventListener("change", loadAnalytics);
  onThemeChange(() => {
    if (latestAnalyticsData) {
      renderCharts(latestAnalyticsData);
    }
  });
  loadAnalytics();
}
