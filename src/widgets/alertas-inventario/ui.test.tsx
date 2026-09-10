import { describe, expect, it } from 'vitest'
import type { Insumo, Lote } from '@/shared/api/contracts'
import { render, screen } from '@/shared/test/render'
import { ListaBajoMinimo, ListaPorCaducar, lotesPorCaducar } from './ui'

const hoy = new Date()
const enDias = (d: number) => {
  const f = new Date(hoy)
  f.setDate(f.getDate() + d)
  return f.toISOString().slice(0, 10)
}

const lote = (p: Partial<Lote> & Pick<Lote, 'id'>): Lote => ({
  insumoId: 'INS-01',
  estado: 'abierta',
  restante: 100,
  inicial: 100,
  recibido: '2026-01-01',
  costoUnitario: 1,
  ...p,
})

const insumo = (p: Partial<Insumo> = {}): Insumo => ({
  id: 'INS-01',
  nombre: 'Mezcal',
  categoria: 'Destilados',
  presentacion: 1000,
  unidad: 'ml',
  costoCompra: 150,
  costoUnitario: 0.15,
  esBotella: true,
  caduca: false,
  min: 1500,
  max: 6000,
  ...p,
})

describe('lotesPorCaducar', () => {
  it('deja fuera lo que no caduca y lo que caduca lejos', () => {
    const lotes = [
      lote({ id: 'L1', caducidad: enDias(3) }),
      lote({ id: 'L2' }),
      lote({ id: 'L3', caducidad: enDias(90) }),
    ]
    expect(lotesPorCaducar(lotes).map((x) => x.lote.id)).toEqual(['L1'])
  })

  it('ignora los lotes agotados: ya no hay nada que se eche a perder', () => {
    const lotes = [lote({ id: 'L1', estado: 'agotada', caducidad: enDias(2) })]
    expect(lotesPorCaducar(lotes)).toEqual([])
  })

  it('ordena por urgencia, lo ya caducado primero', () => {
    const lotes = [
      lote({ id: 'L1', caducidad: enDias(10) }),
      lote({ id: 'L2', caducidad: enDias(-5) }),
      lote({ id: 'L3', caducidad: enDias(2) }),
    ]
    expect(lotesPorCaducar(lotes).map((x) => x.lote.id)).toEqual(['L2', 'L3', 'L1'])
  })
})

describe('<ListaBajoMinimo>', () => {
  it('muestra existencia y mínimo de cada insumo', () => {
    render(
      <ListaBajoMinimo
        insumos={[insumo()]}
        existencias={{ 'INS-01': { insumoId: 'INS-01', cerrado: 0, abierto: 900, total: 900 } }}
      />,
    )
    const fila = screen.getByRole('listitem')
    expect(fila).toHaveTextContent('Mezcal')
    expect(fila).toHaveTextContent('900 ml')
    expect(fila).toHaveTextContent('mín 1,500')
  })

  it('sin insumos bajos da la buena noticia', () => {
    render(<ListaBajoMinimo insumos={[]} existencias={{}} />)
    expect(screen.getByText('Todo por encima del mínimo.')).toBeInTheDocument()
  })

  it('recorta la lista al límite pedido', () => {
    const insumos = Array.from({ length: 20 }, (_, i) =>
      insumo({ id: `INS-${i}`, nombre: `X${i}` }),
    )
    render(<ListaBajoMinimo insumos={insumos} existencias={{}} limite={5} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
  })
})

describe('<ListaPorCaducar>', () => {
  it('marca en días lo que está por vencer y avisa lo ya caducado', () => {
    render(
      <ListaPorCaducar
        lotes={[
          { lote: lote({ id: 'L1', caducidad: enDias(3) }), dias: 3 },
          { lote: lote({ id: 'L2', caducidad: enDias(-4) }), dias: -4 },
        ]}
        nombreDe={() => 'Jarabe natural'}
      />,
    )
    expect(screen.getByText('3 días')).toBeInTheDocument()
    expect(screen.getByText('caducado hace 4 d')).toBeInTheDocument()
  })

  it('sin nada por caducar lo dice', () => {
    render(<ListaPorCaducar lotes={[]} nombreDe={() => ''} />)
    expect(screen.getByText(/Nada caduca en los próximos/)).toBeInTheDocument()
  })
})
