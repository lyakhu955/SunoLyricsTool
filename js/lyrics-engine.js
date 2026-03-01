// ============================================
// LYRICS GENERATION ENGINE
// AI-powered lyrics generator optimized for Suno
// Uses templates, Markov-like chains, and
// knowledge base for smart generation
// ============================================

class LyricsEngine {
  constructor() {
    this.knowledge = SunoKnowledge;
  }

  // ---- MAIN GENERATION METHOD ----
  generate(options) {
    const {
      theme, genre, mood, language, vocalType,
      structure, era, extraDetails,
      includeMetaTags, includeStylePrompt, optimizeForSuno
    } = options;

    const genreConfig = this.knowledge.genreConfig[genre] || this.knowledge.genreConfig.pop;
    const moodConfig = this.knowledge.moodConfig[mood] || this.knowledge.moodConfig.happy;
    const eraConfig = this.knowledge.eraConfig[era] || this.knowledge.eraConfig.modern;
    const structureTags = this.knowledge.structureTags[structure] || this.knowledge.structureTags.standard;

    // Generate Style Prompt
    let stylePrompt = '';
    if (includeStylePrompt) {
      stylePrompt = this.generateStylePrompt(genreConfig, moodConfig, eraConfig, vocalType, extraDetails);
    }

    // Generate Lyrics
    const lyrics = this.generateLyrics(
      theme, genre, genreConfig, moodConfig, language,
      vocalType, structureTags, includeMetaTags, optimizeForSuno, extraDetails
    );

    // Generate Tips
    const tips = this.generateTips(genre, genreConfig, mood, structure);

    return { stylePrompt, lyrics, tips };
  }

  // ---- STYLE PROMPT GENERATOR ----
  generateStylePrompt(genreConfig, moodConfig, eraConfig, vocalType, extraDetails) {
    const parts = [];

    // Era
    parts.push(eraConfig.prefix);

    // Genre keywords
    parts.push(...this.pickRandom(genreConfig.styleKeywords, 3));

    // Subgenre
    if (genreConfig.subgenres && genreConfig.subgenres.length > 0) {
      parts.push(this.pickRandom(genreConfig.subgenres, 1)[0]);
    }

    // Mood
    parts.push(...this.pickRandom(moodConfig.adjectives, 2));

    // Vocal type
    const vocalStyles = this.knowledge.vocalStyles[vocalType] || ['male vocals'];
    parts.push(vocalStyles[0]);

    // Instruments
    if (genreConfig.instruments) {
      parts.push(...this.pickRandom(genreConfig.instruments, 2));
    }

    // Production quality
    parts.push(...this.pickRandom(eraConfig.descriptors, 1));

    // Extra details
    if (extraDetails && extraDetails.trim()) {
      parts.push(extraDetails.trim());
    }

    return parts.join(', ');
  }

  // ---- LYRICS GENERATOR ----
  generateLyrics(theme, genre, genreConfig, moodConfig, language, vocalType, structureTags, includeMetaTags, optimizeForSuno, extraDetails) {
    const lines = [];
    let verseCount = 0;
    let chorusGenerated = false;
    let chorusLines = [];

    for (const tag of structureTags) {
      const sectionType = this.parseSectionType(tag);

      // Add meta tag header
      if (includeMetaTags) {
        const enhancedTag = this.enhanceMetaTag(tag, sectionType, genreConfig, moodConfig, genre);
        lines.push(enhancedTag);
      } else {
        lines.push(tag);
      }

      // Generate content based on section type
      if (sectionType === 'instrumental' || sectionType === 'intro-instrumental' ||
          sectionType === 'interlude' || sectionType === 'end' || sectionType === 'coda') {
        // No lyrics for instrumental sections
        if (sectionType === 'end' || sectionType === 'coda') {
          lines.push('');
        } else {
          lines.push('');
        }
      } else if (sectionType === 'chorus' || sectionType === 'hook') {
        if (!chorusGenerated) {
          chorusLines = this.generateSection(theme, genre, moodConfig, language, 'chorus', optimizeForSuno);
          chorusGenerated = true;
        }
        lines.push(...chorusLines);
        lines.push('');
      } else if (sectionType === 'verse') {
        verseCount++;
        const verseLines = this.generateSection(theme, genre, moodConfig, language, 'verse', optimizeForSuno, verseCount);
        lines.push(...verseLines);
        lines.push('');
      } else if (sectionType === 'pre-chorus') {
        const pcLines = this.generateSection(theme, genre, moodConfig, language, 'pre-chorus', optimizeForSuno);
        lines.push(...pcLines);
        lines.push('');
      } else if (sectionType === 'bridge') {
        const bridgeLines = this.generateSection(theme, genre, moodConfig, language, 'bridge', optimizeForSuno);
        lines.push(...bridgeLines);
        lines.push('');
      } else if (sectionType === 'outro') {
        const outroLines = this.generateSection(theme, genre, moodConfig, language, 'outro', optimizeForSuno);
        lines.push(...outroLines);
        lines.push('');
      } else if (sectionType === 'build' || sectionType === 'drop' || sectionType === 'breakdown') {
        // EDM sections
        const edmLines = this.generateSection(theme, genre, moodConfig, language, sectionType, optimizeForSuno);
        lines.push(...edmLines);
        lines.push('');
      } else {
        // Default - generate verse-like content
        const defaultLines = this.generateSection(theme, genre, moodConfig, language, 'verse', optimizeForSuno);
        lines.push(...defaultLines);
        lines.push('');
      }
    }

    return lines.join('\n').trim();
  }

  // ---- SECTION CONTENT GENERATOR ----
  generateSection(theme, genre, moodConfig, language, sectionType, optimize, verseNum = 1) {
    const lineCount = optimize ? 4 : this.getRandomInt(3, 6);
    const templates = this.getTemplates(language, sectionType, moodConfig, theme);

    const lines = [];
    const usedTemplates = new Set();

    for (let i = 0; i < lineCount; i++) {
      let line;
      let attempts = 0;
      do {
        const templateIdx = this.getRandomInt(0, templates.length - 1);
        line = this.fillTemplate(templates[templateIdx], theme, moodConfig, language, verseNum);
        attempts++;
      } while (usedTemplates.has(line) && attempts < 10);

      usedTemplates.add(line);
      lines.push(line);
    }

    return lines;
  }

  // ---- TEMPLATE SYSTEM ----
  getTemplates(language, sectionType, moodConfig, theme) {
    const themeWords = theme ? theme.split(/[\s,]+/).filter(w => w.length > 2) : ['vita', 'tempo', 'cuore'];

    if (language === 'english') {
      return this.getEnglishTemplates(sectionType, moodConfig, themeWords);
    } else if (language === 'spanish') {
      return this.getSpanishTemplates(sectionType, moodConfig, themeWords);
    } else if (language === 'french') {
      return this.getFrenchTemplates(sectionType, moodConfig, themeWords);
    } else if (language === 'mixed-it-en') {
      return [...this.getItalianTemplates(sectionType, moodConfig, themeWords),
              ...this.getEnglishTemplates(sectionType, moodConfig, themeWords)];
    }
    return this.getItalianTemplates(sectionType, moodConfig, themeWords);
  }

  getItalianTemplates(sectionType, moodConfig, themeWords) {
    const tw = themeWords;
    const energy = moodConfig.energy;

    const verseTemplates = [
      `Cammino sotto un cielo di ${this.pick(['stelle', 'nuvole', 'ricordi', 'sogni'])}`,
      `Il ${this.pick(tw)} mi porta dove non ${this.pick(['so', 'vedo', 'arrivo', 'torno'])}`,
      `Ogni passo racconta ${this.pick(['una storia', 'il passato', 'chi siamo', 'la verità'])}`,
      `Nel silenzio trovo ${this.pick(['la risposta', 'me stesso', 'il coraggio', 'la luce'])}`,
      `${this.pick(['Brucia', 'Vola', 'Cade', 'Nasce'])} come ${this.pick(['fiamma', 'foglia', 'pioggia', 'alba'])} nel vento`,
      `Non posso ${this.pick(['dimenticare', 'tornare', 'restare', 'smettere'])} di ${this.pick(['sognare', 'correre', 'cercarti', 'pensarti'])}`,
      `${this.pick(['Guardo', 'Sento', 'Cerco', 'Perdo'])} il ${this.pick(tw)} ${this.pick(['dentro di me', 'lontano da qui', 'nel buio', 'tra le ombre'])}`,
      `Le parole ${this.pick(['si perdono', 'non bastano', 'mi salvano', 'ci uniscono'])}`,
      `${this.pick(['Ancora', 'Sempre', 'Mai più', 'Forse'])} ${this.pick(['qui', 'così', 'insieme', 'da solo'])}`,
      `Il mondo ${this.pick(['gira', 'cambia', 'brucia', 'aspetta'])} ma io ${this.pick(['resto', 'corro', 'cado', 'volo'])}`,
      `Come ${this.pick(['onde', 'fiamme', 'note', 'ombre'])} nella ${this.pick(['notte', 'luce', 'pioggia', 'nebbia'])}`,
      `${this.pick(['Dimmi', 'Portami', 'Salvami', 'Lasciami'])} dove ${this.pick(['finisce', 'inizia', 'brilla', 'canta'])} il ${this.pick(tw)}`,
      `Tra ${this.pick(['mille', 'cento', 'troppi', 'pochi'])} ${this.pick(['errori', 'ricordi', 'sorrisi', 'silenzi'])} ti ho ${this.pick(['trovato', 'perso', 'cercato', 'amato'])}`,
      `Il ${this.pick(tw)} ${this.pick(['scorre', 'brucia', 'brilla', 'grida'])} nelle vene`,
      `E ${this.pick(['corro', 'volo', 'cado', 'danzo'])} senza ${this.pick(['paura', 'fiato', 'meta', 'fine'])}`,
    ];

    const chorusTemplates = [
      `${this.pick(['Grido', 'Sento', 'Vivo', 'Brucio'])} ${this.pick(tw)} ${this.pick(['stanotte', 'per sempre', 'ancora', 'adesso'])}`,
      `Non mi ${this.pick(['fermare', 'lasciare', 'toccare', 'dimenticare'])} ${this.pick(['mai', 'ora', 'più', 'così'])}`,
      `${this.pick(['Siamo', 'Saremo', 'Eravamo', 'Restiamo'])} ${this.pick(['fuoco', 'luce', 'tuono', 'stelle'])} nella notte`,
      `Il ${this.pick(tw)} è ${this.pick(['tutto', 'nostro', 'vivo', 'infinito'])}`,
      `${this.pick(['Vola', 'Brucia', 'Splendi', 'Corri'])} con me fino ${this.pick(['alla fine', 'alle stelle', 'al cielo', "all'alba"])}`,
      `E ${this.pick(['balliamo', 'cantiamo', 'viviamo', 'bruciamo'])} come se ${this.pick(['non ci fosse domani', 'il mondo si fermasse', 'fossimo immortali'])}`,
      `${this.pick(['Questo', 'Quello', 'Il nostro'])} ${this.pick(tw)} non ${this.pick(['si spegne', 'finirà', 'morirà', 'si ferma'])} mai`,
      `Oh oh oh, ${this.pick(['senti', 'vieni', 'resta', 'corri'])} ${this.pick(['con me', 'da me', 'per me', 'verso di me'])}`,
      `${this.pick(['Più forte', 'Più in alto', 'Più lontano', 'Più vicino'])} di ${this.pick(['così', 'ieri', 'prima', 'tutto'])}`,
      `E il ${this.pick(tw)} ${this.pick(['esplode', 'rinasce', 'illumina', 'conquista'])} ogni ${this.pick(['paura', 'ombra', 'distanza', 'muro'])}`,
    ];

    const preChorusTemplates = [
      `E sento che ${this.pick(['sta arrivando', 'tutto cambia', 'il momento è adesso', 'non posso più fermarmi'])}`,
      `${this.pick(['Più', 'Sempre più', 'Ancora più'])} ${this.pick(['forte', 'vicino', 'intenso', 'vero'])}`,
      `${this.pick(['Pronto', 'Pronta', 'Pronti'])} a ${this.pick(['volare', 'cadere', 'esplodere', 'rinascere'])}`,
      `Non c'è ${this.pick(['ritorno', 'paura', 'limite', 'fine'])} ${this.pick(['stavolta', 'per noi', 'adesso', 'da qui'])}`,
    ];

    const bridgeTemplates = [
      `E se ${this.pick(['tutto', 'domani', 'il mondo', 'questo sogno'])} ${this.pick(['finisse', 'cambiasse', 'sparisse', 'bruciasse'])}`,
      `${this.pick(['Resterebbe', 'Rimarrebbe', 'Sopravvivrebbe'])} solo ${this.pick(['la verità', 'il ricordo', 'la musica', 'il nostro nome'])}`,
      `In questo ${this.pick(['momento', 'istante', 'respiro', 'battito'])} ${this.pick(['siamo eterni', 'tutto è chiaro', 'nulla importa'])}`,
      `${this.pick(['Lascia', 'Lasciami'])} ${this.pick(['andare', 'restare', 'provare', 'sognare'])} un'ultima volta`,
    ];

    const outroTemplates = [
      `${this.pick(tw)}... ${this.pick(tw)}...`,
      `${this.pick(['Per sempre', 'Sempre', 'Mai più', 'Ancora'])}...`,
      `Oh... ${this.pick(['sì', 'no', 'oh', 'ah'])}...`,
      `${this.pick(['Resta', 'Vola', 'Brucia', 'Vivi'])}...`,
    ];

    const buildTemplates = [
      `${this.pick(['Più forte', 'Più alto', 'Più veloce'])}`,
      `${this.pick(['Sale', 'Cresce', 'Esplode'])} ${this.pick(['tutto', 'il ritmo', 'la febbre'])}`,
      `Oh oh oh oh`,
      `${this.pick(['Senti', 'Senti', 'Ascolta'])} il ${this.pick(['beat', 'basso', 'ritmo'])}`,
    ];

    switch (sectionType) {
      case 'chorus':
      case 'hook':
        return chorusTemplates;
      case 'pre-chorus':
        return preChorusTemplates;
      case 'bridge':
        return bridgeTemplates;
      case 'outro':
        return outroTemplates;
      case 'build':
      case 'drop':
      case 'breakdown':
        return buildTemplates;
      default:
        return verseTemplates;
    }
  }

  getEnglishTemplates(sectionType, moodConfig, themeWords) {
    const tw = themeWords;

    const verseTemplates = [
      `Walking through the ${this.pick(['shadows', 'memories', 'city lights', 'midnight rain'])}`,
      `${this.pick(['Every', 'Each'])} ${this.pick(tw)} ${this.pick(['tells a story', 'fades away', 'comes alive', 'breaks the silence'])}`,
      `I ${this.pick(["can't", "won't", "don't"])} ${this.pick(['stop', 'quit', 'let go', 'look back'])} ${this.pick(['dreaming', 'running', 'searching', 'falling'])}`,
      `The ${this.pick(tw)} ${this.pick(['burns', 'shines', 'screams', 'whispers'])} in the ${this.pick(['dark', 'night', 'rain', 'wind'])}`,
      `${this.pick(['Lost', 'Found', 'Trapped', 'Free'])} between the ${this.pick(['lines', 'lies', 'lights', 'walls'])}`,
      `${this.pick(['Fire', 'Rain', 'Light', 'Thunder'])} in my ${this.pick(['veins', 'heart', 'soul', 'bones'])}`,
      `${this.pick(['Tell me', 'Show me', 'Take me', 'Save me'])} where the ${this.pick(tw)} ${this.pick(['goes', 'ends', 'begins', 'hides'])}`,
      `Nothing ${this.pick(['left', 'here', 'matters', 'changes'])} but the ${this.pick(['truth', 'sound', 'echo', 'feeling'])}`,
      `I've been ${this.pick(['running', 'waiting', 'drowning', 'fighting'])} for too ${this.pick(['long', 'many nights', 'many years'])}`,
      `${this.pick(['Under', 'Above', 'Beyond', 'Through'])} the ${this.pick(['neon sky', 'broken glass', 'city haze', 'falling stars'])}`,
      `The world keeps ${this.pick(['spinning', 'turning', 'burning', 'changing'])} but I ${this.pick(['stand still', 'hold on', 'let go', 'move on'])}`,
      `${this.pick(['Echoes', 'Shadows', 'Whispers', 'Voices'])} of ${this.pick(['yesterday', 'tomorrow', 'what we had', 'who we were'])}`,
    ];

    const chorusTemplates = [
      `${this.pick(['We are', "I'm", "We're"])} ${this.pick(['unstoppable', 'on fire', 'alive', 'infinite'])} tonight`,
      `${this.pick(["Can't", "Won't", "Don't"])} stop this ${this.pick(['feeling', 'fire', 'rhythm', 'moment'])}`,
      `${this.pick(['Burn', 'Rise', 'Shine', 'Fall'])} with me till the ${this.pick(['end', 'dawn', 'stars fade', 'world stops'])}`,
      `This is ${this.pick(['everything', 'our moment', 'the beginning', 'forever'])}`,
      `Oh oh oh ${this.pick(['feel it', 'take it', 'break it', 'make it'])} ${this.pick(['now', 'tonight', 'forever', 'louder'])}`,
      `${this.pick(['Louder', 'Higher', 'Faster', 'Deeper'])} than ${this.pick(['before', 'ever', 'the noise', 'the silence'])}`,
      `We ${this.pick(['light', 'burn', 'break', 'paint'])} it up like ${this.pick(['fire', 'gold', 'diamonds', 'thunder'])}`,
      `${this.pick(["Ain't", "There's", "It's"])} no ${this.pick(['stopping', 'turning back', 'going down', 'giving up'])} ${this.pick(['now', 'tonight', 'ever', 'this time'])}`,
    ];

    const preChorusTemplates = [
      `${this.pick(["And I feel it", "I can feel it", "Something's"])} ${this.pick(['coming', 'building', 'rising', 'changing'])}`,
      `${this.pick(['Ready', 'Closer', 'Here we go', 'This is it'])}`,
      `${this.pick(['No', "There's no"])} turning ${this.pick(['back now', 'around', 'away from this'])}`,
      `${this.pick(['Take my hand', 'Hold on tight', 'Close your eyes', 'Let it go'])}`,
    ];

    const bridgeTemplates = [
      `If ${this.pick(['tomorrow', 'this world', 'everything', 'the music'])} ${this.pick(['disappeared', 'faded', 'ended', 'stopped'])}`,
      `${this.pick(["I'd", "We'd"])} still ${this.pick(['remember', 'feel', 'hear', 'carry'])} ${this.pick(['this', 'you', 'every note', 'the echo'])}`,
      `In this ${this.pick(['moment', 'breath', 'heartbeat', 'second'])} we are ${this.pick(['eternal', 'everything', 'infinite', 'alive'])}`,
      `Let me ${this.pick(['go', 'stay', 'try', 'dream'])} one ${this.pick(['last', 'more', 'final'])} time`,
    ];

    const outroTemplates = [
      `${this.pick(tw)}... ${this.pick(tw)}...`,
      `${this.pick(['Forever', 'Always', 'Never again', 'One more time'])}...`,
      `Oh... ${this.pick(['yeah', 'oh', 'ah'])}...`,
      `${this.pick(['Stay', 'Fly', 'Burn', 'Live'])}...`,
    ];

    const buildTemplates = [
      `${this.pick(['Louder', 'Higher', 'Faster'])}`,
      `${this.pick(['Here it', 'Here we'])} ${this.pick(['comes', 'go'])}`,
      `Oh oh oh oh`,
      `${this.pick(['Feel', 'Hear', 'Drop'])} the ${this.pick(['beat', 'bass', 'rhythm'])}`,
    ];

    switch (sectionType) {
      case 'chorus': case 'hook': return chorusTemplates;
      case 'pre-chorus': return preChorusTemplates;
      case 'bridge': return bridgeTemplates;
      case 'outro': return outroTemplates;
      case 'build': case 'drop': case 'breakdown': return buildTemplates;
      default: return verseTemplates;
    }
  }

  getSpanishTemplates(sectionType, moodConfig, themeWords) {
    const tw = themeWords;
    const verseTemplates = [
      `Caminando bajo un cielo de ${this.pick(['estrellas', 'recuerdos', 'sueños', 'fuego'])}`,
      `El ${this.pick(tw)} me lleva donde no ${this.pick(['puedo', 'quiero', 'debo'])} llegar`,
      `Cada paso cuenta ${this.pick(['una historia', 'la verdad', 'un secreto'])}`,
      `En el silencio encuentro ${this.pick(['la respuesta', 'mi camino', 'la luz', 'la fuerza'])}`,
      `${this.pick(['Arde', 'Vuela', 'Cae', 'Nace'])} como ${this.pick(['llama', 'hoja', 'lluvia', 'alba'])} en el viento`,
      `No puedo ${this.pick(['olvidar', 'volver', 'parar', 'dejar'])} de ${this.pick(['soñar', 'correr', 'buscarte', 'sentir'])}`,
    ];
    const chorusTemplates = [
      `${this.pick(['Grito', 'Siento', 'Vivo', 'Ardo'])} ${this.pick(tw)} ${this.pick(['esta noche', 'por siempre', 'otra vez', 'ahora'])}`,
      `No me ${this.pick(['pares', 'dejes', 'olvides'])} ${this.pick(['jamás', 'ahora', 'nunca más'])}`,
      `${this.pick(['Somos', 'Seremos'])} ${this.pick(['fuego', 'luz', 'trueno', 'estrellas'])} en la noche`,
      `${this.pick(['Vuela', 'Arde', 'Brilla', 'Corre'])} conmigo hasta ${this.pick(['el fin', 'las estrellas', 'el cielo', 'el amanecer'])}`,
    ];
    switch (sectionType) {
      case 'chorus': case 'hook': return chorusTemplates;
      default: return verseTemplates;
    }
  }

  getFrenchTemplates(sectionType, moodConfig, themeWords) {
    const tw = themeWords;
    const verseTemplates = [
      `Marchant sous un ciel de ${this.pick(['étoiles', 'souvenirs', 'rêves', 'flammes'])}`,
      `Le ${this.pick(tw)} m'emporte où je ne ${this.pick(['peux', 'veux', 'sais'])} pas aller`,
      `Chaque pas raconte ${this.pick(['une histoire', 'la vérité', 'un secret'])}`,
      `Dans le silence je trouve ${this.pick(['la réponse', 'mon chemin', 'la lumière', 'la force'])}`,
    ];
    const chorusTemplates = [
      `${this.pick(['Je crie', 'Je sens', 'Je vis', 'Je brûle'])} ${this.pick(tw)} ${this.pick(['ce soir', 'pour toujours', 'encore', 'maintenant'])}`,
      `Ne me ${this.pick(['laisse', 'quitte', 'lâche'])} ${this.pick(['jamais', 'pas', 'plus'])}`,
      `${this.pick(['Nous sommes', 'On sera'])} ${this.pick(['feu', 'lumière', 'étoiles'])} dans la nuit`,
    ];
    switch (sectionType) {
      case 'chorus': case 'hook': return chorusTemplates;
      default: return verseTemplates;
    }
  }

  // ---- META TAG ENHANCER ----
  enhanceMetaTag(tag, sectionType, genreConfig, moodConfig, genre) {
    const enhancements = [];

    switch (sectionType) {
      case 'chorus':
      case 'hook':
        enhancements.push(...this.pickRandom(genreConfig.vocalTags || ['anthemic chorus'], 2));
        break;
      case 'verse':
        if (genre === 'hip-hop' || genre === 'trap') {
          enhancements.push(this.pick(['spoken word verse', 'rhythmic flow', 'rap delivery']));
        } else {
          enhancements.push(this.pick(genreConfig.vocalTags || ['emotional delivery']));
        }
        break;
      case 'bridge':
        enhancements.push(this.pick(['emotional build-up', 'dynamic shift', 'stripped back']));
        break;
      case 'build':
        enhancements.push('rising intensity', 'building energy');
        break;
      case 'drop':
        enhancements.push('explosive drop', 'maximum energy');
        break;
      case 'breakdown':
        enhancements.push('stripped back', 'minimal instrumentation');
        break;
      case 'outro':
        enhancements.push(this.pick(['fading out', 'gentle ending', 'final resolution']));
        break;
    }

    if (enhancements.length > 0) {
      const cleanTag = tag.replace(']', '');
      return `${cleanTag} | ${enhancements.join(' | ')}]`;
    }
    return tag;
  }

  // ---- TIPS GENERATOR ----
  generateTips(genre, genreConfig, mood, structure) {
    const tips = [];

    // Genre-specific tip
    if (genreConfig.tips) {
      tips.push(genreConfig.tips);
    }

    // Random pro tips
    const proTips = this.knowledge.proTips;
    const randomTips = this.pickRandom(proTips, 3);
    tips.push(...randomTips);

    return tips;
  }

  // ---- HELPER METHODS ----
  parseSectionType(tag) {
    const lower = tag.toLowerCase();
    if (lower.includes('chorus')) return 'chorus';
    if (lower.includes('hook')) return 'hook';
    if (lower.includes('verse')) return 'verse';
    if (lower.includes('pre-chorus')) return 'pre-chorus';
    if (lower.includes('bridge')) return 'bridge';
    if (lower.includes('outro')) return 'outro';
    if (lower.includes('instrumental intro')) return 'intro-instrumental';
    if (lower.includes('intro')) return 'intro';
    if (lower.includes('interlude')) return 'interlude';
    if (lower.includes('build')) return 'build';
    if (lower.includes('drop')) return 'drop';
    if (lower.includes('breakdown')) return 'breakdown';
    if (lower.includes('instrumental')) return 'instrumental';
    if (lower.includes('end')) return 'end';
    if (lower.includes('coda')) return 'coda';
    if (lower.includes('refrain')) return 'chorus';
    return 'verse';
  }

  fillTemplate(template, theme, moodConfig, language, verseNum) {
    return template;
  }

  pick(arr) {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  pickRandom(arr, count) {
    if (!arr || arr.length === 0) return [];
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, arr.length));
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
