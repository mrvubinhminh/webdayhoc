import re
import sys

def extract():
    with open('/Users/tienluc/.gemini/antigravity-ide/brain/b765c8dc-2858-4dd4-bda4-d3328218ad3b/.system_generated/logs/transcript_full.jsonl', 'r') as f:
        content = f.read()
    
    # Find the last USER_INPUT containing the DOCTYPEs
    user_inputs = [line for line in content.split('\n') if '"type":"USER_INPUT"' in line]
    last_input = user_inputs[-1] if user_inputs else ""
    
    # Extract blocks of HTML
    html_blocks = re.findall(r'(<!DOCTYPE html>.*?</html>)', last_input, re.DOTALL | re.IGNORECASE)
    
    for i, html in enumerate(html_blocks):
        title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
        title = title_match.group(1).strip() if title_match else f"game_{i}"
        
        # map title to filename
        filename = "game.html"
        if "Alchemy" in title: filename = "alchemy-lab.html"
        elif "Bóng Rổ" in title: filename = "bong-ro-toan-hoc.html"
        elif "Space" in title: filename = "space-defender.html"
        elif "Radar" in title: filename = "radar-sweeper.html"
        elif "Xây Cầu" in title: filename = "xay-cau-vuot-song.html"
        else: filename = f"game_{i}.html"
        
        # Write to public/games/
        # Decode json escapes if necessary (transcript is jsonl)
        # Wait, using re on raw JSON string might be tricky due to \n being \\n.
        # It's better to parse the JSON.
        pass

import json
def extract_json():
    with open('/Users/tienluc/.gemini/antigravity-ide/brain/b765c8dc-2858-4dd4-bda4-d3328218ad3b/.system_generated/logs/transcript_full.jsonl', 'r') as f:
        lines = f.readlines()
    
    user_inputs = [json.loads(line) for line in lines if '"type":"USER_INPUT"' in line]
    last_input = user_inputs[-1]['content']
    
    html_blocks = re.findall(r'(<!DOCTYPE html>.*?</html>)', last_input, re.DOTALL | re.IGNORECASE)
    for i, html in enumerate(html_blocks):
        title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
        title = title_match.group(1).strip() if title_match else f"game_{i}"
        
        filename = "game.html"
        if "Alchemy" in title: filename = "alchemy-lab.html"
        elif "Bóng Rổ" in title: filename = "bong-ro-toan-hoc.html"
        elif "Space" in title: filename = "space-defender.html"
        elif "Radar" in title: filename = "radar-sweeper.html"
        elif "Xây Cầu" in title: filename = "xay-cau-vuot-song.html"
        else: filename = f"game_{i}.html"
        
        path = f"public/games/{filename}"
        with open(path, 'w') as out:
            out.write(html)
        print(f"Saved {path} - {title}")

extract_json()
