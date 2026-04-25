from typing import Tuple, Optional, List
from .matrix import Matrix
import math


def lu_decomposition(A: Matrix, partial_pivoting: bool = True) -> Tuple[Matrix, Matrix, Optional[Matrix]]:
    """
    LU 分解：将矩阵 A 分解为 L * U = P * A
    
    参数:
        A: 输入矩阵
        partial_pivoting: 是否使用部分主元
        
    返回:
        Tuple[Matrix, Matrix, Optional[Matrix]]: (L, U, P)
        - L: 下三角矩阵，对角线为 1
        - U: 上三角矩阵
        - P: 置换矩阵（如果使用部分主元），否则为 None
    """
    if not A.is_square():
        raise ValueError("LU 分解需要方阵")
    
    n = A.rows
    L = Matrix.identity(n)
    U = A.copy()
    P = Matrix.identity(n) if partial_pivoting else None
    
    eps = 1e-12
    
    for k in range(n - 1):
        if partial_pivoting:
            # 部分主元选择
            max_row = k
            for i in range(k, n):
                if abs(U.data[i][k]) > abs(U.data[max_row][k]):
                    max_row = i
            
            # 交换行
            if max_row != k:
                U.data[k], U.data[max_row] = U.data[max_row], U.data[k]
                P.data[k], P.data[max_row] = P.data[max_row], P.data[k]
                # 交换 L 中已计算的列
                for j in range(k):
                    L.data[k][j], L.data[max_row][j] = L.data[max_row][j], L.data[k][j]
        
        # 检查主元是否为零
        if abs(U.data[k][k]) < eps:
            continue
        
        # 消元
        for i in range(k + 1, n):
            factor = U.data[i][k] / U.data[k][k]
            L.data[i][k] = factor
            
            for j in range(k, n):
                U.data[i][j] -= factor * U.data[k][j]
    
    return L, U, P


def qr_decomposition(A: Matrix, method: str = 'householder') -> Tuple[Matrix, Matrix]:
    """
    QR 分解：将矩阵 A 分解为 Q * R
    
    参数:
        A: 输入矩阵
        method: 分解方法，可以是:
            - 'householder': Householder 变换（推荐）
            - 'gram_schmidt': 经典 Gram-Schmidt 正交化
            - 'modified_gram_schmidt': 改进的 Gram-Schmidt 正交化
            
    返回:
        Tuple[Matrix, Matrix]: (Q, R)
        - Q: 正交矩阵
        - R: 上三角矩阵
    """
    m, n = A.rows, A.cols
    
    if method == 'householder':
        return _qr_householder(A)
    elif method == 'gram_schmidt':
        return _qr_gram_schmidt(A)
    elif method == 'modified_gram_schmidt':
        return _qr_modified_gram_schmidt(A)
    else:
        raise ValueError(f"不支持的 QR 分解方法: {method}")


def _qr_householder(A: Matrix) -> Tuple[Matrix, Matrix]:
    """
    使用 Householder 变换进行 QR 分解
    
    参数:
        A: 输入矩阵
        
    返回:
        Tuple[Matrix, Matrix]: (Q, R)
    """
    m, n = A.rows, A.cols
    R = A.copy()
    Q = Matrix.identity(m)
    
    eps = 1e-12
    
    for k in range(min(m - 1, n)):
        # 提取第 k 列从第 k 行开始的子向量
        x = Matrix.zeros(m - k, 1)
        for i in range(m - k):
            x.data[i][0] = R.data[k + i][k]
        
        # 计算 Householder 向量
        x_norm = math.sqrt(sum(x.data[i][0] ** 2 for i in range(x.rows)))
        if x_norm < eps:
            continue
        
        # 符号选择：避免数值不稳定
        alpha = -x_norm if x.data[0][0] >= 0 else x_norm
        u = x.copy()
        u.data[0][0] -= alpha
        
        u_norm = math.sqrt(sum(u.data[i][0] ** 2 for i in range(u.rows)))
        if u_norm < eps:
            continue
        
        v = u / u_norm
        
        # 构建 Householder 矩阵 H = I - 2 * v * v^T
        # 并应用到 R 和 Q
        vT = v.T
        
        # 更新 R: H * R
        for i in range(k, m):
            for j in range(k, n):
                # 计算 H 的子矩阵与 R 的子矩阵的乘积
                # 这里我们直接计算，避免构建完整的 Householder 矩阵
                pass
        
        # 更高效的实现：直接应用变换
        # 计算 R[k:m, k:n] = R[k:m, k:n] - 2 * v * (v^T * R[k:m, k:n])
        vT_R = Matrix.zeros(1, n - k)
        for j in range(n - k):
            for i in range(m - k):
                vT_R.data[0][j] += v.data[i][0] * R.data[k + i][k + j]
        
        for i in range(m - k):
            for j in range(n - k):
                R.data[k + i][k + j] -= 2 * v.data[i][0] * vT_R.data[0][j]
        
        # 更新 Q: Q = Q * H
        # Q[:, k:m] = Q[:, k:m] - 2 * (Q[:, k:m] * v) * v^T
        Q_v = Matrix.zeros(m, 1)
        for i in range(m):
            for j in range(m - k):
                Q_v.data[i][0] += Q.data[i][k + j] * v.data[j][0]
        
        for i in range(m):
            for j in range(m - k):
                Q.data[i][k + j] -= 2 * Q_v.data[i][0] * v.data[j][0]
    
    return Q, R


def _qr_gram_schmidt(A: Matrix) -> Tuple[Matrix, Matrix]:
    """
    使用经典 Gram-Schmidt 正交化进行 QR 分解
    
    参数:
        A: 输入矩阵
        
    返回:
        Tuple[Matrix, Matrix]: (Q, R)
    """
    m, n = A.rows, A.cols
    Q = Matrix.zeros(m, n)
    R = Matrix.zeros(n, n)
    
    eps = 1e-12
    
    for j in range(n):
        # 提取第 j 列
        v = Matrix.zeros(m, 1)
        for i in range(m):
            v.data[i][0] = A.data[i][j]
        
        # 减去已正交化的分量
        for i in range(j):
            # 计算投影 q_i^T * a_j
            proj = 0.0
            for k in range(m):
                proj += Q.data[k][i] * A.data[k][j]
            
            R.data[i][j] = proj
            
            # v = v - R[i,j] * q_i
            for k in range(m):
                v.data[k][0] -= proj * Q.data[k][i]
        
        # 计算范数
        v_norm = math.sqrt(sum(v.data[i][0] ** 2 for i in range(m)))
        R.data[j][j] = v_norm
        
        if v_norm > eps:
            # 归一化
            for i in range(m):
                Q.data[i][j] = v.data[i][0] / v_norm
    
    return Q, R


def _qr_modified_gram_schmidt(A: Matrix) -> Tuple[Matrix, Matrix]:
    """
    使用改进的 Gram-Schmidt 正交化进行 QR 分解
    
    参数:
        A: 输入矩阵
        
    返回:
        Tuple[Matrix, Matrix]: (Q, R)
    """
    m, n = A.rows, A.cols
    Q = A.copy()
    R = Matrix.zeros(n, n)
    
    eps = 1e-12
    
    for k in range(n):
        # 计算第 k 列的范数
        col_norm = math.sqrt(sum(Q.data[i][k] ** 2 for i in range(m)))
        R.data[k][k] = col_norm
        
        if col_norm < eps:
            continue
        
        # 归一化
        for i in range(m):
            Q.data[i][k] /= col_norm
        
        # 对后续列进行正交化
        for j in range(k + 1, n):
            # 计算投影
            proj = 0.0
            for i in range(m):
                proj += Q.data[i][k] * Q.data[i][j]
            
            R.data[k][j] = proj
            
            # 减去投影
            for i in range(m):
                Q.data[i][j] -= proj * Q.data[i][k]
    
    return Q, R


def svd_decomposition(A: Matrix, max_iterations: int = 1000, tol: float = 1e-12) -> Tuple[Matrix, Matrix, Matrix]:
    """
    奇异值分解（SVD）：将矩阵 A 分解为 U * Sigma * V^T
    
    使用特征值分解的方法：
    - 右奇异向量 V = A^T A 的特征向量
    - 左奇异向量 U = A A^T 的特征向量（或由 V 计算）
    - 奇异值 = sqrt(A^T A 的特征值)
    
    参数:
        A: 输入矩阵
        max_iterations: 最大迭代次数
        tol: 收敛容差
        
    返回:
        Tuple[Matrix, Matrix, Matrix]: (U, Sigma, V)
        - U: 左奇异向量矩阵 (m x m)，列是正交单位向量
        - Sigma: 奇异值对角矩阵 (m x n)，对角元素非负且降序排列
        - V: 右奇异向量矩阵 (n x n)，列是正交单位向量（注意：不是 V^T）
    """
    m, n = A.rows, A.cols
    p = min(m, n)
    
    # 决定计算哪个协方差矩阵
    # 为了数值稳定性，选择较小的那个
    if m >= n:
        # 计算 A^T A (n x n)
        ata = A.transpose() * A
        
        # 计算特征值分解
        eigenvalues, V = _eigen_symmetric_jacobi(ata, max_iterations, tol)
        
        # 计算奇异值 = sqrt(|特征值|)
        singular_values = []
        for i in range(n):
            sv = math.sqrt(max(abs(eigenvalues[i]), 1e-15))
            singular_values.append(sv)
        
        # 按奇异值降序排序
        sorted_indices = sorted(range(n), key=lambda i: singular_values[i], reverse=True)
        
        # 重新排列奇异值和特征向量
        sorted_singular_values = [singular_values[i] for i in sorted_indices]
        
        # 重新排列 V 的列
        V_sorted = Matrix.zeros(n, n)
        for j in range(n):
            for i in range(n):
                V_sorted.data[i][j] = V.data[i][sorted_indices[j]]
        
        # 计算 U = A * V * Sigma^+
        U = Matrix.zeros(m, m)
        
        for j in range(p):
            if sorted_singular_values[j] < 1e-15:
                if j < m:
                    U.data[j][j] = 1.0
                continue
            
            # 计算 A * v_j
            v_col = Matrix.zeros(n, 1)
            for i in range(n):
                v_col.data[i][0] = V_sorted.data[i][j]
            
            u_col = A * v_col
            
            # 归一化（应该等于 sorted_singular_values[j]）
            u_norm = math.sqrt(sum(u_col.data[i][0] ** 2 for i in range(m)))
            
            if u_norm > 1e-15:
                for i in range(m):
                    U.data[i][j] = u_col.data[i][0] / u_norm
            else:
                if j < m:
                    U.data[j][j] = 1.0
        
        # 补充 U 的剩余列（使用 Gram-Schmidt 正交化）
        if m > p:
            U = _complete_orthogonal_basis(U, m, p)
        
        # 创建 Sigma 矩阵
        Sigma = Matrix.zeros(m, n)
        for i in range(p):
            Sigma.data[i][i] = sorted_singular_values[i]
        
        return U, Sigma, V_sorted
    
    else:
        # m < n，计算 A A^T (m x m)
        aat = A * A.transpose()
        
        # 计算特征值分解
        eigenvalues, U = _eigen_symmetric_jacobi(aat, max_iterations, tol)
        
        # 计算奇异值 = sqrt(|特征值|)
        singular_values = []
        for i in range(m):
            sv = math.sqrt(max(abs(eigenvalues[i]), 1e-15))
            singular_values.append(sv)
        
        # 按奇异值降序排序
        sorted_indices = sorted(range(m), key=lambda i: singular_values[i], reverse=True)
        
        # 重新排列奇异值和特征向量
        sorted_singular_values = [singular_values[i] for i in sorted_indices]
        
        # 重新排列 U 的列
        U_sorted = Matrix.zeros(m, m)
        for j in range(m):
            for i in range(m):
                U_sorted.data[i][j] = U.data[i][sorted_indices[j]]
        
        # 计算 V = A^T * U * Sigma^+
        V = Matrix.zeros(n, n)
        
        for j in range(p):
            if sorted_singular_values[j] < 1e-15:
                if j < n:
                    V.data[j][j] = 1.0
                continue
            
            # 计算 A^T * u_j
            u_col = Matrix.zeros(m, 1)
            for i in range(m):
                u_col.data[i][0] = U_sorted.data[i][j]
            
            v_col = A.transpose() * u_col
            
            # 归一化
            v_norm = math.sqrt(sum(v_col.data[i][0] ** 2 for i in range(n)))
            
            if v_norm > 1e-15:
                for i in range(n):
                    V.data[i][j] = v_col.data[i][0] / v_norm
            else:
                if j < n:
                    V.data[j][j] = 1.0
        
        # 补充 V 的剩余列
        if n > p:
            V = _complete_orthogonal_basis(V, n, p)
        
        # 创建 Sigma 矩阵
        Sigma = Matrix.zeros(m, n)
        for i in range(p):
            Sigma.data[i][i] = sorted_singular_values[i]
        
        return U_sorted, Sigma, V


def _complete_orthogonal_basis(Q: Matrix, size: int, num_cols: int) -> Matrix:
    """
    使用 Gram-Schmidt 方法补充正交基
    
    参数:
        Q: 已有部分正交列的矩阵
        size: 目标大小
        num_cols: 已有列数
        
    返回:
        Matrix: 完整的正交矩阵
    """
    result = Q.copy()
    
    for j in range(num_cols, size):
        # 从单位向量开始
        v = Matrix.zeros(size, 1)
        v.data[j][0] = 1.0
        
        # 正交化到之前的列
        for k in range(j):
            # 计算投影
            proj = 0.0
            for i in range(size):
                proj += result.data[i][k] * v.data[i][0]
            
            # 减去投影
            for i in range(size):
                v.data[i][0] -= proj * result.data[i][k]
        
        # 归一化
        v_norm = math.sqrt(sum(v.data[i][0] ** 2 for i in range(size)))
        
        if v_norm > 1e-15:
            for i in range(size):
                result.data[i][j] = v.data[i][0] / v_norm
        else:
            # 如果退化，使用单位向量
            result.data[j][j] = 1.0
    
    return result


def _eigen_symmetric_jacobi(A: Matrix, max_iterations: int = 1000, tol: float = 1e-12) -> Tuple[List[float], Matrix]:
    """
    Jacobi 方法计算对称矩阵的所有特征值和特征向量
    
    参数:
        A: 对称矩阵
        max_iterations: 最大迭代次数
        tol: 收敛容差
        
    返回:
        Tuple[List[float], Matrix]: (特征值列表, 特征向量矩阵)
    """
    if not A.is_square():
        raise ValueError("Jacobi 方法需要方阵")
    
    n = A.rows
    
    # 复制矩阵
    Ak = A.copy()
    V = Matrix.identity(n)  # 累积的特征向量矩阵
    
    for iteration in range(max_iterations):
        # 找到绝对值最大的非对角线元素
        max_val = 0.0
        p, q = 0, 1
        
        for i in range(n):
            for j in range(i + 1, n):
                abs_val = abs(Ak.data[i][j])
                if abs_val > max_val:
                    max_val = abs_val
                    p, q = i, j
        
        # 检查收敛
        if max_val < tol:
            break
        
        # 计算旋转角度
        theta = 0.0
        if abs(Ak.data[q][q] - Ak.data[p][p]) < 1e-15:
            # 如果对角线元素相等
            if Ak.data[p][q] >= 0:
                theta = math.pi / 4
            else:
                theta = -math.pi / 4
        else:
            theta = 0.5 * math.atan2(2 * Ak.data[p][q], Ak.data[q][q] - Ak.data[p][p])
        
        c = math.cos(theta)
        s = math.sin(theta)
        
        # 显式更新相关元素
        # 保存旧值
        app = Ak.data[p][p]
        aqq = Ak.data[q][q]
        apq = Ak.data[p][q]
        
        # 更新对角线
        Ak.data[p][p] = c * c * app - 2 * c * s * apq + s * s * aqq
        Ak.data[q][q] = s * s * app + 2 * c * s * apq + c * c * aqq
        Ak.data[p][q] = 0.0
        Ak.data[q][p] = 0.0
        
        # 更新第 p 行和第 q 行的其他元素
        for k in range(n):
            if k != p and k != q:
                apk = Ak.data[p][k]
                aqk = Ak.data[q][k]
                
                Ak.data[p][k] = c * apk - s * aqk
                Ak.data[k][p] = Ak.data[p][k]
                
                Ak.data[q][k] = s * apk + c * aqk
                Ak.data[k][q] = Ak.data[q][k]
        
        # 更新特征向量矩阵 V
        for k in range(n):
            vkp = V.data[k][p]
            vkq = V.data[k][q]
            
            V.data[k][p] = c * vkp - s * vkq
            V.data[k][q] = s * vkp + c * vkq
    
    # 从对角线提取特征值
    eigenvalues = []
    for i in range(n):
        eigenvalues.append(Ak.data[i][i])
    
    return eigenvalues, V


def cholesky_decomposition(A: Matrix) -> Matrix:
    """
    Cholesky 分解：将对称正定矩阵 A 分解为 L * L^T
    
    参数:
        A: 对称正定矩阵
        
    返回:
        Matrix: 下三角矩阵 L
    """
    if not A.is_square():
        raise ValueError("Cholesky 分解需要方阵")
    
    if not A.is_symmetric():
        raise ValueError("Cholesky 分解需要对称矩阵")
    
    n = A.rows
    L = Matrix.zeros(n)
    
    eps = 1e-12
    
    for i in range(n):
        for j in range(i + 1):
            # 计算 L[i][j]
            s = 0.0
            for k in range(j):
                s += L.data[i][k] * L.data[j][k]
            
            if i == j:
                # 对角线元素
                val = A.data[i][i] - s
                if val < eps:
                    raise ValueError("矩阵不是正定的")
                L.data[i][j] = math.sqrt(val)
            else:
                # 非对角线元素
                L.data[i][j] = (A.data[i][j] - s) / L.data[j][j]
    
    return L
