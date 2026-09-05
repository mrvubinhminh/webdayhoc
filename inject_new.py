import json

with open('/Users/tienluc/.gemini/antigravity-ide/scratch/math-assistant/update_new.json', 'r') as f:
    data = json.load(f)

# Update StudentsMenu.jsx
with open('/Users/tienluc/.gemini/antigravity-ide/scratch/math-assistant/src/pages/StudentsMenu.jsx', 'r') as f:
    content = f.read()

# We need to find the last item in the 'khac' array.
# Because the array could end with any of the previous 64 items, we just look for the end of the array `    ]\n  };`
# But wait, earlier we added `dojovtl` etc.
# A safer way is to replace `    ]\n  };` with `,` + new_items + `\n    ]\n  };`

marker = "    ]\n  };"
# Need to make sure there's a comma after the last item. We can just replace the marker with the new items appended.
# Actually, the last item doesn't have a comma.
# Let's use regex to find the end of the khac array.
import re
new_content = re.sub(r'(\s+)\]\s*\n\s*};\s*$', r',\n' + data['student'].rstrip(",\n") + r'\1]\n  };', content)

with open('/Users/tienluc/.gemini/antigravity-ide/scratch/math-assistant/src/pages/StudentsMenu.jsx', 'w') as f:
    f.write(new_content)

# Update GlobalSearch.jsx
with open('/Users/tienluc/.gemini/antigravity-ide/scratch/math-assistant/src/components/GlobalSearch.jsx', 'r') as f:
    content2 = f.read()

# It ends with:
#     );
# 
#     // 2. Dynamic items from public folder

marker2 = "    );\n\n    // 2. Dynamic items from public folder"
# We need to insert before `    );`
# Actually, we can use regex to replace `\s*\);\s*// 2. Dynamic items`
new_content2 = re.sub(r'(\s+)\);\s*\n\s*// 2\. Dynamic items', r',\n' + data['global'].rstrip(",\n") + r'\1);\n\n    // 2. Dynamic items', content2)

with open('/Users/tienluc/.gemini/antigravity-ide/scratch/math-assistant/src/components/GlobalSearch.jsx', 'w') as f:
    f.write(new_content2)

print("Injected successfully!")
