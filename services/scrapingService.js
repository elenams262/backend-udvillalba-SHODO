const axios = require("axios");
const cheerio = require("cheerio");
const Team = require("../models/Equipos");
const Partido = require("../models/Partidos");

// URL de la clasificación
const URL_RFFM =
  "https://www.rffm.es/competicion/clasificaciones?temporada=21&competicion=24037756&grupo=24037757&jornada=10&tipojuego=2";

const URL_CALENDARIO =
  "https://www.rffm.es/competicion/calendario?temporada=21&competicion=24037756&grupo=24037757&jornada=10&tipojuego=2";

const actualizarClasificacion = async () => {
  console.log(
    "🔄 Iniciando actualización de clasificación desde RFFM (Método JSON)..."
  );

  try {
    // 1. Descargar el HTML de la página simulando ser un navegador real
    const { data } = await axios.get(URL_RFFM, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);

    // 2. Extraer los datos del JSON de Next.js (__NEXT_DATA__)
    const nextDataScript = $("#__NEXT_DATA__").html();

    if (!nextDataScript) {
      console.warn("⚠️ No se encontró el script __NEXT_DATA__ en la página.");
      return;
    }

    const jsonData = JSON.parse(nextDataScript);

    // 3. Localizar el array de equipos
    let clasificacion = jsonData.props.pageProps.standings;

    // A veces 'standings' es un objeto que contiene la info, o un array de grupos
    // Si es un objeto y tiene una propiedad 'clasificacion', 'table' o 'data', usamos esa
    if (clasificacion && !Array.isArray(clasificacion)) {
      if (clasificacion.clasificacion)
        clasificacion = clasificacion.clasificacion;
      else if (clasificacion.data) clasificacion = clasificacion.data;
      else if (clasificacion.standings) clasificacion = clasificacion.standings;
      else {
        // Si es un objeto pero no encontramos subarray, quizás el objeto ES el mapa de equipos (raro)
        console.log("Estructura de 'standings':", Object.keys(clasificacion));
      }
    }

    // Si sigue sin ser array, no podemos continuar
    if (!Array.isArray(clasificacion)) {
      console.warn(
        "⚠️ 'standings' no es un array válido.",
        clasificacion ? "Tipo: " + typeof clasificacion : "Es null"
      );
      return;
    }

    // Si el array está vacío, tampoco podemos continuar
    if (clasificacion.length === 0) {
      console.warn("⚠️ No se encontraron datos de clasificación en el JSON.");
      // Intento de fallback: buscar 'standings' recursivamente o inspeccionar claves
      console.log(
        "Claves disponibles en props.pageProps:",
        Object.keys(jsonData.props.pageProps)
      );
      if (jsonData.props.pageProps.data) {
        console.log(
          "Claves en props.pageProps.data:",
          Object.keys(jsonData.props.pageProps.data)
        );
      }
      return;
    }

    let equiposActualizados = 0;

    for (const equipoData of clasificacion) {
      // Mapeo de campos según lo descubierto en el análisis
      // El JSON suele tener claves como: 'Nombre_Equipo', 'Puntos', 'PJ', etc. o 'nombre', 'puntos'...
      // Normalizamos nombres para asegurar compatibilidad

      const nombreEquipo = (
        equipoData.nombre ||
        equipoData.Equipo ||
        ""
      ).trim();
      const puntos = parseInt(equipoData.puntos || equipoData.Puntos || 0);
      const pj = parseInt(equipoData.jugados || equipoData.PJ || 0);
      const pg = parseInt(equipoData.ganados || equipoData.PG || 0);
      const pe = parseInt(equipoData.empatados || equipoData.PE || 0);
      const pp = parseInt(equipoData.perdidos || equipoData.PP || 0);
      const gf = parseInt(equipoData.goles_a_favor || equipoData.GF || 0);
      const gc = parseInt(equipoData.goles_en_contra || equipoData.GC || 0);

      // Imagen del escudo (ruta relativa): equipoData.url_img
      // Podríamos actualizar el escudo si quisiéramos: `https://AppWeb.rffm.es${equipoData.url_img}`

      if (!nombreEquipo) continue;

      // Limpieza de nombre (a veces RFFM pone espacios dobles)
      const nombreLimpio = nombreEquipo.replace(/\s+/g, " ").trim();

      // 3. Actualizar en BD
      const equipoDB = await Team.findOneAndUpdate(
        { equipo: nombreLimpio },
        {
          partidosJugados: pj,
          partidosGanados: pg,
          partidosEmpatados: pe,
          partidosPerdidos: pp,
          GF: gf,
          GC: gc,
          puntos: puntos, // Forzamos los puntos oficiales aunque el modelo los calcule
        },
        { new: true }
      );

      if (equipoDB) {
        equiposActualizados++;
        console.log(`✅ Actualizado: ${nombreLimpio} (${puntos} pts)`);
      } else {
        // console.log(`⏩ Ignorado (no está en BD): ${nombreLimpio}`);
      }
    }

    console.log(
      `🏁 Clasificación actualizada. Equipos sincronizados: ${equiposActualizados}`
    );
  } catch (error) {
    console.error("❌ Error en el proceso scraping:", error.message);
  }
};

const actualizarPartidos = async () => {
  console.log(
    "🔄 Iniciando actualización de partidos desde RFFM (Método JSON)..."
  );

  try {
    const { data } = await axios.get(URL_CALENDARIO, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    const nextDataScript = $("#__NEXT_DATA__").html();

    if (!nextDataScript) {
      console.warn(
        "⚠️ No se encontró el script __NEXT_DATA__ en la página de calendario."
      );
      return;
    }

    const jsonData = JSON.parse(nextDataScript);

    // Estructura esperada: props.pageProps.calendar.rounds -> Array[]
    const rounds = jsonData.props.pageProps.calendar?.rounds;

    if (!rounds || !Array.isArray(rounds)) {
      console.warn(
        "⚠️ No se encontró la estructura de rondas (calendar.rounds)."
      );
      return;
    }

    let partidosActualizados = 0;

    for (const round of rounds) {
      const jornadaNombre = round.jornada || round.name; // Ej: "Jornada 1", "1", etc.

      // Cada ronda tiene 'equipos' que en realidad son partidos
      const partidos = round.equipos;

      if (!partidos || !Array.isArray(partidos)) continue;

      for (const partidoData of partidos) {
        const localName = partidoData.equipo_local;
        const visitanteName = partidoData.equipo_visitante;

        if (!localName || !visitanteName) continue;

        // Normalizar nombres
        const localLimpio = localName.replace(/\s+/g, " ").trim();
        const visitanteLimpio = visitanteName.replace(/\s+/g, " ").trim();

        // Campos
        const fechaRaw = partidoData.fecha; // Ej: "19/09/2021"
        const horaRaw = partidoData.hora; // Ej: "12:00"
        const campo = partidoData.campo || partidoData.nombre_campo || "";

        // Escudos (si vienen relativos, añadir prefijo si es necesario)
        // Usualmente en RFFM: /pnfg/pimg/Clubes/...
        // Si ya tienen http, dejarlo.
        const escudoLocal = partidoData.escudo_equipo_local
          ? partidoData.escudo_equipo_local.startsWith("http")
            ? partidoData.escudo_equipo_local
            : `https://www.rffm.es${partidoData.escudo_equipo_local}`
          : "";

        const escudoVisitante = partidoData.escudo_equipo_visitante
          ? partidoData.escudo_equipo_visitante.startsWith("http")
            ? partidoData.escudo_equipo_visitante
            : `https://www.rffm.es${partidoData.escudo_equipo_visitante}`
          : "";

        // Goles
        const golesLocal = partidoData.goles_casa;
        const golesVisitante = partidoData.goles_visitante;

        // Conversión de fecha
        // Parse "DD/MM/YYYY" to Date object
        let fechaDate = new Date(); // default now
        if (fechaRaw) {
          const [day, month, year] = fechaRaw.split("/");
          if (day && month && year) {
            fechaDate = new Date(
              `${year}-${month}-${day}T${horaRaw || "00:00"}:00`
            );
          }
        }

        // Determinar si jugado
        const isPlayed =
          golesLocal !== "" &&
          golesLocal !== null &&
          golesVisitante !== "" &&
          golesVisitante !== null;

        // Upsert en BD
        // Usamos filtro: Jornada + Equipos para unicidad
        // Ajustar 'jornada' para que coincida con DB (String)
        const jornadaStr = jornadaNombre.includes("Jornada")
          ? jornadaNombre
          : `Jornada ${jornadaNombre}`;

        const partidoDB = await Partido.findOneAndUpdate(
          {
            jornada: jornadaStr,
            equipoLocal: localLimpio,
            equipoVisitante: visitanteLimpio,
          },
          {
            ubicacion: campo,
            fecha: fechaDate,
            hora: horaRaw,
            escudoLocal: escudoLocal,
            escudoVisitante: escudoVisitante,
            golesLocal: isPlayed ? parseInt(golesLocal) : null,
            golesVisitante: isPlayed ? parseInt(golesVisitante) : null,
            isPlayed: isPlayed,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (partidoDB) partidosActualizados++;
      }
    }

    console.log(`🏁 Partidos actualizados: ${partidosActualizados}`);
  } catch (error) {
    console.error("❌ Error actualizando partidos:", error.message);
  }
};

module.exports = { actualizarClasificacion, actualizarPartidos };
