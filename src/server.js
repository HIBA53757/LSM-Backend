import app from "./app.js";
import { connectDB } from "./config/database.js";

const PORT = process.env.PORT || 3000;

// On connecte la base de données et on démarre le serveur
connectDB();

app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
