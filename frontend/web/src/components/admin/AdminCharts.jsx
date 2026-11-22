import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatFCFA } from '../../lib/format';

const RED = '#780000';
const RED2 = '#9E2A2B';
const INK = '#121212';
const GREY = '#E5E5E5';

const tooltipStyle = {
  borderRadius: 5,
  border: 'none',
  fontSize: 11,
  fontFamily: 'DM Sans',
  boxShadow: '0 8px 30px rgba(18,18,18,0.12)',
};

/** Courbe d'évolution CA / inscriptions (lazy-loaded via React.lazy). */
export function EvolutionChart({ period = '30j' }) {
  const data = period === '7j'
    ? [
        { d: 'Lun', ca: 420000, users: 12 }, { d: 'Mar', ca: 510000, users: 18 },
        { d: 'Mer', ca: 470000, users: 15 }, { d: 'Jeu', ca: 690000, users: 24 },
        { d: 'Ven', ca: 810000, users: 31 }, { d: 'Sam', ca: 940000, users: 28 },
        { d: 'Dim', ca: 720000, users: 22 },
      ]
    : Array.from({ length: 12 }, (_, i) => ({
        d: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'][i],
        ca: 300000 + i * 95000 + (i % 3) * 60000,
        users: 20 + i * 7 + (i % 4) * 5,
      }));

  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={RED} stopOpacity={0.35} />
            <stop offset="100%" stopColor={RED} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GREY} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="d" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} width={46}
          tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => n === 'ca' ? formatFCFA(v) : `${v} inscriptions`} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="ca" name="CA (FCFA)" stroke={RED} fill="url(#caGrad)" strokeWidth={2.5} />
        <Area type="monotone" dataKey="users" name="Inscriptions" stroke={RED2} fill="transparent" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Histogramme comparatif B2C vs C2C. */
export function SalesChart() {
  const data = [
    { m: 'Juin', b2c: 12, c2c: 8 }, { m: 'Juil', b2c: 18, c2c: 11 },
    { m: 'Août', b2c: 15, c2c: 14 }, { m: 'Sep', b2c: 24, c2c: 17 },
    { m: 'Oct', b2c: 28, c2c: 21 }, { m: 'Nov', b2c: 33, c2c: 26 },
  ];
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid stroke={GREY} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} width={28} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="b2c" name="Boutiques Pro (B2C)" fill={RED} radius={[5, 5, 0, 0]} />
        <Bar dataKey="c2c" name="Troc (C2C)" fill={INK} radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Donut — répartition des statuts Escrow. */
export function EscrowDonut({ stats }) {
  const data = [
    { name: 'Bloqué (held)', value: Number(stats?.fonds_held ?? 15) },
    { name: 'Libéré (released)', value: Number(stats?.fonds_released ?? 30) },
    { name: 'Remboursé', value: Number(stats?.refunded ?? 5) },
  ].filter((d) => d.value > 0);
  const colors = [RED, INK, RED2];
  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
          {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Pyramide de conversion (BarChart horizontal). */
export function FunnelChart() {
  const data = [
    { label: 'Visiteurs', value: 100, fill: GREY },
    { label: 'Particuliers', value: 68, fill: RED2 },
    { label: 'Vendeurs Pro', value: 41, fill: RED },
    { label: 'Transactions finalisées', value: 26, fill: INK },
  ];
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid stroke={GREY} strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 10, fill: '#444' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
        <Bar dataKey="value" radius={[0, 5, 5, 0]}>{data.map((d, i) => <Cell key={i} fill={d.fill} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
