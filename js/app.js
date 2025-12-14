// HomeBudget PRO - App principale

document.addEventListener('DOMContentLoaded', function() {
    // Inizializza l'app
    initApp();
});

function initApp() {
    // Imposta la data di oggi come default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    
    // Carica spese e aggiorna UI
    loadExpenses();
    updateStats();
    updateUIForPlan();
    
    // Setup event listeners
    setupEventListeners();
    
    // Popola i filtri mese
    populateMonthFilter();
    
    // Inizializza sistema pagamenti
    if (typeof window.paymentSystem !== 'undefined') {
        window.paymentSystem.init();
    }
}

function setupEventListeners() {
    // Form spesa
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', handleAddExpense);
    }
    
    // Pulsante cancella form
    const clearFormBtn = document.getElementById('clearForm');
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', function() {
            expenseForm.reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
        });
    }
    
    // Filtri
    const filterCategory = document.getElementById('filterCategory');
    const filterMonth = document.getElementById('filterMonth');
    
    if (filterCategory) filterCategory.addEventListener('change', filterExpenses);
    if (filterMonth) filterMonth.addEventListener('change', filterExpenses);
    
    // Pulsante esporta
    const exportBtn = document.getElementById('exportData');
    if (exportBtn) exportBtn.addEventListener('click', exportToCSV);
    
    // Pulsante cancella tutto
    const clearAllBtn = document.getElementById('clearAll');
    if (clearAllBtn) clearAllBtn.addEventListener('click', handleClearAll);
    
    // Pulsanti upgrade
    const upgradeBtns = [
        document.getElementById('openUpgradeModal'),
        document.getElementById('bannerUpgradeBtn'),
        document.getElementById('upgradeChartBtn'),
        document.getElementById('upgradeNowBtn'),
        document.getElementById('footerFree'),
        document.getElementById('footerMonthly'),
        document.getElementById('footerYearly'),
        document.getElementById('footerCompare')
    ];
    
    upgradeBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function() {
                showUpgradeModal();
            });
        }
    });
    
    // Close modal buttons
    const closeModalBtn = document.querySelector('.close-modal');
    const closeLimitBtn = document.getElementById('closeLimitModal');
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeAllModals);
    if (closeLimitBtn) closeLimitBtn.addEventListener('click', closeAllModals);
    
    // Close modal on outside click
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Plan selection
    const planBtns = document.querySelectorAll('.btn-select-plan');
    planBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const plan = this.dataset.plan;
            handlePlanSelection(plan);
        });
    });
}

function handleAddExpense(event) {
    event.preventDefault();
    
    // Controlla limite per utenti free
    if (!checkExpenseLimit()) {
        showLimitModal();
        return;
    }
    
    // Prendi valori dal form
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value.trim() || 'Spesa senza descrizione';
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    // Validazione
    if (!amount || amount <= 0) {
        showNotification('Inserisci un importo valido!', 'error');
        return;
    }
    
    if (!category) {
        showNotification('Seleziona una categoria!', 'error');
        return;
    }
    
    if (!date) {
        showNotification('Seleziona una data!', 'error');
        return;
    }
    
    // Crea oggetto spesa
    const expense = {
        id: Date.now(),
        amount: amount,
        category: category,
        date: date,
        description: description,
        paymentMethod: paymentMethod,
        addedAt: new Date().toISOString()
    };
    
    // Salva la spesa
    saveExpense(expense);
    
    // Aggiorna l'interfaccia
    addExpenseToTable(expense);
    updateStats();
    
    // Mostra notifica
    showNotification('Spesa aggiunta con successo!', 'success');
    
    // Reset form (mantieni la data di oggi)
    expenseForm.reset();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    document.getElementById('paymentMethod').value = 'contanti';
}

function checkExpenseLimit() {
    const userPlan = getUserPlan();
    
    // Se l'utente è PRO, nessun limite
    if (userPlan.plan === 'pro') {
        return true;
    }
    
    // Per utenti FREE: controlla limite 50 spese/mese
    const expenses = getExpenses();
    const now = new Date();
    const thisMonthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === now.getMonth() && 
               expDate.getFullYear() === now.getFullYear();
    });
    
    return thisMonthExpenses.length < 50;
}

function getUserPlan() {
    // Simulazione - in produzione questo verrà dal backend
    return {
        plan: localStorage.getItem('user_plan') || 'free',
        subscriptionId: localStorage.getItem('subscription_id') || null,
        limits: {
            maxExpenses: 50,
            maxCategories: 8
        }
    };
}

function saveExpense(expense) {
    const expenses = getExpenses();
    expenses.push(expense);
    localStorage.setItem('homebudget_expenses', JSON.stringify(expenses));
}

function getExpenses() {
    const expensesJson = localStorage.getItem('homebudget_expenses');
    return expensesJson ? JSON.parse(expensesJson) : [];
}

function loadExpenses() {
    const expenses = getExpenses();
    const tableBody = document.getElementById('expensesTableBody');
    
    tableBody.innerHTML = '';
    
    if (expenses.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-row';
        emptyRow.innerHTML = `
            <td colspan="6">
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>Nessuna spesa registrata</h3>
                    <p>Aggiungi la tua prima spesa utilizzando il modulo sopra.</p>
                    <p class="empty-tip">💡 <strong>Suggerimento:</strong> Traccia tutte le tue spese per avere un quadro finanziario completo.</p>
                </div>
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    // Ordina per data (più recente prima)
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    expenses.forEach(expense => {
        addExpenseToTable(expense);
    });
}

function addExpenseToTable(expense) {
    const tableBody = document.getElementById('expensesTableBody');
    
    // Rimuovi riga vuota se presente
    const emptyRow = tableBody.querySelector('.empty-row');
    if (emptyRow) {
        emptyRow.remove();
    }
    
    // Formatta data
    const formattedDate = formatDate(expense.date);
    
    // Crea riga
    const row = document.createElement('tr');
    row.className = 'fade-in';
    row.dataset.id = expense.id;
    row.dataset.category = expense.category;
    
    row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${expense.description}</td>
        <td>
            <span class="category-badge category-${expense.category}">
                ${getCategoryDisplayName(expense.category)}
            </span>
        </td>
        <td class="payment-method">
            <i class="fas fa-${getPaymentIcon(expense.paymentMethod)}"></i>
            ${getPaymentDisplayName(expense.paymentMethod)}
        </td>
        <td><strong>€ ${expense.amount.toFixed(2)}</strong></td>
        <td>
            <div class="action-buttons">
                <button class="btn-action btn-edit" onclick="editExpense(${expense.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-delete" onclick="deleteExpense(${expense.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    tableBody.appendChild(row);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function getCategoryDisplayName(category) {
    const categories = {
        'cibo': 'Cibo',
        'trasporti': 'Trasporti',
        'bollette': 'Bollette',
        'casa': 'Casa',
        'salute': 'Salute',
        'svago': 'Svago',
        'shopping': 'Shopping',
        'altro': 'Altro'
    };
    return categories[category] || category;
}

function getPaymentIcon(paymentMethod) {
    const icons = {
        'contanti': 'money-bill-wave',
        'carta': 'credit-card',
        'debito': 'university',
        'bonifico': 'exchange-alt',
        'altro': 'link'
    };
    return icons[paymentMethod] || 'credit-card';
}

function getPaymentDisplayName(paymentMethod) {
    const names = {
        'contanti': 'Contanti',
        'carta': 'Carta di Credito',
        'debito': 'Carta di Debito',
        'bonifico': 'Bonifico',
        'altro': 'Altro'
    };
    return names[paymentMethod] || paymentMethod;
}

function updateStats() {
    const expenses = getExpenses();
    const userPlan = getUserPlan();
    
    // Calcola spesa totale
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calcola spese questo mese
    const now = new Date();
    const thisMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === now.getMonth() && 
               expenseDate.getFullYear() === now.getFullYear();
    });
    
    const thisMonthTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calcola media mensile
    const monthlyAverage = calculateMonthlyAverage(expenses);
    
    // Calcola spese rimanenti per utenti free
    const remainingExpenses = userPlan.limits.maxExpenses - thisMonthExpenses.length;
    const progressPercentage = (thisMonthExpenses.length / userPlan.limits.maxExpenses) * 100;
    
    // Aggiorna UI
    document.getElementById('totalExpense').textContent = total.toFixed(2);
    document.getElementById('monthCount').textContent = thisMonthExpenses.length;
    document.getElementById('monthLimit').textContent = userPlan.limits.maxExpenses;
    document.getElementById('monthlyAverage').textContent = monthlyAverage.toFixed(2);
    document.getElementById('remainingExpenses').textContent = Math.max(0, remainingExpenses);
    document.getElementById('monthProgress').style.width = `${Math.min(progressPercentage, 100)}%`;
    document.getElementById('expensesTotal').textContent = expenses.length;
    document.getElementById('thisMonthTotal').textContent = thisMonthExpenses.length;
    document.getElementById('tableTotal').textContent = thisMonthTotal.toFixed(2);
    
    // Update budget remaining (placeholder for PRO feature)
    document.getElementById('budgetRemaining').textContent = '0.00';
}

function calculateMonthlyAverage(expenses) {
    if (expenses.length === 0) return 0;
    
    const months = {};
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!months[monthKey]) {
            months[monthKey] = { total: 0, count: 0 };
        }
        months[monthKey].total += expense.amount;
        months[monthKey].count++;
    });
    
    const monthlyAverages = Object.values(months).map(m => m.total);
    const average = monthlyAverages.reduce((sum, total) => sum + total, 0) / monthlyAverages.length;
    
    return average;
}

function filterExpenses() {
    const selectedCategory = document.getElementById('filterCategory').value;
    const selectedMonth = document.getElementById('filterMonth').value;
    const rows = document.querySelectorAll('#expensesTableBody tr:not(.empty-row)');
    
    rows.forEach(row => {
        const category = row.dataset.category;
        const date = new Date(row.cells[0].textContent.split('/').reverse().join('-'));
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        
        const categoryMatch = selectedCategory === 'all' || category === selectedCategory;
        const monthMatch = selectedMonth === 'all' || monthKey === selectedMonth;
        
        row.style.display = categoryMatch && monthMatch ? '' : 'none';
    });
}

function populateMonthFilter() {
    const expenses = getExpenses();
    const monthFilter = document.getElementById('filterMonth');
    
    if (!monthFilter) return;
    
    // Pulisci opzioni esistenti (tranne "Tutti i mesi")
    while (monthFilter.options.length > 1) {
        monthFilter.remove(1);
    }
    
    // Raccogli mesi unici
    const uniqueMonths = new Set();
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthName = date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
        uniqueMonths.add({ key: monthKey, name: monthName.charAt(0).toUpperCase() + monthName.slice(1) });
    });
    
    // Aggiungi opzioni
    Array.from(uniqueMonths).sort((a, b) => b.key.localeCompare(a.key)).forEach(month => {
        const option = document.createElement('option');
        option.value = month.key;
        option.textContent = month.name;
        monthFilter.appendChild(option);
    });
}

function exportToCSV() {
    const expenses = getExpenses();
    if (expenses.length === 0) {
        showNotification('Nessuna spesa da esportare!', 'info');
        return;
    }
    
    let csv = 'Data,Descrizione,Categoria,Metodo Pagamento,Importo\n';
    
    expenses.forEach(expense => {
        const date = formatDate(expense.date);
        const description = expense.description.replace(/"/g, '""');
        const category = getCategoryDisplayName(expense.category);
        const paymentMethod = getPaymentDisplayName(expense.paymentMethod);
        const amount = expense.amount.toFixed(2);
        
        csv += `"${date}","${description}","${category}","${paymentMethod}",${amount}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `homebudget-export-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Dati esportati in CSV!', 'success');
}

function handleClearAll() {
    if (confirm('Sei sicuro di voler cancellare TUTTE le spese? Questa azione non può essere annullata.')) {
        localStorage.removeItem('homebudget_expenses');
        loadExpenses();
        updateStats();
        showNotification('Tutte le spese sono state cancellate!', 'info');
    }
}

// Funzioni globali per azioni
window.editExpense = function(id) {
    showNotification('Modifica spesa - Funzione in sviluppo', 'info');
};

window.deleteExpense = function(id) {
    if (confirm('Eliminare questa spesa?')) {
        const expenses = getExpenses();
        const filteredExpenses = expenses.filter(expense => expense.id !== id);
        
        localStorage.setItem('homebudget_expenses', JSON.stringify(filteredExpenses));
        
        // Rimuovi riga dalla tabella
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) row.remove();
        
        // Se non ci sono più spese, mostra stato vuoto
        if (filteredExpenses.length === 0) {
            loadExpenses();
        }
        
        updateStats();
        showNotification('Spesa eliminata!', 'info');
    }
};

function showUpgradeModal() {
    const modal = document.getElementById('upgradeModal');
    if (modal) modal.style.display = 'flex';
}

function showLimitModal() {
    const modal = document.getElementById('limitModal');
    if (modal) {
        // Calcola giorni al reset (fine mese)
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const daysLeft = Math.ceil((lastDay - now) / (1000 * 60 * 60 * 24));
        
        document.getElementById('currentExpenses').textContent = '50';
        document.getElementById('daysLeft').textContent = daysLeft;
        
        modal.style.display = 'flex';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function handlePlanSelection(planType) {
    // Simulazione selezione piano
    showNotification(`Hai selezionato il piano ${planType === 'monthly' ? 'PRO Mensile' : 'PRO Annuale'}!`, 'info');
    
    // In produzione qui ci sarebbe la logica di checkout
    // Per ora simuliamo un upgrade
    setTimeout(() => {
        // Simula upgrade a PRO
        localStorage.setItem('user_plan', 'pro');
        updateUIForPlan();
        showNotification('🎉 Benvenuto in HomeBudget PRO! Sbloccate tutte le funzionalità avanzate.', 'success');
        closeAllModals();
    }, 1500);
}

function updateUIForPlan() {
    const userPlan = getUserPlan();
    const isPro = userPlan.plan === 'pro';
    
    // Aggiorna badge piano
    const planIndicator = document.getElementById('planIndicator');
    if (planIndicator) {
        planIndicator.innerHTML = isPro ? 
            `<span class="plan-badge" style="background: #4361ee">PRO</span>
             <span class="plan-text">Piano PRO</span>` :
            `<span class="plan-badge free-badge">FREE</span>
             <span class="plan-text">Piano Gratuito</span>`;
    }
    
    // Mostra/nascondi banner upgrade
    const upgradeBanner = document.getElementById('upgradeBanner');
    if (upgradeBanner) {
        upgradeBanner.style.display = isPro ? 'none' : 'block';
    }
    
    // Aggiorna limite nel form
    const remainingElement = document.getElementById('remainingExpenses');
    if (remainingElement) {
        remainingElement.textContent = isPro ? '∞' : '50';
    }
    
    // Aggiorna limite mensile
    const monthLimit = document.getElementById('monthLimit');
    if (monthLimit) {
        monthLimit.textContent = isPro ? '∞' : '50';
    }
}

function showNotification(message, type = 'info') {
    // Crea elemento notifica
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Stili base
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    // Colore in base al tipo
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3',
        warning: '#FF9800'
    };
    
    notification.style.backgroundColor = colors[type] || '#2196F3';
    
    // Aggiungi al documento
    document.body.appendChild(notification);
    
    // Aggiungi animazione se non esiste
    if (!document.querySelector('#notification-animation')) {
        const style = document.createElement('style');
        style.id = 'notification-animation';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Rimuovi dopo 4 secondi
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}