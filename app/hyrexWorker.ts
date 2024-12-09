import { HyrexWorker } from "../HyrexWorker";
import { HyrexQueue } from "../HyrexQueue";
import { hy as appRegistry } from "./app";

const hyrexWorker = new HyrexWorker({ appId: "My first app" })
hyrexWorker.addRegistry(appRegistry);
hyrexWorker.init()
