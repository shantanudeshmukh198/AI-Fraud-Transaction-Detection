/* =========================================================
   FRAUDGUARD - TRANSACTIONS JAVASCRIPT
   ========================================================= */


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let allTransactions = [];

let transactionToDelete = null;


/* =========================================================
   ELEMENTS
   ========================================================= */

const tableBody =
    document.getElementById("transactionTableBody");

const noTransactions =
    document.getElementById("noTransactions");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const riskFilter =
    document.getElementById("riskFilter");

const typeFilter =
    document.getElementById("typeFilter");

const resetFilters =
    document.getElementById("resetFilters");

const transactionCount =
    document.getElementById("transactionCount");

const fraudCount =
    document.getElementById("fraudCount");

const normalCount =
    document.getElementById("normalCount");

const highRiskCount =
    document.getElementById("highRiskCount");

const deleteModal =
    document.getElementById("deleteModal");

const cancelDelete =
    document.getElementById("cancelDelete");

const confirmDelete =
    document.getElementById("confirmDelete");


/* =========================================================
   LOAD TRANSACTIONS
   ========================================================= */

async function loadTransactions() {

    try {

        showTableLoading();


        const response =
            await fetch("/api/transactions");


        if (!response.ok) {

            throw new Error(
                `Request failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        /*
         * Backend may return either:
         *
         * [
         *   {...},
         *   {...}
         * ]
         *
         * OR
         *
         * {
         *   transactions: [...]
         * }
         */

        if (Array.isArray(data)) {

            allTransactions = data;

        }
        else {

            allTransactions =
                data.transactions ||
                data.data ||
                [];

        }


        updateSummary(
            allTransactions
        );


        renderTransactions(
            allTransactions
        );

    }
    catch (error) {

        console.error(
            "Unable to load transactions:",
            error
        );


        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="10"
                        class="empty-state"
                    >
                        Unable to load transactions.
                    </td>
                </tr>
            `;

        }

    }

}


/* =========================================================
   SHOW TABLE LOADING
   ========================================================= */

function showTableLoading() {

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>
            <td
                colspan="10"
                class="empty-state"
            >
                Loading transactions...
            </td>
        </tr>
    `;

}


/* =========================================================
   UPDATE SUMMARY
   ========================================================= */

function updateSummary(transactions) {

    const total =
        transactions.length;


    let fraud = 0;

    let normal = 0;

    let highRisk = 0;


    transactions.forEach(transaction => {

        const status =
            getStatus(transaction);


        const risk =
            getRisk(transaction);


        if (status === "FRAUD") {

            fraud++;

        }
        else {

            normal++;

        }


        if (risk === "HIGH") {

            highRisk++;

        }

    });


    if (transactionCount) {

        transactionCount.textContent =
            formatNumber(total);

    }


    if (fraudCount) {

        fraudCount.textContent =
            formatNumber(fraud);

    }


    if (normalCount) {

        normalCount.textContent =
            formatNumber(normal);

    }


    if (highRiskCount) {

        highRiskCount.textContent =
            formatNumber(highRisk);

    }

}


/* =========================================================
   GET STATUS
   ========================================================= */

function getStatus(transaction) {

    return String(
        transaction.status ??
        transaction.result ??
        transaction.prediction ??
        "NORMAL"
    )
        .trim()
        .toUpperCase();

}


/* =========================================================
   GET RISK
   ========================================================= */

function getRisk(transaction) {

    return String(
        transaction.risk_level ??
        transaction.risk ??
        "LOW"
    )
        .trim()
        .toUpperCase();

}


/* =========================================================
   GET TYPE
   ========================================================= */

function getTransactionType(transaction) {

    return String(
        transaction.transaction_type ??
        transaction.type ??
        ""
    )
        .trim();

}


/* =========================================================
   GET TRANSACTION ID
   ========================================================= */

function getTransactionId(transaction) {

    return (
        transaction.transaction_id ??
        transaction.id ??
        null
    );

}


/* =========================================================
   FILTER TRANSACTIONS
   ========================================================= */

function filterTransactions() {

    const search =
        String(
            searchInput?.value || ""
        )
        .trim()
        .toLowerCase();


    const selectedStatus =
        String(
            statusFilter?.value || ""
        )
        .trim()
        .toUpperCase();


    const selectedRisk =
        String(
            riskFilter?.value || ""
        )
        .trim()
        .toUpperCase();


    const selectedType =
        String(
            typeFilter?.value || ""
        )
        .trim()
        .toLowerCase();


    const filtered =
        allTransactions.filter(transaction => {

            const id =
                String(
                    getTransactionId(transaction) || ""
                )
                .toLowerCase();


            const merchant =
                String(
                    transaction.merchant_name ??
                    transaction.merchant ??
                    ""
                )
                .toLowerCase();


            const location =
                String(
                    transaction.location ??
                    ""
                )
                .toLowerCase();


            const type =
                getTransactionType(transaction)
                    .toLowerCase();


            const status =
                getStatus(transaction);


            const risk =
                getRisk(transaction);


            const matchesSearch =
                !search ||
                id.includes(search) ||
                merchant.includes(search) ||
                location.includes(search) ||
                type.includes(search);


            const matchesStatus =
                !selectedStatus ||
                status === selectedStatus;


            const matchesRisk =
                !selectedRisk ||
                risk === selectedRisk;


            const matchesType =
                !selectedType ||
                type === selectedType;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesRisk &&
                matchesType
            );

        });


    renderTransactions(filtered);

}


/* =========================================================
   RENDER TRANSACTIONS
   ========================================================= */

function renderTransactions(transactions) {

    if (!tableBody) {
        return;
    }


    if (!transactions.length) {

        tableBody.innerHTML = "";

        if (noTransactions) {

            noTransactions.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (noTransactions) {

        noTransactions.classList.add(
            "hidden"
        );

    }


    tableBody.innerHTML =
        transactions.map(
            transaction => createTransactionRow(
                transaction
            )
        ).join("");

}


/* =========================================================
   CREATE TABLE ROW
   ========================================================= */

function createTransactionRow(transaction) {

    const id =
        getTransactionId(transaction) ?? "-";


    const amount =
        Number(
            transaction.amount ?? 0
        );


    const type =
        getTransactionType(transaction) || "-";


    const merchant =
        transaction.merchant_name ??
        transaction.merchant ??
        "-";


    const location =
        transaction.location ??
        "-";


    const status =
        getStatus(transaction);


    const risk =
        getRisk(transaction);


    const probability =
        transaction.fraud_probability ??
        transaction.fraudProbability ??
        transaction.probability;


    const date =
        transaction.transaction_time ??
        transaction.created_at ??
        transaction.date;


    let probabilityText = "-";


    if (
        probability !== null &&
        probability !== undefined &&
        probability !== ""
    ) {

        const numericProbability =
            Number(probability);


        if (
            !Number.isNaN(
                numericProbability
            )
        ) {

            /*
             * If probability is between
             * 0 and 1, display percentage.
             */

            if (
                numericProbability >= 0 &&
                numericProbability <= 1
            ) {

                probabilityText =
                    `${(
                        numericProbability * 100
                    ).toFixed(2)}%`;

            }
            else {

                probabilityText =
                    `${numericProbability.toFixed(2)}%`;

            }

        }

    }


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
                ${escapeHtml(location)}
            </td>


            <td>
                ${createStatusBadge(status)}
            </td>


            <td>
                ${escapeHtml(probabilityText)}
            </td>


            <td>
                ${createRiskBadge(risk)}
            </td>


            <td>
                ${escapeHtml(
                    formatDate(date)
                )}
            </td>


            <td>

                ${
                    id !== "-"
                        ? `
                            <button
                                type="button"
                                class="table-action"
                                data-delete-id="${escapeHtml(id)}"
                            >
                                Delete
                            </button>
                          `
                        : "-"
                }

            </td>

        </tr>
    `;

}


/* =========================================================
   DELETE MODAL
   ========================================================= */

function openDeleteModal(transactionId) {

    transactionToDelete =
        transactionId;


    if (!deleteModal) {
        return;
    }


    deleteModal.classList.remove(
        "hidden"
    );

}


function closeDeleteModal() {

    transactionToDelete =
        null;


    if (!deleteModal) {
        return;
    }


    deleteModal.classList.add(
        "hidden"
    );

}


/* =========================================================
   DELETE TRANSACTION
   ========================================================= */

async function deleteTransaction() {

    if (
        transactionToDelete === null ||
        transactionToDelete === undefined
    ) {

        return;

    }


    try {

        if (confirmDelete) {

            confirmDelete.disabled =
                true;

            confirmDelete.textContent =
                "Deleting...";

        }


        const response =
            await fetch(
                `/api/transactions/${encodeURIComponent(
                    transactionToDelete
                )}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json()
                .catch(() => ({}));


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                "Unable to delete transaction."
            );

        }


        closeDeleteModal();


        /*
         * Reload actual database data
         * instead of only removing the
         * row visually.
         */

        await loadTransactions();

    }
    catch (error) {

        console.error(
            "Delete transaction error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete transaction."
        );

    }
    finally {

        if (confirmDelete) {

            confirmDelete.disabled =
                false;

            confirmDelete.textContent =
                "Delete";

        }

    }

}


/* =========================================================
   EVENT DELEGATION FOR DELETE BUTTONS
   ========================================================= */

if (tableBody) {

    tableBody.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-delete-id]"
                );


            if (!button) {
                return;
            }


            const id =
                button.getAttribute(
                    "data-delete-id"
                );


            if (id) {

                openDeleteModal(id);

            }

        }
    );

}


/* =========================================================
   FILTER EVENTS
   ========================================================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        filterTransactions
    );

}


if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        filterTransactions
    );

}


if (riskFilter) {

    riskFilter.addEventListener(
        "change",
        filterTransactions
    );

}


if (typeFilter) {

    typeFilter.addEventListener(
        "change",
        filterTransactions
    );

}


/* =========================================================
   RESET FILTERS
   ========================================================= */

if (resetFilters) {

    resetFilters.addEventListener(
        "click",
        () => {

            if (searchInput) {
                searchInput.value = "";
            }


            if (statusFilter) {
                statusFilter.value = "";
            }


            if (riskFilter) {
                riskFilter.value = "";
            }


            if (typeFilter) {
                typeFilter.value = "";
            }


            filterTransactions();

        }
    );

}


/* =========================================================
   MODAL EVENTS
   ========================================================= */

if (cancelDelete) {

    cancelDelete.addEventListener(
        "click",
        closeDeleteModal
    );

}


if (confirmDelete) {

    confirmDelete.addEventListener(
        "click",
        deleteTransaction
    );

}


if (deleteModal) {

    deleteModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                deleteModal
            ) {

                closeDeleteModal();

            }

        }
    );

}


/* =========================================================
   ESC KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            deleteModal &&
            !deleteModal.classList.contains(
                "hidden"
            )
        ) {

            closeDeleteModal();

        }

    }
);


/* =========================================================
   INITIAL LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadTransactions();

    }
);