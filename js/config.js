// ==========================================
// 📄 js/config.js - Configuration
// ==========================================

// Configuration Supabase
const supabase = window.supabase.createClient(
  "https://josncyjmqsikoitvbehe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvc25jeWptcXNpa29pdHZiZWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTY4NzAsImV4cCI6MjA3ODA5Mjg3MH0.bLz6ZVEWfRW5t1paXntlBSrTGcUAPscbI8tytMyimng"
);

let userScriptFilter = 'all';

// Catégories disponibles
const categories = [
  "DATABASE INFO",
  "BACKUP & RESTORE",
  "PERFORMANCE",
  "MONITORING",
  "FLASHBACK",
  "REPLICATION",
  "AUDITING & SECURITY",
  "DATAPUMP",
  "STATISTICS",
  "SCHEDULER & JOBS",
  "HR ACCESS",
  "MAINTENANCE",
  "DATA MANIPULATION"
];

// Icônes des catégories
const categoryIcons = {
  "DATABASE INFO": "ℹ️",
  "BACKUP & RESTORE": "💿",
  "PERFORMANCE": "⚡",
  "MONITORING": "📊",
  "FLASHBACK": "⏪",
  "REPLICATION": "🛡️",
  "AUDITING & SECURITY": "🔒",
  "DATAPUMP": "🚚",
  "STATISTICS": "📈",
  "SCHEDULER & JOBS": "⏳",
  "HR ACCESS": "🧑‍💻"
};

// Variables globales
let currentPage = 1;
let itemsPerPage = 20;
let currentSort = 'recent';
let allScripts = [];
let filteredScripts = [];
let favorites = [];
let user = null;
let userRole = null;


function filterScriptsByUserPreference(scripts) {
    if (!scripts || scripts.length === 0) return [];
    
    const currentUserId = user ? user.id : null;
    const currentUserEmail = user ? user.email : null;
    
    // Charger la préférence de filtre
    const filter = localStorage.getItem('userScriptFilter') || 'all';
    userScriptFilter = filter;
    
    let filtered = [];
    
    if (userRole === 'admin') {
        // Les admins voient tout
        filtered = scripts;
    } else if (user && filter === 'mine') {
        // Contributeur : afficher uniquement ses propres scripts (tous statuts)
        filtered = scripts.filter(script => 
            script.added_by === currentUserEmail || 
            script.added_by === currentUserId
        );
    } else if (user && filter === 'all') {
        // Contributeur : afficher tous les scripts publics + ses propres scripts
        filtered = scripts.filter(script => 
            script.visibility === 'public' ||
            script.added_by === currentUserEmail ||
            script.added_by === currentUserId
        );
    } else {
        // Utilisateur non connecté : uniquement les scripts publics
        filtered = scripts.filter(script => script.visibility === 'public');
    }
    
    return filtered;
}