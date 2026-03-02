// ============================================
// GEMINI AI SERVICE
// Integration with Google Gemini API for
// intelligent lyrics generation for Suno
// ============================================

class GeminiService {
  constructor() {
    this.model = 'gemini-2.5-flash';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.PREMIUM_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
    this.isPremium = localStorage.getItem('sunoLyrics_premium') === 'true';
    // Check if premium has expired
    if (this.isPremium) {
      this._checkPremiumExpiry();
    }
    this.apiKey = this.isPremium ? this._getPremiumKey() : '';
    // Firebase sync instance (set from app.js after FirebaseSync is created)
    this.firebase = null;
  }

  setFirebase(firebaseSync) {
    this.firebase = firebaseSync;
  }

  // Obfuscated premium key — not stored in plain text
  _getPremiumKey() {
    const parts = ['QUl6', 'YVN5', 'QmVx', 'RzJ0', 'VEhN', 'ZzZv', 'SE9v', 'WEY3', 'TjB2', 'R3d1', 'RjVf', 'TTdM', 'dTd3'];
    return atob(parts.join(''));
  }

  // --- ADMIN CONFIG (Firebase + localStorage fallback) ---
  getAdminConfig() {
    // Sync version: returns cached localStorage copy (Firebase listener keeps it updated)
    return JSON.parse(localStorage.getItem('sunoLyrics_adminConfig') || JSON.stringify({
      whatsapp: '393885765498',
      price: '4.99',
      pricePeriod: '/ mese',
      activeCodes: [],
      usedCodes: []
    }));
  }

  async getAdminConfigAsync() {
    // Async version: reads directly from Firebase
    if (this.firebase) {
      return await this.firebase.getConfig();
    }
    return this.getAdminConfig();
  }

  async saveAdminConfig(config) {
    // Save to both Firebase and localStorage
    localStorage.setItem('sunoLyrics_adminConfig', JSON.stringify(config));
    if (this.firebase) {
      await this.firebase.saveConfig(config);
    }
  }

  // --- ADMIN PASSWORD (SHA-256 hashed) ---
  // Hash of '1235789'
  static ADMIN_HASH = 'fdd7184a59fd5f2010c3d09b49a9fb5ed2ed2412b8ccc97e1fd553241baba98f';

  static async hashPassword(pwd) {
    const encoded = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async verifyAdmin(pwd) {
    const hash = await GeminiService.hashPassword(pwd);
    return hash === GeminiService.ADMIN_HASH;
  }

  // --- CODE HASHING (SHA-256) ---
  static async hashCode(code) {
    const normalized = code.trim().toUpperCase();
    const encoded = new TextEncoder().encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // --- CODE GENERATION ---
  static generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segments = [];
    for (let s = 0; s < 3; s++) {
      let seg = '';
      for (let i = 0; i < 4; i++) {
        seg += chars[Math.floor(Math.random() * chars.length)];
      }
      segments.push(seg);
    }
    return segments.join('-');
  }

  static generateCodes(qty) {
    const codes = [];
    for (let i = 0; i < qty; i++) {
      codes.push(GeminiService.generateCode());
    }
    return codes;
  }

  // Generate codes and return { plainCodes, hashedCodes } 
  static async generateCodesWithHashes(qty) {
    const plainCodes = GeminiService.generateCodes(qty);
    const hashedCodes = [];
    for (const code of plainCodes) {
      hashedCodes.push(await GeminiService.hashCode(code));
    }
    return { plainCodes, hashedCodes };
  }

  // --- PREMIUM EXPIRY CHECK ---
  _checkPremiumExpiry() {
    const activatedAt = parseInt(localStorage.getItem('sunoLyrics_premiumActivatedAt') || '0');
    if (!activatedAt) {
      // Legacy activation without timestamp — set it now (gives them 30 days from now)
      localStorage.setItem('sunoLyrics_premiumActivatedAt', Date.now().toString());
      return;
    }
    const elapsed = Date.now() - activatedAt;
    if (elapsed >= this.PREMIUM_DURATION_MS) {
      // Expired!
      console.log('⏰ Premium expired, deactivating...');
      this.deactivatePremium();
    }
  }

  getPremiumDaysLeft() {
    if (!this.isPremium) return 0;
    const activatedAt = parseInt(localStorage.getItem('sunoLyrics_premiumActivatedAt') || '0');
    if (!activatedAt) return 30;
    const elapsed = Date.now() - activatedAt;
    const remaining = this.PREMIUM_DURATION_MS - elapsed;
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
  }

  getPremiumExpiryDate() {
    const activatedAt = parseInt(localStorage.getItem('sunoLyrics_premiumActivatedAt') || '0');
    if (!activatedAt) return null;
    return new Date(activatedAt + this.PREMIUM_DURATION_MS);
  }

  // --- PREMIUM ACTIVATION (hashed single-use codes via Firebase) ---
  async activatePremium(code) {
    const normalizedCode = code.trim().toUpperCase();
    const codeHash = await GeminiService.hashCode(normalizedCode);

    // Try Firebase first (atomic transaction with hashes)
    if (this.firebase && this.firebase.initialized) {
      const result = await this.firebase.activateCode(codeHash);
      if (result.success) {
        this.isPremium = true;
        localStorage.setItem('sunoLyrics_premium', 'true');
        localStorage.setItem('sunoLyrics_premiumActivatedAt', Date.now().toString());
        this.apiKey = this._getPremiumKey();
      }
      return result;
    }

    // Fallback to localStorage (also uses hashes)
    const config = this.getAdminConfig();
    const codeIndex = config.activeCodes.indexOf(codeHash);
    if (codeIndex === -1) {
      return { success: false, reason: 'invalid' };
    }
    if (config.usedCodes.includes(codeHash)) {
      return { success: false, reason: 'used' };
    }
    config.activeCodes.splice(codeIndex, 1);
    config.usedCodes.push(codeHash);
    await this.saveAdminConfig(config);

    this.isPremium = true;
    localStorage.setItem('sunoLyrics_premium', 'true');
    localStorage.setItem('sunoLyrics_premiumActivatedAt', Date.now().toString());
    this.apiKey = this._getPremiumKey();
    return { success: true };
  }

  deactivatePremium() {
    this.isPremium = false;
    localStorage.removeItem('sunoLyrics_premium');
    localStorage.removeItem('sunoLyrics_premiumActivatedAt');
    this.apiKey = '';
  }

  getIsPremium() {
    return this.isPremium;
  }

  getModel() {
    return this.model;
  }

  hasApiKey() {
    return this.apiKey && this.apiKey.trim().length > 0;
  }

  // ---- BUILD THE SUNO-OPTIMIZED SYSTEM PROMPT ----
  buildSystemPrompt() {
    return `Sei un esperto paroliere e songwriter specializzato nella creazione di testi musicali ottimizzati per Suno AI. Hai una conoscenza approfondita di tutti i generi musicali, le tecniche di produzione e le best practices della community r/SunoAI.

=== REGOLE FONDAMENTALI SUNO AI ===
1. I lyrics per Suno usano META TAGS tra parentesi quadre [] per controllare la struttura e lo stile vocale
2. I meta tags vanno SEMPRE all'inizio di ogni sezione
3. Si possono COMBINARE più istruzioni con il separatore | (pipe): [Chorus | anthemic chorus | stacked harmonies]
4. Ogni sezione dovrebbe avere MASSIMO 4 righe di testo (Suno funziona meglio così, tende ad andare alla sezione successiva alla riga 5)
5. Non superare 4-5 meta tags per sezione (troppi confondono Suno)
6. Metti i meta tags DENTRO i lyrics, non solo nello Style Prompt, per massimo controllo
7. Non lasciare MAI il campo lyrics vuoto - il prompt style potrebbe essere cantato!
8. Il tag [Instrumental Intro] funziona meglio di [Intro] per aperture strumentali
9. Per terminare la canzone usa: [Outro] + [Coda] + [End] (evita che la canzone continui)
10. Formula tag: Core element → Genere/Era → Tone → Effects

=== META TAGS STRUTTURA ===
[Intro], [Verse], [Verse 1], [Verse 2], [Pre-Chorus], [Chorus], [Bridge], [Outro], [Hook], [Build], [Drop], [Breakdown], [Instrumental], [Instrumental Intro], [Interlude], [Refrain], [Coda], [End]

Strutture per genere:
- STANDARD: [Intro] → [Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Pre-Chorus] → [Chorus] → [Bridge] → [Chorus] → [Outro] → [End]
- SEMPLICE: [Verse 1] → [Chorus] → [Verse 2] → [Chorus] → [Outro] → [End]
- ESTESA: [Instrumental Intro] → [Verse 1] → [Pre-Chorus] → [Chorus] → [Interlude] → [Verse 2] → [Pre-Chorus] → [Chorus] → [Bridge] → [Chorus] → [Outro] → [Coda]
- RAP/HIP-HOP: [Intro] → [Verse 1] → [Hook] → [Verse 2] → [Hook] → [Bridge] → [Verse 3] → [Hook] → [Outro] → [End]
- BALLAD: [Instrumental Intro] → [Verse 1] → [Verse 2] → [Chorus] → [Verse 3] → [Chorus] → [Bridge] → [Chorus] → [Outro] → [End]
- EDM: [Intro] → [Build] → [Drop] → [Breakdown] → [Verse] → [Build] → [Drop] → [Outro] → [End]

=== META TAGS VOCALI ===
[raspy lead vocal], [autotuned delivery], [stacked harmonies], [anthemic chorus], [spoken word verse], [emotional build-up], [crowd-style vocals], [whispered vocals], [powerful belting], [falsetto], [warm baritone], [vocal fry], [ad-lib], [smooth vocals], [aggressive delivery], [scatting], [crooning], [jazz phrasing], [melismatic], [breathy vocals], [intimate vocals], [choir vocals], [call and response], [youthful tone], [light vocal grit]

Voci per tipo:
- Maschile: male vocals, baritone, tenor, deep voice
- Femminile: female vocals, soprano, alto, high vocals
- Duetto: male and female duet, call and response vocals, harmonized duet
- Per duetti nei lyrics: specifica chi canta con [Male voice:] e [Female voice:]

=== META TAGS STRUMENTALI ===
[guitar solo], [808 sub bass], [piano only], [orchestral strings], [pedal steel guitar], [sidechained synth bass], [groovy bass], [drum fill], [brass section], [synth arpeggio], [slap bass], [wah guitar], [clavinet], [vinyl crackle], [drum machine], [arpeggiator], [walking bass], [finger-picked guitar]

=== CONOSCENZA GENERI (usa per generare style prompt e scegliere tags appropriati) ===

POP: catchy hooks, polished production, melodic | Sub: synth-pop, electro-pop, dance-pop, indie pop, power pop | Strumenti: synth, electric guitar, bass, drums | Tip: ritornelli orecchiabili, sezioni da 4 righe

ROCK: heavy riffs, driving beat, dynamic, energetic | Sub: alternative rock, indie rock, classic rock, hard rock, post-rock, arena rock | Strumenti: electric guitar, bass guitar, drums, distortion | Tip: usa "heavy distortion", "power chords", aggiungi [guitar solo] per assoli

HIP-HOP: heavy beats, complex rhymes, rhythmic flow | Sub: boom bap, trap, conscious hip hop, cloud rap, drill, old school | Strumenti: 808 bass, hi-hats, synth, sampler | Tip: usa [Hook] al posto di [Chorus], sezioni brevi e ritmiche

TRAP: 808 sub bass, rolling hi-hats, dark atmosphere | Sub: melodic trap, dark trap, phonk, rage beat, drill | Strumenti: 808 bass, hi-hats, snare rolls, dark synth pads | Tip: "sidechained", "808 sub bass", rolling hi-hats, tag [ad-lib] per le ad-lib

R&B: smooth, soulful, groove, sensual | Sub: neo-soul, contemporary R&B, quiet storm, alternative R&B | Strumenti: electric piano, bass guitar, soft drums, synth pad | Tip: "melismatic turns", "vocal runs", "smooth delivery"

ELECTRONIC: synthesizer, electronic beats, atmospheric | Sub: house, techno, trance, dubstep, future bass, ambient electronic | Strumenti: synthesizer, drum machine, arpeggiator, bass synth | Tip: usa [Build] e [Drop], "sidechained synth bass", "white noise riser"

COUNTRY: twang, heartfelt, storytelling, warm | Sub: outlaw country, country rock, americana, bluegrass, country pop | Strumenti: acoustic guitar, pedal steel guitar, fiddle, banjo, dobro | Tip: "pedal steel guitar", "light snare reverb", "drawl"

METAL: heavy riffs, intense, aggressive, powerful | Sub: death metal, black metal, metalcore, progressive metal, thrash metal, nu metal, power metal | Strumenti: distorted guitar, double bass drums, heavy bass, blast beats | Tip: "heavy distortion", "palm muting", "double bass drums", voci aggressive

PUNK: fast tempo, raw energy, aggressive, rebellious | Sub: pop punk, hardcore punk, post-punk, skate punk, melodic punk | Strumenti: distorted power chords, fast drums, bass guitar | Tip: "distorted power chords", "fast tempo", "raw energy"

JAZZ: improvisation, swing, complex harmonies | Sub: smooth jazz, bebop, cool jazz, jazz fusion, vocal jazz | Strumenti: saxophone, upright bass, piano, brushed drums, trumpet | Tip: "swing feel", "walking bass", "improvised feel", poco overproduction

BLUES: soulful, raw emotion, gritty, slow burn | Sub: delta blues, chicago blues, electric blues, blues rock | Strumenti: blues guitar, harmonica, piano, bass, shuffle drums | Tip: "blue note bends", "shuffle rhythm", "call and response"

FOLK: acoustic, storytelling, earthy, organic | Sub: indie folk, contemporary folk, folk rock, Americana | Strumenti: acoustic guitar, banjo, violin, mandolin, harmonica | Tip: "finger-picked guitar", "intimate recording", "room acoustics"

REGGAE: offbeat rhythm, laid back, groove | Sub: roots reggae, dancehall, dub, ska | Strumenti: bass guitar, rhythm guitar, organ, drums, horns | Tip: "offbeat guitar", "heavy bass groove", "dub delay"

LATIN: rhythmic, passionate, energetic, danceable | Sub: reggaeton, salsa, bachata, cumbia, latin pop | Strumenti: congas, timbales, guitar, brass, bass | Tip: "dembow beat" per reggaeton, "clave rhythm" per salsa

CLASSICAL/CINEMATIC: orchestral, cinematic, epic, sweeping | Sub: film score, neo-classical, orchestral, trailer music, dark cinematic | Strumenti: orchestra, strings, brass, woodwinds, timpani, piano, choir | Tip: usa [Instrumental], "sweeping strings", "brass fanfare", "crescendo", [Build] e [Crescendo]

INDIE: quirky, lo-fi aesthetic, authentic, DIY | Sub: indie rock, indie pop, indie folk, dream pop, shoegaze | Strumenti: jangly guitar, synth, bass, drums | Tip: "jangly guitar", "lo-fi aesthetic", "understated production", meno è più

ALTERNATIVE: experimental, edgy, atmospheric | Sub: grunge, post-punk, shoegaze, art rock, new wave | Strumenti: electric guitar, synth, bass, drums, effects pedals | Tip: "reverb-drenched guitar", "atmospheric layers"

SYNTHWAVE: retro, 80s aesthetic, analog synth, neon | Sub: retrowave, darksynth, outrun, vaporwave | Strumenti: analog synth, drum machine, bass synth, arpeggiator | Tip: "80s analog synth", "retro drum machine", "neon atmosphere"

LO-FI: chill, warm, mellow, ambient, nostalgic | Sub: lo-fi hip hop, lo-fi chill, bedroom pop | Strumenti: vinyl crackle, soft piano, mellow guitar, jazzy chords | Tip: "vinyl crackle", "warm tape saturation", "mellow beat", tutto soft

GOSPEL: uplifting, spiritual, powerful, choir-driven | Sub: contemporary gospel, traditional gospel, worship | Strumenti: organ, piano, choir, drums, bass | Tip: "choir harmonies", "call and response", "organ swells"

FUNK: groovy, rhythmic, tight, danceable, bass-driven | Sub: p-funk, funk rock, nu-funk, electro-funk | Strumenti: slap bass, wah guitar, clavinet, horns, tight drums | Tip: "slap bass", "wah-wah guitar", "tight groove", il basso è il re

DISCO: four-on-the-floor, danceable, glamorous | Sub: nu-disco, Italo disco, euro disco | Strumenti: strings, bass guitar, rhythm guitar, congas, hi-hat | Tip: "four-on-the-floor beat", "string arrangements", "groovy baseline"

AMBIENT: atmospheric, ethereal, spacious, meditative | Sub: dark ambient, space ambient, ambient electronic | Strumenti: synthesizer pads, field recordings, reverb, delay, drone | Tip: [Instrumental] obbligatorio, "evolving pads", "space", "textural layers"

=== MOOD E ATMOSFERE ===
- Happy: joyful, bright, upbeat, sunny, euphoric (energia alta)
- Sad: melancholic, sorrowful, bittersweet, wistful, heartbreaking (energia bassa)
- Romantic: passionate, tender, sensual, intimate, loving (energia media)
- Angry: furious, aggressive, intense, defiant, wrathful (energia alta)
- Chill: relaxed, mellow, laid-back, peaceful, serene (energia bassa)
- Dark: ominous, brooding, shadowy, sinister, haunting (energia media)
- Epic: grandiose, majestic, triumphant, powerful, monumental (energia alta)
- Nostalgic: wistful, reminiscent, sentimental, longing, reflective (energia bassa)
- Dreamy: ethereal, floating, surreal, hazy, whimsical (energia bassa)
- Hype: explosive, electrifying, pumping, turnt, wild (energia alta)
- Introspective: contemplative, thoughtful, reflective, deep, meditative (energia bassa)
- Motivational: empowering, inspiring, uplifting, determined, triumphant (energia alta)
- Mysterious: enigmatic, cryptic, suspenseful, eerie, intriguing (energia media)
- Spiritual: transcendent, sacred, divine, awakening, celestial (energia media)

=== ERE E DECADI (usa per ancorare il suono) ===
- Modern (2020s): hyper-modern production, crisp, polished, contemporary
- 2010s: modern production, streaming era, polished, digital
- 2000s: early digital production, processed, radio-ready
- 90s: analog-digital hybrid, raw, authentic
- 80s: synth-heavy, reverb, gated drums, neon
- 70s: warm analog, vinyl, organic
- 60s: vintage, mono, tube warmth

=== SCHEMI DI RIMA ===
- ABAB: rime alternate (verso 1 rima con verso 3, verso 2 con verso 4)
- AABB: couplets (distici rimati a coppie)
- ABCB: rima semplice (solo versi pari rimano)
- ABBA: rima incrociata
- FREE: verso libero (nessuno schema fisso)

=== PRO TIPS AVANZATI ===
- Il tag | (pipe) permette di combinare istruzioni: [Chorus | anthemic | stacked harmonies]
- Aggiungi [Produced by XXX] nei lyrics per influenzare lo stile di produzione
- Per realismo: tape saturation, analog warmth, close mic presence, natural dynamics
- Se la voce è troppo alta, specifica "baritone" o "low register" nei tag
- Usa era anchors come "80s" o "90s" per ancorare il suono a un periodo specifico
- Cover trick: Style "Live Performance, Concert" + Weirdness 0 + Audio Influence 100
- Per vocali più chiare, usa parole semplici e evita parole troppo lunghe

=== REGOLE PER I TESTI ===
- Scrivi testi POETICI, EVOCATIVI e MUSICALI
- Usa parole SEMPLICI e CHIARE (per una pronuncia migliore su Suno)
- Evita parole troppo lunghe o complesse
- Mantieni un flusso ritmico naturale
- Il ritornello deve essere ORECCHIABILE e memorabile
- Usa ripetizioni strategiche nel chorus
- I versi devono raccontare una storia/emozione che evolve
- Il bridge deve offrire una prospettiva diversa/twist emotivo
- Adatta il linguaggio al genere (slang per hip-hop, poetico per ballad, diretto per punk)

=== OUTPUT ===
Genera SEMPRE due output separati:
1. STYLE PROMPT: una riga di testo per il campo "Style of Music" di Suno (formato: decade, genere, sub-genere, descrittori, tipo voce, strumenti, produzione)
2. LYRICS: il testo completo con meta tags integrati

IMPORTANTE: Non aggiungere spiegazioni, commenti o note. Genera SOLO lo style prompt e i lyrics.`;
  }

  // ---- BUILD USER PROMPT ----
  buildUserPrompt(options) {
    const { theme, genre, mood, language, vocalType, structure, era, extraDetails } = options;

    const languageMap = {
      'italian': 'italiano',
      'english': 'inglese',
      'spanish': 'spagnolo',
      'french': 'francese',
      'mixed-it-en': 'mix italiano/inglese (alcune parti in italiano, altre in inglese)'
    };

    const structureMap = {
      'standard': 'Verse-Chorus-Verse-Chorus-Bridge-Chorus con Intro e Outro',
      'simple': 'Verse-Chorus-Verse-Chorus semplice',
      'extended': 'Struttura estesa con Intro strumentale, Pre-Chorus, Interlude, Outro',
      'rap': 'Verse-Hook-Verse-Hook-Bridge-Verse-Hook (stile rap)',
      'ballad': 'Ballad lenta con build emotivo progressivo',
      'edm': 'Intro-Build-Drop-Breakdown-Verse-Build-Drop-Outro (stile EDM)'
    };

    const vocalMap = {
      'male': 'voce maschile',
      'female': 'voce femminile',
      'duet': 'duetto maschile/femminile',
      'instrumental': 'strumentale (no voce)'
    };

    let prompt = `Genera un testo musicale per Suno AI con queste specifiche:

📌 TEMA: ${theme || 'libero, a tua scelta'}
🎵 GENERE: ${genre || 'pop'}
💫 MOOD: ${mood || 'energetico'}
🌍 LINGUA: ${languageMap[language] || 'italiano'}
🎤 VOCE: ${vocalMap[vocalType] || 'voce maschile'}
🏗️ STRUTTURA: ${structureMap[structure] || 'standard'}
📅 ERA/DECADE: ${era || 'moderno 2020s'}`;

    if (extraDetails && extraDetails.trim()) {
      prompt += `\n📝 DETTAGLI EXTRA: ${extraDetails}`;
    }

    prompt += `

FORMATO OUTPUT RICHIESTO:
---STYLE PROMPT---
(scrivi qui lo style prompt per Suno in una sola riga)
---LYRICS---
(scrivi qui i lyrics completi con meta tags [])
---TIPS---
(scrivi 3-5 consigli brevi e pratici per usare questo testo su Suno, uno per riga)
---END---`;

    return prompt;
  }

  // ---- CALL GEMINI API ----
  async generateLyrics(options) {
    if (!this.hasApiKey()) {
      throw new Error('API key Gemini non configurata. Vai nelle Impostazioni per inserirla.');
    }

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(options);

    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt + '\n\n' + userPrompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ]
    };

    try {
      let response;

      // Call Gemini Flash
      response = await fetch(`${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      // If rate limited, retry once after wait
      if (response.status === 429) {
        console.log('Rate limited, waiting 5s and retrying...');
        await new Promise(r => setTimeout(r, 5000));
        response = await fetch(`${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || `Errore HTTP ${response.status}`;

        if (response.status === 400) {
          throw new Error('Richiesta non valida. Controlla l\'API key nelle Impostazioni.');
        }
        if (response.status === 403) {
          throw new Error('API key non valida o non autorizzata. Controlla la chiave nelle Impostazioni.');
        }
        if (response.status === 429) {
          throw new Error('Tutti i modelli sovraccarichi. Aspetta 1 minuto e riprova.');
        }
        throw new Error(`Errore Gemini: ${errorMsg}`);
      }

      const data = await response.json();

      // Extract text from response
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Risposta vuota da Gemini. Riprova.');
      }

      return this.parseResponse(text);

    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Errore di rete. Controlla la connessione internet.');
      }
      throw err;
    }
  }

  // ---- PARSE GEMINI RESPONSE ----
  parseResponse(text) {
    let stylePrompt = '';
    let lyrics = '';
    let tips = [];

    // Try to parse structured output
    const styleMatch = text.match(/---STYLE PROMPT---\s*([\s\S]*?)\s*---LYRICS---/i);
    const lyricsMatch = text.match(/---LYRICS---\s*([\s\S]*?)\s*(?:---TIPS---|---END---|$)/i);
    const tipsMatch = text.match(/---TIPS---\s*([\s\S]*?)\s*(?:---END---|$)/i);

    if (styleMatch && lyricsMatch) {
      stylePrompt = styleMatch[1].trim();
      lyrics = lyricsMatch[1].trim();
      if (tipsMatch) {
        tips = tipsMatch[1].trim().split('\n')
          .map(t => t.replace(/^[-•*\d.]+\s*/, '').trim())
          .filter(t => t.length > 0);
      }
    } else {
      // Fallback: try to detect style prompt and lyrics from unstructured output
      const lines = text.split('\n');
      let inLyrics = false;
      const lyricsLines = [];
      const styleLines = [];

      for (const line of lines) {
        const trimmed = line.trim();
        // Detect if line looks like a meta tag or lyrics
        if (trimmed.startsWith('[') || inLyrics) {
          inLyrics = true;
          lyricsLines.push(line);
        } else if (trimmed.toLowerCase().includes('style prompt') || trimmed.toLowerCase().includes('style of music')) {
          // Skip label line
          continue;
        } else if (!inLyrics && trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('*')) {
          styleLines.push(trimmed);
        }
      }

      if (lyricsLines.length > 0) {
        lyrics = lyricsLines.join('\n').trim();
      }
      if (styleLines.length > 0) {
        stylePrompt = styleLines[0].trim();
      }

      // If still nothing, use the whole text as lyrics
      if (!lyrics) {
        lyrics = text.trim();
      }
    }

    // Clean up markdown formatting
    stylePrompt = stylePrompt.replace(/^```.*$/gm, '').replace(/\*\*/g, '').trim();
    lyrics = lyrics.replace(/^```.*$/gm, '').replace(/\*\*/g, '').trim();

    return { stylePrompt, lyrics, tips };
  }

  // ---- GENERATE STYLE PROMPT ONLY ----
  async generateStylePrompt(options) {
    if (!this.hasApiKey()) {
      throw new Error('API key non configurata.');
    }

    const prompt = `Sei un esperto di Suno AI. Genera SOLO uno Style Prompt ottimizzato (una riga) per questo tipo di canzone:
Genere: ${options.genre || 'pop'}
Mood: ${options.mood || 'energetico'}
Era: ${options.era || 'moderno'}
Voce: ${options.vocalType || 'male vocals'}
Dettagli: ${options.extraDetails || 'nessuno'}

Formula: decade, genere, sub-genere, paese, tipo voce, descrittori musicali, strumenti, produzione
Rispondi con SOLO lo style prompt, nient'altro.`;

    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 256 }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }
}
