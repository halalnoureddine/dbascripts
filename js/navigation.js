// ==========================================
// 📄 js/navigation.js - Navigation (avec Dashboard intégré)
// ==========================================

// Afficher la page d'accueil
async function showHome() {
	
	sessionStorage.setItem('currentView', 'home');
    sessionStorage.removeItem('currentDatabase');
    sessionStorage.removeItem('currentCategory');
    
  let actionButton = '';
  
  if (user) {
    actionButton = `
      <button onclick="showContributorAddForm()" class="px-6 py-3 bg-gradient-to-r from-blue-900 to-red-100 text-white rounded-lg hover:shadow-xl transition transform hover:scale-105 font-semibold border-2 border-white">
        ➕ Ajouter un script
      </button>`;
  } 


document.getElementById("content").innerHTML = `
    <section class="gradient-bg text-white py-20 px-4">
      <div class="max-w-4xl mx-auto text-center animate-fade-in">
        <h1 class="text-5xl font-bold mb-6">📚 DBA Script Manager</h1>
        <p class="text-xl text-purple-100 mb-8 leading-relaxed">
          Centralisez, organisez et partagez vos scripts SQL pour Oracle, SQL Server et PostgreSQL.
        </p>
        <div class="flex flex-wrap gap-4 justify-center">
          <button onclick="showCategoriesByDatabase('Oracle')" class="px-6 py-3 bg-white text-purple-700 rounded-lg hover:shadow-xl transition transform hover:scale-105 font-semibold">
            🗄️  Oracle
          </button>
          <button onclick="showCategoriesByDatabase('SQL Server')" class="px-6 py-3 bg-white text-indigo-700 rounded-lg hover:shadow-xl transition transform hover:scale-105 font-semibold">
            ⚙️  SQL Server
          </button>
          <button onclick="showCategoriesByDatabase('PostgreSQL')" class="px-6 py-3 bg-white text-green-700 rounded-lg hover:shadow-xl transition transform hover:scale-105 font-semibold">
            🐘  PostgreSQL
          </button>
          ${actionButton}
        </div>
      </div>
    </section>

    <section class="max-w-6xl mx-auto py-16 px-4">
      <h2 class="text-3xl font-bold text-center text-gray-800 mb-8">🔍 Recherche Rapide</h2>
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
            🔎
          </button>
        </div>
      </div>

      <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">✨ Fonctionnalités</h2>
      <div class="grid md:grid-cols-3 gap-8">
        
		<div class="bg-white p-6 rounded-xl shadow-lg card-hover text-center" onclick="showScriptGenerator()">
          <div class="text-5xl mb-4">🚀</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Générateur</h3>
          <p class="text-gray-600"> Générateur de Scripts </p>
        </div>
		
        <div class="bg-white p-6 rounded-xl shadow-lg card-hover text-center" onclick="showPerformanceAnalyzer()" >
          <div class="text-5xl mb-4">🔥</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Performance</h3>
          <p class="text-gray-600"> Analyse de Performance </p>
        </div>
		
        <div class="bg-white p-6 rounded-xl shadow-lg card-hover text-center" onclick="showAIAnalyzer()">
          <div class="text-5xl mb-4">🤖</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Erreurs</h3>
          <p class="text-gray-600"> Analyseur d'Erreurs </p>
        </div>
	
      </div>
      
    </section>

    <!-- 📊 DASHBOARD ANALYTICS - Section complète -->
    <div id="dashboardContainer">
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
        <p class="text-gray-600">Chargement du tableau de bord...</p>
      </div>
    </div>

    <!-- Filtre utilisateur (si contributeur) -->
    ${renderUserScriptFilter()}
  `;
  
  // Charger le dashboard de manière asynchrone
  loadAndDisplayDashboard();
}

// Fonction pour charger et afficher le dashboard
async function loadAndDisplayDashboard() {
    const container = document.getElementById('dashboardContainer');
    if (!container) return;
    
    try {
        const dashboardHTML = await renderDashboard();
        container.innerHTML = dashboardHTML;
    } catch (error) {
        console.error('Error rendering dashboard:', error);
        container.innerHTML = `
            <div class="max-w-5xl mx-auto py-12 px-4 text-center">
                <div class="bg-red-50 border-2 border-red-200 rounded-xl p-8">
                    <p class="text-red-600 text-lg">❌ Erreur lors du chargement du tableau de bord</p>
                    <button onclick="loadAndDisplayDashboard()" class="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                        🔄 Réessayer
                    </button>
                </div>
            </div>
        `;
    }
}

// Afficher les catégories par base de données
function showCategoriesByDatabase(dbType) {
    // NOUVEAU : Sauvegarder le contexte de navigation
    sessionStorage.setItem('currentView', 'categories');
    sessionStorage.setItem('currentDatabase', dbType);
    
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
            const dbIcon = dbType === "Oracle" ? "🗄️" : dbType === "SQL Server" ? "⚙️" : "🐘";

            document.getElementById("content").innerHTML = `
                <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
                    <button onclick="showHome()" class="mb-6 px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition font-medium">
                        ← Retour à l'accueil
                    </button>
                    
                    
                    <div class="text-center mb-12">
                        <h2 class="text-4xl font-bold text-gray-800 mb-4">${dbIcon} ${dbType} Categories</h2>
                        <p class="text-gray-600">Select a category to see available scripts</p>
                    </div>
					
					                    <!-- NOUVEAU : Afficher le filtre ici aussi -->
                    ${renderUserScriptFilter()}
					
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

// Charger une catégorie spécifique
function loadCategoryByDatabase(dbType, category) {
    // NOUVEAU : Sauvegarder le contexte de navigation
    sessionStorage.setItem('currentView', 'category');
    sessionStorage.setItem('currentDatabase', dbType);
    sessionStorage.setItem('currentCategory', category);
    
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

            // UTILISATION DE LA FONCTION CENTRALISÉE
            const scriptsToDisplay = filterScriptsByUserPreference(data);
            allScripts = scriptsToDisplay;
            filteredScripts = [...allScripts];
            currentPage = 1;
            currentSort = 'recent';

            const dbIcon = dbType === "Oracle" ? "🗄️" : dbType === "SQL Server" ? "⚙️" : "🐘";
            
            document.getElementById("content").innerHTML = `
                <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
                    <button onclick="showCategoriesByDatabase('${dbType}')" 
                        class="mb-6 px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition font-medium">
                        ← Back to categories
                    </button>
                    

                    <div class="text-center mb-8">
                        <h2 class="text-3xl font-bold text-gray-800 mb-2">${dbIcon} ${dbType} – ${categoryIcons[category] || ""} ${category}</h2>
                        <div id="scriptsCounter"></div>
                    </div>

                    <!-- NOUVEAU : Afficher le filtre ici aussi -->
                    ${renderUserScriptFilter()} 
					
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

// Rechercher des scripts
async function searchScripts() {
    const query = document.getElementById("searchInput").value.toLowerCase().trim();
    
    if (!query) {
        showToast("Please enter a search term", "error");
        return;
    }
    
    const { data, error } = await supabase
        .from("scripts")
        .select("*")
        .or(`title.ilike.%${query}%, description.ilike.%${query}%`);

    if (error) {
        showToast("Search error", "error");
        return;
    }

    // UTILISATION DE LA FONCTION CENTRALISÉE
    const results = filterScriptsByUserPreference(data);
    displaySearchResults(results, query);
}

// Afficher les résultats de recherche
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