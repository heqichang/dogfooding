#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
矩阵运算库演示脚本
展示如何使用 matrixlib 的各种功能
"""

import sys
sys.path.insert(0, '.')

from matrixlib import (
    Matrix,
    CSRMatrix, CSCMatrix,
    lu_decomposition, qr_decomposition, svd_decomposition, cholesky_decomposition,
    power_iteration, qr_algorithm, jacobi_method,
    block_matrix_multiply, strassen_multiply, loop_optimized_multiply,
    verify_correctness, compare_with_numpy
)


def demo_basic_operations():
    """演示基本矩阵运算"""
    print("=" * 60)
    print("1. 基本矩阵运算演示")
    print("=" * 60)
    
    # 创建矩阵
    A = Matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    B = Matrix([[9, 8, 7], [6, 5, 4], [3, 2, 1]])
    
    print("\n矩阵 A:")
    print(A)
    print(f"\n矩阵 A 的形状: {A.shape()}")
    
    print("\n矩阵 B:")
    print(B)
    
    # 矩阵加法
    print("\nA + B:")
    print(A + B)
    
    # 矩阵减法
    print("\nA - B:")
    print(A - B)
    
    # 数乘
    print("\n2 * A:")
    print(2 * A)
    
    # 矩阵乘法
    print("\nA * B:")
    print(A * B)
    
    # 转置
    print("\nA 的转置 A^T:")
    print(A.T)
    
    # 迹
    print(f"\nA 的迹: {A.trace()}")
    
    # 范数
    print(f"A 的 Frobenius 范数: {A.norm('fro'):.6f}")
    print(f"A 的 1-范数: {A.norm(1):.6f}")
    print(f"A 的 inf-范数: {A.norm('inf'):.6f}")


def demo_advanced_operations():
    """演示高级矩阵运算"""
    print("\n" + "=" * 60)
    print("2. 高级矩阵运算演示（行列式、求逆）")
    print("=" * 60)
    
    # 创建一个可逆矩阵
    A = Matrix([[4, 7], [2, 6]])
    print("\n矩阵 A:")
    print(A)
    
    # 行列式
    det = A.determinant()
    print(f"\nA 的行列式: {det}")
    
    # 检查是否可逆
    print(f"A 是否可逆: {A.is_invertible()}")
    
    # 求逆
    A_inv = A.inverse()
    print("\nA 的逆矩阵 A^-1:")
    print(A_inv)
    
    # 验证 A * A^-1 = I
    print("\n验证 A * A^-1 = I:")
    I = A * A_inv
    print(I)
    
    # 求解线性方程组 Ax = b
    print("\n求解线性方程组 Ax = b:")
    b = Matrix([[1], [2]])
    print(f"b = {b.tolist()}")
    x = A.solve(b)
    print(f"x = {x.tolist()}")
    print(f"验证 Ax = b: {(A * x).tolist()}")
    
    # 条件数
    print(f"\nA 的条件数（2-范数）: {A.condition_number(2):.6f}")


def demo_decompositions():
    """演示矩阵分解"""
    print("\n" + "=" * 60)
    print("3. 矩阵分解演示")
    print("=" * 60)
    
    # 创建一个矩阵
    A = Matrix([[2, -1, 0], [-1, 2, -1], [0, -1, 2]])
    print("\n矩阵 A:")
    print(A)
    
    # LU 分解
    print("\n--- LU 分解 ---")
    L, U, P = lu_decomposition(A)
    print("L (下三角矩阵):")
    print(L)
    print("U (上三角矩阵):")
    print(U)
    if P:
        print("P (置换矩阵):")
        print(P)
    print(f"验证 P*A = L*U: {P * A == L * U if P else A == L * U}")
    
    # QR 分解
    print("\n--- QR 分解 ---")
    Q, R = qr_decomposition(A, method='householder')
    print("Q (正交矩阵):")
    print(Q)
    print("R (上三角矩阵):")
    print(R)
    print(f"验证 Q*Q^T = I: {Q * Q.T == Matrix.identity(3)}")
    print(f"验证 Q*R = A: {Q * R == A}")
    
    # Cholesky 分解
    print("\n--- Cholesky 分解 ---")
    try:
        L = cholesky_decomposition(A)
        print("L (下三角矩阵):")
        print(L)
        print(f"验证 L*L^T = A: {L * L.T == A}")
    except Exception as e:
        print(f"Cholesky 分解失败: {e}")
    
    # SVD 分解
    print("\n--- SVD 分解 ---")
    U, Sigma, V = svd_decomposition(A, max_iterations=50)
    print("U (左奇异向量矩阵):")
    print(U)
    print("Sigma (奇异值对角矩阵):")
    print(Sigma)
    print("V (右奇异向量矩阵):")
    print(V)


def demo_eigenvalues():
    """演示特征值和特征向量计算"""
    print("\n" + "=" * 60)
    print("4. 特征值与特征向量演示")
    print("=" * 60)
    
    # 创建一个对称矩阵
    A = Matrix([[4, 1, 1], [1, 3, 1], [1, 1, 2]])
    print("\n对称矩阵 A:")
    print(A)
    
    # 幂法求主导特征值
    print("\n--- 幂法求主导特征值 ---")
    eigenvalue, eigenvector = power_iteration(A, max_iterations=1000)
    print(f"主导特征值: {eigenvalue:.6f}")
    print(f"对应的特征向量: {eigenvector.tolist()}")
    
    # 验证 A * v = lambda * v
    Av = A * eigenvector
    lambda_v = eigenvector * eigenvalue
    print(f"验证 A*v = lambda*v: {Av == lambda_v}")
    
    # Jacobi 方法求所有特征值
    print("\n--- Jacobi 方法求所有特征值 ---")
    eigenvalues, eigenvectors = jacobi_method(A)
    print("特征值:", [f"{ev:.6f}" for ev in eigenvalues])
    print("特征向量矩阵:")
    print(eigenvectors)
    
    # QR 算法
    print("\n--- QR 算法求所有特征值 ---")
    eigenvalues_qr, eigenvectors_qr = qr_algorithm(A)
    print("特征值:", [f"{ev:.6f}" for ev in eigenvalues_qr])


def demo_sparse_matrices():
    """演示稀疏矩阵"""
    print("\n" + "=" * 60)
    print("5. 稀疏矩阵演示 (CSR / CSC)")
    print("=" * 60)
    
    # 创建一个稀疏矩阵
    dense = Matrix([
        [1, 0, 0, 2],
        [0, 3, 0, 0],
        [0, 0, 4, 5],
        [6, 0, 0, 7]
    ])
    print("\n原始稠密矩阵:")
    print(dense)
    
    # 转换为 CSR 格式
    csr = CSRMatrix.from_dense(dense)
    print(f"\nCSR 格式稀疏矩阵:")
    print(f"  形状: {csr.shape()}")
    print(f"  非零元素数量: {csr.nnz()}")
    print(f"  密度: {csr.density():.2%}")
    print(f"  values: {csr.values}")
    print(f"  col_indices: {csr.col_indices}")
    print(f"  row_ptr: {csr.row_ptr}")
    
    # 元素访问
    print(f"\nCSR 元素访问:")
    print(f"  csr[0, 0] = {csr[0, 0]}")
    print(f"  csr[0, 3] = {csr[0, 3]}")
    print(f"  csr[1, 1] = {csr[1, 1]}")
    print(f"  csr[1, 0] = {csr[1, 0]} (零元素)")
    
    # 转换为 CSC 格式
    csc = CSCMatrix.from_dense(dense)
    print(f"\nCSC 格式稀疏矩阵:")
    print(f"  非零元素数量: {csc.nnz()}")
    print(f"  values: {csc.values}")
    print(f"  row_indices: {csc.row_indices}")
    print(f"  col_ptr: {csc.col_ptr}")
    
    # 转换回稠密矩阵验证
    print(f"\n转换回稠密矩阵 (CSR -> dense):")
    dense_back = csr.to_dense()
    print(dense_back)
    print(f"与原始矩阵一致: {dense_back == dense}")
    
    # 稀疏矩阵乘法
    print("\n--- 稀疏矩阵运算 ---")
    B = Matrix.random(4, 2)
    print("稠密矩阵 B:")
    print(B)
    
    print("\nCSR * B:")
    result = csr * B
    print(result)
    print(f"与 dense * B 一致: {result == dense * B}")
    
    # 数乘
    print("\n2 * CSR:")
    csr_scaled = csr * 2
    print(csr_scaled.to_dense())


def demo_optimized_multiplication():
    """演示优化的矩阵乘法"""
    print("\n" + "=" * 60)
    print("6. 优化矩阵乘法演示")
    print("=" * 60)
    
    # 创建测试矩阵
    size = 64
    A = Matrix.random(size, size)
    B = Matrix.random(size, size)
    
    print(f"\n测试矩阵大小: {size}x{size}")
    
    import time
    
    # 朴素乘法
    if size <= 128:
        print("\n--- 朴素乘法 ---")
        start = time.time()
        C_naive = A * B
        naive_time = time.time() - start
        print(f"时间: {naive_time:.4f} 秒")
    
    # 循环优化乘法
    print("\n--- 循环优化乘法 ---")
    start = time.time()
    C_loop = loop_optimized_multiply(A, B)
    loop_time = time.time() - start
    print(f"时间: {loop_time:.4f} 秒")
    if size <= 128:
        print(f"结果正确: {C_loop == C_naive}")
    
    # 分块乘法
    print("\n--- 分块乘法 ---")
    start = time.time()
    C_block = block_matrix_multiply(A, B, block_size=16)
    block_time = time.time() - start
    print(f"时间: {block_time:.4f} 秒")
    print(f"结果正确: {C_block == C_loop}")
    
    # Strassen 算法
    print("\n--- Strassen 算法 ---")
    start = time.time()
    C_strassen = strassen_multiply(A, B, threshold=32)
    strassen_time = time.time() - start
    print(f"时间: {strassen_time:.4f} 秒")
    print(f"结果正确: {C_strassen == C_loop}")


def main():
    """主函数"""
    print("*" * 60)
    print("*         矩阵运算库演示程序")
    print("*         Matrix Library Demo")
    print("*" * 60)
    
    # 首先验证正确性
    print("\n首先验证实现的正确性...")
    verify_correctness()
    
    # 运行各个演示
    demo_basic_operations()
    demo_advanced_operations()
    demo_decompositions()
    demo_eigenvalues()
    demo_sparse_matrices()
    demo_optimized_multiplication()
    
    # 与 NumPy 对比（如果安装了）
    print("\n" + "=" * 60)
    print("7. 与 NumPy 性能对比")
    print("=" * 60)
    compare_with_numpy(size=50, runs=3)
    
    print("\n" + "*" * 60)
    print("*         演示完成！")
    print("*" * 60)


if __name__ == "__main__":
    main()
