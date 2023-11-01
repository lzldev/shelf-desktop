async function main() {
  console.log('Starting Tester')
  const {startVitest} = await import('vitest/node')

  const tester = await startVitest('test')

  await tester?.close()
}

main()
