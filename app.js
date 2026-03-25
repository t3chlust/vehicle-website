const GOOGLE_SCRIPT_URL = "/api/ads";
const FILTERS_API_URL = "/api/filters";
const CLOUD_NAME = "duystfz2v"; const UPLOAD_PRESET = "majorka_vladikavkaz"; const NEW_STATUS_TAG = " ***STATUS_NEW***";
const ADMIN_PHONE = "+79829817369";
let confirmationResult, recaptchaVerifier, currentUser, currentUserName = "", allAds = [], allParts = [], currentAd = null, isEditMode = false, isAdmin = false, adsSearchInitialized = false, adSearchIndex = [], partsSearchInitialized = false, partSearchIndex = [], tenderSearchInitialized = false, tenderSearchIndex = [], profileShowAllAds = false, profileShowAllFavorites = false;
let adsSearchListClickListenerAdded = false, partsSearchListClickListenerAdded = false, tenderSearchListClickListenerAdded = false;
let skipAdsSearchInput = false, skipPartsSearchInput = false, skipTenderSearchInput = false; // Флаги для предотвращения рекурсии
let currentBrandFilter = null, currentTenderBrandFilter = null; // Отслеживаем активные фильтры по бренду
let profileReturnTab = 'ads';
let hasUserAdjustedFilters = false;
let currentItemType = 'ad';
let currentPhotoIndex = 0; let currentPhotos = [];
let userFavorites = []; // Массив ID избранных объявлений
function rebuildSelect(selectId, options, getValue, getLabel) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const placeholder = select.options[0] ? select.options[0].cloneNode(true) : null;
    const existingValues = new Set();
    select.innerHTML = '';
    if (placeholder) {
        select.appendChild(placeholder);
        existingValues.add(placeholder.value);
    }
    options.forEach((item) => {
        const value = getValue(item);
        if (existingValues.has(value)) return;
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = getLabel(item);
        select.appendChild(opt);
        existingValues.add(value);
    });
}
async function loadFilters() {
    try {
        const response = await fetch(FILTERS_API_URL);
        const data = await response.json();
        if (!data) return;
        const chassis = data.chassis || [];
        const transmission = data.transmission || [];
        const fuel = data.fuel || [];
        const docs = data.document || [];
        const vehicleType = data.vehicleType || [];
        const constructionType = data.constructionType || [];
        const sellerType = data.sellerType || [];
        rebuildSelect('f-wheels', chassis, (item) => item.name, (item) => item.name);
        rebuildSelect('inp-wheel-f', chassis, (item) => item.name, (item) => item.name);
        rebuildSelect('f-trans', transmission, (item) => item.name, (item) => item.name);
        rebuildSelect('inp-trans', transmission, (item) => item.name, (item) => item.name);
        rebuildSelect('f-fuel', fuel, (item) => item.name, (item) => item.name);
        rebuildSelect('inp-fuel', fuel, (item) => item.name, (item) => item.name);
        rebuildSelect('f-docs', docs, (item) => item.name, (item) => item.name);
        rebuildSelect('inp-docs', docs, (item) => item.name, (item) => item.name);
        rebuildSelect('f-construction', constructionType, (item) => item.name, (item) => item.name);
        rebuildSelect('inp-construction', constructionType, (item) => item.name, (item) => item.name);
        rebuildSelect('inp-seller-type', sellerType, (item) => String(item.id), (item) => item.name);
        rebuildSelect(
            'f-tech-type',
            vehicleType,
            (item) => item.name,
            (item) => item.name
        );
        rebuildSelect(
            'inp-tech-type',
            vehicleType,
            (item) => item.name,
            (item) => item.name
        );
    } catch (error) {
    }
}
function resetAdsFiltersOnStartup() {
    const defaults = {
        'f-sort': 'default',
        'f-price-min': '',
        'f-price-max': '',
        'f-geo': '',
        'f-cond': '',
        'f-wheels': '',
        'f-trans': '',
        'f-fuel': '',
        'f-docs': '',
        'f-amphibious': '',
        'f-tender': '',
        'f-tech-type': '',
        'f-construction': '',
        'f-color': ''
    };
    Object.entries(defaults).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
            el.setAttribute('autocomplete', 'off');
        }
    });
}
function enforceCleanFiltersState() {
    resetAdsFiltersOnStartup();
    if (Array.isArray(allAds) && allAds.length > 0 && typeof applyFilters === 'function') {
        applyFilters();
    }
}
function setupFilterInteractionTracking() {
    const markAsAdjusted = () => {
        hasUserAdjustedFilters = true;
    };
    document.addEventListener('pointerdown', (event) => {
        const target = event.target;
        if (target && target.closest && target.closest('#view-filters')) {
            markAsAdjusted();
        }
    }, true);
    document.addEventListener('touchstart', (event) => {
        const target = event.target;
        if (target && target.closest && target.closest('#view-filters')) {
            markAsAdjusted();
        }
    }, { capture: true, passive: true });
    document.addEventListener('keydown', (event) => {
        const target = event.target;
        if (target && target.closest && target.closest('#view-filters')) {
            markAsAdjusted();
        }
    }, true);
}
function goToMainFromProfile() {
    const targetTab = profileReturnTab || 'ads';
    const targetTabLink = document.querySelector(`.tab-link[onclick*="${targetTab}"]`);
    showTab(targetTabLink, targetTab);
}
function syncProfileButton(tabName) {
    const btnProfile = document.getElementById('btn-profile');
    if (!btnProfile) return;
    if (tabName === 'profile') {
        btnProfile.innerText = 'На главную';
        btnProfile.onclick = goToMainFromProfile;
    } else {
        btnProfile.innerText = 'Личный кабинет';
        btnProfile.onclick = openProfile;
    }
}
function showTab(element, tabName) {
    try {
        // Don't save 'tender' or 'admin' tabs to sessionStorage to ensure page reload goes to 'ads'
        if (tabName !== 'tender' && tabName !== 'admin') {
            sessionStorage.setItem('lastTab', tabName);
        }
    } catch (e) {
        // Ignore session storage errors
    }

    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active'));

    const target = document.getElementById(`tab-content-${tabName}`);
    if (target) {
        target.style.display = 'block';
        setTimeout(() => target.classList.add('active'), 10);
    }
    if (element) element.classList.add('active');

    // Update .t-records background color based on active tab
    const tRecords = document.querySelector('.t-records');
    if (tRecords) {
        tRecords.classList.remove('tab-ads', 'tab-parts', 'tab-manufacturers', 'tab-tender', 'tab-admin');
        tRecords.classList.add(`tab-${tabName}`);
    }

    syncProfileButton(tabName);

    if (tabName === 'admin' && typeof isAdmin !== 'undefined' && isAdmin && typeof allAds !== 'undefined') {
        if (typeof renderModerationGrid === 'function') {
            renderModerationGrid(getPendingModerationItems());
        }
    }

    if (tabName === 'profile') {
        // Check authorization before accessing profile
        if (!currentUser) {
            alert('Пожалуйста, войдите в аккаунт');
            showTab(null, 'ads');
            openAuthModal();
            return;
        }
        renderProfile();
    }

    // Обновление списков для синхронизации "избранного"
    if (tabName === 'ads' && typeof applyFilters === 'function') {
        applyFilters();
        // Восстанавливаем фильтр по бренду если он был активен
        if (currentBrandFilter) {
            const filterBtn = document.getElementById('adsClearFilterBtn');
            const input = document.getElementById('adsSearchInput');
            
            if (input) input.value = currentBrandFilter;
            if (filterBtn) filterBtn.style.display = 'flex';
            
            const brandLower = currentBrandFilter.toLowerCase();
            const filtered = allAds.filter(ad => {
                const adBrand = (ad.brand || '').toLowerCase();
                return adBrand === brandLower;
            });
            renderGrid(filtered);
        }
    }
    if (tabName === 'parts' && typeof renderPartsGrid === 'function' && Array.isArray(allParts)) {
        renderPartsGrid(allParts);
    }
    // ДОБАВЬТЕ ЭТО УСЛОВИЕ
    if (tabName === 'tender') {
        // Сбрасываем инициализацию поиска для переинициализации при переключении вкладок
        tenderSearchInitialized = false;
        
        // Восстанавливаем фильтр по бренду если он был активен
        if (currentTenderBrandFilter) {
            const filterBtn = document.getElementById('tenderClearFilterBtn');
            const input = document.getElementById('tenderSearchInput');
            
            if (input) input.value = currentTenderBrandFilter;
            if (filterBtn) filterBtn.style.display = 'flex';
            
            const brandLower = currentTenderBrandFilter.toLowerCase();
            const filtered = allAds.filter(ad => {
                const adBrand = (ad.brand || '').toLowerCase();
                const isTender = (ad.tender || '').toLowerCase() === 'yes';
                return isTender && adBrand === brandLower;
            });
            renderTenderAds(filtered);
        } else {
            renderTenderAds();
        }
    }

    const btnCreate = document.getElementById('btn-create-ad');
    if (btnCreate) {
        if (typeof currentUser !== 'undefined' && currentUser && tabName !== 'profile') {
            btnCreate.classList.remove('hidden');
        } else {
            btnCreate.classList.add('hidden');
        }
    }
    updateFooterButtonVisibility();
}

function formatPriceInput(input) {
    let val = input.value.replace(/\s/g, '');
    if (val === '') { input.value = ''; return; }
    let num = parseInt(val, 10);
    if (isNaN(num)) { input.value = ''; return; }
    input.value = num.toLocaleString('ru-RU').replace(/,/g, ' ');
}
function getPriceValue(id) {
    const el = document.getElementById(id);
    if (!el || !el.value) return '';
    return el.value.replace(/\s/g, '');
}
function showExistingMedia(ad) {
    const container = document.getElementById('preview-container');
    if (!container) return;
    
    // Clear existing media and new previews
    container.innerHTML = '';
    
    // Parse existing photos and videos
    const photos = ad.photos ? ad.photos.split(',').filter(p => p.startsWith('http')) : [];
    const videos = ad.videos ? ad.videos.split(',').filter(v => v.startsWith('http')) : [];
    const allMedia = [...photos, ...videos];
    
    // Store references for tracking deletions
    window.currentAdExistingMedia = allMedia;
    window.currentAdDeletedMedia = [];
    
    if (allMedia.length > 0) {
        document.getElementById('file-count').innerText = `Файлов: ${allMedia.length} существующих`;
        
        // Display existing media
        photos.forEach((photoUrl, index) => {
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.className = 'existing-media';
            wrapper.setAttribute('data-media-type', 'photo');
            wrapper.setAttribute('data-media-url', photoUrl);
            
            const img = document.createElement('img');
            img.src = photoUrl;
            img.style.width = '100%';
            img.style.height = '100px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '4px';
            img.style.cursor = 'pointer';
            img.onclick = (e) => {
                e.stopPropagation();
                openMediaPreview(photoUrl, 'photo');
            };
            wrapper.appendChild(img);
            
            // Add delete button
            const deleteBtn = document.createElement('div');
            deleteBtn.textContent = '✕';
            deleteBtn.style.position = 'absolute';
            deleteBtn.style.top = '4px';
            deleteBtn.style.right = '4px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.fontSize = '20px';
            deleteBtn.style.color = 'white';
            deleteBtn.style.backgroundColor = 'rgba(255,0,0,0.7)';
            deleteBtn.style.width = '24px';
            deleteBtn.style.height = '24px';
            deleteBtn.style.borderRadius = '50%';
            deleteBtn.style.display = 'flex';
            deleteBtn.style.alignItems = 'center';
            deleteBtn.style.justifyContent = 'center';
            deleteBtn.style.fontSize = '14px';
            deleteBtn.style.lineHeight = '1';
            deleteBtn.style.paddingTop = '1px';
            deleteBtn.style.fontWeight = 'bold';
            deleteBtn.onclick = (e) => deleteMediaItem(photoUrl, 'photo', wrapper);
            wrapper.appendChild(deleteBtn);
            
            container.appendChild(wrapper);
        });
        
        videos.forEach((videoUrl, index) => {
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.className = 'existing-media';
            wrapper.setAttribute('data-media-type', 'video');
            wrapper.setAttribute('data-media-url', videoUrl);
            
            const video = document.createElement('video');
            video.src = videoUrl;
            video.style.width = '100%';
            video.style.height = '100px';
            video.style.objectFit = 'cover';
            video.style.borderRadius = '4px';
            video.style.backgroundColor = '#000';
            video.style.cursor = 'pointer';
            video.onclick = (e) => {
                e.stopPropagation();
                openMediaPreview(videoUrl, 'video');
            };
            wrapper.appendChild(video);
            
            // Add delete button
            const deleteBtn = document.createElement('div');
            deleteBtn.textContent = '✕';
            deleteBtn.style.position = 'absolute';
            deleteBtn.style.top = '4px';
            deleteBtn.style.right = '4px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.fontSize = '20px';
            deleteBtn.style.color = 'white';
            deleteBtn.style.backgroundColor = 'rgba(255,0,0,0.7)';
            deleteBtn.style.width = '24px';
            deleteBtn.style.height = '24px';
            deleteBtn.style.borderRadius = '50%';
            deleteBtn.style.display = 'flex';
            deleteBtn.style.alignItems = 'center';
            deleteBtn.style.justifyContent = 'center';
            deleteBtn.style.fontSize = '14px';
            deleteBtn.style.lineHeight = '1';
            deleteBtn.style.paddingTop = '1px';
            deleteBtn.style.fontWeight = 'bold';
            deleteBtn.onclick = (e) => deleteMediaItem(videoUrl, 'video', wrapper);
            wrapper.appendChild(deleteBtn);
            
            container.appendChild(wrapper);
        });
    }
}
function openMediaPreview(mediaUrl, mediaType) {
    // Create modal overlay
    let modal = document.getElementById('media-preview-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'media-preview-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modal.style.zIndex = '10000';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.flexDirection = 'column';
        document.body.appendChild(modal);
    }
    
    // Clear previous content
    modal.innerHTML = '';
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '20px';
    closeBtn.style.right = '20px';
    closeBtn.style.background = 'rgba(255,255,255,0.2)';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'white';
    closeBtn.style.fontSize = '40px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.width = '50px';
    closeBtn.style.height = '50px';
    closeBtn.style.borderRadius = '50%';
    closeBtn.style.zIndex = '10001';
    closeBtn.style.transition = 'background 0.2s';
    closeBtn.style.display = 'flex';
    closeBtn.style.alignItems = 'center';
    closeBtn.style.justifyContent = 'center';
    closeBtn.style.padding = '0';
    closeBtn.style.lineHeight = '1';
    closeBtn.onclick = () => closeMediaPreview();
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.3)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
    modal.appendChild(closeBtn);
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.style.maxWidth = '90vw';
    contentContainer.style.maxHeight = '90vh';
    contentContainer.style.display = 'flex';
    contentContainer.style.alignItems = 'center';
    contentContainer.style.justifyContent = 'center';
    
    if (mediaType === 'photo') {
        const img = document.createElement('img');
        img.src = mediaUrl;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        contentContainer.appendChild(img);
    } else if (mediaType === 'video') {
        const video = document.createElement('video');
        video.src = mediaUrl;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '100%';
        video.controls = true;
        video.autoplay = true;
        contentContainer.appendChild(video);
    }
    
    modal.appendChild(contentContainer);
    modal.style.display = 'flex';
    
    // Block scrolling on body
    document.body.style.overflow = 'hidden';
    
    // Close on background click
    modal.onclick = (e) => {
        if (e.target === modal) closeMediaPreview();
    };
    
    // Close on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeMediaPreview();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}
function closeMediaPreview() {
    const modal = document.getElementById('media-preview-modal');
    if (modal) {
        modal.style.display = 'none';
        // Restore scrolling on body
        document.body.style.overflow = '';
    }
}
function deleteMediaItem(mediaUrl, mediaType, wrapperElement) {
    // Remove from UI
    wrapperElement.remove();
    
    // Track deletion
    if (!window.currentAdDeletedMedia) window.currentAdDeletedMedia = [];
    window.currentAdDeletedMedia.push({ url: mediaUrl, type: mediaType });
    
    // Update count
    const container = document.getElementById('preview-container');
    const newCount = container.querySelectorAll('.existing-media').length + 
                    document.getElementById('inp-media').files.length;
    const countEl = document.getElementById('file-count');
    if (newCount > 0) {
        countEl.innerText = `Файлов: ${newCount}`;
    } else {
        countEl.innerText = '';
    }
}
function accumulateMediaFiles() {
    const mediaInput = document.getElementById('inp-media');
    if (!window.accumulatedMediaFiles) {
        window.accumulatedMediaFiles = [];
    }
    
    // Add new files to accumulated array
    for (let i = 0; i < mediaInput.files.length; i++) {
        window.accumulatedMediaFiles.push(mediaInput.files[i]);
    }
    
    // Clear the input so user can select same files again if needed
    mediaInput.value = '';
    
    // Show preview with accumulated files
    showFilePreview();
}
function showFilePreview() {
    const container = document.getElementById('preview-container');
    const countEl = document.getElementById('file-count');
    
    if (!window.accumulatedMediaFiles) {
        window.accumulatedMediaFiles = [];
    }
    
    // Clear only new media previews, keep existing media
    const newPreviewsContainer = container.querySelector('#new-previews') || 
        (() => {
            const div = document.createElement('div');
            div.id = 'new-previews';
            div.style.display = 'contents';
            container.appendChild(div);
            return div;
        })();
    
    newPreviewsContainer.innerHTML = '';
    const totalFiles = window.accumulatedMediaFiles.length;
    
    // Update count
    const existingCount = container.querySelectorAll('.existing-media').length;
    const totalCount = existingCount + totalFiles;
    if (totalCount > 0) {
        countEl.innerText = `Файлов: ${totalCount} (${existingCount} существующих, ${totalFiles} новых)`;
    } else {
        countEl.innerText = '';
    }
    
    // Process new media files
    for (let i = 0; i < totalFiles; i++) {
        const file = window.accumulatedMediaFiles[i];
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (!isImage && !isVideo) continue;
        
        const reader = new FileReader();
        reader.onload = function (e) {
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.className = 'new-media-preview';
            
            if (isImage) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '100%';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '4px';
                img.style.cursor = 'pointer';
                img.onclick = (evt) => {
                    evt.stopPropagation();
                    openMediaPreview(e.target.result, 'photo');
                };
                wrapper.appendChild(img);
            } else if (isVideo) {
                const video = document.createElement('video');
                video.src = e.target.result;
                video.style.width = '100%';
                video.style.height = '100px';
                video.style.objectFit = 'cover';
                video.style.borderRadius = '4px';
                video.style.backgroundColor = '#000';
                video.style.cursor = 'pointer';
                video.onclick = (evt) => {
                    evt.stopPropagation();
                    openMediaPreview(e.target.result, 'video');
                };
                wrapper.appendChild(video);
            }
            
            // Add delete button to new media
            const deleteBtn = document.createElement('div');
            deleteBtn.textContent = '✕';
            deleteBtn.style.position = 'absolute';
            deleteBtn.style.top = '4px';
            deleteBtn.style.right = '4px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.fontSize = '20px';
            deleteBtn.style.color = 'white';
            deleteBtn.style.backgroundColor = 'rgba(255,0,0,0.7)';
            deleteBtn.style.width = '24px';
            deleteBtn.style.height = '24px';
            deleteBtn.style.borderRadius = '50%';
            deleteBtn.style.display = 'flex';
            deleteBtn.style.alignItems = 'center';
            deleteBtn.style.justifyContent = 'center';
            deleteBtn.style.fontSize = '14px';
            deleteBtn.style.lineHeight = '1';
            deleteBtn.style.paddingTop = '1px';
            deleteBtn.style.fontWeight = 'bold';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                // Remove file from accumulated array
                window.accumulatedMediaFiles.splice(i, 1);
                // Refresh preview
                showFilePreview();
            };
            wrapper.appendChild(deleteBtn);
            
            newPreviewsContainer.appendChild(wrapper);
        };
        reader.readAsDataURL(file);
    }
}
function safeVal(id) { const e = document.getElementById(id); return e ? e.value : "" }
function setVal(i, v) { const e = document.getElementById(i); if (e) e.value = v }
function normalizeText(value) { return String(value || '').toLowerCase().trim(); }
function getSellerTypeLabel(ad) { return ad && (ad.sellerType || ad.sellerTypeName) ? (ad.sellerType || ad.sellerTypeName) : ''; }
function isPrivateSellerLabel(label) { return normalizeText(label) === 'владелец'; }
function isFactorySellerLabel(label) { return normalizeText(label) === 'производитель'; }
function isTenderSellerLabel(label) {
    const val = normalizeText(label);
    return val === 'производитель' || val === 'дилер' || val === 'диллер';
}
function setSellerTypeSelectByLabel(label) {
    const select = document.getElementById('inp-seller-type');
    if (!select) return;
    const target = normalizeText(label);
    if (!target) return;
    const options = Array.from(select.options || []);
    const found = options.find(opt => normalizeText(opt.textContent) === target);
    if (found) select.value = found.value;
}
function tryAutoLogin() {
    const savedPhone = localStorage.getItem('vezdehod_auth_phone');
    const savedUserId = localStorage.getItem('vezdehod_user_id');
    
    // Clear invalid or incomplete auth data
    if (!savedPhone || !savedUserId) {
        localStorage.removeItem('vezdehod_auth_phone');
        localStorage.removeItem('vezdehod_username');
        localStorage.removeItem('vezdehod_user_id');
        currentUser = null;
        currentUserName = "";
        isAdmin = false;
        return;
    }
    
    // Restore valid session
    currentUser = {
        phoneNumber: savedPhone,
        uid: `local-${savedUserId}`,
        id: Number(savedUserId),
        name: localStorage.getItem('vezdehod_username') || "Пользователь"
    };
    currentUserName = localStorage.getItem('vezdehod_username') || "Пользователь";
    const normPhone = savedPhone.replace(/\D/g, '');
    const normAdmin = ADMIN_PHONE.replace(/\D/g, '');
    isAdmin = (normPhone === normAdmin);
    updateAuthUI(currentUser);
    if (isAdmin) {
        const adminTab = document.getElementById('admin-tab-link');
        if (adminTab) adminTab.classList.remove('hidden');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    // Force clear all cached auth data on page load
    const savedPhone = localStorage.getItem('vezdehod_auth_phone');
    const savedUserId = localStorage.getItem('vezdehod_user_id');
    if (!savedPhone || !savedUserId) {
        // If incomplete data, clear everything
        localStorage.removeItem('vezdehod_auth_phone');
        localStorage.removeItem('vezdehod_username');
        localStorage.removeItem('vezdehod_user_id');
        currentUser = null;
        currentUserName = "";
        isAdmin = false;
    }
    
    const allRecords = document.getElementById('allrecords');
    if (allRecords) {
        allRecords.style.opacity = '1';
        allRecords.classList.add('t-records_visible');
    }
    setupFilterInteractionTracking();
    enforceCleanFiltersState();
    tryAutoLogin();
    try {
        // Always show 'ads' (Техника) tab on page load
        const tabLinks = Array.from(document.querySelectorAll('.tab-link'));
        const tabLink = tabLinks.find(link => {
            const handler = link.getAttribute('onclick') || '';
            return handler.includes(`'ads'`) || handler.includes(`"ads"`);
        });
        showTab(tabLink || null, 'ads');
        sessionStorage.removeItem('lastTab');
    } catch (e) {
    }
    loadFilters()
        .then(() => enforceCleanFiltersState())
    loadAds();
    loadParts();
    // Логирование всех кликов для отладки
    document.addEventListener('click', function(e) {
        // Логируем ВСЕ клики на manufacturer элементы
        if (e.target.classList?.contains('manufacturer')) {
        }
        if (e.target.id === 'adsSearchList' || e.target.parentElement?.id === 'adsSearchList') {
        }
    }, true); // Capture phase!
    // Firefox может восстанавливать значения полей с задержкой (особенно на проде)
    setTimeout(enforceCleanFiltersState, 100);
    setTimeout(enforceCleanFiltersState, 600);
    setTimeout(enforceCleanFiltersState, 1500);
});
window.addEventListener('pageshow', () => {
    setTimeout(enforceCleanFiltersState, 0);
});
function clearAllFilters() {
    resetAdsFiltersOnStartup(); // Эта функция у вас уже есть, она сбрасывает поля
    applyFilters();           // А эта применяет "пустые" фильтры и обновляет список
}

function toggleFilters() { const fw = document.getElementById('filters-wrapper'); if (fw.classList.contains('open')) { fw.classList.remove('open'); } else { fw.classList.add('open'); } }

function toggleTenderFilters() { const fw = document.getElementById('tender-filters-wrapper'); if (fw.classList.contains('open')) { fw.classList.remove('open'); } else { fw.classList.add('open'); } }

function resetTenderFiltersOnStartup() {
    document.getElementById('f-tender-sort').value = 'default';
    document.getElementById('f-tender-price-min').value = '';
    document.getElementById('f-tender-price-max').value = '';
    document.getElementById('f-tender-geo').value = '';
    document.getElementById('f-tender-cond').value = '';
    document.getElementById('f-tender-wheels').value = '';
    document.getElementById('f-tender-trans').value = '';
    document.getElementById('f-tender-fuel').value = '';
    document.getElementById('f-tender-docs').value = '';
    document.getElementById('f-tender-amphibious').value = '';
    document.getElementById('f-tender-tech-type').value = '';
    document.getElementById('f-tender-construction').value = '';
    document.getElementById('f-tender-color').value = '';
}

function clearAllTenderFilters() {
    resetTenderFiltersOnStartup();
    applyTenderFilters();
}

function applyTenderFilters() {
    let filteredAds = allAds.filter(ad => (ad.tender || "").toLowerCase() === 'yes');
    const minStr = getPriceValue('f-tender-price-min');
    const maxStr = getPriceValue('f-tender-price-max');
    const min = minStr ? parseInt(minStr, 10) : 0;
    const max = maxStr ? parseInt(maxStr, 10) : 0;
    const cond = document.getElementById('f-tender-cond')?.value || '';
    const wheels = document.getElementById('f-tender-wheels')?.value || '';
    const color = document.getElementById('f-tender-color')?.value || '';
    const geo = (document.getElementById('f-tender-geo')?.value || '').toLowerCase().trim();
    const sortType = document.getElementById('f-tender-sort')?.value || 'default';
    const amph = document.getElementById('f-tender-amphibious')?.value || '';
    const trans = document.getElementById('f-tender-trans')?.value || '';
    const fuel = document.getElementById('f-tender-fuel')?.value || '';
    const docs = document.getElementById('f-tender-docs')?.value || '';
    const techType = document.getElementById('f-tender-tech-type')?.value || '';
    const constr = document.getElementById('f-tender-construction')?.value || '';
    
    let filtered = filteredAds.filter(ad => {
        const adPrice = Number(ad.price || 0);
        if (min && adPrice < min) return false;
        if (max && adPrice > max) return false;
        if (cond) { const isNew = checkIsNew(ad); if (cond === 'new' && !isNew) return false; if (cond === 'used' && isNew) return false; }
        if (color && (ad.color || "").trim() !== color) return false;
        if (wheels && (ad.wheelFormula || "").trim() !== wheels) return false;
        if (amph && (ad.amphibious || "no") !== amph) return false;
        if (trans && (ad.transmission || "").trim() !== trans) return false;
        if (fuel && (ad.fuel || "").trim() !== fuel) return false;
        if (docs) {
            if (docs === 'Без документов') { if (ad.docs && ad.docs !== 'Без документов') return false; }
            else if ((ad.docs || "").trim() !== docs) return false;
        }
        if (techType && (ad.techType || "").trim() !== techType) return false;
        if (constr && (ad.constructionType || "").trim() !== constr) return false;
        if (geo) { const adGeo = ((ad.region || "") + " " + (ad.city || "")).toLowerCase(); if (!adGeo.includes(geo)) return false; }
        return true;
    });
    
    if (sortType === 'asc') {
        filtered.sort((a, b) => getPriceVal(a.price) - getPriceVal(b.price));
    } else if (sortType === 'desc') {
        filtered.sort((a, b) => getPriceVal(a.price) - getPriceVal(b.price)).reverse();
    } else {
        filtered.sort((a, b) => Number(b.rowIndex) - Number(a.rowIndex));
    }
    
    renderTenderAds(filtered);
}
function checkIsNew(ad) { if (ad.desc && ad.desc.includes(NEW_STATUS_TAG.trim())) return true; if (ad.condition === 'new') return true; return false; }
function handlePhoneInput(input) {
    // Оставляем только цифры и +
    let value = input.value.replace(/[^0-9+]/g, '');
    // Извлекаем только цифры
    let digits = value.replace(/[^0-9]/g, '');
    // Если начинается с 7 (и не +7), удаляем первую 7
    if (digits.startsWith('7')) {
        digits = digits.substring(1);
    }
    // Ограничиваем максимум 10 цифр (после +7)
    digits = digits.substring(0, 10);
    // Форматируем в +7XXXXXXXXXX
    input.value = '+7' + digits;
    updateSmsButtonState();
}
function handlePhoneInputPaste(input) {
    // Получаем текст из буфера обмена
    navigator.clipboard.readText().then(text => {
        // Очищаем и устанавливаем новое значение
        input.value = text;
        // Обрабатываем
        handlePhoneInput(input);
    }).catch(() => {
        // Fallback если clipboard API не доступен
        // Просто используем текущее значение поля
        handlePhoneInput(input);
    });
}
function updateSmsButtonState() {
    const phoneInput = document.getElementById('auth-phone');
    const sendBtn = document.querySelector('#auth-step-1 .btn-black');
    if (!phoneInput || !sendBtn) return;
    // Проверяем: номер должен быть +7 + 10 цифр = 12 символов всего
    const digitCount = phoneInput.value.replace(/[^0-9]/g, '').length;
    const isValid = phoneInput.value.startsWith('+7') && digitCount === 11;
    updateSendButtonState();  // Обновляем с учетом валидации номера и чекбокса
}

function updateSendButtonState() {
    const phoneInput = document.getElementById('auth-phone');
    const privacyCheckbox = document.getElementById('privacy-agree-step1');
    const sendBtn = document.querySelector('#auth-step-1 .btn-black');
    if (!phoneInput || !privacyCheckbox || !sendBtn) return;
    
    // Проверяем: номер должен быть +7 + 10 цифр = 12 символов всего
    const digitCount = phoneInput.value.replace(/[^0-9]/g, '').length;
    const isPhoneValid = phoneInput.value.startsWith('+7') && digitCount === 11;
    const isPrivacyChecked = privacyCheckbox.checked;
    
    const isEnabled = isPhoneValid && isPrivacyChecked;
    sendBtn.disabled = !isEnabled;
    sendBtn.style.opacity = isEnabled ? '1' : '0.5';
    sendBtn.style.cursor = isEnabled ? 'pointer' : 'not-allowed';
}
function checkTenderVisibility() {
    const select = document.getElementById('inp-seller-type');
    const tenderDiv = document.getElementById('div-tender');
    const productType = document.getElementById('inp-product-type');
    if (!select || !tenderDiv || !productType) return;
    const selected = select.options[select.selectedIndex];
    const label = selected ? selected.textContent : '';
    const isTenderSeller = isTenderSellerLabel(label);
    const isAllTerrain = productType.value === 'Вездеход';
    if (isTenderSeller && isAllTerrain) {
        tenderDiv.classList.remove('hidden');
    } else {
        tenderDiv.classList.add('hidden');
        document.getElementById('inp-tender').value = 'no';
    }
}
function checkConditionVisibility() {
    const cond = document.getElementById('inp-condition').value;
    const mileageDiv = document.getElementById('div-mileage');
    const type = document.getElementById('inp-product-type').value;
    if (type === 'Запчасть' || type === 'Прицеп' || type === 'Услуга') {
        mileageDiv.classList.add('hidden');
        document.getElementById('inp-mileage').value = '';
        return;
    }
    if (cond === 'used') {
        mileageDiv.classList.remove('hidden');
    } else {
        mileageDiv.classList.add('hidden');
        document.getElementById('inp-mileage').value = '';
    }
}
function checkTechTypeVisibility() {
    // Delegate to onProductTypeChange — all logic is there now
    // Sync inp-product-type from inp-tech-type if needed (edit mode)
    const techType = document.getElementById('inp-tech-type').value;
    const productType = document.getElementById('inp-product-type');
    if (productType && techType) {
        // Check if option exists
        const options = Array.from(productType.options).map(o => o.value);
        if (options.includes(techType)) {
            productType.value = techType;
        }
    }
    onProductTypeChange();
}

function updateSubmitButtonColor() {
    const type = document.getElementById('inp-product-type').value;
    const tenderVal = document.getElementById('inp-tender').value;
    const submitBtn = document.getElementById('submit-btn');
    const tRecords = document.querySelector('.t-records');
    if (!submitBtn) return;

    // Check if tender is selected
    if (tenderVal === 'yes') {
        submitBtn.style.backgroundColor = '#9C27B0';
        if (tRecords) {
            tRecords.classList.remove('tab-ads', 'tab-parts', 'tab-manufacturers', 'tab-tender', 'tab-admin');
            tRecords.classList.add('tab-tender');
        }
    } else {
        submitBtn.style.backgroundColor = '';
        // Remove all color classes
        submitBtn.classList.remove('btn-purple', 'btn-yellow', 'btn-green');

        if (type === 'Запчасть') {
            submitBtn.classList.add('btn-yellow');
            if (tRecords) {
                tRecords.classList.remove('tab-ads', 'tab-parts', 'tab-manufacturers', 'tab-tender', 'tab-admin');
                tRecords.classList.add('tab-parts');
            }
        } else {
            submitBtn.classList.add('btn-green');
            if (tRecords) {
                tRecords.classList.remove('tab-ads', 'tab-parts', 'tab-manufacturers', 'tab-tender', 'tab-admin');
                tRecords.classList.add('tab-ads');
            }
        }
    }
}

function checkChassisTypeVisibility() {
    const type = document.getElementById('inp-product-type').value;
    const wheelType = safeVal('inp-wheel-f');
    const wheelsDiv = document.getElementById('div-wheels');
    if (!wheelsDiv) return;
    if (type === 'Запчасть' || type === 'Прицеп' || type === 'Услуга') {
        return;
    }
    if (wheelType === 'Гусеничный') {
        wheelsDiv.classList.add('hidden');
        setVal('tire-d', '');
        setVal('tire-w', '');
    } else {
        wheelsDiv.classList.remove('hidden');
    }
}
function checkFuelTypeVisibility() {
    const fuel = safeVal('inp-fuel');
    const transField = document.getElementById('inp-trans');
    const engineField = document.getElementById('inp-engine');
    if (fuel === 'Электричество') {
        if (transField) transField.removeAttribute('required');
        if (engineField) engineField.removeAttribute('required');
    } else {
        if (transField) transField.setAttribute('required', 'required');
        if (engineField) engineField.setAttribute('required', 'required');
    }
}
function updateFooterButtonVisibility() {
    const footerBtn = document.querySelector('.footer-top-link');
    const formView = document.getElementById('view-form');
    const profileTab = document.getElementById('tab-content-profile');
    if (!footerBtn) return;
    // Проверяем видимость формы и профиля
    const isFormVisible = formView && !formView.classList.contains('hidden');
    const isProfileActive = profileTab && profileTab.classList.contains('active');
    // Скрываем кнопку если видна форма или профиль
    if (isFormVisible || isProfileActive) {
        footerBtn.style.display = 'none';
    } else {
        footerBtn.style.display = '';
    }
}
function applyFilters() {
    let approvedAds = allAds;
    const useUiFilters = hasUserAdjustedFilters;
    const minStr = useUiFilters ? getPriceValue('f-price-min') : '';
    const maxStr = useUiFilters ? getPriceValue('f-price-max') : '';
    const min = minStr ? parseInt(minStr, 10) : 0;
    const max = maxStr ? parseInt(maxStr, 10) : 0;
    const cond = useUiFilters ? safeVal('f-cond') : '';
    const wheels = useUiFilters ? safeVal('f-wheels') : '';
    const color = useUiFilters ? safeVal('f-color') : '';
    const geo = useUiFilters ? safeVal('f-geo').toLowerCase().trim() : '';
    const sortType = useUiFilters ? safeVal('f-sort') : 'default';
    const amph = useUiFilters ? safeVal('f-amphibious') : '';
    const trans = useUiFilters ? safeVal('f-trans') : '';
    const fuel = useUiFilters ? safeVal('f-fuel') : '';
    const docs = useUiFilters ? safeVal('f-docs') : '';
    const tender = useUiFilters ? safeVal('f-tender') : '';
    const techType = useUiFilters ? safeVal('f-tech-type') : '';
    const constr = useUiFilters ? safeVal('f-construction') : '';
    let filtered = approvedAds.filter(ad => {
        const adPrice = Number(ad.price || 0);
        if (min && adPrice < min) return false;
        if (max && adPrice > max) return false;
        if (cond) { const isNew = checkIsNew(ad); if (cond === 'new' && !isNew) return false; if (cond === 'used' && isNew) return false; }
        if (color && (ad.color || "").trim() !== color) return false;
        if (wheels && (ad.wheelFormula || "").trim() !== wheels) return false;
        if (amph && (ad.amphibious || "no") !== amph) return false;
        if (trans && (ad.transmission || "").trim() !== trans) return false;
        if (fuel && (ad.fuel || "").trim() !== fuel) return false;
        if (docs) {
            if (docs === 'Без документов') { if (ad.docs && ad.docs !== 'Без документов') return false; }
            else if ((ad.docs || "").trim() !== docs) return false;
        }
        if (tender && (ad.tender || "no") !== tender) return false;
        if (techType && (ad.techType || "").trim() !== techType) return false;
        if (constr && (ad.constructionType || "").trim() !== constr) return false;
        if (geo) { const adGeo = ((ad.region || "") + " " + (ad.city || "")).toLowerCase(); if (!adGeo.includes(geo)) return false; }
        return true;
    });
    if (sortType === 'asc') {
        filtered.sort((a, b) => getPriceVal(a.price) - getPriceVal(b.price));
    } else if (sortType === 'desc') {
        filtered.sort((a, b) => getPriceVal(a.price) - getPriceVal(b.price)).reverse();
    } else {
        filtered.sort((a, b) => Number(b.rowIndex) - Number(a.rowIndex));
    }
    renderGrid(filtered);
    if (isAdmin) {
        renderModerationGrid(getPendingModerationItems());
    }
}
async function fetchJsonNoCacheWithRetry(endpoint, retryOnEmptyArray = false) {
    let lastError = null;
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const separator = endpoint.includes('?') ? '&' : '?';
            const cacheBust = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const url = `${endpoint}${separator}_=${cacheBust}`;
            const response = await fetch(url, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            const json = await response.json();
            if (retryOnEmptyArray && Array.isArray(json) && json.length === 0 && attempt === 0) {
                continue;
            }
            return json;
        } catch (e) {
            lastError = e;
        }
    }
    throw lastError || new Error('Не удалось получить данные');
}
function xhrGetJsonNoCache(endpoint) {
    return new Promise((resolve, reject) => {
        const separator = endpoint.includes('?') ? '&' : '?';
        const cacheBust = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const url = `${endpoint}${separator}_=${cacheBust}`;
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        xhr.setRequestHeader('Pragma', 'no-cache');
        xhr.setRequestHeader('Expires', '0');
        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    resolve(JSON.parse(xhr.responseText));
                } catch (e) {
                    reject(e);
                }
            } else {
                reject(new Error(`HTTP ${xhr.status}`));
            }
        };
        xhr.onerror = function () {
            reject(new Error('XHR network error'));
        };
        xhr.send();
    });
}
async function fetchDatasetWithFallback(endpoint) {
    const primary = await fetchJsonNoCacheWithRetry(endpoint, true);
    if (Array.isArray(primary) && primary.length > 0) {
        return primary;
    }
    try {
        const fallback = await xhrGetJsonNoCache(endpoint);
        if (Array.isArray(fallback)) {
            return fallback;
        }
    } catch (e) {
    }
    try {
        const queryEndpoint = endpoint === '/api/listings'
            ? '/api/listings/query'
            : endpoint === '/api/spares'
                ? '/api/spares/query'
                : null;
        if (queryEndpoint) {
            const postResponse = await fetch(queryEndpoint, {
                method: 'POST',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                body: JSON.stringify({ _ts: Date.now() })
            });
            const postJson = await postResponse.json();
            if (Array.isArray(postJson)) {
                return postJson;
            }
        }
    } catch (e) {
    }
    return Array.isArray(primary) ? primary : [];
}

function getHighlightColor(opacity = 0.35) {
    // Determine active tab
    const activeTab = document.querySelector('.tab-link.active');
    const activeTabName = activeTab ? activeTab.getAttribute('onclick')?.match(/'([^']+)'/) : null;
    const tabName = activeTabName ? activeTabName[1] : 'ads';

    let rgb;
    if (tabName === 'ads') {
        rgb = '38, 166, 154'; // #26A69A - green
    } else if (tabName === 'parts') {
        rgb = '255, 193, 7'; // #FFC107 - yellow
    } else if (tabName === 'manufacturers') {
        rgb = '30, 136, 229'; // #1E88E5 - blue
    } else {
        rgb = '171, 71, 188'; // default purple
    }
    return `rgba(${rgb}, ${opacity})`;
}

function buildAdSearchIndex(ads) {
    const approved = ads || [];
    adSearchIndex = approved
        .map(ad => {
            const title = (ad.title || '').trim();
            const brand = (ad.brand || '').trim();
            return {
                id: ad.rowIndex,
                title: title,
                titleLower: title.toLowerCase(),
                brand: brand,
                brandLower: brand.toLowerCase()
            };
        })
        .filter(item => item.title);
}
function findAdAndScroll(value, itemId, brandFilter) {
    const input = document.getElementById('adsSearchInput');
    const listDiv = document.getElementById('adsSearchList');
    const clearBtn = document.getElementById('adsClearFilterBtn');
    
    // Если это фильтр по бренду - показываем все объявления этого бренда
    if (brandFilter) {
        currentBrandFilter = brandFilter; // Сохраняем активный фильтр
        if (input) input.value = brandFilter;
        if (clearBtn) clearBtn.style.display = 'flex'; // Показываем кнопку сброса
        // Создаём фильтр для отображения всех объявлений этого бренда
        const brandLower = brandFilter.toLowerCase();
        const filtered = allAds.filter(ad => {
            const adBrand = (ad.brand || '').toLowerCase();
            return adBrand === brandLower;
        });
        renderGrid(filtered);
        if (listDiv) listDiv.style.display = 'none';
        return;
    }
    
    let match = null;
    if (itemId !== undefined) {
        match = adSearchIndex.find(item => item.id === itemId);
    } else {
        let val = value ? String(value).trim() : (input ? input.value.trim() : '');
        if (!val) return;
        const lower = val.toLowerCase();
        match = adSearchIndex.find(item => item.titleLower === lower);
        if (!match) {
            match = adSearchIndex.find(item => item.titleLower.includes(lower));
        }
    }
    if (match) {
        if (input) input.value = match.title;
        const card = document.getElementById(`ad-${match.id}`);
        if (card) {
            card.style.transition = 'background 1.2s';
            card.style.background = getHighlightColor(0.35);
            setTimeout(() => { card.style.background = ''; }, 1600);
            if (input) input.value = '';
        } else {
        }
    }
    if (listDiv) listDiv.style.display = 'none';
}
function clearAdsBrandFilter() {
    const input = document.getElementById('adsSearchInput');
    const clearBtn = document.getElementById('adsClearFilterBtn');
    const listDiv = document.getElementById('adsSearchList');
    
    currentBrandFilter = null; // Очищаем фильтр
    if (input) input.value = ''; // Очищаем поле поиска
    if (clearBtn) clearBtn.style.display = 'none'; // Скрываем кнопку сброса
    if (listDiv) listDiv.style.display = 'none';
    
    // Показываем все объявления
    renderGrid(allAds);
}
function clearTenderBrandFilter() {
    const input = document.getElementById('tenderSearchInput');
    const clearBtn = document.getElementById('tenderClearFilterBtn');
    const listDiv = document.getElementById('tenderSearchList');
    
    currentTenderBrandFilter = null; // Очищаем фильтр
    if (input) input.value = ''; // Очищаем поле поиска
    if (clearBtn) clearBtn.style.display = 'none'; // Скрываем кнопку сброса
    if (listDiv) listDiv.style.display = 'none';
    
    // Показываем все объявления тендера
    if (typeof renderTenderAds === 'function') {
        renderTenderAds();
    }
}
function buildTenderSearchIndex(ads) {
    const approved = (ads || []).filter(ad => (ad.tender || '').toLowerCase() === 'yes');
    tenderSearchIndex = approved
        .map(ad => {
            const title = (ad.title || '').trim();
            const brand = (ad.brand || '').trim();
            return {
                id: ad.rowIndex,
                title: title,
                titleLower: title.toLowerCase(),
                brand: brand,
                brandLower: brand.toLowerCase()
            };
        })
        .filter(item => item.title);
}
function initAdsSearch() {
    if (adsSearchInitialized) return;
    const input = document.getElementById('adsSearchInput');
    const listDiv = document.getElementById('adsSearchList');
    if (!input || !listDiv) return;
    adsSearchInitialized = true;
    input.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            listDiv.style.display = 'none';
        }
    });
    input.addEventListener('focus', function () {
        if (this.value.trim()) {
            this.dispatchEvent(new Event('input'));
        }
    });
    input.addEventListener('input', function () {
        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: пропускаем, если input значение установлено программно
        if (skipAdsSearchInput) {
            skipAdsSearchInput = false;
            return;
        }
        let typed = this.value.trim();
        if (!typed) {
            listDiv.style.display = 'none';
            return;
        }
        typed = typed.toLowerCase();
        const found = [];
        // Ищем совпадения по названиям моделей
        for (const item of adSearchIndex) {
            if (item.titleLower.startsWith(typed)) {
                found.push(item);
            }
        }
        if (found.length === 0 && typed.length >= 2) {
            for (const item of adSearchIndex) {
                if (item.titleLower.includes(typed)) {
                    found.push(item);
                }
            }
        }
        // Если все еще ничего не найдено, ищем по бренду
        if (found.length === 0) {
            for (const item of adSearchIndex) {
                if (item.brandLower && item.brandLower.startsWith(typed)) {
                    found.push(item);
                }
            }
        }
        // И еще раз по бренду с includes если длина >= 2
        if (found.length === 0 && typed.length >= 2) {
            for (const item of adSearchIndex) {
                if (item.brandLower && item.brandLower.includes(typed)) {
                    found.push(item);
                }
            }
        }
        listDiv.innerHTML = '';
        const uniq = new Set();
        const brandSet = new Set();
        const arr = [];
        let brandMatch = null;
        
        // Проверяем, есть ли бренд, который начинается с введённого текста
        for (const item of found) {
            if (item.brandLower && item.brandLower.startsWith(typed) && !brandSet.has(item.brandLower)) {
                brandSet.add(item.brandLower);
                if (!brandMatch) brandMatch = item.brand;
            }
        }
        
        for (const item of found) {
            if (!uniq.has(item.titleLower)) {
                uniq.add(item.titleLower);
                arr.push(item);
            }
            if (arr.length >= 5) break;
        }
        if (arr.length === 0) {
            listDiv.style.display = 'none';
        } else {
            
            // СНАЧАЛА добавляем опцию БРЕНДА если есть совпадение
            if (brandMatch) {
                const brandEl = document.createElement('div');
                brandEl.className = 'manufacturer';
                brandEl.setAttribute('data-target', 'brand:' + brandMatch);
                brandEl.setAttribute('data-brand', brandMatch);
                brandEl.textContent = brandMatch + ' (все объявления)';
                brandEl.style.fontWeight = 'bold';
                brandEl.style.color = '#1E88E5';
                brandEl.style.borderBottom = '2px solid #1E88E5';
                listDiv.appendChild(brandEl);
            }
            
            // Потом добавляем конкретные модели
            arr.forEach(item => {
                const el = document.createElement('div');
                el.className = 'manufacturer';
                el.setAttribute('data-target', String(item.id));
                el.setAttribute('data-title', item.title);
                el.textContent = item.title;
                listDiv.appendChild(el);
                el.onclick = function(e) {};
            });
            listDiv.style.display = 'block';
        }
    });
    // Добавляем click listener только один раз!
    if (!adsSearchListClickListenerAdded) {
        adsSearchListClickListenerAdded = true;
        listDiv.addEventListener('click', function (e) {
            if (e.target.classList.contains('manufacturer')) {
                e.stopPropagation();
                const dataTarget = e.target.getAttribute('data-target');
                
                // Проверяем, это опция по бренду или конкретное объявление
                if (dataTarget.startsWith('brand:')) {
                    const brand = dataTarget.substring(6);
                    skipAdsSearchInput = true;
                    findAdAndScroll(null, null, brand);
                } else {
                    const clickedId = parseInt(dataTarget, 10);
                    const clickedTitle = e.target.getAttribute('data-title');
                    skipAdsSearchInput = true;
                    input.value = clickedTitle;
                    listDiv.style.display = 'none';
                    findAdAndScroll(null, clickedId);
                }
            } else {
            }
        });
    }
    document.addEventListener('click', function (e) {
        const inputEl = document.getElementById('adsSearchInput');
        if (!listDiv || !inputEl) return;
        if (!listDiv.contains(e.target) && e.target !== inputEl) {
            listDiv.style.display = 'none';
        }
    });
}
function initTenderSearch() {
    if (tenderSearchInitialized) return;
    const input = document.getElementById('tenderSearchInput');
    const listDiv = document.getElementById('tenderSearchList');
    if (!input || !listDiv) return;
    tenderSearchInitialized = true;
    input.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            listDiv.style.display = 'none';
        }
    });
    input.addEventListener('focus', function () {
        if (this.value.trim()) {
            this.dispatchEvent(new Event('input'));
        }
    });
    input.addEventListener('input', function () {
        if (skipTenderSearchInput) {
            skipTenderSearchInput = false;
            return;
        }
        let typed = this.value.trim();
        if (!typed) {
            listDiv.style.display = 'none';
            return;
        }
        typed = typed.toLowerCase();
        const found = [];
        // Ищем совпадения по названиям моделей
        for (const item of tenderSearchIndex) {
            if (item.titleLower.startsWith(typed)) {
                found.push(item);
            }
        }
        if (found.length === 0 && typed.length >= 2) {
            for (const item of tenderSearchIndex) {
                if (item.titleLower.includes(typed)) {
                    found.push(item);
                }
            }
        }
        // Если все еще ничего не найдено, ищем по бренду
        if (found.length === 0) {
            for (const item of tenderSearchIndex) {
                if (item.brandLower && item.brandLower.startsWith(typed)) {
                    found.push(item);
                }
            }
        }
        // И еще раз по бренду с includes если длина >= 2
        if (found.length === 0 && typed.length >= 2) {
            for (const item of tenderSearchIndex) {
                if (item.brandLower && item.brandLower.includes(typed)) {
                    found.push(item);
                }
            }
        }
        listDiv.innerHTML = '';
        const uniq = new Set();
        const brandSet = new Set();
        const arr = [];
        let brandMatch = null;
        
        // Проверяем, есть ли бренд, который начинается с введённого текста
        for (const item of found) {
            if (item.brandLower && item.brandLower.startsWith(typed) && !brandSet.has(item.brandLower)) {
                brandSet.add(item.brandLower);
                if (!brandMatch) brandMatch = item.brand;
            }
        }
        
        for (const item of found) {
            if (!uniq.has(item.titleLower)) {
                uniq.add(item.titleLower);
                arr.push(item);
            }
            if (arr.length >= 5) break;
        }
        if (arr.length === 0) {
            listDiv.style.display = 'none';
        } else {
            
            // СНАЧАЛА добавляем опцию БРЕНДА если есть совпадение
            if (brandMatch) {
                const brandEl = document.createElement('div');
                brandEl.className = 'manufacturer';
                brandEl.setAttribute('data-target', 'brand:' + brandMatch);
                brandEl.setAttribute('data-brand', brandMatch);
                brandEl.textContent = brandMatch + ' (все объявления)';
                brandEl.style.fontWeight = 'bold';
                brandEl.style.color = '#1E88E5';
                brandEl.style.borderBottom = '2px solid #1E88E5';
                listDiv.appendChild(brandEl);
            }
            
            // Потом добавляем конкретные модели
            arr.forEach(item => {
                const el = document.createElement('div');
                el.className = 'manufacturer';
                el.setAttribute('data-target', String(item.id));
                el.setAttribute('data-title', item.title);
                el.textContent = item.title;
                listDiv.appendChild(el);
            });
            listDiv.style.display = 'block';
        }
    });
    // Добавляем click listener только один раз!
    if (!tenderSearchListClickListenerAdded) {
        tenderSearchListClickListenerAdded = true;
        listDiv.addEventListener('click', function (e) {
            if (e.target.classList.contains('manufacturer')) {
                e.stopPropagation();
                const dataTarget = e.target.getAttribute('data-target');
                console.log('*** MATCHED TENDER ITEM! data-target:', dataTarget);
                
                // Проверяем, это опция по бренду или конкретное объявление
                if (dataTarget.startsWith('brand:')) {
                    const brand = dataTarget.substring(6);
                    console.log('*** Selected tender brand filter:', brand);
                    currentTenderBrandFilter = brand;
                    skipTenderSearchInput = true;
                    input.value = brand;
                    if (document.getElementById('tenderClearFilterBtn')) {
                        document.getElementById('tenderClearFilterBtn').style.display = 'flex';
                    }
                    // Фильтруем по выбранному бренду (только объявления в тендере!)
                    const filtered = allAds.filter(ad => {
                        const adBrand = (ad.brand || '').toLowerCase();
                        const isTender = (ad.tender || '').toLowerCase() === 'yes';
                        return isTender && adBrand === brand.toLowerCase();
                    });
                    console.log('*** Filtered tender ads by brand "' + brand + '":', filtered.length, 'total ads:', allAds.length);
                    renderTenderAds(filtered);
                    listDiv.style.display = 'none';
                } else {
                    const clickedId = parseInt(dataTarget, 10);
                    const clickedTitle = e.target.getAttribute('data-title');
                    console.log('*** Selected specific tender ad! ID:', clickedId);
                    skipTenderSearchInput = true;
                    input.value = clickedTitle;
                    listDiv.style.display = 'none';
                    // Найти и выделить карточку тендера
                    const card = document.getElementById(`ad-tender-${clickedId}`);
                    if (card) {
                        card.style.transition = 'background 1.2s';
                        card.style.background = 'rgba(171, 71, 188, 0.35)';
                        setTimeout(() => { card.style.background = ''; }, 1600);
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    if (input) input.value = '';
                }
            }
        });
    }
    document.addEventListener('click', function (e) {
        const inputEl = document.getElementById('tenderSearchInput');
        if (!listDiv || !inputEl) return;
        if (!listDiv.contains(e.target) && e.target !== inputEl) {
            listDiv.style.display = 'none';
        }
    });
}
function buildPartSearchIndex(parts) {
    partSearchIndex = (parts || [])
        .map(part => {
            const title = (part.partName || part.title || '').trim();
            const brand = (part.brand || '').trim();
            return {
                id: part.rowIndex,
                title: title,
                titleLower: title.toLowerCase(),
                brand: brand,
                brandLower: brand.toLowerCase()
            };
        })
        .filter(item => item.title || item.brand);
}
function findPartAndScroll(value, itemId) {
    const input = document.getElementById('partsSearchInput');
    const listDiv = document.getElementById('partsSearchList');
    let match = null;
    if (itemId !== undefined) {
        match = partSearchIndex.find(item => item.id === itemId);
    } else {
        let val = value ? String(value).trim() : (input ? input.value.trim() : '');
        if (!val) return;
        const lower = val.toLowerCase();
        match = partSearchIndex.find(item => item.titleLower === lower || item.brandLower === lower);
        if (!match) {
            match = partSearchIndex.find(item => item.titleLower.includes(lower) || item.brandLower.includes(lower));
        }
    }
    if (match) {
        if (input) input.value = match.title;
        const card = document.getElementById(`part-${match.id}`);
        if (card) {
            card.style.transition = 'background 1.2s';
            card.style.background = getHighlightColor(0.35);
            setTimeout(() => { card.style.background = ''; }, 1600);
            if (input) input.value = '';
        }
    }
    if (listDiv) listDiv.style.display = 'none';
}
function initPartsSearch() {
    if (partsSearchInitialized) return;
    const input = document.getElementById('partsSearchInput');
    const listDiv = document.getElementById('partsSearchList');
    if (!input || !listDiv) return;
    partsSearchInitialized = true;
    input.addEventListener('change', () => findPartAndScroll());
    input.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            findPartAndScroll();
        }
    });
    input.addEventListener('focus', function () {
        if (this.value.trim()) {
            this.dispatchEvent(new Event('input'));
        }
    });
    input.addEventListener('input', function () {
        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: пропускаем, если input значение установлено программно
        if (skipPartsSearchInput) {
            console.log('*** Skipping parts input event - programmatic value change');
            skipPartsSearchInput = false;
            return;
        }
        let typed = this.value.trim();
        if (!typed) {
            listDiv.style.display = 'none';
            return;
        }
        typed = typed.toLowerCase();
        const found = [];
        for (const item of partSearchIndex) {
            if (item.titleLower.startsWith(typed) || item.brandLower.startsWith(typed)) {
                found.push(item);
            }
        }
        if (found.length === 0 && typed.length >= 2) {
            for (const item of partSearchIndex) {
                if (item.titleLower.includes(typed) || item.brandLower.includes(typed)) {
                    found.push(item);
                }
            }
        }
        listDiv.innerHTML = '';
        const uniq = new Set();
        const arr = [];
        for (const item of found) {
            const key = item.titleLower || item.brandLower;
            if (key && !uniq.has(key)) {
                uniq.add(key);
                arr.push(item);
            }
            if (arr.length >= 5) break;
        }
        if (arr.length === 0) {
            listDiv.style.display = 'none';
        } else {
            arr.forEach(item => {
                const el = document.createElement('div');
                el.className = 'manufacturer';
                el.setAttribute('data-target', String(item.id));
                el.textContent = item.title;
                el.setAttribute('data-title', item.title);
                listDiv.appendChild(el);
            });
            listDiv.style.display = 'block';
        }
    });
    // Добавляем click listener для запчастей только один раз!
    if (!partsSearchListClickListenerAdded) {
        partsSearchListClickListenerAdded = true;
        listDiv.addEventListener('click', function (e) {
            if (e.target.classList.contains('manufacturer')) {
                e.stopPropagation();
                const clickedId = parseInt(e.target.getAttribute('data-target'), 10);
                const clickedTitle = e.target.getAttribute('data-title');
                console.log('*** PARTS CLICK EVENT - ID:', clickedId, 'Title:', clickedTitle);
                // Установим флаг перед изменением input, чтобы не триггирить input event
                skipPartsSearchInput = true;
                input.value = clickedTitle;
                listDiv.style.display = 'none';
                findPartAndScroll(null, clickedId);
            }
        });
    }
    document.addEventListener('click', function (e) {
        const inputEl = document.getElementById('partsSearchInput');
        if (!listDiv || !inputEl) return;
        if (!listDiv.contains(e.target) && e.target !== inputEl) {
            listDiv.style.display = 'none';
        }
    });
}
function renderGrid(ads) {
    const c = document.getElementById('vehicles-container');
    c.innerHTML = '';
    c.classList.remove('loaded');
    if (!ads || ads.length === 0) {
        c.innerHTML = '<div style="color:#999;grid-column:1/-1;text-align:center;">Ничего не найдено</div>';
        return;
    }
    ads.forEach((ad, idx) => {
        let ph = ad.photos ? ad.photos.split(',') : [], mI = ph.length > 0 ? ph[0] : '';
        if (mI && !mI.startsWith('http')) mI = '';
        const sellerLabel = getSellerTypeLabel(ad);
        let badgesHtml = '';
        if (checkIsNew(ad)) badgesHtml += '<span class="badge-new">НОВЫЙ</span>';
        if (isPrivateSellerLabel(sellerLabel)) badgesHtml += '<span class="badge-private">ВЛАДЕЛЕЦ</span>';
        if ((ad.amphibious || "").toLowerCase() === 'yes') badgesHtml += '<span class="badge-float">ПЛАВАЮЩИЙ</span>';
        const tenderBadgeHtml = ((ad.tender || "").toLowerCase() === 'yes')
            ? '<div class="listing-card-tender-badge visible">В РЕЕСТРЕ МИНПРОМТОРГА</div>'
            : '';
        let infoParts = [];
        if (ad.city) infoParts.push(ad.city);
        else if (ad.region) infoParts.push(ad.region);
        const tt = (ad.techType || ad.technical || '').trim();
        const isTrailer = tt === 'Прицеп' || (ad.capacity && Number(ad.capacity) > 0);
        if (ad.power && !isTrailer) infoParts.push(ad.power + ' л.с.');
        if (ad.transmission && !isTrailer && tt !== 'Услуга') infoParts.push(ad.transmission);
        const d = document.createElement('div');
        d.className = 'listing-card';
        d.id = `ad-${ad.rowIndex}`;
        d.onclick = () => openAd(ad);
        // Проверяем, в избранном ли объявление
        const isFavorite = userFavorites.includes(ad.rowIndex);
        const heartClass = isFavorite ? 'favorite-heart active' : 'favorite-heart';
        const heartFill = isFavorite ? '#ff4757' : 'none';
        const heartStroke = isFavorite ? '#ff4757' : '#ccc';
        d.innerHTML = `<div class="listing-card-media"><img class="listing-card-img" loading="lazy" src="${mI}" onerror="this.src='images/no_logo.svg'">${tenderBadgeHtml}</div><div class="${heartClass}" onclick="event.stopPropagation(); toggleFavorite(${ad.rowIndex})" title="${isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}"><svg width="24" height="24" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></div><div class="listing-card-content"><div class="listing-card-header"><div class="listing-card-title" title="${ad.title || ""}">${ad.title || "Без названия"}</div><div class="listing-card-price"><span class="listing-card-price-text">${Number(ad.price || 0).toLocaleString()} ₽</span></div><div class="badge-wrap">${badgesHtml}</div></div><div class="listing-card-info">${infoParts.join(' • ')}</div></div>`;
        c.appendChild(d);
    });
    setTimeout(() => {
        c.classList.add('loaded');
        const stylesAfter = window.getComputedStyle(c);
        // Проверяем первую карточку
        const firstCard = c.querySelector('.listing-card');
        if (firstCard) {
            const cardStyles = window.getComputedStyle(firstCard);
        }
    }, 50);
    // Перестраиваем индекс поиска на основе отфильтрованных объявлений
    buildAdSearchIndex(ads);
}
function renderPartsGrid(parts) {
    const c = document.getElementById('parts-container');
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: явно устанавливаем display: grid для Firefox с !important
    if (c) {
        c.style.setProperty('display', 'grid', 'important');
        c.style.setProperty('gridTemplateColumns', 'repeat(auto-fill, minmax(260px, 1fr))', 'important');
        c.style.setProperty('gap', '20px', 'important');
        c.style.setProperty('marginTop', '30px', 'important');
        c.style.setProperty('opacity', '1', 'important');
    }
    c.innerHTML = '';
    c.classList.remove('loaded');
    if (!parts || parts.length === 0) {
        c.innerHTML = '<div style="color:#999;grid-column:1/-1;text-align:center;">Ничего не найдено</div>';
        return;
    }
    parts.forEach(part => {
        let ph = part.photos ? part.photos.split(',') : [], mI = ph.length > 0 ? ph[0] : '';
        if (mI && !mI.startsWith('http')) mI = '';
        const sellerLabel = getSellerTypeLabel(part);
        let badgesHtml = '';
        if (part.condition === 'new') badgesHtml += '<span class="badge-new">НОВАЯ</span>';
        if (isPrivateSellerLabel(sellerLabel)) badgesHtml += '<span class="badge-private">ВЛАДЕЛЕЦ</span>';
        let infoParts = [];
        if (part.brand) infoParts.push(part.brand);
        if (part.city) infoParts.push(part.city);
        if (sellerLabel) infoParts.push(sellerLabel);
        const d = document.createElement('div');
        d.className = 'listing-card';
        d.id = `part-${part.rowIndex}`;
        d.onclick = () => openPart(part);
        // Проверяем, в избранном ли запчасть
        const isFavorite = userFavorites.includes(part.rowIndex);
        const heartClass = isFavorite ? 'favorite-heart active' : 'favorite-heart';
        const heartFill = isFavorite ? '#ff4757' : 'none';
        const heartStroke = isFavorite ? '#ff4757' : '#ccc';
        d.innerHTML = `<div class="listing-card-media"><img class="listing-card-img" loading="lazy" src="${mI}" onerror="this.src='images/no_logo.svg'"></div><div class="${heartClass}" onclick="event.stopPropagation(); toggleFavorite(${part.rowIndex})" title="${isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}"><svg width="24" height="24" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></div><div class="listing-card-content"><div class="listing-card-header"><div class="listing-card-title" title="${part.title || ""}">${part.title || "Без названия"}</div><div class="listing-card-price"><span class="listing-card-price-text">${Number(part.price || 0).toLocaleString()} ₽</span></div><div class="badge-wrap">${badgesHtml}</div></div><div class="listing-card-info">${infoParts.join(' • ')}</div></div>`;
        c.appendChild(d);
    });
    setTimeout(() => c.classList.add('loaded'), 50);
    // Перестраиваем индекс поиска на основе отфильтрованных запчастей
    buildPartSearchIndex(parts);
}
function renderTenderAds(filteredItems) {
    const container = document.getElementById('tender-container');
    const loadingDiv = document.getElementById('loading-tender');

    if (!container || !loadingDiv) return;

    // Если переданы отфильтрованные объявления, используем их, иначе фильтруем по флагу tender
    const tenderAds = filteredItems || allAds.filter(ad => (ad.tender || "").toLowerCase() === 'yes');

    loadingDiv.style.display = 'none';
    container.innerHTML = '';
    container.classList.remove('loaded');

    if (!tenderAds || tenderAds.length === 0) {
        container.innerHTML = '<div style="color:#999;grid-column:1/-1;text-align:center;">Объявлений в реестре не найдено.</div>';
        return;
    }

    // Создаем карточки, используя ту же логику, что и в других разделах
    tenderAds.forEach((ad) => {
        let ph = ad.photos ? ad.photos.split(',') : [], mI = ph.length > 0 ? ph[0] : '';
        if (mI && !mI.startsWith('http')) mI = '';

        const sellerLabel = getSellerTypeLabel(ad);
        let badgesHtml = '';
        if (checkIsNew(ad)) badgesHtml += '<span class="badge-new">НОВЫЙ</span>';
        if (isPrivateSellerLabel(sellerLabel)) badgesHtml += '<span class="badge-private">ВЛАДЕЛЕЦ</span>';
        if ((ad.amphibious || "").toLowerCase() === 'yes') badgesHtml += '<span class="badge-float">ПЛАВАЮЩИЙ</span>';

        const tenderBadgeHtml = '<div class="listing-card-tender-badge visible">В РЕЕСТРЕ МИНПРОМТОРГА</div>';

        let infoParts = [];
        if (ad.city) infoParts.push(ad.city);
        const tt = (ad.techType || ad.technical || '').trim();
        const isTrailer = tt === 'Прицеп' || (ad.capacity && Number(ad.capacity) > 0);
        if (ad.power && !isTrailer) infoParts.push(ad.power + ' л.с.');
        if (ad.transmission && !isTrailer && tt !== 'Услуга') infoParts.push(ad.transmission);

        const d = document.createElement('div');
        d.className = 'listing-card';
        d.id = `ad-tender-${ad.rowIndex}`; // Уникальный ID для карточки
        d.onclick = () => openAd(ad);

        const isFavorite = userFavorites.includes(ad.rowIndex);
        const heartClass = isFavorite ? 'favorite-heart active' : 'favorite-heart';
        const heartFill = isFavorite ? '#ff4757' : 'none';
        const heartStroke = isFavorite ? '#ff4757' : '#ccc';

        d.innerHTML = `<div class="listing-card-media"><img class="listing-card-img" loading="lazy" src="${mI}" onerror="this.src='images/no_logo.svg'">${tenderBadgeHtml}</div><div class="${heartClass}" onclick="event.stopPropagation(); toggleFavorite(${ad.rowIndex})" title="${isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}"><svg width="24" height="24" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></div><div class="listing-card-content"><div class="listing-card-header"><div class="listing-card-title" title="${ad.title || ""}">${ad.title || "Без названия"}</div><div class="listing-card-price"><span class="listing-card-price-text">${Number(ad.price || 0).toLocaleString()} ₽</span></div><div class="badge-wrap">${badgesHtml}</div></div><div class="listing-card-info">${infoParts.join(' • ')}</div></div>`;
        container.appendChild(d);
    });

    // Перестраиваем индекс поиска на основе ВСЕХ объявлений в тендере (не только отфильтрованных)
    buildTenderSearchIndex(allAds);
    
    setTimeout(() => {
        container.classList.add('loaded');
        initTenderSearch();
    }, 50);
}

function configureModalActions(type) {
    const actions = document.getElementById('modal-owner-actions');
    if (!actions) return;
    const editBtn = actions.querySelector('button:nth-child(1)');
    const deleteBtn = actions.querySelector('button:nth-child(2)');
    if (!editBtn || !deleteBtn) return;
    if (type === 'part') {
        editBtn.classList.add('hidden');
        deleteBtn.onclick = deleteCurrentPart;
        deleteBtn.innerText = 'Удалить';
    } else {
        editBtn.classList.remove('hidden');
        editBtn.onclick = editCurrentAd;
        deleteBtn.onclick = deleteCurrentAd;
        deleteBtn.innerText = 'Удалить';
    }
}

function openAd(ad) {
    window.location.href = `ad.html?id=${ad.rowIndex}&type=ad`;
}

function openPart(part) {
    window.location.href = `ad.html?id=${part.rowIndex}&type=part`;
}

function updateMetaTags(ad) {
    let existingOgImage = document.querySelector('meta[property="og:image"]');
    let existingOgTitle = document.querySelector('meta[property="og:title"]');
    let existingOgDesc = document.querySelector('meta[property="og:description"]');
    const firstPhoto = ad.photos ? ad.photos.split(',')[0] : '';
    const title = ad.title || 'Вездеход';
    const price = Number(ad.price || 0).toLocaleString() + ' ₽';
    if (!existingOgImage) {
        existingOgImage = document.createElement('meta');
        existingOgImage.setAttribute('property', 'og:image');
        document.head.appendChild(existingOgImage);
    }
    if (!existingOgTitle) {
        existingOgTitle = document.createElement('meta');
        existingOgTitle.setAttribute('property', 'og:title');
        document.head.appendChild(existingOgTitle);
    }
    if (!existingOgDesc) {
        existingOgDesc = document.createElement('meta');
        existingOgDesc.setAttribute('property', 'og:description');
        document.head.appendChild(existingOgDesc);
    }
    existingOgImage.setAttribute('content', firstPhoto || 'https://placehold.co/1200x630?text=Вездеход');
    existingOgTitle.setAttribute('content', title);
    existingOgDesc.setAttribute('content', `${title} - ${price}`);
}
function updateGallery() {
    const track = document.getElementById('gallery-track');
    if (track.getAttribute('data-ad-id') !== String(currentAd.rowIndex)) {
        track.innerHTML = currentPhotos.map(url => `
            <div class="gallery-slide"> <img class="modal-gallery-img" src="${url}" onclick="openLightbox('${url}')"> </div>
        `).join('');
        track.setAttribute('data-ad-id', currentAd.rowIndex);
    }
    track.style.transform = `translateX(-${currentPhotoIndex * 100}%)`;
}
function galleryNext(e) { if (e) e.stopPropagation(); currentPhotoIndex++; if (currentPhotoIndex >= currentPhotos.length) currentPhotoIndex = 0; updateGallery(); }
function galleryPrev(e) { if (e) e.stopPropagation(); currentPhotoIndex--; if (currentPhotoIndex < 0) currentPhotoIndex = currentPhotos.length - 1; updateGallery(); }
let currentScale = 1;
let panX = 0, panY = 0;
const lBox = document.getElementById('lightbox');
const lImg = document.getElementById('lightbox-img');
function openLightbox(src) {
    lImg.src = src;
    currentScale = 1;
    panX = 0; panY = 0;
    lImg.style.transform = `translate(0px, 0px) scale(1)`;
    lBox.classList.add('active');
}
function closeLightbox() { lBox.classList.remove('active'); currentScale = 1; panX = 0; panY = 0; }
let lastTap = 0;
lImg.addEventListener('click', (e) => {
    const currentTime = new Date().getTime();
    if (currentTime - lastTap < 300) { e.preventDefault(); toggleZoom(); }
    lastTap = currentTime;
});
function toggleZoom() {
    if (currentScale > 1) {
        currentScale = 1;
        panX = 0; panY = 0;
    } else {
        currentScale = 2.5;
    }
    lImg.style.transform = `translate(${panX}px, ${panY}px) scale(${currentScale})`;
}
function shareCurrentAd() {
    if (!currentAd) return;
    const url = window.location.origin + window.location.pathname + '?id=' + currentAd.rowIndex;
    const text = `Смотри вездеход: ${currentAd.title}\nЦена: ${Number(currentAd.price).toLocaleString()} ₽\n${url}`;
    const t = document.createElement("textarea");
    t.value = text;
    document.body.appendChild(t);
    t.select();
    document.execCommand("copy");
    document.body.removeChild(t);
    alert("Ссылка скопирована!");
}
function updateModalFavoriteState() {
    const btn = document.getElementById('modal-favorite');
    if (!btn) return;
    if (!currentAd || !currentAd.rowIndex) {
        btn.style.display = 'none';
        return;
    }
    btn.style.display = 'flex';
    const isFavorite = userFavorites.includes(currentAd.rowIndex);
    const heartFill = isFavorite ? '#ff4757' : 'none';
    const heartStroke = isFavorite ? '#ff4757' : '#ccc';
    btn.title = isFavorite ? 'Удалить из избранного' : 'Добавить в избранное';
    btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
}
async function toggleFavoriteFromModal() {
    if (!currentAd || !currentAd.rowIndex) return;
    await toggleFavorite(currentAd.rowIndex);
    updateModalFavoriteState();
}
function closeModal(e) { if (e.target.id === 'modal') closeModalDirect() }
function closeModalDirect() {
    document.getElementById('modal').classList.remove('active');
    document.body.style.overflow = '';
    const btnCreate = document.getElementById('btn-create-ad');
    const btnProfile = document.getElementById('btn-profile');
    const tabs = document.getElementById('tabs-container');
    // Show create button only when user is logged in and NOT on profile tab
    const activeTabContent = document.querySelector('.tab-content.active');
    const activeTabName = activeTabContent ? activeTabContent.id.replace('tab-content-', '') : null;
    if (typeof currentUser !== 'undefined' && currentUser && tabs && tabs.style.display !== 'none') {
        if (btnProfile) btnProfile.classList.remove('hidden');
        if (btnCreate && activeTabName !== 'profile') {
            btnCreate.classList.remove('hidden');
        } else if (btnCreate) {
            btnCreate.classList.add('hidden');
        }
    }
}
function updateAuthUI(user) {
    const btnLogin = document.getElementById('btn-login');
    const btnCreate = document.getElementById('btn-create-ad');
    const btnProfile = document.getElementById('btn-profile');
    const adminTab = document.getElementById('admin-tab-link');
    const tabs = document.getElementById('tabs-container');
    const modal = document.getElementById('modal');
    const formView = document.getElementById('view-form');
    isAdmin = false;
    adminTab.classList.add('hidden');
    if (user) {
        btnLogin.classList.add('hidden');
        syncProfileButton('ads');
        const isModalOpen = modal && modal.classList.contains('active');
        const isFormOpen = formView && !formView.classList.contains('hidden');
        if (tabs && tabs.style.display !== 'none' && !isModalOpen && !isFormOpen) {
            if (btnProfile) btnProfile.classList.remove('hidden');
            const activeTabContent = document.querySelector('.tab-content.active');
            const activeTabName = activeTabContent ? activeTabContent.id.replace('tab-content-', '') : null;
            if (btnCreate && activeTabName !== 'profile') {
                btnCreate.classList.remove('hidden');
            } else if (btnCreate) {
                btnCreate.classList.add('hidden');
            }
        } else {
            if (btnCreate) btnCreate.classList.add('hidden');
            if (btnProfile) btnProfile.classList.add('hidden');
        }
        let displayName = user.name || currentUserName || "Пользователь";
        let displayPhone = user.phoneNumber || user.email || "";
        let uPhone = String(user.phoneNumber || "").replace(/\D/g, '');
        let aPhone = String(ADMIN_PHONE).replace(/\D/g, '');
        if (uPhone === aPhone) {
            isAdmin = true;
            adminTab.classList.remove('hidden');
            updateAdminCount();
        }
        // Загружаем избранное при авторизации
        if (user.id) {
            loadFavorites().then(() => {
                // Перерисовываем объявления чтобы показать избранное
                if (allAds.length > 0) {
                    applyFilters();
                }
            });
        }
    } else {
        btnLogin.classList.remove('hidden');
        if (btnCreate) btnCreate.classList.add('hidden');
        if (btnProfile) btnProfile.classList.add('hidden');
        syncProfileButton('ads');
        userFavorites = []; // Очищаем избранное при выходе
    }
}
function validateForm() {
    const errors = [];
    const productType = safeVal('inp-product-type');
    // Услуга — отдельная валидация (service fields)
    if (productType === 'Услуга') {
        if (!safeVal('inp-service-title').trim()) errors.push('Укажите название услуги');
        if (!safeVal('inp-service-city').trim()) errors.push('Укажите город');
        if (!safeVal('inp-service-price').trim()) errors.push('Укажите цену услуги');
        if (errors.length > 0) {
            alert('Пожалуйста, заполните обязательные поля:\n\n' + errors.map((e, i) => `${i + 1}. ${e}`).join('\n'));
            return false;
        }
        return true;
    }
    // Проверяем обязательные поля для всех типов объявлений
    if (productType !== 'Запчасть') {
        if (!safeVal('inp-seller-type')) {
            errors.push('Выберите тип продавца (Кто вы?)');
        }
    }
    if (!safeVal('inp-city').trim()) {
        errors.push('Укажите город');
    }
    const priceVal = getPriceValue('inp-price');
    if (!priceVal || parseInt(priceVal) <= 0) {
        errors.push('Укажите цену');
    }
    if (productType !== 'Запчасть') {
        if (!safeVal('inp-condition')) {
            errors.push('Выберите состояние (Новый/Б/У)');
        }
    }
    // Проверяем специфичные поля для запчастей
    if (productType === 'Запчасть') {
        if (!safeVal('inp-part-title').trim()) {
            errors.push('Укажите название запчасти');
        }
    } else {
        // Проверяем специфичные поля для техники (не запчасть)
        if (!safeVal('inp-brand').trim()) {
            errors.push('Укажите марку техники');
        }
        if (!safeVal('inp-model').trim()) {
            errors.push('Укажите модель техники');
        }
    }
    if (errors.length > 0) {
        const errorMessage = 'Пожалуйста, заполните обязательные поля:\n\n' + errors.map((e, i) => `${i + 1}. ${e}`).join('\n');
        alert(errorMessage);
        return false;
    }
    return true;
}
document.getElementById('main-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Войдите!");
    // Валидация формы
    if (!validateForm()) {
        return;
    }
    showLoader("Публикация...");
    try {
        let phU = (currentAd && isEditMode) ? currentAd.photos : "";
        let vidU = (currentAd && isEditMode) ? currentAd.videos : "";
        
        // Remove deleted media
        if (window.currentAdDeletedMedia && window.currentAdDeletedMedia.length > 0) {
            window.currentAdDeletedMedia.forEach(item => {
                if (item.type === 'photo') {
                    phU = phU.split(',').filter(p => p !== item.url).join(',');
                } else if (item.type === 'video') {
                    vidU = vidU.split(',').filter(v => v !== item.url).join(',');
                }
            });
        }
        
        if (!window.accumulatedMediaFiles) {
            window.accumulatedMediaFiles = [];
        }
        
        // Upload new media files
        if (window.accumulatedMediaFiles && window.accumulatedMediaFiles.length > 0) {
            let photoArr = [];
            let videoArr = [];
            
            for (let i = 0; i < window.accumulatedMediaFiles.length; i++) {
                const file = window.accumulatedMediaFiles[i];
                const isImage = file.type.startsWith('image/');
                const isVideo = file.type.startsWith('video/');
                
                if (isImage) {
                    let fd = new FormData(); 
                    fd.append('file', file); 
                    fd.append('upload_preset', UPLOAD_PRESET);
                    let r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
                    let j = await r.json(); 
                    if (j.secure_url) photoArr.push(j.secure_url);
                } else if (isVideo) {
                    let fd = new FormData(); 
                    fd.append('file', file); 
                    fd.append('upload_preset', UPLOAD_PRESET);
                    fd.append('resource_type', 'video');
                    try {
                        let r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, { method: 'POST', body: fd, timeout: 60000 });
                        let j = await r.json(); 
                        if (j.secure_url) videoArr.push(j.secure_url);
                    } catch (err) {
                        console.warn('Video upload failed:', err);
                    }
                }
            }
            
            // Append new files to existing ones
            if (photoArr.length > 0) {
                phU = phU ? phU + ',' + photoArr.join(',') : photoArr.join(',');
            }
            if (videoArr.length > 0) {
                vidU = vidU ? vidU + ',' + videoArr.join(',') : videoArr.join(',');
            }
        }
        
        const productType = safeVal('inp-product-type');
        const cond = safeVal('inp-condition');
        let desc = safeVal('inp-desc');
        if (cond === 'new') desc += NEW_STATUS_TAG;
        const priceVal = getPriceValue('inp-price');

        // === Услуга — отдельная отправка ===
        if (productType === 'Услуга') {
            // Upload service photos
            let servicePhU = '';
            const servicePhotosInput = document.getElementById('inp-service-photos');
            if (servicePhotosInput && servicePhotosInput.files && servicePhotosInput.files.length > 0) {
                let photoArr = [];
                for (let i = 0; i < servicePhotosInput.files.length; i++) {
                    const file = servicePhotosInput.files[i];
                    let fd = new FormData();
                    fd.append('file', file);
                    fd.append('upload_preset', UPLOAD_PRESET);
                    let r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
                    let j = await r.json();
                    if (j.secure_url) photoArr.push(j.secure_url);
                }
                servicePhU = photoArr.join(',');
            }
            const serviceTitle = safeVal('inp-service-title').trim();
            const servicePl = {
                action: isEditMode ? 'edit' : 'create',
                rowIndex: safeVal('edit-row-index') || '',
                title: serviceTitle || 'Услуга',
                brand: serviceTitle,
                model: '',
                price: getPriceValue('inp-service-price'),
                desc: safeVal('inp-service-desc'),
                name: currentUserName || '',
                phone: currentUser.phoneNumber,
                userId: currentUser.id,
                photos: servicePhU,
                videos: '',
                engine: '', power: '', transmission: '', fuel: '',
                wheels: '', region: '',
                city: safeVal('inp-service-city'),
                condition: 'used',
                sellerTypeId: '',
                tender: 'no',
                wheelFormula: '', color: '', mileage: '',
                amphibious: 'no', docs: '',
                techType: 'Услуга',
                constructionType: '', capacity: ''
            };
            const response = await fetch('/api/ads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(servicePl)
            });
            const json = await response.json();
            if (json.status !== 'success') {
                throw new Error(json.message || 'Ошибка операции');
            }
            document.getElementById('main-form').reset();
            document.getElementById('preview-container').innerHTML = '';
            document.getElementById('file-count').innerText = '';
            window.currentAdDeletedMedia = [];
            window.removedNewMediaIndices = [];
            window.accumulatedMediaFiles = [];
            showList(); loadAds();
            return;
        }

        if (productType === 'Запчасть') {
            const payload = {
                action: isEditMode ? 'edit' : 'create',
                rowIndex: safeVal('edit-row-index') || '',
                brand: safeVal('inp-part-brand'),
                partName: safeVal('inp-part-title'),
                price: priceVal,
                condition: safeVal('inp-condition'),
                sellerTypeId: safeVal('inp-seller-type'),
                city: safeVal('inp-city'),
                phone: currentUser.phoneNumber,
                name: currentUserName || '',
                userId: currentUser.id,
                photos: phU,
                videos: vidU
            };
            const response = await fetch('/api/parts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await response.json();
            if (json.status !== 'success') {
                throw new Error(json.message || 'Ошибка операции');
            }
            document.getElementById('main-form').reset();
            document.getElementById('preview-container').innerHTML = '';
            document.getElementById('file-count').innerText = '';
            window.currentAdDeletedMedia = [];
            window.removedNewMediaIndices = [];
            window.accumulatedMediaFiles = [];
            showList();
            loadParts();
            showTab(document.querySelector('.tab-link[onclick*="parts"]'), 'parts');
            return;
        }
        const brand = safeVal('inp-brand');
        const model = safeVal('inp-model');
        const title = [brand, model].filter(Boolean).join(' ').trim();
        const pl = {
            action: isEditMode ? 'edit' : 'create',
            rowIndex: safeVal('edit-row-index'),
            title: title,
            brand: brand,
            model: model,
            price: priceVal,
            desc: desc,
            name: currentUserName || '',
            phone: currentUser.phoneNumber,
            userId: currentUser.id,
            photos: phU,
            videos: vidU,
            engine: safeVal('inp-engine'),
            power: safeVal('inp-power'),
            transmission: safeVal('inp-trans'),
            fuel: safeVal('inp-fuel'),
            wheels: (safeVal('tire-d') && safeVal('tire-w')) ? `${safeVal('tire-d')}x${safeVal('tire-w')}` : "",
            region: "",
            city: safeVal('inp-city'),
            condition: cond,
            sellerTypeId: safeVal('inp-seller-type'),
            tender: safeVal('inp-tender'),
            wheelFormula: safeVal('inp-wheel-f'),
            color: safeVal('inp-color'),
            mileage: safeVal('inp-mileage'),
            amphibious: safeVal('inp-amphibious'),
            docs: safeVal('inp-docs'),
            techType: safeVal('inp-product-type'),
            constructionType: safeVal('inp-construction'),
            capacity: safeVal('inp-capacity')
        };
        const response = await fetch('/api/ads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pl)
        });
        const json = await response.json();
        if (json.status !== 'success') {
            throw new Error(json.message || 'Ошибка операции');
        }
        document.getElementById('main-form').reset();
        document.getElementById('preview-container').innerHTML = '';
        document.getElementById('file-count').innerText = '';
        window.currentAdDeletedMedia = [];
        window.removedNewMediaIndices = [];
        window.accumulatedMediaFiles = [];
        showList(); loadAds();
    } catch (er) { alert(er.message); hideLoader(); } finally { hideLoader() }
});
async function loadAds() {
    try {
        const raw = await fetchDatasetWithFallback('/api/listings');
        // Преобразуем записи: если есть Brand и Model, комбинируем их в title
        allAds = (Array.isArray(raw) ? raw : []).map(ad => {
            const brand = String(ad.brand || ad.Brand || ad.Бренд || ad.BrandName || '').trim();
            const model = String(ad.model || ad.Model || ad.Модель || ad.ModelName || '').trim();
            const combined = [brand, model].filter(Boolean).join(' ').trim();
            if (combined) ad.title = combined;
            // Нормализуем поля brand и model
            ad.brand = brand;
            ad.model = model;
            // Гарантируем, что поле title существует
            if (typeof ad.title === 'undefined' || ad.title === null) ad.title = '';
            return ad;
        });
        applyFilters();
        initAdsSearch();
        if (isAdmin) {
            renderModerationGrid(getPendingModerationItems());
            updateAdminCount();
        }
        // Загружаем избранное если пользователь авторизован
        if (currentUser && currentUser.id) {
            await loadFavorites();
        }
        const urlParams = new URLSearchParams(window.location.search);
        const adId = urlParams.get('id');
        if (adId) {
            const found = allAds.find(a => String(a.rowIndex) === String(adId));
            if (found) {
                openAd(found);
            }
        }
        // Обработка редактирования объявления из ad.html
        const editId = urlParams.get('editId');
        const editType = urlParams.get('editType');
        if (editId && editType) {
            let found = null;
            if (editType === 'ad') {
                found = allAds.find(a => String(a.rowIndex) === String(editId));
            } else if (editType === 'part') {
                found = allParts.find(p => String(p.rowIndex) === String(editId));
            }
            if (found) {
                currentAd = found;
                if (editType === 'part') {
                    openEditModePart(found);
                } else {
                    openEditMode(found);
                }
                // Очищаем параметры из URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
        if (typeof currentUser !== 'undefined' && currentUser) updateAuthUI(currentUser);
    } catch (e) {
        const adsContainer = document.getElementById('vehicles-container');
        if (adsContainer) {
            adsContainer.innerHTML = '<div style="color:#999;grid-column:1/-1;text-align:center;">Не удалось загрузить объявления. Обновите страницу.</div>';
        }
    } finally {
        document.getElementById('loading-ads').style.display = 'none';
        hideLoader();
    }
}
async function loadParts() {
    try {
        const raw = await fetchDatasetWithFallback('/api/spares');
        allParts = Array.isArray(raw) ? raw : [];
        const displayParts = allParts;
        renderPartsGrid(displayParts);
        initPartsSearch();
        if (isAdmin) {
            renderModerationGrid(getPendingModerationItems());
            updateAdminCount();
        }
    } catch (e) {
        const partsContainer = document.getElementById('parts-container');
        if (partsContainer) {
            partsContainer.innerHTML = '<div style="color:#999;grid-column:1/-1;text-align:center;">Не удалось загрузить запчасти. Обновите страницу.</div>';
        }
    } finally {
        const loading = document.getElementById('loading-parts');
        if (loading) loading.style.display = 'none';
    }
}
function showLoader(t) { document.getElementById('loader-text').innerText = t; document.getElementById('global-loader').style.opacity = '1'; document.getElementById('global-loader').style.pointerEvents = 'all'; }
function hideLoader() { document.getElementById('global-loader').style.opacity = '0'; document.getElementById('global-loader').style.pointerEvents = 'none'; }
function openCreateMode() {
    // Check authorization before allowing form access
    if (!currentUser) {
        alert('Пожалуйста, войдите в аккаунт');
        openAuthModal();
        return;
    }
    isEditMode = false;
    window.currentAdDeletedMedia = [];
    window.removedNewMediaIndices = [];
    window.accumulatedMediaFiles = [];
    const btnCreate = document.getElementById('btn-create-ad');
    if (btnCreate) btnCreate.classList.add('hidden');
    document.getElementById('form-title').innerText = "Новое объявление";
    document.getElementById('submit-btn').innerText = "Опубликовать";
    document.getElementById('tabs-nav').style.display = 'none'; // Hide tabs nav
    document.getElementById('tabs-container').style.display = 'none'; // Hide tabs content
    // Also hide admin tab which is outside tabs-container
    const adminTab = document.getElementById('tab-content-admin');
    if (adminTab) adminTab.style.display = 'none';
    document.getElementById('view-form').classList.remove('hidden');
    document.getElementById('main-form').reset();
    document.getElementById('preview-container').innerHTML = '';
    document.getElementById('file-count').innerText = '';
    // Убедимся что inp-tech-type включен (не disabled)
    document.getElementById('inp-tech-type').disabled = false;
    checkTechTypeVisibility();
    checkConditionVisibility();
    updateFooterButtonVisibility();
    // Set background color based on which tab was active before opening form
    const activeTabContent = document.querySelector('.tab-content.active');
    let tabName = 'ads'; // default
    if (activeTabContent && activeTabContent.id) {
        const tabId = activeTabContent.id.replace('tab-content-', '');
        if (tabId === 'parts' || tabId === 'ads') {
            tabName = tabId;
        }
    }
    const tRecords = document.querySelector('.t-records');
    if (tRecords) {
        tRecords.classList.remove('tab-ads', 'tab-parts', 'tab-manufacturers', 'tab-tender', 'tab-admin');
        tRecords.classList.add(`tab-${tabName}`);
    }
    updateSubmitButtonColor();
}
function showList() {
    // Убедимся что inp-tech-type включен (не disabled)
    document.getElementById('inp-tech-type').disabled = false;
    document.getElementById('view-form').classList.add('hidden'); // Hide form
    document.getElementById('tabs-nav').style.display = 'flex'; // Show tabs nav
    document.getElementById('tabs-container').style.display = 'block'; // Show tabs content
    if (currentUser) {
        const btnProfile = document.getElementById('btn-profile');
        if (btnProfile) btnProfile.classList.remove('hidden');
        // btnCreate will be shown only when user navigates to profile tab
    }
    // When returning to list, always show the 'ads' tab
    showTab(document.querySelector('.tab-link[onclick*="ads"]'), 'ads');
    updateFooterButtonVisibility();
}
function editCurrentAd() { closeModalDirect(); openEditMode(currentAd) }
function deleteCurrentAd() { closeModalDirect(); sendDelete(parseInt(currentAd.rowIndex), currentAd.phone, currentUser ? currentUser.id : null); }
function deleteCurrentPart() { closeModalDirect(); sendPartDelete(parseInt(currentAd.rowIndex), currentAd.phone, currentUser ? currentUser.id : null); }
// Функция открытия личного кабинета
function openProfile() {
    // Скрываем форму если открыта
    const formView = document.getElementById('view-form');
    if (formView && !formView.classList.contains('hidden')) {
        formView.classList.add('hidden');
        document.getElementById('tabs-nav').style.display = 'flex';
        document.getElementById('tabs-container').style.display = 'block';
    }
    const activeTabContent = document.querySelector('.tab-content.active');
    if (activeTabContent && activeTabContent.id) {
        const activeTabName = activeTabContent.id.replace('tab-content-', '');
        if (activeTabName && activeTabName !== 'profile') {
            profileReturnTab = activeTabName;
        }
    }
    // Only proceed if user is logged in
    if (!currentUser) {
        alert('Пожалуйста, войдите в аккаунт');
        return;
    }
    const btnCreate = document.getElementById('btn-create-ad');
    const btnProfile = document.getElementById('btn-profile');
    if (btnProfile) btnProfile.classList.remove('hidden');
    if (btnCreate) btnCreate.classList.add('hidden');
    // Переключаемся на вкладку профиля
    showTab(null, 'profile');
}
// Функции работы с избранным
async function loadFavorites() {
    if (!currentUser || !currentUser.id) {
        userFavorites = [];
        return;
    }
    try {
        const response = await fetch(`/api/favorites?userId=${currentUser.id}`);
        if (response.ok) {
            userFavorites = await response.json();
        } else {
            userFavorites = [];
        }
    } catch (e) {
        userFavorites = [];
    }
}
async function toggleFavorite(advertisementId) {
    if (!currentUser || !currentUser.id) {
        alert('Войдите в аккаунт, чтобы добавлять в избранное');
        return;
    }
    const isFavorite = userFavorites.includes(advertisementId);
    const endpoint = isFavorite ? '/api/favorites/remove' : '/api/favorites/add';
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                advertisementId: advertisementId
            })
        });
        const result = await response.json();
        if (result.status === 'success') {
            if (isFavorite) {
                userFavorites = userFavorites.filter(id => id !== advertisementId);
            } else {
                userFavorites.push(advertisementId);
            }

            const adsTab = document.getElementById('tab-content-ads');
            const partsTab = document.getElementById('tab-content-parts');
            const profileTab = document.getElementById('tab-content-profile');
            const tenderTab = document.getElementById('tab-content-tender'); // Добавлено

            const isOnAdsTab = adsTab && adsTab.classList.contains('active');
            const isOnPartsTab = partsTab && partsTab.classList.contains('active');
            const isOnProfileTab = profileTab && profileTab.classList.contains('active');
            const isOnTenderTab = tenderTab && tenderTab.classList.contains('active'); // Добавлено

            if (isOnProfileTab) {
                renderProfile();
            } else if (isOnAdsTab) {
                applyFilters();
            } else if (isOnPartsTab) {
                renderPartsGrid(allParts);
            } else if (isOnTenderTab) { // ДОБАВЬТЕ ЭТО УСЛОВИЕ
                renderTenderAds();
            }
            updateModalFavoriteState();
        } else {
            alert(result.message || 'Ошибка');
        }
    } catch (e) {
        alert('Ошибка: ' + e.message);
    }
}

async function sendDelete(r, p, uId) {
    showLoader("Удаление...");
    try {
        const response = await fetch('/api/ads/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rowIndex: r, phone: p, userId: uId })
        });
        const json = await response.json();
        if (json.status !== 'success') {
            throw new Error(json.message || 'Ошибка удаления');
        }
        await loadAds();
    } catch (e) {
        alert(e.message);
        hideLoader();
    } finally {
        hideLoader()
    }
}
async function sendPartDelete(r, p, uId) {
    showLoader("Удаление...");
    try {
        const response = await fetch('/api/parts/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rowIndex: r, phone: p, userId: uId })
        });
        const json = await response.json();
        if (json.status !== 'success') {
            throw new Error(json.message || 'Ошибка удаления');
        }
        await loadParts();
    } catch (e) {
        alert(e.message);
        hideLoader();
    } finally {
        hideLoader()
    }
}
function openEditMode(ad) {
    isEditMode = true;
    window.removedNewMediaIndices = [];
    window.accumulatedMediaFiles = [];
    document.getElementById('form-title').innerText = "Редактирование";
    document.getElementById('submit-btn').innerText = "Сохранить";
    const btnCreate = document.getElementById('btn-create-ad');
    if (btnCreate) btnCreate.classList.add('hidden');
    setVal('edit-row-index', ad.rowIndex);
    setVal('inp-brand', ad.brand || "");
    setVal('inp-model', ad.model || "");
    setVal('inp-price', Number(ad.price || 0).toLocaleString('ru-RU').replace(/,/g, ' '));
    setVal('inp-desc', (ad.desc || "").replace(NEW_STATUS_TAG, "").trim());
    setVal('inp-engine', ad.engine);
    setVal('inp-power', ad.power);
    setVal('inp-trans', ad.transmission);
    setVal('inp-fuel', ad.fuel);
    setVal('inp-city', ad.city);
    setVal('inp-condition', checkIsNew(ad) ? 'new' : 'used');
    checkConditionVisibility();
    setVal('inp-mileage', ad.mileage || "");
    setVal('inp-wheel-f', ad.wheelFormula);
    setVal('inp-color', ad.color);
    if (ad.wheels) { const p = ad.wheels.split('x'); if (p.length >= 2) { setVal('tire-d', p[0]); setVal('tire-w', p[1]) } }
    if (ad.sellerTypeId) {
        setVal('inp-seller-type', String(ad.sellerTypeId));
    } else {
        setSellerTypeSelectByLabel(getSellerTypeLabel(ad));
    }
    checkTenderVisibility();
    setVal('inp-tender', ad.tender || "no");
    setVal('inp-amphibious', ad.amphibious || "no");
    setVal('inp-docs', ad.docs || "");
    // Set product type from ad data
    setVal('inp-product-type', ad.techType || "Вездеход");
    setVal('inp-tech-type', ad.techType || "Вездеход");
    setVal('inp-construction', ad.constructionType || "");
    setVal('inp-capacity', ad.capacity || "");
    checkTechTypeVisibility();
    checkChassisTypeVisibility();
    showExistingMedia(ad);
    document.getElementById('tabs-nav').style.display = 'none'; // Hide tabs nav
    document.getElementById('tabs-container').style.display = 'none'; // Hide tabs content
    // Set background color for ads section
    const tRecords = document.querySelector('.t-records');
    const submitBtn = document.getElementById('submit-btn');
    if (tRecords) {
        tRecords.classList.remove('tab-ads', 'tab-parts', 'tab-manufacturers', 'tab-tender', 'tab-admin');
        if ((ad.tender || "").toLowerCase() === 'yes') {
            tRecords.classList.add('tab-tender');
            if (submitBtn) submitBtn.style.backgroundColor = '#9C27B0';
        } else {
            tRecords.classList.add('tab-ads');
            if (submitBtn) submitBtn.style.backgroundColor = '';
        }
    }
    document.getElementById('view-form').classList.remove('hidden'); // Show form
    updateFooterButtonVisibility();
}
function openEditModePart(part) {
    isEditMode = true;
    window.removedNewMediaIndices = [];
    window.accumulatedMediaFiles = [];
    document.getElementById('form-title').innerText = "Редактирование";
    document.getElementById('submit-btn').innerText = "Сохранить";
    const btnCreate = document.getElementById('btn-create-ad');
    if (btnCreate) btnCreate.classList.add('hidden');
    setVal('edit-row-index', part.rowIndex);
    setVal('inp-price', Number(part.price || 0).toLocaleString('ru-RU').replace(/,/g, ' '));
    setVal('inp-desc', (part.desc || "").replace(NEW_STATUS_TAG, "").trim());
    setVal('inp-city', part.city);
    setVal('inp-condition', part.condition === 'new' ? 'new' : 'used');
    checkConditionVisibility();
    if (part.sellerTypeId) {
        setVal('inp-seller-type', String(part.sellerTypeId));
    } else {
        setSellerTypeSelectByLabel(getSellerTypeLabel(part));
    }
    // Установка типа как "Запчасть"
    setVal('inp-product-type', 'Запчасть');
    setVal('inp-tech-type', 'Запчасть');
    setVal('inp-part-brand', part.brand || "");
    setVal('inp-part-title', part.partName || part.title || "");
    // Очищаем поля техники
    setVal('inp-brand', "");
    setVal('inp-model', "");
    checkTechTypeVisibility();
    showExistingMedia(part);
    document.getElementById('tabs-nav').style.display = 'none'; // Hide tabs nav
    document.getElementById('tabs-container').style.display = 'none'; // Hide tabs content
    // Set background color for parts section
    const tRecords = document.querySelector('.t-records');
    if (tRecords) {
        tRecords.classList.remove('tab-ads', 'tab-parts', 'tab-manufacturers', 'tab-tender', 'tab-admin');
        tRecords.classList.add('tab-parts');
    }
    document.getElementById('view-form').classList.remove('hidden'); // Show form
    updateFooterButtonVisibility();
}
// --- NEW ADMIN FUNCTIONS ---
function getPendingModerationItems() {
    const isPending = (item) => {
        const value = (item && Object.prototype.hasOwnProperty.call(item, 'verified')) ? item.verified : null;
        if (value === null || value === undefined) return false;
        if (typeof value === 'object' && value !== null && Array.isArray(value.data)) {
            return Number(value.data[0]) === 0;
        }
        if (typeof value === 'string') return value.trim() === '0';
        if (typeof value === 'boolean') return value === false;
        return Number(value) === 0;
    };
    const pendingAds = Array.isArray(allAds) ? allAds.filter(isPending) : [];
    const pendingParts = Array.isArray(allParts) ? allParts.filter(isPending) : [];
    return [...pendingAds, ...pendingParts];
}
function openModerationItem(rowIndex) {
    const id = Number(rowIndex);
    const ad = Array.isArray(allAds) ? allAds.find(item => Number(item.rowIndex) === id) : null;
    if (ad) {
        openAd(ad);
        return;
    }
    const part = Array.isArray(allParts) ? allParts.find(item => Number(item.rowIndex) === id) : null;
    if (part) {
        openPart(part);
        return;
    }
    alert('Объявление не найдено');
}
function updateAdminCount() {
    const adminTab = document.getElementById('admin-tab-link');
    if (!adminTab || !isAdmin) return;
    const pendingCount = getPendingModerationItems().length;
    adminTab.innerText = `Админка (${pendingCount})`;
}
function renderModerationGrid(items) {
    const container = document.getElementById('moderation-grid');
    const placeholder = document.getElementById('moderation-placeholder');
    if (!container || !placeholder) return;
    container.innerHTML = '';
    if (!items || items.length === 0) {
        placeholder.style.display = 'block';
        return;
    }
    placeholder.style.display = 'none';
    items.forEach((ad) => {
        const card = document.createElement('div');
        card.className = 'moderation-card';
        card.dataset.rowIndex = ad.rowIndex;
        const ph = ad.photos ? ad.photos.split(',') : [];
        const imgSrc = ph.length > 0 ? ph[0] : '';
        card.innerHTML = `
            <img class="moderation-card-img" loading="lazy" src="${imgSrc}" onerror="this.src='images/no_logo.svg'">
            <div class="moderation-card-info">
                <div class="moderation-card-title">${ad.title || 'Без названия'}</div>
                <div class="moderation-card-price">${Number(ad.price || 0).toLocaleString()} ₽</div>
            </div>
            <div class="moderation-card-actions">
                <button class="btn btn-view" onclick="openModerationItem(${ad.rowIndex})">Просмотр</button>
                <button class="btn btn-approve" onclick="approveAd(${ad.rowIndex})">Одобрить</button>
                <button class="btn btn-reject" onclick="rejectAd(${ad.rowIndex})">Отклонить</button>
            </div>
        `;
        container.appendChild(card);
    });
}
function updateModerationPlaceholderState() {
    const container = document.getElementById('moderation-grid');
    const placeholder = document.getElementById('moderation-placeholder');
    if (!container || !placeholder) return;
    placeholder.style.display = container.children.length ? 'none' : 'block';
}
function renderFavorites() {
    const authPrompt = document.getElementById('favorites-auth-prompt');
    const content = document.getElementById('favorites-content');
    const grid = document.getElementById('favorites-grid');
    const placeholder = document.getElementById('favorites-placeholder');
    // Проверяем авторизацию
    if (!currentUser || !currentUser.id) {
        authPrompt.style.display = 'block';
        content.style.display = 'none';
        return;
    }
    authPrompt.style.display = 'none';
    content.style.display = 'block';
    // Получаем избранные объявления из техники и запчастей
    const favoriteAds = allAds.filter(ad => userFavorites.includes(ad.rowIndex));
    const favoriteParts = allParts.filter(part => userFavorites.includes(part.rowIndex));
    const allFavorites = [...favoriteAds, ...favoriteParts];
    if (allFavorites.length === 0) {
        placeholder.style.display = 'block';
        grid.style.display = 'none';
        return;
    }
    placeholder.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = '';
    // Рендерим избранную технику
    favoriteAds.forEach(ad => {
        let ph = ad.photos ? ad.photos.split(',') : [], mI = ph.length > 0 ? ph[0] : '';
        if (mI && !mI.startsWith('http')) mI = '';
        const sellerLabel = getSellerTypeLabel(ad);
        let badgesHtml = '';
        if (checkIsNew(ad)) badgesHtml += '<span class="badge-new">НОВЫЙ</span>';
        if (isPrivateSellerLabel(sellerLabel)) badgesHtml += '<span class="badge-private">ВЛАДЕЛЕЦ</span>';
        if ((ad.amphibious || "").toLowerCase() === 'yes') badgesHtml += '<span class="badge-float">ПЛАВАЮЩИЙ</span>';
        const tenderBadgeHtml = ((ad.tender || "").toLowerCase() === 'yes')
            ? '<div class="listing-card-tender-badge visible">В РЕЕСТРЕ МИНПРОМТОРГА</div>'
            : '';
        let infoParts = [];
        if (ad.city) infoParts.push(ad.city);
        else if (ad.region) infoParts.push(ad.region);
        const tt = (ad.techType || ad.technical || '').trim();
        const isTrailer = tt === 'Прицеп' || (ad.capacity && Number(ad.capacity) > 0);
        if (ad.power && !isTrailer) infoParts.push(ad.power + ' л.с.');
        if (ad.transmission && !isTrailer && tt !== 'Услуга') infoParts.push(ad.transmission);
        const d = document.createElement('div');
        d.className = 'listing-card';
        d.id = `ad-${ad.rowIndex}`;
        d.onclick = () => openAd(ad);
        const heartClass = 'favorite-heart active';
        const heartFill = '#ff4757';
        const heartStroke = '#ff4757';
        d.innerHTML = `<div class="listing-card-media"><img class="listing-card-img" loading="lazy" src="${mI}" onerror="this.src='https://placehold.co/400?text=Нет+фото'">${tenderBadgeHtml}</div><div class="${heartClass}" onclick="event.stopPropagation(); toggleFavorite(${ad.rowIndex})" title="Удалить из избранного"><svg width="24" height="24" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></div><div class="listing-card-content"><div class="listing-card-header"><div class="listing-card-title" title="${ad.title || ""}">${ad.title || "Без названия"}</div><div class="listing-card-price"><span class="listing-card-price-text">${Number(ad.price || 0).toLocaleString()} ₽</span></div><div class="badge-wrap">${badgesHtml}</div></div><div class="listing-card-info">${infoParts.join(' • ')}</div></div>`;
        grid.appendChild(d);
    });
    // Рендерим избранные запчасти
    favoriteParts.forEach(part => {
        let ph = part.photos ? part.photos.split(',') : [], mI = ph.length > 0 ? ph[0] : '';
        if (mI && !mI.startsWith('http')) mI = '';
        const sellerLabel = getSellerTypeLabel(part);
        let badgesHtml = '';
        if (part.condition === 'new') badgesHtml += '<span class="badge-new">НОВАЯ</span>';
        if (isPrivateSellerLabel(sellerLabel)) badgesHtml += '<span class="badge-private">ВЛАДЕЛЕЦ</span>';
        let infoParts = [];
        if (part.brand) infoParts.push(part.brand);
        if (part.city) infoParts.push(part.city);
        if (sellerLabel) infoParts.push(sellerLabel);
        const d = document.createElement('div');
        d.className = 'listing-card';
        d.id = `part-${part.rowIndex}`;
        d.onclick = () => openPart(part);
        const heartClass = 'favorite-heart active';
        const heartFill = '#ff4757';
        const heartStroke = '#ff4757';
        d.innerHTML = `<div class="listing-card-media"><img class="listing-card-img" loading="lazy" src="${mI}" onerror="this.src='https://placehold.co/400?text=Нет+фото'"></div><div class="${heartClass}" onclick="event.stopPropagation(); toggleFavorite(${part.rowIndex})" title="Удалить из избранного"><svg width="24" height="24" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></div><div class="listing-card-content"><div class="listing-card-header"><div class="listing-card-title" title="${part.title || ""}">${part.title || "Без названия"}</div><div class="listing-card-price"><span class="listing-card-price-text">${Number(part.price || 0).toLocaleString()} ₽</span></div><div class="badge-wrap">${badgesHtml}</div></div><div class="listing-card-info">${infoParts.join(' • ')}</div></div>`;
        grid.appendChild(d);
    });
}
function renderProfile() {
    const authPrompt = document.getElementById('profile-auth-prompt');
    const content = document.getElementById('profile-content');
    // Проверяем авторизацию
    if (!currentUser || !currentUser.id) {
        authPrompt.style.display = 'block';
        content.style.display = 'none';
        return;
    }
    authPrompt.style.display = 'none';
    content.style.display = 'block';
    // Обновляем информацию пользователя
    document.getElementById('profile-user-name').innerText = currentUser.name || 'Пользователь';
    document.getElementById('profile-user-phone').innerText = currentUser.phoneNumber || '';
    // Рендерим мои объявления
    profileShowAllAds = false;
    renderUserAds();
    // Рендерим избранное
    renderProfileFavorites();
}
function renderUserAds() {
    const grid = document.getElementById('profile-my-ads-grid');
    const placeholder = document.getElementById('profile-my-ads-placeholder');
    const countEl = document.getElementById('profile-my-ads-count');
    const toggleWrap = document.getElementById('profile-my-ads-toggle-wrap');
    const toggleBtn = document.getElementById('profile-my-ads-toggle');
    if (!grid || !placeholder || !countEl) return;
    if (!currentUser || !currentUser.id) {
        grid.innerHTML = '';
        placeholder.style.display = 'block';
        countEl.innerText = '(0)';
        if (toggleWrap) toggleWrap.style.display = 'none';
        return;
    }
    // Получаем объявления пользователя (техника + запчасти)
    const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '');
    const userPhone = normalizePhone(currentUser.phoneNumber);
    const userAds = allAds.filter(ad => {
        return ad.userId === currentUser.id || normalizePhone(ad.phone) === userPhone;
    });
    const userParts = allParts.filter(part => {
        return part.userId === currentUser.id || normalizePhone(part.phone) === userPhone;
    });
    const allUserItems = [
        ...userAds.map(ad => ({ type: 'ad', data: ad })),
        ...userParts.map(part => ({ type: 'part', data: part }))
    ];
    countEl.innerText = `(${allUserItems.length})`;
    if (allUserItems.length === 0) {
        placeholder.style.display = 'block';
        grid.style.display = 'none';
        if (toggleWrap) toggleWrap.style.display = 'none';
        return;
    }
    const shouldShowToggle = allUserItems.length > 2;
    if (toggleWrap) toggleWrap.style.display = shouldShowToggle ? 'block' : 'none';
    if (!shouldShowToggle) profileShowAllAds = false;
    if (toggleBtn) {
        toggleBtn.innerText = profileShowAllAds ? 'Показать меньше' : 'Показать все';
    }
    placeholder.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = '';
    grid.classList.remove('loaded');
    const itemsToRender = profileShowAllAds ? allUserItems : allUserItems.slice(0, 2);
    itemsToRender.forEach(entry => {
        if (entry.type === 'ad') {
            const ad = entry.data;
            let ph = ad.photos ? ad.photos.split(',') : [], mI = ph.length > 0 ? ph[0] : '';
            if (mI && !mI.startsWith('http')) mI = '';
            const sellerLabel = getSellerTypeLabel(ad);
            let badgesHtml = '';
            if (checkIsNew(ad)) badgesHtml += '<span class="badge-new">НОВЫЙ</span>';
            if (isPrivateSellerLabel(sellerLabel)) badgesHtml += '<span class="badge-private">ВЛАДЕЛЕЦ</span>';
            if ((ad.amphibious || "").toLowerCase() === 'yes') badgesHtml += '<span class="badge-float">ПЛАВАЮЩИЙ</span>';
            const tenderBadgeHtml = ((ad.tender || "").toLowerCase() === 'yes')
                ? '<div class="listing-card-tender-badge visible">В РЕЕСТРЕ МИНПРОМТОРГА</div>'
                : '';
            let infoParts = [];
            if (ad.city) infoParts.push(ad.city);
            else if (ad.region) infoParts.push(ad.region);
            if (ad.power) infoParts.push(ad.power + ' л.с.');
            if (ad.transmission && ad.type !== 'Прицеп' && ad.type !== 'Услуга') infoParts.push(ad.transmission);
            const d = document.createElement('div');
            d.className = 'listing-card';
            d.id = `ad-${ad.rowIndex}`;
            d.onclick = () => openAd(ad);
            const isFavorite = userFavorites.includes(ad.rowIndex);
            const heartClass = isFavorite ? 'favorite-heart active' : 'favorite-heart';
            const heartFill = isFavorite ? '#ff4757' : 'none';
            const heartStroke = isFavorite ? '#ff4757' : '#ccc';
            d.innerHTML = `<div class="listing-card-media"><img class="listing-card-img" loading="lazy" src="${mI}" onerror="this.src='https://placehold.co/400?text=Нет+фото'">${tenderBadgeHtml}</div><div class="${heartClass}" onclick="event.stopPropagation(); toggleFavorite(${ad.rowIndex})" title="${isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}"><svg width="24" height="24" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></div><div class="listing-card-content"><div class="listing-card-header"><div class="listing-card-title" title="${ad.title || ""}">${ad.title || "Без названия"}</div><div class="listing-card-price"><span class="listing-card-price-text">${Number(ad.price || 0).toLocaleString()} ₽</span></div><div class="badge-wrap">${badgesHtml}</div></div><div class="listing-card-info">${infoParts.join(' • ')}</div></div>`;
            grid.appendChild(d);
            return;
        }
        const part = entry.data;
        let ph = part.photos ? part.photos.split(',') : [], mI = ph.length > 0 ? ph[0] : '';
        if (mI && !mI.startsWith('http')) mI = '';
        const sellerLabel = getSellerTypeLabel(part);
        let badgesHtml = '';
        if (part.condition === 'new') badgesHtml += '<span class="badge-new">НОВАЯ</span>';
        if (isPrivateSellerLabel(sellerLabel)) badgesHtml += '<span class="badge-private">ВЛАДЕЛЕЦ</span>';
        let infoParts = [];
        if (part.brand) infoParts.push(part.brand);
        if (part.city) infoParts.push(part.city);
        if (sellerLabel) infoParts.push(sellerLabel);
        const d = document.createElement('div');
        d.className = 'listing-card';
        d.id = `part-${part.rowIndex}`;
        d.onclick = () => openPart(part);
        const isFavorite = userFavorites.includes(part.rowIndex);
        const heartClass = isFavorite ? 'favorite-heart active' : 'favorite-heart';
        const heartFill = isFavorite ? '#ff4757' : 'none';
        const heartStroke = isFavorite ? '#ff4757' : '#ccc';
        d.innerHTML = `<div class="listing-card-media"><img class="listing-card-img" loading="lazy" src="${mI}" onerror="this.src='https://placehold.co/400?text=Нет+фото'"></div><div class="${heartClass}" onclick="event.stopPropagation(); toggleFavorite(${part.rowIndex})" title="${isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}"><svg width="24" height="24" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></div><div class="listing-card-content"><div class="listing-card-header"><div class="listing-card-title" title="${part.title || ""}">${part.title || "Без названия"}</div><div class="listing-card-price"><span class="listing-card-price-text">${Number(part.price || 0).toLocaleString()} ₽</span></div><div class="badge-wrap">${badgesHtml}</div></div><div class="listing-card-info">${infoParts.join(' • ')}</div></div>`;
        grid.appendChild(d);
    });
    // Добавляем класс loaded для показа карточек с анимацией
    setTimeout(() => grid.classList.add('loaded'), 50);
}
function toggleProfileAdsList() {
    profileShowAllAds = !profileShowAllAds;
    renderUserAds();
}
function toggleProfileFavoritesList() {
    profileShowAllFavorites = !profileShowAllFavorites;
    renderProfileFavorites();
}
function renderProfileFavorites() {
    const grid = document.getElementById('profile-favorites-grid');
    const placeholder = document.getElementById('profile-favorites-placeholder');
    const countEl = document.getElementById('profile-favorites-count');
    const toggleWrap = document.getElementById('profile-favorites-toggle-wrap');
    const toggleBtn = document.getElementById('profile-favorites-toggle');
    if (!grid || !placeholder || !countEl) return;
    if (!currentUser || !currentUser.id) {
        grid.innerHTML = '';
        placeholder.style.display = 'block';
        countEl.innerText = '(0)';
        if (toggleWrap) toggleWrap.style.display = 'none';
        return;
    }
    // Получаем избранные объявления
    const favoriteAds = allAds.filter(ad => userFavorites.includes(ad.rowIndex));
    const favoriteParts = allParts.filter(part => userFavorites.includes(part.rowIndex));
    const allFavorites = [
        ...favoriteAds.map(ad => ({ type: 'ad', data: ad })),
        ...favoriteParts.map(part => ({ type: 'part', data: part }))
    ];
    countEl.innerText = `(${allFavorites.length})`;
    if (allFavorites.length === 0) {
        placeholder.style.display = 'block';
        grid.style.display = 'none';
        if (toggleWrap) toggleWrap.style.display = 'none';
        return;
    }
    const shouldShowToggle = allFavorites.length > 2;
    if (toggleWrap) toggleWrap.style.display = shouldShowToggle ? 'block' : 'none';
    if (!shouldShowToggle) profileShowAllFavorites = false;
    if (toggleBtn) {
        toggleBtn.innerText = profileShowAllFavorites ? 'Показать меньше' : 'Показать все';
    }
    placeholder.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = '';
    grid.classList.remove('loaded');
    const itemsToRender = profileShowAllFavorites ? allFavorites : allFavorites.slice(0, 2);
    itemsToRender.forEach(entry => {
        if (entry.type === 'ad') {
            const ad = entry.data;
            let ph = ad.photos ? ad.photos.split(',') : [], mI = ph.length > 0 ? ph[0] : '';
            if (mI && !mI.startsWith('http')) mI = '';
            const sellerLabel = getSellerTypeLabel(ad);
            let badgesHtml = '';
            if (checkIsNew(ad)) badgesHtml += '<span class="badge-new">НОВЫЙ</span>';
            if (isPrivateSellerLabel(sellerLabel)) badgesHtml += '<span class="badge-private">ВЛАДЕЛЕЦ</span>';
            if ((ad.amphibious || "").toLowerCase() === 'yes') badgesHtml += '<span class="badge-float">ПЛАВАЮЩИЙ</span>';
            const tenderBadgeHtml = ((ad.tender || "").toLowerCase() === 'yes')
                ? '<div class="listing-card-tender-badge visible">В РЕЕСТРЕ МИНПРОМТОРГА</div>'
                : '';
            let infoParts = [];
            if (ad.city) infoParts.push(ad.city);
            else if (ad.region) infoParts.push(ad.region);
            if (ad.power) infoParts.push(ad.power + ' л.с.');
            if (ad.transmission && ad.type !== 'Прицеп' && ad.type !== 'Услуга') infoParts.push(ad.transmission);
            const d = document.createElement('div');
            d.className = 'listing-card';
            d.id = `ad-${ad.rowIndex}`;
            d.onclick = () => openAd(ad);
            const heartClass = 'favorite-heart active';
            const heartFill = '#ff4757';
            const heartStroke = '#ff4757';
            d.innerHTML = `<div class="listing-card-media"><img class="listing-card-img" loading="lazy" src="${mI}" onerror="this.src='https://placehold.co/400?text=Нет+фото'">${tenderBadgeHtml}</div><div class="${heartClass}" onclick="event.stopPropagation(); toggleFavorite(${ad.rowIndex})" title="Удалить из избранного"><svg width="24" height="24" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></div><div class="listing-card-content"><div class="listing-card-header"><div class="listing-card-title" title="${ad.title || ""}">${ad.title || "Без названия"}</div><div class="listing-card-price"><span class="listing-card-price-text">${Number(ad.price || 0).toLocaleString()} ₽</span></div><div class="badge-wrap">${badgesHtml}</div></div><div class="listing-card-info">${infoParts.join(' • ')}</div></div>`;
            grid.appendChild(d);
            return;
        }
        const part = entry.data;
        let ph = part.photos ? part.photos.split(',') : [], mI = ph.length > 0 ? ph[0] : '';
        if (mI && !mI.startsWith('http')) mI = '';
        const sellerLabel = getSellerTypeLabel(part);
        let badgesHtml = '';
        if (part.condition === 'new') badgesHtml += '<span class="badge-new">НОВАЯ</span>';
        if (isPrivateSellerLabel(sellerLabel)) badgesHtml += '<span class="badge-private">ВЛАДЕЛЕЦ</span>';
        let infoParts = [];
        if (part.brand) infoParts.push(part.brand);
        if (part.city) infoParts.push(part.city);
        if (sellerLabel) infoParts.push(sellerLabel);
        const d = document.createElement('div');
        d.className = 'listing-card';
        d.id = `part-${part.rowIndex}`;
        d.onclick = () => openPart(part);
        const heartClass = 'favorite-heart active';
        const heartFill = '#ff4757';
        const heartStroke = '#ff4757';
        d.innerHTML = `<div class="listing-card-media"><img class="listing-card-img" loading="lazy" src="${mI}" onerror="this.src='https://placehold.co/400?text=Нет+фото'"></div><div class="${heartClass}" onclick="event.stopPropagation(); toggleFavorite(${part.rowIndex})" title="Удалить из избранного"><svg width="24" height="24" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></div><div class="listing-card-content"><div class="listing-card-header"><div class="listing-card-title" title="${part.title || ""}">${part.title || "Без названия"}</div><div class="listing-card-price"><span class="listing-card-price-text">${Number(part.price || 0).toLocaleString()} ₽</span></div><div class="badge-wrap">${badgesHtml}</div></div><div class="listing-card-info">${infoParts.join(' • ')}</div></div>`;
        grid.appendChild(d);
    });
    // Добавляем класс loaded для показа карточек с анимацией
    setTimeout(() => grid.classList.add('loaded'), 50);
}
async function approveAd(rowIndex) {
    try {
        showLoader('Одобрение...');
        const response = await fetch('/api/ads/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rowIndex })
        });
        const result = await response.json();
        if (result.status !== 'success') {
            throw new Error(result.message || 'Ошибка');
        }
        const idx = Array.isArray(allAds)
            ? allAds.findIndex(ad => Number(ad.rowIndex) === Number(rowIndex))
            : -1;
        if (idx >= 0) {
            allAds[idx].verified = 1;
        }
        const partIdx = Array.isArray(allParts)
            ? allParts.findIndex(part => Number(part.rowIndex) === Number(rowIndex))
            : -1;
        if (partIdx >= 0) {
            allParts[partIdx].verified = 1;
        }
        const adminTab = document.getElementById('tab-content-admin');
        const isAdminActive = adminTab && adminTab.classList.contains('active');
        if (isAdminActive) {
            const card = document.querySelector(`.moderation-card[data-row-index="${rowIndex}"]`);
            if (card) card.remove();
            updateModerationPlaceholderState();
        } else if (typeof applyFilters === 'function') {
            applyFilters();
        }
        if (isAdmin) {
            renderModerationGrid(getPendingModerationItems());
            updateAdminCount();
        }
    } catch (e) {
        alert(e.message || 'Ошибка');
    } finally {
        hideLoader();
    }
}
async function rejectAd(rowIndex) {
    try {
        showLoader('Отклонение...');
        const response = await fetch('/api/ads/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rowIndex })
        });
        const result = await response.json();
        if (result.status !== 'success') {
            throw new Error(result.message || 'Ошибка');
        }
        if (Array.isArray(allAds)) {
            allAds = allAds.filter(ad => Number(ad.rowIndex) !== Number(rowIndex));
        }
        if (Array.isArray(allParts)) {
            allParts = allParts.filter(part => Number(part.rowIndex) !== Number(rowIndex));
        }
        const adminTab = document.getElementById('tab-content-admin');
        const isAdminActive = adminTab && adminTab.classList.contains('active');
        if (isAdminActive) {
            const card = document.querySelector(`.moderation-card[data-row-index="${rowIndex}"]`);
            if (card) card.remove();
            updateModerationPlaceholderState();
        } else if (typeof applyFilters === 'function') {
            applyFilters();
        }
        if (isAdmin) {
            renderModerationGrid(getPendingModerationItems());
            updateAdminCount();
        }
    } catch (e) {
        alert(e.message || 'Ошибка');
    } finally {
        hideLoader();
    }
}
async function approvePart(rowIndex) {
    // Модерация удалена в новой структуре БД
    alert('Модерация больше не требуется');
}
async function rejectPart(rowIndex) {
    // Модерация удалена в новой структуре БД
    alert('Модерация больше не требуется');
}