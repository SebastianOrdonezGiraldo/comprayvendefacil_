import { timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

/** Identificadores UUID v7: ordenables por fecha y no adivinables. */
export const nuevoId = () => uuidv7();

export const columnaId = () => uuid("id").primaryKey().$defaultFn(nuevoId);

/** Fecha y hora con zona horaria. Se muestran en hora de Colombia. */
export const fechaHora = (nombre: string) => timestamp(nombre, { withTimezone: true, mode: "date" });

export const creadoEn = () => fechaHora("creado_en").notNull().defaultNow();
