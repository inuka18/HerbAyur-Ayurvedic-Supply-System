import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import API_BASE from '../../api';

const categories = [
  { name: 'Herbs & Leaves', icon: '🌿' },
  { name: 'Roots & Tubers', icon: '🫚' },
  { name: 'Seeds & Spices', icon: '🌾' },
  { name: 'Flowers',        icon: '🌸' },
  { name: 'Gums & Resins',  icon: '💎' },
  { name: 'Minerals',       icon: '🪨' },
];

function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 30));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return count;
}

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ suppliers: 0, customers: 0, requests: 0 });

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/requests`).then(r => r.json()),
      fetch(`${API_BASE}/auth/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(r => r.json()).catch(() => []),
    ]).then(([requests, users]) => {
      const suppliers = Array.isArray(users) ? users.filter(u => u.role === 'supplier').length : 0;
      const customers = Array.isArray(users) ? users.filter(u => u.role === 'customer').length : 0;
      setStats({ suppliers, customers, requests: Array.isArray(requests) ? requests.length : 0 });
    }).catch(() => {});
  }, []);

  const suppCount = useCountUp(stats.suppliers);
  const custCount = useCountUp(stats.customers);
  const reqCount  = useCountUp(stats.requests);

  return (
    <div className="ayur-home">

      {/* ── HERO ── */}
       <section className="hero-v2">

        <div className="hero-v2-bg">
          <div className="hero-blob hero-blob1" />
          <div className="hero-blob hero-blob2" />
        </div>

        <div className="hero-v2-inner">

          {/* LEFT */}
          
          <div className="hero-v2-left">
             {/* FLOAT CARD */}
            <div className="hero-card-float">
              <div className="hcf-icon">🌿</div>
              <div>
                <div className="hcf-title">Ayurvedic Marketplace</div>
                <div className="hcf-sub">Connecting nature & business</div>
              </div>
            </div>
            <div className="hero-tag">🌱 Sri Lanka's #1 Ayurvedic Platform</div>

            <h1 className="hero-v2-title">
              Source <span className="hero-highlight">Verified</span><br/>
              Ayurvedic Raw<br/>Materials
            </h1>

            <p className="hero-v2-sub">
              Connect directly with trusted suppliers across Sri Lanka. Post requirements, receive offers, and grow your Ayurvedic business.
            </p>

            <div className="hero-v2-actions">
              <button className="hero-btn-primary" onClick={() => navigate('/RequestForm')}>
                📋 Post Requirement
              </button>
              <button className="hero-btn-outline" onClick={() => navigate('/Signup?role=supplier')}>
                🏭 Join as Supplier
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="hero-v2-right">

          

            {/* MAIN IMAGE */}
            <img
              src="/images/HERO.png"
              alt="Ayurvedic raw materials"
              className="hero-main-image"
            />

          </div>
        </div>

        {/* STATS BAR */}
        <div className="hero-stats-bar">
          <div className="hsb-item">
            <span className="hsb-num">{suppCount}+</span>
            <span className="hsb-label">Verified Suppliers</span>
          </div>
          <div className="hsb-divider"/>
          <div className="hsb-item">
            <span className="hsb-num">{custCount}+</span>
            <span className="hsb-label">Active Customers</span>
          </div>
          <div className="hsb-divider"/>
          <div className="hsb-item">
            <span className="hsb-num">{reqCount}+</span>
            <span className="hsb-label">Requirements Posted</span>
          </div>
          <div className="hsb-divider"/>
          <div className="hsb-item">
            <span className="hsb-num">100%</span>
            <span className="hsb-label">Secure Platform</span>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="categories-modern">
        <h2>Find Your Herbs Here</h2>
        <div className="category-grid">
          {categories.map(item => (
            <div key={item.name} className="category-card">
              <div className="category-icon-wrapper">{item.icon}</div>
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works-modern">
        <h2>How It Works</h2>
        <p className="how-subtitle">Simple process connecting customers and suppliers</p>
        <div className="workflow">
          <div className="workflow-column">
            <h3 className="workflow-title">For Customers</h3>
            {[
              ['📝','Post Requirement','Submit material needs'],
              ['📩','Receive Quotes','Suppliers send offers'],
              ['🤝','Select Supplier','Choose best option'],
              ['🚚','Receive Order','Get materials delivered'],
            ].map((step,i) => (
              <div key={i} className="workflow-card">
                <div className="wf-icon">{step[0]}</div>
                <div><h4>{step[1]}</h4><p>{step[2]}</p></div>
              </div>
            ))}
          </div>
          <div className="workflow-divider"/>
          <div className="workflow-column">
            <h3 className="workflow-title">For Suppliers</h3>
            {[
              ['📥','Browse Requests','View requirements'],
              ['💬','Send Quotation','Submit pricing'],
              ['📦','Confirm Supply','Finalize order'],
              ['💰','Get Paid','Secure payments'],
            ].map((step,i) => (
              <div key={i} className="workflow-card">
                <div className="wf-icon">{step[0]}</div>
                <div><h4>{step[1]}</h4><p>{step[2]}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="why-us">
        <h2>Why Choose Our Platform</h2>
        <p className="why-subtitle">Built specifically for efficient raw material sourcing and supplier collaboration</p>
        <div className="why-grid">
          {[
            ['🔍','Verified Supplier Network','All suppliers are reviewed to ensure reliability and quality standards.'],
            ['⚖️','Transparent Quotation System','Compare multiple quotes easily and make informed decisions.'],
            ['⚡','Faster Procurement Process','Reduce time spent sourcing materials with quick supplier responses.'],
            ['🔒','Secure & Reliable','Structured workflow ensures safe communication and transactions.'],
          ].map(([icon,title,desc],i) => (
            <div key={i} className="why-card">
              <div className="why-icon">{icon}</div>
              <h4>{title}</h4>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
