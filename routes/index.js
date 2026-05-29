const express = require('express');
const router = express.Router();
const path = require('path'); // 파일 경로 바인딩 목적
const db = require('../db'); // MySQL/MariaDB 연결 풀 불러오기
const sms = require('../sms'); // 알리고 SMS 발송 서비스 모듈 불러오기

// [GET] robots.txt 수동 라우팅 (Vercel 배포 시 정적 라우트 매핑 유실 대처)
router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(__dirname, '../public/robots.txt'));
});

// [GET] sitemap.xml 수동 라우팅
router.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.sendFile(path.join(__dirname, '../public/sitemap.xml'));
});

// [GET] rss.xml 수동 라우팅
router.get('/rss.xml', (req, res) => {
  res.type('application/xml');
  res.sendFile(path.join(__dirname, '../public/rss.xml'));
});

// 메인 랜딩페이지 라우팅
router.get('/', (req, res) => {
  const baseUrl = req.protocol + '://' + req.get('host');
  res.render('pages/index', {
    title: '이모카 - 최고가 보장의 중고차 해외 수출 견적 서비스',
    pageCss: 'index', // public/css/pages/index.css 로드 목적
    pageJs: 'index',   // public/js/pages/index.js 로드 목적
    baseUrl: baseUrl
  });
});

// [POST] 무료 상담 및 견적 문의 접수 API
router.post('/inquiry', async (req, res) => {
  try {
    const { carModel, phone, mileage, carYear } = req.body;

    // 필수 필드 유효성 검사
    if (!carModel || !phone || !mileage) {
      return res.status(400).json({ 
        success: false, 
        message: '차량명, 연락처, 주행거리는 필수 기재 사항입니다.' 
      });
    }

    // inquiries 테이블에 데이터 삽입
    const query = `
      INSERT INTO inquiries (car_model, phone, mileage, car_year, status)
      VALUES (?, ?, ?, ?, '접수완료')
    `;
    
    const [result] = await db.execute(query, [
      carModel, 
      phone, 
      mileage, 
      carYear || null
    ]);

    if (result.affectedRows > 0) {
      // 알리고 SMS 관리자 접수 알림 발송
      // 백그라운드 비동기로 돌려 알리고 API 처리 지연이 사용자 응답 속도를 갉아먹지 않게 차단
      sms.sendAdminNotification(carModel, phone, mileage, carYear).catch(err => {
        console.error('[SMS Async Error] 관리자 문자 알림 발송 실패:', err);
      });

      return res.status(200).json({ 
        success: true, 
        message: '이모카 무료 상담 접수가 성공적으로 완료되었습니다.' 
      });
    } else {
      throw new Error('Database INSERT operation failed');
    }

  } catch (error) {
    console.error('[DB Error] 상담 신청 처리 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '서버 내부 통신 실패로 접수되지 않았습니다. 잠시 후 다시 시도해 주세요.' 
    });
  }
});

module.exports = router;
