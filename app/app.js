// Bumper Intro & Loading Logic (5 seconds)
(function initBumper() {
    const bumper = document.getElementById('intro-bumper');
    
    if (!bumper) return;

    // We expose finishIntro globally so the Skip button can call it
    window.finishIntroGlobal = () => {
        console.log("Intro timer finished, unlocking UI");
        if (bumper) {
            bumper.classList.add('bumper-wipe-out');
            // We no longer remove it from the DOM. We leave it there with pointer-events: none.
        }
    };

    // Check if bumper has played in this session to avoid annoyance
    if (sessionStorage.getItem('mastermind_intro_played')) {
        window.finishIntroGlobal();
        return;
    }
    sessionStorage.setItem('mastermind_intro_played', 'true');

    // Play Audio Sequence (Hum + Chime) - Note: May be blocked by browser autoplay policy until user interacts
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        
        // 1. Futuristic Hum (0 to 3s)
        const humOSC = ctx.createOscillator();
        const humGain = ctx.createGain();
        humOSC.type = 'sine';
        humOSC.frequency.setValueAtTime(60, ctx.currentTime);
        humOSC.frequency.linearRampToValueAtTime(90, ctx.currentTime + 3);
        humGain.gain.setValueAtTime(0, ctx.currentTime);
        humGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 1);
        humGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
        humOSC.connect(humGain);
        humGain.connect(ctx.destination);
        humOSC.start(ctx.currentTime);
        humOSC.stop(ctx.currentTime + 3);

        // 2. Elegant Chime (at 3.5s)
        const chimeTime = ctx.currentTime + 3.5;
        const chimeOSC = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chimeOSC.type = 'triangle';
        chimeOSC.frequency.setValueAtTime(880, chimeTime); // A5
        chimeOSC.frequency.exponentialRampToValueAtTime(440, chimeTime + 1.5);
        chimeGain.gain.setValueAtTime(0, chimeTime);
        chimeGain.gain.linearRampToValueAtTime(0.4, chimeTime + 0.1);
        chimeGain.gain.exponentialRampToValueAtTime(0.01, chimeTime + 1.5);
        chimeOSC.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        chimeOSC.start(chimeTime);
        chimeOSC.stop(chimeTime + 1.5);
        
    } catch (e) {
        console.warn("AudioContext failed or blocked by autoplay policy:", e);
    }

    let bumperTimeout;

    // Unmount Sequence after 5 seconds exactly and reveal the application smoothly
    bumperTimeout = setTimeout(() => {
        if (window.finishIntroGlobal) window.finishIntroGlobal();
    }, 5000); // 5 seconds fail-safe timer

    // Attach to skip button if present
    const skipBtn = document.getElementById('skip-intro-btn');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            clearTimeout(bumperTimeout);
            if (window.finishIntroGlobal) window.finishIntroGlobal();
        });
    }

    // Mimic useEffect cleanup to prevent memory leaks if user navigates away
    window.addEventListener('unload', () => {
        clearTimeout(bumperTimeout);
    });
})();

// We need to fetch the dynamically generated thumbnail paths from the artifact directory.
// Actually, since this is local execution in the app folder, we will use the absolute paths
// from the artifact dir.
const artifactsDir = "C:\\Users\\VK\\.gemini\\antigravity\\brain\\522f613c-fdf1-4886-bbe2-26bf3d04913d\\";
const thumbnails = [
    artifactsDir + "course_thumbnail_1_1772903092004.png",
    artifactsDir + "course_thumbnail_2_1772903116154.png",
    artifactsDir + "course_thumbnail_3_1772903142059.png",
    artifactsDir + "course_thumbnail_4_1772903169091.png"
];

const loginHeroImgPath = artifactsDir + "login_hero_illustration_1772904116443.png";

// --- Global Auth State ---
let currentUser = null; // null = logged out, object = logged in

// Mock Course Data
const courses = [
    { 
        id: "ai-masterclass", 
        title: 'MasterMind COURSE', 
        desc: 'The ultimate foundational guide to mastering Gen-AI and designing modern user interfaces.',
        img: thumbnails[1], // Using the second generated thumbnail
        timing: '12 Weeks (4h / week)',
        level: 'Beginner to Intermediate',
        price: '₹300'
    },
    { 
        id: "ui-trends", 
        title: 'UI/UX Design Trends', 
        desc: 'Learn the latest layout principles, typography, and wireframing techniques for building elegant apps.',
        img: thumbnails[2],
        timing: '8 Weeks (3h / week)',
        level: 'Intermediate',
        price: '₹250'
    },
    { 
        id: "prompt-eng", 
        title: 'Prompt Engineering for Designers', 
        desc: 'Unlock creative abstract concepts using Midjourney, DALL-E, and advanced prompting strategies.',
        img: thumbnails[3],
        timing: '4 Weeks (2h / week)',
        level: 'All Levels',
        price: '₹150'
    }
];

// --- Navigation & Routing with Protected Route Guards ---
function switchTab(tabId) {
    // Note: The global route guard has been removed to allow free browsing.
    // Gating is now handled selectively via `triggerEnrollPaywall()`
    
    // Hide bottom bar if navigating away from course detail
    const purchaseBar = document.getElementById('purchase-bar');
    if (tabId !== 'course-detail' && purchaseBar) {
        purchaseBar.classList.add('hidden');
    }

    // Toggle Nav Items
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const clickedTab = document.querySelector(`[data-target="${tabId}"]`);
    if (clickedTab) clickedTab.classList.add('active');
    
    // Toggle Views
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    // Update Header Text
    const titleMap = {
        'home': { title: 'Discover Courses', subtitle: 'Elevate your skills today.' },
        'login': { title: 'Account Portal', subtitle: 'Manage your settings.' },
        'settings': { title: 'Settings', subtitle: 'App preferences and support.' },
        'course-detail': { title: 'Course Overview', subtitle: 'Deep dive into the curriculum.' },
        'terms': { title: 'Legal & Policies', subtitle: 'Terms of Service.' },
        'about': { title: 'About Us', subtitle: 'The MasterMind platform.' }
    };
    
    if (titleMap[tabId]) {
        document.getElementById('page-title').innerText = titleMap[tabId].title;
        // Inject dynamic greeting subtitle if authenticated and on home
        if (tabId === 'home' && currentUser && currentUser.first_name) {
            document.getElementById('page-subtitle').innerText = "Welcome back, MasterMind " + currentUser.first_name;
        } else {
            document.getElementById('page-subtitle').innerText = titleMap[tabId].subtitle;
        }
    }
}

// Rendering Logic
function renderCarousel() {
    const carousel = document.getElementById('thumbnail-carousel');
    if (!carousel) return;
    
    // Render the 4 thumbnails
    carousel.innerHTML = thumbnails.map(thumb => `
        <div class="carousel-item" style="background-image: url('${thumb.replace(/\\/g, '/')}');"></div>
    `).join('');
}

function renderCourses() {
    const catalog = document.getElementById('course-catalog');
    if (!catalog) return;
    
    catalog.innerHTML = courses.map(c => {

        // Standard Course Render
        return `
        <div class="course-card" onclick="openCourseDetail('${c.id}')">
            <div class="course-img" style="background-image: url('${c.img.replace(/\\/g, '/')}');"></div>
            <div class="course-info">
                <h4>${c.title}</h4>
                <p class="course-desc">${c.desc}</p>
            </div>
        </div>
        `;
    }).join('');
}

function openCourseDetail(id) {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    
    const detailContent = document.getElementById('course-detail-content');
    detailContent.innerHTML = `
        <div class="detail-content">
            <div class="detail-hero" style="background-image: url('${course.img.replace(/\\/g, '/')}');"></div>
            <h2>${course.title}</h2>
            
            <div class="detail-meta">
                <div class="meta-item">
                    <span class="meta-label">Timing</span>
                    <span class="meta-value">${course.timing}</span>
                </div>
                <!-- Vertical Divider spacer -->
                <div style="width: 1px; background: var(--border-color); margin: 0 10px;"></div>
                <div class="meta-item">
                    <span class="meta-label">Difficulty</span>
                    <span class="meta-value">${course.level}</span>
                </div>
            </div>
            
            <h3>Description</h3>
            <p class="detail-description">
                ${course.desc}
                <br><br>
                In this course, you will learn comprehensive strategies to stay ahead in the tech and design industry. We break down complex subjects into easily digestible modules, packed with real-world projects and examples. Whether you are aiming to enhance your career or build entirely new products from scratch, this course provides the blueprint.
            </p>
            
            <h3>Syllabus</h3>
            <ul style="margin-top:10px; padding-left:20px; color: var(--text-secondary); font-size: 16px; line-height: 1.8;">
                <li>Module 1: Fundamentals & Environment Setup</li>
                <li>Module 2: Core Concepts in Practice</li>
                <li>Module 3: Advanced Workflows & Pipelines</li>
                <li>Module 4: Final Capstone Project</li>
            </ul>
            </ul>
        </div>
    `;
    
    // Update the purchase bar
    const purchaseBar = document.getElementById('purchase-bar');
    if (purchaseBar) {
        purchaseBar.querySelector('.price').innerText = course.price;
        // Update the Enroll button to use the selective gating logic
        const enrollBtn = purchaseBar.querySelector('.btn-primary');
        if (enrollBtn) {
            enrollBtn.setAttribute('onclick', `triggerEnrollPaywall('${course.id}')`);
            enrollBtn.innerText = 'Enroll Now';
        }
        
        // Slide up the purchase bar
        setTimeout(() => {
            purchaseBar.classList.remove('hidden');
        }, 100);
    }
    
    switchTab('course-detail');
}

// --- Selective Gating Logic ---

function triggerEnrollPaywall(courseId) {
    if (currentUser) {
        // User is logged in, allow them to proceed
        if(window.showToast) window.showToast("Enrolling in course...");
        // Here we would handle the actual payment/enrollment logic
    } else {
        // User is a guest, show the auth modal
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.remove('hidden');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
}

function redirectToLogin() {
    closeAuthModal();
    switchTab('login');
}

async function handleGoogleLogin() {
    if (window.supabaseClient) {
        const { error } = await window.supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) console.error("Login Error:", error.message);
    } else {
        console.error("Supabase client not initialized.");
    }
}

function logoutUser() {
    currentUser = null;
    if (document.getElementById('settings').classList.contains('active')) {
        renderSettingsAuth();
    }
}

// --- Dynamic Settings Auth Rendering ---
function renderSettingsAuth() {
    const elGuest = document.getElementById('guest-login-card');
    const elPrivate = document.getElementById('private-settings-block');

    // Remove any previous fade classes
    elPrivate.classList.remove('fade-in');
    
    if (currentUser) {
        // User is logged in!
        // 1. Hide Guest CTA
        elGuest.classList.add('hidden');
        
        // 2. Bind dynamic data
        document.getElementById('profile-name').innerText = currentUser.name;
        document.getElementById('profile-avatar').innerText = currentUser.initials;
        document.getElementById('account-email').innerText = currentUser.email;
        document.getElementById('account-phone').innerText = currentUser.phone;
        
        // 3. Bind Gamification Data
        document.getElementById('gami-points').innerText = Number(currentUser.points).toLocaleString();
        document.getElementById('gami-streak').innerText = currentUser.streak + " 🔥";
        document.getElementById('gami-courses').innerText = currentUser.coursesCompleted;
        
        // 4. Reveal Private block with smooth fade
        elPrivate.classList.remove('hidden');
        // Force reflow
        void elPrivate.offsetWidth;
        elPrivate.classList.add('fade-in');
        
    } else {
        // User is logged out!
        // 1. Hide Private block
        elPrivate.classList.add('hidden');
        
        // 2. Show Guest CTA with fade
        elGuest.classList.remove('hidden');
        elGuest.classList.remove('fade-in');
        void elGuest.offsetWidth;
        elGuest.classList.add('fade-in');
    }
}

// Ensure the render is called when clicking the Settings tab
const originalSwitchTab = switchTab;
switchTab = function(tabId) {
    originalSwitchTab(tabId);
    if (tabId === 'settings') {
        renderSettingsAuth();
    }
}

// --- State Management for Settings ---
function initSettings() {
    // Define all toggle IDs and their default states
    const settingsSchema = {
        'toggle-reminders': true,
        'toggle-offline': false,
        'toggle-announcements': true,
        'toggle-messages': true,
        'toggle-theme': false
    };

    // Initialize inputs and wire events
    Object.keys(settingsSchema).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        // Load from storage or default
        const stored = localStorage.getItem(id);
        if (stored !== null) {
            el.checked = stored === 'true';
        } else {
            el.checked = settingsSchema[id];
            localStorage.setItem(id, settingsSchema[id]);
        }
        
        // Execute side effects immediately on load (mostly for themes)
        handleSettingsSideEffects(id, el.checked);

        // Listen for changes
        el.addEventListener('change', (e) => {
            localStorage.setItem(id, e.target.checked);
            handleSettingsSideEffects(id, e.target.checked);
        });
    });
}

function handleSettingsSideEffects(id, isChecked) {
    if (id === 'toggle-theme') {
        if (isChecked) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
}

// --- Platform Refresh System ---

let isSyncing = false;

function syncData() {
    if (isSyncing) return;
    isSyncing = true;
    
    // UI Feedback Start
    const btn = document.getElementById('sync-btn');
    const progressBar = document.getElementById('cyber-progress-bar');
    if(btn) btn.classList.add('spin');
    
    if(progressBar) {
        progressBar.style.opacity = '1';
        progressBar.style.width = '30%';
        setTimeout(() => { if(isSyncing) progressBar.style.width = '70%'; }, 500);
    }

    // Simulate Network Fetch
    setTimeout(() => {
        // Mutate User Data if logged in to prove sync
        if (currentUser) {
            currentUser.points = Number(currentUser.points) + Math.floor(Math.random() * 50);
            if (Math.random() > 0.8) currentUser.streak += 1;
        }

        // UI Feedback End
        if(progressBar) {
            progressBar.style.width = '100%';
            setTimeout(() => {
                progressBar.style.opacity = '0';
                setTimeout(() => progressBar.style.width = '0%', 300);
            }, 300);
        }
        if(btn) btn.classList.remove('spin');
        
        // Clean PTR UI if active
        document.body.classList.remove('ptr-refreshing', 'ptr-active');
        
        showToast("Data Synchronized ⚡");
        
        // Re-render UI if on settings
        if (document.getElementById('settings').classList.contains('active')) {
            renderSettingsAuth();
        }
        
        isSyncing = false;
    }, 1500);
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    
    // DOM cleanup after animation (0.4 in + 2.6 wait + 0.4 out)
    setTimeout(() => {
        if(toast.parentNode === container) container.removeChild(toast);
    }, 3500);
}

// Mobile Pull-to-Refresh
function initPullToRefresh() {
    let touchStartY = 0;
    let ptrThreshold = 120;
    const viewsContainer = document.querySelector('.views-container');
    
    if (!viewsContainer) return;

    viewsContainer.addEventListener('touchstart', (e) => {
        if (viewsContainer.scrollTop === 0) {
            touchStartY = e.touches[0].clientY;
        } else {
            touchStartY = 0;
        }
    }, {passive: true});

    viewsContainer.addEventListener('touchmove', (e) => {
        if (touchStartY === 0 || isSyncing) return;
        const currentY = e.touches[0].clientY;
        const dy = currentY - touchStartY;
        
        // Only trigger if pulling down while exactly at the top
        if (dy > 0 && viewsContainer.scrollTop <= 0) {
            document.body.classList.add('ptr-active');
            // If pulled past threshold
            if (dy > ptrThreshold) {
               document.body.classList.add('ptr-refreshing');
            }
        }
    }, {passive: true});

    viewsContainer.addEventListener('touchend', () => {
        if (document.body.classList.contains('ptr-refreshing') && !isSyncing) {
            syncData();
        } else {
            // Cancelled pull
            document.body.classList.remove('ptr-active', 'ptr-refreshing');
        }
        touchStartY = 0;
    }, {passive: true});
}

// Service Worker & PWA Init
function initPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => {
                console.log('Service Worker registered', reg);
                // Simulate detecting a new update occasionally
                if (Math.random() > 0.7) {
                    setTimeout(() => showPWABanner(), 5000);
                }
            })
            .catch(err => console.log('Service Worker registration failed', err));
    }
}

function showPWABanner() {
    const banner = document.getElementById('pwa-update-banner');
    if (banner) banner.classList.remove('hidden');
}

// Initialization // exposing global debug trigger for subagent
window.triggerPwaUpdate = showPWABanner;

// --- Auth Handlers for the DOM ---
async function handleGoogleLogin() {
    if (window.supabaseClient) {
        const { error } = await window.supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { 
                redirectTo: `${window.location.origin}/dashboard`,
                queryParams: { prompt: 'select_account' }
            }
        });
        if (error) console.error("Login Error:", error.message);
    } else {
        console.error("Supabase client not initialized.");
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    initSettings();
    initPullToRefresh();
    initPWA();
    
    renderCarousel();
    renderCourses();
    
    // Inject the generated login hero image immediately
    const loginHero = document.getElementById('login-hero-img');
    if (loginHero) {
        loginHero.style.backgroundImage = `url('${loginHeroImgPath.replace(/\\/g, '/')}')`;
    }
    
    // --- Auth Initialization & State Checking ---
    const loadingOverlay = document.getElementById('auth-loading');
    
    try {
        if (window.supabaseClient) {
            // Check initial session
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            await updateGlobalUserState(session);
            
            // Listen for changes (login/logout)
            window.supabaseClient.auth.onAuthStateChange(async (event, newSession) => {
                await updateGlobalUserState(newSession);
                
                if (event === 'SIGNED_OUT') {
                    switchTab('login');
                } else if (event === 'SIGNED_IN') {
                    // Redirect to intended route or home
                    const dest = sessionStorage.getItem('intendedRoute') || 'home';
                    sessionStorage.removeItem('intendedRoute');
                    switchTab(dest);
                }
            });
        }
    } catch (e) {
        console.error("Auth init error:", e);
    } finally {
        if (loadingOverlay) loadingOverlay.style.opacity = '0';
        setTimeout(() => { if (loadingOverlay) loadingOverlay.style.display = 'none'; }, 400);
        
        // Note: We no longer auto-switch to login; guests can view home by default
        if (!currentUser && document.querySelectorAll('.view.active').length === 0) {
            switchTab('home');
        }
    }
});

async function updateGlobalUserState(session) {
    if (session && session.user) {
        // Fetch personalized profile data
        const profile = await window.supabaseApi.fetchUserProfile(session.user.id);
        currentUser = {
            id: session.user.id,
            email: session.user.email,
            phone: session.user.phone,
            first_name: profile.first_name || 'Hacker',
            xp: profile.xp || 0,
            level: profile.level || 1,
            streak: profile.streak || 0,
            points: profile.xp || 0 // mapping to existing logic
        };
        
        // Update Login UI State
        const statusPanel = document.getElementById('auth-status-panel');
        const loginPanel = document.getElementById('auth-login-panel');
        if (statusPanel) statusPanel.classList.remove('hidden');
        if (loginPanel) loginPanel.classList.add('hidden');
        
    } else {
        currentUser = null;
        // Reset Login UI State
        const statusPanel = document.getElementById('auth-status-panel');
        const loginPanel = document.getElementById('auth-login-panel');
        if (statusPanel) statusPanel.classList.add('hidden');
        if (loginPanel) loginPanel.classList.remove('hidden');
    }
}
