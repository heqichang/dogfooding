import sqlite3
from datetime import datetime, timedelta
import random
import os


def create_sample_database(db_path: str = "sample.db"):
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"已删除旧数据库: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            manager TEXT,
            location TEXT
        )
    ''')

    departments = [
        ('销售部', '张三', '北京'),
        ('技术部', '李四', '上海'),
        ('市场部', '王五', '广州'),
        ('财务部', '赵六', '深圳'),
        ('人力资源部', '钱七', '杭州')
    ]
    cursor.executemany(
        'INSERT INTO departments (name, manager, location) VALUES (?, ?, ?)',
        departments
    )

    cursor.execute('''
        CREATE TABLE employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            department_id INTEGER,
            position TEXT,
            salary REAL,
            join_date TEXT,
            FOREIGN KEY (department_id) REFERENCES departments (id)
        )
    ''')

    employees = []
    positions = ['经理', '主管', '工程师', '专员', '助理', '实习生']
    for i in range(1, 26):
        dept_id = random.randint(1, 5)
        position = random.choice(positions)
        base_salary = {'经理': 25000, '主管': 18000, '工程师': 15000,
                       '专员': 10000, '助理': 8000, '实习生': 4000}
        salary = base_salary[position] + random.randint(-2000, 5000)
        join_date = (datetime.now() - timedelta(days=random.randint(30, 3650))).strftime('%Y-%m-%d')

        employees.append((
            f'员工{i}',
            dept_id,
            position,
            float(salary),
            join_date
        ))

    cursor.executemany(
        'INSERT INTO employees (name, department_id, position, salary, join_date) VALUES (?, ?, ?, ?, ?)',
        employees
    )

    cursor.execute('''
        CREATE TABLE monthly_sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month TEXT NOT NULL,
            sales REAL,
            profit REAL,
            orders INTEGER
        )
    ''')

    months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
              '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12']

    monthly_sales = []
    base_sales = 100000
    for month in months:
        sales = base_sales + random.randint(-20000, 50000)
        profit = sales * random.uniform(0.15, 0.35)
        orders = int(sales / random.randint(500, 1500))

        monthly_sales.append((month, float(sales), float(profit), orders))
        base_sales = sales

    cursor.executemany(
        'INSERT INTO monthly_sales (month, sales, profit, orders) VALUES (?, ?, ?, ?)',
        monthly_sales
    )

    cursor.execute('''
        CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            price REAL,
            stock INTEGER,
            status TEXT DEFAULT 'active'
        )
    ''')

    products = [
        ('笔记本电脑', '电子产品', 5999.99, 100, 'active'),
        ('无线鼠标', '配件', 89.99, 500, 'active'),
        ('机械键盘', '配件', 399.99, 200, 'active'),
        ('显示器', '电子产品', 1999.99, 150, 'active'),
        ('耳机', '配件', 299.99, 300, 'active'),
        ('平板电脑', '电子产品', 3999.99, 80, 'active'),
        ('智能手表', '穿戴设备', 1299.99, 250, 'active'),
        ('USB集线器', '配件', 129.99, 400, 'inactive')
    ]
    cursor.executemany(
        'INSERT INTO products (name, category, price, stock, status) VALUES (?, ?, ?, ?, ?)',
        products
    )

    conn.commit()
    conn.close()

    print(f"示例数据库已创建: {db_path}")
    print("\n数据库包含以下表:")
    print("  - departments (部门表)")
    print("  - employees (员工表)")
    print("  - monthly_sales (月度销售表)")
    print("  - products (产品表)")
    print("\n示例查询:")
    print("  SELECT * FROM monthly_sales")
    print("  SELECT e.name, d.name AS dept, e.position, e.salary FROM employees e JOIN departments d ON e.department_id = d.id")
    print("  SELECT * FROM products WHERE status = 'active'")

    return db_path


if __name__ == '__main__':
    create_sample_database()
