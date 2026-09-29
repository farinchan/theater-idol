import { Client, Account, Databases, TablesDB, Storage, ID, Permission, Role, Query } from "appwrite";

const client = new Client()
  .setEndpoint("https://sgp.cloud.appwrite.io/v1")
  .setEndpointRealtime("wss://sgp.cloud.appwrite.io/v1")
  .setProject("6a869957002a80bc5060");

const account = new Account(client);
const databases = new Databases(client);
const tablesDB = new TablesDB(client);
const storage = new Storage(client);

export { client, account, databases, tablesDB, storage, ID, Permission, Role, Query };

client.ping();
