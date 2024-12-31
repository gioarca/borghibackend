const connectDB = require("./db.js");
const app = require("../index.js");

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    // await connectDB();
    await connectDB();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
  }
}

startServer();
