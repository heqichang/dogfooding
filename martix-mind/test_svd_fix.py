#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
测试 SVD 分解的重构误差
"""

import sys
import os

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("测试 SVD 分解的重构误差")
print("=" * 60)

# 导入
from matrixlib.matrix import Matrix
from matrixlib.decompositions import svd_decomposition

import math


def calculate_reconstruction_error(A: Matrix, U: Matrix, Sigma: Matrix, V: Matrix) -> float:
    """
    计算重构误差 max(|A - U * Sigma * V^T|)
    """
    # 计算重构矩阵
    reconstructed = U * Sigma * V.transpose()
    
    # 计算最大误差
    max_error = 0.0
    for i in range(A.rows):
        for j in range(A.cols):
            error = abs(A.data[i][j] - reconstructed.data[i][j])
            if error > max_error:
                max_error = error
    
    return max_error


def test_1():
    """测试 1: 简单的 3x2 矩阵"""
    print("\n测试 1: 简单的 3x2 矩阵")
    print("-" * 60)
    
    A = Matrix([
        [1, 2],
        [3, 4],
        [5, 6]
    ])
    
    print("矩阵 A:")
    print(A)
    
    U, Sigma, V = svd_decomposition(A)
    
    print("\nU (左奇异向量矩阵):")
    print(U)
    
    print("\nSigma (奇异值对角矩阵):")
    print(Sigma)
    
    print("\nV (右奇异向量矩阵):")
    print(V)
    
    error = calculate_reconstruction_error(A, U, Sigma, V)
    print(f"\n重构最大误差: {error:.2e}")
    print(f"期望: < 1e-10")
    print(f"结果: {'✓ 通过' if error < 1e-10 else '✗ 失败'}")
    
    return error < 1e-10


def test_2():
    """测试 2: 2x3 矩阵（行数 < 列数）"""
    print("\n测试 2: 2x3 矩阵（行数 < 列数）")
    print("-" * 60)
    
    A = Matrix([
        [1, 2, 3],
        [4, 5, 6]
    ])
    
    print("矩阵 A:")
    print(A)
    
    U, Sigma, V = svd_decomposition(A)
    
    error = calculate_reconstruction_error(A, U, Sigma, V)
    print(f"重构最大误差: {error:.2e}")
    print(f"结果: {'✓ 通过' if error < 1e-10 else '✗ 失败'}")
    
    return error < 1e-10


def test_3():
    """测试 3: 方阵"""
    print("\n测试 3: 3x3 方阵")
    print("-" * 60)
    
    A = Matrix([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
    ])
    
    print("矩阵 A:")
    print(A)
    
    U, Sigma, V = svd_decomposition(A)
    
    error = calculate_reconstruction_error(A, U, Sigma, V)
    print(f"重构最大误差: {error:.2e}")
    print(f"结果: {'✓ 通过' if error < 1e-10 else '✗ 失败'}")
    
    return error < 1e-10


def test_4():
    """测试 4: 对称正定矩阵"""
    print("\n测试 4: 对称正定矩阵")
    print("-" * 60)
    
    A = Matrix([
        [4, 1, 1],
        [1, 3, 1],
        [1, 1, 2]
    ])
    
    print("矩阵 A:")
    print(A)
    
    U, Sigma, V = svd_decomposition(A)
    
    error = calculate_reconstruction_error(A, U, Sigma, V)
    print(f"重构最大误差: {error:.2e}")
    print(f"结果: {'✓ 通过' if error < 1e-10 else '✗ 失败'}")
    
    return error < 1e-10


def test_5():
    """测试 5: 随机矩阵"""
    print("\n测试 5: 随机 4x5 矩阵")
    print("-" * 60)
    
    # 设置随机种子
    import random
    random.seed(42)
    
    A = Matrix.random(4, 5, low=-1, high=1)
    
    print("矩阵 A (部分显示):")
    print(A)
    
    U, Sigma, V = svd_decomposition(A)
    
    error = calculate_reconstruction_error(A, U, Sigma, V)
    print(f"重构最大误差: {error:.2e}")
    print(f"结果: {'✓ 通过' if error < 1e-10 else '✗ 失败'}")
    
    return error < 1e-10


def test_6():
    """测试 6: 验证 U 和 V 的正交性"""
    print("\n测试 6: 验证 U 和 V 的正交性")
    print("-" * 60)
    
    A = Matrix([
        [1, 2],
        [3, 4],
        [5, 6]
    ])
    
    U, Sigma, V = svd_decomposition(A)
    
    # 检查 U^T * U = I
    UTU = U.transpose() * U
    I_U = Matrix.identity(U.rows)
    
    error_U = 0.0
    for i in range(UTU.rows):
        for j in range(UTU.cols):
            error_U = max(error_U, abs(UTU.data[i][j] - I_U.data[i][j]))
    
    print(f"U^T * U ≈ I 的最大误差: {error_U:.2e}")
    
    # 检查 V^T * V = I
    VTV = V.transpose() * V
    I_V = Matrix.identity(V.rows)
    
    error_V = 0.0
    for i in range(VTV.rows):
        for j in range(VTV.cols):
            error_V = max(error_V, abs(VTV.data[i][j] - I_V.data[i][j]))
    
    print(f"V^T * V ≈ I 的最大误差: {error_V:.2e}")
    
    result = (error_U < 1e-10) and (error_V < 1e-10)
    print(f"结果: {'✓ 通过' if result else '✗ 失败'}")
    
    return result


def main():
    """运行所有测试"""
    all_passed = True
    
    tests = [
        ("简单的 3x2 矩阵", test_1),
        ("2x3 矩阵（行数 < 列数）", test_2),
        ("3x3 方阵", test_3),
        ("对称正定矩阵", test_4),
        ("随机 4x5 矩阵", test_5),
        ("验证正交性", test_6),
    ]
    
    print("\n" + "=" * 60)
    print("开始 SVD 分解测试")
    print("=" * 60)
    
    for name, test_func in tests:
        try:
            passed = test_func()
            if not passed:
                all_passed = False
        except Exception as e:
            print(f"\n✗ 测试 '{name}' 抛出异常: {e}")
            import traceback
            traceback.print_exc()
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✓ 所有 SVD 分解测试通过！")
    else:
        print("✗ 部分测试失败")
    print("=" * 60)
    
    return all_passed


if __name__ == "__main__":
    main()
