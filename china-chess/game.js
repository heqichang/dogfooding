// 对弈游戏逻辑
class Game {
    constructor() {
        this.board = null;
        this.gameMode = 'pvp'; // 'pvp' 或 'pvc'
        this.moveHistory = [];
        this.gameOver = false;
        this.winner = null;
    }
    
    init() {
        // 初始化棋盘
        this.board = new Chessboard('play-board', {
            cellSize: 36,
            padding: 18,
            onMove: (moveData) => this.onMove(moveData),
            onGameOver: (winner) => this.onGameOver(winner)
        });
        
        // 新游戏
        this.newGame();
        
        // 绑定模式选择
        const modeSelect = document.getElementById('play-mode-select');
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                this.gameMode = e.target.value;
            });
        }
    }
    
    // 新游戏
    newGame() {
        this.board.clearPieces();
        this.board.initStandardPosition();
        this.board.draw();
        
        this.moveHistory = [];
        this.gameOver = false;
        this.winner = null;
        
        // 更新显示
        this.updateTurnIndicator();
        this.updateGameStatus('游戏进行中');
        this.clearHistory();
    }
    
    // 翻转棋盘
    flipBoard() {
        this.board.flip();
    }
    
    // 悔棋
    undoMove() {
        if (this.moveHistory.length === 0) {
            return;
        }
        
        // 获取上一步
        const lastMove = this.moveHistory.pop();
        
        // 恢复棋子位置
        lastMove.piece.x = lastMove.from.x;
        lastMove.piece.y = lastMove.from.y;
        
        // 恢复被吃的棋子
        if (lastMove.captured) {
            lastMove.captured.isCaptured = false;
        }
        
        // 切换回合
        this.board.currentTurn = this.board.currentTurn === 'red' ? 'black' : 'red';
        
        // 重新绘制
        this.board.draw();
        
        // 更新显示
        this.updateTurnIndicator();
        this.updateGameStatus('游戏进行中');
        this.updateHistoryDisplay();
        
        // 重置游戏状态
        this.gameOver = false;
        this.winner = null;
    }
    
    // 走棋回调
    onMove(moveData) {
        // 添加到历史记录
        this.moveHistory.push(moveData);
        
        // 更新历史显示
        this.updateHistoryDisplay();
        
        // 更新回合显示
        this.updateTurnIndicator();
        
        // 检查是否将军
        this.checkCheck();
        
        // 如果是人机模式，电脑走棋
        if (this.gameMode === 'pvc' && this.board.currentTurn === 'black' && !this.gameOver) {
            setTimeout(() => {
                this.computerMove();
            }, 500);
        }
    }
    
    // 游戏结束回调
    onGameOver(winner) {
        this.gameOver = true;
        this.winner = winner;
        
        const winnerText = winner === 'red' ? '红方' : '黑方';
        this.updateGameStatus(`${winnerText}获胜！`);
    }
    
    // 更新回合显示
    updateTurnIndicator() {
        const indicator = document.getElementById('turn-indicator');
        if (indicator) {
            const turnText = this.board.currentTurn === 'red' ? '红方' : '黑方';
            indicator.textContent = `轮到：${turnText}`;
            indicator.style.color = this.board.currentTurn === 'red' ? '#8B0000' : '#000';
        }
    }
    
    // 更新游戏状态
    updateGameStatus(status) {
        const statusElement = document.getElementById('game-status-text');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
    
    // 检查将军
    checkCheck() {
        const currentColor = this.board.currentTurn;
        const enemyColor = currentColor === 'red' ? 'black' : 'red';
        
        // 找到己方将帅
        const kingType = currentColor === 'red' ? '帅' : '将';
        const king = this.board.pieces.find(p => p.type === kingType && !p.isCaptured);
        
        if (!king) return;
        
        // 检查敌方所有棋子是否能攻击到将帅
        const enemyPieces = this.board.pieces.filter(p => p.color === enemyColor && !p.isCaptured);
        
        for (const piece of enemyPieces) {
            const validMoves = this.board.getValidMoves(piece);
            const canAttackKing = validMoves.some(m => m.x === king.x && m.y === king.y);
            
            if (canAttackKing) {
                const checkedText = currentColor === 'red' ? '红方' : '黑方';
                this.updateGameStatus(`${checkedText}被将军！`);
                return;
            }
        }
        
        if (!this.gameOver) {
            this.updateGameStatus('游戏进行中');
        }
    }
    
    // 更新历史显示
    updateHistoryDisplay() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        this.moveHistory.forEach((move, index) => {
            const moveNumber = Math.floor(index / 2) + 1;
            const isRedMove = move.piece.color === 'red';
            
            const notation = this.board.getMoveNotation(move.piece, move.from, move.to);
            
            const moveDiv = document.createElement('div');
            moveDiv.style.padding = '3px 5px';
            moveDiv.style.borderBottom = '1px solid #eee';
            moveDiv.style.color = isRedMove ? '#8B0000' : '#000';
            
            if (index % 2 === 0) {
                // 红方走棋，新的一步
                moveDiv.innerHTML = `<strong>${moveNumber}.</strong> ${notation}`;
            } else {
                // 黑方走棋，添加到同一行
                const lastDiv = historyList.lastChild;
                if (lastDiv) {
                    lastDiv.innerHTML += ` <span style="color: #000;">${notation}</span>`;
                    return;
                } else {
                    moveDiv.innerHTML = `<strong>${moveNumber}.</strong> ... ${notation}`;
                }
            }
            
            historyList.appendChild(moveDiv);
        });
        
        // 滚动到底部
        historyList.scrollTop = historyList.scrollHeight;
    }
    
    // 清空历史记录
    clearHistory() {
        const historyList = document.getElementById('history-list');
        if (historyList) {
            historyList.innerHTML = '';
        }
    }
    
    // 电脑走棋（简单AI）
    computerMove() {
        if (this.gameOver) return;
        
        const blackPieces = this.board.pieces.filter(p => p.color === 'black' && !p.isCaptured);
        
        // 收集所有可能的走法
        let allMoves = [];
        
        for (const piece of blackPieces) {
            const validMoves = this.board.getValidMoves(piece);
            for (const move of validMoves) {
                // 检查是否吃子
                const targetPiece = this.board.getPieceAt(move.x, move.y);
                const isCapture = targetPiece && targetPiece.color === 'red';
                
                // 给吃子的走法更高优先级
                const priority = isCapture ? 10 : 0;
                
                allMoves.push({
                    piece,
                    from: { x: piece.x, y: piece.y },
                    to: move,
                    priority
                });
            }
        }
        
        if (allMoves.length === 0) return;
        
        // 按优先级排序
        allMoves.sort((a, b) => b.priority - a.priority);
        
        // 选择走法：优先选择吃子的走法，否则随机选择
        let selectedMove;
        
        if (allMoves[0].priority === 10) {
            // 有吃子的走法，随机选择一个吃子的
            const captureMoves = allMoves.filter(m => m.priority === 10);
            selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
        } else {
            // 没有吃子的走法，随机选择一个
            selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        }
        
        // 执行走棋
        this.board.selectedPiece = selectedMove.piece;
        this.board.movePiece(selectedMove.piece, selectedMove.to.x, selectedMove.to.y);
    }
}

// 初始化游戏
const game = new Game();
