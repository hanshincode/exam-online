import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../App';
import { User, Lock, ArrowRight, ShieldCheck, Eye, EyeOff, Sun, Moon } from 'lucide-react';

export default function StudentLogin() {
  const { loginUser, gasUrl, theme, toggleTheme } = useApp();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'danger', isExiting: false });
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [pendingLogin, setPendingLogin] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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
      showToast('Hệ thống chưa được cấu hình URL kết nối! Vui lòng liên hệ giáo viên.', 'danger');
      return;
    }

    if (!username || !password) {
      showToast('Vui lòng điền đầy đủ tài khoản và mật khẩu!', 'danger');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'student_login',
          username: username,
          password: password
        })
      });

      const data = await response.json();
      if (data.success) {
        if (data.requirePasswordChange) {
          setPendingLogin({
            user: { username: data.username, name: data.name, class: data.class, role: 'student' },
            token: data.token,
            rememberMe: rememberMe
          });
          setShowChangePassword(true);
        } else {
          setLoginSuccess(true);
          setTimeout(() => {
            loginUser(
              { username: data.username, name: data.name, class: data.class, role: 'student' },
              data.token,
              gasUrl,
              rememberMe
            );
            navigate('/student/dashboard');
          }, 1200);
        }
      } else {
        showToast(data.message || 'Sai tài khoản hoặc mật khẩu!', 'danger');
      }
    } catch (err) {
      showToast('Kết nối tới hệ thống thi thất bại! Vui lòng kiểm tra lại mạng.', 'danger');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showToast('Vui lòng nhập đầy đủ mật khẩu mới!', 'danger');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải từ 6 ký tự trở lên!', 'danger');
      return;
    }
    if (newPassword === 'examonline123') {
      showToast('Không được sử dụng lại mật khẩu mặc định!', 'danger');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Xác nhận mật khẩu mới không trùng khớp!', 'danger');
      return;
    }

    setChangePasswordLoading(true);
    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'update_student_password',
          username: pendingLogin.user.username,
          new_password: newPassword
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowChangePassword(false);
        setLoginSuccess(true);
        setTimeout(() => {
          loginUser(
            pendingLogin.user,
            pendingLogin.token,
            gasUrl,
            pendingLogin.rememberMe
          );
          navigate('/student/dashboard');
        }, 1200);
      } else {
        showToast(data.message || 'Đổi mật khẩu thất bại!', 'danger');
      }
    } catch (err) {
      showToast('Lỗi kết nối tới hệ thống! Vui lòng kiểm tra lại mạng.', 'danger');
      console.error(err);
    } finally {
      setChangePasswordLoading(false);
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
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>THI TRỰC TUYẾN</h2>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Đăng nhập tài khoản học sinh làm bài thi
          </p>
        </div>



        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label><User size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Tài Khoản Học Sinh</label>
            <input
              type="text"
              placeholder="Nhập tài khoản học sinh"
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
                placeholder="Nhập mật khẩu"
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
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : (
              <>
                Đăng Nhập <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <p style={{ color: 'var(--secondary)' }}>
            Bạn là giáo viên?{' '}
            <Link to="/teacher/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Trang cho Quản trị
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
                Đang chuẩn bị vào phòng thi học sinh...
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

      {/* Change Default Password Overlay Form */}
      {showChangePassword && pendingLogin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="card animate-scale-in" style={{
            width: '100%',
            maxWidth: '420px',
            padding: '2.5rem 2rem',
            textAlign: 'left',
            color: theme === 'light' ? '#1e293b' : '#f1f5f9',
            backgroundColor: 'var(--bg-card)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Lock size={28} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>THAY ĐỔI MẬT KHẨU MỚI</h3>
              <p style={{ color: 'var(--secondary)', fontSize: '0.825rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Tài khoản của bạn đang sử dụng mật khẩu mặc định hoặc vừa được reset. Vui lòng đổi mật khẩu để bảo mật trước khi tiếp tục.
              </p>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Mật Khẩu Mới</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={changePasswordLoading}
                    style={{ paddingRight: '2.5rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
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
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Xác Nhận Mật Khẩu Mới</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={changePasswordLoading}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', marginTop: '0.5rem' }}
                disabled={changePasswordLoading}
              >
                {changePasswordLoading ? 'Đang cập nhật...' : 'Cập Nhật & Đăng Nhập'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: '100%', padding: '0.6rem' }}
                onClick={() => {
                  setShowChangePassword(false);
                  setPendingLogin(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                disabled={changePasswordLoading}
              >
                Hủy Đăng Nhập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
