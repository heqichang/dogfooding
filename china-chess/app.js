// 主应用逻辑
class App {
    constructor() {
        this.currentSection = 'history';
    }
    
    init() {
        // 初始化所有模块
        this.initModules();
        
        // 绑定导航事件
        this.bindNavigation();
        
        // 显示默认页面
        this.showSection('history');
    }
    
    // 初始化所有模块
    initModules() {
        // 初始化教程模块
        if (typeof tutorial !== 'undefined') {
            tutorial.init();
        }
        
        // 初始化动画演示模块
        if (typeof animationDemo !== 'undefined') {
            animationDemo.init();
        }
        
        // 初始化分步教学模块
        if (typeof lessons !== 'undefined') {
            lessons.init();
        }
        
        // 初始化开局库模块
        if (typeof openings !== 'undefined') {
            openings.init();
        }
        
        // 初始化游戏模块
        if (typeof game !== 'undefined') {
            game.init();
        }
    }
    
    // 绑定导航事件
    bindNavigation() {
        // 绑定导航链接
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const sectionId = href.substring(1);
                    this.showSection(sectionId);
                }
            });
        });
    }
    
    // 显示页面
    showSection(sectionId) {
        // 隐藏所有页面
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // 显示指定页面
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // 更新导航高亮
            this.updateNavigationHighlight(sectionId);
            
            // 触发页面特定的初始化
            this.onSectionShow(sectionId);
        }
    }
    
    // 更新导航高亮
    updateNavigationHighlight(sectionId) {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
    }
    
    // 页面显示时的处理
    onSectionShow(sectionId) {
        switch (sectionId) {
            case 'tutorial':
                // 教程页面显示时重新绘制棋盘
                if (typeof tutorial !== 'undefined') {
                    // 确保所有棋盘都已绘制
                    if (tutorial.boards.tutorial2) {
                        tutorial.boards.tutorial2.draw();
                    }
                    if (tutorial.boards.tutorial3) {
                        tutorial.boards.tutorial3.draw();
                    }
                    if (tutorial.boards.tutorial4) {
                        tutorial.boards.tutorial4.draw();
                    }
                    if (tutorial.boards.tutorial5) {
                        tutorial.boards.tutorial5.draw();
                    }
                    if (tutorial.boards.tutorial6) {
                        tutorial.boards.tutorial6.draw();
                    }
                    if (tutorial.boards.tutorial7) {
                        tutorial.boards.tutorial7.draw();
                    }
                    if (tutorial.boards.tutorial8) {
                        tutorial.boards.tutorial8.draw();
                    }
                    if (tutorial.boards.tutorial9) {
                        tutorial.boards.tutorial9.draw();
                    }
                }
                break;
                
            case 'animation':
                // 动画演示页面显示时重置动画
                if (typeof animationDemo !== 'undefined') {
                    animationDemo.resetAnimation();
                }
                break;
                
            case 'step-by-step':
                // 分步教学页面显示时重置课程
                if (typeof lessons !== 'undefined') {
                    lessons.resetLesson();
                }
                break;
                
            case 'opening':
                // 开局库页面显示时重置
                if (typeof openings !== 'undefined') {
                    if (openings.board) {
                        openings.board.initStandardPosition();
                        openings.board.draw();
                    }
                }
                break;
                
            case 'play':
                // 对弈练习页面显示时确保棋盘已绘制
                if (typeof game !== 'undefined') {
                    if (game.board) {
                        game.board.draw();
                    }
                }
                break;
        }
    }
}

// 全局函数 - 显示页面
function showSection(sectionId) {
    if (typeof app !== 'undefined') {
        app.showSection(sectionId);
    }
}

// 全局函数 - 播放动画
function playAnimation() {
    if (typeof animationDemo !== 'undefined') {
        animationDemo.playAnimation();
    }
}

// 全局函数 - 暂停动画
function pauseAnimation() {
    if (typeof animationDemo !== 'undefined') {
        animationDemo.pauseAnimation();
    }
}

// 全局函数 - 重置动画
function resetAnimation() {
    if (typeof animationDemo !== 'undefined') {
        animationDemo.resetAnimation();
    }
}

// 全局函数 - 上一步
function prevStep() {
    if (typeof lessons !== 'undefined') {
        lessons.prevStep();
    }
}

// 全局函数 - 下一步
function nextStep() {
    if (typeof lessons !== 'undefined') {
        lessons.nextStep();
    }
}

// 全局函数 - 重置课程
function resetLesson() {
    if (typeof lessons !== 'undefined') {
        lessons.resetLesson();
    }
}

// 全局函数 - 选择开局分类
function selectOpeningCategory(category) {
    if (typeof openings !== 'undefined') {
        openings.selectOpeningCategory(category);
    }
}

// 全局函数 - 开局上一步
function prevOpeningMove() {
    if (typeof openings !== 'undefined') {
        openings.prevOpeningMove();
    }
}

// 全局函数 - 开局下一步
function nextOpeningMove() {
    if (typeof openings !== 'undefined') {
        openings.nextOpeningMove();
    }
}

// 全局函数 - 重新演示开局
function replayOpening() {
    if (typeof openings !== 'undefined') {
        openings.replayOpening();
    }
}

// 全局函数 - 新游戏
function newGame() {
    if (typeof game !== 'undefined') {
        game.newGame();
    }
}

// 全局函数 - 悔棋
function undoMove() {
    if (typeof game !== 'undefined') {
        game.undoMove();
    }
}

// 全局函数 - 翻转棋盘
function flipBoard() {
    if (typeof game !== 'undefined') {
        game.flipBoard();
    }
}

// 初始化应用
const app = new App();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 如果是立即执行（非DOMContentLoaded）
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    app.init();
}
