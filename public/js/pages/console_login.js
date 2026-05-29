/**
 * Moodcar Console Login Interaction Scripts (console_login.js)
 * 관리자 로그인 화면 비동기 제출 제어 스크립트입니다.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('consoleLoginForm');
  const errorMessageBox = document.getElementById('error-message-box');
  const errorText = document.getElementById('error-text');
  
  const submitBtn = document.getElementById('btn-login-submit');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnIcon = submitBtn.querySelector('.btn-icon');
  const spinner = submitBtn.querySelector('.spinner');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // 기본 폼 제출 차단

      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');

      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      // 1. 유효성 검사
      if (!username || !password) {
        showError('아이디와 비밀번호를 모두 기입해 주세요.');
        return;
      }

      // 2. 로딩 상태 활성화 (버튼 비활성화 및 스피너 연출)
      setLoading(true);
      hideError();

      try {
        // 3. 비동기 로그인 API 호출
        const response = await fetch('/console/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // 로그인 성공 시 대시보드 화면으로 즉시 전환
          window.location.href = '/console';
        } else {
          // 로그인 실패 시 메시지 출력
          showError(data.message || '로그인 인증에 실패했습니다.');
          setLoading(false);
          passwordInput.value = ''; // 비밀번호 입력창 리셋
          passwordInput.focus();
        }

      } catch (err) {
        console.error('로그인 비동기 요청 오류:', err);
        showError('서버와의 통신이 원활하지 않습니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
      }
    });
  }

  // 에러 박스 노출 함수
  function showError(message) {
    if (errorMessageBox && errorText) {
      errorText.textContent = message;
      errorMessageBox.style.display = 'flex';
      
      // 흔들림 애니메이션 트리거
      errorMessageBox.style.animation = 'none';
      errorMessageBox.offsetHeight; // 리플로우 강제
      errorMessageBox.style.animation = 'shake 0.4s ease-in-out';
    }
  }

  // 에러 박스 숨김 함수
  function hideError() {
    if (errorMessageBox) {
      errorMessageBox.style.display = 'none';
    }
  }

  // 로딩 상태 제어 함수
  function setLoading(isLoading) {
    if (submitBtn) {
      submitBtn.disabled = isLoading;
      if (isLoading) {
        btnText.style.opacity = '0';
        btnIcon.style.opacity = '0';
        spinner.style.display = 'block';
      } else {
        btnText.style.opacity = '1';
        btnIcon.style.opacity = '1';
        spinner.style.display = 'none';
      }
    }
  }
});
