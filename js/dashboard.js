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
    recentlyAdded: [],
    scriptsByCategory: {}
};

// ==========================================
// 2. CHARGER LES DONNÉES DU DASHBOARD
// ==========================================

async function loadDashboardData() {
    try {
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

        // 3. Scripts récemment ajoutés
        dashboardData.recentlyAdded = scripts.slice(0, 8);

        // 4. Répartition par catégorie
        dashboardData.scriptsByCategory = scripts.reduce((acc, script) => {
            acc[script.category] = (acc[script.category] || 0) + 1;
            return acc;
        }, {});

        // 6. Nombre d'utilisateurs uniques
        const uniqueUsers = new Set(scripts.map(s => s.added_by).filter(Boolean));
        dashboardData.totalUsers = uniqueUsers.size;

        return dashboardData;

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        return null;
    }
}

// ==========================================
// 3. AFFICHER LE DASHBOARD DANS LA PAGE D'ACCUEIL
// ==========================================

async function renderDashboard() {
    const data = await loadDashboardData();

    if (!data) {
        return '<p class="text-red-500 text-center py-8">Erreur de chargement des statistiques</p>';
    }

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
                    <p class="mt-3 text-sm text-blue-100">Organisés et indexés</p>
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
                    <p class="mt-3 text-sm text-green-100">Équipe active</p>
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
                    <p class="mt-3 text-sm text-yellow-100">Scripts sauvegardés</p>
                </div>

            </div>

            <!-- ===== RÉCEMMENT AJOUTÉS (pleine largeur) ===== -->
            <div class="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 mb-8">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-800 flex items-center">
                        <span class="text-2xl mr-2">✨</span>
                        Récemment Ajoutés
                    </h3>
                    <button onclick="showHome()"
                            class="text-sm text-purple-600 hover:text-purple-800 font-medium transition">
                        Voir tout →
                    </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    ${data.recentlyAdded.length === 0
                        ? `<p class="text-gray-500 col-span-4 text-center py-6">Aucun script récent.</p>`
                        : data.recentlyAdded.map(script => {
                            const date = new Date(script.created_at);
                            const timeAgo = getTimeAgo(date);
                            const dbIcon = script.database === 'Oracle' ? '🔶' : script.database === 'SQL Server' ? '🔷' : '🐘';
                            const catIcon = categoryIcons[script.category] || '📋';
                            return `
                                <div class="flex flex-col gap-2 p-4 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition cursor-pointer group"
                                     onclick="showScriptDetail(${script.id})">
                                    <div class="flex items-center justify-between">
                                        <span class="text-xl">${dbIcon}</span>
                                        <span class="text-lg">${catIcon}</span>
                                    </div>
                                    <p class="font-semibold text-gray-800 text-sm line-clamp-2 group-hover:text-purple-700 transition">${escapeHtml(script.title)}</p>
                                    <div class="flex items-center justify-between mt-auto">
                                        <span class="text-xs text-gray-500">${timeAgo}</span>
                                        <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Nouveau</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                </div>
            </div>

            <!-- ===== TOP CATÉGORIES (pleine largeur) ===== -->
            <div class="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 mb-2">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-800 flex items-center">
                        <span class="text-2xl mr-2">📂</span>
                        Top Catégories
                    </h3>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    ${Object.entries(data.scriptsByCategory)
                        .sort((a, b) => b[1] - a[1])
                        .map(([category, count]) => {
                            const percentage = (count / data.totalScripts * 100).toFixed(1);
                            const icon = categoryIcons[category] || '📋';
                            return `
                                <div class="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition cursor-pointer group"
                                     onclick="loadCategoryByDatabase('Oracle', '${category}')">
                                    <div class="flex items-center gap-3 min-w-0">
                                        <span class="text-2xl flex-shrink-0">${icon}</span>
                                        <div class="min-w-0">
                                            <p class="font-semibold text-gray-800 text-sm truncate group-hover:text-purple-700 transition">${category}</p>
                                            <p class="text-xs text-gray-500">${count} script(s) · ${percentage}%</p>
                                        </div>
                                    </div>
                                    <svg class="w-4 h-4 text-purple-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </div>
                            `;
                        }).join('')}
                </div>
            </div>

        </section>
    `;
}

// ==========================================
// 4. FONCTION UTILITAIRE - TIME AGO
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
// 5. INTÉGRATION DANS showHome()
// ==========================================

// Modifier la fonction showHome() pour intégrer le dashboard
// Remplacer la section "Recently added scripts" par le dashboard complet