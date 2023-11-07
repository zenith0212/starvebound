# Development

1. Checkout [the `dev` branch](https://github.com/FirenzCode/starvebound/tree/dev)
2. Choose a task from [the ToDo list](https://github.com/users/FirenzCode/projects/1)
3. Develop and test your code
4. Commit like: `#ISSUE_ID MESSAGE` for example:
   `#123 fixed serverlist loading race condition`
5. Create [a pull request from `dev` to `main`](https://github.com/FirenzCode/starvebound/compare/main...dev)
6. @Octo will check and merge the pull request

# File Structure

- `shared`: Shared code between client, game server and api server
- `website`: Static files for website, also has dynamic client.js and client.js.map
- `client`: Client side code, bundled via esbuild (see build-client.mjs)
- `server`: Game Server, a websocket server that manages a game
- `api-server`: API Server, manages databases, accounts, discord bot, ...

There should only be 1 `api-server` but there can be more than 1 `server`
