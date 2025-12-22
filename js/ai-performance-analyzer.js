// ==========================================
// 🔥 js/ai-performance-analyzer.js - Analyseur de Performance IA
// ==========================================

// ==========================================
// 1. FONCTION PRINCIPALE D'ANALYSE DE PERFORMANCE
// ==========================================

async function analyzePerformanceIssue(input, inputType = 'description') {
    if (!input || input.trim().length === 0) {
        showToast("❌ Veuillez fournir des informations sur le problème", "error");
        return null;
    }
    
    showLoader("🔥 Analyse de performance en cours avec Groq...");
    
    try {
        const perfType = detectPerformanceType(input);
        const metrics = extractPerformanceMetrics(input, inputType);
        
        console.log('Performance analysis started:', { perfType, metrics, inputType });
        
        let aiAnalysis;
        
        if (inputType === 'awr') {
            aiAnalysis = await analyzeAWRWithGroq(input, metrics);
        } else if (inputType === 'sql_server_report') {
            aiAnalysis = await analyzeSQLServerReportWithGroq(input, metrics);
        } else if (inputType === 'slow_query') {
            aiAnalysis = await analyzeSlowQueryWithGroq(input, metrics);
        } else {
            aiAnalysis = await analyzeGeneralPerformanceWithGroq(input, perfType, metrics);
        }
        
        hideLoader();
        
        if (!aiAnalysis.success) {
            showToast("❌ Erreur lors de l'analyse IA: " + aiAnalysis.error, "error");
            return null;
        }
        
        const relatedScripts = await searchPerformanceScripts(
            aiAnalysis.data.bottleneck_type,
            aiAnalysis.data.database_type
        );
        
        const savedAnalysis = await savePerformanceAnalysis(
            input,
            inputType,
            metrics,
            aiAnalysis.data,
            relatedScripts
        );
        
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
    
    const cpuMatch = input.match(/cpu[:\s]+(\d+(?:\.\d+)?)%/i);
    if (cpuMatch) metrics.cpu_usage = parseFloat(cpuMatch[1]);
    
    const memMatch = input.match(/memory[:\s]+(\d+(?:\.\d+)?)%/i);
    if (memMatch) metrics.memory_usage = parseFloat(memMatch[1]);
    
    const ioMatch = input.match(/io.*wait[:\s]+(\d+(?:\.\d+)?)/i);
    if (ioMatch) metrics.io_wait = parseFloat(ioMatch[1]);
    
    const rtMatch = input.match(/response.*time[:\s]+(\d+(?:\.\d+)?)\s*(ms|sec|seconds?)/i);
    if (rtMatch) {
        metrics.response_time = parseFloat(rtMatch[1]);
        if (rtMatch[2].startsWith('sec')) metrics.response_time *= 1000;
    }
    
    return metrics;
}

// ==========================================
// 4. ANALYSE AWR (ORACLE)
// ==========================================

async function analyzeAWRWithGroq(awrReport, metrics) {
    const reportPreview = awrReport.length > 12000 
        ? awrReport.substring(0, 12000) + '\n\n[... Rapport tronqué pour analyse ...]'
        : awrReport;
    
    const prompt = `Tu es un expert DBA Oracle spécialisé dans l'analyse de rapports AWR.

📊 RAPPORT AWR COMPLET À ANALYSER:
${reportPreview}

📈 MÉTRIQUES EXTRAITES:
${JSON.stringify(metrics, null, 2)}

🎯 OBJECTIF DE L'ANALYSE:
Analyse CE RAPPORT AWR COMPLET et fournis un diagnostic détaillé des problèmes de performance.

📋 INSTRUCTIONS D'ANALYSE:
1. IDENTIFICATION DES GOULOTS (obligatoire)
2. WAIT EVENTS (obligatoire si présents)
3. TOP SQL (obligatoire si présent)
4. STATISTIQUES SYSTÈME
5. RECOMMANDATIONS PRIORITAIRES

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

[Instructions similaires à AWR mais adaptées à SQL Server...]

RÉPONDS en JSON valide...`;

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
2. Identifie les problèmes de performance
3. Détecte les index manquants
4. Vérifie les anti-patterns SQL
5. Propose une version optimisée

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
    const prompt = `Tu es un expert DBA spécialisé en performance.

DESCRIPTION DU PROBLÈME:
${description}

TYPE DE PROBLÈME DÉTECTÉ: ${perfType}

MÉTRIQUES (si disponibles):
${JSON.stringify(metrics, null, 2)}

INSTRUCTIONS:
1. Analyse ce problème de performance
2. Identifie la cause racine probable
3. Détermine le type de base de données
4. Évalue la gravité
5. Propose des diagnostics et solutions

RÉPONDS en JSON...`;

    return await callGroqAPI(prompt, "General Performance Analysis");
}

// ==========================================
// 8. FONCTION GÉNÉRIQUE APPEL GROQ
// ==========================================

async function callGroqAPI(prompt, analysisType) {
    try {
        console.log(`📡 Calling Groq for ${analysisType}...`);
        
        // Réutiliser la fonction sécurisée de ai-analyzer.js
        const data = await callGroqSecurely(prompt, {
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            max_tokens: 3000
        });
        
        const text = data.choices[0].message.content;
        
        let cleanText = text.trim();
        cleanText = cleanText.replace(/^```json\s*/i, '');
        cleanText = cleanText.replace(/^```\s*/i, '');
        cleanText = cleanText.replace(/\s*```$/i, '');
        
        const parsed = JSON.parse(cleanText);
        
        console.log('✅ Analysis successful');
        
        return {
            success: true,
            data: parsed
        };
    } catch (error) {
        console.error('❌ Analysis failed:', error);
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