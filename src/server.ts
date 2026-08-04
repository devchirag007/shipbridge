import "dotenv/config"
import app from "./app.js";

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`ShipBridge API is running on ${PORT}`);

    console.log("DATABASE_URL:", process.env.DATABASE_URL);
})