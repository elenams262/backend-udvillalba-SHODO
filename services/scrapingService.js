const axios = require("axios");
const cheerio = require("cheerio");
const Team = require("../models/Equipos");

// URL de la clasificación
const URL_RFFM =
  "https://www.rffm.es/competicion/clasificaciones?temporada=21&competicion=24037756&grupo=24037757&jornada=10&tipojuego=2";

const actualizarClasificacion = async () => {
  console.log("🔄 Iniciando actualización de clasificación desde RFFM...");

  try {
    // 1. Descargar el HTML de la página
    const { data } = await axios.get(URL_RFFM);
    const $ = cheerio.load(data);

    // 2. Seleccionar la tabla y recorrer las filas
    // La estructura exacta basada en mi análisis:
    // La tabla principal tiene clase 'tablaCalendario' y 'clasificaciones'
    // Las filas útiles son divs con clase MuiGrid-container dentro de esa tabla (o estructura similar)
    const filas = $("table.tablaCalendario.clasificaciones .MuiGrid-container");

    if (filas.length === 0) {
      console.warn("⚠️ No se encontraron filas en la tabla de clasificación.");
      return;
    }

    let equiposActualizados = 0;

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      const celdas = $(fila).children(); // Los hijos directos son las "celdas"

      // Según el análisis del navegador:
      // [0] -> Posición
      // [1] -> Equipo (dentro suele haber un <a> con clase 'textoEquipo')
      // [2] -> Puntos
      // [3] -> PJ
      // [4] -> PG
      // [5] -> PE
      // [6] -> PP
      // [7] -> GF
      // [8] -> GC
      // [9] -> Puntos/Coeficiente (a veces extra)

      const nombreEquipoRAW =
        $(celdas[1]).find("a.textoEquipo").text().trim() ||
        $(celdas[1]).text().trim();
      const puntos = parseInt($(celdas[2]).text().trim()) || 0;
      const pj = parseInt($(celdas[3]).text().trim()) || 0;
      const pg = parseInt($(celdas[4]).text().trim()) || 0;
      const pe = parseInt($(celdas[5]).text().trim()) || 0;
      const pp = parseInt($(celdas[6]).text().trim()) || 0;
      const gf = parseInt($(celdas[7]).text().trim()) || 0;
      const gc = parseInt($(celdas[8]).text().trim()) || 0;

      // Limpieza del nombre del equipo si es necesario (quitar espacios extra)
      const nombreEquipo = nombreEquipoRAW.replace(/\s+/g, " ").trim();

      if (!nombreEquipo) continue;

      // 3. Actualizar en la base de datos
      // Usamos findOneAndUpdate con upsert: false (solo actualizamos si existe)
      // O upsert: true si queremos crear equipos nuevos automáticamente (pero sin escudo)

      // ESTRATEGIA: Buscamos coincidencia exacta o "contiene" para evitar duplicados por nombres ligeramente distintos
      // Para simplificar, asumimos que los nombres coinciden o ya fueron creados manualmente una vez.

      const equipoDB = await Team.findOneAndUpdate(
        { equipo: nombreEquipo },
        {
          partidosJugados: pj,
          partidosGanados: pg,
          partidosEmpatados: pe,
          partidosPerdidos: pp,
          GF: gf,
          GC: gc,
          puntos: puntos,
        },
        { new: true }
      );

      if (equipoDB) {
        equiposActualizados++;
        console.log(`✅ Actualizado: ${nombreEquipo}`);
      } else {
        console.log(
          `⚠️ Equipo no encontrado en BD (se ignora): ${nombreEquipo}`
        );
        // Opcional: Podríamos crearlo si no existe, pero le faltaría el escudo.
      }
    }

    console.log(
      `🏁 Clasificación actualizada. Equipos procesados: ${equiposActualizados}`
    );
  } catch (error) {
    console.error(
      "❌ Error al hacer scraping de la clasificación:",
      error.message
    );
  }
};

module.exports = actualizarClasificacion;
