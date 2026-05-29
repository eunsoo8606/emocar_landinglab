/**
 * Emocar Landing Page Interactive Scripts (index.js)
 * 페이지별 전용 JS 스크립트 파일입니다.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 헤더 스크롤 효과 (웜 화이트 반투명 제어)
  const header = document.getElementById('global-header');
  
  window.addEventListener('scroll', () => {
    if (header) {
      if (window.scrollY > 50) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.04)';
      } else {
        header.style.background = 'rgba(255, 255, 255, 0.85)';
        header.style.boxShadow = 'none';
      }
    }
  });

  // 2. 메인 히어로 견적 문의 신청 처리 (AJAX)
  const heroForm = document.getElementById('heroQuoteForm');
  if (heroForm) {
    heroForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const carModel = document.getElementById('car-model').value.trim();
      const phone1 = heroForm.querySelector('input[name="phone1"]').value.trim();
      const phone2 = heroForm.querySelector('input[name="phone2"]').value.trim();
      const phone3 = heroForm.querySelector('input[name="phone3"]').value.trim();
      const mileage = document.getElementById('mileage').value;
      const carYear = document.getElementById('car-year').value.trim();
      const agree = heroForm.querySelector('input[name="agree"]').checked;

      if (!carModel || !phone1 || !phone2 || !phone3 || !mileage) {
        alert('필수 입력 항목을 모두 채워주세요.');
        return;
      }
      if (!agree) {
        alert('개인정보 제공에 동의하셔야 상담 신청이 가능합니다.');
        return;
      }

      const phone = `${phone1}-${phone2}-${phone3}`;

      try {
        const response = await fetch('/inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ carModel, phone, mileage, carYear })
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert('이모카 중고차 수출 무료 상담이 성공적으로 접수되었습니다. 신속하게 연락드리겠습니다.');
          heroForm.reset();
        } else {
          alert(data.message || '상담 신청에 실패했습니다.');
        }
      } catch (err) {
        console.error('상담 신청 처리 오류:', err);
        alert('서버와의 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    });
  }

  // 글로벌 제어 함수 바인딩 (개인정보 모달)
  window.openPolicyModal = () => {
    const modal = document.getElementById('policyModal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closePolicyModal = () => {
    const modal = document.getElementById('policyModal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  };
});
