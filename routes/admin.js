const express = require('express');
const router = express.Router();
const db = require('../db'); // DB 커넥션 풀 임포트

// [GET] 관리자 대시보드 페이지 렌더링
router.get('/', async (req, res) => {
  try {
    // 1. 전체 문의 내역 최신순 조회
    const [inquiries] = await db.execute('SELECT * FROM inquiries ORDER BY id DESC');

    // 2. 대시보드 통계 계산 (상태별 카운트)
    const stats = {
      total: inquiries.length,
      received: inquiries.filter(item => item.status === '접수완료').length,
      progress: inquiries.filter(item => item.status === '상담중').length,
      completed: inquiries.filter(item => item.status === '상담완료').length,
      pending: inquiries.filter(item => item.status === '보류').length
    };

    res.render('pages/admin', {
      title: '무드카중고차수출 - 관리자 대시보드',
      pageCss: 'admin',    // public/css/pages/admin.css 로드
      pageJs: 'admin',      // public/js/pages/admin.js 로드
      inquiries: inquiries,
      stats: stats
    });

  } catch (error) {
    console.error('[Admin DB Error] 대시보드 데이터 조회 실패:', error);
    res.status(500).send('관리자 데이터베이스 조회 중 에러가 발생했습니다.');
  }
});

// [POST] 상담 상태 수정 API
router.post('/inquiry/update-status', async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ 
        success: false, 
        message: '문의 ID와 상태값은 필수 파라미터입니다.' 
      });
    }

    const allowedStatus = ['접수완료', '상담중', '상담완료', '보류'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: '허용되지 않는 상태값입니다.' 
      });
    }

    const query = 'UPDATE inquiries SET status = ? WHERE id = ?';
    const [result] = await db.execute(query, [status, id]);

    if (result.affectedRows > 0) {
      return res.status(200).json({ 
        success: true, 
        message: '상담 상태가 변경되었습니다.' 
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        message: '해당 문의 내역을 찾을 수 없습니다.' 
      });
    }

  } catch (error) {
    console.error('[Admin DB Error] 상태 수정 실패:', error);
    return res.status(500).json({ 
      success: false, 
      message: '서버 에러로 인해 상태 변경이 실패했습니다.' 
    });
  }
});

module.exports = router;
