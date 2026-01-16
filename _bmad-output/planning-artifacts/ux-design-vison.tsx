import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Zap, 
  Settings, 
  Bell, 
  Search, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  TrendingUp, 
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  Menu,
  BrainCircuit,
  Share2,
  Lock,
  Network,
  GitPullRequest,
  History,
  Sparkles,
  ArrowLeft,
  Square
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine } from 'recharts';

// --- STYLES GLOBAUX BRUTALIST ---
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
  
  body {
    font-family: 'Space Grotesk', sans-serif;
    background-color: #000;
  }
  
  .brutal-border {
    border: 1px solid #333;
  }
  
  .brutal-border-r {
    border-right: 1px solid #333;
  }
  
  .brutal-border-b {
    border-bottom: 1px solid #333;
  }
  
  .brutal-border-t {
    border-top: 1px solid #333;
  }

  .hover-invert {
    transition: all 0.1s ease-in-out;
  }
  .hover-invert:hover {
    background-color: #fff;
    color: #000;
  }
  
  .hover-accent:hover {
    background-color: #CCFF00; /* Acid Green Wondermake vibe */
    color: #000;
    border-color: #CCFF00;
  }

  /* Scrollbar custom strict */
  ::-webkit-scrollbar {
    width: 12px;
    background: #000;
    border-left: 1px solid #333;
  }
  ::-webkit-scrollbar-thumb {
    background: #333;
    border: 1px solid #000;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #fff;
  }
`;

// --- DONNÉES ---

const REVENUE_DATA = [
  { name: 'Lun', value: 4000 },
  { name: 'Mar', value: 3000 },
  { name: 'Mer', value: 5000 },
  { name: 'Jeu', value: 2780 },
  { name: 'Ven', value: 1890 },
  { name: 'Sam', value: 6390 },
  { name: 'Dim', value: 7490 },
];

const FUNNEL_DATA = [
  { step: 'VISITE', count: 12000, drop: 0 },
  { step: 'PANIER', count: 4500, drop: 62 },
  { step: 'CHECKOUT', count: 1800, drop: 60 },
  { step: 'PAIEMENT', count: 1200, drop: 33 },
  { step: 'SUCCÈS', count: 1150, drop: 4 },
];

const PROFIT_OPPORTUNITIES = [
  {
    id: 1,
    title: "AFFICHAGE TARDIF FRAIS",
    category: "FRICTION",
    impact: "HIGH",
    uplift: "+12%",
    revenue: "2,400€",
    confidence: 98,
    networkCount: 840,
    status: "new",
    description: "Les frais de port affichés uniquement à la fin du checkout causent un drop significatif."
  },
  {
    id: 2,
    title: "UPSELL 'COMPLÉMENTS'",
    category: "PANIER MOYEN",
    impact: "MEDIUM",
    uplift: "+5%",
    revenue: "850€",
    confidence: 82,
    networkCount: 320,
    status: "new",
    description: "Proposer un produit complémentaire en un clic au panier augmente l'AOV."
  },
  {
    id: 3,
    title: "GUEST CHECKOUT",
    category: "CONVERSION",
    impact: "HIGH",
    uplift: "+15%",
    revenue: "3,100€",
    confidence: 99,
    networkCount: 1250,
    status: "active",
    description: "Suppression de l'obligation de compte pour commander."
  }
];

// --- UI COMPONENTS (RADIUS 0) ---

const Card = ({ children, className = "", onClick, noBorder = false }) => (
  <div 
    onClick={onClick}
    className={`${!noBorder ? 'brutal-border' : ''} bg-black ${onClick ? 'cursor-pointer hover:bg-[#111]' : ''} ${className}`}
  >
    {children}
  </div>
);

const Badge = ({ children, variant = "neutral", className = "" }) => {
  const styles = {
    neutral: "bg-[#111] text-gray-400 border border-[#333]",
    primary: "bg-[#CCFF00] text-black border border-[#CCFF00]", // Acid Green solid
    collective: "bg-[#fff] text-black border border-white", // White solid
    success: "bg-[#00FF94] text-black border border-[#00FF94]",
    warning: "bg-[#FF3366] text-white border border-[#FF3366]",
  };
  return (
    <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Button = ({ children, variant = "primary", onClick, className = "", disabled = false }) => {
  const styles = {
    primary: "bg-[#fff] text-black border border-white hover:bg-[#CCFF00] hover:border-[#CCFF00]",
    collective: "bg-[#CCFF00] text-black border border-[#CCFF00] hover:bg-white hover:border-white",
    secondary: "bg-black text-white border border-[#333] hover:bg-white hover:text-black hover:border-white",
    outline: "bg-transparent border border-[#333] text-gray-400 hover:border-white hover:text-white",
    ghost: "bg-transparent text-gray-500 hover:text-white",
  };
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors duration-100 flex items-center justify-center gap-3 ${styles[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

// --- WIDGETS ---

const MetricCard = ({ title, value, trend, isPositive, icon: Icon }) => (
  <div className="p-6 brutal-border bg-black group hover:bg-[#111] transition-colors relative">
    <div className="flex justify-between items-start mb-8">
      <span className="text-gray-500 text-xs font-mono uppercase tracking-widest">{title}</span>
      <Icon size={16} className="text-gray-600 group-hover:text-white transition-colors" />
    </div>
    
    <div className="flex items-end justify-between">
      <p className="text-4xl font-light text-white tracking-tighter">{value}</p>
      <div className={`text-xs font-bold px-1 py-0.5 ${isPositive ? 'bg-[#00FF94] text-black' : 'bg-[#FF3366] text-white'}`}>
        {trend}
      </div>
    </div>
    
    {/* Corner accent on hover */}
    <div className="absolute top-0 right-0 w-0 h-0 border-t-[8px] border-r-[8px] border-t-transparent border-r-transparent group-hover:border-r-[#CCFF00] transition-all duration-200" />
  </div>
);

const CollectiveBrainWidget = () => (
  <div className="brutal-border p-0 mb-8 bg-black">
    <div className="flex flex-col md:flex-row items-stretch">
      <div className="p-6 flex items-center gap-6 flex-1 bg-[#050505]">
        <div className="h-12 w-12 bg-white flex items-center justify-center shrink-0">
          <BrainCircuit size={24} className="text-black" />
        </div>
        <div>
          <h4 className="text-white text-lg font-bold uppercase tracking-wide flex items-center gap-3">
            Cerveau Collectif
            <span className="h-2 w-2 bg-[#CCFF00] animate-pulse" />
          </h4>
          <p className="text-gray-500 text-xs mt-1 font-mono">
            SYNC: 1,240 NODES • STATUS: ONLINE
          </p>
        </div>
      </div>
      
      <div className="flex border-t md:border-t-0 md:border-l border-[#333]">
        <div className="px-8 py-4 flex flex-col justify-center items-center border-r border-[#333] hover:bg-[#111] transition-colors">
            <Lock size={16} className="text-gray-500 mb-2" />
            <span className="text-[10px] text-gray-400 uppercase font-bold">Anonymisé</span>
        </div>
        <div className="px-8 py-4 flex flex-col justify-center items-center hover:bg-[#111] transition-colors">
            <Share2 size={16} className="text-[#CCFF00] mb-2" />
            <span className="text-[10px] text-[#CCFF00] uppercase font-bold">850 Signaux</span>
        </div>
      </div>
    </div>
  </div>
);

const RecommendationCard = ({ item, onClick }) => (
  <div 
    onClick={onClick}
    className="brutal-border bg-black hover:bg-[#0A0A0A] transition-colors cursor-pointer group flex flex-col h-full relative"
  >
    {/* Active strip */}
    {item.status === 'new' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#CCFF00]" />}
    
    <div className="p-6 flex-1">
      <div className="flex justify-between items-start mb-6">
        <Badge variant={item.status === 'active' ? 'success' : 'collective'}>
          {item.status === 'active' ? 'ACTIF' : `VALIDÉ PAR ${item.networkCount}`}
        </Badge>
        <span className="font-mono text-[10px] text-gray-600">{item.category}</span>
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-4 leading-tight group-hover:underline decoration-[#CCFF00] decoration-2 underline-offset-4">
        {item.title}
      </h3>
      <p className="text-gray-400 text-sm leading-relaxed font-mono">
        {item.description}
      </p>
    </div>
    
    <div className="border-t border-[#333] grid grid-cols-2 divide-x divide-[#333]">
      <div className="p-4 text-center group-hover:bg-[#fff] group-hover:text-black transition-colors">
        <p className="text-[9px] uppercase font-bold tracking-widest opacity-60 mb-1">Uplift</p>
        <p className="text-xl font-bold">{item.uplift}</p>
      </div>
      <div className="p-4 text-center group-hover:bg-[#CCFF00] group-hover:text-black transition-colors">
        <p className="text-[9px] uppercase font-bold tracking-widest opacity-60 mb-1">Gain</p>
        <p className="text-xl font-bold">{item.revenue}</p>
      </div>
    </div>
  </div>
);

const ProfitEngineDetail = ({ item, onBack, onApprove }) => {
  const [approving, setApproving] = useState(false);

  const handleApprove = () => {
    setApproving(true);
    setTimeout(() => {
      onApprove(item.id);
    }, 2000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300">
      <button onClick={onBack} className="flex items-center gap-3 text-gray-500 hover:text-white mb-8 transition-colors uppercase text-xs font-bold tracking-widest">
        <ArrowLeft size={14} />
        Retour
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-t border-l border-[#333]">
        {/* Main Context */}
        <div className="lg:col-span-8 p-8 brutal-border-r brutal-border-b bg-black relative">
          <div className="absolute top-0 right-0 p-4 border-l border-b border-[#333] bg-[#050505]">
             <span className="text-3xl font-bold text-[#CCFF00]">{item.confidence}%</span>
             <p className="text-[9px] uppercase text-gray-500 text-right mt-1">Confiance</p>
          </div>

          <h1 className="text-5xl font-bold text-white mb-6 uppercase tracking-tight max-w-2xl leading-[0.9]">
            {item.title}
          </h1>
          <p className="text-lg text-gray-400 font-mono mb-12 border-l-2 border-[#333] pl-6 max-w-xl">
            {item.description}
          </p>

          {/* Proof Visualization - Brutalist */}
          <div className="brutal-border bg-[#050505] p-0 mb-8">
            <div className="border-b border-[#333] px-6 py-3 flex items-center gap-3">
              <BrainCircuit size={16} className="text-white" />
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Preuve Collective</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#333]">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase">Analyse Locale</p>
                    <Badge variant="warning">Incertain</Badge>
                </div>
                <div className="h-16 flex items-end gap-1">
                    <div className="w-full bg-[#111] h-full relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-full h-[20%] bg-[#333] pattern-diagonal-lines" />
                    </div>
                </div>
                <p className="text-[10px] text-gray-500 font-mono mt-3">
                  DATA INSUFFISANTE POUR VALIDATION LOCALE.
                </p>
              </div>

              <div className="p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#CCFF00] opacity-5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex justify-between items-center mb-4">
                    <p className="text-xs font-bold text-white uppercase">Réseau Neural</p>
                    <Badge variant="collective">VALIDÉ</Badge>
                </div>
                
                <div className="flex items-end gap-4 mt-6">
                   <div>
                      <p className="text-4xl font-bold text-white">{item.uplift}</p>
                      <p className="text-[9px] text-gray-500 uppercase font-mono">Conversion</p>
                   </div>
                   <div className="h-8 w-[1px] bg-[#333]" />
                   <div>
                      <p className="text-4xl font-bold text-white">{item.networkCount}</p>
                      <p className="text-[9px] text-gray-500 uppercase font-mono">Boutiques</p>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Guardrails */}
          <div className="flex items-start gap-4 p-4 border border-[#333] border-dashed bg-[#111]">
             <ShieldCheck className="text-[#00FF94] shrink-0 mt-1" size={20} />
             <div>
                <h4 className="text-white text-sm font-bold uppercase mb-1">
                  Profit Guardrails™ <span className="text-[#00FF94]">ACTIF</span>
                </h4>
                <p className="text-gray-400 text-xs font-mono leading-relaxed">
                  SURVEILLANCE CONTINUE. SI DÉVIATION {'>'} 5% DÉTECTÉE, 
                  ROLLBACK AUTOMATIQUE IMMÉDIAT.
                </p>
             </div>
          </div>
        </div>

        {/* Right Column: Action Panel */}
        <div className="lg:col-span-4 p-8 brutal-border-r brutal-border-b bg-[#050505] flex flex-col">
           <div className="mb-auto">
              <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-4">Impact Projeté</p>
              <div className="text-6xl font-bold text-white tracking-tighter mb-2">{item.revenue}</div>
              <p className="text-gray-400 text-xs font-mono">/ MOIS (ESTIMATION IA)</p>
           </div>

           <div className="border-t border-b border-[#333] py-6 my-8 space-y-3">
              <div className="flex justify-between text-xs font-mono">
                 <span className="text-gray-500 uppercase">Complexité</span>
                 <span className="text-white">AUTO (0 DEV)</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                 <span className="text-gray-500 uppercase">Rollback</span>
                 <span className="text-[#00FF94]">AUTOMATIQUE</span>
              </div>
           </div>

           <Button 
             variant="collective" 
             className="w-full h-16 text-sm" 
             onClick={handleApprove}
             disabled={approving}
           >
             {approving ? (
                "DÉPLOIEMENT EN COURS..."
             ) : (
                "ACTIVER L'OPTIMISATION"
             )}
           </Button>
           <p className="text-center text-[9px] text-gray-600 uppercase font-mono mt-4 tracking-widest">
              VIA TRAFI CHANGESET™ v2.1
           </p>
        </div>
      </div>
    </div>
  );
};

// --- PAGES ---

const DashboardHome = ({ onSelectOpportunity }) => (
  <div className="space-y-0">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-t border-[#333]">
      <div className="brutal-border-r brutal-border-b">
        <MetricCard title="REVENU TOTAL" value="42,350 €" trend="+14.2%" isPositive={true} icon={TrendingUp} />
      </div>
      <div className="brutal-border-r brutal-border-b">
        <MetricCard title="COMMANDES" value="1,245" trend="+5.4%" isPositive={true} icon={Package} />
      </div>
      <div className="brutal-border-r brutal-border-b">
        <MetricCard title="CONVERSION" value="2.1%" trend="-0.4%" isPositive={false} icon={Activity} />
      </div>
      <div className="brutal-border-r brutal-border-b">
        <MetricCard title="VISITEURS" value="84.3k" trend="+8.1%" isPositive={true} icon={Users} />
      </div>
    </div>

    {/* Featured Opportunity Banner */}
    <div className="mt-8 brutal-border bg-[#0A0A0A] p-0 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-full bg-[#CCFF00] transform skew-x-[-20deg] translate-x-16 group-hover:translate-x-8 transition-transform duration-500" />
        
        <div className="p-8 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex items-start gap-6">
                <div className="h-16 w-16 bg-white flex items-center justify-center shrink-0 border border-white">
                    <Sparkles size={32} className="text-black" />
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Badge variant="collective">OPPORTUNITÉ #1</Badge>
                        <span className="text-[10px] text-gray-500 font-mono uppercase">Détecté il y a 2h</span>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2 uppercase tracking-tight">Affichage tardif des frais</h3>
                    <p className="text-gray-400 max-w-lg font-mono text-sm">Le réseau a détecté un drop de 42% au shipping. Gain estimé de <span className="text-[#CCFF00]">+2,400€</span>.</p>
                </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
                <Button variant="outline" className="flex-1 md:flex-none">IGNORER</Button>
                <Button variant="primary" onClick={() => onSelectOpportunity(PROFIT_OPPORTUNITIES[0])} className="flex-1 md:flex-none">
                    EXAMINER
                </Button>
            </div>
        </div>
    </div>

    {/* Charts Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 mt-8 border-l border-t border-[#333]">
      <div className="lg:col-span-2 p-8 brutal-border-r brutal-border-b bg-black">
        <div className="flex justify-between items-center mb-8">
           <h3 className="text-sm font-bold text-white uppercase tracking-widest">Revenus</h3>
           <span className="text-xs font-mono text-gray-500 border border-[#333] px-2 py-1">30 JOURS</span>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={REVENUE_DATA}>
              <CartesianGrid strokeDasharray="0" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="name" stroke="#333" tick={{fontSize: 10, fill: '#666', fontFamily: 'monospace'}} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#333" tick={{fontSize: 10, fill: '#666', fontFamily: 'monospace'}} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} />
              <Tooltip 
                contentStyle={{backgroundColor: '#000', border: '1px solid #fff', color: '#fff', borderRadius: '0px'}} 
                itemStyle={{color: '#fff', fontFamily: 'monospace'}}
                cursor={{stroke: '#333', strokeWidth: 1}}
              />
              <Area type="step" dataKey="value" stroke="#fff" strokeWidth={2} fillOpacity={0.1} fill="#fff" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-8 brutal-border-r brutal-border-b bg-black">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Funnel</h3>
          <Badge variant="success">STABLE</Badge>
        </div>
        <div className="space-y-6">
          {FUNNEL_DATA.map((step, idx) => (
            <div key={idx} className="relative group cursor-default">
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-gray-400 group-hover:text-white transition-colors uppercase">{step.step}</span>
                <span className="text-white font-bold">{step.count.toLocaleString()}</span>
              </div>
              <div className="h-4 w-full border border-[#333] p-[2px]">
                <div 
                  className="h-full bg-[#333] group-hover:bg-[#fff] transition-all duration-0" 
                  style={{ width: `${(step.count / 12000) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// --- APP SHELL ---

const SidebarItem = ({ icon: Icon, label, active, onClick, hasNotification }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-4 text-xs font-bold uppercase tracking-widest transition-all duration-100 border-b border-[#333] hover:bg-white hover:text-black group
      ${active 
        ? 'bg-white text-black' 
        : 'text-gray-500 bg-black'
      }`}
  >
    <div className="flex items-center gap-4">
      <Icon size={18} />
      <span>{label}</span>
    </div>
    {hasNotification && (
      <div className={`h-2 w-2 bg-[#CCFF00] group-hover:bg-black`} />
    )}
  </button>
);

export default function TrafiApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setSelectedOpportunity(null);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-[#CCFF00] selection:text-black overflow-hidden flex">
      <style>{globalStyles}</style>
      
      {/* Sidebar - Fixed Brutalist Panel */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-black border-r border-[#333] transform transition-transform duration-0 lg:relative lg:translate-x-0 flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-20 flex items-center gap-4 px-6 border-b border-[#333]">
          <div className="h-8 w-8 bg-white flex items-center justify-center text-black font-bold text-lg">T</div>
          <span className="font-bold text-2xl tracking-tighter text-white uppercase">trafi</span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div>
            <div className="px-6 py-4 border-b border-[#333] bg-[#050505]">
                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Navigation</span>
            </div>
            <SidebarItem icon={LayoutDashboard} label="Vue d'ensemble" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={Zap} label="Profit Engine" active={activeTab === 'profit'} onClick={() => setActiveTab('profit')} hasNotification={true} />
            <SidebarItem icon={ShoppingCart} label="Commandes" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
            <SidebarItem icon={Package} label="Catalogue" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
          </div>

          <div className="mt-8 border-t border-[#333]">
             <div className="p-6 bg-[#050505]">
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-2 w-2 bg-[#00FF94] animate-pulse" />
                   <span className="text-[10px] font-bold text-white uppercase tracking-wider">Status Réseau</span>
                </div>
                <p className="text-[10px] text-gray-500 font-mono leading-relaxed uppercase">
                   SYNC ACTIVE<br/>NODE: MAISON-CLEO
                </p>
             </div>
          </div>
        </div>
        
        <div className="p-0 border-t border-[#333]">
          <div className="flex items-center gap-4 p-6 hover:bg-[#111] cursor-pointer transition-colors">
            <div className="h-8 w-8 bg-[#333] flex items-center justify-center text-xs font-bold text-white">SM</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white uppercase tracking-wider truncate">Sophie M.</p>
              <p className="text-[10px] text-gray-500 font-mono truncate">MAISON CLEO</p>
            </div>
            <Settings size={16} className="text-gray-500" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative z-10 bg-black">
        {/* Topbar */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-[#333] bg-black sticky top-0 z-30">
          <div className="flex items-center gap-4">
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-white">
                <Menu />
             </button>
             <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                Maison Cleo <span className="mx-2 text-[#333]">/</span> <span className="text-white">{activeTab}</span>
             </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block group">
              <Search size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="SEARCH (CMD+K)" 
                className="bg-transparent border-b border-[#333] pl-6 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-white w-64 transition-all placeholder:text-gray-700"
              />
            </div>
            <button className="relative p-2 hover:bg-[#111] transition-colors">
              <Bell size={18} className="text-white" />
              <div className="absolute top-2 right-2 h-1.5 w-1.5 bg-[#CCFF00]" />
            </button>
          </div>
        </header>

        <div className="p-8 pb-32 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
             <DashboardHome onSelectOpportunity={(opp) => {
                setActiveTab('profit');
                setSelectedOpportunity(opp);
             }} />
          )}
          
          {activeTab === 'profit' && (
            !selectedOpportunity ? (
              <div className="animate-in fade-in duration-500">
                <CollectiveBrainWidget />
                
                <div className="flex items-end justify-between mb-8 mt-12 border-b border-[#333] pb-4">
                    <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Opportunités</h3>
                    <div className="text-xs font-mono text-gray-500">3 DÉTECTÉES</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-[#333]">
                   {PROFIT_OPPORTUNITIES.filter(i => i.status === 'new').map(item => (
                      <div className="brutal-border-r brutal-border-b" key={item.id}>
                          <RecommendationCard item={item} onClick={() => setSelectedOpportunity(item)} />
                      </div>
                   ))}
                </div>

                <div className="mt-16 opacity-60 hover:opacity-100 transition-opacity">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Historique</h3>
                    <div className="brutal-border bg-black p-4 flex items-center justify-between group hover:bg-[#111]">
                        <div className="flex items-center gap-4">
                            <History size={16} className="text-gray-500"/>
                            <div>
                                <h4 className="text-white font-bold uppercase text-sm">Guest Checkout</h4>
                                <p className="text-[10px] text-gray-500 font-mono uppercase">Activé le 12 Janv.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <span className="text-xs font-bold text-[#00FF94]">+15% UPLIFT</span>
                             <Badge variant="success">SUCCÈS</Badge>
                        </div>
                    </div>
                </div>
              </div>
            ) : (
              <ProfitEngineDetail 
                item={selectedOpportunity} 
                onBack={() => setSelectedOpportunity(null)}
                onApprove={(id) => setSelectedOpportunity(null)}
              />
            )
          )}

          {['orders', 'products', 'customers', 'settings'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center border border-[#333] border-dashed">
              <div className="h-16 w-16 bg-[#111] flex items-center justify-center mb-6">
                 <Package size={32} className="text-white" />
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-white uppercase tracking-tight mb-2">{activeTab}</h2>
                 <p className="text-xs text-gray-500 font-mono uppercase">Section en construction</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}