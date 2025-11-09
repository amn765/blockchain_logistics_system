import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI;

async function clearDatabase() {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅ Connected to MongoDB");

    // 清空所有集合
    const collections = await mongoose.connection.db.collections();

    for (const collection of collections) {
      await collection.deleteMany({});
      console.log(`🧹 Cleared ${collection.collectionName}`);
    }

    console.log("🎉 All collections cleared!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error clearing database:", err);
  }
}

clearDatabase();
