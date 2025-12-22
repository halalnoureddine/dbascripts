// ==========================================
// 🔍 js/search.js - Recherche Avancée
// ==========================================

// ==========================================
// 1. VARIABLES GLOBALES DE RECHERCHE
// ==========================================

let searchHistory = [];
let searchSuggestions = [];
let allScriptsForSearch = [];
let searchTimeout = null;

// ==========================================
// 2. INITIALISATION - CHARGER DONNÉES
// ==========================================

async function initializeSearch() {
    // Charger l'historique depuis localStorage
    searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    // Charger tous les scripts pour les suggestions
    try {
        const { data, error } = await supabase
            .from('scripts')
            .select('id, title, description, code, database, category, tags, added_by');
        
        if (!error && data) {
            allScriptsForSearch = filterScriptsByUserPreference(data);
        }
    } catch (err) {
        console.error('Error loading scripts for search:', err);
    }
}

// Appeler l'initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    initializeSearch();
});

// ==========================================
// 3. AFFICHER LA PAGE DE RECHERCHE AVANCÉE
// ==========================================

function showAdvancedSearch() {
    sessionStorage.setItem('currentView', 'advanced-search');
    
    document.getElementById("content").innerHTML = `
        <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
            
            <!-- Header -->
            <div class="mb-8">
                <button onclick="showHome()" class="mb-4 px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition font-medium">
                    ← Retour à l'accueil
                </button>
                <h1 class="text-4xl font-bold text-gray-800 mb-3">
                    🔍 Recherche Avancée
                </h1>
                <p class="text-gray-600 text-lg">
                    Trouvez exactement ce que vous cherchez avec nos filtres avancés
                </p>
            </div>

            <!-- Zone de recherche principale -->
            <div class="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-purple-200">
                
                <!-- Barre de recherche avec suggestions -->
                <div class="relative mb-6">
                    <label class="block text-sm font-bold text-gray-800 mb-2">
                        🔎 Recherche globale
                    </label>
                    <div class="relative">
                        <input 
                            type="text" 
                            id="advancedSearchInput"
                            placeholder="Rechercher dans les titres, descriptions et code SQL..." 
                            class="w-full px-6 py-4 pr-32 text-lg border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-lg"
                            oninput="handleSearchInput(this.value)"
                            onfocus="showSearchSuggestions()"
                        />
                        <div class="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
                            <button 
                                onclick="clearSearch()"
                                class="px-3 py-2 text-gray-500 hover:text-red-600 rounded-lg transition"
                                title="Effacer">
                                ✕
                            </button>
                            <button 
                                onclick="performAdvancedSearch()"
                                class="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-xl transition font-bold">
                                Rechercher
                            </button>
                        </div>
                    </div>
                    
                    <!-- Zone de suggestions (masquée par défaut) -->
                    <div id="searchSuggestionsBox" class="hidden absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-purple-200 max-h-96 overflow-y-auto">
                        <!-- Les suggestions seront insérées ici -->
                    </div>
                </div>

                <!-- Filtres avancés -->
                <div class="border-t-2 border-gray-200 pt-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span class="text-xl">⚙️</span>
                            Filtres Avancés
                        </h3>
                        <button 
                            onclick="toggleAdvancedFilters()"
                            id="toggleFiltersBtn"
                            class="px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition font-medium text-sm">
                            Afficher les filtres
                        </button>
                    </div>
                    
                    <div id="advancedFiltersPanel" class="hidden space-y-6">
                        
                        <!-- Ligne 1: Base de données + Catégorie -->
                        <div class="grid md:grid-cols-2 gap-6">
                            
                            <!-- Base de données -->
                            <div>
                                <label class="block text-sm font-bold text-gray-800 mb-3">
                                    🗄️ Base de données
                                </label>
                                <div class="space-y-2">
                                    <label class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition cursor-pointer">
                                        <input type="checkbox" name="dbFilter" value="all" checked onchange="handleDbFilterChange(this)" class="mr-3 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500">
                                        <span class="text-gray-700 font-medium">Toutes les bases</span>
                                    </label>
                                    <label class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition cursor-pointer">
                                        <input type="checkbox" name="dbFilter" value="Oracle" onchange="handleDbFilterChange(this)" class="mr-3 w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500">
                                        <span class="text-gray-700">🔶 Oracle</span>
                                    </label>
                                    <label class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition cursor-pointer">
                                        <input type="checkbox" name="dbFilter" value="SQL Server" onchange="handleDbFilterChange(this)" class="mr-3 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                                        <span class="text-gray-700">🔷 SQL Server</span>
                                    </label>
                                    <label class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition cursor-pointer">
                                        <input type="checkbox" name="dbFilter" value="PostgreSQL" onchange="handleDbFilterChange(this)" class="mr-3 w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500">
                                        <span class="text-gray-700">🐘 PostgreSQL</span>
                                    </label>
                                </div>
                            </div>

                            <!-- Catégories -->
                            <div>
                                <label class="block text-sm font-bold text-gray-800 mb-3">
                                    📂 Catégories
                                </label>
                                <div class="space-y-2 max-h-64 overflow-y-auto pr-2">
                                    <label class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition cursor-pointer">
                                        <input type="checkbox" name="categoryFilter" value="all" checked onchange="handleCategoryFilterChange(this)" class="mr-3 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500">
                                        <span class="text-gray-700 font-medium">Toutes les catégories</span>
                                    </label>
                                    ${categories.map(cat => `
                                        <label class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition cursor-pointer">
                                            <input type="checkbox" name="categoryFilter" value="${cat}" onchange="handleCategoryFilterChange(this)" class="mr-3 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500">
                                            <span class="text-gray-700">${categoryIcons[cat] || '📋'} ${cat}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>

                        </div>

                        <!-- Ligne 2: Tags + Options de recherche -->
                        <div class="grid md:grid-cols-2 gap-6">
                            
                            <!-- Tags -->
                            <div>
                                <label class="block text-sm font-bold text-gray-800 mb-3">
                                    🏷️ Tags (séparés par des virgules)
                                </label>
                                <input 
                                    type="text" 
                                    id="tagsFilterInput"
                                    placeholder="Ex: performance, backup, monitoring"
                                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <p class="text-xs text-gray-500 mt-2">
                                    💡 Entrez plusieurs tags pour affiner la recherche
                                </p>
                            </div>

                            <!-- Options de recherche -->
                            <div>
                                <label class="block text-sm font-bold text-gray-800 mb-3">
                                    ⚡ Options de recherche
                                </label>
                                <div class="space-y-2">
                                    <label class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition cursor-pointer">
                                        <input type="checkbox" id="searchInCode" class="mr-3 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                                        <span class="text-gray-700">💻 Rechercher dans le code SQL</span>
                                    </label>
                                    <label class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition cursor-pointer">
                                        <input type="checkbox" id="exactMatch" class="mr-3 w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500">
                                        <span class="text-gray-700">🎯 Correspondance exacte</span>
                                    </label>
                                    <label class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 transition cursor-pointer">
                                        <input type="checkbox" id="caseSensitive" class="mr-3 w-5 h-5 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-500">
                                        <span class="text-gray-700">🔠 Sensible à la casse</span>
                                    </label>
                                </div>
                            </div>

                        </div>

                        <!-- Boutons d'action des filtres -->
                        <div class="flex gap-3 pt-4 border-t">
                            <button 
                                onclick="performAdvancedSearch()"
                                class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-xl transition font-bold">
                                🔍 Lancer la recherche
                            </button>
                            <button 
                                onclick="resetFilters()"
                                class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">
                                🔄 Réinitialiser
                            </button>
                        </div>

                    </div>
                </div>

            </div>

            <!-- Historique de recherche -->
            ${renderSearchHistory()}

            <!-- Zone de résultats -->
            <div id="searchResultsContainer">
                <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-xl p-12 text-center border-2 border-purple-200">
                    <div class="text-6xl mb-4">🔍</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-3">Prêt à rechercher</h3>
                    <p class="text-gray-600 mb-6">
                        Utilisez la barre de recherche ou les filtres avancés pour trouver vos scripts
                    </p>
                    <div class="flex gap-3 justify-center flex-wrap">
                        <button onclick="document.getElementById('advancedSearchInput').focus()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
                            Commencer la recherche
                        </button>
                        <button onclick="toggleAdvancedFilters()" class="px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg hover:bg-purple-50 transition font-medium">
                            Ouvrir les filtres
                        </button>
                    </div>
                </div>
            </div>

        </section>
    `;

    // Focus automatique sur le champ de recherche
    setTimeout(() => {
        document.getElementById('advancedSearchInput')?.focus();
    }, 100);
}

// ==========================================
// 4. GESTION DES FILTRES
// ==========================================

function toggleAdvancedFilters() {
    const panel = document.getElementById('advancedFiltersPanel');
    const btn = document.getElementById('toggleFiltersBtn');
    
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        btn.textContent = 'Masquer les filtres';
    } else {
        panel.classList.add('hidden');
        btn.textContent = 'Afficher les filtres';
    }
}

function handleDbFilterChange(checkbox) {
    const allCheckboxes = document.querySelectorAll('input[name="dbFilter"]');
    
    if (checkbox.value === 'all') {
        allCheckboxes.forEach(cb => {
            if (cb.value !== 'all') {
                cb.checked = false;
            }
        });
    } else {
        // Décocher "Toutes"
        document.querySelector('input[name="dbFilter"][value="all"]').checked = false;
    }
}

function handleCategoryFilterChange(checkbox) {
    const allCheckboxes = document.querySelectorAll('input[name="categoryFilter"]');
    
    if (checkbox.value === 'all') {
        allCheckboxes.forEach(cb => {
            if (cb.value !== 'all') {
                cb.checked = false;
            }
        });
    } else {
        // Décocher "Toutes"
        document.querySelector('input[name="categoryFilter"][value="all"]').checked = false;
    }
}

function resetFilters() {
    // Réinitialiser tous les filtres
    document.getElementById('advancedSearchInput').value = '';
    document.getElementById('tagsFilterInput').value = '';
    
    document.querySelectorAll('input[name="dbFilter"]').forEach(cb => {
        cb.checked = cb.value === 'all';
    });
    
    document.querySelectorAll('input[name="categoryFilter"]').forEach(cb => {
        cb.checked = cb.value === 'all';
    });
    
    document.getElementById('searchInCode').checked = false;
    document.getElementById('exactMatch').checked = false;
    document.getElementById('caseSensitive').checked = false;
    
    showToast("🔄 Filtres réinitialisés", "success");
}

// ==========================================
// 5. SUGGESTIONS AUTOMATIQUES
// ==========================================

function handleSearchInput(value) {
    clearTimeout(searchTimeout);
    
    if (value.length < 2) {
        hideSearchSuggestions();
        return;
    }
    
    searchTimeout = setTimeout(() => {
        generateSearchSuggestions(value);
    }, 300); // Debounce 300ms
}

function generateSearchSuggestions(query) {
    const lowerQuery = query.toLowerCase();
    const suggestions = [];
    
    // Suggestions depuis les titres
    allScriptsForSearch.forEach(script => {
        if (script.title.toLowerCase().includes(lowerQuery)) {
            suggestions.push({
                type: 'script',
                text: script.title,
                subtitle: `${script.database} • ${script.category}`,
                scriptId: script.id,
                icon: '📄'
            });
        }
    });
    
    // Suggestions depuis les catégories
    categories.forEach(cat => {
        if (cat.toLowerCase().includes(lowerQuery)) {
            suggestions.push({
                type: 'category',
                text: cat,
                subtitle: 'Catégorie',
                icon: categoryIcons[cat] || '📋'
            });
        }
    });
    
    // Suggestions depuis les tags
    const allTags = new Set();
    allScriptsForSearch.forEach(script => {
        if (script.tags && Array.isArray(script.tags)) {
            script.tags.forEach(tag => {
                if (tag.toLowerCase().includes(lowerQuery)) {
                    allTags.add(tag);
                }
            });
        }
    });
    
    allTags.forEach(tag => {
        suggestions.push({
            type: 'tag',
            text: tag,
            subtitle: 'Tag',
            icon: '🏷️'
        });
    });
    
    // Limiter à 8 suggestions max
    searchSuggestions = suggestions.slice(0, 8);
    
    if (searchSuggestions.length > 0) {
        showSearchSuggestions();
    } else {
        hideSearchSuggestions();
    }
}

function showSearchSuggestions() {
    const box = document.getElementById('searchSuggestionsBox');
    if (!box) return;
    
    if (searchSuggestions.length === 0) {
        box.classList.add('hidden');
        return;
    }
    
    box.innerHTML = `
        <div class="p-2">
            <div class="text-xs font-bold text-gray-500 px-3 py-2">SUGGESTIONS</div>
            ${searchSuggestions.map(suggestion => `
                <div class="px-4 py-3 hover:bg-purple-50 cursor-pointer rounded-lg transition flex items-center gap-3 group"
                     onclick="applySuggestion('${suggestion.type}', '${escapeHtml(suggestion.text)}', ${suggestion.scriptId || 'null'})">
                    <span class="text-2xl">${suggestion.icon}</span>
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-gray-800 group-hover:text-purple-700 truncate">
                            ${escapeHtml(suggestion.text)}
                        </p>
                        <p class="text-xs text-gray-500">${suggestion.subtitle}</p>
                    </div>
                    <svg class="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </div>
            `).join('')}
        </div>
    `;
    
    box.classList.remove('hidden');
}

function hideSearchSuggestions() {
    const box = document.getElementById('searchSuggestionsBox');
    if (box) {
        box.classList.add('hidden');
    }
}

function applySuggestion(type, text, scriptId) {
    hideSearchSuggestions();
    
    if (type === 'script' && scriptId) {
        showScriptDetail(scriptId);
    } else if (type === 'category') {
        // Rechercher cette catégorie
        document.getElementById('advancedSearchInput').value = '';
        // Décocher toutes les catégories sauf celle-ci
        document.querySelectorAll('input[name="categoryFilter"]').forEach(cb => {
            cb.checked = cb.value === text;
        });
        performAdvancedSearch();
    } else if (type === 'tag') {
        // Rechercher ce tag
        document.getElementById('tagsFilterInput').value = text;
        performAdvancedSearch();
    }
}

// Masquer les suggestions si clic en dehors
document.addEventListener('click', (e) => {
    const box = document.getElementById('searchSuggestionsBox');
    const input = document.getElementById('advancedSearchInput');
    
    if (box && input && !box.contains(e.target) && e.target !== input) {
        hideSearchSuggestions();
    }
});

// ==========================================
// 6. RECHERCHE AVANCÉE PRINCIPALE
// ==========================================

async function performAdvancedSearch() {
    const searchQuery = document.getElementById('advancedSearchInput')?.value.trim() || '';
    const tagsInput = document.getElementById('tagsFilterInput')?.value.trim() || '';
    const searchInCode = document.getElementById('searchInCode')?.checked || false;
    const exactMatch = document.getElementById('exactMatch')?.checked || false;
    const caseSensitive = document.getElementById('caseSensitive')?.checked || false;
    
    // Récupérer les filtres de base de données
    const selectedDatabases = Array.from(document.querySelectorAll('input[name="dbFilter"]:checked'))
        .map(cb => cb.value)
        .filter(v => v !== 'all');
    
    // Récupérer les filtres de catégories
    const selectedCategories = Array.from(document.querySelectorAll('input[name="categoryFilter"]:checked'))
        .map(cb => cb.value)
        .filter(v => v !== 'all');
    
    // Parser les tags
    const searchTags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
    
    // Sauvegarder dans l'historique
    if (searchQuery) {
        addToSearchHistory(searchQuery, selectedDatabases, selectedCategories, searchTags);
    }
    
    // Afficher loader
    const resultsContainer = document.getElementById('searchResultsContainer');
    resultsContainer.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-purple-200">
            <div class="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
            <p class="text-gray-600 text-lg">Recherche en cours...</p>
        </div>
    `;
    
    try {
        // Charger tous les scripts
        const { data: allScripts, error } = await supabase
            .from('scripts')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Appliquer le filtre utilisateur
        let results = filterScriptsByUserPreference(allScripts);
        
        // Appliquer les filtres
        results = applySearchFilters(
            results,
            searchQuery,
            selectedDatabases,
            selectedCategories,
            searchTags,
            searchInCode,
            exactMatch,
            caseSensitive
        );
        
        // Afficher les résultats
        displaySearchResults(results, searchQuery, {
            databases: selectedDatabases,
            categories: selectedCategories,
            tags: searchTags,
            searchInCode,
            exactMatch
        });
        
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = `
            <div class="bg-red-50 rounded-2xl shadow-xl p-12 text-center border-2 border-red-200">
                <div class="text-6xl mb-4">❌</div>
                <h3 class="text-2xl font-bold text-red-800 mb-3">Erreur de recherche</h3>
                <p class="text-red-600 mb-6">${error.message}</p>
                <button onclick="performAdvancedSearch()" class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">
                    🔄 Réessayer
                </button>
            </div>
        `;
    }
}

// ==========================================
// 7. FILTRAGE DES RÉSULTATS
// ==========================================

function applySearchFilters(scripts, query, databases, categories, tags, searchInCode, exactMatch, caseSensitive) {
    let filtered = scripts;
    
    // Filtre par base de données
    if (databases.length > 0) {
        filtered = filtered.filter(s => databases.includes(s.database));
    }
    
    // Filtre par catégorie
    if (categories.length > 0) {
        filtered = filtered.filter(s => categories.includes(s.category));
    }
    
    // Filtre par tags
    if (tags.length > 0) {
        filtered = filtered.filter(s => {
            if (!s.tags || !Array.isArray(s.tags)) return false;
            return tags.some(searchTag => 
                s.tags.some(scriptTag => 
                    scriptTag.toLowerCase().includes(searchTag.toLowerCase())
                )
            );
        });
    }
    
    // Filtre par texte de recherche
    if (query) {
        filtered = filtered.filter(s => {
            const searchFields = [s.title, s.description];
            
            if (searchInCode) {
                searchFields.push(s.code);
            }
            
            const textToSearch = searchFields.join(' ');
            
            if (exactMatch) {
                if (caseSensitive) {
                    return textToSearch.includes(query);
                } else {
                    return textToSearch.toLowerCase().includes(query.toLowerCase());
                }
            } else {
                const queryWords = query.toLowerCase().split(' ');
                const text = caseSensitive ? textToSearch : textToSearch.toLowerCase();
                
                return queryWords.every(word => text.includes(word));
            }
        });
    }
    
    return filtered;
}

// ==========================================
// 8. AFFICHAGE DES RÉSULTATS
// ==========================================

function displaySearchResults(results, query, filters) {
    const resultsContainer = document.getElementById('searchResultsContainer');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-200">
                <div class="text-6xl mb-4">🔍</div>
                <h3 class="text-2xl font-bold text-gray-800 mb-3">Aucun résultat trouvé</h3>
                <p class="text-gray-600 mb-6">
                    Aucun script ne correspond à vos critères de recherche
                </p>
                <button onclick="resetFilters()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
                    🔄 Réinitialiser les filtres
                </button>
            </div>
        `;
        return;
    }
    
    // Construire le résumé des filtres appliqués
    const filterSummary = [];
    if (query) filterSummary.push(`"${query}"`);
    if (filters.databases.length > 0) filterSummary.push(`DB: ${filters.databases.join(', ')}`);
    if (filters.categories.length > 0) filterSummary.push(`Cat: ${filters.categories.join(', ')}`);
    if (filters.tags.length > 0) filterSummary.push(`Tags: ${filters.tags.join(', ')}`);
    if (filters.searchInCode) filterSummary.push('Code inclus');
    if (filters.exactMatch) filterSummary.push('Exact');
    
    resultsContainer.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl p-6 border-2 border-green-200 mb-6">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">
                        ✅ ${results.length} script(s) trouvé(s)
                    </h3>
                    ${filterSummary.length > 0 ? `
                        <p class="text-sm text-gray-600">
                            Filtres: ${filterSummary.join(' • ')}
                        </p>
                    ` : ''}
                </div>
                <div class="flex gap-2">
                    <button onclick="exportSearchResults(${JSON.stringify(results.map(r => r.id))})" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                        📥 Exporter
                    </button>
                    <button onclick="performAdvancedSearch()" 
                            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm">
                        🔄 Nouvelle recherche
                    </button>
                </div>
            </div>
        </div>
        
        <div class="space-y-4">
            ${results.map(script => renderScriptCard(script)).join('')}
        </div>
    `;
}

// ==========================================
// 9. HISTORIQUE DE RECHERCHE
// ==========================================

function addToSearchHistory(query, databases, categories, tags) {
    const historyItem = {
        query,
        databases,
        categories,
        tags,
        timestamp: new Date().toISOString()
    };
    
    // Éviter les doublons
    searchHistory = searchHistory.filter(item => 
        item.query !== query || 
        JSON.stringify(item.databases) !== JSON.stringify(databases) ||
        JSON.stringify(item.categories) !== JSON.stringify(categories)
    );
    
    // Ajouter au début
    searchHistory.unshift(historyItem);
    
    // Limiter à 20 items
    if (searchHistory.length > 20) {
        searchHistory = searchHistory.slice(0, 20);
    }
    
    // Sauvegarder
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
}

function renderSearchHistory() {
    if (searchHistory.length === 0) {
        return '';
    }
    
    return `
        <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-xl p-6 mb-6 border-2 border-blue-200">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span class="text-2xl">🕒</span>
                    Historique de recherche
                </h3>
                <button onclick="clearSearchHistory()" class="text-sm text-red-600 hover:text-red-800 font-medium">
                    Effacer l'historique
                </button>
            </div>
            <div class="space-y-2 max-h-64 overflow-y-auto">
                ${searchHistory.slice(0, 10).map(item => {
                    const timeAgo = getTimeAgo(new Date(item.timestamp));
                    const filterCount = (item.databases?.length || 0) + (item.categories?.length || 0) + (item.tags?.length || 0);
                    
                    return `
                        <div class="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-blue-50 transition cursor-pointer border border-blue-200 group"
                             onclick="replaySearch('${escapeHtml(item.query)}', ${JSON.stringify(item.databases)}, ${JSON.stringify(item.categories)}, ${JSON.stringify(item.tags)})">
                            <div class="flex-1 min-w-0">
                                <p class="font-semibold text-gray-800 truncate group-hover:text-blue-700">
                                    ${item.query ? escapeHtml(item.query) : '<i>Recherche avec filtres uniquement</i>'}
                                </p>
                                <p class="text-xs text-gray-500">
                                    ${timeAgo}${filterCount > 0 ? ` • ${filterCount} filtre(s)` : ''}
                                </p>
                            </div>
                            <svg class="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function replaySearch(query, databases, categories, tags) {
    // Remplir les champs
    document.getElementById('advancedSearchInput').value = query;
    
    if (tags && tags.length > 0) {
        document.getElementById('tagsFilterInput').value = tags.join(', ');
    }
    
    // Cocher les bases de données
    if (databases && databases.length > 0) {
        document.querySelectorAll('input[name="dbFilter"]').forEach(cb => {
            cb.checked = databases.includes(cb.value);
        });
    }
    
    // Cocher les catégories
    if (categories && categories.length > 0) {
        document.querySelectorAll('input[name="categoryFilter"]').forEach(cb => {
            cb.checked = categories.includes(cb.value);
        });
    }
    
    // Lancer la recherche
    performAdvancedSearch();
}

function clearSearchHistory() {
    if (!confirm('Voulez-vous vraiment effacer tout l\'historique de recherche ?')) {
        return;
    }
    
    searchHistory = [];
    localStorage.removeItem('searchHistory');
    showToast('🗑️ Historique effacé', 'success');
    
    // Recharger la page
    showAdvancedSearch();
}

// ==========================================
// 10. FONCTIONS UTILITAIRES
// ==========================================

function clearSearch() {
    document.getElementById('advancedSearchInput').value = '';
    hideSearchSuggestions();
}

async function exportSearchResults(scriptIds) {
    try {
        const { data: scripts, error } = await supabase
            .from('scripts')
            .select('*')
            .in('id', scriptIds);
        
        if (error) throw error;
        
        const exportData = {
            exported_at: new Date().toISOString(),
            total_scripts: scripts.length,
            scripts: scripts
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `search-results-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('📥 Résultats exportés !', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('❌ Erreur d\'export', 'error');
    }
}

// ==========================================
// 11. AMÉLIORATION DE LA RECHERCHE SIMPLE
// ==========================================

// Améliorer searchScripts() pour rediriger vers la recherche avancée
async function searchScriptsEnhanced() {
    const query = document.getElementById("searchInput")?.value.toLowerCase().trim();
    
    if (!query) {
        showToast("Veuillez entrer un terme de recherche", "error");
        return;
    }
    
    // Rediriger vers la recherche avancée avec le terme pré-rempli
    showAdvancedSearch();
    
    setTimeout(() => {
        document.getElementById('advancedSearchInput').value = query;
        performAdvancedSearch();
    }, 100);
}