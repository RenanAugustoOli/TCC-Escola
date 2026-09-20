'use client'

import { useId } from 'react'

const TRACE_PATH =
  'M0,60 L220,60 L255,60 L280,10 L310,110 L340,60 L380,60 L410,30 L440,90 L470,60 L620,60 L655,60 L680,10 L710,110 L740,60 L780,60 L810,30 L840,90 L870,60 L1200,60'

// Comprimento normalizado do traçado (via `pathLength`) e tamanho do segmento
// que "anda" sobre ele — mantém a matemática do dash independente da geometria real.
const PATH_LENGTH = 1000
const SEGMENT_LENGTH = 220

/**
 * Elemento de assinatura visual da página: uma linha de pulso (eletrocardiograma)
 * que atravessa o hero e reaparece como divisor entre seções. Representa o
 * cruzamento entre "tecnologia" (linha de dados) e "esforço físico" (batimento).
 * Um segmento da própria linha percorre o traçado em loop — desenhando a frente e
 * apagando o rastro, como a cobrinha do Snake — com um ponto luminoso na cabeça.
 * Desligado (linha estática) quando o usuário prefere menos movimento na tela.
 */
export function PulseTrace({ className = '', tone = 'white' }: { className?: string; tone?: 'white' | 'blue' }) {
  const stroke = tone === 'white' ? '#FFFFFF' : '#1565C0'
  const glowId = useId()

  return (
    <svg className={className} viewBox="0 0 1200 120" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <defs>
        <filter id={glowId} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* trilho de fundo — referência sutil do traçado completo */}
      <path
        d={TRACE_PATH}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.12"
        className="motion-reduce:opacity-30"
      />

      {/* segmento que anda: desenha a frente e apaga o rastro, feito Snake */}
      <path
        d={TRACE_PATH}
        pathLength={PATH_LENGTH}
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${SEGMENT_LENGTH} ${PATH_LENGTH * 2}`}
        opacity="0.65"
        className="motion-reduce:hidden"
      >
        <animate
          attributeName="stroke-dashoffset"
          from={PATH_LENGTH + SEGMENT_LENGTH}
          to={-SEGMENT_LENGTH}
          dur="4s"
          begin="0.5s"
          repeatCount="indefinite"
        />
      </path>

      <circle r="5" fill={stroke} filter={`url(#${glowId})`} className="motion-reduce:hidden">
        <animateMotion dur="4s" repeatCount="indefinite" path={TRACE_PATH} begin="0.5s" />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.94;1" dur="4s" repeatCount="indefinite" begin="0.5s" />
      </circle>
    </svg>
  )
}
