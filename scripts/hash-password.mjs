// Genera un hash bcrypt para insertar en la tabla usuarios.
// Uso:  node scripts/hash-password.mjs <password>
// Requiere: npm install bcryptjs
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Uso: node scripts/hash-password.mjs <password>");
  process.exit(1);
}
console.log(bcrypt.hashSync(password, 10));
