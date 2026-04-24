class TypingApp {
    constructor() {
        this.language = 'english';
        this.level = 'elementary';
        this.currentTextIndex = 0;
        this.customTexts = [];
        this.useCustomTexts = false;
        this.soundEnabled = true;
        this.practiceHistory = [];
        
        this.isStarted = false;
        this.isCompleted = false;
        this.startTime = null;
        this.totalChars = 0;
        this.correctChars = 0;
        this.errorChars = 0;
        this.totalErrors = 0;
        this.currentInput = '';
        this.lastInputLength = 0;
        
        this.initElements();
        this.initEventListeners();
        this.initElectronIPC();
        this.loadText();
    }

    initElements() {
        this.languageSelect = document.getElementById('language-select');
        this.levelSelect = document.getElementById('level-select');
        this.customTextBtn = document.getElementById('custom-text-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.soundToggleBtn = document.getElementById('sound-toggle-btn');
        
        this.textDisplay = document.getElementById('text-display');
        this.sampleText = document.getElementById('sample-text');
        this.inputField = document.getElementById('input-field');
        this.inputFeedback = document.getElementById('input-feedback');
        
        this.wpmDisplay = document.getElementById('wpm');
        this.accuracyDisplay = document.getElementById('accuracy');
        this.timeDisplay = document.getElementById('time');
        this.errorsDisplay = document.getElementById('errors');
        
        this.resultModal = document.getElementById('result-modal');
        this.resultWpm = document.getElementById('result-wpm');
        this.resultAccuracy = document.getElementById('result-accuracy');
        this.resultTime = document.getElementById('result-time');
        this.resultErrors = document.getElementById('result-errors');
        this.retryBtn = document.getElementById('retry-btn');
        this.nextResultBtn = document.getElementById('next-result-btn');
        
        this.customModal = document.getElementById('custom-modal');
        this.customTextInput = document.getElementById('custom-text-input');
        this.cancelCustomBtn = document.getElementById('cancel-custom-btn');
        this.confirmCustomBtn = document.getElementById('confirm-custom-btn');
    }

    initEventListeners() {
        this.languageSelect.addEventListener('change', () => {
            this.language = this.languageSelect.value;
            this.useCustomTexts = false;
            this.currentTextIndex = 0;
            this.loadText();
        });

        this.levelSelect.addEventListener('change', () => {
            this.level = this.levelSelect.value;
            this.useCustomTexts = false;
            this.currentTextIndex = 0;
            this.loadText();
        });

        this.inputField.addEventListener('input', (e) => this.handleInput(e));
        this.inputField.addEventListener('keydown', (e) => this.handleKeydown(e));

        this.nextBtn.addEventListener('click', () => this.nextText());
        this.retryBtn.addEventListener('click', () => this.retryCurrentText());
        this.nextResultBtn.addEventListener('click', () => this.nextText());

        this.customTextBtn.addEventListener('click', () => this.showCustomModal());
        this.cancelCustomBtn.addEventListener('click', () => this.hideCustomModal());
        this.confirmCustomBtn.addEventListener('click', () => this.confirmCustomTexts());

        if (this.soundToggleBtn) {
            this.soundToggleBtn.addEventListener('click', () => this.toggleSound());
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                if (this.isCompleted) {
                    e.preventDefault();
                    this.nextText();
                }
            }
        });
    }

    initElectronIPC() {
        if (typeof window.electronAPI === 'undefined') {
            console.log('Running in non-Electron environment');
            return;
        }

        window.electronAPI.receive('import-text', (content) => {
            this.handleImportedFile(content);
        });

        window.electronAPI.receive('export-records', (filePath) => {
            this.exportRecords(filePath);
        });

        window.electronAPI.receive('restart-practice', () => {
            this.retryCurrentText();
        });

        window.electronAPI.receive('next-text', () => {
            if (this.isCompleted) {
                this.nextText();
            }
        });

        window.electronAPI.receive('switch-language', (lang) => {
            this.language = lang;
            this.languageSelect.value = lang;
            this.useCustomTexts = false;
            this.currentTextIndex = 0;
            this.loadText();
        });

        window.electronAPI.receive('switch-level', (level) => {
            this.level = level;
            this.levelSelect.value = level;
            this.useCustomTexts = false;
            this.currentTextIndex = 0;
            this.loadText();
        });

        window.electronAPI.receive('toggle-sound', (enabled) => {
            this.soundEnabled = enabled;
            audioManager.toggle(enabled);
            this.updateSoundButton();
        });
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        audioManager.toggle(this.soundEnabled);
        this.updateSoundButton();
    }

    updateSoundButton() {
        if (this.soundToggleBtn) {
            if (this.soundEnabled) {
                this.soundToggleBtn.textContent = '🔊 音效: 开';
                this.soundToggleBtn.classList.remove('btn-secondary');
                this.soundToggleBtn.classList.add('btn-primary');
            } else {
                this.soundToggleBtn.textContent = '🔇 音效: 关';
                this.soundToggleBtn.classList.remove('btn-primary');
                this.soundToggleBtn.classList.add('btn-secondary');
            }
        }
    }

    handleImportedFile(content) {
        if (!content || content.trim().length === 0) {
            alert('文件内容为空');
            return;
        }

        this.customTexts = content.split(/\n\s*\n/).filter(text => text.trim().length > 0);
        
        if (this.customTexts.length === 0) {
            alert('文件中没有找到有效的文本段落');
            return;
        }

        this.useCustomTexts = true;
        this.currentTextIndex = 0;
        this.loadText();
        
        alert(`成功导入 ${this.customTexts.length} 个文本段落`);
    }

    exportRecords(filePath) {
        const exportData = {
            exportDate: new Date().toISOString(),
            practiceHistory: this.practiceHistory,
            currentSettings: {
                language: this.language,
                level: this.level,
                useCustomTexts: this.useCustomTexts
            }
        };

        if (typeof window.electronAPI !== 'undefined') {
            window.electronAPI.send('save-records', filePath, exportData);
        } else {
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '练习记录.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    loadText() {
        let textArray;
        
        if (this.useCustomTexts && this.customTexts.length > 0) {
            textArray = this.customTexts;
        } else {
            textArray = TEXTS[this.language][this.level] || TEXTS[this.language].elementary;
        }

        if (this.currentTextIndex >= textArray.length) {
            this.currentTextIndex = 0;
        }

        this.currentText = textArray[this.currentTextIndex];
        this.totalChars = this.currentText.length;
        
        this.resetSession();
        this.renderText();
        this.nextBtn.style.display = 'none';
        this.hideResultModal();
    }

    resetSession() {
        this.isStarted = false;
        this.isCompleted = false;
        this.startTime = null;
        this.correctChars = 0;
        this.errorChars = 0;
        this.totalErrors = 0;
        this.currentInput = '';
        this.lastInputLength = 0;
        
        this.inputField.value = '';
        this.updateStats();
    }

    renderText() {
        let html = '';
        for (let i = 0; i < this.currentText.length; i++) {
            const char = this.currentText[i];
            let className = 'char pending';
            
            if (i < this.currentInput.length) {
                if (this.currentInput[i] === char) {
                    className = 'char correct';
                } else {
                    className = 'char incorrect';
                }
            } else if (i === this.currentInput.length) {
                className = 'char current';
            }

            if (char === ' ') {
                html += `<span class="${className}">&nbsp;</span>`;
            } else {
                html += `<span class="${className}">${this.escapeHtml(char)}</span>`;
            }
        }
        this.sampleText.innerHTML = html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    handleInput(e) {
        const value = e.target.value;
        
        if (!this.isStarted && value.length > 0) {
            this.isStarted = true;
            this.startTime = Date.now();
            if (this.soundEnabled) {
                audioManager.init();
            }
            this.startTimer();
        }

        const prevLength = this.lastInputLength;
        this.lastInputLength = value.length;
        this.currentInput = value;

        if (value.length > prevLength) {
            const typedChar = value[value.length - 1];
            const expectedChar = this.currentText[value.length - 1];
            
            if (typedChar === expectedChar) {
                this.correctChars++;
                if (this.soundEnabled) {
                    audioManager.playCorrectSound();
                }
            } else {
                this.errorChars++;
                this.totalErrors++;
                if (this.soundEnabled) {
                    audioManager.playErrorSound();
                }
            }
        }

        this.renderText();
        this.updateStats();
        this.checkCompletion();
    }

    handleKeydown(e) {
        if (e.key === 'Enter' && this.isCompleted) {
            e.preventDefault();
            this.nextText();
        }
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            this.updateStats();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateStats() {
        if (!this.startTime) {
            this.wpmDisplay.textContent = '0';
            this.accuracyDisplay.textContent = '100';
            this.timeDisplay.textContent = '00:00';
            this.errorsDisplay.textContent = '0';
            return;
        }

        const elapsedMs = Date.now() - this.startTime;
        const elapsedMinutes = elapsedMs / 1000 / 60;
        
        const words = this.correctChars / 5;
        const wpm = elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : 0;
        
        const totalTyped = this.correctChars + this.errorChars;
        const accuracy = totalTyped > 0 ? Math.round(this.correctChars / totalTyped * 100) : 100;
        
        const seconds = Math.floor(elapsedMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        this.wpmDisplay.textContent = wpm;
        this.accuracyDisplay.textContent = accuracy;
        this.timeDisplay.textContent = timeStr;
        this.errorsDisplay.textContent = this.totalErrors;
    }

    checkCompletion() {
        if (this.currentInput.length === this.currentText.length) {
            this.isCompleted = true;
            this.stopTimer();
            
            if (this.soundEnabled) {
                audioManager.playCompleteSound();
            }
            
            this.saveToHistory();
            
            this.nextBtn.style.display = 'inline-block';
            this.showResultModal();
        }
    }

    saveToHistory() {
        const elapsedMs = Date.now() - this.startTime;
        const elapsedMinutes = elapsedMs / 1000 / 60;
        const words = this.correctChars / 5;
        const wpm = elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : 0;
        
        const totalTyped = this.correctChars + this.errorChars;
        const accuracy = totalTyped > 0 ? Math.round(this.correctChars / totalTyped * 100) : 100;

        const record = {
            timestamp: new Date().toISOString(),
            language: this.language,
            level: this.level,
            textPreview: this.currentText.substring(0, 50) + (this.currentText.length > 50 ? '...' : ''),
            wpm: wpm,
            accuracy: accuracy,
            errors: this.totalErrors,
            totalChars: this.totalChars,
            correctChars: this.correctChars,
            errorChars: this.errorChars,
            timeMs: elapsedMs
        };

        this.practiceHistory.push(record);
        
        if (this.practiceHistory.length > 100) {
            this.practiceHistory = this.practiceHistory.slice(-100);
        }
    }

    showResultModal() {
        const elapsedMs = Date.now() - this.startTime;
        const seconds = Math.floor(elapsedMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        const elapsedMinutes = elapsedMs / 1000 / 60;
        const words = this.correctChars / 5;
        const wpm = elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : 0;
        
        const totalTyped = this.correctChars + this.errorChars;
        const accuracy = totalTyped > 0 ? Math.round(this.correctChars / totalTyped * 100) : 100;

        this.resultWpm.textContent = wpm;
        this.resultAccuracy.textContent = accuracy;
        this.resultTime.textContent = timeStr;
        this.resultErrors.textContent = this.totalErrors;
        
        this.resultModal.style.display = 'flex';
    }

    hideResultModal() {
        this.resultModal.style.display = 'none';
    }

    nextText() {
        this.hideResultModal();
        this.currentTextIndex++;
        this.loadText();
        this.inputField.focus();
    }

    retryCurrentText() {
        this.hideResultModal();
        this.loadText();
        this.inputField.focus();
    }

    showCustomModal() {
        this.customTextInput.value = '';
        this.customModal.style.display = 'flex';
    }

    hideCustomModal() {
        this.customModal.style.display = 'none';
    }

    confirmCustomTexts() {
        const input = this.customTextInput.value.trim();
        
        if (!input) {
            alert('请输入文本内容');
            return;
        }

        this.customTexts = input.split(/\n\s*\n/).filter(text => text.trim().length > 0);
        
        if (this.customTexts.length === 0) {
            alert('请输入有效的文本内容（空行分隔不同段落）');
            return;
        }

        this.useCustomTexts = true;
        this.currentTextIndex = 0;
        this.hideCustomModal();
        this.loadText();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TypingApp();
});
