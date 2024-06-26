import { MongoClient, ServerApiVersion } from 'mongodb'
import dotenv from 'dotenv'
import {mongoLogger} from "./logger.js";

dotenv.config({ path: "./secrets.env" })

const client = new MongoClient(process.env.MONGO, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

/**
 * MongoDB Connection class.
 * @constructor
 */
export default class Mongo {
    constructor() {
        const func = async () => {
            try {
                await client.connect()
                this.c = await client.db("test")
                await this.c.command({ping: 1})
                mongoLogger.info("MongoDB connection active")
            } catch (err) {
                mongoLogger.error("MongoDB connection FAILURE")
                console.log(err)
                throw new Error("Yes")
            }
        }
        func().then(() => {/*ignore*/})
    }

    /**
     * Get documents from a certain collection
     * @param {string} col - Target collection
     * @param {Object} filter - Only get documents that match this filter
     * @returns {Promise} - Results of the GET Request
     */
    get(col,filter) {
        return new Promise( (res, rej) => {
            const func = async () => {
                try {
                    mongoLogger.verbose(`Get request to ${col}`)
                    const collection = await this.c.collection(col)
                    res(await collection.find(filter).toArray())
                } catch (err) {
                    rej(err)
                }
            }
            func().then(() => {/*ignore*/})
        })

    }

    /**
     * Post documents to a certain collection
     * @param {string} col - Target collection
     * @param {Array} data - Array of documents as objects
     * @returns {Promise} Document inserted
     */
    post(col,data) {
        return new Promise( (res, rej) => {
            const func = async () => {
                try {
                    mongoLogger.verbose(`Post request to ${col}`)
                    const collection = await this.c.collection(col)
                    await collection.insertMany(data)
                    res()
                } catch (err) {
                    rej(err)
                }
            }
            func().then(() => {/*ignore*/})
        })
    }

    /**
     * Edit a document
     * @param col - Target collection
     * @param filter - Which document to edit
     * @param query - PATCH query as per the docs
     * @returns {Promise} Document after edits
     */
    patch(col, filter, query) {
        return new Promise((res, rej) => {
            const func = async () => {
                try {
                    mongoLogger.verbose(`Patch request to ${col}`)
                    const collection = await this.c.collection(col)
                    res(await collection.updateOne(filter, query))
                } catch (err) {
                    rej(err)
                }
            }
            func().then(() => {/*ignore*/})

        })
    }

    /**
     * Delete documents
     * @param col
     * @param filter
     * @returns {Promise<void>}
     */
    async delete(col, filter) {
        mongoLogger.verbose(`Delete request to ${col}`)
        const collection = await this.c.collection(col)
        await collection.deleteMany(filter)
    }
}