import { useEffect, useRef, useState } from 'react';

export const isFullscreenSupported = typeof document !== 'undefined' && !!(
  document.documentElement.requestFullscreen ||
  document.documentElement.webkitRequestFullscreen ||
  document.documentElement.mozRequestFullScreen ||
  document.documentElement.msRequestFullscreen
);

export function useAntiCheat({
  examCode,
  username,
  gasUrl,
  maxViolations = 3,
  isActive = false,
  onViolation = () => {},
  onAutoSubmit = () => {}
}) {
  const [violations, setViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const violationsRef = useRef(0);

  // Cập nhật ref để tránh closure stale state trong event listeners
  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);

  // Hàm gửi log gian lận về server GAS
  const sendCheatLog = async (eventType, details) => {
    if (!gasUrl) return;
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'log_cheat',
          exam_code: examCode,
          username: username,
          event_type: eventType,
          details: details
        })
      });
    } catch (err) {
      console.error('Không gửi được log gian lận:', err);
    }
  };

  const startTimeRef = useRef(0);
  const lastViolationTimeRef = useRef(0);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
    }
  }, [isActive]);

  // Hàm trigger vi phạm
  const triggerViolation = (type, details) => {
    const now = Date.now();

    // Bỏ qua vi phạm trong 3 giây đầu tiên khi vừa bấm bắt đầu thi
    // (Cho phép trình duyệt chuyển đổi sang chế độ Fullscreen mà không bị bắt nhầm sự kiện blur/focus)
    if (now - startTimeRef.current < 3000) {
      console.log('Bỏ qua vi phạm trong thời gian chờ bắt đầu:', type);
      return;
    }

    // Chống ghi nhận trùng lặp liên tục trong vòng 2 giây (chống loop và chống đơ do hội thoại alert)
    if (now - lastViolationTimeRef.current < 2000) {
      console.log('Bỏ qua vi phạm do trùng lặp liên tục:', type);
      return;
    }

    lastViolationTimeRef.current = now;

    const currentCount = violationsRef.current + 1;
    setViolations(currentCount);
    onViolation(currentCount, type, details);
    sendCheatLog(type, details);

    if (currentCount >= maxViolations) {
      onAutoSubmit();
    }
  };

  useEffect(() => {
    if (!isActive) return;

    // 1. Theo dõi Fullscreen (Hỗ trợ các trình duyệt di động)
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFull);
      if (!isFull) {
        triggerViolation('exit_fullscreen', 'Thoát chế độ toàn màn hình');
      }
    };

    // 2. Theo dõi Tab/Chuyển Tab (Page Visibility)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('tab_switch', 'Học sinh chuyển sang tab khác');
      }
    };

    // 3. Theo dõi Window Blur (mở phần mềm khác)
    const handleWindowBlur = () => {
      triggerViolation('tab_switch', 'Học sinh click ra ngoài màn hình trình duyệt');
    };

    // 4. Ngăn chặn Chuột phải & Phím tắt
    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerViolation('right_click', 'Học sinh cố gắng nhấp chuột phải');
    };

    const handleKeyDown = (e) => {
      const key = e.key;
      const ctrlKey = e.ctrlKey || e.metaKey;
      const shiftKey = e.shiftKey;

      // Chặn sao chép, dán, cắt (Ctrl+C, Ctrl+V, Ctrl+X)
      if (ctrlKey && ['c', 'v', 'x', 'C', 'V', 'X'].includes(key)) {
        e.preventDefault();
        triggerViolation('clipboard', `Học sinh nhấn phím tắt sao chép/dán: Ctrl + ${key}`);
      }

      // Chặn F12 (Inspect Element)
      if (key === 'F12') {
        e.preventDefault();
        triggerViolation('devtools', 'Học sinh nhấn F12 mở Công cụ lập trình viên');
      }

      // Chặn Ctrl+Shift+I, Ctrl+Shift+J (Inspect Element Chrome)
      if (ctrlKey && shiftKey && ['I', 'J', 'i', 'j'].includes(key)) {
        e.preventDefault();
        triggerViolation('devtools', `Học sinh nhấn phím tắt mở DevTools: Ctrl+Shift+${key}`);
      }

      // Chặn Ctrl+U (Xem nguồn trang)
      if (ctrlKey && ['u', 'U'].includes(key)) {
        e.preventDefault();
        triggerViolation('devtools', 'Học sinh nhấn phím tắt xem nguồn trang: Ctrl+U');
      }
    };

    // 5. Ghi đè Clipboard thường xuyên
    const blockClipboard = () => {
      navigator.clipboard?.writeText?.("Cảnh báo: Clipboard đã bị vô hiệu hóa trong phòng thi!")
        .catch(() => {});
    };
    const clipboardInterval = setInterval(blockClipboard, 2000);

    // Đăng ký sự kiện
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(clipboardInterval);
    };
  }, [isActive, examCode, username, gasUrl]);

  // Hàm yêu cầu bật Fullscreen chủ động
  const enterFullscreen = () => {
    const docElm = document.documentElement;
    if (docElm.requestFullscreen) {
      docElm.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error('Lỗi khi vào fullscreen:', err));
    } else if (docElm.webkitRequestFullscreen) {
      docElm.webkitRequestFullscreen();
      setIsFullscreen(true);
    } else if (docElm.mozRequestFullScreen) {
      docElm.mozRequestFullScreen();
      setIsFullscreen(true);
    } else if (docElm.msRequestFullscreen) {
      docElm.msRequestFullscreen();
      setIsFullscreen(true);
    } else {
      // Nếu thiết bị không hỗ trợ Fullscreen (ví dụ iPhone Safari), bỏ qua và cho là đã bật
      setIsFullscreen(true);
    }
  };

  return {
    violations,
    isFullscreen,
    isFullscreenSupported,
    enterFullscreen
  };
}
