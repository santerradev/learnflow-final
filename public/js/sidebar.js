// =====================================================
// LEARNFLOW - LÓGICA DA SIDEBAR COLAPSÁVEL
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');

    // Verificar se estamos na área logada (sidebar existe)
    if (!sidebar || !sidebarToggleBtn) return;

    // Carregar estado salvo da sidebar
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true' && window.innerWidth >= 768) {
        sidebar.classList.add('sidebar-collapsed');
    }

    // Toggle da sidebar
    sidebarToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (window.innerWidth < 768) {
            // MOBILE: Abrir/fechar sidebar (drawer)
            sidebar.classList.toggle('-translate-x-full');
            sidebar.classList.toggle('sidebar-open');
            sidebarOverlay.classList.toggle('hidden');
        } else {
            // DESKTOP: Colapsar/expandir sidebar
            const isCollapsed = sidebar.classList.toggle('sidebar-collapsed');
            
            // Salvar preferência
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        }
    });

    // Fechar sidebar mobile ao clicar no overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebar.classList.remove('sidebar-open');
            sidebarOverlay.classList.add('hidden');
        });
    }

    // Fechar sidebar mobile ao clicar em um link
    const navLinks = sidebar.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                sidebar.classList.add('-translate-x-full');
                sidebar.classList.remove('sidebar-open');
                sidebarOverlay.classList.add('hidden');
            }
        });
    });

    // Ajustar ao redimensionar janela
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            // Desktop: remover classes mobile
            sidebar.classList.remove('-translate-x-full', 'sidebar-open');
            sidebarOverlay.classList.add('hidden');
            
            // Restaurar estado colapsado salvo
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                sidebar.classList.add('sidebar-collapsed');
            }
        } else {
            // Mobile: remover estado colapsado
            sidebar.classList.remove('sidebar-collapsed');
        }
    });
});