// 开局库逻辑
class Openings {
    constructor() {
        this.board = null;
        this.currentOpening = null;
        this.currentMove = 0;
        this.openings = this.createOpenings();
    }
    
    init() {
        // 初始化棋盘
        this.board = new Chessboard('opening-board', {
            cellSize: 36,
            padding: 18
        });
        
        // 加载默认开局分类
        this.selectOpeningCategory('popular');
    }
    
    // 创建开局数据
    createOpenings() {
        return {
            popular: [
                {
                    id: 'central-cannon',
                    name: '中炮局',
                    description: '中炮局是最常见的开局之一，以炮二平五（或炮八平五）开局，控制中路，威胁对方中兵，是一种积极主动的开局方式。',
                    moves: [
                        { from: { x: 1, y: 7 }, to: { x: 4, y: 7 }, piece: '炮', color: 'red', notation: '炮二平五' },
                        { from: { x: 1, y: 2 }, to: { x: 4, y: 2 }, piece: '炮', color: 'black', notation: '炮８平５' }
                    ],
                    difficulty: '简单',
                    style: '进攻型'
                },
                {
                    id: 'screen-horses',
                    name: '屏风马',
                    description: '屏风马是应对中炮的常见布局，以马八进七（或马二进三）开局，形成双马保护中兵的局面，稳健而有弹性。',
                    moves: [
                        { from: { x: 1, y: 7 }, to: { x: 4, y: 7 }, piece: '炮', color: 'red', notation: '炮二平五' },
                        { from: { x: 7, y: 0 }, to: { x: 5, y: 2 }, piece: '马', color: 'black', notation: '马８进７' },
                        { from: { x: 1, y: 9 }, to: { x: 3, y: 7 }, piece: '马', color: 'red', notation: '马二进三' },
                        { from: { x: 1, y: 0 }, to: { x: 3, y: 2 }, piece: '马', color: 'black', notation: '马２进３' }
                    ],
                    difficulty: '中等',
                    style: '稳健型'
                },
                {
                    id: 'overlord-cannon',
                    name: '当头炮对屏风马',
                    description: '这是最经典的开局对阵，红方中炮进攻，黑方屏风马防御，双方攻防变化复杂，是象棋入门者必须掌握的基本布局。',
                    moves: [
                        { from: { x: 1, y: 7 }, to: { x: 4, y: 7 }, piece: '炮', color: 'red', notation: '炮二平五' },
                        { from: { x: 7, y: 0 }, to: { x: 5, y: 2 }, piece: '马', color: 'black', notation: '马８进７' },
                        { from: { x: 1, y: 9 }, to: { x: 3, y: 7 }, piece: '马', color: 'red', notation: '马二进三' },
                        { from: { x: 1, y: 0 }, to: { x: 3, y: 2 }, piece: '马', color: 'black', notation: '马２进３' },
                        { from: { x: 0, y: 9 }, to: { x: 0, y: 6 }, piece: '车', color: 'red', notation: '车一平二' },
                        { from: { x: 8, y: 0 }, to: { x: 8, y: 2 }, piece: '车', color: 'black', notation: '车９平８' }
                    ],
                    difficulty: '中等',
                    style: '攻防兼备'
                },
                {
                    id: 'three-hands',
                    name: '三步虎',
                    description: '三步虎是指在开局第三步就出车的布局，特点是快速出动大子，灵活多变，适合喜欢快速对攻的棋手。',
                    moves: [
                        { from: { x: 1, y: 7 }, to: { x: 4, y: 7 }, piece: '炮', color: 'red', notation: '炮二平五' },
                        { from: { x: 1, y: 2 }, to: { x: 4, y: 2 }, piece: '炮', color: 'black', notation: '炮８平５' },
                        { from: { x: 1, y: 9 }, to: { x: 3, y: 7 }, piece: '马', color: 'red', notation: '马二进三' },
                        { from: { x: 8, y: 0 }, to: { x: 8, y: 2 }, piece: '车', color: 'black', notation: '车９平８' }
                    ],
                    difficulty: '简单',
                    style: '进攻型'
                }
            ],
            classic: [
                {
                    id: 'palace-cannon',
                    name: '过宫炮',
                    description: '过宫炮是指炮二平六（或炮八平四），将炮移到九宫一侧，是一种稳健的开局，注重子力协调和阵地战。',
                    moves: [
                        { from: { x: 1, y: 7 }, to: { x: 6, y: 7 }, piece: '炮', color: 'red', notation: '炮二平六' },
                        { from: { x: 7, y: 0 }, to: { x: 5, y: 2 }, piece: '马', color: 'black', notation: '马８进７' }
                    ],
                    difficulty: '中等',
                    style: '稳健型'
                },
                {
                    id: 'flying-elephant',
                    name: '飞相局',
                    description: '飞相局是指相三进五（或相七进五）开局，属于稳健型布局，注重巩固中路，灵活调动子力，适合持久战。',
                    moves: [
                        { from: { x: 2, y: 9 }, to: { x: 4, y: 7 }, piece: '相', color: 'red', notation: '相三进五' },
                        { from: { x: 7, y: 0 }, to: { x: 5, y: 2 }, piece: '马', color: 'black', notation: '马８进７' }
                    ],
                    difficulty: '中等',
                    style: '稳健型'
                },
                {
                    id: 'soldier-advance',
                    name: '仙人指路',
                    description: '仙人指路是指兵七进一（或兵三进一）开局，试探对方应手，灵活多变，可以根据对方的应着演变成各种布局。',
                    moves: [
                        { from: { x: 6, y: 6 }, to: { x: 6, y: 5 }, piece: '兵', color: 'red', notation: '兵七进一' },
                        { from: { x: 6, y: 3 }, to: { x: 6, y: 4 }, piece: '卒', color: 'black', notation: '卒７进１' }
                    ],
                    difficulty: '困难',
                    style: '灵活型'
                },
                {
                    id: 'horse-first',
                    name: '起马局',
                    description: '起马局是指马八进七（或马二进三）开局，稳健灵活，注重子力的协调发展，可以根据对方的应着调整战略。',
                    moves: [
                        { from: { x: 7, y: 9 }, to: { x: 5, y: 7 }, piece: '马', color: 'red', notation: '马八进七' },
                        { from: { x: 7, y: 0 }, to: { x: 5, y: 2 }, piece: '马', color: 'black', notation: '马８进７' }
                    ],
                    difficulty: '中等',
                    style: '稳健型'
                }
            ],
            attacking: [
                {
                    id: 'iron-bullet',
                    name: '铁滑车',
                    description: '铁滑车是一种激烈的弃子攻杀开局，特点是在开局阶段就弃马抢攻，变化复杂激烈，适合喜欢攻杀的棋手。',
                    moves: [
                        { from: { x: 1, y: 9 }, to: { x: 3, y: 7 }, piece: '马', color: 'red', notation: '马二进三' },
                        { from: { x: 1, y: 2 }, to: { x: 3, y: 2 }, piece: '炮', color: 'black', notation: '炮８平７' },
                        { from: { x: 1, y: 7 }, to: { x: 1, y: 5 }, piece: '炮', color: 'red', notation: '炮二进四' }
                    ],
                    difficulty: '困难',
                    style: '攻杀型'
                },
                {
                    id: 'wild-horse',
                    name: '野马操田',
                    description: '野马操田是一种激烈的对攻开局，特点是双马活跃，配合车炮进攻，变化复杂，需要准确计算。',
                    moves: [
                        { from: { x: 1, y: 7 }, to: { x: 4, y: 7 }, piece: '炮', color: 'red', notation: '炮二平五' },
                        { from: { x: 1, y: 2 }, to: { x: 4, y: 2 }, piece: '炮', color: 'black', notation: '炮８平５' },
                        { from: { x: 1, y: 9 }, to: { x: 3, y: 7 }, piece: '马', color: 'red', notation: '马二进三' },
                        { from: { x: 7, y: 0 }, to: { x: 5, y: 2 }, piece: '马', color: 'black', notation: '马８进７' },
                        { from: { x: 0, y: 9 }, to: { x: 0, y: 6 }, piece: '车', color: 'red', notation: '车一平二' },
                        { from: { x: 8, y: 0 }, to: { x: 8, y: 3 }, piece: '车', color: 'black', notation: '车９进１' }
                    ],
                    difficulty: '困难',
                    style: '攻杀型'
                },
                {
                    id: 'heaven-river',
                    name: '顺炮横车对直车',
                    description: '顺炮横车对直车是经典的对攻布局，双方在中路和侧翼展开激烈争夺，变化丰富，攻杀激烈。',
                    moves: [
                        { from: { x: 1, y: 7 }, to: { x: 4, y: 7 }, piece: '炮', color: 'red', notation: '炮二平五' },
                        { from: { x: 1, y: 2 }, to: { x: 4, y: 2 }, piece: '炮', color: 'black', notation: '炮８平５' },
                        { from: { x: 1, y: 9 }, to: { x: 3, y: 7 }, piece: '马', color: 'red', notation: '马二进三' },
                        { from: { x: 7, y: 0 }, to: { x: 5, y: 2 }, piece: '马', color: 'black', notation: '马８进７' },
                        { from: { x: 0, y: 9 }, to: { x: 0, y: 8 }, piece: '车', color: 'red', notation: '车一进一' },
                        { from: { x: 8, y: 0 }, to: { x: 8, y: 2 }, piece: '车', color: 'black', notation: '车９平８' }
                    ],
                    difficulty: '中等',
                    style: '攻杀型'
                },
                {
                    id: 'five-tigers',
                    name: '五虎下山',
                    description: '五虎下山是一种激烈的弃子攻杀开局，特点是快速出动大子，弃子抢攻，变化复杂，需要深厚的计算能力。',
                    moves: [
                        { from: { x: 1, y: 7 }, to: { x: 4, y: 7 }, piece: '炮', color: 'red', notation: '炮二平五' },
                        { from: { x: 7, y: 0 }, to: { x: 5, y: 2 }, piece: '马', color: 'black', notation: '马８进７' },
                        { from: { x: 1, y: 9 }, to: { x: 3, y: 7 }, piece: '马', color: 'red', notation: '马二进三' },
                        { from: { x: 2, y: 3 }, to: { x: 2, y: 4 }, piece: '卒', color: 'black', notation: '卒３进１' },
                        { from: { x: 1, y: 7 }, to: { x: 1, y: 2 }, piece: '炮', color: 'red', notation: '炮八进七' }
                    ],
                    difficulty: '困难',
                    style: '攻杀型'
                }
            ],
            defensive: [
                {
                    id: 'reverse-screen',
                    name: '反宫马',
                    description: '反宫马是应对中炮的稳健布局，特点是士角炮配合屏风马，既可以防守也可以反击，是一种弹性很强的布局。',
                    moves: [
                        { from: { x: 1, y: 7 }, to: { x: 4, y: 7 }, piece: '炮', color: 'red', notation: '炮二平五' },
                        { from: { x: 7, y: 0 }, to: { x: 5, y: 2 }, piece: '马', color: 'black', notation: '马８进７' },
                        { from: { x: 1, y: 9 }, to: { x: 3, y: 7 }, piece: '马', color: 'red', notation: '马二进三' },
                        { from: { x: 7, y: 2 }, to: { x: 5, y: 2 }, piece: '炮', color: 'black', notation: '炮２平６' },
                        { from: { x: 0, y: 9 }, to: { x: 0, y: 6 }, piece: '车', color: 'red', notation: '车一平二' },
                        { from: { x: 1, y: 0 }, to: { x: 3, y: 2 }, piece: '马', color: 'black', notation: '马２进３' }
                    ],
                    difficulty: '中等',
                    style: '防守反击型'
                },
                {
                    id: 'single-horse',
                    name: '单提马',
                    description: '单提马是一种稳健的防守布局，特点是只跳一个正马，另一个马跳边马，注重子力的协调和防守反击。',
                    moves: [
                        { from: { x: 1, y: 7 }, to: { x: 4, y: 7 }, piece: '炮', color: 'red', notation: '炮二平五' },
                        { from: { x: 7, y: 0 }, to: { x: 5, y: 2 }, piece: '马', color: 'black', notation: '马８进７' },
                        { from: { x: 1, y: 9 }, to: { x: 3, y: 7 }, piece: '马', color: 'red', notation: '马二进三' },
                        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 }, piece: '马', color: 'black', notation: '马２进１' },
                        { from: { x: 0, y: 9 }, to: { x: 0, y: 6 }, piece: '车', color: 'red', notation: '车一平二' },
                        { from: { x: 1, y: 2 }, to: { x: 2, y: 2 }, piece: '炮', color: 'black', notation: '炮８平９' }
                    ],
                    difficulty: '中等',
                    style: '防守反击型'
                },
                {
                    id: 'elephant-screen',
                    name: '飞象局对屏风马',
                    description: '飞象局对屏风马是一种稳健的防守布局，双方注重子力的协调发展，形成阵地战，适合擅长持久战的棋手。',
                    moves: [
                        { from: { x: 2, y: 9 }, to: { x: 4, y: 7 }, piece: '相', color: 'red', notation: '相三进五' },
                        { from: { x: 7, y: 0 }, to: { x: 5, y: 2 }, piece: '马', color: 'black', notation: '马８进７' },
                        { from: { x: 7, y: 9 }, to: { x: 5, y: 7 }, piece: '马', color: 'red', notation: '马八进七' },
                        { from: { x: 1, y: 0 }, to: { x: 3, y: 2 }, piece: '马', color: 'black', notation: '马２进３' },
                        { from: { x: 1, y: 9 }, to: { x: 3, y: 7 }, piece: '马', color: 'red', notation: '马二进三' },
                        { from: { x: 2, y: 0 }, to: { x: 4, y: 2 }, piece: '炮', color: 'black', notation: '炮２平５' }
                    ],
                    difficulty: '中等',
                    style: '防守型'
                },
                {
                    id: 'scholar-cannon',
                    name: '士角炮',
                    description: '士角炮是指炮八平六（或炮二平四），将炮放在士角位置，是一种稳健的布局，注重子力协调和防守反击。',
                    moves: [
                        { from: { x: 7, y: 7 }, to: { x: 6, y: 7 }, piece: '炮', color: 'red', notation: '炮八平六' },
                        { from: { x: 1, y: 2 }, to: { x: 4, y: 2 }, piece: '炮', color: 'black', notation: '炮８平５' },
                        { from: { x: 7, y: 9 }, to: { x: 5, y: 7 }, piece: '马', color: 'red', notation: '马八进七' },
                        { from: { x: 7, y: 0 }, to: { x: 5, y: 2 }, piece: '马', color: 'black', notation: '马８进７' },
                        { from: { x: 1, y: 9 }, to: { x: 3, y: 7 }, piece: '马', color: 'red', notation: '马二进三' },
                        { from: { x: 2, y: 3 }, to: { x: 2, y: 4 }, piece: '卒', color: 'black', notation: '卒３进１' }
                    ],
                    difficulty: '中等',
                    style: '防守反击型'
                }
            ]
        };
    }
    
    // 选择开局分类
    selectOpeningCategory(category) {
        // 更新分类列表的选中状态
        const categoryItems = document.querySelectorAll('.opening-categories li');
        categoryItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('onclick')?.includes(category)) {
                item.classList.add('active');
            }
        });
        
        // 更新标题
        const titleElement = document.getElementById('opening-list-title');
        if (titleElement) {
            const titles = {
                popular: '流行开局',
                classic: '经典开局',
                attacking: '攻杀型开局',
                defensive: '防守型开局'
            };
            titleElement.textContent = titles[category] || '开局列表';
        }
        
        // 显示开局列表
        this.displayOpeningList(category);
    }
    
    // 显示开局列表
    displayOpeningList(category) {
        const openings = this.openings[category];
        if (!openings) return;
        
        const listContainer = document.getElementById('opening-items');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        
        openings.forEach(opening => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'opening-item';
            itemDiv.innerHTML = `
                <h4>${opening.name}</h4>
                <p>${opening.description.substring(0, 50)}...</p>
                <div style="margin-top: 10px; font-size: 12px;">
                    <span style="background-color: #f0f0f0; padding: 2px 8px; border-radius: 3px; margin-right: 5px;">
                        ${opening.difficulty}
                    </span>
                    <span style="background-color: #f0f0f0; padding: 2px 8px; border-radius: 3px;">
                        ${opening.style}
                    </span>
                </div>
            `;
            
            itemDiv.addEventListener('click', () => {
                this.selectOpening(opening);
            });
            
            listContainer.appendChild(itemDiv);
        });
    }
    
    // 选择开局
    selectOpening(opening) {
        this.currentOpening = opening;
        this.currentMove = 0;
        
        // 更新详情显示
        const detailTitle = document.getElementById('opening-detail-title');
        const detailDesc = document.getElementById('opening-description');
        
        if (detailTitle) {
            detailTitle.textContent = opening.name;
        }
        
        if (detailDesc) {
            detailDesc.innerHTML = `
                <p>${opening.description}</p>
                <div style="margin-top: 15px;">
                    <strong>难度：</strong>${opening.difficulty}<br>
                    <strong>风格：</strong>${opening.style}<br>
                    <strong>步数：</strong>${opening.moves.length}步
                </div>
            `;
        }
        
        // 重置棋盘
        this.board.initStandardPosition();
        this.board.draw();
        
        // 更新按钮状态
        this.updateButtonStates();
    }
    
    // 下一步
    nextOpeningMove() {
        if (!this.currentOpening || this.currentMove >= this.currentOpening.moves.length) {
            return;
        }
        
        const move = this.currentOpening.moves[this.currentMove];
        
        // 找到并移动棋子
        const piece = this.board.getPieceAt(move.from.x, move.from.y);
        if (piece) {
            // 检查是否吃子
            const captured = this.board.getPieceAt(move.to.x, move.to.y);
            if (captured) {
                captured.isCaptured = true;
            }
            
            // 移动棋子
            piece.x = move.to.x;
            piece.y = move.to.y;
            
            // 切换回合
            this.board.currentTurn = this.board.currentTurn === 'red' ? 'black' : 'red';
            
            // 重新绘制
            this.board.draw();
        }
        
        this.currentMove++;
        this.updateButtonStates();
    }
    
    // 上一步
    prevOpeningMove() {
        if (!this.currentOpening || this.currentMove <= 0) {
            return;
        }
        
        this.currentMove--;
        
        // 重置棋盘并重放所有之前的步骤
        this.board.initStandardPosition();
        
        for (let i = 0; i < this.currentMove; i++) {
            const move = this.currentOpening.moves[i];
            const piece = this.board.getPieceAt(move.from.x, move.from.y);
            if (piece) {
                // 检查是否吃子
                const captured = this.board.getPieceAt(move.to.x, move.to.y);
                if (captured) {
                    captured.isCaptured = true;
                }
                
                // 移动棋子
                piece.x = move.to.x;
                piece.y = move.to.y;
                
                // 切换回合
                this.board.currentTurn = this.board.currentTurn === 'red' ? 'black' : 'red';
            }
        }
        
        this.board.draw();
        this.updateButtonStates();
    }
    
    // 重新演示
    replayOpening() {
        if (!this.currentOpening) return;
        
        this.currentMove = 0;
        this.board.initStandardPosition();
        this.board.draw();
        this.updateButtonStates();
    }
    
    // 更新按钮状态
    updateButtonStates() {
        const prevBtn = document.getElementById('prev-move');
        const nextBtn = document.getElementById('next-move');
        const replayBtn = document.getElementById('replay-opening');
        
        if (!this.currentOpening) {
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            if (replayBtn) replayBtn.disabled = true;
            return;
        }
        
        if (prevBtn) {
            prevBtn.disabled = this.currentMove <= 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentMove >= this.currentOpening.moves.length;
        }
        
        if (replayBtn) {
            replayBtn.disabled = this.currentMove === 0;
        }
    }
}

// 初始化开局库
const openings = new Openings();
