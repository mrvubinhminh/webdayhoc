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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => (
          <Link 
            key={feature.id}
            to={feature.path}
            className="glass-card p-8 flex flex-col items-center justify-center text-center group min-h-[280px]"
          >
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border ${feature.iconBg} transition-transform group-hover:scale-110 duration-300`}>
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-400">
              {feature.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturesGrid;
