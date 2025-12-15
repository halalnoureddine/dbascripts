// ==========================================
// 📄 js/favorites.js - Gestion des favoris
// ==========================================

// Charger les favoris depuis localStorage
function loadUserData() {
  favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
}

// Basculer un favori
function toggleFavorite(scriptId) {
  const index = favorites.indexOf(scriptId);
  if (index > -1) {
    favorites.splice(index, 1);
    showToast('❌ Removed from favorites', 'success');
  } else {
    favorites.push(scriptId);
    showToast('⭐ Added to favorites', 'success');
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  
  const icon = document.querySelector(`[data-favorite-id="${scriptId}"]`);
  if (icon) {
    icon.classList.toggle('active');
    icon.textContent = favorites.includes(scriptId) ? '⭐' : '☆';
  }
}

// Vérifier si un script est en favori
function isFavorite(scriptId) {
  return favorites.includes(scriptId);
}

// Afficher les favoris
async function showFavorites() {
  if (favorites.length === 0) {
    document.getElementById("content").innerHTML = `
      <section class="max-w-5xl mx-auto py-12 px-4 text-center animate-fade-in">
        <div class="bg-white p-12 rounded-xl shadow-lg">
          <div class="text-6xl mb-4">⭐</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-4">No favorites</h2>
          <p class="text-gray-600 mb-6">Add scripts to your favorites to find them easily here</p>
          <button onclick="showHome()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
            ← Back to home
          </button>
        </div>
      </section>
    `;
    return;
  }

  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .in('id', favorites);

  if (error) {
    showToast("Loading error", "error");
    return;
  }

  document.getElementById("content").innerHTML = `
    <section class="max-w-5xl mx-auto py-12 px-4 animate-fade-in">
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-gray-800 mb-2">⭐ My Favorites</h2>
        <p class="text-gray-600">${data.length} favorite script(s)</p>
      </div>
      <div class="space-y-4">
        ${data.map(script => renderScriptCard(script)).join('')}
      </div>
    </section>
  `;
}