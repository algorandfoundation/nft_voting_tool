import CreateApp from "./app";

const port = process.env.PORT || 3000;

const app = CreateApp();

app.listen(port, () =>
    console.log(`IPFS Server listening at http://localhost:${port}`)
);