import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { ShieldAlert, Clock, CheckCircle2, ChevronLeft, ChevronRight, HelpCircle, Eye, AlertTriangle, Sun, Moon } from 'lucide-react';

const getQuestionTypeLabel = (type) => {
  switch (type) {
    case 'trac_nghiem': return 'Trắc Nghiệm';
    case 'dien_khuyet': return 'Điền Khuyết';
    case 'viet_lai_cau': return 'Viết Lại Câu';
    case 'tu_luan': return 'Tự Luận';
    default: return type;
  }
};

export default function ExamRoom() {
  const { examCode } = useParams();
  const { user, gasUrl, theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const server = new URLSearchParams(window.location.search).get('server') || 'kien_giang';

  // Trạng thái đề thi
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Trạng thái thi
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0); // giây
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  // Trạng thái cho luồng tải đề & anti-cheat sớm
  const [isAntiCheatActive, setIsAntiCheatActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [tempExamData, setTempExamData] = useState(null);
  const [tempQuestionsData, setTempQuestionsData] = useState([]);
  
  // Responsive states
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Gợi ý đã xem
  const [viewedHints, setViewedHints] = useState({});

  // Tham chiếu thời gian để tránh stale state trong countdown
  const timerRef = useRef(null);

  // Hook Anti-Cheat
  const { violations, isFullscreen, isFullscreenSupported, enterFullscreen } = useAntiCheat({
    examCode: examCode,
    username: user.username,
    gasUrl: gasUrl,
    maxViolations: 3,
    isActive: isAntiCheatActive && !submitResult && !isSubmitting,
    onViolation: (count, type, details) => {
      // Có thể hiển thị toast cảnh báo nhỏ ở góc màn hình
      console.warn(`Vi phạm thứ ${count}: ${details}`);
    },
    onAutoSubmit: () => {
      alert('Bạn đã vi phạm quy chế thi quá số lần cho phép (3 lần). Hệ thống tự động nộp bài làm!');
      submitExam(true);
    }
  });

  // Khởi động phòng thi bảo mật và tải đề
  const handleLaunch = () => {
    setIsAntiCheatActive(true);
    enterFullscreen();
    setLoadingProgress(true);
    setProgress(0);

    // Chạy thanh tiến trình tải đề giả lập để có hiệu ứng mượt mà
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    // Gọi API lấy đề thi thực tế
    fetchExamData();
  };

  const fetchExamData = async () => {
    try {
      const res = await fetch(`${gasUrl}?action=get_exam_details&exam_code=${examCode}&server=${server}&role=student&username=${user.username}`);
      const data = await res.json();
      if (data.success) {
        setTempExamData(data.exam);
        setTempQuestionsData(data.questions || []);
        setIsDataLoaded(true);
      } else {
        setError(data.message || 'Không tìm thấy đề thi!');
        setLoadingProgress(false);
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ đề thi!');
      setLoadingProgress(false);
    }
  };

  const handleConfirmStart = () => {
    setExam(tempExamData);
    setQuestions(tempQuestionsData);
    setTimeLeft(tempExamData.duration_mins * 60);
    setIsExamStarted(true);
    setLoadingProgress(false);
  };

  // Bộ đếm ngược thời gian thi chính thức
  useEffect(() => {
    if (isExamStarted && timeLeft > 0 && !submitResult) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            alert('Đã hết thời gian làm bài! Hệ thống tự động nộp bài.');
            submitExam(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isExamStarted, timeLeft, submitResult]);

  // Cập nhật câu trả lời
  const handleAnswerChange = (qId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: value
    }));
  };

  // Nộp bài
  const submitExam = async (isAuto = false) => {
    if (isSubmitting || submitResult) return;
    setIsSubmitting(true);
    clearInterval(timerRef.current);

    // Thoát fullscreen trước khi hiển thị kết quả
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'submit_exam',
          exam_code: examCode,
          username: user.username,
          server: server,
          answers: answers
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitResult({
          score: data.score,
          message: data.message
        });
      } else {
        alert(data.message || 'Lỗi xảy ra khi nộp bài');
      }
    } catch (err) {
      alert('Không kết nối được server để nộp bài! Vui lòng chụp màn hình bài làm và báo giáo viên.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Định dạng thời gian (mm:ss)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Toggle xem gợi ý
  const toggleHint = (qId) => {
    setViewedHints((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Số lượng câu hỏi đã trả lời
  const answeredCount = Object.keys(answers).filter(k => String(answers[k]).trim() !== '').length;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--secondary)', fontSize: '1.25rem' }}>Đang tải đề thi...</div>;
  }

  if (error) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '2rem' }}>
        <div className="card animate-scale-in" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <ShieldAlert size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ color: 'var(--danger)' }}>LỖI VÀO PHÒNG THI</h2>
          <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem', color: 'var(--secondary)' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/student/dashboard')}>Quay lại Bảng điều khiển</button>
        </div>
      </div>
    );
  }

  // MÀN HÌNH CHỜ 1: landing xác nhận phòng quy chế
  if (!isAntiCheatActive && !submitResult && !error) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-body)', padding: '1.5rem' }}>
        <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <ShieldAlert size={48} color="var(--warning)" style={{ margin: '0 auto 0.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>XÁC NHẬN VÀO PHÒNG THI</h2>
            <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Mã đề thi: {examCode}</p>
          </div>

          <div style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
            <h4 style={{ color: 'var(--warning)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <AlertTriangle size={18} /> QUY CHẾ PHÒNG THI (BẮT BUỘC):
            </h4>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', color: 'var(--secondary)' }}>
              <li>Bài thi yêu cầu chạy ở chế độ **Toàn màn hình (Fullscreen)**.</li>
              <li>Hành vi thoát Fullscreen, chuyển Tab hoặc click ra ngoài cửa sổ thi sẽ bị ghi nhận lỗi vi phạm.</li>
              <li>Nếu vi phạm quá **3 lần**, hệ thống sẽ **Tự động nộp bài** lập tức.</li>
              <li>Tổ hợp phím sao chép/dán, mở Developer Tools (F12) và chuột phải đã bị chặn.</li>
            </ul>
          </div>

          <button className="btn btn-primary pulse-border" onClick={handleLaunch} style={{ width: '100%', padding: '0.85rem', fontSize: '1.1rem', fontWeight: 700 }}>
            Khởi Động Phòng Thi & Tải Đề
          </button>
        </div>
      </div>
    );
  }

  // MÀN HÌNH CHỜ 2: Loading Bar quá trình tải đề bảo mật
  if (isAntiCheatActive && (!isDataLoaded || progress < 100) && !submitResult && !error) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-body)', padding: '1.5rem' }}>
        <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', textAlign: 'center' }}>
          <ShieldAlert size={48} className="animate-pulse" color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>ĐANG KHỞI ĐỘNG PHÒNG THI</h3>
          <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Vui lòng không tắt toàn màn hình hoặc chuyển tab. Hệ thống đang thiết lập môi trường thi bảo mật và tải đề thi...
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>
            <span>Đang tải đề thi ({progress}%)</span>
            <span>{progress === 100 ? 'Đã tải xong' : 'Vui lòng đợi...'}</span>
          </div>
          
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
    );
  }

  // MÀN HÌNH CHỜ 3: Xác nhận tải đề thành công, bắt đầu đếm ngược làm bài
  if (isAntiCheatActive && isDataLoaded && progress === 100 && !isExamStarted && !submitResult && !error) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-body)', padding: '1.5rem' }}>
        <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '550px', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              border: '4px solid rgba(16, 185, 129, 0.2)'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>TẢI ĐỀ THI THÀNH CÔNG</h3>
            <p style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>Môi trường thi an toàn đã được kích hoạt thành công.</p>
          </div>

          <div style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem', marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
              Thông Tin Bài Thi:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div><strong>Tiêu Đề:</strong> {tempExamData?.title}</div>
              <div><strong>Môn Học:</strong> {tempExamData?.subject}</div>
              <div><strong>Mã Đề:</strong> {tempExamData?.exam_code}</div>
              <div><strong>Thời Gian:</strong> {tempExamData?.duration_mins} phút</div>
              <div><strong>Số Câu Hỏi:</strong> {tempQuestionsData?.length} câu hỏi</div>
            </div>
          </div>

          <button className="btn btn-success" onClick={handleConfirmStart} style={{ width: '100%', padding: '0.85rem', fontSize: '1.1rem', fontWeight: 700 }}>
            Xác Nhận & Bắt Đầu Làm Bài
          </button>
        </div>
      </div>
    );
  }

  // MÀN HÌNH CẢNH BÁO THOÁT FULLSCREEN (KHOÁ GIAO DIỆN) - Chỉ hiển thị trên thiết bị có hỗ trợ Fullscreen
  if (isFullscreenSupported && !isFullscreen && !submitResult) {
    return (
      <div className="lock-overlay">
        <ShieldAlert size={64} color="var(--danger)" style={{ marginBottom: '1.5rem', animation: 'pulse 1.5s infinite' }} />
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>BẠN ĐÃ THOÁT KHỎI PHÒNG THI!</h2>
        <p style={{ maxWidth: '500px', margin: '1rem 0 2rem', color: '#94a3b8' }}>
          Bạn đã thoát chế độ Toàn màn hình hoặc chuyển cửa sổ. Hành vi này đã được ghi nhận và gửi báo cáo về giáo viên.
        </p>
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '1rem 2rem', borderRadius: '8px', border: '1px solid var(--danger)', marginBottom: '2rem' }}>
          Số lần vi phạm hiện tại: <strong style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>{violations} / 3</strong>
        </div>
        <button className="btn btn-primary" onClick={enterFullscreen} style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>
          Quay Lại Phòng Thi (Fullscreen)
        </button>
      </div>
    );
  }

  // MÀN HÌNH HIỂN THỊ KẾT QUẢ KHI NỘP BÀI XONG
  if (submitResult) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '1.5rem' }}>
        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: '2.5rem' }}>
          <CheckCircle2 size={64} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>NỘP BÀI THÀNH CÔNG!</h2>
          <p style={{ color: 'var(--secondary)', margin: '0.5rem 0 1.5rem' }}>Đề thi: {exam.title}</p>
          
          <div style={{ backgroundColor: 'var(--success-light)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: 600 }}>Điểm số trắc nghiệm tự động của bạn:</span>
            <strong style={{ fontSize: '3rem', color: 'var(--success)', display: 'block', margin: '0.5rem 0' }}>
              {submitResult.score} <span style={{ fontSize: '1.25rem' }}>/ 10</span>
            </strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Đáp án chi tiết đã lưu. Bạn có thể xem lại tại Dashboard.</span>
          </div>

          <button className="btn btn-primary" onClick={() => navigate('/student/dashboard')} style={{ width: '100%' }}>
            Quay lại Bảng điều khiển
          </button>
        </div>
      </div>
    );
  }

  // GIAO DIỆN LÀM BÀI CHÍNH
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-body)' }}>
      
      {/* Header phòng thi */}
      <div style={{
        backgroundColor: '#1e293b',
        color: 'white',
        padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '0.5rem' : '0',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid var(--primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: isMobile ? 'center' : 'left' }}>
          <img
            src="/logo-exam.png"
            alt="Logo EXAM"
            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
          />
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 0 }}>Đang thi: {exam.title}</h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Mã đề: {exam.exam_code} | Thí sinh: {user.name}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: timeLeft < 120 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: timeLeft < 120 ? '1px solid var(--danger)' : 'none',
            color: timeLeft < 120 ? 'var(--danger)' : 'white'
          }}>
            <Clock size={18} />
            <strong style={{ fontSize: '1.1rem', fontFamily: 'monospace' }}>{formatTime(timeLeft)}</strong>
          </div>

          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            color: 'var(--danger)',
            fontWeight: 600
          }}>
            Số vi phạm: {violations} / 3
          </div>

          <button className="btn btn-outline" onClick={toggleTheme} title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'} style={{ padding: '0.5rem', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <button
            className="btn btn-success"
            style={{ padding: '0.5rem 1.25rem' }}
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang nộp...' : 'Nộp Bài'}
          </button>
        </div>
      </div>

      {/* Vùng nội dung chính */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden'
      }}>
        
        {/* Sidebar điều hướng câu hỏi */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRight: isMobile ? 'none' : '1px solid var(--border)',
          borderBottom: isMobile ? '1px solid var(--border)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem',
          overflowY: isMobile ? 'visible' : 'auto',
          maxHeight: isMobile ? '95px' : 'none',
          flexShrink: 0
        }}>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            TIẾN ĐỘ ({answeredCount}/{questions.length})
          </h4>
          <div style={{
            display: isMobile ? 'flex' : 'grid',
            gridTemplateColumns: isMobile ? 'none' : 'repeat(5, 1fr)',
            gap: '0.5rem',
            overflowX: isMobile ? 'auto' : 'visible',
            paddingBottom: isMobile ? '0.5rem' : '0',
            width: '100%'
          }}>
            {questions.map((q, idx) => {
              const isAnswered = String(answers[q.question_id] || '').trim() !== '';
              return (
                <a
                  key={idx}
                  href={`#question-${idx + 1}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: isMobile ? '32px' : '40px',
                    width: isMobile ? '32px' : 'auto',
                    minWidth: isMobile ? '32px' : 'auto',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: isAnswered ? 'var(--primary)' : 'transparent',
                    color: isAnswered ? 'white' : 'inherit',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    transition: 'all 0.1s'
                  }}
                >
                  {idx + 1}
                </a>
              );
            })}
          </div>
        </div>

        {/* Danh sách câu hỏi */}
        <div style={{ padding: isMobile ? '1rem' : '2rem', overflowY: 'auto', scrollBehavior: 'smooth', flex: 1 }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {questions.map((q, idx) => {
              const studentAns = answers[q.question_id] || '';

              return (
                <div
                  key={idx}
                  id={`question-${idx + 1}`}
                  className="card"
                  style={{ position: 'relative', borderLeft: '4px solid var(--primary)' }}
                >
                  {/* Số câu hỏi */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>Câu hỏi {idx + 1}</span>
                    <span className="badge badge-warning">
                      {getQuestionTypeLabel(q.type)}
                    </span>
                  </div>

                  {/* Nội dung câu hỏi */}
                  <p style={{ fontSize: '1.05rem', fontWeight: 500, whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
                    {q.content}
                  </p>

                  {/* Ảnh đính kèm (nếu có) */}
                  {q.image_url && (
                    <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <img
                        src={q.image_url}
                        alt={`Câu hỏi ${idx + 1}`}
                        style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '6px', display: 'block' }}
                      />
                    </div>
                  )}

                  {/* Vùng nhập đáp án theo loại câu hỏi */}
                  <div style={{ marginTop: '1rem' }}>
                    {/* 1. Trắc nghiệm */}
                    {q.type === 'trac_nghiem' && q.options && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {q.options.map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isSelected = studentAns === letter;
                          return (
                            <label
                              key={oIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                                borderColor: isSelected ? 'var(--primary)' : 'var(--border)'
                              }}
                            >
                              <input
                                type="radio"
                                name={`q_${q.question_id}`}
                                value={letter}
                                checked={isSelected}
                                onChange={() => handleAnswerChange(q.question_id, letter)}
                                style={{ width: 'auto', cursor: 'pointer' }}
                              />
                              <span style={{ fontWeight: 700 }}>{letter}.</span>
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. Điền vào ô trống */}
                    {q.type === 'dien_khuyet' && (
                      <div className="form-group">
                        <label>Nhập đáp án điền vào ô trống</label>
                        <input
                          type="text"
                          placeholder="Nhập từ hoặc cụm từ..."
                          value={studentAns}
                          onChange={(e) => handleAnswerChange(q.question_id, e.target.value)}
                        />
                      </div>
                    )}

                    {/* 3. Viết lại câu */}
                    {q.type === 'viet_lai_cau' && (
                      <div className="form-group">
                        <label>Viết lại câu hoàn chỉnh</label>
                        <textarea
                          placeholder="Viết lại câu chính xác..."
                          rows={3}
                          value={studentAns}
                          onChange={(e) => handleAnswerChange(q.question_id, e.target.value)}
                        />
                      </div>
                    )}

                    {/* 4. Tự luận */}
                    {q.type === 'tu_luan' && (
                      <div className="form-group">
                        <label>Soạn bài làm tự luận</label>
                        <textarea
                          placeholder="Soạn nội dung trả lời chi tiết của bạn vào đây..."
                          rows={6}
                          value={studentAns}
                          onChange={(e) => handleAnswerChange(q.question_id, e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Phần Gợi ý (Hint) - hiển thị nếu đề bài có sẵn */}
                  {q.hint && (
                    <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.25rem' }}
                        onClick={() => toggleHint(q.question_id)}
                      >
                        <Eye size={12} /> {viewedHints[q.question_id] ? 'Ẩn Gợi Ý' : 'Xem Gợi Ý'}
                      </button>
                      
                      {viewedHints[q.question_id] && (
                        <div className="animate-fade-in" style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--warning-light)',
                          color: '#b45309',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 500
                        }}>
                          Gợi ý: {q.hint}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}

          </div>
        </div>

      </div>

      {showSubmitModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', backgroundColor: 'var(--bg-card)' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--warning-light)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <AlertTriangle size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Xác Nhận Nộp Bài</h3>
            <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Bạn có chắc chắn muốn nộp bài thi ngay bây giờ? Sau khi nộp, bạn sẽ không thể chỉnh sửa câu trả lời của mình nữa.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-success"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowSubmitModal(false);
                  submitExam(false);
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang nộp...' : 'Xác Nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
