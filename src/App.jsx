import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import StudentLogin from './pages/StudentLogin';
import TeacherLogin from './pages/TeacherLogin';
import StudentDashboard from './pages/StudentDashboard';
import ExamRoom from './pages/ExamRoom';
import TeacherDashboard from './pages/TeacherDashboard';

// Tạo Context cho Auth và Cấu hình Server
const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export default function App() {
  const [user, setUser] = useState(() => {
    const savedLocal = localStorage.getItem('exam_user');
    if (savedLocal) return JSON.parse(savedLocal);
    const savedSession = sessionStorage.getItem('exam_user');
    if (savedSession) return JSON.parse(savedSession);
    return null;
  });

  const [gasUrl, setGasUrl] = useState(() => {
    return localStorage.getItem('exam_gas_url') || import.meta.env.VITE_GAS_URL || '';
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('exam_token') || sessionStorage.getItem('exam_token') || '';
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('exam_theme') || 'light';
  });

  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Đồng bộ theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('exam_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    localStorage.setItem('exam_gas_url', gasUrl);
  }, [gasUrl]);

  const loginUser = (userData, userToken, serverUrl, rememberMe = false) => {
    setUser(userData);
    setToken(userToken);
    if (serverUrl) setGasUrl(serverUrl);
    
    if (rememberMe) {
      localStorage.setItem('exam_user', JSON.stringify(userData));
      localStorage.setItem('exam_token', userToken);
    } else {
      sessionStorage.setItem('exam_user', JSON.stringify(userData));
      sessionStorage.setItem('exam_token', userToken);
    }
  };

  const logoutUser = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('exam_user');
    localStorage.removeItem('exam_token');
    sessionStorage.removeItem('exam_user');
    sessionStorage.removeItem('exam_token');
  };

  return (
    <AppContext.Provider value={{ user, token, gasUrl, setGasUrl, loginUser, logoutUser, theme, toggleTheme }}>
      {showSplash && <IntroSplash onFinish={handleSplashFinish} />}
      <BrowserRouter>
        <Routes>
          {/* Trang chủ cổng kết nối */}
          <Route path="/" element={<Home />} />
          
          {/* Auths */}
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/teacher/login" element={<TeacherLogin />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/student/exam/:examCode" element={
            <ProtectedRoute allowedRole="student">
              <ExamRoom />
            </ProtectedRoute>
          } />

          {/* Teacher Routes */}
          <Route path="/teacher/dashboard" element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

// Protected Route component ngoài App
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useApp();
  if (!user) {
    return <Navigate to={allowedRole === 'teacher' ? '/teacher/login' : '/student/login'} replace />;
  }
  if (user.role !== allowedRole) {
    return <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} replace />;
  }
  return children;
};

// Component Splash Screen giới thiệu hệ thống khi mới vào trang
function IntroSplash({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const duration = 1200; // 1.2s
    const intervalTime = 20;
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setFade(true), 150);
          setTimeout(onFinish, 550);
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'opacity 0.4s ease',
      opacity: fade ? 0 : 1,
      color: '#ffffff'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        transform: fade ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.4s ease',
      }}>
        <img
          src="/logo-exam.png"
          alt="Logo"
          style={{
            width: '90px',
            height: '90px',
            animation: 'pulseScaleSplash 2s infinite ease-in-out',
            filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))'
          }}
        />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            margin: 0,
            background: 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            EXAM ONLINE
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.25rem', display: 'block' }}>
            Nền Tảng Thi Thông Minh
          </span>
        </div>

        {/* Thanh tiến trình tải */}
        <div style={{
          width: '180px',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: '1rem'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
            transition: 'width 0.02s linear',
            borderRadius: '2px'
          }} />
        </div>
      </div>

      <style>{`
        @keyframes pulseScaleSplash {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
