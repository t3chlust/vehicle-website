function onProductTypeChange() {
const productType = document.getElementById('inp-product-type').value;
// Sync hidden inp-tech-type with product type selection
const techTypeEl = document.getElementById('inp-tech-type');
if (techTypeEl) techTypeEl.value = productType;

const sellerSection = document.getElementById('seller-info-section');
const serviceFields = document.getElementById('service-fields');
const partOnlyDiv = document.getElementById('div-part-only');
const brandModelDiv = document.getElementById('div-brand-model');
const tenderDiv = document.getElementById('div-tender');
const cityLabel = document.getElementById('city-label');
const mainSpecs = document.getElementById('div-main-specs');
const capDiv = document.getElementById('div-capacity');
const wheelsDiv = document.getElementById('div-wheels');
const colorDocsDiv = document.getElementById('div-color-docs');
const colorSelect = document.getElementById('inp-color');
const specsTitle = document.getElementById('card-specs');
const vehicleCard = document.getElementById('card-vehicle-info');
const descCard = document.getElementById('card-desc-photos');
const constrInp = document.getElementById('inp-construction');
const conditionSection = document.getElementById('inp-condition');
const conditionTitle = conditionSection ? conditionSection.previousElementSibling : null;
const mileageDiv = document.getElementById('div-mileage');
const priceInp = document.getElementById('inp-price');
const cityInp = document.getElementById('inp-city');
const descInp = document.getElementById('inp-desc');
const descTitle = descInp ? descInp.previousElementSibling : null;
const descPhotosDiv = document.getElementById('div-desc-photos');

// Helper: toggle required attribute based on visibility
function setReq(el, on) { if (!el) return; if (on) el.setAttribute('required','required'); else el.removeAttribute('required'); }
const sellerType = document.getElementById('inp-seller-type');
const servicePrice = document.getElementById('inp-service-price');
const serviceCity = document.getElementById('inp-service-city');

// Reset all to visible first
if (vehicleCard) vehicleCard.classList.remove('hidden');
if (descCard) descCard.classList.remove('hidden');
sellerSection.classList.remove('hidden');
serviceFields.classList.add('hidden');
partOnlyDiv.classList.add('hidden');
brandModelDiv.classList.remove('hidden');
tenderDiv.classList.add('hidden');
mainSpecs.classList.remove('hidden');
capDiv.classList.add('hidden');
wheelsDiv.classList.remove('hidden');
colorDocsDiv.classList.remove('hidden');
constrInp.classList.add('hidden');
specsTitle.classList.remove('hidden');
priceInp.classList.remove('hidden');
cityInp.classList.remove('hidden');
if (conditionSection) conditionSection.classList.remove('hidden');
if (conditionTitle) conditionTitle.classList.remove('hidden');
if (mileageDiv) mileageDiv.classList.remove('hidden');
if (descTitle) descTitle.classList.remove('hidden');
if (descInp) descInp.classList.remove('hidden');
if (colorSelect) { colorSelect.style.display = ''; colorDocsDiv.style.gridTemplateColumns = ''; }
if (descPhotosDiv) descPhotosDiv.classList.remove('hidden');
cityLabel.classList.remove('hidden');
cityLabel.innerHTML = 'Где находится техника <span style="color:#ff4757; font-weight:bold;">*</span>';
// Reset required attributes to defaults
setReq(sellerType, true);
setReq(priceInp, true);
setReq(cityInp, true);
setReq(conditionSection, true);
// Service fields off by default
setReq(servicePrice, false);
setReq(serviceCity, false);

if (productType === 'Вездеход') {
    // All fields visible, show construction
    constrInp.classList.remove('hidden');
    checkTenderVisibility();
    checkConditionVisibility();
} else if (productType === 'Мото-техника') {
    // Same as Вездеход but no construction
    constrInp.classList.add('hidden');
    tenderDiv.classList.add('hidden');
    checkConditionVisibility();
} else if (productType === 'Прицеп') {
    // Show: seller, brand-model, city, price, condition, грузоподъемность, docs, description, photos
    // Hide: construction, engine, power, transmission, fuel, chassis, amphibious, color, tires, mileage
    constrInp.classList.add('hidden');
    mainSpecs.classList.add('hidden');
    wheelsDiv.classList.add('hidden');
    capDiv.classList.remove('hidden');
    tenderDiv.classList.add('hidden');
    if (mileageDiv) mileageDiv.classList.add('hidden');
    if (colorSelect) { colorSelect.style.display = 'none'; colorDocsDiv.style.gridTemplateColumns = '1fr'; }
} else if (productType === 'Запчасть') {
    // Show: city, price, description, photos
    // Hide: seller info and everything vehicle-related
    sellerSection.classList.add('hidden');
    constrInp.classList.add('hidden');
    mainSpecs.classList.add('hidden');
    wheelsDiv.classList.add('hidden');
    capDiv.classList.add('hidden');
    brandModelDiv.classList.add('hidden');
    colorDocsDiv.classList.add('hidden');
    tenderDiv.classList.add('hidden');
    specsTitle.classList.add('hidden');
    partOnlyDiv.classList.remove('hidden');
    if (vehicleCard) vehicleCard.classList.add('hidden');
    if (conditionSection) conditionSection.classList.add('hidden');
    if (conditionTitle) conditionTitle.classList.add('hidden');
    if (mileageDiv) mileageDiv.classList.add('hidden');
    cityLabel.innerHTML = 'Город <span style="color:#ff4757; font-weight:bold;">*</span>';
    // Remove required from hidden fields
    setReq(conditionSection, false);
    setReq(sellerType, false);
    setReq(priceInp, false);
    setReq(cityInp, false);
} else if (productType === 'Услуга') {
    // Show: service fields (price, city, description, photos)
    // Hide: everything else including general description/photos
    sellerSection.classList.add('hidden');
    serviceFields.classList.remove('hidden');
    brandModelDiv.classList.add('hidden');
    tenderDiv.classList.add('hidden');
    constrInp.classList.add('hidden');
    mainSpecs.classList.add('hidden');
    wheelsDiv.classList.add('hidden');
    capDiv.classList.add('hidden');
    colorDocsDiv.classList.add('hidden');
    specsTitle.classList.add('hidden');
    priceInp.classList.add('hidden');
    cityInp.classList.add('hidden');
    cityLabel.classList.add('hidden');
    if (descPhotosDiv) descPhotosDiv.classList.add('hidden');
    if (vehicleCard) vehicleCard.classList.add('hidden');
    if (descCard) descCard.classList.add('hidden');
    if (conditionSection) conditionSection.classList.add('hidden');
    if (conditionTitle) conditionTitle.classList.add('hidden');
    if (mileageDiv) mileageDiv.classList.add('hidden');
    // Remove required from hidden fields so form can submit
    setReq(sellerType, false);
    setReq(priceInp, false);
    setReq(cityInp, false);
    setReq(conditionSection, false);
    // Service fields required for Услуга
    setReq(servicePrice, true);
    setReq(serviceCity, true);
}

checkChassisTypeVisibility();
updateSubmitButtonColor();
}
function closeModal(e) { if (e.target.id === 'modal') closeModalDirect() }
function closeModalDirect() {
    document.getElementById('modal').classList.remove('active');
    document.body.style.overflow = '';
    const btnCreate = document.getElementById('btn-create-ad');
    const btnProfile = document.getElementById('btn-profile');
    const tabs = document.getElementById('tabs-container');
    // Only show buttons if user is logged in AND tabs are visible
    if (typeof currentUser !== 'undefined' && currentUser && tabs && tabs.style.display !== 'none') {
        if (btnProfile) btnProfile.classList.remove('hidden');
        // btn-create visibility is handled by showTab (only in profile)
    }
    // Button should remain hidden if not logged in
    if (!currentUser && btnCreate) btnCreate.classList.add('hidden');
}
function showRegistrationPrompt() {
    const nameInput = document.getElementById('auth-name');
    const hint = null;
    const btn = document.getElementById('auth-register-btn');
    const codeBlock = document.getElementById('auth-code-block');
    const title = document.getElementById('auth-title-step2');
    if (nameInput) {
        nameInput.classList.remove('hidden');
        nameInput.focus();
    }
    if (hint) hint.classList.remove('hidden');
    if (btn) btn.classList.remove('hidden');
    if (codeBlock) codeBlock.classList.add('hidden');
    if (title) title.innerText = 'Введите имя';
}
function hideRegistrationPrompt() {
    const nameInput = document.getElementById('auth-name');
    const hint = null;
    const btn = document.getElementById('auth-register-btn');
    const codeBlock = document.getElementById('auth-code-block');
    const title = document.getElementById('auth-title-step2');
    if (nameInput) {
        nameInput.classList.add('hidden');
        nameInput.value = '';
    }
    if (hint) hint.classList.add('hidden');
    if (btn) btn.classList.add('hidden');
    if (codeBlock) codeBlock.classList.remove('hidden');
    // If the phone currently entered is the admin phone, show admin-specific prompt
    try {
        const phoneEl = document.getElementById('auth-phone');
        const normPhone = phoneEl ? (phoneEl.value || '').replace(/\D/g, '') : '';
        const normAdmin = (ADMIN_PHONE || '').replace(/\D/g, '');
        if (title) title.innerText = (normPhone && normPhone === normAdmin) ? 'введите код админа' : 'Введите код';
    } catch (e) {
        if (title) title.innerText = 'Введите код';
    }
}
function openAuthModal() {
    document.getElementById('auth-step-1').classList.remove('hidden');
    document.getElementById('auth-step-2').classList.add('hidden');
    document.getElementById('auth-code').value = '';
    document.getElementById('auth-phone').value = '+7';
    document.getElementById('privacy-agree-step1').checked = false;
    hideRegistrationPrompt();
    document.getElementById('auth-modal').classList.add('active');
    updateSendButtonState();
}
function closeAuthModal() { document.getElementById('auth-modal').classList.remove('active') }
function verifySmsCode() {
    const code = safeVal('auth-code')?.trim();
    if (!code) {
        const phoneEl = document.getElementById('auth-phone');
        const normPhone = phoneEl ? (phoneEl.value || '').replace(/\D/g, '') : '';
        const normAdmin = (ADMIN_PHONE || '').replace(/\D/g, '');
        alert((normPhone && normPhone === normAdmin) ? 'введите код админа' : 'Введите код');
        return;
    }
    const phone = safeVal('auth-phone').trim();
    if (!phone) {
        alert("Ошибка: номер телефона не найден");
        return;
    }
    showLoader("Проверка кода...");
    // Отправляем код на сервер для проверки
    fetch('/verify-code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            phone: phone,
            code: code
        })
    })
        .then(response => response.json())
        .then(data => {
            hideLoader();
            if (!data.success) {
                alert("Ошибка: " + (data.error || "Неверный код"));
                return;
            }
            fetch('/api/users/exists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone: phone
                })
            })
                .then(resp => resp.json())
                .then(userCheck => {
                    if (!userCheck.success) {
                        throw new Error(userCheck.error || 'Ошибка проверки пользователя');
                    }
                    if (userCheck.exists) {
                        const user = userCheck.user || {};
                        localStorage.setItem('vezdehod_auth_phone', phone);
                        localStorage.setItem('vezdehod_username', user.name || 'Пользователь');
                        localStorage.setItem('vezdehod_user_id', user.id || '');
                        currentUser = {
                            phoneNumber: phone,
                            uid: `local-${user.id || 'unknown'}`,
                            id: user.id,
                            name: user.name
                        };
                        currentUserName = user.name || 'Пользователь';
                        closeAuthModal();
                        updateAuthUI(currentUser);
                    } else {
                        showRegistrationPrompt();
                    }
                })
                .catch(err => {
                    alert("Ошибка: " + err.message);
                });
        })
        .catch(error => {
            hideLoader();
            alert("Ошибка при проверке кода: " + error.message);
        });
}
function doLogout() {
    localStorage.removeItem('vezdehod_auth_phone');
    localStorage.removeItem('vezdehod_username');
    localStorage.removeItem('vezdehod_user_id');
    sessionStorage.clear();
    currentUser = null;
    currentUserName = "";
    isAdmin = false;
    updateAuthUI(null);
    // Reload page to clear any cached state
    window.location.href = window.location.pathname;
}
function sendSmsCode() {
    const phoneInput = safeVal('auth-phone');
    if (!phoneInput) {
        alert("Введите номер телефона");
        return;
    }
    let formattedPhone = phoneInput.trim();
    if (formattedPhone.startsWith('8')) {
        formattedPhone = '+7' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
    }
    showLoader("Отправка SMS...");
    fetch('/send-sms', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            phone: formattedPhone
        })
    })
        .then(response => response.json())
        .then(data => {
            hideLoader();
            if (data.success) {
                hideRegistrationPrompt();
                // Переходим к вводу кода
                document.getElementById('auth-step-1').classList.add('hidden');
                document.getElementById('auth-step-2').classList.remove('hidden');
                document.getElementById('auth-code').value = '';
                document.getElementById('auth-code').focus();
            } else {
                alert("Ошибка при отправке СМС: " + (data.error || "Неизвестная ошибка"));
            }
        })
        .catch(error => {
            hideLoader();
            alert("Ошибка: " + error.message);
        });
}
function completeRegistration() {
    const phone = safeVal('auth-phone').trim();
    const name = safeVal('auth-name').trim();
    
    if (!name) {
        alert('Введите имя');
        return;
    }
    
    showLoader('Регистрация...');
    fetch('/api/users/ensure', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            phone: phone,
            name: name
        })
    })
        .then(resp => resp.json())
        .then(userData => {
            if (!userData.success) {
                throw new Error(userData.error || 'Не удалось создать пользователя');
            }
            const user = userData.user || {};
            localStorage.setItem('vezdehod_auth_phone', phone);
            localStorage.setItem('vezdehod_username', user.name || 'Пользователь');
            localStorage.setItem('vezdehod_user_id', user.id || '');
            currentUser = {
                phoneNumber: phone,
                uid: `local-${user.id || 'unknown'}`,
                id: user.id,
                name: user.name
            };
            currentUserName = user.name || 'Пользователь';
            closeAuthModal();
            updateAuthUI(currentUser);
        })
        .catch(err => {
            alert('Ошибка: ' + err.message);
        })
        .finally(() => hideLoader());
}
function getPriceVal(v) {
    if (!v) return 0;
    let n = String(v).replace(/[^0-9]/g, '');
    return n ? parseInt(n, 10) : 0;
}
(function () {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
})();