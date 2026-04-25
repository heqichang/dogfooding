from typing import List, Tuple, Optional, Union
from .matrix import Matrix
import math


class SparseMatrix:
    """
    稀疏矩阵基类
    """
    
    def __init__(self, rows: int, cols: int):
        self.rows = rows
        self.cols = cols
    
    def shape(self) -> Tuple[int, int]:
        return (self.rows, self.cols)
    
    def to_dense(self) -> Matrix:
        raise NotImplementedError("子类必须实现 to_dense 方法")
    
    def nnz(self) -> int:
        raise NotImplementedError("子类必须实现 nnz 方法")
    
    def density(self) -> float:
        return self.nnz() / (self.rows * self.cols)


class CSRMatrix(SparseMatrix):
    """
    CSR (Compressed Sparse Row) 格式稀疏矩阵
    
    CSR 格式使用三个数组存储：
    - values: 非零元素的值
    - col_indices: 非零元素的列索引
    - row_ptr: 每行第一个非零元素在 values 中的索引
    
    例如，对于矩阵：
    [1 0 2]
    [0 3 0]
    [4 5 6]
    
    CSR 表示为：
    values = [1, 2, 3, 4, 5, 6]
    col_indices = [0, 2, 1, 0, 1, 2]
    row_ptr = [0, 2, 3, 6]
    """
    
    def __init__(self,
                 rows: int,
                 cols: int,
                 values: Optional[List[float]] = None,
                 col_indices: Optional[List[int]] = None,
                 row_ptr: Optional[List[int]] = None):
        """
        初始化 CSR 矩阵
        
        参数:
            rows: 行数
            cols: 列数
            values: 非零元素的值列表
            col_indices: 非零元素的列索引列表
            row_ptr: 行指针列表
        """
        super().__init__(rows, cols)
        
        if values is None:
            values = []
        if col_indices is None:
            col_indices = []
        if row_ptr is None:
            row_ptr = [0] * (rows + 1)
        
        # 验证
        if len(values) != len(col_indices):
            raise ValueError("values 和 col_indices 长度必须相同")
        
        if len(row_ptr) != rows + 1:
            raise ValueError(f"row_ptr 长度必须为 {rows + 1}")
        
        if row_ptr[-1] != len(values):
            raise ValueError("row_ptr 最后一个元素必须等于 values 的长度")
        
        self.values = values.copy()
        self.col_indices = col_indices.copy()
        self.row_ptr = row_ptr.copy()
    
    @classmethod
    def from_dense(cls, dense_matrix: Matrix, tol: float = 1e-12) -> 'CSRMatrix':
        """
        从稠密矩阵创建 CSR 矩阵
        
        参数:
            dense_matrix: 稠密矩阵
            tol: 零元素容差
            
        返回:
            CSRMatrix: CSR 格式的稀疏矩阵
        """
        rows, cols = dense_matrix.rows, dense_matrix.cols
        
        values = []
        col_indices = []
        row_ptr = [0] * (rows + 1)
        
        nnz = 0
        for i in range(rows):
            for j in range(cols):
                if abs(dense_matrix.data[i][j]) > tol:
                    values.append(dense_matrix.data[i][j])
                    col_indices.append(j)
                    nnz += 1
            row_ptr[i + 1] = nnz
        
        return cls(rows, cols, values, col_indices, row_ptr)
    
    def to_dense(self) -> Matrix:
        """
        转换为稠密矩阵
        
        返回:
            Matrix: 稠密矩阵
        """
        dense = Matrix.zeros(self.rows, self.cols)
        
        for i in range(self.rows):
            for k in range(self.row_ptr[i], self.row_ptr[i + 1]):
                j = self.col_indices[k]
                dense.data[i][j] = self.values[k]
        
        return dense
    
    def nnz(self) -> int:
        """
        返回非零元素数量
        
        返回:
            int: 非零元素数量
        """
        return len(self.values)
    
    def __getitem__(self, index: Tuple[int, int]) -> float:
        """
        访问矩阵元素
        
        参数:
            index: (行, 列) 元组
            
        返回:
            float: 元素值
        """
        i, j = index
        
        if i < 0 or i >= self.rows:
            raise IndexError(f"行索引 {i} 超出范围 [0, {self.rows - 1}]")
        if j < 0 or j >= self.cols:
            raise IndexError(f"列索引 {j} 超出范围 [0, {self.cols - 1}]")
        
        # 在第 i 行中查找列 j
        for k in range(self.row_ptr[i], self.row_ptr[i + 1]):
            if self.col_indices[k] == j:
                return self.values[k]
        
        return 0.0
    
    def transpose(self) -> 'CSCMatrix':
        """
        矩阵转置（返回 CSC 格式，因为 CSR 的转置是 CSC）
        
        返回:
            CSCMatrix: 转置后的矩阵（CSC 格式）
        """
        # CSR 转置后变成 CSC
        # 实际上我们可以直接转换
        return CSCMatrix.from_dense(self.to_dense().transpose())
    
    def T(self) -> 'CSCMatrix':
        """
        转置的快捷方式
        """
        return self.transpose()
    
    def __add__(self, other: 'CSRMatrix') -> 'CSRMatrix':
        """
        稀疏矩阵加法
        
        参数:
            other: 另一个 CSR 矩阵
            
        返回:
            CSRMatrix: 和矩阵
        """
        if self.rows != other.rows or self.cols != other.cols:
            raise ValueError("矩阵维度必须相同")
        
        # 转换为稠密计算（简化实现）
        # 实际生产环境中应该使用更高效的稀疏加法
        dense_sum = self.to_dense() + other.to_dense()
        return CSRMatrix.from_dense(dense_sum)
    
    def __mul__(self, other: Union['CSRMatrix', Matrix, float]) -> Union['CSRMatrix', Matrix]:
        """
        稀疏矩阵乘法或数乘
        
        参数:
            other: 可以是:
                - CSRMatrix: 另一个稀疏矩阵
                - Matrix: 稠密矩阵
                - float: 标量
                
        返回:
            Union[CSRMatrix, Matrix]: 乘积
        """
        if isinstance(other, (int, float)):
            # 数乘
            new_values = [v * other for v in self.values]
            return CSRMatrix(self.rows, self.cols, new_values, self.col_indices, self.row_ptr)
        
        elif isinstance(other, CSRMatrix):
            # 稀疏矩阵乘法
            if self.cols != other.rows:
                raise ValueError("矩阵维度不兼容")
            
            # 转换为稠密计算（简化实现）
            dense_product = self.to_dense() * other.to_dense()
            return CSRMatrix.from_dense(dense_product)
        
        elif isinstance(other, Matrix):
            # 稀疏矩阵与稠密矩阵乘法
            if self.cols != other.rows:
                raise ValueError("矩阵维度不兼容")
            
            m, n, p = self.rows, self.cols, other.cols
            result = Matrix.zeros(m, p)
            
            for i in range(m):
                for k in range(self.row_ptr[i], self.row_ptr[i + 1]):
                    a_ik = self.values[k]
                    col_k = self.col_indices[k]
                    
                    for j in range(p):
                        result.data[i][j] += a_ik * other.data[col_k][j]
            
            return result
        
        else:
            raise TypeError(f"不支持的类型: {type(other)}")
    
    def dot(self, other: Union['CSRMatrix', Matrix]) -> Union['CSRMatrix', Matrix]:
        """
        矩阵乘法（与 __mul__ 相同）
        """
        return self * other


class CSCMatrix(SparseMatrix):
    """
    CSC (Compressed Sparse Column) 格式稀疏矩阵
    
    CSC 格式使用三个数组存储：
    - values: 非零元素的值
    - row_indices: 非零元素的行索引
    - col_ptr: 每列第一个非零元素在 values 中的索引
    
    例如，对于矩阵：
    [1 0 2]
    [0 3 0]
    [4 5 6]
    
    CSC 表示为：
    values = [1, 4, 3, 5, 2, 6]
    row_indices = [0, 2, 1, 2, 0, 2]
    col_ptr = [0, 2, 4, 6]
    """
    
    def __init__(self,
                 rows: int,
                 cols: int,
                 values: Optional[List[float]] = None,
                 row_indices: Optional[List[int]] = None,
                 col_ptr: Optional[List[int]] = None):
        """
        初始化 CSC 矩阵
        
        参数:
            rows: 行数
            cols: 列数
            values: 非零元素的值列表
            row_indices: 非零元素的行索引列表
            col_ptr: 列指针列表
        """
        super().__init__(rows, cols)
        
        if values is None:
            values = []
        if row_indices is None:
            row_indices = []
        if col_ptr is None:
            col_ptr = [0] * (cols + 1)
        
        # 验证
        if len(values) != len(row_indices):
            raise ValueError("values 和 row_indices 长度必须相同")
        
        if len(col_ptr) != cols + 1:
            raise ValueError(f"col_ptr 长度必须为 {cols + 1}")
        
        if col_ptr[-1] != len(values):
            raise ValueError("col_ptr 最后一个元素必须等于 values 的长度")
        
        self.values = values.copy()
        self.row_indices = row_indices.copy()
        self.col_ptr = col_ptr.copy()
    
    @classmethod
    def from_dense(cls, dense_matrix: Matrix, tol: float = 1e-12) -> 'CSCMatrix':
        """
        从稠密矩阵创建 CSC 矩阵
        
        参数:
            dense_matrix: 稠密矩阵
            tol: 零元素容差
            
        返回:
            CSCMatrix: CSC 格式的稀疏矩阵
        """
        rows, cols = dense_matrix.rows, dense_matrix.cols
        
        values = []
        row_indices = []
        col_ptr = [0] * (cols + 1)
        
        nnz = 0
        for j in range(cols):
            for i in range(rows):
                if abs(dense_matrix.data[i][j]) > tol:
                    values.append(dense_matrix.data[i][j])
                    row_indices.append(i)
                    nnz += 1
            col_ptr[j + 1] = nnz
        
        return cls(rows, cols, values, row_indices, col_ptr)
    
    def to_dense(self) -> Matrix:
        """
        转换为稠密矩阵
        
        返回:
            Matrix: 稠密矩阵
        """
        dense = Matrix.zeros(self.rows, self.cols)
        
        for j in range(self.cols):
            for k in range(self.col_ptr[j], self.col_ptr[j + 1]):
                i = self.row_indices[k]
                dense.data[i][j] = self.values[k]
        
        return dense
    
    def nnz(self) -> int:
        """
        返回非零元素数量
        
        返回:
            int: 非零元素数量
        """
        return len(self.values)
    
    def __getitem__(self, index: Tuple[int, int]) -> float:
        """
        访问矩阵元素
        
        参数:
            index: (行, 列) 元组
            
        返回:
            float: 元素值
        """
        i, j = index
        
        if i < 0 or i >= self.rows:
            raise IndexError(f"行索引 {i} 超出范围 [0, {self.rows - 1}]")
        if j < 0 or j >= self.cols:
            raise IndexError(f"列索引 {j} 超出范围 [0, {self.cols - 1}]")
        
        # 在第 j 列中查找行 i
        for k in range(self.col_ptr[j], self.col_ptr[j + 1]):
            if self.row_indices[k] == i:
                return self.values[k]
        
        return 0.0
    
    def transpose(self) -> 'CSRMatrix':
        """
        矩阵转置（返回 CSR 格式，因为 CSC 的转置是 CSR）
        
        返回:
            CSRMatrix: 转置后的矩阵（CSR 格式）
        """
        return CSRMatrix.from_dense(self.to_dense().transpose())
    
    def T(self) -> 'CSRMatrix':
        """
        转置的快捷方式
        """
        return self.transpose()
    
    def __add__(self, other: 'CSCMatrix') -> 'CSCMatrix':
        """
        稀疏矩阵加法
        
        参数:
            other: 另一个 CSC 矩阵
            
        返回:
            CSCMatrix: 和矩阵
        """
        if self.rows != other.rows or self.cols != other.cols:
            raise ValueError("矩阵维度必须相同")
        
        dense_sum = self.to_dense() + other.to_dense()
        return CSCMatrix.from_dense(dense_sum)
    
    def __mul__(self, other: Union['CSCMatrix', Matrix, float]) -> Union['CSCMatrix', Matrix]:
        """
        稀疏矩阵乘法或数乘
        
        参数:
            other: 可以是:
                - CSCMatrix: 另一个稀疏矩阵
                - Matrix: 稠密矩阵
                - float: 标量
                
        返回:
            Union[CSCMatrix, Matrix]: 乘积
        """
        if isinstance(other, (int, float)):
            # 数乘
            new_values = [v * other for v in self.values]
            return CSCMatrix(self.rows, self.cols, new_values, self.row_indices, self.col_ptr)
        
        elif isinstance(other, CSCMatrix):
            # 稀疏矩阵乘法
            if self.cols != other.rows:
                raise ValueError("矩阵维度不兼容")
            
            dense_product = self.to_dense() * other.to_dense()
            return CSCMatrix.from_dense(dense_product)
        
        elif isinstance(other, Matrix):
            # 稀疏矩阵与稠密矩阵乘法
            if self.cols != other.rows:
                raise ValueError("矩阵维度不兼容")
            
            m, n, p = self.rows, self.cols, other.cols
            result = Matrix.zeros(m, p)
            
            for j in range(n):
                for k in range(self.col_ptr[j], self.col_ptr[j + 1]):
                    a_ij = self.values[k]
                    row_i = self.row_indices[k]
                    
                    for l in range(p):
                        result.data[row_i][l] += a_ij * other.data[j][l]
            
            return result
        
        else:
            raise TypeError(f"不支持的类型: {type(other)}")
    
    def dot(self, other: Union['CSCMatrix', Matrix]) -> Union['CSCMatrix', Matrix]:
        """
        矩阵乘法
        """
        return self * other


def sparse_random(rows: int, cols: int, density: float = 0.1,
                  low: float = 0.0, high: float = 1.0,
                  format: str = 'csr') -> Union[CSRMatrix, CSCMatrix]:
    """
    创建随机稀疏矩阵
    
    参数:
        rows: 行数
        cols: 列数
        density: 非零元素密度 (0.0 到 1.0)
        low: 随机值下限
        high: 随机值上限
        format: 存储格式 ('csr' 或 'csc')
        
    返回:
        Union[CSRMatrix, CSCMatrix]: 稀疏矩阵
    """
    import random
    
    # 计算非零元素数量
    nnz = int(rows * cols * density)
    
    # 创建稠密矩阵
    dense = Matrix.zeros(rows, cols)
    
    # 随机选择位置
    positions = set()
    while len(positions) < nnz:
        i = random.randint(0, rows - 1)
        j = random.randint(0, cols - 1)
        positions.add((i, j))
    
    # 填充非零元素
    for i, j in positions:
        dense.data[i][j] = random.uniform(low, high)
    
    if format.lower() == 'csr':
        return CSRMatrix.from_dense(dense)
    elif format.lower() == 'csc':
        return CSCMatrix.from_dense(dense)
    else:
        raise ValueError(f"不支持的格式: {format}")
