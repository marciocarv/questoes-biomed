/**
 * Questões Concursos - Interactive Engine & State Manager
 */

const STORAGE_KEY = 'questoes_user_progress_v1';
const THEME_KEY = 'questoes_theme_preference';

class QuizApp {
  constructor() {
    this.allQuestions = [];
    this.filteredQuestions = [];
    this.currentIndex = 0;
    this.selectedOption = null;
    this.userAnswers = this.loadUserProgress(); // { [qId]: { selected, isCorrect, timestamp } }
    this.currentFilterStatus = 'all'; // all, answered, correct, wrong, unanswered

    this.initElements();
    this.initTheme();
    this.attachEventListeners();
    this.loadData();
  }

  initElements() {
    // Top Bar
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.themeIcon = document.getElementById('themeIcon');
    
    // Stats
    this.statTotal = document.getElementById('statTotal');
    this.statAnswered = document.getElementById('statAnswered');
    this.statCorrect = document.getElementById('statCorrect');
    this.statWrong = document.getElementById('statWrong');
    this.statRate = document.getElementById('statRate');
    this.statProgressBar = document.getElementById('statProgressBar');
    this.btnResetHistory = document.getElementById('btnResetHistory');

    // Filters
    this.filterSubject = document.getElementById('filterSubject');
    this.filterBanca = document.getElementById('filterBanca');
    this.filterAno = document.getElementById('filterAno');
    this.filterSearch = document.getElementById('filterSearch');
    this.btnResetFilters = document.getElementById('btnResetFilters');
    this.statusPills = document.querySelectorAll('.status-pill');

    // Navigation & Toolbar
    this.navCurrentIndex = document.getElementById('navCurrentIndex');
    this.navTotalCount = document.getElementById('navTotalCount');
    this.btnPrev = document.getElementById('btnPrev');
    this.btnNext = document.getElementById('btnNext');
    this.paletteContainer = document.getElementById('paletteContainer');

    // Question Card Elements
    this.questionContainer = document.getElementById('questionContainer');
    this.emptyContainer = document.getElementById('emptyContainer');
    this.metaTagsContainer = document.getElementById('metaTagsContainer');
    this.questionSupportText = document.getElementById('questionSupportText');
    this.questionStatement = document.getElementById('questionStatement');
    this.optionsList = document.getElementById('optionsList');
    this.btnConfirm = document.getElementById('btnConfirm');
    this.btnToggleExplanation = document.getElementById('btnToggleExplanation');
    this.explanationPanel = document.getElementById('explanationPanel');
    this.explanationSummary = document.getElementById('explanationSummary');
    this.explanationDetails = document.getElementById('explanationDetails');
  }

  initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  updateThemeIcon(theme) {
    if (this.themeIcon) {
      this.themeIcon.textContent = theme === 'light' ? '☀️' : '🌙';
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    this.updateThemeIcon(newTheme);
  }

  loadUserProgress() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error loading progress:', e);
      return {};
    }
  }

  saveUserProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.userAnswers));
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  }

  async loadData() {
    // If questions-data.js is loaded (e.g. opened directly via file://), use it immediately!
    if (typeof RAW_QUESTIONS_DATA !== 'undefined' && Array.isArray(RAW_QUESTIONS_DATA) && RAW_QUESTIONS_DATA.length > 0) {
      this.allQuestions = RAW_QUESTIONS_DATA;
      this.populateFilterDropdowns();
      this.applyFilters();
      return;
    }

    try {
      const response = await fetch('data/questions.json');
      if (!response.ok) {
        throw new Error('Falha ao carregar data/questions.json');
      }
      this.allQuestions = await response.json();
      this.populateFilterDropdowns();
      this.applyFilters();
    } catch (err) {
      console.error(err);
      this.showError('Não foi possível carregar as questões. Se estiver abrindo o arquivo diretamente com duplo clique (file://), verifique se js/questions-data.js está carregado.');
    }
  }

  populateFilterDropdowns() {
    const subjects = new Set();
    const bancas = new Set();
    const anos = new Set();

    this.allQuestions.forEach(q => {
      if (q.subject) subjects.add(q.subject);
      if (q.exam?.banca) bancas.add(q.exam.banca);
      if (q.exam?.ano) anos.add(q.exam.ano);
    });

    this.fillSelect(this.filterSubject, Array.from(subjects).sort(), 'Todas as Disciplinas');
    this.fillSelect(this.filterBanca, Array.from(bancas).sort(), 'Todas as Bancas');
    this.fillSelect(this.filterAno, Array.from(anos).sort((a,b) => b - a), 'Todos os Anos');
  }

  fillSelect(selectEl, items, defaultLabel) {
    if (!selectEl) return;
    const currentVal = selectEl.value;
    selectEl.innerHTML = `<option value="">${defaultLabel}</option>`;
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      selectEl.appendChild(opt);
    });
    selectEl.value = currentVal;
  }

  attachEventListeners() {
    // Theme
    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

    // Navigation
    this.btnPrev.addEventListener('click', () => this.navigate(-1));
    this.btnNext.addEventListener('click', () => this.navigate(1));

    // Confirm button
    this.btnConfirm.addEventListener('click', () => this.confirmAnswer());

    // Explanation toggle
    this.btnToggleExplanation.addEventListener('click', () => {
      this.explanationPanel.classList.toggle('open');
      const isOpen = this.explanationPanel.classList.contains('open');
      this.btnToggleExplanation.innerHTML = isOpen 
        ? '<span>💡 Ocultar Comentário</span>' 
        : '<span>💡 Ver Comentário do Professor</span>';
    });

    // Reset Progress
    this.btnResetHistory.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja zerar todo o seu histórico de respostas?')) {
        this.userAnswers = {};
        this.saveUserProgress();
        this.applyFilters();
        this.renderCurrentQuestion();
      }
    });

    // Filters
    this.filterSubject.addEventListener('change', () => this.applyFilters());
    this.filterBanca.addEventListener('change', () => this.applyFilters());
    this.filterAno.addEventListener('change', () => this.applyFilters());
    
    let searchDebounce;
    this.filterSearch.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => this.applyFilters(), 250);
    });

    this.btnResetFilters.addEventListener('click', () => {
      this.filterSubject.value = '';
      this.filterBanca.value = '';
      this.filterAno.value = '';
      this.filterSearch.value = '';
      this.currentFilterStatus = 'all';
      this.updateStatusPillsUI();
      this.applyFilters();
    });

    // Status Pills
    this.statusPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        const target = e.currentTarget;
        this.currentFilterStatus = target.getAttribute('data-status');
        this.updateStatusPillsUI();
        this.applyFilters();
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'ArrowRight') this.navigate(1);
      if (e.key === 'ArrowLeft') this.navigate(-1);
      if (e.key === 'Enter' && !this.btnConfirm.disabled) this.confirmAnswer();
    });
  }

  updateStatusPillsUI() {
    this.statusPills.forEach(pill => {
      if (pill.getAttribute('data-status') === this.currentFilterStatus) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  applyFilters() {
    const selectedSub = this.filterSubject.value;
    const selectedBanca = this.filterBanca.value;
    const selectedAno = this.filterAno.value;
    const searchVal = this.filterSearch.value.trim().toLowerCase();

    this.filteredQuestions = this.allQuestions.filter(q => {
      if (selectedSub && q.subject !== selectedSub) return false;
      if (selectedBanca && q.exam?.banca !== selectedBanca) return false;
      if (selectedAno && String(q.exam?.ano) !== String(selectedAno)) return false;

      if (searchVal) {
        const inStatement = q.statement?.toLowerCase().includes(searchVal);
        const inTopic = q.topic?.toLowerCase().includes(searchVal);
        const inCargo = q.exam?.cargo?.toLowerCase().includes(searchVal);
        const inOrgao = q.exam?.orgao?.toLowerCase().includes(searchVal);
        if (!inStatement && !inTopic && !inCargo && !inOrgao) return false;
      }

      const answerInfo = this.userAnswers[q.id];
      if (this.currentFilterStatus === 'unanswered' && answerInfo) return false;
      if (this.currentFilterStatus === 'answered' && !answerInfo) return false;
      if (this.currentFilterStatus === 'correct' && (!answerInfo || !answerInfo.isCorrect)) return false;
      if (this.currentFilterStatus === 'wrong' && (!answerInfo || answerInfo.isCorrect)) return false;

      return true;
    });

    this.currentIndex = 0;
    this.updateStats();
    this.renderPalette();
    this.renderCurrentQuestion();
  }

  updateStats() {
    const total = this.allQuestions.length;
    let answered = 0;
    let correct = 0;
    let wrong = 0;

    this.allQuestions.forEach(q => {
      const ans = this.userAnswers[q.id];
      if (ans) {
        answered++;
        if (ans.isCorrect) correct++;
        else wrong++;
      }
    });

    const rate = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    this.statTotal.textContent = total;
    this.statAnswered.textContent = answered;
    this.statCorrect.textContent = correct;
    this.statWrong.textContent = wrong;
    this.statRate.textContent = `${rate}%`;
    this.statProgressBar.style.width = `${rate}%`;

    // Update counts on filter pills
    document.getElementById('pillCountAll').textContent = total;
    document.getElementById('pillCountUnanswered').textContent = total - answered;
    document.getElementById('pillCountCorrect').textContent = correct;
    document.getElementById('pillCountWrong').textContent = wrong;
  }

  renderPalette() {
    this.paletteContainer.innerHTML = '';
    this.filteredQuestions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.className = 'palette-btn';
      btn.textContent = idx + 1;
      
      const ans = this.userAnswers[q.id];
      if (ans) {
        btn.classList.add(ans.isCorrect ? 'correct' : 'wrong');
      }
      if (idx === this.currentIndex) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        this.currentIndex = idx;
        this.renderCurrentQuestion();
      });

      this.paletteContainer.appendChild(btn);
    });
  }

  renderCurrentQuestion() {
    if (this.filteredQuestions.length === 0) {
      this.questionContainer.style.display = 'none';
      this.emptyContainer.style.display = 'block';
      this.navCurrentIndex.textContent = '0';
      this.navTotalCount.textContent = '0';
      this.btnPrev.disabled = true;
      this.btnNext.disabled = true;
      return;
    }

    this.questionContainer.style.display = 'block';
    this.emptyContainer.style.display = 'none';

    const q = this.filteredQuestions[this.currentIndex];
    const prevAnswer = this.userAnswers[q.id];

    // Nav Toolbar
    this.navCurrentIndex.textContent = this.currentIndex + 1;
    this.navTotalCount.textContent = this.filteredQuestions.length;
    this.btnPrev.disabled = this.currentIndex === 0;
    this.btnNext.disabled = this.currentIndex === this.filteredQuestions.length - 1;

    // Update active on palette
    const paletteButtons = this.paletteContainer.querySelectorAll('.palette-btn');
    paletteButtons.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === this.currentIndex);
    });

    // Meta Badges
    this.metaTagsContainer.innerHTML = `
      ${q.number ? `<span class="badge" style="background: var(--primary); color: #fff; font-weight: 800;">Questão ${q.number}</span>` : ''}
      <span class="badge badge-banca">🏛️ ${q.exam?.banca || 'Banca'}</span>
      <span class="badge">📅 ${q.exam?.ano || 'Ano'}</span>
      <span class="badge">🏢 ${q.exam?.orgao || 'Órgão'}</span>
      <span class="badge">💼 ${q.exam?.cargo || 'Cargo'}</span>
      <span class="badge badge-subject">📚 ${q.subject || 'Disciplina'}</span>
      ${q.topic ? `<span class="badge">🏷️ ${q.topic}</span>` : ''}
    `;

    // Support Text (e.g. text excerpts)
    if (q.support_text && q.support_text.trim() !== '') {
      this.questionSupportText.textContent = q.support_text;
      this.questionSupportText.style.display = 'block';
    } else {
      this.questionSupportText.style.display = 'none';
    }

    // Statement
    this.questionStatement.textContent = q.statement;

    // Options Rendering
    this.optionsList.innerHTML = '';
    this.selectedOption = prevAnswer ? prevAnswer.selected : null;

    q.options.forEach(opt => {
      const item = document.createElement('div');
      item.className = 'option-item';
      item.setAttribute('data-id', opt.id);

      if (this.selectedOption === opt.id) {
        item.classList.add('selected');
      }

      // If already answered before
      if (prevAnswer) {
        item.classList.add('locked');
        if (opt.id === q.correct_option) {
          item.classList.add('correct');
        } else if (opt.id === prevAnswer.selected && !prevAnswer.isCorrect) {
          item.classList.add('wrong');
        }
      }

      item.innerHTML = `
        <div class="option-letter">${opt.id}</div>
        <div class="option-text">${opt.text}</div>
      `;

      item.addEventListener('click', () => {
        if (prevAnswer) return; // already answered
        this.selectOption(opt.id);
      });

      this.optionsList.appendChild(item);
    });

    // Reset or fill explanation
    this.renderExplanation(q, prevAnswer);

    // Confirm button state
    if (prevAnswer) {
      this.btnConfirm.disabled = true;
      this.btnConfirm.textContent = 'Questão Respondida';
    } else {
      this.btnConfirm.disabled = this.selectedOption === null;
      this.btnConfirm.innerHTML = 'Responder Questão ➔';
    }
  }

  selectOption(optId) {
    this.selectedOption = optId;
    const items = this.optionsList.querySelectorAll('.option-item');
    items.forEach(el => {
      if (el.getAttribute('data-id') === optId) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
    this.btnConfirm.disabled = false;
  }

  confirmAnswer() {
    if (!this.selectedOption) return;

    const q = this.filteredQuestions[this.currentIndex];
    const isCorrect = this.selectedOption === q.correct_option;

    // Record answer
    this.userAnswers[q.id] = {
      selected: this.selectedOption,
      isCorrect: isCorrect,
      timestamp: Date.now()
    };
    this.saveUserProgress();

    // Lock options & display visual feedback
    const items = this.optionsList.querySelectorAll('.option-item');
    items.forEach(el => {
      el.classList.add('locked');
      const id = el.getAttribute('data-id');
      if (id === q.correct_option) {
        el.classList.add('correct');
      } else if (id === this.selectedOption && !isCorrect) {
        el.classList.add('wrong');
      }
    });

    // Button states
    this.btnConfirm.disabled = true;
    this.btnConfirm.textContent = 'Questão Respondida';

    // Auto open explanation especially on mistake!
    this.renderExplanation(q, this.userAnswers[q.id]);
    if (!isCorrect) {
      this.explanationPanel.classList.add('open');
      this.btnToggleExplanation.innerHTML = '<span>💡 Ocultar Comentário</span>';
      // Smooth scroll to explanation so user instantly sees what went wrong
      this.explanationPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Refresh statistics & palette button color
    this.updateStats();
    const currentBtn = this.paletteContainer.children[this.currentIndex];
    if (currentBtn) {
      currentBtn.classList.remove('correct', 'wrong');
      currentBtn.classList.add(isCorrect ? 'correct' : 'wrong');
    }
  }

  renderExplanation(question, answerRecord) {
    if (!question.explanation) {
      this.btnToggleExplanation.style.display = 'none';
      this.explanationPanel.classList.remove('open');
      return;
    }

    this.btnToggleExplanation.style.display = 'inline-flex';
    this.explanationSummary.textContent = question.explanation.summary || `Gabarito Oficial: ${question.correct_option}`;
    this.explanationDetails.textContent = question.explanation.details || 'Sem detalhes adicionais.';

    // If already answered incorrectly in past, expand automatically
    if (answerRecord && !answerRecord.isCorrect) {
      this.explanationPanel.classList.add('open');
      this.btnToggleExplanation.innerHTML = '<span>💡 Ocultar Comentário</span>';
    } else {
      this.explanationPanel.classList.remove('open');
      this.btnToggleExplanation.innerHTML = '<span>💡 Ver Comentário do Professor</span>';
    }
  }

  navigate(direction) {
    const nextIdx = this.currentIndex + direction;
    if (nextIdx >= 0 && nextIdx < this.filteredQuestions.length) {
      this.currentIndex = nextIdx;
      this.renderCurrentQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  showError(msg) {
    this.questionStatement.textContent = msg;
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.quizApp = new QuizApp();
});
