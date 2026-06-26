import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Plus, RefreshCw, Printer, AlertTriangle, ArrowLeft, Clipboard, Check, Share2 } from 'lucide-react';
import api from '../api';
import Cropper from 'react-easy-crop';
import { buildComboCanvas, CardFront, CardBack } from '../components/CardModal.jsx';

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (error) => reject(error));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Render at high-density target size to keep file size small but display sharp (retina density)
  const targetWidth = 411;
  const targetHeight = 408;

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

export default function DirectOrganizer() {
  const navigate = useNavigate();

  // URL query params for promotion/edit
  const queryParams = new URLSearchParams(window.location.search);
  const promotePhone = queryParams.get('promotePhone');
  const editPhone = queryParams.get('editPhone');

  // Success modal share refs
  const successFrontRef = useRef(null);
  const successBackRef = useRef(null);

  // Form states
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [wing, setWing] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [active, setActive] = useState(true);

  // New organizational level states
  const [level, setLevel] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedAssembly, setSelectedAssembly] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [districtMap, setDistrictMap] = useState({});
  const [assembliesList, setAssembliesList] = useState([]);

  // Photo uploads
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('https://via.placeholder.com/137x136');

  // Dropdown lists from backend
  const [wingsList, setWingsList] = useState([]);

  // UI state
  const [loadingMember, setLoadingMember] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null); // stores { member, pin }
  const [copied, setCopied] = useState(false);

  // Existing member credentials (if promoting/editing)
  const [existingId, setExistingId] = useState('');
  const [isPromotion, setIsPromotion] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState(null); // { status: 'available'|'member'|'organizer'|'loading'|'error', message: '', name: '' }

  // Auto-calculate age
  const [age, setAge] = useState('');

  // Cropper states
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (croppedBlob) {
        const croppedFile = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
        setPhotoFile(croppedFile);
        const url = URL.createObjectURL(croppedBlob);
        setPhotoUrl(url);
      }
      setImageToCrop(null);
    } catch (e) {
      console.error(e);
      alert('Failed to crop image');
    }
  };

  // Position levels mapping
  const POSITIONS_BY_LEVEL = {
    State: [
      'State President',
      'State Vice President',
      'State Secretary',
      'State Joint Secretary',
      'State Treasurer',
      'State Joint Treasurer'
    ],
    Assembly: [
      'Assembly President',
      'Assembly Vice President',
      'Assembly Secretary',
      'Assembly Joint Secretary',
      'Assembly Treasurer',
      'Assembly Joint Treasurer'
    ],
    District: [
      'District President',
      'District Vice President',
      'District Secretary',
      'District Joint Secretary',
      'District Treasurer',
      'District Joint Treasurer'
    ],
    Zone: [
      'Zone President',
      'Zone Vice President',
      'Zone Secretary',
      'Zone Joint Secretary',
      'Zone Treasurer',
      'Zone Joint Treasurer'
    ],
    Area: [
      'Area President',
      'Area Vice President',
      'Area Secretary',
      'Area Joint Secretary',
      'Area Treasurer',
      'Area Joint Treasurer'
    ]
  };

  const ZONES_LIST = [
    'KANCHI ZONE',
    'CHENNAI ZONE',
    'VELLORE ZONE',
    'TIRUVANNAMALAI ZONE',
    'VILLUPURAM ZONE',
    'SALEM ZONE',
    'COVAI ZONE',
    'TRICHY ZONE',
    'VIRUDHUNAGAR ZONE',
    'THANJAI ZONE',
    'MADURAI ZONE',
    'TIRUNELVELI ZONE'
  ];

  const DISTRICT_ZONE_MAP = {
    'ARIYALUR': 'TRICHY ZONE',
    'CHENGALPATTU': 'KANCHI ZONE',
    'CHENNAI': 'CHENNAI ZONE',
    'COIMBATORE': 'COVAI ZONE',
    'CUDDALORE': 'VILLUPURAM ZONE',
    'DHARMAPURI': 'TIRUVANNAMALAI ZONE',
    'DINDIGUL': 'VIRUDHUNAGAR ZONE',
    'ERODE': 'SALEM ZONE',
    'KALLAKURICHI': 'TIRUVANNAMALAI ZONE',
    'KANCHEEPURAM': 'KANCHI ZONE',
    'KANYAKUMARI': 'TIRUNELVELI ZONE',
    'KARUR': 'TRICHY ZONE',
    'KRISHNAGIRI': 'VELLORE ZONE',
    'MADURAI': 'MADURAI ZONE',
    'MAYILADUTHURAI': 'THANJAI ZONE',
    'NAGAPATTINAM': 'THANJAI ZONE',
    'NAMAKKAL': 'SALEM ZONE',
    'NILGIRIS': 'COVAI ZONE',
    'PERAMBALUR': 'TRICHY ZONE',
    'PUDUKKOTTAI': 'TRICHY ZONE',
    'RAMANATHAPURAM': 'MADURAI ZONE',
    'RANIPET': 'VELLORE ZONE',
    'SALEM': 'SALEM ZONE',
    'SIVAGANGA': 'MADURAI ZONE',
    'TENKASI': 'TIRUNELVELI ZONE',
    'THANJAVUR': 'THANJAI ZONE',
    'THENI': 'VIRUDHUNAGAR ZONE',
    'THOOTHUKUDI': 'TIRUNELVELI ZONE',
    'TIRUCHIRAPPALLI': 'TRICHY ZONE',
    'TIRUNELVELI': 'TIRUNELVELI ZONE',
    'TIRUPATHUR': 'VELLORE ZONE',
    'TIRUPPUR': 'COVAI ZONE',
    'TIRUVALLUR': 'KANCHI ZONE',
    'TIRUVANNAMALAI': 'TIRUVANNAMALAI ZONE',
    'TIRUVARUR': 'THANJAI ZONE',
    'VELLORE': 'VELLORE ZONE',
    'VILLUPURAM': 'VILLUPURAM ZONE',
    'VIRUDHUNAGAR': 'VIRUDHUNAGAR ZONE'
  };

  const isFormValid = !!(
    name.trim() &&
    phone.trim() &&
    phone.trim().replace(/\D/g, '').length >= 10 &&
    (!phoneStatus || phoneStatus.status !== 'organizer') &&
    dob &&
    position &&
    wing &&
    stateVal &&
    address.trim() &&
    (isPromotion || isEditing || photoFile)
  );

  // Debounced check for phone number availability across Organizer and Member collections
  useEffect(() => {
    const digits = String(phone || '').replace(/\D/g, '');

    // Skip checking if own number during editing or promotion
    if (isEditing && digits === String(editPhone || '').replace(/\D/g, '')) {
      setPhoneStatus({ status: 'available', message: 'Current Organizer Phone' });
      return;
    }

    if (isPromotion && digits === String(promotePhone || '').replace(/\D/g, '')) {
      setPhoneStatus({ status: 'member', message: 'Current Member Phone (promoting)' });
      return;
    }

    if (digits.length < 10) {
      setPhoneStatus(null);
      return;
    }

    setPhoneStatus({ status: 'loading', message: 'Checking availability...' });

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await api.get(`/organizers/check-phone/${digits}`);
        setPhoneStatus(res.data);
      } catch (err) {
        console.error(err);
        setPhoneStatus({ status: 'error', message: 'Error checking phone status' });
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [phone, isEditing, editPhone, isPromotion, promotePhone]);

  // Sync stateVal based on level and choices
  useEffect(() => {
    if (level === 'State') {
      setStateVal(selectedState);
    } else if (level === 'Assembly') {
      setStateVal(selectedAssembly ? `${selectedAssembly} Assembly` : '');
    } else if (level === 'District') {
      setStateVal(selectedDistrict ? `${selectedDistrict} District` : '');
    } else if (level === 'Zone') {
      setStateVal(selectedZone);
    } else if (level === 'Area') {
      setStateVal(selectedArea ? `${selectedArea} Area` : '');
    } else {
      setStateVal('');
    }
  }, [level, selectedState, selectedDistrict, selectedAssembly, selectedZone, selectedArea]);

  // Sync position dropdown default when level changes
  useEffect(() => {
    const list = POSITIONS_BY_LEVEL[level] || [];
    if (!list.includes(position)) {
      setPosition('');
    }
  }, [level]);

  // Sync assemblies dropdown when district changes
  useEffect(() => {
    if (selectedDistrict && districtMap[selectedDistrict]) {
      const list = districtMap[selectedDistrict] || [];
      setAssembliesList(list);
      if (!list.includes(selectedAssembly)) {
        setSelectedAssembly('');
      }
    } else {
      setAssembliesList([]);
      setSelectedAssembly('');
    }
  }, [selectedDistrict, districtMap]);

  // Auto-calculate age
  useEffect(() => {
    if (!dob) {
      setAge('');
      return;
    }
    const today = new Date();
    const birthDate = new Date(dob);
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    setAge(calculatedAge >= 0 ? calculatedAge : 0);
  }, [dob]);

  // Load dropdown lists and optionally promote or edit target organizer/member
  useEffect(() => {
    let activeEffect = true;

    const loadDropdownsAndDetails = async () => {
      let dMap = {};
      try {
        const [wingsRes, districtsRes] = await Promise.all([
          api.get('/wings'),
          api.get('/districts').catch(() => null)
        ]);
        if (!activeEffect) return;

        const wList = wingsRes.data.wings || [];
        setWingsList(wList);

        if (districtsRes && districtsRes.data && districtsRes.data.map) {
          dMap = districtsRes.data.map;
          setDistrictMap(dMap);
        }
      } catch (err) {
        console.error('Failed to load wings or districts lists:', err);
      }

      // Now load target details
      if (editPhone) {
        setLoadingMember(true);
        setError('');
        setIsEditing(true);
        try {
          const res = await api.get(`/organizers/direct/${editPhone}`);
          if (!activeEffect) return;
          const { member, organizer } = res.data;

          if (member) {
            setName(member.name || '');
            setPhone(member.phone || '');
            
            // Clean dummy values
            const mDob = member.dob || '';
            let formattedDob = '';
            if (mDob.includes('/')) {
              const [d, mon, y] = mDob.split('/');
              formattedDob = `${y}-${mon.padStart(2, '0')}-${d.padStart(2, '0')}`;
            } else {
              formattedDob = mDob;
            }

            if (formattedDob === '1985-01-01') {
              setDob('');
            } else {
              setDob(formattedDob);
            }

            const cleanAddress = (member.businessAddress || '').trim();
            const orgDesc = (organizer?.description || '').trim();
            const orgRole = (organizer?.role || '').trim();
            const commonDesignations = [
              'assembly secretary',
              'assembly president',
              'assembly vice president',
              'assembly joint secretary',
              'assembly treasurer',
              'assembly joint treasurer',
              'district president',
              'district vice president',
              'district secretary',
              'district joint secretary',
              'district treasurer',
              'district joint treasurer',
              'state president',
              'state vice president',
              'state secretary',
              'state coordinator',
              'state joint secretary',
              'state treasurer',
              'state joint treasurer',
              'zone president',
              'zone vice president',
              'zone secretary',
              'zone joint secretary',
              'zone treasurer',
              'zone joint treasurer',
              'area president',
              'area vice president',
              'area secretary',
              'area joint secretary',
              'area treasurer',
              'area joint treasurer'
            ];
            const isDummyAddress = !cleanAddress || 
                                   cleanAddress.toLowerCase() === orgDesc.toLowerCase() || 
                                   cleanAddress.toLowerCase() === orgRole.toLowerCase() ||
                                   commonDesignations.includes(cleanAddress.toLowerCase());

            if (isDummyAddress) {
              setAddress('');
            } else {
              setAddress(cleanAddress);
            }

            const isDummyDob = !formattedDob || formattedDob === '1985-01-01';
            if (member.bloodGroup === 'O+' && (isDummyDob || isDummyAddress)) {
              setBloodGroup('');
            } else {
              setBloodGroup(member.bloodGroup || '');
            }

            setExistingId(member.membershipId || '');
            if (member.photoUrl) setPhotoUrl(member.photoUrl);
          }
          if (organizer) {
            if (!member) {
              setName(organizer.name || '');
              setPhone(organizer.phone || '');
              setAddress('');
              setBloodGroup('');
              setDob('');
              setPhotoUrl('https://via.placeholder.com/137x136');
              setExistingId('');
            }
            const orgRole = organizer.role || '';
            const orgDistrict = organizer.district || '';
            setWing(organizer.assembly || '');
            setEmail(organizer.email || '');
            setActive(!!organizer.active);

            // Parse level and values
            let parsedLevel = 'State';
            if (orgRole.toLowerCase().startsWith('state')) {
              parsedLevel = 'State';
              setSelectedState(orgDistrict || 'Tamil Nadu State');
            } else if (orgRole.toLowerCase().startsWith('assembly')) {
              parsedLevel = 'Assembly';
              const cleanAssembly = orgDistrict.replace(/\s+Assembly$/, '');
              setSelectedAssembly(cleanAssembly);
              
              // Find parent district of this assembly in districtMap
              let foundDistrict = '';
              for (const distKey of Object.keys(dMap)) {
                if ((dMap[distKey] || []).includes(cleanAssembly)) {
                  foundDistrict = distKey;
                  break;
                }
              }
              if (foundDistrict) {
                setSelectedDistrict(foundDistrict);
              }
            } else if (orgRole.toLowerCase().startsWith('district')) {
              parsedLevel = 'District';
              const cleanDistrict = orgDistrict.replace(/\s+District$/, '');
              setSelectedDistrict(cleanDistrict);
            } else if (orgRole.toLowerCase().startsWith('zone')) {
              parsedLevel = 'Zone';
              setSelectedZone(orgDistrict);
            } else if (orgRole.toLowerCase().startsWith('area')) {
              parsedLevel = 'Area';
              const cleanArea = orgDistrict.replace(/\s+Area$/, '');
              setSelectedArea(cleanArea);
            }

            setLevel(parsedLevel);
            setPosition(orgRole);
          }
        } catch (err) {
          console.error(err);
          setError('Failed to fetch the organizer details.');
        } finally {
          setLoadingMember(false);
        }
      } else if (promotePhone) {
        setLoadingMember(true);
        setError('');
        setIsPromotion(true);
        try {
          const res = await api.get(`/member-auth/admin-member/${promotePhone}`);
          if (!activeEffect) return;
          const m = res.data.member;
          if (m) {
            setName(m.name || '');
            setPhone(m.phone || '');
            
            // Clean dummy values
            const mDob = m.dob || '';
            let formattedDob = '';
            if (mDob.includes('/')) {
              const [d, mon, y] = mDob.split('/');
              formattedDob = `${y}-${mon.padStart(2, '0')}-${d.padStart(2, '0')}`;
            } else {
              formattedDob = mDob;
            }

            if (formattedDob === '1985-01-01') {
              setDob('');
            } else {
              setDob(formattedDob);
            }

            const cleanAddress = (m.businessAddress || '').trim();
            const commonDesignations = [
              'assembly secretary',
              'assembly president',
              'assembly vice president',
              'assembly joint secretary',
              'assembly treasurer',
              'assembly joint treasurer',
              'district president',
              'district vice president',
              'district secretary',
              'district joint secretary',
              'district treasurer',
              'district joint treasurer',
              'state president',
              'state vice president',
              'state secretary',
              'state coordinator',
              'state joint secretary',
              'state treasurer',
              'state joint treasurer',
              'zone president',
              'zone vice president',
              'zone secretary',
              'zone joint secretary',
              'zone treasurer',
              'zone joint treasurer',
              'area president',
              'area vice president',
              'area secretary',
              'area joint secretary',
              'area treasurer',
              'area joint treasurer'
            ];
            const isDummyAddress = !cleanAddress || 
                                   commonDesignations.includes(cleanAddress.toLowerCase());

            if (isDummyAddress) {
              setAddress('');
            } else {
              setAddress(cleanAddress);
            }

            const isDummyDob = !formattedDob || formattedDob === '1985-01-01';
            if (m.bloodGroup === 'O+' && (isDummyDob || isDummyAddress)) {
              setBloodGroup('');
            } else {
              setBloodGroup(m.bloodGroup || '');
            }

            setActive(!!m.active);
            setExistingId(m.membershipId || '');
            if (m.photoUrl) setPhotoUrl(m.photoUrl);
          }
        } catch (err) {
          console.error(err);
          setError('Failed to fetch the existing member details.');
        } finally {
          setLoadingMember(false);
        }
      }
    };

    loadDropdownsAndDetails();
    return () => {
      activeEffect = false;
    };
  }, [promotePhone, editPhone]);

  // Handle photo change
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      });
      reader.readAsDataURL(file);
    }
  };

  // Helper to format Date string (yyyy-mm-dd -> DD MMM YYYY)
  const formatDateString = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Helper to compute zone value
  const getZoneValue = () => {
    if (level === 'Zone') {
      return (selectedZone || '').toUpperCase();
    }
    if ((level === 'District' || level === 'Assembly') && selectedDistrict) {
      return DISTRICT_ZONE_MAP[selectedDistrict.toUpperCase()] || '';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Name is required');
    if (!phone.trim()) return alert('Phone is required');
    if (!dob) return alert('Date of Birth is required');
    if (!position) return alert('Please select a Role / Position');
    if (!wing) return alert('Please select a Wing');

    setSaving(true);
    setError('');
    
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('role', position);
      fd.append('district', stateVal);
      fd.append('assembly', wing);
      fd.append('phone', phone);
      fd.append('email', email);
      fd.append('dob', dob);
      fd.append('bloodGroup', bloodGroup);
      fd.append('address', address);
      fd.append('active', String(active));
      fd.append('zone', getZoneValue());
      if (photoFile) {
        fd.append('image', photoFile);
      }

      let res;
      if (isEditing) {
        res = await api.put(`/organizers/direct/${editPhone}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/organizers/direct', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setSuccessData(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'An error occurred while creating the organizer.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!successData) return;
    const text = successData.pin
      ? `🪪 *Vanigan Organizer Credentials*\n\nMembership ID: ${successData.member.membershipId}\nPhone Number: ${phone}\nSecret PIN (Birth Year): ${successData.pin}\n\nLogin to the website to view your card.`
      : isEditing
        ? `🪪 *Vanigan Organizer Profile Updated*\n\nName: ${name}\nMembership ID: ${successData.member.membershipId}\nPhone Number: ${phone}\n\nLogin to the website to view your updated card.`
        : isPromotion
          ? `🪪 *Vanigan Organizer Promotion Complete*\n\nName: ${name}\nMembership ID: ${successData.member.membershipId}\nPhone Number: ${phone}\nPIN: Use your existing membership login PIN.\n\nLogin to the website to view your organizer card.`
          : `🪪 *Vanigan Organizer Credentials*\n\nMembership ID: ${successData.member.membershipId}\nPhone Number: ${phone}\nSecret PIN (Birth Year): ${successData.pin}\n\nLogin to the website to view your card.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareCard = async () => {
    if (!successFrontRef.current || !successBackRef.current || !successData) return;
    setSaving(true);
    try {
      const combo = await buildComboCanvas(successFrontRef.current, successBackRef.current);
      const uid = successData.member?.membershipId || "vanigan-card";
      
      const blob = await new Promise((resolve) => combo.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Failed to generate image blob");
      
      const file = new File([blob], `${uid}_card.png`, { type: "image/png" });
      const verifyUrl = `https://vanigan.digital?page=verify&id=${successData.member?.membershipId || "TNV-000000"}`;
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file]
        });
      } else {
        let copiedToClipboard = false;
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            const data = [new ClipboardItem({ [blob.type]: blob })];
            await navigator.clipboard.write(data);
            copiedToClipboard = true;
          }
        } catch (clipErr) {
          console.error("Clipboard image copy failed:", clipErr);
        }

        try {
          const link = document.createElement("a");
          link.download = `${uid}_card.png`;
          link.href = URL.createObjectURL(blob);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (dlErr) {
          console.error("Download failed:", dlErr);
        }

        const whatsappUrl = `https://api.whatsapp.com/send`;
        window.open(whatsappUrl, "_blank");

        if (copiedToClipboard) {
          alert("Card image copied to clipboard & downloaded! You can paste (Ctrl+V) the image directly in the WhatsApp window that just opened.");
        } else {
          alert("Card image downloaded! You can upload/paste it in the WhatsApp window that just opened.");
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("Share failed:", e);
        const verifyUrl = `https://vanigan.digital?page=verify&id=${successData.member?.membershipId || "TNV-000000"}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(verifyUrl)}`;
        window.open(whatsappUrl, "_blank");
        navigator.clipboard.writeText(verifyUrl).catch(() => {});
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scope card styles */}
      <style>{`
        .direct-card-wrap {
          max-width: 421px;
          margin: 0 auto;
          font-family: Arial, Helvetica, sans-serif;
          color: #111;
        }

        #direct-page1-div {
          background-image: url(https://res.cloudinary.com/dqndhcmu2/image/upload/v1773232516/vanigan/templates/ID_Front.png);
          background-repeat: no-repeat;
          background-size: 421px 573px;
          background-position: center;
          width: 421px;
          height: 573px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          border-radius: 18px;
        }
        #direct-page2-div {
          background-image: url(https://res.cloudinary.com/dqndhcmu2/image/upload/v1773232519/vanigan/templates/ID_Back.png);
          background-repeat: no-repeat;
          background-size: 421px 590px;
          background-position: center;
          width: 421px;
          min-height: 590px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          border-radius: 18px;
        }

        .direct-front-photo-wrap {
          position: absolute;
          top: 182px;
          left: 50%;
          transform: translateX(-50%);
          width: 137px;
        }

        .direct-photo {
          display: block;
          margin: 0 auto;
          border: 5px solid #009245;
          border-radius: 22px !important;
          width: 137px;
          height: 136px;
          object-fit: cover;
          padding: 0;
          background: #fff;
        }

        .direct-front-stack {
          position: absolute;
          top: 328px;
          left: 28px;
          right: 28px;
          text-align: center;
        }

        .direct-front-stack > * + * {
          margin-top: 6px;
        }

        .direct-front-meta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .direct-name {
          font-size: 23px;
          font-weight: 700;
          color: #009245;
          line-height: 1.08;
          margin: 0;
          word-break: break-word;
        }

        .direct-detail-line {
          font-size: 19px;
          font-weight: 700;
          text-transform: capitalize;
          line-height: 1.06;
          margin: 0;
        }

        .direct-id-number {
          font-size: 18px;
          letter-spacing: 0.2px;
          margin-top: 2px;
          font-weight: 700;
          margin: 0;
        }

        .direct-back-content {
          position: absolute;
          top: 234px;
          left: 22px;
          right: 20px;
        }

        .direct-back-details {
          transform: translateY(-60px);
        }

        .direct-back-row {
          display: grid;
          grid-template-columns: 46% 6% 48%;
          align-items: start;
          margin-bottom: 4px;
        }

        .direct-back-label {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .direct-back-sep {
          font-size: 26px;
          line-height: 0.7;
          text-align: center;
          font-weight: 700;
        }

        .direct-back-value {
          font-size: 17px;
          font-weight: 700;
          line-height: 1.12;
          word-break: break-word;
        }

        .direct-back-bottom {
          display: grid;
          grid-template-columns: 40% 60%;
          align-items: start;
          margin-top: -20px;
        }

        .direct-qr-wrap {
          padding-left: 20px;
        }

        .direct-sign-wrap {
          text-align: center;
          padding-right: 10px;
        }

        .direct-signature-img {
          max-height: 48px;
          max-width: 140px;
          object-fit: contain;
          display: block;
          margin: 0 auto;
          transform: translateY(-8px);
        }

        .direct-signature-name {
          text-align: center;
          margin: 2px 0 0;
          font-size: 14px;
          font-weight: 700;
        }

        .direct-small {
          font-size: 12px;
          font-weight: bold;
          line-height: 1.1;
          margin: 0;
        }

        .direct-contact-value {
          background: rgba(255, 255, 255, 0.78);
          display: inline-block;
          padding: 0 4px;
        }

        @media print {
          body, html, #root {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          aside, header, .no-print, .btn, form, h1, p.subtitle {
            display: none !important;
          }
          main, .flex-1, .space-y-6 {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          .direct-card-wrap {
            max-width: 421px;
            margin: 0 auto !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          #direct-page1-div, #direct-page2-div {
            box-shadow: none !important;
            margin: 20px auto !important;
            page-break-inside: avoid;
            break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 no-print">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-[#66ff4c]" />
            {isPromotion ? 'Promote Member to Organizer' : 'Direct Organizer Creator'}
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-semibold">
            {isPromotion 
              ? `Promoting member card ${existingId} into an organizer card using their existing login credentials.`
              : 'Directly provision an organizer account, auto-generate credentials, and set DOB year as login PIN.'}
          </p>
        </div>
        <button onClick={() => navigate(isPromotion ? '/members' : '/organizers')} className="btn-secondary">
          <ArrowLeft size={14} /> Back to {isPromotion ? 'Members' : 'Organizers'}
        </button>
      </div>

      {loadingMember ? (
        <div className="card p-12 text-center text-gray-500 font-bold">Loading target member details...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Editor Form (Left/Top) */}
          <div className="lg:col-span-7 card p-6 space-y-6 no-print">
            <h2 className="text-xl font-bold text-white border-b border-white/[0.08] pb-3">
              {isPromotion ? 'Review & Complete Promotion' : 'Organizer Details Form'}
            </h2>
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 flex items-center gap-2 text-sm">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">
                  Profile Photo {isPromotion && '(Keep blank to use existing photo)'}
                </label>
                <div className="relative border-2 border-dashed border-white/[0.08] rounded-xl p-4 text-center hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <p className="text-sm text-gray-400">📸 Click or drag profile photo here</p>
                  <p className="text-xs text-gray-600 mt-1">PNG, JPG, JPEG allowed</p>
                </div>
                {photoFile && (
                  <div className="mt-2 flex items-center gap-2">
                     <span className="text-xs text-gray-400">Selected: {photoFile.name}</span>
                     <button
                       type="button"
                       onClick={() => {
                         setPhotoFile(null);
                         setPhotoUrl('https://via.placeholder.com/137x136');
                       }}
                       className="text-red-500 text-xs font-bold hover:underline"
                     >
                       Remove
                     </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. SENTHIL KUMAR"
                    required
                  />
                </div>
                <div>
                  <label className="label">WhatsApp Phone Number *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      className={`input ${
                        phoneStatus?.status === 'organizer'
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                          : phoneStatus?.status === 'member'
                          ? 'border-yellow-500/50 focus:border-yellow-500 focus:ring-yellow-500/20'
                          : phoneStatus?.status === 'available'
                          ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20'
                          : ''
                      } disabled:opacity-50 disabled:bg-[#000]/40 disabled:text-gray-400`}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      disabled={isPromotion} // lock phone if promoting
                      required
                    />
                    {phoneStatus && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        {phoneStatus.status === 'loading' && (
                          <RefreshCw className="animate-spin text-gray-400" size={16} />
                        )}
                        {phoneStatus.status === 'available' && (
                          <Check className="text-green-500" size={18} />
                        )}
                        {phoneStatus.status === 'member' && (
                          <Check className="text-yellow-500" size={18} />
                        )}
                        {phoneStatus.status === 'organizer' && (
                          <AlertTriangle className="text-red-500" size={18} />
                        )}
                      </div>
                    )}
                  </div>
                  {phoneStatus && (
                    <p
                      className={`text-xs mt-1 font-semibold ${
                        phoneStatus.status === 'organizer'
                          ? 'text-red-500'
                          : phoneStatus.status === 'member'
                          ? 'text-yellow-500'
                          : phoneStatus.status === 'available'
                          ? 'text-green-500'
                          : 'text-gray-400'
                      }`}
                    >
                      {phoneStatus.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Organizational Level *</label>
                  <select
                    className="input"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    required
                  >
                    <option value="">Select Level</option>
                    <option value="State">State</option>
                    <option value="Assembly">Assembly</option>
                    <option value="District">District</option>
                    <option value="Zone">Zone</option>
                    <option value="Area">Area</option>
                  </select>
                </div>
                <div>
                  <label className="label">Role / Position *</label>
                  <select
                    className="input"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    required
                  >
                    <option value="">Select Position</option>
                    {(POSITIONS_BY_LEVEL[level] || []).map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Wing *</label>
                  {wingsList.length === 0 ? (
                    <input
                      type="text"
                      className="input"
                      value={wing}
                      onChange={(e) => setWing(e.target.value)}
                      placeholder="Enter wing name"
                      required
                    />
                  ) : (
                    <select
                      className="input"
                      value={wing}
                      onChange={(e) => setWing(e.target.value)}
                      required
                    >
                      <option value="">Select Wing</option>
                      {wingsList.map((w) => (
                        <option key={w._id} value={w.name}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {level === 'State' && (
                  <div>
                    <label className="label">State *</label>
                    <select
                      className="input"
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      required
                    >
                      <option value="">Select State</option>
                      <option value="Tamil Nadu State">Tamil Nadu State</option>
                      <option value="Puducherry State">Puducherry State</option>
                    </select>
                  </div>
                )}

                {level === 'District' && (
                  <div>
                    <label className="label">District *</label>
                    <select
                      className="input"
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      required
                    >
                      <option value="">Select District</option>
                      {Object.keys(districtMap).sort().map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {level === 'Zone' && (
                  <div>
                    <label className="label">Zone *</label>
                    <select
                      className="input"
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      required
                    >
                      <option value="">Select Zone</option>
                      {ZONES_LIST.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {level === 'Assembly' && (
                  <div className="grid grid-cols-2 gap-2" style={{ gridColumn: 'span 1' }}>
                    <div>
                      <label className="label">District *</label>
                      <select
                        className="input"
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        required
                      >
                        <option value="">Select District</option>
                        {Object.keys(districtMap).sort().map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Assembly *</label>
                      <select
                        className="input"
                        value={selectedAssembly}
                        onChange={(e) => setSelectedAssembly(e.target.value)}
                        required
                      >
                        <option value="">Select Assembly</option>
                        {assembliesList.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {level === 'Area' && (
                  <div>
                    <label className="label">Area Name *</label>
                    <input
                      type="text"
                      className="input"
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      placeholder="e.g. Adyar"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Date of Birth *</label>
                  <input
                    type="date"
                    className="input"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                    required
                  />
                </div>
                <div>
                  <label className="label">Age</label>
                  <input
                    type="number"
                    className="input bg-[#000]/40 text-gray-400"
                    value={age}
                    readOnly
                  />
                </div>
                <div>
                  <label className="label">Blood Group</label>
                  <select
                    className="input"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  >
                    <option value="">Select Blood Group</option>
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Address</label>
                <textarea
                  className="input"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address details..."
                />
              </div>



              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="directActive"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-white/[0.1] bg-black text-[#66ff4c] focus:ring-[#66ff4c]/20"
                />
                <label htmlFor="directActive" className="text-sm text-gray-300 select-none cursor-pointer font-semibold">
                  Set Account Status as Active
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving || !isFormValid}
                  className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold uppercase transition-all ${
                    saving || !isFormValid
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50 border border-white/[0.05]'
                      : 'bg-[#66ff4c] text-black hover:bg-[#52e038] hover:scale-[1.02] shadow-[0_0_12px_rgba(102,255,76,0.25)]'
                  }`}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} /> Processing...
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> {isPromotion ? 'Promote to Organizer' : 'Create & Save Organizer'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Card Preview (Right/Bottom) */}
          <div className="lg:col-span-5 flex flex-col items-center gap-4">
            <div className="w-full flex justify-between items-center no-print">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Live Card Preview</h3>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 flex items-center gap-1.5 transition-all"
              >
                <Printer size={13} /> Print Card
              </button>
            </div>

            <div className="direct-card-wrap space-y-6">
              {/* FRONT CARD */}
              <div id="direct-page1-div">
                <div className="direct-front-photo-wrap">
                  <img src={photoUrl} alt="Photo" className="direct-photo rounded img-thumbnail" />
                </div>

                <div className="direct-front-stack">
                  <div className="direct-front-line">
                    <p className="direct-name">{(name || 'ORGANIZER NAME').toUpperCase()}</p>
                  </div>
                  <div className="direct-front-meta">
                    <div className="direct-front-line">
                      <p className="direct-detail-line" style={{ color: '#111' }}>{position || '—'}</p>
                    </div>
                    <div className="direct-front-line">
                      <p className="direct-detail-line" style={{ color: '#111' }}>{stateVal || '—'}</p>
                    </div>
                    <div className="direct-front-line">
                      <p className="direct-detail-line" style={{ color: '#111' }}>{wing || '—'}</p>
                    </div>
                    <div className="direct-front-line">
                      <p className="direct-id-number" style={{ color: '#111' }}>
                        {successData?.member?.membershipId || existingId || 'TNVS-XXXXXXXX'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* BACK CARD */}
              <div id="direct-page2-div">
                <div className="direct-back-content">
                  <div className="direct-back-details">
                    <div className="direct-back-row">
                      <div className="direct-back-label">DATE OF BIRTH</div>
                      <div className="direct-back-sep">:</div>
                      <div className="direct-back-value">{formatDateString(dob) || '—'}</div>
                    </div>

                    <div className="direct-back-row">
                      <div className="direct-back-label">AGE</div>
                      <div className="direct-back-sep">:</div>
                      <div className="direct-back-value">{age}</div>
                    </div>

                    <div className="direct-back-row">
                      <div className="direct-back-label">BLOOD GROUP</div>
                      <div className="direct-back-sep">:</div>
                      <div className="direct-back-value">{bloodGroup}</div>
                    </div>

                    <div className="direct-back-row" style={{ minHeight: '76px' }}>
                      <div className="direct-back-label">ADDRESS</div>
                      <div className="direct-back-sep">:</div>
                      <div className="direct-back-value address">{address || '—'}</div>
                    </div>

                    <div className="direct-back-row" style={{ marginTop: '8px' }}>
                      <div className="direct-back-label">CONTACT</div>
                      <div className="direct-back-sep">:</div>
                      <div className="direct-back-value">
                        <span className="direct-contact-value">{phone || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="direct-back-bottom">
                    <div className="direct-qr-wrap">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=96x88&data=${encodeURIComponent(
                          `https://vanigan.digital?page=verify&id=${successData?.member?.membershipId || existingId || 'TNVS-XXXXXXXX'}`
                        )}`}
                        width="96"
                        height="88"
                        alt="QR Code"
                      />
                    </div>
                    <div className="direct-sign-wrap">
                      <img src="/signature.png" alt="Signature" className="direct-signature-img" />
                      <p className="direct-signature-name">SENTHIL KUMAR N</p>
                      <p className="direct-small">Founder &amp; State President</p>
                      <p className="direct-small">Tamilnadu Vanigargalin Sangamam</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden high-res capture clones for sharing */}
      {successData && (
        <div style={{ position: "fixed", left: -9999, top: 0, pointerEvents: "none", zIndex: -1, opacity: 0 }}>
          <div ref={successFrontRef} style={{ width: 421, position: "relative", overflow: "hidden" }}>
            <CardFront member={successData.member} display="capture" />
          </div>
          <div ref={successBackRef} style={{ width: 421, position: "relative", overflow: "hidden", marginTop: 20 }}>
            <CardBack member={successData.member} display="capture" />
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 border border-brand-500/20 relative" style={{ backgroundColor: '#0A0E17' }}>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-[#66ff4c]/10 rounded-full flex items-center justify-center text-[#66ff4c] mx-auto">
                <ShieldCheck size={36} />
              </div>
              <h3 className="text-xl font-bold text-white">
                {isEditing ? 'Organizer Updated Successfully!' : (isPromotion ? 'Member Promoted Successfully!' : 'Organizer Created Successfully!')}
              </h3>
              <p className="text-sm text-gray-400">
                The organizer records have been successfully saved.
              </p>
            </div>

            <div className="mt-6 bg-[#000]/40 rounded-xl p-4 border border-white/[0.05] space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Membership ID</span>
                <span className="font-mono text-white font-bold">{successData.member.membershipId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Username/Phone</span>
                <span className="font-mono text-white font-bold">{phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Security Login PIN</span>
                <span className="font-mono text-[#66ff4c] font-black">
                  {successData.pin ? successData.pin : (isEditing ? 'Unchanged' : 'Use existing member PIN')}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-white text-xs font-bold hover:bg-white/[0.04] flex items-center justify-center gap-1.5 transition-all"
                >
                  {copied ? <Check size={14} className="text-[#66ff4c]" /> : <Clipboard size={14} />}
                  {copied ? 'Copied!' : 'Copy Credentials'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessData(null);
                    if (isEditing) {
                      navigate('/organizers');
                    } else if (isPromotion) {
                      navigate('/members');
                    } else {
                      setName('');
                      setDob('');
                      setPhone('');
                      setAddress('');
                      setBloodGroup('');
                      setLevel('');
                      setSelectedState('');
                      setSelectedDistrict('');
                      setSelectedAssembly('');
                      setSelectedZone('');
                      setSelectedArea('');
                      setPhotoFile(null);
                      setPhotoUrl('https://via.placeholder.com/137x136');
                    }
                  }}
                  className="flex-1 btn-primary py-2.5 rounded-xl text-xs font-bold"
                >
                  {isEditing ? 'Go to Organizers' : (isPromotion ? 'Go to Members' : 'Create Another')}
                </button>
              </div>
              <button
                type="button"
                onClick={handleShareCard}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all text-xs font-bold uppercase tracking-wider"
              >
                <Share2 size={14} /> Share Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crop Image Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 border border-brand-500/20 relative" style={{ backgroundColor: '#0A0E17' }}>
            <h3 className="text-lg font-bold text-white mb-4">Crop Profile Photo</h3>
            
            <div className="relative w-full h-80 bg-black rounded-xl overflow-hidden border border-white/10">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={137 / 136}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#66ff4c]"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setImageToCrop(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold"
              >
                Crop &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
