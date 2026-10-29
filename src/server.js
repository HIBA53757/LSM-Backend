import app from "./app.js"
import { connectDB } from "./config/database.js";
import listners from "./utils/listnerHandler.js";
import {startScheduler} from "./jobs/scheduler.js"

const backendPort = process.env.PORT
const backendHost = process.env.HOST

async function startServer() {
    try {
        await connectDB();
        await startScheduler();
        app.listen(backendPort, backendHost, () => {``
            console.log(`backend is running on HOST ${backendHost} and PORT ${backendPort}`)
            console.log('---------------------------------')
            console.log(`Listner Available:`)
            console.log('---------------------------------')
            listners.forEach(litsner => {
                console.log(`${litsner.name} : ${litsner.adress}:${backendPort}`)
            })
            console.log('---------------------------------')
        });
    }
    catch (error) {
        console.error("Failed to start the server", error);
        process.exit(1)
    }
}

await startServer();