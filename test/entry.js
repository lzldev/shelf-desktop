async function main() {
  const {startVitest} = await import('vitest/node')

  const tester = await startVitest('test',undefined)

  await tester?.close()
}

main()
