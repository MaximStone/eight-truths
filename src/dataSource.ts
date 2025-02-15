import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { Entry } from "./entity/Entry";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "data.db",
    synchronize: true,
    logging: false,
    entities: [User, Entry],
});
