export const byId = <T extends { id: string }>(xs: T[]) =>
  Object.fromEntries(xs.map((x) => [x.id, x])) as Record<string, T>
