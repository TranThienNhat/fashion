import os
from dotenv import load_dotenv

load_dotenv()

def get_base_url():
    """Lấy BASE_URL từ environment variable, mặc định là localhost:5000"""
    return os.getenv('BASE_URL', 'http://localhost:5000')

def get_image_url(filename):
    """Tạo URL đầy đủ cho ảnh"""
    if not filename:
        return None
    base_url = get_base_url()
    return f"{base_url}/uploads/{filename}"
