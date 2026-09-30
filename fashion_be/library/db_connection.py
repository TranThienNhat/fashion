import os
from flask import g
import pymysql
import pymysql.cursors
from dotenv import load_dotenv

load_dotenv()

# MySQL Database Configuration
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = int(os.environ.get('DB_PORT', 3306))
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_NAME = os.environ.get('DB_NAME', 'fashiondb')


def get_db():
    """
    Tạo hoặc trả về kết nối MySQL trong request context (g).
    Cursor trả về dạng Dictionary Cursor để thuận tiện map DTO.
    """
    if 'db' not in g:
        try:
            connection = pymysql.connect(
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=True
            )
            g.db = connection
        except Exception as ex:
            print(f"[MySQL DB Connection Error]: {ex}")
            g.db = None
    return g.db


def close_db(e=None):
    """Đóng kết nối DB sau khi request hoàn tất."""
    db = g.pop('db', None)
    if db is not None:
        try:
            db.close()
        except Exception:
            pass


def get_cursor():
    """Lấy cursor của kết nối hiện tại."""
    db = get_db()
    if db is not None:
        return db.cursor()
    return None