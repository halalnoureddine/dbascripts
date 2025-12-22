// ==========================================
// 📄 js/ai-analyzer.js - Version SÉCURISÉE
// ==========================================

// ✅ Configuration sécurisée (AUCUNE clé API côté client)
const AI_CONFIG = {
    useSupabaseProxy: true,
    edgeFunctionUrl: "https://josncyjmqsikoitvbehe.supabase.co/functions/v1/groq-proxy"
};

// ==========================================
// 🔒 FONCTION D'APPEL SÉCURISÉE À GROQ
// ==========================================

async function callGroqSecurely(prompt, options = {}) {
    try {
        console.log('📡 Calling Groq via Supabase Edge Function...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch(AI_CONFIG.edgeFunctionUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${session?.access_token || supabase.supabaseKey}`,
                "Content-Type": "application/json",
                "apikey": supabase.supabaseKey
            },
            body: JSON.stringify({
                prompt: prompt,
                model: options.model || "llama-3.3-70b-versatile",
                temperature: options.temperature || 0.3,
                max_tokens: options.max_tokens || 2000,
                system_message: options.system_message || "Tu es un expert DBA. Tu réponds TOUJOURS en JSON valide."
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Edge Function error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Groq call successful');
        
        return data;
        
    } catch (error) {
        console.error('❌ Groq call failed:', error);
        throw error;
    }
}

// ==========================================
// 📊 ANALYSE AVEC GROQ (VERSION SÉCURISÉE)
// ==========================================

async function analyzeWithGroq(logText, dbType, errorCodes) {
    const prompt = `Tu es un expert DBA spécialisé en ${dbType || 'Oracle et SQL Server'}.

LOGS À ANALYSER:
${logText}

CODES D'ERREUR DÉTECTÉS: ${errorCodes.join(', ') || 'Aucun code spécifique'}

INSTRUCTIONS:
1. Analyse ces logs en profondeur
2. Identifie le problème principal
3. Détermine la gravité (low/medium/high/critical)
4. Liste les causes possibles
5. Propose des solutions concrètes avec scripts SQL

RÉPONDS UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks):
{
  "error_code": "Code principal ou 'Multiple' ou 'Unknown'",
  "severity": "low ou medium ou high ou critical",
  "title": "Titre court du problème",
  "description": "Description détaillée du problème",
  "root_causes": ["Cause 1", "Cause 2", "Cause 3"],
  "solutions": [
    {
      "priority": 1,
      "title": "Titre de la solution",
      "description": "Explication détaillée de la solution",
      "sql_script": "Script SQL complet et fonctionnel (ou null si pas applicable)"
    }
  ],
  "prevention": "Comment éviter ce problème à l'avenir"
}`;

    try {
        // ✅ Utiliser la fonction sécurisée
        const data = await callGroqSecurely(prompt);
        
        const text = data.choices[0].message.content;
        
        // Parser le JSON
        let cleanText = text.trim();
        cleanText = cleanText.replace(/^```json\s*/i, '');
        cleanText = cleanText.replace(/^```\s*/i, '');
        cleanText = cleanText.replace(/\s*```$/i, '');
        
        const parsed = JSON.parse(cleanText);
        
        console.log('✅ Groq analysis successful:', parsed);
        
        return {
            success: true,
            provider: 'groq',
            data: parsed
        };
    } catch (error) {
        console.error('❌ Groq analysis failed:', error);
        return {
            success: false,
            provider: 'groq',
            error: error.message
        };
    }
}

// ==========================================
// ✅ FONCTION DE VÉRIFICATION
// ==========================================

async function checkGroqConfiguration() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch(AI_CONFIG.edgeFunctionUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${session?.access_token || supabase.supabaseKey}`,
                "Content-Type": "application/json",
                "apikey": supabase.supabaseKey
            },
            body: JSON.stringify({
                prompt: "Test",
                model: "llama-3.3-70b-versatile",
                max_tokens: 10
            })
        });
        
        return response.ok;
    } catch (error) {
        console.error('❌ Groq configuration check failed:', error);
        return false;
    }
}

// ==========================================
// 🔍 DÉTECTION AUTOMATIQUE
// ==========================================

function detectDatabaseType(logText) {
    const oraclePatterns = [
        /ORA-\d{5}/i,
        /PLS-\d{5}/i,
        /TNS-\d{5}/i,
        /RMAN-\d{5}/i,
        /Oracle Database/i,
        /DBMS_/i,
        /V\$[A-Z_]+/i,
        /DBA_[A-Z_]+/i
    ];
    
    const sqlServerPatterns = [
        /Msg \d+/i,
        /Error: \d+/i,
        /SQL Server/i,
        /Microsoft SQL/i,
        /\[SQLSTATE \w+\]/i,
        /sys\.dm_/i,
        /TSQL/i,
        /SSMS/i
    ];
    
    const oracleScore = oraclePatterns.filter(p => p.test(logText)).length;
    const sqlServerScore = sqlServerPatterns.filter(p => p.test(logText)).length;
    
    if (oracleScore > sqlServerScore) return 'Oracle';
    if (sqlServerScore > oracleScore) return 'SQL Server';
    return null;
}

function extractErrorCodes(logText) {
    const codes = [];
    
    const oraPattern = /ORA-\d{5}/g;
    const plsPattern = /PLS-\d{5}/g;
    const tnsPattern = /TNS-\d{5}/g;
    const msgPattern = /Msg \d+/g;
    const errorPattern = /Error: \d+/g;
    
    const oraMatches = logText.match(oraPattern) || [];
    const plsMatches = logText.match(plsPattern) || [];
    const tnsMatches = logText.match(tnsPattern) || [];
    const msgMatches = logText.match(msgPattern) || [];
    const errMatches = logText.match(errorPattern) || [];
    
    codes.push(...oraMatches, ...plsMatches, ...tnsMatches, ...msgMatches, ...errMatches);
    
    return [...new Set(codes)];
}

function extractKeywords(logText, dbType) {
    const commonKeywords = [
        'tablespace', 'undo', 'space', 'deadlock', 'lock', 'transaction',
        'backup', 'restore', 'performance', 'slow', 'timeout', 'connection',
        'memory', 'disk', 'full', 'corrupt', 'error', 'failed'
    ];
    
    const foundKeywords = commonKeywords.filter(kw => 
        logText.toLowerCase().includes(kw)
    );
    
    return foundKeywords;
}

// ==========================================
// 🗄️ RECHERCHE EN BASE DE DONNÉES
// ==========================================

async function searchKnownErrors(errorCodes) {
    if (!errorCodes || errorCodes.length === 0) return [];
    
    try {
        const { data, error } = await supabase
            .from('known_errors')
            .select('*')
            .in('error_code', errorCodes);
        
        if (error) {
            console.error('Error searching known errors:', error);
            return [];
        }
        
        return data || [];
    } catch (err) {
        console.error('Exception in searchKnownErrors:', err);
        return [];
    }
}

async function searchRelatedScripts(keywords, dbType, errorCodes) {
    try {
        let query = supabase
            .from('scripts')
            .select('*')
            .eq('visibility', 'public');
        
        if (dbType) {
            query = query.eq('database', dbType);
        }
        
        if (keywords && keywords.length > 0) {
            const searchTerms = keywords.join('|');
            query = query.or(`title.ilike.%${searchTerms}%, description.ilike.%${searchTerms}%`);
        }
        
        const { data, error } = await query.limit(5);
        
        if (error) {
            console.error('Error searching scripts:', error);
            return [];
        }
        
        return data || [];
    } catch (err) {
        console.error('Exception in searchRelatedScripts:', err);
        return [];
    }
}

// ==========================================
// 💾 SAUVEGARDE DE L'ANALYSE
// ==========================================

async function saveAnalysis(logText, dbType, errorCodes, aiDiagnosis, aiProvider, relatedScripts = []) {
    try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        const analysis = {
            user_id: currentUser ? currentUser.id : null,
            log_content: logText.substring(0, 5000),
            database_type: dbType,
            error_codes: errorCodes,
            ai_provider: aiProvider || 'known_error',
            ai_diagnosis: aiDiagnosis,
            related_script_ids: relatedScripts.map(s => s.id),
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('ai_log_analyses')
            .insert(analysis)
            .select()
            .single();
        
        if (error) {
            console.error('Error saving analysis:', error);
            return null;
        }
        
        return data;
    } catch (err) {
        console.error('Exception in saveAnalysis:', err);
        return null;
    }
}

// ==========================================
// 📝 FEEDBACK UTILISATEUR
// ==========================================

async function submitAnalysisFeedback(analysisId, feedback, resolved = false, notes = '') {
    try {
        const { error } = await supabase
            .from('ai_log_analyses')
            .update({
                feedback: feedback,
                resolved: resolved,
                resolution_notes: notes
            })
            .eq('id', analysisId);
        
        if (error) {
            console.error('Error submitting feedback:', error);
            showToast("❌ Erreur lors de l'envoi du feedback", "error");
            return false;
        }
        
        showToast("✅ Merci pour votre feedback !", "success");
        return true;
    } catch (err) {
        console.error('Exception in submitAnalysisFeedback:', err);
        return false;
    }
}

// ==========================================
// 🎯 FONCTION PRINCIPALE D'ANALYSE
// ==========================================

async function analyzeLogError(logText, selectedDbType = null) {
    if (!logText || logText.trim().length === 0) {
        showToast("❌ Veuillez coller des logs ou une erreur à analyser", "error");
        return null;
    }
    
    showLoader("🤖 Analyse en cours avec Groq...");
    
    try {
        const dbType = selectedDbType || detectDatabaseType(logText);
        const errorCodes = extractErrorCodes(logText);
        const keywords = extractKeywords(logText, dbType);
        
        console.log('Analysis started:', { dbType, errorCodes, keywords });
        
        const knownErrors = await searchKnownErrors(errorCodes);
        
        if (knownErrors.length > 0) {
            console.log('Found known errors:', knownErrors);
            hideLoader();
            displayKnownErrorSolution(knownErrors[0], errorCodes, dbType);
            
            await saveAnalysis(logText, dbType, errorCodes, {
                type: 'known_error',
                data: knownErrors[0]
            }, null);
            
            return;
        }
        
        const relatedScripts = await searchRelatedScripts(keywords, dbType, errorCodes);
        console.log('Found related scripts:', relatedScripts);
        
        const aiAnalysis = await analyzeWithGroq(logText, dbType, errorCodes);
        
        hideLoader();
        
        if (!aiAnalysis.success) {
            showToast("❌ Erreur lors de l'analyse IA: " + aiAnalysis.error, "error");
            return null;
        }
        
        const savedAnalysis = await saveAnalysis(
            logText, 
            dbType, 
            errorCodes, 
            aiAnalysis.data, 
            'groq',
            relatedScripts
        );
        
        displayAIAnalysisResults(aiAnalysis.data, relatedScripts, 'groq');
        
        return {
            dbType,
            errorCodes,
            keywords,
            aiAnalysis: aiAnalysis.data,
            relatedScripts,
            analysisId: savedAnalysis?.id
        };
        
    } catch (error) {
        hideLoader();
        console.error('Analysis error:', error);
        showToast("❌ Erreur lors de l'analyse: " + error.message, "error");
        return null;
    }
}




















// Fonction pour configurer Groq directement dans le code
function initializeGroqAPI() {
    // Option 1 : Entrer la clé directement dans le code (RECOMMANDÉ)
    // Décommentez et remplacez par votre clé :
    // AI_CONFIG.groqApiKey = "gsk_VOTRE_CLE_GROQ_ICI";
    
    // Option 2 : Charger depuis localStorage
    const savedKey = localStorage.getItem('groq_api_key');
    if (savedKey) {
        AI_CONFIG.groqApiKey = savedKey;
        console.log("✅ Clé Groq chargée depuis localStorage");
    }
    
    // Option 3 : Demander à l'utilisateur s'il n'y a pas de clé
    if (!AI_CONFIG.groqApiKey) {
        console.warn("⚠️ Aucune clé Groq configurée");
    } else {
        console.log("✅ Groq API configuré");
    }
}

// Appeler au chargement
initializeGroqAPI();



// ==========================================
// NOUVELLE FONCTION : Modal de configuration Groq
// ==========================================

function showGroqConfigModal() {
    const content = document.getElementById("content");
    
    content.innerHTML = `
        <section class="max-w-2xl mx-auto py-12 px-4 animate-fade-in">
            <div class="bg-white rounded-xl shadow-2xl p-8">
                <h2 class="text-3xl font-bold text-gray-800 mb-6">
                    🔑 Configuration de Groq API
                </h2>
                
                <div class="bg-blue-50 p-6 rounded-lg border-2 border-blue-200 mb-6">
                    <h3 class="font-bold text-blue-900 mb-3">📖 Comment obtenir une clé API Groq (gratuit) :</h3>
                    <ol class="text-blue-800 space-y-2 text-sm list-decimal list-inside">
                        <li>Allez sur <a href="https://console.groq.com" target="_blank" class="underline font-bold">console.groq.com</a></li>
                        <li>Créez un compte (gratuit, pas de carte bancaire requise)</li>
                        <li>Allez dans "API Keys"</li>
                        <li>Cliquez sur "Create API Key"</li>
                        <li>Copiez la clé (commence par "gsk_")</li>
                        <li>Collez-la ci-dessous</li>
                    </ol>
                </div>

                <form onsubmit="saveGroqKey(event)" class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-800 mb-2">
                            Clé API Groq
                        </label>
                        <input 
                            type="password" 
                            id="groqKeyInput"
                            placeholder="gsk_..."
                            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                            required
                        />
                        <p class="text-xs text-gray-500 mt-2">
                            🔒 Votre clé sera sauvegardée localement dans votre navigateur
                        </p>
                    </div>

                    <div class="flex gap-3 pt-4">
                        <button 
                            type="submit"
                            class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-xl transition font-bold">
                            💾 Sauvegarder et tester
                        </button>
                        <button 
                            type="button"
                            onclick="showAIAnalyzer()"
                            class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">
                            Annuler
                        </button>
                    </div>
                </form>

                <div class="mt-6 bg-green-50 p-4 rounded-lg border-2 border-green-200">
                    <h4 class="font-bold text-green-900 mb-2">✅ Avantages de Groq :</h4>
                    <ul class="text-green-800 text-sm space-y-1">
                        <li>• 100% gratuit (14,400 requêtes/jour)</li>
                        <li>• Ultra rapide (~300 tokens/sec)</li>
                        <li>• Modèle Llama 3.1 (très performant)</li>
                        <li>• Pas de carte bancaire requise</li>
                    </ul>
                </div>
            </div>
        </section>
    `;
}

// Fonction pour sauvegarder et tester la clé
async function saveGroqKey(event) {
    event.preventDefault();
    
    const keyInput = document.getElementById('groqKeyInput');
    const apiKey = keyInput.value.trim();
    
    if (!apiKey.startsWith('gsk_')) {
        showToast("❌ Clé invalide. Elle doit commencer par 'gsk_'", "error");
        return;
    }
    
    showLoader("🔍 Vérification de la clé...");
    
    // Tester la clé avec un appel simple
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{
                    role: "user",
                    content: "Say 'OK' if you receive this"
                }],
                max_tokens: 10
            })
        });
        
        hideLoader();
        
        if (!response.ok) {
            throw new Error("Clé API invalide");
        }
        
        // Clé valide, la sauvegarder
        AI_CONFIG.groqApiKey = apiKey;
        localStorage.setItem('groq_api_key', apiKey);
        
        showToast("✅ Clé Groq configurée avec succès !", "success");
        
        // Retourner à l'analyseur
        setTimeout(() => showAIAnalyzer(), 1000);
        
    } catch (error) {
        hideLoader();
        console.error('Error testing Groq key:', error);
        showToast("❌ Clé invalide ou erreur de connexion", "error");
    }
}

// ==========================================
// FONCTION UTILITAIRE : Loader
// ==========================================

function showLoader(message) {
    const loader = document.createElement('div');
    loader.id = 'aiLoader';
    loader.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    loader.innerHTML = `
        <div class="bg-white rounded-xl p-8 shadow-2xl max-w-md mx-4">
            <div class="flex items-center gap-4">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
                <div>
                    <p class="text-xl font-bold text-gray-800">${message}</p>
                    <p class="text-sm text-gray-600">Cela peut prendre quelques secondes...</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('aiLoader');
    if (loader) {
        loader.remove();
    }
}

// Détection du type de base de données
function detectDatabaseType(logText) {
    const oraclePatterns = [
        /ORA-\d{5}/i,
        /PLS-\d{5}/i,
        /TNS-\d{5}/i,
        /RMAN-\d{5}/i,
        /Oracle Database/i,
        /DBMS_/i,
        /V\$[A-Z_]+/i,
        /DBA_[A-Z_]+/i
    ];
    
    const sqlServerPatterns = [
        /Msg \d+/i,
        /Error: \d+/i,
        /SQL Server/i,
        /Microsoft SQL/i,
        /\[SQLSTATE \w+\]/i,
        /sys\.dm_/i,
        /TSQL/i,
        /SSMS/i
    ];
    
    const oracleScore = oraclePatterns.filter(p => p.test(logText)).length;
    const sqlServerScore = sqlServerPatterns.filter(p => p.test(logText)).length;
    
    if (oracleScore > sqlServerScore) return 'Oracle';
    if (sqlServerScore > oracleScore) return 'SQL Server';
    return null; // Auto-détection impossible
}




// ==========================================
// 3. ANALYSE PAR IA
// ==========================================

// Analyser avec Claude (API Anthropic via votre configuration)
async function analyzeWithClaude(logText, dbType, errorCodes) {
    const prompt = `Tu es un expert DBA spécialisé en ${dbType || 'bases de données Oracle et SQL Server'}.

Analyse ces logs/erreurs et fournis un diagnostic complet :

LOGS:
\`\`\`
${logText}
\`\`\`

CODES D'ERREUR DÉTECTÉS: ${errorCodes.join(', ') || 'Aucun'}

Fournis ta réponse UNIQUEMENT au format JSON valide suivant (sans markdown, sans backticks) :
{
  "error_code": "Code d'erreur principal ou 'Multiple'",
  "severity": "low|medium|high|critical",
  "title": "Titre court et clair du problème",
  "description": "Description détaillée du problème en français",
  "root_causes": ["Cause 1", "Cause 2", "Cause 3"],
  "solutions": [
    {
      "priority": 1,
      "title": "Titre de la solution",
      "description": "Description détaillée de la solution",
      "sql_script": "-- Script SQL si applicable ou null"
    }
  ],
  "prevention": "Comment éviter ce problème à l'avenir"
}`;

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": "VOTRE_CLE_API_ANTHROPIC", // À configurer
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 2000,
                messages: [{
                    role: "user",
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.content[0].text;
        
        // Parser le JSON de la réponse
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                success: true,
                provider: 'claude',
                data: parsed
            };
        }
        
        throw new Error('No JSON found in Claude response');
    } catch (error) {
        console.error('Claude analysis failed:', error);
        return {
            success: false,
            provider: 'claude',
            error: error.message
        };
    }
}


