const supabase = window.supabase.createClient(
  "https://josncyjmqsikoitvbehe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvc25jeWptcXNpa29pdHZiZWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTY4NzAsImV4cCI6MjA3ODA5Mjg3MH0.bLz6ZVEWfRW5t1paXntlBSrTGcUAPscbI8tytMyimng"
);

const categories = [
  "DATABASE INFO",
  "BACKUP & RESTORE",
  "PERFORMANCE",
  "MONITORING",
  "FLASHBACK",
  "DATAGUARD",
  "AUDITING & SECURITY",
  "DATAPUMP",
  "STATISTICS",
  "SCHEDULER & JOBS"
];

const categoryIcons = {
  "DATABASE INFO": "ℹ️",
  "BACKUP & RESTORE": "💿",
  "PERFORMANCE": "⚡",
  "MONITORING": "📊",
  "FLASHBACK": "⏪",
  "DATAGUARD": "🛡️",
  "AUDITING & SECURITY": "🔒",
  "DATAPUMP": "🚚",
  "STATISTICS": "📈",
  "SCHEDULER & JOBS": "⏳"
};

let currentPage = 1;
let itemsPerPage = 20;
let currentSort = 'recent';
let allScripts = [];
let filteredScripts = [];
let favorites = [];

// NOUVEAU : Variables d'état de l'utilisateur
let user = null;
let userRole = null;

document.addEventListener("DOMContentLoaded", () => {
  loadUserData();
  loadDarkMode();
  setupAuthListener(); // <-- NOUVEAU : Lance l'écouteur d'état d'authentification
  showHome();
});

function loadUserData() {
  favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
}

// NOUVELLE FONCTION : Écouteur d'état d'authentification
// NOUVELLE FONCTION : Écouteur d'état d'authentification
// Dans app.js, trouvez la fonction setupAuthListener
// Dans app.js, trouvez la fonction setupAuthListener
function setupAuthListener() {
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            user = session.user;
            await checkAdminRole(user.id);
        } else {
            user = null;
            userRole = null;
        }
        
        renderAuthButtons(); 
        
        // *******************************************
        // Modification pour gérer la transition de vue après la connexion/déconnexion
        // *******************************************
        // Si l'état change (que ce soit SIGNED_IN ou SIGNED_OUT)
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            // On s'assure que l'utilisateur est sur la page d'accueil pour masquée le formulaire Login/Admin
            showHome();
        }
        
        // Si le but est de rediriger l'admin vers le panneau Admin après la connexion, 
        // ajoutez cette ligne APRES le chargement du rôle :
        if (event === 'SIGNED_IN' && userRole === 'admin') {
             // Rediriger vers l'Admin s'il vient de se connecter en tant qu'Admin
             // showAdmin(); // Optionnel, showHome est plus sûr pour la première fois
        }
        
        // Cette partie gère la déconnexion depuis le panneau Admin
        if (!user && document.getElementById('adminTabContent')) {
            showHome(); 
        }
    });
}

// Fonction d'initialisation de l'application
async function init() {
    // 1. Initialiser l'écouteur d'état (qui va gérer la mise à jour)
    setupAuthListener(); 
    
    // 2. Récupérer l'état actuel de l'utilisateur (si session existante)
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    // 3. Mettre à jour les variables globales (user et userRole) si l'utilisateur est déjà connecté
    if (currentUser) {
        user = currentUser;
        await checkAdminRole(user.id);
    }
    
    // 4. Afficher les boutons corrects (Login, Admin, ou Logout)
    renderAuthButtons(); // <-- LIGNE À VÉRIFIER/AJOUTER
    
    // 5. Charger la vue par défaut
    showHome(); 
    
    // 6. Ajouter les écouteurs d'événements
    // ... le reste du code est correct
}

// NOUVELLE FONCTION : Vérifie le rôle de l'utilisateur
// Doit être async
async function checkAdminRole(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error("Erreur de récupération du rôle:", error);
        userRole = 'user'; // Valeur par défaut si erreur
    } else {
        // LIGNE CRUCIALE : METTRE À JOUR LA VARIABLE GLOBALE
        userRole = data.role; 
    }
}

// NOUVELLE FONCTION : Met à jour les boutons Login/Admin/Logout
function renderAuthButtons() {
    const container = document.getElementById('authButtonContainer');
    const mobileContainer = document.getElementById('mobileAuthButtonContainer');
    
    // Bouton de navigation
    if (user && userRole === 'admin') {
        container.innerHTML = `
            <button onclick="showAdmin()" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition font-medium">
                🔐 Admin
            </button>
        `;
    } else if (user) {
        container.innerHTML = `
            <button onclick="handleLogout()" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium">
                🚪 Logout
            </button>
        `;
    } else {
        container.innerHTML = `
            <button onclick="showLogin()" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium">
                🔑 Login
            </button>
        `;
    }

    // Bouton de menu mobile
    if (user && userRole === 'admin') {
        mobileContainer.innerHTML = `
            <button onclick="showAdmin(); toggleMobileMenu()" class="block w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-gray-800 rounded-lg">
                🔐 Admin
            </button>
        `;
    } else if (user) {
         mobileContainer.innerHTML = `
            <button onclick="handleLogout(); toggleMobileMenu()" class="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                🚪 Logout
            </button>
        `;
    } else {
        mobileContainer.innerHTML = `
            <button onclick="showLogin(); toggleMobileMenu()" class="block w-full text-left px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg">
                🔑 Login
            </button>
        `;
    }
}

// NOUVELLE FONCTION : Affiche le formulaire de connexion
function showLogin() {
    document.getElementById("content").innerHTML = `
        <section class="max-w-md mx-auto py-12 px-4 animate-fade-in">
            <div class="bg-white rounded-xl shadow-xl p-8">
                <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">🔐 Connexion Admin</h2>
                <form id="authForm" onsubmit="handleLogin(event)" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input name="email" type="email" required 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="user@example.com" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
                        <input name="password" type="password" required 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="********" />
                    </div>
                    <button type="submit" class="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold">
                        Se connecter
                    </button>
                </form>
                <p class="text-center text-xs text-gray-500 mt-4">Pas de compte ? Inscrivez-vous via l'interface Supabase.</p>
            </div>
        </section>
    `;
}

// NOUVELLE FONCTION : Gère la connexion
// NOUVELLE FONCTION : Gère la connexion
// Dans app.js, trouvez cette fonction
async function handleLogin(e) {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        showToast("❌ Échec de la connexion: " + error.message, "error");
    } else {
        showToast("✅ Connexion réussie!", "success");
        
        // ↓↓↓ LIGNE À AJOUTER OU À DÉCOMMENTER ↓↓↓
        showHome(); // CRUCIAL : Change la vue principale vers l'accueil
    }
}

// NOUVELLE FONCTION : Gère la déconnexion
async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        showToast("❌ Échec de la déconnexion", "error");
    } else {
        showToast("🚪 Déconnexion réussie!", "success");
        showHome();
    }
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  document.getElementById('themeIcon').textContent = isDark ? '☀️' : '🌙';
  showToast(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'success');
}

function loadDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark-mode');
    document.getElementById('themeIcon').textContent = '☀️';
  }
}

function toggleFavorite(scriptId) {
  const index = favorites.indexOf(scriptId);
  if (index > -1) {
    favorites.splice(index, 1);
    showToast('❌ Removed from favorites', 'success');
  } else {
    favorites.push(scriptId);
    showToast('⭐ Added to favorites', 'success');
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  
  const icon = document.querySelector(`[data-favorite-id="${scriptId}"]`);
  if (icon) {
    icon.classList.toggle('active');
    icon.textContent = favorites.includes(scriptId) ? '⭐' : '☆';
  }
}

function isFavorite(scriptId) {
  return favorites.includes(scriptId);
}

async function showFavorites() {
  if (favorites.length === 0) {
    document.getElementById("content").innerHTML = `
      <section class="max-w-5xl mx-auto py-12 px-4 text-center animate-fade-in">
        <div class="bg-white p-12 rounded-xl shadow-lg">
          <div class="text-6xl mb-4">⭐</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-4">No favorites</h2>
          <p class="text-gray-600 mb-6">Add scripts to your favorites to find them easily here</p>
          <button onclick="showHome()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
            ← Back to home
          </button>
        </div>
      </section>
    `;
    return;
  }

  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .in('id', favorites);

  if (error) {
    showToast("Loading error", "error");
    return;
  }

  document.getElementById("content").innerHTML = `
    <section class="max-w-5xl mx-auto py-12 px-4 animate-fade-in">
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-gray-800 mb-2">⭐ My Favorites</h2>
        <p class="text-gray-600">${data.length} favorite script(s)</p>
      </div>
      <div class="space-y-4">
        ${data.map(script => renderScriptCard(script)).join('')}
      </div>
    </section>
  `;
}

async function exportUserData() {
  const { data: allScripts } = await supabase.from("scripts").select("*");
  
  const exportData = {
    scripts: allScripts,
    favorites: favorites,
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dba-scripts-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast("📥 Export successful!", "success");
}

async function exportScriptSQL(scriptId) {
  const { data: script } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", scriptId)
    .single();

  if (!script) return;

  const sqlContent = `-- ${script.title}
-- Database: ${script.database}
-- Category: ${script.category}
-- Created: ${new Date(script.created_at).toLocaleDateString('en-US')}
${script.description ? `-- Description: ${script.description}` : ''}

${script.code}`;

  const blob = new Blob([sqlContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${script.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.sql`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast("📥 Script exported!", "success");
}

function showImportModal() {
  document.getElementById("content").innerHTML = `
    <section class="max-w-3xl mx-auto py-12 px-4 animate-fade-in">
      <div class="bg-white rounded-xl shadow-xl p-8">
        <h2 class="text-3xl font-bold text-gray-800 mb-6">📤 Import Scripts</h2>
        
        <div class="space-y-6">
          <div class="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center">
            <input type="file" id="fileInput" accept=".json,.sql" class="hidden" onchange="handleFileImport(event)" />
            <button onclick="document.getElementById('fileInput').click()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
              📁 Choose a file
            </button>
            <p class="text-gray-600 mt-4">Accepted formats: JSON, SQL</p>
          </div>

          <div class="bg-blue-50 p-6 rounded-xl">
            <h3 class="font-bold text-gray-800 mb-2">💡 Supported formats:</h3>
            <ul class="text-sm text-gray-700 space-y-1">
              <li>• <strong>JSON</strong>: Complete export with metadata</li>
              <li>• <strong>SQL</strong>: SQL file with comments</li>
            </ul>
          </div>

          <div class="flex gap-3">
            <button onclick="showHome()" class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">
              Cancel
            </button>
            <button onclick="exportUserData()" class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
              📥 Export my data
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target.result;
      
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(content);
        if (data.scripts && Array.isArray(data.scripts)) {
          let count = 0;
          for (const script of data.scripts) {
            delete script.id;
            const { error } = await supabase.from("scripts").insert(script);
            if (!error) count++;
          }
          showToast(`✅ ${count} script(s) imported!`, "success");
        }
      } else if (file.name.endsWith('.sql')) {
        const lines = content.split('\n');
        let title = 'Imported script';
        let database = 'Oracle';
        let category = 'Others';

        lines.forEach(line => {
          if (line.startsWith('-- ')) {
            const comment = line.substring(3).trim();
            if (comment.startsWith('Title:')) title = comment.substring(6).trim();
            if (comment.startsWith('Database:')) database = comment.substring(9).trim();
            if (comment.startsWith('Category:')) category = comment.substring(9).trim();
          }
        });

        await supabase.from("scripts").insert({
          title,
          database,
          category,
          code: content,
          created_at: new Date().toISOString()
        });

        showToast("✅ SQL script imported!", "success");
      }
      
      setTimeout(() => showHome(), 1500);
    } catch (error) {
      showToast("❌ Import error: " + error.message, "error");
    }
  };
  reader.readAsText(file);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileNav');
  menu.classList.toggle('hidden');
}

function renderScriptCard2(script) {
  const dbIcon = script.database === "Oracle" ? "🔶" : "🔷";
  const catIcon = categoryIcons[script.category] || "📋";
  const isFav = isFavorite(script.id);
  
  // NOUVEAU DESIGN DE CARTE
  return `
    <div class="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition duration-500 transform hover:-translate-y-1 hover:scale-[1.005] border border-gray-200 flex items-center justify-between cursor-pointer group"
         onclick="showScriptDetail(${script.id})"
         onmouseenter="showScriptPreview(event, ${script.id})" 
         onmouseleave="hideScriptPreview()">
      
      <div class="flex items-center space-x-4 flex-1 min-w-0">
        
               
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-semibold text-gray-900 leading-tight truncate">${escapeHtml(script.title)}</h3>
       

        </div>
      </div>

      <div class="flex items-center space-x-4 flex-shrink-0 ml-4">
        
        <button class="text-gray-400 hover:text-yellow-500 transition duration-300 transform hover:scale-125 focus:outline-none" 
                onclick="event.stopPropagation(); toggleFavorite(${script.id})" 
                data-favorite-id="${script.id}">
          ${isFav ? 
            '<svg class="w-6 h-6 fill-current text-yellow-500" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>' : 
            '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.974 2.887a1 1 0 00-.363 1.118l1.519 4.674c.3.921-.755 1.688-1.538 1.118l-3.974-2.887a1 1 0 00-1.176 0l-3.974 2.887c-.783.57-1.838-.197-1.538-1.118l1.519-4.674a1 1 0 00-.363-1.118l-3.974-2.887c-.783-.57-.381-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z"></path></svg>'}
        </button>

        <svg class="w-6 h-6 text-indigo-400 group-hover:text-indigo-600 transition duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
      </div>
    </div>
  `;
}

function renderScriptCard(script) {
  const dbIcon = script.database === "Oracle" ? "🔶" : "🔷";
  const catIcon = categoryIcons[script.category] || "📋";
  const isFav = isFavorite(script.id);
  
  // NOUVEAU DESIGN DE CARTE
  return `
    <div class="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition duration-500 transform hover:-translate-y-1 hover:scale-[1.005] border border-gray-200 flex items-center justify-between cursor-pointer group"
         onclick="showScriptDetail(${script.id})"
         onmouseenter="showScriptPreview(event, ${script.id})" 
         onmouseleave="hideScriptPreview()">
      
      <div class="flex items-center space-x-4 flex-1 min-w-0">
        
        <div class="p-3 rounded-xl bg-indigo-50 text-indigo-600 text-3xl flex-shrink-0 shadow-inner flex items-center justify-center">
          <span class="text-2xl">${dbIcon}</span>
        </div>
        
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-semibold text-gray-900 leading-tight truncate">${escapeHtml(script.title)}</h3>
          <p class="text-gray-600 text-sm mt-1 truncate">${escapeHtml(script.description || "Aucune description fournie.")}</p>
          
          <div class="flex items-center text-gray-400 text-xs mt-2 space-x-3">
            <span class="flex items-center gap-1">
              <span>${catIcon}</span>
              <span>${script.category}</span>
            </span>
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <span>${new Date(script.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </span>
            ${script.added_by ? `
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                <span>${escapeHtml(script.added_by)}</span>
              </span>
            ` : ''}
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-4 flex-shrink-0 ml-4">
        
        <button class="text-gray-400 hover:text-yellow-500 transition duration-300 transform hover:scale-125 focus:outline-none" 
                onclick="event.stopPropagation(); toggleFavorite(${script.id})" 
                data-favorite-id="${script.id}">
          ${isFav ? 
            '<svg class="w-6 h-6 fill-current text-yellow-500" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>' : 
            '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.974 2.887a1 1 0 00-.363 1.118l1.519 4.674c.3.921-.755 1.688-1.538 1.118l-3.974-2.887a1 1 0 00-1.176 0l-3.974 2.887c-.783.57-1.838-.197-1.538-1.118l1.519-4.674a1 1 0 00-.363-1.118l-3.974-2.887c-.783-.57-.381-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z"></path></svg>'}
        </button>

        <svg class="w-6 h-6 text-indigo-400 group-hover:text-indigo-600 transition duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
      </div>
    </div>
  `;
}

let tooltipElement = null;
let currentTooltipScript = null;

async function showScriptPreview(event, scriptId) {
  if (currentTooltipScript === scriptId && tooltipElement) return;
  
  const { data: script, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", scriptId)
    .single();

  if (error || !script) return;

  currentTooltipScript = scriptId;

  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'script-tooltip';
    document.body.appendChild(tooltipElement);
  }

  const codePreview = script.code.length > 500 
    ? script.code.substring(0, 500) + '...' 
    : script.code;

  tooltipElement.innerHTML = `
    <div class="script-tooltip-header">📝 SQL Code Preview</div>
    <pre><code class="language-sql">${escapeHtml(codePreview)}</code></pre>
  `;

  const rect = event.currentTarget.getBoundingClientRect();
  tooltipElement.style.left = `${rect.left}px`;
  tooltipElement.style.top = `${rect.bottom + 10}px`;

  setTimeout(() => {
    const tooltipRect = tooltipElement.getBoundingClientRect();
    if (tooltipRect.right > window.innerWidth) {
      tooltipElement.style.left = `${window.innerWidth - tooltipRect.width - 20}px`;
    }
  }, 0);

  tooltipElement.classList.add('show');

  setTimeout(() => {
    tooltipElement.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }, 50);
}

function hideScriptPreview() {
  if (tooltipElement) {
    tooltipElement.classList.remove('show');
    currentTooltipScript = null;
  }
}

async function loadRecentScripts() {
  const container = document.getElementById('recentScriptsList');
  
  if (!container) {
    console.error('Container recentScriptsList not found');
    return;
  }

  try {
    const { data, error } = await supabase
      .from("scripts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error('Supabase error:', error);
      container.innerHTML = `
        <div class="text-center py-8 text-red-500">
          <p class="text-lg">Error loading scripts</p>
        </div>
      `;
      return;
    }
	allScripts = data.filter(script => userRole === 'admin' || script.visibility === 'public');
    const recentScripts = data.filter(script => userRole === 'admin' || script.visibility === 'public');
    allScripts = [...new Set([...allScripts, ...recentScripts])];
	
    if (!recentScripts || data.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-700">
          <p class="text-lg">No scripts available</p>
          <button onclick="${user ? 'showAdmin()' : 'showLogin()'}" class="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
            ➕ Add the first script
          </button>
        </div>
      `;
      return;
    }
	
    console.log('Scripts loaded:', data);
 	container.innerHTML = recentScripts.map(script => renderScriptCard(script)).join('');
  } catch (err) {
    console.error('Error loading recent scripts:', err);
    container.innerHTML = `
      <div class="text-center py-8 text-red-500">
        <p class="text-lg">Erreur: ${err.message}</p>
      </div>
    `;
  }
}

async function searchScripts() {
  const query = document.getElementById("searchInput").value.toLowerCase().trim();
  
  if (!query) {
    showToast("Please enter a search term", "error");
    return;
  }
  
  // Amélioration de la recherche côté serveur (comme suggéré dans la première réponse)
  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    
	.or(`title.ilike.%${query}%, description.ilike.%${query}%`)

  if (error) {
    showToast("Search error", "error");
    return;
  }
const results = data.filter(script => userRole === 'admin' || script.visibility === 'public');
  displaySearchResults(results, query);
}

function displaySearchResults(results, query) {
  const content = document.getElementById("content");
  
  if (results.length === 0) {
    content.innerHTML = `
      <section class="max-w-5xl mx-auto py-12 px-4 text-center animate-fade-in">
        <div class="bg-white p-12 rounded-xl shadow-lg">
          <div class="text-6xl mb-4">🔍</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-4">No results found</h2>
          <p class="text-gray-600 mb-6">No script matches "${escapeHtml(query)}"</p>
          <button onclick="showHome()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
            ← Back to home
          </button>
        </div>
      </section>
    `;
    return;
  }

  content.innerHTML = `
    <section class="max-w-5xl mx-auto py-12 px-4 animate-fade-in">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold text-gray-800 mb-2">🔍 Search Results</h2>
          <p class="text-gray-600">${results.length} result(s) for "${escapeHtml(query)}"</p>
        </div>
        <button onclick="showHome()" class="px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition font-medium">
          ← Back
        </button>
      </div>
      <div class="space-y-4">
        ${results.map(script => renderScriptCard(script)).join('')}
      </div>
    </section>
  `;
}

function showHome() {
  document.getElementById("content").innerHTML = `
    <section class="gradient-bg text-white py-20 px-4">
      <div class="max-w-4xl mx-auto text-center animate-fade-in">
        <h1 class="text-5xl font-bold mb-6">📚 DBA Script Manager</h1>
        <p class="text-xl text-purple-100 mb-8 leading-relaxed">
          Centralize, organize and share your SQL scripts for Oracle and SQL Server.
        </p>
        <div class="flex flex-wrap gap-4 justify-center">
          <button onclick="showCategoriesByDatabase('Oracle')" class="px-6 py-3 bg-white text-purple-700 rounded-lg hover:shadow-xl transition transform hover:scale-105 font-semibold">
            🔶 Oracle Scripts
          </button>
          <button onclick="showCategoriesByDatabase('SQL Server')" class="px-6 py-3 bg-white text-indigo-700 rounded-lg hover:shadow-xl transition transform hover:scale-105 font-semibold">
            🔷 SQL Server Scripts
          </button>
          <button onclick="${user && userRole === 'admin' ? 'showAdmin()' : 'showLogin()'}" class="px-6 py-3 bg-purple-900 text-white rounded-lg hover:shadow-xl transition transform hover:scale-105 font-semibold border-2 border-white">
            🔐 Admin Panel
          </button>
        </div>
      </div>
    </section>

    <section class="max-w-6xl mx-auto py-16 px-4">
      <h2 class="text-3xl font-bold text-center text-gray-800 mb-8">🔍 Quick Search</h2>
      <div class="max-w-2xl mx-auto mb-12">
        <div class="relative">
          <input 
            type="text" 
            id="searchInput" 
            placeholder="Search for a script..." 
            class="w-full px-6 py-4 pr-12 text-lg border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-lg"
            onkeyup="if(event.key === 'Enter') searchScripts()"
          />
          <button onclick="searchScripts()" class="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            🔍
          </button>
        </div>
      </div>

      <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">✨ Features</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-white p-6 rounded-xl shadow-lg card-hover text-center">
          <div class="text-5xl mb-4">🔍</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Search</h3>
          <p class="text-gray-600">Find your scripts instantly</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-lg card-hover text-center">
          <div class="text-5xl mb-4">⭐</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Favorites</h3>
          <p class="text-gray-600">Save your favorite scripts</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-lg card-hover text-center">
          <div class="text-5xl mb-4">🌙</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Dark Mode</h3>
          <p class="text-gray-600">Work comfortably</p>
        </div>
      </div>
    </section>


  <section class="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8 animate-fade-in">
    <div class="bg-gradient-to-br from-gray-50 to-indigo-100 p-8 rounded-3xl shadow-2xl relative overflow-hidden border border-gray-200">
        
        <span class="absolute top-0 right-0 -mt-2 -mr-2 px-4 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-full shadow-lg transform rotate-6 z-10 tracking-wider">
            HOT
        </span>
        
        <h2 class="text-4xl font-extrabold text-gray-900 mb-8 text-center tracking-tight">
            <span class="inline-block bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
               Recently added scripts
            </span>
        </h2>
        
        <div id="recentScriptsList" class="grid grid-cols-1 gap-6">
            </div>
    </div>
  </section>

  `;
  
  loadRecentScripts();
}

function showCategoriesByDatabase(dbType) {
  supabase
    .from("scripts")
    .select("category")
    .eq("database", dbType)
    .then(({ data, error }) => {
      if (error) {
        showToast("Loading error", "error");
        return;
      }

      const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))];
      const dbIcon = dbType === "Oracle" ? "🔶" : "🔷";

      document.getElementById("content").innerHTML = `
        <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
          <div class="text-center mb-12">
            <h2 class="text-4xl font-bold text-gray-800 mb-4">${dbIcon} ${dbType} Categories</h2>
            <p class="text-gray-600">Select a category to see available scripts</p>
          </div>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${uniqueCategories.map(cat => `
              <button onclick="loadCategoryByDatabase('${dbType}', '${cat}')" 
                class="bg-white p-6 rounded-xl shadow-lg card-hover text-left border-l-4 border-purple-500">
                <div class="flex items-center space-x-3">
                  <span class="text-4xl">${categoryIcons[cat] || "📋"}</span>
                  <div>
                    <h3 class="text-xl font-bold text-gray-800">${cat}</h3>
                    <p class="text-sm text-gray-500">View scripts</p>
                  </div>
                </div>
              </button>
            `).join('')}
          </div>
        </section>
      `;
    });
}

function sortScripts(scripts, sortType) {
  const sorted = [...scripts];
  switch(sortType) {
    case 'recent':
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    case 'old':
      return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    case 'alpha':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
}

function filterScriptsInList(query) {
  const searchTerm = query.toLowerCase();
  
  if (!searchTerm) {
    filteredScripts = [...allScripts];
  } else {
    filteredScripts = allScripts.filter(script => {
      const titleMatch = script.title.toLowerCase().includes(searchTerm);
      const descMatch = script.description && script.description.toLowerCase().includes(searchTerm);
      const tagsMatch = script.tags && Array.isArray(script.tags) && 
        script.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      
      return titleMatch || descMatch || tagsMatch;
    });
  }
  
  currentPage = 1;
  renderScriptList();
}

function updateSortButtons() {
    const sortButtons = document.querySelectorAll('.sort-btn');
    sortButtons.forEach(btn => {
        btn.classList.remove('active-sort');
        btn.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
        if (btn.dataset.sort === currentSort) {
            btn.classList.add('active-sort');
            btn.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
        }
    });
}

function changeSortInList(sortType) {
  currentSort = sortType;
  filteredScripts = sortScripts(filteredScripts, sortType);
  currentPage = 1;
  renderScriptList();
}

function renderScriptList() {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedScripts = filteredScripts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredScripts.length / itemsPerPage);

  const listContainer = document.getElementById('scriptsList');
  const paginationContainer = document.getElementById('paginationControls');
  const counterContainer = document.getElementById('scriptsCounter');

  counterContainer.innerHTML = `
    <p class="text-gray-600">
      ${filteredScripts.length} script(s) • Page ${currentPage} of ${totalPages || 1}
    </p>
  `;

  if (paginatedScripts.length === 0) {
    listContainer.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-500">
        <div class="text-6xl mb-4">📭</div>
        <p class="text-xl">No scripts found</p>
      </div>
    `;
  } else {
    listContainer.innerHTML = paginatedScripts.map(script => renderScriptCard2(script)).join('');
  }

  const pageNumbers = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  paginationContainer.innerHTML = `
    <div class="flex items-center justify-center gap-2 flex-wrap">
      <button 
        onclick="changePage(${currentPage - 1})" 
        ${currentPage === 1 ? 'disabled' : ''}
        class="pagination-btn px-4 py-2 bg-white border-2 border-purple-300 text-purple-600 rounded-lg font-medium hover:bg-purple-50">
        ← Previous
      </button>

      ${pageNumbers.map(num => `
        <button 
          onclick="changePage(${num})" 
          class="pagination-btn px-4 py-2 ${num === currentPage ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg font-medium">
          ${num}
        </button>
      `).join('')}

      <button 
        onclick="changePage(${currentPage + 1})" 
        ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}
        class="pagination-btn px-4 py-2 bg-white border-2 border-purple-300 text-purple-600 rounded-lg font-medium hover:bg-purple-50">
        Next →
      </button>
    </div>
  `;
  
  updateSortButtons();
}

function changePage(newPage) {
  const totalPages = Math.ceil(filteredScripts.length / itemsPerPage);
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderScriptList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function loadCategoryByDatabase(dbType, category) {
  supabase
    .from("scripts")
    .select("*")
    .eq("database", dbType)
    .eq("category", category)
    .order("created_at", { ascending: false })
    .then(({ data, error }) => {
      if (error) {
        showToast("Loading error", "error");
        return;
      }

      allScripts = data.filter(script => userRole === 'admin' || script.visibility === 'public');
      filteredScripts = [...allScripts]; // Important d'initialiser filteredScripts avec les données filtrées
      currentPage = 1;
      currentSort = 'recent';
	  

      const dbIcon = dbType === "Oracle" ? "🔶" : "🔷";
      
      document.getElementById("content").innerHTML = `
        <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
          <button onclick="showCategoriesByDatabase('${dbType}')" 
            class="mb-6 px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition font-medium">
            ← Back to categories
          </button>

          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-800 mb-2">${dbIcon} ${dbType} — ${categoryIcons[category] || ""} ${category}</h2>
            <div id="scriptsCounter"></div>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div class="grid md:grid-cols-2 gap-4 mb-4">
              <div class="relative">
                <input 
                  type="text" 
                  placeholder="Filter in this category..." 
                  class="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  oninput="filterScriptsInList(this.value)"
                />
                <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              </div>

              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-medium text-gray-700">Sort:</span>
                <button onclick="changeSortInList('recent')" data-sort="recent"
                  class="sort-btn px-3 py-2 text-sm rounded-lg font-medium transition">
                  📅 Recent
                </button>
                <button onclick="changeSortInList('old')" data-sort="old"
                  class="sort-btn px-3 py-2 text-sm rounded-lg font-medium transition">
                  📆 Oldest
                </button>
                <button onclick="changeSortInList('alpha')" data-sort="alpha"
                  class="sort-btn px-3 py-2 text-sm rounded-lg font-medium transition">
                  🔤 A-Z
                </button>
              </div>
            </div>

            <div class="flex items-center gap-3 text-sm">
              <span class="text-gray-700 font-medium">Show:</span>
              <select 
                onchange="itemsPerPage = parseInt(this.value); currentPage = 1; renderScriptList();"
                class="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option value="10">10 per page</option>
                <option value="20" selected>20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
          </div>

          <div id="scriptsList" class="grid gap-4 mb-8"></div>
          <div id="paginationControls" class="mb-4"></div>
        </section>
      `;

      renderScriptList();
    });
}

async function showScriptDetail(id) {
  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    showToast("Loading error", "error");
    return;
  }

  const script = data;
  const dbIcon = script.database === "Oracle" ? "🔶" : "🔷";
  const isFav = isFavorite(script.id);
  let tagsDisplay = script.tags && Array.isArray(script.tags) ? 
    script.tags.map(tag => `<span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">#${escapeHtml(tag)}</span>`).join(' ') : 
    '<span class="text-gray-500">None</span>';

  document.getElementById("content").innerHTML = `
    <section class="max-w-4xl mx-auto py-12 px-4 animate-fade-in">
      <button onclick="loadCategoryByDatabase('${script.database}', '${script.category}')" 
        class="mb-6 px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition font-medium">
        ← Back to ${script.category}
      </button>
      
      <div class="bg-white rounded-xl shadow-xl overflow-hidden">
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center space-x-3">
              <span class="text-3xl">${dbIcon}</span>
              <span class="text-3xl">${categoryIcons[script.category] || "📋"}</span>
            </div>
            <button onclick="toggleFavorite(${script.id})" class="favorite-icon text-3xl ${isFav ? 'active' : ''}" data-favorite-id="${script.id}">
              ${isFav ? '⭐' : '☆'}
            </button>
          </div>
          <h2 class="text-3xl font-bold mb-2">${escapeHtml(script.title)}</h2>
          <p class="text-purple-100">${escapeHtml(script.description || "")}</p>
        </div>

        <div class="p-6">
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-3">📝 SQL Code</h3>
            <div class="relative">
              <pre><code id="scriptCode" class="language-sql">${escapeHtml(script.code || "")}</code></pre>
              <button onclick="copyScript()" 
                class="absolute top-2 right-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
                📋 Copy
              </button>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 class="font-semibold text-gray-700 mb-2">ℹ️ Information</h4>
              <div class="space-y-2 text-sm">
                <p><span class="font-medium">Database:</span> ${script.database}</p>
                <p><span class="font-medium">Category:</span> ${script.category}</p>
                <p><span class="font-medium">Created:</span> ${new Date(script.created_at).toLocaleDateString('en-US')}</p>
              </div>
            </div>
            <div>
              <h4 class="font-semibold text-gray-700 mb-2">🏷️ Tags</h4>
              <div class="flex flex-wrap gap-2">
                ${tagsDisplay}
              </div>
            </div>
          </div>

          ${script.prerequis ? `
            <div class="mb-6">
              <h4 class="font-semibold text-gray-700 mb-2">⚠️ Prerequisites</h4>
              <p class="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">${escapeHtml(script.prerequis)}</p>
            </div>
          ` : ''}

          ${script.notes ? `
            <div class="mb-6">
              <h4 class="font-semibold text-gray-700 mb-2">📌 Notes</h4>
              <p class="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg whitespace-pre-wrap">${escapeHtml(script.notes)}</p>
            </div>
          ` : ''}

          <div class="grid md:grid-cols-2 gap-3 pt-4 border-t">
            <button onclick="copyScript()" 
              class="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
              📋 Copy
            </button>
            <button onclick="exportScriptSQL(${script.id})" 
              class="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              📥 Export SQL
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
  
  setTimeout(() => {
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }, 100);
}

function copyScript() {
  const codeElement = document.querySelector("#scriptCode");
  if (!codeElement) return;
  
  navigator.clipboard.writeText(codeElement.textContent).then(() => {
    showToast("📋 Script copied!", "success");
  }).catch(() => {
    showToast("Copy error", "error");
  });
}

async function deleteScript(id) {
  // Le RLS de Supabase garantit que seul un Admin peut exécuter ceci
  const { error } = await supabase.from("scripts").delete().eq("id", id);
  
  if (error) {
    showToast("Deletion error: Permission denied or script not found", "error");
  } else {
    showToast("✅ Script deleted!", "success");
    setTimeout(() => showAdmin(), 1000);
  }
}

// FONCTION MODIFIÉE : showAdmin (Suppression de la vérification du mot de passe hardcodé)
// La fonction doit être async pour pouvoir utiliser await
// Dans app.js, trouvez la fonction showAdmin et remplacez-la entièrement.
// Fonction pour afficher le panneau d'administration
// REMPLACEZ VOTRE ANCIENNE FONCTION 'showAdmin' PAR CELLE-CI :

async function showAdmin() {
    
    // 1. On demande à Supabase "Qui est l'utilisateur ACTUEL ?"
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // 2. Si personne n'est connecté, on affiche la page de login.
    if (!currentUser) {
        showToast("❌ Accès refusé. Veuillez vous connecter.", "error");
        showLogin();
        return;
    }

    // 3. Si un utilisateur est connecté, on vérifie son rôle dans la table 'profiles'
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

    // 4. Si erreur OU si le rôle n'est pas 'admin', on refuse l'accès.
    if (error || !profile || profile.role !== 'admin') {
        showToast("❌ Accès Admin refusé. Vous n'avez pas les permissions.", "error");
        // L'utilisateur est connecté, mais n'est pas admin. On le renvoie à l'accueil.
        showHome();
        return;
    }

    // 5. SUCCÈS ! L'utilisateur est connecté ET est admin.
    // On met à jour les variables globales (par sécurité)
    user = currentUser;
    userRole = profile.role;
    
    // 6. On charge le contenu du panneau d'administration (votre code d'origine)
    supabase.from("scripts").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
        if (error) {
            showToast("Erreur de chargement", "error");
            return;
        }

        // C'est ici que votre HTML pour 'Ajouter/Modifier/Supprimer' est généré
        document.getElementById("content").innerHTML = `
            <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
                <div class="bg-white rounded-xl shadow-xl p-8 mb-8">
                    <h2 class="text-3xl font-bold text-gray-800 mb-6">🔐 Administration (${user.email})</h2>
                    
                    <div class="flex gap-4 mb-6 border-b">
                        <button onclick="showAdminTab('add')" id="tabAdd" class="px-6 py-3 font-semibold border-b-2 border-purple-600 text-purple-600">
                            ➕ Add a script
                        </button>
                        <button onclick="showAdminTab('manage')" id="tabManage" class="px-6 py-3 font-semibold text-gray-600 hover:text-purple-600">
                            🗑️ Manage scripts (${data.length})
                        </button>
                        <button onclick="showAdminTab('import')" id="tabImport" class="px-6 py-3 font-semibold text-gray-600 hover:text-purple-600">
                            📤 Import/Export
                        </button>
                    </div>

                    <div id="adminTabContent"></div>
                </div>
            </section>
        `;

        window.adminScripts = data;
        // Affiche l'onglet "Ajouter un script" par défaut
        showAdminTab('add'); 
    });
}


function showAdminTab(tab) {
  document.getElementById('tabAdd').className = tab === 'add' 
    ? 'px-6 py-3 font-semibold border-b-2 border-purple-600 text-purple-600'
    : 'px-6 py-3 font-semibold text-gray-600 hover:text-purple-600';
  
  document.getElementById('tabManage').className = tab === 'manage'
    ? 'px-6 py-3 font-semibold border-b-2 border-purple-600 text-purple-600'
    : 'px-6 py-3 font-semibold text-gray-600 hover:text-purple-600';
  
  document.getElementById('tabImport').className = tab === 'import'
    ? 'px-6 py-3 font-semibold border-b-2 border-purple-600 text-purple-600'
    : 'px-6 py-3 font-semibold text-gray-600 hover:text-purple-600';

  const content = document.getElementById('adminTabContent');

  if (tab === 'add') {
    content.innerHTML = `
      <form onsubmit="addScript(event)" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
          <input name="title" type="text" required 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Ex: Check disk space" />
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Database *</label>
            <select name="database" required 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              <option value="Oracle">🔶 Oracle</option>
              <option value="SQL Server">🔷 SQL Server</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
            <select name="category" required 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              ${categories.map(c => `<option value="${c}">${categoryIcons[c] || ""} ${c}</option>`).join('')}
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">SQL Code *</label>
          <textarea name="code" required rows="8"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            placeholder="SELECT * FROM ..."></textarea>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea name="description" rows="3"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Script description"></textarea>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Tags (comma separated)</label>
          <input name="tags" type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="space, disk, monitoring" />
        </div>

		<div class="mb-4">
		<label for="visibility" class="block text-sm font-medium text-gray-700">Visibilité du Script</label>
		<select name="visibility" id="visibility" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500">
        <option value="public" selected>Public (Visible par tous)</option>
        <option value="admin_only">Admin Only (Visible par les admins connectés)</option>
    </select>
		</div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Prerequisites</label>
          <input name="prerequis" type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="DBA rights required..." />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
          <textarea name="notes" rows="3"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Usage notes"></textarea>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="submit" 
            class="flex-1 px-6 py-3 btn-primary text-white rounded-lg font-semibold">
            💾 Save script
          </button>
          <button type="button" onclick="showHome()"
            class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold">
            Cancel
          </button>
        </div>
		

      </form>
    `;
  } else if (tab === 'manage') {
    const scripts = window.adminScripts || [];
    
    content.innerHTML = `
      <div class="mb-4">
        <input 
          type="text" 
          id="adminSearchInput"
          placeholder="🔍 Search for a script to manage..." 
          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          oninput="filterAdminScripts(this.value)"
        />
      </div>

      <div class="bg-gray-50 p-4 rounded-lg mb-4">
        <p class="text-sm text-gray-600">
          <strong>${scripts.length}</strong> scripts total • Click on a script to manage it
        </p>
      </div>

      <div id="adminScriptsList" class="space-y-3 max-h-96 overflow-y-auto">
        ${scripts.map(script => `
          <div class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 transition">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span>${script.database === 'Oracle' ? '🔶' : '🔷'}</span>
                  <span>${categoryIcons[script.category] || '📋'}</span>
                  <span class="text-xs px-2 py-1 bg-gray-100 rounded">${script.database}</span>
                  <span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">${script.category}</span>
                </div>
                <h3 class="font-bold text-gray-800 mb-1">${escapeHtml(script.title)}</h3>
                <p class="text-sm text-gray-600 mb-2">${escapeHtml(script.description || 'No description')}</p>
                <p class="text-xs text-gray-500">Created ${new Date(script.created_at).toLocaleDateString('en-US')}</p>
              </div>
              <div class="flex gap-2 ml-4">
                <button onclick="showScriptDetail(${script.id})" 
                  class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                  👁️ View
                </button>
                <button onclick="confirmDeleteScript(${script.id}, '${escapeHtml(script.title).replace(/'/g, "\\'")}')" 
                  class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (tab === 'import') {
    content.innerHTML = `
      <div class="space-y-6">
        <div class="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center">
          <input type="file" id="fileInput" accept=".json,.sql" class="hidden" onchange="handleFileImport(event)" />
          <button onclick="document.getElementById('fileInput').click()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
            📁 Choose a file to import
          </button>
          <p class="text-gray-600 mt-4">Accepted formats: JSON, SQL</p>
        </div>

        <div class="bg-blue-50 p-6 rounded-xl">
          <h3 class="font-bold text-gray-800 mb-2">💡 Supported formats:</h3>
          <ul class="text-sm text-gray-700 space-y-1">
            <li>• <strong>JSON</strong>: Complete export with metadata</li>
            <li>• <strong>SQL</strong>: SQL file with comments</li>
          </ul>
        </div>

        <div class="bg-green-50 p-6 rounded-xl">
          <h3 class="font-bold text-gray-800 mb-3">📥 Export all scripts</h3>
          <p class="text-sm text-gray-700 mb-4">Download all your scripts with favorites and metadata in JSON format</p>
          <button onclick="exportUserData()" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
            📥 Export all data
          </button>
        </div>
      </div>
    `;
  }
}

function filterAdminScripts(query) {
  const scripts = window.adminScripts || [];
  const searchTerm = query.toLowerCase();
  
  const filtered = searchTerm 
    ? scripts.filter(script => {
        return script.title.toLowerCase().includes(searchTerm) ||
               (script.description && script.description.toLowerCase().includes(searchTerm)) ||
               script.database.toLowerCase().includes(searchTerm) ||
               script.category.toLowerCase().includes(searchTerm);
      })
    : scripts;

  const listContainer = document.getElementById('adminScriptsList');
  listContainer.innerHTML = filtered.map(script => `
    <div class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 transition">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span>${script.database === 'Oracle' ? '🔶' : '🔷'}</span>
            <span>${categoryIcons[script.category] || '📋'}</span>
            <span class="text-xs px-2 py-1 bg-gray-100 rounded">${script.database}</span>
            <span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">${script.category}</span>
          </div>
          <h3 class="font-bold text-gray-800 mb-1">${escapeHtml(script.title)}</h3>
          <p class="text-sm text-gray-600 mb-2">${escapeHtml(script.description || 'Pas de description')}</p>
          <p class="text-xs text-gray-500">Créé le ${new Date(script.created_at).toLocaleDateString('fr-FR')}</p>
        </div>
        <div class="flex gap-2 ml-4">
          <button onclick="showScriptDetail(${script.id})" 
            class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
            👁️ Voir
          </button>
          <button onclick="confirmDeleteScript(${script.id}, '${escapeHtml(script.title).replace(/'/g, "\\'")}')" 
            class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function confirmDeleteScript(id, title) {
  if (!confirm(`⚠️ Êtes-vous sûr de vouloir supprimer le script:\n\n"${title}"\n\nCette action est irréversible.`)) {
    return;
  }
  deleteScript(id);
}

// FONCTION MODIFIÉE : addScript (Utilise l'email de l'utilisateur connecté)
async function addScript(e) {
  e.preventDefault();
  
  if (!user) {
         showToast("❌ Vous devez être connecté pour ajouter un script.", "error");
         return;
    }

  const f = e.target;
  
  const script = {
    title: f.title.value.trim(),
    database: f.database.value,
    category: f.category.value,
    code: f.code.value.trim(),
    description: f.description.value.trim(),
    tags: f.tags.value.split(',').map(t => t.trim()).filter(t => t),
    added_by: user.email, // Utilisation de l'email de l'utilisateur connecté
	visibility: f.visibility.value,
    created_at: new Date().toISOString()
  };

  // L'insertion échouera au niveau de la BDD si l'utilisateur n'est pas "admin" (grâce à la Policy RLS)
  const { error } = await supabase.from("scripts").insert(script);
  
  if (error) {
    showToast("❌ Erreur d'ajout. Permission refusée. (Rôle Admin requis)", "error");
    console.error(error);
  } else {
    showToast("✅ Script ajouté !", "success");
    setTimeout(() => loadCategoryByDatabase(script.database, script.category), 1500);
  }
}

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