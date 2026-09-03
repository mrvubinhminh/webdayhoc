import fs from 'fs';
import path from 'path';

let menuPath = 'src/pages/GamesMenu.jsx';
let text = fs.readFileSync(menuPath, 'utf8');

if (!text.includes('Cờ Cá Ngựa')) {
    text = text.replace(
        /\{ id: 'chinh-phuc-dinh-cao'[^}]+\},/,
        `$&
  { id: 'co-ca-ngua', title: 'Cờ Cá Ngựa', desc: 'Đấu Trường Đạo Hàm', players: 4, cover: '/images/games/co-ca-ngua.png' },`
    );
    fs.writeFileSync(menuPath, text);
    console.log("Updated GamesMenu.jsx");
}

let iframePath = 'src/pages/GameIframeWrapper.jsx';
let iframeText = fs.readFileSync(iframePath, 'utf8');

if (!iframeText.includes('co-ca-ngua')) {
    iframeText = iframeText.replace(
        /'chinh-phuc-dinh-cao': '\/games\/chinh-phuc-dinh-cao.html',/,
        `$&
    'co-ca-ngua': '/games/co-ca-ngua.html',`
    );
    fs.writeFileSync(iframePath, iframeText);
    console.log("Updated GameIframeWrapper.jsx");
}

