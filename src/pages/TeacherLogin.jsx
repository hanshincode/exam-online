import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../App';
import { ShieldCheck, User, Lock, ArrowRight, Eye, EyeOff, Sun, Moon } from 'lucide-react';

export default function TeacherLogin() {
  const { loginUser, gasUrl, theme, toggleTheme } = useApp();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'danger', isExiting: false });
  const [loginSuccess, setLoginSuccess] = useState(false);

  const triggerClose = () => {
    setToast(prev => ({ ...prev, isExiting: true }));
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'danger', isExiting: false });
    }, 250);
  };

  const showToast = (msg, type = 'danger') => {
    setToast({ show: true, message: msg, type: type, isExiting: false });
  };

  useEffect(() => {
    if (toast.show && !toast.isExiting) {
      const timer = setTimeout(() => {
        triggerClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, toast.isExiting]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!gasUrl) {
      showToast('Hệ thống chưa được cấu hình URL kết nối! Vui lòng liên hệ quản trị.', 'danger');
      return;
    }

    if (!username || !password) {
      showToast('Vui lòng nhập đầy đủ tài khoản và mật khẩu!', 'danger');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'teacher_login',
          username: username,
          password: password
        })
      });

      const data = await response.json();
      if (data.success) {
        setLoginSuccess(true);
        setTimeout(() => {
          loginUser(
            { username: data.username, name: data.name, role: 'teacher' },
            data.token,
            gasUrl,
            rememberMe
          );
          navigate('/teacher/dashboard');
        }, 1200);
      } else {
        showToast(data.message || 'Tài khoản hoặc mật khẩu giáo viên không đúng!', 'danger');
      }
    } catch (err) {
      showToast('Kết nối tới hệ thống máy chủ thất bại! Vui lòng kiểm tra lại mạng.', 'danger');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition" style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme === 'light' ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
      padding: '1.5rem',
      position: 'relative',
      transition: 'background 0.3s ease'
    }}>
      {/* Nút chuyển chế độ Sáng/Tối */}
      <button
        type="button"
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: 'calc(15px + env(safe-area-inset-top, 10px))',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          zIndex: 100
        }}
        title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img
            src="/logo-exam.png"
            alt="Logo EXAM"
            style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '1rem' }}
          />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>QUẢN TRỊ VIÊN</h2>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Đăng nhập hệ thống quản lý đề thi và giám sát
          </p>
        </div>



        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label><User size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Tài Khoản Giáo Viên</label>
            <input
              type="text"
              placeholder="Nhập tên đăng nhập giáo viên"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label><Lock size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Mật Khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu giáo viên"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{ paddingRight: '2.5rem' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--secondary)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label htmlFor="rememberMe" style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--secondary)' }}>Ghi nhớ đăng nhập</label>
          </div>

          <button
            type="submit"
            className="btn btn-success"
            style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Đang xác thực...' : (
              <>
                Đăng Nhập Quản Trị <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <p style={{ color: 'var(--secondary)' }}>
            Bạn là học sinh?{' '}
            <Link to="/student/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Trang thi học sinh
            </Link>
          </p>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type} ${toast.isExiting ? 'toast-exit' : ''}`}>
            <span className="toast-content">{toast.message}</span>
            <button className="toast-close" onClick={triggerClose}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Success Login Transition Overlay */}
      {loginSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          animation: 'fadeInSplash 0.3s ease forwards'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            animation: 'scaleUpSplash 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}>
            {/* Vòng tròn tick xanh lá rực rỡ */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '3px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
              animation: 'pulseGreenSplash 1.5s infinite'
            }}>
              <ShieldCheck size={40} color="#10b981" />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#10b981' }}>
                XÁC THỰC THÀNH CÔNG!
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                Đang chuẩn bị vào bảng quản trị giáo viên...
              </p>
            </div>
          </div>

          <style>{`
            @keyframes fadeInSplash {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleUpSplash {
              from { transform: scale(0.9) translateY(10px); opacity: 0; }
              to { transform: scale(1) translateY(0); opacity: 1; }
            }
            @keyframes pulseGreenSplash {
              0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(16, 185, 129, 0.4); }
              50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(16, 185, 129, 0.6); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
