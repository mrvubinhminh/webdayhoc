import re
import json

data = """
Đưa tài liệu vào. Nhận Markdown ra.
[https://vutienluc-docs.vercel.app/](https://vutienluc-docs.vercel.app/)
MD to EPUB Pro
[https://dichsach.vercel.app/](https://dichsach.vercel.app/)
Văn bản → Giọng nói tiếng Việt
[https://vanbanvaloinoi.vercel.app/](https://vanbanvaloinoi.vercel.app/)
Quét Google Drive và xuất danh sách ra Google Sheet hoặc Google Doc.
[https://script.google.com/macros/s/AKfycbzCosxbuJsYsVsyEm3YeqNcD0DzPMM8XU8x_SVuYFNSYTIjcMcmFhhGmQIvYYe1r3WSIA/exec](https://script.google.com/macros/s/AKfycbzCosxbuJsYsVsyEm3YeqNcD0DzPMM8XU8x_SVuYFNSYTIjcMcmFhhGmQIvYYe1r3WSIA/exec)
Tạo bản sao Google Sheets & thư mục Drive một cách dễ dàng
[https://script.google.com/macros/s/AKfycbwdGun2DI6zO305El_Tc5HnZdHRkY8Nv3xwKp-IwKjD3fi34CpghYsGquUzldMOpY6yIQ/exec](https://script.google.com/macros/s/AKfycbwdGun2DI6zO305El_Tc5HnZdHRkY8Nv3xwKp-IwKjD3fi34CpghYsGquUzldMOpY6yIQ/exec)
Bảng điểm
[https://bangdiem-delta.vercel.app/](https://bangdiem-delta.vercel.app/)
Quản lý html
[https://htmlmanager.vercel.app/](https://htmlmanager.vercel.app/)
Quản lý trung tâm
[https://binhminhvanhoa.vercel.app/](https://binhminhvanhoa.vercel.app/)
Markdown +Math → Word
[https://soangiangvbm.vercel.app/](https://soangiangvbm.vercel.app/)
Trợ Lý Tạo Prompt Soạn Slide Toán LaTeX
[https://latexbaigiang.vercel.app/](https://latexbaigiang.vercel.app/)
Trợ Lý AI Tự Động Soạn Giảng Toán LaTeX
[https://0tex.vercel.app/](https://0tex.vercel.app/)
Trình tạo Bài giảng Pro
[https://pptonline-self.vercel.app/](https://pptonline-self.vercel.app/)
Trình Tạo Prompt Sinh Đề K12Online
[https://k12allin1.vercel.app/](https://k12allin1.vercel.app/)
Ngân hàng câu hỏi Toán
[https://nganhangbaihoc.vercel.app/](https://nganhangbaihoc.vercel.app/)
Trình tạo Bài giảng Pro (Toán & Quiz & Ending)
[https://slide-lac.vercel.app/](https://slide-lac.vercel.app/)
Từ Điển Phím Tắt iMac
[https://phimtatimac.vercel.app/](https://phimtatimac.vercel.app/)
Cẩm Nang Tiện Ích Giáo Viên
[https://camnanggiaovien.vercel.app/](https://camnanggiaovien.vercel.app/)
"""

# Read existing file to extract existing URLs
with open('/Users/tienluc/.gemini/antigravity-ide/scratch/math-assistant/src/pages/StudentsMenu.jsx', 'r') as f:
    existing_content = f.read()
    
# Extract existing URLs using regex
existing_urls = set()
matches = re.findall(r'encodeURIComponent\(\'([^\']+)\'\)', existing_content)
for match in matches:
    existing_urls.add(match.rstrip('/'))

lines = [l.strip() for l in data.split('\n') if l.strip()]
items = []

i = 0
while i < len(lines):
    title = lines[i]
    if i + 1 < len(lines) and lines[i+1].startswith('['):
        url_line = lines[i+1]
        url = re.search(r'\[(.*?)\]', url_line).group(1)
        url_clean = url.rstrip('/')
        
        if url_clean not in existing_urls:
            existing_urls.add(url_clean)
            items.append({
                'title': title.upper(),
                'url': url
            })
        i += 2
    else:
        i += 1

# Generate StudentsMenu.jsx segment
student_menu = ""
for idx, item in enumerate(items):
    clean_id = re.sub(r'[^a-zA-Z0-9]', '', item['title'].lower()) + str(idx) + "_new"
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

with open('/Users/tienluc/.gemini/antigravity-ide/scratch/math-assistant/update_new.json', 'w') as f:
    import json
    json.dump({"student": student_menu, "global": global_search}, f)

print(f"Generated {len(items)} new items.")
