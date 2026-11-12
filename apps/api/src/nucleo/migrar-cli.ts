/** Comando: pnpm db:migrar */
import { migrar } from "./migrar";

migrar()
  .then(() => console.log("Migraciones aplicadas."))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
