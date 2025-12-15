// ==========================================
// 📊 js/dashboard.js - Dashboard Analytics
// ==========================================

// ==========================================
// 1. STRUCTURE DE DONNÉES POUR LES MÉTRIQUES
// ==========================================

let dashboardData = {
    totalScripts: 0,
    totalUsers: 0,
    totalCategories: 0,
    scriptsThisMonth: 0,
    topScripts: [],
    recentlyAdded: [],
    recentlyModified: [],
    scriptsByDatabase: {},
    scriptsByCategory: {},
    activityTimeline: []
};

// ==========================================
// 2. CHARGER LES DONNÉES DU DASHBOARD
// ==========================================

async function loadDashboardData() {
    try {
        // Récupérer tous les scripts avec application du filtre utilisateur
        const { data: allScriptsRaw, error: scriptsError } = await supabase
            .from('scripts')
            .select('*')
            .order('created_at', { ascending: false });

        if (scriptsError) throw scriptsError;

        // Appliquer le filtre utilisateur
        const scripts = filterScriptsByUserPreference(allScriptsRaw);

        // 1. Métriques de base
        dashboardData.totalScripts = scripts.length;
        dashboardData.totalCategories = new Set(scripts.map(s => s.category)).size;

        // 2. Scripts ce mois-ci
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        
        dashboardData.scriptsThisMonth = scripts.filter(s => 
            new Date(s.created_at) >= thisMonth
        ).length;

        // 3. Scripts les plus consultés (simulé avec ID pour l'instant)
        // TODO: Implémenter un vrai système de tracking des vues
        dashboardData.topScripts = scripts
            .slice(0, 5)
            .map(s => ({
                ...s,
                views: Math.floor(Math.random() * 500) + 50 // Simulé
            }))
            .sort((a, b) => b.views - a.views);

        // 4. Scripts récemment ajoutés
        dashboardData.recentlyAdded = scripts.slice(0, 5);

        // 5. Scripts récemment modifiés
        const scriptsWithUpdates = scripts.filter(s => s.updated_at);
        dashboardData.recentlyModified = scriptsWithUpdates
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 5);

        // 6. Répartition par base de données
        dashboardData.scriptsByDatabase = scripts.reduce((acc, script) => {
            acc[script.database] = (acc[script.database] || 0) + 1;
            return acc;
        }, {});

        // 7. Répartition par catégorie
        dashboardData.scriptsByCategory = scripts.reduce((acc, script) => {
            acc[script.category] = (acc[script.category] || 0) + 1;
            return acc;
        }, {});

        // 8. Timeline d'activité (7 derniers jours)
        dashboardData.activityTimeline = generateActivityTimeline(scripts);

        // 9. Nombre d'utilisateurs uniques
        const uniqueUsers = new Set(scripts.map(s => s.added_by).filter(Boolean));
        dashboardData.totalUsers = uniqueUsers.size;

        return dashboardData;

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        return null;
    }
}

// ==========================================
// 3. GÉNÉRER LA TIMELINE D'ACTIVITÉ
// ==========================================

function generateActivityTimeline(scripts) {
    const timeline = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = scripts.filter(s => {
            const scriptDate = new Date(s.created_at);
            return scriptDate >= date && scriptDate < nextDate;
        }).length;
        
        timeline.push({
            date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
            count: count
        });
    }
    
    return timeline;
}

// ==========================================
// 4. AFFICHER LE DASHBOARD DANS LA PAGE D'ACCUEIL
// ==========================================

async function renderDashboard() {
    const data = await loadDashboardData();
    
    if (!data) {
        return '<p class="text-red-500 text-center py-8">Erreur de chargement des statistiques</p>';
    }

    // Couleurs pour les graphiques
    const dbColors = {
        'Oracle': 'bg-red-500',
        'SQL Server': 'bg-blue-500',
        'PostgreSQL': 'bg-green-500'
    };

    return `
        <!-- Dashboard Analytics -->
        <section class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
            
            <!-- Titre principal -->
            <div class="text-center mb-10">
                <h2 class="text-4xl font-extrabold text-gray-900 mb-3">
                    📊 Tableau de Bord
                </h2>
                <p class="text-gray-600 text-lg">
                    Vue d'ensemble de votre bibliothèque de scripts
                </p>
            </div>

            <!-- Métriques principales (Cards) -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                
                <!-- Total Scripts -->
                <div class="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition duration-300">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-purple-100 text-sm font-medium mb-1">Total Scripts</p>
                            <p class="text-4xl font-bold">${data.totalScripts}</p>
                        </div>
                        <div class="bg-white/20 rounded-full p-4">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                    </div>
                    <p class="mt-3 text-sm text-purple-100">
                        <span class="font-bold text-white">+${data.scriptsThisMonth}</span> ce mois-ci
                    </p>
                </div>

                <!-- Catégories -->
                <div class="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition duration-300">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-blue-100 text-sm font-medium mb-1">Catégories</p>
                            <p class="text-4xl font-bold">${data.totalCategories}</p>
                        </div>
                        <div class="bg-white/20 rounded-full p-4">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                            </svg>
                        </div>
                    </div>
                    <p class="mt-3 text-sm text-blue-100">
                        Organisés et indexés
                    </p>
                </div>

                <!-- Contributeurs -->
                <div class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition duration-300">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-green-100 text-sm font-medium mb-1">Contributeurs</p>
                            <p class="text-4xl font-bold">${data.totalUsers}</p>
                        </div>
                        <div class="bg-white/20 rounded-full p-4">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <p class="mt-3 text-sm text-green-100">
                        Équipe active
                    </p>
                </div>

                <!-- Favoris -->
                <div class="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition duration-300">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-yellow-100 text-sm font-medium mb-1">Mes Favoris</p>
                            <p class="text-4xl font-bold">${favorites.length}</p>
                        </div>
                        <div class="bg-white/20 rounded-full p-4">
                            <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                            </svg>
                        </div>
                    </div>
                    <p class="mt-3 text-sm text-yellow-100">
                        Scripts sauvegardés
                    </p>
                </div>

            </div>

             <!-- Grille: Scripts récents + Top catégories -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <!-- Scripts récemment ajoutés -->
                <div class="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-gray-800 flex items-center">
                            <span class="text-2xl mr-2">✨</span>
                            Récemment Ajoutés
                        </h3>
                        <button onclick="loadCategoryByDatabase('Oracle', 'DATABASE INFO')" 
                                class="text-sm text-purple-600 hover:text-purple-800 font-medium">
                            Voir tout →
                        </button>
                    </div>
                    <div class="space-y-3">
                        ${data.recentlyAdded.map(script => {
                            const date = new Date(script.created_at);
                            const timeAgo = getTimeAgo(date);
                            const dbIcon = script.database === 'Oracle' ? '🔶' : script.database === 'SQL Server' ? '🔷' : '🐘';
                            
                            return `
                                <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition cursor-pointer border border-gray-200 hover:border-purple-300"
                                     onclick="showScriptDetail(${script.id})">
                                    <span class="text-2xl">${dbIcon}</span>
                                    <div class="flex-1 min-w-0">
                                        <p class="font-semibold text-gray-800 truncate">${escapeHtml(script.title)}</p>
                                        <p class="text-xs text-gray-500">${timeAgo}</p>
                                    </div>
                                    <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold whitespace-nowrap">
                                        Nouveau
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Top catégories -->
                <div class="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-gray-800 flex items-center">
                            <span class="text-2xl mr-2">📂</span>
                            Top Catégories
                        </h3>
                    </div>
                    <div class="space-y-3">
                        ${Object.entries(data.scriptsByCategory)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([category, count]) => {
                                const percentage = (count / data.totalScripts * 100).toFixed(1);
                                const icon = categoryIcons[category] || '📋';
                                
                                return `
                                    <div class="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg hover:from-gray-100 hover:to-purple-100 transition cursor-pointer border border-gray-200"
                                         onclick="loadCategoryByDatabase('Oracle', '${category}')">
                                        <div class="flex items-center gap-3">
                                            <span class="text-2xl">${icon}</span>
                                            <div>
                                                <p class="font-semibold text-gray-800">${category}</p>
                                                <p class="text-xs text-gray-500">${count} script(s) • ${percentage}%</p>
                                            </div>
                                        </div>
                                        <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                    </div>
                                `;
                            }).join('')}
                    </div>
                </div>

            </div>

            
            <!-- Graphiques et listes -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                
                <!-- Répartition par base de données -->
                <div class="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                    <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <span class="text-2xl mr-2">🗄️</span>
                        Répartition par Base de Données
                    </h3>
                    <div class="space-y-4">
                        ${Object.entries(data.scriptsByDatabase).map(([db, count]) => {
                            const percentage = (count / data.totalScripts * 100).toFixed(1);
                            const colorClass = dbColors[db] || 'bg-gray-500';
                            const icon = db === 'Oracle' ? '🔶' : db === 'SQL Server' ? '🔷' : '🐘';
                            
                            return `
                                <div>
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <span class="text-xl">${icon}</span>
                                            ${db}
                                        </span>
                                        <span class="text-sm font-bold text-gray-800">${count} (${percentage}%)</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div class="${colorClass} h-3 rounded-full transition-all duration-500 shadow-lg" 
                                             style="width: ${percentage}%"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Activité des 7 derniers jours -->
                <div class="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                    <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <span class="text-2xl mr-2">📈</span>
                        Activité (7 derniers jours)
                    </h3>
                    <div class="flex items-end justify-between h-48 gap-2">
                        ${data.activityTimeline.map(day => {
                            const maxCount = Math.max(...data.activityTimeline.map(d => d.count), 1);
                            const height = (day.count / maxCount * 100);
                            
                            return `
                                <div class="flex-1 flex flex-col items-center">
                                    <div class="relative flex-1 w-full flex items-end justify-center">
                                        <div class="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-lg shadow-lg hover:from-purple-700 hover:to-indigo-600 transition-all duration-300 cursor-pointer group relative"
                                             style="height: ${height}%"
                                             title="${day.count} script(s)">
                                            <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                ${day.count} script(s)
                                            </div>
                                        </div>
                                    </div>
                                    <p class="text-xs text-gray-600 mt-2 text-center">${day.date}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

            </div>

            <!-- Scripts les plus consultés -->
            <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-6 border-2 border-indigo-200 mb-10">
                <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <span class="text-3xl mr-3">🔥</span>
                    Scripts les Plus Consultés
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${data.topScripts.slice(0, 6).map((script, index) => {
                        const dbIcon = script.database === 'Oracle' ? '🔶' : script.database === 'SQL Server' ? '🔷' : '🐘';
                        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];
                        
                        return `
                            <div class="bg-white rounded-xl p-5 shadow-lg hover:shadow-2xl transition duration-300 border-l-4 ${index === 0 ? 'border-yellow-400' : index === 1 ? 'border-gray-400' : index === 2 ? 'border-orange-400' : 'border-purple-400'} cursor-pointer transform hover:-translate-y-1"
                                 onclick="showScriptDetail(${script.id})">
                                <div class="flex items-start justify-between mb-3">
                                    <span class="text-3xl">${medals[index]}</span>
                                    <span class="text-xl">${dbIcon}</span>
                                </div>
                                <h4 class="font-bold text-gray-800 mb-2 line-clamp-2">${escapeHtml(script.title)}</h4>
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-gray-600 flex items-center gap-1">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                        ${script.views} vues
                                    </span>
                                    <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                                        ${script.category}
                                    </span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

           
        </section>
    `;
}

// ==========================================
// 5. FONCTION UTILITAIRE - TIME AGO
// ==========================================

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 30) {
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (days > 0) {
        return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
        return 'À l\'instant';
    }
}

// ==========================================
// 6. INTÉGRATION DANS showHome()
// ==========================================

// Modifier la fonction showHome() pour intégrer le dashboard
// Remplacer la section "Recently added scripts" par le dashboard complet