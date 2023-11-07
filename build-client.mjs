import * as esbuild from 'esbuild'

let isWatch = false
let isProduction = false
for (const arg of process.argv.slice(2)) {
  if (arg === '--watch') {
    isWatch = true
  } else if (arg === '--production') {
    isProduction = true
  } else {
    throw new Error(`Unknown argument: ${arg}`)
  }
}

if (isProduction) throw new Error('Production build not implemented yet')

const buildContext = await esbuild.context({
  entryPoints: ['./client/client.js'],
  bundle: true,
  outfile: './website/client.js',
  target: ['chrome100'],
  sourcemap: true,
})

if (isWatch) {
  buildContext.watch()
  const { host, port } = await buildContext.serve({
    servedir: './website',
  })
  console.log('Client available at', 'http://' + host + ':' + port)
} else {
  buildContext.rebuild()
}
