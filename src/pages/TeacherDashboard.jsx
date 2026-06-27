import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { LogOut, LayoutDashboard, PlusCircle, BarChart3, AlertOctagon, RefreshCw, Trash2, Image, FileText, CheckCircle, Server, Eye, BookOpen, Users, History, Sun, Moon } from 'lucide-react';

const getQuestionTypeLabel = (type) => {
  switch (type) {
    case 'trac_nghiem': return 'Trắc Nghiệm';
    case 'dien_khuyet': return 'Điền Khuyết';
    case 'viet_lai_cau': return 'Viết Lại Câu';
    case 'tu_luan': return 'Tự Luận';
    default: return type;
  }
};

export default function TeacherDashboard() {
  const { user, token, gasUrl, logoutUser, theme, toggleTheme } = useApp();
  
  // Tabs: 'stats' hoặc 'create'
  const [activeTab, setActiveTab] = useState('stats');

  // Trạng thái thống kê & logs
  const [submissions, setSubmissions] = useState([]);
  const [cheatLogs, setCheatLogs] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedExamFilter, setSelectedExamFilter] = useState('all');

  // Trạng thái form tạo đề
  const [examCode, setExamCode] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Toán học');
  const [durationMins, setDurationMins] = useState(45);
  const [questions, setQuestions] = useState([
    { type: 'trac_nghiem', content: '', options: ['', '', '', ''], correct_answer: 'A', hint: '', image_base64: '' }
  ]);
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccessMsg, setFormSuccessMsg] = useState('');
  const [formErrorMsg, setFormErrorMsg] = useState('');
  const [server, setServer] = useState('');
  const [serversList, setServersList] = useState([]);
  const [subjectsList, setSubjectsList] = useState(['Toán học', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lý', 'Tin học']);
  const [maxAttempts, setMaxAttempts] = useState(-1);
  
  // Trạng thái tạo server mới
  const [newServerName, setNewServerName] = useState('');
  const [serverFormLoading, setServerFormLoading] = useState(false);
  const [serverFormSuccess, setServerFormSuccess] = useState('');
  const [serverFormError, setServerFormError] = useState('');

  // Trạng thái cấu hình AI Studio
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiKeyMasked, setGeminiKeyMasked] = useState('');
  const [aiConfigLoading, setAiConfigLoading] = useState(false);
  const [aiConfigError, setAiConfigError] = useState('');
  const [aiConfigSuccess, setAiConfigSuccess] = useState('');

  // Trạng thái quản lý đề thi đã tạo
  const [examsList, setExamsList] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [selectedExamDetails, setSelectedExamDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Trạng thái quản lý học sinh và xem chi tiết bài thi học sinh
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentHistoryModal, setShowStudentHistoryModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('');
  const [createStudentLoading, setCreateStudentLoading] = useState(false);
  const [studentSubDetail, setStudentSubDetail] = useState(null);
  const [loadingSubDetail, setLoadingSubDetail] = useState(false);
  const [showSubDetailModal, setShowSubDetailModal] = useState(false);
  const [loadingServers, setLoadingServers] = useState(false);

  // Tải dữ liệu thống kê
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${gasUrl}?action=get_teacher_stats`);
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions || []);
        setCheatLogs(data.cheatLogs || []);
        setStudentsList(data.students || []);
      }
    } catch (err) {
      console.error('Không load được thống kê:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const resetStudentPassword = async (username) => {
    if (!window.confirm(`Bạn có chắc chắn muốn reset mật khẩu của học sinh "${username}" về mặc định "examonline123" không?`)) {
      return;
    }
    
    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'reset_student_password',
          token: token,
          username: username
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Reset mật khẩu thành công!');
        fetchStats();
      } else {
        alert(data.message || 'Lỗi khi reset mật khẩu.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối tới server.');
    }
  };

  const createStudent = async (e) => {
    e.preventDefault();
    if (!newStudentUsername || !newStudentName || !newStudentClass) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    setCreateStudentLoading(true);
    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'create_student',
          token: token,
          username: newStudentUsername,
          name: newStudentName,
          class_name: newStudentClass
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Tạo tài khoản học sinh thành công!');
        setNewStudentUsername('');
        setNewStudentName('');
        setNewStudentClass('');
        setShowAddStudentModal(false);
        fetchStats();
      } else {
        alert(data.message || 'Lỗi khi tạo tài khoản học sinh.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối tới server.');
    } finally {
      setCreateStudentLoading(false);
    }
  };

  // Tải danh sách đề thi đã tạo từ toàn bộ các Server
  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const res = await fetch(`${gasUrl}?action=get_exams`);
      const data = await res.json();
      if (data.success) {
        setExamsList(data.exams || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách đề thi:', err);
    } finally {
      setLoadingExams(false);
    }
  };

  // Tải chi tiết câu hỏi và đáp án của đề thi
  const fetchExamDetails = async (examCode, examServer) => {
    setLoadingDetails(true);
    setSelectedExamDetails(null);
    setShowDetailsModal(true);
    try {
      const res = await fetch(`${gasUrl}?action=get_exam_details&exam_code=${examCode}&server=${examServer}&role=teacher`);
      const data = await res.json();
      if (data.success) {
        setSelectedExamDetails(data);
      } else {
        alert(data.message || 'Không load được chi tiết đề thi!');
        setShowDetailsModal(false);
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết đề thi:', err);
      alert('Không kết nối được server để tải chi tiết đề!');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Tải chi tiết câu hỏi và bài làm thực tế của 1 học sinh
  const viewStudentSubmission = async (subId) => {
    setLoadingSubDetail(true);
    setShowSubDetailModal(true);
    setStudentSubDetail(null);
    try {
      const res = await fetch(`${gasUrl}?action=get_submission_detail&submission_id=${subId}`);
      const data = await res.json();
      if (data.success) {
        setStudentSubDetail(data);
      } else {
        alert(data.message || 'Không tải được chi tiết bài làm!');
        setShowSubDetailModal(false);
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết bài làm:', err);
      alert('Không kết nối được server!');
      setShowSubDetailModal(false);
    } finally {
      setLoadingSubDetail(false);
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
        setServer(data.servers[0].server_id);
      }
    } catch (err) {
      console.error('Không load được danh sách server:', err);
    } finally {
      setLoadingServers(false);
    }
  };

  // Load danh sách môn học từ Google Sheets
  const fetchSubjects = async () => {
    try {
      const res = await fetch(`${gasUrl}?action=get_subjects`);
      const data = await res.json();
      if (data.success && data.subjects && data.subjects.length > 0) {
        setSubjectsList(data.subjects);
        setSubject(data.subjects[0]);
      }
    } catch (err) {
      console.error('Không load được danh sách môn học:', err);
    }
  };

  const fetchGeminiKeyStatus = async () => {
    if (!gasUrl) return;
    try {
      const res = await fetch(`${gasUrl}?action=get_gemini_key`);
      const data = await res.json();
      if (data.success && data.is_configured) {
        setGeminiKeyMasked(data.masked_key);
      } else {
        setGeminiKeyMasked('');
      }
    } catch (err) {
      console.error('Không lấy được trạng thái API Key:', err);
    }
  };

  const handleSaveGeminiKey = async () => {
    if (!geminiKey.trim()) {
      setAiConfigError('Vui lòng nhập API Key hợp lệ!');
      return;
    }
    setAiConfigLoading(true);
    setAiConfigError('');
    setAiConfigSuccess('');
    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'save_gemini_key',
          token: token,
          gemini_key: geminiKey.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiConfigSuccess('Lưu cấu hình API Key của Google AI Studio thành công!');
        setGeminiKey('');
        fetchGeminiKeyStatus();
      } else {
        setAiConfigError(data.message || 'Lỗi khi lưu API Key.');
      }
    } catch (err) {
      setAiConfigError('Không kết nối được server!');
    } finally {
      setAiConfigLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab, gasUrl]);

  useEffect(() => {
    fetchServers();
    fetchSubjects();
    fetchGeminiKeyStatus();
  }, [gasUrl]);

  useEffect(() => {
    if (activeTab === 'exams') {
      fetchExams();
    }
  }, [activeTab, gasUrl]);

  useEffect(() => {
    if (activeTab === 'manage_servers') {
      fetchGeminiKeyStatus();
    }
  }, [activeTab, gasUrl]);

  // Các danh sách đề thi để filter
  const examCodesList = Array.from(new Set(submissions.map(s => s.exam_code)));

  // Lọc submissions và cheat logs
  const filteredSubmissions = selectedExamFilter === 'all' 
    ? submissions 
    : submissions.filter(s => s.exam_code === selectedExamFilter);

  const filteredCheatLogs = selectedExamFilter === 'all'
    ? cheatLogs
    : cheatLogs.filter(l => l.exam_code === selectedExamFilter);

  // Tính toán chỉ số thống kê
  const statsCalc = () => {
    if (filteredSubmissions.length === 0) return { avg: 0, max: 0, min: 0, count: 0 };
    const scores = filteredSubmissions.map(s => s.score);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = parseFloat((sum / scores.length).toFixed(2));
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    return { avg, max, min, count: scores.length };
  };

  const { avg, max, min, count } = statsCalc();

  // Thêm câu hỏi mới vào form
  const addQuestionField = () => {
    setQuestions([
      ...questions,
      { type: 'trac_nghiem', content: '', options: ['', '', '', ''], correct_answer: 'A', hint: '', image_base64: '' }
    ]);
  };

  // Xóa câu hỏi khỏi form
  const removeQuestionField = (index) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  // Cập nhật câu hỏi trong form
  const updateQuestionData = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  // Cập nhật tùy chọn trắc nghiệm
  const updateQuestionOption = (qIdx, optIdx, val) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = val;
    setQuestions(updated);
  };

  // Thêm phương án lựa chọn trắc nghiệm (Tối đa 26: A-Z)
  const addOptionToQuestion = (qIdx) => {
    const updated = [...questions];
    if (updated[qIdx].options.length >= 26) return;
    updated[qIdx].options.push('');
    setQuestions(updated);
  };

  // Bớt phương án lựa chọn trắc nghiệm (Tối thiểu 2)
  const removeOptionFromQuestion = (qIdx) => {
    const updated = [...questions];
    if (updated[qIdx].options.length <= 2) return;
    
    const lastLetter = String.fromCharCode(64 + updated[qIdx].options.length);
    if (updated[qIdx].correct_answer === lastLetter) {
      updated[qIdx].correct_answer = String.fromCharCode(63 + updated[qIdx].options.length);
    }
    
    updated[qIdx].options.pop();
    setQuestions(updated);
  };

  // Xử lý upload ảnh câu hỏi (convert sang base64)
  const handleImageUpload = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateQuestionData(index, 'image_base64', e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Tải file mẫu CSV để soạn đề thi bằng Excel
  const downloadTemplate = () => {
    const csvContent = 
      "Loại câu hỏi (trac_nghiem/dien_khuyet/viet_lai_cau/tu_luan),Nội dung câu hỏi,Tùy chọn A,Tùy chọn B,Tùy chọn C,Tùy chọn D,Đáp án đúng,Gợi ý\n" +
      "trac_nghiem,Thủ đô của Việt Nam là gì?,Hà Nội,TP Hồ Chí Minh,Đà Nẵng,Huế,A,Có lăng Bác\n" +
      "dien_khuyet,Nước đóng băng ở ... độ C (nhập số),,,,,0,Nhiệt độ đóng băng\n" +
      "viet_lai_cau,Viết lại câu sau ở thể bị động: They built this bridge in 2020.,,,,,This bridge was built in 2020.,Bắt đầu bằng This bridge\n" +
      "tu_luan,Hãy nêu cảm nghĩ của em về ngày khai trường.,,,,,\n";
    
    // Thêm BOM để Excel hiển thị đúng font Tiếng Việt UTF-8
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "mau_de_thi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import câu hỏi từ file CSV
  const handleImportCSV = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/);
        if (lines.length <= 1) return;
        
        const header = lines[0];
        const sep = header.includes(';') ? ';' : ',';

        // Phân tách dòng CSV hỗ trợ có dấu ngoặc kép
        const parseCSVLine = (lineText, separator) => {
          let columns = [];
          let insideQuote = false;
          let currentField = "";
          for (let i = 0; i < lineText.length; i++) {
            let char = lineText[i];
            if (char === '"') {
              insideQuote = !insideQuote;
            } else if (char === separator && !insideQuote) {
              columns.push(currentField.trim());
              currentField = "";
            } else {
              currentField += char;
            }
          }
          columns.push(currentField.trim());
          return columns;
        };

        const importedQuestions = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cols = parseCSVLine(line, sep);
          if (cols.length < 2) continue;
          
          const type = cols[0] || 'trac_nghiem';
          const content = cols[1] || '';
          const optA = cols[2] || '';
          const optB = cols[3] || '';
          const optC = cols[4] || '';
          const optD = cols[5] || '';
          const correctAnswer = cols[6] || '';
          const hint = cols[7] || '';
          
          importedQuestions.push({
            type: ['trac_nghiem', 'dien_khuyet', 'viet_lai_cau', 'tu_luan'].includes(type) ? type : 'trac_nghiem',
            content: content,
            options: [optA, optB, optC, optD],
            correct_answer: correctAnswer,
            hint: hint,
            image_base64: ''
          });
        }
        
        if (importedQuestions.length > 0) {
          setQuestions(importedQuestions);
          alert(`Đã nhập thành công ${importedQuestions.length} câu hỏi từ file!`);
        } else {
          alert('Không tìm thấy dữ liệu câu hỏi hợp lệ trong file!');
        }
      } catch (err) {
        alert('Lỗi định dạng file CSV! Vui lòng kiểm tra lại cấu trúc.');
        console.error(err);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Gửi form tạo đề thi
  const handleCreateExam = async (e) => {
    e.preventDefault();
    setFormErrorMsg('');
    setFormSuccessMsg('');

    if (!examCode.trim() || !title.trim() || !subject.trim()) {
      setFormErrorMsg('Vui lòng điền đầy đủ Mã đề, Tiêu đề và Môn học!');
      return;
    }

    // Validate đáp án và câu hỏi
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) {
        setFormErrorMsg(`Câu hỏi ${i + 1} chưa điền nội dung!`);
        return;
      }
      if (q.type === 'trac_nghiem') {
        if (q.options.some(opt => !opt.trim())) {
          setFormErrorMsg(`Câu hỏi trắc nghiệm ${i + 1} chưa điền đủ 4 đáp án lựa chọn!`);
          return;
        }
      }
      if (q.type !== 'tu_luan' && !q.correct_answer.trim()) {
        setFormErrorMsg(`Câu hỏi ${i + 1} chưa nhập đáp án đúng!`);
        return;
      }
    }

    setFormLoading(true);
    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'create_exam',
          token: localStorage.getItem('exam_token'),
          exam_code: examCode.trim().toUpperCase(),
          title: title.trim(),
          subject: subject.trim(),
          duration_mins: parseInt(durationMins),
          created_by: user.username,
          server: server,
          max_attempts: maxAttempts,
          questions: questions
        })
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccessMsg('Đã tạo đề thi và tải danh sách câu hỏi thành công!');
        // Reset form
        setExamCode('');
        setTitle('');
        setSubject('Toán học');
        setMaxAttempts(-1);
        setQuestions([{ type: 'trac_nghiem', content: '', options: ['', '', '', ''], correct_answer: 'A', hint: '', image_base64: '' }]);
      } else {
        setFormErrorMsg(data.message || 'Lỗi khi tạo đề thi.');
      }
    } catch (err) {
      setFormErrorMsg('Không kết nối được server để tạo đề thi!');
    } finally {
      setFormLoading(false);
    }
  };

  // Gửi yêu cầu tự động tạo Server mới
  const handleCreateServer = async (e) => {
    e.preventDefault();
    setServerFormError('');
    setServerFormSuccess('');

    if (!newServerName.trim()) {
      setServerFormError('Vui lòng nhập tên server!');
      return;
    }

    setServerFormLoading(true);
    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'create_server',
          token: localStorage.getItem('exam_token'),
          server_name: newServerName.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setServerFormSuccess(data.message);
        setNewServerName('');
        // Cập nhật danh sách server hiển thị cục bộ
        setServersList([...serversList, data.server]);
      } else {
        setServerFormError(data.message || 'Lỗi khi tạo server.');
      }
    } catch (err) {
      setServerFormError('Không kết nối được server để tạo!');
    } finally {
      setServerFormLoading(false);
    }
  };

  const showLoadingBar = loadingStats || loadingExams || loadingDetails || loadingSubDetail || loadingServers || formLoading || serverFormLoading;

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
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>QUẢN TRỊ VIÊN</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Hệ thống quản lý phòng thi</span>
            </div>
          </div>

          <div className="header-user-actions">
            <div className="header-user-info">
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.name}</span>
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

      {/* Tabs navigation */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', gap: '1.5rem', padding: '0.5rem 1.5rem' }}>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '0.75rem 0.5rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'stats' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'stats' ? 'var(--primary)' : 'var(--secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <BarChart3 size={16} /> Thống Kê & Giám Sát Realtime
          </button>
          
          <button
            onClick={() => setActiveTab('create')}
            style={{
              padding: '0.75rem 0.5rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'create' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'create' ? 'var(--primary)' : 'var(--secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <PlusCircle size={16} /> Soạn Đề Thi Mới
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            style={{
              padding: '0.75rem 0.5rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'exams' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'exams' ? 'var(--primary)' : 'var(--secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <BookOpen size={16} /> Danh Sách Đề Thi Đã Tạo
          </button>

          <button
            onClick={() => setActiveTab('students')}
            style={{
              padding: '0.75rem 0.5rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'students' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'students' ? 'var(--primary)' : 'var(--secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Users size={16} /> Quản Lý Học Sinh
          </button>

          <button
            onClick={() => setActiveTab('manage_servers')}
            style={{
              padding: '0.75rem 0.5rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'manage_servers' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'manage_servers' ? 'var(--primary)' : 'var(--secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Server size={16} /> Quản Lý Server Đề Thi
          </button>
        </div>
      </div>

      <main className="container" style={{ flex: 1, marginTop: '1.5rem' }}>
        
        {/* ===================== TAB THỐNG KÊ & GIÁM SÁT ===================== */}
        {activeTab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Bộ lọc đề thi */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Lọc dữ liệu theo Mã Đề</h3>
                <p style={{ color: 'var(--secondary)', fontSize: '0.8rem' }}>Xem kết quả điểm số và log chống gian lận</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <select
                  value={selectedExamFilter}
                  onChange={(e) => setSelectedExamFilter(e.target.value)}
                  style={{ width: '200px' }}
                >
                  <option value="all">Tất cả đề thi</option>
                  {examCodesList.map((code, idx) => (
                    <option key={idx} value={code}>{code}</option>
                  ))}
                </select>
                <button className="btn btn-outline" onClick={fetchStats} disabled={loadingStats}>
                  <RefreshCw size={16} className={loadingStats ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Các thẻ chỉ số */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 600 }}>Lượt làm bài</span>
                <strong style={{ display: 'block', fontSize: '2rem', marginTop: '0.25rem' }}>{count}</strong>
              </div>
              <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 600 }}>Điểm trung bình</span>
                <strong style={{ display: 'block', fontSize: '2rem', marginTop: '0.25rem' }}>{avg}</strong>
              </div>
              <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 600 }}>Điểm cao nhất</span>
                <strong style={{ display: 'block', fontSize: '2rem', marginTop: '0.25rem' }}>{max}</strong>
              </div>
              <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 600 }}>Số vụ gian lận ghi nhận</span>
                <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
                  {filteredCheatLogs.length}
                </strong>
              </div>
            </div>

            {/* Grid 2 cột: Bảng điểm và Log gian lận */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', lgGridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              
              {/* Bảng điểm */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} color="var(--primary)" /> Kết Quả Điểm Số Học Sinh
                </h3>
                {loadingStats ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải kết quả...</div>
                ) : filteredSubmissions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)' }}>Chưa có lượt nộp bài nào.</div>
                ) : (
                  <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th style={{ whiteSpace: 'nowrap' }}>Tên Học Sinh</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Lớp</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Mã Đề</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Điểm Số</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Nộp Bài</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Bài Làm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubmissions.map((sub, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{sub.student_name}</td>
                            <td style={{ whiteSpace: 'nowrap' }}><span className="badge badge-success">{sub.class}</span></td>
                            <td style={{ whiteSpace: 'nowrap' }}>{sub.exam_code}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <strong style={{ color: sub.score >= 5 ? 'var(--success)' : 'var(--danger)' }}>
                                {sub.score} / 10
                              </strong>
                            </td>
                            <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(sub.timestamp).toLocaleString()}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <button
                                className="btn btn-outline"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
                                onClick={() => viewStudentSubmission(sub.submission_id)}
                              >
                                <Eye size={12} /> Chi Tiết
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Log Gian Lận */}
              <div className="card" style={{ overflow: 'hidden', border: '1px solid var(--danger-light)' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--danger)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertOctagon size={18} /> Nhật Ký Gian Lận Thời Gian Thực
                </h3>
                {loadingStats ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải nhật ký...</div>
                ) : filteredCheatLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)' }}>Chưa ghi nhận vi phạm nào.</div>
                ) : (
                  <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th style={{ whiteSpace: 'nowrap' }}>Học Sinh</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Lớp</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Hành Vi</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Thời Gian</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Chi Tiết</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCheatLogs.map((log, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{log.student_name}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{log.class}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span className="badge badge-danger" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                {log.event_type}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                            <td style={{ fontSize: '0.85rem', minWidth: '250px' }}>{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ===================== TAB SOẠN ĐỀ THI MỚI ===================== */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateExam} className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Thông Tin Chung Đề Thi</h3>
              <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Thiết lập mã đề và cấu hình cơ bản</p>
            </div>

            {formErrorMsg && (
              <div className="badge-danger" style={{ padding: '0.75rem 1rem', borderRadius: '8px', display: 'block', textAlign: 'center' }}>
                {formErrorMsg}
              </div>
            )}

            {formSuccessMsg && (
              <div className="badge-success" style={{ padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} /> {formSuccessMsg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label>Mã Đề Thi (Phải duy nhất)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: TOAN_12_K1"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tiêu Đề Đề Thi</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kiểm tra Giải tích Chương 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Môn Học</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                >
                  {subjectsList.map((sub, sIdx) => (
                    <option key={sIdx} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Thời Gian Làm Bài (Phút)</label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={durationMins}
                  onChange={(e) => setDurationMins(e.target.value)}
                  required
                />
              </div>

               <div className="form-group">
                <label>Chọn Server Lưu Trữ Đề Thi</label>
                <select
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                >
                  {serversList.map((srv) => (
                    <option key={srv.server_id} value={srv.server_id}>
                      Server {srv.server_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Số Lần Làm Bài Tối Đa</label>
                <select
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
                >
                  <option value={-1}>Không giới hạn (Làm bao nhiêu lần cũng được)</option>
                  <option value={1}>1 lần duy nhất</option>
                  <option value={2}>2 lần</option>
                  <option value={3}>3 lần</option>
                  <option value={5}>5 lần</option>
                  <option value={10}>10 lần</option>
                </select>
              </div>
            </div>

            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Câu Hỏi ({questions.length})</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button type="button" className="btn btn-outline" onClick={downloadTemplate} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} title="Tải file mẫu Excel/CSV">
                  Tải File Mẫu (CSV)
                </button>
                <label className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', cursor: 'pointer', margin: 0 }}>
                  Import Đề (CSV)
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleImportCSV(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </label>
                <button type="button" className="btn btn-outline" onClick={addQuestionField} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }}>
                  + Thêm Câu Hỏi
                </button>
              </div>
            </div>

            {/* Vùng các câu hỏi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {questions.map((q, idx) => (
                <div key={idx} style={{
                  padding: '1.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  position: 'relative'
                }}>
                  
                  {/* Tiêu đề câu và nút xóa */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>Câu Hỏi {idx + 1}</strong>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '0.35rem', borderRadius: '6px' }}
                        onClick={() => removeQuestionField(idx)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Chọn loại câu hỏi */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label>Loại câu hỏi</label>
                      <select
                        value={q.type}
                        onChange={(e) => updateQuestionData(idx, 'type', e.target.value)}
                      >
                        <option value="trac_nghiem">Trắc nghiệm</option>
                        <option value="dien_khuyet">Điền vào ô trống</option>
                        <option value="viet_lai_cau">Viết lại câu</option>
                        <option value="tu_luan">Tự luận</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label><Image size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Đính kèm ảnh (Tùy chọn)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(idx, e.target.files[0])}
                        style={{ fontSize: '0.8rem', padding: '0.35rem' }}
                      />
                      {q.image_base64 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>✓ Đã tải ảnh lên bộ nhớ tạm</span>
                      )}
                    </div>
                  </div>
                  {/* Cấu hình hỗ trợ AI chấm điểm tự động (chỉ cho tự luận) */}
                  {q.type === 'tu_luan' && (
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <input
                        type="checkbox"
                        id={`use_ai_${idx}`}
                        checked={!!q.use_ai}
                        onChange={(e) => updateQuestionData(idx, 'use_ai', e.target.checked)}
                        style={{ width: '1.05rem', height: '1.05rem' }}
                      />
                      <label htmlFor={`use_ai_${idx}`} style={{ cursor: 'pointer', margin: 0 }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>💡 Sử dụng AI (Gemini) để hỗ trợ chấm câu này</span>
                      </label>
                    </div>
                  )}

                  {/* Nội dung câu hỏi */}
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Nội dung câu hỏi</label>
                    <textarea
                      placeholder="Nhập nội dung câu hỏi..."
                      rows={3}
                      value={q.content}
                      onChange={(e) => updateQuestionData(idx, 'content', e.target.value)}
                      required
                    />
                  </div>

                  {/* 1. Điền thông tin nếu là trắc nghiệm */}
                  {q.type === 'trac_nghiem' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '3px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <label style={{ margin: 0 }}>Nhập các tùy chọn đáp án</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => removeOptionFromQuestion(idx)}
                            disabled={q.options.length <= 2}
                          >
                            - Bớt lựa chọn
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }}
                            onClick={() => addOptionToQuestion(idx)}
                            disabled={q.options.length >= 26}
                          >
                            + Thêm lựa chọn
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700 }}>{String.fromCharCode(65 + optIdx)}.</span>
                            <input
                              type="text"
                              placeholder={`Nhập đáp án ${String.fromCharCode(65 + optIdx)}`}
                              value={opt}
                              onChange={(e) => updateQuestionOption(idx, optIdx, e.target.value)}
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Đáp án đúng (cho trắc nghiệm, điền khuyết, viết lại câu) */}
                  {q.type !== 'tu_luan' && (
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>Đáp án đúng để chấm tự động</label>
                      {q.type === 'trac_nghiem' ? (
                        <select
                          value={q.correct_answer}
                          onChange={(e) => updateQuestionData(idx, 'correct_answer', e.target.value)}
                          style={{ maxWidth: '150px' }}
                        >
                          {q.options.map((_, optIdx) => {
                            const letter = String.fromCharCode(65 + optIdx);
                            return (
                              <option key={optIdx} value={letter}>{letter}</option>
                            );
                          })}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder={q.type === 'dien_khuyet' ? "Ví dụ: photosynthesis" : "Ví dụ: She has been studying English for five years"}
                          value={q.correct_answer}
                          onChange={(e) => updateQuestionData(idx, 'correct_answer', e.target.value)}
                          required
                        />
                      )}
                    </div>
                  )}

                  {/* Gợi ý hỗ trợ (Hint) */}
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label>Gợi ý hỗ trợ trả lời (Tùy chọn - Ví dụ gợi ý công thức, gợi ý nghĩa từ...)</label>
                    <input
                      type="text"
                      placeholder="Gợi ý câu hỏi..."
                      value={q.hint}
                      onChange={(e) => updateQuestionData(idx, 'hint', e.target.value)}
                    />
                  </div>

                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', marginTop: '1rem' }} disabled={formLoading}>
              {formLoading ? 'Đang gửi dữ liệu đề thi...' : 'Tạo Đề Thi Hoàn Tất'}
            </button>
          </form>
        )}

        {/* ===================== TAB QUẢN LÝ SERVER ĐỀ THI ===================== */}
        {activeTab === 'manage_servers' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', lgGridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Danh sách các Server hiện tại */}
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Danh Sách Server Hiện Có</h3>
              <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Các server đề thi đã được đăng ký và hoạt động. Các đề thi sẽ được lưu tự động trên Drive.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {serversList.map((srv) => (
                  <div key={srv.server_id} style={{
                    padding: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-card)'
                  }}>
                    <div>
                      <strong style={{ display: 'block' }}>{srv.server_name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Mã Server: {srv.server_id}</span>
                    </div>
                    <span className="badge badge-success">Đang hoạt động</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form tạo Server mới */}
            <form onSubmit={handleCreateServer} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Tạo Server Đề Thi Mới</h3>
              <p style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>
                Nhập tên địa phương hoặc tên kì thi. Hệ thống sẽ tự động khởi tạo thư mục và cấp quyền Drive cho server này.
              </p>

              {serverFormError && (
                <div className="badge-danger" style={{ padding: '0.75rem 1rem', borderRadius: '8px', textAlign: 'center', display: 'block' }}>
                  {serverFormError}
                </div>
              )}

              {serverFormSuccess && (
                <div className="badge-success" style={{ padding: '0.75rem 1rem', borderRadius: '8px', textAlign: 'center', display: 'block' }}>
                  {serverFormSuccess}
                </div>
              )}

              <div className="form-group">
                <label>Tên Server Đề Thi Mới</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phú Quốc, Hải Phòng, Bình Định"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  disabled={serverFormLoading}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.75rem', width: '100%' }}
                disabled={serverFormLoading}
              >
                {serverFormLoading ? 'Đang khởi tạo thư mục Drive...' : 'Khởi Tạo Server Đề Thi'}
              </button>
            </form>
            {/* Cấu hình Google AI Studio */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: 0 }}>Cấu Hình Google AI Studio (Chấm Bài Tự Luận Tự Động)</h3>
              <p style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>
                Khai báo API Key của Google AI Studio (Gemini) để hệ thống tự động chấm điểm và viết nhận xét chi tiết (thiếu ý nào, đúng/sai ý nào) cho các câu hỏi Tự luận có bật hỗ trợ AI.
              </p>

              {aiConfigError && (
                <div className="badge-danger" style={{ padding: '0.75rem 1rem', borderRadius: '8px', textAlign: 'center', display: 'block' }}>
                  {aiConfigError}
                </div>
              )}

              {aiConfigSuccess && (
                <div className="badge-success" style={{ padding: '0.75rem 1rem', borderRadius: '8px', textAlign: 'center', display: 'block' }}>
                  {aiConfigSuccess}
                </div>
              )}

              <div className="form-group">
                <label>API Key (Gemini API Key)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="password"
                    placeholder={geminiKeyMasked ? `Đã cấu hình: ${geminiKeyMasked}` : "Nhập Gemini API Key từ Google AI Studio..."}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    style={{ flex: 1 }}
                    disabled={aiConfigLoading}
                  />
                  {geminiKeyMasked && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setGeminiKey('');
                        setGeminiKeyMasked('');
                      }}
                      disabled={aiConfigLoading}
                    >
                      Thay đổi
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveGeminiKey}
                disabled={aiConfigLoading}
                style={{ padding: '0.75rem', width: '100%' }}
              >
                {aiConfigLoading ? 'Đang lưu cấu hình API Key...' : 'Lưu Cấu Hình AI Studio'}
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB DANH SÁCH ĐỀ THI ĐÃ TẠO ===================== */}
        {activeTab === 'exams' && (
          <div className="card animate-scale-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>DANH SÁCH ĐỀ THI ĐÃ TẠO</h3>
                <p style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>Xem toàn bộ cấu trúc câu hỏi và đáp án chi tiết các đề thi</p>
              </div>
              <button className="btn btn-outline" onClick={fetchExams} disabled={loadingExams}>
                <RefreshCw size={16} className={loadingExams ? 'animate-spin' : ''} /> Tải Lại Danh Sách
              </button>
            </div>

            {loadingExams ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)' }}>Đang tải danh sách đề thi...</div>
            ) : examsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                Không tìm thấy đề thi nào trên toàn bộ các Server. Hãy thử tạo đề thi mới!
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Mã Đề</th>
                      <th>Tiêu Đề Đề Thi</th>
                      <th>Môn Học</th>
                      <th>Thời Gian</th>
                      <th>Lượt Thi Tối Đa</th>
                      <th>Server Lưu Trữ</th>
                      <th>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examsList.map((ex, idx) => {
                      return (
                        <tr key={idx}>
                          <td><strong style={{ color: 'var(--primary)' }}>{ex.exam_code}</strong></td>
                          <td>{ex.title}</td>
                          <td>{ex.subject}</td>
                          <td>{ex.duration_mins} phút</td>
                          <td>{ex.max_attempts === -1 ? 'Không giới hạn' : `${ex.max_attempts} lần`}</td>
                          <td><span className="badge badge-warning">{ex.server_name}</span></td>
                          <td>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.25rem' }}
                              onClick={() => fetchExamDetails(ex.exam_code, ex.server)}
                            >
                              <Eye size={14} /> Xem Chi Tiết
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* ===================== TAB QUẢN LÝ HỌC SINH ===================== */}
        {activeTab === 'students' && (
          <div className="card animate-scale-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>DANH SÁCH HỌC SINH HỆ THỐNG</h3>
                <p style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>Xem thông tin tài khoản và kết quả thi của từng học sinh</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={() => setShowAddStudentModal(true)} style={{ gap: '0.25rem' }}>
                  <PlusCircle size={16} /> Tạo Tài Khoản
                </button>
                <button className="btn btn-outline" onClick={fetchStats} disabled={loadingStats} style={{ gap: '0.25rem' }}>
                  <RefreshCw size={16} className={loadingStats ? 'animate-spin' : ''} /> Tải Lại
                </button>
              </div>
            </div>

            {loadingStats ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)' }}>Đang tải thông tin học sinh...</div>
            ) : studentsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                Không tìm thấy học sinh nào được đăng ký trong Sheets.
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Tài Khoản (Username)</th>
                      <th>Họ Và Tên</th>
                      <th>Lớp</th>
                      <th>Đề Đã Làm</th>
                      <th>Điểm Trung Bình</th>
                      <th>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map((stu, idx) => {
                      const stuSubs = submissions.filter(s => String(s.student_username).trim().toLowerCase() === String(stu.username).trim().toLowerCase());
                      const avgScore = stuSubs.length > 0
                        ? (stuSubs.reduce((sum, s) => sum + s.score, 0) / stuSubs.length).toFixed(1)
                        : 'Chưa thi';
                      
                      return (
                        <tr key={idx}>
                          <td><strong style={{ color: 'var(--primary)' }}>{stu.username}</strong></td>
                          <td style={{ fontWeight: 600 }}>{stu.name}</td>
                          <td><span className="badge badge-success">{stu.class}</span></td>
                          <td><strong>{stuSubs.length}</strong> bài thi</td>
                          <td>
                            <strong style={{ color: avgScore !== 'Chưa thi' && parseFloat(avgScore) >= 5 ? 'var(--success)' : 'var(--secondary)' }}>
                              {avgScore} {avgScore !== 'Chưa thi' ? '/ 10' : ''}
                            </strong>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.25rem' }}
                                onClick={() => {
                                  setSelectedStudent(stu);
                                  setShowStudentHistoryModal(true);
                                }}
                              >
                                <History size={14} /> Lịch Sử
                              </button>
                              <button
                                className="btn btn-outline"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.25rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                                onClick={() => resetStudentPassword(stu.username)}
                              >
                                <RefreshCw size={14} /> Reset MK
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* MODAL LỊCH SỬ THI CỦA MỘT HỌC SINH */}
      {showStudentHistoryModal && selectedStudent && (
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
          zIndex: 9998,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card animate-scale-in" style={{ maxWidth: '650px', width: '95%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '2rem', backgroundColor: 'var(--bg-card)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Lịch Sử Thi - {selectedStudent.name}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>
                  Lớp: {selectedStudent.class} | Tài khoản: {selectedStudent.username}
                </span>
              </div>
              <button className="btn btn-outline" onClick={() => { setShowStudentHistoryModal(false); setSelectedStudent(null); }} style={{ padding: '0.4rem' }}>
                ✕
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {submissions.filter(s => String(s.student_username).trim().toLowerCase() === String(selectedStudent.username).trim().toLowerCase()).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)' }}>Học sinh này chưa tham gia bài thi nào.</div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Mã Đề</th>
                        <th>Điểm Số</th>
                        <th>Thời Gian Nộp</th>
                        <th>Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions
                        .filter(s => String(s.student_username).trim().toLowerCase() === String(selectedStudent.username).trim().toLowerCase())
                        .map((sub, idx) => (
                          <tr key={idx}>
                            <td><strong style={{ color: 'var(--primary)' }}>{sub.exam_code}</strong></td>
                            <td>
                              <strong style={{ color: sub.score >= 5 ? 'var(--success)' : 'var(--danger)' }}>
                                {sub.score} / 10
                              </strong>
                            </td>
                            <td style={{ fontSize: '0.8rem' }}>{new Date(sub.timestamp).toLocaleString()}</td>
                            <td>
                              <button
                                className="btn btn-outline"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                onClick={() => viewStudentSubmission(sub.submission_id)}
                              >
                                Xem Chi Tiết
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => { setShowStudentHistoryModal(false); setSelectedStudent(null); }}>Đóng</button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT BÀI LÀM CỦA HỌC SINH (ĐÚNG XANH, SAI ĐỎ) */}
      {showSubDetailModal && (
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
          <div className="card animate-scale-in" style={{ maxWidth: '800px', width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '2rem', backgroundColor: 'var(--bg-card)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Bài Làm Chi Tiết: Đề {studentSubDetail?.submission?.exam_code}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>
                  Học sinh: {studentSubDetail?.submission?.student_username} | Điểm số: <strong style={{ color: 'var(--success)' }}>{studentSubDetail?.submission?.score} / 10</strong>
                </span>
              </div>
              <button className="btn btn-outline" onClick={() => { setShowSubDetailModal(false); setStudentSubDetail(null); }} style={{ padding: '0.4rem' }}>
                ✕
              </button>
            </div>

            {loadingSubDetail ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)', flex: 1 }}>Đang tải bài làm chi tiết...</div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {studentSubDetail?.questions?.map((q, qIdx) => {
                  const studentAns = studentSubDetail.submission.answers[q.question_id] || '';
                  const isCorrect = q.type === 'trac_nghiem' || q.type === 'dien_khuyet' || q.type === 'viet_lai_cau'
                    ? String(studentAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()
                    : null;

                  return (
                    <div key={qIdx} style={{
                      padding: '1rem',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${isCorrect === true ? 'var(--success)' : isCorrect === false ? 'var(--danger)' : 'var(--warning)'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Câu {qIdx + 1}</span>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{getQuestionTypeLabel(q.type)}</span>
                          {isCorrect === true && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>ĐÚNG</span>}
                          {isCorrect === false && <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>SAI</span>}
                          {isCorrect === null && <span className="badge badge-warning" style={{ fontSize: '0.7rem', color: '#b45309' }}>TỰ LUẬN</span>}
                        </div>
                      </div>

                      <p style={{ fontWeight: 500, whiteSpace: 'pre-wrap', marginBottom: '0.75rem' }}>{q.content}</p>
                      
                      {q.image_url && (
                        <img src={q.image_url} alt="Attachment" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '6px', marginBottom: '0.75rem', display: 'block' }} />
                      )}

                      {/* Trắc nghiệm */}
                      {q.type === 'trac_nghiem' && q.options && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          {q.options.map((opt, oIdx) => {
                            const letter = String.fromCharCode(65 + oIdx);
                            const isSelected = studentAns === letter;
                            const isCorrectOption = q.correct_answer === letter;
                            
                            let optionBorderColor = 'var(--border)';
                            let optionBgColor = 'transparent';
                            let optionTextColor = 'inherit';
                            
                            if (isCorrectOption) {
                              optionBorderColor = 'var(--success)';
                              optionBgColor = 'var(--success-light)';
                              optionTextColor = 'var(--success)';
                            } else if (isSelected && !isCorrectOption) {
                              optionBorderColor = 'var(--danger)';
                              optionBgColor = 'var(--danger-light)';
                              optionTextColor = 'var(--danger)';
                            }

                            return (
                              <div key={oIdx} style={{
                                padding: '0.5rem 0.75rem',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                borderColor: optionBorderColor,
                                backgroundColor: optionBgColor,
                                color: optionTextColor,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: (isSelected || isCorrectOption) ? 600 : 400
                              }}>
                                <span style={{ fontWeight: 700 }}>{letter}.</span>
                                <span>{opt}</span>
                                {isSelected && <span style={{ fontSize: '0.75rem', marginLeft: 'auto', fontStyle: 'italic' }}>(Học sinh chọn)</span>}
                                {isCorrectOption && !isSelected && <span style={{ fontSize: '0.75rem', marginLeft: 'auto', fontStyle: 'italic' }}>(Đáp án đúng)</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Điền khuyết / Viết lại câu */}
                      {q.type !== 'trac_nghiem' && q.type !== 'tu_luan' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                          <div style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            border: `1px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}`,
                            backgroundColor: isCorrect ? 'var(--success-light)' : 'var(--danger-light)',
                            color: isCorrect ? 'var(--success)' : 'var(--danger)'
                          }}>
                            <strong>Học sinh viết:</strong> {studentAns || '(Bỏ trống)'}
                          </div>
                          {!isCorrect && (
                            <div style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: '6px',
                              border: '1px solid var(--success)',
                              backgroundColor: 'var(--success-light)',
                              color: 'var(--success)'
                            }}>
                              <strong>Đáp án đúng:</strong> {q.correct_answer}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tự luận */}
                      {q.type === 'tu_luan' && (
                        <div style={{
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          backgroundColor: '#f8fafc',
                          fontSize: '0.9rem',
                          whiteSpace: 'pre-wrap'
                        }}>
                          <strong>Bài làm học sinh:</strong>
                          <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#334155' }}>
                            {studentAns || '(Bỏ trống bài làm tự luận)'}
                          </p>
                        </div>
                      )}

                      {/* Nhận xét AI Gemini */}
                      {studentSubDetail?.submission?.ai_feedback && studentSubDetail.submission.ai_feedback[q.question_id] && (
                        <div style={{
                          marginTop: '0.75rem',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: '1px solid var(--primary)',
                          backgroundColor: 'var(--primary-light)',
                          fontSize: '0.9rem'
                        }}>
                          <h5 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            💡 Nhận Xét & Điểm Từ AI (Gemini):
                          </h5>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Điểm AI chấm:</strong> <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{studentSubDetail.submission.ai_feedback[q.question_id].score} / 10.0</span>
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            <strong>Lời phê chi tiết:</strong><br />
                            {studentSubDetail.submission.ai_feedback[q.question_id].comment}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => { setShowSubDetailModal(false); setStudentSubDetail(null); }}>Đóng</button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL HIỂN THỊ CHI TIẾT ĐỀ THI CỦA GIÁO VIÊN */}
      {showDetailsModal && (
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
          <div className="card animate-scale-in" style={{ maxWidth: '800px', width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', backgroundColor: 'var(--bg-card)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Đề Thi: {selectedExamDetails?.exam?.exam_code}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>
                  {selectedExamDetails?.exam?.title} | Môn: {selectedExamDetails?.exam?.subject} | Thời gian: {selectedExamDetails?.exam?.duration_mins} phút
                </span>
              </div>
              <button className="btn btn-outline" onClick={() => { setShowDetailsModal(false); setSelectedExamDetails(null); }} style={{ padding: '0.4rem' }}>
                ✕
              </button>
            </div>

            {loadingDetails ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)', flex: 1 }}>Đang tải câu hỏi từ server...</div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {selectedExamDetails?.questions?.map((q, qIdx) => {
                  return (
                    <div key={qIdx} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Câu {qIdx + 1}</span>
                        <span className="badge badge-warning">{getQuestionTypeLabel(q.type)}</span>
                      </div>
                      <p style={{ fontWeight: 500, whiteSpace: 'pre-wrap', marginBottom: '0.75rem' }}>{q.content}</p>
                      
                      {q.image_url && (
                        <img src={q.image_url} alt="Attachment" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '6px', marginBottom: '0.75rem', display: 'block' }} />
                      )}

                      {/* Trắc nghiệm */}
                      {q.type === 'trac_nghiem' && q.options && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          {q.options.map((opt, oIdx) => {
                            const letter = String.fromCharCode(65 + oIdx);
                            const isCorrect = q.correct_answer === letter;
                            return (
                              <div key={oIdx} style={{
                                padding: '0.5rem 0.75rem',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                borderColor: isCorrect ? 'var(--success)' : 'var(--border)',
                                backgroundColor: isCorrect ? 'var(--success-light)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                <span style={{ fontWeight: 700 }}>{letter}.</span>
                                <span>{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Tự luận / điền khuyết / viết lại câu */}
                      {q.type !== 'trac_nghiem' && (
                        <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--success-light)', borderRadius: '6px', color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                          Đáp án đúng: {q.correct_answer}
                        </div>
                      )}

                      {q.hint && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontStyle: 'italic' }}>
                          Gợi ý: {q.hint}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => { setShowDetailsModal(false); setSelectedExamDetails(null); }}>Đóng</button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL TẠO TÀI KHOẢN HỌC SINH MỚI */}
      {showAddStudentModal && (
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
          <div className="card animate-scale-in" style={{ maxWidth: '450px', width: '95%', padding: '2rem', backgroundColor: 'var(--bg-card)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>TẠO TÀI KHOẢN HỌC SINH</h3>
              <button className="btn btn-outline" onClick={() => { setShowAddStudentModal(false); }} style={{ padding: '0.4rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={createStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Tên Tài Khoản (Username)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: student03"
                  value={newStudentUsername}
                  onChange={(e) => setNewStudentUsername(e.target.value)}
                  disabled={createStudentLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Họ Và Tên Học Sinh</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn C"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  disabled={createStudentLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Lớp</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 12A1"
                  value={newStudentClass}
                  onChange={(e) => setNewStudentClass(e.target.value)}
                  disabled={createStudentLoading}
                  required
                />
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                <strong>Lưu ý:</strong> Mật khẩu mặc định khởi tạo sẽ là <strong>examonline123</strong>. Học sinh sẽ bắt buộc phải đổi mật khẩu mới trong lần đầu tiên đăng nhập.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddStudentModal(false)} disabled={createStudentLoading}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={createStudentLoading}>
                  {createStudentLoading ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
