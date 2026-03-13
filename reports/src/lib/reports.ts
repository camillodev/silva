export interface Report {
  id: string
  companyId: string
  title: string
  type: 'analysis' | 'quarterly' | 'valuation' | 'sector'
  date: string
  summary: string
  htmlFile: string | null
  author: string
}

export const reports: Report[] = [
  {
    id: 'itub4-q4-2025',
    companyId: 'itub4',
    title: 'Itaú Unibanco — Resultados 4T25',
    type: 'quarterly',
    date: '2026-02-15',
    summary: 'Lucro recorde de R$ 10.8B no trimestre, ROE de 21.5%. Carteira de crédito cresce 14% YoY.',
    htmlFile: null,
    author: 'Rafael Camillo',
  },
  {
    id: 'vale3-analysis-2026',
    companyId: 'vale3',
    title: 'Vale — Análise Completa 2026',
    type: 'analysis',
    date: '2026-03-01',
    summary: 'Minério de ferro em $105/ton. Vale negocia a 3.8x EV/EBITDA, desconto de 25% vs peers globais.',
    htmlFile: null,
    author: 'Rafael Camillo',
  },
  {
    id: 'petr4-valuation-2026',
    companyId: 'petr4',
    title: 'Petrobras — Valuation DCF',
    type: 'valuation',
    date: '2026-03-05',
    summary: 'Preço justo estimado R$ 42.00 (upside 14%). Yield de dividendos projetado 12.5% para 2026.',
    htmlFile: null,
    author: 'Rafael Camillo',
  },
  {
    id: 'wege3-analysis-2026',
    companyId: 'wege3',
    title: 'WEG — Crescimento e Expansão Global',
    type: 'analysis',
    date: '2026-02-20',
    summary: 'Receita internacional já representa 58% do total. Pipeline de energia renovável forte.',
    htmlFile: null,
    author: 'Rafael Camillo',
  },
  {
    id: 'financeiro-sector-2026',
    companyId: 'itub4',
    title: 'Setor Financeiro — Panorama 2026',
    type: 'sector',
    date: '2026-01-28',
    summary: 'Selic em queda favorece bancos. Inadimplência estabilizando. Itaú e BB são top picks.',
    htmlFile: null,
    author: 'Rafael Camillo',
  },
  {
    id: 'bbas3-q4-2025',
    companyId: 'bbas3',
    title: 'Banco do Brasil — Resultados 4T25',
    type: 'quarterly',
    date: '2026-02-12',
    summary: 'Lucro de R$ 9.4B no 4T25. Agronegócio impulsiona carteira. Dividendos de R$ 2.50/ação.',
    htmlFile: null,
    author: 'Rafael Camillo',
  },
]

export function getReportsByCompany(companyId: string): Report[] {
  return reports.filter((r) => r.companyId === companyId)
}

export function getReportsByType(type: Report['type']): Report[] {
  return reports.filter((r) => r.type === type)
}

export function getLatestReports(limit = 5): Report[] {
  return [...reports].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
}
