// ==========================================
// 🔥 js/ai-performance-analyzer.js - Analyseur de Performance IA
// ==========================================

// ==========================================
// 1. FONCTION PRINCIPALE D'ANALYSE DE PERFORMANCE
// ==========================================

async function analyzePerformanceIssue(input, inputType = 'description') {
    // Validation
    if (!input || input.trim().length === 0) {
        showToast("❌ Veuillez fournir des informations sur le problème", "error");
        return null;
    }
    
    // Vérifier que Groq est configuré
    if (!AI_CONFIG.groqApiKey) {
        showToast("❌ Veuillez configurer votre clé API Groq d'abord", "error");
        showGroqConfigModal();
        return null;
    }
    
    showLoader("🔥 Analyse de performance en cours avec Groq...");
    
    try {
        // 1. Détection du type de problème
        const perfType = detectPerformanceType(input);
        
        // 2. Extraction des métriques clés
        const metrics = extractPerformanceMetrics(input, inputType);
        
        console.log('Performance analysis started:', { perfType, metrics, inputType });
        
        // 3. Analyse IA selon le type d'input
        let aiAnalysis;
        
        if (inputType === 'awr') {
            aiAnalysis = await analyzeAWRWithGroq(input, metrics);
        } else if (inputType === 'sql_server_report') {
            aiAnalysis = await analyzeSQLServerReportWithGroq(input, metrics);
        } else if (inputType === 'slow_query') {
            aiAnalysis = await analyzeSlowQueryWithGroq(input, metrics);
        } else {
            // Description générale
            aiAnalysis = await analyzeGeneralPerformanceWithGroq(input, perfType, metrics);
        }
        
        hideLoader();
        
        if (!aiAnalysis.success) {
            showToast("❌ Erreur lors de l'analyse IA: " + aiAnalysis.error, "error");
            return null;
        }
        
        // 4. Recherche de scripts pertinents dans la base
        const relatedScripts = await searchPerformanceScripts(
            aiAnalysis.data.bottleneck_type,
            aiAnalysis.data.database_type
        );
        
        // 5. Sauvegarder l'analyse
        const savedAnalysis = await savePerformanceAnalysis(
            input,
            inputType,
            metrics,
            aiAnalysis.data,
            relatedScripts
        );
        
        // 6. Afficher les résultats
        displayPerformanceAnalysisResults(aiAnalysis.data, relatedScripts, metrics);
        
        return {
            perfType,
            metrics,
            aiAnalysis: aiAnalysis.data,
            relatedScripts,
            analysisId: savedAnalysis?.id
        };
        
    } catch (error) {
        hideLoader();
        console.error('Performance analysis error:', error);
        showToast("❌ Erreur lors de l'analyse: " + error.message, "error");
        return null;
    }
}

// ==========================================
// 2. DÉTECTION DU TYPE DE PROBLÈME
// ==========================================

function detectPerformanceType(input) {
    const types = {
        cpu: /high cpu|cpu usage|cpu spike|processeur|100% cpu/i,
        io: /slow disk|disk i\/o|wait.*i\/o|read.*slow|write.*slow/i,
        memory: /memory|ram|swap|oom|out of memory|pga|sga/i,
        network: /network|latency|timeout|connection.*slow/i,
        lock: /deadlock|blocking|lock wait|latch/i,
        query: /slow query|query.*slow|requête.*lente|select.*long/i,
        general: /.*/
    };
    
    for (const [type, pattern] of Object.entries(types)) {
        if (pattern.test(input)) {
            return type;
        }
    }
    
    return 'general';
}

// ==========================================
// 3. EXTRACTION DES MÉTRIQUES
// ==========================================

function extractPerformanceMetrics(input, inputType) {
    const metrics = {
        cpu_usage: null,
        memory_usage: null,
        io_wait: null,
        response_time: null,
        concurrent_users: null,
        query_count: null,
        cache_hit_ratio: null,
        wait_events: [],
        top_sql: []
    };
    
    // Extraction CPU (%)
    const cpuMatch = input.match(/cpu[:\s]+(\d+(?:\.\d+)?)%/i);
    if (cpuMatch) metrics.cpu_usage = parseFloat(cpuMatch[1]);
    
    // Extraction Memory (%)
    const memMatch = input.match(/memory[:\s]+(\d+(?:\.\d+)?)%/i);
    if (memMatch) metrics.memory_usage = parseFloat(memMatch[1]);
    
    // Extraction I/O Wait
    const ioMatch = input.match(/io.*wait[:\s]+(\d+(?:\.\d+)?)/i);
    if (ioMatch) metrics.io_wait = parseFloat(ioMatch[1]);
    
    // Extraction Response Time
    const rtMatch = input.match(/response.*time[:\s]+(\d+(?:\.\d+)?)\s*(ms|sec|seconds?)/i);
    if (rtMatch) {
        metrics.response_time = parseFloat(rtMatch[1]);
        if (rtMatch[2].startsWith('sec')) metrics.response_time *= 1000;
    }
    
    // Extraction Wait Events (Oracle)
    const waitEventPattern = /wait event[:\s]+([\w\s]+)/gi;
    let match;
    while ((match = waitEventPattern.exec(input)) !== null) {
        metrics.wait_events.push(match[1].trim());
    }
    
    return metrics;
}

// ==========================================
// 4. ANALYSE AWR (ORACLE)
// ==========================================

async function analyzeAWRWithGroq(awrReport, metrics) {
    // Limiter la taille pour Groq (max ~12000 caractères pour garder de la marge)
    const reportPreview = awrReport.length > 12000 
        ? awrReport.substring(0, 12000) + '\n\n[... Rapport tronqué pour analyse ...]'
        : awrReport;
    
    const prompt = `Tu es un expert DBA Oracle spécialisé dans l'analyse de rapports AWR (Automatic Workload Repository).

📊 RAPPORT AWR COMPLET À ANALYSER:
${reportPreview}

📈 MÉTRIQUES EXTRAITES:
${JSON.stringify(metrics, null, 2)}

🎯 OBJECTIF DE L'ANALYSE:
Tu dois analyser CE RAPPORT AWR COMPLET et fournir un diagnostic détaillé des problèmes de performance.

📋 INSTRUCTIONS D'ANALYSE:

1. **IDENTIFICATION DES GOULOTS** (obligatoire):
   - Analyse les sections "Top 5 Timed Events" et "Top SQL"
   - Identifie le goulot principal : CPU, I/O, Memory, Network, Lock, ou Mixed
   - Calcule un score de santé (0-100) basé sur les métriques du rapport

2. **WAIT EVENTS** (obligatoire si présents):
   - Liste les wait events avec % de temps
   - Explique POURQUOI chaque wait event est problématique
   - Identifie la CAUSE RACINE de chaque wait event

3. **TOP SQL** (obligatoire si présent):
   - Liste les requêtes les plus consommatrices
   - Indique SQL_ID, nombre d'exécutions, temps moyen
   - Explique le PROBLÈME de chaque requête (full scan, sorts excessifs, etc.)

4. **STATISTIQUES SYSTÈME**:
   - CPU usage, Memory usage, I/O wait, Cache Hit Ratio
   - Extrais ces valeurs DU RAPPORT (Load Profile, Instance Statistics)

5. **RECOMMANDATIONS PRIORITAIRES**:
   - Au moins 5 recommandations concrètes
   - Chaque recommandation doit avoir un SCRIPT SQL fonctionnel
   - Ordonne par priorité (1 = urgent, 5 = optionnel)
   - Catégories: sql, index, parameter, hardware, design

⚠️ IMPORTANT:
- Base ton analyse UNIQUEMENT sur les données présentes dans le rapport
- Si une section est absente, indique "Non disponible dans ce rapport"
- Les scripts SQL doivent être COMPLETS et FONCTIONNELS
- Explique CLAIREMENT la cause de chaque problème détecté

RÉPONDS UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks):
{
  "database_type": "Oracle",
  "severity": "low|medium|high|critical",
  "bottleneck_type": "cpu|io|memory|network|lock|query|mixed",
  "health_score": 0-100,
  "title": "Résumé du problème principal",
  "description": "Description détaillée des problèmes identifiés",
  "top_issues": [
    {
      "issue": "Nom du problème",
      "impact": "high|medium|low",
      "description": "Explication détaillée",
      "metric_value": "Valeur mesurée si applicable"
    }
  ],
  "wait_events_analysis": [
    {
      "event_name": "Nom du wait event",
      "percentage": 0-100,
      "impact": "Description de l'impact",
      "root_cause": "Cause probable"
    }
  ],
  "slow_queries": [
    {
      "sql_id": "ID de la requête",
      "executions": 0,
      "avg_elapsed_time": "Temps en ms",
      "buffer_gets": 0,
      "problem": "Description du problème"
    }
  ],
  "recommendations": [
    {
      "priority": 1-5,
      "category": "sql|index|parameter|hardware|design",
      "title": "Titre de la recommandation",
      "description": "Explication détaillée",
      "expected_impact": "Impact attendu",
      "implementation": "Comment implémenter",
      "sql_script": "Script SQL si applicable ou null"
    }
  ],
  "system_statistics": {
    "cpu_usage": "Pourcentage",
    "memory_usage": "Pourcentage",
    "io_wait": "Pourcentage",
    "cache_hit_ratio": "Pourcentage"
  }
}`;

    return await callGroqAPI(prompt, "Oracle AWR Analysis");
}

// ==========================================
// 5. ANALYSE SQL SERVER PERFORMANCE REPORT
// ==========================================

async function analyzeSQLServerReportWithGroq(report, metrics) {
    const reportPreview = report.length > 12000 
        ? report.substring(0, 12000) + '\n\n[... Rapport tronqué pour analyse ...]'
        : report;
    
    const prompt = `Tu es un expert DBA SQL Server spécialisé dans l'analyse de performance.

📊 RAPPORT DE PERFORMANCE SQL SERVER COMPLET:
${reportPreview}

📈 MÉTRIQUES EXTRAITES:
${JSON.stringify(metrics, null, 2)}

🎯 OBJECTIF DE L'ANALYSE:
Tu dois analyser CE RAPPORT COMPLET et fournir un diagnostic détaillé des problèmes de performance.

📋 INSTRUCTIONS D'ANALYSE:

1. **IDENTIFICATION DES GOULOTS** (obligatoire):
   - Analyse les DMV (sys.dm_exec_query_stats, sys.dm_os_wait_stats)
   - Identifie le goulot principal : CPU, I/O, Memory, Lock, Tempdb, Query, ou Mixed
   - Calcule un score de santé (0-100)

2. **WAIT STATISTICS** (obligatoire si présents):
   - Liste les types de wait avec % de temps
   - Explique l'IMPACT et la CAUSE de chaque wait type
   - Types courants: PAGEIOLATCH_*, CXPACKET, LCK_M_*, WRITELOG, etc.

3. **REQUÊTES LENTES** (obligatoire si sys.dm_exec_query_stats présent):
   - Liste les requêtes les plus lentes
   - Indique query_hash, executions, avg_duration_ms, cpu_time_ms, logical_reads
   - Explique le PROBLÈME de chaque requête

4. **INDEX MANQUANTS** (si sys.dm_db_missing_index_details présent):
   - Liste les index recommandés par SQL Server
   - Pour chaque index: table, colonnes, impact, CREATE INDEX complet
   - Explique POURQUOI cet index améliorerait les performances

5. **STATISTIQUES SYSTÈME**:
   - CPU usage, Memory usage, Buffer Cache Hit Ratio, Page Life Expectancy
   - Extrais ces valeurs DU RAPPORT

6. **RECOMMANDATIONS PRIORITAIRES**:
   - Au moins 5 recommandations concrètes
   - Chaque recommandation doit avoir un SCRIPT SQL fonctionnel
   - Catégories: index, statistics, parameter, query, maintenance

⚠️ IMPORTANT:
- Base ton analyse UNIQUEMENT sur les données du rapport
- Si une DMV est absente, indique "Non disponible"
- Les scripts CREATE INDEX doivent être COMPLETS
- Explique CLAIREMENT pourquoi chaque problème existe

RÉPONDS UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks):
{
  "database_type": "SQL Server",
  "severity": "low|medium|high|critical",
  "bottleneck_type": "cpu|io|memory|lock|tempdb|query|mixed",
  "health_score": 0-100,
  "title": "Résumé du problème principal",
  "description": "Description détaillée",
  "top_issues": [
    {
      "issue": "Nom du problème",
      "impact": "high|medium|low",
      "description": "Explication",
      "metric_value": "Valeur mesurée"
    }
  ],
  "wait_statistics": [
    {
      "wait_type": "Type de wait",
      "percentage": 0-100,
      "description": "Impact et cause"
    }
  ],
  "slow_queries": [
    {
      "query_hash": "Hash de la requête",
      "executions": 0,
      "avg_duration_ms": 0,
      "cpu_time_ms": 0,
      "logical_reads": 0,
      "problem": "Description"
    }
  ],
  "missing_indexes": [
    {
      "table": "Nom de la table",
      "equality_columns": ["col1", "col2"],
      "inequality_columns": ["col3"],
      "included_columns": ["col4"],
      "impact": "high|medium|low",
      "create_statement": "Script CREATE INDEX"
    }
  ],
  "recommendations": [
    {
      "priority": 1-5,
      "category": "index|statistics|parameter|query|maintenance",
      "title": "Titre",
      "description": "Explication",
      "expected_impact": "Impact",
      "implementation": "Comment faire",
      "sql_script": "Script ou null"
    }
  ],
  "system_statistics": {
    "cpu_usage": "Pourcentage",
    "memory_usage": "Pourcentage",
    "buffer_cache_hit_ratio": "Pourcentage",
    "page_life_expectancy": "Secondes"
  }
}`;

    return await callGroqAPI(prompt, "SQL Server Performance Analysis");
}

// ==========================================
// 6. ANALYSE REQUÊTE LENTE SPÉCIFIQUE
// ==========================================

async function analyzeSlowQueryWithGroq(query, metrics) {
    const prompt = `Tu es un expert en optimisation SQL.

REQUÊTE LENTE À ANALYSER:
\`\`\`sql
${query}
\`\`\`

MÉTRIQUES:
${JSON.stringify(metrics, null, 2)}

INSTRUCTIONS:
1. Analyse cette requête SQL
2. Identifie les problèmes de performance (full table scan, jointures inefficaces, etc.)
3. Détecte les index manquants
4. Vérifie les anti-patterns SQL
5. Propose une version optimisée de la requête
6. Suggère des index à créer

RÉPONDS en JSON:
{
  "database_type": "Oracle ou SQL Server (déduit du SQL)",
  "severity": "low|medium|high|critical",
  "bottleneck_type": "query",
  "title": "Problème principal de cette requête",
  "description": "Analyse détaillée",
  "query_problems": [
    {
      "problem": "Nom du problème",
      "line": "Partie du code concernée",
      "impact": "high|medium|low",
      "explanation": "Pourquoi c'est un problème"
    }
  ],
  "execution_plan_issues": [
    {
      "operation": "Type d'opération (Full Table Scan, etc.)",
      "cost": "Coût estimé",
      "solution": "Comment corriger"
    }
  ],
  "recommendations": [
    {
      "priority": 1-5,
      "category": "rewrite|index|hint|structure",
      "title": "Titre",
      "description": "Explication",
      "sql_script": "Requête optimisée ou CREATE INDEX"
    }
  ],
  "optimized_query": "Version complète optimisée de la requête"
}`;

    return await callGroqAPI(prompt, "Slow Query Analysis");
}

// ==========================================
// 7. ANALYSE GÉNÉRALE DE PERFORMANCE
// ==========================================

async function analyzeGeneralPerformanceWithGroq(description, perfType, metrics) {
    const prompt = `Tu es un expert DBA spécialisé en performance des bases de données.

DESCRIPTION DU PROBLÈME:
${description}

TYPE DE PROBLÈME DÉTECTÉ: ${perfType}

MÉTRIQUES (si disponibles):
${JSON.stringify(metrics, null, 2)}

INSTRUCTIONS:
1. Analyse ce problème de performance
2. Identifie la cause racine probable
3. Détermine le type de base de données (Oracle ou SQL Server si possible)
4. Évalue la gravité
5. Propose des diagnostics à effectuer
6. Suggère des solutions concrètes

RÉPONDS en JSON:
{
  "database_type": "Oracle|SQL Server|Unknown",
  "severity": "low|medium|high|critical",
  "bottleneck_type": "${perfType}",
  "health_score": 0-100,
  "title": "Résumé du problème",
  "description": "Analyse détaillée",
  "probable_causes": [
    "Cause 1",
    "Cause 2",
    "Cause 3"
  ],
  "diagnostic_queries": [
    {
      "purpose": "Ce que cette requête vérifie",
      "sql_script": "Requête SQL de diagnostic"
    }
  ],
  "recommendations": [
    {
      "priority": 1-5,
      "category": "investigation|tuning|hardware|design",
      "title": "Titre",
      "description": "Explication",
      "expected_impact": "Impact attendu",
      "implementation": "Comment faire",
      "sql_script": "Script ou null"
    }
  ],
  "next_steps": [
    "Étape 1 à suivre",
    "Étape 2 à suivre",
    "Étape 3 à suivre"
  ]
}`;

    return await callGroqAPI(prompt, "General Performance Analysis");
}

// ==========================================
// 8. FONCTION GÉNÉRIQUE APPEL GROQ
// ==========================================

async function callGroqAPI(prompt, analysisType) {
    if (!AI_CONFIG.groqApiKey) {
        return {
            success: false,
            error: 'Clé API Groq non configurée'
        };
    }
    
    try {
        console.log(`Calling Groq API for ${analysisType}...`);
        
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
                max_tokens: 3000,
                top_p: 0.9
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API error:', response.status, errorText);
            throw new Error(`Groq API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Groq response received');
        
        const text = data.choices[0].message.content;
        
        // Parser le JSON
        let cleanText = text.trim();
        cleanText = cleanText.replace(/^```json\s*/i, '');
        cleanText = cleanText.replace(/^```\s*/i, '');
        cleanText = cleanText.replace(/\s*```$/i, '');
        
        const parsed = JSON.parse(cleanText);
        
        console.log('✅ Groq analysis successful');
        
        return {
            success: true,
            data: parsed
        };
    } catch (error) {
        console.error('❌ Groq analysis failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ==========================================
// 9. RECHERCHE SCRIPTS PERTINENTS
// ==========================================

async function searchPerformanceScripts(bottleneckType, dbType) {
    const keywords = {
        cpu: ['cpu', 'process', 'session', 'performance'],
        io: ['io', 'disk', 'tablespace', 'datafile', 'wait'],
        memory: ['memory', 'pga', 'sga', 'buffer', 'cache'],
        lock: ['lock', 'blocking', 'deadlock', 'latch'],
        query: ['sql', 'query', 'execution', 'plan', 'statistics'],
        tempdb: ['tempdb', 'temp', 'sort'],
        index: ['index', 'fragmentation', 'rebuild']
    };
    
    const searchTerms = keywords[bottleneckType] || ['performance', 'monitoring'];
    
    try {
        let query = supabase
            .from('scripts')
            .select('*')
            .eq('visibility', 'public')
            .eq('category', 'PERFORMANCE');
        
        if (dbType && dbType !== 'Unknown') {
            query = query.eq('database', dbType);
        }
        
        const { data, error } = await query.limit(5);
        
        if (error) {
            console.error('Error searching performance scripts:', error);
            return [];
        }
        
        return data || [];
    } catch (err) {
        console.error('Exception in searchPerformanceScripts:', err);
        return [];
    }
}

// ==========================================
// 10. SAUVEGARDE ANALYSE PERFORMANCE
// ==========================================

async function savePerformanceAnalysis(input, inputType, metrics, aiDiagnosis, relatedScripts) {
    try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        const analysis = {
            user_id: currentUser ? currentUser.id : null,
            analysis_type: 'performance',
            input_type: inputType,
            input_content: input.substring(0, 10000),
            metrics: metrics,
            database_type: aiDiagnosis.database_type,
            bottleneck_type: aiDiagnosis.bottleneck_type,
            severity: aiDiagnosis.severity,
            health_score: aiDiagnosis.health_score,
            ai_diagnosis: aiDiagnosis,
            related_script_ids: relatedScripts.map(s => s.id),
            created_at: new Date().toISOString()
        };
        
        // Créer la table si elle n'existe pas encore
        // (À faire via Supabase console)
        
        const { data, error } = await supabase
            .from('performance_analyses')
            .insert(analysis)
            .select()
            .single();
        
        if (error) {
            console.error('Error saving performance analysis:', error);
            return null;
        }
        
        return data;
    } catch (err) {
        console.error('Exception in savePerformanceAnalysis:', err);
        return null;
    }
}