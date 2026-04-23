// 分步教学逻辑
class Lessons {
    constructor() {
        this.board = null;
        this.currentLesson = null;
        this.currentStep = 0;
        this.lessons = this.createLessons();
    }
    
    init() {
        // 初始化棋盘
        this.board = new Chessboard('lesson-board', {
            cellSize: 36,
            padding: 18
        });
        
        // 绑定课程选择器
        const select = document.getElementById('lesson-select');
        if (select) {
            select.addEventListener('change', () => {
                this.loadLesson(select.value);
            });
        }
        
        // 加载默认课程
        this.loadLesson('lesson1');
    }
    
    // 创建课程数据
    createLessons() {
        return {
            lesson1: {
                title: '第一课：认识棋盘和棋子',
                steps: [
                    {
                        title: '步骤1：棋盘结构',
                        description: '中国象棋棋盘由九条平行的竖线和十条平行的横线相交组成，共有九十个交叉点。棋子就摆在交叉点上，而不是格子里。',
                        setup: (board) => {
                            board.clearPieces();
                            // 空棋盘
                        }
                    },
                    {
                        title: '步骤2：楚河汉界',
                        description: '棋盘中间有一条河界，称为"楚河汉界"，将棋盘分为红黑两方。红方在下方，黑方在上方。河界上写有"楚河"和"汉界"。',
                        setup: (board) => {
                            board.clearPieces();
                            // 空棋盘
                        }
                    },
                    {
                        title: '步骤3：九宫格',
                        description: '棋盘两端的中间部分，有"米"字格的地方称为"九宫"，是将（帅）和士（仕）活动的区域。红方九宫在下方，黑方九宫在上方。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤4：红方棋子',
                        description: '红方棋子包括：帅(1)、仕(2)、相(2)、车(2)、马(2)、炮(2)、兵(5)，共16个棋子。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('仕', 'red', 3, 9);
                            board.addPiece('仕', 'red', 5, 9);
                            board.addPiece('相', 'red', 2, 9);
                            board.addPiece('相', 'red', 6, 9);
                            board.addPiece('马', 'red', 1, 9);
                            board.addPiece('马', 'red', 7, 9);
                            board.addPiece('车', 'red', 0, 9);
                            board.addPiece('车', 'red', 8, 9);
                            board.addPiece('炮', 'red', 1, 7);
                            board.addPiece('炮', 'red', 7, 7);
                            board.addPiece('兵', 'red', 0, 6);
                            board.addPiece('兵', 'red', 2, 6);
                            board.addPiece('兵', 'red', 4, 6);
                            board.addPiece('兵', 'red', 6, 6);
                            board.addPiece('兵', 'red', 8, 6);
                        }
                    },
                    {
                        title: '步骤5：黑方棋子',
                        description: '黑方棋子包括：将(1)、士(2)、象(2)、车(2)、马(2)、炮(2)、卒(5)，共16个棋子。红方和黑方的棋子走法基本相同，只是名称不同。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('将', 'black', 4, 0);
                            board.addPiece('士', 'black', 3, 0);
                            board.addPiece('士', 'black', 5, 0);
                            board.addPiece('象', 'black', 2, 0);
                            board.addPiece('象', 'black', 6, 0);
                            board.addPiece('马', 'black', 1, 0);
                            board.addPiece('马', 'black', 7, 0);
                            board.addPiece('车', 'black', 0, 0);
                            board.addPiece('车', 'black', 8, 0);
                            board.addPiece('炮', 'black', 1, 2);
                            board.addPiece('炮', 'black', 7, 2);
                            board.addPiece('卒', 'black', 0, 3);
                            board.addPiece('卒', 'black', 2, 3);
                            board.addPiece('卒', 'black', 4, 3);
                            board.addPiece('卒', 'black', 6, 3);
                            board.addPiece('卒', 'black', 8, 3);
                        }
                    }
                ]
            },
            lesson2: {
                title: '第二课：车和马的走法',
                steps: [
                    {
                        title: '步骤1：车的走法',
                        description: '车是中国象棋中威力最大的棋子，横、竖均可以走，步数不受限制，只要无子阻拦。车的价值约为9分，是所有棋子中价值最高的（除将帅外）。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('车', 'red', 0, 9);
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤2：车的吃子',
                        description: '车的行走路线上有敌方棋子，即可吃掉它。车的吃子方式和走法相同，只要在同一条直线上且中间没有棋子阻挡。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('车', 'red', 0, 9);
                            board.addPiece('卒', 'black', 0, 5);
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤3：车被阻挡',
                        description: '如果车的行走路线上有己方或敌方棋子阻挡，车就不能走过去。图中红车被红马阻挡，不能直接走到最左边。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('车', 'red', 4, 9);
                            board.addPiece('马', 'red', 2, 9);
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤4：马的走法',
                        description: '马每着走"日"字对角线，俗称"马走日"。马可以横走或竖走一格，然后再斜走一格（即"日"字的对角线）。马的价值约为4分。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('马', 'red', 1, 9);
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤5：蹩马腿',
                        description: '如果在要去的方向有别的棋子挡住，马就不能走过去，俗称"蹩马腿"。图中红马被红相挡住，不能向上跳。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('马', 'red', 1, 9);
                            board.addPiece('相', 'red', 1, 8);
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    }
                ]
            },
            lesson3: {
                title: '第三课：炮和兵的走法',
                steps: [
                    {
                        title: '步骤1：炮的走法',
                        description: '炮在不吃子的时候，走法与车完全相同，横、竖均可以走，步数不受限制。炮的价值约为4.5分，比马略高。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('炮', 'red', 1, 7);
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤2：炮的吃子',
                        description: '炮在吃子时，必须有一个棋子（无论己方或对方）作为"炮架"，俗称"炮打隔子"。图中红炮可以隔红兵吃黑卒。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('炮', 'red', 1, 7);
                            board.addPiece('兵', 'red', 1, 5);
                            board.addPiece('卒', 'black', 1, 3);
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤3：炮与车的区别',
                        description: '炮和车的区别在于吃子方式：车可以直接吃子，炮必须隔子吃子。但在开局时，车比炮更灵活，但炮在有炮架时威力很大。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('车', 'red', 0, 9);
                            board.addPiece('炮', 'red', 8, 9);
                            board.addPiece('卒', 'black', 0, 5);
                            board.addPiece('卒', 'black', 8, 5);
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤4：兵的走法',
                        description: '兵（卒）在没过河之前，每着只许向前走一格。红兵向前走意味着y坐标减小，黑卒向前走意味着y坐标增大。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('兵', 'red', 0, 6);
                            board.addPiece('兵', 'red', 2, 6);
                            board.addPiece('兵', 'red', 4, 6);
                            board.addPiece('兵', 'red', 6, 6);
                            board.addPiece('兵', 'red', 8, 6);
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤5：过河兵的走法',
                        description: '过河之后，每着可以向前走一格，也可以横走一格，但不能后退。过河后的兵卒价值大增，尤其在残局阶段。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('兵', 'red', 4, 4);
                            board.addPiece('卒', 'black', 4, 5);
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    }
                ]
            },
            lesson4: {
                title: '第四课：将、士、象的走法',
                steps: [
                    {
                        title: '步骤1：将/帅的走法',
                        description: '将（帅）是棋局的核心，也是双方争夺的目标。它只能在"九宫"内活动，每着只许走一格，前进、后退、横走都可以，但不能走出"九宫"。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤2：将帅对面',
                        description: '特殊规则：将和帅不准在同一直线上直接对面，如一方已先占据，另一方必须回避，否则判负。图中红帅和黑将不能直接对面。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤3：士/仕的走法',
                        description: '士（仕）也只能在"九宫"内活动，它的行棋路径是"九宫"内的斜线，每着只许走一格，只能斜走，不能直走或横走。红方为"仕"，黑方为"士"。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('仕', 'red', 3, 9);
                            board.addPiece('仕', 'red', 5, 9);
                            board.addPiece('将', 'black', 4, 0);
                            board.addPiece('士', 'black', 3, 0);
                            board.addPiece('士', 'black', 5, 0);
                        }
                    },
                    {
                        title: '步骤4：象/相的走法',
                        description: '象（相）不能越过"楚河汉界"，每着走"田"字对角线，俗称"象走田"。红方为"相"，黑方为"象"，但走法完全相同。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('相', 'red', 2, 9);
                            board.addPiece('相', 'red', 6, 9);
                            board.addPiece('将', 'black', 4, 0);
                            board.addPiece('象', 'black', 2, 0);
                            board.addPiece('象', 'black', 6, 0);
                        }
                    },
                    {
                        title: '步骤5：塞象眼',
                        description: '如果"田"字中心有别的棋子（无论己方或对方），象就不能飞过去，俗称"塞象眼"。图中红兵在(3,8)位置，正好塞住了相的象眼。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('相', 'red', 2, 9);
                            board.addPiece('兵', 'red', 3, 8);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    }
                ]
            },
            lesson5: {
                title: '第五课：基本杀法（一）',
                steps: [
                    {
                        title: '步骤1：什么是杀法',
                        description: '杀法是指通过一系列的进攻手段，最终将死对方将帅的方法。学习基本杀法是提高象棋水平的重要途径。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤2：铁门栓',
                        description: '铁门栓是最基本的杀法之一。用车封锁对方将门，再用炮或其他棋子配合将军，形成杀势。图中红车封锁了黑将的出路。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('车', 'red', 4, 2);
                            board.addPiece('将', 'black', 4, 0);
                            board.addPiece('士', 'black', 3, 0);
                            board.addPiece('士', 'black', 5, 1);
                        }
                    },
                    {
                        title: '步骤3：马后炮',
                        description: '马后炮是指用马控制对方将帅的活动范围，再用炮将军，形成杀势。马和炮配合是非常强大的杀法组合。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('马', 'red', 3, 2);
                            board.addPiece('炮', 'red', 3, 5);
                            board.addPiece('将', 'black', 4, 0);
                            board.addPiece('士', 'black', 3, 0);
                            board.addPiece('士', 'black', 5, 1);
                        }
                    },
                    {
                        title: '步骤4：重炮',
                        description: '重炮是指用两个炮在同一条直线上，后面的炮通过前面的炮作为炮架将军，形成杀势。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('炮', 'red', 4, 3);
                            board.addPiece('炮', 'red', 4, 5);
                            board.addPiece('将', 'black', 4, 0);
                            board.addPiece('士', 'black', 3, 0);
                            board.addPiece('士', 'black', 5, 1);
                        }
                    },
                    {
                        title: '步骤5：空头炮',
                        description: '空头炮是指炮在中路，对方将帅无法躲开，形成杀势。空头炮威力巨大，是常见杀法之一。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('炮', 'red', 4, 4);
                            board.addPiece('将', 'black', 4, 0);
                            board.addPiece('士', 'black', 3, 0);
                            board.addPiece('士', 'black', 5, 1);
                        }
                    }
                ]
            },
            lesson6: {
                title: '第六课：基本杀法（二）',
                steps: [
                    {
                        title: '步骤1：钓鱼马',
                        description: '钓鱼马是指马在对方九宫的一侧，控制对方将帅的活动范围，再用车或炮配合将军，形成杀势。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('马', 'red', 2, 2);
                            board.addPiece('车', 'red', 4, 1);
                            board.addPiece('将', 'black', 4, 0);
                            board.addPiece('士', 'black', 3, 0);
                            board.addPiece('士', 'black', 5, 1);
                        }
                    },
                    {
                        title: '步骤2：挂角马',
                        description: '挂角马是指马在对方九宫的角上，控制对方将帅的活动范围，形成杀势。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('马', 'red', 2, 1);
                            board.addPiece('车', 'red', 4, 3);
                            board.addPiece('将', 'black', 4, 0);
                            board.addPiece('士', 'black', 3, 0);
                            board.addPiece('士', 'black', 5, 1);
                        }
                    },
                    {
                        title: '步骤3：高钓马',
                        description: '高钓马是指马在对方九宫的上方，控制对方将帅的活动范围，再用车或炮配合将军，形成杀势。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('马', 'red', 3, 3);
                            board.addPiece('车', 'red', 4, 1);
                            board.addPiece('将', 'black', 4, 0);
                            board.addPiece('士', 'black', 3, 0);
                            board.addPiece('士', 'black', 5, 1);
                        }
                    },
                    {
                        title: '步骤4：八角马',
                        description: '八角马是指马在对方九宫的八个角之一，控制对方将帅的活动范围，形成杀势。图中黑马控制了黑将的所有出路。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('马', 'red', 2, 2);
                            board.addPiece('马', 'red', 6, 2);
                            board.addPiece('将', 'black', 4, 0);
                            board.addPiece('士', 'black', 3, 0);
                            board.addPiece('士', 'black', 5, 1);
                        }
                    },
                    {
                        title: '步骤5：双车错',
                        description: '双车错是指用两个车交替将军，形成杀势。双车配合是最强大的杀法组合之一。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('车', 'red', 4, 2);
                            board.addPiece('车', 'red', 3, 1);
                            board.addPiece('将', 'black', 4, 0);
                            board.addPiece('士', 'black', 3, 0);
                            board.addPiece('士', 'black', 5, 1);
                        }
                    }
                ]
            },
            lesson7: {
                title: '第七课：基本战术（一）',
                steps: [
                    {
                        title: '步骤1：什么是战术',
                        description: '战术是指在对局中，通过巧妙的手段，达到得子、占优、杀棋等目的的方法。学习基本战术是提高象棋水平的重要途径。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤2：捉子',
                        description: '捉子是指进攻对方的棋子，威胁要吃掉它。捉子是最基本的战术之一。图中红车捉黑马。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('车', 'red', 0, 5);
                            board.addPiece('马', 'black', 0, 2);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤3：抽将',
                        description: '抽将是指通过将军的同时，威胁要吃掉对方的棋子。图中红马跳开后，后面的炮正好将军，同时马还可以吃掉黑方的车。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('炮', 'red', 4, 7);
                            board.addPiece('马', 'red', 4, 5);
                            board.addPiece('车', 'black', 6, 4);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤4：闪击',
                        description: '闪击是指通过移动一个棋子，使另一个棋子发挥作用的战术。闪击和抽将类似，但不一定将军。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('炮', 'red', 4, 7);
                            board.addPiece('马', 'red', 4, 5);
                            board.addPiece('车', 'black', 4, 2);
                            board.addPiece('象', 'black', 6, 4);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤5：牵制',
                        description: '牵制是指用棋子控制对方棋子，使其不能移动或不敢移动的战术。图中红炮牵制了黑士，黑士不能移动，否则黑将就会被将军。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('炮', 'red', 3, 5);
                            board.addPiece('将', 'black', 4, 0);
                            board.addPiece('士', 'black', 3, 0);
                            board.addPiece('士', 'black', 5, 1);
                        }
                    }
                ]
            },
            lesson8: {
                title: '第八课：基本战术（二）',
                steps: [
                    {
                        title: '步骤1：拦阻',
                        description: '拦阻是指用棋子阻挡对方棋子的进攻路线，使其无法发挥作用的战术。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('车', 'red', 4, 5);
                            board.addPiece('炮', 'black', 4, 2);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤2：兑子',
                        description: '兑子是指用价值相当的棋子交换对方棋子的战术。兑子的目的是简化局面、打破对方的防御或进攻。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('车', 'red', 0, 5);
                            board.addPiece('车', 'black', 0, 2);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤3：弃子',
                        description: '弃子是指主动放弃己方棋子，以达到某种战术目的的方法。弃子可以换取更大的利益，如杀棋、得子、占优等。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('车', 'red', 4, 3);
                            board.addPiece('马', 'red', 3, 2);
                            board.addPiece('将', 'black', 4, 0);
                            board.addPiece('士', 'black', 3, 0);
                            board.addPiece('士', 'black', 5, 1);
                            board.addPiece('象', 'black', 2, 0);
                        }
                    },
                    {
                        title: '步骤4：引离',
                        description: '引离是指用战术手段，迫使对方棋子离开重要位置，从而达到某种目的的方法。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('车', 'red', 4, 3);
                            board.addPiece('炮', 'red', 1, 5);
                            board.addPiece('车', 'black', 4, 1);
                            board.addPiece('炮', 'black', 1, 1);
                            board.addPiece('将', 'black', 4, 0);
                        }
                    },
                    {
                        title: '步骤5：顿挫',
                        description: '顿挫是指通过将军或捉子等手段，迫使对方棋子移动，从而达到某种目的的方法。',
                        setup: (board) => {
                            board.clearPieces();
                            board.addPiece('帅', 'red', 4, 9);
                            board.addPiece('车', 'red', 4, 5);
                            board.addPiece('马', 'red', 3, 4);
                            board.addPiece('将', 'black', 4, 0);
                            board.addPiece('士', 'black', 3, 0);
                            board.addPiece('士', 'black', 5, 1);
                            board.addPiece('象', 'black', 2, 0);
                        }
                    }
                ]
            }
        };
    }
    
    // 加载课程
    loadLesson(lessonId) {
        this.currentLesson = this.lessons[lessonId];
        this.currentStep = 0;
        
        if (!this.currentLesson) return;
        
        this.updateStepDisplay();
    }
    
    // 更新步骤显示
    updateStepDisplay() {
        if (!this.currentLesson) return;
        
        const steps = this.currentLesson.steps;
        const totalSteps = steps.length;
        
        // 更新所有步骤的显示状态
        for (let i = 0; i < 5; i++) {
            const stepDiv = document.getElementById(`lesson-step-${i + 1}`);
            const descDiv = document.getElementById(`step-description-${i + 1}`);
            
            if (i < totalSteps) {
                const step = steps[i];
                
                if (stepDiv) {
                    stepDiv.classList.remove('active');
                    if (i === this.currentStep) {
                        stepDiv.classList.add('active');
                    }
                }
                
                if (descDiv) {
                    descDiv.innerHTML = `<h4>${step.title}</h4><p>${step.description}</p>`;
                }
                
                // 设置棋盘
                if (i === this.currentStep && step.setup) {
                    this.board.clearPieces();
                    step.setup(this.board);
                    this.board.draw();
                }
            } else {
                if (stepDiv) {
                    stepDiv.classList.remove('active');
                }
                if (descDiv) {
                    descDiv.innerHTML = '';
                }
            }
        }
        
        // 更新按钮状态
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentStep === 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentStep >= totalSteps - 1;
        }
    }
    
    // 上一步
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }
    
    // 下一步
    nextStep() {
        if (this.currentLesson && this.currentStep < this.currentLesson.steps.length - 1) {
            this.currentStep++;
            this.updateStepDisplay();
        }
    }
    
    // 重置课程
    resetLesson() {
        this.currentStep = 0;
        this.updateStepDisplay();
    }
}

// 初始化分步教学
const lessons = new Lessons();
