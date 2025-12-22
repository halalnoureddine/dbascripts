// ==========================================
// 🔥 js/ai-performance-analyzer-ui.js - Interface Analyseur Performance
// ==========================================

// ==========================================
// 1. PAGE PRINCIPALE ANALYSEUR PERFORMANCE
// ==========================================

function showPerformanceAnalyzer() {

    // Vérifier l'authentification
    if (!user) {
        showToast("❌ Vous devez être connecté pour accéder à l'analyseur de performance", "error");
        showLogin();
        return;
    }
    sessionStorage.setItem('currentView', 'performance-analyzer');
    
    document.getElementById("content").innerHTML = `
        <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
            
            <!-- Header -->
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-800 mb-3">
                    🔥 Analyseur de Performance 
                </h1>
                <p class="text-gray-600 text-lg">
                    Diagnostiquez les problèmes de performance de votre base de données avec l'IA
                </p>
            </div>

            <!-- Sélection du type d'analyse -->
            <div class="bg-white rounded-xl shadow-xl p-8 mb-6">
                <label class="block text-sm font-bold text-gray-800 mb-4">
                    📊 Type d'analyse
                </label>
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <button 
                        onclick="selectAnalysisType('description')"
                        class="analysis-type-btn p-4 rounded-lg border-2 border-purple-300 hover:border-purple-600 hover:bg-purple-50 transition"
                        data-type="description">
                        <div class="font-bold text-gray-800">Description</div>
                        <div class="text-xs text-gray-600">Décrivez le problème</div>
                    </button>
                    
                    <button 
                        onclick="selectAnalysisType('awr')"
                        class="analysis-type-btn p-4 rounded-lg border-2 border-gray-300 hover:border-purple-600 hover:bg-purple-50 transition"
                        data-type="awr">
                        
                        <div class="font-bold text-gray-800">Rapport AWR</div>
                        <div class="text-xs text-gray-600">Oracle AWR Report</div>
                    </button>
                    
                    <button 
                        onclick="selectAnalysisType('sql_server_report')"
                        class="analysis-type-btn p-4 rounded-lg border-2 border-gray-300 hover:border-purple-600 hover:bg-purple-50 transition"
                        data-type="sql_server_report">
                       
                        <div class="font-bold text-gray-800">Rapport SQL Server</div>
                        <div class="text-xs text-gray-600">Performance Report</div>
                    </button>
                    
                    <button 
                        onclick="selectAnalysisType('slow_query')"
                        class="analysis-type-btn p-4 rounded-lg border-2 border-gray-300 hover:border-purple-600 hover:bg-purple-50 transition"
                        data-type="slow_query">
                        
                        <div class="font-bold text-gray-800">Requête Lente</div>
                        <div class="text-xs text-gray-600">Analyser une requête SQL</div>
                    </button>
                </div>

                <!-- Zone de saisie dynamique -->
                <div id="analysisInputArea"></div>

                <!-- Boutons d'action -->
                <div class="flex gap-3 mt-6">
                    <button 
                        onclick="handlePerformanceAnalysis()"
                        class="flex-1 px-6 py-4 bg-gradient-to-r from-yellow-300 to-red-300 text-white rounded-lg hover:shadow-x1 transition font-bold text-lg">
                        🔥 Analyser 
                    </button>

                    <button 
                        onclick="showPerformanceHistory()"
                        class="px-6 py-4 bg-blue-400 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                        📜 Historique
                    </button>
                </div>
            </div>

            <!-- Zone de résultats -->
            <div id="performanceResults" class="hidden"></div>

            <!-- Info -->
            <div class="bg-orange-50 p-4 rounded-lg border-2 border-orange-200 text-sm">
                <p class="text-orange-800">
                    <strong>💡 Conseils :</strong> Pour une analyse optimale, fournissez un rapport AWR complet, des statistiques système, ou une description détaillée du problème (CPU élevé, requêtes lentes, temps de réponse, etc.).
                </p>
            </div>

        </section>
    `;
    
    // Sélectionner "Description" par défaut
    selectAnalysisType('description');
}

// ==========================================
// 2. SÉLECTION TYPE D'ANALYSE
// ==========================================

let currentAnalysisType = 'description';

function selectAnalysisType(type) {
    currentAnalysisType = type;
    
    // Mettre à jour les boutons
    document.querySelectorAll('.analysis-type-btn').forEach(btn => {
        btn.classList.remove('border-purple-600', 'bg-purple-50');
        btn.classList.add('border-gray-300');
    });
    
    const activeBtn = document.querySelector(`[data-type="${type}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('border-gray-300');
        activeBtn.classList.add('border-purple-600', 'bg-purple-50');
    }
    
    // Afficher la zone de saisie appropriée
    const inputArea = document.getElementById('analysisInputArea');
    
    const placeholders = {
        description: `Décrivez le problème de performance :

Exemple :
- L'application est lente depuis ce matin
- Le CPU de la base est à 95%
- Les requêtes prennent 10 secondes au lieu de 2 secondes
- Les utilisateurs se plaignent de timeouts
- La mémoire est saturée`,
        
        awr: `Collez ici le contenu du rapport AWR (Automatic Workload Repository) :

Obtenir un AWR :
SQL> @?/rdbms/admin/awrrpt.sql

Le rapport doit contenir :
- Top SQL queries
- Wait Events
- Load Profile
- Instance Statistics`,
        
        sql_server_report: `Collez ici le rapport de performance SQL Server :

Exemples de requêtes utiles :
- sys.dm_exec_query_stats (requêtes lentes)
- sys.dm_os_wait_stats (wait statistics)
- sys.dm_db_index_usage_stats (index manquants)
- sp_who2 (processus actifs)
- sys.dm_os_performance_counters`,
        
        slow_query: `Collez ici la requête SQL lente :

SELECT ...
FROM ...
WHERE ...

Vous pouvez aussi inclure :
- Le plan d'exécution (EXPLAIN PLAN / Execution Plan)
- Le temps d'exécution
- Le nombre de lignes retournées`
    };
    
    const labels = {
        description: '📝 Description du problème',
        awr: '🔶 Rapport AWR Oracle',
        sql_server_report: '🔷 Rapport Performance SQL Server',
        slow_query: '🐌 Requête SQL Lente'
    };
    
    // Pour AWR et SQL Server Report : proposer upload de fichier
    if (type === 'awr' || type === 'sql_server_report') {
        inputArea.innerHTML = `
            <div>
                <label class="block text-sm font-bold text-gray-800 mb-3">
                    ${labels[type]}
                </label>
                
                <!-- Zone d'upload de fichier -->
                <div class="mb-4">
                    <div class="border-2 border-dashed border-orange-300 rounded-xl p-8 text-center bg-orange-50 hover:bg-orange-100 transition cursor-pointer"
                         onclick="document.getElementById('perfFileInput').click()">
                        <input 
                            type="file" 
                            id="perfFileInput" 
                            accept=".html,.txt,.csv,.log" 
                            class="hidden"
                            onchange="handlePerformanceFileUpload(event)" 
                        />
                        <div class="text-5xl mb-3">📁</div>
                        <p class="text-lg font-bold text-gray-800 mb-2">
                            Cliquez pour uploader le rapport
                        </p>
                        <p class="text-sm text-gray-600">
                            ${type === 'awr' ? 
                                'Formats acceptés : .html, .txt (rapport AWR Oracle)' : 
                                'Formats acceptés : .html, .txt, .csv (rapport SQL Server)'}
                        </p>
                        <p class="text-xs text-gray-500 mt-2">
                            Taille max : 10 MB
                        </p>
                    </div>
                    
                    <!-- Fichier uploadé -->
                    <div id="uploadedFileInfo" class="hidden mt-3 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl">✅</span>
                                <div>
                                    <p class="font-bold text-gray-800" id="uploadedFileName"></p>
                                    <p class="text-sm text-gray-600" id="uploadedFileSize"></p>
                                </div>
                            </div>
                            <button 
                                onclick="clearUploadedFile()"
                                class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm">
                                🗑️ Supprimer
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- OU séparateur -->
                <div class="flex items-center gap-4 my-4">
                    <div class="flex-1 border-t border-gray-300"></div>
                    <span class="text-sm text-gray-500 font-medium">OU</span>
                    <div class="flex-1 border-t border-gray-300"></div>
                </div>
                
                <!-- Zone de texte alternative -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Copier-coller le rapport ici
                    </label>
                    <textarea 
                        id="performanceInput" 
                        rows="8"
                        class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                        placeholder="${placeholders[type]}"></textarea>
                    <p class="text-xs text-gray-500 mt-2">
                        💡 Vous pouvez soit uploader le fichier, soit copier-coller le contenu
                    </p>
                </div>
            </div>
        `;
    } else {
        // Pour description et slow_query : textarea classique
        inputArea.innerHTML = `
            <div>
                <label class="block text-sm font-bold text-gray-800 mb-3">
                    ${labels[type]}
                </label>
                <textarea 
                    id="performanceInput" 
                    rows="14"
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                    placeholder="${placeholders[type]}"></textarea>
                <p class="text-xs text-gray-500 mt-2">
                    💡 Plus vous fournissez d'informations, meilleure sera l'analyse
                </p>
            </div>
        `;
    }
}

// ==========================================
// 2.5. GESTION UPLOAD FICHIERS
// ==========================================

let uploadedFileContent = null;
let uploadedFileInfo = null;

async function handlePerformanceFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Vérifier la taille (max 10 MB)
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
        showToast("❌ Fichier trop volumineux (max 10 MB)", "error");
        event.target.value = '';
        return;
    }
    
    // Vérifier l'extension
    const validExtensions = ['.html', '.htm', '.txt', '.csv', '.log'];
    const fileName = file.name.toLowerCase();
    const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidExtension) {
        showToast("❌ Format non supporté. Utilisez : .html, .txt, .csv, .log", "error");
        event.target.value = '';
        return;
    }
    
    showLoader("📁 Lecture du fichier...");
    
    try {
        const content = await readFileContent(file);
        
        hideLoader();
        
        uploadedFileContent = content;
        uploadedFileInfo = {
            name: file.name,
            size: file.size,
            type: file.type
        };
        
        // Afficher l'info du fichier uploadé
        const infoDiv = document.getElementById('uploadedFileInfo');
        const fileNameSpan = document.getElementById('uploadedFileName');
        const fileSizeSpan = document.getElementById('uploadedFileSize');
        
        if (infoDiv && fileNameSpan && fileSizeSpan) {
            fileNameSpan.textContent = file.name;
            fileSizeSpan.textContent = `${(file.size / 1024).toFixed(2)} KB - ${content.length} caractères`;
            infoDiv.classList.remove('hidden');
        }
        
        // Vider le textarea
        const textarea = document.getElementById('performanceInput');
        if (textarea) {
            textarea.value = '';
            textarea.placeholder = `✅ Fichier "${file.name}" chargé (${(file.size / 1024).toFixed(2)} KB)`;
        }
        
        showToast(`✅ Fichier "${file.name}" chargé avec succès !`, "success");
        
    } catch (error) {
        hideLoader();
        console.error('Error reading file:', error);
        showToast("❌ Erreur lors de la lecture du fichier", "error");
        event.target.value = '';
    }
}

function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            resolve(e.target.result);
        };
        
        reader.onerror = () => {
            reject(new Error("Erreur de lecture du fichier"));
        };
        
        reader.readAsText(file);
    });
}

function clearUploadedFile() {
    uploadedFileContent = null;
    uploadedFileInfo = null;
    
    const infoDiv = document.getElementById('uploadedFileInfo');
    if (infoDiv) {
        infoDiv.classList.add('hidden');
    }
    
    const fileInput = document.getElementById('perfFileInput');
    if (fileInput) {
        fileInput.value = '';
    }
    
    const textarea = document.getElementById('performanceInput');
    if (textarea) {
        textarea.placeholder = textarea.dataset.originalPlaceholder || 'Collez votre rapport ici...';
    }
    
    showToast("🗑️ Fichier supprimé", "success");
}

// ==========================================
// 3. LANCER L'ANALYSE
// ==========================================

async function handlePerformanceAnalysis() {
    let content = '';
    
    // Priorité 1 : Fichier uploadé
    if (uploadedFileContent) {
        content = uploadedFileContent;
    } 
    // Priorité 2 : Contenu du textarea
    else {
        const input = document.getElementById('performanceInput');
        if (input) {
            content = input.value.trim();
        }
    }
    
    if (!content) {
        showToast("❌ Veuillez uploader un fichier ou saisir des informations", "error");
        return;
    }
    
    // Lancer l'analyse
    await analyzePerformanceIssue(content, currentAnalysisType);
}

// ==========================================
// 4. AFFICHER RÉSULTATS PERFORMANCE
// ==========================================

function displayPerformanceAnalysisResults(analysis, relatedScripts, metrics) {
    const resultsContainer = document.getElementById('performanceResults');
    resultsContainer.className = 'animate-fade-in';
    
    const severityColors = {
        low: 'bg-green-100 text-green-800 border-green-300',
        medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        high: 'bg-orange-100 text-orange-800 border-orange-300',
        critical: 'bg-red-100 text-red-800 border-red-300'
    };
    
    const severityEmojis = {
        low: '🟢',
        medium: '🟡',
        high: '🟠',
        critical: '🔴'
    };
    
    const severityClass = severityColors[analysis.severity] || severityColors.medium;
    const severityEmoji = severityEmojis[analysis.severity] || '⚪';
    
    resultsContainer.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-orange-300">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-orange-600 to-red-600 text-noir p-6">
                <div class="flex items-center justify-between mb-3">
                    <span class="px-4 py-1 bg-white/20 rounded-full text-sm font-bold">
                        🔥 Analyse de Performance
                    </span>
                    <span class="text-3xl">${severityEmoji}</span>
                </div>
                <h2 class="text-3xl font-bold mb-2">${escapeHtml(analysis.title)}</h2>
                <div class="flex items-center gap-4 text-orange-100">
                    <span>📊 ${analysis.database_type || 'Database'}</span>
                    <span>🎯 ${analysis.bottleneck_type || 'General'}</span>
                    ${analysis.health_score ? `<span>💪 Score: ${analysis.health_score}/100</span>` : ''}
                </div>
            </div>

            <div class="p-8">
                
                <!-- Niveau de gravité -->
                <div class="mb-8">
                    <div class="px-4 py-3 rounded-lg border-2 ${severityClass} font-bold text-center">
                        ${severityEmoji} Gravité : ${analysis.severity.toUpperCase()}
                    </div>
                </div>

                <!-- Description -->
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-800 mb-3 flex items-center">
                        <span class="text-2xl mr-2">📋</span>
                        Diagnostic
                    </h3>
                    <p class="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                        ${escapeHtml(analysis.description)}
                    </p>
                </div>

                <!-- Problèmes principaux -->
                ${analysis.top_issues && analysis.top_issues.length > 0 ? `
                    <div class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <span class="text-2xl mr-2">⚠️</span>
                            Problèmes Identifiés
                        </h3>
                        <div class="space-y-3">
                            ${analysis.top_issues.map(issue => `
                                <div class="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                                    <div class="flex items-center justify-between mb-2">
                                        <h4 class="font-bold text-gray-800">${escapeHtml(issue.issue)}</h4>
                                        <span class="px-2 py-1 rounded text-xs font-bold ${
                                            issue.impact === 'high' ? 'bg-red-100 text-red-700' :
                                            issue.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }">
                                            Impact: ${issue.impact}
                                        </span>
                                    </div>
                                    <p class="text-gray-700 text-sm">${escapeHtml(issue.description)}</p>
                                    ${issue.metric_value ? `
                                        <p class="text-xs text-gray-600 mt-2">📊 Valeur mesurée : ${escapeHtml(issue.metric_value)}</p>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Wait Events (Oracle) -->
                ${analysis.wait_events_analysis && analysis.wait_events_analysis.length > 0 ? `
                    <div class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <span class="text-2xl mr-2">⏳</span>
                            Wait Events
                        </h3>
                        <div class="space-y-2">
                            ${analysis.wait_events_analysis.map(event => `
                                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="font-bold text-blue-900">${escapeHtml(event.event_name)}</span>
                                        <span class="px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-sm font-bold">
                                            ${event.percentage}%
                                        </span>
                                    </div>
                                    <p class="text-sm text-blue-800">${escapeHtml(event.impact)}</p>
                                    <p class="text-xs text-blue-700 mt-1">🔍 ${escapeHtml(event.root_cause)}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Requêtes lentes -->
                ${analysis.slow_queries && analysis.slow_queries.length > 0 ? `
                    <div class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <span class="text-2xl mr-2">🐌</span>
                            Requêtes Lentes
                        </h3>
                        <div class="space-y-3">
                            ${analysis.slow_queries.map(query => `
                                <div class="bg-gray-900 p-4 rounded-lg">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-green-400 font-mono text-sm">
                                            ${query.sql_id || query.query_hash || 'Query'}
                                        </span>
                                        <span class="text-orange-400 text-xs">
                                            ⚡ ${query.avg_elapsed_time || query.avg_duration_ms} ms
                                        </span>
                                    </div>
                                    <p class="text-gray-300 text-sm">${escapeHtml(query.problem)}</p>
                                    <div class="flex gap-4 text-xs text-gray-400 mt-2">
                                        ${query.executions ? `<span>🔄 ${query.executions} execs</span>` : ''}
                                        ${query.buffer_gets ? `<span>📊 ${query.buffer_gets} buffer gets</span>` : ''}
                                        ${query.cpu_time_ms ? `<span>⚙️ ${query.cpu_time_ms} ms CPU</span>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Index manquants (SQL Server) -->
                ${analysis.missing_indexes && analysis.missing_indexes.length > 0 ? `
                    <div class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <span class="text-2xl mr-2">🔍</span>
                            Index Manquants
                        </h3>
                        <div class="space-y-3">
                            ${analysis.missing_indexes.map(idx => `
                                <div class="border-2 border-purple-200 rounded-lg p-4">
                                    <div class="flex items-center justify-between mb-2">
                                        <h4 class="font-bold text-gray-800">Table: ${escapeHtml(idx.table)}</h4>
                                        <span class="px-2 py-1 rounded text-xs font-bold ${
                                            idx.impact === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                        }">
                                            ${idx.impact}
                                        </span>
                                    </div>
                                    ${idx.create_statement ? `
                                        <div class="bg-gray-900 rounded-lg p-3 mt-2">
                                            <pre class="text-green-400 font-mono text-xs overflow-x-auto">${escapeHtml(idx.create_statement)}</pre>
                                            <button 
                                                onclick="copyToClipboard(\`${idx.create_statement.replace(/`/g, '\\`')}\`)"
                                                class="mt-2 px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700">
                                                📋 Copier
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Recommandations -->
                ${analysis.recommendations && analysis.recommendations.length > 0 ? `
                    <div class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <span class="text-2xl mr-2">✅</span>
                            Recommandations
                        </h3>
                        <div class="space-y-4">
                            ${analysis.recommendations.map((rec, idx) => `
                                <div class="border-2 border-gray-200 rounded-lg p-5 hover:border-orange-400 transition">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex items-center gap-3">
                                            <span class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full flex items-center justify-center font-bold">
                                                ${rec.priority || idx + 1}
                                            </span>
                                            <div>
                                                <h4 class="font-bold text-gray-800 text-lg">${escapeHtml(rec.title)}</h4>
                                                <span class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">${rec.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p class="text-gray-700 mb-3 ml-11">${escapeHtml(rec.description)}</p>
                                    ${rec.expected_impact ? `
                                        <p class="text-sm text-green-700 bg-green-50 p-2 rounded ml-11 mb-2">
                                            📈 Impact attendu : ${escapeHtml(rec.expected_impact)}
                                        </p>
                                    ` : ''}
                                    ${rec.implementation ? `
                                        <p class="text-sm text-blue-700 bg-blue-50 p-2 rounded ml-11 mb-2">
                                            🛠️ ${escapeHtml(rec.implementation)}
                                        </p>
                                    ` : ''}
                                    ${rec.sql_script ? `
                                        <div class="ml-11">
                                            <div class="bg-gray-900 rounded-lg p-4 relative">
                                                <pre class="text-green-400 font-mono text-sm overflow-x-auto">${escapeHtml(rec.sql_script)}</pre>
                                                <button 
                                                    onclick="copyToClipboard(\`${rec.sql_script.replace(/`/g, '\\`')}\`)"
                                                    class="absolute top-2 right-2 px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700">
                                                    📋 Copier
                                                </button>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Statistiques système -->
                ${analysis.system_statistics ? `
                    <div class="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
                        <h3 class="text-lg font-bold text-blue-900 mb-3 flex items-center">
                            <span class="text-2xl mr-2">📊</span>
                            Statistiques Système
                        </h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            ${Object.entries(analysis.system_statistics).map(([key, value]) => `
                                <div class="bg-white p-3 rounded-lg text-center">
                                    <div class="text-sm text-gray-600 mb-1">${key.replace(/_/g, ' ').toUpperCase()}</div>
                                    <div class="text-xl font-bold text-blue-900">${value}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Scripts recommandés -->
                ${relatedScripts && relatedScripts.length > 0 ? `
                    <div class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-3 flex items-center">
                            <span class="text-2xl mr-2">📚</span>
                            Scripts Recommandés
                        </h3>
                        <div class="space-y-3">
                            ${relatedScripts.map(script => renderScriptCard(script)).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Requête optimisée -->
                ${analysis.optimized_query ? `
                    <div class="mb-8 bg-green-50 p-6 rounded-lg border-2 border-green-200">
                        <h3 class="text-lg font-bold text-green-900 mb-3 flex items-center">
                            <span class="text-2xl mr-2">⚡</span>
                            Requête Optimisée
                        </h3>
                        <div class="bg-gray-900 rounded-lg p-4 relative">
                            <pre class="text-green-400 font-mono text-sm overflow-x-auto">${escapeHtml(analysis.optimized_query)}</pre>
                            <button 
                                onclick="copyToClipboard(\`${analysis.optimized_query.replace(/`/g, '\\`')}\`)"
                                class="absolute top-2 right-2 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                                📋 Copier
                            </button>
                        </div>
                    </div>
                ` : ''}

                <!-- Actions -->
                <div class="flex gap-3 pt-6 border-t mt-6">
                    <button 
                        onclick="showPerformanceAnalyzer()"
                        class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">
                        ← Nouvelle analyse
                    </button>
                    <button 
                        onclick="exportPerformanceReportPDF()"
                        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                        📄 Exporter en PDF
                    </button>
                </div>

            </div>
        </div>
    `;
}



// ==========================================
// 6. HISTORIQUE
// ==========================================

async function showPerformanceHistory() {
    sessionStorage.setItem('currentView', 'performance-history');
    
    const content = document.getElementById("content");
    content.innerHTML = `
        <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
            <button onclick="showPerformanceAnalyzer()" class="mb-6 px-4 py-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition font-medium">
                ← Retour à l'analyseur
            </button>
            
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gray-800 mb-3">📜 Historique des Analyses de Performance</h2>
                <p class="text-gray-600">Toutes vos analyses sauvegardées</p>
            </div>
            
            <div id="perfHistoryContainer">
                <div class="text-center py-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent mx-auto mb-4"></div>
                    <p class="text-gray-600">Chargement...</p>
                </div>
            </div>
        </section>
    `;
    
    await loadPerformanceHistoryData();
}

async function loadPerformanceHistoryData() {
    const container = document.getElementById('perfHistoryContainer');
    
    try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
            container.innerHTML = `
                <div class="bg-white rounded-xl shadow-lg p-12 text-center">
                    <div class="text-6xl mb-4">🔒</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4">Connexion requise</h3>
                    <button onclick="showLogin()" class="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium">
                        🔑 Se connecter
                    </button>
                </div>
            `;
            return;
        }
        
        const { data: analyses, error } = await supabase
            .from('performance_analyses')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) {
            console.error('Error loading history:', error);
            container.innerHTML = `
                <div class="bg-white rounded-xl shadow-lg p-12 text-center">
                    <div class="text-6xl mb-4">❌</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4">Erreur</h3>
                    <p class="text-gray-600">${error.message}</p>
                </div>
            `;
            return;
        }
        
        if (!analyses || analyses.length === 0) {
            container.innerHTML = `
                <div class="bg-white rounded-xl shadow-lg p-12 text-center">
                    <div class="text-6xl mb-4">🔥</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4">Aucune analyse</h3>
                    <p class="text-gray-600 mb-6">Vous n'avez pas encore effectué d'analyse de performance</p>
                    <button onclick="showPerformanceAnalyzer()" class="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium">
                        🔥 Commencer une analyse
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="mb-4">
                <p class="text-gray-600">
                    <strong>${analyses.length}</strong> analyse(s) trouvée(s)
                </p>
            </div>
            
            <div class="space-y-4">
                ${analyses.map(analysis => renderPerformanceAnalysisCard(analysis)).join('')}
            </div>
        `;
        
    } catch (err) {
        console.error('Exception:', err);
        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg p-12 text-center">
                <div class="text-6xl mb-4">❌</div>
                <p class="text-gray-600">${err.message}</p>
            </div>
        `;
    }
}

function renderPerformanceAnalysisCard(analysis) {
    const date = new Date(analysis.created_at).toLocaleString('fr-FR');
    const severityEmojis = {
        low: '🟢',
        medium: '🟡',
        high: '🟠',
        critical: '🔴'
    };
    
    const inputTypeLabels = {
        description: '📝 Description',
        awr: '🔶 AWR',
        sql_server_report: '🔷 SQL Server',
        slow_query: '🐌 Requête'
    };
    
    return `
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition border-2 border-gray-200 hover:border-orange-400">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-2xl">${severityEmojis[analysis.severity] || '⚪'}</span>
                        <span class="font-bold text-gray-800">${analysis.database_type || 'Database'}</span>
                        <span class="text-gray-400">•</span>
                        <span class="text-sm text-gray-600">${date}</span>
                    </div>
                    <div class="flex gap-2 mb-3">
                        <span class="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">
                            ${inputTypeLabels[analysis.input_type] || analysis.input_type}
                        </span>
                        <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                            ${analysis.bottleneck_type || 'General'}
                        </span>
                        ${analysis.health_score ? `
                            <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                💪 ${analysis.health_score}/100
                            </span>
                        ` : ''}
                    </div>
                    <h3 class="font-bold text-gray-800 text-lg mb-2">
                        ${escapeHtml(analysis.ai_diagnosis?.title || 'Analyse de performance')}
                    </h3>
                </div>
            </div>
            
            <div class="flex gap-2">
                <button 
                    onclick="viewPerformanceAnalysisDetail(${analysis.id})"
                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium">
                    👁️ Voir les détails
                </button>
                <button 
                    onclick="deletePerformanceAnalysis(${analysis.id})"
                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium">
                    🗑️ Supprimer
                </button>
            </div>
        </div>
    `;
}

async function viewPerformanceAnalysisDetail(analysisId) {
    const { data: analysis, error } = await supabase
        .from('performance_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();
    
    if (error || !analysis) {
        showToast("❌ Erreur de chargement", "error");
        return;
    }
    
    const content = document.getElementById("content");
    content.innerHTML = `
        <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
            <button onclick="showPerformanceHistory()" class="mb-6 px-4 py-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition font-medium">
                ← Retour à l'historique
            </button>
            
            <div id="performanceResults"></div>
        </section>
    `;
    
    // Charger les scripts liés
    const relatedScripts = [];
    if (analysis.related_script_ids && analysis.related_script_ids.length > 0) {
        const { data: scripts } = await supabase
            .from('scripts')
            .select('*')
            .in('id', analysis.related_script_ids);
        
        if (scripts) {
            relatedScripts.push(...scripts);
        }
    }
    
    displayPerformanceAnalysisResults(analysis.ai_diagnosis, relatedScripts, analysis.metrics);
}

async function deletePerformanceAnalysis(analysisId) {
    if (!confirm("⚠️ Supprimer cette analyse ?")) return;
    
    const { error } = await supabase
        .from('performance_analyses')
        .delete()
        .eq('id', analysisId);
    
    if (error) {
        showToast("❌ Erreur", "error");
    } else {
        showToast("✅ Supprimée", "success");
        showPerformanceHistory();
    }
}

// ==========================================
// 7. EXPORT PDF
// ==========================================

function exportPerformanceReportPDF() {
    showToast("📄 Fonctionnalité d'export PDF en développement...", "error");
}