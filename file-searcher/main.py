#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
QuickFileSearch - Windows本地文件搜索工具

功能特点:
- 文件名检索 + 文件内容全文检索
- 支持关键词模糊搜索、精准匹配、大小写可选过滤
- 支持筛选文件类型、文件大小、修改时间、创建时间
- 支持指定搜索范围：全盘、自定义磁盘、单个/多个文件夹、排除指定目录
- 支持内容关键词高亮、检索结果预览片段
"""

import sys
import os

from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QFont

try:
    from main_window import MainWindow
except ImportError:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from main_window import MainWindow


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("QuickFileSearch")
    app.setApplicationDisplayName("QuickFileSearch")
    app.setApplicationVersion("1.0.0")
    
    font = QFont("Microsoft YaHei", 9)
    app.setFont(font)
    
    app.setStyle("Fusion")
    
    from PyQt5.QtWidgets import QStyleFactory
    available_styles = QStyleFactory.keys()
    if "Fusion" in available_styles:
        app.setStyle("Fusion")
    
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
