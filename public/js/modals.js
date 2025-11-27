// LEARNFLOW - SISTEMA DE MODAIS MODERNOS
// Substitui alerts por modais bonitos e funcionais

// Criar overlay de fundo
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in';
    return overlay;
}

// MODAL DE SUCESSO
function showSuccessModal(title = 'Sucesso!', message = 'Operação realizada com sucesso.', buttonText = 'Continuar', onClose = null) {
    const overlay = createOverlay();
    
    overlay.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <!-- Botão Fechar (X) -->
            <button onclick="closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                <i class="fas fa-times text-xl"></i>
            </button>
            
            <!-- Ícone de Sucesso -->
            <div class="flex justify-center mb-6">
                <div class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center animate-bounce-once">
                    <i class="fas fa-check text-green-600 dark:text-green-400 text-3xl"></i>
                </div>
            </div>
            
            <!-- Título -->
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
                ${title}
            </h3>
            
            <!-- Mensagem -->
            <p class="text-gray-600 dark:text-gray-400 text-center mb-6">
                ${message}
            </p>
            
            <!-- Botão -->
            <button onclick="closeModal(${onClose ? 'true' : 'false'})" 
                    class="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-semibold py-3 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]">
                ${buttonText}
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Função de fechar
    window.closeModal = function(executeCallback) {
        overlay.classList.add('animate-fade-out');
        setTimeout(() => {
            overlay.remove();
            if (executeCallback && onClose) onClose();
        }, 200);
    };
    
    // Fechar ao clicar fora
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) window.closeModal(false);
    });
}

// MODAL DE ERRO
function showErrorModal(title = 'Erro!', message = 'Ocorreu um erro ao processar sua solicitação.', buttonText = 'Entendi', onClose = null) {
    const overlay = createOverlay();
    
    overlay.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <button onclick="closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                <i class="fas fa-times text-xl"></i>
            </button>
            
            <div class="flex justify-center mb-6">
                <div class="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center animate-shake">
                    <i class="fas fa-exclamation-circle text-red-600 dark:text-red-400 text-3xl"></i>
                </div>
            </div>
            
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
                ${title}
            </h3>
            
            <p class="text-gray-600 dark:text-gray-400 text-center mb-6">
                ${message}
            </p>
            
            <button onclick="closeModal(${onClose ? 'true' : 'false'})" 
                    class="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]">
                ${buttonText}
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    window.closeModal = function(executeCallback) {
        overlay.classList.add('animate-fade-out');
        setTimeout(() => {
            overlay.remove();
            if (executeCallback && onClose) onClose();
        }, 200);
    };
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) window.closeModal(false);
    });
}

// MODAL DE CONFIRMAÇÃO (Sim/Não)
function showConfirmModal(title = 'Confirmar ação?', message = 'Tem certeza que deseja continuar?', options = {}) {
    const {
        confirmText = 'Sim, tenho certeza',
        cancelText = 'Não, cancelar',
        confirmColor = 'red', // red, teal, blue, etc
        onConfirm = null,
        onCancel = null,
        icon = 'trash' // trash, exclamation-triangle, question-circle
    } = options;
    
    const colorClasses = {
        red: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
        teal: 'bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600',
        blue: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
        yellow: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600'
    };
    
    const iconClasses = {
        trash: 'fa-trash text-red-600 dark:text-red-400',
        'exclamation-triangle': 'fa-exclamation-triangle text-yellow-600 dark:text-yellow-400',
        'question-circle': 'fa-question-circle text-blue-600 dark:text-blue-400'
    };
    
    const overlay = createOverlay();
    
    overlay.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <button onclick="handleCancel()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                <i class="fas fa-times text-xl"></i>
            </button>
            
            <div class="flex justify-center mb-6">
                <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <i class="fas ${iconClasses[icon]} text-3xl"></i>
                </div>
            </div>
            
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
                ${title}
            </h3>
            
            <p class="text-gray-600 dark:text-gray-400 text-center mb-6">
                ${message}
            </p>
            
            <div class="flex gap-3">
                <button onclick="handleCancel()" 
                        class="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 rounded-lg transition duration-200 ease-in-out">
                    ${cancelText}
                </button>
                <button onclick="handleConfirm()" 
                        class="flex-1 ${colorClasses[confirmColor]} text-white font-semibold py-3 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]">
                    ${confirmText}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    window.handleConfirm = function() {
        overlay.classList.add('animate-fade-out');
        setTimeout(() => {
            overlay.remove();
            if (onConfirm) onConfirm();
        }, 200);
    };
    
    window.handleCancel = function() {
        overlay.classList.add('animate-fade-out');
        setTimeout(() => {
            overlay.remove();
            if (onCancel) onCancel();
        }, 200);
    };
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) window.handleCancel();
    });
}

// MODAL DE INFORMAÇÃO COM LISTA
function showInfoModal(title = 'Informação', items = [], buttonText = 'Continuar', onClose = null) {
    const overlay = createOverlay();
    
    const itemsHTML = items.map(item => `
        <div class="bg-teal-50 dark:bg-teal-900 border border-teal-200 dark:border-teal-700 rounded-lg px-4 py-3 flex items-center">
            <i class="fas fa-check-circle text-teal-600 dark:text-teal-400 mr-3"></i>
            <span class="text-gray-800 dark:text-gray-200">${item}</span>
        </div>
    `).join('');
    
    overlay.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <button onclick="closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                <i class="fas fa-times text-xl"></i>
            </button>
            
            <div class="flex justify-center mb-6">
                <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <i class="fas fa-info-circle text-blue-600 dark:text-blue-400 text-3xl"></i>
                </div>
            </div>
            
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
                ${title}
            </h3>
            
            <div class="space-y-2 mb-6">
                ${itemsHTML}
            </div>
            
            <button onclick="closeModal(${onClose ? 'true' : 'false'})" 
                    class="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-semibold py-3 rounded-lg transition duration-200 ease-in-out">
                ${buttonText}
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    window.closeModal = function(executeCallback) {
        overlay.classList.add('animate-fade-out');
        setTimeout(() => {
            overlay.remove();
            if (executeCallback && onClose) onClose();
        }, 200);
    };
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) window.closeModal(false);
    });
}

// MODAL DE LOADING
function showLoadingModal(message = 'Carregando...') {
    const overlay = createOverlay();
    overlay.id = 'loading-modal';
    
    overlay.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center animate-scale-in">
            <div class="animate-spin rounded-full h-16 w-16 border-4 border-teal-200 dark:border-teal-800 border-t-teal-600 dark:border-t-teal-400 mb-4"></div>
            <p class="text-gray-700 dark:text-gray-300 font-medium">${message}</p>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    return {
        close: () => {
            overlay.classList.add('animate-fade-out');
            setTimeout(() => overlay.remove(), 200);
        }
    };
}

// SUBSTITUIR ALERTS NATIVOS
window.alert = function(message) {
    showErrorModal('Atenção', message, 'OK');
};

window.confirm = function(message) {
    return new Promise((resolve) => {
        showConfirmModal('Confirmar', message, {
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false)
        });
    });
};

// EXPORTAR FUNÇÕES GLOBALMENTE
window.showSuccessModal = showSuccessModal;
window.showErrorModal = showErrorModal;
window.showConfirmModal = showConfirmModal;
window.showInfoModal = showInfoModal;
window.showLoadingModal = showLoadingModal;