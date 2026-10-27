import os from "os"
import { config } from "dotenv"

const backendHost = process.env.HOST

function listnerHandler(interfaces , backendHost) {
    const listners = []
    if (backendHost === "0.0.0.0") {

        for (const name in interfaces) {
            for (const network of interfaces[name]) {
                if (network.family === "IPv4") {

                    listners.push({
                        name: network.internal ? "LocalHost" : "Network",
                        adress: network.address
                    })
                }
            }
        }

    } else if (backendHost === '127.0.0.1') {
        listners.push({
            name: 'Localhost',
            adress: backendHost
        })
    }

    return listners
}
const interfaces = os.networkInterfaces();

const listners = listnerHandler(interfaces , backendHost)

export default listners