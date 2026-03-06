const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const results = document.getElementById('results');
const loader = document.getElementById('loader');
let currentImageUrl = null;
let selectedCrop = 'rice';
let currentLang = 'en';

const translations = {
    en: {
        analysisReport: '🔬 Analysis Report',
        suggestedRemedies: '💊 Suggested Remedies',
        buyMedicine: '🛒 Buy Recommended Medicine',
        newAnalysis: '🔄 New Analysis',
        dropImage: 'Drop plant image here',
        clickBrowse: 'or click to browse files',
        uploadImage: 'Upload Image',
        liveScan: 'Live Scan',
        initCamera: '🎥 Initialize Camera',
        captureAnalyze: '📸 Capture & Analyze',
        totalScans: 'Total Scans',
        activeModel: 'Active Model',
        engineVersion: 'Engine Version'
    },
    ta: {
        analysisReport: '🔬 பகுப்பாய்வு அறிக்கை',
        suggestedRemedies: '💊 பரிந்துரைக்கப்பட்ட தீர்வுகள்',
        buyMedicine: '🛒 மருந்து வாங்கு',
        newAnalysis: '🔄 புதிய பகுப்பாய்வு',
        dropImage: 'தாவர படத்தை இங்கே விடுங்கள்',
        clickBrowse: 'அல்லது கோப்புகளை உலாவ கிளிக் செய்யவும்',
        uploadImage: 'படம் பதிவேற்று',
        liveScan: 'நேரடி ஸ்கேன்',
        initCamera: '🎥 கேமரா தொடங்கு',
        captureAnalyze: '📸 படம் எடு & பகுப்பாய்வு',
        totalScans: 'மொத்த ஸ்கேன்கள்',
        activeModel: 'செயலில் மாடல்',
        engineVersion: 'இயந்திர பதிப்பு'
    }
};

function setLanguage(lang) {
    const previousLang = currentLang;
    currentLang = lang;

    const langEnBtn = document.getElementById('lang-en');
    const langTaBtn = document.getElementById('lang-ta');
    const resultLangEn = document.getElementById('result-lang-en');
    const resultLangTa = document.getElementById('result-lang-ta');

    if (langEnBtn) langEnBtn.classList.toggle('active', lang === 'en');
    if (langTaBtn) langTaBtn.classList.toggle('active', lang === 'ta');
    if (resultLangEn) resultLangEn.classList.toggle('active', lang === 'en');
    if (resultLangTa) resultLangTa.classList.toggle('active', lang === 'ta');

    document.querySelectorAll('[data-en]').forEach(el => {
        el.innerText = el.dataset[lang] || el.dataset.en;
    });

    const t = translations[lang];
    const uploadText = document.querySelector('.upload-text');
    const uploadHint = document.querySelector('.upload-hint');
    if (uploadText) uploadText.innerText = t.dropImage;
    if (uploadHint) uploadHint.innerText = t.clickBrowse;

    const tabUpload = document.getElementById('tab-upload');
    const tabScan = document.getElementById('tab-scan');
    if (tabUpload) tabUpload.innerHTML = `<span class="tab-icon">📁</span> ${t.uploadImage}`;
    if (tabScan) tabScan.innerHTML = `<span class="tab-icon">📷</span> ${t.liveScan}`;

    fetch('/api/set-lang/' + lang);

    if (results && results.style.display === 'block' && previousLang !== lang) {
        const msg = lang === 'ta'
            ? 'தமிழ் முடிவுகளுக்கு படத்தை மீண்டும் பகுப்பாய்வு செய்யவும்'
            : 'Please re-analyze the image for results in English';
        alert(msg);
    }
}

function selectCrop(el) {
    document.querySelectorAll('.crop-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    selectedCrop = el.dataset.crop;
}


dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary)';
    dropZone.style.background = 'rgba(0, 255, 136, 0.05)';
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border)';
    dropZone.style.background = 'rgba(0, 0, 0, 0.2)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border)';
    dropZone.style.background = 'rgba(0, 0, 0, 0.2)';
    handleFile(e.dataTransfer.files[0]);
});

function setMode(mode) {
    document.getElementById('upload-mode').style.display = mode === 'upload' ? 'block' : 'none';
    document.getElementById('scan-mode').style.display = mode === 'scan' ? 'block' : 'none';
    document.getElementById('tab-upload').classList.toggle('active', mode === 'upload');
    document.getElementById('tab-scan').classList.toggle('active', mode === 'scan');
    stopCamera();
}

async function startCamera() {
    const video = document.getElementById('webcam');
    const container = document.getElementById('video-container');
    const btn = document.getElementById('capture-btn');
    const startBtn = document.getElementById('start-cam-btn');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
        container.style.display = 'block';
        btn.style.display = 'inline-flex';
        startBtn.style.display = 'none';
    } catch (err) {
        alert("Camera access denied or unavailable.");
    }
}

function stopCamera() {
    const video = document.getElementById('webcam');
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(t => t.stop());
        video.srcObject = null;
    }
}

document.getElementById('capture-btn')?.addEventListener('click', () => {
    const video = document.getElementById('webcam');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(handleFile, 'image/jpeg');
});

function resetAnalysis() {
    results.style.display = 'none';
    document.getElementById('upload-mode').style.display = 'block';
    document.getElementById('conf-fill').style.width = '0%';
    if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
        currentImageUrl = null;
    }
}

async function handleFile(file) {
    if (!file) return;

    if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
    }
    currentImageUrl = URL.createObjectURL(file);

    document.getElementById('upload-mode').style.display = 'none';
    document.getElementById('scan-mode').style.display = 'none';
    loader.style.display = 'block';
    results.style.display = 'none';

    const fd = new FormData();
    fd.append('file', file);
    fd.append('crop', selectedCrop);
    fd.append('lang', currentLang);

    try {
        const res = await fetch('/api/predict', { method: 'POST', body: fd });
        const data = await res.json();

        loader.style.display = 'none';

        if (data.error) {
            alert(data.error);
            document.getElementById('upload-mode').style.display = 'block';
            return;
        }

        results.style.display = 'block';

        const resultImg = document.getElementById('result-img');
        if (data.image) {
            resultImg.src = '/uploads/' + data.image;
        } else {
            resultImg.src = currentImageUrl;
        }

        document.getElementById('d-name').innerText = data.disease_name || "Unknown";

        let conf = parseFloat(data.confidence) || 98.5;
        if (conf < 1) conf = conf * 100;

        document.getElementById('d-conf').innerText = conf.toFixed(1) + "%";
        setTimeout(() => {
            document.getElementById('conf-fill').style.width = conf + "%";
        }, 100);

        document.getElementById('d-desc').innerText = data.description || "No description available.";

        const rList = document.getElementById('d-remedies');
        rList.innerHTML = '';
        if (data.remedies && Array.isArray(data.remedies)) {
            data.remedies.forEach(r => {
                const li = document.createElement('li');
                li.innerText = r;
                rList.appendChild(li);
            });
        }

        updateStats();
    } catch (e) {
        loader.style.display = 'none';
        document.getElementById('upload-mode').style.display = 'block';
        alert("System Error: " + e.message);
    }
}

async function updateStats() {
    try {
        const res = await fetch('/api/history');
        const data = await res.json();
        const totalEl = document.getElementById('total-scans');
        if (totalEl) {
            totalEl.innerText = data.length;
        }
    } catch (e) { }
}

updateStats();

async function initLang() {
    try {
        const res = await fetch('/api/get-lang');
        const data = await res.json();
        if (data.lang && data.lang !== currentLang) {
            currentLang = data.lang;
            const langEnBtn = document.getElementById('lang-en');
            const langTaBtn = document.getElementById('lang-ta');
            if (langEnBtn) langEnBtn.classList.toggle('active', data.lang === 'en');
            if (langTaBtn) langTaBtn.classList.toggle('active', data.lang === 'ta');

            document.querySelectorAll('[data-en]').forEach(el => {
                el.innerText = el.dataset[data.lang] || el.dataset.en;
            });

            const t = translations[data.lang];
            const uploadText = document.querySelector('.upload-text');
            const uploadHint = document.querySelector('.upload-hint');
            if (uploadText) uploadText.innerText = t.dropImage;
            if (uploadHint) uploadHint.innerText = t.clickBrowse;

            const tabUpload = document.getElementById('tab-upload');
            const tabScan = document.getElementById('tab-scan');
            if (tabUpload) tabUpload.innerHTML = `<span class="tab-icon">📁</span> ${t.uploadImage}`;
            if (tabScan) tabScan.innerHTML = `<span class="tab-icon">📷</span> ${t.liveScan}`;
        }
    } catch (e) { }
}

initLang();

let currentRemedies = [];
let currentDisease = '';

function openOrderModal() {
    const remedies = Array.from(document.querySelectorAll('#d-remedies li')).map(li => li.innerText);
    currentRemedies = remedies;
    currentDisease = document.getElementById('d-name').innerText;

    const summary = document.getElementById('order-summary');
    let subtotal = 0;

    summary.innerHTML = `<h4 style="margin-bottom: 0.5rem;">Medicine for: ${currentDisease}</h4>` +
        remedies.map((r, i) => {
            const price = 150 + (i * 50);
            subtotal += price;
            return `<div class="order-item"><span class="order-item-name">${r}</span><span class="order-item-price">₹${price}</span></div>`;
        }).join('');

    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + 50 + tax;

    document.getElementById('bill-subtotal').innerText = '₹' + subtotal;
    document.getElementById('bill-tax').innerText = '₹' + tax;
    document.getElementById('bill-total').innerText = '₹' + total;

    document.getElementById('order-modal').style.display = 'flex';
}

function closeOrderModal() {
    document.getElementById('order-modal').style.display = 'none';
    document.getElementById('order-form').reset();
}

function closeSuccessModal() {
    document.getElementById('success-modal').style.display = 'none';
    resetAnalysis();
}

async function submitOrder(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const order = {
        id: 'ORD' + Date.now(),
        disease: currentDisease,
        remedies: currentRemedies,
        customer: {
            name: formData.get('fullName'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            address: formData.get('address'),
            pincode: formData.get('pincode')
        },
        payment: formData.get('payment'),
        subtotal: document.getElementById('bill-subtotal').innerText,
        tax: document.getElementById('bill-tax').innerText,
        total: document.getElementById('bill-total').innerText,
        status: 'confirmed',
        timestamp: new Date().toISOString()
    };

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });

        if (res.ok) {
            closeOrderModal();
            document.getElementById('order-id-display').innerText = order.id;
            document.getElementById('success-modal').style.display = 'flex';
        } else {
            alert('Failed to place order. Please try again.');
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

let currentRating = 0;
let lastOrderId = '';

function showFeedbackModal() {
    document.getElementById('success-modal').style.display = 'none';
    document.getElementById('feedback-modal').style.display = 'flex';
    lastOrderId = document.getElementById('order-id-display').innerText;
    currentRating = 0;
    document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
}

function closeFeedbackModal() {
    document.getElementById('feedback-modal').style.display = 'none';
    document.getElementById('feedback-form').reset();
    resetAnalysis();
}

function setRating(rating) {
    currentRating = rating;
    document.getElementById('rating-input').value = rating;
    document.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.rating) <= rating);
    });
}

async function submitFeedback(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const feedback = {
        id: 'FB' + Date.now(),
        order_id: lastOrderId,
        rating: currentRating,
        detection_quality: formData.get('detection_quality'),
        comments: formData.get('comments'),
        timestamp: new Date().toISOString()
    };

    try {
        const res = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedback)
        });

        if (res.ok) {
            closeFeedbackModal();
            alert(currentLang === 'ta' ? 'கருத்துக்கு நன்றி!' : 'Thank you for your feedback!');
        }
    } catch (err) {
        closeFeedbackModal();
    }
}
