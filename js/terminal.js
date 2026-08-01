const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const typedLines = [...document.querySelectorAll('[data-type]')];
const revealBlocks = [...document.querySelectorAll('[data-reveal]')];
const form = document.getElementById('terminal-form');
const input = document.getElementById('terminal-input');
const goose = document.querySelector('.goose-drawing');
const gooseArt = goose.querySelector('.goose-art');
const bootOutput = document.getElementById('boot-output');
const terminalOutput = document.getElementById('terminal-output');
const commandHistory = [];

const resizeInput = () => {
  input.style.width = input.value ? `${input.value.length}ch` : '1px';
};

input.addEventListener('input', resizeInput);
resizeInput();

const prepareLine = (element, startTime, events) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const segments = [];
  let revealTime = startTime;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement.closest('.prompt-symbol')) {
      segments.push({ node, text: node.data });
    }
  }

  for (const segment of segments) {
    const fragment = document.createDocumentFragment();

    for (const character of segment.text) {
      const characterElement = document.createElement('span');
      characterElement.textContent = character;
      characterElement.style.opacity = '0';
      fragment.append(characterElement);
      events.push({ element: characterElement, revealTime });
      revealTime += character === ' ' ? 8 : 18;
    }

    segment.node.replaceWith(fragment);
  }

  return revealTime;
};

const boot = () => {
  revealBlocks.forEach((block) => { block.hidden = true; });
  typedLines.forEach((line) => { line.style.visibility = 'hidden'; });

  if (reducedMotion) {
    revealBlocks.forEach((block) => { block.hidden = false; });
    typedLines.forEach((line) => { line.style.visibility = 'visible'; });
    form.classList.add('ready');
    input.focus({ preventScroll: true });
  } else {
    const characterEvents = [];
    const lineEvents = [];
    let timeline = 120;
    let identityRevealTime = 0;

    typedLines.forEach((line, index) => {
      if (index === 0) {
        lineEvents.push({ line, revealTime: timeline });
        timeline = prepareLine(line, timeline, characterEvents) + 40;
        identityRevealTime = timeline;
        timeline += 1100;
      } else {
        lineEvents.push({ line, revealTime: timeline });
        timeline = prepareLine(line, timeline, characterEvents) + 120;
      }
    });

    const startTime = performance.now();
    let characterIndex = 0;
    let lineIndex = 0;
    let identityRevealed = false;

    const update = () => {
      const elapsed = performance.now() - startTime;

      if (!identityRevealed && elapsed >= identityRevealTime) {
        revealBlocks.forEach((block) => { block.hidden = false; });
        identityRevealed = true;
      }

      if (identityRevealed) {
        const printProgress = Math.min(1, (elapsed - identityRevealTime) / 1100);
        goose.style.opacity = String(printProgress > 0 ? 1 : 0);
        gooseArt.style.clipPath = `inset(0 ${(1 - printProgress) * 100}% 0 0)`;
      }

      while (lineIndex < lineEvents.length && lineEvents[lineIndex].revealTime <= elapsed) {
        lineEvents[lineIndex].line.style.visibility = 'visible';
        lineIndex += 1;
      }

      while (characterIndex < characterEvents.length && characterEvents[characterIndex].revealTime <= elapsed) {
        characterEvents[characterIndex].element.style.opacity = '1';
        characterIndex += 1;
      }

      if (elapsed >= timeline) {
        goose.style.opacity = '1';
        gooseArt.style.clipPath = 'inset(0)';
        form.classList.add('ready');
        input.focus({ preventScroll: true });
        return;
      }

      window.requestAnimationFrame(update);
    };

    window.requestAnimationFrame(update);
    return;
  }

};

const createElement = (tagName, className, text) => {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

const appendCommandEntry = (command) => {
  form.style.marginTop = '20px';
  const entry = createElement('section', 'command-entry');
  const echo = createElement('div', 'command-echo');
  echo.append(createElement('span', 'prompt-symbol', '$'), ` ${command}`);

  const result = createElement('div', 'command-result');
  entry.append(echo, result);
  terminalOutput.append(entry);
  return result;
};

const appendParagraphs = (container, paragraphs) => {
  paragraphs.forEach((text) => container.append(createElement('p', '', text)));
};

const renderHelp = (container) => {
  const sections = [
    {
      title: 'GOOSY PROFILE',
      commands: [
        ['sudo whoami', 'View agent information and files'],
        ['ping goosy', 'Locate and contact the agent'],
        ['goosy --evals', 'Display verified evaluation results'],
        ['traceroute goosy', 'Find Goosy servers around the world'],
      ],
    },
    {
      title: 'AGENT DIAGNOSTICS',
      commands: [
        ['/skills', 'Display installed capabilities'],
        ['/memory', 'Check memory status'],
        ['/usage', 'Inspect resource allocation'],
        ['/subscription', 'Upgrade to Goosy Pro'],
      ],
    },
    {
      title: 'SESSION',
      commands: [
        ['history', 'Show commands entered during this session'],
        ['clear', 'Clear the terminal'],
        ['exit', 'Return to the selector'],
      ],
    },
  ];

  sections.forEach(({ title, commands }) => {
    const section = createElement('section', 'help-section');
    section.append(createElement('div', 'output-title', title));
    const grid = createElement('div', 'help-grid');

    commands.forEach(([command, description]) => {
      grid.append(
        createElement('span', 'help-command', command),
        createElement('span', 'help-description', description)
      );
    });

    section.append(grid);
    container.append(section);
  });
};

const createLink = (label, href, className = 'terminal-link') => {
  const link = createElement('a', className, label);
  link.href = href;
  if (!href.startsWith('mailto:')) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  return link;
};

const renderWhoAmI = (container) => {
  container.append(createElement('div', 'output-title', 'Siyuan Gong (龚思元)'));
  const data = createElement('div', 'profile-data');
  [
    ['Type', 'coding agent'],
    ['Developers', 'Zhejiang University × UIUC'],
    ['Domain', 'Computer Engineering'],
    ['Release', 'June 2027'],
    ['Status', 'still training'],
  ].forEach(([key, value]) => {
    data.append(
      createElement('span', 'profile-key', key),
      createElement('span', 'profile-value', value)
    );
  });

  const files = createElement('section', 'agent-files');
  files.append(createElement('div', 'output-title', 'AGENT FILES'));
  const fileList = createElement('div', 'agent-file-list');

  const modelCard = createElement('div', 'agent-file');
  modelCard.append(
    createLink('model-card.pdf ↗', '../file/CV.pdf'),
    createElement('span', 'file-description', 'Identity, capabilities, and deployment history')
  );

  const trainingRecords = createElement('div', 'agent-file');
  trainingRecords.append(createElement('span', 'skill-name', 'training-records/'));
  const trainingTree = createElement('div', 'training-tree');
  trainingTree.append(
    createLink('├── uiuc-evaluation.pdf ↗', '../file/UIUC_Transcript.pdf'),
    createLink('└── zju-evaluation.pdf ↗', '../file/ZJU_Transcript.pdf')
  );
  trainingRecords.append(trainingTree);

  fileList.append(modelCard, trainingRecords);
  files.append(fileList);
  container.append(data, files);
};

const createContactLink = (label, href, iconClass, title) => {
  const link = createLink(label, href, 'contact-link');
  link.title = title;
  const icon = createElement('i', iconClass);
  icon.setAttribute('aria-hidden', 'true');
  link.prepend(icon);
  return link;
};

const renderPing = (container) => {
  container.append(createElement('div', 'output-title', 'PING goosy...'));
  const meta = createElement('div', 'ping-meta');
  meta.append(
    createElement('span', 'profile-key', 'Latency'),
    createElement('span', 'profile-value', '42ms')
  );

  const contacts = createElement('div', 'contact-links');
  contacts.append(
    createContactLink('Email', 'mailto:siyuang3@illinois.edu', 'fas fa-envelope', 'siyuang3@illinois.edu'),
    createContactLink('GitHub', 'https://github.com/Gooosy', 'fab fa-github', 'github.com/Gooosy'),
    createContactLink('LinkedIn', 'https://www.linkedin.com/in/siyuan-gong-38373833a', 'fab fa-linkedin', 'Siyuan Gong on LinkedIn'),
    createContactLink('Discord', 'https://discord.com/users/goosy_42', 'fab fa-discord', 'goosy_42 on Discord')
  );
  container.append(meta, contacts);
};

const renderEvaluations = (container) => {
  container.append(createElement('div', 'output-title', 'AGENT EVALUATION RESULTS'));
  const evaluations = [
    ['GLOBAL', 'TIME Person of the Year', '2006', 'https://time.com/6258607/you-time-person-of-the-year-2006/'],
    ['SPECIAL', 'Touching China Person of the Year · 感动中国人物', '2008', 'https://www.12371.cn/2013/08/23/ARTI1377223581442821.shtml'],
    ['VERIFIED', 'National Scholarship', '2024 · 2025'],
    ['VERIFIED', "Dean's List · UIUC", '2024 · 2025'],
    ['GOLD', 'iGEM · iZJU-China', '2024'],
    ['MERIT', 'Mathematical Contest in Modeling', '2024'],
    ['FIRST', 'Scholarship for Academic Excellence', '2024'],
  ];
  const list = createElement('div', 'eval-list');

  evaluations.forEach(([badge, name, year, evidence]) => {
    const entry = createElement('section', 'eval-entry');
    entry.append(
      createElement('span', 'eval-badge', `[${badge}]`),
      createElement('span', 'eval-name', name),
      createElement('span', 'eval-meta', year)
    );
    if (evidence) entry.append(createLink('view evidence ↗', evidence, 'terminal-link eval-evidence'));
    list.append(entry);
  });

  container.append(list, createElement('p', 'eval-summary', '7 evaluations passed.'));
};

const renderTraceRoute = (container) => {
  container.append(createElement('div', 'output-title', 'TRACING GOOSY EDGE NETWORK...'));
  const countries = [
    ['CN', 'China'],
    ['IT', 'Italy'],
    ['FR', 'France'],
    ['DE', 'Germany'],
    ['US', 'United States'],
    ['FI', 'Finland'],
    ['SE', 'Sweden'],
    ['MV', 'Maldives'],
    ['SG', 'Singapore'],
    ['GR', 'Greece'],
    ['AU', 'Australia'],
    ['BA', 'Bosnia & Herzegovina'],
    ['RS', 'Serbia'],
    ['ME', 'Montenegro'],
  ];
  const grid = createElement('div', 'edge-grid');

  countries.forEach(([code, country]) => {
    const node = createElement('div', 'edge-node');
    node.append(
      createElement('span', 'edge-code', code),
      createElement('span', '', country)
    );
    grid.append(node);
  });

  const summary = createElement('div', 'edge-summary');
  appendParagraphs(summary, [
    '14 servers discovered.',
    'Data residency: wherever the goose lands.',
  ]);
  container.append(grid, summary);
};

const renderSkills = (container) => {
  container.append(createElement('div', 'output-title', 'INSTALLED CAPABILITIES'));
  const skills = [
    ['systems', 'C · RISC-V · FPGA · SystemVerilog · Assembly · QEMU', 'boots and synthesizes'],
    ['acceleration', 'CUDA · Nsight Compute · Nsight Systems', 'can optimize it; cannot afford it', true],
    ['databases', 'MySQL · GCP · transactions', 'ACID compliant'],
    ['computing', 'Python · MATLAB · modeling', 'operational'],
    ['AI research', 'graphs · LLMs · in-context learning', 'training'],
    ['writing', 'papers · reports · documentation', 'under review'],
    ['deadlines', 'panic · caffeine · optimism', 'overclocked'],
  ];
  const list = createElement('div', 'skills-list');

  skills.forEach(([name, technologies, status, showNvidiaIcon]) => {
    const entry = createElement('section', 'skill-entry');
    const main = createElement('div', 'skill-main');
    const statusLine = createElement('div', 'skill-status');
    main.append(
      createElement('span', 'skill-name', name),
      createElement('span', 'skill-tech', technologies)
    );
    statusLine.append(createElement('span', '', `status: ${status}`));

    if (showNvidiaIcon) {
      const icon = createElement('img', 'skill-status-icon');
      icon.src = 'https://cdn.simpleicons.org/nvidia/76B900';
      icon.alt = 'NVIDIA';
      icon.title = 'NVIDIA sponsorship inquiries welcome';
      statusLine.append(icon);
    }

    entry.append(main, statusLine);
    list.append(entry);
  });

  const summary = createElement('div', 'skills-summary');
  appendParagraphs(summary, [
    '7 capabilities installed.',
    'Warranty void after graduation.',
  ]);
  container.append(list, summary);
};

const renderMemory = (container) => {
  appendParagraphs(container, [
    'Memory is disabled.',
    'Goosy will not store or recall facts across days.',
  ]);
};

const renderUsage = (container) => {
  container.append(createElement('div', 'output-title', 'CURRENT RESOURCE ALLOCATION'));
  const usage = [
    ['research', '1%', '█'],
    ['Excuse & Complain Engineering', '26%', '█████████████'],
    ['surviving courses', '3%', '██'],
    ['sleeping', '24%', '████████████'],
    ['moving around like a goose', '8%', '████'],
    ['debugging my own bugs', '21%', '███████████'],
    ['reading novels', '5%', '███'],
    ['daydreaming', '12%', '██████'],
  ];
  const list = createElement('div', 'usage-list');

  usage.forEach(([label, percentage, bar]) => {
    const row = createElement('div', 'usage-row');
    row.append(
      createElement('span', 'usage-label', label),
      createElement('span', 'usage-percent', percentage),
      createElement('span', 'usage-bar', bar)
    );
    list.append(row);
  });

  container.append(list);
};

const renderSubscription = (container) => {
  container.append(createElement('div', 'output-title', 'GOOSY PRO'));
  container.append(createElement('p', 'subscription-rate', 'Rate: 1 🍌 banana / joken'));
  container.append(createElement('p', '', '1 joken = 1 joke that compiles'));

  const qrCode = createElement('img', 'subscription-qr');
  qrCode.src = '../file/QRcode.jpg';
  qrCode.alt = 'Alipay QR code for supporting Goosy';
  qrCode.width = 210;
  qrCode.height = 210;
  container.append(qrCode, createElement('p', '', 'Scan to support the agent.'));

  const premiumTitle = createElement('p', '', 'Premium features:');
  const premiumList = createElement('ul', 'premium-list');
  ['same commands', 'identical response time', 'a financially healthier goose']
    .forEach((feature) => premiumList.append(createElement('li', '', feature)));
  container.append(premiumTitle, premiumList);
};

const renderHistory = (container) => {
  const lines = commandHistory
    .map((command, index) => `${String(index + 1).padStart(3, ' ')}  ${command}`)
    .join('\n');
  container.append(
    createElement('pre', 'history-list', lines),
    createElement('p', 'history-note', 'No useful work was detected during this session.')
  );
};

const renderUnknownCommand = (container, command) => {
  appendParagraphs(container, [
    `goosy: command not found: ${command}`,
    "Type 'help' for available commands.",
  ]);
};

const scrollToPrompt = () => {
  window.requestAnimationFrame(() => {
    form.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'end' });
  });
};

const typeExitMessage = (element, message) => new Promise((resolve) => {
  if (reducedMotion) {
    element.textContent = message;
    resolve();
    return;
  }

  const startedAt = performance.now();
  const duration = 480;

  const update = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const visibleCharacters = Math.ceil(progress * message.length);
    element.textContent = message.slice(0, visibleCharacters);

    if (progress < 1) {
      window.requestAnimationFrame(update);
    } else {
      resolve();
    }
  };

  window.requestAnimationFrame(update);
});

const runExit = async (container) => {
  input.disabled = true;
  form.classList.add('exiting');

  const sequence = createElement('div', 'exit-sequence');
  const message = createElement('p');
  const exitGoose = goose.cloneNode(true);
  exitGoose.removeAttribute('style');
  exitGoose.classList.remove('pointer-blink');
  exitGoose.classList.add('exit-goose');
  sequence.append(message, exitGoose);
  container.append(sequence);
  window.requestAnimationFrame(() => {
    sequence.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'end' });
  });

  await typeExitMessage(message, 'Goodbye. Goosy is returning to /dev/nest.');

  if (reducedMotion) {
    window.setTimeout(() => { window.location.href = '../'; }, 1400);
    return;
  }

  exitGoose.classList.add('departing');
  window.setTimeout(() => { window.location.href = '../'; }, 2400);
};

const executeCommand = (rawCommand) => {
  const command = rawCommand.toLowerCase().replace(/\s+/g, ' ').trim();

  if (command === 'clear' || command === '/clear') {
    bootOutput.hidden = true;
    terminalOutput.replaceChildren();
    form.style.marginTop = '0';
    input.focus({ preventScroll: true });
    return;
  }

  const result = appendCommandEntry(rawCommand);

  switch (command) {
    case 'help':
    case '/help':
      renderHelp(result);
      break;
    case 'sudo whoami':
      renderWhoAmI(result);
      break;
    case 'ping goosy':
      renderPing(result);
      break;
    case 'goosy --evals':
      renderEvaluations(result);
      break;
    case 'traceroute goosy':
      renderTraceRoute(result);
      break;
    case '/skills':
      renderSkills(result);
      break;
    case '/memory':
      renderMemory(result);
      break;
    case '/usage':
      renderUsage(result);
      break;
    case '/subscription':
      renderSubscription(result);
      break;
    case 'history':
    case '/history':
      renderHistory(result);
      break;
    case 'exit':
    case '/exit':
      runExit(result);
      return;
    default:
      renderUnknownCommand(result, rawCommand);
  }

  scrollToPrompt();
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (input.disabled) return;

  const command = input.value.trim();
  if (!command) {
    input.focus();
    return;
  }

  commandHistory.push(command);
  input.value = '';
  resizeInput();
  executeCommand(command);
});

document.querySelector('.terminal').addEventListener('click', () => input.focus());

boot();

let proximityBlinkActive = false;
let proximityBlinkCooldown = false;

document.addEventListener('pointermove', (event) => {
  if (reducedMotion || proximityBlinkActive || proximityBlinkCooldown) return;

  const bounds = goose.getBoundingClientRect();
  const eyeX = bounds.left + bounds.width * 0.39;
  const eyeY = bounds.top + bounds.height * 0.23;
  const triggerDistance = Math.max(42, bounds.width * 0.2);
  const distance = Math.hypot(event.clientX - eyeX, event.clientY - eyeY);

  if (distance <= triggerDistance) {
    proximityBlinkActive = true;
    proximityBlinkCooldown = true;
    goose.classList.add('pointer-blink');

    window.setTimeout(() => {
      goose.classList.remove('pointer-blink');
      proximityBlinkActive = false;
    }, 190);

    window.setTimeout(() => {
      proximityBlinkCooldown = false;
    }, 850);
  }
});