# ai_routes.py - API routes for AI Assistant & Chat
from flask import Blueprint, request
from library.common.response import api_success, api_error
from .ai_service import process_chat_message

ai_bp = Blueprint("ai_assistant", __name__)

DEFAULT_QUICK_PROMPTS = [
    {
        "id": 1,
        "text": "Tư vấn áo Blazer công sở cao cấp",
        "category": "blazer"
    },
    {
        "id": 2,
        "text": "Đầm dạ hội dự tiệc sang trọng",
        "category": "dam"
    },
    {
        "id": 3,
        "text": "Áo sơ mi lụa cổ Cuba có những màu gì?",
        "category": "somi"
    },
    {
        "id": 4,
        "text": "Gợi ý phối đồ với áo măng tô dạ cừu",
        "category": "mangto"
    },
    {
        "id": 5,
        "text": "Túi xách da bò thật giá bao nhiêu?",
        "category": "tui"
    }
]


@ai_bp.route("/api/ai/chat", methods=["POST"])
def ai_chat():
    """Endpoint nhận tin nhắn chat từ khách hàng và trả về phản hồi từ AI Stylist."""
    data = request.get_json() or {}
    message = data.get("message", "").strip()
    history = data.get("history", [])

    if not message:
        return api_error("Vui lòng nhập nội dung câu hỏi", code="MESSAGE_REQUIRED", status=400)

    try:
        result = process_chat_message(message, history)
        return api_success(result, code="AI_CHAT_SUCCESS", message="Phản hồi từ AI Stylist thành công")
    except Exception as ex:
        print(f"[AI Chat Route Error]: {ex}")
        return api_error("Hệ thống trợ lý AI tạm thời gặp sự cố, vui lòng thử lại sau!", code="AI_CHAT_FAILED", status=500)


@ai_bp.route("/api/ai/quick-prompts", methods=["GET"])
def get_quick_prompts():
    """Lấy danh sách các câu hỏi gợi ý nhanh cho khách hàng."""
    return api_success(DEFAULT_QUICK_PROMPTS, code="QUICK_PROMPTS_FETCHED")
