const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        title: '打字练习',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    createMenu();
}

function createMenu() {
    const template = [
        {
            label: '文件',
            submenu: [
                {
                    label: '导入自定义文本',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
                            title: '选择文本文件',
                            filters: [
                                { name: '文本文件', extensions: ['txt'] },
                                { name: '所有文件', extensions: ['*'] }
                            ],
                            properties: ['openFile']
                        });

                        if (!result.canceled && result.filePaths.length > 0) {
                            const filePath = result.filePaths[0];
                            try {
                                const content = fs.readFileSync(filePath, 'utf-8');
                                mainWindow.webContents.send('import-text', content);
                            } catch (err) {
                                dialog.showErrorBox('导入失败', `无法读取文件: ${err.message}`);
                            }
                        }
                    }
                },
                {
                    label: '导出练习记录',
                    accelerator: 'CmdOrCtrl+S',
                    click: async () => {
                        const result = await dialog.showSaveDialog(mainWindow, {
                            title: '保存练习记录',
                            filters: [
                                { name: 'JSON文件', extensions: ['json'] },
                                { name: '文本文件', extensions: ['txt'] }
                            ],
                            defaultPath: '练习记录.json'
                        });

                        if (!result.canceled && result.filePath) {
                            mainWindow.webContents.send('export-records', result.filePath);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: '退出',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: '练习',
            submenu: [
                {
                    label: '重新开始',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        mainWindow.webContents.send('restart-practice');
                    }
                },
                {
                    label: '下一篇',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('next-text');
                    }
                },
                { type: 'separator' },
                {
                    label: '英文练习',
                    type: 'radio',
                    checked: true,
                    click: () => {
                        mainWindow.webContents.send('switch-language', 'english');
                    }
                },
                {
                    label: '中文练习',
                    type: 'radio',
                    click: () => {
                        mainWindow.webContents.send('switch-language', 'chinese');
                    }
                }
            ]
        },
        {
            label: '设置',
            submenu: [
                {
                    label: '音效开关',
                    type: 'checkbox',
                    checked: true,
                    click: (menuItem) => {
                        mainWindow.webContents.send('toggle-sound', menuItem.checked);
                    }
                },
                { type: 'separator' },
                {
                    label: '级别',
                    submenu: [
                        {
                            label: '小学',
                            type: 'radio',
                            checked: true,
                            click: () => {
                                mainWindow.webContents.send('switch-level', 'elementary');
                            }
                        },
                        {
                            label: '初中',
                            type: 'radio',
                            click: () => {
                                mainWindow.webContents.send('switch-level', 'middle');
                            }
                        },
                        {
                            label: '高中',
                            type: 'radio',
                            click: () => {
                                mainWindow.webContents.send('switch-level', 'high');
                            }
                        },
                        {
                            label: '日常短句',
                            type: 'radio',
                            click: () => {
                                mainWindow.webContents.send('switch-level', 'daily');
                            }
                        },
                        {
                            label: '经典名句',
                            type: 'radio',
                            click: () => {
                                mainWindow.webContents.send('switch-level', 'classics');
                            }
                        }
                    ]
                }
            ]
        },
        {
            label: '视图',
            submenu: [
                {
                    label: '刷新',
                    accelerator: 'F5',
                    click: () => {
                        mainWindow.webContents.reload();
                    }
                },
                {
                    label: '强制刷新',
                    accelerator: 'Shift+F5',
                    click: () => {
                        mainWindow.webContents.reloadIgnoringCache();
                    }
                },
                { type: 'separator' },
                {
                    label: '实际大小',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        mainWindow.webContents.setZoomLevel(0);
                    }
                },
                {
                    label: '放大',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        const currentZoom = mainWindow.webContents.getZoomLevel();
                        mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
                    }
                },
                {
                    label: '缩小',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => {
                        const currentZoom = mainWindow.webContents.getZoomLevel();
                        mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
                    }
                },
                { type: 'separator' },
                {
                    label: '开发者工具',
                    accelerator: 'F12',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                },
                {
                    label: '全屏',
                    accelerator: 'F11',
                    click: () => {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen());
                    }
                }
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '使用说明',
                    click: () => {
                        const helpWindow = new BrowserWindow({
                            width: 600,
                            height: 500,
                            title: '使用说明',
                            parent: mainWindow,
                            modal: true,
                            webPreferences: {
                                nodeIntegration: false,
                                contextIsolation: true
                            }
                        });

                        const helpContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>使用说明</title>
    <style>
        body { font-family: 'Microsoft YaHei', sans-serif; padding: 20px; line-height: 1.8; }
        h2 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        h3 { color: #333; margin-top: 20px; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
        .shortcut { background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-family: monospace; }
    </style>
</head>
<body>
    <h2>打字练习应用 - 使用说明</h2>
    
    <h3>基本操作</h3>
    <ul>
        <li>在输入框中输入上方显示的文本</li>
        <li><span class="shortcut">绿色</span> 表示输入正确</li>
        <li><span class="shortcut">红色</span> 表示输入错误</li>
        <li><span class="shortcut">紫色背景</span> 表示当前待输入字符</li>
    </ul>
    
    <h3>快捷键</h3>
    <ul>
        <li><span class="shortcut">Enter</span> - 完成后进入下一篇</li>
        <li><span class="shortcut">Ctrl + O</span> - 导入自定义文本文件</li>
        <li><span class="shortcut">Ctrl + R</span> - 重新开始当前练习</li>
        <li><span class="shortcut">Ctrl + N</span> - 下一篇</li>
        <li><span class="shortcut">F5</span> - 刷新页面</li>
        <li><span class="shortcut">F11</span> - 全屏模式</li>
        <li><span class="shortcut">F12</span> - 开发者工具</li>
    </ul>
    
    <h3>自定义文本格式</h3>
    <ul>
        <li>每行一段文本</li>
        <li>空行分隔不同练习段落</li>
        <li>例如：
<pre>这是第一段练习文本

这是第二段练习文本

这是第三段...</pre>
        </li>
    </ul>
    
    <h3>音效说明</h3>
    <ul>
        <li>输入正确：清脆高音提示</li>
        <li>输入错误：低沉警告音</li>
        <li>完成练习：上升音阶胜利提示</li>
        <li>可在"设置"菜单中关闭音效</li>
    </ul>
</body>
</html>`;

                        helpWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(helpContent)}`);
                    }
                },
                { type: 'separator' },
                {
                    label: '关于',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: '关于 打字练习',
                            message: '打字练习 v1.0.0',
                            detail: '一个支持中英文打字练习的桌面应用\n\n功能特性：\n- 英文/中文双语言支持\n- 小学/初中/高中分级文本\n- 日常短句和经典名句\n- 自定义文本导入\n- 实时成绩统计\n- 打字音效反馈\n- 快捷键支持',
                            buttons: ['确定']
                        });
                    }
                }
            ]
        }
    ];

    if (process.platform === 'darwin') {
        template.unshift({
            label: app.name,
            submenu: [
                {
                    label: '关于 ' + app.name,
                    role: 'about'
                },
                { type: 'separator' },
                {
                    label: '服务',
                    role: 'services'
                },
                { type: 'separator' },
                {
                    label: '隐藏 ' + app.name,
                    accelerator: 'Command+H',
                    role: 'hide'
                },
                {
                    label: '隐藏其他',
                    accelerator: 'Command+Shift+H',
                    role: 'hideOthers'
                },
                {
                    label: '全部显示',
                    role: 'unhide'
                },
                { type: 'separator' },
                {
                    label: '退出',
                    accelerator: 'Command+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.on('save-records', (event, filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: '保存成功',
            message: '练习记录已成功保存！',
            buttons: ['确定']
        });
    } catch (err) {
        dialog.showErrorBox('保存失败', `无法保存文件: ${err.message}`);
    }
});

ipcMain.on('show-error', (event, title, message) => {
    dialog.showErrorBox(title, message);
});
