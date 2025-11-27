// file: public/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Lógica do Dark Mode ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement; 

    // Função para aplicar o tema inicial (considera preferência do sistema)
    const applyInitialTheme = () => {
        if (localStorage.getItem('theme') === 'dark' || 
           (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
    };
    applyInitialTheme(); // Aplica ao carregar

    // Listener para o botão de toggle de tema
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            htmlElement.classList.toggle('dark');
            localStorage.setItem('theme', htmlElement.classList.contains('dark') ? 'dark' : 'light');
        });
    }

    // --- Lógica do Menu Lateral (Sidebar) ---
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const mainContent = document.getElementById('main-content'); // Container principal

    // Função para ABRIR/FECHAR sidebar (lida com mobile e desktop)
    const toggleSidebar = () => {
        if (!sidebar || !mainContent) return; 

        const isDesktop = window.innerWidth >= 768; // Tailwind 'md' breakpoint

        if (isDesktop) {
            // Em Desktop: Alterna a largura da sidebar e a margem do conteúdo
            const isCurrentlyOpen = sidebar.classList.contains('md:w-64');

            if (isCurrentlyOpen) {
                // Fechar
                sidebar.classList.remove('md:w-64', 'p-4'); // Remove largura e padding
                sidebar.classList.add('md:w-0', 'opacity-0'); // Adiciona largura zero e opacidade
                mainContent.classList.remove('md:ml-64'); // Remove margem esquerda
            } else {
                // Abrir
                sidebar.classList.remove('md:w-0', 'opacity-0'); // Remove largura zero e opacidade
                sidebar.classList.add('md:w-64', 'p-4'); // Adiciona largura e padding de volta
                mainContent.classList.add('md:ml-0'); // Adiciona margem esquerda
            }
        } else {
            // Em Mobile/Tablet: Usa translate e overlay
            sidebar.classList.toggle('-translate-x-full'); // Alterna visibilidade
            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle('hidden'); // Alterna overlay
            }
        }
    };

    // Listener para o botão toggle da sidebar
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleSidebar();
        });
    }

    // Listener para fechar no overlay (Mobile)
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            if (window.innerWidth < 768) { // Só fecha via overlay em mobile
                toggleSidebar();
            }
        });
    }

    // --- Lógica do Dropdown de Perfil ---
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');

    if (userMenuButton && userMenuDropdown) {
        userMenuButton.addEventListener('click', (e) => {
            e.stopPropagation(); 
            userMenuDropdown.classList.toggle('hidden');
        });
    }

    // Fecha o dropdown se clicar fora
    document.addEventListener('click', (e) => {
        if (userMenuButton && userMenuDropdown && !userMenuDropdown.classList.contains('hidden')) {
            if (!userMenuButton.contains(e.target) && !userMenuDropdown.contains(e.target)) {
                userMenuDropdown.classList.add('hidden');
            }
        }
    });
});