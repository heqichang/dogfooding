#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""简单测试脚本"""

import sys
import os

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("测试矩阵运算库...")
print("Python 版本:", sys.version)

# 测试导入
try:
    from matrixlib.matrix import Matrix
    print("✓ 成功导入 Matrix 类")
except ImportError as e:
    print(f"✗ 导入失败: {e}")
    sys.exit(1)

# 测试基本运算
print("\n1. 测试基本运算...")

# 创建矩阵
A = Matrix([[1, 2], [3, 4]])
B = Matrix([[5, 6], [7, 8]])

print("A =")
print(A)
print("\nB =")
print(B)

# 测试加法
C = A + B
expected = [[6, 8], [10, 12]]
assert C.tolist() == expected, f"加法错误: {C.tolist()}"
print("\n✓ A + B 正确")
print(C)

# 测试乘法
C = A * B
expected = [[19, 22], [43, 50]]
assert C.tolist() == expected, f"乘法错误: {C.tolist()}"
print("\n✓ A * B 正确")
print(C)

# 测试转置
C = A.transpose()
expected = [[1, 3], [2, 4]]
assert C.tolist() == expected, f"转置错误: {C.tolist()}"
print("\n✓ A^T 正确")
print(C)

# 测试行列式
det = A.determinant()
expected = -2.0
assert abs(det - expected) < 1e-10, f"行列式错误: {det}"
print(f"\n✓ det(A) = {det} 正确")

# 测试求逆
print("\n2. 测试求逆...")
A_inv = A.inverse()
I = A * A_inv
expected_I = Matrix.identity(2)
assert I == expected_I, f"求逆错误"
print("A^-1 =")
print(A_inv)
print("\n✓ A * A^-1 = I")
print(I)

# 测试单位矩阵
print("\n3. 测试特殊矩阵...")
I = Matrix.identity(3)
print("单位矩阵 I:")
print(I)

zeros = Matrix.zeros(2, 3)
print("\n零矩阵:")
print(zeros)

ones = Matrix.ones(3, 2)
print("\n全一矩阵:")
print(ones)

# 测试迹
trace = A.trace()
expected = 5.0
assert abs(trace - expected) < 1e-10, f"迹错误: {trace}"
print(f"\n✓ trace(A) = {trace} 正确")

# 测试范数
norm_fro = A.norm('fro')
print(f"\nFrobenius 范数: {norm_fro:.6f}")

norm_1 = A.norm(1)
print(f"1-范数: {norm_1:.6f}")

norm_inf = A.norm('inf')
print(f"inf-范数: {norm_inf:.6f}")

# 测试 LU 分解
print("\n4. 测试 LU 分解...")
try:
    from matrixlib.decompositions import lu_decomposition
    L, U, P = lu_decomposition(A)
    print("L =")
    print(L)
    print("\nU =")
    print(U)
    
    # 验证 P*A = L*U
    if P:
        result = P * A == L * U
    else:
        result = A == L * U
    print(f"\n✓ P*A = L*U: {result}")
except Exception as e:
    print(f"LU 分解测试: {e}")

# 测试稀疏矩阵
print("\n5. 测试稀疏矩阵...")
try:
    from matrixlib.sparse import CSRMatrix, CSCMatrix
    
    dense = Matrix([[1, 0, 2], [0, 3, 0], [4, 5, 6]])
    print("原始稠密矩阵:")
    print(dense)
    
    csr = CSRMatrix.from_dense(dense)
    print(f"\nCSR 非零元素数: {csr.nnz()}")
    print(f"values: {csr.values}")
    print(f"col_indices: {csr.col_indices}")
    print(f"row_ptr: {csr.row_ptr}")
    
    # 验证转换
    back = csr.to_dense()
    assert back == dense, "CSR 转换错误"
    print("✓ CSR 转换正确")
    
    csc = CSCMatrix.from_dense(dense)
    print(f"\nCSC 非零元素数: {csc.nnz()}")
    print(f"values: {csc.values}")
    print(f"row_indices: {csc.row_indices}")
    print(f"col_ptr: {csc.col_ptr}")
    
    # 验证元素访问
    assert abs(csr[0, 0] - 1.0) < 1e-10
    assert abs(csr[0, 2] - 2.0) < 1e-10
    assert abs(csr[1, 1] - 3.0) < 1e-10
    print("✓ CSR 元素访问正确")
    
except Exception as e:
    print(f"稀疏矩阵测试错误: {e}")
    import traceback
    traceback.print_exc()

# 测试优化乘法
print("\n6. 测试优化乘法...")
try:
    from matrixlib.optimized import loop_optimized_multiply, block_matrix_multiply
    
    # 创建测试矩阵
    A = Matrix.random(30, 30)
    B = Matrix.random(30, 30)
    
    # 朴素乘法
    C_naive = A * B
    
    # 循环优化
    C_loop = loop_optimized_multiply(A, B)
    assert C_loop == C_naive, "循环优化乘法错误"
    print("✓ 循环优化乘法正确")
    
    # 分块乘法
    C_block = block_matrix_multiply(A, B, block_size=8)
    assert C_block == C_naive, "分块乘法错误"
    print("✓ 分块乘法正确")
    
except Exception as e:
    print(f"优化乘法测试错误: {e}")
    import traceback
    traceback.print_exc()

# 测试特征值
print("\n7. 测试特征值计算...")
try:
    from matrixlib.eigenvalues import power_iteration, jacobi_method
    
    # 创建对称矩阵
    A = Matrix([[4, 1, 1], [1, 3, 1], [1, 1, 2]])
    print("对称矩阵 A:")
    print(A)
    
    # 幂法
    eigval, eigvec = power_iteration(A, max_iterations=1000)
    print(f"\n主导特征值（幂法）: {eigval:.6f}")
    print(f"特征向量: {eigvec.tolist()}")
    
    # 验证
    Av = A * eigvec
    lambda_v = eigvec * eigval
    print(f"验证 A*v ≈ lambda*v: {Av == lambda_v}")
    
    # Jacobi 方法
    try:
        eigvals, eigvecs = jacobi_method(A)
        print(f"\n所有特征值（Jacobi）: {[f'{ev:.6f}' for ev in eigvals]}")
    except Exception as e:
        print(f"Jacobi 方法错误: {e}")
    
except Exception as e:
    print(f"特征值测试错误: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("所有基本测试完成！")
print("=" * 60)
