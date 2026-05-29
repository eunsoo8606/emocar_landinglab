require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// EJS 템플릿 엔진 설정을 위한 경로 지정
// 뷰 파일들을 모아둘 views 폴더를 절대 경로로 바인딩합니다.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// static 미들웨어를 사용해 정적 자원(CSS, JS, Images)을 배포합니다.
// 브라우저에서 '/css/common.css' 같은 경로로 다이렉트 접근이 가능하도록 public 폴더를 지정합니다.
app.use(express.static(path.join(__dirname, 'public')));

// URL 인코딩 및 JSON 형태의 리퀘스트 바디를 파싱하기 위한 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// cookie-parser 미들웨어 마운트 (JWT 토큰 검증용)
app.use(cookieParser());

// 라우터 모듈 가져오기
const indexRouter = require('./routes/index');
const consoleRouter = require('./routes/console');

// 메인 라우터 등록
app.use('/', indexRouter);
app.use('/console', consoleRouter);

// 존재하지 않는 경로 요청 시 404 에러 처리 미들웨어
app.use((req, res, next) => {
  const err = new Error('Page Not Found');
  err.status = 404;
  next(err);
});

// 전역 에러 핸들러
// 운영 환경에서 상세 에러 유출을 방지하고 통합된 에러 페이지를 제공하기 위한 로직입니다.
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  // 개발 환경인 경우에만 스택 트레이스 등 에러의 상세 정보를 노출시킵니다.
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  
  // 에러 발생 시 공통 에러 응답 제공
  res.render('pages/error', { 
    title: 'Error',
    pageCss: 'error',
    pageJs: null 
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
