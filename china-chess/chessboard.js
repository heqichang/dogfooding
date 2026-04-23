// 象棋棋盘和棋子核心逻辑
class Chessboard {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas element with id ${canvasId} not found`);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        // 棋盘配置
        this.cellSize = options.cellSize || 40;
        this.padding = options.padding || 20;
        this.boardWidth = 8 * this.cellSize + 2 * this.padding;
        this.boardHeight = 9 * this.cellSize + 2 * this.padding;
        
        // 调整canvas尺寸
        this.canvas.width = this.boardWidth;
        this.canvas.height = this.boardHeight;
        
        // 棋盘状态
        this.pieces = [];
        this.selectedPiece = null;
        this.currentTurn = 'red'; // 'red' or 'black'
        this.isFlipped = false;
        
        // 回调函数
        this.onPieceSelected = options.onPieceSelected || null;
        this.onMove = options.onMove || null;
        this.onGameOver = options.onGameOver || null;
        
        // 初始化棋盘
        this.init();
    }
    
    init() {
        // 设置canvas尺寸
        this.canvas.width = this.boardWidth;
        this.canvas.height = this.boardHeight;
        
        // 绑定事件
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }
    
    // 初始化标准开局的棋子位置
    initStandardPosition() {
        this.pieces = [];
        
        // 红方棋子
        this.addPiece('帅', 'red', 4, 9);
        this.addPiece('仕', 'red', 3, 9);
        this.addPiece('仕', 'red', 5, 9);
        this.addPiece('相', 'red', 2, 9);
        this.addPiece('相', 'red', 6, 9);
        this.addPiece('马', 'red', 1, 9);
        this.addPiece('马', 'red', 7, 9);
        this.addPiece('车', 'red', 0, 9);
        this.addPiece('车', 'red', 8, 9);
        this.addPiece('炮', 'red', 1, 7);
        this.addPiece('炮', 'red', 7, 7);
        this.addPiece('兵', 'red', 0, 6);
        this.addPiece('兵', 'red', 2, 6);
        this.addPiece('兵', 'red', 4, 6);
        this.addPiece('兵', 'red', 6, 6);
        this.addPiece('兵', 'red', 8, 6);
        
        // 黑方棋子
        this.addPiece('将', 'black', 4, 0);
        this.addPiece('士', 'black', 3, 0);
        this.addPiece('士', 'black', 5, 0);
        this.addPiece('象', 'black', 2, 0);
        this.addPiece('象', 'black', 6, 0);
        this.addPiece('马', 'black', 1, 0);
        this.addPiece('马', 'black', 7, 0);
        this.addPiece('车', 'black', 0, 0);
        this.addPiece('车', 'black', 8, 0);
        this.addPiece('炮', 'black', 1, 2);
        this.addPiece('炮', 'black', 7, 2);
        this.addPiece('卒', 'black', 0, 3);
        this.addPiece('卒', 'black', 2, 3);
        this.addPiece('卒', 'black', 4, 3);
        this.addPiece('卒', 'black', 6, 3);
        this.addPiece('卒', 'black', 8, 3);
        
        this.currentTurn = 'red';
    }
    
    // 添加棋子
    addPiece(type, color, x, y) {
        this.pieces.push({
            type,
            color,
            x,
            y,
            isCaptured: false
        });
    }
    
    // 清除所有棋子
    clearPieces() {
        this.pieces = [];
        this.selectedPiece = null;
    }
    
    // 获取指定位置的棋子
    getPieceAt(x, y) {
        return this.pieces.find(p => p.x === x && p.y === y && !p.isCaptured);
    }
    
    // 绘制棋盘
    draw() {
        if (!this.ctx) return;
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制边框
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.padding - 2, this.padding - 2, 
                           8 * this.cellSize + 4, 9 * this.cellSize + 4);
        
        // 绘制横线
        for (let i = 0; i < 10; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, this.padding + i * this.cellSize);
            this.ctx.lineTo(this.padding + 8 * this.cellSize, this.padding + i * this.cellSize);
            this.ctx.stroke();
        }
        
        // 绘制竖线
        for (let i = 0; i < 9; i++) {
            // 上半部分
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding + i * this.cellSize, this.padding);
            this.ctx.lineTo(this.padding + i * this.cellSize, this.padding + 4 * this.cellSize);
            this.ctx.stroke();
            
            // 下半部分
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding + i * this.cellSize, this.padding + 5 * this.cellSize);
            this.ctx.lineTo(this.padding + i * this.cellSize, this.padding + 9 * this.cellSize);
            this.ctx.stroke();
        }
        
        // 绘制楚河汉界
        this.ctx.fillStyle = '#8B0000';
        this.ctx.font = '20px KaiTi, SimKai, serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('楚河', this.padding + 2 * this.cellSize, this.padding + 4.5 * this.cellSize + 7);
        this.ctx.fillText('汉界', this.padding + 6 * this.cellSize, this.padding + 4.5 * this.cellSize + 7);
        
        // 绘制九宫格斜线
        // 红方九宫
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding + 3 * this.cellSize, this.padding + 7 * this.cellSize);
        this.ctx.lineTo(this.padding + 5 * this.cellSize, this.padding + 9 * this.cellSize);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding + 5 * this.cellSize, this.padding + 7 * this.cellSize);
        this.ctx.lineTo(this.padding + 3 * this.cellSize, this.padding + 9 * this.cellSize);
        this.ctx.stroke();
        
        // 黑方九宫
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding + 3 * this.cellSize, this.padding);
        this.ctx.lineTo(this.padding + 5 * this.cellSize, this.padding + 2 * this.cellSize);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding + 5 * this.cellSize, this.padding);
        this.ctx.lineTo(this.padding + 3 * this.cellSize, this.padding + 2 * this.cellSize);
        this.ctx.stroke();
        
        // 绘制兵卒和炮的位置标记
        this.drawPositionMarkers();
        
        // 绘制棋子
        this.drawPieces();
        
        // 绘制选中效果
        if (this.selectedPiece) {
            this.drawSelectedHighlight();
            this.drawValidMoves();
        }
    }
    
    // 绘制位置标记（兵卒和炮的位置）
    drawPositionMarkers() {
        // 炮的位置
        const cannonPositions = [
            [1, 2], [7, 2], // 黑方
            [1, 7], [7, 7]  // 红方
        ];
        
        // 兵卒的位置
        const pawnPositions = [
            [0, 3], [2, 3], [4, 3], [6, 3], [8, 3], // 黑方
            [0, 6], [2, 6], [4, 6], [6, 6], [8, 6]  // 红方
        ];
        
        const markerSize = 4;
        
        cannonPositions.forEach(([x, y]) => {
            this.drawMarker(x, y, markerSize);
        });
        
        pawnPositions.forEach(([x, y]) => {
            this.drawMarker(x, y, markerSize);
        });
    }
    
    drawMarker(x, y, size) {
        const centerX = this.padding + x * this.cellSize;
        const centerY = this.padding + y * this.cellSize;
        
        // 四个方向的标记
        const directions = [
            [-1, -1], [1, -1], [-1, 1], [1, 1]
        ];
        
        this.ctx.fillStyle = '#8B4513';
        
        directions.forEach(([dx, dy]) => {
            this.ctx.beginPath();
            this.ctx.arc(centerX + dx * 8, centerY + dy * 8, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    // 绘制棋子
    drawPieces() {
        this.pieces.forEach(piece => {
            if (piece.isCaptured) return;
            
            // 计算实际坐标（考虑棋盘翻转）
            let actualX = piece.x;
            let actualY = piece.y;
            
            if (this.isFlipped) {
                actualX = 8 - piece.x;
                actualY = 9 - piece.y;
            }
            
            const centerX = this.padding + actualX * this.cellSize;
            const centerY = this.padding + actualY * this.cellSize;
            const radius = this.cellSize * 0.4;
            
            // 绘制棋子背景
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = piece.color === 'red' ? '#FFE4B5' : '#D3D3D3';
            this.ctx.fill();
            
            // 绘制棋子边框
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = piece.color === 'red' ? '#8B0000' : '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制棋子文字
            this.ctx.font = `${radius}px KaiTi, SimKai, serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = piece.color === 'red' ? '#8B0000' : '#000000';
            this.ctx.fillText(piece.type, centerX, centerY + 2);
        });
    }
    
    // 绘制选中高亮
    drawSelectedHighlight() {
        let actualX = this.selectedPiece.x;
        let actualY = this.selectedPiece.y;
        
        if (this.isFlipped) {
            actualX = 8 - this.selectedPiece.x;
            actualY = 9 - this.selectedPiece.y;
        }
        
        const centerX = this.padding + actualX * this.cellSize;
        const centerY = this.padding + actualY * this.cellSize;
        const radius = this.cellSize * 0.45;
        
        // 绘制高亮框
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }
    
    // 绘制有效走法
    drawValidMoves() {
        const validMoves = this.getValidMoves(this.selectedPiece);
        
        validMoves.forEach(move => {
            let actualX = move.x;
            let actualY = move.y;
            
            if (this.isFlipped) {
                actualX = 8 - move.x;
                actualY = 9 - move.y;
            }
            
            const centerX = this.padding + actualX * this.cellSize;
            const centerY = this.padding + actualY * this.cellSize;
            
            // 检查是否有敌方棋子
            const targetPiece = this.getPieceAt(move.x, move.y);
            
            if (targetPiece) {
                // 敌方棋子，绘制红色框
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, this.cellSize * 0.45, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#FF0000';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            } else {
                // 空位置，绘制绿色圆点
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, this.cellSize * 0.15, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
                this.ctx.fill();
            }
        });
    }
    
    // 获取棋子的有效走法
    getValidMoves(piece) {
        if (!piece) return [];
        
        const moves = [];
        const { type, color, x, y } = piece;
        
        switch (type) {
            case '帅':
            case '将':
                return this.getKingMoves(x, y, color);
            case '仕':
            case '士':
                return this.getAdvisorMoves(x, y, color);
            case '相':
            case '象':
                return this.getElephantMoves(x, y, color);
            case '车':
                return this.getRookMoves(x, y, color);
            case '马':
                return this.getKnightMoves(x, y, color);
            case '炮':
                return this.getCannonMoves(x, y, color);
            case '兵':
            case '卒':
                return this.getPawnMoves(x, y, color);
            default:
                return [];
        }
    }
    
    // 将/帅的走法
    getKingMoves(x, y, color) {
        const moves = [];
        const isRed = color === 'red';
        
        // 九宫范围
        const minX = 3, maxX = 5;
        const minY = isRed ? 7 : 0;
        const maxY = isRed ? 9 : 2;
        
        // 上下左右
        const directions = [
            [0, -1], [0, 1], [-1, 0], [1, 0]
        ];
        
        directions.forEach(([dx, dy]) => {
            const newX = x + dx;
            const newY = y + dy;
            
            // 检查是否在九宫范围内
            if (newX >= minX && newX <= maxX && newY >= minY && newY <= maxY) {
                const targetPiece = this.getPieceAt(newX, newY);
                // 没有棋子或者是敌方棋子
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({ x: newX, y: newY });
                }
            }
        });
        
        // 将帅对面规则
        const enemyKingType = isRed ? '将' : '帅';
        const enemyKing = this.pieces.find(p => 
            p.type === enemyKingType && !p.isCaptured
        );
        
        if (enemyKing && enemyKing.x === x) {
            // 检查中间是否有棋子
            let hasPieceBetween = false;
            const minYVal = Math.min(y, enemyKing.y);
            const maxYVal = Math.max(y, enemyKing.y);
            
            for (let checkY = minYVal + 1; checkY < maxYVal; checkY++) {
                if (this.getPieceAt(x, checkY)) {
                    hasPieceBetween = true;
                    break;
                }
            }
            
            if (!hasPieceBetween) {
                moves.push({ x: enemyKing.x, y: enemyKing.y });
            }
        }
        
        return moves;
    }
    
    // 士/仕的走法
    getAdvisorMoves(x, y, color) {
        const moves = [];
        const isRed = color === 'red';
        
        // 九宫范围
        const minX = 3, maxX = 5;
        const minY = isRed ? 7 : 0;
        const maxY = isRed ? 9 : 2;
        
        // 斜线方向
        const directions = [
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];
        
        directions.forEach(([dx, dy]) => {
            const newX = x + dx;
            const newY = y + dy;
            
            // 检查是否在九宫范围内
            if (newX >= minX && newX <= maxX && newY >= minY && newY <= maxY) {
                const targetPiece = this.getPieceAt(newX, newY);
                // 没有棋子或者是敌方棋子
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({ x: newX, y: newY });
                }
            }
        });
        
        return moves;
    }
    
    // 象/相的走法
    getElephantMoves(x, y, color) {
        const moves = [];
        const isRed = color === 'red';
        
        // 不能过河
        const minY = isRed ? 5 : 0;
        const maxY = isRed ? 9 : 4;
        
        // 田字方向
        const directions = [
            [-2, -2], [-2, 2], [2, -2], [2, 2]
        ];
        
        // 象眼位置
        const eyePositions = [
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];
        
        directions.forEach(([dx, dy], index) => {
            const newX = x + dx;
            const newY = y + dy;
            
            // 检查是否在己方区域
            if (newX >= 0 && newX <= 8 && newY >= minY && newY <= maxY) {
                // 检查象眼是否被塞
                const eyeX = x + eyePositions[index][0];
                const eyeY = y + eyePositions[index][1];
                
                if (!this.getPieceAt(eyeX, eyeY)) {
                    const targetPiece = this.getPieceAt(newX, newY);
                    // 没有棋子或者是敌方棋子
                    if (!targetPiece || targetPiece.color !== color) {
                        moves.push({ x: newX, y: newY });
                    }
                }
            }
        });
        
        return moves;
    }
    
    // 车的走法
    getRookMoves(x, y, color) {
        const moves = [];
        
        // 上下左右四个方向
        const directions = [
            [0, -1], [0, 1], [-1, 0], [1, 0]
        ];
        
        directions.forEach(([dx, dy]) => {
            let newX = x + dx;
            let newY = y + dy;
            
            // 沿方向一直走
            while (newX >= 0 && newX <= 8 && newY >= 0 && newY <= 9) {
                const targetPiece = this.getPieceAt(newX, newY);
                
                if (!targetPiece) {
                    // 空位置，可以走
                    moves.push({ x: newX, y: newY });
                } else {
                    // 有棋子
                    if (targetPiece.color !== color) {
                        // 敌方棋子，可以吃
                        moves.push({ x: newX, y: newY });
                    }
                    // 有棋子就不能继续走了
                    break;
                }
                
                newX += dx;
                newY += dy;
            }
        });
        
        return moves;
    }
    
    // 马的走法
    getKnightMoves(x, y, color) {
        const moves = [];
        
        // 日字的8个方向
        const directions = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        // 蹩马腿的位置
        const blockPositions = [
            [-1, 0], [-1, 0], [0, -1], [0, 1],
            [0, -1], [0, 1], [1, 0], [1, 0]
        ];
        
        directions.forEach(([dx, dy], index) => {
            const newX = x + dx;
            const newY = y + dy;
            
            // 检查是否在棋盘范围内
            if (newX >= 0 && newX <= 8 && newY >= 0 && newY <= 9) {
                // 检查是否蹩马腿
                const blockX = x + blockPositions[index][0];
                const blockY = y + blockPositions[index][1];
                
                if (!this.getPieceAt(blockX, blockY)) {
                    const targetPiece = this.getPieceAt(newX, newY);
                    // 没有棋子或者是敌方棋子
                    if (!targetPiece || targetPiece.color !== color) {
                        moves.push({ x: newX, y: newY });
                    }
                }
            }
        });
        
        return moves;
    }
    
    // 炮的走法
    getCannonMoves(x, y, color) {
        const moves = [];
        
        // 上下左右四个方向
        const directions = [
            [0, -1], [0, 1], [-1, 0], [1, 0]
        ];
        
        directions.forEach(([dx, dy]) => {
            let newX = x + dx;
            let newY = y + dy;
            let jumped = false;
            
            // 沿方向一直走
            while (newX >= 0 && newX <= 8 && newY >= 0 && newY <= 9) {
                const targetPiece = this.getPieceAt(newX, newY);
                
                if (!jumped) {
                    // 还没跳
                    if (!targetPiece) {
                        // 空位置，可以走
                        moves.push({ x: newX, y: newY });
                    } else {
                        // 有棋子，开始跳
                        jumped = true;
                    }
                } else {
                    // 已经跳过一个棋子了
                    if (targetPiece) {
                        // 有棋子
                        if (targetPiece.color !== color) {
                            // 敌方棋子，可以吃
                            moves.push({ x: newX, y: newY });
                        }
                        // 有棋子就不能继续走了
                        break;
                    }
                }
                
                newX += dx;
                newY += dy;
            }
        });
        
        return moves;
    }
    
    // 兵/卒的走法
    getPawnMoves(x, y, color) {
        const moves = [];
        const isRed = color === 'red';
        const hasCrossedRiver = isRed ? (y <= 4) : (y >= 5);
        
        // 前进方向
        const forwardY = isRed ? y - 1 : y + 1;
        
        // 前进
        if (forwardY >= 0 && forwardY <= 9) {
            const targetPiece = this.getPieceAt(x, forwardY);
            if (!targetPiece || targetPiece.color !== color) {
                moves.push({ x: x, y: forwardY });
            }
        }
        
        // 过河后可以横走
        if (hasCrossedRiver) {
            // 左
            if (x > 0) {
                const targetPiece = this.getPieceAt(x - 1, y);
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({ x: x - 1, y: y });
                }
            }
            
            // 右
            if (x < 8) {
                const targetPiece = this.getPieceAt(x + 1, y);
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({ x: x + 1, y: y });
                }
            }
        }
        
        return moves;
    }
    
    // 处理点击事件
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // 转换为棋盘坐标
        let boardX = Math.round((clickX - this.padding) / this.cellSize);
        let boardY = Math.round((clickY - this.padding) / this.cellSize);
        
        // 考虑棋盘翻转
        if (this.isFlipped) {
            boardX = 8 - boardX;
            boardY = 9 - boardY;
        }
        
        // 检查是否点击在有效范围内
        if (boardX < 0 || boardX > 8 || boardY < 0 || boardY > 9) {
            return;
        }
        
        // 获取点击位置的棋子
        const clickedPiece = this.getPieceAt(boardX, boardY);
        
        if (this.selectedPiece) {
            // 已经选中了棋子
            const validMoves = this.getValidMoves(this.selectedPiece);
            const isValidMove = validMoves.some(m => m.x === boardX && m.y === boardY);
            
            if (isValidMove) {
                // 有效走法，移动棋子
                this.movePiece(this.selectedPiece, boardX, boardY);
            } else if (clickedPiece && clickedPiece.color === this.currentTurn) {
                // 点击了己方另一个棋子，切换选中
                this.selectedPiece = clickedPiece;
                this.draw();
            } else {
                // 取消选中
                this.selectedPiece = null;
                this.draw();
            }
        } else {
            // 还没选中棋子
            if (clickedPiece && clickedPiece.color === this.currentTurn) {
                // 点击了己方棋子，选中它
                this.selectedPiece = clickedPiece;
                this.draw();
                
                // 回调
                if (this.onPieceSelected) {
                    this.onPieceSelected(clickedPiece);
                }
            }
        }
    }
    
    // 移动棋子
    movePiece(piece, newX, newY) {
        const oldX = piece.x;
        const oldY = piece.y;
        
        // 检查是否吃子
        const capturedPiece = this.getPieceAt(newX, newY);
        if (capturedPiece) {
            capturedPiece.isCaptured = true;
            
            // 检查是否将死
            if (capturedPiece.type === '帅' || capturedPiece.type === '将') {
                if (this.onGameOver) {
                    this.onGameOver(this.currentTurn);
                }
            }
        }
        
        // 移动棋子
        piece.x = newX;
        piece.y = newY;
        
        // 切换回合
        this.currentTurn = this.currentTurn === 'red' ? 'black' : 'red';
        
        // 取消选中
        this.selectedPiece = null;
        
        // 重新绘制
        this.draw();
        
        // 回调
        if (this.onMove) {
            this.onMove({
                piece,
                from: { x: oldX, y: oldY },
                to: { x: newX, y: newY },
                captured: capturedPiece
            });
        }
        
        // 检查是否困毙
        this.checkStalemate();
    }
    
    // 检查困毙
    checkStalemate() {
        const currentColor = this.currentTurn;
        const currentPieces = this.pieces.filter(p => p.color === currentColor && !p.isCaptured);
        
        let hasValidMove = false;
        
        for (const piece of currentPieces) {
            const validMoves = this.getValidMoves(piece);
            if (validMoves.length > 0) {
                hasValidMove = true;
                break;
            }
        }
        
        if (!hasValidMove) {
            // 困毙，对方获胜
            if (this.onGameOver) {
                this.onGameOver(currentColor === 'red' ? 'black' : 'red');
            }
        }
    }
    
    // 翻转棋盘
    flip() {
        this.isFlipped = !this.isFlipped;
        this.draw();
    }
    
    // 获取棋子位置的字符串表示（用于棋谱记录）
    getMoveNotation(piece, from, to) {
        const files = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
        const ranks = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
        
        const isRed = piece.color === 'red';
        
        // 棋子名称
        let pieceName = piece.type;
        
        // 列（文件）
        const fromFile = isRed ? files[8 - from.x] : files[from.x];
        const toFile = isRed ? files[8 - to.x] : files[to.x];
        
        // 行（rank）
        const fromRank = isRed ? ranks[9 - from.y] : ranks[from.y];
        const toRank = isRed ? ranks[9 - to.y] : ranks[to.y];
        
        // 移动方向
        let direction = '';
        if (to.y < from.y) {
            direction = isRed ? '进' : '退';
        } else if (to.y > from.y) {
            direction = isRed ? '退' : '进';
        } else {
            direction = '平';
        }
        
        // 移动步数或目标列
        let moveDistance = '';
        if (direction === '平') {
            moveDistance = toFile;
        } else {
            const distance = Math.abs(to.y - from.y);
            moveDistance = ranks[distance - 1];
        }
        
        return `${pieceName}${fromFile}${direction}${moveDistance}`;
    }
}

// 导出Chessboard类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Chessboard;
}
