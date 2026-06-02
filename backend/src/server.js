const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env")
});

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`SplitCampus server is running on port ${PORT}`);
    });

    const gracefulShutdown = (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log("Express server closed.");
        try {
          const mongoose = require("mongoose");
          await mongoose.connection.close();
          console.log("MongoDB connection closed safely.");
          process.exit(0);
        } catch (error) {
          console.error("Error closing MongoDB connection:", error.message);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds if connections hang
      setTimeout(() => {
        console.error("Could not close active connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
