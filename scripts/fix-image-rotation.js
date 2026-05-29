/**
 * JPG → WebP 변환 스크립트 (EXIF 회전 자동 적용)
 * 1. 기존 webp 파일 삭제
 * 2. JPG 원본을 sharp로 읽어 EXIF orientation 픽셀 반영 후 WebP로 저장
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const IMAGE_DIR = path.join(__dirname, '../public/images/user');

async function convertJpgToWebp() {
  const allFiles = fs.readdirSync(IMAGE_DIR);
  const jpgFiles = allFiles.filter(f => f.toLowerCase().endsWith('.jpg'));
  const webpFiles = allFiles.filter(f => f.toLowerCase().endsWith('.webp'));

  // 1. 기존 webp 전부 삭제
  console.log(`🗑  기존 webp ${webpFiles.length}개 삭제 중...`);
  webpFiles.forEach(f => {
    fs.unlinkSync(path.join(IMAGE_DIR, f));
    console.log(`   삭제: ${f}`);
  });

  // 2. JPG → WebP 변환 (EXIF 회전 자동 적용)
  console.log(`\n🔄 JPG → WebP 변환 시작 (총 ${jpgFiles.length}개)...\n`);
  for (const file of jpgFiles) {
    const srcPath = path.join(IMAGE_DIR, file);
    const destName = file.replace(/\.jpg$/i, '.webp');
    const destPath = path.join(IMAGE_DIR, destName);

    try {
      await sharp(srcPath)
        .rotate()            // EXIF orientation 자동 읽어 픽셀 회전 적용 후 메타데이터 제거
        .webp({ quality: 88 })
        .toFile(destPath);
      console.log(`✅ ${file} → ${destName}`);
    } catch (err) {
      console.error(`❌ 실패: ${file} - ${err.message}`);
    }
  }

  console.log('\n🎉 변환 완료!');
}

convertJpgToWebp();
