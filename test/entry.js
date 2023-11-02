async function main() {
  const {startVitest} = await import('vitest/node')

  const tester = await startVitest('test')

  await tester?.close()
}

main()
