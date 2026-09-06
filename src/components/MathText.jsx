import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Component render toán học LaTeX
const MathText = ({ text }) => {
  const renderMath = (str) => {
    if (str === null || str === undefined || str === '') return null;
    const safeStr = String(str);
    
    // Tách các khối math bằng $$...$$ hoặc $...$
    const parts = safeStr.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
    return parts.map((part, i) => {
      let isDisplayMode = false;
      let math = null;

      if (part.startsWith('$$') && part.endsWith('$$')) {
        isDisplayMode = true;
        math = part.slice(2, -2);
      } else if (part.startsWith('$') && part.endsWith('$')) {
        math = part.slice(1, -1);
      }

      if (math !== null) {
        // Nếu trong công thức có \\ nhưng không có \begin{...} thì bọc bằng aligned để katex không lỗi
        if (math.includes('\\\\') && !math.includes('\\begin{')) {
            math = `\\begin{aligned} ${math} \\end{aligned}`;
        }
        try {
          return <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(math, { throwOnError: false, displayMode: isDisplayMode }) }} />;
        } catch (e) {
          return <span key={i}>{part}</span>;
        }
      }
      
      // Xử lý xuống dòng cho phần text (không phải toán)
      // Chỉ \newline hoặc \\newline mới xuống dòng, \\ không xuống dòng
      const textParts = part.split(/\\\\newline|\\newline/g);
      return (
        <span key={i}>
          {textParts.map((t, idx) => (
             <React.Fragment key={idx}>
               {t}
               {idx !== textParts.length - 1 && <br />}
             </React.Fragment>
          ))}
        </span>
      );
    });
  };
  return <div>{renderMath(text || '')}</div>;
};

export default MathText;
