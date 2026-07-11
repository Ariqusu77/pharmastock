// Wraps a Sequelize managed transaction so application services can run
// atomic work without importing Sequelize. The callback gets the
// transaction handle to pass through repository calls; a thrown error
// rolls everything back automatically.
function createUnitOfWork({ sequelize }) {
  return {
    run(work) {
      return sequelize.transaction(work);
    },
  };
}

module.exports = createUnitOfWork;
