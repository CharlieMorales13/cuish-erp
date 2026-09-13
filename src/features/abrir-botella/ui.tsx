import { Button } from '@/shared/ui'
import { useAbrirBotella } from './api'

export function BotonAbrirBotella({ loteId }: { loteId: string }) {
  const abrir = useAbrirBotella()
  return (
    <Button
      onClick={() => abrir.mutate(loteId)}
      disabled={abrir.isPending}
      className="px-2 py-1 text-xs"
    >
      Abrir botella
    </Button>
  )
}
