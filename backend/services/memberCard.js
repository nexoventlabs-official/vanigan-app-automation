/**
 * memberCard.js — pixel-perfect server-side card generator.
 *
 * Matches the html2canvas capture output from MemberCard.jsx exactly:
 *   Card size:   421 × 590px (natural bg image height)
 *   Front bg:    ID_Front.png
 *   Back bg:     ID_Back.png
 *   Combined:    Front | 60px gap | Back, side-by-side (963 × 620px total)
 *
 * Key differences from old version fixed here:
 *   - Green rounded-rect badge for [Assm] and [Dist] labels
 *   - Signature image drawn on back card
 *   - Photo positioned exactly at top:182, centered, 137×136 with r=22 clip
 *   - Back card data starts at top:174 (234-60 translateY from MemberCard.jsx)
 *   - All font sizes / colours match MemberCard.jsx capture mode exactly
 */

const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const axios  = require('axios');
const cloudinary = require('cloudinary').v2;
const QRCode = require('qrcode');

const FRONT_BG    = 'https://res.cloudinary.com/dqndhcmu2/image/upload/v1773232516/vanigan/templates/ID_Front.png';
const BACK_BG     = 'https://res.cloudinary.com/dqndhcmu2/image/upload/v1773232519/vanigan/templates/ID_Back.png';
const SIGNATURE   = path.join(__dirname, '..', 'image', 'signature.png');

const CARD_W = 421;
const CARD_H = 590;   // natural height of both bg images
const GAP    = 60;
const LABEL_H = 30;

/* ── helpers ── */
async function fetchImage(url) {
  try {
    const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    return await loadImage(Buffer.from(r.data));
  } catch { return null; }
}

function formatDob(dob) {
  if (!dob) return '—';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (dob.includes('/')) {
    const [d, m, y] = dob.split('/');
    return `${d} ${months[parseInt(m,10)-1]||m} ${y}`;
  }
  try { return new Date(dob).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
  catch { return dob; }
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text||'').split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

/* ── draw green badge pill (Assm / Dist) ── */
function drawBadge(ctx, label, x, y) {
  // Pill: green bg, white text, r=4
  const PAD_X = 6, PAD_Y = 2;
  ctx.font = 'bold 10px Arial';
  const tw = ctx.measureText(label).width;
  const bw = tw + PAD_X * 2;
  const bh = 16;
  const bx = x;
  const by = y - 12; // align baseline
  const r  = 4;

  ctx.fillStyle = '#009245';
  ctx.beginPath();
  ctx.moveTo(bx + r, by);
  ctx.lineTo(bx + bw - r, by);
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
  ctx.lineTo(bx + bw, by + bh - r);
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
  ctx.lineTo(bx + r, by + bh);
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
  ctx.lineTo(bx, by + r);
  ctx.quadraticCurveTo(bx, by, bx + r, by);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(label.toUpperCase(), bx + PAD_X, by + bh - PAD_Y - 1);

  return bw; // width of badge
}

/* ── FRONT CARD ── */
async function drawFront(ctx, member, frontBg, photo) {
  ctx.drawImage(frontBg, 0, 0, CARD_W, CARD_H);

  /* Photo — top:182, centered, width:137, height:136, borderRadius:22 */
  const photoW = 137, photoH = 136, photoR = 22;
  const photoX = Math.round((CARD_W - photoW) / 2);
  const photoY = 182;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(photoX + photoR, photoY);
  ctx.lineTo(photoX + photoW - photoR, photoY);
  ctx.quadraticCurveTo(photoX + photoW, photoY, photoX + photoW, photoY + photoR);
  ctx.lineTo(photoX + photoW, photoY + photoH - photoR);
  ctx.quadraticCurveTo(photoX + photoW, photoY + photoH, photoX + photoW - photoR, photoY + photoH);
  ctx.lineTo(photoX + photoR, photoY + photoH);
  ctx.quadraticCurveTo(photoX, photoY + photoH, photoX, photoY + photoH - photoR);
  ctx.lineTo(photoX, photoY + photoR);
  ctx.quadraticCurveTo(photoX, photoY, photoX + photoR, photoY);
  ctx.closePath();
  ctx.clip();

  if (photo) {
    ctx.drawImage(photo, photoX, photoY, photoW, photoH);
  } else {
    ctx.fillStyle = 'rgba(0,146,69,0.15)';
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.fillStyle = '#009245';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText((member.name||'M').slice(0,1).toUpperCase(), photoX + photoW/2, photoY + 92);
  }
  ctx.restore();

  /* Text block — top:328, centred, left:28, right:28 */
  const textW = CARD_W - 56;
  let y = 340;

  // Name — green, bold 23px
  ctx.fillStyle = '#009245';
  ctx.font = 'bold 23px Arial';
  ctx.textAlign = 'center';
  const nameLines = wrapText(ctx, (member.name||'').toUpperCase(), textW);
  for (const line of nameLines) { ctx.fillText(line, CARD_W/2, y); y += 28; }
  y += 2;

  // Assembly with green [Assm] badge
  if (member.assemblyName) {
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 19px Arial';
    ctx.textAlign = 'center';
    const asmText = member.assemblyName;
    const asmW = ctx.measureText(asmText).width;
    const badgeGap = 6;
    ctx.font = 'bold 10px Arial';
    const badgeW = ctx.measureText('ASSM').width + 14; // PAD_X*2
    const totalW = asmW + badgeGap + badgeW;
    const startX = (CARD_W - totalW) / 2;

    ctx.font = 'bold 19px Arial';
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'left';
    ctx.fillText(asmText, startX, y);

    drawBadge(ctx, 'Assm', startX + asmW + badgeGap, y);
    y += 26;
  }

  // District with green [Dist] badge
  if (member.district) {
    ctx.font = 'bold 19px Arial';
    const distText = member.district;
    const distW = ctx.measureText(distText).width;
    const badgeGap = 6;
    ctx.font = 'bold 10px Arial';
    const badgeW = ctx.measureText('DIST').width + 14;
    const totalW = distW + badgeGap + badgeW;
    const startX = (CARD_W - totalW) / 2;

    ctx.font = 'bold 19px Arial';
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'left';
    ctx.fillText(distText, startX, y);

    drawBadge(ctx, 'Dist', startX + distW + badgeGap, y);
    y += 26;
  }

  // Zone
  if (member.zone) {
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 19px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(member.zone, CARD_W/2, y);
    y += 26;
  }

  // Membership ID
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(member.membershipId || 'TNVS-000000', CARD_W/2, y);
}

/* ── BACK CARD ── */
async function drawBack(ctx, member, backBg, siteUrl, sigImg) {
  ctx.drawImage(backBg, 0, 0, CARD_W, CARD_H);

  /* Back card data — top:174 (= 234 - 60 translateY from MemberCard.jsx capture) */
  const left   = 22;
  const right  = CARD_W - 20;
  const colW   = right - left;
  const col1W  = Math.round(colW * 0.46);  // label column
  const colonX = left + col1W + 4;          // colon column centre
  const valX   = colonX + 20;              // value column start
  const valW   = right - valX - 4;

  let y = 174;

  function drawRow(label, value, rowH = 20) {
    // Label
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label.toUpperCase(), left, y + 14);

    // Colon — larger font, lower baseline
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(':', colonX + 8, y + 14);

    // Value — wrap if needed
    ctx.font = 'bold 17px Arial';
    ctx.textAlign = 'left';
    const lines = wrapText(ctx, String(value||'—'), valW);
    let vy = y;
    for (const line of lines) {
      ctx.fillText(line, valX, vy + 14);
      vy += 19;
    }
    y += Math.max(rowH, lines.length * 19 + 2);
  }

  drawRow('Date of Birth', formatDob(member.dob));        y += 6;
  drawRow('Age',           String(member.age || '—'));     y += 6;
  drawRow('Blood Group',   member.bloodGroup || '—');      y += 6;
  drawRow('Address',       member.businessAddress || '—', 76); y += 6;

  // Contact — white bg strip behind number (matching MemberCard.jsx)
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('CONTACT', left, y + 14);
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(':', colonX + 8, y + 14);

  const phoneStr = String(member.phone || '—');
  ctx.font = 'bold 17px Arial';
  const phoneW = ctx.measureText(phoneStr).width + 8;
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillRect(valX, y + 2, phoneW, 16);
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'left';
  ctx.fillText(phoneStr, valX + 4, y + 14);
  y += 26;

  /* QR + Signature row — marginTop:28 */
  const qrY = y + 28;
  const qrSize = 96;

  // QR code
  const qrData = `${siteUrl}?page=verify&id=${member.membershipId || 'TNVS-000000'}`;
  try {
    const qrBuf = await QRCode.toBuffer(qrData, { width: qrSize * 3, margin: 1 });
    const qrImg = await loadImage(qrBuf);
    ctx.drawImage(qrImg, left + 8, qrY, qrSize, qrSize);
  } catch {}

  // Signature block — positioned further right, centred around 65% of card width
  const sigAreaX  = Math.round(CARD_W * 0.60); // ~253px from left
  const sigAreaW  = CARD_W - sigAreaX - 4;     // available width ~164px
  const sigAreaCX = sigAreaX + Math.round(sigAreaW / 2);

  if (sigImg) {
    // Draw signature image — width:80, centred in sig area
    const sigDrawW = 80;
    const sigDrawH = Math.round(sigImg.height * (sigDrawW / sigImg.width));
    ctx.drawImage(sigImg, sigAreaCX - sigDrawW/2, qrY, sigDrawW, sigDrawH);

    // Text below signature
    let sy = qrY + sigDrawH + 4;
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('SENTHIL KUMAR N', sigAreaCX, sy);     sy += 18;
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Founder & State President', sigAreaCX, sy); sy += 15;
    ctx.fillText('Tamilnadu Vanigargalin Sangamam', sigAreaCX, sy);
  } else {
    // Fallback — text only
    let sy = qrY + 20;
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('SENTHIL KUMAR N', sigAreaCX, sy);     sy += 18;
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Founder & State President', sigAreaCX, sy); sy += 15;
    ctx.fillText('Tamilnadu Vanigargalin Sangamam', sigAreaCX, sy);
  }
}

/* ── Main export ── */
async function generateAndUploadCard(member) {
  cloudinary.config({
    cloud_name: process.env.MEMBER_CLOUDINARY_NAME,
    api_key:    process.env.MEMBER_CLOUDINARY_KEY,
    api_secret: process.env.MEMBER_CLOUDINARY_SECRET,
  });

  const siteUrl = (process.env.USER_WEBSITE_URL || 'https://vanigan.digital').replace(/\/+$/, '');

  const [frontBg, backBg, photo, sigImg] = await Promise.all([
    fetchImage(FRONT_BG),
    fetchImage(BACK_BG),
    member.photoUrl ? fetchImage(member.photoUrl) : Promise.resolve(null),
    loadImage(SIGNATURE).catch(() => null),
  ]);

  if (!frontBg || !backBg) throw new Error('Could not load card background images');

  const totalW = CARD_W + GAP + CARD_W;
  const totalH = CARD_H + LABEL_H;

  const canvas = createCanvas(totalW, totalH);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalW, totalH);

  // "Front" / "Back" labels
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Front', CARD_W / 2, 20);
  ctx.fillText('Back',  CARD_W + GAP + CARD_W / 2, 20);

  // Front card
  ctx.save();
  ctx.translate(0, LABEL_H);
  await drawFront(ctx, member, frontBg, photo);
  ctx.restore();

  // Back card
  ctx.save();
  ctx.translate(CARD_W + GAP, LABEL_H);
  await drawBack(ctx, member, backBg, siteUrl, sigImg);
  ctx.restore();

  const pngBuffer = canvas.toBuffer('image/png');

  return new Promise((resolve, reject) => {
    const publicId = `vanigan_members/${member.phone}/card/membership_card`;
    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, overwrite: true, resource_type: 'image', format: 'png' },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(pngBuffer);
  });
}

module.exports = { generateAndUploadCard };
