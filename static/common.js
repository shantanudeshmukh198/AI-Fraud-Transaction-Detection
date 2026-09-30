/* =========================================================
   FRAUDGUARD - COMMON JAVASCRIPT
   Dashboard + Shared Utilities
   ========================================================= */


/* =========================================================
   GLOBAL HELPERS
   ========================================================= */

function formatCurrency(value) {

    const amount = Number(value) || 0;

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);

}


function formatNumber(value) {

    return new Intl.NumberFormat("en-IN").format(
        Number(value) || 0
    );

}


function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

}


/* =========================================================
   SAFE ELEMENT GETTER
   ========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


/* =========================================================
   STATUS BADGE
   ========================================================= */

function createStatusBadge(status) {

    const value = String(status || "")
        .trim()
        .toUpperCase();

    let className = "status-normal";

    let text = value || "NORMAL";


    if (value === "FRAUD") {

        className = "status-fraud";

        text = "FRAUD";

    }
    else if (
        value === "NORMAL" ||
        value === "GENUINE"
    ) {

        className = "status-normal";

        text =
            value === "GENUINE"
                ? "GENUINE"
                : "NORMAL";

    }


    return `
        <span class="status-badge ${className}">
            ${escapeHtml(text)}
        </span>
    `;

}


/* =========================================================
   RISK BADGE
   ========================================================= */

function createRiskBadge(risk) {

    const value = String(risk || "")
        .trim()
        .toUpperCase();

    let className = "risk-low";

    let text = value || "LOW";


    if (value === "HIGH") {

        className = "risk-high";

    }
    else if (value === "MEDIUM") {

        className = "risk-medium";

    }
    else {

        className = "risk-low";

    }


    return `
        <span class="risk-badge ${className}">
            ${escapeHtml(text)}
        </span>
    `;

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   LOAD DASHBOARD
   ========================================================= */

async function loadDashboard() {

    const statsElements = {

        totalTransactions:
            getElement("totalTransactions"),

        fraudTransactions:
            getElement("fraudTransactions"),

        normalTransactions:
            getElement("normalTransactions"),

        fraudRate:
            getElement("fraudRate"),

        totalAmount:
            getElement("totalAmount"),

        totalMerchants:
            getElement("totalMerchants"),

        totalCustomers:
            getElement("totalCustomers"),

        highRiskTransactions:
            getElement("highRiskTransactions")

    };


    try {

        const response =
            await fetch("/stats");


        if (!response.ok) {

            throw new Error(
                `Stats request failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        /*
         * The backend may use slightly different
         * key names. This keeps the UI flexible
         * without changing the ML pipeline.
         */

        const total =
            data.totalTransactions ??
            data.total_transactions ??
            data.total ??
            0;


        const fraud =
            data.fraudTransactions ??
            data.fraud_transactions ??
            data.fraud ??
            0;


        const normal =
            data.normalTransactions ??
            data.normal_transactions ??
            data.normal ??
            Math.max(0, total - fraud);


        const fraudRate =
            data.fraudRate ??
            data.fraud_rate ??
            (
                total > 0
                    ? (fraud / total) * 100
                    : 0
            );


        const totalAmount =
            data.totalAmount ??
            data.total_amount ??
            0;


        const merchants =
            data.totalMerchants ??
            data.total_merchants ??
            data.merchants ??
            0;


        const customers =
            data.totalCustomers ??
            data.total_customers ??
            data.customers ??
            0;


        const highRisk =
            data.highRiskTransactions ??
            data.high_risk_transactions ??
            data.highRisk ??
            data.high_risk ??
            0;


        if (statsElements.totalTransactions) {

            statsElements.totalTransactions.textContent =
                formatNumber(total);

        }


        if (statsElements.fraudTransactions) {

            statsElements.fraudTransactions.textContent =
                formatNumber(fraud);

        }


        if (statsElements.normalTransactions) {

            statsElements.normalTransactions.textContent =
                formatNumber(normal);

        }


        if (statsElements.fraudRate) {

            statsElements.fraudRate.textContent =
                `${Number(fraudRate).toFixed(2)}%`;

        }


        if (statsElements.totalAmount) {

            statsElements.totalAmount.textContent =
                formatCurrency(totalAmount);

        }


        if (statsElements.totalMerchants) {

            statsElements.totalMerchants.textContent =
                formatNumber(merchants);

        }


        if (statsElements.totalCustomers) {

            statsElements.totalCustomers.textContent =
                formatNumber(customers);

        }


        if (statsElements.highRiskTransactions) {

            statsElements.highRiskTransactions.textContent =
                formatNumber(highRisk);

        }

    }
    catch (error) {

        console.error(
            "Unable to load dashboard statistics:",
            error
        );

    }


    await loadRecentTransactions();

}


/* =========================================================
   LOAD RECENT TRANSACTIONS
   ========================================================= */

async function loadRecentTransactions() {

    const tableBody =
        getElement("recentTransactions");


    if (!tableBody) {

        return;

    }


    try {

        const response =
            await fetch("/api/transactions");


        if (!response.ok) {

            throw new Error(
                `Transaction request failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        const transactions =
            Array.isArray(data)
                ? data
                : (
                    data.transactions ||
                    data.data ||
                    []
                );


        /*
         * Dashboard only needs the latest
         * transactions.
         */

        const recent =
            transactions.slice(0, 10);


        if (recent.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="empty-state"
                    >
                        No transactions found.
                    </td>
                </tr>
            `;

            return;

        }


        tableBody.innerHTML =
            recent.map(transaction => {

                const id =
                    transaction.transaction_id ??
                    transaction.id ??
                    "-";


                const amount =
                    transaction.amount ?? 0;


                const type =
                    transaction.transaction_type ??
                    transaction.type ??
                    "-";


                const merchant =
                    transaction.merchant_name ??
                    transaction.merchant ??
                    "-";


                const status =
                    transaction.status ??
                    transaction.result ??
                    "NORMAL";


                const risk =
                    transaction.risk_level ??
                    transaction.risk ??
                    "LOW";


                const date =
                    transaction.transaction_time ??
                    transaction.created_at ??
                    transaction.date;


                return `
                    <tr>

                        <td>
                            #${escapeHtml(id)}
                        </td>

                        <td>
                            ${formatCurrency(amount)}
                        </td>

                        <td>
                            ${escapeHtml(type)}
                        </td>

                        <td>
                            ${escapeHtml(merchant)}
                        </td>

                        <td>
                            ${createStatusBadge(status)}
                        </td>

                        <td>
                            ${createRiskBadge(risk)}
                        </td>

                        <td>
                            ${escapeHtml(formatDate(date))}
                        </td>

                    </tr>
                `;

            }).join("");

    }
    catch (error) {

        console.error(
            "Unable to load recent transactions:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-state"
                >
                    Unable to load transactions.
                </td>
            </tr>
        `;

    }

}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Only run dashboard functions when
         * dashboard elements actually exist.
         *
         * This prevents errors on Detect,
         * Transactions and Analytics pages.
         */

        const dashboardExists =
            getElement("totalTransactions") ||
            getElement("recentTransactions");


        if (dashboardExists) {

            loadDashboard();

        }

    }
);