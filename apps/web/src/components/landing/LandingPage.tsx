'use client'

import { Header } from './Header'
import { Hero } from './Hero'
import { StatsBar } from './StatsBar'
import { Diferenciais } from './Diferenciais'
import { Modalidades } from './Modalidades'
import { Planos } from './Planos'
import { Depoimentos } from './Depoimentos'
import { Localizacao } from './Localizacao'
import { FormularioMatricula } from './FormularioMatricula'
import { Footer } from './Footer'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <StatsBar />
        <Diferenciais />
        <Modalidades />
        <Planos />
        <Depoimentos />
        <Localizacao />
        <FormularioMatricula />
      </main>
      <Footer />
    </div>
  )
}
