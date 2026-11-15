export type CEFRLevel = 'B1' | 'B2' | 'C1' | 'C2';

export type VocabCategory =
  | 'Academic'
  | 'Business'
  | 'Literature'
  | 'Rhetoric'
  | 'Science & Tech'
  | 'Everyday Mastery';

export interface VocabWord {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb';
  level: CEFRLevel;
  category: VocabCategory;
  definition: string;
  simpleMeaning: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
  etymology: string;
  memoryHook: string;
  collocations: string[];
}

export interface CourseModule {
  id: string;
  title: string;
  summary: string;
  durationMinutes: number;
  wordIds: string[];
  lessonTakeaway: string;
  dialoguePrompt: string;
}

export interface ExclusiveCourse {
  id: string;
  title: string;
  subtitle: string;
  level: CEFRLevel;
  image: string;
  accentColor: string;
  modules: CourseModule[];
}

export const VOCABULARY_LIBRARY: VocabWord[] = [
  {
    id: 'ephemeral',
    word: 'ephemeral',
    phonetic: '/ɪˈfɛm.ər.əl/',
    partOfSpeech: 'adjective',
    level: 'C1',
    category: 'Literature',
    definition: 'Lasting for a very short time; transitory and fleeting.',
    simpleMeaning: 'Short-lived or temporary.',
    examples: [
      'Morning mist over the valley was ephemeral, vanishing within twenty minutes of sunrise.',
      'Social media trends often feel urgent, yet most prove remarkably ephemeral.'
    ],
    synonyms: ['fleeting', 'transient', 'momentary'],
    antonyms: ['enduring', 'permanent'],
    etymology: 'From Greek ephemeros, meaning "lasting only a day".',
    memoryHook: 'Think of a mayfly that lives for a single day (hemera = day).',
    collocations: ['ephemeral beauty', 'ephemeral fame', 'ephemeral nature']
  },
  {
    id: 'pragmatic',
    word: 'pragmatic',
    phonetic: '/præɡˈmæt.ɪk/',
    partOfSpeech: 'adjective',
    level: 'B2',
    category: 'Business',
    definition: 'Dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.',
    simpleMeaning: 'Practical and focused on real results.',
    examples: [
      'Rather than rebuilding the entire platform, the engineering lead proposed a pragmatic phased rollout.',
      'A pragmatic budget prioritizes essential infrastructure before optional perks.'
    ],
    synonyms: ['practical', 'realistic', 'sensible'],
    antonyms: ['idealistic', 'impractical'],
    etymology: 'From Greek pragmatikos ("relating to fact or action"), from pragma ("deed").',
    memoryHook: 'PRAGmatic = PRACtical action over abstract theory.',
    collocations: ['pragmatic approach', 'pragmatic solution', 'pragmatic compromise']
  },
  {
    id: 'ubiquitous',
    word: 'ubiquitous',
    phonetic: '/juːˈbɪk.wɪ.təs/',
    partOfSpeech: 'adjective',
    level: 'C1',
    category: 'Science & Tech',
    definition: 'Present, appearing, or found everywhere at the same time.',
    simpleMeaning: 'Found everywhere.',
    examples: [
      'Contactless QR menus became ubiquitous across cafes within a single year.',
      'Lithium-ion batteries are now ubiquitous in portable electronics and electric vehicles.'
    ],
    synonyms: ['omnipresent', 'pervasive', 'universal'],
    antonyms: ['rare', 'scarce'],
    etymology: 'From Latin ubique, meaning "everywhere".',
    memoryHook: 'Ubi- sounds like "you be" — wherever you go, you be seeing it everywhere.',
    collocations: ['ubiquitous presence', 'become ubiquitous', 'ubiquitous computing']
  },
  {
    id: 'eloquent',
    word: 'eloquent',
    phonetic: '/ˈɛl.ə.kwənt/',
    partOfSpeech: 'adjective',
    level: 'B2',
    category: 'Rhetoric',
    definition: 'Fluent, persuasive, and moving in speaking or writing.',
    simpleMeaning: 'Speaking or writing clearly and persuasively.',
    examples: [
      'Her eloquent closing remarks persuaded even the most skeptical committee members.',
      'Sometimes a brief silence is more eloquent than a rehearsed apology.'
    ],
    synonyms: ['articulate', 'persuasive', 'expressive'],
    antonyms: ['inarticulate', 'halting'],
    etymology: 'From Latin eloqui ("to speak out"), from ex- ("out") + loqui ("to speak").',
    memoryHook: 'E-loq-uent: "loq" means speak (like dialogue, loquacious) — speaking out gracefully.',
    collocations: ['eloquent speech', 'eloquent defense', 'eloquent silence']
  },
  {
    id: 'mitigate',
    word: 'mitigate',
    phonetic: '/ˈmɪt.ɪ.ɡeɪt/',
    partOfSpeech: 'verb',
    level: 'B2',
    category: 'Business',
    definition: 'To make something less severe, harmful, or painful.',
    simpleMeaning: 'To reduce the harm or severity of something.',
    examples: [
      'Automated backups help mitigate the risk of accidental data loss during migrations.',
      'Coastal wetlands mitigate storm surges before they reach residential neighborhoods.'
    ],
    synonyms: ['alleviate', 'lessen', 'soften'],
    antonyms: ['aggravate', 'intensify'],
    etymology: 'From Latin mitigare ("to soften or tame"), from mitis ("mild").',
    memoryHook: 'Think "mild-igate" — making a harsh problem milder.',
    collocations: ['mitigate risk', 'mitigate the impact', 'mitigating factors']
  },
  {
    id: 'lucid',
    word: 'lucid',
    phonetic: '/ˈluː.sɪd/',
    partOfSpeech: 'adjective',
    level: 'C1',
    category: 'Academic',
    definition: 'Expressed clearly and easy to understand; showing mental clarity.',
    simpleMeaning: 'Crystal clear and easy to follow.',
    examples: [
      'The physicist gave a remarkably lucid explanation of quantum entanglement for general readers.',
      'Even after a twelve-hour flight, her presentation notes remained sharp and lucid.'
    ],
    synonyms: ['clear', 'coherent', 'intelligible'],
    antonyms: ['obscure', 'muddled'],
    etymology: 'From Latin lucidus ("bright, clear"), from lux ("light").',
    memoryHook: 'Lucid shares its root with "translucent" and "luminous" — full of light.',
    collocations: ['lucid explanation', 'lucid prose', 'lucid interval']
  },
  {
    id: 'resilient',
    word: 'resilient',
    phonetic: '/rɪˈzɪl.jənt/',
    partOfSpeech: 'adjective',
    level: 'B2',
    category: 'Everyday Mastery',
    definition: 'Able to withstand or recover quickly from difficult conditions or setbacks.',
    simpleMeaning: 'Quick to bounce back from hardship.',
    examples: [
      'Resilient supply chains rely on diversified regional suppliers rather than a single hub.',
      'Alpine wildflowers are surprisingly resilient despite freezing overnight winds.'
    ],
    synonyms: ['adaptable', 'tough', 'buoyant'],
    antonyms: ['fragile', 'brittle'],
    etymology: 'From Latin resilire, meaning "to leap back or rebound".',
    memoryHook: 'Re-silient = rebounds back into shape.',
    collocations: ['resilient economy', 'resilient mindset', 'resilient infrastructure']
  },
  {
    id: 'nuance',
    word: 'nuance',
    phonetic: '/ˈnjuː.ɑːns/',
    partOfSpeech: 'noun',
    level: 'C1',
    category: 'Rhetoric',
    definition: 'A subtle difference in or shade of meaning, expression, or tone.',
    simpleMeaning: 'A subtle distinction or fine detail.',
    examples: [
      'Good translation preserves not only literal facts but the emotional nuance of the original text.',
      'Without hearing his tone of voice, the text message lost its playful nuance.'
    ],
    synonyms: ['subtlety', 'shade', 'refinement'],
    antonyms: ['bluntness', 'oversimplification'],
    etymology: 'From French nuance ("shade of color"), derived from nuer ("to shade").',
    memoryHook: 'Think of a "new hint" of color or meaning.',
    collocations: ['subtle nuance', 'grasp the nuance', 'cultural nuance']
  },
  {
    id: 'ambiguous',
    word: 'ambiguous',
    phonetic: '/æmˈbɪɡ.ju.əs/',
    partOfSpeech: 'adjective',
    level: 'B2',
    category: 'Academic',
    definition: 'Open to more than one interpretation; having a double meaning or unclear intent.',
    simpleMeaning: 'Unclear because it can mean more than one thing.',
    examples: [
      'An ambiguous contract clause delayed the partnership signing by three weeks.',
      'The novel ends on an intentionally ambiguous note, leaving readers to debate the outcome.'
    ],
    synonyms: ['equivocal', 'vague', 'cryptic'],
    antonyms: ['explicit', 'unambiguous'],
    etymology: 'From Latin ambiguus ("doubtful"), from ambigere ("to wander both ways").',
    memoryHook: 'Ambi- means "both" (like ambidextrous) — pointing in two directions at once.',
    collocations: ['ambiguous phrasing', 'deliberately ambiguous', 'ambiguous outcome']
  },
  {
    id: 'catalyst',
    word: 'catalyst',
    phonetic: '/ˈkæt.əl.ɪst/',
    partOfSpeech: 'noun',
    level: 'B2',
    category: 'Science & Tech',
    definition: 'A person or thing that precipitates an event or speeds up significant change.',
    simpleMeaning: 'Something that sparks rapid change or action.',
    examples: [
      'Lower battery costs acted as a catalyst for rapid electric scooter adoption.',
      'A single candid conversation became the catalyst for reorganizing the team.'
    ],
    synonyms: ['spark', 'stimulus', 'impetus'],
    antonyms: ['hindrance', 'deterrent'],
    etymology: 'From Greek katalysis ("dissolution"), adapted into chemistry in the 19th century.',
    memoryHook: 'In chemistry, a catalyst accelerates a reaction without being consumed.',
    collocations: ['catalyst for change', 'act as a catalyst', 'economic catalyst']
  },
  {
    id: 'diligent',
    word: 'diligent',
    phonetic: '/ˈdɪl.ɪ.dʒənt/',
    partOfSpeech: 'adjective',
    level: 'B1',
    category: 'Everyday Mastery',
    definition: 'Having or showing care and conscientious effort in one\'s work or duties.',
    simpleMeaning: 'Hardworking, careful, and steady.',
    examples: [
      'Diligent daily practice of ten words outperforms cramming fifty words once a month.',
      'The auditor conducted a diligent review of every quarterly invoice.'
    ],
    synonyms: ['assiduous', 'thorough', 'industrious'],
    antonyms: ['negligent', 'careless'],
    etymology: 'From Latin diligens ("attentive, careful"), originally "choosing with care".',
    memoryHook: 'Diligent learners dig in consistently every day.',
    collocations: ['diligent research', 'diligent student', 'diligent effort']
  },
  {
    id: 'scrutinize',
    word: 'scrutinize',
    phonetic: '/ˈskruː.tɪ.naɪz/',
    partOfSpeech: 'verb',
    level: 'C1',
    category: 'Academic',
    definition: 'To examine or inspect closely and thoroughly.',
    simpleMeaning: 'To inspect very carefully.',
    examples: [
      'Peer reviewers scrutinize every statistical assumption before approving a study for publication.',
      'Investors scrutinize unit economics closely before backing a growth-stage startup.'
    ],
    synonyms: ['inspect', 'examine', 'audit'],
    antonyms: ['skim', 'overlook'],
    etymology: 'From Latin scrutinium ("a search or inquiry"), originally sorting through small pieces.',
    memoryHook: 'Picture leaning in with a magnifying glass to check every tiny screw.',
    collocations: ['scrutinize closely', 'scrutinize data', 'under public scrutiny']
  },
  {
    id: 'candid',
    word: 'candid',
    phonetic: '/ˈkæn.dɪd/',
    partOfSpeech: 'adjective',
    level: 'B2',
    category: 'Business',
    definition: 'Truthful and straightforward; frank without hidden motives.',
    simpleMeaning: 'Honest and direct.',
    examples: [
      'We appreciated her candid feedback about why the onboarding flow felt confusing.',
      'The documentary captures candid moments backstage before the orchestra takes the stage.'
    ],
    synonyms: ['frank', 'forthright', 'sincere'],
    antonyms: ['evasive', 'guarded'],
    etymology: 'From Latin candidus ("pure white, bright, honest").',
    memoryHook: 'Candid camera catches people as they truly are — unscripted and honest.',
    collocations: ['candid assessment', 'candid conversation', 'be candid with']
  },
  {
    id: 'synthesize',
    word: 'synthesize',
    phonetic: '/ˈsɪn.θə.saɪz/',
    partOfSpeech: 'verb',
    level: 'C1',
    category: 'Academic',
    definition: 'To combine separate elements, ideas, or sources into a coherent whole.',
    simpleMeaning: 'To blend separate ideas into one unified result.',
    examples: [
      'A strong executive summary synthesizes months of user interviews into three clear priorities.',
      'Plants synthesize glucose from sunlight, water, and carbon dioxide.'
    ],
    synonyms: ['integrate', 'consolidate', 'unify'],
    antonyms: ['fragment', 'dissect'],
    etymology: 'From Greek synthesis ("a putting together"), from syn- ("together") + tithenai ("place").',
    memoryHook: 'Syn- means together (like symphony, synchronize) — putting ideas together.',
    collocations: ['synthesize findings', 'synthesize information', 'synthesize perspectives']
  },
  {
    id: 'tenacious',
    word: 'tenacious',
    phonetic: '/təˈneɪ.ʃəs/',
    partOfSpeech: 'adjective',
    level: 'C1',
    category: 'Literature',
    definition: 'Tending to keep a firm hold of something; persistent and unwilling to give up.',
    simpleMeaning: 'Stubbornly determined; holding on firmly.',
    examples: [
      'Tenacious investigative reporters spent four years verifying the archival records.',
      'Ivy has a tenacious grip on brick walls even during coastal gales.'
    ],
    synonyms: ['persistent', 'determined', 'steadfast'],
    antonyms: ['irresolute', 'yielding'],
    etymology: 'From Latin tenax ("holding fast"), from tenere ("to hold").',
    memoryHook: 'Tenacious starts with TEN — holding on with all ten fingers.',
    collocations: ['tenacious pursuit', 'tenacious memory', 'tenacious defender']
  },
  {
    id: 'concise',
    word: 'concise',
    phonetic: '/kənˈsaɪs/',
    partOfSpeech: 'adjective',
    level: 'B1',
    category: 'Business',
    definition: 'Giving a lot of information clearly and in a few words; brief but comprehensive.',
    simpleMeaning: 'Short, clear, and to the point.',
    examples: [
      'Keep status updates concise so teammates can read them in under thirty seconds.',
      'A concise definition often takes more careful editing than a lengthy paragraph.'
    ],
    synonyms: ['succinct', 'terse', 'pithy'],
    antonyms: ['verbose', 'wordy'],
    etymology: 'From Latin concisus ("cut short"), from con- + caedere ("to cut").',
    memoryHook: 'Con-CISE shares a root with "incision" and "scissors" — cutting away extra words.',
    collocations: ['concise summary', 'clear and concise', 'concise phrasing']
  },
  {
    id: 'anomaly',
    word: 'anomaly',
    phonetic: '/əˈnɒm.ə.li/',
    partOfSpeech: 'noun',
    level: 'C1',
    category: 'Science & Tech',
    definition: 'Something that deviates from what is standard, normal, or expected.',
    simpleMeaning: 'An unexpected exception or irregularity.',
    examples: [
      'The telemetry team flagged a sudden midnight traffic anomaly on the European server.',
      'Warm weather in mid-January was treated as a statistical anomaly rather than a trend.'
    ],
    synonyms: ['aberration', 'irregularity', 'outlier'],
    antonyms: ['norm', 'standard'],
    etymology: 'From Greek anomalia ("unevenness"), from a- ("not") + homalos ("even").',
    memoryHook: 'A-nomaly = NOT normal.',
    collocations: ['statistical anomaly', 'detect an anomaly', 'rare anomaly']
  },
  {
    id: 'corroborate',
    word: 'corroborate',
    phonetic: '/kəˈrɒb.ə.reɪt/',
    partOfSpeech: 'verb',
    level: 'C2',
    category: 'Academic',
    definition: 'To confirm or give independent support to a statement, theory, or finding.',
    simpleMeaning: 'To back up or confirm with independent evidence.',
    examples: [
      'Tree-ring samples from three continents corroborate the historical drought timeline.',
      'Two independent witnesses corroborated the cyclist\'s account of the intersection.'
    ],
    synonyms: ['substantiate', 'verify', 'validate'],
    antonyms: ['contradict', 'refute'],
    etymology: 'From Latin corroborare ("to strengthen"), from robur ("oak, strength").',
    memoryHook: 'Co-ROBOR-ate: "robust" — making a claim stronger with a second source.',
    collocations: ['corroborate evidence', 'corroborate a claim', 'corroborating witness']
  },
  {
    id: 'disparate',
    word: 'disparate',
    phonetic: '/ˈdɪs.pər.ət/',
    partOfSpeech: 'adjective',
    level: 'C2',
    category: 'Rhetoric',
    definition: 'Essentially different in kind; not allowing meaningful comparison.',
    simpleMeaning: 'Completely different and unrelated.',
    examples: [
      'The museum exhibition unexpectedly connects disparate traditions from Kyoto and Lisbon.',
      'Our analytics tool pulls disparate datasets into a single readable dashboard.'
    ],
    synonyms: ['divergent', 'distinct', 'contrasting'],
    antonyms: ['homogeneous', 'alike'],
    etymology: 'From Latin disparatus ("separated, unequal"), from dis- + par ("equal").',
    memoryHook: 'Dis-par-ate = NOT on par (unequal / fundamentally different).',
    collocations: ['disparate sources', 'disparate groups', 'disparate viewpoints']
  },
  {
    id: 'empathy',
    word: 'empathy',
    phonetic: '/ˈɛm.pə.θi/',
    partOfSpeech: 'noun',
    level: 'B1',
    category: 'Everyday Mastery',
    definition: 'The ability to understand and share the feelings and perspective of another person.',
    simpleMeaning: 'Understanding how someone else feels from their point of view.',
    examples: [
      'User research begins with empathy—observing how people actually struggle before designing fixes.',
      'Fiction builds empathy by letting readers inhabit unfamiliar lives.'
    ],
    synonyms: ['compassion', 'understanding', 'sensitivity'],
    antonyms: ['indifference', 'apathy'],
    etymology: 'Coined in 1909 from Greek empatheia ("in-feeling"), from en- + pathos ("feeling").',
    memoryHook: 'Em-pathy = stepping INto someone else\'s feelings (unlike a-pathy = without feeling).',
    collocations: ['deep empathy', 'show empathy', 'cognitive empathy']
  },
  {
    id: 'leverage',
    word: 'leverage',
    phonetic: '/ˈlɛv.ər.ɪdʒ/',
    partOfSpeech: 'verb',
    level: 'B2',
    category: 'Business',
    definition: 'To use something already available to maximum advantage.',
    simpleMeaning: 'To put an existing strength or resource to strategic use.',
    examples: [
      'The regional bakery leveraged its loyal morning crowd to launch weekend pastry boxes.',
      'Teams can leverage shared templates to cut onboarding prep in half.'
    ],
    synonyms: ['utilize', 'harness', 'capitalize on'],
    antonyms: ['squander', 'neglect'],
    etymology: 'From Old French levier ("lever"), a tool that multiplies force.',
    memoryHook: 'Like a physical lever, small effort + smart tool = big output.',
    collocations: ['leverage expertise', 'leverage data', 'strategic leverage']
  },
  {
    id: 'serendipity',
    word: 'serendipity',
    phonetic: '/ˌsɛr.ənˈdɪp.ɪ.ti/',
    partOfSpeech: 'noun',
    level: 'C1',
    category: 'Literature',
    definition: 'The occurrence of finding valuable or pleasant things by chance when looking for something else.',
    simpleMeaning: 'A fortunate discovery made by happy accident.',
    examples: [
      'Browsing physical library shelves invites a kind of serendipity that keyword search rarely matches.',
      'Penicillin\'s discovery remains one of science\'s most celebrated moments of serendipity.'
    ],
    synonyms: ['fortuity', 'providence', 'happy accident'],
    antonyms: ['misfortune', 'design'],
    etymology: 'Coined by Horace Walpole in 1754 from the Persian fairy tale "The Three Princes of Serendip".',
    memoryHook: 'Serene + dip into something lucky by surprise.',
    collocations: ['pure serendipity', 'happy serendipity', 'design for serendipity']
  },
  {
    id: 'proliferate',
    word: 'proliferate',
    phonetic: '/prəˈlɪf.ər.eɪt/',
    partOfSpeech: 'verb',
    level: 'C1',
    category: 'Science & Tech',
    definition: 'To increase rapidly in numbers; to multiply and spread widely.',
    simpleMeaning: 'To multiply and spread rapidly.',
    examples: [
      'Neighborhood coffee roasters proliferated along the harbor after the warehouse district reopened.',
      'Open-source developer tools have proliferated across every layer of the web stack.'
    ],
    synonyms: ['multiply', 'mushroom', 'expand'],
    antonyms: ['dwindle', 'shrink'],
    etymology: 'From Latin proles ("offspring") + ferre ("to bear").',
    memoryHook: 'Pro-life-rate: producing new instances at a rapid rate.',
    collocations: ['rapidly proliferate', 'proliferate across', 'nuclear proliferation']
  },
  {
    id: 'equanimity',
    word: 'equanimity',
    phonetic: '/ˌɛk.wəˈnɪm.ɪ.ti/',
    partOfSpeech: 'noun',
    level: 'C2',
    category: 'Literature',
    definition: 'Mental calmness, composure, and evenness of temper, especially in a difficult situation.',
    simpleMeaning: 'Calmness and emotional balance under pressure.',
    examples: [
      'She handled the live server outage with remarkable equanimity, guiding the team step by step.',
      'Stoic philosophy teaches equanimity toward events outside our personal control.'
    ],
    synonyms: ['composure', 'poise', 'serenity'],
    antonyms: ['agitation', 'panic'],
    etymology: 'From Latin aequus ("equal, even") + animus ("mind, spirit").',
    memoryHook: 'Equ-anim-ity = EQUAL MIND (steady even when circumstances swing).',
    collocations: ['remarkable equanimity', 'face with equanimity', 'maintain equanimity']
  },
  {
    id: 'succinct',
    word: 'succinct',
    phonetic: '/səkˈsɪŋkt/',
    partOfSpeech: 'adjective',
    level: 'C1',
    category: 'Rhetoric',
    definition: 'Briefly and clearly expressed; packing dense meaning into minimal words.',
    simpleMeaning: 'Brief, crisp, and crystal clear.',
    examples: [
      'Her two-sentence reply was a succinct masterclass in diplomatic boundary setting.',
      'Good product copy is succinct enough to scan in two seconds.'
    ],
    synonyms: ['concise', 'compact', 'crisp'],
    antonyms: ['rambling', 'prolix'],
    etymology: 'From Latin succinctus ("tucked up, ready"), from sub- + cingere ("to gird").',
    memoryHook: 'Sounds like "sucked-in" — excess fluff sucked right out of the sentence.',
    collocations: ['succinct summary', 'succinctly put', 'succinct overview']
  },
  {
    id: 'ubiquity',
    word: 'ubiquity',
    phonetic: '/juːˈbɪk.wɪ.ti/',
    partOfSpeech: 'noun',
    level: 'C2',
    category: 'Science & Tech',
    definition: 'The fact of appearing everywhere or of being very common.',
    simpleMeaning: 'The state of being everywhere at once.',
    examples: [
      'Despite the ubiquity of video calls, teams still value meeting face-to-face twice a year.',
      'The ubiquity of smartphones reshaped how commuters read morning news.'
    ],
    synonyms: ['omnipresence', 'pervasiveness', 'universality'],
    antonyms: ['rarity', 'scarcity'],
    etymology: 'Noun form of ubiquitous, from Latin ubique ("everywhere").',
    memoryHook: 'The noun partner of "ubiquitous".',
    collocations: ['growing ubiquity', 'sheer ubiquity', 'ubiquity of screens']
  },
  {
    id: 'feasible',
    word: 'feasible',
    phonetic: '/ˈfiː.zə.bəl/',
    partOfSpeech: 'adjective',
    level: 'B2',
    category: 'Business',
    definition: 'Possible and practical to do easily or conveniently.',
    simpleMeaning: 'Doable and realistic given current constraints.',
    examples: [
      'Converting the courtyard into a solar microgrid proved financially feasible within five years.',
      'Is it feasible to ship the localization update before Friday\'s release?'
    ],
    synonyms: ['viable', 'achievable', 'practicable'],
    antonyms: ['unworkable', 'impossible'],
    etymology: 'From Old French faisible ("capable of being done"), from faire ("to do").',
    memoryHook: 'Feas-ible = fixable / doable.',
    collocations: ['economically feasible', 'technically feasible', 'feasible timeline']
  },
  {
    id: 'cogent',
    word: 'cogent',
    phonetic: '/ˈkəʊ.dʒənt/',
    partOfSpeech: 'adjective',
    level: 'C2',
    category: 'Rhetoric',
    definition: 'Clear, logical, and convincing in argument.',
    simpleMeaning: 'So clear and logical that it convinces you.',
    examples: [
      'The policy memo presented a cogent case for shifting transit funds toward rail maintenance.',
      'Even critics conceded that his rebuttal was fair and cogent.'
    ],
    synonyms: ['compelling', 'persuasive', 'forceful'],
    antonyms: ['unconvincing', 'feeble'],
    etymology: 'From Latin cogere ("to drive together, compel").',
    memoryHook: 'Co-gent = a coherent, gentle-yet-compelling argument.',
    collocations: ['cogent argument', 'cogent reasoning', 'cogent critique']
  },
  {
    id: 'alleviate',
    word: 'alleviate',
    phonetic: '/əˈliː.vi.eɪt/',
    partOfSpeech: 'verb',
    level: 'B2',
    category: 'Everyday Mastery',
    definition: 'To make suffering, deficiency, or a problem less severe.',
    simpleMeaning: 'To ease pain, stress, or difficulty.',
    examples: [
      'Dedicated bike lanes help alleviate rush-hour congestion on central avenues.',
      'Clear milestone checklists alleviate anxiety before major product launches.'
    ],
    synonyms: ['relieve', 'ease', 'soothe'],
    antonyms: ['worsen', 'exacerbate'],
    etymology: 'From Latin alleviare ("to lighten"), from levis ("light in weight").',
    memoryHook: 'Al-LEVI-ate = make lighter (like levitate!).',
    collocations: ['alleviate symptoms', 'alleviate pressure', 'alleviate poverty']
  },
  {
    id: 'exacerbate',
    word: 'exacerbate',
    phonetic: '/ɪɡˈzæs.ə.beɪt/',
    partOfSpeech: 'verb',
    level: 'C1',
    category: 'Academic',
    definition: 'To make a problem, bad situation, or negative feeling worse.',
    simpleMeaning: 'To make an already bad situation worse.',
    examples: [
      'Sending vague error alerts only exacerbates confusion during an incident.',
      'Unplanned urban paving can exacerbate seasonal flooding.'
    ],
    synonyms: ['aggravate', 'worsen', 'inflame'],
    antonyms: ['alleviate', 'ameliorate'],
    etymology: 'From Latin exacerbare ("to make harsh or bitter"), from acerbus ("bitter").',
    memoryHook: 'Ex-ACERB-ate: acerbic = bitter/sharp — making a sore spot even sharper.',
    collocations: ['exacerbate tensions', 'exacerbate inequality', 'further exacerbate']
  },
  {
    id: 'articulate',
    word: 'articulate',
    phonetic: '/ɑːˈtɪk.jʊ.lət/',
    partOfSpeech: 'verb',
    level: 'B2',
    category: 'Rhetoric',
    definition: 'To express an idea or feeling fluently and coherently.',
    simpleMeaning: 'To put complex thoughts into clear words.',
    examples: [
      'Founders who articulate a clear problem statement attract stronger early collaborators.',
      'Journalists help articulate concerns that communities feel but struggle to name.'
    ],
    synonyms: ['express', 'voice', 'enunciate'],
    antonyms: ['mumble', 'suppress'],
    etymology: 'From Latin articulare ("to divide into distinct joints or words").',
    memoryHook: 'Like articulated joints in a finger — speaking with clear, distinct precision.',
    collocations: ['articulate a vision', 'clearly articulate', 'well-articulated']
  },
  {
    id: 'transient',
    word: 'transient',
    phonetic: '/ˈtræn.zi.ənt/',
    partOfSpeech: 'adjective',
    level: 'C1',
    category: 'Science & Tech',
    definition: 'Lasting only for a short time; impermanent and passing through.',
    simpleMeaning: 'Temporary; passing quickly.',
    examples: [
      'The monitoring dashboard filters out transient network blips lasting under two seconds.',
      'Autumn colors are famously transient, peaking for barely a fortnight.'
    ],
    synonyms: ['temporary', 'brief', 'ephemeral'],
    antonyms: ['permanent', 'lasting'],
    etymology: 'From Latin transire ("to go across, pass").',
    memoryHook: 'Trans-ient = in transit, just passing through.',
    collocations: ['transient error', 'transient phase', 'transient population']
  },
  {
    id: 'exemplify',
    word: 'exemplify',
    phonetic: '/ɪɡˈzɛm.plɪ.faɪ/',
    partOfSpeech: 'verb',
    level: 'B2',
    category: 'Academic',
    definition: 'To be a typical or outstanding example of something.',
    simpleMeaning: 'To serve as a clear example of.',
    examples: [
      'Kyoto\'s wooden machiya townhouses exemplify centuries-old passive climate design.',
      'Her mentorship style exemplifies patience paired with high expectations.'
    ],
    synonyms: ['illustrate', 'embody', 'demonstrate'],
    antonyms: ['misrepresent', 'contradict'],
    etymology: 'From Latin exemplum ("example") + facere ("to make").',
    memoryHook: 'Literally "make an EXAMPLE of".',
    collocations: ['exemplify excellence', 'best exemplified by', 'exemplify a trend']
  },
  {
    id: 'paradigm',
    word: 'paradigm',
    phonetic: '/ˈpær.ə.daɪm/',
    partOfSpeech: 'noun',
    level: 'C1',
    category: 'Science & Tech',
    definition: 'A typical example, pattern, or underlying framework of something.',
    simpleMeaning: 'A dominant model or way of thinking.',
    examples: [
      'Cloud computing introduced a new paradigm for scaling software without owning hardware.',
      'Prevention-first healthcare represents a paradigm shift from reactive treatment.'
    ],
    synonyms: ['model', 'framework', 'archetype'],
    antonyms: ['deviation', 'exception'],
    etymology: 'From Greek paradeigma ("pattern, model"), from paradeiknunai ("to show side by side").',
    memoryHook: 'Para-digm = a guiding pattern (note the silent "g"!).',
    collocations: ['paradigm shift', 'dominant paradigm', 'new paradigm']
  },
  {
    id: 'meticulous',
    word: 'meticulous',
    phonetic: '/məˈtɪk.jʊ.ləs/',
    partOfSpeech: 'adjective',
    level: 'C1',
    category: 'Everyday Mastery',
    definition: 'Showing great attention to detail; very careful and precise.',
    simpleMeaning: 'Extremely careful about every small detail.',
    examples: [
      'Watchmakers rely on meticulous hand assembly where fractions of a millimeter matter.',
      'She kept meticulous lab notebooks dating back to her first undergraduate experiment.'
    ],
    synonyms: ['scrupulous', 'exacting', 'fastidious'],
    antonyms: ['sloppy', 'haphazard'],
    etymology: 'From Latin meticulosus ("fearful"), evolving to mean "anxiously careful about details".',
    memoryHook: 'Meticulous = mindful of every tiny tick and speck.',
    collocations: ['meticulous attention', 'meticulous planning', 'meticulously crafted']
  },
  {
    id: 'discern',
    word: 'discern',
    phonetic: '/dɪˈsɜːn/',
    partOfSpeech: 'verb',
    level: 'C1',
    category: 'Literature',
    definition: 'To perceive, recognize, or distinguish something with difficulty or keen insight.',
    simpleMeaning: 'To notice or tell apart clearly.',
    examples: [
      'Through the morning fog, the sailors could barely discern the lighthouse silhouette.',
      'Experienced editors quickly discern whether an argument rests on evidence or rhetoric.'
    ],
    synonyms: ['perceive', 'distinguish', 'detect'],
    antonyms: ['overlook', 'confuse'],
    etymology: 'From Latin discernere ("to separate, distinguish"), from dis- + cernere ("sift").',
    memoryHook: 'Dis-cern = separate truth from noise.',
    collocations: ['discern a pattern', 'hard to discern', 'discerning reader']
  },
  {
    id: 'viable',
    word: 'viable',
    phonetic: '/ˈvaɪ.ə.bəl/',
    partOfSpeech: 'adjective',
    level: 'B2',
    category: 'Business',
    definition: 'Capable of working successfully; feasible and sustainable.',
    simpleMeaning: 'Workable and likely to succeed.',
    examples: [
      'Subscription pricing made independent journalism financially viable again.',
      'Rail freight remains the most viable option for heavy cross-country cargo.'
    ],
    synonyms: ['feasible', 'workable', 'sustainable'],
    antonyms: ['unviable', 'impractical'],
    etymology: 'From French viable ("capable of life"), from vie ("life").',
    memoryHook: 'Vi-able = full of LIFE (vita), able to survive and work.',
    collocations: ['economically viable', 'viable alternative', 'minimum viable']
  },
  {
    id: 'reticent',
    word: 'reticent',
    phonetic: '/ˈrɛt.ɪ.sənt/',
    partOfSpeech: 'adjective',
    level: 'C2',
    category: 'Literature',
    definition: 'Not revealing one\'s thoughts or feelings readily; reserved in speech.',
    simpleMeaning: 'Quiet and hesitant to speak openly.',
    examples: [
      'He was reticent about his early career struggles until asked directly during the interview.',
      'Witnesses are often reticent in group meetings but candid in one-on-one interviews.'
    ],
    synonyms: ['reserved', 'taciturn', 'guarded'],
    antonyms: ['loquacious', 'forthcoming'],
    etymology: 'From Latin reticere ("to keep silent"), from re- + tacere ("be silent").',
    memoryHook: 'Reticent = reluctant to tell.',
    collocations: ['reticent about', 'remarkably reticent', 'naturally reticent']
  },
  {
    id: 'quintessential',
    word: 'quintessential',
    phonetic: '/ˌkwɪn.tɪˈsɛn.ʃəl/',
    partOfSpeech: 'adjective',
    level: 'C2',
    category: 'Rhetoric',
    definition: 'Representing the most perfect or typical example of a quality or class.',
    simpleMeaning: 'The purest, most classic example of something.',
    examples: [
      'A crisp white shirt and tailored blazer remain the quintessential interview outfit.',
      'Darjeeling first-flush tea is the quintessential spring harvest for tea connoisseurs.'
    ],
    synonyms: ['archetypal', 'classic', 'definitive'],
    antonyms: ['atypical', 'uncharacteristic'],
    etymology: 'From medieval Latin quinta essentia ("fifth essence"), the purest element beyond earth, air, fire, and water.',
    memoryHook: 'Quint (5th) + essential = the purest fifth essence.',
    collocations: ['quintessential example', 'quintessential classic', 'quintessential experience']
  },
  {
    id: 'bolster',
    word: 'bolster',
    phonetic: '/ˈbəʊl.stər/',
    partOfSpeech: 'verb',
    level: 'B2',
    category: 'Business',
    definition: 'To support, strengthen, or prop up something that needs reinforcement.',
    simpleMeaning: 'To strengthen or give extra support.',
    examples: [
      'Verified customer case studies bolster confidence before enterprise buyers sign contracts.',
      'Adding two regional warehouses bolstered next-day delivery reliability.'
    ],
    synonyms: ['reinforce', 'fortify', 'strengthen'],
    antonyms: ['undermine', 'weaken'],
    etymology: 'From Old English bolster ("a long supportive pillow or beam").',
    memoryHook: 'A bolster is a firm cylindrical cushion that props you up.',
    collocations: ['bolster confidence', 'bolster support', 'bolster defenses']
  },
  {
    id: 'pervasive',
    word: 'pervasive',
    phonetic: '/pəˈveɪ.sɪv/',
    partOfSpeech: 'adjective',
    level: 'C1',
    category: 'Academic',
    definition: 'Spreading widely throughout an area or a group of people.',
    simpleMeaning: 'Spreading through every part of something.',
    examples: [
      'A pervasive sense of curiosity defines the best research laboratories.',
      'Microplastics have become a pervasive environmental concern from deep oceans to alpine snow.'
    ],
    synonyms: ['widespread', 'ubiquitous', 'prevalent'],
    antonyms: ['localized', 'rare'],
    etymology: 'From Latin pervadere ("to go through"), from per- ("through") + vadere ("go").',
    memoryHook: 'Per-VADE = invades/permeates all the way through.',
    collocations: ['pervasive influence', 'pervasive myth', 'pervasive issue']
  },
  {
    id: 'alacrity',
    word: 'alacrity',
    phonetic: '/əˈlæk.rɪ.ti/',
    partOfSpeech: 'noun',
    level: 'C2',
    category: 'Literature',
    definition: 'Brisk and cheerful readiness to do something.',
    simpleMeaning: 'Eager, cheerful enthusiasm.',
    examples: [
      'She accepted the unexpected invitation to keynote the summit with alacrity.',
      'The volunteers unpacked the emergency medical supplies with quiet alacrity.'
    ],
    synonyms: ['eagerness', 'readiness', 'zeal'],
    antonyms: ['reluctance', 'lethargy'],
    etymology: 'From Latin alacritas ("liveliness, eagerness"), from alacer ("brisk").',
    memoryHook: 'Think of "a-lively-ity" — brisk, cheerful speed.',
    collocations: ['accept with alacrity', 'respond with alacrity', 'surprising alacrity']
  },
  {
    id: 'juxtapose',
    word: 'juxtapose',
    phonetic: '/ˌdʒʌk.stəˈpəʊz/',
    partOfSpeech: 'verb',
    level: 'C1',
    category: 'Rhetoric',
    definition: 'To place or deal with close together for contrasting effect.',
    simpleMeaning: 'To place two things side by side to compare or contrast.',
    examples: [
      'The photo essay juxtaposes 1920s streetcars with modern elevated light rail.',
      'Juxtaposing quarterly revenue against customer churn revealed an urgent retention gap.'
    ],
    synonyms: ['contrast', 'compare', 'set side by side'],
    antonyms: ['separate', 'isolate'],
    etymology: 'From Latin juxta ("next to") + French poser ("to place").',
    memoryHook: 'Juxta = next to + pose = place -> place right next to each other.',
    collocations: ['juxtapose ideas', 'sharply juxtaposed', 'juxtapose images']
  },
  {
    id: 'expedite',
    word: 'expedite',
    phonetic: '/ˈɛk.spə.daɪt/',
    partOfSpeech: 'verb',
    level: 'B2',
    category: 'Business',
    definition: 'To make an action or process happen sooner or be accomplished more quickly.',
    simpleMeaning: 'To speed up a process or task.',
    examples: [
      'Pre-filling customs declarations online helps expedite airport arrivals.',
      'Clear bug reproduction steps expedite engineering fixes.'
    ],
    synonyms: ['accelerate', 'hasten', 'fast-track'],
    antonyms: ['delay', 'impede'],
    etymology: 'From Latin expedire ("to free the feet from fetters"), from ex- + pes ("foot").',
    memoryHook: 'Ex-PED-ite = free your feet (ped = foot) so you can move faster!',
    collocations: ['expedite delivery', 'expedite approval', 'expedite the process']
  },
  {
    id: 'astute',
    word: 'astute',
    phonetic: '/əˈstjuːt/',
    partOfSpeech: 'adjective',
    level: 'C1',
    category: 'Everyday Mastery',
    definition: 'Having or showing an ability to accurately assess situations or people and turn this to one\'s advantage.',
    simpleMeaning: 'Sharp, perceptive, and quick to judge wisely.',
    examples: [
      'An astute observer notices what goes unsaid during a negotiation.',
      'Her astute reading of demographic trends guided the company\'s expansion.'
    ],
    synonyms: ['shrewd', 'perceptive', 'sagacious'],
    antonyms: ['naive', 'obtuse'],
    etymology: 'From Latin astutus ("crafty, clever"), from astus ("skill, craft").',
    memoryHook: 'A-stute sounds like "a student" who observes everything sharply.',
    collocations: ['astute observation', 'astute investor', 'politically astute']
  },
  {
    id: 'ubiquitous_2',
    word: 'ameliorate',
    phonetic: '/əˈmiːl.jə.reɪt/',
    partOfSpeech: 'verb',
    level: 'C2',
    category: 'Academic',
    definition: 'To make something bad or unsatisfactory better.',
    simpleMeaning: 'To improve a difficult or flawed situation.',
    examples: [
      'Urban tree canopies significantly ameliorate summer heat-island temperatures.',
      'Clearer rubric feedback helped ameliorate student frustration over grading.'
    ],
    synonyms: ['improve', 'enhance', 'mitigate'],
    antonyms: ['worsen', 'aggravate'],
    etymology: 'From Latin melior ("better"), via French améliorer.',
    memoryHook: 'A-MELIOR-ate: "melior" means better (like "mejor" in Spanish).',
    collocations: ['ameliorate conditions', 'ameliorate the effects', 'ameliorate poverty']
  },
  {
    id: 'candor',
    word: 'candor',
    phonetic: '/ˈkæn.dər/',
    partOfSpeech: 'noun',
    level: 'C1',
    category: 'Everyday Mastery',
    definition: 'The quality of being open and honest in expression; frankness.',
    simpleMeaning: 'Refreshingly direct honesty.',
    examples: [
      'Team retrospectives only work when everyone speaks with respectful candor.',
      'The memoir is praised for the disarming candor of its opening chapters.'
    ],
    synonyms: ['frankness', 'openness', 'honesty'],
    antonyms: ['deceit', 'evasion'],
    etymology: 'From Latin candor ("whiteness, clarity, sincerity").',
    memoryHook: 'Noun form of "candid".',
    collocations: ['refreshing candor', 'speak with candor', 'brutal candor']
  },
  {
    id: 'empirical',
    word: 'empirical',
    phonetic: '/ɪmˈpɪr.ɪ.kəl/',
    partOfSpeech: 'adjective',
    level: 'C1',
    category: 'Science & Tech',
    definition: 'Based on, concerned with, or verifiable by observation or experience rather than theory alone.',
    simpleMeaning: 'Proven by real observation and data, not just theory.',
    examples: [
      'A/B testing provides empirical evidence of which headline actually improves comprehension.',
      'Empirical research requires repeatable measurements under controlled conditions.'
    ],
    synonyms: ['experimental', 'observed', 'evidence-based'],
    antonyms: ['theoretical', 'speculative'],
    etymology: 'From Greek empeirikos ("experienced"), from peira ("trial, test").',
    memoryHook: 'Empiric = based on experiment and experience.',
    collocations: ['empirical evidence', 'empirical study', 'empirical data']
  }
];

export const EXCLUSIVE_COURSES: ExclusiveCourse[] = [
  {
    id: 'business-fluency',
    title: 'Executive & Business Fluency',
    subtitle: 'Lead high-stakes meetings, strategic memos, and cross-functional negotiations with precision.',
    level: 'B2',
    image: '/src/assets/images/course_business_fluency_1794762022826.jpg',
    accentColor: 'indigo',
    modules: [
      {
        id: 'biz-m1',
        title: '01. Framing Pragmatic Decisions',
        summary: 'Replace vague corporate jargon with crisp, credible verbs for risk and strategy.',
        durationMinutes: 12,
        wordIds: ['pragmatic', 'mitigate', 'feasible', 'viable'],
        lessonTakeaway: 'Executives trust speakers who name trade-offs explicitly. Pair "pragmatic" with concrete constraints, and use "mitigate" rather than "fix" when discussing residual risk.',
        dialoguePrompt: 'Instead of "We will try to solve the server issue," say "We have a pragmatic phased plan to mitigate downtime risk within a feasible 48-hour window."'
      },
      {
        id: 'biz-m2',
        title: '02. Candid Stakeholder Alignment',
        summary: 'Deliver direct feedback and strengthen proposals without sounding confrontational.',
        durationMinutes: 14,
        wordIds: ['candid', 'bolster', 'concise', 'leverage'],
        lessonTakeaway: 'High-trust teams pair candor with constructive evidence. Use "bolster" when reinforcing a teammate\'s argument with data.',
        dialoguePrompt: 'Instead of "I disagree with your slide," say "To be candid, leveraging last quarter\'s retention numbers would bolster this slide\'s central claim."'
      },
      {
        id: 'biz-m3',
        title: '03. Accelerating Execution',
        summary: 'Communicate urgency, catalyst moments, and operational bottlenecks clearly.',
        durationMinutes: 10,
        wordIds: ['expedite', 'catalyst', 'resilient', 'astute'],
        lessonTakeaway: '"Expedite" signals purposeful speed without panic; "catalyst" frames a single decision as a multiplier for team momentum.',
        dialoguePrompt: 'Instead of "Let\'s hurry this up," say "Approving the API spec today will expedite partner onboarding and act as a catalyst for Q4 launches."'
      }
    ]
  },
  {
    id: 'academic-gre',
    title: 'Academic & GRE Mastery',
    subtitle: 'Deconstruct dense scholarly texts, build airtight arguments, and master high-frequency C1–C2 lexis.',
    level: 'C1',
    image: '/src/assets/images/course_academic_gre_1794762023128.jpg',
    accentColor: 'emerald',
    modules: [
      {
        id: 'acad-m1',
        title: '01. Evidence & Verification',
        summary: 'Precision verbs for evaluating datasets, peer-reviewed studies, and conflicting claims.',
        durationMinutes: 15,
        wordIds: ['empirical', 'corroborate', 'scrutinize', 'anomaly'],
        lessonTakeaway: 'Academic writing distinguishes observation from inference: data is empirical, independent sources corroborate, and researchers scrutinize anomalies.',
        dialoguePrompt: 'Model thesis: "Although initial readings flagged an anomaly, subsequent empirical trials corroborated the primary hypothesis."'
      },
      {
        id: 'acad-m2',
        title: '02. Synthesis & Clarity',
        summary: 'Weave disparate sources into a lucid, cogent literature review.',
        durationMinutes: 16,
        wordIds: ['synthesize', 'lucid', 'cogent', 'paradigm'],
        lessonTakeaway: 'Strong essays never merely summarize sources sequentially—they synthesize disparate findings into a cogent new framework.',
        dialoguePrompt: 'Model transition: "Taken together, these papers synthesize three decades of fieldwork into a remarkably lucid new paradigm."'
      },
      {
        id: 'acad-m3',
        title: '03. Diagnosing Complexity',
        summary: 'Articulate systemic causes without oversimplifying nuance.',
        durationMinutes: 14,
        wordIds: ['exacerbate', 'ameliorate', 'pervasive', 'ambiguous'],
        lessonTakeaway: 'Pairs like exacerbate/ameliorate allow crisp cause-and-effect contrast in policy and scientific abstracts.',
        dialoguePrompt: 'Model contrast: "While blanket subsidies exacerbated price distortion, targeted grants helped ameliorate regional shortages."'
      }
    ]
  },
  {
    id: 'literary-expression',
    title: 'Literary & Idiomatic Expression',
    subtitle: 'Elevate essays, storytelling, and reflective writing with vivid texture, rhythm, and tonal subtlety.',
    level: 'C2',
    image: '/src/assets/images/course_literary_expression_1794762024189.jpg',
    accentColor: 'amber',
    modules: [
      {
        id: 'lit-m1',
        title: '01. Capturing Time & Stillness',
        summary: 'Express fleeting beauty, quiet poise, and emotional restraint in prose.',
        durationMinutes: 12,
        wordIds: ['ephemeral', 'transient', 'equanimity', 'serendipity'],
        lessonTakeaway: 'Notice the contrast between "ephemeral" (poetic transience, like blossoms or light) and "transient" (technical or passing duration).',
        dialoguePrompt: 'Prose study: "He met the ephemeral triumph with characteristic equanimity, crediting serendipity as much as craft."'
      },
      {
        id: 'lit-m2',
        title: '02. Shade, Contrast & Voice',
        summary: 'Use subtle contrasts and vivid character descriptors with precision.',
        durationMinutes: 14,
        wordIds: ['nuance', 'juxtapose', 'reticent', 'tenacious'],
        lessonTakeaway: 'Great character portraits juxtapose outward restraint ("reticent") with inner resolve ("tenacious").',
        dialoguePrompt: 'Prose study: "Her reticent demeanor masked a tenacious curiosity that caught every conversational nuance."'
      },
      {
        id: 'lit-m3',
        title: '03. Rhetoric & Timeless Style',
        summary: 'Craft memorable, quintessential sentences with effortless rhythm.',
        durationMinutes: 13,
        wordIds: ['eloquent', 'quintessential', 'alacrity', 'disparate'],
        lessonTakeaway: 'Pairing Latinate nouns like "alacrity" with concrete verbs keeps literary prose crisp rather than ornate.',
        dialoguePrompt: 'Prose study: "The essayist wove disparate memoirs into an eloquent, quintessential portrait of postwar London."'
      }
    ]
  }
];

export function getWordOfTheDay(date = new Date()): VocabWord {
  const daySeed =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return VOCABULARY_LIBRARY[daySeed % VOCABULARY_LIBRARY.length];
}

export function getDailyCuratedWords(date = new Date(), count = 5): VocabWord[] {
  const daySeed =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const start = daySeed % VOCABULARY_LIBRARY.length;
  const result: VocabWord[] = [];
  for (let i = 0; i < count; i++) {
    result.push(VOCABULARY_LIBRARY[(start + i * 3) % VOCABULARY_LIBRARY.length]);
  }
  return result;
}

export function getTodayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function speakEnglishText(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.94;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis errors on unsupported browsers
  }
}
