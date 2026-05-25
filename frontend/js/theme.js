// Centralized Theme System
(function () {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.className = 'theme-' + savedTheme;

  window.toggleTheme = function() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    window.applyTheme(nextTheme);
  };

  window.applyTheme = function(themeName) {
    localStorage.setItem('theme', themeName);
    document.documentElement.className = 'theme-' + themeName;
    if (document.body) {
      document.body.className = 'theme-' + themeName;
    }
    
    // Sync all toggle buttons on the page
    const toggles = document.querySelectorAll('.theme-toggle-btn, #landingThemeToggle');
    toggles.forEach(toggle => {
      toggle.innerHTML = `<i data-lucide="${themeName === 'dark' ? 'sun' : 'moon'}"></i>`;
      if (window.lucide) {
        window.lucide.createIcons({ root: toggle });
      }
    });

    window.dispatchEvent(new CustomEvent('themeChanged', { detail: themeName }));
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.body) {
      document.body.className = 'theme-' + (localStorage.getItem('theme') || 'dark');
    }

    // Dynamic Injection in Dashboard/Admin topbars
    const topbarActions = document.querySelector('.topbar__actions');
    if (topbarActions && !document.getElementById('themeToggleBtn')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'iconBtn theme-toggle-btn';
      toggleBtn.id = 'themeToggleBtn';
      toggleBtn.setAttribute('aria-label', 'Toggle theme');
      
      const theme = localStorage.getItem('theme') || 'dark';
      toggleBtn.innerHTML = `<i data-lucide="${theme === 'dark' ? 'sun' : 'moon'}"></i>`;
      
      // Insert as the first action item
      topbarActions.insertBefore(toggleBtn, topbarActions.firstChild);
      
      toggleBtn.addEventListener('click', window.toggleTheme);
      
      if (window.lucide) {
        window.lucide.createIcons({ root: toggleBtn });
      }
    }
  });
})();
