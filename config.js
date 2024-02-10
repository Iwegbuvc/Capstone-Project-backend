const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/bookstore");

const db = mongoose.connection;

db.on("error", (err) => {
  console.log(err);
});
db.on("connected", () => {
  console.log("connection to MongoDB successful");
});

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true, // Username is a required field
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true, // Password is a required field
  },
});

const User = mongoose.model("users", UserSchema);

module.exports = User;
