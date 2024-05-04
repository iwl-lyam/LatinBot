import Mongo from "./db.js"
import {EventEmitter} from 'node:events'
import {WebSocket} from 'ws'
const loop = new EventEmitter
import dotenv from 'dotenv'
dotenv.config({path: "./secrets.env"})
import {gatewayLogger} from "./logger.js";

import ping from "./handler/ping.js";
import request from "./request.js";

let msgs = []

/**
 * Connects to Discord Gateway and launches the bot.
 */
export default function bot() {
    const db = new Mongo()

    const conLink  = "wss://gateway.discord.gg/?v=10&encoding=json"
    const con = new WebSocket(conLink)
    con.on('open', () => {
        gatewayLogger.info("Gateway connection open")
    })

    let hbint = 0
    let ident = false
    con.on('close', (code, reason) => {
        gatewayLogger.error(`${code} ${reason}`)
        bot()
    })
    con.on('message', message => {
        message = JSON.parse(message)

        switch(message.op) {
            case 10:
                gatewayLogger.verbose("Hello received")
                hbint = message.d.heartbeat_interval
                con.send(JSON.stringify({op: 1,s:null,t:null,d:{}}))
                gatewayLogger.info("Heartbeat sent")
                break
            case 11:
                gatewayLogger.info("Heartbeat acknowledged")
                setTimeout(() => {
                    con.send(JSON.stringify({op: 1,s:null,t:null,d:{}}))
                    gatewayLogger.info("Heartbeat sent")
                }, hbint)
                gatewayLogger.verbose(`Time until next heartbeat: ${hbint}`)
                gatewayLogger.verbose(`Identifying: ${!ident}`)

                if (!ident) {
                    con.send(JSON.stringify({op: 2, d: {
                        token: process.env.TOKEN,
                        intents: 33292,
                        properties: {
                            os: "darwin",
                            browser: "who knows",
                            device: "lyam"
                        }
                    }}))

                    gatewayLogger.verbose("Identify sent")
                    ident = true;

                    // (async function() {
                    //     gatewayLogger.info("Producing message cache...")
                    //     let channels = await request("/guilds/1188194695873036398/channels")
                    //
                    //     channels.forEach(async c => {
                    //         let msgss = await request(`/channels/${c.id}/messages`)
                    //         msgss.forEach(e => {
                    //             msgs.push(e)
                    //         })
                    //     })
                    // })()
                }

                break
            case 1:
                gatewayLogger.info("Heartbeat received")
                con.send(JSON.stringify({op: 1,s:null,t:null,d:{}}))
                gatewayLogger.info("Heartbeat sent")
                break
            case 0:
                gatewayLogger.debug(`Event: ${message.t}`)
                if (message.t === "INTERACTION_CREATE") {
                    switch (message.d.data.name) {
                        case 'ping':
                            ping.execute(message.d)
                            break
                        default:
                            throw new Error("Command not added to switch statement!")
                    }
                } else {
                    if (message.t === "MESSAGE_DELETE") {
                        try {
                            (async function () {
                                console.log("Deleted message:")

                                msg = msgs.find(v => {
                                    return v.id === message.d.id
                                })
                                console.log(msg)

                                await request("/channels/1210340707588378634/messages", "POST", {}, {
                                    embeds: [
                                        {
                                            title: "Message deleted",
                                            fields: [
                                                {name: "Author", value: msg.author.username},
                                                {name: "Content", value: msg.content},
                                            ]
                                        }
                                    ]
                                })
                            })()
                        } catch {
                            request("/channels/1210340707588378634/messages", "POST", {}, {
                                embeds: [
                                    {
                                        title: "Message deleted",
                                        fields: [
                                            {name: "Author", value: "Unknown"},
                                            {name: "Content", value: "Unknown"},
                                        ]
                                    }
                                ]
                            })
                        }
                    }
                    else if (message.t === "AUDIT_LOG_ENTRY_CREATE") {
                        console.log(message.d)
                    } else if (message.t === "MESSAGE_CREATE") {
                        msgs.push(message.d)
                    }
                }
                break

            default:
                gatewayLogger.error(`Unknown gateway opcode sent: ${message.op}`)
                throw new Error("Unknown gateway opcode sent")
        }

    })

    loop.on("code", () => {
        // code handler
        // TODO re-add.js body parameter when implementing
    })
}

export function msg(body) {
    loop.emit("code", body)
}
