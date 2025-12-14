// Mini logica ispirata al tuo app.js (solo parte base) [file:72]

document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expenseForm");
  const clearFormBtn = document.getElementById("clearForm");
  const exportBtn = document.getElementById("exportData");
  const clearAllBtn = document.getElementById("clearAll");

  // In CodePen usiamo localStorage con una chiave diversa per non toccare nulla
  const STORAGE_KEY = "homebudget_demo_expenses";

  function getExpenses() {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  }

  function saveExpenses(expenses) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }

  function formatDate(dateString) {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function getCategoryDisplayName(category) {
    const map = {
      cibo: "Cibo",
      trasporti: "Trasporti",
      bollette: "Bollette",
      casa: "Casa",
      salute: "Salute",
      svago: "Svago",
      shopping: "Shopping",
      altro: "Altro",
    };
    return map[category] || category || "";
  }

  function getPaymentDisplayName(method) {
    const map = {
      contanti: "Contanti",
      carta: "Carta di Credito",
      debito: "Carta di Debito",
      bonifico: "Bonifico",
      altro: "Altro",
    };
    return map[method] || method || "";
  }

  function renderTable() {
    const expenses = getExpenses();
    const tbody = document.getElementById("expensesTableBody");
    tbody.innerHTML = "";

    if (!expenses.length) {
      const row = document.createElement("tr");
      row.className = "empty-row";
      row.innerHTML = `
        <td colspan="5">
          <div class="empty-state">
            <i class="fas fa-receipt"></i>
            <h3>Nessuna spesa registrata</h3>
            <p>Aggiungi la tua prima spesa utilizzando il modulo sopra.</p>
            <p class="empty-tip">
              <strong>Suggerimento:</strong> Traccia tutte le tue spese per avere un quadro completo.
            </p>
          </div>
        </td>
      `;
      tbody.appendChild(row);
      return;
    }

    // Ordina per data decrescente
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    expenses.forEach((exp) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${formatDate(exp.date)}</td>
        <td>${exp.description || "-"}</td>
        <td>${getCategoryDisplayName(exp.category)}</td>
        <td>${getPaymentDisplayName(exp.paymentMethod)}</td>
        <td class="hb-amount">€ ${exp.amount.toFixed(2)}</td>
      `;
      tbody.appendChild(row);
    });
  }

  function updateStats() {
  const expenses = getExpenses();
  const now = new Date();

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthLimit = 50;
  const remaining = Math.max(0, monthLimit - thisMonthExpenses.length);

  // Media mensile semplice
  const months = {};
  expenses.forEach((e) => {
    const d = new Date(e.date);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!months[key]) months[key] = { total: 0 };
    months[key].total += e.amount;
  });
  const monthTotals = Object.values(months).map((m) => m.total);
  const monthlyAverage =
    monthTotals.length > 0
      ? monthTotals.reduce((s, v) => s + v, 0) / monthTotals.length
      : 0;

  // Top categoria mese corrente
  const catTotals = {};
  thisMonthExpenses.forEach((e) => {
    if (!catTotals[e.category]) catTotals[e.category] = 0;
    catTotals[e.category] += e.amount;
  });

  let topCatKey = null;
  let topCatVal = 0;
  Object.entries(catTotals).forEach(([cat, val]) => {
    if (val > topCatVal) {
      topCatVal = val;
      topCatKey = cat;
    }
  });

  const topCategoryName = document.getElementById("topCategoryName");
  const topCategoryTotal = document.getElementById("topCategoryTotal");

  if (topCatKey) {
    topCategoryName.textContent = getCategoryDisplayName(topCatKey);
    topCategoryTotal.textContent = topCatVal.toFixed(2);
  } else {
    topCategoryName.textContent = "–";
    topCategoryTotal.textContent = "0.00";
  }

  // Giorni con spese (mese corrente)
  const daysSet = new Set();
  thisMonthExpenses.forEach((e) => {
    const d = new Date(e.date);
    if (!isNaN(d.getTime())) {
      const key = d.toISOString().slice(0, 10); // yyyy-mm-dd
      daysSet.add(key);
    }
  });
  const spentDaysCount = daysSet.size;
  const spentDaysEl = document.getElementById("spentDaysCount");
  if (spentDaysEl) {
    spentDaysEl.textContent = spentDaysCount;
  }

  // Aggiorna UI base
  document.getElementById("totalExpense").textContent = total.toFixed(2);
  document.getElementById("monthCount").textContent = thisMonthExpenses.length;
  document.getElementById("monthLimit").textContent = monthLimit;
  document.getElementById("remainingExpenses").textContent = remaining;
  document.getElementById("remainingExpensesTop").textContent = remaining;
  document.getElementById("monthlyAverage").textContent = monthlyAverage.toFixed(2);
  document.getElementById("expensesTotal").textContent = expenses.length;
  document.getElementById("thisMonthTotal").textContent = thisMonthExpenses.length;
  document.getElementById("tableTotal").textContent = thisMonthTotal.toFixed(2);

  const perc = monthLimit ? Math.min((thisMonthExpenses.length / monthLimit) * 100, 100) : 0;
  document.getElementById("monthProgress").style.width = `${perc}%`;
}

  function handleAddExpense(event) {
    event.preventDefault();

    const amount = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;
    const paymentMethod = document.getElementById("paymentMethod").value;
    const description = document.getElementById("description").value.trim();

    if (!amount || amount <= 0) {
      alert("Inserisci un importo valido.");
      return;
    }
    if (!category) {
      alert("Seleziona una categoria.");
      return;
    }
    if (!date) {
      alert("Seleziona una data.");
      return;
    }

    const expenses = getExpenses();
    const now = new Date();
    const thisMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    if (thisMonthExpenses.length >= 50) {
      alert("Hai raggiunto il limite di 50 spese/mese del piano FREE.");
      return;
    }

    const expense = {
      id: Date.now(),
      amount,
      category,
      date,
      paymentMethod,
      description,
      addedAt: new Date().toISOString(),
    };

    expenses.push(expense);
    saveExpenses(expenses);
    renderTable();
    updateStats();

    expenseForm.reset();
    // Imposta data di oggi
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("date").value = today;
  }

  function exportToCSV() {
    const expenses = getExpenses();
    if (!expenses.length) {
      alert("Nessuna spesa da esportare.");
      return;
    }

    let csv = "Data,Descrizione,Categoria,Metodo Pagamento,Importo\n";
    expenses.forEach((e) => {
      const date = formatDate(e.date);
      const desc = (e.description || "").replace(/,/g, " ");
      const cat = getCategoryDisplayName(e.category);
      const pm = getPaymentDisplayName(e.paymentMethod);
      const amount = e.amount.toFixed(2);
      csv += `${date},${desc},${cat},${pm},${amount}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "homebudget-demo-export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleClearAll() {
    if (!confirm("Sei sicuro di voler cancellare TUTTE le spese?")) return;
    localStorage.removeItem(STORAGE_KEY);
    renderTable();
    updateStats();
  }

  // Inizializzazione
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("date");
  if (dateInput) {
    dateInput.value = today;
    dateInput.max = today;
  }

  renderTable();
  updateStats();

  // Event listeners
  if (expenseForm) expenseForm.addEventListener("submit", handleAddExpense);
  if (clearFormBtn)
    clearFormBtn.addEventListener("click", () => {
      expenseForm.reset();
      document.getElementById("date").value = today;
    });
  if (exportBtn) exportBtn.addEventListener("click", exportToCSV);
  if (clearAllBtn) clearAllBtn.addEventListener("click", handleClearAll);
});
