/**
 * Moodcar Admin Dashboard Interactive Scripts (admin.js)
 * 관리자 대시보드 조작 스크립트입니다.
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. 실시간 텍스트 검색 필터
  const searchInput = document.getElementById('admin-search-input');
  const inquiryRows = document.querySelectorAll('.inquiry-row');
  const filterCountEl = document.getElementById('filter-count');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase().replace(/[^a-zA-Z0-9가-힣]/g, ''); // 공백/특수문자 제거 필터링 대비
      let visibleCount = 0;

      inquiryRows.forEach(row => {
        const model = row.querySelector('.cell-model').textContent.toLowerCase();
        const phone = row.querySelector('.phone-num').textContent.replace(/-/g, ''); // 하이픈 제거한 연락처 텍스트 매칭
        
        const isMatch = model.includes(keyword) || phone.includes(keyword);

        if (isMatch) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });

      // 검색결과 건수 갱신
      if (filterCountEl) {
        filterCountEl.textContent = visibleCount;
      }
    });
  }
});

// 2. 고객 연락처 클립보드 원클릭 복사 함수
window.copyToClipboard = async (text, btn) => {
  try {
    await navigator.clipboard.writeText(text);
    
    // 시각적 피드백 제공 (아이콘 일시적 변경)
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = 'fa-solid fa-check';
      btn.style.color = 'var(--success)';
      btn.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';

      setTimeout(() => {
        icon.className = 'fa-regular fa-copy';
        btn.style.color = '';
        btn.style.backgroundColor = '';
      }, 1500);
    }
  } catch (err) {
    console.error('클립보드 복사 실패:', err);
    alert('연락처 복사에 실패했습니다. 수동으로 복사해 주세요.');
  }
};

// 3. 비동기 상담 상태 변경 및 대시보드 건수 갱신 함수 (AJAX)
window.updateInquiryStatus = async (id, select) => {
  const newStatus = select.value;
  const oldStatusClass = Array.from(select.classList).find(c => c.startsWith('status-badge-'));

  try {
    const response = await fetch('/admin/inquiry/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus })
    });

    const data = await response.json();

    if (data.success) {
      // 3-1. 셀렉트 박스 스킨(Badge color) 교체
      if (oldStatusClass) {
        select.classList.remove(oldStatusClass);
      }
      select.classList.add(`status-badge-${newStatus}`);

      // 3-2. 행의 data-status 값 변경
      const row = document.querySelector(`.inquiry-row[data-id="${id}"]`);
      if (row) {
        row.setAttribute('data-status', newStatus);
      }

      // 3-3. 대시보드 상단 요약 카드 숫자 실시간 갱신 (리로드 없이 비동기 동화)
      recalculateStats();

    } else {
      alert(data.message || '상태 변경에 실패했습니다.');
      // 원본 상태로 복귀 (페이지 새로고침)
      window.location.reload();
    }

  } catch (err) {
    console.error('상태 업데이트 AJAX 에러:', err);
    alert('서버와 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.');
    window.location.reload();
  }
};

// 상단 통계 수치 재계산 함수
function recalculateStats() {
  const rows = document.querySelectorAll('.inquiry-row');
  
  let total = rows.length;
  let received = 0;
  let progress = 0;
  let completed = 0;
  let pending = 0;

  rows.forEach(row => {
    const status = row.getAttribute('data-status');
    if (status === '접수완료') received++;
    else if (status === '상담중') progress++;
    else if (status === '상담완료') completed++;
    else if (status === '보류') pending++;
  });

  // DOM 갱신
  document.getElementById('count-total').textContent = total;
  document.getElementById('count-received').textContent = received;
  document.getElementById('count-progress').textContent = progress;
  document.getElementById('count-completed').textContent = completed;
  document.getElementById('count-pending').textContent = pending;
}
