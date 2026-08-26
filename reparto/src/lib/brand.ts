/** Marca A la PaR — P + R de los creadores */
export const BRAND = {
  name: 'A la PaR',
  shortName: 'A la PaR',
  tagline: 'Gastos compartidos, en equilibrio',
  appId: 'a-la-par' as const,
  legacyAppId: 'reparto' as const,
  colors: {
    teal: '#008080',
    tealDeep: '#006666',
    coral: '#FF7F50',
    coralDeep: '#E86A3C',
    orange: '#FFA500',
    green: '#3CB371',
    navy: '#0B1F2A',
    ink: '#14242C',
    paper: '#F4F8F8',
  },
} as const

export type BrandAppId = typeof BRAND.appId | typeof BRAND.legacyAppId
