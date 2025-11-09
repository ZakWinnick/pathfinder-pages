// ===== MOBILE MENU FUNCTIONALITY =====
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (navMenu && mobileMenuToggle) {
        if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
            navMenu.classList.remove('active');
        }
    }
});

// ===== SMOOTH SCROLLING FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            // Offset for fixed nav
            const navbar = document.querySelector('.navbar');
            const navHeight = navbar ? navbar.offsetHeight : 80;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            // Close mobile menu if open
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
            }
        }
    });
});

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply fade-in animation to cards
document.querySelectorAll('.tier-card, .benefit-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(card);
});

// ===== ANIMATED STATISTICS COUNTERS =====
function animateCounter(element, target, duration = 2000, suffix = '') {
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString() + suffix;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString() + suffix;
        }
    }, 16);
}

// Observer for statistics section
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Trigger counter animations
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(statNumber => {
                const target = parseInt(statNumber.dataset.target);
                const suffix = statNumber.dataset.suffix || '';
                animateCounter(statNumber, target, 1500, suffix);
            });

            // Unobserve after animation triggers
            statsObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.3
});

// Observe the stats section
const statsSection = document.querySelector('.stats-section');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// ===== BENEFITS CALCULATOR =====
const tierData = {
    explorer: {
        name: 'Explorer',
        price: 'Free',
        discount: 5,
        monthlyFee: 0,
        annualCredit: 0
    },
    voyager: {
        name: 'Voyager',
        price: '$12/mo',
        discount: 10,
        monthlyFee: 12,
        annualCredit: 0
    },
    pioneer: {
        name: 'Pioneer',
        price: '$25/mo',
        discount: 15,
        monthlyFee: 25,
        annualCredit: 100
    }
};

const avgCharge = 40;

function calculateSavings(sessions, tierKey) {
    const tier = tierData[tierKey];
    const monthlyCost = sessions * avgCharge;
    const monthlySavings = (monthlyCost * tier.discount / 100) - tier.monthlyFee;
    const annualSavings = (monthlySavings * 12) + tier.annualCredit;

    let roiMonths = 'N/A';
    if (tier.monthlyFee > 0 && monthlySavings > 0) {
        roiMonths = Math.ceil(tier.monthlyFee / monthlySavings);
    }

    return {
        monthly: monthlySavings,
        annual: annualSavings,
        roi: roiMonths
    };
}

function formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function animateValue(element, newValue) {
    element.classList.add('updating');
    setTimeout(() => {
        element.classList.remove('updating');
    }, 300);
}

function updateCalculator(sessions) {
    const resultsContainer = document.getElementById('calculator-results');

    // Calculate which tier is recommended
    let maxValue = -Infinity;
    let recommendedTier = 'explorer';

    Object.keys(tierData).forEach(tierKey => {
        const savings = calculateSavings(sessions, tierKey);
        if (savings.annual > maxValue) {
            maxValue = savings.annual;
            recommendedTier = tierKey;
        }
    });

    // Generate HTML for all tiers
    resultsContainer.innerHTML = Object.keys(tierData).map(tierKey => {
        const tier = tierData[tierKey];
        const savings = calculateSavings(sessions, tierKey);
        const isRecommended = tierKey === recommendedTier && sessions > 0;

        let roiText = '';
        if (tierKey === 'explorer') {
            roiText = 'No membership fee';
        } else if (tierKey === 'trailblazer') {
            roiText = 'Invitation only';
        } else if (savings.roi === 'N/A' || savings.monthly <= 0) {
            roiText = 'Increase sessions for positive ROI';
        } else if (savings.roi === 1) {
            roiText = 'Pays for itself in 1 month';
        } else {
            roiText = `Pays for itself in ${savings.roi} months`;
        }

        return `
            <div class="calc-result-card ${isRecommended ? 'recommended' : ''}">
                <div class="calc-tier-name">${tier.name}</div>
                <div class="calc-tier-price">${tier.price}</div>
                <div class="calc-metric">
                    <div class="calc-metric-label">Monthly Savings</div>
                    <div class="calc-metric-value">${formatMoney(savings.monthly)}</div>
                </div>
                <div class="calc-metric">
                    <div class="calc-metric-label">Annual Savings</div>
                    <div class="calc-metric-value">${formatMoney(savings.annual)}</div>
                </div>
                <div class="calc-roi">${roiText}</div>
            </div>
        `;
    }).join('');

    // Animate all values
    document.querySelectorAll('.calc-metric-value').forEach(el => {
        animateValue(el);
    });
}

// Initialize calculator
const slider = document.getElementById('charging-sessions');
const sessionCountDisplay = document.getElementById('session-count');

if (slider && sessionCountDisplay) {
    slider.addEventListener('input', (e) => {
        const sessions = parseInt(e.target.value);
        sessionCountDisplay.textContent = sessions;
        updateCalculator(sessions);
    });

    // Initialize with default value
    updateCalculator(parseInt(slider.value));
}

// ===== TIER VIEW TOGGLE =====
const toggleButtons = document.querySelectorAll('.view-toggle-btn');
const tiersGrid = document.querySelector('.tiers-grid');
const tiersTable = document.querySelector('.tiers-table');

toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
        const view = button.dataset.view;

        // Update button states
        toggleButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Switch views with fade transition
        if (view === 'grid') {
            tiersTable.classList.add('fade-out');
            setTimeout(() => {
                tiersTable.style.display = 'none';
                tiersGrid.style.display = 'grid';
                tiersGrid.classList.remove('fade-out');
            }, 300);
        } else {
            tiersGrid.classList.add('fade-out');
            setTimeout(() => {
                tiersGrid.style.display = 'none';
                tiersTable.style.display = 'block';
                tiersTable.classList.remove('fade-out');
            }, 300);
        }
    });
});
