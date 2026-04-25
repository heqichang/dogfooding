from .matrix import Matrix
from .sparse import CSRMatrix, CSCMatrix
from .decompositions import lu_decomposition, qr_decomposition, svd_decomposition, cholesky_decomposition
from .eigenvalues import power_iteration, inverse_power_iteration, qr_algorithm, jacobi_method, eigenvalues, eigenvectors
from .optimized import block_matrix_multiply, strassen_multiply, loop_optimized_multiply, fast_multiply
from .benchmark import benchmark_basic_operations, benchmark_multiplication_methods, compare_with_numpy, run_benchmarks, verify_correctness

__version__ = '1.0.0'
__all__ = [
    'Matrix',
    'CSRMatrix',
    'CSCMatrix',
    'lu_decomposition',
    'qr_decomposition',
    'svd_decomposition',
    'cholesky_decomposition',
    'power_iteration',
    'inverse_power_iteration',
    'qr_algorithm',
    'jacobi_method',
    'eigenvalues',
    'eigenvectors',
    'block_matrix_multiply',
    'strassen_multiply',
    'loop_optimized_multiply',
    'fast_multiply',
    'benchmark_basic_operations',
    'benchmark_multiplication_methods',
    'compare_with_numpy',
    'run_benchmarks',
    'verify_correctness'
]
