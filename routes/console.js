const express = require('express');
const router = express.Router();
const db = require('../db'); // DB 커넥션 풀 임포트
const bcrypt = require('bcryptjs'); // 비밀번호 해시 검증용
const jwt = require('jsonwebtoken'); // JWT 토큰 처리용

const JWT_SECRET = process.env.JWT_SECRET || 'emocar_jwt_secret_key_default';

// [Middleware] JWT 로그인 인증 체크 미들웨어
const checkAuth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/console/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded; // 검증 성공 시 요청 객체에 주입
    next();
  } catch (error) {
    console.warn('[Console JWT Warning] 인증되지 않은 토큰 접근 차단:', error.message);
    res.clearCookie('token'); // 만료 또는 변조된 토큰 삭제
    return res.redirect('/console/login');
  }
};

// [GET] 로그인 페이지 렌더링
router.get('/login', (req, res) => {
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      return res.redirect('/console');
    } catch (e) {
      res.clearCookie('token');
    }
  }
  res.render('pages/console_login', {
    title: '이모카 - 관리자 로그인',
    pageCss: 'console_login',
    pageJs: 'console_login'
  });
});

// [POST] 로그인 API
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '아이디와 비밀번호를 모두 입력해주세요.' 
      });
    }

    // 관리자 조회
    const [users] = await db.execute('SELECT * FROM admin_users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: '존재하지 않는 아이디이거나 비밀번호가 일치하지 않습니다.' 
      });
    }

    const user = users[0];

    // 비밀번호 체크 (bcrypt 검증 및 평문 비교 병행 처리로 사용자가 평문 등록 시 오작동 방지)
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (e) {
      // bcrypt 형식 해시가 아닐 경우의 에러 무시
    }

    const isPlainMatch = (password === user.password);

    if (!isMatch && !isPlainMatch) {
      return res.status(401).json({ 
        success: false, 
        message: '존재하지 않는 아이디이거나 비밀번호가 일치하지 않습니다.' 
      });
    }

    // JWT 토큰 서명 발행 (유효기간 2시간)
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // HttpOnly 쿠키에 토큰 피팅 (Vercel 배포 HTTPS 환경 대비 secure 속성 유동 매핑)
    res.cookie('token', token, {
      maxAge: 1000 * 60 * 60 * 2, // 2시간
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Vercel 라이브 배포 시 true 설정됨
      sameSite: 'lax'
    });

    return res.status(200).json({ 
      success: true, 
      message: '로그인이 성공적으로 완료되었습니다.' 
    });

  } catch (error) {
    console.error('[Console Login Error] 로그인 실패:', error);
    return res.status(500).json({ 
      success: false, 
      message: '서버 에러로 로그인 처리가 실패했습니다.' 
    });
  }
});

// [GET] 로그아웃 API
router.get('/logout', (req, res) => {
  res.clearCookie('token'); // 토큰 쿠키 파괴
  res.redirect('/console/login');
});

// [GET] 관리자 대시보드 페이지 렌더링 (인증 미들웨어 적용)
router.get('/', checkAuth, async (req, res) => {
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

    res.render('pages/console', {
      title: '이모카 - 관리자 대시보드',
      pageCss: 'console',    // public/css/pages/console.css 로드
      pageJs: 'console',      // public/js/pages/console.js 로드
      inquiries: inquiries,
      stats: stats,
      adminUser: req.admin // JWT 디코딩 유저 정보 전달
    });

  } catch (error) {
    console.error('[Console DB Error] 대시보드 데이터 조회 실패:', error);
    res.status(500).send('관리자 데이터베이스 조회 중 에러가 발생했습니다.');
  }
});

// [POST] 상담 상태 수정 API (인증 미들웨어 적용)
router.post('/inquiry/update-status', checkAuth, async (req, res) => {
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
    console.error('[Console DB Error] 상태 수정 실패:', error);
    return res.status(500).json({ 
      success: false, 
      message: '서버 에러로 인해 상태 변경이 실패했습니다.' 
    });
  }
});

module.exports = router;
