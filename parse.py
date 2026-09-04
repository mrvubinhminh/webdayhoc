import re

data = """
CHuyển định dạng latex
[https://latextojson.vercel.app/](https://latextojson.vercel.app/)
Quản lý markdown
[https://quanlymd.vercel.app/](https://quanlymd.vercel.app/)
Tạo ID, Chuẩn hóa, Lọc File LaTeX, Nhập Excel, Kiểm duyệt đề và Lưu Google Sheets tự động.
[https://quanlymdid.vercel.app/](https://quanlymdid.vercel.app/)
markdown to word
[https://soangiangvbm.vercel.app/](https://soangiangvbm.vercel.app/)
Soạn latex
[https://0tex.vercel.app/](https://0tex.vercel.app/)
Tạo tài liệu latex
[https://soanthaolatexvtl.vercel.app/](https://soanthaolatexvtl.vercel.app/)
Tạo lệnh notebook
[https://notebookvtl.vercel.app/](https://notebookvtl.vercel.app/)
Toán 10-thư viện toanmath 41 tài liệu
[https://notebook.google.com/notebook/f64f21fe-8c99-4993-86f8-fb531c61c816](https://notebook.google.com/notebook/f64f21fe-8c99-4993-86f8-fb531c61c816)
Toán 9 -21 tài liệu
[https://notebook.google.com/notebook/066eed7c-9442-4573-9237-819dab4b8dd8](https://notebook.google.com/notebook/066eed7c-9442-4573-9237-819dab4b8dd8)
Chỉnh sửa pdf
[https://catgheppdf.vercel.app/](https://catgheppdf.vercel.app/)
Khen thưởng
[https://khenthuong-kappa.vercel.app/](https://khenthuong-kappa.vercel.app/)
Quản lý lớp học dojo
[https://dojovtl.vercel.app/](https://dojovtl.vercel.app/)
Anki
[https://hoccung-thayluc.vercel.app/](https://hoccung-thayluc.vercel.app/)
Quản lý markdown ID
[https://quanlymdid.vercel.app/](https://quanlymdid.vercel.app/)
Worksheet Gen - Đề Toán Học
[https://word-ai-psi.vercel.app/](https://word-ai-psi.vercel.app/)
Trình Đóng Gói SCORM 1.2 (Bản Chuyên Nghiệp)
[https://scormk12.vercel.app/](https://scormk12.vercel.app/)
Phím tắt imac
[https://phimtatimac.vercel.app/](https://phimtatimac.vercel.app/)
Trợ lý văn bản giáo dục
[https://notebook.google.com/notebook/ce2d3b36-3998-4c5a-9612-3283f18cf309](https://notebook.google.com/notebook/ce2d3b36-3998-4c5a-9612-3283f18cf309)
Quản lý nhận xét điểm học sinh
[https://bangdiem-delta.vercel.app/](https://bangdiem-delta.vercel.app/)
Ngân hàng câu hỏi
[https://nganhangbaihoc.vercel.app/](https://nganhangbaihoc.vercel.app/)
Soạn Giảng 4.0
[https://baigiangthaytienluc.vercel.app/](https://baigiangthaytienluc.vercel.app/)
AI TEACHER STUDIO
[https://k12onlineppt2026.vercel.app/](https://k12onlineppt2026.vercel.app/)
Báo Giảng THPT Nguyễn Hữu Cảnh
[https://lichbaogiang-ten.vercel.app/](https://lichbaogiang-ten.vercel.app/)
MathFlash Học công thức Toán học qua thẻ ghi nhớ
[https://khongcogitucodaucon.vercel.app/](https://khongcogitucodaucon.vercel.app/)
Công Cụ Tạo Trò Chơi Giáo Dục
[https://mathgamev1.vercel.app/](https://mathgamev1.vercel.app/)
Vòng quay học tập tích cực
[https://vongquaytoanhoc.vercel.app/](https://vongquaytoanhoc.vercel.app/)
Quizizz-kahoot
[https://quizizzvsk12.vercel.app/](https://quizizzvsk12.vercel.app/)
Bảng vẽ
[https://boardtienluc.vercel.app/](https://boardtienluc.vercel.app/)
Chuyển đáp án K12
[https://gemchuyendapank12.vercel.app/](https://gemchuyendapank12.vercel.app/)
Tạo slide ppt
[https://pptvtl.vercel.app/](https://pptvtl.vercel.app/)
Tạo formpt ảnh
[https://formptposter.vercel.app/](https://formptposter.vercel.app/)
Quản lý html
[https://htmlmanager.vercel.app/](https://htmlmanager.vercel.app/)
Lệnh notebook
[https://notebooklm-beta-tawny.vercel.app/](https://notebooklm-beta-tawny.vercel.app/)
Công Cụ Chuẩn Hóa Đề Toán k12
[https://chuanhoadetoan.vercel.app/](https://chuanhoadetoan.vercel.app/)
Tải ảnh sinh link
[https://taianh2026.vercel.app/](https://taianh2026.vercel.app/)
Bảng vẽ V1
[https://bang2026.vercel.app/](https://bang2026.vercel.app/)
Công Cụ Đổi Tên File Hàng Loạt
[https://dattenfile.vercel.app/](https://dattenfile.vercel.app/)
Tạo công thức toán
[https://congthuctoan.vercel.app/](https://congthuctoan.vercel.app/)
Tạo công thức toán V2
[https://incongthuc.vercel.app/](https://incongthuc.vercel.app/)
Vòng quay học tập
[https://sheetpdf.vercel.app/](https://sheetpdf.vercel.app/)
Ngân hàng câu hỏi
[https://nganhang-id.vercel.app/](https://nganhang-id.vercel.app/)
Lịch báo giảng
[https://lichbaogiang-ten.vercel.app/](https://lichbaogiang-ten.vercel.app/)
Trình chiếu
[https://motngaytuoidep.vercel.app/](https://motngaytuoidep.vercel.app/)
Soạn la tex
[https://latexcoban.vercel.app/](https://latexcoban.vercel.app/)
Xuất png tikz
[https://tikzvutienluc.vercel.app/](https://tikzvutienluc.vercel.app/)
Soạn latex v2
[https://textienluc.vercel.app/](https://textienluc.vercel.app/)
SOẠN LATEX
[https://latex26.vercel.app/](https://latex26.vercel.app/)
Tạo đề K12
[https://k12online.vercel.app/](https://k12online.vercel.app/)
TẠO SCOM
[https://k12scorm-3kj9.vercel.app/](https://k12scorm-3kj9.vercel.app/)
NGÂN HÀNG LUYỆN TẬP
[https://nganhangbaitap.vercel.app/](https://nganhangbaitap.vercel.app/)
HỆ SINH THÁI LATEX: SINH ĐỀ & TRỘN ĐỀ
[https://latex2026v1.vercel.app/](https://latex2026v1.vercel.app/)
TẠO NGÂN HÀNG CÂU HỎI
[https://nganhangbaihoc.vercel.app/](https://nganhangbaihoc.vercel.app/)
SOẠN BEAMMER LATEX
[https://latexbaigiang.vercel.app/](https://latexbaigiang.vercel.app/)
TIK SANG SVG ẢNH
[https://tikz2svg.com/](https://tikz2svg.com/)
SÔ TAY
[https://sotay24.vercel.app/](https://sotay24.vercel.app/)
TIỆN ÍCH TẢI NHẠC
[https://catbox.moe/#](https://catbox.moe/#)
THÔNG BÁO K12
[https://thongbaok-12.vercel.app/](https://thongbaok-12.vercel.app/)
Tạo nhận xét
[https://taonhanxet.vercel.app/](https://taonhanxet.vercel.app/)
Tạo nhận xét 2
[https://nhanxethocba-lime.vercel.app/](https://nhanxethocba-lime.vercel.app/)
md to word
[https://mdtoword-topaz.vercel.app/](https://mdtoword-topaz.vercel.app/)
Sổ họp
[https://sohopvtl.vercel.app/](https://sohopvtl.vercel.app/)
Mã nguồn avata
[https://www.dicebear.com/](https://www.dicebear.com/)
Chuyển đổi sang json
[https://jsonchuyendoi.vercel.app/](https://jsonchuyendoi.vercel.app/)
Anki 2027
[https://vutienlucstudy.vercel.app/](https://vutienlucstudy.vercel.app/)
PPCT
[https://soppct.vercel.app/](https://soppct.vercel.app/)
geo to ảnh png
[https://geocode-sigma.vercel.app/](https://geocode-sigma.vercel.app/)
Trình chiếu excel có bảng
[https://trinhchieuvtl.vercel.app/](https://trinhchieuvtl.vercel.app/)
Sinh và trộn đề latex
[https://latex2026v1.vercel.app/](https://latex2026v1.vercel.app/)
Tạo video
[https://cuonsachkidieu.vercel.app/](https://cuonsachkidieu.vercel.app/)
MÃ tikz sang geo
[https://tikztogeo.vercel.app/](https://tikztogeo.vercel.app/)
scrpit geo V1
[https://geovascript.vercel.app/](https://geovascript.vercel.app/)
scrpit geo V2
[https://taohinhdongvtl.vercel.app/](https://taohinhdongvtl.vercel.app/)
đổi tên file hàng loạt
[https://dattenfile.vercel.app/](https://dattenfile.vercel.app/)
Bài giảng k12 scom
[https://k12scorm-3kj9.vercel.app/](https://k12scorm-3kj9.vercel.app/)
"""

lines = [l.strip() for l in data.split('\n') if l.strip()]
items = []
existing_urls = set([
    'https://dojovtl.vercel.app',
    'https://bangdiem-delta.vercel.app',
    'https://phimtatimac.vercel.app/',
    'https://sheetpdf.vercel.app/'
])

i = 0
while i < len(lines):
    title = lines[i]
    url_line = lines[i+1]
    url = re.search(r'\[(.*?)\]', url_line).group(1)
    url_clean = url.rstrip('/')
    
    if url_clean not in [u.rstrip('/') for u in existing_urls]:
        existing_urls.add(url)
        items.append({
            'title': title.upper(),
            'url': url
        })
    i += 2

# Generate StudentsMenu.jsx segment
student_menu = ""
for idx, item in enumerate(items):
    clean_id = re.sub(r'[^a-zA-Z0-9]', '', item['title'].lower()) + str(idx)
    student_menu += f"""      {{
        id: '{clean_id}',
        title: '{item["title"]}',
        path: `/students/view/external/${{encodeURIComponent('{item["url"]}')}}`,
        isExternal: false
      }},
"""

# Generate GlobalSearch.jsx segment
global_search = ""
for item in items:
    global_search += f"      {{ title: '{item['title']}', path: `/students/view/external/${{encodeURIComponent('{item['url']}')}}`, category: 'Tiện ích dạy học' }},\n"

with open('/Users/tienluc/.gemini/antigravity-ide/scratch/math-assistant/update.json', 'w') as f:
    import json
    json.dump({"student": student_menu, "global": global_search}, f)

print(f"Generated {len(items)} new items.")
