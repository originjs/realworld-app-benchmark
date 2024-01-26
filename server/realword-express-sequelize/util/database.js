const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: './data.sqlite3',
  autoLoadModels: true,
  synchronize: false,
});

const checkConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`DB Connected`.cyan.underline.bold);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

checkConnection();

module.exports = sequelize;
