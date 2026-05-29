const aligoapi = require('aligoapi');
require('dotenv').config();

// 알리고 AuthData 바인딩
const AuthData = {
  key: process.env.ALIGO_API_KEY || '',
  user_id: process.env.ALIGO_USER_ID || ''
};

/**
 * 신규 문의 발생 시 관리자 휴대폰으로 알림 문자를 발송합니다.
 * @param {string} carModel 차량명
 * @param {string} phone 고객 연락처
 * @param {string} mileage 주행거리
 * @param {string} carYear 연식
 */
const sendAdminNotification = async (carModel, phone, mileage, carYear) => {
  // API 키가 없거나 초기 설정 상태인 경우 에러 없이 경고 처리 후 진행
  if (
    !process.env.ALIGO_API_KEY || 
    process.env.ALIGO_API_KEY.includes('here') || 
    !process.env.ALIGO_USER_ID ||
    process.env.ALIGO_USER_ID.includes('here')
  ) {
    console.warn('[Aligo SMS] API KEY 또는 USER ID가 .env에 설정되지 않아 발송을 건너뜁니다.');
    return;
  }

  const sender = process.env.ALIGO_SENDER || '';
  const receiver = process.env.ALIGO_RECEIVER || '';

  if (!sender || !receiver) {
    console.warn('[Aligo SMS] 발신인(ALIGO_SENDER) 혹은 수신인(ALIGO_RECEIVER) 번호가 설정되지 않았습니다.');
    return;
  }

  // 발송 메세지 구성 (LMS 장문 규격)
  const msg = `[이모카 수출 문의접수]\n차종: ${carModel}\n연락처: ${phone}\n주행거리: ${mileage}\n연식: ${carYear || '미지정'}\n\n* 관리자 페이지 혹은 DB에서 상세 내역을 즉시 조회하세요.`;

  // aligoapi가 사용하는 req 구조 모킹 (headers: {} 필수 추가로 Type Error 우회)
  const mockReq = {
    headers: {},
    body: {
      sender: sender,
      receiver: receiver,
      msg: msg,
      msg_type: 'LMS',
      title: '이모카 수출 문의 알림'
    }
  };

  try {
    const response = await aligoapi.send(mockReq, AuthData);
    console.log('[Aligo SMS] 알림 전송 완료:', response);
    return response;
  } catch (error) {
    console.error('[Aligo SMS Error] 알림 전송 실패:', error);
    // 메인 로직이 실패하지 않도록 에러를 삼키거나 호출부에서 제어할 수 있게 넘김
    throw error;
  }
};

module.exports = {
  sendAdminNotification
};
