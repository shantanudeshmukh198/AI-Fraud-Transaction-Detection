/* =========================================================
   FRAUDGUARD - ANALYTICS JAVASCRIPT
   ========================================================= */


/* =========================================================
   CHART INSTANCES
   ========================================================= */

let fraudChart = null;
let riskChart = null;
let typeChart = null;
let merchantChart = null;
let locationChart = null;
let amountChart = null;


/* =========================================================
   ELEMENTS
   ========================================================= */

const analyticsLoading =
    document.getElementById("analyticsLoading");

const analyticsError =
    document.getElementById("analyticsError");


/* =========================================================
   DESTROY EXISTING CHART
   ========================================================= */

function destroyChart(chart) {

    if (chart) {

        chart.destroy();

    }

}


/* =========================================================
   HIDE LOADING
   ========================================================= */

function hideAnalyticsLoading() {

    if (analyticsLoading) {

        analyticsLoading.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   SHOW ERROR
   ========================================================= */

function showAnalyticsError(message) {

    hideAnalyticsLoading();


    if (analyticsError) {

        analyticsError.textContent =
            message ||
            "Unable to load analytics data.";

        analyticsError.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   HIDE ERROR
   ========================================================= */

function hideAnalyticsError() {

    if (analyticsError) {

        analyticsError.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   NUMBER HELPER
   ========================================================= */

function analyticsNumber(value) {

    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : 0;

}


/* =========================================================
   FIND DATA ARRAY
   ========================================================= */

function findArray(data, keys) {

    for (const key of keys) {

        if (
            Array.isArray(data?.[key])
        ) {

            return data[key];

        }

    }


    return [];

}


/* =========================================================
   CONVERT ARRAY DATA
   ========================================================= */

function normalizeChartData(items) {

    if (!Array.isArray(items)) {

        return {
            labels: [],
            values: []
        };

    }


    const labels = [];

    const values = [];


    items.forEach(item => {

        /*
         * Supports formats such as:
         *
         * {label: "Fraud", value: 20}
         * {name: "Fraud", count: 20}
         * {status: "Fraud", total: 20}
         */

        const label =
            item.label ??
            item.name ??
            item.status ??
            item.type ??
            item.category ??
            item.location ??
            item.risk_level ??
            "Unknown";


        const value =
            item.value ??
            item.count ??
            item.total ??
            item.transactions ??
            item.transaction_count ??
            0;


        labels.push(
            String(label)
        );


        values.push(
            analyticsNumber(value)
        );

    });


    return {
        labels,
        values
    };

}


/* =========================================================
   CHART DEFAULTS
   ========================================================= */

function getCommonChartOptions() {

    return {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

            legend: {

                position: "bottom",

                labels: {

                    usePointStyle: true,

                    padding: 18,

                    font: {

                        size: 12

                    }

                }

            }

        },

        scales: {

            y: {

                beginAtZero: true,

                ticks: {

                    precision: 0

                }

            }

        }

    };

}


/* =========================================================
   CREATE FRAUD CHART
   ========================================================= */

function createFraudChart(chartData) {

    const canvas =
        document.getElementById(
            "fraudChart"
        );


    if (!canvas) {
        return;
    }


    destroyChart(fraudChart);


    fraudChart =
        new Chart(
            canvas,
            {

                type: "doughnut",

                data: {

                    labels:
                        chartData.labels,

                    datasets: [

                        {

                            data:
                                chartData.values,

                            borderWidth: 0

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "65%",

                    plugins: {

                        legend: {

                            position: "bottom",

                            labels: {

                                usePointStyle: true,

                                padding: 18

                            }

                        }

                    }

                }

            }
        );

}


/* =========================================================
   CREATE RISK CHART
   ========================================================= */

function createRiskChart(chartData) {

    const canvas =
        document.getElementById(
            "riskChart"
        );


    if (!canvas) {
        return;
    }


    destroyChart(riskChart);


    riskChart =
        new Chart(
            canvas,
            {

                type: "doughnut",

                data: {

                    labels:
                        chartData.labels,

                    datasets: [

                        {

                            data:
                                chartData.values,

                            borderWidth: 0

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "65%",

                    plugins: {

                        legend: {

                            position: "bottom",

                            labels: {

                                usePointStyle: true,

                                padding: 18

                            }

                        }

                    }

                }

            }
        );

}


/* =========================================================
   CREATE TYPE CHART
   ========================================================= */

function createTypeChart(chartData) {

    const canvas =
        document.getElementById(
            "typeChart"
        );


    if (!canvas) {
        return;
    }


    destroyChart(typeChart);


    typeChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels:
                        chartData.labels,

                    datasets: [

                        {

                            label:
                                "Transactions",

                            data:
                                chartData.values,

                            borderWidth: 1,

                            borderRadius: 5

                        }

                    ]

                },

                options:
                    getCommonChartOptions()

            }
        );

}


/* =========================================================
   CREATE MERCHANT CHART
   ========================================================= */

function createMerchantChart(chartData) {

    const canvas =
        document.getElementById(
            "merchantChart"
        );


    if (!canvas) {
        return;
    }


    destroyChart(merchantChart);


    merchantChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels:
                        chartData.labels,

                    datasets: [

                        {

                            label:
                                "Transactions",

                            data:
                                chartData.values,

                            borderWidth: 1,

                            borderRadius: 5

                        }

                    ]

                },

                options: {

                    ...getCommonChartOptions(),

                    indexAxis: "y"

                }

            }
        );

}


/* =========================================================
   CREATE LOCATION CHART
   ========================================================= */

function createLocationChart(chartData) {

    const canvas =
        document.getElementById(
            "locationChart"
        );


    if (!canvas) {
        return;
    }


    destroyChart(locationChart);


    locationChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels:
                        chartData.labels,

                    datasets: [

                        {

                            label:
                                "Transactions",

                            data:
                                chartData.values,

                            borderWidth: 1,

                            borderRadius: 5

                        }

                    ]

                },

                options:
                    getCommonChartOptions()

            }
        );

}


/* =========================================================
   CREATE AMOUNT CHART
   ========================================================= */

function createAmountChart(chartData) {

    const canvas =
        document.getElementById(
            "amountChart"
        );


    if (!canvas) {
        return;
    }


    destroyChart(amountChart);


    amountChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels:
                        chartData.labels,

                    datasets: [

                        {

                            label:
                                "Transaction Amount",

                            data:
                                chartData.values,

                            borderWidth: 2,

                            tension: 0.3,

                            fill: false

                        }

                    ]

                },

                options:
                    getCommonChartOptions()

            }
        );

}


/* =========================================================
   UPDATE SUMMARY CARDS
   ========================================================= */

function updateAnalyticsSummary(data) {

    const totalElement =
        document.getElementById(
            "analyticsTotal"
        );


    const fraudElement =
        document.getElementById(
            "analyticsFraud"
        );


    const normalElement =
        document.getElementById(
            "analyticsNormal"
        );


    const amountElement =
        document.getElementById(
            "analyticsAmount"
        );


    const total =
        analyticsNumber(
            data.total ??
            data.totalTransactions ??
            data.total_transactions
        );


    const fraud =
        analyticsNumber(
            data.fraud ??
            data.fraudTransactions ??
            data.fraud_transactions
        );


    const normal =
        analyticsNumber(
            data.normal ??
            data.normalTransactions ??
            data.normal_transactions ??
            Math.max(
                0,
                total - fraud
            )
        );


    const amount =
        analyticsNumber(
            data.totalAmount ??
            data.total_amount ??
            data.amount
        );


    if (totalElement) {

        totalElement.textContent =
            formatNumber(total);

    }


    if (fraudElement) {

        fraudElement.textContent =
            formatNumber(fraud);

    }


    if (normalElement) {

        normalElement.textContent =
            formatNumber(normal);

    }


    if (amountElement) {

        amountElement.textContent =
            formatCurrency(amount);

    }

}


/* =========================================================
   LOAD ANALYTICS
   ========================================================= */

async function loadAnalytics() {

    try {

        hideAnalyticsError();


        const response =
            await fetch(
                "/api/analytics"
            );


        if (!response.ok) {

            throw new Error(
                `Analytics request failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Analytics data:",
            data
        );


        updateAnalyticsSummary(
            data
        );


        /* =================================================
           FRAUD DATA
        ================================================= */

        let fraudData =
            normalizeChartData(
                findArray(
                    data,
                    [
                        "fraud_distribution",
                        "fraudDistribution",
                        "fraud",
                        "status_distribution",
                        "statusDistribution"
                    ]
                )
            );


        /*
         * If backend only gives total/fraud,
         * construct the chart locally.
         */

        if (
            fraudData.labels.length === 0
        ) {

            const total =
                analyticsNumber(
                    data.total ??
                    data.totalTransactions ??
                    data.total_transactions
                );


            const fraud =
                analyticsNumber(
                    data.fraud ??
                    data.fraudTransactions ??
                    data.fraud_transactions
                );


            const normal =
                Math.max(
                    0,
                    total - fraud
                );


            fraudData = {

                labels: [
                    "Fraud",
                    "Normal"
                ],

                values: [
                    fraud,
                    normal
                ]

            };

        }


        createFraudChart(
            fraudData
        );


        /* =================================================
           RISK DATA
        ================================================= */

        const riskData =
            normalizeChartData(
                findArray(
                    data,
                    [
                        "risk_distribution",
                        "riskDistribution",
                        "risk_levels",
                        "riskLevels",
                        "risk"
                    ]
                )
            );


        createRiskChart(
            riskData
        );


        /* =================================================
           TRANSACTION TYPE DATA
        ================================================= */

        const typeData =
            normalizeChartData(
                findArray(
                    data,
                    [
                        "transaction_types",
                        "transactionTypes",
                        "transaction_type_distribution",
                        "transactionTypeDistribution",
                        "types"
                    ]
                )
            );


        createTypeChart(
            typeData
        );


        /* =================================================
           MERCHANT DATA
        ================================================= */

        const merchantData =
            normalizeChartData(
                findArray(
                    data,
                    [
                        "merchant_categories",
                        "merchantCategories",
                        "merchant_category_distribution",
                        "merchantCategoryDistribution",
                        "merchants"
                    ]
                )
            );


        createMerchantChart(
            merchantData
        );


        /* =================================================
           LOCATION DATA
        ================================================= */

        const locationData =
            normalizeChartData(
                findArray(
                    data,
                    [
                        "locations",
                        "location_distribution",
                        "locationDistribution"
                    ]
                )
            );


        createLocationChart(
            locationData
        );


        /* =================================================
           AMOUNT DATA
        ================================================= */

        let amountArray =
            findArray(
                data,
                [
                    "amount_analysis",
                    "amountAnalysis",
                    "amounts",
                    "amount_trend",
                    "amountTrend"
                ]
            );


        /*
         * Convert transaction objects
         * if backend returns transactions.
         */

        if (
            amountArray.length === 0 &&
            Array.isArray(data.transactions)
        ) {

            amountArray =
                data.transactions;

        }


        const amountData =
            normalizeAmountData(
                amountArray
            );


        createAmountChart(
            amountData
        );


        hideAnalyticsLoading();

    }
    catch (error) {

        console.error(
            "Analytics loading error:",
            error
        );


        showAnalyticsError(
            "Unable to load analytics data. Please check the server and database connection."
        );

    }

}


/* =========================================================
   NORMALIZE AMOUNT DATA
   ========================================================= */

function normalizeAmountData(items) {

    if (!Array.isArray(items)) {

        return {
            labels: [],
            values: []
        };

    }


    const labels = [];

    const values = [];


    items.forEach((item, index) => {

        /*
         * Supports:
         *
         * {label, value}
         * {date, amount}
         * {transaction_time, amount}
         * {created_at, amount}
         */

        const label =
            item.label ??
            item.date ??
            item.transaction_time ??
            item.created_at ??
            `Transaction ${index + 1}`;


        const amount =
            item.value ??
            item.amount ??
            item.total ??
            0;


        labels.push(
            formatChartDate(label)
        );


        values.push(
            analyticsNumber(amount)
        );

    });


    return {
        labels,
        values
    };

}


/* =========================================================
   FORMAT CHART DATE
   ========================================================= */

function formatChartDate(value) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(value);


    if (
        !Number.isNaN(
            date.getTime()
        )
    ) {

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short"
            }
        );

    }


    return String(value);

}


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Only run on Analytics page.
         */

        if (
            document.getElementById(
                "fraudChart"
            )
        ) {

            loadAnalytics();

        }

    }
);