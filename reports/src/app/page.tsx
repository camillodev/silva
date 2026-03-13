'use client'

import { useState, useMemo } from 'react'
import './globals.css'
import { companies, getUniquesSectors, getUniqueTags } from '@/lib/companies'
import { reports, getReportsByCompany } from '@/lib/reports'
import type { Company } from '@/lib/companies'

function MetricCard({
  label,
  value,
  change,
  prefix,
  index,
}: {
  label: string
  value: string
  change?: number
  prefix?: string
  index: number
}) {
  return (
    <div className={`animate-in stagger-${index + 1}`} style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>
        {prefix}
        {value}
      </div>
      {change !== undefined && (
        <div style={{ ...styles.metricChange, color: change >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
  )
}

function CompanyCard({
  company,
  expanded,
  onToggle,
  index,
}: {
  company: Company
  expanded: boolean
  onToggle: () => void
  index: number
}) {
  const upside = ((company.metrics.priceTarget / company.metrics.currentPrice - 1) * 100).toFixed(1)
  const companyReports = getReportsByCompany(company.id)

  return (
    <div
      className={`animate-in stagger-${(index % 6) + 1}`}
      style={{ ...styles.companyCard, ...(expanded ? styles.companyCardExpanded : {}) }}
      onClick={onToggle}
    >
      <div style={styles.companyHeader}>
        <div style={styles.companyInfo}>
          <span style={styles.companyLogo}>{company.logo}</span>
          <div>
            <div style={styles.companyName}>{company.name}</div>
            <div style={styles.companyTicker}>
              {company.ticker} · {company.sector}
            </div>
          </div>
        </div>
        <div style={styles.companyPrice}>
          <div style={styles.priceValue}>R$ {company.metrics.currentPrice.toFixed(2)}</div>
          <div
            style={{
              ...styles.upside,
              color: Number(upside) >= 0 ? 'var(--green)' : 'var(--red)',
            }}
          >
            {Number(upside) >= 0 ? '+' : ''}
            {upside}% upside
          </div>
        </div>
      </div>

      <div style={styles.tagsRow}>
        {company.tags.map((tag) => (
          <span key={tag} style={styles.tag}>
            {tag}
          </span>
        ))}
        <span
          style={{
            ...styles.statusBadge,
            background: company.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
            color: company.status === 'active' ? 'var(--green)' : 'var(--yellow)',
          }}
        >
          {company.status === 'active' ? 'Ativo' : 'Watchlist'}
        </span>
      </div>

      <div style={styles.metricsGrid}>
        <MiniMetric label="P/E" value={company.metrics.peRatio.toFixed(1)} />
        <MiniMetric label="Div Yield" value={`${company.metrics.dividendYield.toFixed(1)}%`} />
        <MiniMetric label="ROE" value={`${company.metrics.roe.toFixed(1)}%`} />
        <MiniMetric
          label="Cresc. Receita"
          value={`${company.metrics.revenueGrowth > 0 ? '+' : ''}${company.metrics.revenueGrowth.toFixed(1)}%`}
          color={company.metrics.revenueGrowth >= 0 ? 'var(--green)' : 'var(--red)'}
        />
      </div>

      {expanded && (
        <div style={styles.expandedContent}>
          <div style={styles.divider} />
          <div style={styles.expandedGrid}>
            <MiniMetric label="Market Cap" value={company.metrics.marketCap} />
            <MiniMetric label="Receita" value={company.metrics.revenue} />
            <MiniMetric label="Margem EBITDA" value={`${company.metrics.ebitdaMargin.toFixed(1)}%`} />
            <MiniMetric label="Margem Líquida" value={`${company.metrics.netMargin.toFixed(1)}%`} />
            <MiniMetric label="Dívida/PL" value={`${company.metrics.debtToEquity.toFixed(1)}x`} />
            <MiniMetric label="Liquidez Corrente" value={`${company.metrics.currentRatio.toFixed(1)}x`} />
            <MiniMetric label="Preço Alvo" value={`R$ ${company.metrics.priceTarget.toFixed(2)}`} />
            <MiniMetric label="Última Atualização" value={company.lastUpdated} />
          </div>

          {companyReports.length > 0 && (
            <>
              <div style={styles.divider} />
              <div style={styles.reportsTitle}>Relatórios</div>
              {companyReports.map((r) => (
                <div key={r.id} style={styles.reportItem}>
                  <div style={styles.reportItemTitle}>{r.title}</div>
                  <div style={styles.reportItemMeta}>
                    {r.date} · {r.type}
                  </div>
                  <div style={styles.reportItemSummary}>{r.summary}</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MiniMetric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={styles.miniMetric}>
      <div style={styles.miniLabel}>{label}</div>
      <div style={{ ...styles.miniValue, ...(color ? { color } : {}) }}>{value}</div>
    </div>
  )
}

function CompareSection({
  companyA,
  companyB,
}: {
  companyA: Company
  companyB: Company
}) {
  const metrics: { key: keyof Company['metrics']; label: string; suffix?: string; higherBetter: boolean }[] = [
    { key: 'peRatio', label: 'P/E', higherBetter: false },
    { key: 'dividendYield', label: 'Div Yield', suffix: '%', higherBetter: true },
    { key: 'roe', label: 'ROE', suffix: '%', higherBetter: true },
    { key: 'revenueGrowth', label: 'Cresc. Receita', suffix: '%', higherBetter: true },
    { key: 'ebitdaMargin', label: 'Margem EBITDA', suffix: '%', higherBetter: true },
    { key: 'netMargin', label: 'Margem Líquida', suffix: '%', higherBetter: true },
    { key: 'debtToEquity', label: 'Dívida/PL', suffix: 'x', higherBetter: false },
    { key: 'currentRatio', label: 'Liquidez', suffix: 'x', higherBetter: true },
  ]

  return (
    <div style={styles.compareTable}>
      <div style={styles.compareHeader}>
        <div style={styles.compareCompany}>
          {companyA.logo} {companyA.ticker}
        </div>
        <div style={styles.compareLabel}>Métrica</div>
        <div style={styles.compareCompany}>
          {companyB.logo} {companyB.ticker}
        </div>
      </div>
      {metrics.map((m) => {
        const valA = companyA.metrics[m.key] as number
        const valB = companyB.metrics[m.key] as number
        const aWins = m.higherBetter ? valA > valB : valA < valB
        const bWins = m.higherBetter ? valB > valA : valB < valA
        return (
          <div key={m.key} style={styles.compareRow}>
            <div
              style={{
                ...styles.compareValue,
                color: aWins ? 'var(--green)' : bWins ? 'var(--red)' : 'var(--text)',
                fontWeight: aWins ? 600 : 400,
              }}
            >
              {typeof valA === 'number' ? valA.toFixed(1) : valA}
              {m.suffix || ''}
            </div>
            <div style={styles.compareMetricLabel}>{m.label}</div>
            <div
              style={{
                ...styles.compareValue,
                color: bWins ? 'var(--green)' : aWins ? 'var(--red)' : 'var(--text)',
                fontWeight: bWins ? 600 : 400,
              }}
            >
              {typeof valB === 'number' ? valB.toFixed(1) : valB}
              {m.suffix || ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [compareA, setCompareA] = useState(companies[0].id)
  const [compareB, setCompareB] = useState(companies[2].id)

  const sectors = getUniquesSectors()

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.ticker.toLowerCase().includes(search.toLowerCase()) ||
        c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      const matchSector = sectorFilter === 'all' || c.sector === sectorFilter
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchSector && matchStatus
    })
  }, [search, sectorFilter, statusFilter])

  const totalMarketCap = companies.reduce((sum, c) => {
    const num = parseFloat(c.metrics.marketCap.replace(/[^\d.]/g, ''))
    return sum + num
  }, 0)

  const avgDivYield = companies.reduce((sum, c) => sum + c.metrics.dividendYield, 0) / companies.length
  const avgROE = companies.reduce((sum, c) => sum + c.metrics.roe, 0) / companies.length
  const avgPE = companies.reduce((sum, c) => sum + c.metrics.peRatio, 0) / companies.length

  const compA = companies.find((c) => c.id === compareA)!
  const compB = companies.find((c) => c.id === compareB)!

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Reports Dashboard</h1>
          <p style={styles.subtitle}>Análises e relatórios de investimentos</p>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.badge}>{companies.length} empresas</span>
          <span style={styles.badge}>{reports.length} relatórios</span>
        </div>
      </header>

      {/* Metrics */}
      <section style={styles.metricsRow}>
        <MetricCard label="Market Cap Total" value={`${totalMarketCap.toFixed(0)}B`} prefix="R$ " index={0} />
        <MetricCard label="P/E Médio" value={avgPE.toFixed(1)} index={1} />
        <MetricCard label="Div Yield Médio" value={`${avgDivYield.toFixed(1)}%`} change={1.2} index={2} />
        <MetricCard label="ROE Médio" value={`${avgROE.toFixed(1)}%`} change={3.4} index={3} />
      </section>

      {/* Filters */}
      <section style={styles.filtersRow}>
        <input
          type="text"
          placeholder="Buscar empresa, ticker ou tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} style={styles.select}>
          <option value="all">Todos os setores</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="watchlist">Watchlist</option>
        </select>
      </section>

      {/* Company Cards */}
      <section style={styles.companiesGrid}>
        {filtered.map((company, i) => (
          <CompanyCard
            key={company.id}
            company={company}
            expanded={expandedId === company.id}
            onToggle={() => setExpandedId(expandedId === company.id ? null : company.id)}
            index={i}
          />
        ))}
        {filtered.length === 0 && <div style={styles.empty}>Nenhuma empresa encontrada.</div>}
      </section>

      {/* Compare */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Comparação</h2>
        <div style={styles.compareControls}>
          <select value={compareA} onChange={(e) => setCompareA(e.target.value)} style={styles.select}>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ticker} — {c.name}
              </option>
            ))}
          </select>
          <span style={styles.vs}>VS</span>
          <select value={compareB} onChange={(e) => setCompareB(e.target.value)} style={styles.select}>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ticker} — {c.name}
              </option>
            ))}
          </select>
        </div>
        <CompareSection companyA={compA} companyB={compB} />
      </section>

      {/* Recent Reports */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Últimos Relatórios</h2>
        <div style={styles.reportsList}>
          {reports
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((r, i) => {
              const company = companies.find((c) => c.id === r.companyId)
              return (
                <div key={r.id} className={`animate-in stagger-${(i % 6) + 1}`} style={styles.reportCard}>
                  <div style={styles.reportHeader}>
                    <span style={styles.reportType}>{r.type}</span>
                    <span style={styles.reportDate}>{r.date}</span>
                  </div>
                  <div style={styles.reportTitle}>{r.title}</div>
                  <div style={styles.reportSummary}>{r.summary}</div>
                  {company && (
                    <div style={styles.reportCompany}>
                      {company.logo} {company.ticker}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      </section>

      <footer style={styles.footer}>
        <p>Reports Dashboard — Rafael Camillo · {new Date().getFullYear()}</p>
        <p style={styles.footerMuted}>reports.rafaelcamillo.com</p>
      </footer>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '32px 24px',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: 14,
    marginTop: 4,
  },
  headerRight: {
    display: 'flex',
    gap: 8,
  },
  badge: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 32,
  },
  metricCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '20px 24px',
  },
  metricLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 700,
  },
  metricChange: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: 500,
  },
  filtersRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap' as const,
  },
  searchInput: {
    flex: 1,
    minWidth: 200,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 16px',
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
  },
  select: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 16px',
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
  },
  companiesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: 16,
    marginBottom: 48,
  },
  companyCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 20,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  companyCardExpanded: {
    gridColumn: '1 / -1',
  },
  companyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  companyLogo: {
    fontSize: 28,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 600,
  },
  companyTicker: {
    fontSize: 13,
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  companyPrice: {
    textAlign: 'right' as const,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 600,
  },
  upside: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: 500,
  },
  tagsRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap' as const,
    marginBottom: 16,
  },
  tag: {
    background: 'rgba(99,102,241,0.12)',
    color: 'var(--accent-light)',
    borderRadius: 6,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 500,
  },
  statusBadge: {
    borderRadius: 6,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 500,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  miniMetric: {
    textAlign: 'center' as const,
  },
  miniLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    marginBottom: 4,
  },
  miniValue: {
    fontSize: 14,
    fontWeight: 600,
  },
  expandedContent: {
    marginTop: 8,
  },
  expandedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginTop: 16,
  },
  divider: {
    height: 1,
    background: 'var(--border)',
    margin: '16px 0',
  },
  reportsTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
  },
  reportItem: {
    background: 'var(--bg)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  reportItemTitle: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 4,
  },
  reportItemMeta: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginBottom: 6,
  },
  reportItemSummary: {
    fontSize: 12,
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 20,
  },
  compareControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap' as const,
  },
  vs: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--accent)',
  },
  compareTable: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  compareHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
    background: 'rgba(99,102,241,0.06)',
    fontWeight: 600,
    fontSize: 14,
    textAlign: 'center' as const,
  },
  compareCompany: {
    textAlign: 'center' as const,
  },
  compareLabel: {
    textAlign: 'center' as const,
    color: 'var(--text-muted)',
  },
  compareRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    padding: '12px 20px',
    borderBottom: '1px solid var(--border)',
    textAlign: 'center' as const,
    fontSize: 14,
  },
  compareValue: {},
  compareMetricLabel: {
    color: 'var(--text-muted)',
    fontSize: 12,
  },
  reportsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 16,
  },
  reportCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 20,
  },
  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reportType: {
    background: 'rgba(99,102,241,0.12)',
    color: 'var(--accent-light)',
    borderRadius: 6,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 500,
    textTransform: 'uppercase' as const,
  },
  reportDate: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 8,
  },
  reportSummary: {
    fontSize: 13,
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    marginBottom: 10,
  },
  reportCompany: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  empty: {
    gridColumn: '1 / -1',
    textAlign: 'center' as const,
    padding: 48,
    color: 'var(--text-muted)',
    fontSize: 14,
  },
  footer: {
    textAlign: 'center' as const,
    padding: '48px 0 24px',
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  footerMuted: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.5,
  },
}
