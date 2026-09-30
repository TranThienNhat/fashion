from flask import jsonify
from typing import Any, Optional, Dict

def api_success(data: Any = None, message: str = "Thao tác thành công", code: str = "SUCCESS", status: int = 200, **kwargs):
    """
    Chuẩn hóa phản hồi thành công (Standardized Success Response)
    """
    resp: Dict[str, Any] = {
        "success": True,
        "code": code,
        "message": message
    }
    if data is not None:
        if isinstance(data, dict):
            # Giữ nguyên các trường cấp cao để tương thích 100% với frontend cũ
            resp.update(data)
            resp["data"] = data
        elif isinstance(data, list):
            resp["data"] = data
            resp["items"] = data
        else:
            resp["data"] = data
            
    for k, v in kwargs.items():
        resp[k] = v
        
    return jsonify(resp), status


def api_error(message: str = "Có lỗi xảy ra", code: str = "ERROR", status: int = 400, details: Any = None, **kwargs):
    """
    Chuẩn hóa phản hồi lỗi (Standardized Error Response)
    Bao gồm cả 'error' và 'message' để backward compatibility.
    """
    resp: Dict[str, Any] = {
        "success": False,
        "code": code,
        "error": message,
        "message": message
    }
    if details is not None:
        resp["details"] = details
    for k, v in kwargs.items():
        resp[k] = v
        
    return jsonify(resp), status
