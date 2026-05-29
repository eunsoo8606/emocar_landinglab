const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL/MariaDB 커넥션 풀 구성
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'MOODCAR', // 운영 환경 변수 누락 대비 폴백 기본값 적용
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
