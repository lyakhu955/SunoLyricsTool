// ============================================
// SUNO LYRICS AI GENERATOR - MAIN APP
// PWA with offline support, installable
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const app = new SunoLyricsApp();
  app.init();
});

class SunoLyricsApp {
  constructor() {
    this.engine = new LyricsEngine();
    this.gemini = new GeminiService();
    this.savedItems = JSON.parse(localStorage.getItem('sunoLyrics_saved') || '[]');
    this.deferredPrompt = null;
    this.selectedChips = {
      genreChips: [],
      subgenreChips: [],
      vocalChips: [],
      instrumentChips: [],
      moodChips: [],
      productionChips: []
    };
    this.metaTagContent = '';
    this.useFallback = localStorage.getItem('sunoLyrics_useFallback') !== 'false';
  }

  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupTabs();
    this.setupGenerator();
    this.setupStyleBuilder();
    this.setupMetaTags();
    this.setupCopyButtons();
    this.setupSettings();
    this.loadSaved();
    this.updateAIStatus();
  }

  // ===== SERVICE WORKER =====
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.log('SW registration failed:', err));
    }
  }

  // ===== INSTALL PROMPT (PWA) =====
  setupInstallPrompt() {
    const banner = document.getElementById('installBanner');
    const installBtn = document.getElementById('installBtn');
    const dismissBtn = document.getElementById('dismissInstall');

    // Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;

      // Show install banner if not dismissed before
      if (!localStorage.getItem('sunoLyrics_installDismissed')) {
        banner.classList.remove('hidden');
      }
    });

    installBtn?.addEventListener('click', async () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          this.showToast('App installata! 🎉', 'success');
        }
        this.deferredPrompt = null;
        banner.classList.add('hidden');
      }
    });

    dismissBtn?.addEventListener('click', () => {
      banner.classList.add('hidden');
      localStorage.setItem('sunoLyrics_installDismissed', 'true');
    });

    // Detect if already installed
    window.addEventListener('appinstalled', () => {
      banner.classList.add('hidden');
      this.showToast('App installata con successo! 🎵', 'success');
    });

    // iOS install hint
    if (this.isIOS() && !this.isStandalone()) {
      setTimeout(() => {
        if (!localStorage.getItem('sunoLyrics_iosHint')) {
          this.showToast('📲 Per installare: tocca Condividi → Aggiungi a Home', 'info', 5000);
          localStorage.setItem('sunoLyrics_iosHint', 'true');
        }
      }, 3000);
    }
  }

  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  }

  // ===== TABS (BOTTOM NAV) =====
  setupTabs() {
    const navItems = document.querySelectorAll('.bottom-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        // Remove active from all nav items and tab contents
        navItems.forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // Activate clicked item
        item.classList.add('active');
        const tabId = item.dataset.tab;
        document.getElementById(`tab-${tabId}`).classList.add('active');

        // Scroll to top on tab switch
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  // ===== GENERATOR =====
  setupGenerator() {
    const generateBtn = document.getElementById('generateBtn');
    const regenerateBtn = document.getElementById('regenerateBtn');
    const saveBtn = document.getElementById('saveBtn');
    const shareBtn = document.getElementById('shareBtn');

    generateBtn?.addEventListener('click', () => this.handleGenerate());
    regenerateBtn?.addEventListener('click', () => this.handleGenerate());
    saveBtn?.addEventListener('click', () => this.handleSave());
    shareBtn?.addEventListener('click', () => this.handleShare());

    const openSunoBtn = document.getElementById('openSunoBtn');
    openSunoBtn?.addEventListener('click', () => this.handleOpenSuno());
  }

  async handleGenerate() {
    const btn = document.getElementById('generateBtn');
    btn.classList.add('loading');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Generazione AI in corso...';

    const options = {
      theme: document.getElementById('songTheme').value || 'vita e sentimenti',
      genre: document.getElementById('genre').value || 'pop',
      mood: document.getElementById('mood').value || 'happy',
      language: document.getElementById('language').value || 'italian',
      vocalType: document.getElementById('vocalType').value || 'male',
      structure: document.getElementById('structure').value || 'standard',
      era: document.getElementById('era').value || 'modern',
      extraDetails: document.getElementById('extraDetails').value || '',
      includeMetaTags: document.getElementById('includeMetaTags').checked,
      includeStylePrompt: document.getElementById('includeStylePrompt').checked,
      optimizeForSuno: document.getElementById('optimizeForSuno').checked,
    };

    try {
      let result;

      // Try Gemini AI first
      if (this.gemini.hasApiKey()) {
        try {
          btn.innerHTML = '<span class="btn-icon">🤖</span> Gemini AI sta scrivendo...';
          const aiResult = await this.gemini.generateLyrics(options);
          
          // Build tips from knowledge base
          const genreConfig = SunoKnowledge.genreConfig[options.genre] || SunoKnowledge.genreConfig.pop;
          const tips = this.engine.generateTips(options.genre, genreConfig, options.mood, options.structure);

          result = {
            stylePrompt: aiResult.stylePrompt,
            lyrics: aiResult.lyrics,
            tips: tips,
            source: 'gemini'
          };
          const usedModel = this.gemini._lastModelUsed || this.gemini.getModel();
          const modelLabel = usedModel.includes('pro') ? 'Pro' : 'Flash';
          this.showToast(`🤖 Generato con Gemini ${modelLabel}!`, 'success');
        } catch (aiErr) {
          console.warn('Gemini AI error:', aiErr.message);
          if (this.useFallback) {
            this.showToast(`⚠️ AI non disponibile: ${aiErr.message}. Uso template...`, 'warning', 4000);
            result = this.engine.generate(options);
            result.source = 'template';
          } else {
            throw aiErr;
          }
        }
      } else {
        // No API key - use template engine
        result = this.engine.generate(options);
        result.source = 'template';
        this.showToast('✨ Testo generato (template). Configura Gemini AI per risultati migliori!', 'info', 4000);
      }

      this.displayResults(result, options);

    } catch (err) {
      console.error('Generation error:', err);
      this.showToast(`❌ ${err.message || 'Errore nella generazione'}`, 'error', 5000);
    }

    btn.classList.remove('loading');
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">✨</span> Genera Testo per Suno';
  }

  displayResults(result, options) {
    const resultsEl = document.getElementById('results');
    resultsEl.classList.remove('hidden');

    // Style Prompt
    const styleEl = document.getElementById('stylePromptOutput');
    styleEl.textContent = result.stylePrompt;

    // Lyrics with syntax highlighting
    const lyricsEl = document.getElementById('lyricsOutput');
    lyricsEl.innerHTML = this.highlightLyrics(result.lyrics);

    // Source badge
    const sourceBadge = result.source === 'gemini'
      ? '<span class="source-badge gemini">🤖 Gemini AI</span>'
      : '<span class="source-badge template">📝 Template</span>';
    lyricsEl.insertAdjacentHTML('afterbegin', sourceBadge + '<br><br>');

    // Tips
    const tipsEl = document.getElementById('tipsOutput');
    tipsEl.innerHTML = '<ul>' + result.tips.map(t => `<li>${t}</li>`).join('') + '</ul>';

    // Store current result for saving
    this.currentResult = { ...result, options };

    // Scroll to results
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  highlightLyrics(text) {
    return text
      .replace(/(\[.*?\])/g, '<span class="meta-tag">$1</span>')
      .replace(/\n/g, '<br>');
  }

  // ===== SAVE =====
  handleSave() {
    if (!this.currentResult) return;

    const item = {
      id: Date.now(),
      date: new Date().toLocaleDateString('it-IT'),
      theme: this.currentResult.options.theme,
      genre: this.currentResult.options.genre,
      mood: this.currentResult.options.mood,
      stylePrompt: this.currentResult.stylePrompt,
      lyrics: this.currentResult.lyrics,
      tips: this.currentResult.tips
    };

    this.savedItems.unshift(item);
    localStorage.setItem('sunoLyrics_saved', JSON.stringify(this.savedItems));
    this.loadSaved();
    this.showToast('💾 Testo salvato!', 'success');
  }

  // ===== SHARE =====
  async handleShare() {
    if (!this.currentResult) return;

    const text = `🎵 Suno Lyrics AI Generator\n\n📋 STYLE PROMPT:\n${this.currentResult.stylePrompt}\n\n🎤 LYRICS:\n${this.currentResult.lyrics}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Suno Lyrics',
          text: text,
        });
      } catch (err) {
        // User cancelled or error
        this.copyToClipboard(text);
      }
    } else {
      this.copyToClipboard(text);
      this.showToast('📋 Testo copiato negli appunti!', 'success');
    }
  }

  // ===== OPEN SUNO =====
  handleOpenSuno() {
    if (!this.currentResult) return;

    // Copy both style prompt and lyrics to clipboard
    const text = `STYLE PROMPT:\n${this.currentResult.stylePrompt}\n\nLYRICS:\n${this.currentResult.lyrics}`;
    this.copyToClipboard(text);
    this.showToast('📋 Copiato! Si apre Suno...', 'success', 3000);

    // Try Android intent to open Suno app directly
    // Suno app package: com.suno.android
    const sunoAppUrl = 'intent://create#Intent;package=com.suno.android;scheme=https;S.browser_fallback_url=https%3A%2F%2Fsuno.com%2Fcreate;end';
    const sunoWebUrl = 'https://suno.com/create';

    // Detect if on Android
    const isAndroid = /android/i.test(navigator.userAgent);

    if (isAndroid) {
      // Try to open the Suno app via intent
      window.location.href = sunoAppUrl;
    } else {
      // On iOS/desktop, open web version
      window.open(sunoWebUrl, '_blank');
    }
  }

  // ===== STYLE BUILDER =====
  setupStyleBuilder() {
    const chipGroups = ['genreChips', 'subgenreChips', 'vocalChips', 'instrumentChips', 'moodChips', 'productionChips'];

    chipGroups.forEach(groupId => {
      const group = document.getElementById(groupId);
      if (!group) return;

      group.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;

        chip.classList.toggle('selected');
        this.updateBuilderOutput();
      });
    });
  }

  updateBuilderOutput() {
    const output = document.getElementById('builderOutput');
    const allSelected = document.querySelectorAll('.chip.selected');
    const values = Array.from(allSelected).map(c => c.dataset.value);

    if (values.length === 0) {
      output.textContent = 'Seleziona gli elementi sopra per costruire il tuo prompt...';
    } else {
      output.textContent = values.join(', ');
    }
  }

  // ===== META TAGS =====
  setupMetaTags() {
    const tagItems = document.querySelectorAll('.tag-item');
    const clipboard = document.getElementById('metaTagClipboard');
    const clearBtn = document.getElementById('clearMetaTags');

    tagItems.forEach(item => {
      item.addEventListener('click', () => {
        const tag = item.dataset.tag;
        if (clipboard.textContent === 'Clicca sui tag sopra per aggiungerli qui...') {
          clipboard.textContent = '';
        }
        clipboard.textContent += (clipboard.textContent ? '\n' : '') + tag;
        this.showToast(`${tag} aggiunto!`, 'success');
        item.style.transform = 'scale(0.9)';
        setTimeout(() => item.style.transform = '', 200);
      });
    });

    clearBtn?.addEventListener('click', () => {
      clipboard.textContent = 'Clicca sui tag sopra per aggiungerli qui...';
    });
  }

  // ===== COPY BUTTONS =====
  setupCopyButtons() {
    document.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const target = document.getElementById(targetId);
        if (!target) return;

        const text = target.innerText || target.textContent;
        this.copyToClipboard(text);

        btn.textContent = '✅ Copiato!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '📋 Copia';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
  }

  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  // ===== LOAD SAVED =====
  loadSaved() {
    const list = document.getElementById('savedList');
    if (!list) return;

    if (this.savedItems.length === 0) {
      list.innerHTML = '<p class="empty-state">Nessun testo salvato ancora. Genera un testo e salvalo! 🎵</p>';
      return;
    }

    list.innerHTML = this.savedItems.map(item => `
      <div class="saved-item" data-id="${item.id}">
        <div class="saved-item-header">
          <span class="saved-item-title">${this.escapeHtml(item.theme || 'Senza titolo')}</span>
          <span class="saved-item-genre">${item.genre || 'N/A'}</span>
        </div>
        <div class="saved-item-meta">${item.date} • ${item.mood || ''}</div>
        <div class="saved-item-actions">
          <button class="btn-secondary btn-small btn-load-saved" data-id="${item.id}">📂 Carica</button>
          <button class="btn-secondary btn-small btn-copy-saved" data-id="${item.id}">📋 Copia</button>
          <button class="btn-secondary btn-small btn-delete-saved" data-id="${item.id}">🗑️ Elimina</button>
        </div>
      </div>
    `).join('');

    // Event listeners for saved items
    list.querySelectorAll('.btn-load-saved').forEach(btn => {
      btn.addEventListener('click', () => this.loadSavedItem(parseInt(btn.dataset.id)));
    });

    list.querySelectorAll('.btn-copy-saved').forEach(btn => {
      btn.addEventListener('click', () => this.copySavedItem(parseInt(btn.dataset.id)));
    });

    list.querySelectorAll('.btn-delete-saved').forEach(btn => {
      btn.addEventListener('click', () => this.deleteSavedItem(parseInt(btn.dataset.id)));
    });
  }

  loadSavedItem(id) {
    const item = this.savedItems.find(i => i.id === id);
    if (!item) return;

    // Switch to generator tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="generator"]').classList.add('active');
    document.getElementById('tab-generator').classList.add('active');

    // Display results
    const resultsEl = document.getElementById('results');
    resultsEl.classList.remove('hidden');
    document.getElementById('stylePromptOutput').textContent = item.stylePrompt;
    document.getElementById('lyricsOutput').innerHTML = this.highlightLyrics(item.lyrics);
    document.getElementById('tipsOutput').innerHTML = '<ul>' + (item.tips || []).map(t => `<li>${t}</li>`).join('') + '</ul>';

    this.currentResult = {
      stylePrompt: item.stylePrompt,
      lyrics: item.lyrics,
      tips: item.tips || [],
      options: { theme: item.theme, genre: item.genre, mood: item.mood }
    };

    this.showToast('📂 Testo caricato!', 'success');
  }

  copySavedItem(id) {
    const item = this.savedItems.find(i => i.id === id);
    if (!item) return;

    const text = `STYLE PROMPT:\n${item.stylePrompt}\n\nLYRICS:\n${item.lyrics}`;
    this.copyToClipboard(text);
    this.showToast('📋 Copiato negli appunti!', 'success');
  }

  deleteSavedItem(id) {
    this.savedItems = this.savedItems.filter(i => i.id !== id);
    localStorage.setItem('sunoLyrics_saved', JSON.stringify(this.savedItems));
    this.loadSaved();
    this.showToast('🗑️ Eliminato!', 'success');
  }

  // ===== SETTINGS MODAL =====
  setupSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const modal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('closeSettings');
    const saveBtn = document.getElementById('saveApiKey');
    const testBtn = document.getElementById('testApiKey');
    const toggleBtn = document.getElementById('toggleKeyVisibility');
    const fallbackCheckbox = document.getElementById('useAiFallback');
    const apiKeyInput = document.getElementById('geminiApiKey');
    const modelSelect = document.getElementById('geminiModel');

    // Load saved settings
    if (this.gemini.hasApiKey()) {
      apiKeyInput.value = this.gemini.getApiKey();
    }
    if (modelSelect) {
      modelSelect.value = this.gemini.getModel();
    }
    fallbackCheckbox.checked = this.useFallback;

    // Open / Close
    settingsBtn?.addEventListener('click', () => {
      modal.classList.remove('hidden');
      this.updatePremiumUI();
    });
    closeBtn?.addEventListener('click', () => modal.classList.add('hidden'));
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });

    // ===== PREMIUM SYSTEM =====
    const premiumUnlockBtn = document.getElementById('premiumUnlockBtn');
    const premiumCodeSection = document.getElementById('premiumCodeSection');
    const premiumCodeInput = document.getElementById('premiumCode');
    const activatePremiumBtn = document.getElementById('activatePremium');

    premiumUnlockBtn?.addEventListener('click', () => {
      if (this.gemini.getIsPremium()) {
        // Already premium — deactivate
        this.gemini.deactivatePremium();
        this.updatePremiumUI();
        this.updateAIStatus();
        this.showToast('Premium disattivato', 'info');
        return;
      }
      // Show code input OR open WhatsApp
      if (premiumCodeSection.classList.contains('hidden')) {
        premiumCodeSection.classList.remove('hidden');
        // Open WhatsApp with pre-filled message
        const config = this.gemini.getAdminConfig();
        const phone = config.whatsapp || '393885765498';
        const message = encodeURIComponent(
          '👑 Ciao! Vorrei attivare AI Premium su Suno Lyrics AI Generator.\n\nVorrei ricevere il codice di attivazione. Come posso pagare?'
        );
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      }
    });

    activatePremiumBtn?.addEventListener('click', () => {
      const code = premiumCodeInput?.value?.trim();
      if (!code) {
        this.showToast('❌ Inserisci il codice di attivazione', 'error');
        return;
      }

      const result = this.gemini.activatePremium(code);
      if (result.success) {
        this.showToast('👑 Premium attivato! Ora puoi generare con AI!', 'success', 5000);
        this.updatePremiumUI();
        this.updateAIStatus();
      } else if (result.reason === 'used') {
        this.showToast('❌ Questo codice è già stato utilizzato.', 'error', 4000);
      } else {
        this.showToast('❌ Codice non valido. Contatta via WhatsApp.', 'error', 4000);
      }
    });

    this.updatePremiumUI();

    // Toggle visibility
    toggleBtn?.addEventListener('click', () => {
      apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
    });

    // Save API key + model
    saveBtn?.addEventListener('click', () => {
      const key = apiKeyInput.value.trim();
      this.gemini.setApiKey(key);
      if (modelSelect) {
        this.gemini.setModel(modelSelect.value);
      }
      this.updateAIStatus();
      this.updateSettingsStatus();
      if (key) {
        const modelName = modelSelect?.value?.includes('pro') ? 'Pro' : 'Flash';
        this.showToast(`🔑 Salvato! Modello: Gemini ${modelName}`, 'success');
      } else {
        this.showToast('🔑 API Key rimossa. Modalità template attiva.', 'info');
      }
    });

    // Test API key
    testBtn?.addEventListener('click', async () => {
      const key = apiKeyInput.value.trim();
      if (!key) {
        this.showToast('❌ Inserisci una API key prima', 'error');
        return;
      }

      if (!key.startsWith('AIza')) {
        this.showToast('❌ Formato API key non valido. Deve iniziare con "AIza..."', 'error');
        return;
      }

      testBtn.disabled = true;
      testBtn.textContent = '⏳ Test in corso...';

      // Temporarily set key for test
      this.gemini.setApiKey(key);

      try {
        // Simple test: list models to verify key
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const testResp = await fetch(testUrl);
        
        if (!testResp.ok) {
          if (testResp.status === 400 || testResp.status === 403) {
            throw new Error('API key non valida');
          }
          if (testResp.status === 429) {
            throw new Error('Limite richieste raggiunto, ma la key sembra valida. Aspetta 1 minuto.');
          }
          throw new Error(`Errore HTTP ${testResp.status}`);
        }

        const data = await testResp.json();
        const modelCount = data?.models?.length || 0;
        this.showToast(`✅ Connessione OK! ${modelCount} modelli disponibili.`, 'success', 4000);
        this.updateAIStatus();
        this.updateSettingsStatus();

      } catch (err) {
        const msg = err.message;
        if (msg.includes('valida')) {
          this.showToast(`❌ ${msg}`, 'error', 5000);
          this.updateSettingsStatus(false);
        } else if (msg.includes('Limite') || msg.includes('429')) {
          // Key is probably valid, just rate limited
          this.showToast(`⚠️ ${msg}`, 'warning', 5000);
          this.updateAIStatus();
          this.updateSettingsStatus();
        } else {
          this.showToast(`❌ Test fallito: ${msg}`, 'error', 5000);
          this.updateSettingsStatus(false);
        }
      }

      testBtn.disabled = false;
      testBtn.textContent = '🧪 Testa Connessione';
    });

    // Fallback toggle
    fallbackCheckbox?.addEventListener('change', () => {
      this.useFallback = fallbackCheckbox.checked;
      localStorage.setItem('sunoLyrics_useFallback', this.useFallback);
    });

    // ===== ADMIN ACCESS =====
    const adminAccessBtn = document.getElementById('adminAccessBtn');
    const adminLoginModal = document.getElementById('adminLoginModal');
    const closeAdminLogin = document.getElementById('closeAdminLogin');
    const adminPasswordInput = document.getElementById('adminPassword');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminPanelModal = document.getElementById('adminPanelModal');
    const closeAdminPanel = document.getElementById('closeAdminPanel');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');

    adminAccessBtn?.addEventListener('click', () => {
      adminLoginModal.classList.remove('hidden');
    });
    closeAdminLogin?.addEventListener('click', () => {
      adminLoginModal.classList.add('hidden');
      adminPasswordInput.value = '';
    });
    adminLoginModal?.addEventListener('click', (e) => {
      if (e.target === adminLoginModal) { adminLoginModal.classList.add('hidden'); adminPasswordInput.value = ''; }
    });

    adminLoginBtn?.addEventListener('click', async () => {
      const pwd = adminPasswordInput.value;
      if (!pwd) { this.showToast('❌ Inserisci la password', 'error'); return; }

      const isValid = await GeminiService.verifyAdmin(pwd);
      if (isValid) {
        adminLoginModal.classList.add('hidden');
        adminPasswordInput.value = '';
        this.openAdminPanel();
      } else {
        this.showToast('❌ Password errata', 'error');
      }
    });

    // Enter key for admin login
    adminPasswordInput?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') adminLoginBtn.click();
    });

    closeAdminPanel?.addEventListener('click', () => adminPanelModal.classList.add('hidden'));
    adminPanelModal?.addEventListener('click', (e) => {
      if (e.target === adminPanelModal) adminPanelModal.classList.add('hidden');
    });
    adminLogoutBtn?.addEventListener('click', () => {
      adminPanelModal.classList.add('hidden');
      this.showToast('🚪 Admin disconnesso', 'info');
    });

    // Generate codes button
    document.getElementById('generateCodesBtn')?.addEventListener('click', () => this.adminGenerateCodes());

    // Save admin button
    document.getElementById('adminSaveBtn')?.addEventListener('click', () => this.adminSave());
  }

  // ===== ADMIN PANEL =====
  openAdminPanel() {
    const modal = document.getElementById('adminPanelModal');
    const config = this.gemini.getAdminConfig();

    // Populate fields
    document.getElementById('adminWhatsapp').value = config.whatsapp || '';
    document.getElementById('adminPrice').value = config.price || '4.99';
    document.getElementById('adminPricePeriod').value = config.pricePeriod || '/ mese';

    // Render code lists
    this.renderAdminCodes(config);

    modal.classList.remove('hidden');
    this.showToast('🛡️ Accesso admin concesso', 'success');
  }

  renderAdminCodes(config) {
    const activeList = document.getElementById('activeCodesList');
    const usedList = document.getElementById('usedCodesList');
    const activeCount = document.getElementById('activeCodesCount');
    const usedCount = document.getElementById('usedCodesCount');

    activeCount.textContent = config.activeCodes.length;
    usedCount.textContent = config.usedCodes.length;

    if (config.activeCodes.length === 0) {
      activeList.innerHTML = '<p class="admin-empty">Nessun codice attivo. Generane di nuovi!</p>';
    } else {
      activeList.innerHTML = config.activeCodes.map(code =>
        `<div class="admin-code-item">
          <code>${code}</code>
          <button class="btn-admin-delete" data-code="${code}" data-type="active" title="Elimina">🗑️</button>
        </div>`
      ).join('');

      // Delete handlers
      activeList.querySelectorAll('.btn-admin-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const code = btn.dataset.code;
          const cfg = this.gemini.getAdminConfig();
          cfg.activeCodes = cfg.activeCodes.filter(c => c !== code);
          this.gemini.saveAdminConfig(cfg);
          this.renderAdminCodes(cfg);
          this.showToast(`Codice ${code} eliminato`, 'info');
        });
      });
    }

    if (config.usedCodes.length === 0) {
      usedList.innerHTML = '<p class="admin-empty">Nessun codice utilizzato.</p>';
    } else {
      usedList.innerHTML = config.usedCodes.map(code =>
        `<div class="admin-code-item used"><code>${code}</code></div>`
      ).join('');
    }
  }

  adminGenerateCodes() {
    const qty = parseInt(document.getElementById('adminCodeQty').value) || 5;
    const codes = GeminiService.generateCodes(qty);

    // Add to active codes
    const config = this.gemini.getAdminConfig();
    config.activeCodes.push(...codes);
    this.gemini.saveAdminConfig(config);

    // Show generated codes
    const output = document.getElementById('generatedCodesOutput');
    output.classList.remove('hidden');
    output.innerHTML = `<h4>✅ ${codes.length} codici generati:</h4>` +
      codes.map(c => `<div class="admin-code-item new"><code>${c}</code></div>`).join('') +
      `<button class="btn-secondary btn-small" id="copyAllCodes" style="margin-top:8px;width:100%">📋 Copia tutti</button>`;

    document.getElementById('copyAllCodes')?.addEventListener('click', () => {
      this.copyToClipboard(codes.join('\n'));
      this.showToast('📋 Codici copiati!', 'success');
    });

    // Refresh lists
    this.renderAdminCodes(config);
    this.showToast(`⚡ ${codes.length} codici generati!`, 'success');
  }

  adminSave() {
    const config = this.gemini.getAdminConfig();
    config.whatsapp = document.getElementById('adminWhatsapp').value.trim();
    config.price = document.getElementById('adminPrice').value.trim();
    config.pricePeriod = document.getElementById('adminPricePeriod').value;
    this.gemini.saveAdminConfig(config);

    // Update visible price in premium section
    const priceTag = document.querySelector('.price-tag');
    const pricePeriod = document.querySelector('.price-period');
    if (priceTag) priceTag.textContent = `€${config.price}`;
    if (pricePeriod) pricePeriod.textContent = config.pricePeriod;

    this.showToast('💾 Impostazioni admin salvate!', 'success');
  }

  updateAIStatus() {
    const statusBar = document.getElementById('aiStatusBar');
    if (!statusBar) return;

    const dot = statusBar.querySelector('.status-dot');
    const text = statusBar.querySelector('.ai-status-text');

    if (this.gemini.hasApiKey()) {
      dot.className = 'status-dot online';
      const modelLabel = this.gemini.getModel().includes('pro') ? 'Pro' : 'Flash';
      const premiumLabel = this.gemini.getIsPremium() ? ' 👑' : '';
      text.textContent = `🤖 Gemini ${modelLabel}${premiumLabel} Attivo`;
      statusBar.classList.add('active');
    } else {
      dot.className = 'status-dot offline';
      text.textContent = '📝 Modalità Template';
      statusBar.classList.remove('active');
    }
  }

  updatePremiumUI() {
    const premiumBtn = document.getElementById('premiumUnlockBtn');
    const premiumStatus = document.getElementById('premiumStatus');
    const premiumCodeSection = document.getElementById('premiumCodeSection');
    const premiumPrice = document.querySelector('.premium-price');
    const premiumFeatures = document.querySelector('.premium-features');

    // Load dynamic price from admin config
    const config = this.gemini.getAdminConfig();
    const priceTag = document.querySelector('.price-tag');
    const pricePeriod = document.querySelector('.price-period');
    if (priceTag && config.price) priceTag.textContent = `€${config.price}`;
    if (pricePeriod && config.pricePeriod) pricePeriod.textContent = config.pricePeriod;

    if (this.gemini.getIsPremium()) {
      premiumBtn.textContent = '🚫 Disattiva Premium';
      premiumBtn.classList.add('deactivate');
      premiumStatus?.classList.remove('hidden');
      premiumCodeSection?.classList.add('hidden');
      if (premiumPrice) premiumPrice.style.display = 'none';
      if (premiumFeatures) premiumFeatures.style.display = 'none';
    } else {
      premiumBtn.textContent = '👑 Sblocca AI Premium';
      premiumBtn.classList.remove('deactivate');
      premiumStatus?.classList.add('hidden');
      if (premiumPrice) premiumPrice.style.display = '';
      if (premiumFeatures) premiumFeatures.style.display = '';
    }
  }

  updateSettingsStatus(connected) {
    const statusEl = document.getElementById('apiKeyStatus');
    if (!statusEl) return;

    const dot = statusEl.querySelector('.status-dot');
    const text = statusEl.querySelector('.status-text');

    if (connected === false) {
      dot.className = 'status-dot error';
      text.textContent = 'Connessione fallita - controlla la chiave';
    } else if (this.gemini.hasApiKey()) {
      dot.className = 'status-dot online';
      text.textContent = 'API key configurata';
    } else {
      dot.className = 'status-dot offline';
      text.textContent = 'API key non configurata';
    }
  }

  // ===== TOAST NOTIFICATIONS =====
  showToast(message, type = '', duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');

    setTimeout(() => {
      toast.classList.add('hidden');
    }, duration);
  }

  // ===== UTILITY =====
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
