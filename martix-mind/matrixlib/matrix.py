from typing import List, Tuple, Union, Optional
import math


class Matrix:
    """
    矩阵类 - 支持基本矩阵运算和高级线性代数操作
    
    Attributes:
        rows (int): 矩阵行数
        cols (int): 矩阵列数
        data (List[List[float]]): 矩阵数据，按行存储
    """
    
    def __init__(self, data: Union[List[List[float]], Tuple[Tuple[float, ...]], int, Tuple[int, int]], 
                 rows: Optional[int] = None, 
                 cols: Optional[int] = None,
                 fill: float = 0.0):
        """
        矩阵构造函数
        
        参数:
            data: 可以是以下类型:
                - List[List[float]]: 二维列表形式的矩阵数据
                - int: 如果同时提供 rows 和 cols，则为行数
                - Tuple[int, int]: (行数, 列数) 元组
            rows: 矩阵行数（当 data 为初始值时使用）
            cols: 矩阵列数（当 data 为初始值时使用）
            fill: 填充值（当创建指定大小的矩阵时使用）
        """
        if isinstance(data, (list, tuple)) and len(data) > 0 and isinstance(data[0], (list, tuple)):
            # 从二维列表/元组创建
            self.rows = len(data)
            self.cols = len(data[0])
            self.data = [[float(x) for x in row] for row in data]
        elif isinstance(data, int) and rows is not None and cols is not None:
            # 创建指定大小的矩阵，data 参数被忽略
            self.rows = rows
            self.cols = cols
            self.data = [[fill for _ in range(cols)] for _ in range(rows)]
        elif isinstance(data, tuple) and len(data) == 2:
            # 从 (rows, cols) 元组创建
            self.rows = data[0]
            self.cols = data[1]
            self.data = [[fill for _ in range(self.cols)] for _ in range(self.rows)]
        else:
            raise ValueError("无效的矩阵构造参数")
        
        # 验证所有行长度相同
        for row in self.data:
            if len(row) != self.cols:
                raise ValueError("所有行必须具有相同的长度")
    
    @classmethod
    def zeros(cls, rows: int, cols: Optional[int] = None) -> 'Matrix':
        """
        创建全零矩阵
        
        参数:
            rows: 行数
            cols: 列数（如果为 None，则创建方阵）
            
        返回:
            Matrix: 全零矩阵
        """
        if cols is None:
            cols = rows
        return cls((rows, cols), fill=0.0)
    
    @classmethod
    def ones(cls, rows: int, cols: Optional[int] = None) -> 'Matrix':
        """
        创建全一矩阵
        
        参数:
            rows: 行数
            cols: 列数（如果为 None，则创建方阵）
            
        返回:
            Matrix: 全一矩阵
        """
        if cols is None:
            cols = rows
        return cls((rows, cols), fill=1.0)
    
    @classmethod
    def identity(cls, size: int) -> 'Matrix':
        """
        创建单位矩阵
        
        参数:
            size: 矩阵大小（方阵）
            
        返回:
            Matrix: 单位矩阵
        """
        result = cls.zeros(size)
        for i in range(size):
            result.data[i][i] = 1.0
        return result
    
    @classmethod
    def random(cls, rows: int, cols: Optional[int] = None, 
               low: float = 0.0, high: float = 1.0) -> 'Matrix':
        """
        创建随机矩阵
        
        参数:
            rows: 行数
            cols: 列数（如果为 None，则创建方阵）
            low: 随机值下限
            high: 随机值上限
            
        返回:
            Matrix: 随机矩阵
        """
        import random
        if cols is None:
            cols = rows
        result = cls.zeros(rows, cols)
        for i in range(rows):
            for j in range(cols):
                result.data[i][j] = random.uniform(low, high)
        return result
    
    def __getitem__(self, index: Union[int, Tuple[int, int]]) -> Union[float, List[float]]:
        """
        矩阵元素访问
        
        参数:
            index: 可以是:
                - int: 返回整行
                - Tuple[int, int]: 返回指定元素
                
        返回:
            Union[float, List[float]]: 矩阵元素或行
        """
        if isinstance(index, int):
            return self.data[index]
        elif isinstance(index, tuple):
            return self.data[index[0]][index[1]]
        else:
            raise TypeError("无效的索引类型")
    
    def __setitem__(self, index: Union[int, Tuple[int, int]], value: Union[float, List[float]]):
        """
        矩阵元素设置
        
        参数:
            index: 可以是:
                - int: 设置整行
                - Tuple[int, int]: 设置指定元素
            value: 要设置的值
        """
        if isinstance(index, int):
            if len(value) != self.cols:
                raise ValueError(f"行长度必须为 {self.cols}")
            self.data[index] = [float(x) for x in value]
        elif isinstance(index, tuple):
            self.data[index[0]][index[1]] = float(value)
        else:
            raise TypeError("无效的索引类型")
    
    def __add__(self, other: 'Matrix') -> 'Matrix':
        """
        矩阵加法
        
        参数:
            other: 另一个矩阵
            
        返回:
            Matrix: 两个矩阵的和
        """
        if self.rows != other.rows or self.cols != other.cols:
            raise ValueError("矩阵维度必须相同才能相加")
        
        result = Matrix.zeros(self.rows, self.cols)
        for i in range(self.rows):
            for j in range(self.cols):
                result.data[i][j] = self.data[i][j] + other.data[i][j]
        return result
    
    def __sub__(self, other: 'Matrix') -> 'Matrix':
        """
        矩阵减法
        
        参数:
            other: 另一个矩阵
            
        返回:
            Matrix: 两个矩阵的差
        """
        if self.rows != other.rows or self.cols != other.cols:
            raise ValueError("矩阵维度必须相同才能相减")
        
        result = Matrix.zeros(self.rows, self.cols)
        for i in range(self.rows):
            for j in range(self.cols):
                result.data[i][j] = self.data[i][j] - other.data[i][j]
        return result
    
    def __mul__(self, other: Union['Matrix', float, int]) -> 'Matrix':
        """
        矩阵乘法或数乘
        
        参数:
            other: 可以是:
                - Matrix: 另一个矩阵
                - float/int: 标量
                
        返回:
            Matrix: 乘积结果
        """
        if isinstance(other, Matrix):
            # 矩阵乘法
            if self.cols != other.rows:
                raise ValueError("矩阵维度不兼容，无法相乘")
            
            result = Matrix.zeros(self.rows, other.cols)
            for i in range(self.rows):
                for j in range(other.cols):
                    for k in range(self.cols):
                        result.data[i][j] += self.data[i][k] * other.data[k][j]
            return result
        else:
            # 数乘
            scalar = float(other)
            result = Matrix.zeros(self.rows, self.cols)
            for i in range(self.rows):
                for j in range(self.cols):
                    result.data[i][j] = self.data[i][j] * scalar
            return result
    
    def __rmul__(self, scalar: Union[float, int]) -> 'Matrix':
        """
        右数乘（支持 scalar * Matrix 形式）
        
        参数:
            scalar: 标量值
            
        返回:
            Matrix: 乘积结果
        """
        return self * scalar
    
    def __truediv__(self, scalar: Union[float, int]) -> 'Matrix':
        """
        矩阵除以标量
        
        参数:
            scalar: 标量值
            
        返回:
            Matrix: 除法结果
        """
        return self * (1.0 / float(scalar))
    
    def __neg__(self) -> 'Matrix':
        """
        矩阵取负
        
        返回:
            Matrix: 取负后的矩阵
        """
        return self * (-1.0)
    
    def transpose(self) -> 'Matrix':
        """
        矩阵转置
        
        返回:
            Matrix: 转置后的矩阵
        """
        result = Matrix.zeros(self.cols, self.rows)
        for i in range(self.rows):
            for j in range(self.cols):
                result.data[j][i] = self.data[i][j]
        return result
    
    @property
    def T(self) -> 'Matrix':
        """
        转置的快捷方式
        
        返回:
            Matrix: 转置后的矩阵
        """
        return self.transpose()
    
    def trace(self) -> float:
        """
        矩阵的迹（主对角线元素之和）
        
        返回:
            float: 矩阵的迹
        """
        if self.rows != self.cols:
            raise ValueError("只有方阵才有迹")
        
        return sum(self.data[i][i] for i in range(self.rows))
    
    def is_square(self) -> bool:
        """
        检查是否为方阵
        
        返回:
            bool: 是否为方阵
        """
        return self.rows == self.cols
    
    def is_symmetric(self, tol: float = 1e-10) -> bool:
        """
        检查是否为对称矩阵
        
        参数:
            tol: 容差
            
        返回:
            bool: 是否为对称矩阵
        """
        if not self.is_square():
            return False
        
        for i in range(self.rows):
            for j in range(i + 1, self.cols):
                if abs(self.data[i][j] - self.data[j][i]) > tol:
                    return False
        return True
    
    def copy(self) -> 'Matrix':
        """
        矩阵深拷贝
        
        返回:
            Matrix: 矩阵的拷贝
        """
        return Matrix([row[:] for row in self.data])
    
    def tolist(self) -> List[List[float]]:
        """
        转换为 Python 列表
        
        返回:
            List[List[float]]: 二维列表
        """
        return [row[:] for row in self.data]
    
    def shape(self) -> Tuple[int, int]:
        """
        返回矩阵形状
        
        返回:
            Tuple[int, int]: (行数, 列数)
        """
        return (self.rows, self.cols)
    
    def __eq__(self, other: object, tol: float = 1e-10) -> bool:
        """
        矩阵比较（近似相等）
        
        参数:
            other: 另一个矩阵
            tol: 容差
            
        返回:
            bool: 是否相等
        """
        if not isinstance(other, Matrix):
            return False
        
        if self.rows != other.rows or self.cols != other.cols:
            return False
        
        for i in range(self.rows):
            for j in range(self.cols):
                if abs(self.data[i][j] - other.data[i][j]) > tol:
                    return False
        return True
    
    def __str__(self) -> str:
        """
        矩阵字符串表示
        
        返回:
            str: 格式化的矩阵字符串
        """
        lines = []
        for row in self.data:
            formatted = "  ".join(f"{x:10.6f}" for x in row)
            lines.append(f"[{formatted}]")
        return "\n".join(lines)
    
    def __repr__(self) -> str:
        """
        矩阵官方表示
        
        返回:
            str: 矩阵表示
        """
        return f"Matrix({self.rows}x{self.cols})"
    
    def _gaussian_elimination(self, augmented: bool = False) -> Tuple['Matrix', float]:
        """
        高斯消元法，将矩阵转化为上三角形式
        
        参数:
            augmented: 是否为增广矩阵
            
        返回:
            Tuple[Matrix, float]: (上三角矩阵, 行列式符号)
        """
        if not self.is_square() and not augmented:
            raise ValueError("高斯消元法需要方阵")
        
        mat = self.copy()
        n = mat.rows
        sign = 1.0
        eps = 1e-12
        
        for k in range(n):
            # 部分主元选择
            max_row = k
            for i in range(k + 1, n):
                if abs(mat.data[i][k]) > abs(mat.data[max_row][k]):
                    max_row = i
            
            # 交换行
            if max_row != k:
                mat.data[k], mat.data[max_row] = mat.data[max_row], mat.data[k]
                sign = -sign
            
            # 检查主元是否为零
            if abs(mat.data[k][k]) < eps:
                continue
            
            # 消元
            for i in range(k + 1, n):
                factor = mat.data[i][k] / mat.data[k][k]
                cols_to_use = mat.cols if augmented else n
                for j in range(k, cols_to_use):
                    mat.data[i][j] -= factor * mat.data[k][j]
        
        return mat, sign
    
    def determinant(self) -> float:
        """
        计算矩阵的行列式（使用高斯消元法）
        
        返回:
            float: 行列式值
        """
        if not self.is_square():
            raise ValueError("只有方阵才有行列式")
        
        n = self.rows
        if n == 1:
            return self.data[0][0]
        if n == 2:
            return self.data[0][0] * self.data[1][1] - self.data[0][1] * self.data[1][0]
        
        # 高斯消元法计算行列式
        upper, sign = self._gaussian_elimination()
        
        # 上三角矩阵的行列式等于对角线元素的乘积
        det = sign
        for i in range(n):
            det *= upper.data[i][i]
        
        return det
    
    def is_invertible(self, tol: float = 1e-10) -> bool:
        """
        检查矩阵是否可逆
        
        参数:
            tol: 容差
            
        返回:
            bool: 是否可逆
        """
        if not self.is_square():
            return False
        return abs(self.determinant()) > tol
    
    def _gauss_jordan_inverse(self) -> 'Matrix':
        """
        使用高斯-约当消元法求逆矩阵
        
        返回:
            Matrix: 逆矩阵
        """
        if not self.is_square():
            raise ValueError("只有方阵才能求逆")
        
        n = self.rows
        
        # 检查行列式是否为零
        if abs(self.determinant()) < 1e-10:
            raise ValueError("矩阵是奇异的，无法求逆")
        
        # 构建增广矩阵 [A | I]
        augmented = Matrix.zeros(n, 2 * n)
        for i in range(n):
            for j in range(n):
                augmented.data[i][j] = self.data[i][j]
            augmented.data[i][n + i] = 1.0
        
        # 高斯-约当消元
        eps = 1e-12
        for k in range(n):
            # 部分主元选择
            max_row = k
            for i in range(k + 1, n):
                if abs(augmented.data[i][k]) > abs(augmented.data[max_row][k]):
                    max_row = i
            
            if max_row != k:
                augmented.data[k], augmented.data[max_row] = augmented.data[max_row], augmented.data[k]
            
            # 检查主元是否为零
            if abs(augmented.data[k][k]) < eps:
                raise ValueError("矩阵是奇异的，无法求逆")
            
            # 将主元归一化为 1
            pivot = augmented.data[k][k]
            for j in range(k, 2 * n):
                augmented.data[k][j] /= pivot
            
            # 消去其他行
            for i in range(n):
                if i != k and abs(augmented.data[i][k]) > eps:
                    factor = augmented.data[i][k]
                    for j in range(k, 2 * n):
                        augmented.data[i][j] -= factor * augmented.data[k][j]
        
        # 提取逆矩阵
        inverse = Matrix.zeros(n)
        for i in range(n):
            for j in range(n):
                inverse.data[i][j] = augmented.data[i][n + j]
        
        return inverse
    
    def inverse(self) -> 'Matrix':
        """
        求矩阵的逆
        
        返回:
            Matrix: 逆矩阵
        """
        return self._gauss_jordan_inverse()
    
    @property
    def I(self) -> 'Matrix':
        """
        逆矩阵的快捷方式
        
        返回:
            Matrix: 逆矩阵
        """
        return self.inverse()
    
    def solve(self, b: 'Matrix') -> 'Matrix':
        """
        求解线性方程组 Ax = b
        
        参数:
            b: 右端项矩阵（列向量）
            
        返回:
            Matrix: 解向量 x
        """
        if not self.is_square():
            raise ValueError("系数矩阵必须是方阵")
        
        if b.rows != self.rows:
            raise ValueError("右端项的行数必须与系数矩阵相同")
        
        if b.cols != 1:
            raise ValueError("右端项必须是列向量")
        
        # 使用逆矩阵求解
        return self.inverse() * b
    
    def norm(self, p: Union[int, str] = 2) -> float:
        """
        计算矩阵的范数
        
        参数:
            p: 范数类型，可以是:
                - 1: 列和范数
                - 2: 谱范数（最大奇异值）
                - 'fro': Frobenius 范数
                - 'inf': 行和范数
                
        返回:
            float: 范数值
        """
        if p == 1:
            # 列和范数
            max_col_sum = 0.0
            for j in range(self.cols):
                col_sum = sum(abs(self.data[i][j]) for i in range(self.rows))
                max_col_sum = max(max_col_sum, col_sum)
            return max_col_sum
        
        elif p == 'fro' or p == 'frobenius':
            # Frobenius 范数
            sum_squares = 0.0
            for i in range(self.rows):
                for j in range(self.cols):
                    sum_squares += self.data[i][j] ** 2
            return math.sqrt(sum_squares)
        
        elif p == 'inf' or p == float('inf'):
            # 行和范数
            max_row_sum = 0.0
            for i in range(self.rows):
                row_sum = sum(abs(self.data[i][j]) for j in range(self.cols))
                max_row_sum = max(max_row_sum, row_sum)
            return max_row_sum
        
        elif p == 2:
            # 谱范数 - 使用幂法近似最大特征值
            # A^T A 的最大特征值的平方根
            ata = self.T * self
            try:
                # 使用幂法
                x = Matrix.random(ata.rows, 1)
                x = x / math.sqrt(sum(x.data[i][0] ** 2 for i in range(x.rows)))
                
                for _ in range(100):
                    y = ata * x
                    norm_y = math.sqrt(sum(y.data[i][0] ** 2 for i in range(y.rows)))
                    if norm_y < 1e-10:
                        break
                    x_new = y / norm_y
                    
                    # 检查收敛
                    diff = 0.0
                    for i in range(x.rows):
                        diff += (x.data[i][0] - x_new.data[i][0]) ** 2
                    if math.sqrt(diff) < 1e-10:
                        break
                    x = x_new
                
                # 计算瑞利商
                rayleigh = (x.T * ata * x).data[0][0] / (x.T * x).data[0][0]
                return math.sqrt(abs(rayleigh))
            except:
                # 降级到 Frobenius 范数
                return self.norm('fro')
        
        else:
            raise ValueError(f"不支持的范数类型: {p}")
    
    def condition_number(self, p: Union[int, str] = 2) -> float:
        """
        计算矩阵的条件数
        
        参数:
            p: 范数类型
            
        返回:
            float: 条件数
        """
        if not self.is_invertible():
            return float('inf')
        
        return self.norm(p) * self.inverse().norm(p)
