import request from "./request.js";
import {cmdLogger} from "./logger.js";

import dotenv from 'dotenv'
import ping from './handler/ping.js'

dotenv.config({path: './secrets.env'})

/**
 * Registers commands
 * @returns {Promise<void>}
 */
export default async function cmd() {
    cmdLogger.info("Registering /ping")
    await request(`/applications/${process.env.CID}/commands`, "POST", {}, {
        name: ping.title,
        description: ping.description,
        options: ping.args,
        default_member_permissions: "4",
        dm_permission: false
    })
}