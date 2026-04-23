// 打字练习应用主逻辑
class TypingPracticeApp {
    constructor() {
        // 状态管理
        this.state = {
            currentMode: 'keys',
            currentText: '',
            inputText: '',
            startTime: null,
            endTime: null,
            isTyping: false,
            isPaused: false,
            totalCharacters: 0,
            correctCharacters: 0,
            incorrectCharacters: 0,
            errorCharacters: [],
            history: [],
            settings: {
                strictMode: true,
                darkMode: false,
                fingerHints: true,
                soundEffects: false,
                fontSize: 'medium'
            }
        };

        // 练习文本数据
        this.texts = {
            keys: [
                'asdf jkl;',
                'qwerty uiop',
                'zxcv bnm,',
                '1234 5678',
                '90-= []\\',
                ";' ,./",
                'ASDF JKL:',
                'QWERTY UIOP',
                'ZXCV BNM<',
                '!@#$ %^&*',
                '()_+ {}|',
                ':" <>?'
            ],
            english: [
                'The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and is commonly used for typing practice.',
                'Practice makes perfect. The more you type, the faster and more accurate you will become. Keep practicing every day to improve your skills.',
                'Technology is rapidly changing the way we live and work. Learning to type quickly and accurately is an essential skill in the digital age.',
                'Reading is to the mind what exercise is to the body. Just as physical exercise keeps our bodies healthy, reading keeps our minds active and engaged.',
                'The only way to do great work is to love what you do. If you have not found it yet, keep looking. Do not settle for anything less than extraordinary.'
            ],
            chinese: [
                '键盘是我们与计算机交互的主要工具，掌握正确的打字方法可以大大提高工作效率。每天花一点时间练习打字，你会发现自己的速度越来越快。',
                '学习是一个持续的过程，需要耐心和毅力。不要因为一开始速度慢而气馁，每个人都是从新手开始的。坚持练习，你一定能够成为打字高手。',
                '现代社会越来越依赖计算机技术，无论是工作还是学习，都需要我们熟练掌握各种计算机技能。打字作为最基础的技能之一，值得我们投入时间去练习。',
                '好的习惯能够让我们事半功倍。正确的打字姿势和指法不仅能够提高打字速度，还能够减少疲劳，保护我们的身体健康。',
                '成功没有捷径，只有通过不断的努力和练习才能达到目标。打字练习也是如此，每天坚持练习，你会看到明显的进步。'
            ]
        };

        // 键盘布局和指法
        this.keyboardLayout = [
            ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
            ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
        ];

        this.fingerMapping = {
            '`': 'left-pinky', '1': 'left-pinky', 'q': 'left-pinky', 'a': 'left-pinky', 'z': 'left-pinky',
            '2': 'left-ring', 'w': 'left-ring', 's': 'left-ring', 'x': 'left-ring',
            '3': 'left-middle', 'e': 'left-middle', 'd': 'left-middle', 'c': 'left-middle',
            '4': 'left-index', '5': 'left-index', 'r': 'left-index', 't': 'left-index', 'f': 'left-index', 'g': 'left-index', 'v': 'left-index', 'b': 'left-index',
            '6': 'right-index', '7': 'right-index', 'y': 'right-index', 'u': 'right-index', 'h': 'right-index', 'j': 'right-index', 'n': 'right-index', 'm': 'right-index',
            '8': 'right-middle', 'i': 'right-middle', 'k': 'right-middle', ',': 'right-middle',
            '9': 'right-ring', 'o': 'right-ring', 'l': 'right-ring', '.': 'right-ring',
            '0': 'right-pinky', '-': 'right-pinky', '=': 'right-pinky', 'p': 'right-pinky', '[': 'right-pinky', ']': 'right-pinky', '\\': 'right-pinky', ';': 'right-pinky', "'": 'right-pinky', '/': 'right-pinky'
        };

        // 初始化应用
        this.init();
    }

    init() {
        // 加载设置和历史记录
        this.loadSettings();
        this.loadHistory();
        
        // 应用设置
        this.applySettings();
        
        // 初始化事件监听
        this.initEventListeners();
        
        // 显示默认模式
        this.showModePanel();
    }

    // 加载设置
    loadSettings() {
        const savedSettings = localStorage.getItem('typingSettings');
        if (savedSettings) {
            try {
                this.state.settings = { ...this.state.settings, ...JSON.parse(savedSettings) };
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }
    }

    // 保存设置
    saveSettings() {
        localStorage.setItem('typingSettings', JSON.stringify(this.state.settings));
    }

    // 应用设置
    applySettings() {
        const { darkMode, fontSize } = this.state.settings;
        
        // 深色模式
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // 字体大小
        const textDisplay = document.getElementById('text-display');
        textDisplay.classList.remove('font-small', 'font-medium', 'font-large');
        textDisplay.classList.add(`font-${fontSize}`);
        
        // 更新设置表单
        document.getElementById('strict-mode').checked = this.state.settings.strictMode;
        document.getElementById('dark-mode').checked = this.state.settings.darkMode;
        document.getElementById('finger-hints').checked = this.state.settings.fingerHints;
        document.getElementById('sound-effects').checked = this.state.settings.soundEffects;
        document.getElementById('font-size').value = this.state.settings.fontSize;
    }

    // 加载历史记录
    loadHistory() {
        const savedHistory = localStorage.getItem('typingHistory');
        if (savedHistory) {
            try {
                this.state.history = JSON.parse(savedHistory);
            } catch (e) {
                console.error('Failed to load history:', e);
            }
        }
    }

    // 保存历史记录
    saveHistory() {
        // 只保留最近30条记录
        if (this.state.history.length > 30) {
            this.state.history = this.state.history.slice(-30);
        }
        localStorage.setItem('typingHistory', JSON.stringify(this.state.history));
    }

    // 初始化事件监听
    initEventListeners() {
        // 模式选择
        document.querySelectorAll('.mode-option').forEach(option => {
            option.addEventListener('click', () => {
                const mode = option.dataset.mode;
                this.selectMode(mode);
            });
        });

        // 导航按钮
        document.getElementById('mode-btn').addEventListener('click', () => this.showModePanel());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettingsModal());
        document.getElementById('history-btn').addEventListener('click', () => this.showHistoryModal());
        document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());

        // 开始练习按钮
        document.getElementById('start-practice-btn').addEventListener('click', () => this.startPractice());

        // 设置表单
        document.getElementById('strict-mode').addEventListener('change', (e) => {
            this.state.settings.strictMode = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('dark-mode').addEventListener('change', (e) => {
            this.state.settings.darkMode = e.target.checked;
            this.saveSettings();
            this.applySettings();
        });

        document.getElementById('finger-hints').addEventListener('change', (e) => {
            this.state.settings.fingerHints = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('sound-effects').addEventListener('change', (e) => {
            this.state.settings.soundEffects = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('font-size').addEventListener('change', (e) => {
            this.state.settings.fontSize = e.target.value;
            this.saveSettings();
            this.applySettings();
        });

        // 弹窗关闭按钮
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // 点击弹窗外部关闭
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });

        // 历史记录操作
        document.getElementById('export-history-btn').addEventListener('click', () => this.exportHistory());
        document.getElementById('clear-history-btn').addEventListener('click', () => this.clearHistory());

        // 成绩报告操作
        document.getElementById('retry-btn').addEventListener('click', () => this.retryPractice());
        document.getElementById('change-text-btn').addEventListener('click', () => this.changeText());

        // 键盘输入监听
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keypress', (e) => this.handleKeyPress(e));
    }

    // 选择模式
    selectMode(mode) {
        this.state.currentMode = mode;
        this.state.currentText = '';
        this.state.inputText = '';
        
        // 隐藏模式面板，显示欢迎界面
        document.getElementById('mode-panel').classList.add('hidden');
        document.getElementById('welcome-screen').classList.remove('hidden');
        document.getElementById('practice-area').classList.add('hidden');
        document.getElementById('stats-bar').classList.add('hidden');
    }

    // 显示模式面板
    showModePanel() {
        this.resetPractice();
        document.getElementById('mode-panel').classList.remove('hidden');
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('practice-area').classList.add('hidden');
        document.getElementById('stats-bar').classList.add('hidden');
    }

    // 开始练习
    startPractice() {
        // 选择随机文本
        const texts = this.texts[this.state.currentMode];
        const randomIndex = Math.floor(Math.random() * texts.length);
        this.state.currentText = texts[randomIndex];
        
        // 重置状态
        this.resetPracticeState();
        
        // 显示练习区域
        document.getElementById('mode-panel').classList.add('hidden');
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('practice-area').classList.remove('hidden');
        document.getElementById('stats-bar').classList.remove('hidden');
        
        // 渲染文本
        this.renderText();
    }

    // 重置练习状态
    resetPracticeState() {
        this.state.inputText = '';
        this.state.startTime = null;
        this.state.endTime = null;
        this.state.isTyping = false;
        this.state.isPaused = false;
        this.state.totalCharacters = 0;
        this.state.correctCharacters = 0;
        this.state.incorrectCharacters = 0;
        this.state.errorCharacters = [];
        
        // 更新统计显示
        this.updateStats();
    }

    // 渲染文本
    renderText() {
        const targetTextEl = document.getElementById('target-text');
        const cursor = document.getElementById('cursor');
        
        // 清空目标文本
        targetTextEl.innerHTML = '';
        
        // 渲染每个字符
        for (let i = 0; i < this.state.currentText.length; i++) {
            const char = this.state.currentText[i];
            const span = document.createElement('span');
            span.className = 'char pending';
            span.textContent = char === ' ' ? '\u00A0' : char; // 空格显示为不间断空格
            span.dataset.index = i;
            targetTextEl.appendChild(span);
        }
        
        // 显示光标
        cursor.classList.remove('hidden');
        this.updateCursorPosition();
    }

    // 更新光标位置
    updateCursorPosition() {
        const cursor = document.getElementById('cursor');
        const chars = document.querySelectorAll('#target-text .char');
        
        if (chars.length === 0) return;
        
        const inputLength = this.state.inputText.length;
        
        if (inputLength >= chars.length) {
            // 练习完成
            cursor.classList.add('hidden');
            return;
        }
        
        const currentChar = chars[inputLength];
        const rect = currentChar.getBoundingClientRect();
        const containerRect = document.getElementById('text-display').getBoundingClientRect();
        
        cursor.style.left = `${rect.left - containerRect.left}px`;
        cursor.style.top = `${rect.top - containerRect.top}px`;
    }

    // 处理键盘按下事件
    handleKeyDown(e) {
        if (!this.state.isTyping && !this.canStartTyping()) return;
        
        // 处理退格键
        if (e.key === 'Backspace') {
            e.preventDefault();
            this.handleBackspace();
        }
        
        // 处理Tab键（作为空格处理）
        if (e.key === 'Tab') {
            e.preventDefault();
            // 不处理Tab键，或者作为空格处理
        }
    }

    // 处理键盘按键事件
    handleKeyPress(e) {
        if (!this.canStartTyping()) return;
        
        // 开始计时（如果还没开始）
        if (!this.state.isTyping && !this.state.startTime) {
            this.state.startTime = Date.now();
            this.state.isTyping = true;
        }
        
        // 处理输入字符
        const char = e.key;
        const currentIndex = this.state.inputText.length;
        
        if (currentIndex >= this.state.currentText.length) {
            return; // 已经输入完成
        }
        
        const expectedChar = this.state.currentText[currentIndex];
        const isCorrect = char === expectedChar;
        
        // 严格模式下，错误字符不能继续输入
        if (this.state.settings.strictMode && !isCorrect) {
            // 播放错误音效
            if (this.state.settings.soundEffects) {
                this.playSound('error');
            }
            
            // 记录错误
            this.state.incorrectCharacters++;
            if (!this.state.errorCharacters.includes(expectedChar)) {
                this.state.errorCharacters.push(expectedChar);
            }
            
            // 高亮错误
            this.highlightCharacter(currentIndex, false);
            return;
        }
        
        // 非严格模式或正确输入
        this.state.totalCharacters++;
        
        if (isCorrect) {
            this.state.correctCharacters++;
            // 播放正确音效
            if (this.state.settings.soundEffects) {
                this.playSound('correct');
            }
        } else {
            this.state.incorrectCharacters++;
            if (!this.state.errorCharacters.includes(expectedChar)) {
                this.state.errorCharacters.push(expectedChar);
            }
            // 播放错误音效
            if (this.state.settings.soundEffects) {
                this.playSound('error');
            }
        }
        
        // 添加到输入文本
        this.state.inputText += char;
        
        // 更新显示
        this.highlightCharacter(currentIndex, isCorrect);
        this.updateCursorPosition();
        this.updateStats();
        this.updateProgress();
        
        // 检查是否完成
        if (this.state.inputText.length === this.state.currentText.length) {
            this.finishPractice();
        }
    }

    // 处理退格键
    handleBackspace() {
        if (this.state.inputText.length === 0) return;
        
        // 移除最后一个字符
        const removedChar = this.state.inputText.slice(-1);
        this.state.inputText = this.state.inputText.slice(0, -1);
        
        // 重置该位置的高亮
        const currentIndex = this.state.inputText.length;
        this.resetCharacterHighlight(currentIndex);
        
        // 更新光标位置和统计
        this.updateCursorPosition();
        this.updateStats();
        this.updateProgress();
    }

    // 高亮字符
    highlightCharacter(index, isCorrect) {
        const chars = document.querySelectorAll('#target-text .char');
        if (index >= chars.length) return;
        
        const char = chars[index];
        char.classList.remove('pending', 'correct', 'incorrect');
        char.classList.add(isCorrect ? 'correct' : 'incorrect');
    }

    // 重置字符高亮
    resetCharacterHighlight(index) {
        const chars = document.querySelectorAll('#target-text .char');
        if (index >= chars.length) return;
        
        const char = chars[index];
        char.classList.remove('correct', 'incorrect');
        char.classList.add('pending');
    }

    // 更新统计
    updateStats() {
        const speedEl = document.getElementById('speed-stat');
        const accuracyEl = document.getElementById('accuracy-stat');
        const timeEl = document.getElementById('time-stat');
        const progressEl = document.getElementById('progress-stat');
        
        // 计算速度 (WPM: 每分钟单词数，假设每5个字符为一个单词)
        let wpm = 0;
        let cpm = 0;
        
        if (this.state.startTime && this.state.isTyping) {
            const elapsedSeconds = (Date.now() - this.state.startTime) / 1000;
            const elapsedMinutes = elapsedSeconds / 60;
            
            if (elapsedMinutes > 0) {
                // CPM: 每分钟字符数
                cpm = Math.round(this.state.totalCharacters / elapsedMinutes);
                // WPM: 每分钟单词数 (标准：5个字符 = 1个单词)
                wpm = Math.round((this.state.correctCharacters / 5) / elapsedMinutes);
            }
        }
        
        speedEl.textContent = `${wpm} WPM`;
        
        // 计算准确率
        let accuracy = 100;
        if (this.state.totalCharacters > 0) {
            accuracy = Math.round((this.state.correctCharacters / this.state.totalCharacters) * 100);
        }
        accuracyEl.textContent = `${accuracy}%`;
        
        // 计算用时
        let timeString = '00:00';
        if (this.state.startTime) {
            const endTime = this.state.endTime || Date.now();
            const elapsedSeconds = Math.floor((endTime - this.state.startTime) / 1000);
            const minutes = Math.floor(elapsedSeconds / 60);
            const seconds = elapsedSeconds % 60;
            timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        timeEl.textContent = timeString;
        
        // 更新进度
        progressEl.textContent = `${this.state.inputText.length}/${this.state.currentText.length}`;
    }

    // 更新进度条
    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        const percentage = (this.state.inputText.length / this.state.currentText.length) * 100;
        progressFill.style.width = `${percentage}%`;
    }

    // 完成练习
    finishPractice() {
        this.state.endTime = Date.now();
        this.state.isTyping = false;
        
        // 计算最终统计
        const elapsedSeconds = (this.state.endTime - this.state.startTime) / 1000;
        const elapsedMinutes = elapsedSeconds / 60;
        
        const cpm = Math.round(this.state.totalCharacters / elapsedMinutes);
        const wpm = Math.round((this.state.correctCharacters / 5) / elapsedMinutes);
        const accuracy = this.state.totalCharacters > 0 
            ? Math.round((this.state.correctCharacters / this.state.totalCharacters) * 100) 
            : 100;
        
        // 计算等级
        const grade = this.calculateGrade(wpm, accuracy);
        
        // 保存到历史记录
        const historyItem = {
            mode: this.state.currentMode,
            date: new Date().toISOString(),
            wpm: wpm,
            cpm: cpm,
            accuracy: accuracy,
            time: Math.floor(elapsedSeconds),
            totalChars: this.state.currentText.length
        };
        
        this.state.history.push(historyItem);
        this.saveHistory();
        
        // 显示成绩报告
        this.showResultsModal(wpm, cpm, accuracy, elapsedSeconds, grade);
    }

    // 计算等级
    calculateGrade(wpm, accuracy) {
        // 综合评分 = 速度 * 准确率
        const score = wpm * (accuracy / 100);
        
        if (score >= 60) return { grade: '大师', desc: '你是真正的打字高手！', color: '#FFD700' };
        if (score >= 40) return { grade: '高手', desc: '打字速度非常快！', color: '#4CAF50' };
        if (score >= 25) return { grade: '熟练', desc: '打字技术不错，继续保持！', color: '#2196F3' };
        if (score >= 15) return { grade: '入门', desc: '还需要多多练习哦！', color: '#FF9800' };
        return { grade: '新手', desc: '继续努力，你会越来越快！', color: '#9E9E9E' };
    }

    // 显示成绩报告弹窗
    showResultsModal(wpm, cpm, accuracy, seconds, grade) {
        const modal = document.getElementById('results-modal');
        
        // 设置等级
        const gradeDisplay = document.getElementById('result-grade');
        gradeDisplay.innerHTML = `
            <div class="grade" style="color: ${grade.color}">${grade.grade}</div>
            <div class="grade-desc">${grade.desc}</div>
        `;
        
        // 设置统计数据
        document.getElementById('result-wpm').textContent = wpm;
        document.getElementById('result-cpm').textContent = cpm;
        document.getElementById('result-accuracy').textContent = `${accuracy}%`;
        
        // 格式化时间
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        document.getElementById('result-time').textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        // 显示错误列表
        const errorsList = document.getElementById('errors-list');
        const errorsContent = document.getElementById('errors-content');
        
        if (this.state.errorCharacters.length > 0) {
            errorsList.classList.remove('hidden');
            errorsContent.textContent = `错误字符: ${this.state.errorCharacters.join(', ')}`;
        } else {
            errorsList.classList.add('hidden');
        }
        
        // 显示弹窗
        modal.classList.remove('hidden');
    }

    // 重新练习
    retryPractice() {
        this.closeAllModals();
        this.resetPracticeState();
        this.renderText();
    }

    // 换一篇文本
    changeText() {
        this.closeAllModals();
        this.startPractice();
    }

    // 重置练习
    resetPractice() {
        this.resetPracticeState();
        this.state.currentText = '';
        this.state.inputText = '';
        
        // 隐藏练习区域
        document.getElementById('practice-area').classList.add('hidden');
        document.getElementById('stats-bar').classList.add('hidden');
    }

    // 检查是否可以开始打字
    canStartTyping() {
        return !document.getElementById('practice-area').classList.contains('hidden') &&
               this.state.currentText.length > 0 &&
               !this.state.isPaused;
    }

    // 播放音效
    playSound(type) {
        // 简单的音效实现，可以后续扩展为实际的音频文件
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (type === 'correct') {
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
            } else {
                oscillator.frequency.value = 200;
                oscillator.type = 'square';
            }
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // 忽略音效错误
        }
    }

    // 显示设置弹窗
    showSettingsModal() {
        this.closeAllModals();
        document.getElementById('settings-modal').classList.remove('hidden');
    }

    // 显示历史记录弹窗
    showHistoryModal() {
        this.closeAllModals();
        this.renderHistoryList();
        document.getElementById('history-modal').classList.remove('hidden');
    }

    // 渲染历史记录列表
    renderHistoryList() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        
        if (this.state.history.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #999;">暂无练习记录</p>';
            return;
        }
        
        // 按时间倒序显示
        const sortedHistory = [...this.state.history].reverse();
        
        sortedHistory.forEach((item, index) => {
            const date = new Date(item.date);
            const dateString = date.toLocaleDateString('zh-CN');
            const timeString = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            
            // 模式名称映射
            const modeNames = {
                keys: '键位练习',
                english: '英文练习',
                chinese: '中文练习'
            };
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-info">
                    <h4>${modeNames[item.mode] || item.mode}</h4>
                    <p>${dateString} ${timeString}</p>
                </div>
                <div class="history-stats">
                    <div class="history-stat">
                        <span class="history-stat-label">WPM</span>
                        <span class="history-stat-value">${item.wpm}</span>
                    </div>
                    <div class="history-stat">
                        <span class="history-stat-label">准确率</span>
                        <span class="history-stat-value">${item.accuracy}%</span>
                    </div>
                </div>
            `;
            historyList.appendChild(historyItem);
        });
    }

    // 导出历史记录
    exportHistory() {
        if (this.state.history.length === 0) {
            alert('暂无历史记录可导出');
            return;
        }
        
        // 生成CSV内容
        let csvContent = '模式,日期,时间,WPM,CPM,准确率,用时(秒),总字符数\n';
        
        this.state.history.forEach(item => {
            const date = new Date(item.date);
            const dateString = date.toLocaleDateString('zh-CN');
            const timeString = date.toLocaleTimeString('zh-CN');
            
            // 模式名称映射
            const modeNames = {
                keys: '键位练习',
                english: '英文练习',
                chinese: '中文练习'
            };
            
            csvContent += `${modeNames[item.mode] || item.mode},${dateString},${timeString},${item.wpm},${item.cpm},${item.accuracy}%,${item.time},${item.totalChars}\n`;
        });
        
        // 创建下载链接
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `打字练习历史记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 清空历史记录
    clearHistory() {
        if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
            this.state.history = [];
            this.saveHistory();
            this.renderHistoryList();
        }
    }

    // 切换全屏
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('无法进入全屏模式:', err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    // 关闭所有弹窗
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    // 显示键盘指法弹窗
    showKeyboardModal(highlightKey = null) {
        this.closeAllModals();
        this.renderKeyboard(highlightKey);
        document.getElementById('keyboard-modal').classList.remove('hidden');
    }

    // 渲染键盘
    renderKeyboard(highlightKey = null) {
        const keyboardDisplay = document.getElementById('keyboard-display');
        keyboardDisplay.innerHTML = '';
        
        this.keyboardLayout.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            
            row.forEach(key => {
                const keyDiv = document.createElement('div');
                keyDiv.className = 'key';
                
                // 添加指法类
                const fingerClass = this.fingerMapping[key.toLowerCase()];
                if (fingerClass) {
                    keyDiv.classList.add(fingerClass);
                }
                
                // 高亮当前按键
                if (highlightKey && key.toLowerCase() === highlightKey.toLowerCase()) {
                    keyDiv.classList.add('highlight');
                }
                
                keyDiv.textContent = key;
                rowDiv.appendChild(keyDiv);
            });
            
            keyboardDisplay.appendChild(rowDiv);
        });
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.typingApp = new TypingPracticeApp();
});