from typing import Dict, Tuple, Optional, List
import time
from .matrix import Matrix
from .optimized import block_matrix_multiply, strassen_multiply, loop_optimized_multiply


def benchmark_basic_operations(size: int = 100, runs: int = 3) -> Dict:
    """
    基准测试基本矩阵运算
    
    参数:
        size: 矩阵大小
        runs: 运行次数
        
    返回:
        Dict: 包含各操作的平均时间
    """
    print(f"\n=== 基准测试基本运算（{size}x{size} 矩阵）===")
    
    # 创建测试矩阵
    A = Matrix.random(size, size)
    B = Matrix.random(size, size)
    scalar = 2.5
    
    results = {}
    
    # 1. 矩阵加法
    times = []
    for _ in range(runs):
        start = time.time()
        C = A + B
        times.append(time.time() - start)
    avg_time = sum(times) / len(times)
    results['add'] = avg_time
    print(f"矩阵加法: {avg_time:.6f} 秒")
    
    # 2. 矩阵减法
    times = []
    for _ in range(runs):
        start = time.time()
        C = A - B
        times.append(time.time() - start)
    avg_time = sum(times) / len(times)
    results['subtract'] = avg_time
    print(f"矩阵减法: {avg_time:.6f} 秒")
    
    # 3. 数乘
    times = []
    for _ in range(runs):
        start = time.time()
        C = A * scalar
        times.append(time.time() - start)
    avg_time = sum(times) / len(times)
    results['scalar_multiply'] = avg_time
    print(f"数乘: {avg_time:.6f} 秒")
    
    # 4. 矩阵乘法（朴素）
    times = []
    for _ in range(runs):
        start = time.time()
        C = A * B
        times.append(time.time() - start)
    avg_time = sum(times) / len(times)
    results['naive_multiply'] = avg_time
    print(f"朴素乘法: {avg_time:.6f} 秒")
    
    # 5. 转置
    times = []
    for _ in range(runs):
        start = time.time()
        C = A.transpose()
        times.append(time.time() - start)
    avg_time = sum(times) / len(times)
    results['transpose'] = avg_time
    print(f"转置: {avg_time:.6f} 秒")
    
    # 6. 行列式
    if size <= 50:
        times = []
        for _ in range(runs):
            start = time.time()
            det = A.determinant()
            times.append(time.time() - start)
        avg_time = sum(times) / len(times)
        results['determinant'] = avg_time
        print(f"行列式: {avg_time:.6f} 秒")
    
    # 7. 求逆
    if size <= 50:
        times = []
        for _ in range(runs):
            start = time.time()
            A_inv = A.inverse()
            times.append(time.time() - start)
        avg_time = sum(times) / len(times)
        results['inverse'] = avg_time
        print(f"求逆: {avg_time:.6f} 秒")
    
    return results


def benchmark_multiplication_methods(sizes: List[int] = [64, 128, 256], runs: int = 3) -> Dict:
    """
    基准测试不同乘法方法的性能
    
    参数:
        sizes: 要测试的矩阵大小列表
        runs: 每个测试的运行次数
        
    返回:
        Dict: 包含各方法在不同大小下的时间
    """
    print("\n=== 基准测试不同乘法方法 ===")
    
    results = {}
    
    for size in sizes:
        print(f"\n矩阵大小: {size}x{size}")
        
        A = Matrix.random(size, size)
        B = Matrix.random(size, size)
        
        size_results = {}
        
        # 1. 朴素乘法
        if size <= 256:
            times = []
            for _ in range(runs):
                start = time.time()
                C = A * B
                times.append(time.time() - start)
            avg_time = sum(times) / len(times)
            size_results['naive'] = avg_time
            print(f"  朴素乘法: {avg_time:.6f} 秒")
        
        # 2. 循环优化乘法
        times = []
        for _ in range(runs):
            start = time.time()
            C = loop_optimized_multiply(A, B)
            times.append(time.time() - start)
        avg_time = sum(times) / len(times)
        size_results['loop_opt'] = avg_time
        print(f"  循环优化: {avg_time:.6f} 秒")
        
        # 3. 分块乘法
        times = []
        for _ in range(runs):
            start = time.time()
            C = block_matrix_multiply(A, B)
            times.append(time.time() - start)
        avg_time = sum(times) / len(times)
        size_results['block'] = avg_time
        print(f"  分块乘法: {avg_time:.6f} 秒")
        
        # 4. Strassen 算法
        if size >= 64:
            times = []
            for _ in range(runs):
                start = time.time()
                C = strassen_multiply(A, B, threshold=32)
                times.append(time.time() - start)
            avg_time = sum(times) / len(times)
            size_results['strassen'] = avg_time
            print(f"  Strassen: {avg_time:.6f} 秒")
        
        results[size] = size_results
    
    return results


def compare_with_numpy(size: int = 100, runs: int = 3) -> Dict:
    """
    与 NumPy 进行性能对比
    
    参数:
        size: 矩阵大小
        runs: 运行次数
        
    返回:
        Dict: 对比结果
    """
    print(f"\n=== 与 NumPy 性能对比（{size}x{size} 矩阵）===")
    
    try:
        import numpy as np
    except ImportError:
        print("警告: NumPy 未安装，无法进行对比")
        return {'error': 'NumPy not installed'}
    
    # 创建 Matrix 库的矩阵
    A_mat = Matrix.random(size, size)
    B_mat = Matrix.random(size, size)
    
    # 创建 NumPy 数组
    A_np = np.array(A_mat.tolist())
    B_np = np.array(B_mat.tolist())
    
    results = {}
    
    # 矩阵加法
    print("\n矩阵加法:")
    # Matrix 库
    times = []
    for _ in range(runs):
        start = time.time()
        C_mat = A_mat + B_mat
        times.append(time.time() - start)
    mat_time = sum(times) / len(times)
    print(f"  Matrix 库: {mat_time:.6f} 秒")
    
    # NumPy
    times = []
    for _ in range(runs):
        start = time.time()
        C_np = A_np + B_np
        times.append(time.time() - start)
    np_time = sum(times) / len(times)
    print(f"  NumPy:    {np_time:.6f} 秒")
    print(f"  速度比:   {mat_time / np_time:.2f}x (Matrix 库 / NumPy)")
    
    results['add'] = {'matrixlib': mat_time, 'numpy': np_time, 'ratio': mat_time / np_time}
    
    # 矩阵乘法
    print("\n矩阵乘法:")
    # Matrix 库（循环优化）
    times = []
    for _ in range(runs):
        start = time.time()
        C_mat = loop_optimized_multiply(A_mat, B_mat)
        times.append(time.time() - start)
    mat_time = sum(times) / len(times)
    print(f"  Matrix 库: {mat_time:.6f} 秒")
    
    # NumPy
    times = []
    for _ in range(runs):
        start = time.time()
        C_np = np.dot(A_np, B_np)
        times.append(time.time() - start)
    np_time = sum(times) / len(times)
    print(f"  NumPy:    {np_time:.6f} 秒")
    print(f"  速度比:   {mat_time / np_time:.2f}x (Matrix 库 / NumPy)")
    
    results['multiply'] = {'matrixlib': mat_time, 'numpy': np_time, 'ratio': mat_time / np_time}
    
    # 转置
    print("\n矩阵转置:")
    # Matrix 库
    times = []
    for _ in range(runs):
        start = time.time()
        C_mat = A_mat.transpose()
        times.append(time.time() - start)
    mat_time = sum(times) / len(times)
    print(f"  Matrix 库: {mat_time:.6f} 秒")
    
    # NumPy
    times = []
    for _ in range(runs):
        start = time.time()
        C_np = A_np.T
        times.append(time.time() - start)
    np_time = sum(times) / len(times)
    print(f"  NumPy:    {np_time:.6f} 秒")
    print(f"  速度比:   {mat_time / np_time:.2f}x (Matrix 库 / NumPy)")
    
    results['transpose'] = {'matrixlib': mat_time, 'numpy': np_time, 'ratio': mat_time / np_time}
    
    # 行列式（仅小矩阵）
    if size <= 50:
        print("\n行列式计算:")
        # Matrix 库
        times = []
        for _ in range(runs):
            start = time.time()
            det_mat = A_mat.determinant()
            times.append(time.time() - start)
        mat_time = sum(times) / len(times)
        print(f"  Matrix 库: {mat_time:.6f} 秒")
        
        # NumPy
        times = []
        for _ in range(runs):
            start = time.time()
            det_np = np.linalg.det(A_np)
            times.append(time.time() - start)
        np_time = sum(times) / len(times)
        print(f"  NumPy:    {np_time:.6f} 秒")
        print(f"  速度比:   {mat_time / np_time:.2f}x (Matrix 库 / NumPy)")
        
        results['determinant'] = {'matrixlib': mat_time, 'numpy': np_time, 'ratio': mat_time / np_time}
    
    return results


def run_benchmarks(sizes: List[int] = [50, 100, 200]) -> Dict:
    """
    运行所有基准测试
    
    参数:
        sizes: 要测试的矩阵大小列表
        
    返回:
        Dict: 所有测试结果
    """
    all_results = {}
    
    # 基本运算测试
    for size in sizes:
        all_results[f'basic_{size}'] = benchmark_basic_operations(size=size, runs=3)
    
    # 乘法方法对比
    all_results['multiplication_methods'] = benchmark_multiplication_methods(
        sizes=[s for s in sizes if s <= 256]
    )
    
    # NumPy 对比
    for size in sizes:
        all_results[f'numpy_compare_{size}'] = compare_with_numpy(size=size, runs=3)
    
    return all_results


def verify_correctness() -> bool:
    """
    验证实现的正确性
    
    返回:
        bool: 是否所有测试都通过
    """
    print("\n=== 验证实现正确性 ===")
    
    all_passed = True
    
    # 测试 1: 基本运算
    print("\n1. 测试基本运算...")
    try:
        A = Matrix([[1, 2], [3, 4]])
        B = Matrix([[5, 6], [7, 8]])
        
        # 加法
        C = A + B
        expected = [[6, 8], [10, 12]]
        assert C.tolist() == expected, f"加法错误: 期望 {expected}, 得到 {C.tolist()}"
        print("  加法: ✓")
        
        # 乘法
        C = A * B
        expected = [[19, 22], [43, 50]]
        assert C.tolist() == expected, f"乘法错误: 期望 {expected}, 得到 {C.tolist()}"
        print("  乘法: ✓")
        
        # 转置
        C = A.transpose()
        expected = [[1, 3], [2, 4]]
        assert C.tolist() == expected, f"转置错误: 期望 {expected}, 得到 {C.tolist()}"
        print("  转置: ✓")
        
    except AssertionError as e:
        print(f"  错误: {e}")
        all_passed = False
    
    # 测试 2: 行列式
    print("\n2. 测试行列式...")
    try:
        A = Matrix([[1, 2], [3, 4]])
        det = A.determinant()
        expected = -2.0
        assert abs(det - expected) < 1e-10, f"行列式错误: 期望 {expected}, 得到 {det}"
        print("  行列式: ✓")
        
    except AssertionError as e:
        print(f"  错误: {e}")
        all_passed = False
    
    # 测试 3: 求逆
    print("\n3. 测试求逆...")
    try:
        A = Matrix([[1, 2], [3, 4]])
        A_inv = A.inverse()
        I = A * A_inv
        
        # 验证 A * A^-1 是否接近单位矩阵
        expected_I = Matrix.identity(2)
        assert I == expected_I, f"求逆错误: A * A^-1 不是单位矩阵"
        print("  求逆: ✓")
        
    except AssertionError as e:
        print(f"  错误: {e}")
        all_passed = False
    
    # 测试 4: 分块乘法正确性
    print("\n4. 测试分块乘法...")
    try:
        A = Matrix.random(50, 50)
        B = Matrix.random(50, 50)
        
        C_naive = A * B
        C_block = block_matrix_multiply(A, B)
        
        assert C_naive == C_block, "分块乘法结果与朴素乘法不一致"
        print("  分块乘法: ✓")
        
    except AssertionError as e:
        print(f"  错误: {e}")
        all_passed = False
    
    # 测试 5: Strassen 算法正确性
    print("\n5. 测试 Strassen 算法...")
    try:
        A = Matrix.random(64, 64)
        B = Matrix.random(64, 64)
        
        C_naive = A * B
        C_strassen = strassen_multiply(A, B, threshold=16)
        
        assert C_naive == C_strassen, "Strassen 算法结果与朴素乘法不一致"
        print("  Strassen 算法: ✓")
        
    except AssertionError as e:
        print(f"  错误: {e}")
        all_passed = False
    
    # 测试 6: 稀疏矩阵
    print("\n6. 测试稀疏矩阵...")
    try:
        dense = Matrix([[1, 0, 2], [0, 3, 0], [4, 5, 6]])
        csr = CSRMatrix.from_dense(dense)
        
        # 验证转换
        back_to_dense = csr.to_dense()
        assert dense == back_to_dense, "稀疏矩阵转换错误"
        print("  CSR 转换: ✓")
        
        # 验证元素访问
        assert abs(csr[0, 0] - 1) < 1e-10
        assert abs(csr[0, 1] - 0) < 1e-10
        assert abs(csr[0, 2] - 2) < 1e-10
        print("  CSR 元素访问: ✓")
        
    except AssertionError as e:
        print(f"  错误: {e}")
        all_passed = False
    except Exception as e:
        print(f"  错误: {e}")
        all_passed = False
    
    # 测试 7: SVD 分解
    print("\n7. 测试 SVD 分解...")
    try:
        from .decompositions import svd_decomposition
        
        # 测试 3x2 矩阵
        A = Matrix([
            [1, 2],
            [3, 4],
            [5, 6]
        ])
        
        U, Sigma, V = svd_decomposition(A)
        
        # 验证重构：A ≈ U * Sigma * V^T
        reconstructed = U * Sigma * V.transpose()
        
        # 计算最大误差
        max_error = 0.0
        for i in range(A.rows):
            for j in range(A.cols):
                error = abs(A.data[i][j] - reconstructed.data[i][j])
                if error > max_error:
                    max_error = error
        
        assert max_error < 1e-10, f"SVD 重构误差过大: {max_error}"
        print(f"  3x2 矩阵重构误差: {max_error:.2e}, ✓")
        
        # 验证 U 的正交性
        UTU = U.transpose() * U
        I_U = Matrix.identity(U.rows)
        error_U = 0.0
        for i in range(UTU.rows):
            for j in range(UTU.cols):
                error_U = max(error_U, abs(UTU.data[i][j] - I_U.data[i][j]))
        assert error_U < 1e-10, f"U 不正交，误差: {error_U}"
        print(f"  U 正交性误差: {error_U:.2e}, ✓")
        
        # 验证 V 的正交性
        VTV = V.transpose() * V
        I_V = Matrix.identity(V.rows)
        error_V = 0.0
        for i in range(VTV.rows):
            for j in range(VTV.cols):
                error_V = max(error_V, abs(VTV.data[i][j] - I_V.data[i][j]))
        assert error_V < 1e-10, f"V 不正交，误差: {error_V}"
        print(f"  V 正交性误差: {error_V:.2e}, ✓")
        
        # 测试 2x3 矩阵（行数 < 列数）
        A2 = Matrix([
            [1, 2, 3],
            [4, 5, 6]
        ])
        
        U2, Sigma2, V2 = svd_decomposition(A2)
        reconstructed2 = U2 * Sigma2 * V2.transpose()
        
        max_error2 = 0.0
        for i in range(A2.rows):
            for j in range(A2.cols):
                error = abs(A2.data[i][j] - reconstructed2.data[i][j])
                if error > max_error2:
                    max_error2 = error
        
        assert max_error2 < 1e-10, f"2x3 矩阵 SVD 重构误差过大: {max_error2}"
        print(f"  2x3 矩阵重构误差: {max_error2:.2e}, ✓")
        
        print("  SVD 分解: ✓")
        
    except AssertionError as e:
        print(f"  错误: {e}")
        all_passed = False
    except Exception as e:
        print(f"  错误: {e}")
        import traceback
        traceback.print_exc()
        all_passed = False
    
    if all_passed:
        print("\n✓ 所有正确性测试通过!")
    else:
        print("\n✗ 部分测试失败")
    
    return all_passed


# 导入稀疏矩阵类以支持正确性测试
from .sparse import CSRMatrix, CSCMatrix
