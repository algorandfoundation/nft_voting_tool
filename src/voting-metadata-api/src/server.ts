import CreateApp from './app'

const port = process.env.PORT || 3000

const app = CreateApp()

// eslint-disable-next-line no-console
app.listen(port, () => console.log(`IPFS Server listening at http://localhost:${port}`))
