'use client';

import {
  TrendingUp,
  Package,
  Activity,
  Users,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// --- MOCK DATA ---
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

// --- COMPONENTS ---

const MetricCard = ({
  title,
  value,
  trend,
  isPositive,
  icon: Icon,
}: {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: any;
}) => (
  <div className="p-6 brutal-border bg-card group hover:bg-muted/5 transition-colors relative h-full">
    <div className="flex justify-between items-start mb-8">
      <span className="text-muted-foreground text-xs font-mono uppercase tracking-widest">
        {title}
      </span>
      <Icon
        size={16}
        className="text-muted-foreground group-hover:text-foreground transition-colors"
      />
    </div>

    <div className="flex items-end justify-between">
      <p className="text-4xl font-light text-foreground tracking-tighter">
        {value}
      </p>
      <div
        className={cn(
          'text-xs font-bold px-1 py-0.5',
          isPositive ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
        )}
      >
        {trend}
      </div>
    </div>

    {/* Corner accent on hover */}
    <div className="absolute top-0 right-0 w-0 h-0 border-t-[8px] border-r-[8px] border-t-transparent border-r-transparent group-hover:border-r-primary transition-all duration-200" />
  </div>
);

const Badge = ({
  children,
  variant = 'neutral',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'neutral' | 'primary' | 'collective' | 'success' | 'warning';
  className?: string;
}) => {
  const styles = {
    neutral: 'bg-muted text-muted-foreground border border-border',
    primary: 'bg-primary text-primary-foreground border border-primary',
    collective: 'bg-foreground text-background border border-foreground',
    success: 'bg-success text-success-foreground border border-success',
    warning: 'bg-warning text-warning-foreground border border-warning',
  };
  return (
    <span
      className={cn(
        'px-2 py-1 text-[10px] uppercase font-bold tracking-wider',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default function DashboardHome() {
  return (
    <div className="space-y-0">
      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-t border-border">
        <div className="brutal-border-r brutal-border-b">
          <MetricCard
            title="REVENU TOTAL"
            value="42,350 €"
            trend="+14.2%"
            isPositive={true}
            icon={TrendingUp}
          />
        </div>
        <div className="brutal-border-r brutal-border-b">
          <MetricCard
            title="COMMANDES"
            value="1,245"
            trend="+5.4%"
            isPositive={true}
            icon={Package}
          />
        </div>
        <div className="brutal-border-r brutal-border-b">
          <MetricCard
            title="CONVERSION"
            value="2.1%"
            trend="-0.4%"
            isPositive={false}
            icon={Activity}
          />
        </div>
        <div className="brutal-border-r brutal-border-b">
          <MetricCard
            title="VISITEURS"
            value="84.3k"
            trend="+8.1%"
            isPositive={true}
            icon={Users}
          />
        </div>
      </div>

      {/* Featured Opportunity Banner */}
      <div className="mt-8 brutal-border bg-card p-0 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-full bg-primary transform skew-x-[-20deg] translate-x-16 group-hover:translate-x-8 transition-transform duration-500 opacity-20 dark:opacity-100" />

        <div className="p-8 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-start gap-6">
            <div className="h-16 w-16 bg-background flex items-center justify-center shrink-0 border border-border">
              <Sparkles size={32} className="text-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="collective">OPPORTUNITÉ #1</Badge>
                <span className="text-[10px] text-muted-foreground font-mono uppercase">
                  Détecté il y a 2h
                </span>
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2 uppercase tracking-tight">
                Affichage tardif des frais
              </h3>
              <p className="text-muted-foreground max-w-lg font-mono text-sm">
                Le réseau a détecté un drop de 42% au shipping. Gain estimé de{' '}
                <span className="text-primary font-bold">+2,400€</span>.
              </p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none">
              IGNORER
            </Button>
            <Button variant="default" className="flex-1 md:flex-none">
              EXAMINER
            </Button>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 mt-8 border-l border-t border-border">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 p-8 brutal-border-r brutal-border-b bg-card">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
              Revenus
            </h3>
            <span className="text-xs font-mono text-muted-foreground border border-border px-2 py-1">
              30 JOURS
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA}>
                <CartesianGrid
                  strokeDasharray="0"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--muted-foreground)"
                  tick={{
                    fontSize: 10,
                    fill: 'var(--muted-foreground)',
                    fontFamily: 'monospace',
                  }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  tick={{
                    fontSize: 10,
                    fill: 'var(--muted-foreground)',
                    fontFamily: 'monospace',
                  }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}€`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--popover)',
                    borderColor: 'var(--border)',
                    color: 'var(--popover-foreground)',
                    borderRadius: '0px',
                    fontFamily: 'monospace',
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
                  cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                />
                <Area
                  type="step"
                  dataKey="value"
                  stroke="var(--foreground)"
                  strokeWidth={2}
                  fillOpacity={0.1}
                  fill="var(--foreground)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel Widget */}
        <div className="p-8 brutal-border-r brutal-border-b bg-card">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
              Funnel
            </h3>
            <Badge variant="success">STABLE</Badge>
          </div>
          <div className="space-y-6">
            {FUNNEL_DATA.map((step, idx) => (
              <div key={idx} className="relative group cursor-default">
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors uppercase">
                    {step.step}
                  </span>
                  <span className="text-foreground font-bold">
                    {step.count.toLocaleString()}
                  </span>
                </div>
                <div className="h-4 w-full border border-border p-[2px]">
                  <div
                    className="h-full bg-muted-foreground/30 group-hover:bg-foreground transition-all duration-0"
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
}