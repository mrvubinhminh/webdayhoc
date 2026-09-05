import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import MillionaireGame from './pages/MillionaireGame';
import ProbabilityHunter from './pages/ProbabilityHunter';
import GamesMenu from './pages/GamesMenu';
import TugOfWarGame from './pages/TugOfWarGame';
import StudentSpinner from './pages/StudentSpinner';
import GameIframeWrapper from './pages/GameIframeWrapper';
import ModelsMenu from './pages/ModelsMenu';
import ModelIframeWrapper from './pages/ModelIframeWrapper';
import ToolsMenu from './pages/ToolsMenu';
import ToolIframeWrapper from './pages/ToolIframeWrapper';
import StudentsMenu from './pages/StudentsMenu';
import StudentIframeWrapper from './pages/StudentIframeWrapper';
import Sunflowers from './components/Sunflowers';
import LoginScreen from './components/LoginScreen';
import GameHost from './pages/GameHost';
import GamePlayer from './pages/GamePlayer';

const EXPECTED_HASH = "ebe106819f36f460184a887c06e18115a19f5d15ce570f9a2318c6f44b78476a";

const AppContent = () => {
  const location = useLocation();
  const isGameRoute = location.pathname.startsWith('/game/') || location.pathname.startsWith('/play') || location.pathname.startsWith('/game-nhung/') || location.pathname.startsWith('/tool/') || location.pathname.startsWith('/models/view/') || location.pathname.startsWith('/tools/view/') || location.pathname.startsWith('/students/view/');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // Các route yêu cầu đăng nhập (ngoài trang chủ và trò chơi)
  const isProtectedRoute = location.pathname.startsWith('/models') || location.pathname.startsWith('/tools') || location.pathname.startsWith('/students');

  useEffect(() => {
    const storedHash = localStorage.getItem('math_assistant_auth');
    if (storedHash === EXPECTED_HASH) {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  // Reset showLogin khi navigate sang route không cần auth
  useEffect(() => {
    if (!isProtectedRoute) setShowLogin(false);
  }, [location.pathname, isProtectedRoute]);

  if (isCheckingAuth) {
    return null;
  }

  // Nếu vào route cần đăng nhập mà chưa đăng nhập → hiện màn hình login
  if (isProtectedRoute && !isAuthenticated) {
    return (
      <div className="relative min-h-screen pb-20">
        <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-[#0c4a6e] via-[#083344] to-[#020617] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-blue-400/30 rounded-[100%] blur-[120px] pointer-events-none z-[-1]"></div>
        <Sunflowers />
        <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen ${!isGameRoute ? 'pb-20' : ''}`}>
      {!isGameRoute && (
        <>
          <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-[#0c4a6e] via-[#083344] to-[#020617] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-blue-400/30 rounded-[100%] blur-[120px] pointer-events-none z-[-1]"></div>
          <Sunflowers />
        </>
      )}

      <>
        {!isGameRoute && <Header />}
        
        <Routes>
          {/* Route công khai - không cần đăng nhập */}
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<GamesMenu />} />
          <Route path="/game/host" element={<GameHost />} />
          <Route path="/play" element={<GamePlayer />} />
          <Route path="/game/trieu-phu" element={<MillionaireGame />} />
          <Route path="/game/tho-san" element={<ProbabilityHunter />} />
          <Route path="/game/keo-co" element={<TugOfWarGame />} />
          <Route path="/tool/vong-quay" element={<StudentSpinner />} />
          <Route path="/game-nhung/:gameId" element={<GameIframeWrapper />} />

          {/* Route cần đăng nhập */}
          <Route path="/models" element={isAuthenticated ? <ModelsMenu /> : <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="/models/view/:grade/:id" element={isAuthenticated ? <ModelIframeWrapper /> : <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="/tools" element={isAuthenticated ? <ToolsMenu /> : <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="/tools/view/:grade/:id" element={isAuthenticated ? <ToolIframeWrapper /> : <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="/students" element={isAuthenticated ? <StudentsMenu /> : <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="/students/view/:grade/:id" element={isAuthenticated ? <StudentIframeWrapper /> : <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />} />
        </Routes>
        
        {!isGameRoute && <Footer />}
      </>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
