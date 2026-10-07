import mongoose from "mongoose";

const connection = () => {
  mongoose
    .connect(process.env.DB_URI)
    .then((con) => {
      console.log(
        `Mongoose successfull connected with HOST: ${con.connection.host}`,
      );
    })
    .catch((err) => {
      console.error(`MongoDB connection error ${err.message}`);
    });
};

export default connection;
