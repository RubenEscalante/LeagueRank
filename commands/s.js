const LeagueJS = require("leaguejs");
const regions = require("../regions.json");
const Discord = require("discord.js");
let leagueJs;
let currentName;
let currentRegion;
let all = false;
// Modulo principal
module.exports = {
  name: "s",
  description: "Show show enemy team",
  execute(message, args) {
    try {
      setRegion(args[0]);
      currentRegion = args[0];
      currentName = setCurrentName(args);
    } catch (error) {
      message.channel.send(
        "Debe ingresar una region valida. Escriba !help para mayor informacion"
      );
      return;
    }
    getSummonerIdEncryp(message);
  },
};

//Funciones logica del modulo

const setRegion = (plattaformName) => {
  let region = regions.map((reg) => {
    return reg[plattaformName].PlatformRegion;
  });

  leagueJs = new LeagueJS(process.env.DEV_API_KEY, {
    PLATFORM_ID: region[0],
    limits: {
      allowBursts: true,

      // maximum amount of retries done when encountering 429 without retry-after header or 503 / 500
      numMaxRetries: 3,

      // starting retry backoff time on RIOT service overload (not related to API key limits)
      // will be increased exponentially with every retry
      intervalRetryMS: 1000,

      // per default, retry is enabled on all endpoints
      // pass in an Array with the Names of the Endpoints you want to ENABLE retries on
      // if you see the need.
      // See [Endpoints](#Endpoints) above
    },
  });
};

const getSummonerIdEncryp = (message) => {
  leagueJs.Summoner.gettingByName(currentName)
    .then((data) => {
      "use strict";
      showEnemyTeam(message, data.id);
    })
    .catch((err) => {
      "use strict";
      message.channel.send("Invocador no encontrado");
    });
};

const showEnemyTeam = (message, id) => {
  leagueJs.Spectator.gettingActiveGame(id)
    .then((data) => {
      "use strict";
      // console.log(data.participants);
      const me = data.participants.filter((participantes) => {
        return participantes.summonerId === id;
      });
      const enemyTeamDataNonFormating = data.participants.map(
        (participantes) => {
          if (all) {
            return participantes.teamId
              ? {
                  nombre: participantes.summonerName,
                  id: participantes.summonerId,
                }
              : null;
          }
          return participantes.teamId !== me[0].teamId
            ? {
                nombre: participantes.summonerName,
                id: participantes.summonerId,
              }
            : null;
        }
      );
      //Elimino valores indefinidos
      //Enviar estos datos a otra funcion para mostrar divisiones.
      var enemyTeam = enemyTeamDataNonFormating.filter(function (x) {
        return x !== null;
      });
      showDivision(message, enemyTeam);
    })
    .catch((err) => {
      "use strict";
      message.channel.send("El invocador no esta en partida");
    });
};

const showDivision = async (message, enemyteam) => {
  message.channel.send("Cargando...");
  let resultado = [];
  enemyteam.forEach((data) => {
    resultado.push(leagueJs.League.gettingEntriesForSummonerId(data.id));
  });
  //SOLUCION 1:
  let datoscompletosenemigos = await Promise.all(
    resultado.map((p) => p.catch((e) => e))
  )
    .then((results) => {
      datosenemigos = enemyteam.map((enemy, index) => {
        arrayenemigos = results[index].map((element) => {
          if (element.queueType === "RANKED_SOLO_5x5") {
            enemy.tierSoloQ = element.tier;
            enemy.rankSoloQ = element.rank;
          }
          if (element.queueType === "RANKED_FLEX_SR") {
            enemy.tierFlex = element.tier;
            enemy.rankFlex = element.rank;
          }
        });
        return enemy;
      });
      return datosenemigos;
    })
    .catch((e) => console.log(e));
  //SOLUCION 2:
  // let results = await Promise.all(resultado);
  // let porfavor = enemyteam.map((enemy, index) => {
  //   hola2 = results[index].map((element) => {
  //     if (element.queueType === "RANKED_SOLO_5x5") {
  //       enemy.tierSoloQ = element.tier;
  //       enemy.rankSoloQ = element.rank;
  //     }
  //     if (element.queueType === "RANKED_FLEX_SR") {
  //       enemy.tierFlex = element.tier;
  //       enemy.rankFlex = element.rank;
  //     }

  //   });
  //   return enemy;
  // });
  construirEmbedYEnviarEnemigosAlCliente(message, datoscompletosenemigos);
};

const construirEmbedYEnviarEnemigosAlCliente = (message, datos) => {
  try {
    const EnemysEmbed = new Discord.MessageEmbed()
      .setColor("#9C26B9")
      .setTitle(
        all ? `Partida de ${currentName}` : `Enemigos de ${currentName}`
      )

      .setAuthor("LeagueRanked", "https://i.imgur.com/oDtPbpX.png")
      .addFields(
        {
          name: all ? "Equipo Azul" : "Nombre",
          value: datos
            .slice(0, 5)
            .map(
              (enemigos) =>
                `[${enemigos.nombre}](https://${
                  currentRegion === "kr" ? "www." : currentRegion + "."
                }op.gg/summoner/userName=${enemigos.nombre.replace(/ /g, "+")})`
            ),
          inline: true,
        },
        {
          name: "Solo Q",
          value: datos.slice(0, 5).map((enemigos) => {
            return enemigos.hasOwnProperty("tierSoloQ")
              ? `${enemigos.tierSoloQ} ${enemigos.rankSoloQ}`
              : "Ninguno";
          }),
          inline: true,
        },
        {
          name: "Flex",
          value: datos.slice(0, 5).map((enemigos) => {
            return enemigos.hasOwnProperty("tierFlex")
              ? `${enemigos.tierFlex} ${enemigos.rankFlex}`
              : "Ninguno";
          }),
          inline: true,
        }
      )
      .addFields(
        all
          ? [
              {
                name: all ? "Equipo Rojo" : "Nombre",
                value: datos
                  .slice(5, 10)
                  .map(
                    (enemigos) =>
                      `[${enemigos.nombre}](https://${
                        currentRegion === "kr" ? "www." : currentRegion + "."
                      }op.gg/summoner/userName=${enemigos.nombre.replace(
                        / /g,
                        "+"
                      )})`
                  ),
                inline: true,
              },
              {
                name: "Solo Q",
                value: datos.slice(5, 10).map((enemigos) => {
                  return enemigos.hasOwnProperty("tierSoloQ")
                    ? `${enemigos.tierSoloQ} ${enemigos.rankSoloQ}`
                    : "Ninguno";
                }),
                inline: true,
              },
              {
                name: "Flex",
                value: datos.slice(5, 10).map((enemigos) => {
                  return enemigos.hasOwnProperty("tierFlex")
                    ? `${enemigos.tierFlex} ${enemigos.rankFlex}`
                    : "Ninguno";
                }),
                inline: true,
              },
            ]
          : []
      )
      .setTimestamp()
      .setFooter("Creado con ❤");
    message.channel.send(EnemysEmbed);
  } catch (error) {
    message.channel.send("Hubo un error");
  }
};

const setCurrentName = (args) => {
  if (args[1] === "all") {
    all = true;
    return args.slice(2).join(" ");
  }
  all = false;
  return args.slice(1).join(" ");
};
