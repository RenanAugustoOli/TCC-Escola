import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'GymTech — Treine com tecnologia. Evolua de verdade.',
  description:
    'A academia que une equipamentos de ponta, personal trainers e um app com assistente de nutrição por IA. Matricule-se e comece a treinar essa semana.',
}

export default function AcademiaLayout({ children }: { children: React.ReactNode }) {
  return <div className={poppins.variable}>{children}</div>
}
