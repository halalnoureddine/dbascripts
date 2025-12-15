// ==========================================
// 🤖 js/ai-script-generator-ui.js - Interface Générateur de Scripts
// ==========================================

// ==========================================
// 1. PAGE PRINCIPALE DU GÉNÉRATEUR
// ==========================================

function showScriptGenerator() {
    // Vérifier l'authentification
    if (!user) {
        showToast("❌ Vous devez être connecté pour accéder au générateur de scripts", "error");
        showLogin();
        return;
    }
    
    sessionStorage.setItem('currentView', 'script-generator');
    
    document.getElementById("content").innerHTML = `
        <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
            
            <!-- Header -->
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-800 mb-3">
                    🚀 Générateur de Scripts SQL 
                </h1>
                <p class="text-gray-600 text-lg">
                    Décrivez votre besoin et l'IA génère le script SQL optimal pour vous
                </p>
            </div>

            <!-- Zone de saisie principale -->
            <div class="bg-white rounded-xl shadow-xl p-8 mb-6">
                <div class="mb-6">
                    <label class="block text-sm font-bold text-gray-800 mb-3">
                        📝 Décrivez votre besoin
                    </label>
                    <textarea 
                        id="scriptRequest" 
                        rows="8"
                        class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                        placeholder="Exemples:
- Créer une table CLIENTS avec nom, email, téléphone et date d'inscription
- Script pour sauvegarder toutes les tables de la base PROD
- Requête pour trouver les 10 requêtes les plus lentes
- Créer un index sur la colonne ORDER_DATE de la table ORDERS
- Script de monitoring de l'espace disque disponible
- Procédure stockée pour calculer le total des commandes par client"></textarea>
                    <p class="text-xs text-gray-500 mt-2">
                        💡 Astuce : Soyez précis dans votre description. Plus vous donnez de détails, meilleur sera le script généré.
                    </p>
                </div>

                <!-- Sélection de la base de données -->
                <div class="mb-6">
                    <label class="block text-sm font-bold text-gray-800 mb-3">
                        🗄️ Base de données cible (optionnel)
                    </label>
                    <div class="flex gap-4">
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="targetDb" value="auto" checked class="mr-2" />
                            <span class="text-gray-700">🔍 Détection automatique</span>
                        </label>
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="targetDb" value="Oracle" class="mr-2" />
                            <span class="text-gray-700">🔶 Oracle</span>
                        </label>
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="targetDb" value="SQL Server" class="mr-2" />
                            <span class="text-gray-700">🔷 SQL Server</span>
                        </label>
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="targetDb" value="PostgreSQL" class="mr-2" />
                            <span class="text-gray-700">🐘 PostgreSQL</span>
                        </label>
                    </div>
                </div>

                <!-- Boutons d'action -->
                <div class="flex gap-3">
                    <button 
                        onclick="handleGenerateScript()"
                        class="flex-1 px-6 py-4 bg-gradient-to-r from-purple-400 to-indigo-500 text-white rounded-lg hover:shadow-x1 transition font-bold text-lg">
                        🚀 Générer le Script
                    </button>

                    <button 
                        onclick="showGenerationHistory()"
                        class="px-6 py-4 bg-blue-400 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                        📜 Historique
                    </button>
                </div>
            </div>

            <!-- Zone de résultats (masquée au départ) -->
            <div id="generationResults" class="hidden"></div>

            <!-- Info sur l'IA -->
            <div class="bg-purple-50 p-4 rounded-lg border-2 border-purple-200 text-sm">
                <p class="text-purple-800">
                    <strong>🤖 IA utilisée :</strong> Groq (Llama 3.3 - 70B - Ultra-performant).
                    ${!window.AI_CONFIG || !window.AI_CONFIG.groqApiKey ? '<span class="text-orange-600">⚠️ <a href="#" onclick="showGroqConfigModal(); return false;" class="underline">Configurer Groq</a> pour commencer.</span>' : '✅ Groq configuré'}
                </p>
            </div>

        </section>
    `;
}

// ==========================================
// 2. GÉRER LE CLIC SUR GÉNÉRER
// ==========================================

async function handleGenerateScript() {
    const requestInput = document.getElementById('scriptRequest');
    const userRequest = requestInput.value.trim();
    
    if (!userRequest) {
        showToast("❌ Veuillez décrire votre besoin", "error");
        requestInput.focus();
        return;
    }
    
    // Récupérer la base de données sélectionnée
    const selectedDb = document.querySelector('input[name="targetDb"]:checked').value;
    const targetDatabase = selectedDb === 'auto' ? null : selectedDb;
    
    // Lancer la génération
    await generateScriptFromRequest(userRequest, targetDatabase);
}

// ==========================================
// 3. AFFICHER LE SCRIPT GÉNÉRÉ
// ==========================================

function displayGeneratedScript(generatedScript, analysis) {
    const resultsContainer = document.getElementById('generationResults');
    resultsContainer.className = 'animate-fade-in';
    
    const complexityColors = {
        simple: 'bg-green-100 text-green-800 border-green-300',
        medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        complex: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    
    const complexityClass = complexityColors[analysis.complexity] || complexityColors.medium;
    
    const dbIcons = {
        'Oracle': '🔶',
        'SQL Server': '🔷',
        'PostgreSQL': '🐘'
    };
    
    const dbIcon = dbIcons[generatedScript.database_type] || '💾';
    
    resultsContainer.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-purple-300">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
                <div class="flex items-center justify-between mb-3">
                    <span class="px-4 py-1 bg-white/20 rounded-full text-sm font-bold">
                        ✨ Script Généré
                    </span>
                    <span class="text-3xl">${dbIcon}</span>
                </div>
                <h2 class="text-3xl font-bold mb-2">${escapeHtml(generatedScript.script_title)}</h2>
                <div class="flex items-center gap-4 text-purple-100">
                    <span>📊 ${generatedScript.database_type}</span>
                    <span>📁 ${generatedScript.category}</span>
                    <span class="px-2 py-1 rounded ${complexityClass}">${analysis.complexity}</span>
                </div>
            </div>

            <div class="p-8">
                
                <!-- Description -->
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-800 mb-3 flex items-center">
                        <span class="text-2xl mr-2">📋</span>
                        Description
                    </h3>
                    <p class="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                        ${escapeHtml(generatedScript.description)}
                    </p>
                </div>

                <!-- Script SQL -->
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span class="text-2xl mr-2">💻</span>
                        Script SQL Généré
                    </h3>
                    <div class="bg-gray-900 rounded-lg p-4 relative">
                        <pre class="text-green-400 font-mono text-sm overflow-x-auto">${escapeHtml(generatedScript.sql_script)}</pre>
                        <button 
                            onclick="copyGeneratedScript()"
                            class="absolute top-2 right-2 px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700">
                            📋 Copier
                        </button>
                    </div>
                    <div class="mt-3 flex gap-2">
                        <button 
                            onclick="saveGeneratedScriptToDatabase(${JSON.stringify(generatedScript).replace(/"/g, '&quot;')})"
                            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium">
                            💾 Sauvegarder dans ma bibliothèque
                        </button>
                        <button 
                            onclick="exportGeneratedScriptSQL()"
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                            📥 Exporter en .sql
                        </button>
                    </div>
                </div>

                <!-- Prérequis -->
                ${generatedScript.prerequisites && generatedScript.prerequisites.length > 0 ? `
                    <div class="mb-8 bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
                        <h3 class="text-lg font-bold text-yellow-900 mb-3 flex items-center">
                            <span class="text-2xl mr-2">⚠️</span>
                            Prérequis
                        </h3>
                        <ul class="space-y-2">
                            ${generatedScript.prerequisites.map(prereq => `
                                <li class="flex items-start">
                                    <span class="text-yellow-600 mr-2">▸</span>
                                    <span class="text-yellow-800">${escapeHtml(prereq)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <!-- Notes d'exécution -->
                ${generatedScript.execution_notes && generatedScript.execution_notes.length > 0 ? `
                    <div class="mb-8 bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                        <h3 class="text-lg font-bold text-blue-900 mb-3 flex items-center">
                            <span class="text-2xl mr-2">📌</span>
                            Notes d'Exécution
                        </h3>
                        <ul class="space-y-2">
                            ${generatedScript.execution_notes.map(note => `
                                <li class="flex items-start">
                                    <span class="text-blue-600 mr-2">▸</span>
                                    <span class="text-blue-800">${escapeHtml(note)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <!-- Hypothèses faites -->
                ${generatedScript.assumptions_made && generatedScript.assumptions_made.length > 0 ? `
                    <div class="mb-8 bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                        <h3 class="text-lg font-bold text-purple-900 mb-3 flex items-center">
                            <span class="text-2xl mr-2">💭</span>
                            Hypothèses Faites
                        </h3>
                        <ul class="space-y-2">
                            ${generatedScript.assumptions_made.map(assumption => `
                                <li class="flex items-start">
                                    <span class="text-purple-600 mr-2">▸</span>
                                    <span class="text-purple-800">${escapeHtml(assumption)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <!-- Exemples d'utilisation -->
                ${generatedScript.usage_examples && generatedScript.usage_examples.length > 0 ? `
                    <div class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <span class="text-2xl mr-2">💡</span>
                            Exemples d'Utilisation
                        </h3>
                        <div class="space-y-4">
                            ${generatedScript.usage_examples.map(example => `
                                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <h4 class="font-bold text-green-900 mb-2">${escapeHtml(example.scenario)}</h4>
                                    <div class="bg-gray-900 rounded p-3">
                                        <pre class="text-green-400 font-mono text-xs overflow-x-auto">${escapeHtml(example.example)}</pre>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Approches alternatives -->
                ${generatedScript.alternatives && generatedScript.alternatives.length > 0 ? `
                    <div class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <span class="text-2xl mr-2">🔀</span>
                            Approches Alternatives
                        </h3>
                        <div class="space-y-4">
                            ${generatedScript.alternatives.map(alt => `
                                <div class="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                    <h4 class="font-bold text-gray-800 mb-3">${escapeHtml(alt.approach)}</h4>
                                    <div class="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <p class="text-sm font-bold text-green-700 mb-2">✅ Avantages</p>
                                            <ul class="text-sm text-gray-700 space-y-1">
                                                ${alt.pros.map(pro => `<li>• ${escapeHtml(pro)}</li>`).join('')}
                                            </ul>
                                        </div>
                                        <div>
                                            <p class="text-sm font-bold text-red-700 mb-2">❌ Inconvénients</p>
                                            <ul class="text-sm text-gray-700 space-y-1">
                                                ${alt.cons.map(con => `<li>• ${escapeHtml(con)}</li>`).join('')}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Informations supplémentaires -->
                <div class="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg border-2 border-indigo-200">
                    <h3 class="text-lg font-bold text-indigo-900 mb-3 flex items-center">
                        <span class="text-2xl mr-2">ℹ️</span>
                        Informations Supplémentaires
                    </h3>
                    <div class="grid md:grid-cols-2 gap-4 text-sm">
                        ${generatedScript.estimated_execution_time ? `
                            <div>
                                <span class="font-bold text-indigo-800">⏱️ Temps d'exécution estimé :</span>
                                <p class="text-indigo-700">${escapeHtml(generatedScript.estimated_execution_time)}</p>
                            </div>
                        ` : ''}
                        ${generatedScript.potential_impact ? `
                            <div>
                                <span class="font-bold text-indigo-800">⚡ Impact potentiel :</span>
                                <p class="text-indigo-700">${escapeHtml(generatedScript.potential_impact)}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-3 pt-6 border-t mt-6">
                    <button 
                        onclick="showScriptGenerator()"
                        class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">
                        ← Nouvelle génération
                    </button>
                    <button 
                        onclick="shareGeneratedScript()"
                        class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                        📤 Partager
                    </button>
                </div>

            </div>
        </div>
    `;
    
    // Stocker le script pour les actions
    window.currentGeneratedScript = generatedScript;
}

// ==========================================
// 4. ACTIONS SUR LE SCRIPT GÉNÉRÉ
// ==========================================

function copyGeneratedScript() {
    if (!window.currentGeneratedScript) return;
    
    navigator.clipboard.writeText(window.currentGeneratedScript.sql_script)
        .then(() => showToast('📋 Script copié dans le presse-papiers !', 'success'))
        .catch(() => showToast('❌ Erreur lors de la copie', 'error'));
}

function exportGeneratedScriptSQL() {
    if (!window.currentGeneratedScript) return;
    
    const script = window.currentGeneratedScript;
    const content = `-- ${script.script_title}
-- Base de données: ${script.database_type}
-- Catégorie: ${script.category}
-- Généré le: ${new Date().toLocaleString('fr-FR')}
--
-- Description: ${script.description}
--

${script.sql_script}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${script.script_title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.sql`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast("📥 Script exporté !", "success");
}

function shareGeneratedScript() {
    if (!window.currentGeneratedScript) return;
    
    const script = window.currentGeneratedScript;
    const shareUrl = window.location.href;
    const shareText = `Script SQL généré par IA: ${script.script_title}`;
    
    if (navigator.share) {
        navigator.share({
            title: script.script_title,
            text: shareText,
            url: shareUrl
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(shareUrl)
            .then(() => showToast('🔗 Lien copié !', 'success'))
            .catch(() => showToast('❌ Erreur', 'error'));
    }
}


// ==========================================
// 6. HISTORIQUE DES GÉNÉRATIONS
// ==========================================

async function showGenerationHistory() {
    sessionStorage.setItem('currentView', 'generation-history');
    
    const content = document.getElementById("content");
    content.innerHTML = `
        <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
            <button onclick="showScriptGenerator()" class="mb-6 px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition font-medium">
                ← Retour au générateur
            </button>
            
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gray-800 mb-3">📜 Historique des Scripts Générés</h2>
                <p class="text-gray-600">Tous vos scripts générés par l'IA</p>
            </div>
            
            <div id="generationHistoryContainer">
                <div class="text-center py-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                    <p class="text-gray-600">Chargement...</p>
                </div>
            </div>
        </section>
    `;
    
    await loadGenerationHistoryData();
}

async function loadGenerationHistoryData() {
    const container = document.getElementById('generationHistoryContainer');
    
    const generations = await loadGenerationHistory();
    
    if (generations.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg p-12 text-center">
                <div class="text-6xl mb-4">🤖</div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">Aucune génération</h3>
                <p class="text-gray-600 mb-6">Vous n'avez pas encore généré de scripts</p>
                <button onclick="showScriptGenerator()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
                    🚀 Générer mon premier script
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="mb-4">
            <p class="text-gray-600">
                <strong>${generations.length}</strong> génération(s) trouvée(s)
            </p>
        </div>
        
        <div class="space-y-4">
            ${generations.map(gen => renderGenerationCard(gen)).join('')}
        </div>
    `;
}

function renderGenerationCard(generation) {
    const date = new Date(generation.created_at).toLocaleString('fr-FR');
    const dbIcons = {
        'Oracle': '🔶',
        'SQL Server': '🔷',
        'PostgreSQL': '🐘'
    };
    const dbIcon = dbIcons[generation.database_type] || '💾';
    
    return `
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition border-2 border-gray-200 hover:border-purple-400">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-2xl">${dbIcon}</span>
                        <span class="font-bold text-gray-800">${generation.database_type}</span>
                        <span class="text-gray-400">•</span>
                        <span class="text-sm text-gray-600">${date}</span>
                    </div>
                    <h3 class="font-bold text-gray-800 text-lg mb-2">
                        ${escapeHtml(generation.generated_script.script_title)}
                    </h3>
                    <p class="text-sm text-gray-600 mb-3">
                        <strong>Demande :</strong> "${escapeHtml(generation.user_request.substring(0, 150))}..."
                    </p>
                    <div class="flex gap-2">
                        <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                            ${generation.category}
                        </span>
                        <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold">
                            ${generation.complexity}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="flex gap-2">
                <button 
                    onclick="viewGenerationDetail(${generation.id})"
                    class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
                    👁️ Voir les détails
                </button>
                <button 
                    onclick="regenerateFromHistory(${generation.id})"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                    🔄 Régénérer
                </button>
                <button 
                    onclick="deleteGeneration(${generation.id})"
                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium">
                    🗑️ Supprimer
                </button>
            </div>
        </div>
    `;
}

async function viewGenerationDetail(generationId) {
    const generations = await loadGenerationHistory();
    const generation = generations.find(g => g.id === generationId);
    
    if (!generation) {
        showToast("❌ Génération introuvable", "error");
        return;
    }
    
    const content = document.getElementById("content");
    content.innerHTML = `
        <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
            <button onclick="showGenerationHistory()" class="mb-6 px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition font-medium">
                ← Retour à l'historique
            </button>
            
            <div id="generationResults"></div>
        </section>
    `;
    
    displayGeneratedScript(generation.generated_script, generation.analysis);
}

async function regenerateFromHistory(generationId) {
    const generations = await loadGenerationHistory();
    const generation = generations.find(g => g.id === generationId);
    
    if (!generation) {
        showToast("❌ Génération introuvable", "error");
        return;
    }
    
    showScriptGenerator();
    
    setTimeout(() => {
        const input = document.getElementById('scriptRequest');
        if (input) {
            input.value = generation.user_request;
            window.scrollTo({ top: 0, behavior: 'smooth' });
            showToast("✅ Demande rechargée, cliquez sur Générer", "success");
        }
    }, 100);
}

async function deleteGeneration(generationId) {
    if (!confirm("⚠️ Supprimer cette génération ?")) return;
    
    const { error } = await supabase
        .from('script_generations')
        .delete()
        .eq('id', generationId);
    
    if (error) {
        showToast("❌ Erreur de suppression", "error");
    } else {
        showToast("✅ Génération supprimée", "success");
        showGenerationHistory();
    }
}