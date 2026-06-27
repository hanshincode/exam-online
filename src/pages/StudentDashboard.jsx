import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { LogOut, BookOpen, Clock, FileText, Search, Printer, Clipboard, X, Check, AlertTriangle, Sun, Moon } from 'lucide-react';

const getQuestionTypeLabel = (type) => {
  switch (type) {
    case 'trac_nghiem': return 'Trắc Nghiệm';
    case 'dien_khuyet': return 'Điền Khuyết';
    case 'viet_lai_cau': return 'Viết Lại Câu';
    case 'tu_luan': return 'Tự Luận';
    default: return type;
  }
};

export default function StudentDashboard() {
  const { user, gasUrl, logoutUser, theme, toggleTheme } = useApp();
  const navigate = useNavigate();

  const [examCode, setExamCode] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [studentServer, setStudentServer] = useState('');
  const [serversList, setServersList] = useState([]);
  const [loadingServers, setLoadingServers] = useState(false);

  // States cho modal xem chi tiết bài làm
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [subDetail, setSubDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load lịch sử thi
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${gasUrl}?action=get_history&username=${user.username}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Không load được lịch sử thi:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load danh sách server đề thi từ Google Sheets
  const fetchServers = async () => {
    setLoadingServers(true);
    try {
      const res = await fetch(`${gasUrl}?action=get_servers`);
      const data = await res.json();
      if (data.success && data.servers && data.servers.length > 0) {
        setServersList(data.servers);
        setStudentServer(data.servers[0].server_id);
      }
    } catch (err) {
      console.error('Không load được danh sách server:', err);
    } finally {
      setLoadingServers(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchServers();
  }, [user.username, gasUrl]);

  // Kiểm tra mã đề thi
  const handleSearchExam = async (e) => {
    e.preventDefault();
    if (!examCode.trim()) return;

    setError('');
    setSearchLoading(true);
    try {
      const res = await fetch(`${gasUrl}?action=get_exam_details&exam_code=${examCode.trim()}&server=${studentServer}&role=student&username=${user.username}`);
      const data = await res.json();
      if (data.success) {
        if (data.exam.status !== 'active') {
          setError('Đề thi này đã bị khóa hoặc ngừng hoạt động!');
          return;
        }
        // Chuyển sang phòng thi kèm theo query param server
        navigate(`/student/exam/${examCode.trim()}?server=${studentServer}`);
      } else {
        setError(data.message || 'Mã đề thi không chính xác!');
      }
    } catch (err) {
      setError('Lỗi kết nối tới server đề thi!');
    } finally {
      setSearchLoading(false);
    }
  };

  // Xem chi tiết bài làm đã nộp
  const handleViewDetail = async (subId) => {
    setSelectedSubId(subId);
    setLoadingDetail(true);
    try {
      const res = await fetch(`${gasUrl}?action=get_submission_detail&submission_id=${subId}`);
      const data = await res.json();
      if (data.success) {
        setSubDetail(data);
      } else {
        alert(data.message || 'Không thể xem chi tiết bài làm');
      }
    } catch (err) {
      alert('Lỗi kết nối server!');
    } finally {
      setLoadingDetail(false);
    }
  };

  // In bài thi (Tải PDF) sử dụng print window
  const handlePrintExam = () => {
    if (!subDetail) return;

    const printWindow = window.open('', '_blank');
    const questionsHtml = subDetail.questions.map((q, idx) => {
      const studentAns = subDetail.submission.answers[q.question_id] || '';
      const isCorrect = q.type === 'trac_nghiem' || q.type === 'dien_khuyet' || q.type === 'viet_lai_cau'
        ? String(studentAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()
        : null;

      let optionsHtml = '';
      if (q.type === 'trac_nghiem' && q.options) {
        optionsHtml = `<ul style="list-style-type: none; padding-left: 10px;">
          ${q.options.map((opt, oIdx) => {
            const letter = String.fromCharCode(65 + oIdx); // A, B, C, D
            const isSelected = studentAns === letter;
            const isCorrectOption = q.correct_answer === letter;
            let style = '';
            if (isSelected) style += 'font-weight: bold; color: blue;';
            if (isCorrectOption) style += 'text-decoration: underline;';
            return `<li style="${style}">${letter}. ${opt} ${isSelected ? '(Đã chọn)' : ''} ${isCorrectOption ? '(Đáp án đúng)' : ''}</li>`;
          }).join('')}
        </ul>`;
      }

      return `
        <div style="margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #ccc;">
          <p><strong>Câu ${idx + 1}:</strong> ${q.content}</p>
          ${q.image_url ? `<img src="${q.image_url}" style="max-width: 300px; display: block; margin-top: 10px;" />` : ''}
          ${optionsHtml}
          <div style="margin-top: 8px; font-size: 0.9em; background-color: #f1f5f9; padding: 8px; border-radius: 4px;">
            <p><strong>Đáp án của bạn:</strong> ${studentAns || 'Không trả lời'} ${isCorrect === true ? '<span style="color: green;">(Đúng)</span>' : isCorrect === false ? `<span style="color: red;">(Sai - Đáp án đúng: ${q.correct_answer})</span>` : ''}</p>
            ${q.hint ? `<p style="color: #666; font-style: italic;">Gợi ý: ${q.hint}</p>` : ''}
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Kết Quả Thi - ${subDetail.submission.exam_code}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            h1, h2 { text-align: center; }
            .header-info { margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-info">
            <h1>BÀI LÀM CHI TIẾT CỦA HỌC SINH</h1>
            <p><strong>Họ và tên:</strong> ${user.name}</p>
            <p><strong>Tài khoản:</strong> ${user.username}</p>
            <p><strong>Mã đề thi:</strong> ${subDetail.submission.exam_code}</p>
            <p><strong>Điểm số đạt được:</strong> ${subDetail.submission.score} / 10</p>
            <p><strong>Thời gian nộp bài:</strong> ${new Date(subDetail.submission.timestamp).toLocaleString()}</p>
          </div>
          <div>
            ${questionsHtml}
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background-color: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer;">
              In / Lưu File PDF
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const showLoadingBar = loadingHistory || loadingServers || searchLoading || loadingDetail;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {showLoadingBar && <div className="top-loading-bar" />}
      <header>
        <div className="container header-container">
          <div className="header-brand">
            <img
              src="/logo-exam.png"
              alt="Logo EXAM"
              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            />
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>THI ONLINE HỌC SINH</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Mã: {user.username}</span>
            </div>
          </div>
          <div className="header-user-actions">
            <div className="header-user-info">
              <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block' }}>{user.name}</span>
              <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>Lớp: {user.class}</span>
            </div>
            <div className="header-buttons">
              <button className="btn btn-outline" onClick={toggleTheme} title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'} style={{ padding: '0.5rem' }}>
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              <button className="btn btn-outline" onClick={logoutUser} title="Đăng xuất" style={{ padding: '0.5rem' }}>
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginTop: '1rem' }}>
        
        {/* Nhập mã đề */}
        <section className="card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clipboard size={20} color="var(--primary)" /> BẮT ĐẦU THI MỚI
          </h3>
          <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Nhập chính xác Mã Đề do Giáo viên cung cấp. Hãy chuẩn bị sẵn sàng phòng thi yên tĩnh và kết nối mạng ổn định.
          </p>

          {error && (
            <div className="badge-danger" style={{ padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', width: '100%', display: 'block', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSearchExam} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="search-group">
              <select
                value={studentServer}
                onChange={(e) => setStudentServer(e.target.value)}
                className="server-select"
                disabled={searchLoading}
              >
                {serversList.map((srv) => (
                  <option key={srv.server_id} value={srv.server_id}>
                    Server {srv.server_name}
                  </option>
                ))}
              </select>
              
              <div className="exam-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Nhập Mã Đề Thi (ví dụ: DE_101)"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                  disabled={searchLoading}
                  required
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={searchLoading}>
              {searchLoading ? 'Đang tìm kiếm đề thi...' : 'Xác Nhận & Vào Phòng Thi'}
            </button>
          </form>

          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--warning-light)', padding: '0.75rem', borderRadius: '8px', color: 'var(--warning)' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
              Hệ thống thi có bật giám sát chống gian lận. Chuyển Tab hoặc thoát Fullscreen sẽ bị ghi nhận phạt!
            </span>
          </div>
        </section>

        {/* Lịch sử thi */}
        <section className="card">
          <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={20} color="var(--primary)" /> LỊCH SỬ CÁC LẦN THI TRƯỚC
          </h3>

          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>Đang tải lịch sử...</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)', border: '2px dashed var(--border)', borderRadius: '12px' }}>
              <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Bạn chưa tham gia thi kỳ thi nào.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Mã Đề</th>
                    <th>Tên Bài Thi</th>
                    <th>Môn Học</th>
                    <th>Điểm Số</th>
                    <th>Thời Gian Nộp</th>
                    <th style={{ textAlign: 'center' }}>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((hist, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{hist.exam_code}</td>
                      <td>{hist.title}</td>
                      <td>{hist.subject}</td>
                      <td>
                        <span className={`badge ${hist.score >= 5 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.85rem' }}>
                          {hist.score} / 10
                        </span>
                      </td>
                      <td>{new Date(hist.timestamp).toLocaleString()}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleViewDetail(hist.submission_id)}>
                          Xem lại đáp án
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* MODAL XEM CHI TIẾT BÀI THI */}
      {selectedSubId && (
        <div className="lock-overlay" style={{ background: 'rgba(15, 23, 42, 0.7)', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', color: theme === 'light' ? '#1e293b' : '#f1f5f9', colorScheme: 'normal', textAlign: 'left', backgroundColor: 'var(--bg-card)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Chi Tiết Bài Làm - Đề {subDetail?.submission?.exam_code}</h3>
                <span className={`badge ${subDetail?.submission?.score >= 5 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  Điểm số: {subDetail?.submission?.score} / 10
                </span>
              </div>
              <button className="btn btn-outline" onClick={() => { setSelectedSubId(null); setSubDetail(null); }} style={{ padding: '0.4rem' }}>
                <X size={20} />
              </button>
            </div>

            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)' }}>Đang tải bài thi...</div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <button className="btn btn-primary" onClick={handlePrintExam} style={{ gap: '0.5rem' }}>
                    <Printer size={16} /> Tải về PDF / In Bài Thi
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {subDetail?.questions?.map((q, qIdx) => {
                    const studentAns = subDetail.submission.answers[q.question_id] || '';
                    const isCorrect = q.type === 'trac_nghiem' || q.type === 'dien_khuyet' || q.type === 'viet_lai_cau'
                      ? String(studentAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()
                      : null;

                    return (
                      <div key={qIdx} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                          Câu {qIdx + 1}: {q.content}
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--secondary)' }}>
                            ({getQuestionTypeLabel(q.type)})
                          </span>
                        </p>
                        
                        {q.image_url && (
                          <img src={q.image_url} alt="Question Attachment" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '6px', marginBottom: '0.75rem', display: 'block' }} />
                        )}

                        {q.type === 'trac_nghiem' && q.options && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            {q.options.map((opt, oIdx) => {
                              const letter = String.fromCharCode(65 + oIdx);
                              const isSelected = studentAns === letter;
                              const isCorrectOption = q.correct_answer === letter;
                              return (
                                <div key={oIdx} style={{
                                  padding: '0.5rem 0.75rem',
                                  border: '1px solid var(--border)',
                                  borderRadius: '6px',
                                  backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                                  borderColor: isCorrectOption ? 'var(--success)' : 'var(--border)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <span style={{ fontWeight: 700 }}>{letter}.</span>
                                  <span>{opt}</span>
                                  {isSelected && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, marginLeft: 'auto' }}>(Đã chọn)</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div style={{
                          backgroundColor: 'var(--border)',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                          fontSize: '0.9rem'
                        }}>
                          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong>Đáp án của bạn:</strong> 
                            <span style={{ fontWeight: 600 }}>{studentAns || '(Không trả lời)'}</span>
                            {isCorrect === true ? <Check size={16} color="var(--success)" /> : isCorrect === false ? <X size={16} color="var(--danger)" /> : null}
                          </p>
                          {(q.type === 'trac_nghiem' || q.type === 'dien_khuyet' || q.type === 'viet_lai_cau') && (
                            <p style={{ color: 'var(--success)', fontWeight: 600 }}>
                              Đáp án đúng: {q.correct_answer}
                            </p>
                          )}
                          {q.hint && (
                            <p style={{ fontStyle: 'italic', opacity: 0.8, fontSize: '0.85rem', marginTop: '0.25rem' }}>
                              Gợi ý đã xem: {q.hint}
                            </p>
                          )}
                        </div>

                        {subDetail?.submission?.ai_feedback && subDetail.submission.ai_feedback[q.question_id] && (
                          <div style={{
                            marginTop: '0.75rem',
                            padding: '1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--primary)',
                            backgroundColor: 'var(--primary-light)',
                            fontSize: '0.9rem'
                          }}>
                            <h5 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              💡 Nhận Xét & Điểm Số Từ AI (Gemini Studio):
                            </h5>
                            <div style={{ marginBottom: '0.5rem' }}>
                              <strong>Điểm số AI chấm:</strong> <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{subDetail.submission.ai_feedback[q.question_id].score} / 10.0</span>
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                              <strong>Lời phê chi tiết:</strong><br />
                              {subDetail.submission.ai_feedback[q.question_id].comment}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
