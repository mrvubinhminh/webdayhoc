import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const PrintQR = () => {
  const cards = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="bg-white min-h-screen font-sans text-black p-4">
      <div className="print-only">
        <style>
          {`
            @media print {
              @page { size: A4; margin: 0; }
              body { -webkit-print-color-adjust: exact; margin: 0; }
              .page-break { page-break-after: always; }
              .no-print { display: none; }
              .print-only { padding: 0; }
            }
          `}
        </style>
      </div>

      <div className="no-print max-w-2xl mx-auto mb-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r shadow">
        <h2 className="text-lg font-bold text-blue-800 mb-2">Hướng dẫn in thẻ Đáp Án QR</h2>
        <ul className="list-disc pl-5 text-blue-900 space-y-1">
          <li>Nhấn phím <strong>Ctrl + P</strong> (hoặc <strong>Cmd + P</strong> trên máy Mac) để mở hộp thoại in.</li>
          <li>Chọn khổ giấy <strong>A4</strong>.</li>
          <li>Đảm bảo tỷ lệ (Scale) là <strong>Mặc định (Default)</strong> hoặc <strong>Vừa vặn (Fit to page)</strong>.</li>
          <li>Cắt mỗi trang thành các thẻ vuông theo đường viền nét đứt.</li>
        </ul>
        <button 
          onClick={() => window.print()}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow transition"
        >
          🖨️ In ngay
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[210mm] mx-auto print:block print:max-w-none">
        {cards.map((num, index) => (
          <div 
            key={num} 
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-400 aspect-square relative ${index % 2 === 1 ? 'page-break' : ''} print:h-[148mm] print:w-[148mm] print:mx-auto print:border-gray-200`}
          >
            <div className="absolute top-4 font-black text-6xl text-gray-800">A</div>
            <div className="absolute right-6 font-black text-6xl text-gray-800 rotate-90">B</div>
            <div className="absolute bottom-4 font-black text-6xl text-gray-800 rotate-180">C</div>
            <div className="absolute left-6 font-black text-6xl text-gray-800 -rotate-90">D</div>
            
            <div className="absolute top-4 left-4 font-bold text-2xl bg-black text-white w-12 h-12 rounded-full flex items-center justify-center">
              {num}
            </div>
            
            <div className="absolute top-4 right-4 font-bold text-2xl bg-black text-white w-12 h-12 rounded-full flex items-center justify-center">
              {num}
            </div>

            <div className="absolute bottom-4 left-4 font-bold text-2xl bg-black text-white w-12 h-12 rounded-full flex items-center justify-center">
              {num}
            </div>

            <div className="absolute bottom-4 right-4 font-bold text-2xl bg-black text-white w-12 h-12 rounded-full flex items-center justify-center">
              {num}
            </div>

            <div className="border-8 border-black p-4 bg-white">
              <QRCodeSVG 
                value={`TEAM_${num}`} 
                size={250} 
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="mt-8 text-xl font-bold text-gray-600 text-center uppercase tracking-widest">
              Nhóm {num}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintQR;
