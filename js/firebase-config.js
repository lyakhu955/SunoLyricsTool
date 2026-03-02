// ============================================
// FIREBASE CONFIGURATION & SYNC SERVICE
// Syncs admin config across all devices
// using Firebase Realtime Database
// ============================================

class FirebaseSync {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.configRef = null;
    this.listeners = [];
    this._init();
  }

  _init() {
    try {
      const firebaseConfig = {
        apiKey: "AIzaSyBW2wRWVm1BwcEByeOd3FiZ84giWhSdcvo",
        authDomain: "suno-lyrics-tool.firebaseapp.com",
        databaseURL: "https://suno-lyrics-tool-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "suno-lyrics-tool",
        storageBucket: "suno-lyrics-tool.firebasestorage.app",
        messagingSenderId: "578131621714",
        appId: "1:578131621714:web:9229ba825887dfbfda6c8b"
      };

      // Initialize Firebase (using compat SDK loaded from CDN)
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      this.db = firebase.database();
      this.configRef = this.db.ref('adminConfig');
      this.initialized = true;
      console.log('✅ Firebase connected');
    } catch (err) {
      console.error('❌ Firebase init error:', err);
      this.initialized = false;
    }
  }

  // ---- DEFAULT CONFIG ----
  static defaultConfig() {
    return {
      whatsapp: '393885765498',
      price: '4.99',
      pricePeriod: '/ mese',
      activeCodes: [],
      usedCodes: []
    };
  }

  // ---- READ CONFIG (once) ----
  async getConfig() {
    if (!this.initialized) {
      console.warn('Firebase not ready, using localStorage fallback');
      return this._getLocalConfig();
    }

    try {
      const snapshot = await this.configRef.once('value');
      const data = snapshot.val();
      if (data) {
        // Ensure arrays exist (Firebase removes empty arrays)
        data.activeCodes = data.activeCodes || [];
        data.usedCodes = data.usedCodes || [];
        // Also update localStorage as cache
        localStorage.setItem('sunoLyrics_adminConfig', JSON.stringify(data));
        return data;
      } else {
        // First time: push default config to Firebase
        const defaultCfg = FirebaseSync.defaultConfig();
        await this.configRef.set(defaultCfg);
        return defaultCfg;
      }
    } catch (err) {
      console.error('Firebase read error, using localStorage:', err);
      return this._getLocalConfig();
    }
  }

  // ---- SAVE CONFIG ----
  async saveConfig(config) {
    // Always save to localStorage as cache/fallback
    localStorage.setItem('sunoLyrics_adminConfig', JSON.stringify(config));

    if (!this.initialized) {
      console.warn('Firebase not ready, saved to localStorage only');
      return false;
    }

    try {
      await this.configRef.set(config);
      console.log('✅ Config saved to Firebase');
      return true;
    } catch (err) {
      console.error('Firebase write error:', err);
      return false;
    }
  }

  // ---- LISTEN FOR REAL-TIME CHANGES ----
  onConfigChange(callback) {
    if (!this.initialized) return;

    this.configRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        data.activeCodes = data.activeCodes || [];
        data.usedCodes = data.usedCodes || [];
        // Update local cache
        localStorage.setItem('sunoLyrics_adminConfig', JSON.stringify(data));
        callback(data);
      }
    });
    this.listeners.push(callback);
  }

  // ---- ACTIVATE CODE (atomic operation, receives hash) ----
  async activateCode(codeHash) {
    if (!this.initialized) {
      return { success: false, reason: 'offline' };
    }

    try {
      // Use transaction for atomic code activation
      const result = await this.configRef.transaction((config) => {
        if (!config) return config;

        config.activeCodes = config.activeCodes || [];
        config.usedCodes = config.usedCodes || [];

        const codeIndex = config.activeCodes.indexOf(codeHash);
        if (codeIndex === -1) {
          return; // Abort: code hash not found
        }

        if (config.usedCodes.includes(codeHash)) {
          return; // Abort: already used
        }

        // Move from active to used
        config.activeCodes.splice(codeIndex, 1);
        config.usedCodes.push(codeHash);
        return config;
      });

      if (result.committed) {
        return { success: true };
      } else {
        // Determine reason for abort
        const config = await this.getConfig();
        if (config.usedCodes.includes(codeHash)) {
          return { success: false, reason: 'used' };
        }
        return { success: false, reason: 'invalid' };
      }
    } catch (err) {
      console.error('Firebase transaction error:', err);
      return { success: false, reason: 'error' };
    }
  }

  // ---- ADD CODES (atomic, receives hashes) ----
  async addCodes(codeHashes) {
    if (!this.initialized) {
      // Fallback to localStorage
      const config = this._getLocalConfig();
      config.activeCodes.push(...codeHashes);
      localStorage.setItem('sunoLyrics_adminConfig', JSON.stringify(config));
      return config;
    }

    try {
      const result = await this.configRef.transaction((config) => {
        if (!config) return config;
        config.activeCodes = config.activeCodes || [];
        config.activeCodes.push(...codeHashes);
        return config;
      });
      return result.snapshot.val();
    } catch (err) {
      console.error('Firebase addCodes error:', err);
      const config = this._getLocalConfig();
      config.activeCodes.push(...codeHashes);
      localStorage.setItem('sunoLyrics_adminConfig', JSON.stringify(config));
      return config;
    }
  }

  // ---- DELETE CODE (atomic) ----
  async deleteCode(code, type) {
    if (!this.initialized) {
      const config = this._getLocalConfig();
      if (type === 'active') {
        config.activeCodes = config.activeCodes.filter(c => c !== code);
      } else {
        config.usedCodes = config.usedCodes.filter(c => c !== code);
      }
      localStorage.setItem('sunoLyrics_adminConfig', JSON.stringify(config));
      return config;
    }

    try {
      const result = await this.configRef.transaction((config) => {
        if (!config) return config;
        config.activeCodes = config.activeCodes || [];
        config.usedCodes = config.usedCodes || [];
        if (type === 'active') {
          config.activeCodes = config.activeCodes.filter(c => c !== code);
        } else {
          config.usedCodes = config.usedCodes.filter(c => c !== code);
        }
        return config;
      });
      return result.snapshot.val();
    } catch (err) {
      console.error('Firebase deleteCode error:', err);
      return this._getLocalConfig();
    }
  }

  // ---- MIGRATE LOCAL DATA TO FIREBASE ----
  async migrateLocalToFirebase() {
    if (!this.initialized) return;

    const localConfig = this._getLocalConfig();
    const snapshot = await this.configRef.once('value');
    const remoteConfig = snapshot.val();

    // Only migrate if Firebase is empty and local has data
    if (!remoteConfig && (localConfig.activeCodes.length > 0 || localConfig.usedCodes.length > 0)) {
      console.log('Migrating local config to Firebase...');
      await this.configRef.set(localConfig);
      console.log('✅ Migration complete');
    }
  }

  // ---- LOCAL FALLBACK ----
  _getLocalConfig() {
    return JSON.parse(localStorage.getItem('sunoLyrics_adminConfig') || JSON.stringify(FirebaseSync.defaultConfig()));
  }
}
