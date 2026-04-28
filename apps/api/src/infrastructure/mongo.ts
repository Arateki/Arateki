import { MongoClient, type Db } from 'mongodb';

export interface MongoConnection {
  client: MongoClient;
  db: Db;
  close(): Promise<void>;
}

export async function createMongoConnection(uri: string): Promise<MongoConnection> {
  const client = new MongoClient(uri, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });
  await client.connect();

  return {
    client,
    db: client.db(),
    close: () => client.close(),
  };
}
