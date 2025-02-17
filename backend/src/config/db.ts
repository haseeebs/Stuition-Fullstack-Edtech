import { connect } from "mongoose";

const connectDb = async () => {
  try {
    const connection = await connect(process.env.MONGO_URL!);
    console.log(`Connected to database: ${connection.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Error during MongoDB connection: ${error.message}`);
    } else {
      console.log(`Unknown error during MongoDB connection: ${error}`);
    }
    process.exit(1);
  }
};

export default connectDb;