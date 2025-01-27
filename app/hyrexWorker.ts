import { HyrexApp } from "../HyrexApp";
import { HyrexQueue } from "../HyrexQueue";
import { hy as appRegistry } from "./app";

const hyrexApp = new HyrexApp({ name: "My Cool App" })
hyrexApp.addRegistry(appRegistry);
hyrexApp.init()
