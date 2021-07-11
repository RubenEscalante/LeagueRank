const LeagueJS = require("leaguejs");
const regions = require("../regions.json");
const Discord = require("discord.js");
let leagueJs;
let currentName;
let currentRegion;

// Modulo principal
module.exports = {
  name: "p",
  description: "Muestra informacion de la persona ingresada",
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

const setCurrentName = (args) => {
  if (args[1] === "all") {
    all = true;
    return args.slice(2).join(" ");
  }
  all = false;
  return args.slice(1).join(" ");
};

const setRegion = (plattaformName) => {
  let region = regions.map((reg) => {
    return reg[plattaformName].PlatformRegion;
  });

  leagueJs = new LeagueJS(process.env.DEV_API_KEY, {
    PLATFORM_ID: region[0],
    limits: {
      allowBursts: false,

      // maximum amount of retries done when encountering 429 without retry-after header or 503 / 500
      numMaxRetries: 3,

      // starting retry backoff time on RIOT service overload (not related to API key limits)
      // will be increased exponentially with every retry
      intervalRetryMS: 3000,

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
      //showPersonInfo(message, data.id);
      showDivision(message, {
        id: data.id,
        nombre: data.name,
      });
    })
    .catch((err) => {
      "use strict";
      message.channel.send("Invocador no encontrado");
    });
};

const showDivision = async (message, person) => {
  message.channel.send("Cargando...");
  let resultado = await leagueJs.League.gettingEntriesForSummonerId(person.id);

  datosenemigos = resultado.map((user, index) => {
    if (user.queueType === "RANKED_SOLO_5x5") {
      person.tierSoloQ = user.tier;
      person.rankSoloQ = user.rank;
    }
    if (user.queueType === "RANKED_FLEX_SR") {
      person.tierFlex = user.tier;
      person.rankFlex = user.rank;
    }
  });

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
  construirEmbedYEnviarEnemigosAlCliente(message, person);
};

const construirEmbedYEnviarEnemigosAlCliente = (message, datos) => {
  try {
    const EnemysEmbed = new Discord.MessageEmbed()
      .setColor("#9C26B9")
      .setAuthor("LeagueRanked", "https://i.imgur.com/oDtPbpX.png")
      .addFields(
        {
          name: "Nombre",
          value: `[${datos.nombre}](https://${
            currentRegion === "kr" ? "www." : currentRegion + "."
          }op.gg/summoner/userName=${datos.nombre.replace(/ /g, "+")})`,
          inline: true,
        },
        {
          name: "Solo Q",
          value: datos.hasOwnProperty("tierSoloQ")
            ? `${datos.tierSoloQ} ${datos.rankSoloQ}`
            : "Ninguno",
          inline: true,
        },
        {
          name: "Flex",
          value: datos.hasOwnProperty("tierFlex")
            ? `${datos.tierFlex} ${datos.rankFlex}`
            : "Ninguno",
          inline: true,
        }
      )

      .setTimestamp()
      .setFooter("Creado con ❤");
    message.channel.send(EnemysEmbed);
  } catch (error) {
    message.channel.send("Hubo un error");
  }
};
