// ==========================================
// 📄 js/ai-analyzer-ui.js - Interface utilisateur
// ==========================================

// ==========================================
// 1. AFFICHER LA PAGE D'ANALYSE
// ==========================================

function showAIAnalyzer() {

    // Vérifier l'authentification
    if (!user) {
        showToast("❌ Vous devez être connecté pour accéder à l'analyseur d'erreurs", "error");
        showLogin();
        return;
    }
    sessionStorage.setItem('currentView', 'ai-analyzer');
    
    document.getElementById("content").innerHTML = `
        <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
            
            <!-- Header -->
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-800 mb-3">
                    🤖 Analyseur de Logs 
                </h1>
                <p class="text-gray-600 text-lg">
                    Collez vos logs ou messages d'erreur pour obtenir un diagnostic automatique et des solutions
                </p>
            </div>

            <!-- Zone de saisie principale -->
            <div class="bg-white rounded-xl shadow-xl p-8 mb-6">
                <div class="mb-6">
                    <label class="block text-sm font-bold text-gray-800 mb-3">
                        📋 Logs / Messages d'erreur
                    </label>
                    <textarea 
                        id="logInput" 
                        rows="12"
                        class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                        placeholder="Collez vos logs ici...

Exemple Oracle:
ORA-01555: snapshot too old: rollback segment number 23 with name &quot;_SYSSMU23_$&quot; too small

Exemple SQL Server:
Msg 1105, Level 17, State 2, Line 1
Could not allocate space for object 'dbo.Orders' in database 'SalesDB'
"></textarea>
                    <p class="text-xs text-gray-500 mt-2">
                        💡 Astuce : Plus vous fournissez de contexte (logs complets), meilleure sera l'analyse
                    </p>
                </div>

                <!-- Options de détection -->
                <div class="mb-6">
                    <label class="block text-sm font-bold text-gray-800 mb-3">
                        🗄️ Type de base de données
                    </label>
                    <div class="flex gap-4">
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="dbType" value="auto" checked class="mr-2" />
                            <span class="text-gray-700">🔍 Détection automatique</span>
                        </label>
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="dbType" value="Oracle" class="mr-2" />
                            <span class="text-gray-700">🔶 Oracle</span>
                        </label>
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="dbType" value="SQL Server" class="mr-2" />
                            <span class="text-gray-700">🔷 SQL Server</span>
                        </label>
                    </div>
                </div>

                <!-- Boutons d'action -->
                <div class="flex gap-3">
                    <button 
                        onclick="handleAnalyzeClick()"
                        class="flex-1 px-6 py-4 bg-gradient-to-r from-purple-400 to-indigo-500 text-white rounded-lg hover:shadow-xl transition font-bold text-lg">
                        🔍 Analyser avec IA
                    </button>

                    <button 
                        onclick="showAnalysisHistory()"
                        class="px-6 py-4 bg-blue-400 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                        📜 Historique
                    </button>
                </div>
            </div>

            <!-- Zone de résultats (masquée au départ) -->
            <div id="analysisResults" class="hidden"></div>

            <!-- Info sur l'IA utilisée -->
            <div class="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 text-sm">
                <p class="text-blue-800">
                    <strong>🤖 IA utilisée :</strong> Groq (Llama 3.1 - 100% gratuit).
                    ${!window.AI_CONFIG || !window.AI_CONFIG.groqApiKey ? '<span class="text-orange-600">⚠️ <a href="#" onclick="showGroqConfigModal(); return false;" class="underline">Configurer Groq</a> pour commencer.</span>' : '✅ Groq configuré'}
                </p>
            </div>

        </section>
    `;
}

// ==========================================
// 2. GÉRER LE CLIC SUR ANALYSER
// ==========================================

async function handleAnalyzeClick() {
    const logInput = document.getElementById('logInput');
    const logText = logInput.value.trim();
    
    if (!logText) {
        showToast("❌ Veuillez coller des logs ou une erreur", "error");
        logInput.focus();
        return;
    }
    
    // Récupérer le type de DB sélectionné
    const selectedDbType = document.querySelector('input[name="dbType"]:checked').value;
    const dbType = selectedDbType === 'auto' ? null : selectedDbType;
    
    // Lancer l'analyse
    await analyzeLogError(logText, dbType);
}

// ==========================================
// 3. AFFICHER RÉSULTATS (ERREUR CONNUE)
// ==========================================

function displayKnownErrorSolution(knownError, errorCodes, dbType) {
    const resultsContainer = document.getElementById('analysisResults');
    resultsContainer.className = 'animate-fade-in';
    
    const solutions = typeof knownError.solutions === 'string' 
        ? JSON.parse(knownError.solutions) 
        : knownError.solutions;
    
    resultsContainer.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-green-300">
            
            <!-- Header avec badge "Erreur connue" -->
            <div class="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
                <div class="flex items-center justify-between mb-3">
                    <span class="px-4 py-1 bg-white/20 rounded-full text-sm font-bold">
                        ✅ Erreur connue
                    </span>
                    <span class="text-2xl">${getSeverityEmoji(knownError.severity)}</span>
                </div>
                <h2 class="text-3xl font-bold mb-2">${knownError.error_code}</h2>
                <p class="text-green-100 text-lg">${escapeHtml(knownError.error_title)}</p>
            </div>

            <div class="p-8">
                
                <!-- Description -->
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-800 mb-3 flex items-center">
                        <span class="text-2xl mr-2">📝</span>
                        Description
                    </h3>
                    <p class="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                        ${escapeHtml(knownError.description)}
                    </p>
                </div>

                <!-- Causes -->
                ${knownError.common_causes && knownError.common_causes.length > 0 ? `
                    <div class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-3 flex items-center">
                            <span class="text-2xl mr-2">🔍</span>
                            Causes probables
                        </h3>
                        <ul class="space-y-2">
                            ${knownError.common_causes.map(cause => `
                                <li class="flex items-start">
                                    <span class="text-red-500 mr-2 text-lg">▸</span>
                                    <span class="text-gray-700">${escapeHtml(cause)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <!-- Solutions -->
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span class="text-2xl mr-2">✅</span>
                        Solutions recommandées
                    </h3>
                    <div class="space-y-4">
                        ${solutions.map((sol, idx) => `
                            <div class="border-2 border-gray-200 rounded-lg p-5 hover:border-purple-400 transition">
                                <div class="flex items-start justify-between mb-3">
                                    <div class="flex items-center gap-3">
                                        <span class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                                            ${sol.priority || idx + 1}
                                        </span>
                                        <h4 class="font-bold text-gray-800 text-lg">${escapeHtml(sol.title)}</h4>
                                    </div>
                                </div>
                                <p class="text-gray-700 mb-3 ml-11">${escapeHtml(sol.description)}</p>
                                ${sol.sql_script || sol.sql ? `
                                    <div class="ml-11">
                                        <div class="bg-gray-900 rounded-lg p-4 relative">
                                            <pre class="text-green-400 font-mono text-sm overflow-x-auto">${escapeHtml(sol.sql_script || sol.sql)}</pre>
                                            <button 
                                                onclick="copyToClipboard(\`${(sol.sql_script || sol.sql).replace(/`/g, '\\`')}\`)"
                                                class="absolute top-2 right-2 px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700">
                                                📋 Copier
                                            </button>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>


                <!-- Actions -->
                <div class="flex gap-3 pt-6 border-t">
                    <button 
                        onclick="showAIAnalyzer()"
                        class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">
                        ← Nouvelle analyse
                    </button>
                </div>

            </div>
        </div>
    `;
    
    // Charger les scripts liés si nécessaire
    if (knownError.related_script_ids && knownError.related_script_ids.length > 0) {
        loadRelatedScripts(knownError.related_script_ids);
    }
}

// ==========================================
// 4. AFFICHER RÉSULTATS (ANALYSE IA)
// ==========================================

function displayAIAnalysisResults(aiData, relatedScripts, provider) {
    const resultsContainer = document.getElementById('analysisResults');
    resultsContainer.className = 'animate-fade-in';
    
    const providerBadge = provider === 'claude' 
        ? '<span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">🤖 Claude</span>'
        : '<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">🤖 Groq</span>';
    
    resultsContainer.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-purple-300">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
                <div class="flex items-center justify-between mb-3">
                    ${providerBadge}
                    <span class="text-2xl">${getSeverityEmoji(aiData.severity)}</span>
                </div>
                <h2 class="text-3xl font-bold mb-2">${aiData.error_code || 'Analyse'}</h2>
                <p class="text-purple-100 text-lg">${escapeHtml(aiData.title)}</p>
            </div>

            <div class="p-8">
                
                <!-- Description -->
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-800 mb-3 flex items-center">
                        <span class="text-2xl mr-2">📝</span>
                        Diagnostic
                    </h3>
                    <p class="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                        ${escapeHtml(aiData.description)}
                    </p>
                </div>

                <!-- Causes -->
                ${aiData.root_causes && aiData.root_causes.length > 0 ? `
                    <div class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-3 flex items-center">
                            <span class="text-2xl mr-2">🔍</span>
                            Causes identifiées
                        </h3>
                        <ul class="space-y-2">
                            ${aiData.root_causes.map(cause => `
                                <li class="flex items-start">
                                    <span class="text-red-500 mr-2 text-lg">▸</span>
                                    <span class="text-gray-700">${escapeHtml(cause)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <!-- Solutions IA -->
                ${aiData.solutions && aiData.solutions.length > 0 ? `
                    <div class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <span class="text-2xl mr-2">💡</span>
                            Solutions proposées par l'IA
                        </h3>
                        <div class="space-y-4">
                            ${aiData.solutions.map((sol, idx) => `
                                <div class="border-2 border-gray-200 rounded-lg p-5 hover:border-purple-400 transition">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex items-center gap-3">
                                            <span class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                                                ${sol.priority || idx + 1}
                                            </span>
                                            <h4 class="font-bold text-gray-800 text-lg">${escapeHtml(sol.title)}</h4>
                                        </div>
                                    </div>
                                    <p class="text-gray-700 mb-3 ml-11">${escapeHtml(sol.description)}</p>
                                    ${sol.sql_script ? `
                                        <div class="ml-11">
                                            <div class="bg-gray-900 rounded-lg p-4 relative">
                                                <pre class="text-green-400 font-mono text-sm overflow-x-auto">${escapeHtml(sol.sql_script)}</pre>
                                                <button 
                                                    onclick="copyToClipboard(\`${sol.sql_script.replace(/`/g, '\\`')}\`)"
                                                    class="absolute top-2 right-2 px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700">
                                                    📋 Copier
                                                </button>
                                            </div>
                                            <button 
                                                onclick="saveGeneratedScript('${escapeHtml(sol.title)}', \`${sol.sql_script.replace(/`/g, '\\`')}\`)"
                                                class="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                                                💾 Sauvegarder ce script dans la base
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}



                <!-- Prévention -->
                ${aiData.prevention ? `
                    <div class="mb-8 bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                        <h3 class="text-lg font-bold text-blue-900 mb-3 flex items-center">
                            <span class="text-2xl mr-2">🛡️</span>
                            Comment éviter ce problème
                        </h3>
                        <p class="text-blue-800">${escapeHtml(aiData.prevention)}</p>
                    </div>
                ` : ''}

                <!-- Feedback -->
                <div class="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                    <p class="font-bold text-gray-800 mb-3">Cette analyse vous a-t-elle aidé ?</p>
                    <div class="flex gap-3">
                        <button 
                            onclick="submitFeedback('helpful')"
                            class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            👍 Oui, très utile
                        </button>
                        <button 
                            onclick="submitFeedback('not_helpful')"
                            class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                            👎 Non, pas vraiment
                        </button>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-3 pt-6 border-t mt-6">
                    <button 
                        onclick="showAIAnalyzer()"
                        class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">
                        ← Nouvelle analyse
                    </button>
                    <button 
                        onclick="exportAnalysisPDF()"
                        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                        📄 Exporter en PDF
                    </button>
                </div>

            </div>
        </div>
    `;
}

// ==========================================
// 5. FONCTIONS UTILITAIRES
// ==========================================

function getSeverityEmoji(severity) {
    const severityMap = {
        'low': '🟢',
        'medium': '🟡',
        'high': '🟠',
        'critical': '🔴'
    };
    return severityMap[severity] || '⚪';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast("📋 Script copié dans le presse-papiers !", "success");
    }).catch(() => {
        showToast("❌ Erreur lors de la copie", "error");
    });
}

async function loadRelatedScripts(scriptIds) {
    const container = document.getElementById('relatedScriptsContainer');
    
    const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .in('id', scriptIds);
    
    if (error || !data) {
        container.innerHTML = '<p class="text-gray-500">Aucun script trouvé</p>';
        return;
    }
    
    container.innerHTML = data.map(script => renderScriptCard(script)).join('');
}


// ==========================================
// NOUVELLE FONCTION : Historique des analyses
// ==========================================

async function showAnalysisHistory() {
    sessionStorage.setItem('currentView', 'ai-history');
    
    const content = document.getElementById("content");
    content.innerHTML = `
        <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
            <button onclick="showAIAnalyzer()" class="mb-6 px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition font-medium">
                ← Retour à l'analyseur
            </button>
            
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gray-800 mb-3">📜 Historique des analyses</h2>
                <p class="text-gray-600">Toutes vos analyses IA sauvegardées</p>
            </div>
            
            <div id="historyContainer">
                <div class="text-center py-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                    <p class="text-gray-600">Chargement de l'historique...</p>
                </div>
            </div>
        </section>
    `;
    
    // Charger l'historique
    await loadAnalysisHistory();
}

async function loadAnalysisHistory() {
    const container = document.getElementById('historyContainer');
    
    try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
            container.innerHTML = `
                <div class="bg-white rounded-xl shadow-lg p-12 text-center">
                    <div class="text-6xl mb-4">🔒</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4">Connexion requise</h3>
                    <p class="text-gray-600 mb-6">Vous devez être connecté pour voir votre historique</p>
                    <button onclick="showLogin()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
                        🔑 Se connecter
                    </button>
                </div>
            `;
            return;
        }
        
        // Charger les analyses de l'utilisateur
        const { data: analyses, error } = await supabase
            .from('ai_log_analyses')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) {
            console.error('Error loading history:', error);
            container.innerHTML = `
                <div class="bg-white rounded-xl shadow-lg p-12 text-center">
                    <div class="text-6xl mb-4">❌</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4">Erreur de chargement</h3>
                    <p class="text-gray-600">${error.message}</p>
                </div>
            `;
            return;
        }
        
        if (!analyses || analyses.length === 0) {
            container.innerHTML = `
                <div class="bg-white rounded-xl shadow-lg p-12 text-center">
                    <div class="text-6xl mb-4">📭</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4">Aucune analyse</h3>
                    <p class="text-gray-600 mb-6">Vous n'avez pas encore effectué d'analyse</p>
                    <button onclick="showAIAnalyzer()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
                        🤖 Commencer une analyse
                    </button>
                </div>
            `;
            return;
        }
        
        // Afficher les analyses
        container.innerHTML = `
            <div class="mb-4 flex items-center justify-between">
                <p class="text-gray-600">
                    <strong>${analyses.length}</strong> analyse(s) trouvée(s)
                </p>
                <div class="flex gap-2">
                    <button onclick="filterHistory('all')" id="filterAll" class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">
                        Toutes
                    </button>
                    <button onclick="filterHistory('helpful')" id="filterHelpful" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
                        Utiles
                    </button>
                    <button onclick="filterHistory('resolved')" id="filterResolved" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
                        Résolues
                    </button>
                </div>
            </div>
            
            <div class="space-y-4" id="analysesList">
                ${analyses.map(analysis => renderAnalysisCard(analysis)).join('')}
            </div>
        `;
        
        // Stocker les analyses pour le filtrage
        window.allAnalyses = analyses;
        
    } catch (err) {
        console.error('Exception loading history:', err);
        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg p-12 text-center">
                <div class="text-6xl mb-4">❌</div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">Erreur</h3>
                <p class="text-gray-600">${err.message}</p>
            </div>
        `;
    }
}

function renderAnalysisCard(analysis) {
    const date = new Date(analysis.created_at).toLocaleString('fr-FR');
    const aiProvider = analysis.ai_provider === 'claude' ? '🤖 Claude' : '🤖 Groq';
    const logPreview = analysis.log_content.substring(0, 150) + (analysis.log_content.length > 150 ? '...' : '');
    
    const statusBadge = analysis.resolved 
        ? '<span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">✅ Résolu</span>'
        : '<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold">⏳ En cours</span>';
    
    const feedbackBadge = analysis.feedback === 'helpful'
        ? '<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">👍 Utile</span>'
        : analysis.feedback === 'not_helpful'
        ? '<span class="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">👎 Pas utile</span>'
        : '';
    
    return `
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition border-2 border-gray-200 hover:border-purple-400">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-lg">${analysis.database_type === 'Oracle' ? '🔶' : '🔷'}</span>
                        <span class="font-bold text-gray-800">${analysis.database_type || 'Unknown'}</span>
                        <span class="text-gray-400">•</span>
                        <span class="text-sm text-gray-600">${date}</span>
                    </div>
                    <div class="flex gap-2 mb-3">
                        ${statusBadge}
                        ${feedbackBadge}
                        <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">${aiProvider}</span>
                    </div>
                </div>
            </div>
            
            ${analysis.error_codes && analysis.error_codes.length > 0 ? `
                <div class="mb-3">
                    <span class="font-bold text-red-600">${analysis.error_codes.join(', ')}</span>
                </div>
            ` : ''}
            
            <div class="bg-gray-900 rounded-lg p-3 mb-4">
                <pre class="text-green-400 font-mono text-xs">${escapeHtml(logPreview)}</pre>
            </div>
            
            <div class="flex gap-2">
                <button 
                    onclick="viewAnalysisDetail(${analysis.id})"
                    class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
                    👁️ Voir les détails
                </button>
                <button 
                    onclick="reanalyzeLog(${analysis.id})"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                    🔄 Réanalyser
                </button>
                <button 
                    onclick="deleteAnalysis(${analysis.id})"
                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium">
                    🗑️ Supprimer
                </button>
            </div>
        </div>
    `;
}

function filterHistory(type) {
    if (!window.allAnalyses) return;
    
    // Mettre à jour les boutons
    ['filterAll', 'filterHelpful', 'filterResolved'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.className = 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm';
        }
    });
    
    const activeBtn = document.getElementById('filter' + type.charAt(0).toUpperCase() + type.slice(1));
    if (activeBtn) {
        activeBtn.className = 'px-4 py-2 bg-purple-600 text-white rounded-lg text-sm';
    }
    
    // Filtrer
    let filtered = window.allAnalyses;
    
    if (type === 'helpful') {
        filtered = window.allAnalyses.filter(a => a.feedback === 'helpful');
    } else if (type === 'resolved') {
        filtered = window.allAnalyses.filter(a => a.resolved === true);
    }
    
    // Afficher
    const container = document.getElementById('analysesList');
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-xl p-12 text-center">
                <p class="text-gray-600">Aucune analyse dans cette catégorie</p>
            </div>
        `;
    } else {
        container.innerHTML = filtered.map(a => renderAnalysisCard(a)).join('');
    }
}

async function viewAnalysisDetail(analysisId) {
    // Charger et afficher les détails complets
    const { data: analysis, error } = await supabase
        .from('ai_log_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();
    
    if (error || !analysis) {
        showToast("❌ Erreur de chargement", "error");
        return;
    }
    
    // Créer une page dédiée pour afficher les détails
    const content = document.getElementById("content");
    content.innerHTML = `
        <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
            <button onclick="showAnalysisHistory()" class="mb-6 px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition font-medium">
                ← Retour à l'historique
            </button>
            
            <div id="analysisResults"></div>
        </section>
    `;
    
    // Maintenant afficher les résultats
    if (analysis.ai_diagnosis) {
        const relatedScripts = [];
        
        // Charger les scripts liés si disponibles
        if (analysis.related_script_ids && analysis.related_script_ids.length > 0) {
            const { data: scripts } = await supabase
                .from('scripts')
                .select('*')
                .in('id', analysis.related_script_ids);
            
            if (scripts) {
                relatedScripts.push(...scripts);
            }
        }
        
        displayAIAnalysisResults(analysis.ai_diagnosis, relatedScripts, analysis.ai_provider || 'groq');
    } else {
        // Affichage simple si pas de diagnostic IA structuré
        const resultsContainer = document.getElementById('analysisResults');
        resultsContainer.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-gray-300">
                <div class="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6">
                    <h2 class="text-3xl font-bold mb-2">Analyse du ${new Date(analysis.created_at).toLocaleString('fr-FR')}</h2>
                    <p class="text-gray-100">${analysis.database_type || 'Database'} - ${analysis.error_codes?.join(', ') || 'Pas de code erreur'}</p>
                </div>
                
                <div class="p-8">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">📋 Log original</h3>
                    <div class="bg-gray-900 rounded-lg p-4 mb-6">
                        <pre class="text-green-400 font-mono text-sm overflow-x-auto">${escapeHtml(analysis.log_content)}</pre>
                    </div>
                    
                    ${analysis.ai_solution ? `
                        <h3 class="text-xl font-bold text-gray-800 mb-4">💡 Solution</h3>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <p class="text-gray-700">${escapeHtml(analysis.ai_solution)}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

async function reanalyzeLog(analysisId) {
    const { data: analysis, error } = await supabase
        .from('ai_log_analyses')
        .select('log_content, database_type')
        .eq('id', analysisId)
        .single();
    
    if (error || !analysis) {
        showToast("❌ Erreur de chargement", "error");
        return;
    }
    
    // Retourner à l'analyseur avec le log
    showAIAnalyzer();
    setTimeout(() => {
        const logInput = document.getElementById('logInput');
        if (logInput) {
            logInput.value = analysis.log_content;
            showToast("✅ Log rechargé, cliquez sur Analyser", "success");
        }
    }, 100);
}

async function deleteAnalysis(analysisId) {
    if (!confirm("⚠️ Supprimer cette analyse ?")) return;
    
    const { error } = await supabase
        .from('ai_log_analyses')
        .delete()
        .eq('id', analysisId);
    
    if (error) {
        showToast("❌ Erreur de suppression", "error");
    } else {
        showToast("✅ Analyse supprimée", "success");
        showAnalysisHistory(); // Recharger
    }
}

// ==========================================
// FONCTION : Soumettre un feedback
// ==========================================

let currentAnalysisId = null;

async function submitFeedback(feedbackType) {
    // Trouver l'ID de l'analyse actuelle
    if (!currentAnalysisId) {
        // Essayer de récupérer la dernière analyse
        const { data } = await supabase
            .from('ai_log_analyses')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (data) {
            currentAnalysisId = data.id;
        }
    }
    
    if (!currentAnalysisId) {
        showToast("❌ Impossible de trouver l'analyse", "error");
        return;
    }
    
    const { error } = await supabase
        .from('ai_log_analyses')
        .update({ feedback: feedbackType })
        .eq('id', currentAnalysisId);
    
    if (error) {
        showToast("❌ Erreur lors de l'envoi du feedback", "error");
    } else {
        showToast("✅ Merci pour votre feedback !", "success");
        
        // Désactiver les boutons de feedback
        const feedbackButtons = document.querySelectorAll('button[onclick^="submitFeedback"]');
        feedbackButtons.forEach(btn => {
            btn.disabled = true;
            btn.className = btn.className.replace('hover:bg-', 'bg-gray-300 cursor-not-allowed ');
        });
    }
}

// ==========================================
// FONCTION : Sauvegarder un script généré
// ==========================================

async function saveGeneratedScript(title, sqlScript) {
    if (!user) {
        showToast("❌ Vous devez être connecté pour sauvegarder", "error");
        showLogin();
        return;
    }
    
    // Demander confirmation et détails
    const scriptTitle = prompt("Titre du script :", title);
    if (!scriptTitle) return;
    
    const description = prompt("Description (optionnelle) :", "Script généré par l'IA");
    
    // Détecter le type de DB depuis le script
    const dbType = sqlScript.toUpperCase().includes('DBMS_') || sqlScript.includes('ORA-') 
        ? 'Oracle' 
        : 'SQL Server';
    
    const script = {
        title: scriptTitle,
        database: dbType,
        category: 'DATABASE INFO', // Catégorie par défaut
        code: sqlScript,
        description: description || 'Script généré par l\'analyseur IA',
        added_by: user.email,
        visibility: 'private', // Privé par défaut
        created_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from("scripts").insert(script);
    
    if (error) {
        showToast("❌ Erreur lors de la sauvegarde", "error");
        console.error(error);
    } else {
        showToast("✅ Script sauvegardé dans votre base !", "success");
    }
}

// ==========================================
// FONCTION : Exporter en PDF (placeholder)
// ==========================================

function exportAnalysisPDF() {
    showToast("📄 Fonctionnalité d'export PDF en développement...", "error");
    // TODO: Implémenter l'export PDF avec jsPDF ou html2pdf
}