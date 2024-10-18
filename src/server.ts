import { server } from './server-config'
const port = process.env.PORT

server.listen(port, () => console.log(`Listening on port ${port}...`))
