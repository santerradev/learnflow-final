// =====================================================
// LEARNFLOW - DARK MODE
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;
    const themeToggleButtons = document.querySelectorAll('#theme-toggle, #theme-toggle-auth');
    
    // Aplicar tema
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
    };

    // Toggle ao clicar
    themeToggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const isDark = htmlElement.classList.toggle('dark');
            const newTheme = isDark ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    });

    // Aplicar tema salvo ou preferência do sistema
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);
});