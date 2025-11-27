// Sistema de Notificações Toast para LearnFlow

function createToastContainer() {
    if (document.getElementById('toast-container')) return;
    
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50 space-y-3 max-w-sm';
    document.body.appendChild(container);
}

function showToast(message, type = 'info', duration = 5000) {
    createToastContainer();
    
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `transform translate-x-full transition-all duration-300 ease-out`;
    
    const config = {
        success: {
            bg: 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700',
            text: 'text-green-800 dark:text-green-100',
            icon: 'fa-check-circle text-green-500',
            progress: 'bg-green-500'
        },
        error: {
            bg: 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700',
            text: 'text-red-800 dark:text-red-100',
            icon: 'fa-exclamation-circle text-red-500',
            progress: 'bg-red-500'
        },
        warning: {
            bg: 'bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700',
            text: 'text-yellow-800 dark:text-yellow-100',
            icon: 'fa-exclamation-triangle text-yellow-500',
            progress: 'bg-yellow-500'
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700',
            text: 'text-blue-800 dark:text-blue-100',
            icon: 'fa-info-circle text-blue-500',
            progress: 'bg-blue-500'
        }
    };
    
    const style = config[type] || config.info;
    
    toast.innerHTML = `
        <div class="${style.bg} border ${style.text} px-4 py-3 rounded-lg shadow-lg flex items-start space-x-3 min-w-[320px]">
            <i class="fas ${style.icon} text-xl flex-shrink-0 mt-0.5"></i>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium break-words">${message}</p>
            </div>
            <button onclick="this.closest('.transform').remove()" class="flex-shrink-0 hover:opacity-70 transition">
                <i class="fas fa-times text-sm"></i>
            </button>
        </div>
        <div class="h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mt-1">
            <div class="${style.progress} h-full rounded-full transition-all duration-${duration} ease-linear" style="width: 100%"></div>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
        toast.classList.add('translate-x-0');
    }, 10);
    
    const progressBar = toast.querySelector(`.${style.progress}`);
    setTimeout(() => {
        progressBar.style.width = '0%';
    }, 100);
    
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

window.showToast = showToast;