#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Bug detection test script - ASCII only output"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("Matrix Library Bug Detection Test")
print("=" * 60)

bugs_found = []

# Test 1: Basic operations
print("\n[Test 1] Basic operations...")
try:
    from matrixlib.matrix import Matrix
    A = Matrix([[1, 2], [3, 4]])
    B = Matrix([[5, 6], [7, 8]])

    # Addition
    C = A + B
    expected = [[6, 8], [10, 12]]
    assert C.tolist() == expected
    print("  [PASS] Addition")

    # Multiplication
    C = A * B
    expected = [[19, 22], [43, 50]]
    assert C.tolist() == expected
    print("  [PASS] Multiplication")

    # Transpose
    C = A.transpose()
    expected = [[1, 3], [2, 4]]
    assert C.tolist() == expected
    print("  [PASS] Transpose")

    # Determinant
    det = A.determinant()
    assert abs(det - (-2.0)) < 1e-10
    print("  [PASS] Determinant")

    # Inverse
    A_inv = A.inverse()
    I = A * A_inv
    expected_I = Matrix.identity(2)
    assert I == expected_I
    print("  [PASS] Inverse")

except Exception as e:
    bugs_found.append(f"Basic operations: {e}")
    print(f"  [FAIL] {e}")

# Test 2: LU decomposition
print("\n[Test 2] LU decomposition...")
try:
    from matrixlib.decompositions import lu_decomposition
    A = Matrix([[2, -1, 0], [-1, 2, -1], [0, -1, 2]])
    L, U, P = lu_decomposition(A)

    # Verify P*A = L*U
    if P:
        PA = P * A
        LU = L * U
        if not (PA == LU):
            bugs_found.append("LU decomposition: P*A != L*U")
            print(f"  [FAIL] P*A != L*U")
        else:
            print("  [PASS] P*A = L*U")
    else:
        LU = L * U
        if not (A == LU):
            bugs_found.append("LU decomposition: A != L*U")
            print(f"  [FAIL] A != L*U")
        else:
            print("  [PASS] A = L*U")

except Exception as e:
    bugs_found.append(f"LU decomposition: {e}")
    print(f"  [FAIL] {e}")

# Test 3: QR decomposition
print("\n[Test 3] QR decomposition...")
try:
    from matrixlib.decompositions import qr_decomposition
    A = Matrix([[1, 2], [3, 4], [5, 6]])

    for method in ['householder', 'gram_schmidt', 'modified_gram_schmidt']:
        try:
            Q, R = qr_decomposition(A, method=method)

            # Verify Q*R = A
            QR = Q * R
            if not (QR == A):
                bugs_found.append(f"QR decomposition ({method}): Q*R != A")
                print(f"  [FAIL] {method}: Q*R != A")
            else:
                print(f"  [PASS] {method}: Q*R = A")

            # Verify Q is orthogonal (Q^T * Q = I)
            QTQ = Q.T * Q
            I_expected = Matrix.identity(Q.cols)
            if not (QTQ == I_expected):
                bugs_found.append(f"QR decomposition ({method}): Q not orthogonal")
                print(f"  [FAIL] {method}: Q not orthogonal")
            else:
                print(f"  [PASS] {method}: Q is orthogonal")

        except Exception as e:
            bugs_found.append(f"QR decomposition ({method}): {e}")
            print(f"  [FAIL] {method}: {e}")

except Exception as e:
    bugs_found.append(f"QR decomposition: {e}")
    print(f"  [FAIL] {e}")

# Test 4: SVD decomposition
print("\n[Test 4] SVD decomposition...")
try:
    from matrixlib.decompositions import svd_decomposition
    A = Matrix([[1, 2], [3, 4], [5, 6]])

    U, Sigma, V = svd_decomposition(A, max_iterations=100)

    # Verify U * Sigma * V^T = A
    reconstructed = U * Sigma * V.T
    if not (reconstructed == A):
        bugs_found.append("SVD decomposition: U*Sigma*V^T != A")
        print(f"  [FAIL] U*Sigma*V^T != A")
        print(f"    Max error: {max(abs(reconstructed.data[i][j] - A.data[i][j]) for i in range(A.rows) for j in range(A.cols))}")
    else:
        print("  [PASS] U*Sigma*V^T = A")

except Exception as e:
    bugs_found.append(f"SVD decomposition: {e}")
    print(f"  [FAIL] {e}")

# Test 5: Eigenvalues
print("\n[Test 5] Eigenvalues...")
try:
    from matrixlib.eigenvalues import power_iteration, jacobi_method, qr_algorithm
    A = Matrix([[4, 1], [1, 3]])

    # Power iteration
    try:
        eigval, eigvec = power_iteration(A, max_iterations=1000)
        Av = A * eigvec
        lambda_v = eigvec * eigval
        if not (Av == lambda_v):
            bugs_found.append("Power iteration: A*v != lambda*v")
            print(f"  [FAIL] Power iteration: A*v != lambda*v")
        else:
            print("  [PASS] Power iteration")
    except Exception as e:
        bugs_found.append(f"Power iteration: {e}")
        print(f"  [FAIL] Power iteration: {e}")

    # Jacobi method
    try:
        eigvals, eigvecs = jacobi_method(A)
        print(f"  [PASS] Jacobi method (eigenvalues: {eigvals})")
    except Exception as e:
        bugs_found.append(f"Jacobi method: {e}")
        print(f"  [FAIL] Jacobi method: {e}")

    # QR algorithm
    try:
        eigvals, eigvecs = qr_algorithm(A)
        print(f"  [PASS] QR algorithm (eigenvalues: {eigvals})")
    except Exception as e:
        bugs_found.append(f"QR algorithm: {e}")
        print(f"  [FAIL] QR algorithm: {e}")

except Exception as e:
    bugs_found.append(f"Eigenvalues: {e}")
    print(f"  [FAIL] {e}")

# Test 6: Sparse matrices
print("\n[Test 6] Sparse matrices...")
try:
    from matrixlib.sparse import CSRMatrix, CSCMatrix
    dense = Matrix([[1, 0, 2], [0, 3, 0], [4, 5, 6]])

    # CSR
    csr = CSRMatrix.from_dense(dense)
    back = csr.to_dense()
    if not (back == dense):
        bugs_found.append("CSR: to_dense conversion error")
        print("  [FAIL] CSR to_dense conversion")
    else:
        print("  [PASS] CSR conversion")

    # Element access
    if abs(csr[0, 0] - 1.0) > 1e-10 or abs(csr[0, 2] - 2.0) > 1e-10:
        bugs_found.append("CSR: element access error")
        print("  [FAIL] CSR element access")
    else:
        print("  [PASS] CSR element access")

    # CSC
    csc = CSCMatrix.from_dense(dense)
    back = csc.to_dense()
    if not (back == dense):
        bugs_found.append("CSC: to_dense conversion error")
        print("  [FAIL] CSC to_dense conversion")
    else:
        print("  [PASS] CSC conversion")

except Exception as e:
    bugs_found.append(f"Sparse matrices: {e}")
    print(f"  [FAIL] {e}")

# Test 7: Optimized multiplication
print("\n[Test 7] Optimized multiplication...")
try:
    from matrixlib.optimized import loop_optimized_multiply, block_matrix_multiply, strassen_multiply
    A = Matrix.random(32, 32)
    B = Matrix.random(32, 32)
    C_naive = A * B

    # Loop optimized
    C_loop = loop_optimized_multiply(A, B)
    if not (C_loop == C_naive):
        bugs_found.append("Loop optimized multiply: result != naive")
        print("  [FAIL] Loop optimized multiply")
    else:
        print("  [PASS] Loop optimized multiply")

    # Block multiply
    C_block = block_matrix_multiply(A, B, block_size=8)
    if not (C_block == C_naive):
        bugs_found.append("Block multiply: result != naive")
        print("  [FAIL] Block multiply")
    else:
        print("  [PASS] Block multiply")

    # Strassen
    C_strassen = strassen_multiply(A, B, threshold=16)
    if not (C_strassen == C_naive):
        bugs_found.append("Strassen multiply: result != naive")
        print("  [FAIL] Strassen multiply")
    else:
        print("  [PASS] Strassen multiply")

except Exception as e:
    bugs_found.append(f"Optimized multiplication: {e}")
    print(f"  [FAIL] {e}")

# Test 8: Cholesky decomposition
print("\n[Test 8] Cholesky decomposition...")
try:
    from matrixlib.decompositions import cholesky_decomposition
    # Positive definite matrix
    A = Matrix([[4, 2], [2, 3]])

    L = cholesky_decomposition(A)
    LLT = L * L.T
    if not (LLT == A):
        bugs_found.append("Cholesky: L*L^T != A")
        print("  [FAIL] L*L^T != A")
    else:
        print("  [PASS] Cholesky decomposition")

except Exception as e:
    bugs_found.append(f"Cholesky decomposition: {e}")
    print(f"  [FAIL] {e}")

# Summary
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
if bugs_found:
    print(f"\nFound {len(bugs_found)} bug(s):\n")
    for i, bug in enumerate(bugs_found, 1):
        print(f"{i}. {bug}")
else:
    print("\nNo bugs found! All tests passed.")
print("\n" + "=" * 60)
