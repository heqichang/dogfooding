// 动画演示逻辑
class AnimationDemo {
    constructor() {
        this.board = null;
        this.currentAnimation = null;
        this.animationSpeed = 3; // 1-5
        this.isPlaying = false;
        this.animationFrame = null;
        this.steps = [];
        this.currentStep = 0;
    }
    
    init() {
        // 初始化动画棋盘
        this.board = new Chessboard('animation-board', {
            cellSize: 36,
            padding: 18
        });
        
        // 绑定速度控制
        const speedRange = document.getElementById('speed-range');
        const speedValue = document.getElementById('speed-value');
        
        if (speedRange && speedValue) {
            speedRange.addEventListener('input', (e) => {
                this.animationSpeed = parseInt(e.target.value);
                const speedNames = ['极慢', '慢', '中', '快', '极快'];
                speedValue.textContent = speedNames[this.animationSpeed - 1];
            });
        }
        
        // 绑定选择器
        const select = document.getElementById('animation-select');
        if (select) {
            select.addEventListener('change', () => {
                this.resetAnimation();
                this.loadAnimation(select.value);
            });
        }
        
        // 加载默认动画
        this.loadAnimation('horse-move');
    }
    
    // 加载动画
    loadAnimation(animationType) {
        this.board.clearPieces();
        
        const descriptionDiv = document.getElementById('animation-description');
        
        switch (animationType) {
            case 'horse-move':
                this.setupHorseMoveAnimation();
                if (descriptionDiv) {
                    descriptionDiv.textContent = '演示：马走日字。马从(1,9)位置出发，可以走到(0,7)、(2,7)、(3,8)等位置。';
                }
                break;
                
            case 'horse-block':
                this.setupHorseBlockAnimation();
                if (descriptionDiv) {
                    descriptionDiv.textContent = '演示：蹩马腿。当马的前进方向有棋子阻挡时，马不能走过去。图中马的正上方有相，所以马不能向上跳。';
                }
                break;
                
            case 'elephant-move':
                this.setupElephantMoveAnimation();
                if (descriptionDiv) {
                    descriptionDiv.textContent = '演示：象走田字。象从(2,9)位置出发，可以走到(0,7)、(4,7)、(6,9)等位置（不能过河）。';
                }
                break;
                
            case 'elephant-block':
                this.setupElephantBlockAnimation();
                if (descriptionDiv) {
                    descriptionDiv.textContent = '演示：塞象眼。当田字中心有棋子时，象不能飞过去。图中兵在(3,8)位置，正好塞住了相的象眼。';
                }
                break;
                
            case 'cannon-move':
                this.setupCannonMoveAnimation();
                if (descriptionDiv) {
                    descriptionDiv.textContent = '演示：炮的走法与吃子。炮不吃子时走法同车（横竖直走），吃子时需要隔一个棋子（炮架）。';
                }
                break;
                
            case 'checkmate':
                this.setupCheckmateAnimation();
                if (descriptionDiv) {
                    descriptionDiv.textContent = '演示：将死。当红方车走到将的同一条直线上，且中间没有棋子阻挡时，将被将死。';
                }
                break;
                
            case 'stalemate':
                this.setupStalemateAnimation();
                if (descriptionDiv) {
                    descriptionDiv.textContent = '演示：困毙。当轮到走棋的一方无子可动时，就算输棋。图中黑将被红方车和帅困住，无法移动。';
                }
                break;
                
            case 'discovery':
                this.setupDiscoveryAnimation();
                if (descriptionDiv) {
                    descriptionDiv.textContent = '演示：抽将。当红方马跳开后，后面的炮正好将军，同时马还可以吃掉黑方的车。这是抽将战术。';
                }
                break;
        }
        
        this.board.draw();
    }
    
    // 马的走法动画
    setupHorseMoveAnimation() {
        this.board.addPiece('马', 'red', 1, 9);
        this.board.addPiece('帅', 'red', 4, 9);
        this.board.addPiece('将', 'black', 4, 0);
        
        this.steps = [
            { type: 'select', x: 1, y: 9, description: '选择红马' },
            { type: 'highlight', moves: [
                { x: 0, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 8 }
            ], description: '马可以走的位置（日字）' },
            { type: 'move', from: { x: 1, y: 9 }, to: { x: 2, y: 7 }, description: '马从(1,9)走到(2,7)' },
            { type: 'wait', duration: 500 },
            { type: 'select', x: 2, y: 7, description: '再次选择红马' },
            { type: 'highlight', moves: [
                { x: 0, y: 6 }, { x: 0, y: 8 }, { x: 1, y: 5 }, { x: 1, y: 9 },
                { x: 3, y: 5 }, { x: 3, y: 9 }, { x: 4, y: 6 }, { x: 4, y: 8 }
            ], description: '马现在可以走更多位置' },
            { type: 'move', from: { x: 2, y: 7 }, to: { x: 4, y: 6 }, description: '马从(2,7)走到(4,6)' }
        ];
    }
    
    // 蹩马腿动画
    setupHorseBlockAnimation() {
        this.board.addPiece('马', 'red', 1, 9);
        this.board.addPiece('相', 'red', 1, 8); // 蹩马腿
        this.board.addPiece('帅', 'red', 4, 9);
        this.board.addPiece('将', 'black', 4, 0);
        
        this.steps = [
            { type: 'select', x: 1, y: 9, description: '选择红马' },
            { type: 'highlight', moves: [
                { x: 2, y: 7 }, { x: 3, y: 8 }
            ], description: '因为相在(1,8)蹩马腿，马不能向上跳' },
            { type: 'move', from: { x: 1, y: 9 }, to: { x: 2, y: 7 }, description: '马只能向右跳' },
            { type: 'wait', duration: 500 },
            { type: 'select', x: 2, y: 7, description: '再次选择红马' },
            { type: 'highlight', moves: [
                { x: 0, y: 6 }, { x: 0, y: 8 }, { x: 1, y: 5 },
                { x: 3, y: 5 }, { x: 4, y: 6 }, { x: 4, y: 8 }
            ], description: '现在马有更多走法' }
        ];
    }
    
    // 象的走法动画
    setupElephantMoveAnimation() {
        this.board.addPiece('相', 'red', 2, 9);
        this.board.addPiece('帅', 'red', 4, 9);
        this.board.addPiece('将', 'black', 4, 0);
        
        this.steps = [
            { type: 'select', x: 2, y: 9, description: '选择红相' },
            { type: 'highlight', moves: [
                { x: 0, y: 7 }, { x: 4, y: 7 }
            ], description: '相可以走的位置（田字，不能过河）' },
            { type: 'move', from: { x: 2, y: 9 }, to: { x: 4, y: 7 }, description: '相从(2,9)走到(4,7)' },
            { type: 'wait', duration: 500 },
            { type: 'select', x: 4, y: 7, description: '再次选择红相' },
            { type: 'highlight', moves: [
                { x: 2, y: 5 }, { x: 2, y: 9 }, { x: 6, y: 5 }, { x: 6, y: 9 }
            ], description: '相现在可以走更多位置，但不能过河（y<5）' },
            { type: 'move', from: { x: 4, y: 7 }, to: { x: 6, y: 5 }, description: '相从(4,7)走到(6,5)' }
        ];
    }
    
    // 塞象眼动画
    setupElephantBlockAnimation() {
        this.board.addPiece('相', 'red', 2, 9);
        this.board.addPiece('兵', 'red', 3, 8); // 塞象眼
        this.board.addPiece('帅', 'red', 4, 9);
        this.board.addPiece('将', 'black', 4, 0);
        
        this.steps = [
            { type: 'select', x: 2, y: 9, description: '选择红相' },
            { type: 'highlight', moves: [
                { x: 0, y: 7 }
            ], description: '因为兵在(3,8)塞象眼，相不能向右飞' },
            { type: 'move', from: { x: 2, y: 9 }, to: { x: 0, y: 7 }, description: '相只能向左飞' },
            { type: 'wait', duration: 500 },
            { type: 'select', x: 0, y: 7, description: '再次选择红相' },
            { type: 'highlight', moves: [
                { x: 2, y: 5 }, { x: 2, y: 9 }
            ], description: '现在相可以走的位置' }
        ];
    }
    
    // 炮的走法动画
    setupCannonMoveAnimation() {
        this.board.addPiece('炮', 'red', 1, 7);
        this.board.addPiece('兵', 'red', 1, 5); // 炮架
        this.board.addPiece('帅', 'red', 4, 9);
        this.board.addPiece('将', 'black', 4, 0);
        this.board.addPiece('卒', 'black', 1, 3); // 目标
        this.board.addPiece('士', 'black', 3, 0);
        
        this.steps = [
            { type: 'select', x: 1, y: 7, description: '选择红炮' },
            { type: 'highlight', moves: [
                { x: 0, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 },
                { x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 }, { x: 8, y: 7 },
                { x: 1, y: 6 }, { x: 1, y: 8 }, { x: 1, y: 9 },
                { x: 1, y: 3 } // 可以隔兵吃卒
            ], description: '炮不吃子时走法同车，吃子时需要隔子' },
            { type: 'move', from: { x: 1, y: 7 }, to: { x: 1, y: 6 }, description: '炮向前走一格（不吃子）' },
            { type: 'wait', duration: 500 },
            { type: 'select', x: 1, y: 6, description: '再次选择红炮' },
            { type: 'highlight', moves: [
                { x: 0, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 },
                { x: 1, y: 5 }, { x: 1, y: 7 }, { x: 1, y: 8 }, { x: 1, y: 9 },
                { x: 1, y: 3 } // 隔兵吃卒
            ], description: '炮现在可以隔兵吃卒' },
            { type: 'move', from: { x: 1, y: 6 }, to: { x: 1, y: 3 }, description: '炮隔兵吃卒（炮打隔子）' }
        ];
    }
    
    // 将死动画
    setupCheckmateAnimation() {
        this.board.addPiece('帅', 'red', 4, 9);
        this.board.addPiece('车', 'red', 4, 5);
        this.board.addPiece('仕', 'red', 3, 9);
        this.board.addPiece('将', 'black', 4, 0);
        this.board.addPiece('士', 'black', 3, 0);
        this.board.addPiece('士', 'black', 5, 1);
        
        this.steps = [
            { type: 'select', x: 4, y: 5, description: '选择红车' },
            { type: 'highlight', moves: [
                { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 },
                { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 },
                { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 },
                { x: 4, y: 4 }, { x: 4, y: 6 }, { x: 4, y: 7 }, { x: 4, y: 8 }
            ], description: '车可以走到将的同一条直线上' },
            { type: 'move', from: { x: 4, y: 5 }, to: { x: 4, y: 2 }, description: '车向前走到(4,2)' },
            { type: 'wait', duration: 500 },
            { type: 'select', x: 4, y: 2, description: '红车现在将军' },
            { type: 'highlight', moves: [], description: '黑将被将死！无法应将。' }
        ];
    }
    
    // 困毙动画
    setupStalemateAnimation() {
        this.board.addPiece('帅', 'red', 4, 9);
        this.board.addPiece('车', 'red', 4, 1);
        this.board.addPiece('将', 'black', 4, 0);
        this.board.addPiece('士', 'black', 3, 1);
        this.board.addPiece('象', 'black', 2, 0);
        
        this.steps = [
            { type: 'select', x: 4, y: 0, description: '轮到黑方走棋，选择黑将' },
            { type: 'highlight', moves: [], description: '黑将被红方车和帅困住，无法移动！' },
            { type: 'wait', duration: 1000 },
            { type: 'select', x: 3, y: 1, description: '选择黑士' },
            { type: 'highlight', moves: [], description: '黑士也无法移动！' },
            { type: 'wait', duration: 1000 },
            { type: 'select', x: 2, y: 0, description: '选择黑象' },
            { type: 'highlight', moves: [], description: '黑象同样无法移动！黑方困毙，输棋。' }
        ];
    }
    
    // 抽将动画
    setupDiscoveryAnimation() {
        this.board.addPiece('帅', 'red', 4, 9);
        this.board.addPiece('炮', 'red', 4, 7);
        this.board.addPiece('马', 'red', 4, 5);
        this.board.addPiece('车', 'red', 0, 9);
        this.board.addPiece('将', 'black', 4, 0);
        this.board.addPiece('车', 'black', 6, 4);
        
        this.steps = [
            { type: 'select', x: 4, y: 5, description: '选择红马' },
            { type: 'highlight', moves: [
                { x: 2, y: 4 }, { x: 2, y: 6 }, { x: 3, y: 3 },
                { x: 3, y: 7 }, { x: 5, y: 3 }, { x: 5, y: 7 },
                { x: 6, y: 4 }, { x: 6, y: 6 }
            ], description: '马可以走的位置，注意(6,4)有黑车' },
            { type: 'move', from: { x: 4, y: 5 }, to: { x: 6, y: 4 }, description: '马跳开吃黑车，同时炮将军！' },
            { type: 'wait', duration: 1000 },
            { type: 'select', x: 6, y: 4, description: '红马吃掉黑车' },
            { type: 'highlight', moves: [], description: '黑方必须应将，红方已经抽吃了黑车！这就是抽将战术。' }
        ];
    }
    
    // 播放动画
    playAnimation() {
        if (this.isPlaying || this.steps.length === 0) return;
        
        this.isPlaying = true;
        this.currentStep = 0;
        this.executeStep();
    }
    
    // 暂停动画
    pauseAnimation() {
        this.isPlaying = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    // 重置动画
    resetAnimation() {
        this.pauseAnimation();
        this.currentStep = 0;
        this.board.selectedPiece = null;
        
        const select = document.getElementById('animation-select');
        if (select) {
            this.loadAnimation(select.value);
        }
    }
    
    // 执行步骤
    executeStep() {
        if (!this.isPlaying || this.currentStep >= this.steps.length) {
            this.isPlaying = false;
            return;
        }
        
        const step = this.steps[this.currentStep];
        const descriptionDiv = document.getElementById('animation-description');
        
        switch (step.type) {
            case 'select':
                const piece = this.board.getPieceAt(step.x, step.y);
                if (piece) {
                    this.board.selectedPiece = piece;
                    this.board.draw();
                }
                if (descriptionDiv && step.description) {
                    descriptionDiv.textContent = step.description;
                }
                break;
                
            case 'highlight':
                this.board.draw();
                if (descriptionDiv && step.description) {
                    descriptionDiv.textContent = step.description;
                }
                break;
                
            case 'move':
                const movePiece = this.board.getPieceAt(step.from.x, step.from.y);
                if (movePiece) {
                    // 检查是否吃子
                    const captured = this.board.getPieceAt(step.to.x, step.to.y);
                    if (captured) {
                        captured.isCaptured = true;
                    }
                    
                    // 移动棋子
                    movePiece.x = step.to.x;
                    movePiece.y = step.to.y;
                    this.board.selectedPiece = null;
                    this.board.draw();
                }
                if (descriptionDiv && step.description) {
                    descriptionDiv.textContent = step.description;
                }
                break;
                
            case 'wait':
                // 等待一段时间
                break;
        }
        
        // 计算延迟时间
        const speedMultipliers = [3, 2, 1.5, 1, 0.5];
        const delay = (step.type === 'wait' ? step.duration : 1000) * speedMultipliers[this.animationSpeed - 1];
        
        this.currentStep++;
        
        setTimeout(() => {
            this.executeStep();
        }, delay);
    }
}

// 初始化动画演示
const animationDemo = new AnimationDemo();
