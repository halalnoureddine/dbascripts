// ==========================================
// 📄 js/main.js - Point d'entrée
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
  loadUserData();
  loadDarkMode();
  setupAuthListener();
  
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  if (currentUser) {
    user = currentUser;
    await checkAdminRole(user.id);
  }
  
  renderAuthButtons();
  showHome();
});

// Fonction pour récupérer le logo de la base de données
function getDbIcon(dbName) {
    const icons = {
        'Oracle': `<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/oracle/oracle-original.svg" alt="Oracle" class="w-6 h-6 inline-block mr-1 align-middle" />`,
        'SQL Server': `<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/microsoftsqlserver/microsoftsqlserver-plain.svg" alt="SQL Server" class="w-6 h-6 inline-block mr-1 align-middle" />`
    };
    return icons[dbName] || '💾';
}