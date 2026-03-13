export interface Company {
  id: string
  name: string
  ticker: string
  sector: string
  logo: string
  status: 'active' | 'watchlist' | 'archived'
  tags: string[]
  metrics: {
    marketCap: string
    peRatio: number
    dividendYield: number
    revenue: string
    revenueGrowth: number
    ebitdaMargin: number
    netMargin: number
    roe: number
    debtToEquity: number
    currentRatio: number
    priceTarget: number
    currentPrice: number
  }
  lastUpdated: string
}

export const companies: Company[] = [
  {
    id: 'itub4',
    name: 'Itaú Unibanco',
    ticker: 'ITUB4',
    sector: 'Financeiro',
    logo: '🏦',
    status: 'active',
    tags: ['Banco', 'Dividendos', 'Blue Chip'],
    metrics: {
      marketCap: 'R$ 310B',
      peRatio: 8.2,
      dividendYield: 6.8,
      revenue: 'R$ 168B',
      revenueGrowth: 12.4,
      ebitdaMargin: 42.1,
      netMargin: 25.3,
      roe: 21.5,
      debtToEquity: 1.8,
      currentRatio: 1.2,
      priceTarget: 38.50,
      currentPrice: 34.20,
    },
    lastUpdated: '2026-03-10',
  },
  {
    id: 'wege3',
    name: 'WEG',
    ticker: 'WEGE3',
    sector: 'Indústria',
    logo: '⚡',
    status: 'active',
    tags: ['Indústria', 'Crescimento', 'Exportação'],
    metrics: {
      marketCap: 'R$ 210B',
      peRatio: 35.4,
      dividendYield: 1.2,
      revenue: 'R$ 36B',
      revenueGrowth: 22.8,
      ebitdaMargin: 24.6,
      netMargin: 16.8,
      roe: 32.4,
      debtToEquity: 0.3,
      currentRatio: 2.8,
      priceTarget: 58.00,
      currentPrice: 52.40,
    },
    lastUpdated: '2026-03-08',
  },
  {
    id: 'vale3',
    name: 'Vale',
    ticker: 'VALE3',
    sector: 'Mineração',
    logo: '⛏️',
    status: 'active',
    tags: ['Commodities', 'Dividendos', 'Exportação'],
    metrics: {
      marketCap: 'R$ 280B',
      peRatio: 5.8,
      dividendYield: 9.2,
      revenue: 'R$ 210B',
      revenueGrowth: -3.2,
      ebitdaMargin: 48.5,
      netMargin: 28.1,
      roe: 28.9,
      debtToEquity: 0.6,
      currentRatio: 1.9,
      priceTarget: 72.00,
      currentPrice: 61.50,
    },
    lastUpdated: '2026-03-12',
  },
  {
    id: 'petr4',
    name: 'Petrobras',
    ticker: 'PETR4',
    sector: 'Energia',
    logo: '🛢️',
    status: 'active',
    tags: ['Energia', 'Dividendos', 'Estatal'],
    metrics: {
      marketCap: 'R$ 480B',
      peRatio: 4.1,
      dividendYield: 12.5,
      revenue: 'R$ 510B',
      revenueGrowth: 5.6,
      ebitdaMargin: 52.3,
      netMargin: 22.7,
      roe: 35.2,
      debtToEquity: 0.8,
      currentRatio: 1.4,
      priceTarget: 42.00,
      currentPrice: 36.80,
    },
    lastUpdated: '2026-03-11',
  },
  {
    id: 'rent3',
    name: 'Localiza',
    ticker: 'RENT3',
    sector: 'Consumo',
    logo: '🚗',
    status: 'watchlist',
    tags: ['Aluguel', 'Crescimento', 'Consumo'],
    metrics: {
      marketCap: 'R$ 48B',
      peRatio: 18.6,
      dividendYield: 2.1,
      revenue: 'R$ 32B',
      revenueGrowth: 18.3,
      ebitdaMargin: 38.2,
      netMargin: 11.4,
      roe: 14.8,
      debtToEquity: 2.4,
      currentRatio: 1.1,
      priceTarget: 52.00,
      currentPrice: 44.30,
    },
    lastUpdated: '2026-03-06',
  },
  {
    id: 'bbas3',
    name: 'Banco do Brasil',
    ticker: 'BBAS3',
    sector: 'Financeiro',
    logo: '🏛️',
    status: 'active',
    tags: ['Banco', 'Dividendos', 'Estatal'],
    metrics: {
      marketCap: 'R$ 165B',
      peRatio: 5.2,
      dividendYield: 8.9,
      revenue: 'R$ 142B',
      revenueGrowth: 9.8,
      ebitdaMargin: 38.7,
      netMargin: 22.1,
      roe: 19.8,
      debtToEquity: 2.1,
      currentRatio: 1.1,
      priceTarget: 32.00,
      currentPrice: 28.50,
    },
    lastUpdated: '2026-03-09',
  },
]

export function getCompanyById(id: string): Company | undefined {
  return companies.find((c) => c.id === id)
}

export function getCompaniesBySector(sector: string): Company[] {
  return companies.filter((c) => c.sector === sector)
}

export function getUniquesSectors(): string[] {
  return [...new Set(companies.map((c) => c.sector))]
}

export function getUniqueTags(): string[] {
  return [...new Set(companies.flatMap((c) => c.tags))]
}
