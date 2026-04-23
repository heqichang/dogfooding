// 入门教程逻辑
class Tutorial {
    constructor() {
        this.boards = {};
    }
    
    init() {
        this.initBoard1();
        this.initBoard2();
        this.initBoard3();
        this.initBoard4();
        this.initBoard5();
        this.initBoard6();
        this.initBoard7();
        this.initBoard8();
        this.initBoard9();
    }
    
    // 棋盘1：棋盘介绍
    initBoard1() {
        const canvas = document.getElementById('tutorial-board-1');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const cellSize = 20;
        const padding = 10;
        
        canvas.width = 9 * cellSize + 2 * padding;
        canvas.height = 10 * cellSize + 2 * padding;
        
        // 绘制背景
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制边框
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding - 1, padding - 1, 8 * cellSize + 2, 9 * cellSize + 2);
        
        // 绘制横线
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(padding, padding + i * cellSize);
            ctx.lineTo(padding + 8 * cellSize, padding + i * cellSize);
            ctx.stroke();
        }
        
        // 绘制竖线
        for (let i = 0; i < 9; i++) {
            // 上半部分
            ctx.beginPath();
            ctx.moveTo(padding + i * cellSize, padding);
            ctx.lineTo(padding + i * cellSize, padding + 4 * cellSize);
            ctx.stroke();
            
            // 下半部分
            ctx.beginPath();
            ctx.moveTo(padding + i * cellSize, padding + 5 * cellSize);
            ctx.lineTo(padding + i * cellSize, padding + 9 * cellSize);
            ctx.stroke();
        }
        
        // 绘制楚河汉界
        ctx.fillStyle = '#8B0000';
        ctx.font = '12px KaiTi, SimKai, serif';
        ctx.textAlign = 'center';
        ctx.fillText('楚河', padding + 2 * cellSize, padding + 4.5 * cellSize + 4);
        ctx.fillText('汉界', padding + 6 * cellSize, padding + 4.5 * cellSize + 4);
        
        // 标记九宫
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(padding + 3 * cellSize, padding, 2 * cellSize, 2 * cellSize);
        ctx.fillRect(padding + 3 * cellSize, padding + 7 * cellSize, 2 * cellSize, 2 * cellSize);
        
        // 添加文字标注
        ctx.fillStyle = '#8B0000';
        ctx.font = '10px Arial, sans-serif';
        ctx.fillText('黑方九宫', padding + 4 * cellSize, padding - 2);
        ctx.fillText('红方九宫', padding + 4 * cellSize, padding + 10 * cellSize + 10);
        ctx.fillText('楚河汉界', padding + 4 * cellSize, padding + 4.5 * cellSize + 18);
    }
    
    // 棋盘2：棋子介绍 - 完整棋盘
    initBoard2() {
        const canvas = document.getElementById('tutorial-board-2');
        if (!canvas) return;
        
        this.boards.tutorial2 = new Chessboard('tutorial-board-2', {
            cellSize: 36,
            padding: 18
        });
        this.boards.tutorial2.initStandardPosition();
        this.boards.tutorial2.draw();
    }
    
    // 棋盘3：将/帅的走法
    initBoard3() {
        const canvas = document.getElementById('tutorial-board-3');
        if (!canvas) return;
        
        this.boards.tutorial3 = new Chessboard('tutorial-board-3', {
            cellSize: 36,
            padding: 18
        });
        
        // 添加将和帅在九宫
        this.boards.tutorial3.addPiece('帅', 'red', 4, 9);
        this.boards.tutorial3.addPiece('将', 'black', 4, 0);
        
        // 添加一些障碍
        this.boards.tutorial3.addPiece('仕', 'red', 3, 9);
        this.boards.tutorial3.addPiece('仕', 'red', 5, 8);
        
        this.boards.tutorial3.draw();
    }
    
    // 棋盘4：士/仕的走法
    initBoard4() {
        const canvas = document.getElementById('tutorial-board-4');
        if (!canvas) return;
        
        this.boards.tutorial4 = new Chessboard('tutorial-board-4', {
            cellSize: 36,
            padding: 18
        });
        
        // 添加仕和士
        this.boards.tutorial4.addPiece('仕', 'red', 4, 8);
        this.boards.tutorial4.addPiece('士', 'black', 4, 1);
        
        // 添加将/帅
        this.boards.tutorial4.addPiece('帅', 'red', 4, 9);
        this.boards.tutorial4.addPiece('将', 'black', 4, 0);
        
        this.boards.tutorial4.draw();
    }
    
    // 棋盘5：象/相的走法
    initBoard5() {
        const canvas = document.getElementById('tutorial-board-5');
        if (!canvas) return;
        
        this.boards.tutorial5 = new Chessboard('tutorial-board-5', {
            cellSize: 36,
            padding: 18
        });
        
        // 添加相和象
        this.boards.tutorial5.addPiece('相', 'red', 2, 9);
        this.boards.tutorial5.addPiece('象', 'black', 2, 0);
        
        // 添加塞象眼的例子
        this.boards.tutorial5.addPiece('兵', 'red', 3, 8); // 塞相眼
        
        this.boards.tutorial5.draw();
    }
    
    // 棋盘6：车的走法
    initBoard6() {
        const canvas = document.getElementById('tutorial-board-6');
        if (!canvas) return;
        
        this.boards.tutorial6 = new Chessboard('tutorial-board-6', {
            cellSize: 36,
            padding: 18
        });
        
        // 添加车
        this.boards.tutorial6.addPiece('车', 'red', 0, 9);
        this.boards.tutorial6.addPiece('车', 'black', 0, 0);
        
        // 添加一些障碍
        this.boards.tutorial6.addPiece('马', 'red', 0, 7);
        this.boards.tutorial6.addPiece('卒', 'black', 3, 0);
        
        this.boards.tutorial6.draw();
    }
    
    // 棋盘7：马的走法
    initBoard7() {
        const canvas = document.getElementById('tutorial-board-7');
        if (!canvas) return;
        
        this.boards.tutorial7 = new Chessboard('tutorial-board-7', {
            cellSize: 36,
            padding: 18
        });
        
        // 添加马
        this.boards.tutorial7.addPiece('马', 'red', 1, 9);
        this.boards.tutorial7.addPiece('马', 'black', 1, 0);
        
        // 添加蹩马腿的例子
        this.boards.tutorial7.addPiece('相', 'red', 1, 8); // 蹩马腿
        
        this.boards.tutorial7.draw();
    }
    
    // 棋盘8：炮的走法
    initBoard8() {
        const canvas = document.getElementById('tutorial-board-8');
        if (!canvas) return;
        
        this.boards.tutorial8 = new Chessboard('tutorial-board-8', {
            cellSize: 36,
            padding: 18
        });
        
        // 添加炮
        this.boards.tutorial8.addPiece('炮', 'red', 1, 7);
        this.boards.tutorial8.addPiece('炮', 'black', 1, 2);
        
        // 添加炮架和目标
        this.boards.tutorial8.addPiece('兵', 'red', 1, 5);
        this.boards.tutorial8.addPiece('卒', 'black', 1, 0);
        this.boards.tutorial8.addPiece('卒', 'black', 1, 4);
        
        this.boards.tutorial8.draw();
    }
    
    // 棋盘9：兵/卒的走法
    initBoard9() {
        const canvas = document.getElementById('tutorial-board-9');
        if (!canvas) return;
        
        this.boards.tutorial9 = new Chessboard('tutorial-board-9', {
            cellSize: 36,
            padding: 18
        });
        
        // 未过河的兵
        this.boards.tutorial9.addPiece('兵', 'red', 0, 6);
        this.boards.tutorial9.addPiece('卒', 'black', 0, 3);
        
        // 已过河的兵
        this.boards.tutorial9.addPiece('兵', 'red', 4, 4);
        this.boards.tutorial9.addPiece('卒', 'black', 4, 5);
        
        this.boards.tutorial9.draw();
    }
}

// 初始化教程
const tutorial = new Tutorial();
