/**
 * zoneData.js
 * Zone lookup for Tamil Nadu assemblies.
 * District → zone, Assembly → zone mapping.
 */

const DISTRICT_ZONE = {
  THIRUVALLUR: 'KANCHI ZONE',
  KANCHEEPURAM: 'KANCHI ZONE',
  CHENGALPATTU: 'KANCHI ZONE',
  CHENNAI: 'CHENNAI ZONE',
  VELLORE: 'VELLORE ZONE',
  KRISHNAGIRI: 'VELLORE ZONE',
  TIRUPATHUR: 'VELLORE ZONE',
  RANIPET: 'VELLORE ZONE',
  DHARMAPURI: 'TIRUVANNAMALAI ZONE',
  TIRUVANNAMALAI: 'TIRUVANNAMALAI ZONE',
  KALLAKURUCHI: 'TIRUVANNAMALAI ZONE',
  VILUPURAM: 'VILLUPURAM ZONE',
  CUDDALORE: 'VILLUPURAM ZONE',
  SALEM: 'SALEM ZONE',
  NAMAKKAL: 'SALEM ZONE',
  ERODE: 'SALEM ZONE',
  NILGIRIS: 'COVAI ZONE',
  COIMBATORE: 'COVAI ZONE',
  TIRUPPUR: 'COVAI ZONE',
  KARUR: 'TRICHY ZONE',
  TIRUCHIRAPALLI: 'TRICHY ZONE',
  PERAMBALUR: 'TRICHY ZONE',
  PUDUKOTTAI: 'TRICHY ZONE',
  ARIYALUR: 'TRICHY ZONE',
  DINDIGUL: 'VIRUDHUNAGAR ZONE',
  THENI: 'VIRUDHUNAGAR ZONE',
  VIRUDHUNAGAR: 'VIRUDHUNAGAR ZONE',
  NAGAPATTINAM: 'THANJAI ZONE',
  THIRUVARUR: 'THANJAI ZONE',
  THANJAVUR: 'THANJAI ZONE',
  MAYILADUTHURAI: 'THANJAI ZONE',
  SIVAGANGA: 'MADURAI ZONE',
  MADURAI: 'MADURAI ZONE',
  RAMANATHAPURAM: 'MADURAI ZONE',
  THOOTHUKUDI: 'TIRUNELVELI ZONE',
  TIRUNELVELI: 'TIRUNELVELI ZONE',
  KANNIYAKUMARI: 'TIRUNELVELI ZONE',
  TENKASI: 'TIRUNELVELI ZONE',
};

/**
 * Get zone from district name (case-insensitive).
 */
function getZoneByDistrict(district) {
  if (!district) return '';
  let key = district.toUpperCase()
    .replace(/\s+DISTRICT$/, '')
    .replace(/\s+ZONE$/, '')
    .replace(/\s+ASSEMBLY$/, '')
    .trim();
  
  if (key.endsWith(' ZONE')) return key;
  if (['KANCHI', 'CHENNAI', 'VELLORE', 'TIRUVANNAMALAI', 'VILLUPURAM', 'SALEM', 'COVAI', 'TRICHY', 'VIRUDHUNAGAR', 'THANJAI', 'MADURAI', 'TIRUNELVELI'].includes(key)) {
    return key + ' ZONE';
  }
  
  return DISTRICT_ZONE[key] || '';
}

/**
 * Calculate age from DOB string "DD/MM/YYYY".
 */
function calculateAge(dob) {
  if (!dob) return 0;
  try {
    // Support DD/MM/YYYY or YYYY-MM-DD
    let d;
    if (dob.includes('/')) {
      const [day, month, year] = dob.split('/').map(Number);
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(dob);
    }
    if (isNaN(d.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age > 0 ? age : 0;
  } catch {
    return 0;
  }
}

module.exports = { getZoneByDistrict, calculateAge, DISTRICT_ZONE };
