// ==========================================
// 📄 js/admin.js - Panel d'administration
// ==========================================

// Afficher le panel d'administration
async function showAdmin() {
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
        showToast("❌ Accès refusé. Veuillez vous connecter.", "error");
        showLogin();
        return;
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

    if (error || !profile || profile.role !== 'admin') {
        showToast("❌ Accès Admin refusé. Vous n'avez pas les permissions.", "error");
        showHome();
        return;
    }

    user = currentUser;
    userRole = profile.role;
    
    const { data, error: scriptsError } = await supabase
        .from("scripts")
        .select("*")
        .order("created_at", { ascending: false });
    
    if (scriptsError) {
        showToast("Erreur de chargement", "error");
        return;
    }

    document.getElementById("content").innerHTML = `
        <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
            <div class="bg-white rounded-xl shadow-xl p-8 mb-8">
                <h2 class="text-3xl font-bold text-gray-800 mb-6">🔐 Admin (${user.email})</h2>
                
                <div class="flex gap-4 mb-6 border-b">
                    <button onclick="showAdminTab('add')" id="tabAdd" class="px-6 py-3 font-semibold text-gray-600 hover:text-purple-600">
                        ➕ Add a script
                    </button>
                    <button onclick="showAdminTab('manage')" id="tabManage" class="px-6 py-3 font-semibold border-b-2 border-purple-600 text-purple-600">
                        🗂️ Manage scripts (${data.length})
                    </button>
                    <button onclick="showAdminTab('import')" id="tabImport" class="px-6 py-3 font-semibold text-gray-600 hover:text-purple-600">
                        📤 Import/Export
                    </button>
                </div>

                <div id="adminTabContent"></div>
            </div>
        </section>
    `;

    window.adminScripts = data;
    showAdminTab('manage'); 
}

// Afficher un onglet spécifique de l'admin
function showAdminTab(tab) {
    document.getElementById('tabAdd').className = tab === 'add' 
        ? 'px-6 py-3 font-semibold border-b-2 border-purple-600 text-purple-600'
        : 'px-6 py-3 font-semibold text-gray-600 hover:text-purple-600';
    
    document.getElementById('tabManage').className = tab === 'manage'
        ? 'px-6 py-3 font-semibold border-b-2 border-purple-600 text-purple-600'
        : 'px-6 py-3 font-semibold text-gray-600 hover:text-purple-600';
    
    document.getElementById('tabImport').className = tab === 'import'
        ? 'px-6 py-3 font-semibold border-b-2 border-purple-600 text-purple-600'
        : 'px-6 py-3 font-semibold text-gray-600 hover:text-purple-600';

    const content = document.getElementById('adminTabContent');

    // ONGLET 1 : AJOUTER UN SCRIPT
    if (tab === 'add') {
        content.innerHTML = `
            <form onsubmit="addScript(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                    <input name="title" type="text" required 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: Check disk space" />
                </div>

                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Database *</label>
                        <select name="database" required 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="Oracle">️️️🗄️ Oracle</option>
                            <option value="SQL Server">️️️⚙️ SQL Server</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                        <select name="category" required 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            ${categories.map(c => `<option value="${c}">${categoryIcons[c] || ""} ${c}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">SQL Code *</label>
                    <textarea name="code" required rows="8"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                        placeholder="SELECT * FROM ..."></textarea>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea name="description" rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Script description"></textarea>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Tags (comma separated)</label>
                    <input name="tags" type="text"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="space, disk, monitoring" />
                </div>

                <div class="mb-4">
                    <label for="visibility" class="block text-sm font-medium text-gray-700">Visibilité du Script</label>
                    <select name="visibility" id="visibility" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="public" selected>🌍 Public (Visible par tous)</option>
                        <option value="private">🔒 Privé (Visible par les admins)</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Prerequisites</label>
                    <input name="prerequis" type="text"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="DBA rights required..." />
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                    <textarea name="notes" rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Usage notes"></textarea>
                </div>

                <div class="flex gap-3 pt-4">
                    <button type="submit" 
                        class="flex-1 px-6 py-3 btn-primary text-white rounded-lg font-semibold">
                        💾 Save script
                    </button>
                    <button type="button" onclick="showHome()"
                        class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold">
                        Cancel
                    </button>
                </div>
            </form>
        `;

    // ONGLET 2 : GÉRER LES SCRIPTS
    } else if (tab === 'manage') {
        const scripts = window.adminScripts || [];
        
        content.innerHTML = `
            <div class="mb-4">
                <input 
                    type="text" 
                    id="adminSearchInput"
                    placeholder="🔍 Search for a script to manage..." 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    oninput="filterAdminScripts(this.value)"
                />
            </div>

            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <p class="text-sm text-gray-600">
                    <strong>${scripts.length}</strong> scripts total • Click on a script to manage it
                </p>
            </div>

            <div id="adminScriptsList" class="space-y-3 max-h-96 overflow-y-auto">
                ${scripts.map(script => {
                    const isPending = script.visibility === 'pending';
                    const bgClass = isPending ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-200';
                    const statusBadge = isPending 
                        ? '<span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">⏳ EN ATTENTE</span>' 
                        : '';

                    return `
                        <div class="${bgClass} border-2 rounded-lg p-4 hover:border-purple-400 transition">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span>${script.database === 'Oracle' ? '️️️🗄️' : '️️️⚙️'}</span>
                                        <span>${categoryIcons[script.category] || '📋'}</span>
                                        <span class="text-xs px-2 py-1 bg-gray-100 rounded">${script.database}</span>
                                        <span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">${script.category}</span>
                                    </div>
                                    
                                    <h3 class="font-bold text-gray-800 mb-1 flex items-center">
                                        ${escapeHtml(script.title)}
                                        ${statusBadge}
                                    </h3>
                                    
                                    <p class="text-sm text-gray-600 mb-2">${escapeHtml(script.description || 'No description')}</p>
                                    <div class="flex items-center gap-4 text-xs text-gray-500">
                                        <span>📅 ${new Date(script.created_at).toLocaleDateString('en-US')}</span>
                                        <span>👤 Ajouté par: ${escapeHtml(script.added_by || 'Unknown')}</span>
                                    </div>
                                </div>
                                
<div class="flex gap-2 ml-4">
    <button onclick="showScriptDetail(${script.id})" 
        class="px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-purple-600 rounded-lg transition text-sm">
        👁️ View
    </button>
    
    <button onclick="editScriptDetails(${script.id})" 
        class="px-3 py-2 ${isPending ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'bg-yellow-60 hover:bg-yellow-100'} text-blue rounded-lg transition text-sm font-bold">
        ${isPending ? '✅ VALIDER' : '✏️ Update'}
    </button>
    
    <button onclick="confirmDeleteScript(${script.id}, '${escapeHtml(script.title).replace(/'/g, "\\'")}')" 
        class="px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition text-sm">
        🗑️ Delete
    </button>
</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

    // ONGLET 3 : IMPORT/EXPORT (défini dans files.js)
    } else if (tab === 'import') {
        loadFilesHistory();
        
        content.innerHTML = `
            <div class="space-y-6">
                <div class="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border-2 border-purple-200">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        📤 Importer des fichiers
                    </h3>
                    
                    <div class="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center bg-white">
                        <input 
                            type="file" 
                            id="fileInput" 
                            accept=".json,.sql" 
                            multiple
                            class="hidden" 
                            onchange="handleMultipleFileImport(event)" 
                        />
                        <button 
                            onclick="document.getElementById('fileInput').click()" 
                            class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium shadow-lg">
                            📁 Choisir un ou plusieurs fichiers
                        </button>
                        <p class="text-gray-600 mt-4">Formats acceptés: JSON, SQL</p>
                        <p class="text-sm text-gray-500 mt-2">Vous pouvez sélectionner plusieurs fichiers à la fois</p>
                    </div>

                    <div class="mt-4 bg-blue-50 p-4 rounded-lg">
                        <h4 class="font-bold text-gray-800 mb-2">💡 Formats supportés:</h4>
                        <ul class="text-sm text-gray-700 space-y-1">
                            <li>• <strong>JSON</strong>: Export complet avec métadonnées</li>
                            <li>• <strong>SQL</strong>: Fichier SQL avec commentaires</li>
                        </ul>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        📥 Exporter tous les scripts
                    </h3>
                    <p class="text-sm text-gray-700 mb-4">
                        Téléchargez tous vos scripts avec favoris et métadonnées au format JSON
                    </p>
                    <button 
                        onclick="exportUserData()" 
                        class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-lg">
                        📥 Exporter toutes les données
                    </button>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-gray-800 flex items-center">
                            📋 Historique des fichiers importés
                        </h3>
                        <button 
                            onclick="loadFilesHistory()" 
                            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
                            🔄 Actualiser
                        </button>
                    </div>
                    
                    <div id="filesHistoryContainer" class="space-y-3">
                        <p class="text-center text-gray-500 py-4">Chargement...</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Ajouter un nouveau script
async function addScript(e) {
    e.preventDefault();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        showToast("❌ Erreur. Session non valide. Veuillez vous reconnecter.", "error"); 
        console.error("Session Error:", sessionError);
        return;
    }
    
    const user = session.user;
    const isUserAdmin = userRole === 'admin';
    const f = e.target;
    
    let visibilityStatus = 'pending'; 
    
    if (isUserAdmin && f.visibility) {
        visibilityStatus = f.visibility.value;
    }
    
    const script = {
        title: f.title.value.trim(),
        database: f.database.value,
        category: f.category.value,
        code: f.code.value.trim(),
        description: f.description.value.trim(),
        tags: f.tags.value.split(',').map(t => t.trim()).filter(t => t),
        added_by: user.email,
        visibility: visibilityStatus, 
        prerequis: f.prerequis ? f.prerequis.value.trim() : '', 
        notes: f.notes ? f.notes.value.trim() : '', 
        created_at: new Date().toISOString()
    };

    const { error } = await supabase.from("scripts").insert(script);
    
    if (error) {
        showToast("❌ Erreur d'ajout. Permission refusée (RLS).", "error");
        console.error(error);
    } else {
        const message = visibilityStatus === 'pending' 
            ? "✅ Script envoyé ! En attente de validation admin."
            : "✅ Script ajouté et publié !";
        showToast(message, "success");
        
        f.reset();
        setTimeout(() => showHome(), 1500);
    }
}

// Formulaire de contribution pour non-admins
function showContributorAddForm() {
    const content = document.getElementById("content");
    
    content.innerHTML = `
        <section class="max-w-3xl mx-auto py-12 px-4 animate-fade-in">
            <div class="bg-white rounded-xl shadow-xl p-8">
                <h2 class="text-3xl font-bold text-gray-800 mb-6">➕ Proposer un nouveau script</h2>
                <p class="mb-6 text-blue-600 bg-blue-50 p-3 rounded">ℹ️ Votre script sera soumis à validation avant d'être visible par tous.</p>
                
                <form onsubmit="addScript(event)" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Titre *</label>
                        <input name="title" type="text" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>

                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Database *</label>
                            <select name="database" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                <option value="Oracle">️️️🗄️ Oracle</option>
                                <option value="SQL Server">️️️⚙️ SQL Server</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Catégorie *</label>
                            <select name="category" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Code SQL *</label>
                        <textarea name="code" required rows="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500"></textarea>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <textarea name="description" rows="2" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                    </div>
                    
                    <input name="tags" type="hidden" value="" />

                    <div class="flex gap-3 pt-4">
                        <button type="submit" class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">🚀 Soumettre le script</button>
                        <button type="button" onclick="showHome()" class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Annuler</button>
                    </div>
                </form>
            </div>
        </section>
    `;
}

// Modifier un script existant
async function editScriptDetails(scriptId) {
    const { data: script, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', scriptId)
        .single();
    
    if (error || !script) {
        showToast("❌ Impossible de charger le script.", "error");
        return;
    }

    const content = document.getElementById("content");
    const tagsString = Array.isArray(script.tags) ? script.tags.join(', ') : script.tags || '';
    const inputStyle = 'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border';

    content.innerHTML = `
        <div class="max-w-3xl mx-auto p-8 animate-fade-in bg-white rounded-xl shadow-2xl">
            <h1 class="text-3xl font-bold border-b-2 border-indigo-500 pb-3 mb-8 text-gray-900">
                ✏️ Modifier / Valider : ${escapeHtml(script.title)}
            </h1>
            
            <form onsubmit="updateScript(event)" class="space-y-4">
                <input type="hidden" name="scriptId" value="${scriptId}">
                
                <div class="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <label for="visibility" class="block text-sm font-bold text-gray-800 uppercase mb-1">Statut de Visibilité</label>
                    <select id="visibility" name="visibility" required class="${inputStyle} bg-white">
                        <option value="pending" ${script.visibility === 'pending' ? 'selected' : ''}>⏳ En attente (Non visible)</option>
                        <option value="public" ${script.visibility === 'public' ? 'selected' : ''}>🌍 Public (Validé)</option>
                        <option value="private" ${script.visibility === 'private' ? 'selected' : ''}>🔒 Privé (Admin seul)</option>
                    </select>
                    <p class="text-xs text-gray-500 mt-1">Passez à "Public" pour valider le script d'un contributeur.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Database</label>
                        <select name="database" required class="${inputStyle}">
                            <option value="Oracle" ${script.database === 'Oracle' ? 'selected' : ''}>Oracle</option>
                            <option value="SQL Server" ${script.database === 'SQL Server' ? 'selected' : ''}>SQL Server</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Catégorie</label>
                        <select name="category" required class="${inputStyle}">
                            ${categories.map(cat => `<option value="${cat}" ${script.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700">Titre</label>
                    <input type="text" name="title" value="${escapeHtml(script.title)}" required class="${inputStyle}">
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" rows="2" class="${inputStyle}">${escapeHtml(script.description || '')}</textarea>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700">Code SQL</label>
                    <textarea name="code" rows="8" required class="font-mono text-sm ${inputStyle}">${script.code}</textarea>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700">Tags</label>
                    <input type="text" name="tags" value="${escapeHtml(tagsString)}" class="${inputStyle}">
                </div>

                <div class="flex justify-end space-x-4 pt-4 border-t">
                    <button type="button" onclick="showAdmin()" class="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300">Annuler</button>
                    <button type="submit" class="px-6 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700">Enregistrer les modifications</button>
                </div>
            </form>
        </div>
    `;
}

// Mettre à jour un script
async function updateScript(e) {
    e.preventDefault();
    
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user || userRole !== 'admin') {
        showToast("❌ Erreur. Rôle Admin requis pour modifier/valider.", "error");
        return;
    }
    
    const f = e.target;
    const scriptId = f.scriptId?.value;
    
    if (!scriptId) {
        showToast("❌ Erreur critique : ID du script manquant.", "error");
        return;
    }

    const updatedScript = {
        title: f.title.value.trim(),
        database: f.database.value,
        category: f.category.value,
        code: f.code.value.trim(),
        description: f.description.value.trim(),
        tags: f.tags.value.split(',').map(t => t.trim()).filter(t => t),
        prerequis: '', 
        notes: '', 
        visibility: f.visibility.value,
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('scripts')
        .update(updatedScript)
        .eq('id', scriptId);

    if (error) {
        showToast("❌ Échec de la mise à jour : Vérifiez la RLS UPDATE.", "error");
        console.error("Update Error:", error);
    } else {
        const isPending = updatedScript.visibility === 'pending';
        const message = isPending 
            ? "✅ Modifications enregistrées." 
            : "✅ Script validé et publié !";
        
        showToast(message, "success");
        
        setTimeout(() => {
            showAdmin();
            setTimeout(() => {
                showAdminTab('manage');
            }, 100);
        }, 1000);
    }
}

// Supprimer un script
async function deleteScript(id) {
    const { error } = await supabase.from("scripts").delete().eq("id", id);
    
    if (error) {
        showToast("Deletion error: Permission denied or script not found", "error");
    } else {
        showToast("✅ Script deleted!", "success");
        setTimeout(() => showAdmin(), 1000);
    }
}

// Confirmer la suppression
function confirmDeleteScript(id, title) {
    if (!confirm(`⚠️ Êtes-vous sûr de vouloir supprimer le script:\n\n"${title}"\n\nCette action est irréversible.`)) {
        return;
    }
    deleteScript(id);
}

// Filtrer les scripts dans l'admin
function filterAdminScripts(query) {
    const scripts = window.adminScripts || [];
    const searchTerm = query.toLowerCase();
    
    const filtered = searchTerm 
        ? scripts.filter(script => {
            return script.title.toLowerCase().includes(searchTerm) ||
                   (script.description && script.description.toLowerCase().includes(searchTerm)) ||
                   script.database.toLowerCase().includes(searchTerm) ||
                   script.category.toLowerCase().includes(searchTerm);
          })
        : scripts;

    const listContainer = document.getElementById('adminScriptsList');
    listContainer.innerHTML = filtered.map(script => {
        const isPending = script.visibility === 'pending';
        const bgClass = isPending ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-200';
        const statusBadge = isPending 
            ? '<span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">⏳ EN ATTENTE</span>' 
            : '';
        
        return `
            <div class="${bgClass} border-2 rounded-lg p-4 hover:border-purple-400 transition">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
							<span>${getDbIcon(script.database)}</span>
							
							<span>${categoryIcons[script.category] || '📋'}</span>
							<span class="text-xs px-2 py-1 bg-gray-100 rounded">${script.database}</span>
                            <span>${categoryIcons[script.category] || '📋'}</span>
                            <span class="text-xs px-2 py-1 bg-gray-100 rounded">${script.database}</span>
                            <span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">${script.category}</span>
                        </div>
                        <h3 class="font-bold text-gray-800 mb-1 flex items-center">
                            ${escapeHtml(script.title)}
                            ${statusBadge}
                        </h3>
                        <p class="text-sm text-gray-600 mb-2">${escapeHtml(script.description || 'Pas de description')}</p>
                        <p class="text-xs text-gray-500">Créé le ${new Date(script.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div class="flex gap-2 ml-4">
                        <button onclick="showScriptDetail(${script.id})" 
                            class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                            👁️ View
                        </button>
                        <button onclick="editScriptDetails(${script.id})" 
                            class="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm">
                            ✏️ Update
                        </button> 
                        <button onclick="confirmDeleteScript(${script.id}, '${escapeHtml(script.title).replace(/'/g, "\\'")}')" 
                            class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}