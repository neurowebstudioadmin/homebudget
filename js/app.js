// App HomeBudget - Gestione Spese Personale

document.addEventListener('DOMContentLoaded', function() {
    // Inizializza l'app
    initApp();
});

function initApp() {
    // Imposta data odierna come default
    document.getElementById('date').valueAsDate = new Date();
    
    // Carica spese esistenti
    loadExpenses();
    
    // Setup event listeners
    setupEventListeners();
    
    // Aggiorna statistiche
    updateStats();
}

function setupEventListeners() {
    // Form aggiunta spesa
    const expenseForm = document.getElementById('expenseForm');
    expenseForm.addEventListener('submit', handleAddExpense);
    
    // Filtro categoria
    const filterCategory = document.getElementById('filterCategory');
    filterCategory.addEventListener('change', filterExpenses);
    
    // Pulsante cancella tutto
    const clearAllBtn = document.getElementById('clearAll');
    clearAllBtn.addEventListener('click', handleClearAll);
}

function handleAddExpense(event) {
    event.preventDefault();
    
    // Prendi valori dal form
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value.trim() || 'Spesa senza descrizione';
    
    // Validazione
    if (!amount || amount <= 0) {
        alert('Inserisci un importo valido!');
        return;
    }
    
    if (!category) {
        alert('Seleziona una categoria!');
        return;
    }
    
    if (!date) {
        alert('Seleziona una data!');
        return;
    }
    
    // Crea oggetto spesa
    const expense = {
        id: Date.now(), // ID univoco basato sul timestamp
        amount: amount,
        category: category,
        date: date,
        description: description,
        addedAt: new Date().toISOString()
    };
    
    // Salva la spesa
    saveExpense(expense);
    
    // Aggiorna l'interfaccia
    addExpenseToTable(expense);
    updateStats();
    
    // Mostra notifica
    showNotification('Spesa aggiunta con successo!', 'success');
    
    // Reset form
    expenseForm.reset();
    document.getElementById('date').valueAsDate = new Date();
}

function saveExpense(expense) {
    // Recupera spese esistenti
    const expenses = getExpenses();
    
    // Aggiungi nuova spesa
    expenses.push(expense);
    
    // Salva nel localStorage
    localStorage.setItem('homebudget_expenses', JSON.stringify(expenses));
}

function getExpenses() {
    const expensesJson = localStorage.getItem('homebudget_expenses');
    return expensesJson ? JSON.parse(expensesJson) : [];
}

function loadExpenses() {
    const expenses = getExpenses();
    const tableBody = document.getElementById('expensesTableBody');
    
    // Pulisci la tabella (rimuovi riga vuota)
    tableBody.innerHTML = '';
    
    if (expenses.length === 0) {
        // Mostra stato vuoto
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-row';
        emptyRow.innerHTML = `
            <td colspan="5">
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>Nessuna spesa registrata. Aggiungi la prima!</p>
                </div>
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    // Ordina per data (più recente prima)
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Aggiungi ogni spesa alla tabella
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
    
    // Formatta importo
    const formattedAmount = expense.amount.toFixed(2);
    
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
        <td><strong>€ ${formattedAmount}</strong></td>
        <td>
            <button class="btn-delete" onclick="deleteExpense(${expense.id})">
                <i class="fas fa-trash"></i>
            </button>
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
        'shopping': 'Shopping',
        'salute': 'Salute',
        'svago': 'Svago',
        'altro': 'Altro'
    };
    return categories[category] || category;
}

function updateStats() {
    const expenses = getExpenses();
    
    // Calcola spesa totale
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calcola spese questo mese
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && 
               expenseDate.getFullYear() === currentYear;
    });
    
    // Calcola media mensile
    const monthlyAverage = calculateMonthlyAverage(expenses);
    
    // Aggiorna UI
    document.getElementById('totalExpense').textContent = total.toFixed(2);
    document.getElementById('monthCount').textContent = thisMonthExpenses.length;
    document.getElementById('monthlyAverage').textContent = monthlyAverage.toFixed(2);
}

function calculateMonthlyAverage(expenses) {
    if (expenses.length === 0) return 0;
    
    // Raggruppa per mese/anno
    const months = {};
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!months[monthKey]) {
            months[monthKey] = 0;
        }
        months[monthKey] += expense.amount;
    });
    
    // Calcola media
    const monthlyTotals = Object.values(months);
    const average = monthlyTotals.reduce((sum, total) => sum + total, 0) / monthlyTotals.length;
    
    return average;
}

function filterExpenses() {
    const selectedCategory = document.getElementById('filterCategory').value;
    const rows = document.querySelectorAll('#expensesTableBody tr');
    
    rows.forEach(row => {
        if (selectedCategory === 'all' || row.dataset.category === selectedCategory) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function handleClearAll() {
    if (confirm('Sei sicuro di voler cancellare TUTTE le spese? Questa azione non può essere annullata.')) {
        localStorage.removeItem('homebudget_expenses');
        loadExpenses();
        updateStats();
        showNotification('Tutte le spese sono state cancellate!', 'info');
    }
}

// Funzione globale per eliminare spesa (chiamata da onclick)
window.deleteExpense = function(id) {
    if (confirm('Eliminare questa spesa?')) {
        const expenses = getExpenses();
        const filteredExpenses = expenses.filter(expense => expense.id !== id);
        
        localStorage.setItem('homebudget_expenses', JSON.stringify(filteredExpenses));
        
        // Rimuovi riga dalla tabella
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            row.remove();
        }
        
        // Se non ci sono più spese, mostra stato vuoto
        if (filteredExpenses.length === 0) {
            loadExpenses();
        }
        
        updateStats();
        showNotification('Spesa eliminata!', 'info');
    }
};

function showNotification(message, type = 'info') {
    // Crea elemento notifica
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Stili della notifica
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
        animation: slideIn 0.3s ease;
    `;
    
    // Colore in base al tipo
    if (type === 'success') {
        notification.style.backgroundColor = '#4CAF50';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#f44336';
    } else {
        notification.style.backgroundColor = '#2196F3';
    }
    
    // Aggiungi al documento
    document.body.appendChild(notification);
    
    // Aggiungi animazione CSS se non esiste
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Rimuovi dopo 3 secondi
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Funzione per esportare dati (aggiungeremo dopo)
function exportToCSV() {
    const expenses = getExpenses();
    if (expenses.length === 0) {
        showNotification('Nessuna spesa da esportare!', 'info');
        return;
    }
    
    // Crea header CSV
    let csv = 'Data,Descrizione,Categoria,Importo\n';
    
    // Aggiungi dati
    expenses.forEach(expense => {
        const date = formatDate(expense.date);
        const description = expense.description.replace(/"/g, '""');
        const category = getCategoryDisplayName(expense.category);
        const amount = expense.amount.toFixed(2);
        
        csv += `"${date}","${description}","${category}",${amount}\n`;
    });
    
    // Crea blob e download
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

// Aggiungi pulsante esporta dopo che tutto è caricato
setTimeout(() => {
    const filtersDiv = document.querySelector('.filters');
    if (filtersDiv) {
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn-export';
        exportBtn.innerHTML = '<i class="fas fa-download"></i> Esporta CSV';
        exportBtn.onclick = exportToCSV;
        exportBtn.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-family: 'Poppins', sans-serif;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        exportBtn.onmouseover = function() { this.style.backgroundColor = '#388E3C'; };
        exportBtn.onmouseout = function() { this.style.backgroundColor = '#4CAF50'; };
        
        filtersDiv.insertBefore(exportBtn, filtersDiv.lastChild);
    }
}, 100);