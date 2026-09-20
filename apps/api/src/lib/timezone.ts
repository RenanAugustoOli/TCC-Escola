// Horários de aula são gravados como "HH:mm" locais; em servidores UTC (ex.: Railway)
// isso deslocaria as aulas. Fixamos o fuso da academia antes de qualquer uso de Date.
if (!process.env.TZ) process.env.TZ = 'America/Sao_Paulo'

export {}
