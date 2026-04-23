from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from typing import List, Dict, Any, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatabaseConnector:
    def __init__(self, connection_string: str, **kwargs):
        self.connection_string = connection_string
        self.engine = create_engine(connection_string, **kwargs)
        self.Session = sessionmaker(bind=self.engine)
        self.session = None
        logger.info(f"数据库连接已初始化: {connection_string.split('://')[0]}")

    def connect(self):
        if not self.session:
            self.session = self.Session()
            logger.info("数据库连接已建立")
        return self.session

    def disconnect(self):
        if self.session:
            self.session.close()
            self.session = None
            logger.info("数据库连接已关闭")

    def execute_query(
        self,
        query: str,
        params: Optional[Dict[str, Any]] = None,
        return_dict: bool = True
    ) -> List[Dict[str, Any]]:
        session = self.connect()
        try:
            result = session.execute(text(query), params or {})
            rows = result.fetchall()

            if return_dict and rows:
                columns = result.keys()
                return [dict(zip(columns, row)) for row in rows]
            else:
                return [tuple(row) for row in rows]

        except Exception as e:
            logger.error(f"查询执行失败: {str(e)}")
            raise
        finally:
            session.close()

    def execute_query_to_dataframe(self, query: str, params: Optional[Dict[str, Any]] = None):
        try:
            import pandas as pd
            return pd.read_sql_query(text(query), self.engine, params=params)
        except ImportError:
            logger.error("pandas未安装，请安装pandas: pip install pandas")
            raise

    def test_connection(self) -> bool:
        try:
            session = self.connect()
            session.execute(text("SELECT 1"))
            logger.info("数据库连接测试成功")
            return True
        except Exception as e:
            logger.error(f"数据库连接测试失败: {str(e)}")
            return False
        finally:
            if self.session:
                self.session.close()
                self.session = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()
