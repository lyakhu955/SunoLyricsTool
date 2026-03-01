// ============================================
// SUNO KNOWLEDGE BASE
// Collected from Reddit r/SunoAI community tips,
// meta tags guide, and best practices
// ============================================

const SunoKnowledge = {

  // ---- STRUCTURE TAGS ----
  structureTags: {
    standard: ['[Intro]', '[Verse 1]', '[Pre-Chorus]', '[Chorus]', '[Verse 2]', '[Pre-Chorus]', '[Chorus]', '[Bridge]', '[Chorus]', '[Outro]', '[End]'],
    simple: ['[Verse 1]', '[Chorus]', '[Verse 2]', '[Chorus]', '[Outro]', '[End]'],
    extended: ['[Instrumental Intro]', '[Verse 1]', '[Pre-Chorus]', '[Chorus]', '[Interlude]', '[Verse 2]', '[Pre-Chorus]', '[Chorus]', '[Bridge]', '[Chorus]', '[Outro]', '[Coda]'],
    rap: ['[Intro]', '[Verse 1]', '[Hook]', '[Verse 2]', '[Hook]', '[Bridge]', '[Verse 3]', '[Hook]', '[Outro]', '[End]'],
    ballad: ['[Instrumental Intro]', '[Verse 1]', '[Verse 2]', '[Chorus]', '[Verse 3]', '[Chorus]', '[Bridge]', '[Chorus]', '[Outro]', '[End]'],
    edm: ['[Intro]', '[Build]', '[Drop]', '[Breakdown]', '[Verse]', '[Build]', '[Drop]', '[Outro]', '[End]']
  },

  // ---- GENRE CONFIGURATIONS ----
  genreConfig: {
    pop: {
      styleKeywords: ['catchy hooks', 'polished production', 'melodic', 'rhythmic'],
      vocalTags: ['anthemic chorus', 'stacked harmonies', 'modern pop polish'],
      instruments: ['synth', 'electric guitar', 'bass', 'drums'],
      subgenres: ['synth-pop', 'electro-pop', 'dance-pop', 'indie pop', 'power pop'],
      tips: 'Pop funziona meglio con ritornelli orecchiabili e sezioni da 4 righe.'
    },
    rock: {
      styleKeywords: ['heavy riffs', 'driving beat', 'dynamic', 'energetic'],
      vocalTags: ['raspy lead vocal', 'powerful belting', 'anthemic chorus'],
      instruments: ['electric guitar', 'bass guitar', 'drums', 'distortion'],
      subgenres: ['alternative rock', 'indie rock', 'classic rock', 'hard rock', 'post-rock', 'arena rock'],
      tips: 'Per il rock usa tag come "heavy distortion", "power chords". Aggiungi [guitar solo] per assoli.'
    },
    'hip-hop': {
      styleKeywords: ['heavy beats', 'complex rhymes', 'energetic delivery', 'rhythmic flow'],
      vocalTags: ['spoken word verse', 'aggressive delivery', 'autotuned delivery'],
      instruments: ['808 bass', 'hi-hats', 'synth', 'sampler'],
      subgenres: ['boom bap', 'trap', 'conscious hip hop', 'cloud rap', 'drill', 'old school'],
      tips: 'Usa [Hook] al posto di [Chorus] per il rap. Sezioni brevi e ritmiche.'
    },
    trap: {
      styleKeywords: ['808 sub bass', 'rolling hi-hats', 'dark atmosphere', 'heavy bass'],
      vocalTags: ['autotuned delivery', 'ad-lib', 'mumble rap style'],
      instruments: ['808 bass', 'hi-hats', 'snare rolls', 'dark synth pads'],
      subgenres: ['melodic trap', 'dark trap', 'phonk', 'rage beat', 'drill'],
      tips: 'Per trap usa: "sidechained", "808 sub bass", rolling hi-hats. Tag [ad-lib] per le ad-lib.'
    },
    'r&b': {
      styleKeywords: ['smooth', 'soulful', 'groove', 'sensual', 'rhythmic'],
      vocalTags: ['smooth vocals', 'falsetto', 'emotional delivery', 'melismatic'],
      instruments: ['electric piano', 'bass guitar', 'soft drums', 'synth pad'],
      subgenres: ['neo-soul', 'contemporary R&B', 'quiet storm', 'alternative R&B'],
      tips: 'R&B vuole vocali fluide. Usa "melismatic turns", "vocal runs", "smooth delivery".'
    },
    electronic: {
      styleKeywords: ['synthesizer', 'electronic beats', 'atmospheric', 'layered production'],
      vocalTags: ['airy vocals', 'vocoder', 'processed vocals'],
      instruments: ['synthesizer', 'drum machine', 'arpeggiator', 'bass synth'],
      subgenres: ['house', 'techno', 'trance', 'dubstep', 'future bass', 'ambient electronic'],
      tips: 'Per EDM usa [Build] e [Drop]. Tag: "sidechained synth bass", "white noise riser".'
    },
    country: {
      styleKeywords: ['twang', 'heartfelt', 'storytelling', 'warm', 'melodic'],
      vocalTags: ['warm baritone', 'slight drawl', 'country vocal style'],
      instruments: ['acoustic guitar', 'pedal steel guitar', 'fiddle', 'banjo', 'dobro'],
      subgenres: ['outlaw country', 'country rock', 'americana', 'bluegrass', 'country pop'],
      tips: 'Country ama le storie. Usa "pedal steel guitar", "light snare reverb", "drawl".'
    },
    metal: {
      styleKeywords: ['heavy riffs', 'intense', 'aggressive', 'powerful', 'virtuosic'],
      vocalTags: ['growling vocals', 'screaming vocals', 'powerful belting', 'raspy'],
      instruments: ['distorted guitar', 'double bass drums', 'heavy bass', 'blast beats'],
      subgenres: ['death metal', 'black metal', 'metalcore', 'progressive metal', 'thrash metal', 'nu metal', 'power metal'],
      tips: 'Per il metal: "heavy distortion", "palm muting", "double bass drums". Usa voci aggressive.'
    },
    punk: {
      styleKeywords: ['fast tempo', 'raw energy', 'aggressive', 'rebellious'],
      vocalTags: ['raspy lead vocal', 'youthful tone', 'light vocal grit', 'shouting'],
      instruments: ['distorted power chords', 'fast drums', 'bass guitar'],
      subgenres: ['pop punk', 'hardcore punk', 'post-punk', 'skate punk', 'melodic punk'],
      tips: 'Punk = veloce e grezzo. Usa "distorted power chords", "fast tempo", "raw energy".'
    },
    jazz: {
      styleKeywords: ['improvisation', 'swing', 'complex harmonies', 'sophisticated'],
      vocalTags: ['smooth vocals', 'scatting', 'crooning', 'jazz phrasing'],
      instruments: ['saxophone', 'upright bass', 'piano', 'brushed drums', 'trumpet'],
      subgenres: ['smooth jazz', 'bebop', 'cool jazz', 'jazz fusion', 'vocal jazz'],
      tips: 'Jazz richiede "swing feel", "walking bass", "improvised feel". Poco overproduction.'
    },
    blues: {
      styleKeywords: ['soulful', 'raw emotion', 'gritty', 'slow burn'],
      vocalTags: ['raspy vocals', 'soulful delivery', 'emotional', 'vocal grit'],
      instruments: ['blues guitar', 'harmonica', 'piano', 'bass', 'shuffle drums'],
      subgenres: ['delta blues', 'chicago blues', 'electric blues', 'blues rock'],
      tips: 'Blues vuole emozione cruda. "Blue note bends", "shuffle rhythm", "call and response".'
    },
    folk: {
      styleKeywords: ['acoustic', 'storytelling', 'earthy', 'organic', 'warm'],
      vocalTags: ['warm vocals', 'intimate delivery', 'acoustic feel'],
      instruments: ['acoustic guitar', 'banjo', 'violin', 'mandolin', 'harmonica'],
      subgenres: ['indie folk', 'contemporary folk', 'folk rock', 'Americana'],
      tips: 'Folk = intimità. "Finger-picked guitar", "intimate recording", "room acoustics".'
    },
    reggae: {
      styleKeywords: ['offbeat rhythm', 'laid back', 'groove', 'warm bass'],
      vocalTags: ['smooth delivery', 'chanting', 'melodic vocals'],
      instruments: ['bass guitar', 'rhythm guitar', 'organ', 'drums', 'horns'],
      subgenres: ['roots reggae', 'dancehall', 'dub', 'ska'],
      tips: 'Reggae: "offbeat guitar", "heavy bass groove", "dub delay". Ritmo rilassato.'
    },
    latin: {
      styleKeywords: ['rhythmic', 'passionate', 'energetic', 'danceable'],
      vocalTags: ['passionate delivery', 'emotional', 'Spanish vocals'],
      instruments: ['congas', 'timbales', 'guitar', 'brass', 'bass'],
      subgenres: ['reggaeton', 'salsa', 'bachata', 'cumbia', 'latin pop'],
      tips: 'Latin: "dembow beat" per reggaeton, "clave rhythm" per salsa. Energia e passione.'
    },
    classical: {
      styleKeywords: ['orchestral', 'cinematic', 'epic', 'dynamic compositions', 'atmospheric'],
      vocalTags: [],
      instruments: ['orchestra', 'strings', 'brass', 'woodwinds', 'timpani', 'piano'],
      subgenres: ['film score', 'neo-classical', 'orchestral', 'chamber music'],
      tips: 'Per orchestrale usa [Instrumental]. "Sweeping strings", "brass fanfare", "crescendo".'
    },
    indie: {
      styleKeywords: ['quirky', 'lo-fi aesthetic', 'authentic', 'DIY', 'alternative'],
      vocalTags: ['intimate vocals', 'understated delivery', 'breathy vocals'],
      instruments: ['jangly guitar', 'synth', 'bass', 'drums'],
      subgenres: ['indie rock', 'indie pop', 'indie folk', 'dream pop', 'shoegaze'],
      tips: 'Indie: "jangly guitar", "lo-fi aesthetic", "understated production". Meno è più.'
    },
    alternative: {
      styleKeywords: ['experimental', 'edgy', 'atmospheric', 'dynamic'],
      vocalTags: ['emotional delivery', 'raspy vocals', 'ethereal vocals'],
      instruments: ['electric guitar', 'synth', 'bass', 'drums', 'effects pedals'],
      subgenres: ['grunge', 'post-punk', 'shoegaze', 'art rock', 'new wave'],
      tips: 'Alternative: mescola elementi. "Reverb-drenched guitar", "atmospheric layers".'
    },
    synthwave: {
      styleKeywords: ['retro', '80s aesthetic', 'analog synth', 'neon', 'nostalgic'],
      vocalTags: ['reverb vocals', 'processed vocals', 'breathy'],
      instruments: ['analog synth', 'drum machine', 'bass synth', 'arpeggiator'],
      subgenres: ['retrowave', 'darksynth', 'outrun', 'vaporwave'],
      tips: 'Synthwave: "80s analog synth", "retro drum machine", "neon atmosphere".'
    },
    'lo-fi': {
      styleKeywords: ['chill', 'warm', 'mellow', 'ambient', 'nostalgic'],
      vocalTags: ['soft vocals', 'whispered', 'distant vocals'],
      instruments: ['vinyl crackle', 'soft piano', 'mellow guitar', 'jazzy chords'],
      subgenres: ['lo-fi hip hop', 'lo-fi chill', 'bedroom pop'],
      tips: 'Lo-fi: "vinyl crackle", "warm tape saturation", "mellow beat". Tutto soft e rilassato.'
    },
    gospel: {
      styleKeywords: ['uplifting', 'spiritual', 'powerful', 'choir-driven'],
      vocalTags: ['powerful belting', 'choir vocals', 'soulful delivery', 'call and response'],
      instruments: ['organ', 'piano', 'choir', 'drums', 'bass'],
      subgenres: ['contemporary gospel', 'traditional gospel', 'worship'],
      tips: 'Gospel: "choir harmonies", "call and response", "organ swells". Energia spirituale.'
    },
    funk: {
      styleKeywords: ['groovy', 'rhythmic', 'tight', 'danceable', 'bass-driven'],
      vocalTags: ['funky delivery', 'soulful', 'energetic'],
      instruments: ['slap bass', 'wah guitar', 'clavinet', 'horns', 'tight drums'],
      subgenres: ['p-funk', 'funk rock', 'nu-funk', 'electro-funk'],
      tips: 'Funk: "slap bass", "wah-wah guitar", "tight groove". Il basso è il re!'
    },
    disco: {
      styleKeywords: ['four-on-the-floor', 'danceable', 'glamorous', 'upbeat'],
      vocalTags: ['powerful vocals', 'falsetto', 'background harmonies'],
      instruments: ['strings', 'bass guitar', 'rhythm guitar', 'congas', 'hi-hat'],
      subgenres: ['nu-disco', 'Italo disco', 'euro disco'],
      tips: 'Disco: "four-on-the-floor beat", "string arrangements", "groovy baseline".'
    },
    ambient: {
      styleKeywords: ['atmospheric', 'ethereal', 'spacious', 'meditative', 'textural'],
      vocalTags: [],
      instruments: ['synthesizer pads', 'field recordings', 'reverb', 'delay', 'drone'],
      subgenres: ['dark ambient', 'space ambient', 'ambient electronic'],
      tips: 'Ambient: [Instrumental] obbligatorio. "Evolving pads", "space", "textural layers".'
    },
    cinematic: {
      styleKeywords: ['epic', 'dramatic', 'sweeping', 'emotional', 'orchestral'],
      vocalTags: ['choir vocals', 'ethereal vocals'],
      instruments: ['orchestra', 'strings', 'brass', 'percussion', 'piano', 'choir'],
      subgenres: ['film score', 'trailer music', 'epic orchestral', 'dark cinematic'],
      tips: 'Cinematic: "sweeping orchestral", "epic percussion", "dramatic build". Usa [Build] e [Crescendo].'
    }
  },

  // ---- MOOD CONFIGURATIONS ----
  moodConfig: {
    happy: { adjectives: ['joyful', 'bright', 'upbeat', 'sunny', 'euphoric'], energy: 'high' },
    sad: { adjectives: ['melancholic', 'sorrowful', 'bittersweet', 'wistful', 'heartbreaking'], energy: 'low' },
    romantic: { adjectives: ['passionate', 'tender', 'sensual', 'intimate', 'loving'], energy: 'medium' },
    angry: { adjectives: ['furious', 'aggressive', 'intense', 'defiant', 'wrathful'], energy: 'high' },
    chill: { adjectives: ['relaxed', 'mellow', 'laid-back', 'peaceful', 'serene'], energy: 'low' },
    dark: { adjectives: ['ominous', 'brooding', 'shadowy', 'sinister', 'haunting'], energy: 'medium' },
    epic: { adjectives: ['grandiose', 'majestic', 'triumphant', 'powerful', 'monumental'], energy: 'high' },
    nostalgic: { adjectives: ['wistful', 'reminiscent', 'sentimental', 'longing', 'reflective'], energy: 'low' },
    dreamy: { adjectives: ['ethereal', 'floating', 'surreal', 'hazy', 'whimsical'], energy: 'low' },
    hype: { adjectives: ['explosive', 'electrifying', 'pumping', 'turnt', 'wild'], energy: 'high' },
    introspective: { adjectives: ['contemplative', 'thoughtful', 'reflective', 'deep', 'meditative'], energy: 'low' },
    motivational: { adjectives: ['empowering', 'inspiring', 'uplifting', 'determined', 'triumphant'], energy: 'high' },
    mysterious: { adjectives: ['enigmatic', 'cryptic', 'suspenseful', 'eerie', 'intriguing'], energy: 'medium' },
    spiritual: { adjectives: ['transcendent', 'sacred', 'divine', 'awakening', 'celestial'], energy: 'medium' }
  },

  // ---- ERA CONFIGURATIONS ----
  eraConfig: {
    modern: { prefix: '2020s', sound: 'hyper-modern production', descriptors: ['crisp', 'polished', 'contemporary'] },
    '2010s': { prefix: '2010s', sound: 'modern production', descriptors: ['streaming era', 'polished', 'digital'] },
    '2000s': { prefix: '2000s', sound: 'early digital production', descriptors: ['processed', 'radio-ready'] },
    '90s': { prefix: '1990s', sound: '90s production', descriptors: ['analog-digital hybrid', 'raw', 'authentic'] },
    '80s': { prefix: '1980s', sound: '80s production', descriptors: ['synth-heavy', 'reverb', 'gated drums', 'neon'] },
    '70s': { prefix: '1970s', sound: '70s analog production', descriptors: ['warm analog', 'vinyl', 'organic'] },
    '60s': { prefix: '1960s', sound: '60s vintage production', descriptors: ['vintage', 'mono', 'tube warmth'] }
  },

  // ---- VOCAL STYLE PER TYPE ----
  vocalStyles: {
    male: ['male vocals', 'baritone', 'tenor', 'deep voice'],
    female: ['female vocals', 'soprano', 'alto', 'high vocals'],
    duet: ['male and female duet', 'call and response vocals', 'harmonized duet'],
    instrumental: ['instrumental']
  },

  // ---- RHYME PATTERNS (for lyrics generation) ----
  rhymePatterns: {
    abab: 'alternating',
    aabb: 'couplets',
    abcb: 'simple',
    abba: 'enclosed',
    free: 'free verse'
  },

  // ---- PRO TIPS ----
  proTips: [
    'Metti i meta tags DENTRO i lyrics, non solo nello Style Prompt, per massimo controllo.',
    'Usa massimo 4-5 tag per sezione, troppi confondono Suno.',
    'Sezioni da 4 righe funzionano meglio. Suno tende ad andare alla sezione successiva alla riga 5.',
    'Usa [End] o [Coda] alla fine per evitare che la canzone continui.',
    'Per vocali più chiare, usa parole semplici e evita parole troppo lunghe.',
    'Il tag | (pipe) permette di combinare istruzioni: [Chorus | anthemic | stacked harmonies]',
    'Aggiungi [Produced by XXX] nei lyrics per influenzare lo stile di produzione.',
    'Per realismo: tape saturation, analog warmth, close mic presence, natural dynamics.',
    'Se la voce è troppo alta, prova a specificare "baritone" o "low register" nei tag.',
    'Non lasciare MAI il campo lyrics vuoto - il prompt style potrebbe essere cantato!',
    'Usa era anchors come "80s" o "90s" per ancorare il suono a un periodo specifico.',
    'Formula tag: Core element → Genere/Era → Tone → Effects.',
    'Per terminare meglio la canzone: [Outro] + [Coda] + [End].',
    'Il tag [Instrumental Intro] funziona meglio di [Intro] per aperture strumentali.',
    'Per i duetti: specifica chi canta con [Male voice:] e [Female voice:] nei lyrics.',
    'Cover trick: Style "Live Performance, Concert" + Weirdness 0 + Audio Influence 100.'
  ]
};
