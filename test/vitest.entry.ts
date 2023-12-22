async function main() {
  const vitest = await import('vitest/node')

  const tester = await vitest.startVitest('test', process.env.FILTER ? [process.env.FILTER] : undefined)

  await tester?.close()
}

main()
