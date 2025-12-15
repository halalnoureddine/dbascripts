// ==========================================
// 📄 js/auth.js - Authentification
// ==========================================

// Vérifier le rôle de l'utilisateur
async function checkAdminRole(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error("Erreur de récupération du rôle:", error);
    userRole = 'user';
  } else {
    userRole = data.role;
  }
}

// Écouter les changements d'authentification
function setupAuthListener() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      user = session.user;
      await checkAdminRole(user.id);
    } else {
      user = null;
      userRole = null;
    }
    
    renderAuthButtons();
    
    if (event === 'SIGNED_OUT') {
      sessionStorage.removeItem('currentView');
      showHome();
    }
    
    if (!user && document.getElementById('adminTabContent')) {
      showHome();
    }
  });
}

// Gérer la connexion
async function handleLogin(e) {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;
  
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    showToast("❌ Échec de la connexion: " + error.message, "error");
  } else {
    showToast("✅ Connexion réussie!", "success");
    
    setTimeout(async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await checkAdminRole(currentUser.id);
      }
      
      if (userRole === 'admin') {
        showAdmin();
      } else {
        showHome();
      }
    }, 500);
  }
}

// Gérer la déconnexion
async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    showToast("❌ Échec de la déconnexion", "error");
  } else {
    showToast("🚪 Déconnexion réussie!", "success");
    showHome();
  }
}

// Afficher le formulaire de connexion
function showLogin() {
  document.getElementById("content").innerHTML = `
    <section class="max-w-md mx-auto py-12 px-4 animate-fade-in">
      <div class="bg-white rounded-xl shadow-xl p-8">
        <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">🔐 Connexion Admin</h2>
        <form id="authForm" onsubmit="handleLogin(event)" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input name="email" type="email" required 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="user@example.com" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
            <input name="password" type="password" required 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="********" />
          </div>
          <button type="submit" class="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold">
            Se connecter
          </button>
        </form>
        <p class="text-center text-xs text-gray-500 mt-4">Pas de compte ? Inscrivez-vous via l'interface Supabase.</p>
      </div>
    </section>
  `;
}

// Mettre à jour les boutons d'authentification
function renderAuthButtons() {
  const container = document.getElementById('authButtonContainer');
  const mobileContainer = document.getElementById('mobileAuthButtonContainer');
  
  if (user && userRole === 'admin') {
    container.innerHTML = `
      <button onclick="showAdmin()" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition font-medium">
        📁 Admin
      </button>
    `;
  } else if (user) {
    container.innerHTML = `
      <button onclick="handleLogout()" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium">
        🚪 Déconnexion
      </button>
    `;
  } else {
    container.innerHTML = `
      <button onclick="showLogin()" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium">
        🔑 Connexion
      </button>
    `;
  }

  // Bouton mobile (même logique)
  if (user && userRole === 'admin') {
    mobileContainer.innerHTML = `
      <button onclick="showAdmin(); toggleMobileMenu()" class="block w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-gray-800 rounded-lg">
        📁 Admin
      </button>
    `;
  } else if (user) {
    mobileContainer.innerHTML = `
      <button onclick="handleLogout(); toggleMobileMenu()" class="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
        🚪 Déconnexion
      </button>
    `;
  } else {
    mobileContainer.innerHTML = `
      <button onclick="showLogin(); toggleMobileMenu()" class="block w-full text-left px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg">
        🔑 Connexion
      </button>
    `;
  }
  
  // IMPORTANT : Mettre à jour le menu desktop et mobile pour afficher/masquer les fonctionnalités IA
  updateAIFeaturesVisibility();
}

// Nouvelle fonction pour mettre à jour la visibilité des fonctionnalités IA
function updateAIFeaturesVisibility() {
  // Mettre à jour le menu desktop
  const desktopNav = document.querySelector('.desktop-nav');
  if (desktopNav) {
    // Retirer les anciens boutons IA s'ils existent
    const oldAIButtons = desktopNav.querySelectorAll('[data-ai-feature]');
    oldAIButtons.forEach(btn => btn.remove());
    
    // Ajouter les boutons IA si l'utilisateur est connecté
    if (user) {
      const scriptsMenu = desktopNav.querySelector('.group');
      if (scriptsMenu) {
        const aiButtonsHTML = `
          <button onclick="showScriptGenerator()" data-ai-feature class="px-4 py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition font-medium">
            🚀 Générateur
          </button>
          <button onclick="showAIAnalyzer()" data-ai-feature class="px-4 py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition font-medium">
            🤖 Erreurs
          </button>
          <button onclick="showPerformanceAnalyzer()" data-ai-feature class="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition font-medium">
            🔥 Performance
          </button>
        `;
        scriptsMenu.insertAdjacentHTML('afterend', aiButtonsHTML);
      }
    }
  }
  
  // Mettre à jour le menu mobile
  const mobileNav = document.getElementById('mobileNav');
  if (mobileNav) {
    // Retirer les anciens boutons IA mobiles
    const oldMobileAI = mobileNav.querySelectorAll('[data-ai-feature-mobile]');
    oldMobileAI.forEach(btn => btn.remove());
    
    // Ajouter les boutons IA si l'utilisateur est connecté
    if (user) {
      const scriptsSection = mobileNav.querySelector('div > div');
      if (scriptsSection) {
        const mobileAIHTML = `
          <button onclick="showScriptGenerator(); toggleMobileMenu()" data-ai-feature-mobile class="block w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg">
            🚀 Générateur
          </button>
          <button onclick="showAIAnalyzer(); toggleMobileMenu()" data-ai-feature-mobile class="block w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg">
            🤖 Erreurs
          </button>
          <button onclick="showPerformanceAnalyzer(); toggleMobileMenu()" data-ai-feature-mobile class="block w-full text-left px-4 py-2 text-gray-700 hover:bg-orange-50 rounded-lg">
            🔥 Performance
          </button>
        `;
        // Insérer avant le bouton Favoris
        const favButton = Array.from(scriptsSection.children).find(el => el.textContent.includes('Favoris'));
        if (favButton) {
          favButton.insertAdjacentHTML('beforebegin', mobileAIHTML);
        }
      }
    }
  }
}