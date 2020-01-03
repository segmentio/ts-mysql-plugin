import execa from 'execa'

async function build(goName: string, nodeName: string): Promise<void> {
  const moduleDirectory = `./src/lib/sql-parser/`
  const binaryPath = `./dist/sql-parser-${nodeName}`

  console.log(`💻  Compiling for ${goName}...`)
  await execa('go build', [`-o ${binaryPath}`, `${moduleDirectory}/main.go`], {
    shell: true,
    env: {
      GOOS: goName
    }
  })

  console.log(`✅  Compiled for ${goName}.`)
}

console.log('🏠  Building...')
Promise.all([build('windows', 'win32'), build('darwin', 'darwin'), build('linux', 'linux')])
  .then(() => {
    console.log('✅  Built.')
  })
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })
