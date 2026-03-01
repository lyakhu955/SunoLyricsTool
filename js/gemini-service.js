// ============================================
// GEMINI AI SERVICE
// Integration with Google Gemini API for
// intelligent lyrics generation for Suno
// ============================================

class GeminiService {
  constructor() {
    this.apiKey = localStorage.getItem('sunoLyrics_geminiKey') || '';
    this.model = 'gemini-2.0-flash';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('sunoLyrics_geminiKey', key);
  }

  getApiKey() {
    return this.apiKey;
  }

  hasApiKey() {
    return this.apiKey && this.apiKey.trim().length > 0;
  }

  // ---- BUILD THE SUNO-OPTIMIZED SYSTEM PROMPT ----
  buildSystemPrompt() {
    return `Sei un esperto paroliere e songwriter specializzato nella creazione di testi musicali ottimizzati per Suno AI.

CONOSCENZA SUNO AI - REGOLE FONDAMENTALI:
1. I lyrics per Suno usano META TAGS tra parentesi quadre [] per controllare la struttura e lo stile vocale
2. I meta tags vanno SEMPRE all'inizio di ogni sezione
3. Si possono COMBINARE più istruzioni con il separatore | (pipe): [Chorus | anthemic chorus | stacked harmonies]
4. Ogni sezione dovrebbe avere MASSIMO 4 righe di testo (Suno funziona meglio così)
5. Non superare 4-5 meta tags per sezione (troppi confondono Suno)

META TAGS STRUTTURA DISPONIBILI:
[Intro], [Verse], [Verse 1], [Verse 2], [Pre-Chorus], [Chorus], [Bridge], [Outro], [Hook], [Build], [Drop], [Breakdown], [Instrumental], [Instrumental Intro], [Interlude], [Refrain], [Coda], [End]

META TAGS VOCALI DISPONIBILI:
[raspy lead vocal], [autotuned delivery], [stacked harmonies], [anthemic chorus], [spoken word verse], [emotional build-up], [crowd-style vocals], [whispered vocals], [powerful belting], [falsetto], [warm baritone], [vocal fry], [ad-lib], [smooth vocals], [aggressive delivery]

META TAGS STRUMENTALI:
[guitar solo], [808 sub bass], [piano only], [orchestral strings], [pedal steel guitar], [sidechained synth bass], [groovy bass], [drum fill], [brass section], [synth arpeggio]

REGOLE PER I TESTI:
- Scrivi testi POETICI, EVOCATIVI e MUSICALI
- Usa parole SEMPLICI e CHIARE (per una pronuncia migliore su Suno)
- Evita parole troppo lunghe o complesse
- Mantieni un flusso ritmico naturale
- Il ritornello deve essere ORECCHIABILE e memorabile
- Usa ripetizioni strategiche nel chorus
- I versi devono raccontare una storia/emozione che evolve
- Il bridge deve offrire una prospettiva diversa/twist emotivo

OUTPUT: Genera SEMPRE due output separati:
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
      let retries = 0;
      const maxRetries = 2;

      while (retries <= maxRetries) {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (response.status === 429 && retries < maxRetries) {
          retries++;
          const waitTime = retries * 3000; // 3s, 6s
          console.log(`Rate limited, retry ${retries}/${maxRetries} in ${waitTime/1000}s...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }
        break;
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
          throw new Error('Troppe richieste. Aspetta 30-60 secondi e riprova.');
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

    // Try to parse structured output
    const styleMatch = text.match(/---STYLE PROMPT---\s*([\s\S]*?)\s*---LYRICS---/i);
    const lyricsMatch = text.match(/---LYRICS---\s*([\s\S]*?)\s*(?:---END---|$)/i);

    if (styleMatch && lyricsMatch) {
      stylePrompt = styleMatch[1].trim();
      lyrics = lyricsMatch[1].trim();
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

    return { stylePrompt, lyrics };
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
