// ==========================================
// 📄 js/scripts.js - Gestion des scripts
// ==========================================

// Charger les scripts récents
async function loadRecentScripts() {
    const container = document.getElementById('recentScriptsList');
    
    if (!container) {
        console.error('Container recentScriptsList not found');
        return;
    }

    try {
        const { data, error } = await supabase
            .from("scripts")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error('Supabase error:', error);
            container.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <p class="text-lg">Error loading scripts</p>
                </div>
            `;
            return;
        }

        // UTILISATION DE LA FONCTION CENTRALISÉE
        const scriptsToDisplay = filterScriptsByUserPreference(data);
        allScripts = scriptsToDisplay;
        
        // Limiter à 5 pour l'affichage récent
        const recentScripts = scriptsToDisplay.slice(0, 5);
        
        if (recentScripts.length === 0) {
            const message = user && userScriptFilter === 'mine' 
                ? "Vous n'avez pas encore ajouté de scripts"
                : "No scripts available";
                
            const buttonText = user 
                ? (userRole === 'admin' ? 'showAdmin()' : 'showContributorAddForm()')
                : 'showLogin()';
                
            container.innerHTML = `
                <div class="text-center py-8 text-gray-700">
                    <p class="text-lg">${message}</p>
                    <button onclick="${buttonText}" class="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
                        ➕ ${user ? 'Add your first script' : 'Login to add scripts'}
                    </button>
                </div>
            `;
            return;
        }
        
        console.log('Scripts loaded:', recentScripts);
        container.innerHTML = recentScripts.map(script => renderScriptCard(script)).join('');
    } catch (err) {
        console.error('Error loading recent scripts:', err);
        container.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <p class="text-lg">Erreur: ${err.message}</p>
            </div>
        `;
    }
}


// Rendre une carte de script
function renderScriptCard(script) {
  const dbIcon = script.database === "Oracle" ? "️️️🗄️" : "️️⚙️";
  const catIcon = categoryIcons[script.category] || "📋";
  const isFav = isFavorite(script.id);
  
  const isPending = script.visibility === 'pending';
  const pendingClass = isPending ? 'card-pending' : '';
  
  return `
    <div class="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition duration-500 transform hover:-translate-y-1 hover:scale-[1.005] border border-gray-200 flex items-center justify-between cursor-pointer group ${pendingClass}"
         onclick="showScriptDetail(${script.id})"
         onmouseenter="showScriptPreview(event, ${script.id})" 
         onmouseleave="hideScriptPreview()">
      
      <div class="flex items-center space-x-4 flex-1 min-w-0">
        
        
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-semibold text-gray-900 leading-tight truncate">
            ${escapeHtml(script.title)} 
            ${isPending ? '<span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold ml-2">⏳ PENDING</span>' : ''}
          </h3>
         
        </div>
      </div>

      <div class="flex items-center space-x-4 flex-shrink-0 ml-4">
        <button class="text-gray-400 hover:text-yellow-500 transition duration-300 transform hover:scale-125 focus:outline-none" 
                onclick="event.stopPropagation(); toggleFavorite(${script.id})" 
                data-favorite-id="${script.id}">
          ${isFav ? 
            '<svg class="w-6 h-6 fill-current text-yellow-500" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>' : 
            '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.974 2.887a1 1 0 00-.363 1.118l1.519 4.674c.3.921-.755 1.688-1.538 1.118l-3.974-2.887a1 1 0 00-1.176 0l-3.974 2.887c-.783.57-1.838-.197-1.538-1.118l1.519-4.674a1 1 0 00-.363-1.118l-3.974-2.887c-.783-.57-.381-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z"></path></svg>'}
        </button>

        <svg class="w-6 h-6 text-indigo-400 group-hover:text-indigo-600 transition duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
      </div>
    </div>
  `;
}

// Afficher le détail d'un script
// Afficher le détail d'un script
async function showScriptDetail(id) {
  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    showToast("Loading error", "error");
    return;
  }

  const script = data;
  
  // 1. Utiliser les icônes et couleurs de DB cohérentes
  let dbIcon = '❓';
  let accentColor = 'purple';
  if (script.database === "Oracle") {
      dbIcon = "🗄️"; 
      accentColor = 'red';
  } else if (script.database === "SQL Server") {
      dbIcon = "⚙️"; 
      accentColor = 'blue';
  } else if (script.database === "PostgreSQL") {
      dbIcon = "🐘";
      accentColor = 'green';
  }
  
  const isFav = isFavorite(script.id);
  let tagsDisplay = script.tags && Array.isArray(script.tags) ? 
    script.tags.map(tag => `<span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">#${escapeHtml(tag)}</span>`).join(' ') : 
    '<span class="text-gray-500 text-sm">Aucun tag</span>';

  document.getElementById("content").innerHTML = `
    <section class="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
      
      <button onclick="loadCategoryByDatabase('${script.database}', '${script.category}')" 
        class="mb-6 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition font-medium flex items-center space-x-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        <span>Retour à ${escapeHtml(script.category)}</span>
      </button>
      
      <div class="bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        <div class="p-10 border-b border-gray-200">
            
            <div class="flex items-center space-x-4 mb-4 text-sm font-semibold text-gray-600">
                <span class="text-xl">${dbIcon}</span>
                <span class="text-gray-400">/</span>
                <span class="text-${accentColor}-600">${escapeHtml(script.database)}</span>
                <span class="text-gray-400">/</span>
                <span>${escapeHtml(script.category)}</span>
            </div>

            <div class="flex justify-between items-start">
                <h2 class="text-3xl font-extrabold text-gray-900 leading-tight">${escapeHtml(script.title)}</h2>
                <button onclick="toggleFavorite(${script.id})" class="favorite-icon text-4xl text-gray-400 hover:text-yellow-500 transition ml-6" data-favorite-id="${script.id}">
                    ${isFav ? '⭐' : '☆'}
                </button>
            </div>
            <p class="text-xl text-gray-500 mt-3">${escapeHtml(script.description || 'Script sans description.')}</p>
        </div>

        <div class="p-10">
          
          <div class="mb-10 relative border border-gray-200 rounded-xl">
            
            <div class="sticky top-0 bg-gray-50 p-3 border-b border-gray-200 rounded-t-xl flex justify-between items-center z-10">
                <span class="text-sm font-mono text-gray-600">SQL Code</span>
                <div class="flex space-x-2">
                    
                    <button onclick="copyScript()" 
                        class="p-2 bg-white text-gray-600 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 hover:text-gray-800 transition"
                        title="Copier le script">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v2M9 17v-4m0 0l-2-2m2 2l2-2"></path></svg>
                    </button>
                    
                    <button onclick="exportScriptSQL(${script.id})" 
                        class="p-2 bg-white text-${accentColor}-600 border border-${accentColor}-300 rounded-lg shadow-sm hover:bg-${accentColor}-50 transition"
                        title="Exporter en fichier SQL">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </button>
                </div>
            </div>
            
            <pre class="overflow-x-auto"><code id="scriptCode" class="language-sql p-4">${escapeHtml(script.code || "")}</code></pre>
          </div>
          



          ${script.prerequis ? `
            <div class="mb-8 p-5 bg-yellow-50 border-l-4 border-yellow-400 rounded-xl shadow-sm">
              <h4 class="font-bold text-yellow-800 mb-2 flex items-center space-x-2 text-lg">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.364 2.656-1.364 3.421 0l6.559 11.603c.777 1.378-.285 3.076-1.845 3.076H3.541c-1.56 0-2.622-1.698-1.845-3.076l6.559-11.603zM10 16a1 1 0 100-2 1 1 0 000 2zm-1-6a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>
                  <span>Prérequis</span>
              </h4>
              <p class="text-base text-yellow-700 whitespace-pre-wrap mt-2">${escapeHtml(script.prerequis)}</p>
            </div>
          ` : ''}

          ${script.notes ? `
            <div class="mb-8 p-5 bg-blue-50 border-l-4 border-blue-400 rounded-xl shadow-sm">
              <h4 class="font-bold text-blue-800 mb-2 flex items-center space-x-2 text-lg">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"></path></svg>
                  <span>Notes d'Exécution</span>
              </h4>
              <p class="text-base text-blue-700 whitespace-pre-wrap mt-2">${escapeHtml(script.notes)}</p>
            </div>
          ` : ''}
          
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

// Copier le script dans le presse-papiers
function copyScript() {
  const codeElement = document.querySelector("#scriptCode");
  if (!codeElement) return;
  
  navigator.clipboard.writeText(codeElement.textContent).then(() => {
    showToast("📋 Script copied!", "success");
  }).catch(() => {
    showToast("Copy error", "error");
  });
}

// Exporter un script en SQL
async function exportScriptSQL(scriptId) {
  const { data: script } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", scriptId)
    .single();

  if (!script) return;

  const sqlContent = `-- ${script.title}
-- Database: ${script.database}
-- Category: ${script.category}
-- Created: ${new Date(script.created_at).toLocaleDateString('en-US')}
${script.description ? `-- Description: ${script.description}` : ''}

${script.code}`;

  const blob = new Blob([sqlContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${script.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.sql`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast("📥 Script exported!", "success");
}

// Exporter toutes les données utilisateur
async function exportUserData() {
  const { data: allScripts } = await supabase.from("scripts").select("*");
  
  const exportData = {
    scripts: allScripts,
    favorites: favorites,
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dba-scripts-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast("📥 Export successful!", "success");
}

// Fonctions de tri et filtrage
function sortScripts(scripts, sortType) {
  const sorted = [...scripts];
  switch(sortType) {
    case 'recent':
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    case 'old':
      return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    case 'alpha':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
}

function filterScriptsInList(query) {
  const searchTerm = query.toLowerCase();
  
  if (!searchTerm) {
    filteredScripts = [...allScripts];
  } else {
    filteredScripts = allScripts.filter(script => {
      const titleMatch = script.title.toLowerCase().includes(searchTerm);
      const descMatch = script.description && script.description.toLowerCase().includes(searchTerm);
      const tagsMatch = script.tags && Array.isArray(script.tags) && 
        script.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      
      return titleMatch || descMatch || tagsMatch;
    });
  }
  
  currentPage = 1;
  renderScriptList();
}

function changeSortInList(sortType) {
  currentSort = sortType;
  filteredScripts = sortScripts(filteredScripts, sortType);
  currentPage = 1;
  renderScriptList();
}

function updateSortButtons() {
  const sortButtons = document.querySelectorAll('.sort-btn');
  sortButtons.forEach(btn => {
    btn.classList.remove('active-sort');
    btn.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
    if (btn.dataset.sort === currentSort) {
      btn.classList.add('active-sort');
      btn.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
    }
  });
}

function renderScriptList() {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedScripts = filteredScripts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredScripts.length / itemsPerPage);

  const listContainer = document.getElementById('scriptsList');
  const paginationContainer = document.getElementById('paginationControls');
  const counterContainer = document.getElementById('scriptsCounter');

  counterContainer.innerHTML = `
    <p class="text-gray-600">
      ${filteredScripts.length} script(s) • Page ${currentPage} of ${totalPages || 1}
    </p>
  `;

  if (paginatedScripts.length === 0) {
    listContainer.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-500">
        <div class="text-6xl mb-4">🔭</div>
        <p class="text-xl">No scripts found</p>
      </div>
    `;
  } else {
    listContainer.innerHTML = paginatedScripts.map(script => renderScriptCard(script)).join('');
  }

  const pageNumbers = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  paginationContainer.innerHTML = `
    <div class="flex items-center justify-center gap-2 flex-wrap">
      <button 
        onclick="changePage(${currentPage - 1})" 
        ${currentPage === 1 ? 'disabled' : ''}
        class="pagination-btn px-4 py-2 bg-white border-2 border-purple-300 text-purple-600 rounded-lg font-medium hover:bg-purple-50">
        ← Previous
      </button>

      ${pageNumbers.map(num => `
        <button 
          onclick="changePage(${num})" 
          class="pagination-btn px-4 py-2 ${num === currentPage ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg font-medium">
          ${num}
        </button>
      `).join('')}

      <button 
        onclick="changePage(${currentPage + 1})" 
        ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}
        class="pagination-btn px-4 py-2 bg-white border-2 border-purple-300 text-purple-600 rounded-lg font-medium hover:bg-purple-50">
        Next →
      </button>
    </div>
  `;
  
  updateSortButtons();
}

function changePage(newPage) {
  const totalPages = Math.ceil(filteredScripts.length / itemsPerPage);
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderScriptList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Preview tooltip
let tooltipElement = null;
let currentTooltipScript = null;

async function showScriptPreview(event, scriptId) {
  if (currentTooltipScript === scriptId && tooltipElement) return;
  
  const { data: script, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", scriptId)
    .single();

  if (error || !script) return;

  currentTooltipScript = scriptId;

  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'script-tooltip';
    document.body.appendChild(tooltipElement);
  }

  const codePreview = script.code.length > 500 
    ? script.code.substring(0, 500) + '...' 
    : script.code;

  tooltipElement.innerHTML = `
    <div class="script-tooltip-header">📝 SQL Code Preview</div>
    <pre><code class="language-sql">${escapeHtml(codePreview)}</code></pre>
  `;

// 🛡️ CORRECTION : Vérification supplémentaire avant d'accéder à currentTarget.
  if (!event.currentTarget) {
    console.warn('currentTarget is null, cannot display script preview.');
    return;
  } 
  
  const rect = event.currentTarget.getBoundingClientRect();
  tooltipElement.style.left = `${rect.left}px`;
  tooltipElement.style.top = `${rect.bottom + 10}px`;

  setTimeout(() => {
    const tooltipRect = tooltipElement.getBoundingClientRect();
    if (tooltipRect.right > window.innerWidth) {
      tooltipElement.style.left = `${window.innerWidth - tooltipRect.width - 20}px`;
    }
  }, 0);

  tooltipElement.classList.add('show');

  setTimeout(() => {
    tooltipElement.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }, 50);
}

function hideScriptPreview() {
  if (tooltipElement) {
    tooltipElement.classList.remove('show');
    currentTooltipScript = null;
  }
}