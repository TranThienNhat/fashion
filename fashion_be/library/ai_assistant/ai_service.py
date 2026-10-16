# ai_service.py - Trợ lý Thời trang AI độc quyền Vinh Store
import os
import re
import json
import requests
from typing import Dict, Any, List, Tuple
from library.db_connection import get_cursor

from dotenv import load_dotenv

load_dotenv()

def get_gemini_api_key():
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")

def get_openai_api_key():
    return os.getenv("OPENAI_API_KEY", "")


# Danh sách từ khóa ngoài phạm vi (Off-topic keywords) để bảo vệ nghiêm ngặt (Guardrail)
FORBIDDEN_KEYWORDS = [
    # Lập trình / Công nghệ
    "viết code", "lập trình", "source code", "python", "javascript", "typescript", 
    "sql query", "react", "html", "css", "c++", "java", "bug", " thuật toán", "debug",
    # Toán học / Khoa học tự nhiên
    "giải toán", "phương trình", "đạo hàm", "tích phân", "vật lý", "hóa học", "sinh học",
    # Chính trị / Xã hội
    "chính trị", "bầu cử", "tổng thống", "chiến tranh", "quân sự", "đảng phái", "tôn giáo",
    # Y tế / Pháp lý / Tài chính đầu tư
    "chữa bệnh", "uống thuốc gì", "triệu chứng bệnh", "luật sư", "kiện tụng", 
    "chứng khoán", "đầu tư bitcoin", "tiền ảo", "forex",
    # Giải trí ngoài lề
    "kể chuyện ma", "kể chuyện cười", "làm thơ tình", "ai là người đầu tiên lên mặt trăng", "thủ đô của"
]

STRICT_GUARDRAIL_MESSAGE = (
    "Dạ em là Trợ lý Thời trang AI của Vinh Store ✨. "
    "Em chỉ được phép hỗ trợ và tư vấn thông tin về các sản phẩm thời trang, kích cỡ (size), "
    "bảng màu, chất liệu vải và phong cách phối đồ độc quyền tại cửa hàng Vinh Store thôi ạ!\n\n"
    "Anh/chị có cần em hỗ trợ tìm kiếm mẫu trang phục (áo sơ mi, blazer, đầm dạ hội, áo khoác măng tô, túi xách...) "
    "hoặc gợi ý outfit nào phù hợp cho dịp sắp tới không ạ?"
)

SYSTEM_PROMPT = """Bạn là Trợ lý Tư vấn Thời trang AI cao cấp độc quyền của thương hiệu Vinh Store (Vinh Store AI Fashion Stylist).
Phong cách phục vụ: Lịch thiệp, tinh tế, sang trọng, am hiểu chuẩn mực thời trang cao cấp, tư vấn tận tâm và súc tích bằng tiếng Việt.

NHIỆM VỤ CHÍNH CỦA BẠN:
1. Tư vấn chuyên sâu về các sản phẩm thời trang hiện có trong danh mục của Vinh Store (kiểu dáng, chất liệu vải, bảng màu, kích cỡ S/M/L, giá niêm yết, tình trạng tồn kho).
2. Gợi ý phối đồ (Mix & Match) tinh tế, đẳng cấp theo vóc dáng, giới tính, hoàn cảnh sử dụng (đi làm công sở, dự tiệc dạ hội, dạo phố, gặp gỡ đối tác).
3. Hướng dẫn chọn size chuẩn xác và cung cấp thông tin mua sắm tại Vinh Store.

QUY TẮC BẢO VỆ VÀ GIỚI HẠN BẮT BUỘC (GUARDRAILS - TUYỆT ĐỐI TUÂN THỦ):
- BẠN CHỈ ĐƯỢC PHÉP TRẢ LỜI VỀ CÁC SẢN PHẨM THỜI TRANG VÀ DỊCH VỤ MUA SẮM CỦA VINH STORE.
- TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP trả lời các câu hỏi ngoài phạm vi (như: lập trình, viết code, giải toán, khoa học, chính trị, tôn giáo, tin tức thời sự, y tế, pháp lý, tài chính tiền ảo, hoặc bất kỳ chủ đề nào không liên quan đến thời trang Vinh Store).
- NẾU người dùng hỏi các chủ đề ngoài lề trên hoặc yêu cầu làm việc khác, bạn BẮT BUỘC từ chối lịch sự theo mẫu:
  "Dạ em là Trợ lý Thời trang của Vinh Store, em chỉ được phép hỗ trợ và tư vấn thông tin về các sản phẩm, phong cách và mua sắm tại cửa hàng mình thôi ạ. Anh/chị cần em hỗ trợ tìm kiếm hay phối đồ với sản phẩm nào của Vinh Store không ạ?"
- CHỈ SỬ DỤNG DỮ LIỆU SẢN PHẨM THỰC TẾ của Vinh Store được cung cấp trong phần [DỮ LIỆU SẢN PHẨM HIỆN CÓ]. TUYỆT ĐỐI KHÔNG BỊA ĐẶT sản phẩm hoặc giá bán mà shop không có.
- Trình bày định dạng Markdown đẹp mắt: dùng in đậm cho tên sản phẩm và giá tiền, dùng gạch đầu dòng rõ ràng, mạch lạc.
"""


def is_query_off_topic(query: str) -> bool:
    """Kiểm tra câu hỏi của người dùng có vi phạm quy định bảo vệ (hỏi ngoài lề) không."""
    q = query.lower()
    for kw in FORBIDDEN_KEYWORDS:
        if kw in q:
            return True
    return False


def get_all_products_with_variants() -> List[Dict[str, Any]]:
    """Truy vấn toàn bộ dữ liệu sản phẩm cùng biến thể từ MySQL database."""
    cursor = get_cursor()
    if not cursor:
        return []

    try:
        # Lấy thông tin sản phẩm kèm danh mục và thương hiệu
        sql = """
            SELECT 
                p.product_id, p.name, p.slug, p.description, p.base_price, p.thumbnail,
                c.name AS category_name,
                b.name AS brand_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            WHERE p.is_active = 1
            ORDER BY p.product_id ASC
        """
        cursor.execute(sql)
        products = cursor.fetchall()
        if not products:
            return []

        # Lấy biến thể (màu sắc, size, giá, tồn kho) cho từng sản phẩm
        p_ids = [str(p["product_id"]) for p in products]
        variants_sql = f"""
            SELECT product_id, color, size, price, stock_quantity
            FROM product_variants
            WHERE product_id IN ({','.join(p_ids)})
            ORDER BY product_id, color, size
        """
        cursor.execute(variants_sql)
        variants = cursor.fetchall()

        # Map biến thể vào sản phẩm
        variant_map: Dict[int, List[Dict[str, Any]]] = {}
        for v in variants:
            pid = v["product_id"]
            if pid not in variant_map:
                variant_map[pid] = []
            variant_map[pid].append(v)

        for p in products:
            pid = p["product_id"]
            p_vars = variant_map.get(pid, [])
            p["variants"] = p_vars
            p["colors"] = sorted(list({v["color"] for v in p_vars if v.get("color")}))
            p["sizes"] = sorted(list({v["size"] for v in p_vars if v.get("size")}))
            p["total_stock"] = sum(v.get("stock_quantity", 0) for v in p_vars)

        return products
    except Exception as ex:
        print(f"[AI Service] Error querying products from DB: {ex}")
        return []


def format_product_context(products: List[Dict[str, Any]]) -> str:
    """Tạo văn bản ngữ cảnh sản phẩm cung cấp cho AI LLM."""
    lines = ["[DỮ LIỆU SẢN PHẨM HIỆN CÓ TẠI VINH STORE]:"]
    for p in products:
        price_val = float(p.get("base_price") or 0)
        price_str = f"{price_val:,.0f} VNĐ"
        colors_str = ", ".join(p.get("colors", [])) or "Tiêu chuẩn"
        sizes_str = ", ".join(p.get("sizes", [])) or "Tiêu chuẩn"
        stock_status = f"Còn hàng ({p.get('total_stock', 0)} cái)" if p.get("total_stock", 0) > 0 else "Hết hàng"
        cat = p.get("category_name", "Thời trang")
        brand = p.get("brand_name", "Vinh Store")
        
        # Rút gọn mô tả
        desc = (p.get("description") or "").replace("\n", " ")
        if len(desc) > 180:
            desc = desc[:180] + "..."

        line = (
            f"- Mã SP: #{p['product_id']} | Tên: {p['name']} | Danh mục: {cat} | Thương hiệu: {brand} "
            f"| Giá niêm yết: {price_str} | Màu sắc: [{colors_str}] | Kích cỡ: [{sizes_str}] "
            f"| Tình trạng: {stock_status} | Mô tả: {desc}"
        )
        lines.append(line)
    return "\n".join(lines)


def match_relevant_products(query: str, products: List[Dict[str, Any]], top_k: int = 3) -> List[Dict[str, Any]]:
    """Lọc các sản phẩm liên quan nhất đến câu hỏi của người dùng để trả về kèm thẻ sản phẩm."""
    q = query.lower()
    scored = []

    for p in products:
        score = 0
        p_name = p.get("name", "").lower()
        p_desc = (p.get("description") or "").lower()
        p_cat = (p.get("category_name") or "").lower()
        colors = [c.lower() for c in p.get("colors", [])]
        sizes = [s.lower() for s in p.get("sizes", [])]

        # So khớp tên và danh mục
        for word in q.split():
            if len(word) >= 2:
                if word in p_name:
                    score += 5
                if word in p_desc:
                    score += 2
                if word in p_cat:
                    score += 4
                if any(word in c for c in colors):
                    score += 3
                if any(word == s for s in sizes):
                    score += 2

        # So khớp cụm từ thời trang phổ biến
        keywords_map = {
            "blazer": ["blazer", "áo vest", "vest"],
            "đầm": ["đầm", "váy", "dạ hội", "satin", "tiệc"],
            "sơ mi": ["sơ mi", "áo sơ mi", "cổ cuba", "lụa"],
            "măng tô": ["măng tô", "áo khoác", "dạ cừu", "áo ấm"],
            "túi": ["túi", "túi xách", "da bò", "phụ kiện"]
        }
        for kw, aliases in keywords_map.items():
            if any(alias in q for alias in aliases):
                if any(alias in p_name for alias in aliases):
                    score += 10

        if score > 0:
            scored.append((score, p))

    # Sắp xếp theo điểm giảm dần
    scored.sort(key=lambda x: x[0], reverse=True)
    results = [item[1] for item in scored[:top_k]]

    # Nếu không khớp từ khóa cụ thể (ví dụ hỏi chung chung: 'tư vấn giúp tôi'), trả về top sản phẩm nổi bật
    if not results and products:
        results = products[:top_k]

    # Định dạng dữ liệu trả về cho Frontend
    clean_results = []
    for p in results:
        clean_results.append({
            "product_id": p.get("product_id"),
            "name": p.get("name"),
            "slug": p.get("slug"),
            "base_price": float(p.get("base_price") or 0),
            "thumbnail": p.get("thumbnail"),
            "category_name": p.get("category_name"),
            "colors": p.get("colors", []),
            "sizes": p.get("sizes", []),
            "total_stock": p.get("total_stock", 0)
        })

    return clean_results


def call_gemini_api(prompt: str, context: str, history: List[Dict[str, str]]) -> str:
    """Gọi Gemini API thông qua REST API endpoint chính thức của Google."""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
    if not api_key:
        return ""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    # Xây dựng contents từ history và context
    contents = []
    # Thêm hướng dẫn và ngữ cảnh vào lượt đầu
    combined_instruction = f"{SYSTEM_PROMPT}\n\n{context}"
    
    # Thêm lịch sử hội thoại nếu có (tối đa 4 lượt gần nhất)
    for h in history[-4:]:
        role = "user" if h.get("role") == "user" else "model"
        contents.append({
            "role": role,
            "parts": [{"text": h.get("content", "")}]
        })
    
    # Lượt hiện tại
    contents.append({
        "role": "user",
        "parts": [{"text": prompt}]
    })

    payload = {
        "systemInstruction": {
            "parts": [{"text": combined_instruction}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1000,
        }
    }

    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=15)
        if response.status_code == 200:
            res_json = response.json()
            candidates = res_json.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
        else:
            print(f"[Gemini API Error] Status {response.status_code}: {response.text}")
    except Exception as ex:
        print(f"[Gemini API Call Exception]: {ex}")

    return ""


def call_openai_api(prompt: str, context: str, history: List[Dict[str, str]]) -> str:
    """Gọi OpenAI API nếu có cấu hình OPENAI_API_KEY."""
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        return ""

    url = "https://api.openai.com/v1/chat/completions"
    messages = [
        {"role": "system", "content": f"{SYSTEM_PROMPT}\n\n{context}"}
    ]
    for h in history[-4:]:
        role = "user" if h.get("role") == "user" else "assistant"
        messages.append({"role": role, "content": h.get("content", "")})
    messages.append({"role": "user", "content": prompt})

    try:
        response = requests.post(
            url,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": "gpt-4o-mini", "messages": messages, "temperature": 0.4, "max_tokens": 1000},
            timeout=15
        )
        if response.status_code == 200:
            res_json = response.json()
            return res_json.get("choices", [{}])[0].get("message", {}).get("content", "")
    except Exception as ex:
        print(f"[OpenAI API Exception]: {ex}")

    return ""


def rule_based_fallback_advisor(prompt: str, products: List[Dict[str, Any]], relevant_products: List[Dict[str, Any]]) -> str:
    """
    Bộ động cơ tư vấn thời trang thông minh tích hợp sẵn (Rule & Semantic DB Matcher).
    Đảm bảo hệ thống hoạt động hoàn hảo 100% ngay cả khi chưa có API Key bên ngoài.
    Đồng thời tuân thủ triệt để quy tắc: Chỉ tư vấn sản phẩm của Vinh Store, từ chối mọi câu hỏi ngoài lề.
    """
    q = prompt.lower().strip()

    # 1. Kiểm tra lời chào
    if any(q == greet or q.startswith(greet) for greet in ["chào", "xin chào", "hello", "hi", "alo", "shop ơi"]):
        product_names = [f"**{p['name']}** ({float(p['base_price']):,.0f}đ)" for p in products[:3]]
        items_str = "\n- ".join(product_names)
        return (
            "Dạ xin chào anh/chị! Em là **Trợ lý Thời trang AI** của Vinh Store ✨.\n\n"
            "Em rất hân hạnh được đồng hành và tư vấn giúp anh/chị lựa chọn những thiết kế thời trang cao cấp, "
            "tinh tế và phù hợp nhất với vóc dáng của mình.\n\n"
            "Hiện tại Vinh Store đang có các sản phẩm tiêu biểu:\n"
            f"- {items_str}\n\n"
            "Anh/chị đang quan tâm đến phong cách nào (công sở sang trọng, dạ tiệc, hay phối đồ mùa đông) ạ?"
        )

    # 2. Tư vấn theo các nhóm sản phẩm cụ thể
    if any(k in q for k in ["blazer", "vest", "áo vest"]):
        blazer = next((p for p in products if "blazer" in p["name"].lower()), None)
        if blazer:
            colors = ", ".join(blazer.get("colors", []))
            sizes = ", ".join(blazer.get("sizes", []))
            price = f"{float(blazer['base_price']):,.0f} VNĐ"
            return (
                f"Dạ về dòng áo Blazer, Vinh Store xin giới thiệu tuyệt phẩm **{blazer['name']}**:\n\n"
                f"- **Mức giá**: {price}\n"
                f"- **Chất liệu**: Dạ Cashmere cao cấp, bề mặt mềm mịn, giữ form dáng chuẩn may đo Ý.\n"
                f"- **Màu sắc khả dụng**: {colors}\n"
                f"- **Kích cỡ**: Size {sizes}\n"
                f"- **Tình trạng**: Còn hàng sẵn tại cửa hàng ({blazer.get('total_stock', 0)} chiếc).\n\n"
                f"💡 **Gợi ý phối đồ**: Anh/chị có thể phối cùng **Áo Sơ Mi Lụa Cổ Cuba Minimalist** bên trong và quần âu ống đứng "
                f"để tạo nên diện mạo vừa lịch lãm, vừa hiện đại và cuốn hút!"
            )

    if any(k in q for k in ["đầm", "váy", "dạ hội", "satin"]):
        dam = next((p for p in products if "đầm" in p["name"].lower() or "dạ hội" in p["name"].lower()), None)
        if dam:
            colors = ", ".join(dam.get("colors", []))
            sizes = ", ".join(dam.get("sizes", []))
            price = f"{float(dam['base_price']):,.0f} VNĐ"
            return (
                f"Dạ cho các buổi tiệc tối hoặc sự kiện trang trọng, Vinh Store đặc biệt gợi ý mẫu **{dam['name']}**:\n\n"
                f"- **Mức giá**: {price}\n"
                f"- **Chất liệu**: Lụa Silk Satin thượng hạng, có độ rũ mềm mại và bắt sáng lộng lẫy dưới ánh đèn tiệc.\n"
                f"- **Chi tiết thiết kế**: Đường xếp ly thủ công tinh xảo, tôn vinh trọn vẹn đường cong thanh thoát.\n"
                f"- **Màu sắc**: {colors}\n"
                f"- **Kích cỡ**: Size {sizes}\n\n"
                f"💡 **Gợi ý phối đồ**: Kết hợp hoàn hảo với **Túi Xách Da Bò Thuộc Thảo Mộc Flap Bag** màu Đỏ Rượu Vang hoặc Đen để hoàn thiện vẻ đẹp quý phái!"
            )

    if any(k in q for k in ["sơ mi", "áo sơ mi", "cổ cuba"]):
        somi = next((p for p in products if "sơ mi" in p["name"].lower()), None)
        if somi:
            colors = ", ".join(somi.get("colors", []))
            sizes = ", ".join(somi.get("sizes", []))
            price = f"{float(somi['base_price']):,.0f} VNĐ"
            return (
                f"Dạ mẫu **{somi['name']}** là item kinh điển tại Vinh Store:\n\n"
                f"- **Mức giá**: {price}\n"
                f"- **Chất liệu**: Lụa tự nhiên cao cấp, thoáng khí và êm dịu trên làn da.\n"
                f"- **Thiết kế**: Cổ Cuba phóng khoáng, form suông nhẹ nhàng hiện đại.\n"
                f"- **Màu sắc**: {colors}\n"
                f"- **Kích cỡ**: Size {sizes}\n\n"
                f"Sản phẩm cực kỳ dễ ứng dụng, thích hợp mặc độc lập hoặc mặc lót trong áo khoác măng tô/blazer."
            )

    if any(k in q for k in ["măng tô", "áo khoác", "dạ cừu", "áo ấm"]):
        mangto = next((p for p in products if "măng tô" in p["name"].lower()), None)
        if mangto:
            colors = ", ".join(mangto.get("colors", []))
            sizes = ", ".join(mangto.get("sizes", []))
            price = f"{float(mangto['base_price']):,.0f} VNĐ"
            return (
                f"Dạ cho trang phục thu đông cao cấp, mẫu **{mangto['name']}** là lựa chọn số một:\n\n"
                f"- **Mức giá**: {price}\n"
                f"- **Chất liệu**: Dạ len cừu tự nhiên 100%, giữ ấm tuyệt đối với phom dáng Double-Breasted hoàng gia.\n"
                f"- **Bảng màu**: {colors}\n"
                f"- **Kích cỡ**: Size {sizes}\n"
                f"- **Tình trạng**: Còn hàng số lượng giới hạn.\n\n"
                f"💡 Điểm nhấn cổ bẻ rộng cùng hàng khuy sừng đúc giúp tôn lên phong thái đĩnh đạc và sang trọng!"
            )

    if any(k in q for k in ["túi", "túi xách", "da bò", "phụ kiện"]):
        tui = next((p for p in products if "túi" in p["name"].lower()), None)
        if tui:
            colors = ", ".join(tui.get("colors", []))
            price = f"{float(tui['base_price']):,.0f} VNĐ"
            return (
                f"Dạ về dòng phụ kiện xa xỉ, Vinh Store trân trọng giới thiệu **{tui['name']}**:\n\n"
                f"- **Mức giá**: {price}\n"
                f"- **Chất liệu**: Da bò mộc thuộc thảo mộc nguyên bản (Vegetable-Tanned Leather), da càng dùng càng bóng đẹp theo thời gian.\n"
                f"- **Màu sắc sang trọng**: {colors}\n"
                f"- **Kích thước**: One Size chuẩn phom Flap Bag, khóa kim loại mạ vàng chải mờ cao cấp.\n\n"
                f"Chiếc túi này là điểm nhấn hoàn hảo cho cả outfit dạ tiệc lẫn phong cách thường nhật của quý khách."
            )

    # 3. Tư vấn theo giá tiền
    price_match = re.search(r"(\d+)\s*(triệu|tr|k|nghìn)", q)
    if "giá" in q or "dưới" in q or price_match:
        # Liệt kê các sản phẩm kèm giá
        lines = ["Dạ Vinh Store xin gửi anh/chị danh sách bảng giá các sản phẩm đang có tại cửa hàng:\n"]
        for p in products:
            p_price = float(p.get("base_price") or 0)
            lines.append(f"- **{p['name']}**: {p_price:,.0f} VNĐ (Danh mục: {p.get('category_name', 'Thời trang')})")
        lines.append("\nAnh/chị muốn xem chi tiết hơn về sản phẩm nào trong các mẫu trên không ạ?")
        return "\n".join(lines)

    # 4. Tư vấn chung với các sản phẩm liên quan tìm được
    if relevant_products:
        p_names = [f"**{p['name']}** ({float(p['base_price']):,.0f}đ)" for p in relevant_products]
        items_str = "\n- ".join(p_names)
        return (
            f"Dạ dựa trên nhu cầu của anh/chị, em xin tư vấn các thiết kế phù hợp nhất tại Vinh Store:\n\n"
            f"- {items_str}\n\n"
            "Tất cả sản phẩm đều được may đo tinh xảo từ chất liệu cao cấp tự nhiên, có đầy đủ size và màu sắc. "
            "Anh/chị có thể bấm vào thẻ sản phẩm bên dưới để xem chi tiết ảnh và đặt hàng ạ!"
        )

    # Mặc định giới thiệu cửa hàng
    return (
        "Dạ Vinh Store là thương hiệu thời trang cao cấp chuyên cung cấp các dòng sản phẩm: "
        "Áo Blazer Dạ Cashmere, Đầm Dạ Hội Lụa Satin, Áo Sơ Mi Lụa Cổ Cuba, Áo Khoác Măng Tô Dạ Cừu và Túi Xách Da Bò Thuộc Thảo Mộc.\n\n"
        "Anh/chị cần em hỗ trợ tư vấn kích cỡ, màu sắc hoặc gợi ý cách phối trang phục cho mục đích nào ạ?"
    )


def process_chat_message(message: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Hàm xử lý tin nhắn chat từ người dùng:
    1. Kiểm tra guardrails nghiêm ngặt (chỉ cho phép hỏi về sản phẩm Vinh Store).
    2. Truy vấn dữ liệu sản phẩm thực tế từ MySQL Database.
    3. Gửi prompt chuẩn hóa tới LLM (Gemini / OpenAI) hoặc bộ suy luận chuyên gia thời trang.
    4. Trả về câu trả lời và danh sách thẻ sản phẩm liên quan để hiển thị trực quan.
    """
    if history is None:
        history = []

    clean_msg = message.strip()
    if not clean_msg:
        return {
            "reply": "Dạ anh/chị hãy nhập câu hỏi về sản phẩm thời trang Vinh Store để em hỗ trợ nhé!",
            "products": []
        }

    # BƯỚC 1: KIỂM TRA BẢO VỆ (GUARDRAIL CHECK)
    if is_query_off_topic(clean_msg):
        return {
            "reply": STRICT_GUARDRAIL_MESSAGE,
            "products": []
        }

    # BƯỚC 2: TRUY VẤN DỮ LIỆU SẢN PHẨM THỰC TẾ TỪ DATABASE
    all_products = get_all_products_with_variants()
    if not all_products:
        return {
            "reply": "Dạ hiện tại hệ thống sản phẩm đang được cập nhật. Anh/chị vui lòng quay lại sau ít phút nhé!",
            "products": []
        }

    # Tìm các sản phẩm liên quan
    relevant_products = match_relevant_products(clean_msg, all_products, top_k=3)
    product_context = format_product_context(all_products)

    # BƯỚC 3: GỌI AI MODEL (GEMINI -> OPENAI -> FALLBACK ENGINE)
    reply_text = ""

    # Thử gọi Google Gemini nếu có key
    gemini_key = get_gemini_api_key()
    if gemini_key:
        try:
            reply_text = call_gemini_api(clean_msg, product_context, history)
        except Exception as ex:
            print(f"[AI Service] Gemini error: {ex}")

    # Nếu chưa có reply và có OpenAI key
    openai_key = get_openai_api_key()
    if not reply_text and openai_key:
        try:
            reply_text = call_openai_api(clean_msg, product_context, history)
        except Exception as ex:
            print(f"[AI Service] OpenAI error: {ex}")

    # Nếu vẫn chưa có reply (chưa cấu hình API key hoặc gọi mạng bị lỗi), sử dụng Rule-based expert fallback
    if not reply_text:
        reply_text = rule_based_fallback_advisor(clean_msg, all_products, relevant_products)

    return {
        "reply": reply_text,
        "products": relevant_products
    }
