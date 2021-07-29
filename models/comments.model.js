module.exports = (sequelize, Sequelize) => {
    const Comment = sequelize.define("comment", {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
           type: Sequelize.INTEGER
          },
      message: {
        type: Sequelize.STRING(500)
      },
      movie_id: {
        type: Sequelize.INTEGER
      },
      ip_address: {
        type: Sequelize.STRING
      }
    });
  
    return Comment;
  };