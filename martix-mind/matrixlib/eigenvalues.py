from typing import Tuple, List, Optional
from .matrix import Matrix
from .decompositions import qr_decomposition
import math


def power_iteration(A: Matrix, 
                    initial_vector: Optional[Matrix] = None,
                    max_iterations: int = 1000,
                    tol: float = 1e-10) -> Tuple[float, Matrix]:
    """
    幂法：计算矩阵的主导特征值（绝对值最大的特征值）和对应的特征向量
    
    参数:
        A: 输入矩阵（必须是方阵）
        initial_vector: 初始向量（如果为 None，则使用随机向量）
        max_iterations: 最大迭代次数
        tol: 收敛容差
        
    返回:
        Tuple[float, Matrix]: (特征值, 特征向量)
    """
    if not A.is_square():
        raise ValueError("幂法需要方阵")
    
    n = A.rows
    
    # 初始化向量
    if initial_vector is None:
        x = Matrix.random(n, 1)
    else:
        if initial_vector.rows != n or initial_vector.cols != 1:
            raise ValueError(f"初始向量必须是 {n}x1 的列向量")
        x = initial_vector.copy()
    
    # 归一化
    x_norm = math.sqrt(sum(x.data[i][0] ** 2 for i in range(n)))
    if x_norm < 1e-12:
        x = Matrix.random(n, 1)
        x_norm = math.sqrt(sum(x.data[i][0] ** 2 for i in range(n)))
    x = x / x_norm
    
    eigenvalue_prev = 0.0
    
    for iteration in range(max_iterations):
        # y = A * x
        y = A * x
        
        # 计算瑞利商估计特征值
        # lambda = x^T * A * x / (x^T * x)
        rayleigh = 0.0
        for i in range(n):
            rayleigh += x.data[i][0] * y.data[i][0]
        
        # 归一化 y
        y_norm = math.sqrt(sum(y.data[i][0] ** 2 for i in range(n)))
        
        if y_norm < 1e-12:
            # 收敛到零向量，说明特征值为 0
            return 0.0, x
        
        x_new = y / y_norm
        
        # 检查收敛
        if iteration > 0:
            eigenvalue_diff = abs(rayleigh - eigenvalue_prev)
            if eigenvalue_diff < tol:
                return rayleigh, x_new
            
            # 也检查向量的变化
            vector_diff = 0.0
            for i in range(n):
                vector_diff += (x.data[i][0] - x_new.data[i][0]) ** 2
            if math.sqrt(vector_diff) < tol:
                return rayleigh, x_new
        
        x = x_new
        eigenvalue_prev = rayleigh
    
    return eigenvalue_prev, x


def inverse_power_iteration(A: Matrix,
                             sigma: float = 0.0,
                             initial_vector: Optional[Matrix] = None,
                             max_iterations: int = 1000,
                             tol: float = 1e-10) -> Tuple[float, Matrix]:
    """
    反幂法：计算矩阵靠近 sigma 的特征值和对应的特征向量
    
    参数:
        A: 输入矩阵（必须是方阵）
        sigma: 偏移值，用于查找靠近 sigma 的特征值
        initial_vector: 初始向量
        max_iterations: 最大迭代次数
        tol: 收敛容差
        
    返回:
        Tuple[float, Matrix]: (特征值, 特征向量)
    """
    if not A.is_square():
        raise ValueError("反幂法需要方阵")
    
    n = A.rows
    
    # 构建 B = A - sigma * I
    B = A.copy()
    for i in range(n):
        B.data[i][i] -= sigma
    
    # 检查 B 是否可逆
    try:
        B_inv = B.inverse()
    except:
        # 如果 B 是奇异的，说明 sigma 就是特征值
        # 使用移位的反幂法
        sigma += 1e-6
        B = A.copy()
        for i in range(n):
            B.data[i][i] -= sigma
        B_inv = B.inverse()
    
    # 初始化向量
    if initial_vector is None:
        x = Matrix.random(n, 1)
    else:
        x = initial_vector.copy()
    
    # 归一化
    x_norm = math.sqrt(sum(x.data[i][0] ** 2 for i in range(n)))
    x = x / x_norm
    
    eigenvalue_prev = sigma
    
    for iteration in range(max_iterations):
        # y = B^-1 * x
        y = B_inv * x
        
        # 归一化
        y_norm = math.sqrt(sum(y.data[i][0] ** 2 for i in range(n)))
        
        if y_norm < 1e-12:
            return sigma, x
        
        x_new = y / y_norm
        
        # 使用瑞利商估计特征值
        # 首先计算 A * x_new
        Ax = A * x_new
        
        # 瑞利商
        rayleigh = 0.0
        xTx = 0.0
        for i in range(n):
            rayleigh += x_new.data[i][0] * Ax.data[i][0]
            xTx += x_new.data[i][0] ** 2
        
        if xTx > 1e-12:
            rayleigh /= xTx
        
        # 检查收敛
        if iteration > 0:
            eigenvalue_diff = abs(rayleigh - eigenvalue_prev)
            if eigenvalue_diff < tol:
                return rayleigh, x_new
        
        x = x_new
        eigenvalue_prev = rayleigh
    
    return eigenvalue_prev, x


def qr_algorithm(A: Matrix,
                 max_iterations: int = 1000,
                 tol: float = 1e-10,
                 with_shifts: bool = True) -> Tuple[List[float], Matrix]:
    """
    QR 算法：计算矩阵的所有特征值
    
    参数:
        A: 输入矩阵（必须是方阵）
        max_iterations: 最大迭代次数
        tol: 收敛容差
        with_shifts: 是否使用带位移的 QR 算法
        
    返回:
        Tuple[List[float], Matrix]: (特征值列表, 特征向量矩阵)
    """
    if not A.is_square():
        raise ValueError("QR 算法需要方阵")
    
    n = A.rows
    Ak = A.copy()
    
    # 累积正交变换以获得特征向量
    Q_total = Matrix.identity(n)
    
    for iteration in range(max_iterations):
        # 检查是否已收敛到上三角矩阵
        converged = True
        for i in range(n):
            for j in range(i):
                if abs(Ak.data[i][j]) > tol:
                    converged = False
                    break
            if not converged:
                break
        
        if converged:
            break
        
        # 带位移的 QR 算法
        if with_shifts and iteration > 0:
            # 使用 Rayleigh 商位移
            # mu = Ak[n-1, n-1]
            mu = Ak.data[n-1][n-1]
            
            # 减去位移
            for i in range(n):
                Ak.data[i][i] -= mu
        
        # QR 分解
        Q, R = qr_decomposition(Ak, method='householder')
        
        # 形成 R * Q
        Ak = R * Q
        
        # 加回位移
        if with_shifts and iteration > 0:
            for i in range(n):
                Ak.data[i][i] += mu
        
        # 累积 Q 以获得特征向量
        Q_total = Q_total * Q
    
    # 从对角线提取特征值
    eigenvalues = []
    for i in range(n):
        eigenvalues.append(Ak.data[i][i])
    
    return eigenvalues, Q_total


def jacobi_method(A: Matrix,
                  max_iterations: int = 1000,
                  tol: float = 1e-10) -> Tuple[List[float], Matrix]:
    """
    Jacobi 方法：计算对称矩阵的所有特征值和特征向量
    
    参数:
        A: 输入对称矩阵
        max_iterations: 最大迭代次数
        tol: 收敛容差
        
    返回:
        Tuple[List[float], Matrix]: (特征值列表, 特征向量矩阵)
    """
    if not A.is_square():
        raise ValueError("Jacobi 方法需要方阵")
    
    if not A.is_symmetric():
        raise ValueError("Jacobi 方法需要对称矩阵")
    
    n = A.rows
    Ak = A.copy()
    V = Matrix.identity(n)  # 累积的正交变换
    
    for iteration in range(max_iterations):
        # 找到绝对值最大的非对角线元素
        max_val = 0.0
        p, q = 0, 1
        
        for i in range(n):
            for j in range(i + 1, n):
                if abs(Ak.data[i][j]) > max_val:
                    max_val = abs(Ak.data[i][j])
                    p, q = i, j
        
        # 检查收敛
        if max_val < tol:
            break
        
        # 计算旋转角度
        theta = 0.0
        if abs(Ak.data[q][q] - Ak.data[p][p]) > 1e-12:
            theta = 0.5 * math.atan2(2 * Ak.data[p][q], Ak.data[q][q] - Ak.data[p][p])
        else:
            # 如果对角线元素相等，使用 45 度
            theta = math.pi / 4 if Ak.data[p][q] > 0 else -math.pi / 4
        
        c = math.cos(theta)
        s = math.sin(theta)
        
        # 创建旋转矩阵
        J = Matrix.identity(n)
        J.data[p][p] = c
        J.data[q][q] = c
        J.data[p][q] = s
        J.data[q][p] = -s
        
        # 更新 Ak = J^T * Ak * J
        # 更高效的实现：直接更新相关元素
        
        # 更新第 p 行和第 q 行
        temp_pp = Ak.data[p][p]
        temp_qq = Ak.data[q][q]
        temp_pq = Ak.data[p][q]
        
        Ak.data[p][p] = c * c * temp_pp - 2 * c * s * temp_pq + s * s * temp_qq
        Ak.data[q][q] = s * s * temp_pp + 2 * c * s * temp_pq + c * c * temp_qq
        Ak.data[p][q] = 0.0
        Ak.data[q][p] = 0.0
        
        # 更新其他元素
        for k in range(n):
            if k != p and k != q:
                temp_pk = Ak.data[p][k]
                temp_qk = Ak.data[q][k]
                
                Ak.data[p][k] = c * temp_pk - s * temp_qk
                Ak.data[k][p] = Ak.data[p][k]
                
                Ak.data[q][k] = s * temp_pk + c * temp_qk
                Ak.data[k][q] = Ak.data[q][k]
        
        # 累积特征向量
        # V = V * J
        # 更高效的实现：只更新相关列
        for k in range(n):
            temp_kp = V.data[k][p]
            temp_kq = V.data[k][q]
            
            V.data[k][p] = c * temp_kp - s * temp_kq
            V.data[k][q] = s * temp_kp + c * temp_kq
    
    # 提取特征值
    eigenvalues = []
    for i in range(n):
        eigenvalues.append(Ak.data[i][i])
    
    # 按特征值降序排序
    sorted_indices = sorted(range(n), key=lambda k: eigenvalues[k], reverse=True)
    sorted_eigenvalues = [eigenvalues[i] for i in sorted_indices]
    
    # 重新排列特征向量
    sorted_V = Matrix.zeros(n)
    for i in range(n):
        for j in range(n):
            sorted_V.data[j][i] = V.data[j][sorted_indices[i]]
    
    return sorted_eigenvalues, sorted_V


def eigenvalues(A: Matrix, method: str = 'qr') -> List[float]:
    """
    计算矩阵的所有特征值
    
    参数:
        A: 输入矩阵
        method: 计算方法:
            - 'qr': QR 算法（通用）
            - 'jacobi': Jacobi 方法（仅对称矩阵）
            
    返回:
        List[float]: 特征值列表
    """
    if method == 'qr':
        eigvals, _ = qr_algorithm(A)
        return eigvals
    elif method == 'jacobi':
        eigvals, _ = jacobi_method(A)
        return eigvals
    else:
        raise ValueError(f"不支持的方法: {method}")


def eigenvectors(A: Matrix, method: str = 'qr') -> Tuple[List[float], Matrix]:
    """
    计算矩阵的所有特征值和特征向量
    
    参数:
        A: 输入矩阵
        method: 计算方法
            
    返回:
        Tuple[List[float], Matrix]: (特征值列表, 特征向量矩阵)
    """
    if method == 'qr':
        return qr_algorithm(A)
    elif method == 'jacobi':
        return jacobi_method(A)
    else:
        raise ValueError(f"不支持的方法: {method}")
