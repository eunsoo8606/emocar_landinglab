/**
 * Emocar Landing Page Interactive Scripts (index.js)
 * 페이지별 전용 JS 스크립트 파일입니다.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 헤더 스크롤 효과
  const header = document.getElementById('global-header');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.style.background = 'rgba(253, 253, 250, 0.98)';
      header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.04)';
    } else {
      header.style.background = 'rgba(253, 253, 250, 0.85)';
      header.style.boxShadow = 'none';
    }
  });

  // 2. 하단 스티키 견적 바 스크롤 노출 제어
  const stickyBar = document.getElementById('stickyQuoteBar');
  let stickyClosed = false;

  window.addEventListener('scroll', () => {
    if (!stickyBar || stickyClosed) return;

    if (window.scrollY > 400) {
      stickyBar.classList.add('visible');
    } else {
      stickyBar.classList.remove('visible');
    }
  });

  // 3. 요소 페이드업 스크롤 애니메이션 (Intersection Observer 사용)
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.05
  };

  const animObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const featureCards = document.querySelectorAll('.feature-card');
  const sectionHeaders = document.querySelectorAll('.section-header');
  const compareSection = document.querySelector('.compare-section');

  sectionHeaders.forEach(el => animObserver.observe(el));
  featureCards.forEach((el, index) => {
    el.style.transitionDelay = `${index * 0.15}s`;
    animObserver.observe(el);
  });
  if (compareSection) {
    animObserver.observe(compareSection);
  }

  // 4. Swiper 슬라이더 초기화
  // 4-1. 최근 수출 현황 갤러리 슬라이더
  if (document.querySelector('.gallery-swiper')) {
    new Swiper('.gallery-swiper', {
      slidesPerView: 1,
      spaceBetween: 20,
      loop: true,
      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      breakpoints: {
        768: {
          slidesPerView: 2,
          spaceBetween: 24,
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 30,
        }
      }
    });
  }

  // 4-2. 해외 바이어 직거래 현장 인증 슬라이더 (롤링 배너)
  if (document.querySelector('.buyer-cert-swiper')) {
    new Swiper('.buyer-cert-swiper', {
      slidesPerView: 1.3,
      spaceBetween: 16,
      loop: true,
      loopedSlides: 6,
      freeMode: true,
      speed: 6000,
      autoplay: {
        delay: 0,
        disableOnInteraction: false,
      },
      allowTouchMove: false,
      breakpoints: {
        576: {
          slidesPerView: 2.2,
          spaceBetween: 16,
        },
        768: {
          slidesPerView: 3.2,
          spaceBetween: 20,
        },
        1200: {
          slidesPerView: 4.2,
          spaceBetween: 24,
        }
      }
    });
  }

  // 5. 모바일 및 특정 링크 클릭 시 폼 스크롤 포커스
  const focusTargets = document.querySelectorAll('.btn-mobile-quote, .btn-live-action');
  focusTargets.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const targetForm = document.querySelector('.hero-form-area');
      if (targetForm) {
        targetForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const firstInput = document.getElementById('car-model');
        if (firstInput) {
          setTimeout(() => firstInput.focus(), 600);
        }
      }
    });
  });

  // 6. 메인 히어로 견적 문의 신청 처리 (AJAX)
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

  // 글로벌 제어 함수 바인딩
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

  window.closeStickyBar = () => {
    if (stickyBar) {
      stickyBar.classList.remove('visible');
      stickyClosed = true;
    }
  };

  window.handleStickyFormSubmit = async (e) => {
    e.preventDefault();
    const carModel = document.getElementById('sticky-car-model').value.trim();
    const phone = document.getElementById('sticky-phone').value.trim();
    const agree = document.getElementById('sticky-agree').checked;

    if (!carModel || !phone) {
      alert('차량명과 연락처를 모두 입력해 주세요.');
      return;
    }

    if (!agree) {
      alert('개인정보 제공에 동의하셔야 견적 신청이 가능합니다.');
      return;
    }

    try {
      const response = await fetch('/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          carModel, 
          phone, 
          mileage: '미지정(하단바)',
          carYear: '' 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`[이모카 수출 실시간 견적 접수 완료]\n\n차량명: ${carModel}\n연락처: ${phone}\n\n정직하고 신속하게 견적 분석 후 곧 연락드리겠습니다.`);
        document.getElementById('stickyQuoteForm').reset();
        window.closeStickyBar();
      } else {
        alert(data.message || '상담 신청에 실패했습니다.');
      }
    } catch (err) {
      console.error('하단 견적바 신청 처리 오류:', err);
      alert('서버와의 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };
});
