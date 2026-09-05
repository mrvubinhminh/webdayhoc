import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, Cuboid, Cylinder, Layers, Pyramid, LayoutGrid, CheckSquare } from 'lucide-react';

const ModelsMenu = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('10');

  // Discover all HTML files in public/models
  const files = import.meta.glob('/public/models/**/*.html', { query: '?url' });
  const modelPaths = Object.keys(files);

  const parsedModels = modelPaths.map(path => {
    const match = path.match(/\/public\/models\/(\d+)\/(.+)\.html$/);
    if (!match) return null;
    
    const titleMatch = match[2].match(/^(\d+)[.\-_]?\s*(.*)/);
    const order = titleMatch ? parseInt(titleMatch[1], 10) : 9999;
    
    return {
      grade: match[1],
      id: match[2],
      title: match[2].replace(/-/g, ' ').toUpperCase(),
      order: order,
      path: `/models/view/${match[1]}/${encodeURIComponent(match[2])}`
    };
  }).filter(Boolean).sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  });

  const modelsByGrade = {
    '10': parsedModels.filter(m => m.grade === '10'),
    '11': parsedModels.filter(m => m.grade === '11'),
    '12': parsedModels.filter(m => m.grade === '12'),
  };

  const icons = [Box, Cuboid, Cylinder, Layers, Pyramid, LayoutGrid, CheckSquare];
  
  const getIcon = (idx) => {
    const IconComponent = icons[idx % icons.length];
    return <IconComponent className="w-8 h-8" />;
  };

  const currentModels = modelsByGrade[activeTab] || [];

  return (
    <div className="min-h-screen pt-24 px-4 pb-20 flex flex-col items-center">
      <div className="w-full max-w-7xl">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors font-bold"
        >
          <ArrowLeft className="w-5 h-5" /> Quay lại trang chủ
        </button>

        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4 uppercase tracking-wider">
          Kho Mô Hình Dạy Học
        </h1>
        <p className="text-gray-400 text-center mb-8 text-lg">
          Chọn lớp học để xem các mô hình tương ứng
        </p>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-12">
          {['10', '11', '12'].map(grade => (
            <button
              key={grade}
              onClick={() => setActiveTab(grade)}
              className={`px-8 py-3 rounded-xl font-bold text-lg transition-all ${
                activeTab === grade 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Lớp {grade}
            </button>
          ))}
        </div>

        {/* Models Grid */}
        {currentModels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full max-w-6xl mx-auto">
            {currentModels.map((model, idx) => (
              <div 
                key={model.id}
                onClick={() => navigate(model.path)}
                className="glass-card p-3 rounded-xl flex flex-row items-center gap-4 cursor-pointer group hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 border border-emerald-500/10 hover:border-emerald-500/50 bg-slate-900/60"
              >
                <div className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md group-hover:scale-110 transition-transform`}>
                  {getIcon(idx)}
                </div>
                <h3 className="text-sm font-semibold text-gray-300 group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2 text-left flex-1">
                  {model.title}
                </h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 border border-slate-800 rounded-3xl border-dashed">
            <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl font-bold mb-2">Chưa có mô hình nào</p>
            <p>Vui lòng copy file HTML vào thư mục <code>public/models/{activeTab}/</code></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelsMenu;
