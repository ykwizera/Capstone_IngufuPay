import { useNavigate } from "react-router-dom"
import { Zap, Shield, Smartphone, BarChart2, ArrowRight, Mail, Phone, MessageCircle } from "lucide-react"
import "./Landing.css"

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Token Delivery",
    desc: "Purchase electricity units and have them delivered to your meter within seconds. No delays, no queues.",
  },
  {
    icon: Shield,
    title: "Automatic Cutoff",
    desc: "Your meter automatically cuts power when units run out and restores it the moment you top up.",
  },
  {
    icon: BarChart2,
    title: "Real-Time Monitoring",
    desc: "Track your consumption live. See exactly how much power you are using and how many units remain.",
  },
  {
    icon: Smartphone,
    title: "Manage from Anywhere",
    desc: "Add multiple meters, view transaction history, and receive low balance alerts from any device.",
  },
]

const STEPS = [
  { number: "01", title: "Create an account", desc: "Sign up with your email and verify your identity with a one-time code." },
  { number: "02", title: "Add your meter", desc: "Register your electricity meter using its meter number and connect it to your account." },
  { number: "03", title: "Buy units", desc: "Choose how much you want to spend and complete the purchase in seconds." },
  { number: "04", title: "Power on", desc: "Units are sent directly to your meter. Power is restored automatically." },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing">

      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-icon">IP</div>
            <span>IngufuPay</span>
          </div>
          <div className="landing-nav-actions">
            <button className="landing-btn-ghost" onClick={() => navigate("/login")}>
              Sign in
            </button>
            <button className="landing-btn-primary" onClick={() => navigate("/register")}>
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-badge">Smart electricity management for Rwanda</div>
          <h1 className="landing-headline">
            Control your power.<br />
            <span className="landing-headline-accent">Pay smarter.</span>
          </h1>
          <p className="landing-subheadline">
            IngufuPay connects your prepaid electricity meter to the internet.
            Buy units, monitor consumption, and never get caught off guard by an empty meter again.
          </p>
          <div className="landing-hero-actions">
            <button className="landing-btn-primary landing-btn-lg" onClick={() => navigate("/register")}>
              Create free account <ArrowRight size={16} />
            </button>
            <button className="landing-btn-ghost landing-btn-lg" onClick={() => navigate("/login")}>
              Sign in
            </button>
          </div>
        </div>
        <div className="landing-hero-visual">
          <div className="hero-card">
            <div className="hero-card-label">Remaining Units</div>
            <div className="hero-card-value">18.420</div>
            <div className="hero-card-sub">kWh available</div>
            <div className="hero-card-bar">
              <div className="hero-card-bar-fill" style={{ width: "72%" }} />
            </div>
            <div className="hero-card-meta">
              <span>Low balance at 5 kWh</span>
              <span className="hero-card-status">Active</span>
            </div>
          </div>
          <div className="hero-card hero-card-sm hero-card-offset">
            <div className="hero-card-label">Last purchase</div>
            <div className="hero-card-value-sm">2,000 RWF</div>
            <div className="hero-card-sub">10.000 units added</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section" id="features">
        <div className="landing-section-inner">
          <div className="landing-section-label">Features</div>
          <h2 className="landing-section-title">Everything you need to manage your electricity</h2>
          <div className="landing-features">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="landing-feature-card">
                  <div className="landing-feature-icon">
                    <Icon size={20} />
                  </div>
                  <div className="landing-feature-title">{f.title}</div>
                  <div className="landing-feature-desc">{f.desc}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section landing-section-alt" id="how">
        <div className="landing-section-inner">
          <div className="landing-section-label">How it works</div>
          <h2 className="landing-section-title">Up and running in minutes</h2>
          <div className="landing-steps">
            {STEPS.map((s, i) => (
              <div key={i} className="landing-step">
                <div className="landing-step-number">{s.number}</div>
                <div className="landing-step-title">{s.title}</div>
                <div className="landing-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <h2 className="landing-cta-title">Ready to take control of your electricity?</h2>
          <p className="landing-cta-sub">Join IngufuPay and never worry about an empty meter again.</p>
          <button className="landing-btn-primary landing-btn-lg" onClick={() => navigate("/register")}>
            Get started for free <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-logo">
              <div className="landing-logo-icon">IP</div>
              <span>IngufuPay</span>
            </div>
            <p className="landing-footer-desc">
              Smart prepaid electricity management for Rwanda. Built to give you control over your power.
            </p>
          </div>
          <div className="landing-footer-contact">
            <div className="landing-footer-contact-title">Contact</div>
            <div className="landing-footer-contact-item">
              <Mail size={14} /> y.kwizera@alustudent.com
            </div>
            <div className="landing-footer-contact-item">
              <Phone size={14} /> +250 784 494 644
            </div>
            <div className="landing-footer-contact-item">
              <MessageCircle size={14} /> WhatsApp: +250 784 494 644
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
  <span>2026 IngufuPay. Capstone project — African Leadership University.</span>
  <div className="landing-footer-links">
    <button className="landing-btn-ghost landing-btn-sm" onClick={() => navigate("/terms")}>Terms &amp; Conditions</button>
    <button className="landing-btn-ghost landing-btn-sm" onClick={() => navigate("/login")}>Sign in</button>
    <button className="landing-btn-ghost landing-btn-sm" onClick={() => navigate("/register")}>Register</button>
  </div>
</div>
      </footer>

    </div>
  )
}