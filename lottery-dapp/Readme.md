
## Getting Started

make sure you have Node(>=v20) and pnpm installed.

First, run the development server:

```bash
cd lottery-app
pnpm install
```

Then, run the hardhat server on localhost:

```bash
pnpm contract:dev
pnpm contract:deploy
```
Finally, run the next server:

```bash
pnpm frontend:dev
```

Open http://localhost:3000 to see the app.