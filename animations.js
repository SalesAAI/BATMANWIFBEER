// Initialize GSAP
gsap.registerPlugin(ScrollTrigger);

function initAnimations() {
    // Create and animate glitching $ symbol
    function createGlitchingDollarSign() {
        const titleElement = document.querySelector('.glitch-text');
        if (!titleElement) return;

        const dollarSpan = document.createElement('span');
        dollarSpan.classList.add('dollar-sign');
        dollarSpan.textContent = '$';
        titleElement.prepend(dollarSpan);

        function glitchDollar() {
            const glitchChars = '!@#%^&*<>?';
            let glitchCount = 0;
            let isVisible = true;

            const glitchInterval = setInterval(() => {
                if (glitchCount > 3) {
                    clearInterval(glitchInterval);
                    if (dollarSpan && dollarSpan.style) {
                        dollarSpan.style.opacity = '0';
                    }
                    setTimeout(glitchDollar, Math.random() * 5000 + 2000);
                }

                if (dollarSpan) {
                    dollarSpan.textContent = isVisible ? 
                        glitchChars[Math.floor(Math.random() * glitchChars.length)] : 
                        '$';
                }
                
                isVisible = !isVisible;
                glitchCount++;
            }, 100);

            if (dollarSpan) {
                gsap.to(dollarSpan, {
                    opacity: 1,
                    duration: 0.1,
                    onComplete: () => {
                        if (dollarSpan) {
                            gsap.to(dollarSpan, {
                                opacity: 0,
                                duration: 0.1,
                                delay: 0.4
                            });
                        }
                    }
                });
            }
        }

        // Start the glitch effect
        glitchDollar();
    }

    // Hero Section Animations
    const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroTimeline
            .from(heroContent, {
                opacity: 0,
                y: 50,
                duration: 1
            })
            .from('.batman-logo-3d', {
                opacity: 0,
                y: 30,
                duration: 1
            }, '-=0.5')
            .from('.glitch-text', {
                opacity: 0,
                y: 20,
                duration: 0.8,
                onComplete: createGlitchingDollarSign
            }, '-=0.3')
            .from('.hero-tagline', {
                opacity: 0,
                y: 20,
                duration: 0.8
            }, '-=0.3')
            .from('.cta-buttons', {
                opacity: 0,
                y: 20,
                duration: 0.8
            }, '-=0.3');
    }

    // 3D Card Hover Effects
    const cards = document.querySelectorAll('.token-stat, .step-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            gsap.to(card, {
                duration: 0.5,
                rotateX: rotateX,
                rotateY: rotateY,
                scale: 1.05,
                ease: 'power2.out',
                transformPerspective: 1000
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                duration: 0.5,
                rotateX: 0,
                rotateY: 0,
                scale: 1,
                ease: 'power2.out'
            });
        });
    });

    // Scroll Animations
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                end: 'top 20%',
                scrub: 1,
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 50,
            duration: 1
        });
    });

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAnimations);
