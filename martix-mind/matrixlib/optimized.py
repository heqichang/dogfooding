from typing import Tuple, Optional
from .matrix import Matrix
import math


def block_matrix_multiply(A: Matrix, B: Matrix, block_size: Optional[int] = None) -> Matrix:
    """
    分块矩阵乘法优化
    
    将矩阵分成多个块进行乘法，可以提高缓存命中率，从而提高性能。
    
    对于 C = A * B，其中 A 是 m×k，B 是 k×n，C 是 m×n：
    
    将 A 分成 (M_rows, M_cols) 块，每块大小为 block_size×block_size
    将 B 分成 (M_cols, N_cols) 块
    将 C 分成 (M_rows, N_cols) 块
    
    然后 C_ij = sum_{t=1 to M_cols} A_it * B_tj
    
    参数:
        A: 左矩阵
        B: 右矩阵
        block_size: 块大小（如果为 None，则自动选择）
        
    返回:
        Matrix: 乘积矩阵
    """
    if A.cols != B.rows:
        raise ValueError("矩阵维度不兼容，无法相乘")
    
    m, k, n = A.rows, A.cols, B.cols
    
    # 自动选择块大小
    if block_size is None:
        # 典型的 L1 缓存大小约为 32KB
        # 一个双精度浮点数占 8 字节
        # 所以一个 block_size x block_size 的矩阵占用 8 * block_size^2 字节
        # 我们希望三个块（A的一块、B的一块、C的一块）能放入缓存
        # 3 * 8 * block_size^2 <= 32768
        # block_size^2 <= 32768 / 24 ≈ 1365
        # block_size <= 37
        # 取稍小的值以留出余量
        block_size = min(32, m, k, n)
        # 但也不能太小
        block_size = max(block_size, 4)
    
    # 计算需要的块数
    m_blocks = (m + block_size - 1) // block_size  # 向上取整
    k_blocks = (k + block_size - 1) // block_size
    n_blocks = (n + block_size - 1) // block_size
    
    # 初始化结果矩阵
    C = Matrix.zeros(m, n)
    
    # 分块乘法
    # 循环顺序：i, t, j 以提高缓存效率
    for i in range(m_blocks):
        # 当前块在 A 中的行范围
        row_start = i * block_size
        row_end = min((i + 1) * block_size, m)
        row_size = row_end - row_start
        
        for t in range(k_blocks):
            # 当前块在 A 中的列范围，在 B 中的行范围
            col_start_A = t * block_size
            col_end_A = min((t + 1) * block_size, k)
            col_size_A = col_end_A - col_start_A
            
            # 提取 A 的当前块
            A_block = _extract_block(A, row_start, row_end, col_start_A, col_end_A)
            
            for j in range(n_blocks):
                # 当前块在 B 中的列范围
                col_start_B = j * block_size
                col_end_B = min((j + 1) * block_size, n)
                col_size_B = col_end_B - col_start_B
                
                # 提取 B 的当前块
                B_block = _extract_block(B, col_start_A, col_end_A, col_start_B, col_end_B)
                
                # 执行块乘法
                C_block = _naive_multiply(A_block, B_block)
                
                # 将结果累加到 C
                _add_block(C, C_block, row_start, row_end, col_start_B, col_end_B)
    
    return C


def _extract_block(matrix: Matrix, 
                   row_start: int, row_end: int,
                   col_start: int, col_end: int) -> Matrix:
    """
    从矩阵中提取一个块
    
    参数:
        matrix: 源矩阵
        row_start: 起始行
        row_end: 结束行（不包含）
        col_start: 起始列
        col_end: 结束列（不包含）
        
    返回:
        Matrix: 提取的块
    """
    rows = row_end - row_start
    cols = col_end - col_start
    
    block = Matrix.zeros(rows, cols)
    
    for i in range(rows):
        for j in range(cols):
            block.data[i][j] = matrix.data[row_start + i][col_start + j]
    
    return block


def _add_block(matrix: Matrix, block: Matrix,
               row_start: int, row_end: int,
               col_start: int, col_end: int):
    """
    将块添加到矩阵的指定位置（累加）
    
    参数:
        matrix: 目标矩阵
        block: 要添加的块
        row_start: 起始行
        row_end: 结束行（不包含）
        col_start: 起始列
        col_end: 结束列（不包含）
    """
    for i in range(block.rows):
        for j in range(block.cols):
            matrix.data[row_start + i][col_start + j] += block.data[i][j]


def _naive_multiply(A: Matrix, B: Matrix) -> Matrix:
    """
    朴素矩阵乘法（用于小块）
    
    参数:
        A: 左矩阵
        B: 右矩阵
        
    返回:
        Matrix: 乘积矩阵
    """
    m, k, n = A.rows, A.cols, B.cols
    
    C = Matrix.zeros(m, n)
    
    for i in range(m):
        for j in range(n):
            for t in range(k):
                C.data[i][j] += A.data[i][t] * B.data[t][j]
    
    return C


def strassen_multiply(A: Matrix, B: Matrix, threshold: int = 128) -> Matrix:
    """
    Strassen 矩阵乘法算法
    
    时间复杂度：O(n^log2(7)) ≈ O(n^2.807)，比朴素的 O(n^3) 快
    
    对于小矩阵（小于 threshold），使用朴素乘法，因为 Strassen 有额外的开销。
    
    参数:
        A: 左矩阵
        B: 右矩阵
        threshold: 切换到朴素乘法的阈值
        
    返回:
        Matrix: 乘积矩阵
    """
    if A.cols != B.rows:
        raise ValueError("矩阵维度不兼容，无法相乘")
    
    m, k, n = A.rows, A.cols, B.cols
    
    # 对于小矩阵，使用朴素乘法
    if m <= threshold or k <= threshold or n <= threshold:
        return A * B
    
    # 检查是否需要填充到 2 的幂次方
    # 简化实现：我们先实现方阵的 Strassen，然后扩展到非方阵
    
    # 计算需要的大小（下一个 2 的幂次方）
    max_size = max(m, k, n)
    size = 1
    while size < max_size:
        size *= 2
    
    # 填充矩阵
    A_padded = _pad_matrix(A, size, size)
    B_padded = _pad_matrix(B, size, size)
    
    # 递归调用 Strassen
    C_padded = _strassen_recursive(A_padded, B_padded, threshold)
    
    # 去除填充
    C = _unpad_matrix(C_padded, m, n)
    
    return C


def _strassen_recursive(A: Matrix, B: Matrix, threshold: int) -> Matrix:
    """
    Strassen 算法的递归实现
    
    假设 A 和 B 都是方阵且大小是 2 的幂次方
    """
    n = A.rows
    
    # 递归基例
    if n <= threshold:
        return _naive_multiply(A, B)
    
    # 分割点
    half = n // 2
    
    # 将矩阵分成 4 个子矩阵
    A11 = _extract_block(A, 0, half, 0, half)
    A12 = _extract_block(A, 0, half, half, n)
    A21 = _extract_block(A, half, n, 0, half)
    A22 = _extract_block(A, half, n, half, n)
    
    B11 = _extract_block(B, 0, half, 0, half)
    B12 = _extract_block(B, 0, half, half, n)
    B21 = _extract_block(B, half, n, 0, half)
    B22 = _extract_block(B, half, n, half, n)
    
    # 计算 7 个中间矩阵
    M1 = _strassen_recursive(A11 + A22, B11 + B22, threshold)
    M2 = _strassen_recursive(A21 + A22, B11, threshold)
    M3 = _strassen_recursive(A11, B12 - B22, threshold)
    M4 = _strassen_recursive(A22, B21 - B11, threshold)
    M5 = _strassen_recursive(A11 + A12, B22, threshold)
    M6 = _strassen_recursive(A21 - A11, B11 + B12, threshold)
    M7 = _strassen_recursive(A12 - A22, B21 + B22, threshold)
    
    # 计算结果子矩阵
    C11 = M1 + M4 - M5 + M7
    C12 = M3 + M5
    C21 = M2 + M4
    C22 = M1 - M2 + M3 + M6
    
    # 组合结果
    C = Matrix.zeros(n, n)
    
    # 填充 C11
    for i in range(half):
        for j in range(half):
            C.data[i][j] = C11.data[i][j]
    
    # 填充 C12
    for i in range(half):
        for j in range(half):
            C.data[i][half + j] = C12.data[i][j]
    
    # 填充 C21
    for i in range(half):
        for j in range(half):
            C.data[half + i][j] = C21.data[i][j]
    
    # 填充 C22
    for i in range(half):
        for j in range(half):
            C.data[half + i][half + j] = C22.data[i][j]
    
    return C


def _pad_matrix(matrix: Matrix, target_rows: int, target_cols: int) -> Matrix:
    """
    填充矩阵到目标大小
    
    参数:
        matrix: 源矩阵
        target_rows: 目标行数
        target_cols: 目标列数
        
    返回:
        Matrix: 填充后的矩阵
    """
    if matrix.rows >= target_rows and matrix.cols >= target_cols:
        return matrix
    
    padded = Matrix.zeros(target_rows, target_cols)
    
    for i in range(matrix.rows):
        for j in range(matrix.cols):
            padded.data[i][j] = matrix.data[i][j]
    
    return padded


def _unpad_matrix(matrix: Matrix, target_rows: int, target_cols: int) -> Matrix:
    """
    去除矩阵的填充
    
    参数:
        matrix: 填充后的矩阵
        target_rows: 目标行数
        target_cols: 目标列数
        
    返回:
        Matrix: 去除填充后的矩阵
    """
    if matrix.rows == target_rows and matrix.cols == target_cols:
        return matrix
    
    unpadded = Matrix.zeros(target_rows, target_cols)
    
    for i in range(target_rows):
        for j in range(target_cols):
            unpadded.data[i][j] = matrix.data[i][j]
    
    return unpadded


def loop_optimized_multiply(A: Matrix, B: Matrix) -> Matrix:
    """
    循环优化的矩阵乘法
    
    优化点：
    1. 循环顺序调整（i, k, j）以提高缓存命中率
    2. 局部变量缓存以减少属性访问
    
    参数:
        A: 左矩阵
        B: 右矩阵
        
    返回:
        Matrix: 乘积矩阵
    """
    if A.cols != B.rows:
        raise ValueError("矩阵维度不兼容，无法相乘")
    
    m, k, n = A.rows, A.cols, B.cols
    
    # 使用局部变量提高访问速度
    A_data = A.data
    B_data = B.data
    
    C = Matrix.zeros(m, n)
    C_data = C.data
    
    # 循环顺序：i, k, j
    # 这样 A 是顺序访问，B 也是部分顺序访问
    for i in range(m):
        A_row = A_data[i]
        C_row = C_data[i]
        
        for t in range(k):
            a = A_row[t]
            if a == 0:
                continue  # 跳过零元素
            
            B_row = B_data[t]
            for j in range(n):
                C_row[j] += a * B_row[j]
    
    return C


def fast_multiply(A: Matrix, B: Matrix, method: str = 'auto') -> Matrix:
    """
    快速矩阵乘法（自动选择最优方法）
    
    参数:
        A: 左矩阵
        B: 右矩阵
        method: 方法选择:
            - 'auto': 自动选择
            - 'naive': 朴素乘法
            - 'loop_opt': 循环优化
            - 'block': 分块乘法
            - 'strassen': Strassen 算法
            
    返回:
        Matrix: 乘积矩阵
    """
    if method == 'auto':
        m, k, n = A.rows, A.cols, B.cols
        max_dim = max(m, k, n)
        
        if max_dim > 500:
            # 大矩阵使用 Strassen
            return strassen_multiply(A, B)
        elif max_dim > 100:
            # 中等矩阵使用分块
            return block_matrix_multiply(A, B)
        else:
            # 小矩阵使用循环优化
            return loop_optimized_multiply(A, B)
    
    elif method == 'naive':
        return A * B
    elif method == 'loop_opt':
        return loop_optimized_multiply(A, B)
    elif method == 'block':
        return block_matrix_multiply(A, B)
    elif method == 'strassen':
        return strassen_multiply(A, B)
    else:
        raise ValueError(f"不支持的方法: {method}")
