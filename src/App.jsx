import React from 'react';
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

const AppContent = () => {
  const location = useLocation();
  const isGameRoute = location.pathname.startsWith('/game/') || location.pathname.startsWith('/game-nhung/') || location.pathname.startsWith('/tool/') || location.pathname.startsWith('/models/view/') || location.pathname.startsWith('/tools/view/') || location.pathname.startsWith('/students/view/');

  return (
    <div className={`relative min-h-screen ${!isGameRoute ? 'pb-20' : ''}`}>
      {/* Background with simple grid pattern */}
      {!isGameRoute && (
        <>
          <div className="fixed inset-0 z-[-1] bg-[#0b0f19] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          {/* Top ambient glow */}
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-blue-500/20 rounded-[100%] blur-[120px] pointer-events-none z-[-1]"></div>

          <Header />
        </>
      )}
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<GamesMenu />} />
          <Route path="/models" element={<ModelsMenu />} />
          <Route path="/models/view/:grade/:id" element={<ModelIframeWrapper />} />
          <Route path="/tools" element={<ToolsMenu />} />
          <Route path="/tools/view/:grade/:id" element={<ToolIframeWrapper />} />
          <Route path="/students" element={<StudentsMenu />} />
          <Route path="/students/view/:grade/:id" element={<StudentIframeWrapper />} />
          <Route path="/game/trieu-phu" element={<MillionaireGame />} />
          <Route path="/game/tho-san" element={<ProbabilityHunter />} />
          <Route path="/game/keo-co" element={<TugOfWarGame />} />
          <Route path="/tool/vong-quay" element={<StudentSpinner />} />
          <Route path="/game-nhung/:gameId" element={<GameIframeWrapper />} />
      </Routes>
      
      {!isGameRoute && <Footer />}
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
