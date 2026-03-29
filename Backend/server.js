require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth",          require("./routes/auth"));
app.use("/api/requests",      require("./routes/requests"));
app.use("/api/offers",        require("./routes/offers"));
app.use("/api/feedback",      require("./routes/feedback"));
app.use("/api/inventory",     require("./routes/inventory"));
app.use("/api/orders",        require("./routes/orders"));
app.use("/api/contact",       require("./routes/contact"));
app.use("/api/notifications", require("./routes/notifications"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.error(err));
