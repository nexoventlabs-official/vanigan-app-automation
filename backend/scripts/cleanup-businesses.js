/**
 * cleanup-businesses.js
 *
 * Auto-enriches ALL businesses with missing fields:
 *   - category / subCategory  ← keyword matching on name + description
 *   - district / assembly     ← TN location matching on address + city
 *
 * Rules:
 *   ✅ Never deletes any business
 *   ✅ Never overwrites an existing non-empty value
 *   ✅ Only fills EMPTY fields
 *
 * Run from backend/:
 *   node scripts/cleanup-businesses.js             (writes to DB)
 *   node scripts/cleanup-businesses.js --dry-run   (preview only)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { getMap } = require('../services/districts');

const DRY = process.argv.includes('--dry-run');
if (DRY) console.log('\n⚠️  DRY-RUN – no changes will be written\n');

const BUSINESS_URI = process.env.BUSINESS_MONGODB_URI || process.env.MONGODB_URI;
if (!BUSINESS_URI) { console.error('No MONGODB URI in .env'); process.exit(1); }

const BizSchema = new mongoose.Schema({
  name: String, category: String, subCategory: String,
  district: String, assembly: String, city: String,
  address: String, landmark: String, description: String, serviceLocations: String,
}, { strict: false, timestamps: true });

/* ══════════════════════════════════════════════════════════
   1.  CATEGORY RULES
   Each rule: { keywords[], category, subCategory }
   First matching rule wins.
   Keywords are tested (case-insensitive) against:
     name + ' ' + description
══════════════════════════════════════════════════════════ */
const CATEGORY_RULES = [
  /* Hospitals & Clinics */
  { kw: ['hospital','nursing home','maternity'],             cat: 'Hospitals & Clinics',      sub: 'Hospitals' },
  { kw: ['clinic','health care','healthcare','medical center'],cat:'Hospitals & Clinics',     sub: 'Clinics' },

  /* Doctors */
  { kw: ['dental','dentist'],                                cat: 'Doctors',                  sub: 'Dental Clinic' },
  { kw: ['eye care','ophthalmol','optician'],                cat: 'Doctors',                  sub: 'Eye Care' },
  { kw: ['doctor','physician','surgeon','specialist','ent clinic','ear nose','pediatric'], cat:'Doctors', sub: 'General Physician' },

  /* Labs & Diagnostics */
  { kw: ['laboratory','diagnostic','clinical lab','scan centre','x-ray','pathology'], cat: 'Labs & Diagnostics', sub: 'Diagnostic Centre' },

  /* Hotels & Restaurants */
  { kw: ['biryani','mess','tiffin','dhaba','canteen','restaurant','eatery'], cat: 'Hotels & Restaurants', sub: 'Restaurant' },
  { kw: ['bakery','cake','bakes','confectionery'],           cat: 'Hotels & Restaurants',     sub: 'Bakery' },
  { kw: ['tea stall','tea shop','coffee shop','café','cafe'],cat: 'Hotels & Restaurants',     sub: 'Tea & Coffee Shop' },
  { kw: ['hotel','lodge','inn','resort','grand hotel'],      cat: 'Hotels & Restaurants',     sub: 'Hotel' },
  { kw: ['snack','chips','sweet shop','mithai'], cat:'Hotels & Restaurants', sub:'Food Shop' },

  /* Caterers */
  { kw: ['catering','caterer'],                              cat: 'Caterers',                 sub: 'Event Catering' },

  /* Electricals & Electronics */
  { kw: ['cctv','security system','surveillance'],           cat: 'Electricals & Electronics',sub: 'CCTV & Security' },
  { kw: ['mobile','smartphone','phone shop','phone store'],  cat: 'Electricals & Electronics',sub: 'Mobile Shop' },
  { kw: ['electrical','electronics','wiring','led','inverter','ups','solar'], cat:'Electricals & Electronics', sub:'Electrical Shop' },
  { kw: ['computer','laptop','desktop','it products'],       cat: 'Electricals & Electronics',sub: 'Computer Shop' },

  /* IT & Software */
  { kw: ['software','web design','web development','app development','digital marketing','seo','it solution','tech solution','nexora','infotech'], cat:'IT & Software', sub:'Software Company' },

  /* Digital & IT Products */
  { kw: ['digital print','digital studio','digital'],        cat: 'Digital & IT Products',    sub: 'Digital Services' },

  /* Printing Services */
  { kw: ['print','printing','flex','banner','offset','xerox','stationery'], cat:'Printing Services', sub:'Printing Shop' },

  /* Textiles & Garments — BEFORE Construction so 'textiles' doesn't match 'tiles' */
  { kw: ['saree','sari','dhoti','lungi'],                    cat: 'Textiles & Garments',      sub: 'Saree & Textiles' },
  { kw: ['tailoring','tailor','stitching','embroidery'],     cat: 'Textiles & Garments',      sub: 'Tailoring' },
  { kw: ['nighties','readymade','garment','clothing','apparel','dress','fashion'], cat:'Textiles & Garments', sub:'Readymade Garments' },
  { kw: ['textile','cloth store','fabric'],                  cat: 'Textiles & Garments',      sub: 'Textiles' },

  /* Courier Services — BEFORE Construction so 'sand' in description doesn't win */
  { kw: ['courier','parcel delivery','express delivery'],    cat: 'Courier Services',         sub: 'Courier Service' },

  /* Construction Materials */
  { kw: ['granite','marble','floor tiles','wall tiles','ceramic tiles'], cat: 'Construction Materials', sub: 'Granite & Tiles' },
  { kw: ['cement','quarry'],                                 cat: 'Construction Materials',   sub: 'Building Materials' },
  { kw: ['hardware'],                                        cat: 'Construction Materials',   sub: 'Hardware Shop' },
  { kw: ['paint','colour','distemper'],                      cat: 'Construction Materials',   sub: 'Paint Shop' },
  { kw: ['plywood','furniture material'],                    cat: 'Construction Materials',   sub: 'Timber & Wood' },

  /* Civil Contractors */
  { kw: ['civil contractor','building contractor','construction work','civil work','mason'], cat:'Civil Contractors', sub:'Building Contractor' },

  /* Real Estate */
  { kw: ['real estate','property','land','plot','flats','apartment','builder','promoter','housing'], cat:'Real Estate', sub:'Property Dealer' },

  /* Automobile */
  { kw: ['automobile','car dealer','bike dealer','vehicle dealer','showroom','motor'], cat:'Automobile', sub:'Vehicle Dealer' },
  { kw: ['garage','auto service','vehicle service','auto workshop'], cat:'Automobile',         sub:'Service Centre' },
  { kw: ['spare parts','auto parts','automotive parts'],     cat: 'Automobile',               sub: 'Spare Parts' },

  /* Transport */
  { kw: ['lorry','truck','goods carrier','freight','cargo transport'], cat:'Transport',        sub:'Goods Transport' },
  { kw: ['bus service','passenger service','travel agency','travels','tours and travels'], cat:'Transport', sub:'Travel Agency' },
  { kw: ['taxi','cab','auto rickshaw','van service'],        cat: 'Transport',                sub: 'Taxi & Cab' },
  { kw: ['transport','logistics','supply chain'],            cat: 'Transport',                sub: 'Logistics' },

  /* Packers & Movers */
  { kw: ['packers','movers','shifting','relocation','household shifting'], cat:'Packers & Movers', sub:'Packers & Movers' },

  /* Agriculture */
  { kw: ['seeds','nursery','saplings'],                      cat: 'Agriculture',              sub: 'Seeds & Plants' },
  { kw: ['agro','agriculture','farmer','fertiliser','fertilizer','pesticide','irrigation'], cat:'Agriculture', sub:'Agricultural Supplies' },
  { kw: ['virakku','firewood','timber trading'],             cat: 'Agriculture',              sub: 'Timber Depot' },
  { kw: ['rice mill','flour mill','oil mill'],               cat: 'Agriculture',              sub: 'Mill' },

  /* Organic Products */
  { kw: ['organic','herbal','ayurvedic','millet'],           cat: 'Organic Products',         sub: 'Organic Store' },

  /* Jewellery */
  { kw: ['jewellery','jewelry','gold shop','silver','ornament','gems'], cat:'Jewellery',      sub:'Jewellery Shop' },

  /* Spa & Beauty */
  { kw: ['bridal makeup','bridal studio'],                   cat: 'Spa & Beauty',             sub: 'Bridal Studio' },
  { kw: ['parlour','parlor','beauty','salon','spa','skincare','cosmetics'], cat:'Spa & Beauty', sub:'Beauty Salon' },

  /* Banking & Finance */
  { kw: ['chit fund','nidhi','micro finance','microfinance'], cat:'Banking & Finance',        sub:'Chit Fund' },
  { kw: ['loan','credit','bank','banking','financial service'], cat:'Banking & Finance',       sub:'Finance' },

  /* Insurance */
  { kw: ['insurance','lic','hdfc life','bajaj allianz','policy'], cat:'Insurance',            sub:'Insurance Agent' },

  /* Advocate & Legal */
  { kw: ['advocate','lawyer','attorney','legal','law firm'], cat: 'Advocate & Legal',         sub: 'Legal Services' },

  /* Education */
  { kw: ['school','college','university'],                   cat: 'Education',                sub: 'School / College' },
  { kw: ['coaching','tuition','tutorial','academy','institute','training'], cat:'Education',  sub:'Coaching Centre' },

  /* Jobs */
  { kw: ['recruitment','placement','staffing','manpower','hr consultancy'], cat:'Jobs',        sub:'Recruitment Agency' },

  /* Banquets & Event Halls */
  { kw: ['marriage hall','kalyana mandapam','function hall','banquet','auditorium','event hall'], cat:'Banquets & Event Halls', sub:'Marriage Hall' },

  /* Wedding Services */
  { kw: ['wedding','bridal','mehendi','henna','wedding photography'], cat:'Wedding Services', sub:'Wedding Services' },

  /* Hire Services */
  { kw: ['hire','rental','rent','on rent','for rent'],       cat: 'Hire Services',            sub: 'Rental Services' },

  /* Home Appliances */
  { kw: ['home appliance','washing machine','refrigerator','fridge','air conditioner','mixer','grinder','fan','cooler'], cat:'Home Appliances', sub:'Home Appliances' },

  /* Repairs */
  { kw: ['repair','service centre','maintenance','fix','servicing'], cat:'Repairs',           sub:'Repair Services' },

  /* Pest Control */
  { kw: ['pest control','termite','mosquito control','fumigation'], cat:'Pest Control',       sub:'Pest Control' },

  /* Advertising */
  { kw: ['advertising','branding','media','marketing agency','ad agency'], cat:'Advertising', sub:'Advertising Agency' },

  /* Travel & Tourism */
  { kw: ['tour','tourism','holiday','vacation','pilgrim','trip'], cat:'Travel & Tourism',     sub:'Tour Operator' },

  /* Sports */
  { kw: ['sports','gym','fitness','cricket','football','badminton'], cat:'Sports',            sub:'Sports' },

  /* Religious */
  { kw: ['temple','church','mosque','pooja','religious','devotional'], cat:'Religious',       sub:'Religious' },

  /* Printing Services (catch-all) */
  { kw: ['book centre','book store','books','stationery','library'], cat:'Printing Services', sub:'Books & Stationery' },

  /* Daily Needs */
  { kw: ['maligai','grocery','provisions','supermarket','departmental','kirana','bazaar','general store','daily needs','vegetables','vegetable shop','chicken','meat','fish'], cat:'Daily Needs', sub:'General Store' },

  /* B2B Services */
  { kw: ['enterprise','industries','exports','import','wholesale','traders','trading','suppliers','distributor'], cat:'B2B Services', sub:'Traders & Distributors' },

  /* Bills & Recharge */
  { kw: ['recharge','broadband','internet','dth','cable tv','bills payment'], cat:'Bills & Recharge', sub:'Recharge & Bills' },
];

/* ══════════════════════════════════════════════════════════
   2.  LOCATION MAP — district → [assemblies]
══════════════════════════════════════════════════════════ */
const DISTRICT_MAP = getMap(); // { "Chennai": ["Anna Nagar", ...], ... }

/* Build reverse map: normalised_assembly → district */
const ASM_TO_DISTRICT = {};
for (const [dist, asms] of Object.entries(DISTRICT_MAP)) {
  for (const asm of asms) {
    ASM_TO_DISTRICT[asm.toLowerCase()] = dist;
  }
}

/* Also add district aliases / common spellings */
const DISTRICT_ALIASES = {
  'trichy': 'Tiruchirapalli', 'tiruchirappalli': 'Tiruchirapalli',
  'tiruchy': 'Tiruchirapalli',
  'tuticorin': 'Thoothukudi', 'thoothukudi': 'Thoothukudi', 'thoothukkudi': 'Thoothukudi',
  'nellai': 'Tirunelveli',
  'kanyakumari': 'Kanniyakumari', 'cape': 'Kanniyakumari',
  'cbse': 'Coimbatore', 'kovai': 'Coimbatore',
  'madurai': 'Madurai',
  'salem': 'Salem',
  'erode': 'Erode',
  'tiruppur': 'Tiruppur', 'tirupur': 'Tiruppur',
  'vellore': 'Vellore',
  'thanjavur': 'Thanjavur', 'tanjore': 'Thanjavur',
  'nagapattinam': 'Nagapattinam',
  'cuddalore': 'Cuddalore',
  'villupuram': 'Vilupuram', 'viluppuram': 'Vilupuram',
  'krishnagiri': 'Krishnagiri',
  'dharmapuri': 'Dharmapuri',
  'namakkal': 'Namakkal',
  'karur': 'Karur',
  'dindigul': 'Dindigul',
  'theni': 'Theni',
  'virudhunagar': 'Virudhunagar',
  'ramanathapuram': 'Ramanathapuram', 'ramnathapuram': 'Ramanathapuram',
  'sivaganga': 'Sivaganga',
  'pudukottai': 'Pudukottai', 'pudukkottai': 'Pudukottai',
  'perambalur': 'Perambalur',
  'ariyalur': 'Ariyalur',
  'chengalpattu': 'Chengalpattu',
  'kancheepuram': 'Kancheepuram', 'kanchipuram': 'Kancheepuram',
  'thiruvallur': 'Thiruvallur', 'tiruvallur': 'Thiruvallur',
  'ranipet': 'Ranipet',
  'tirupattur': 'Tirupathur', 'tiruvannamalai': 'Tiruvannamalai',
  'tenkasi': 'Tenkasi',
  'kallakurichi': 'Kallakurichi',
  'mayiladuthurai': 'Mayiladuthurai',
  'thiruvarur': 'Thiruvarur',
  'nilgiris': 'Nilgiris', 'ooty': 'Nilgiris',
  'chennai': 'Chennai',
};

/* Build sorted arrays so longer/more-specific names are checked first */
const ALL_DISTRICTS_SORTED = Object.keys(DISTRICT_MAP).sort((a, b) => b.length - a.length);
const ALL_ASSEMBLIES_SORTED = Object.keys(ASM_TO_DISTRICT).sort((a, b) => b.length - a.length);

/* ── helpers ── */
function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }

function detectLocation(biz) {
  /* combine all location-ish text */
  const haystack = norm([biz.address, biz.city, biz.landmark, biz.serviceLocations, biz.description, biz.name].join(' '));

  let district = '', assembly = '';

  /* 1. check existing district field */
  if (biz.district) {
    const dk = norm(biz.district);
    const canonical = DISTRICT_ALIASES[dk] || ALL_DISTRICTS_SORTED.find(d => norm(d) === dk);
    if (canonical) district = canonical;
  }

  /* 2. check existing assembly field */
  if (biz.assembly) {
    const ak = norm(biz.assembly);
    const foundDist = ASM_TO_DISTRICT[ak];
    if (foundDist) {
      assembly = Object.keys(ASM_TO_DISTRICT).find(k => k === ak) ? // get original casing
        Object.entries(DISTRICT_MAP[foundDist]).flat().find(a => norm(a) === ak) || biz.assembly
        : biz.assembly;
      if (!district) district = foundDist;
    }
  }

  /* 3. scan haystack for assembly names (more specific → infers district too) */
  if (!assembly) {
    for (const ak of ALL_ASSEMBLIES_SORTED) {
      if (haystack.includes(ak)) {
        const distForAsm = ASM_TO_DISTRICT[ak];
        /* get properly-cased assembly name */
        const asmName = DISTRICT_MAP[distForAsm]?.find(a => norm(a) === ak) || ak;
        assembly = asmName;
        if (!district) district = distForAsm;
        break;
      }
    }
  }

  /* 4. scan haystack for district names */
  if (!district) {
    for (const dk of ALL_DISTRICTS_SORTED) {
      if (haystack.includes(norm(dk))) { district = dk; break; }
    }
  }

  /* 5. check district aliases in haystack */
  if (!district) {
    for (const [alias, canonical] of Object.entries(DISTRICT_ALIASES)) {
      if (haystack.includes(alias)) { district = canonical; break; }
    }
  }

  return { district, assembly };
}

function detectCategory(biz) {
  const text = ' ' + norm((biz.name || '') + ' ' + (biz.description || '') + ' ' + (biz.subCategory || '')) + ' ';
  for (const rule of CATEGORY_RULES) {
    const matched = rule.kw.some(k => {
      /* For short keywords (<=4 chars) require spaces around them to avoid false sub-string matches */
      if (k.length <= 4) return text.includes(` ${k} `);
      return text.includes(k.toLowerCase());
    });
    if (matched) return { category: rule.cat, subCategory: rule.sub };
  }
  return { category: '', subCategory: '' };
}

/* ══════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════ */
async function main() {
  const conn = await mongoose.createConnection(BUSINESS_URI).asPromise();
  const Business = conn.model('Business', BizSchema);

  const all = await Business.find({}).lean();
  console.log(`Total businesses: ${all.length}\n`);

  let updated = 0, skipped = 0, stillMissing = 0;

  for (const biz of all) {
    const updates = {};

    /* ── category / subCategory ── only fill if empty ── */
    if (!biz.category || !biz.subCategory) {
      const { category, subCategory } = detectCategory(biz);
      if (!biz.category    && category)    updates.category    = category;
      if (!biz.subCategory && subCategory) updates.subCategory = subCategory;
    }

    /* ── district / assembly ── only fill if empty ── */
    if (!biz.district || !biz.assembly) {
      const { district, assembly } = detectLocation(biz);
      if (!biz.district && district) updates.district = district;
      if (!biz.assembly && assembly) updates.assembly = assembly;
    }

    if (Object.keys(updates).length === 0) { skipped++; continue; }

    updated++;
    const tag = `[${biz._id}] "${biz.name}"`;
    if (DRY) {
      console.log(`  ✏️  ${tag}`);
      for (const [k, v] of Object.entries(updates)) console.log(`       ${k}: "${v}"`);
    } else {
      await Business.updateOne({ _id: biz._id }, { $set: updates });
      console.log(`  ✅  ${tag} → ${Object.keys(updates).join(', ')}`);
    }

    /* check if key fields still missing after this update */
    const finalCat  = updates.category    || biz.category    || '';
    const finalSub  = updates.subCategory || biz.subCategory || '';
    const finalDist = updates.district    || biz.district    || '';
    const finalAsm  = updates.assembly    || biz.assembly    || '';
    if (!finalCat || !finalDist) {
      stillMissing++;
    }
  }

  console.log(`\n──────────────────────────────────`);
  console.log(`Updated  : ${updated}`);
  console.log(`No change: ${skipped}`);
  console.log(`Still missing category or district: ${stillMissing} (need manual review)`);
  console.log(`──────────────────────────────────`);
  await conn.close();
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
