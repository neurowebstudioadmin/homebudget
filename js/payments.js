// Sistema di gestione piani e limiti

class PaymentSystem {
    constructor() {
        this.userPlan = this.getUserPlan();
        this.init();
    }
    
    init() {
        this.checkLimits();
        this.setupEventListeners();
        this.updateUI();
    }
    
    getUserPlan() {
        // Per ora simuliamo, poi sarà dal backend
        return {
            id: localStorage.getItem('user_id') || 'guest',
            plan: localStorage.getItem('user_plan') || 'free',
            subscriptionId: localStorage.getItem('subscription_id') || null,
            expirationDate: localStorage.getItem('plan_expiration') || null,
            limits: {
                maxExpenses: 50,
                maxCategories: 8,
                canExportPDF: false,
                hasAdvancedCharts: false,
                hasCloudBackup: false
            }
        };
    }
    
    checkLimits() {
        if (this.userPlan.plan === 'free') {
            const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
            const thisMonthExpenses = expenses.filter(exp => {
                const expDate = new Date(exp.date);
                const now = new Date();
                return expDate.getMonth() === now.getMonth() && 
                       expDate.getFullYear() === now.getFullYear();
            });
            
            if (thisMonthExpenses.length >= this.userPlan.limits.maxExpenses) {
                this.showLimitReachedModal();
                return false;
            }
        }
        return true;
    }
    
    showLimitReachedModal() {
        const modal = document.createElement('div');
        modal.className = 'limit-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-lock"></i> Limite Raggiunto!</h3>
                <p>Hai raggiunto il limite di 50 spese/mese del piano gratuito.</p>
                <p>Upgrade a PRO per spese illimitate e funzionalità avanzate!</p>
                <div class="modal-actions">
                    <button class="btn-secondary" id="closeLimitModal">Chiudi</button>
                    <button class="btn-primary" id="upgradeNowBtn">Upgrade a PRO</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('closeLimitModal').addEventListener('click', () => {
            modal.remove();
        });
        
        document.getElementById('upgradeNowBtn').addEventListener('click', () => {
            modal.remove();
            this.showUpgradeModal();
        });
    }
    
    showUpgradeModal() {
        document.getElementById('upgradeModal').style.display = 'block';
    }
    
    setupEventListeners() {
        // Upgrade buttons
        document.querySelectorAll('.btn-upgrade, .btn-upgrade-large').forEach(btn => {
            btn.addEventListener('click', () => this.showUpgradeModal());
        });
        
        // Select plan buttons
        document.querySelectorAll('.btn-select-plan').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const plan = e.target.dataset.plan;
                this.handlePlanSelection(plan);
            });
        });
        
        // Close modal
        document.querySelector('.modal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }
    
    async handlePlanSelection(planType) {
        // Simulazione - in produzione integrerai con Stripe
        if (planType === 'monthly') {
            // Reindirizza a checkout mensile
            window.location.href = '/checkout/monthly';
        } else if (planType === 'yearly') {
            // Reindirizza a checkout annuale
            window.location.href = '/checkout/yearly';
        }
    }
    
    updateUI() {
        // Aggiorna badge piano
        const planBadge = document.getElementById('userPlan');
        if (planBadge) {
            planBadge.textContent = `Piano ${this.userPlan.plan === 'free' ? 'Free' : 'PRO'}`;
        }
        
        // Mostra/nascondi CTA upgrade
        const upgradeCta = document.getElementById('upgradeCta');
        if (upgradeCta) {
            upgradeCta.style.display = this.userPlan.plan === 'free' ? 'block' : 'none';
        }
        
        // Conta spese mese corrente per free users
        if (this.userPlan.plan === 'free') {
            const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
            const now = new Date();
            const thisMonthCount = expenses.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getMonth() === now.getMonth() && 
                       expDate.getFullYear() === now.getFullYear();
            }).length;
            
            const limitElement = document.getElementById('currentLimit');
            if (limitElement) {
                limitElement.textContent = thisMonthCount + '/50';
            }
        }
    }
    
    // Metodo per aggiornare piano dopo pagamento riuscito
    upgradeUserToPro(planType, subscriptionId) {
        this.userPlan.plan = 'pro';
        this.userPlan.subscriptionId = subscriptionId;
        this.userPlan.expirationDate = this.calculateExpirationDate(planType);
        
        // Aggiorna limits
        this.userPlan.limits = {
            maxExpenses: Infinity,
            maxCategories: Infinity,
            canExportPDF: true,
            hasAdvancedCharts: true,
            hasCloudBackup: true
        };
        
        // Salva in localStorage (temporaneo, poi backend)
        localStorage.setItem('user_plan', 'pro');
        localStorage.setItem('subscription_id', subscriptionId);
        localStorage.setItem('plan_expiration', this.userPlan.expirationDate);
        
        // Aggiorna UI
        this.updateUI();
        
        // Mostra notifica successo
        this.showUpgradeSuccess();
    }
    
    calculateExpirationDate(planType) {
        const now = new Date();
        if (planType === 'monthly') {
            now.setMonth(now.getMonth() + 1);
        } else if (planType === 'yearly') {
            now.setFullYear(now.getFullYear() + 1);
        }
        return now.toISOString();
    }
    
    showUpgradeSuccess() {
        const notification = document.createElement('div');
        notification.className = 'upgrade-success';
        notification.innerHTML = `
            <div class="success-content">
                <i class="fas fa-check-circle"></i>
                <h3>Benvenuto in HomeBudget PRO!</h3>
                <p>Ora hai accesso a tutte le funzionalità avanzate.</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Inizializza quando la pagina è caricata
document.addEventListener('DOMContentLoaded', () => {
    window.paymentSystem = new PaymentSystem();
});