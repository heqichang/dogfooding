import os
import sys
import threading
from typing import Tuple, Optional
from PyQt5.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLineEdit, QPushButton, QComboBox, QCheckBox,
    QLabel, QSplitter, QTableWidget, QTableWidgetItem,
    QHeaderView, QMenu, QAction, QFileDialog, QMessageBox,
    QGroupBox, QSpinBox, QProgressBar, QStatusBar,
    QToolBar, QSplitter, QFrame, QTextEdit, QScrollArea,
    QSizePolicy, QTabWidget, QListWidget, QListWidgetItem
)
from PyQt5.QtCore import Qt, QTimer, pyqtSignal, QObject, QSize
from PyQt5.QtGui import QFont, QColor, QTextCursor, QIcon, QKeySequence

from config import ConfigManager
from search_engine import SearchEngine
from constants import (
    SEARCH_MODE_FILENAME, SEARCH_MODE_CONTENT, SEARCH_MODE_BOTH,
    MATCH_MODE_FUZZY, MATCH_MODE_EXACT, DEFAULT_FILE_TYPES,
    PREVIEW_FRAGMENT_LENGTH
)
from utils import get_drives, get_file_size_str, format_timestamp, highlight_text


class SearchWorker(QObject):
    result_found = pyqtSignal(dict)
    search_complete = pyqtSignal(int, int)
    error_occurred = pyqtSignal(str)
    
    def __init__(self, search_engine, params):
        super().__init__()
        self.search_engine = search_engine
        self.params = params
        self._is_running = True
    
    def run(self):
        try:
            def callback(data):
                if not self._is_running:
                    return
            
            results = self.search_engine.search(
                query=self.params.get("query", ""),
                search_mode=self.params.get("search_mode"),
                match_mode=self.params.get("match_mode"),
                case_sensitive=self.params.get("case_sensitive"),
                file_type_category=self.params.get("file_type_category"),
                custom_extensions=self.params.get("custom_extensions"),
                min_size=self.params.get("min_size"),
                max_size=self.params.get("max_size"),
                modified_after=self.params.get("modified_after"),
                modified_before=self.params.get("modified_before"),
                created_after=self.params.get("created_after"),
                created_before=self.params.get("created_before"),
                search_paths=self.params.get("search_paths"),
                exclude_paths=self.params.get("exclude_paths"),
                use_index=self.params.get("use_index", True),
                realtime_search=self.params.get("realtime_search", False),
                callback=callback
            )
            
            if self._is_running:
                seen_paths = set()
                for result in results:
                    if result["path"] not in seen_paths:
                        seen_paths.add(result["path"])
                        self.result_found.emit(result)
                
                self.search_complete.emit(len(seen_paths), len(results))
        
        except Exception as e:
            self.error_occurred.emit(str(e))
    
    def stop(self):
        self._is_running = False


class IndexWorker(QObject):
    progress = pyqtSignal(dict)
    complete = pyqtSignal(dict)
    
    def __init__(self, search_engine, paths):
        super().__init__()
        self.search_engine = search_engine
        self.paths = paths
        self._is_running = True
    
    def run(self):
        def callback(data):
            if not self._is_running:
                return
            self.progress.emit(data)
        
        total_stats = {"indexed": 0, "updated": 0, "skipped": 0, "errors": 0, "total": 0}
        
        for path in self.paths:
            if not self._is_running:
                break
            
            stats = self.search_engine.indexer.index_path(path, recursive=True, callback=callback)
            for key in total_stats:
                if key in stats:
                    total_stats[key] += stats[key]
        
        self.complete.emit(total_stats)
    
    def stop(self):
        self._is_running = False


class ResultTableWidget(QTableWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setColumnCount(6)
        self.setHorizontalHeaderLabels([
            "名称", "路径", "大小", "修改时间", "创建时间", "匹配类型"
        ])
        
        header = self.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.Stretch)
        header.setSectionResizeMode(1, QHeaderView.Stretch)
        header.setSectionResizeMode(2, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(3, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(4, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(5, QHeaderView.ResizeToContents)
        
        self.setSelectionBehavior(QTableWidget.SelectRows)
        self.setSelectionMode(QTableWidget.SingleSelection)
        self.setAlternatingRowColors(True)
        self.setSortingEnabled(True)
        self.setEditTriggers(QTableWidget.NoEditTriggers)
        
        self.verticalHeader().setDefaultSectionSize(24)
        self.setMinimumHeight(200)


class PreviewWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(5, 5, 5, 5)
        
        self.info_label = QLabel("未选择文件")
        self.info_label.setStyleSheet("font-weight: bold; padding: 5px;")
        layout.addWidget(self.info_label)
        
        self.preview_text = QTextEdit()
        self.preview_text.setReadOnly(True)
        self.preview_text.setLineWrapMode(QTextEdit.WidgetWidth)
        font = QFont("Consolas", 9)
        self.preview_text.setFont(font)
        layout.addWidget(self.preview_text)
    
    def show_result(self, result: dict, query: str):
        from PyQt5.QtGui import QTextCharFormat, QBrush, QColor, QTextCursor
        from PyQt5.QtCore import Qt
        
        self.preview_text.clear()
        
        info_text = f"文件: {result['name']} | 大小: {result['size_str']} | 修改时间: {result['modified_str']}"
        self.info_label.setText(info_text)
        
        if result.get("match_mode") == "content" and result.get("content_snippet"):
            content = result.get("content_snippet", "")
            
            self.preview_text.setPlainText(content)
            
            if query:
                highlight_format = QTextCharFormat()
                highlight_format.setBackground(QBrush(QColor(255, 255, 0, 180)))
                highlight_format.setForeground(QBrush(QColor(0, 0, 0)))
                
                cursor = self.preview_text.textCursor()
                cursor.setPosition(0)
                self.preview_text.setTextCursor(cursor)
                
                query_lower = query.lower()
                content_lower = content.lower()
                
                pos = 0
                while True:
                    pos = content_lower.find(query_lower, pos)
                    if pos == -1:
                        break
                    
                    cursor.setPosition(pos)
                    cursor.setPosition(pos + len(query), QTextCursor.KeepAnchor)
                    cursor.mergeCharFormat(highlight_format)
                    
                    pos = pos + len(query)
                
                cursor.setPosition(0)
                self.preview_text.setTextCursor(cursor)
                self.preview_text.ensureCursorVisible()
        else:
            self.preview_text.setPlainText("该文件无内容索引或匹配类型为文件名。\n\n点击'打开文件'查看完整内容。")


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        
        self.config = ConfigManager()
        self.search_engine = SearchEngine()
        
        self.search_thread = None
        self.search_worker = None
        self.index_thread = None
        self.index_worker = None
        
        self.results = []
        self.current_result = None
        
        self.init_ui()
        self.load_settings()
        self.init_signals()
    
    def init_ui(self):
        self.setWindowTitle("QuickFileSearch - 本地文件搜索工具")
        self.resize(
            self.config.get("ui.window_width", 1200),
            self.config.get("ui.window_height", 800)
        )
        
        self.create_menu_bar()
        self.create_tool_bar()
        self.create_central_widget()
        self.create_status_bar()
    
    def create_menu_bar(self):
        menubar = self.menuBar()
        
        file_menu = menubar.addMenu("文件(&F)")
        
        open_folder_action = QAction("打开文件夹(&O)", self)
        open_folder_action.setShortcut(QKeySequence.Open)
        open_folder_action.triggered.connect(self.on_open_folder)
        file_menu.addAction(open_folder_action)
        
        file_menu.addSeparator()
        
        exit_action = QAction("退出(&X)", self)
        exit_action.setShortcut(QKeySequence.Quit)
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        index_menu = menubar.addMenu("索引(&I)")
        
        add_location_action = QAction("添加索引位置(&A)", self)
        add_location_action.triggered.connect(self.on_add_index_location)
        index_menu.addAction(add_location_action)
        
        rebuild_index_action = QAction("重建索引(&R)", self)
        rebuild_index_action.triggered.connect(self.on_rebuild_index)
        index_menu.addAction(rebuild_index_action)
        
        clear_index_action = QAction("清除索引(&C)", self)
        clear_index_action.triggered.connect(self.on_clear_index)
        index_menu.addAction(clear_index_action)
        
        index_menu.addSeparator()
        
        index_stats_action = QAction("索引统计(&S)", self)
        index_stats_action.triggered.connect(self.on_show_index_stats)
        index_menu.addAction(index_stats_action)
        
        view_menu = menubar.addMenu("视图(&V)")
        
        self.show_preview_action = QAction("显示预览(&P)", self)
        self.show_preview_action.setCheckable(True)
        self.show_preview_action.setChecked(self.config.get("ui.show_preview", True))
        self.show_preview_action.triggered.connect(self.on_toggle_preview)
        view_menu.addAction(self.show_preview_action)
        
        help_menu = menubar.addMenu("帮助(&H)")
        
        about_action = QAction("关于(&A)", self)
        about_action.triggered.connect(self.on_about)
        help_menu.addAction(about_action)
    
    def create_tool_bar(self):
        toolbar = self.addToolBar("主工具栏")
        toolbar.setMovable(False)
        
        search_label = QLabel("搜索: ")
        toolbar.addWidget(search_label)
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("输入关键词搜索...")
        self.search_input.setMinimumWidth(300)
        self.search_input.returnPressed.connect(self.on_search)
        toolbar.addWidget(self.search_input)
        
        self.search_btn = QPushButton("搜索")
        self.search_btn.clicked.connect(self.on_search)
        toolbar.addWidget(self.search_btn)
        
        self.stop_btn = QPushButton("停止")
        self.stop_btn.setEnabled(False)
        self.stop_btn.clicked.connect(self.on_stop_search)
        toolbar.addWidget(self.stop_btn)
        
        toolbar.addSeparator()
        
        self.index_btn = QPushButton("索引文件")
        self.index_btn.clicked.connect(self.on_start_indexing)
        toolbar.addWidget(self.index_btn)
        
        self.stop_index_btn = QPushButton("停止索引")
        self.stop_index_btn.setEnabled(False)
        self.stop_index_btn.clicked.connect(self.on_stop_indexing)
        toolbar.addWidget(self.stop_index_btn)
    
    def create_central_widget(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(5, 5, 5, 5)
        main_layout.setSpacing(5)
        
        filter_group = QGroupBox("搜索选项")
        filter_layout = QHBoxLayout(filter_group)
        filter_layout.setSpacing(10)
        
        search_mode_label = QLabel("搜索模式:")
        filter_layout.addWidget(search_mode_label)
        
        self.search_mode_combo = QComboBox()
        self.search_mode_combo.addItems(["文件名和内容", "仅文件名", "仅内容"])
        filter_layout.addWidget(self.search_mode_combo)
        
        match_mode_label = QLabel("匹配模式:")
        filter_layout.addWidget(match_mode_label)
        
        self.match_mode_combo = QComboBox()
        self.match_mode_combo.addItems(["模糊匹配", "精确匹配"])
        filter_layout.addWidget(self.match_mode_combo)
        
        self.case_sensitive_check = QCheckBox("区分大小写")
        filter_layout.addWidget(self.case_sensitive_check)
        
        self.realtime_check = QCheckBox("实时搜索(不使用索引)")
        filter_layout.addWidget(self.realtime_check)
        
        filter_layout.addStretch()
        
        main_layout.addWidget(filter_group)
        
        advanced_group = QGroupBox("高级筛选")
        advanced_layout = QVBoxLayout(advanced_group)
        
        row1_layout = QHBoxLayout()
        
        file_type_label = QLabel("文件类型:")
        row1_layout.addWidget(file_type_label)
        
        self.file_type_combo = QComboBox()
        self.file_type_combo.addItem("所有类型", None)
        for key, value in DEFAULT_FILE_TYPES.items():
            self.file_type_combo.addItem(value["name"], key)
        row1_layout.addWidget(self.file_type_combo)
        
        min_size_label = QLabel("最小大小:")
        row1_layout.addWidget(min_size_label)
        
        self.min_size_input = QLineEdit()
        self.min_size_input.setPlaceholderText("例如: 1MB")
        self.min_size_input.setMaximumWidth(100)
        row1_layout.addWidget(self.min_size_input)
        
        max_size_label = QLabel("最大大小:")
        row1_layout.addWidget(max_size_label)
        
        self.max_size_input = QLineEdit()
        self.max_size_input.setPlaceholderText("例如: 100MB")
        self.max_size_input.setMaximumWidth(100)
        row1_layout.addWidget(self.max_size_input)
        
        row1_layout.addStretch()
        advanced_layout.addLayout(row1_layout)
        
        row2_layout = QHBoxLayout()
        
        modified_label = QLabel("修改时间:")
        row2_layout.addWidget(modified_label)
        
        self.modified_after_combo = QComboBox()
        self.modified_after_combo.addItem("不限", None)
        self.modified_after_combo.addItem("今天", "today")
        self.modified_after_combo.addItem("昨天", "yesterday")
        self.modified_after_combo.addItem("本周", "week")
        self.modified_after_combo.addItem("本月", "month")
        self.modified_after_combo.addItem("今年", "year")
        row2_layout.addWidget(self.modified_after_combo)
        
        created_label = QLabel("创建时间:")
        row2_layout.addWidget(created_label)
        
        self.created_after_combo = QComboBox()
        self.created_after_combo.addItem("不限", None)
        self.created_after_combo.addItem("今天", "today")
        self.created_after_combo.addItem("昨天", "yesterday")
        self.created_after_combo.addItem("本周", "week")
        self.created_after_combo.addItem("本月", "month")
        self.created_after_combo.addItem("今年", "year")
        row2_layout.addWidget(self.created_after_combo)
        
        search_loc_label = QLabel("搜索位置:")
        row2_layout.addWidget(search_loc_label)
        
        self.search_loc_combo = QComboBox()
        self.update_search_locations()
        row2_layout.addWidget(self.search_loc_combo)
        
        self.add_loc_btn = QPushButton("添加位置")
        self.add_loc_btn.clicked.connect(self.on_add_search_location)
        row2_layout.addWidget(self.add_loc_btn)
        
        row2_layout.addStretch()
        advanced_layout.addLayout(row2_layout)
        
        main_layout.addWidget(advanced_group)
        
        self.main_splitter = QSplitter(Qt.Vertical)
        
        self.result_table = ResultTableWidget()
        self.result_table.setContextMenuPolicy(Qt.CustomContextMenu)
        self.result_table.customContextMenuRequested.connect(self.on_result_context_menu)
        self.result_table.itemSelectionChanged.connect(self.on_result_selected)
        self.result_table.itemDoubleClicked.connect(self.on_result_double_clicked)
        
        self.main_splitter.addWidget(self.result_table)
        
        self.preview_widget = PreviewWidget()
        if not self.config.get("ui.show_preview", True):
            self.preview_widget.hide()
        self.main_splitter.addWidget(self.preview_widget)
        
        self.main_splitter.setSizes([500, 300])
        
        main_layout.addWidget(self.main_splitter)
        
        self.progress_widget = QWidget()
        progress_layout = QHBoxLayout(self.progress_widget)
        progress_layout.setContentsMargins(0, 0, 0, 0)
        
        self.progress_bar = QProgressBar()
        self.progress_bar.setMinimum(0)
        self.progress_bar.setMaximum(0)
        self.progress_bar.setTextVisible(True)
        progress_layout.addWidget(self.progress_bar)
        
        self.progress_label = QLabel("准备就绪")
        progress_layout.addWidget(self.progress_label)
        
        self.progress_widget.hide()
        main_layout.addWidget(self.progress_widget)
    
    def create_status_bar(self):
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        
        self.status_label = QLabel("就绪")
        self.status_bar.addWidget(self.status_label)
        
        self.result_count_label = QLabel("结果: 0")
        self.status_bar.addPermanentWidget(self.result_count_label)
        
        self.index_stats_label = QLabel("索引: 0 个文件")
        self.status_bar.addPermanentWidget(self.index_stats_label)
        
        self.update_index_stats()
    
    def init_signals(self):
        pass
    
    def update_search_locations(self):
        current_text = self.search_loc_combo.currentText()
        
        self.search_loc_combo.clear()
        self.search_loc_combo.addItem("所有索引位置", None)
        
        drives = get_drives()
        for drive_letter, drive_name in drives:
            self.search_loc_combo.addItem(f"驱动器 {drive_name}", drive_letter)
        
        search_locs = self.config.get("paths.search_locations", [])
        for loc in search_locs:
            self.search_loc_combo.addItem(loc, loc)
        
        index = self.search_loc_combo.findText(current_text)
        if index >= 0:
            self.search_loc_combo.setCurrentIndex(index)
    
    def update_index_stats(self):
        stats = self.search_engine.get_index_stats()
        self.index_stats_label.setText(f"索引: {stats['total_files']} 个文件")
    
    def load_settings(self):
        search_mode = self.config.get("search.search_mode", SEARCH_MODE_BOTH)
        if search_mode == SEARCH_MODE_FILENAME:
            self.search_mode_combo.setCurrentIndex(1)
        elif search_mode == SEARCH_MODE_CONTENT:
            self.search_mode_combo.setCurrentIndex(2)
        else:
            self.search_mode_combo.setCurrentIndex(0)
        
        match_mode = self.config.get("search.match_mode", MATCH_MODE_FUZZY)
        self.match_mode_combo.setCurrentIndex(0 if match_mode == MATCH_MODE_FUZZY else 1)
        
        self.case_sensitive_check.setChecked(self.config.get("search.case_sensitive", False))
    
    def save_settings(self):
        search_mode_index = self.search_mode_combo.currentIndex()
        if search_mode_index == 0:
            self.config.set("search.search_mode", SEARCH_MODE_BOTH)
        elif search_mode_index == 1:
            self.config.set("search.search_mode", SEARCH_MODE_FILENAME)
        else:
            self.config.set("search.search_mode", SEARCH_MODE_CONTENT)
        
        match_mode_index = self.match_mode_combo.currentIndex()
        self.config.set("search.match_mode", MATCH_MODE_FUZZY if match_mode_index == 0 else MATCH_MODE_EXACT)
        
        self.config.set("search.case_sensitive", self.case_sensitive_check.isChecked())
        
        self.config.set("ui.window_width", self.width())
        self.config.set("ui.window_height", self.height())
        self.config.set("ui.show_preview", self.show_preview_action.isChecked())
        
        self.config.save()
    
    def get_search_params(self) -> dict:
        search_mode_index = self.search_mode_combo.currentIndex()
        if search_mode_index == 0:
            search_mode = SEARCH_MODE_BOTH
        elif search_mode_index == 1:
            search_mode = SEARCH_MODE_FILENAME
        else:
            search_mode = SEARCH_MODE_CONTENT
        
        match_mode_index = self.match_mode_combo.currentIndex()
        match_mode = MATCH_MODE_FUZZY if match_mode_index == 0 else MATCH_MODE_EXACT
        
        file_type_category = self.file_type_combo.currentData()
        
        modified_after, modified_before = self._calculate_time_range(
            self.modified_after_combo.currentData()
        )
        created_after, created_before = self._calculate_time_range(
            self.created_after_combo.currentData()
        )
        
        search_loc = self.search_loc_combo.currentData()
        search_paths = None
        if search_loc:
            search_paths = [search_loc]
        
        return {
            "search_mode": search_mode,
            "match_mode": match_mode,
            "case_sensitive": self.case_sensitive_check.isChecked(),
            "file_type_category": file_type_category,
            "min_size": self.min_size_input.text().strip() or None,
            "max_size": self.max_size_input.text().strip() or None,
            "modified_after": modified_after,
            "modified_before": modified_before,
            "created_after": created_after,
            "created_before": created_before,
            "search_paths": search_paths,
            "realtime_search": self.realtime_check.isChecked(),
            "use_index": not self.realtime_check.isChecked()
        }
    
    def _calculate_time_range(self, time_option: str) -> Tuple[Optional[float], Optional[float]]:
        if not time_option:
            return (None, None)
        
        from datetime import datetime, timedelta
        
        now = datetime.now()
        today_start = datetime(now.year, now.month, now.day)
        
        if time_option == "today":
            return (today_start.timestamp(), None)
        elif time_option == "yesterday":
            yesterday_start = today_start - timedelta(days=1)
            return (yesterday_start.timestamp(), today_start.timestamp())
        elif time_option == "week":
            week_start = today_start - timedelta(days=7)
            return (week_start.timestamp(), None)
        elif time_option == "month":
            month_start = today_start - timedelta(days=30)
            return (month_start.timestamp(), None)
        elif time_option == "year":
            year_start = today_start - timedelta(days=365)
            return (year_start.timestamp(), None)
        
        return (None, None)
    
    def on_search(self):
        query = self.search_input.text().strip()
        if not query:
            QMessageBox.warning(self, "警告", "请输入搜索关键词")
            return
        
        self.results = []
        self.result_table.setRowCount(0)
        self.result_count_label.setText("结果: 0")
        
        self.progress_widget.show()
        self.progress_bar.setMaximum(0)
        self.progress_label.setText("正在搜索...")
        self.search_btn.setEnabled(False)
        self.stop_btn.setEnabled(True)
        
        self.config.add_search_history(query)
        
        params = self.get_search_params()
        params["query"] = query
        
        self.search_worker = SearchWorker(self.search_engine, params)
        self.search_worker.result_found.connect(self.on_search_result)
        self.search_worker.search_complete.connect(self.on_search_complete)
        self.search_worker.error_occurred.connect(self.on_search_error)
        
        self.search_thread = threading.Thread(target=self.search_worker.run, daemon=True)
        self.search_thread.start()
    
    def on_search_result(self, result: dict):
        from PyQt5.QtGui import QBrush, QColor
        
        self.results.append(result)
        
        row = self.result_table.rowCount()
        self.result_table.insertRow(row)
        
        is_content_match = result["match_mode"] == "content"
        highlight_brush = QBrush(QColor(255, 255, 200)) if is_content_match else None
        
        name_item = QTableWidgetItem(result["name"])
        name_item.setData(Qt.UserRole, result)
        if highlight_brush:
            name_item.setBackground(highlight_brush)
        self.result_table.setItem(row, 0, name_item)
        
        path_item = QTableWidgetItem(result["path"])
        if highlight_brush:
            path_item.setBackground(highlight_brush)
        self.result_table.setItem(row, 1, path_item)
        
        size_item = QTableWidgetItem(result["size_str"])
        if highlight_brush:
            size_item.setBackground(highlight_brush)
        self.result_table.setItem(row, 2, size_item)
        
        modified_item = QTableWidgetItem(result["modified_str"])
        if highlight_brush:
            modified_item.setBackground(highlight_brush)
        self.result_table.setItem(row, 3, modified_item)
        
        created_item = QTableWidgetItem(result["created_str"])
        if highlight_brush:
            created_item.setBackground(highlight_brush)
        self.result_table.setItem(row, 4, created_item)
        
        match_type_item = QTableWidgetItem(
            "文件名" if result["match_mode"] == "filename" else "内容"
        )
        if is_content_match:
            match_type_item.setBackground(QBrush(QColor(200, 255, 200)))
        self.result_table.setItem(row, 5, match_type_item)
        
        self.result_count_label.setText(f"结果: {len(self.results)}")
    
    def on_search_complete(self, count: int, total: int):
        self.progress_widget.hide()
        self.search_btn.setEnabled(True)
        self.stop_btn.setEnabled(False)
        self.status_label.setText(f"搜索完成，找到 {count} 个结果")
    
    def on_search_error(self, error: str):
        self.progress_widget.hide()
        self.search_btn.setEnabled(True)
        self.stop_btn.setEnabled(False)
        QMessageBox.critical(self, "错误", f"搜索出错: {error}")
    
    def on_stop_search(self):
        if self.search_worker:
            self.search_worker.stop()
        if self.search_thread and self.search_thread.is_alive():
            self.search_thread.join(timeout=2.0)
        
        self.progress_widget.hide()
        self.search_btn.setEnabled(True)
        self.stop_btn.setEnabled(False)
        self.status_label.setText("搜索已停止")
    
    def on_start_indexing(self):
        search_locs = self.config.get("paths.search_locations", [])
        drives = get_drives()
        
        index_paths = []
        if search_locs:
            index_paths.extend(search_locs)
        else:
            for drive_letter, _ in drives:
                index_paths.append(drive_letter)
        
        if not index_paths:
            QMessageBox.warning(self, "警告", "没有可索引的位置")
            return
        
        reply = QMessageBox.question(
            self, "确认",
            f"即将索引以下位置:\n{chr(10).join(index_paths)}\n\n是否继续？",
            QMessageBox.Yes | QMessageBox.No
        )
        
        if reply != QMessageBox.Yes:
            return
        
        self.progress_widget.show()
        self.progress_bar.setMaximum(0)
        self.progress_label.setText("正在索引...")
        self.index_btn.setEnabled(False)
        self.stop_index_btn.setEnabled(True)
        self.status_label.setText("正在建立索引...")
        
        self.index_worker = IndexWorker(self.search_engine, index_paths)
        self.index_worker.progress.connect(self.on_index_progress)
        self.index_worker.complete.connect(self.on_index_complete)
        
        self.index_thread = threading.Thread(target=self.index_worker.run, daemon=True)
        self.index_thread.start()
    
    def on_index_progress(self, data: dict):
        current = data.get("current", 0)
        total = data.get("total", 0)
        path = data.get("path", "")
        
        if total > 0:
            self.progress_bar.setMaximum(total)
            self.progress_bar.setValue(current)
        self.progress_label.setText(f"索引中: {path[-50:] if len(path) > 50 else path}")
    
    def on_index_complete(self, stats: dict):
        self.progress_widget.hide()
        self.index_btn.setEnabled(True)
        self.stop_index_btn.setEnabled(False)
        
        self.update_index_stats()
        
        indexed = stats.get("indexed", 0)
        updated = stats.get("updated", 0)
        skipped = stats.get("skipped", 0)
        errors = stats.get("errors", 0)
        
        QMessageBox.information(
            self, "索引完成",
            f"索引完成:\n"
            f"  - 新增: {indexed} 个文件\n"
            f"  - 更新: {updated} 个文件\n"
            f"  - 跳过: {skipped} 个文件\n"
            f"  - 错误: {errors} 个文件"
        )
        
        self.status_label.setText("索引完成")
    
    def on_stop_indexing(self):
        if self.index_worker:
            self.index_worker.stop()
        if self.index_thread and self.index_thread.is_alive():
            self.index_thread.join(timeout=2.0)
        
        self.progress_widget.hide()
        self.index_btn.setEnabled(True)
        self.stop_index_btn.setEnabled(False)
        self.update_index_stats()
        self.status_label.setText("索引已停止")
    
    def on_result_selected(self):
        selected_rows = self.result_table.selectedItems()
        if not selected_rows:
            return
        
        row = selected_rows[0].row()
        if row >= 0 and row < len(self.results):
            self.current_result = self.results[row]
            
            query = self.search_input.text().strip()
            self.preview_widget.show_result(self.current_result, query)
    
    def on_result_double_clicked(self, item: QTableWidgetItem):
        row = item.row()
        if row >= 0 and row < len(self.results):
            result = self.results[row]
            self.open_file(result["path"])
    
    def on_result_context_menu(self, pos):
        selected_rows = self.result_table.selectedItems()
        if not selected_rows:
            return
        
        row = selected_rows[0].row()
        if row < 0 or row >= len(self.results):
            return
        
        result = self.results[row]
        
        menu = QMenu(self)
        
        open_action = QAction("打开文件", self)
        open_action.triggered.connect(lambda: self.open_file(result["path"]))
        menu.addAction(open_action)
        
        open_folder_action = QAction("打开所在文件夹", self)
        open_folder_action.triggered.connect(lambda: self.open_folder(result["path"]))
        menu.addAction(open_folder_action)
        
        menu.addSeparator()
        
        copy_path_action = QAction("复制文件路径", self)
        copy_path_action.triggered.connect(lambda: self.copy_to_clipboard(result["path"]))
        menu.addAction(copy_path_action)
        
        copy_name_action = QAction("复制文件名", self)
        copy_name_action.triggered.connect(lambda: self.copy_to_clipboard(result["name"]))
        menu.addAction(copy_name_action)
        
        menu.exec_(self.result_table.viewport().mapToGlobal(pos))
    
    def open_file(self, file_path: str):
        if not os.path.exists(file_path):
            QMessageBox.warning(self, "警告", f"文件不存在: {file_path}")
            return
        
        try:
            import subprocess
            os.startfile(file_path)
        except Exception as e:
            QMessageBox.critical(self, "错误", f"无法打开文件: {e}")
    
    def open_folder(self, file_path: str):
        folder = os.path.dirname(file_path)
        if not os.path.exists(folder):
            QMessageBox.warning(self, "警告", f"文件夹不存在: {folder}")
            return
        
        try:
            import subprocess
            subprocess.Popen(f'explorer /select,"{file_path}"')
        except Exception as e:
            QMessageBox.critical(self, "错误", f"无法打开文件夹: {e}")
    
    def copy_to_clipboard(self, text: str):
        from PyQt5.QtWidgets import QApplication
        clipboard = QApplication.clipboard()
        clipboard.setText(text)
        self.status_label.setText("已复制到剪贴板")
    
    def on_open_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "选择文件夹")
        if folder:
            search_locs = self.config.get("paths.search_locations", [])
            if folder not in search_locs:
                search_locs.append(folder)
                self.config.set("paths.search_locations", search_locs)
                self.config.save()
                self.update_search_locations()
    
    def on_add_search_location(self):
        folder = QFileDialog.getExistingDirectory(self, "选择搜索位置")
        if folder:
            search_locs = self.config.get("paths.search_locations", [])
            if folder not in search_locs:
                search_locs.append(folder)
                self.config.set("paths.search_locations", search_locs)
                self.config.save()
                self.update_search_locations()
    
    def on_add_index_location(self):
        folder = QFileDialog.getExistingDirectory(self, "选择索引位置")
        if folder:
            search_locs = self.config.get("paths.search_locations", [])
            if folder not in search_locs:
                search_locs.append(folder)
                self.config.set("paths.search_locations", search_locs)
                self.config.save()
                self.update_search_locations()
    
    def on_rebuild_index(self):
        reply = QMessageBox.question(
            self, "确认",
            "重建索引将删除所有现有索引并重新扫描所有文件。\n是否继续？",
            QMessageBox.Yes | QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            self.search_engine.clear_index()
            self.update_index_stats()
            self.on_start_indexing()
    
    def on_clear_index(self):
        reply = QMessageBox.question(
            self, "确认",
            "确定要清除所有索引吗？",
            QMessageBox.Yes | QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            self.search_engine.clear_index()
            self.update_index_stats()
            self.status_label.setText("索引已清除")
    
    def on_show_index_stats(self):
        stats = self.search_engine.get_index_stats()
        
        QMessageBox.information(
            self, "索引统计",
            f"索引统计信息:\n\n"
            f"  已索引文件数: {stats['total_files']}\n"
            f"  内容索引文件: {stats['indexed_content']}\n"
            f"  总大小: {get_file_size_str(stats['total_size']) if stats['total_size'] else '0 B'}"
        )
    
    def on_toggle_preview(self, checked: bool):
        if checked:
            self.preview_widget.show()
        else:
            self.preview_widget.hide()
        
        self.config.set("ui.show_preview", checked)
        self.config.save()
    
    def on_about(self):
        QMessageBox.about(
            self, "关于",
            "QuickFileSearch v1.0.0\n\n"
            "一个功能强大的Windows本地文件搜索工具\n\n"
            "功能特点:\n"
            "  - 文件名搜索\n"
            "  - 文件内容全文检索\n"
            "  - 支持多种文件格式\n"
            "  - 灵活的过滤选项\n"
            "  - 关键词高亮显示"
        )
    
    def closeEvent(self, event):
        if self.search_worker:
            self.search_worker.stop()
        if self.index_worker:
            self.index_worker.stop()
        
        if self.search_thread and self.search_thread.is_alive():
            self.search_thread.join(timeout=2.0)
        if self.index_thread and self.index_thread.is_alive():
            self.index_thread.join(timeout=2.0)
        
        self.save_settings()
        event.accept()
