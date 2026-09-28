import { Client, Account, ID } from "appwrite";

const client = new Client()
  .setEndpoint("https://sgp.cloud.appwrite.io/v1")
  .setProject("6a869957002a80bc5060");

const account = new Account(client);

export { client, account, ID };

client.ping();
