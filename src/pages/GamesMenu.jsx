import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, ArrowLeft, Users, Mountain, Globe, Flag, HeartPulse, Castle, Hexagon, Snowflake, Sailboat, Car, Lock, Hammer, FlaskConical, Aperture, Rocket, Radar, Dices } from 'lucide-react';

const GamesMenu = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 'host',
      title: 'Tạo Trò Chơi (Giáo Viên)',
      icon: <Users className="w-8 h-8" />,
      color: 'from-emerald-500 to-teal-700',
      path: '/game/host'
    },
    {
      id: 'millionaire',
      title: 'Ai Là Triệu Phú',
      icon: <Trophy className="w-8 h-8" />,
      color: 'from-blue-600 to-indigo-600',
      path: '/game/trieu-phu'
    },
    {
      id: 'hunter',
      title: 'Thợ Săn Xác Suất',
      icon: <Target className="w-8 h-8" />,
      color: 'from-orange-500 to-red-500',
      path: '/game/tho-san'
    },
    {
      id: 'tugofwar',
      title: 'Kéo Co Kiến Thức',
      icon: <Users className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-700',
      path: '/game/keo-co'
    },
    {
      id: 'summit',
      title: 'Chinh Phục Đỉnh Cao',
      icon: <Mountain className="w-8 h-8" />,
      color: 'from-cyan-500 to-blue-600',
      path: '/game-nhung/chinh-phuc-dinh-cao'
    },
    {
      id: 'interstellar',
      title: 'Hành Tinh Xanh',
      icon: <Globe className="w-8 h-8" />,
      color: 'from-emerald-500 to-teal-600',
      path: '/game-nhung/hanh-tinh-xanh'
    },
    {
      id: 'race',
      title: 'Đường Đua Tri Thức',
      icon: <Flag className="w-8 h-8" />,
      color: 'from-yellow-500 to-orange-500',
      path: '/game-nhung/duong-dua-tri-thuc'
    },
    {
      id: 'rescue',
      title: 'Hành Trình Giải Cứu',
      icon: <HeartPulse className="w-8 h-8" />,
      color: 'from-rose-500 to-pink-600',
      path: '/game-nhung/hanh-trinh-giai-cuu'
    },
    {
      id: 'empire',
      title: 'Xây Dựng Đế Chế',
      icon: <Castle className="w-8 h-8" />,
      color: 'from-blue-700 to-slate-800',
      path: '/game-nhung/xay-dung-de-che'
    },
    {
      id: 'territory',
      title: 'Chiếm Lĩnh Lãnh Thổ',
      icon: <Hexagon className="w-8 h-8" />,
      color: 'from-indigo-500 to-blue-600',
      path: '/game-nhung/chiem-linh-lanh-tho'
    },
    {
      id: 'snowball',
      title: 'Đại Chiến Cầu Tuyết',
      icon: <Snowflake className="w-8 h-8" />,
      color: 'from-sky-400 to-cyan-600',
      path: '/game-nhung/dai-chien-cau-tuyet'
    },
    {
      id: 'boat',
      title: 'Đua Thuyền Tốc Độ',
      icon: <Sailboat className="w-8 h-8" />,
      color: 'from-blue-400 to-teal-500',
      path: '/game-nhung/dua-thuyen-toc-do'
    },
    {
      id: 'car',
      title: 'Đua Xe Tốc Độ',
      icon: <Car className="w-8 h-8" />,
      color: 'from-red-500 to-rose-700',
      path: '/game-nhung/dua-xe-toc-do'
    },
    {
      id: 'davinci',
      title: 'Mật Mã Da Vinci',
      icon: <Lock className="w-8 h-8" />,
      color: 'from-amber-500 to-orange-700',
      path: '/game-nhung/mat-ma-da-vinci'
    },
    {
      id: 'bridge',
      title: 'Xây Cầu Vượt Sông',
      icon: <Hammer className="w-8 h-8" />,
      color: 'from-stone-500 to-neutral-700',
      path: '/game-nhung/xay-cau-vuot-song'
    },
    {
      id: 'alchemy',
      title: 'Alchemy Lab',
      icon: <FlaskConical className="w-8 h-8" />,
      color: 'from-purple-500 to-fuchsia-700',
      path: '/game-nhung/alchemy-lab'
    },
    {
      id: 'bong-ro',
      title: 'Bóng Rổ AI',
      icon: <Aperture className="w-8 h-8" />,
      color: 'from-orange-500 to-red-600',
      path: '/game-nhung/bong-ro'
    },
    {
      id: 'space-defender',
      title: 'Space Defender',
      icon: <Rocket className="w-8 h-8" />,
      color: 'from-cyan-500 to-blue-600',
      path: '/game-nhung/space-defender'
    },
    {
      id: 'radar',
      title: 'Dò Mìn Không Gian',
      icon: <Radar className="w-8 h-8" />,
      color: 'from-emerald-500 to-green-700',
      path: '/game-nhung/radar-sweeper'
    },
    {
      id: 'co-ca-ngua',
      title: 'Cờ Cá Ngựa',
      icon: <Dices className="w-8 h-8" />,
      color: 'from-purple-500 to-fuchsia-700',
      path: '/game-nhung/co-ca-ngua'
    }
  ];

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
          Kho Trò Chơi
        </h1>
        <p className="text-gray-400 text-center mb-12 text-lg">
          Chọn một trò chơi để bắt đầu
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {games.map(game => (
            <div 
              key={game.id}
              onClick={() => navigate(game.path)}
              className="glass-card p-4 rounded-3xl flex flex-col items-center text-center cursor-pointer group hover:scale-[1.05] transition-all duration-300 border border-white/5 hover:border-blue-500/50 bg-black/20"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br ${game.color} text-white shadow-lg group-hover:shadow-xl`}>
                {game.icon}
              </div>
              <h3 className="text-sm font-bold text-gray-300 group-hover:text-blue-400 transition-colors leading-tight">
                {game.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamesMenu;
