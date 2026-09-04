import json

with open('/Users/tienluc/.gemini/antigravity-ide/scratch/math-assistant/update.json', 'r') as f:
    data = json.load(f)

# Update StudentsMenu.jsx
with open('/Users/tienluc/.gemini/antigravity-ide/scratch/math-assistant/src/pages/StudentsMenu.jsx', 'r') as f:
    content = f.read()

# Find the end of 'khac' array
# It ends with:
#       {
#         id: 'sheetpdf',
#         title: 'VÒNG QUAY HỌC TẬP',
#         path: `/students/view/external/${encodeURIComponent('https://sheetpdf.vercel.app/')}`,
#         isExternal: false
#       }
#     ]

marker = """      {
        id: 'sheetpdf',
        title: 'VÒNG QUAY HỌC TẬP',
        path: `/students/view/external/${encodeURIComponent('https://sheetpdf.vercel.app/')}`,
        isExternal: false
      }"""

new_content = content.replace(marker, marker + ",\n" + data['student'].rstrip(",\n"))

with open('/Users/tienluc/.gemini/antigravity-ide/scratch/math-assistant/src/pages/StudentsMenu.jsx', 'w') as f:
    f.write(new_content)

# Update GlobalSearch.jsx
with open('/Users/tienluc/.gemini/antigravity-ide/scratch/math-assistant/src/components/GlobalSearch.jsx', 'r') as f:
    content2 = f.read()

# It ends with:
#       { title: 'Vòng Quay Học Tập', path: `/students/view/external/${encodeURIComponent('https://sheetpdf.vercel.app/')}`, category: 'Tiện ích dạy học' }
#     );

marker2 = """      { title: 'Vòng Quay Học Tập', path: `/students/view/external/${encodeURIComponent('https://sheetpdf.vercel.app/')}`, category: 'Tiện ích dạy học' }"""

new_content2 = content2.replace(marker2, marker2 + ",\n" + data['global'].rstrip(",\n"))

with open('/Users/tienluc/.gemini/antigravity-ide/scratch/math-assistant/src/components/GlobalSearch.jsx', 'w') as f:
    f.write(new_content2)

print("Injected successfully!")
