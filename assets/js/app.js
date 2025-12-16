// --- APP LOGIC ---
const courseData = window.courseData;

const app = {
    state: {
        currentLevelIndex: 0,
        currentTaskIndex: 0,
        score: 0,
        subTaskIndex: 0, // For tasks with multiple items (sentence gap fill)
        userAnswers: {}, // Store logic for matching/story
        currentLevelData: null
    },

    init: function() {
        this.renderLevels();
    },

    // Navigation
    showScreen: function(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        const homeBtn = document.getElementById('home-btn');
        if(screenId === 'start-screen') homeBtn.style.display = 'none';
        else homeBtn.style.display = 'block';
    },

    showLevels: function() {
        this.renderLevels();
        this.showScreen('levels-screen');
    },

    // Render Levels Grid
    renderLevels: function() {
        const container = document.getElementById('levels-container');
        container.innerHTML = '';
        
        // Populate levels from Data
        courseData.levels.forEach((level, index) => {
            const card = document.createElement('div');
            card.className = 'glass-panel level-card';
            
            const startWord = (index * 12) + 1;
            const endWord = startWord + level.words.length - 1;

            card.innerHTML = `
                <div class="level-num">${level.level_id}</div>
                <div class="level-info">
                    <div class="level-range">WORDS ${startWord} - ${endWord}</div>
                    <h3>${level.title}</h3>
                    <div class="level-stats">
                        <span>📝 ${level.words.length} Words</span>
                        <span>🎯 ${level.tasks.length} Missions</span>
                    </div>
                </div>
            `;
            card.onclick = () => this.startLevel(index);
            container.appendChild(card);
        });
    },

    startLevel: function(index) {
        this.state.currentLevelIndex = index;
        this.state.currentLevelData = courseData.levels[index];
        this.renderIntro();
        this.showScreen('intro-screen');
    },

    renderIntro: function() {
        const level = this.state.currentLevelData;
        document.getElementById('intro-title').textContent = level.title;
        const list = document.getElementById('intro-list');
        list.innerHTML = '';
        level.words.forEach(w => {
            const item = document.createElement('div');
            item.className = 'word-item';
            item.innerHTML = `
                <span class="en-word">${w.word}</span>
                <span class="ua-word">${w.translation}</span>
            `;
            list.appendChild(item);
        });
    },

    startTasks: function() {
        this.state.currentTaskIndex = 0;
        this.state.subTaskIndex = 0;
        this.loadTask();
        this.showScreen('task-screen');
    },

    // --- TASK ENGINE ---
    loadTask: function() {
        const level = this.state.currentLevelData;
        
        // Check if level complete
        if (this.state.currentTaskIndex >= level.tasks.length) {
            this.showScreen('result-screen');
            return;
        }

        const task = level.tasks[this.state.currentTaskIndex];
        
        // Reset UI
        document.getElementById('task-counter').textContent = `${this.state.currentTaskIndex + 1}/${level.tasks.length}`;
        document.getElementById('progress-fill').style.width = `${((this.state.currentTaskIndex) / level.tasks.length) * 100}%`;
        document.getElementById('task-type-label').textContent = task.type.replace(/_/g, ' ');
        document.getElementById('task-instruction').textContent = task.instruction;
        document.getElementById('check-btn').style.display = 'block';
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('feedback-box').className = 'feedback-area';
        document.getElementById('feedback-box').style.display = 'none';

        const content = document.getElementById('task-content');
        content.innerHTML = '';

        // Dispatch Renderer
        if (task.type === 'match_definitions') this.renderMatchTask(task, content);
        else if (task.type === 'sentence_gap_fill') this.renderSentenceTask(task, content);
        else if (task.type === 'story_gap_fill') this.renderStoryTask(task, content);
        else if (task.type === 'manual_input') this.renderInputTask(task, content);
    },

    // 1. Matching Task (IMMEDIATE FEEDBACK MODE)
    renderMatchTask: function(task, container) {
        // Hide global check button for this interactive mode
        document.getElementById('check-btn').style.display = 'none';

        const wrapper = document.createElement('div');
        wrapper.className = 'match-container';
        
        const leftCol = document.createElement('div');
        leftCol.className = 'match-col';
        const rightCol = document.createElement('div');
        rightCol.className = 'match-col';

        const words = task.items.map(item => this.getWordById(item.word_id));
        const defs = task.items.map(item => ({id: item.definition_ref, text: this.getWordById(item.definition_ref).definition}));

        // Shuffle Definitions
        const shuffledDefs = [...defs].sort(() => Math.random() - 0.5);

        words.forEach(w => {
            const el = document.createElement('div');
            el.className = 'glass-panel match-item match-left';
            el.textContent = w.word;
            el.dataset.id = w.id;
            el.onclick = () => this.handleMatchClick(el, 'left');
            leftCol.appendChild(el);
        });

        shuffledDefs.forEach(d => {
            const el = document.createElement('div');
            el.className = 'glass-panel match-item match-right';
            el.textContent = d.text;
            el.dataset.id = d.id;
            el.onclick = () => this.handleMatchClick(el, 'right');
            rightCol.appendChild(el);
        });

        wrapper.appendChild(leftCol);
        wrapper.appendChild(rightCol);
        container.appendChild(wrapper);
    },

    handleMatchClick: function(el, side) {
        if (el.classList.contains('correct') || el.classList.contains('wrong')) return;

        const sameSideSelector = side === 'left' ? '.match-left' : '.match-right';
        document.querySelectorAll(sameSideSelector).forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');

        const otherSideSelector = side === 'left' ? '.match-right.selected' : '.match-left.selected';
        const otherEl = document.querySelector(otherSideSelector);

        if (otherEl) {
            this.checkImmediatePair(el, otherEl);
        }
    },

    checkImmediatePair: function(el1, el2) {
        const id1 = el1.dataset.id;
        const id2 = el2.dataset.id;
        const isCorrect = (id1 === id2);

        el1.classList.remove('selected');
        el2.classList.remove('selected');

        if (isCorrect) {
            el1.classList.add('correct');
            el2.classList.add('correct');
            
            const total = document.querySelectorAll('.match-left').length;
            const correctCount = document.querySelectorAll('.match-left.correct').length;
            
            if (total === correctCount) {
                const fb = document.getElementById('feedback-box');
                fb.textContent = "Perfect match!";
                fb.className = 'feedback-area success';
                fb.style.display = 'block';
                document.getElementById('next-btn').style.display = 'block';
            }
        } else {
            el1.classList.add('wrong');
            el2.classList.add('wrong');
            
            setTimeout(() => {
                el1.classList.remove('wrong');
                el2.classList.remove('wrong');
            }, 1000);
        }
    },

    // 2. Sentence Gap Fill
    renderSentenceTask: function(task, container) {
        if (!this.state.subTaskIndex) this.state.subTaskIndex = 0;
        
        const item = task.items[this.state.subTaskIndex];
        
        const card = document.createElement('div');
        card.className = 'glass-panel question-card';
        
        const questionText = document.createElement('div');
        questionText.style.fontSize = "1.3rem";
        questionText.style.marginBottom = "25px";
        questionText.style.fontWeight = "500";
        this.createInteractiveText(item.question, questionText);
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options-grid';
        
        const options = [...item.distractors, this.getWordById(item.correct_word_id).word].sort(() => Math.random() - 0.5);
        
        this.state.userAnswers.currentSelection = null;

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.onclick = () => {
                document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.state.userAnswers.currentSelection = opt;
            };
            optionsDiv.appendChild(btn);
        });

        card.appendChild(questionText);
        card.appendChild(optionsDiv);
        container.appendChild(card);
        
        document.getElementById('task-counter').textContent = `${this.state.currentTaskIndex + 1} (${this.state.subTaskIndex + 1}/${task.items.length})`;
    },

    // 3. Story Gap Fill
    renderStoryTask: function(task, container) {
        const textWrapper = document.createElement('div');
        textWrapper.className = 'glass-panel story-text';
        textWrapper.style.padding = '30px';
        
        let html = '';
        const parts = task.text_template.split(/({{\w+}})/g);
        
        this.state.userAnswers.storySlots = [];

        parts.forEach((part, idx) => {
            if (part.match(/^{{\w+}}$/)) {
                const wordId = part.replace(/[{}]/g, '');
                html += `<span class="gap-slot" data-correct="${wordId}" data-index="${idx}" onclick="app.fillGap(this)">______</span>`;
                this.state.userAnswers.storySlots.push({ id: wordId, filled: null, elementIndex: idx });
            } else {
                html += this.processTextForTranslation(part);
            }
        });

        textWrapper.innerHTML = html;
        this.attachTranslationListeners(textWrapper); 

        const bank = document.createElement('div');
        bank.className = 'word-bank';
        task.word_bank.forEach(wid => {
            const w = this.getWordById(wid);
            const chip = document.createElement('div');
            chip.className = 'bank-item';
            chip.textContent = w.word;
            chip.dataset.id = wid;
            chip.onclick = () => this.selectBankWord(chip);
            bank.appendChild(chip);
        });

        container.appendChild(textWrapper);
        container.appendChild(bank);

        this.state.userAnswers.selectedBankWord = null;
    },

    processTextForTranslation: function(text) {
        return text.split(' ').map(w => {
            if(!w.trim()) return w;
            return `<span class="interactive-word" data-word="${w.replace(/[^\w]/g, '')}">${w} </span>`;
        }).join('');
    },

    selectBankWord: function(el) {
        if (el.classList.contains('used')) return;
        
        document.querySelectorAll('.bank-item').forEach(b => b.classList.remove('selected'));
        el.classList.add('selected');
        this.state.userAnswers.selectedBankWord = { id: el.dataset.id, word: el.textContent, element: el };
    },

    fillGap: function(slotEl) {
        if (slotEl.classList.contains('filled')) {
            const filledId = slotEl.dataset.filledId;
            if (filledId) {
                const bankItem = document.querySelector(`.bank-item[data-id="${filledId}"]`);
                if (bankItem) {
                    bankItem.classList.remove('used');
                }
            }
            slotEl.textContent = '______';
            slotEl.classList.remove('filled', 'correct', 'wrong'); 
            delete slotEl.dataset.filledId;
            
            document.getElementById('feedback-box').style.display = 'none';
            document.getElementById('check-btn').style.display = 'block';
            document.getElementById('next-btn').style.display = 'none';
            return; 
        }

        const selection = this.state.userAnswers.selectedBankWord;
        if (!selection) return;

        slotEl.textContent = selection.word;
        slotEl.classList.add('filled');
        slotEl.dataset.filledId = selection.id; 

        selection.element.classList.add('used');
        selection.element.classList.remove('selected');
        
        this.state.userAnswers.selectedBankWord = null;
        document.getElementById('feedback-box').style.display = 'none';
    },

    // 4. Manual Input
    renderInputTask: function(task, container) {
        const item = task.items[this.state.subTaskIndex || 0];
        if (!this.state.subTaskIndex) this.state.subTaskIndex = 0;

        const wrapper = document.createElement('div');
        wrapper.className = 'glass-panel input-group';
        
        const label = document.createElement('h3');
        label.textContent = `Translate: "${item.prompt}"`;
        label.style.marginBottom = "0";
        label.style.fontSize = "1.4rem";
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'manual-input';
        input.placeholder = 'Type English word...';
        input.id = 'current-input';
        input.autocomplete = "off";

        wrapper.appendChild(label);
        wrapper.appendChild(input);
        container.appendChild(wrapper);

        document.getElementById('task-counter').textContent = `${this.state.currentTaskIndex + 1} (${this.state.subTaskIndex + 1}/${task.items.length})`;
        
        setTimeout(() => input.focus(), 100);
    },

    // --- CHECK LOGIC ---
    checkAnswer: function() {
        const task = this.state.currentLevelData.tasks[this.state.currentTaskIndex];
        let correct = false;
        let message = "";

        if (task.type === 'match_definitions') {
             return;

        } else if (task.type === 'sentence_gap_fill') {
            const item = task.items[this.state.subTaskIndex];
            const correctWord = this.getWordById(item.correct_word_id).word;
            const selected = this.state.userAnswers.currentSelection;
            
            if (!selected) {
                const fb = document.getElementById('feedback-box');
                fb.textContent = "Please select an option first.";
                fb.className = 'feedback-area error';
                fb.style.display = 'block';
                return;
            }

            const selectedBtn = document.querySelector('.option-btn.selected'); 

            if (selected === correctWord) {
                correct = true;
                if(selectedBtn) selectedBtn.classList.add('correct');
                message = "Correct!";
            } else {
                if(selectedBtn) selectedBtn.classList.add('wrong');
                message = `Wrong. Correct answer: ${correctWord}`;
            }

        } else if (task.type === 'story_gap_fill') {
            let errors = 0;
            let empty = 0;
            document.querySelectorAll('.gap-slot').forEach(slot => {
                const correctId = slot.dataset.correct;
                const filledId = slot.dataset.filledId;
                
                if (!filledId) {
                    empty++;
                    return;
                }

                if (correctId === filledId) {
                    slot.classList.add('correct');
                    slot.classList.remove('wrong');
                } else {
                    slot.classList.add('wrong');
                    slot.classList.remove('correct');
                    errors++;
                }
            });
            
            if (empty > 0) {
                message = "Please fill all gaps first.";
                document.getElementById('feedback-box').textContent = message;
                document.getElementById('feedback-box').className = 'feedback-area error';
                document.getElementById('feedback-box').style.display = 'block';
                return;
            }

            correct = (errors === 0);
            message = correct ? "Great reading! Perfect score." : "You have some errors. Tap red words to retry.";

        } else if (task.type === 'manual_input') {
            const item = task.items[this.state.subTaskIndex];
            const val = document.getElementById('current-input').value.trim();
            
            if (!val) {
                 return;
            }

            if (val.toLowerCase() === item.correct_word.toLowerCase()) {
                correct = true;
                document.getElementById('current-input').style.borderColor = 'var(--success)';
                message = "Correct spelling!";
            } else {
                document.getElementById('current-input').style.borderColor = 'var(--error)';
                message = `Incorrect. Correct: ${item.correct_word}`;
            }
        }

        const fb = document.getElementById('feedback-box');
        fb.textContent = message;
        fb.className = `feedback-area ${correct ? 'success' : 'error'}`;
        fb.style.display = 'block';

        if (correct) {
            document.getElementById('check-btn').style.display = 'none';
            document.getElementById('next-btn').style.display = 'block';
        }
    },

    nextTask: function() {
        const task = this.state.currentLevelData.tasks[this.state.currentTaskIndex];
        
        if (task.items && (task.type === 'sentence_gap_fill' || task.type === 'manual_input')) {
            this.state.subTaskIndex++;
            if (this.state.subTaskIndex < task.items.length) {
                this.loadTask(); 
                return;
            }
        }

        this.state.currentTaskIndex++;
        this.loadTask();
    },

    // --- UTILS ---
    getWordById: function(id) {
        return this.state.currentLevelData.words.find(w => w.id === id);
    },

    createInteractiveText: function(text, container) {
        const words = text.split(' ');
        words.forEach(word => {
            const span = document.createElement('span');
            if(word.includes('_')) {
                 span.textContent = word + ' ';
            } else {
                span.className = 'interactive-word';
                span.textContent = word + ' ';
                span.dataset.clean = word.replace(/[^\w]/g, '');
                
                const tip = document.createElement('div');
                tip.className = 'translation-tooltip';
                tip.textContent = '...';
                span.appendChild(tip);
                
                span.onclick = (e) => {
                    e.stopPropagation(); 
                    this.translateWord(span.dataset.clean, tip, span);
                };
            }
            container.appendChild(span);
        });
    },

    attachTranslationListeners: function(container) {
        container.querySelectorAll('.interactive-word').forEach(span => {
            const tip = document.createElement('div');
            tip.className = 'translation-tooltip';
            tip.textContent = '...';
            span.appendChild(tip);

            span.onclick = (e) => {
                e.stopPropagation();
                const word = span.getAttribute('data-word');
                this.translateWord(word, tip, span);
            }
        });
    },

    translateWord: async function(word, tooltip, span) {
        document.querySelectorAll('.interactive-word').forEach(el => el.classList.remove('show-tip'));
        
        span.classList.add('show-tip');
        tooltip.textContent = "Loading...";

        try {
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${word}&langpair=en|uk`);
            const data = await response.json();
            if(data && data.responseData) {
                tooltip.textContent = data.responseData.translatedText.toLowerCase();
            } else {
                tooltip.textContent = "Not found";
            }
        } catch (e) {
            tooltip.textContent = "Error";
            console.error(e);
        }

        setTimeout(() => {
            span.classList.remove('show-tip');
        }, 3000);
    }
};

document.getElementById('home-btn').onclick = () => app.showLevels();
app.init();
