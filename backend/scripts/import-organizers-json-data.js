const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getOrganizerModel } = require('../services/memberDb');
const { getZoneByDistrict } = require('../utils/zoneData');

const JSON_PATH = path.resolve(__dirname, '../../organizers.json');

const DISTRICT_MAP = {
  "erode": "Erode",
  "cuddalore": "Cuddalore",
  "ranipet": "Ranipet",
  "vellore": "Vellore",
  "kanyakumari": "Kanniyakumari",
  "tiruvannamalai": "Tiruvannamalai",
  "kanchipuram": "Kancheepuram",
  "chengalpet": "Chengalpattu",
  "dharmapuri": "Dharmapuri",
  "villupuram": "Vilupuram",
  "chennai-central": "Chennai",
  "tiruvallur": "Thiruvallur",
  "thirupur": "Tiruppur",
  "trichy": "Tiruchirapalli",
  "nagapattinam": "Nagapattinam",
  "chennai-north": "Chennai",
  "tirupattur": "Tirupathur",
  "thoothukudi": "Thoothukudi",
  "salem": "Salem",
  "pondicherry": "Puducherry State",
  "kallakurichi": "Kallakuruchi",
  "ariyalur": "Ariyalur",
  "tiruppur": "Tiruppur",
  "coimbatore": "Coimbatore",
  "chennai-south": "Chennai",
  "krishnagiri": "Krishnagiri",
  "madurai": "Madurai",
  "chennai - aynavaram": "Chennai",
  "pondicherry -west": "Puducherry State",
  "pudukkottai": "Pudukottai",
  "villupuram - vanur assembly": "Vilupuram",
  "thanjavur": "Thanjavur",
  "erode west": "Erode",
  "tenkasi": "Tenkasi",
  "madurai - north": "Madurai",
  "madurai - south": "Madurai",
  "tirunelveli": "Tirunelveli",
  "chennai-perambur": "Chennai",
  "namakkal": "Namakkal",
  "v.s": "Thiruvallur",
  "virudhunagar": "Virudhunagar",
  "tiruchirapalli": "Tiruchirapalli",
  "trichy-east": "Tiruchirapalli",
  "ramanathapuram": "Ramanathapuram",
  "dindigul": "Dindigul",
  "sivagangai": "Sivaganga",
  "chennai-centra": "Chennai",
  "covai": "Coimbatore",
  "covai-north": "Coimbatore",
  "theni": "Theni",
  "karur": "Karur",
  "erode -east": "Erode",
  "mayiladurai": "Mayiladuthurai",
  "salem-east": "Salem",
  "madurai-north": "Madurai",
  "erode-east": "Erode",
  "pondichery-east": "Puducherry State",
  "nilgiris": "Nilgiris",
  "chennai": "Chennai",
  "thiruvallur": "Thiruvallur",
  "chennai central": "Chennai",
  "pudhukottai": "Pudukottai",
  "virudhunarar": "Virudhunagar",
  "tiruvarur": "Thiruvarur",
  "chennai-central": "Chennai",
  "chennai central": "Chennai",
  "chennai-central": "Chennai"
};

const ASSEMBLY_MAP = {
  "killiyur": "Killiyoor",
  "vikravandi": "Vikravandi",
  "andhiyur": "Anthiyur",
  "kollamcode": "Vilavancode",
  "padmanadhapuram": "Padmanabhapuram",
  "vilavan code": "Vilavancode",
  "colachal": "Colachal",
  "padmanabhapuram": "Padmanabhapuram",
  "colachel": "Colachal",
  "palladam": "Palladam",
  "thalli": "Thalli",
  "ottapidaram": "Ottapidaram",
  "vilavancode": "Vilavancode",
  "coimbatore south": "Coimbatore (South)",
  "tiruvannamalai": "Tiruvannamalai",
  "tiruppur north": "Tiruppur (North)",
  "villivakkam": "Villivakkam",
  "uthangarai": "Uthangarai",
  "chengam": "Chengam",
  "dharapuram": "Dharapuram",
  "thali": "Thalli",
  "singanallur": "Singanallur",
  "manapparai": "Manapparai",
  "tiruverumbur": "Thiruverumbur",
  "trichy -east": "Tiruchirappalli (East)",
  "trichy east": "Tiruchirappalli (East)",
  "chepauk triplicane": "Chepauk-Thiruvallikeni",
  "egmore": "Egmore",
  "vanur": "Vanur",
  "trichy west": "Tiruchirappalli (West)",
  "ambattur": "Ambattur",
  "maduravayal": "Maduravoyal",
  "chepauk-": "Chepauk-Thiruvallikeni",
  "tindivanam": "Tindivanam",
  "vaniyambadi": "Vaniyambadi",
  "ambur": "Ambur",
  "thiruverumbur": "Thiruverumbur",
  "anaikattu": "Anaikattu",
  "sozhinganallur": "Shozhinganallur",
  "rajapalayam": "Rajapalayam",
  "ariyalur": "Ariyalur",
  "pollachi": "Pollachi",
  "kinathukadavu": "Kinathukadavu",
  "lalgudi": "Lalgudi",
  "trichy west": "Tiruchirappalli (West)",
  "virudhunagar": "Virudhunagar",
  "sholavandan": "Sholavandan",
  "madurai west": "Madurai West",
  "tiruvottiyur": "Thiruvottiyur",
  "srirangam": "Srirangam",
  "salem west": "Salem (West)",
  "arakkonam": "Arakkonam",
  "villupuram": "Viluppuram",
  "gudiyatham": "Gudiyattam",
  "arcot": "Arcot",
  "omalur": "Omalur",
  "gandarvakottai": "Gandarvakkottai",
  "erode west": "Erode (West)",
  "bargur": "Bargur",
  "triplicane": "Chepauk-Thiruvallikeni",
  "ambasamudram": "Ambasamudram",
  "thuraiyur": "Thuraiyur",
  "kulithalai": "Kulithalai",
  "erode east": "Erode (East)",
  "kumbakonam": "Kumbakonam",
  "salem east": "Salem (North)",
  "tiruvallur": "Thiruvallur",
  "sathur": "Sattur",
  "covai north": "Coimbatore (North)",
  "tirunelveli": "Tirunelveli",
  "andipatti": "Andipatti",
  "ranipet": "Ranipet",
  "velachery": "Velachery",
  "palayamkottai": "Palayamkottai",
  "tiruttani": "Tiruttani",
  "nellithope": "Nellithope",
  "viralimalai": "Viralimalai",
  "coonnoor": "Coonoor",
  "aravakurichi": "Aravakurichi",
  "thiruvottiyur": "Thiruvottiyur",
  "bodinayakkanur": "Bodinayakanur",
  "vasudevanallur": "Vasudevanallur",
  "sivakasi": "Sivakasi",
  "tiruvarur": "Thiruvarur",
  "madurai central": "Madurai Central",
  "maduranthagam": "Madurantakam",
  "thousandlights": "Thousand Lights"
};

const POSITION_MAP = {
  "district incharge": "District President",
  "chennai north district vice secretary": "District Joint Secretary",
  "thanjavur zone vice secretary": "Zone Joint Secretary",
  "kanchi zone vice secretary of shop": "Zone Joint Secretary",
  "theni municipality secretary": "Assembly Secretary",
  "pollachi municipality president": "Assembly President"
};

async function run() {
  const memberUri = process.env.MEMBER_MONGODB_URI;
  if (!memberUri) {
    console.error('Missing MEMBER_MONGODB_URI in environment variables.');
    process.exit(1);
  }

  console.log('Loading organizers.json...');
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`File not found at ${JSON_PATH}`);
    process.exit(1);
  }
  const source = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  console.log(`Loaded ${source.length} entries from organizers.json.`);

  console.log('Connecting to Member Database...');
  const Organizer = await getOrganizerModel();
  console.log('Connected.');

  let inserted = 0;
  let skipped = 0;

  for (const org of source) {
    const name = (org.name || '').trim();
    const phoneDigits = String(org.mobile_number || '').replace(/\D/g, '');

    if (!name) {
      console.log(`Skipping index ${org.sl_no} due to empty name.`);
      skipped++;
      continue;
    }
    if (!phoneDigits || phoneDigits.length < 10) {
      console.log(`Skipping organizer "${name}" due to invalid phone number: "${org.mobile_number}".`);
      skipped++;
      continue;
    }

    // Check if phone number is already registered
    const exists = await Organizer.findOne({ phone: phoneDigits }).lean();
    if (exists) {
      console.log(`Organizer with phone ${phoneDigits} (${name}) already exists. Skipping.`);
      skipped++;
      continue;
    }

    // Correct spelling of District
    const rawDist = (org.district || '').trim();
    const cleanDist = DISTRICT_MAP[rawDist.toLowerCase()] || rawDist;

    // Correct spelling of Assembly
    const rawAssembly = (org.assembly || '').trim();
    const cleanAssembly = ASSEMBLY_MAP[rawAssembly.toLowerCase()] || rawAssembly;

    // Standardize position/role
    const rawPos = (org.position || 'Organizer').trim();
    const cleanRole = POSITION_MAP[rawPos.toLowerCase()] || rawPos;

    // Classify Level
    const posLower = cleanRole.toLowerCase();
    let level = 'District';
    if (posLower.startsWith('state')) level = 'State';
    else if (posLower.startsWith('assembly')) level = 'Assembly';
    else if (posLower.startsWith('district')) level = 'District';
    else if (posLower.startsWith('zone')) level = 'Zone';
    else if (posLower.startsWith('area')) level = 'Area';

    // Format District/Location String (stateVal equivalent)
    let locationVal = '';
    if (level === 'State') {
      locationVal = cleanDist.includes('Puducherry') ? 'Puducherry State' : 'Tamil Nadu State';
    } else if (level === 'Assembly') {
      locationVal = cleanAssembly ? `${cleanAssembly} Assembly` : `${cleanDist} Assembly`;
    } else if (level === 'District') {
      locationVal = cleanDist ? `${cleanDist} District` : '';
    } else if (level === 'Zone') {
      locationVal = getZoneByDistrict(cleanDist) || cleanDist;
    } else if (level === 'Area') {
      locationVal = cleanAssembly ? `${cleanAssembly} Area` : `${cleanDist} Area`;
    }

    // Wing
    const cleanWing = (org.wing || 'General Wing').trim();

    await Organizer.create({
      name,
      description: cleanRole,
      role: cleanRole,
      district: locationVal,
      assembly: cleanWing,
      phone: phoneDigits,
      email: '',
      image: '',
      imagePublicId: '',
      active: false, // Inactive status ("off") by default
      isSeed: true
    });

    inserted++;
  }

  console.log('\n=============================================');
  console.log(`Import Complete.`);
  console.log(`Total Processed: ${source.length}`);
  console.log(`Successfully Imported: ${inserted}`);
  console.log(`Skipped / Existed: ${skipped}`);
  console.log('=============================================\n');

  process.exit(0);
}

run().catch(err => {
  console.error('Fatal Error running import:', err);
  process.exit(1);
});
