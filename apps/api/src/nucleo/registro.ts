import pino from "pino";

/** Registros en JSON (pino). */
export const registro = pino({
  level: process.env.NIVEL_REGISTRO ?? (process.env.NODE_ENV === "test" ? "silent" : "info"),
});
