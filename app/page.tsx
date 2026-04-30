'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================
// CONFIGURATION
// ============================
const DISCORD_SERVER_URL = 'https://discord.gg/6bXjQA2tPw';
// The actual API key and webhook URLs are handled server-side

// ============================
// ANIMATION VARIANTS
// ============================
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const scaleUp = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.92 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// ============================
// SVG ICONS
// ============================
const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
  </svg>
);

const ViewsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const HeartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CrownIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.5 19h19v2h-19zM22.5 7l-5 5-5-7-5 7-5-5 2.5 12h15z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ============================
// 3D SPHERE COMPONENT
// ============================
function AnimatedSphere() {
  return (
    <motion.div
      className="sphere-container"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
    >
      <div className="sphere-wrapper">
        {/* Orbit rings */}
        <div className="orbit-ring">
          <div className="orbit-particle" />
        </div>
        <div className="orbit-ring">
          <div className="orbit-particle" />
        </div>
        <div className="orbit-ring" />

        {/* Core glow */}
        <div className="sphere-core" />

        {/* Glass shell */}
        <div className="sphere-glass" />

        {/* Specular highlight */}
        <div className="sphere-highlight" />

        {/* Floating dots */}
        <div className="floating-dot floating-dot-1" />
        <div className="floating-dot floating-dot-2" />
        <div className="floating-dot floating-dot-3" />
      </div>
    </motion.div>
  );
}

// ============================
// NAVBAR COMPONENT
// ============================
function Navbar({ onBack, showBack }: { onBack?: () => void; showBack?: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className="nav-bar"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        background: scrolled ? 'rgba(5, 5, 16, 0.85)' : 'rgba(5, 5, 16, 0.6)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {showBack && (
          <button className="back-btn" onClick={onBack} style={{ margin: 0 }}>
            <ArrowLeftIcon />
            Back
          </button>
        )}
        <span className="nav-logo">⚡ ViralGram</span>
      </div>
      <a
        href={DISCORD_SERVER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="support-btn"
      >
        <DiscordIcon />
        <span>Support</span>
      </a>
    </motion.nav>
  );
}

// ============================
// AMBIENT BACKGROUND
// ============================
function AmbientBackground() {
  return (
    <>
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>
      <div className="grid-overlay" />
    </>
  );
}

// ============================
// MODAL COMPONENTS
// ============================

// Views Modal
function ViewsModal({
  onClose,
  onSubmit,
  loading,
  error,
}: {
  onClose: () => void;
  onSubmit: (link: string) => void;
  loading: boolean;
  error: string | null;
}) {
  const [link, setLink] = useState('');

  return (
    <motion.div
      className="modal-overlay"
      onClick={onClose}
      {...fadeIn}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        {...scaleUp}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-icon modal-icon-views">
          <ViewsIcon />
        </div>

        <h2 className="modal-title">Send Free Views</h2>
        <p className="modal-subtitle">
          Enter your Instagram Reel link below. You'll receive 500 views delivered within 1 hour.
        </p>

        <div className="input-group">
          <label className="input-label">Instagram Reel Link</label>
          <input
            type="url"
            className="input-field"
            placeholder="https://www.instagram.com/reel/..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Views Amount</label>
          <input
            type="text"
            className="input-field"
            value="500 Views"
            disabled
          />
          <p className="input-hint">Fixed amount for free tier</p>
        </div>

        <button
          className="btn-submit"
          disabled={!link.trim() || loading}
          onClick={() => onSubmit(link.trim())}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Processing...
            </>
          ) : (
            'Send Views →'
          )}
        </button>

        {error && <p className="error-text">{error}</p>}
      </motion.div>
    </motion.div>
  );
}

// Success Modal
function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="modal-overlay"
      onClick={onClose}
      {...fadeIn}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        {...scaleUp}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center' }}
      >
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="success-checkmark">✓</div>

        <h2 className="modal-title">Order Placed Successfully!</h2>
        <p className="modal-subtitle">
          Your 500 views are on the way! They will be delivered within <strong style={{ color: '#22d3ee' }}>1 hour</strong>. Sit back and relax.
        </p>

        <button className="btn-submit" onClick={onClose} style={{ marginTop: '8px' }}>
          Done
        </button>
      </motion.div>
    </motion.div>
  );
}

// Premium Lock Modal
function PremiumLockModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="modal-overlay"
      onClick={onClose}
      {...fadeIn}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        {...scaleUp}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-icon modal-icon-lock">
          <LockIcon />
        </div>

        <h2 className="modal-title">Premium Feature</h2>
        <p className="modal-subtitle">
          This feature is available exclusively for Premium members. Upgrade now to unlock unlimited likes, followers, and more.
        </p>

        <a
          href={DISCORD_SERVER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-submit btn-gold"
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none', color: '#fff' }}
        >
          Upgrade to Premium ✦
        </a>
      </motion.div>
    </motion.div>
  );
}

// Buy Premium Modal
function BuyPremiumModal({ onClose }: { onClose: () => void }) {
  const benefits = [
    {
      icon: '♾️',
      title: 'Unlimited Usage',
      desc: 'No daily limits or cooldowns',
    },
    {
      icon: '⚡',
      title: 'Faster Delivery',
      desc: 'Priority queue, 10x faster processing',
    },
    {
      icon: '🛡️',
      title: 'Priority Processing',
      desc: 'Your orders are always first in line',
    },
    {
      icon: '🔓',
      title: 'Access All Features',
      desc: 'Views, Likes, Followers & more',
    },
    {
      icon: '🎯',
      title: 'Higher Quantities',
      desc: 'Send up to 10,000 per order',
    },
    {
      icon: '💬',
      title: '24/7 Premium Support',
      desc: 'Dedicated support channel on Discord',
    },
  ];

  return (
    <motion.div
      className="modal-overlay"
      onClick={onClose}
      {...fadeIn}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        {...scaleUp}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ maxWidth: '520px' }}
      >
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-icon modal-icon-premium">
          <CrownIcon />
        </div>

        <h2 className="modal-title">
          Upgrade to{' '}
          <span style={{ background: 'linear-gradient(135deg, #eab308, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Premium
          </span>
        </h2>
        <p className="modal-subtitle">
          Unlock the full power of ViralGram with a Premium membership.
        </p>

        <ul className="premium-benefits">
          {benefits.map((b, i) => (
            <motion.li
              key={i}
              className="premium-benefit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: 'easeOut' }}
            >
              <div className="benefit-icon">{b.icon}</div>
              <div>
                <div className="benefit-text">{b.title}</div>
                <div className="benefit-desc">{b.desc}</div>
              </div>
            </motion.li>
          ))}
        </ul>

        <a
          href={DISCORD_SERVER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-submit btn-gold"
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none', color: '#fff' }}
        >
          Buy Now — Contact on Discord ✦
        </a>
      </motion.div>
    </motion.div>
  );
}

// ============================
// LANDING PAGE
// ============================
function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="hero-section">
      {/* Sphere behind heading */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -55%)', zIndex: 0, opacity: 0.5 }}>
        <AnimatedSphere />
      </div>

      <motion.div
        style={{ position: 'relative', zIndex: 1 }}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Now available — No Credit Card Required
          </div>
        </motion.div>

        <motion.h1
          className="hero-heading"
          variants={fadeUp}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          Boost Your Content
          <br />
          <span className="gradient-text">With Real Views</span>
        </motion.h1>

        <motion.p
          className="hero-subheading"
          variants={fadeUp}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          Boost your reach and engagement effortlessly.
          No login required.
        </motion.p>

        <motion.div
          className="hero-cta-group"
          variants={fadeUp}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <button className="btn-primary" onClick={onGetStarted}>
            Get Started Free
            <ArrowRightIcon />
          </button>
          <a
            href={DISCORD_SERVER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ textDecoration: 'none' }}
          >
            <DiscordIcon />
            Join Community
          </a>
        </motion.div>

        <motion.div
          className="hero-stats"
          variants={fadeUp}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
        >
          <div className="hero-stat">
            <div className="hero-stat-value">2M+</div>
            <div className="hero-stat-label">Views Delivered</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">50K+</div>
            <div className="hero-stat-label">Happy Users</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">99.9%</div>
            <div className="hero-stat-label">Uptime</div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================
// DASHBOARD PAGE
// ============================
function DashboardPage({ onBack }: { onBack: () => void }) {
  const [activeModal, setActiveModal] = useState<
    null | 'views' | 'premium-lock' | 'buy-premium' | 'success'
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleViewsSubmit = useCallback(async (link: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setLoading(false);
      setActiveModal('success');
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  }, []);

  const cards = [
    {
      id: 'views',
      icon: <ViewsIcon />,
      iconClass: 'dash-card-icon-views',
      title: 'Insta Views',
      desc: 'Get 500 free views on any Instagram Reel. Fast delivery, no login needed.',
      badge: 'Free',
      badgeClass: 'badge-free',
      glowColor: 'rgba(34, 211, 238, 0.06)',
      action: () => setActiveModal('views'),
    },
    {
      id: 'likes',
      icon: <HeartIcon />,
      iconClass: 'dash-card-icon-likes',
      title: 'Insta Likes',
      desc: 'Boost your post engagement with real Instagram likes.',
      badge: 'Premium',
      badgeClass: 'badge-premium',
      glowColor: 'rgba(236, 72, 153, 0.06)',
      action: () => setActiveModal('premium-lock'),
    },
    {
      id: 'followers',
      icon: <UsersIcon />,
      iconClass: 'dash-card-icon-followers',
      title: 'Insta Followers',
      desc: 'Grow your audience with organic-looking follower boosts.',
      badge: 'Premium',
      badgeClass: 'badge-premium',
      glowColor: 'rgba(168, 85, 247, 0.06)',
      action: () => setActiveModal('premium-lock'),
    },
    {
      id: 'premium',
      icon: <CrownIcon />,
      iconClass: 'dash-card-icon-premium',
      title: 'Buy Premium',
      desc: 'Unlock all features, unlimited usage, and priority delivery.',
      badge: null,
      badgeClass: '',
      glowColor: 'rgba(234, 179, 8, 0.06)',
      action: () => setActiveModal('buy-premium'),
    },
  ];

  return (
    <>
      <section className="dashboard-section">
        <motion.div
          className="dashboard-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h1>
            Welcome to{' '}
            <span className="gradient-text" style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Dashboard
            </span>
          </h1>
          <p>Choose a service below to get started</p>
        </motion.div>

        <motion.div
          className="dashboard-grid"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              className="dash-card"
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onClick={card.action}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className="dash-card-glow"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${card.glowColor}, transparent 50%)`,
                }}
              />

              {card.badge && (
                <span className={`dash-card-badge ${card.badgeClass}`}>
                  {card.badge}
                </span>
              )}

              <div className={`dash-card-icon ${card.iconClass}`}>
                {card.icon}
              </div>

              <h3 className="dash-card-title">{card.title}</h3>
              <p className="dash-card-desc">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Modals */}
      <AnimatePresence mode="wait">
        {activeModal === 'views' && (
          <ViewsModal
            key="views-modal"
            onClose={() => { setActiveModal(null); setError(null); }}
            onSubmit={handleViewsSubmit}
            loading={loading}
            error={error}
          />
        )}
        {activeModal === 'success' && (
          <SuccessModal
            key="success-modal"
            onClose={() => setActiveModal(null)}
          />
        )}
        {activeModal === 'premium-lock' && (
          <PremiumLockModal
            key="lock-modal"
            onClose={() => setActiveModal(null)}
          />
        )}
        {activeModal === 'buy-premium' && (
          <BuyPremiumModal
            key="premium-modal"
            onClose={() => setActiveModal(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ============================
// MAIN APP
// ============================
export default function Home() {
  const [page, setPage] = useState<'landing' | 'dashboard'>('landing');

  return (
    <>
      <AmbientBackground />
      <Navbar
        showBack={page === 'dashboard'}
        onBack={() => setPage('landing')}
      />

      <AnimatePresence mode="wait">
        {page === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
          >
            <LandingPage onGetStarted={() => setPage('dashboard')} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <DashboardPage onBack={() => setPage('landing')} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
