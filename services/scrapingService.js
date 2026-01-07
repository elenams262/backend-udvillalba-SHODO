const axios = require("axios");
const cheerio = require("cheerio");
const Team = require("../models/Equipos");
const Partido = require("../models/Partidos");

const URL_RFFM =
  "https://www.rffm.es/competicion/clasificaciones?temporada=21&competicion=24037756&grupo=24037757&jornada=10&tipojuego=2";

const URL_CALENDARIO =
  "https://www.rffm.es/competicion/calendario?temporada=21&competicion=24037756&grupo=24037757&jornada=10&tipojuego=2";

const actualizarClasificacion = async () => {
  console.log(
    "🔄 Iniciando actualización de clasificación desde RFFM (Método JSON)..."
  );

  try {
    const { data } = await axios.get(URL_RFFM, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);

    const nextDataScript = $("#__NEXT_DATA__").html();

    if (!nextDataScript) {
      console.warn("⚠️ No se encontró el script __NEXT_DATA__ en la página.");
      return;
    }

    const jsonData = JSON.parse(nextDataScript);

    let clasificacion = jsonData.props.pageProps.standings;

    if (clasificacion && !Array.isArray(clasificacion)) {
      if (clasificacion.clasificacion)
        clasificacion = clasificacion.clasificacion;
      else if (clasificacion.data) clasificacion = clasificacion.data;
      else if (clasificacion.standings) clasificacion = clasificacion.standings;
      else {
        console.log("Estructura de 'standings':", Object.keys(clasificacion));
      }
    }

    if (!Array.isArray(clasificacion)) {
      console.warn(
        "⚠️ 'standings' no es un array válido.",
        clasificacion ? "Tipo: " + typeof clasificacion : "Es null"
      );
      return;
    }

    if (clasificacion.length === 0) {
      console.warn("⚠️ No se encontraron datos de clasificación en el JSON.");
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

      if (!nombreEquipo) continue;

      const nombreLimpio = nombreEquipo.replace(/\s+/g, " ").trim();

      const equipoDB = await Team.findOneAndUpdate(
        { equipo: nombreLimpio },
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
        console.log(`✅ Actualizado: ${nombreLimpio} (${puntos} pts)`);
      } else {
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

    const rounds = jsonData.props.pageProps.calendar?.rounds;

    if (!rounds || !Array.isArray(rounds)) {
      console.warn(
        "⚠️ No se encontró la estructura de rondas (calendar.rounds)."
      );
      return;
    }

    let partidosActualizados = 0;

    for (const round of rounds) {
      const jornadaNombre = round.jornada || round.name;

      const partidos = round.equipos;

      if (!partidos || !Array.isArray(partidos)) continue;

      for (const partidoData of partidos) {
        const localName = partidoData.equipo_local;
        const visitanteName = partidoData.equipo_visitante;

        if (!localName || !visitanteName) continue;

        const localLimpio = localName.replace(/\s+/g, " ").trim();
        const visitanteLimpio = visitanteName.replace(/\s+/g, " ").trim();

        if (
          !localLimpio.toUpperCase().includes("VILLALBA") &&
          !visitanteLimpio.toUpperCase().includes("VILLALBA")
        ) {
          continue;
        }

        const fechaRaw = partidoData.fecha;
        const horaRaw = partidoData.hora;
        const campo = partidoData.campo || partidoData.nombre_campo || "";

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

        const golesLocal = partidoData.goles_casa;
        const golesVisitante = partidoData.goles_visitante;

        let fechaDate = null;
        if (fechaRaw) {
          const fechaNorm = fechaRaw.replace(/-/g, "/");
          const [day, month, year] = fechaNorm.split("/");
          if (day && month && year) {
            fechaDate = new Date(
              `${year}-${month}-${day}T${horaRaw || "00:00"}:00`
            );
          }
        }

        const isPlayed =
          golesLocal !== "" &&
          golesLocal !== null &&
          golesVisitante !== "" &&
          golesVisitante !== null;

        const jornadaStr = jornadaNombre.includes("Jornada")
          ? jornadaNombre
          : `Jornada ${jornadaNombre}`;

        const numeroJornada = parseInt(jornadaNombre.replace(/\D/g, "")) || 0;

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
            numeroJornada: numeroJornada,
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
