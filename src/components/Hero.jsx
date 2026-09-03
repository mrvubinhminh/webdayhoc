import React from 'react';
import { Eye, Flame } from 'lucide-react';

const Hero = () => {
  return (
    <div className="pt-32 pb-16 px-4 text-center">
      <p className="text-blue-400 italic mb-8 max-w-3xl mx-auto text-sm sm:text-base">
        "Đoàn kết – Tâm huyết – Gương mẫu tự học – Đổi mới sáng tạo, cùng kiến tạo những giờ Toán truyền cảm hứng cho học sinh Hưng Yên."
      </p>
      
      <h2 className="text-5xl sm:text-6xl font-extrabold text-white mb-8 tracking-tight">
        Không gian <span className="text-gradient">Sáng tạo</span>
      </h2>
      
      <div className="flex items-center justify-center gap-4 text-sm sm:text-base">
        <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-full border-green-500/30 text-green-400">
          <Eye className="w-4 h-4" />
          <span className="font-semibold">829</span>
        </div>
        
        <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-full border-orange-500/30 text-orange-400">
          <Flame className="w-4 h-4" />
          <span className="text-gray-300">Toán 10. Các phép toán với các tập con của R</span>
          <span className="font-semibold ml-1">66</span>
        </div>
      </div>
    </div>
  );
};

export default Hero;
