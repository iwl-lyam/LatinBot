import request from '../request.js'
import {gatewayLogger} from "../logger.js";

export default {
    title: "ping",
    description: "Ping the bot",
    args: [],
    async execute(interaction, db) {
        request(`/interactions/${interaction.id}/${interaction.token}/callback`, "POST", {}, {
            type: 4,
            data: {
                content: "ping"
            }
        })

    }
}