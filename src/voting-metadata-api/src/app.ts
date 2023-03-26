
import express, { json, urlencoded } from "express";
import "reflect-metadata";
import { RegisterRoutes } from "../routes/routes";
import { container } from "./ioc";
import { AwsSecretsService } from "./services/awsSecretsService";

const app = express();

container
    .resolve<AwsSecretsService>("AwsSecretsService")
    .resolveSecrets();
// Use body parser to read sent json payloads
app.use(
    urlencoded({
        extended: true,
    })
);
app.use(json());

RegisterRoutes(app);

export { app };

