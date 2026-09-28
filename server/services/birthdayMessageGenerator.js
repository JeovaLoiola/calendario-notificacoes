/**
 * Gerador inteligente e variado de mensagens personalizadas de aniversário
 * para funcionários, professores e equipe escolar.
 */

// Conjunto de introduções calorosas e personalizadas
const GREETINGS = [
  (name, title) => `Querido(a) ${title ? title + ' ' : ''}${name},`,
  (name) => `Parabéns pelo seu dia, ${name}! 🎉`,
  (name, title) => `Hoje é um dia de muita festa! Feliz Aniversário, ${title ? title + ' ' : ''}${name}! 🎂`,
  (name) => `Com imensa alegria e carinho celebramos o seu aniversário, ${name}! 🎈`,
  (name, title) => `Estimado(a) ${title ? title + ' ' : ''}${name}, feliz aniversário! ✨`,
  (name) => `Hoje todos os nossos aplausos e homenagens são para você, ${name}! 🥳`,
  (name) => `Que felicidade comemorar mais um ano da sua linda trajetória, ${name}! 🌟`,
  (name, title) => `Nossos mais sinceros parabéns a você, ${title ? title + ' ' : ''}${name}! 🎁`,
  (name) => `Um dia radiante e muito especial para você, ${name}! 🎊`,
  (name) => `Celebramos com muito orgulho a sua vida neste dia tão especial, ${name}! 🥂`
];

// Reconhecimento contextual baseado no cargo/função
const ROLE_APPRECIATIONS = {
  professor: [
    "Sua dedicação em sala de aula, seu amor pelo ensino e o carinho com que compartilha conhecimento transformam a vida dos nossos alunos todos os dias.",
    "A nobre missão de educar ganha ainda mais brilho com a sua paixão, paciência e sabedoria pedagógica em nossa comunidade escolar.",
    "Agradecemos de coração por ser essa presença inspiradora, que não apenas ensina lições, mas também inspira valores e sonhos para o futuro.",
    "Sua vocação docente e seu compromisso com uma educação de qualidade são verdadeiros presentes para todos nós.",
    "Seu entusiasmo pelas aulas e o cuidado com o aprendizado de cada estudante deixam um legado inestimável em nossa escola.",
    "Educar é tocar vidas para sempre, e você faz isso com uma maestria e um coração generoso admiráveis."
  ],
  coordenacao: [
    "Sua liderança acolhedora, sensibilidade e dedicação incansável em apoiar professores e estudantes fazem toda a diferença em nossa escola.",
    "Agradecemos pela visão estratégica, parceria diária e por conduzir nosso ambiente pedagógico com tanta sabedoria e empatia.",
    "Seu trabalho cuidadoso e organizador mantém nossos projetos pedagógicos sempre vivos, criativos e inspiradores.",
    "Sua capacidade de ouvir, orientar e unir nossa equipe escolar é um dos pilares mais fortes da nossa instituição."
  ],
  direcao: [
    "Sua gestão humana, visão inspiradora e compromisso com o crescimento de cada membro da nossa comunidade escolar são motivos de grande orgulho.",
    "Agradecemos pela liderança firme, justa e sempre atenta ao bem-estar coletivo de toda a nossa comunidade.",
    "Seu exemplo de responsabilidade, integridade e cuidado guia nossa instituição pelos melhores e mais promissores caminhos.",
    "Comandar uma escola exige coração e coragem, virtudes que você demonstra com excelência todos os dias."
  ],
  secretaria: [
    "Seu profissionalismo, eficiência impecável e a atenção carinhosa com que acolhe alunos, famílias e colegas tornam nossa escola mais acolhedora a cada dia.",
    "Agradecemos pela organização exemplar e pela prontidão em sempre resolver cada detalhe com um sorriso e máxima competência.",
    "Sua dedicação na gestão documental e atendimento faz com que toda a rotina escolar funcione com harmonia e excelência.",
    "Sua paciência, precisão e carinho no atendimento são fundamentais para o sucesso diário da nossa escola."
  ],
  apoio: [
    "Sua energia positiva, zelo e dedicação incansável cuidando de cada espaço da nossa escola são fundamentais para o nosso dia a dia.",
    "Agradecemos pelo carinho, respeito e por fazer da nossa escola um ambiente sempre limpo, seguro e acolhedor para todos.",
    "Seu trabalho essencial e seu sorriso diário enriquecem a nossa convivência e fortalecem nossos laços comunitários.",
    "Sua presença dedicada faz de nossa escola uma verdadeira segunda casa para alunos e funcionários."
  ],
  geral: [
    "Sua dedicação, espírito de colaboração e energia positiva contagiam a todos e enriquecem diariamente o ambiente de trabalho da nossa escola.",
    "É um imenso privilégio contar com o seu talento, competência e amizade na nossa equipe escolar.",
    "Seu profissionalismo e carinho com nossa comunidade deixam marcas preciosas em tudo o que fazemos juntos.",
    "Agradecemos por sua dedicação exemplar e pelo entusiasmo com que contribui para o sucesso e harmonia da nossa escola.",
    "Sua alegria e compromisso diário são fontes de inspiração e tornam o trabalho em equipe muito mais leve e produtivo."
  ]
};

// Votos e desejos calorosos
const WISHES = [
  "Desejamos que este novo ciclo chegue repleto de saúde abundante, paz de espírito, amor, novas conquistas e incontáveis motivos para sorrir.",
  "Que o seu novo ano seja iluminado por bênçãos sem medida, prosperidade, momentos inesquecíveis ao lado de quem você ama e muita felicidade.",
  "Que todos os seus projetos e sonhos mais lindos se realizem, trazendo renovação de forças e muitas vitórias pessoais e profissionais.",
  "Que a vida lhe retribua em dobro todo o bem, a generosidade e o carinho que você espalha por onde passa.",
  "Desejamos a você 365 novos dias de muita serenidade, realizações inspiradoras, harmonia familiar e alegrias sem fim.",
  "Que não lhe faltem motivos para celebrar hoje e sempre, com o coração em paz e a certeza do quanto você é especial para todos nós.",
  "Que este aniversário marque o início da melhor e mais feliz fase da sua vida, cheia de portas abertas e grandes realizações.",
  "Que a sua jornada continue sendo guiada por luz, sabedoria, amizades leais e infinitas alegrias ao lado da sua família."
];

// Encerramentos / Assinaturas da Comunidade Escolar
const CLOSINGS = [
  "Receba o abraço caloroso, o carinho e a profunda admiração de toda a equipe e família da escola! 🎂🎉",
  "Com muita estima, respeito e felicitações de todos os seus colegas e da direção escolar! 🎈✨",
  "Um brinde à sua vida e ao seu sucesso! Felicidades mil de toda a nossa comunidade escolar! 🥳🥂",
  "Parabéns pelo seu dia especial! Um grande e fraterno abraço da equipe escolar! 🌟👏",
  "Que seu dia seja tão maravilhoso e especial quanto você é para nossa escola! Parabéns! 🎁🎊",
  "Muitas felicidades, saúde e vida longa! Um abraço carinhoso de toda a nossa comunidade! 🍰💐"
];

// Modelos literários completos para alternância estilística
const COMPLETE_TEMPLATES = [
  (name, role) => `Hoje o dia é de festa e gratidão em nossa escola! Parabéns, ${name}! 🎉\n\nNeste dia especial, queremos agradecer imensamente pelo seu trabalho como ${role || 'integrante da nossa equipe'}, onde sua dedicação e carinho fazem toda a diferença no cotidiano escolar.\n\nQue este novo ano de vida traga saúde em abundância, paz no coração, realizações e muitas alegrias ao lado de quem você ama.\n\nReceba o abraço afetuoso e os votos de muitas felicidades de toda a equipe escolar! 🎂🎈`,
  
  (name, role) => `Feliz Aniversário, ${name}! 🎂✨\n\nCelebrar a sua vida é também celebrar o privilégio de ter você em nossa equipe${role ? ' como ' + role : ''}. Seu profissionalismo, compromisso e a leveza com que você cumpre sua missão inspiram a todos nós.\n\nDesejamos que este novo ciclo venha repleto de luz, sabedoria, vitórias e momentos inesquecíveis.\n\nUm brinde à sua história e aos seus sonhos! Parabéns de toda a comunidade escolar! 🥳🥂`,

  (name, role) => `Querido(a) ${name}, parabéns pelo seu aniversário! 🎈🌟\n\nSua presença em nosso ambiente escolar é sinônimo de dedicação, parceria e entusiasmo. Obrigado(a) por fazer da nossa escola um lugar melhor e mais acolhedor para alunos, professores e funcionários.\n\nQue a vida lhe presenteie com muita saúde, paz, prosperidade e novos projetos vitoriosos neste novo ciclo.\n\nCom todo o carinho e admiração da nossa equipe escolar! 🎉👏`,

  (name, role) => `Hoje todas as homenagens são para você, ${name}! 🎁🥳\n\nQue alegria poder compartilhar os desafios e conquistas do dia a dia com um(a) profissional tão talentoso(a) e generoso(a)${role ? ' na função de ' + role : ''}.\n\nQue o seu dia seja repleto de sorrisos sinceros, abraços apertados e que este novo ano supere todas as suas melhores expectativas.\n\nFelicidades mil hoje e sempre de todos nós da escola! 🎂✨`,

  (name, role) => `Parabéns pelo seu dia, ${name}! 🌟🎂\n\nNossa escola se alegra em comemorar a sua existência. Seu empenho, sua sensibilidade e sua dedicação deixam marcas positivas em cada um de nós.\n\nDesejamos que os caminhos à sua frente sejam cheios de paz, amor, saúde de ferro e realizações extraordinárias.\n\nReceba o abraço fraterno e as bênçãos de toda a equipe escolar! 🎉🎈`,

  (name, role) => `Um dia iluminado e repleto de comemorações para você, ${name}! 🎊🍰\n\nAgradecemos por cada contribuição, por cada gesto de companheirismo e pelo carinho que você coloca no seu trabalho${role ? ' como ' + role : ''}.\n\nQue não lhe faltem motivos para sorrir, celebrar e sonhar alto neste novo ano que se inicia.\n\nFelicitações sinceras e calorosas de todos os seus amigos da escola! 🥂✨`
];

/**
 * Normaliza o cargo para categorização pedagógica/escolar
 */
function categorizeRole(role = '') {
  const r = role.toLowerCase();
  if (r.includes('prof') || r.includes('docent') || r.includes('educad') || r.includes('ensino') || r.includes('base')) {
    return 'professor';
  }
  if (r.includes('coord') || r.includes('pedag')) {
    return 'coordenacao';
  }
  if (r.includes('diret') || r.includes('gest') || r.includes('vice')) {
    return 'direcao';
  }
  if (r.includes('secr') || r.includes('admin') || r.includes('atend') || r.includes('financeir')) {
    return 'secretaria';
  }
  if (r.includes('apoio') || r.includes('servi') || r.includes('inspet') || r.includes('limpez') || r.includes('port')) {
    return 'apoio';
  }
  return 'geral';
}

/**
 * FNV-1a hash de alta dispersão para garantir que nomes diferentes produzam sementes radicalmente diferentes
 */
function hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

/**
 * Gera uma mensagem de aniversário única e personalizada
 * @param {Object} contact - Objeto do contato { name, role, department, ... }
 * @param {Object} options - { seed, useCombinator }
 */
function generateBirthdayMessage(contact, options = {}) {
  const name = (contact?.name || 'Colega').trim();
  const role = (contact?.role || '').trim();
  const department = (contact?.department || '').trim();
  const category = categorizeRole(role);

  // Semente única de alta dispersão
  const identityStr = `${name}::${role}::${department}::${contact?.id || ''}::${contact?.birth_date || ''}`;
  const seed = options.seed !== undefined 
    ? Math.abs(Number(options.seed)) 
    : hashString(identityStr);

  const useCombinator = options.useCombinator ?? (seed % 3 !== 0);

  let message = '';

  if (useCombinator) {
    const greetingIdx = seed % GREETINGS.length;
    const greeting = GREETINGS[greetingIdx](name, category === 'professor' ? 'Professor(a)' : '');

    const roleAppreciationsList = ROLE_APPRECIATIONS[category] || ROLE_APPRECIATIONS.geral;
    const appreciationIdx = Math.abs(Math.imul(seed, 31) + 7) % roleAppreciationsList.length;
    const appreciation = roleAppreciationsList[appreciationIdx];

    const wishesIdx = Math.abs(Math.imul(seed, 17) + 13) % WISHES.length;
    const wish = WISHES[wishesIdx];

    const closingIdx = Math.abs(Math.imul(seed, 19) + 23) % CLOSINGS.length;
    const closing = CLOSINGS[closingIdx];

    message = `${greeting}\n\n${appreciation}\n\n${wish}\n\n${closing}`;
  } else {
    const templateIdx = seed % COMPLETE_TEMPLATES.length;
    message = COMPLETE_TEMPLATES[templateIdx](name, role);
  }

  return message;
}

/**
 * Gera múltiplas variações de mensagens para o usuário escolher ou alternar
 */
function generateMultipleVariations(contact, count = 4) {
  const variations = [];
  const baseSeed = hashString((contact?.name || 'contato') + (contact?.id || ''));

  for (let i = 0; i < count; i++) {
    const customSeed = baseSeed + (i * 97) + (i % 2 === 0 ? 53 : 11);
    const msg = generateBirthdayMessage(contact, { seed: customSeed, useCombinator: i % 2 === 0 });
    variations.push({
      id: i + 1,
      text: msg
    });
  }

  return variations;
}

module.exports = {
  generateBirthdayMessage,
  generateMultipleVariations,
  categorizeRole
};
