// Registriere ScrollTrigger von GSAP
gsap.registerPlugin(ScrollTrigger);

// Speichere die aktuellen ScrollTrigger für den Refresh
let ctx;

// === Navigation Logic ===
function navigateTo(viewId) {
    // 1. Update Navigation Buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.target === viewId) {
            btn.classList.add('active');
        }
    });

    // 2. Ansichten wechseln mit kurzer Fade-Animation
    const currentView = document.querySelector('.view.active-view');
    const nextView = document.getElementById('view-' + viewId);

    if (currentView === nextView) return; // Bereits auf dieser Seite

    // Nach oben scrollen
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fade Out current
    gsap.to(currentView, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        onComplete: () => {
            currentView.classList.remove('active-view');

            // Fade In next
            nextView.classList.add('active-view');
            gsap.fromTo(nextView,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, clearProps: "all" }
            );

            // Re-initialisiere Animationen für die neue Ansicht
            initAnimations(viewId);
        }
    });
}

// === Animations Setup ===
function initAnimations(viewId) {
    // Falls alte Animationen laufen, diese aufräumen
    if (ctx) ctx.revert();

    // Neuer Kontext für ScrollTrigger
    ctx = gsap.context(() => {

        // --- HOME PAGE ANIMATIONS ---
        if (viewId === 'home') {
            const tlHero = gsap.timeline();
            tlHero.to(".hero-title", {
                y: 0,
                opacity: 1,
                duration: 1.2,
                ease: "power4.out",
                delay: 0.1
            }).to(".hero-subtitle", {
                opacity: 1,
                duration: 1,
                ease: "power2.out"
            }, "-=0.8").to(".cta-container", {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power2.out"
            }, "-=0.6");

            // Parallax Orbs
            gsap.to(".orb-1", {
                yPercent: 40, ease: "none",
                scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
            });
            gsap.to(".orb-2", {
                yPercent: -40, ease: "none",
                scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
            });

            // Scroll Reveal Text
            if (document.querySelector('.reveal-content')) {
                gsap.from(".reveal-content", {
                    y: 100, opacity: 0, duration: 1.2, ease: "power4.out",
                    scrollTrigger: {
                        trigger: ".scroll-reveal",
                        start: "top 80%", toggleActions: "play none none reverse"
                    }
                });
            }

            // Horizontal Scroll
            const horizontalContainer = document.querySelector(".horizontal-container");
            if (horizontalContainer) {
                const horizontalSections = gsap.utils.toArray('.horizontal-item');
                gsap.to(horizontalSections, {
                    xPercent: -100 * (horizontalSections.length - 1),
                    ease: "none",
                    scrollTrigger: {
                        trigger: ".horizontal-scroll",
                        pin: true,
                        scrub: 1,
                        snap: 1 / (horizontalSections.length - 1),
                        start: "top top",
                        end: () => "+=" + horizontalContainer.offsetWidth
                    }
                });
            }
        }

        // --- PRODUKTE & TECHNOLOGIE ANIMATIONS ---
        if (viewId === 'content' || viewId === 'about') {
            gsap.from(".page-title", { y: 30, opacity: 0, duration: 1, ease: "power3.out", delay: 0.2 });
            gsap.from(".page-subtitle", { y: 20, opacity: 0, duration: 1, ease: "power3.out", delay: 0.4 });

            // Stagger Cards
            gsap.from(".product-card, .grid-card", {
                y: 50, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out",
                scrollTrigger: {
                    trigger: viewId === 'content' ? ".product-showcase" : ".tech-grid",
                    start: "top 85%"
                }
            });
        }

        ScrollTrigger.refresh();
    });
}

// --- Live Discord Fetch ---
async function fetchDiscordData() {
    try {
        // Hinweis: Damit das funktioniert, MUSS auf dem Discord Server im Reiter "Widget"
        // die Option "Server-Widget aktivieren" eingeschaltet sein!
        // Wir nutzen hier als Fallback-Beispiel/Platzhalter die Discord API (ohne Auth -> Widget API).
        // Wir brauchen dafür aber die Discord Server ID (Guild ID).
        // Da wir nur den Invite "XZDYvDqGTb" haben, versuchen wir es stattdessen über eine Invite-Details API:
        const inviteCode = 'XZDYvDqGTb';
        const response = await fetch(`https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`);

        if (!response.ok) return null;
        const data = await response.json();

        return {
            online: data.approximate_presence_count || 0,
            total: data.approximate_member_count || 0
        };
    } catch (e) {
        console.error("Fehler beim Discord Fetch:", e);
        return null;
    }
}

function startDiscordObserver() {
    const discordElement = document.getElementById('live-discord');
    if (!discordElement) return;

    let currentOnline = 0;

    const updateDiscord = async () => {
        const data = await fetchDiscordData();

        if (data && data.online !== currentOnline) {
            currentOnline = data.online;
            // Zeige z.B. "42 / 120" (Online / Total) an oder nur Online
            discordElement.innerText = `${data.online} / ${data.total}`;

            // Animation bei Update
            gsap.fromTo(discordElement,
                { scale: 1.3, color: "#5865F2" }, // Discord Blau
                { scale: 1, color: "#ffffff", duration: 0.8, ease: "back.out(1.5)" }
            );
        } else if (!data && currentOnline === 0) {
            discordElement.innerText = `Offline`;
        }
    };

    updateDiscord();
    setInterval(updateDiscord, 15000); // Alle 15 Sekunden
}

// --- Live Follower Fetch (Echtzeit) ---
async function fetchTikTokFollowers() {
    try {
        const username = 'hapticofc';
        // Wir nutzen einen CORS-Proxy, da direkte Anfragen an TikTok vom Browser blockiert werden
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://www.tiktok.com/@' + username)}`;

        const response = await fetch(proxyUrl);
        if (!response.ok) return null;

        const html = await response.text();

        // TikTok speichert User-Metadaten in einem JSON-Skript im HTML. Wir greifen auf followerCount zu.
        const match = html.match(/"followerCount":(\d+)/);
        if (match && match[1]) {
            return parseInt(match[1], 10);
        }
    } catch (error) {
        console.error("Konnte Follower nicht abrufen. TikTok blockiert möglicherweise den Proxy.", error);
    }
    return null;
}

function startFollowerObserver() {
    const followerElement = document.getElementById('live-followers');
    if (!followerElement) return;

    let currentFollowers = 10742; // Fallback, solange es noch lädt

    const updateFollowers = async () => {
        const liveCount = await fetchTikTokFollowers();

        // Wenn ein gültiger Wert kommt und er sich verändert hat:
        if (liveCount && liveCount !== currentFollowers) {
            currentFollowers = liveCount;
            followerElement.innerText = currentFollowers.toLocaleString('de-DE');

            // Animation bei Update
            gsap.fromTo(followerElement,
                { scale: 1.3, color: "#ff0055" },
                { scale: 1, color: "#ffffff", duration: 0.8, ease: "back.out(1.5)" }
            );
        }
    };

    // Initiale Abfrage starten
    updateFollowers();

    // Alle 10 Sekunden nach neuen Followern schauen
    setInterval(updateFollowers, 10000);
}

// === Init bei Seitenaufruf ===
window.addEventListener('DOMContentLoaded', () => {
    // Setze anfängliche Opacities für Home-Elemente auf 0
    gsap.set(".hero-title", { y: 40, opacity: 0 });
    gsap.set(".hero-subtitle", { opacity: 0 });
    gsap.set(".cta-container", { y: 20, opacity: 0 });

    // Starte Animationen für Home
    initAnimations('home');

    // Starte echten Follower-Zähler (10 Sekunden Intervall)
    startFollowerObserver();

    // Starte echten Discord-Zähler (15 Sekunden Intervall)
    startDiscordObserver();
});
