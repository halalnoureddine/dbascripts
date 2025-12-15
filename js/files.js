// ==========================================
// 📄 js/files.js - Gestion des fichiers
// ==========================================

// Import multiple de fichiers
async function handleMultipleFileImport(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const results = {
        success: 0,
        failed: 0,
        details: []
    };

    showToast(`📤 Import de ${files.length} fichier(s) en cours...`, "success");

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            const result = await processFileImport(file);
            if (result.success) {
                results.success++;
                results.details.push(`✅ ${file.name}: ${result.message}`);
            } else {
                results.failed++;
                results.details.push(`❌ ${file.name}: ${result.error}`);
            }
        } catch (error) {
            results.failed++;
            results.details.push(`❌ ${file.name}: ${error.message}`);
        }
    }

    const summary = `
        📊 Import terminé:
        ✅ Réussis: ${results.success}
        ❌ Échoués: ${results.failed}
    `;
    
    showToast(summary, results.failed === 0 ? "success" : "error");
    console.log("Détails de l'import:", results.details);
    
    loadFilesHistory();
    event.target.value = '';
}

// Traiter un fichier individuel
async function processFileImport(file) {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
            try {
                const content = e.target.result;
                const fileType = file.name.endsWith('.json') ? 'json' : 'sql';
                
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                
                const fileRecord = {
                    filename: file.name,
                    file_type: fileType,
                    file_content: content,
                    file_size: file.size,
                    uploaded_by: currentUser.id,
                    uploaded_at: new Date().toISOString(),
                    description: `Importé le ${new Date().toLocaleString('fr-FR')}`,
                    metadata: {
                        original_name: file.name,
                        size_kb: (file.size / 1024).toFixed(2)
                    }
                };

                const { error: fileError } = await supabase
                    .from('files')
                    .insert(fileRecord);

                if (fileError) {
                    resolve({ success: false, error: `Erreur DB: ${fileError.message}` });
                    return;
                }

                let scriptsImported = 0;

                if (fileType === 'json') {
                    const data = JSON.parse(content);
                    
                    if (data.scripts && Array.isArray(data.scripts)) {
                        for (const script of data.scripts) {
                            delete script.id;
                            
                            const { error: scriptError } = await supabase
                                .from('scripts')
                                .insert({
                                    ...script,
                                    added_by: currentUser.email,
                                    visibility: 'public',
                                    created_at: new Date().toISOString()
                                });
                            
                            if (!scriptError) scriptsImported++;
                        }
                    }
                } else if (fileType === 'sql') {
                    const lines = content.split('\n');
                    let title = file.name.replace('.sql', '');
                    let database = 'Oracle';
                    let category = 'DATABASE INFO';
                    let description = '';

                    lines.forEach(line => {
                        if (line.startsWith('--')) {
                            const comment = line.substring(2).trim();
                            if (comment.toLowerCase().startsWith('title:')) 
                                title = comment.substring(6).trim();
                            if (comment.toLowerCase().startsWith('database:')) 
                                database = comment.substring(9).trim();
                            if (comment.toLowerCase().startsWith('category:')) 
                                category = comment.substring(9).trim();
                            if (comment.toLowerCase().startsWith('description:')) 
                                description = comment.substring(12).trim();
                        }
                    });

                    const { error: scriptError } = await supabase
                        .from('scripts')
                        .insert({
                            title,
                            database,
                            category,
                            code: content,
                            description,
                            added_by: currentUser.email,
                            visibility: 'public',
                            created_at: new Date().toISOString()
                        });

                    if (!scriptError) scriptsImported = 1;
                }

                resolve({ 
                    success: true, 
                    message: `${scriptsImported} script(s) importé(s)` 
                });

            } catch (error) {
                resolve({ success: false, error: error.message });
            }
        };

        reader.onerror = () => {
            resolve({ success: false, error: "Erreur de lecture du fichier" });
        };

        reader.readAsText(file);
    });
}

// Charger l'historique des fichiers
async function loadFilesHistory() {
    const container = document.getElementById('filesHistoryContainer');
    
    if (!container) return;

    container.innerHTML = '<p class="text-center text-gray-500 py-4">Chargement...</p>';

    const { data: files, error } = await supabase
        .from('files')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(20);

    if (error) {
        container.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <p>❌ Erreur de chargement: ${error.message}</p>
            </div>
        `;
        return;
    }

    if (!files || files.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <div class="text-4xl mb-2">📁</div>
                <p>Aucun fichier importé pour le moment</p>
            </div>
        `;
        return;
    }

    container.innerHTML = files.map(file => {
        const icon = file.file_type === 'json' ? '📄' : '📜';
        const sizeKB = (file.file_size / 1024).toFixed(2);
        const date = new Date(file.uploaded_at).toLocaleString('fr-FR');

        return `
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-purple-400 transition">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-2xl">${icon}</span>
                            <h4 class="font-bold text-gray-800">${escapeHtml(file.filename)}</h4>
                            <span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">${file.file_type.toUpperCase()}</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-1">${escapeHtml(file.description || '')}</p>
                        <div class="flex items-center gap-4 text-xs text-gray-500">
                            <span>📅 ${date}</span>
                            <span>💾 ${sizeKB} KB</span>
                            <span>👤 ${escapeHtml(file.uploaded_by || 'Inconnu')}</span>
                        </div>
                    </div>
                    
                    <div class="flex gap-2 ml-4">
                        <button 
                            onclick="viewFileContent(${file.id})" 
                            class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                            title="Voir le contenu">
                            👁️ Voir
                        </button>
                        <button 
                            onclick="downloadFile(${file.id}, '${escapeHtml(file.filename)}')" 
                            class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                            title="Télécharger">
                            ⬇️
                        </button>
                        <button 
                            onclick="deleteFile(${file.id})" 
                            class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                            title="Supprimer">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Voir le contenu d'un fichier
async function viewFileContent(fileId) {
    const { data: file, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

    if (error || !file) {
        showToast("❌ Erreur de chargement du fichier", "error");
        return;
    }

    window.currentViewFile = file;

    const content = document.getElementById("content");
    
    content.innerHTML = `
        <section class="max-w-5xl mx-auto py-12 px-4 animate-fade-in">
            <button onclick="showAdmin(); setTimeout(() => showAdminTab('import'), 100)" 
                class="mb-6 px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition font-medium">
                ← Retour à l'import/export
            </button>
            
            <div class="bg-white rounded-xl shadow-xl p-8">
                <div class="mb-6">
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">
                        ${file.file_type === 'json' ? '📄' : '📜'} ${escapeHtml(file.filename)}
                    </h2>
                    <div class="flex items-center gap-4 text-sm text-gray-600">
                        <span>📅 ${new Date(file.uploaded_at).toLocaleString('fr-FR')}</span>
                        <span>💾 ${(file.file_size / 1024).toFixed(2)} KB</span>
                        <span>📝 ${file.file_type.toUpperCase()}</span>
                    </div>
                </div>

                <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre><code class="language-${file.file_type === 'json' ? 'json' : 'sql'} text-sm">${escapeHtml(file.file_content)}</code></pre>
                </div>

                <div class="mt-6 flex gap-3">
                    <button 
                        onclick="downloadFileFromView()"
                        class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                        📥 Télécharger
                    </button>
                    <button 
                        onclick="copyFileContentFromView()"
                        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                        📋 Copier
                    </button>
                </div>
            </div>
        </section>
    `;

    setTimeout(() => {
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }, 100);
}

// Télécharger depuis la vue
function downloadFileFromView() {
    if (!window.currentViewFile) return;
    const file = window.currentViewFile;
    const blob = new Blob([file.file_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast("📥 Fichier téléchargé!", "success");
}

// Copier depuis la vue
function copyFileContentFromView() {
    if (!window.currentViewFile) return;
    navigator.clipboard.writeText(window.currentViewFile.file_content)
        .then(() => showToast('📋 Contenu copié!', 'success'))
        .catch(() => showToast('❌ Erreur de copie', 'error'));
}

// Télécharger un fichier
async function downloadFile(fileId, filename) {
    const { data: file, error } = await supabase
        .from('files')
        .select('file_content')
        .eq('id', fileId)
        .single();

    if (error || !file) {
        showToast("❌ Erreur de téléchargement", "error");
        return;
    }

    const blob = new Blob([file.file_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast("📥 Fichier téléchargé!", "success");
}

// Supprimer un fichier
async function deleteFile(fileId) {
    if (!confirm("⚠️ Êtes-vous sûr de vouloir supprimer ce fichier de l'historique?\n\nNote: Les scripts déjà importés ne seront pas supprimés.")) {
        return;
    }

    const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

    if (error) {
        showToast("❌ Erreur de suppression", "error");
    } else {
        showToast("✅ Fichier supprimé!", "success");
        loadFilesHistory();
    }
}