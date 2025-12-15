// ==========================================
// 🤖 js/ai-script-generator.js - Générateur de Scripts IA
// ==========================================

// ==========================================
// 0. FONCTION UTILITAIRE - NETTOYAGE JSON
// ==========================================

function cleanAndParseJSON(text) {
    // Nettoyer le texte brut
    let cleanText = text.trim();
    
    // Retirer les backticks markdown
    cleanText = cleanText.replace(/^```json\s*/i, '');
    cleanText = cleanText.replace(/^```\s*/i, '');
    cleanText = cleanText.replace(/\s*```$/i, '');
    
    // Nettoyer les caractères de contrôle problématiques
    // mais garder les espaces, tabs et retours à la ligne normaux
    cleanText = cleanText.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '');
    
    try {
        // Première tentative de parsing direct
        return JSON.parse(cleanText);
    } catch (firstError) {
        console.warn('First JSON parse attempt failed, trying repair...', firstError.message);
        
        try {
            // Deuxième tentative : extraire le JSON entre accolades
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (secondError) {
            console.error('Second JSON parse attempt failed:', secondError.message);
        }
        
        // Si tout échoue, logger et relancer l'erreur
        console.error('Failed JSON content (first 500 chars):', cleanText.substring(0, 500));
        throw new Error(`Impossible de parser le JSON: ${firstError.message}`);
    }
}

function cleanSQLScript(sqlScript) {
    if (!sqlScript) return sqlScript;
    
    // Nettoyer les échappements JSON dans le script SQL
    return sqlScript
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\');
}

// ==========================================
// 1. FONCTION PRINCIPALE DE GÉNÉRATION
// ==========================================

async function generateScriptFromRequest(userRequest, targetDatabase = null) {
    // Validation
    if (!userRequest || userRequest.trim().length === 0) {
        showToast("❌ Veuillez décrire votre besoin", "error");
        return null;
    }
    
    // Vérifier que Groq est configuré
    if (!AI_CONFIG.groqApiKey) {
        showToast("❌ Veuillez configurer votre clé API Groq d'abord", "error");
        showGroqConfigModal();
        return null;
    }
    
    showLoader("🤖 Génération du script en cours...");
    
    try {
        // 1. Analyse du besoin
        const analysisResult = await analyzeUserRequest(userRequest, targetDatabase);
        
        if (!analysisResult.success) {
            hideLoader();
            showToast("❌ Erreur d'analyse: " + analysisResult.error, "error");
            return null;
        }
        
        const analysis = analysisResult.data;
        console.log('Request analysis:', analysis);
        
        // 2. Génération du script
        const generationResult = await generateOptimalScript(userRequest, analysis);
        
        hideLoader();
        
        if (!generationResult.success) {
            showToast("❌ Erreur de génération: " + generationResult.error, "error");
            return null;
        }
        
        // 3. Sauvegarder la génération
        const savedGeneration = await saveScriptGeneration(
            userRequest,
            analysis,
            generationResult.data
        );
        
        // 4. Afficher les résultats
        displayGeneratedScript(generationResult.data, analysis);
        
        return {
            analysis,
            script: generationResult.data,
            generationId: savedGeneration?.id
        };
        
    } catch (error) {
        hideLoader();
        console.error('Script generation error:', error);
        showToast("❌ Erreur lors de la génération: " + error.message, "error");
        return null;
    }
}

// ==========================================
// 2. ANALYSE DU BESOIN UTILISATEUR
// ==========================================

async function analyzeUserRequest(userRequest, targetDatabase) {
    const prompt = `Tu es un expert DBA senior spécialisé en génération de scripts SQL.

DEMANDE DE L'UTILISATEUR:
"${userRequest}"

${targetDatabase ? `BASE DE DONNÉES CIBLE: ${targetDatabase}` : ''}

INSTRUCTIONS D'ANALYSE:
Tu dois analyser cette demande et déterminer:
1. Le type de base de données optimal (Oracle, SQL Server, ou PostgreSQL)
2. La catégorie du script
3. Le contexte et l'objectif précis
4. Les contraintes techniques
5. Les éléments manquants à clarifier

RÉPONDS UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks):
{
  "database_type": "Oracle|SQL Server|PostgreSQL",
  "confidence": 0-100,
  "category": "DATABASE INFO|BACKUP & RESTORE|PERFORMANCE|MONITORING|SECURITY|MAINTENANCE|DATA MANIPULATION|ADMINISTRATION",
  "objective": "Description claire et concise de l'objectif",
  "context": {
    "table_names": ["table1", "table2"],
    "column_names": ["col1", "col2"],
    "conditions": ["condition 1", "condition 2"],
    "expected_output": "Ce que l'utilisateur attend"
  },
  "technical_requirements": [
    "Requirement 1",
    "Requirement 2"
  ],
  "missing_information": [
    "Information manquante 1",
    "Information manquante 2"
  ],
  "complexity": "simple|medium|complex",
  "estimated_lines": 0,
  "recommendations": [
    "Recommandation 1",
    "Recommandation 2"
  ]
}`;

    try {
        console.log('Analyzing user request...');
        
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${AI_CONFIG.groqApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{
                    role: "system",
                    content: "Tu es un expert DBA. Tu réponds TOUJOURS en JSON valide, sans markdown ni backticks."
                }, {
                    role: "user",
                    content: prompt
                }],
                temperature: 0.2,
                max_tokens: 2000,
                top_p: 0.9
            })
        });
        
        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }
        
        const data = await response.json();
        const text = data.choices[0].message.content;
        
        // Parser le JSON avec nettoyage avancé
        let cleanText = text.trim();
        
        // Retirer les backticks markdown
        cleanText = cleanText.replace(/^```json\s*/i, '');
        cleanText = cleanText.replace(/^```\s*/i, '');
        cleanText = cleanText.replace(/\s*```$/i, '');
        
        // Nettoyer les caractères de contrôle problématiques
        cleanText = cleanText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        
        // Remplacer les retours à la ligne dans les valeurs de chaînes par \n
        // mais garder la structure JSON intacte
        cleanText = cleanText.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
        
        let parsed;
        try {
            parsed = JSON.parse(cleanText);
        } catch (firstError) {
            console.error('First JSON parse attempt failed:', firstError);
            console.log('Problematic JSON:', cleanText.substring(0, 500));
            
            // Tentative de réparation : extraire le JSON entre accolades
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    parsed = JSON.parse(jsonMatch[0]);
                } catch (secondError) {
                    console.error('Second JSON parse attempt failed:', secondError);
                    throw new Error('Impossible de parser la réponse JSON de l\'IA');
                }
            } else {
                throw new Error('Aucun JSON valide trouvé dans la réponse');
            }
        }
        
        console.log('✅ Request analysis successful');
        
        return {
            success: true,
            data: parsed
        };
    } catch (error) {
        console.error('❌ Request analysis failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ==========================================
// 3. GÉNÉRATION DU SCRIPT OPTIMAL
// ==========================================

async function generateOptimalScript(userRequest, analysis) {
    const prompt = `Tu es un expert DBA ${analysis.database_type} avec 15+ ans d'expérience.

DEMANDE ORIGINALE:
"${userRequest}"

ANALYSE DU BESOIN:
${JSON.stringify(analysis, null, 2)}

INSTRUCTIONS DE GÉNÉRATION:
Tu dois générer un script SQL ${analysis.database_type} COMPLET et PRÊT À L'EMPLOI.

RÈGLES CRITIQUES:
1. Le script doit être EXACT et OPTIMAL - aucune approximation
2. Inclure TOUS les éléments nécessaires (CREATE, indexes, contraintes, etc.)
3. Ajouter des commentaires explicatifs en français
4. Gérer les cas d'erreur (IF EXISTS, TRY-CATCH, etc.)
5. Respecter les best practices ${analysis.database_type}
6. Le script doit être exécutable IMMÉDIATEMENT sans modification
7. Inclure des exemples d'utilisation si pertinent

${analysis.missing_information && analysis.missing_information.length > 0 ? `
⚠️ INFORMATIONS MANQUANTES DÉTECTÉES:
${analysis.missing_information.map((info, i) => `${i + 1}. ${info}`).join('\n')}

Tu dois faire des CHOIX INTELLIGENTS et DOCUMENTÉS pour ces informations manquantes.
` : ''}

CATÉGORIES DE SCRIPTS ${analysis.database_type}:
${analysis.database_type === 'Oracle' ? `
- DDL: CREATE TABLE, ALTER TABLE, indexes, constraints
- DML: INSERT, UPDATE, DELETE, MERGE
- Performance: Hints, partitioning, compression
- Monitoring: V$VIEWS, DBA_TABLES, statistiques
- Backup: RMAN, Data Pump
- Security: GRANTS, roles, profiles
` : analysis.database_type === 'SQL Server' ? `
- DDL: CREATE TABLE, ALTER TABLE, indexes, constraints
- DML: INSERT, UPDATE, DELETE, MERGE
- Performance: Query hints, columnstore, partitioning
- Monitoring: DMVs, system views
- Backup: BACKUP DATABASE, restore
- Security: Permissions, roles, schemas
` : `
- DDL: CREATE TABLE, ALTER TABLE, indexes, constraints
- DML: INSERT, UPDATE, DELETE, UPSERT
- Performance: Indexes, VACUUM, ANALYZE
- Monitoring: pg_stat views
- Backup: pg_dump, WAL
- Security: GRANT, roles, row-level security
`}

RÉPONDS UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks):
IMPORTANT: Dans les chaînes de caractères JSON, utilise \\n pour les retours à la ligne, pas de vrais retours à la ligne.
{
  "script_title": "Titre court et descriptif",
  "database_type": "${analysis.database_type}",
  "category": "${analysis.category}",
  "description": "Description détaillée de ce que fait le script",
  "sql_script": "Le script SQL COMPLET avec commentaires (utiliser \\n pour les retours à la ligne)",
  "prerequisites": [
    "Prérequis 1",
    "Prérequis 2"
  ],
  "execution_notes": [
    "Note d'exécution 1",
    "Note d'exécution 2"
  ],
  "assumptions_made": [
    "Hypothèse 1 si info manquante",
    "Hypothèse 2 si info manquante"
  ],
  "usage_examples": [
    {
      "scenario": "Cas d'usage 1",
      "example": "Exemple de requête"
    }
  ],
  "alternatives": [
    {
      "approach": "Approche alternative 1",
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"]
    }
  ],
  "estimated_execution_time": "Temps estimé",
  "potential_impact": "Impact potentiel sur le système"
}`;

    try {
        console.log('Generating script...');
        
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${AI_CONFIG.groqApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{
                    role: "system",
                    content: "Tu es un expert DBA. Tu génères des scripts SQL parfaits, prêts à l'emploi. Tu réponds TOUJOURS en JSON valide."
                }, {
                    role: "user",
                    content: prompt
                }],
                temperature: 0.1, // Très déterministe pour la génération de code
                max_tokens: 4000,
                top_p: 0.95
            })
        });
        
        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }
        
        const data = await response.json();
        const text = data.choices[0].message.content;
        
        // Parser le JSON avec nettoyage avancé
        let cleanText = text.trim();
        
        // Retirer les backticks markdown
        cleanText = cleanText.replace(/^```json\s*/i, '');
        cleanText = cleanText.replace(/^```\s*/i, '');
        cleanText = cleanText.replace(/\s*```$/i, '');
        
        // Nettoyer les caractères de contrôle
        cleanText = cleanText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        
        let parsed;
        try {
            parsed = JSON.parse(cleanText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.log('Problematic text:', cleanText.substring(0, 500));
            
            // Tentative de réparation
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Réponse JSON invalide');
            }
        }
        
        console.log('✅ Script generation successful');
        
        return {
            success: true,
            data: parsed
        };
    } catch (error) {
        console.error('❌ Script generation failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ==========================================
// 4. SAUVEGARDER LA GÉNÉRATION
// ==========================================

async function saveScriptGeneration(userRequest, analysis, generatedScript) {
    try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
            console.warn('User not logged in, skipping save');
            return null;
        }
        
        const generation = {
            user_id: currentUser.id,
            user_request: userRequest,
            analysis: analysis,
            generated_script: generatedScript,
            database_type: analysis.database_type,
            category: analysis.category,
            complexity: analysis.complexity,
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('script_generations')
            .insert(generation)
            .select()
            .single();
        
        if (error) {
            console.error('Error saving generation:', error);
            return null;
        }
        
        return data;
    } catch (err) {
        console.error('Exception in saveScriptGeneration:', err);
        return null;
    }
}

// ==========================================
// 5. HISTORIQUE DES GÉNÉRATIONS
// ==========================================

async function loadGenerationHistory() {
    try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
            return [];
        }
        
        const { data, error } = await supabase
            .from('script_generations')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) {
            console.error('Error loading history:', error);
            return [];
        }
        
        return data || [];
    } catch (err) {
        console.error('Exception in loadGenerationHistory:', err);
        return [];
    }
}

// ==========================================
// 6. SAUVEGARDER LE SCRIPT GÉNÉRÉ DANS LA BASE
// ==========================================

async function saveGeneratedScriptToDatabase(generatedScript) {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
        showToast("❌ Vous devez être connecté pour sauvegarder", "error");
        return false;
    }
    
    const script = {
        title: generatedScript.script_title,
        database: generatedScript.database_type,
        category: generatedScript.category,
        code: generatedScript.sql_script,
        description: generatedScript.description,
        added_by: currentUser.email,
        visibility: 'private', // Privé par défaut
        prerequis: generatedScript.prerequisites ? generatedScript.prerequisites.join('\n') : '',
        notes: generatedScript.execution_notes ? generatedScript.execution_notes.join('\n') : '',
        created_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from("scripts").insert(script);
    
    if (error) {
        console.error('Error saving script:', error);
        showToast("❌ Erreur lors de la sauvegarde", "error");
        return false;
    }
    
    showToast("✅ Script sauvegardé dans votre bibliothèque !", "success");
    return true;
}