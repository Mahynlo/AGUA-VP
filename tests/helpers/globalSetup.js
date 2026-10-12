const { prepararBaseDePrueba } = require('./baseDePrueba');

/** Una sola copia de la base por corrida: los módulos se prueban en orden sobre los mismos datos. */
module.exports = async () => {
  const { carpeta, base } = await prepararBaseDePrueba();
  process.env.AGUAVP_E2E_USER_DATA = carpeta;
  console.log(`\n[E2E] Base de prueba lista (copia de la real): ${base}\n`);
};
