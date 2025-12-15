// ==========================================
// 📄 js/ui.js - Interface utilisateur
// ==========================================

// Afficher un toast
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  
  const bgColor = type === "success" ? "bg-green-600" : "bg-red-600";
  const icon = type === "success" ? "✓" : "✗";
  
  toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg mb-2 animate-slide-in flex items-center space-x-2`;
  toast.innerHTML = `<span class="font-bold text-lg">${icon}</span><span>${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Activer/désactiver le mode sombre
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  document.getElementById('themeIcon').textContent = isDark ? '☀️' : '🌙';
  showToast(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'success');
}

// Charger les préférences de mode sombre
function loadDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark-mode');
    document.getElementById('themeIcon').textContent = '☀️';
  }
}

// Basculer le menu mobile
function toggleMobileMenu() {
  const menu = document.getElementById('mobileNav');
  menu.classList.toggle('hidden');
}

// Échapper le HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


function renderUserScriptFilter() {
    if (!user || userRole === 'admin') {
        return ''; // Les admins et non-connectés ne voient pas ce filtre
    }
    
    // Charger la préférence sauvegardée
    const savedFilter = localStorage.getItem('userScriptFilter') || 'all';
    userScriptFilter = savedFilter;
    
    return `
        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-200 mb-6 animate-fade-in">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">🔍</span>
                    <div>
                        <h3 class="font-bold text-gray-800 text-sm">Filtrer les scripts</h3>
                        <p class="text-xs text-gray-600">Choisissez ce que vous souhaitez afficher</p>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button 
                        onclick="changeUserScriptFilter('all')" 
                        id="filterAll"
                        class="px-4 py-2 rounded-lg font-medium transition ${savedFilter === 'all' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}">
                        🌍 Tous les scripts publics
                    </button>
                    <button 
                        onclick="changeUserScriptFilter('mine')" 
                        id="filterMine"
                        class="px-4 py-2 rounded-lg font-medium transition ${savedFilter === 'mine' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}">
                        👤 Mes scripts uniquement
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Changer le filtre utilisateur
function changeUserScriptFilter(filter) {
    userScriptFilter = filter;
    localStorage.setItem('userScriptFilter', filter);
    
    // Mettre à jour les boutons visuellement
    const btnAll = document.getElementById('filterAll');
    const btnMine = document.getElementById('filterMine');
    
    if (btnAll && btnMine) {
        if (filter === 'all') {
            btnAll.className = 'px-4 py-2 rounded-lg font-medium transition bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg';
            btnMine.className = 'px-4 py-2 rounded-lg font-medium transition bg-white text-gray-700 hover:bg-gray-100 border border-gray-300';
        } else {
            btnAll.className = 'px-4 py-2 rounded-lg font-medium transition bg-white text-gray-700 hover:bg-gray-100 border border-gray-300';
            btnMine.className = 'px-4 py-2 rounded-lg font-medium transition bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg';
        }
    }
    
    // NOUVEAU : Recharger la page actuelle avec le nouveau filtre
    const currentView = sessionStorage.getItem('currentView') || 'home';
    const currentDatabase = sessionStorage.getItem('currentDatabase');
    const currentCategory = sessionStorage.getItem('currentCategory');
    
    if (currentView === 'home') {
        loadRecentScripts();
    } else if (currentView === 'category' && currentDatabase && currentCategory) {
        loadCategoryByDatabase(currentDatabase, currentCategory);
    } else if (currentView === 'categories' && currentDatabase) {
        showCategoriesByDatabase(currentDatabase);
    } else {
        // Par défaut, recharger l'accueil
        showHome();
    }
    
    showToast(filter === 'all' ? '🌍 Affichage de tous les scripts publics' : '👤 Affichage de vos scripts uniquement', 'success');
}