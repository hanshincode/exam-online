import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { GraduationCap, ShieldCheck, Sun, Moon, ArrowRight, BookOpen } from 'lucide-react';

export default function Home() {
  const { theme, toggleTheme } = useApp();
  const navigate = useNavigate();

  return (
    <div className="page-transition" style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme === 'light' ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
      padding: '1.5rem',
      position: 'relative',
      transition: 'background 0.3s ease',
      color: theme === 'light' ? '#1e293b' : '#f1f5f9'
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

      {/* Container chính */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2.5rem'
      }}>
        {/* Logo và Tiêu đề */}
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img
            src="/logo-exam.png"
            alt="Logo EXAM"
            style={{
              width: '100px',
              height: '100px',
              objectFit: 'contain',
              marginBottom: '1.5rem',
              filter: 'drop-shadow(0 10px 15px rgba(37, 99, 235, 0.2))'
            }}
          />
          <h1 style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            marginBottom: '0.75rem',
            lineHeight: 1.2
          }}>
            HỆ THỐNG THI TRỰC TUYẾN
          </h1>
          <p style={{
            color: 'var(--secondary)',
            fontSize: '1rem',
            maxWidth: '550px',
            lineHeight: 1.6
          }}>
            Nền tảng kiểm tra, thi cử trực tuyến thông minh, tích hợp AI hỗ trợ chấm bài tự động và giám sát thời gian thực.
          </p>
        </div>

        {/* Cổng đăng nhập kép */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          width: '100%'
        }}>
          {/* Card Học Sinh */}
          <div
            className="card animate-fade-in"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              border: '1px solid var(--border)'
            }}
            onClick={() => navigate('/student/login')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(37, 99, 235, 0.1), 0 10px 10px -5px rgba(37, 99, 235, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <GraduationCap size={32} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>CỔNG HỌC SINH</h2>
            <p style={{
              color: 'var(--secondary)',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              marginBottom: '1.5rem',
              flexGrow: 1
            }}>
              Vào phòng thi, làm bài kiểm tra trắc nghiệm, tự luận và xem lại kết quả bài thi chi tiết của bạn.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/student/login');
              }}
            >
              Học Sinh Đăng Nhập <ArrowRight size={16} />
            </button>
          </div>

          {/* Card Giáo Viên */}
          <div
            className="card animate-fade-in"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              border: '1px solid var(--border)'
            }}
            onClick={() => navigate('/teacher/login')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(16, 185, 129, 0.1), 0 10px 10px -5px rgba(16, 185, 129, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              backgroundColor: theme === 'light' ? '#d1fae5' : '#064e3b',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <ShieldCheck size={32} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>CỔNG GIÁO VIÊN</h2>
            <p style={{
              color: 'var(--secondary)',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              marginBottom: '1.5rem',
              flexGrow: 1
            }}>
              Quản lý đề thi, cấu hình lớp học, theo dõi nhật ký gian lận thời gian thực và cấu hình Gemini Studio AI.
            </p>
            <button
              className="btn btn-success"
              style={{ width: '100%', padding: '0.75rem' }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/teacher/login');
              }}
            >
              Giáo Viên Đăng Nhập <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div style={{
          marginTop: '1.5rem',
          fontSize: '0.8rem',
          color: 'var(--secondary)',
          textAlign: 'center',
          lineHeight: 1.6,
          maxWidth: '90%'
        }}>
          <span>© 2026 EXAM ONLINE.<br /> Hệ thống được phát triển bởi Hanshin</span>
        </div>
      </div>
    </div>
  );
}
