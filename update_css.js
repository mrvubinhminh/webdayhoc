import fs from 'fs';
import path from 'path';

const dir = 'public/games';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
    const filePath = path.join(dir, file);
    let text = fs.readFileSync(filePath, 'utf8');

    // 1. Alchemy Lab
    if (file === 'alchemy-lab.html') {
        text = text.replace(/.scroll-question \{[\s\S]*?\}/, 
            `.scroll-question { position: absolute; top: -20vh; left: 50%; transform: translateX(-50%); background: #fef3c7; border: 6px solid #78350f; padding: 25px 45px; border-radius: 4px; color: #451a03; box-shadow: 0 15px 40px rgba(0,0,0,0.6); width: 95vw; min-width: 95vw; max-width: 95vw; z-index: 50; font-family: 'Almendra', serif; display: flex; justify-content: center; align-items: center; min-height: 35vh; }`);
        text = text.replace(/.options-zone \{[\s\S]*?\}/, 
            `.options-zone { display: flex; gap: 1vw; z-index: 50; justify-content: space-between; align-items: flex-end; width: 98vw; padding-bottom: 2vh; }`);
        text = text.replace(/.ingredient-item \{[\s\S]*?\}/, 
            `.ingredient-item { display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: all 0.3s; width: 24%; max-width: 24%; }`);
        text = text.replace(/.answer-label \{[\s\S]*?\}/, 
            `.answer-label { background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(10px); padding: 15px; border-radius: 12px; font-weight: 800; color: #fbbf24; border: 2px solid #92400e; font-size: 2rem; text-align: center; width: 100%; display: flex; align-items: center; justify-content: center; min-height: 100px; box-shadow: 0 10px 20px rgba(0,0,0,0.6); transition: all 0.4s ease; }`);
        text = text.replace(/.cauldron-svg \{[\s\S]*?\}/, 
            `.cauldron-svg { width: 240px; height: 220px; filter: drop-shadow(0 0 30px rgba(168, 85, 247, 0.5)); transition: transform 0.2s ease; opacity: 0.2; } /* Dim background */`);
    }

    // 2. Bóng Rổ
    if (file === 'bong-ro.html') {
        text = text.replace(/.backboard-area \{[\s\S]*?\}/, 
            `.backboard-area { width: 95vw; max-width: 95vw; height: 40vh; background: rgba(255, 255, 255, 0.98); border: 6px solid #334155; border-radius: 12px; position: relative; margin-top: 8vh; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5); z-index: 50; }`);
        text = text.replace(/.options-zone \{[\s\S]*?\}/, 
            `.options-zone { display: flex; flex-wrap: nowrap; gap: 1vw; z-index: 50; justify-content: space-between; align-items: flex-end; width: 98vw; padding-bottom: 2vh; max-height: 45vh; }`);
        text = text.replace(/.ball-item \{[\s\S]*?\}/, 
            `.ball-item { display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s; width: 24%; max-width: 24%; }`);
        text = text.replace(/.answer-label \{[\s\S]*?\}/, 
            `.answer-label { background: #fff; padding: 15px; border-radius: 12px; font-weight: 800; margin-bottom: 10px; width: 100%; text-align: center; color: #1e293b; box-shadow: 0 4px 8px rgba(0,0,0,0.2); border: 3px solid #fb923c; font-size: 2rem; display: flex; align-items: center; justify-content: center; min-height: 100px; white-space: normal; word-break: break-word; line-height: 1.2; }`);
        text = text.replace(/.hoop-rim \{[\s\S]*?\}/, 
            `.hoop-rim { width: 120px; height: 20px; border: 5px solid #ef4444; border-radius: 50%; position: absolute; bottom: -10px; z-index: 20; opacity: 0.3; }`);
        text = text.replace(/.basket-net \{[\s\S]*?\}/, 
            `.basket-net { width: 100px; height: 100px; background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.4) 10px, rgba(255,255,255,0.4) 12px), repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.4) 10px, rgba(255,255,255,0.4) 12px); position: absolute; bottom: -100px; border-radius: 0 0 50px 50px; z-index: 5; opacity: 0.3; }`);
    }

    // 3. Space Defender
    if (file === 'space-defender.html') {
        text = text.replace(/.meteor \{[\s\S]*?\}/, 
            `.meteor { position: absolute; top: -300px; left: 50%; transform: translateX(-50%); width: 95vw; max-width: 95vw; height: 40vh; background: radial-gradient(circle at 30% 30%, rgba(71, 85, 105, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%); border: 5px solid #94a3b8; border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.2); z-index: 50; transition: top 15s linear; }`);
        text = text.replace(/.options-zone \{[\s\S]*?\}/, 
            `.options-zone { display: flex; gap: 1vw; z-index: 50; justify-content: space-between; align-items: flex-end; width: 98vw; padding: 0 1vw 2vh 1vw; background: linear-gradient(to top, rgba(2,6,23,0.95), transparent); }`);
        text = text.replace(/.option-item \{[\s\S]*?\}/, 
            `.option-item { display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s; width: 24%; max-width: 24%; }`);
        text = text.replace(/.answer-label \{[\s\S]*?\}/, 
            `.answer-label { background: rgba(15, 23, 42, 0.95); padding: 15px; border-radius: 8px; color: #38bdf8; border: 2px solid #38bdf8; font-size: 1.8rem; text-align: center; width: 100%; font-family: 'Orbitron', sans-serif; transition: all 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; min-height: 100px; }`);
    }

    // 4. Radar Sweeper
    if (file === 'radar-sweeper.html') {
        text = text.replace(/.hologram-panel \{[\s\S]*?\}/, 
            `.hologram-panel { position: relative; margin-top: 12vh; width: 95vw; max-width: 95vw; background: rgba(2, 6, 23, 0.85); border: 2px solid #0ea5e9; border-radius: 16px; padding: 30px; z-index: 50; box-shadow: 0 0 30px rgba(14, 165, 233, 0.5), inset 0 0 20px rgba(14, 165, 233, 0.3); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; min-height: 35vh; }`);
        text = text.replace(/.options-zone \{[\s\S]*?\}/, 
            `.options-zone { display: flex; gap: 1vw; z-index: 50; justify-content: space-between; align-items: flex-end; width: 98vw; padding-bottom: 2vh; }`);
        text = text.replace(/.target-node \{[\s\S]*?\}/, 
            `.target-node { background: rgba(2, 6, 23, 0.9); border: 2px solid #10b981; border-radius: 12px; padding: 15px 15px; width: 24%; max-width: 24%; display: flex; flex-direction: column; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 0 15px rgba(16, 185, 129, 0.5); transition: all 0.2s; position: relative; overflow: hidden; min-height: 120px; }`);
        text = text.replace(/.answer-label \{[\s\S]*?\}/, 
            `.answer-label { font-size: 2rem; font-weight: 700; color: #a7f3d0; text-align: center; line-height: 1.2; margin-top: 15px; transition: all 0.3s ease; width: 100%; display: flex; align-items: center; justify-content: center; }`);
    }

    // 5. Type E (2-team focus mode games)
    // For these, we will make .focus-mode text much larger and options take more height
    if (text.includes('focus-mode')) {
        // Increase question text size
        text = text.replace(/main\.focus-mode \.question-text \{ font-size: calc\([^)]*\); \}/g, 
            `main.focus-mode .question-text { font-size: calc(4cqh * var(--font-scale, 1)); }`);
        
        // Increase option text size
        text = text.replace(/main\.focus-mode \.btn-option \{ font-size: calc\([^)]*\); \}/g, 
            `main.focus-mode .btn-option { font-size: calc(3cqh * var(--font-scale, 1)); }`);
            
        // Expand the question box
        text = text.replace(/main\.focus-mode \.question-box \{[\s\S]*?\}/g, 
            `main.focus-mode .question-box { flex: 1.5; padding: 4cqh 3cqw; }`);
            
        // Expand options grid
        text = text.replace(/main\.focus-mode \.options-grid \{[\s\S]*?\}/g, 
            `main.focus-mode .options-grid { height: 50%; gap: 2cqh; }`);
            
        // Let's just append the CSS to guarantee it overrides
        if (!text.includes('/* ADDED BY UPDATE_CSS */')) {
            text = text.replace('</style>', `
        /* ADDED BY UPDATE_CSS */
        main.focus-mode .question-box { flex: 1.5; padding: 4cqh 3cqw; }
        main.focus-mode .question-text { font-size: calc(5cqh * var(--font-scale, 1)); }
        main.focus-mode .options-grid { height: 55%; gap: 2.5cqh; }
        main.focus-mode .btn-option { font-size: calc(3.5cqh * var(--font-scale, 1)); padding: 2cqh; }
        </style>`);
        }
    }

    fs.writeFileSync(filePath, text);
    console.log("Updated CSS for", filePath);
}

