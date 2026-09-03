import React from 'react';
import { Calculator, Gamepad2, Box, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeaturesGrid = () => {
  const features = [
    {
      id: 'tool',
      title: 'Trợ lý Thao tác',
      description: 'Công cụ tính toán, vẽ đồ thị, phương trình',
      icon: <Calculator className="w-8 h-8" />,
      color: 'from-blue-500 to-blue-700',
      iconBg: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      path: '/tools'
    },
    {
      id: 'game',
      title: 'Trò chơi Dạy học',
      description: 'Mini game tương tác củng cố bài giảng',
      icon: <Gamepad2 className="w-8 h-8" />,
      color: 'from-purple-500 to-purple-700',
      iconBg: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
      path: '/games'
    },
    {
      id: '3d',
      title: 'Mô hình dạy học',
      description: 'Mô phỏng 3D, bài toán thực tế',
      icon: <Box className="w-8 h-8" />,
      color: 'from-emerald-500 to-emerald-700',
      iconBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      path: '/models'
    },
    {
      id: 'student',
      title: 'Chọn học sinh',
      description: 'Vòng quay may mắn, gọi tên ngẫu nhiên',
      icon: <Target className="w-8 h-8" />,
      color: 'from-red-500 to-orange-500',
      iconBg: 'bg-red-500/10 text-red-500 border-red-500/30',
      path: '/tool/vong-quay'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <Link 
            key={feature.id}
            to={feature.path}
            className="glass-card p-6 sm:p-8 flex items-center gap-6 group hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all duration-500 relative overflow-hidden"
          >
            {/* Background glow on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
            
            <div className={`w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl flex items-center justify-center border ${feature.iconBg} bg-white/5 backdrop-blur-md shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 z-10`}>
              {feature.icon}
            </div>
            
            <div className="z-10 flex-1 pr-8">
              <h3 className={`text-xl sm:text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r ${feature.color} brightness-110 group-hover:brightness-150 transition-all duration-300`}>
                {feature.title}
              </h3>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                {feature.description}
              </p>
            </div>
            
            <div className="absolute right-6 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500 text-white/40 group-hover:text-white/80">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturesGrid;
