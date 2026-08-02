/* ==========================================================================
   ApexCalc — Core Application Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const calculatorCard = document.getElementById('calculator');
  const expressionDisplay = document.getElementById('expressionDisplay');
  const resultDisplay = document.getElementById('resultDisplay');
  const degRadBtn = document.getElementById('degRadBtn');
  const degRadDisplay = document.getElementById('degRadDisplay');
  const modeToggleBtn = document.getElementById('modeToggleBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const themeMenuBtn = document.getElementById('themeMenuBtn');
  const themeMenu = document.getElementById('themeMenu');
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyPanel = document.getElementById('historyPanel');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyList = document.getElementById('historyList');
  const scientificKeypad = document.getElementById('scientificKeypad');
  const memoryIndicator = document.getElementById('memoryIndicator');
  const copyBtn = document.getElementById('copyBtn');
  const toast = document.getElementById('toast');

  // Calculator State
  let expression = '';
  let result = '0';
  let memoryValue = 0;
  let isDeg = true;
  let soundEnabled = true;
  let history = [];
  let isScientific = false;
  let isNewCalculation = false;

  // Web Audio Context for Tactile Sound Feedback
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
  }

  function playClickSound(freq = 600, type = 'sine', duration = 0.04) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq / 2, audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fallback silent
    }
  }

  // Toast Notification
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2000);
  }

  // Update Display UI
  function updateDisplay() {
    expressionDisplay.textContent = expression;
    resultDisplay.textContent = result || '0';

    // Dynamic Font Scaling for very long outputs
    const len = (result || '0').length;
    if (len > 14) {
      resultDisplay.style.fontSize = '1.3rem';
    } else if (len > 10) {
      resultDisplay.style.fontSize = '1.7rem';
    } else {
      resultDisplay.style.fontSize = '2.2rem';
    }
  }

  // Mode Toggle (Scientific / Standard)
  modeToggleBtn.addEventListener('click', () => {
    playClickSound(800, 'triangle');
    isScientific = !isScientific;
    if (isScientific) {
      scientificKeypad.classList.remove('hidden');
      calculatorCard.classList.add('mode-scientific');
      modeToggleBtn.classList.add('active');
    } else {
      scientificKeypad.classList.add('hidden');
      calculatorCard.classList.remove('mode-scientific');
      modeToggleBtn.classList.remove('active');
    }
  });

  // DEG / RAD Toggle
  degRadBtn.addEventListener('click', () => {
    playClickSound(700, 'sine');
    isDeg = !isDeg;
    degRadBtn.textContent = isDeg ? 'DEG' : 'RAD';
    degRadDisplay.textContent = isDeg ? 'DEG' : 'RAD';
  });

  // Sound Toggle
  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggleBtn.classList.toggle('active', soundEnabled);
    if (soundEnabled) playClickSound(900, 'sine');
  });

  // Theme Dropdown Toggle & Selection
  themeMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    themeMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    themeMenu.classList.add('hidden');
  });

  document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickSound(750, 'sine');
      const theme = option.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', theme);
      
      document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      themeMenu.classList.add('hidden');
    });
  });

  // History Panel Toggle
  historyToggleBtn.addEventListener('click', () => {
    playClickSound(650, 'triangle');
    historyPanel.classList.toggle('hidden');
  });

  closeHistoryBtn.addEventListener('click', () => {
    historyPanel.classList.add('hidden');
  });

  clearHistoryBtn.addEventListener('click', () => {
    playClickSound(400, 'sawtooth');
    history = [];
    renderHistory();
  });

  function addHistoryItem(expr, res) {
    history.unshift({ expr, res });
    if (history.length > 30) history.pop();
    renderHistory();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML = '<div class="empty-history">No history recorded yet</div>';
      return;
    }

    historyList.innerHTML = history.map((item, index) => `
      <div class="history-item" data-index="${index}">
        <div class="history-expr">${item.expr} =</div>
        <div class="history-res">${item.res}</div>
      </div>
    `).join('');

    document.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        playClickSound(600, 'sine');
        const idx = item.getAttribute('data-index');
        const selected = history[idx];
        if (selected) {
          expression = selected.expr;
          result = selected.res;
          updateDisplay();
        }
      });
    });
  }

  // Copy Result Button
  copyBtn.addEventListener('click', () => {
    if (result) {
      navigator.clipboard.writeText(result).then(() => {
        playClickSound(1000, 'sine');
        showToast('Copied to clipboard!');
      });
    }
  });

  // Insert String to Expression
  function insertToExpression(val) {
    if (isNewCalculation) {
      // If user starts typing a number after '=', start fresh
      if (!['+', '-', '*', '/', '^', '%'].includes(val)) {
        expression = '';
      }
      isNewCalculation = false;
    }
    expression += val;
    evaluateLivePreview();
    updateDisplay();
  }

  // Live Calculation Preview
  function evaluateLivePreview() {
    if (!expression.trim()) {
      result = '0';
      return;
    }
    try {
      const computed = parseAndCalculate(expression);
      if (computed !== undefined && !isNaN(computed) && isFinite(computed)) {
        result = formatNumber(computed);
      }
    } catch (e) {
      // Live preview silences invalid intermediary expressions
    }
  }

  // Format Result Number
  function formatNumber(num) {
    if (Number.isInteger(num)) {
      return num.toString();
    }
    // Round floating numbers neatly
    const precision = 10;
    return parseFloat(num.toFixed(precision)).toString();
  }

  // Safe Math Parser Engine
  function parseAndCalculate(exprStr) {
    let sanitized = exprStr;

    // Replace unicode symbols
    sanitized = sanitized.replace(/÷/g, '/').replace(/×/g, '*').replace(/−/g, '-');

    // Constants
    sanitized = sanitized.replace(/π/g, `(${Math.PI})`);
    sanitized = sanitized.replace(/e/g, `(${Math.E})`);

    // Trigonometric functions (DEG/RAD aware)
    const toRad = (val) => isDeg ? (val * Math.PI) / 180 : val;
    const toDeg = (val) => isDeg ? (val * 180) / Math.PI : val;

    // Handle scientific function replacements with Javascript Math scope
    const mathScope = {
      sin: (x) => Math.sin(toRad(x)),
      cos: (x) => Math.cos(toRad(x)),
      tan: (x) => Math.tan(toRad(x)),
      asin: (x) => toDeg(Math.asin(x)),
      acos: (x) => toDeg(Math.acos(x)),
      atan: (x) => toDeg(Math.atan(x)),
      log: (x) => Math.log10(x),
      ln: (x) => Math.log(x),
      sqrt: (x) => Math.sqrt(x),
      abs: (x) => Math.abs(x),
      fact: (n) => factorial(n)
    };

    // Factorials (e.g. 5!)
    sanitized = sanitized.replace(/(\d+)!/g, 'mathScope.fact($1)');

    // Exponents (e.g., 2^3 -> Math.pow(2, 3))
    sanitized = replaceExponents(sanitized);

    // Square root symbol √(...)
    sanitized = sanitized.replace(/√\(/g, 'mathScope.sqrt(');
    sanitized = sanitized.replace(/√(\d+(\.\d+)?)/g, 'mathScope.sqrt($1)');

    // Scientific function mappings
    sanitized = sanitized.replace(/\bsin\(/g, 'mathScope.sin(');
    sanitized = sanitized.replace(/\bcos\(/g, 'mathScope.cos(');
    sanitized = sanitized.replace(/\btan\(/g, 'mathScope.tan(');
    sanitized = sanitized.replace(/\basin\(/g, 'mathScope.asin(');
    sanitized = sanitized.replace(/\bacos\(/g, 'mathScope.acos(');
    sanitized = sanitized.replace(/\batan\(/g, 'mathScope.atan(');
    sanitized = sanitized.replace(/\blog\(/g, 'mathScope.log(');
    sanitized = sanitized.replace(/\bln\(/g, 'mathScope.ln(');

    // Evaluate safely using Function constructor with limited scope
    const func = new Function('mathScope', `return ${sanitized}`);
    return func(mathScope);
  }

  function replaceExponents(str) {
    while (str.includes('^')) {
      str = str.replace(/([a-zA-Z0-9_.\(\)]+)\^([a-zA-Z0-9_.\(\)]+)/, 'Math.pow($1, $2)');
    }
    return str;
  }

  function factorial(n) {
    n = Math.floor(n);
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  // Calculate Equals (=)
  function performCalculation() {
    if (!expression.trim()) return;

    try {
      const finalResult = parseAndCalculate(expression);
      if (isNaN(finalResult) || !isFinite(finalResult)) {
        result = 'Error';
        playClickSound(300, 'sawtooth');
      } else {
        const formatted = formatNumber(finalResult);
        addHistoryItem(expression, formatted);
        result = formatted;
        expression = formatted;
        isNewCalculation = true;
        playClickSound(900, 'sine', 0.08);
      }
    } catch (err) {
      result = 'Syntax Error';
      playClickSound(300, 'sawtooth');
    }
    updateDisplay();
  }

  // Backspace
  function handleBackspace() {
    if (expression.length > 0) {
      expression = expression.slice(0, -1);
      evaluateLivePreview();
      updateDisplay();
    }
  }

  // Clear All
  function handleClearAll() {
    expression = '';
    result = '0';
    isNewCalculation = false;
    updateDisplay();
  }

  // Toggle Sign (±)
  function handleToggleSign() {
    if (!expression) return;
    if (expression.startsWith('-')) {
      expression = expression.substring(1);
    } else {
      expression = '-' + expression;
    }
    evaluateLivePreview();
    updateDisplay();
  }

  // Memory Functions
  document.querySelectorAll('.mem-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      playClickSound(650, 'square');
      const currentResNum = parseFloat(result) || 0;

      switch (action) {
        case 'mc':
          memoryValue = 0;
          memoryIndicator.classList.add('hidden');
          showToast('Memory Cleared');
          break;
        case 'mr':
          expression += memoryValue.toString();
          evaluateLivePreview();
          updateDisplay();
          break;
        case 'm-plus':
          memoryValue += currentResNum;
          memoryIndicator.classList.remove('hidden');
          showToast(`M = ${memoryValue}`);
          break;
        case 'm-minus':
          memoryValue -= currentResNum;
          memoryIndicator.classList.remove('hidden');
          showToast(`M = ${memoryValue}`);
          break;
        case 'ms':
          memoryValue = currentResNum;
          if (memoryValue !== 0) memoryIndicator.classList.remove('hidden');
          showToast(`Memory Stored: ${memoryValue}`);
          break;
      }
    });
  });

  // Handle Keypad Button Clicks
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const insert = btn.getAttribute('data-insert');
      const action = btn.getAttribute('data-action');

      if (insert) {
        playClickSound(550, 'sine');
        insertToExpression(insert);
      } else if (action) {
        switch (action) {
          case 'calculate':
            performCalculation();
            break;
          case 'clear-all':
            playClickSound(400, 'triangle');
            handleClearAll();
            break;
          case 'backspace':
            playClickSound(500, 'sine');
            handleBackspace();
            break;
          case 'toggle-sign':
            playClickSound(550, 'sine');
            handleToggleSign();
            break;
          case 'abs':
            playClickSound(550, 'sine');
            insertToExpression('abs(');
            break;
        }
      }
    });
  });

  // Keyboard Navigation & Shortcuts
  document.addEventListener('keydown', (e) => {
    // Ignore if focus is in an input field (none here currently, but good practice)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key;

    if (key >= '0' && key <= '9') {
      highlightBtnBySelector(`[data-insert="${key}"]`);
      playClickSound(550, 'sine');
      insertToExpression(key);
    } else if (['+', '-', '*', '/', '.', '(', ')', '%', '^'].includes(key)) {
      highlightBtnBySelector(`[data-insert="${key}"]`);
      playClickSound(600, 'sine');
      insertToExpression(key);
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      highlightBtnBySelector('[data-action="calculate"]');
      performCalculation();
    } else if (key === 'Backspace') {
      highlightBtnBySelector('[data-action="backspace"]');
      playClickSound(500, 'sine');
      handleBackspace();
    } else if (key === 'Escape') {
      highlightBtnBySelector('[data-action="clear-all"]');
      playClickSound(400, 'triangle');
      handleClearAll();
    }
  });

  function highlightBtnBySelector(selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.classList.add('btn-active');
      setTimeout(() => el.classList.remove('btn-active'), 120);
    }
  }

  // Initial render
  updateDisplay();
});
