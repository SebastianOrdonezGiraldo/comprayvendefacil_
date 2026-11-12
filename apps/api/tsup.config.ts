import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/servidor.ts", "src/nucleo/migrar-cli.ts"],
  format: "esm",
  target: "node22",
  platform: "node",
  clean: true,
  // El paquete compartido se empaqueta dentro; el resto se instala con node_modules.
  noExternal: ["@cvf/compartido"],
});
