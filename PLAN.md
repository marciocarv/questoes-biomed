# Project Plan: Public Contest Question Platform (Simulados & Questões)

## 1. Overview & Architecture
A lightweight, modern, client-side web application designed to run smoothly in any browser (or served via Laragon) with **zero backend server overhead**. 

- **Frontend**: Clean HTML5, Modern Vanilla CSS (sleek dark/light theme, responsive, cards-based UI, smooth transitions) and Vanilla JavaScript.
- **Data Layer**: Static JSON files (e.g. `data/questions.json`, `data/exams.json`) storing all extracted questions, alternatives, answers, and explanations.
- **Workflow**:
  1. You download exam PDFs and answer keys (gabaritos).
  2. You provide the files / text to me.
  3. I extract and format the questions into structured JSON with detailed comments/explanations for each question.
  4. The platform loads the JSON and lets you solve them interactively.

---

## 2. Core Question Data Schema (`questions.json`)
```json
[
  {
    "id": "q001",
    "exam": {
      "banca": "Cebraspe / CESPE",
      "orgao": "INSS",
      "cargo": "Técnico do Seguro Social",
      "ano": 2022
    },
    "subject": "Direito Constitucional",
    "topic": "Direitos e Garantias Fundamentais",
    "type": "multiple_choice",
    "statement": "Acerca dos direitos e garantias fundamentais previstos na Constituição Federal de 1988...",
    "support_text": "Texto opcional de apoio ou excerto de lei...",
    "options": [
      { "id": "A", "text": "Homens e mulheres são iguais em direitos e obrigações nos termos da CF." },
      { "id": "B", "text": "Ninguém será submetido a tortura, salvo em estado de sítio." },
      { "id": "C", "text": "É livre a manifestação do pensamento, sendo permitido o anonimato." },
      { "id": "D", "text": "A casa é asilo inviolável do indivíduo, não podendo nela penetrar sem consentimento em qualquer hipótese." }
    ],
    "correct_option": "A",
    "explanation": {
      "summary": "O artigo 5º, I da CF/88 estabelece a igualdade de gênero nos termos da lei.",
      "details": "A alternativa B erra ao criar exceção inexistente para tortura (art. 5º, III). A C erra pois o anonimato é vedado (art. 5º, IV). A D erra porque existem exceções como flagrante delito, desastre ou socorro (art. 5º, XI)."
    }
  }
]
```

---

## 3. Key Features to Implement

### Interactive Answering & Feedback
- **Format Support**: Both Multiple Choice (A, B, C, D, E) and Certo / Errado (Cebraspe style).
- **Answer Checking**:
  - Click to select and confirm answer.
  - **Correct Answer**: Instant green highlight, celebration micro-interaction, optional view comment button.
  - **Incorrect Answer**: Highlights your selected option in red, illuminates the correct option in green, and automatically expands the **detailed comment & subject breakdown** so you learn immediately from the mistake.
- **Notebook of Errors ("Caderno de Erros")**:
  - Automatically track questions you missed in `localStorage`.
  - Filter to review and re-answer only questions you failed.

### Filters & Navigation
- Filter questions by **Subject (Disciplina)**, **Banca**, **Year**, and **Status** (All, Unanswered, Solved Correctly, Missed).
- Jump to specific questions or navigate Next/Previous.
- Progress bar showing session accuracy percentage (`% de Acerto`).

### Design & Aesthetic
- High-contrast, study-friendly interface with Dark Mode / Light Mode toggle.
- Clean typography optimized for reading long question stems and legal texts.

---

## 4. Implementation Steps
1. **Directory Setup**:
   - `index.html` (Main interactive interface)
   - `css/style.css` (Modern design tokens, typography, clean card layout, responsive design)
   - `js/app.js` (State management, local storage progress, question rendering, filter logic)
   - `data/` (Sample seed questions to immediately test the UI)
2. **Review & Verification**:
   - Verify UI interactivity, answer checking, explanation revelation, and filters.
3. **Extraction Pipeline**:
   - Ready to take your first exam PDF or text to extract and expand into `data/questions.json`.
