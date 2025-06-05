import mongoose, { Connection } from 'mongoose';

import { mongoDatabaseConfig } from '../configs/mongoDatabase';

export class MongoPool {
  private static instance: MongoPool;
  private connection: Connection | null = null;
  private uri: string;

  private constructor() {
    this.uri = MongoPool.buildMongoUri();
  }

  private static buildMongoUri(): string {
    const { host, user, password, database } = mongoDatabaseConfig;

    return `mongodb://${user}:${password}@${host}/${database}`;
  }

  public static getInstance(): MongoPool {
    if (!MongoPool.instance) {
      MongoPool.instance = new MongoPool();
    }

    return MongoPool.instance;
  }

  public async connect(): Promise<Connection> {
    if (
      !this.connection ||
      this.connection.readyState !== mongoose.ConnectionStates.connected
    ) {
      try {
        await mongoose.connect(this.uri);
        this.connection = mongoose.connection;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);

        throw new Error(`MongoDB connection error: ${errMsg}`);
      }
    }

    return this.connection;
  }

  public async disconnect(): Promise<void> {
    if (
      this.connection &&
      this.connection.readyState === mongoose.ConnectionStates.connected
    ) {
      try {
        await mongoose.disconnect();
        this.connection = null;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);

        throw new Error(`MongoDB disconnection error: ${errMsg}`);
      }
    }
  }

  public getConnection(): Connection | null {
    return this.connection;
  }
}
