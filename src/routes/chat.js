const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const axios = require("axios");
const router = express.Router();

// Inizializzazione Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configurazione API esterne
const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";

// Sistema di cache
const cache = new Map();
const CACHE_TTL = 300000; // 5 minuti

router.post("/nonna", async (req, res) => {
  try {
    console.log("📥 Richiesta ricevuta:", {
      messagesCount: req.body.messages?.length,
      hasContext: !!req.body.context,
    });

    const { messages, context } = req.body;

    // Validazione input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Messaggio non valido. Invia almeno un messaggio.",
      });
    }

    // 1. Recupera dati dal database (con cache)
    const borgoData = await getCachedBorgoData(context);

    // 2. Analizza se serve ricerca web
    const userLastMessage = messages[messages.length - 1].content;
    const needsWebSearch = analyzeNeedsWebSearch(userLastMessage);

    // 3. Eventuale ricerca web
    let webSearchResults = null;
    if (needsWebSearch) {
      webSearchResults = await performWebSearch(userLastMessage, context);
    }

    // 4. Costruisci prompt sistema
    const systemPrompt = buildSystemPrompt(borgoData, webSearchResults);

    // 5. Prepara messaggi per Claude
    const claudeMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 6. Chiamata API Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      temperature: 0.7,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const assistantMessage = response.content[0].text;
    console.log("✅ Risposta Claude ricevuta");

    // 7. Parse risposta e estrai dati strutturati
    const structuredResponse = parseAssistantResponse(
      assistantMessage,
      borgoData
    );

    // 8. Invia risposta al frontend
    res.json({
      message: structuredResponse.cleanMessage,
      suggestions: structuredResponse.suggestions,
      structuredData: structuredResponse.structuredData,
    });
  } catch (error) {
    console.error("❌ Errore nel processamento:", error);

    // Gestione errori specifici
    if (error.status === 401) {
      return res.status(500).json({
        error: "Errore di autenticazione API. Contatta l'amministratore.",
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: "Troppi messaggi inviati. Attendi qualche secondo e riprova.",
      });
    }

    res.status(500).json({
      error: "Mi dispiace, ho avuto un problema tecnico. Riprova tra poco.",
    });
  }
});

// SISTEMA DI CACHE
async function getCachedBorgoData(context) {
  const cacheKey = `borgo_data_${new Date().toDateString()}`;

  // Controlla se i dati sono in cache e ancora validi
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("📦 Dati recuperati dalla cache");
      return cached.data;
    }
  }

  // Se non in cache o scaduti, recupera nuovi dati
  console.log("🔄 Recupero nuovi dati dal database");
  const data = await getBorgoData(context);

  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });

  return data;
}

// RECUPERO DATI
async function getBorgoData(context) {
  try {
    // Chiamate parallele per ottimizzare performance
    const [attrazioni, ristoranti, eventi, trasporti, meteo] =
      await Promise.all([
        fetchAttrazioni(),
        fetchRistoranti(),
        fetchEventiSettimana(),
        fetchInfoTrasporti(),
        fetchMeteo(),
      ]);

    return {
      attrazioni,
      ristoranti,
      eventi,
      trasporti,
      meteo,
    };
  } catch (error) {
    console.error("⚠️ Errore recupero dati, uso dati di fallback:", error);
    return getDefaultBorgoData();
  }
}

async function fetchAttrazioni() {
  // TODO: Sostituire con query database reale
  // const result = await db.query('SELECT * FROM attrazioni WHERE attivo = true');
  // return result.rows;

  return [
    {
      nome: "Chiesa di San Francesco",
      descrizione: "Chiesa medievale del XIII secolo con affreschi originali",
      orari: "Lun-Dom 9:00-18:00",
      distanza: "200m dal centro",
      prezzoIngresso: "Gratuito",
    },
    {
      nome: "Museo del Borgo",
      descrizione: "Collezione di arte locale e reperti storici",
      orari: "Mar-Dom 10:00-17:00, chiuso lunedì",
      distanza: "300m dal centro",
      prezzoIngresso: "€5 intero, €3 ridotto",
    },
  ];
}

async function fetchRistoranti() {
  // TODO: Query database con filtro per giorno corrente
  return [
    {
      nome: "Trattoria da Maria",
      tipoCucina: "Tradizionale locale",
      indirizzo: "Via Roma 15",
      orari: "12:00-15:00, 19:00-22:00",
      fasciaPrezzo: "€€",
      specialita: "Pasta fatta in casa, arrosti",
    },
    {
      nome: "Osteria del Borgo",
      tipoCucina: "Cucina tipica",
      indirizzo: "Piazza Centrale 8",
      orari: "12:30-14:30, 19:30-22:30",
      fasciaPrezzo: "€€€",
      specialita: "Menu degustazione locale",
    },
  ];
}

async function fetchEventiSettimana() {
  // TODO: Query database per eventi prossima settimana
  return [
    {
      titolo: "Mercato settimanale",
      data: "Giovedì 10 Ottobre",
      ora: "8:00-13:00",
      luogo: "Piazza del Mercato",
      descrizione: "Prodotti locali, artigianato e specialità gastronomiche",
      prezzo: null,
    },
  ];
}

async function fetchInfoTrasporti() {
  // TODO: Dati trasporti aggiornati
  return {
    busLocali:
      "Linea 1 ogni 30 min (7:00-20:00), fermate: Centro-Stazione-Museo",
    parcheggi:
      "Parcheggio Comunale (€1/ora), Parcheggio Chiesa (gratuito, limitato)",
    collegamentiExtraurbani:
      "Autobus per città principali ore 8:30, 12:00, 17:30",
    taxi: "Tel. 0123-456789, stazionamento in Piazza Centrale",
  };
}

async function fetchMeteo() {
  try {
    if (!process.env.OPENWEATHER_API_KEY) {
      return "Informazioni meteo non configurate";
    }

    const response = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          q: process.env.BORGO_NAME || "Roma,IT",
          appid: process.env.OPENWEATHER_API_KEY,
          units: "metric",
          lang: "it",
        },
        timeout: 5000, // 5 secondi timeout
      }
    );

    const weather = response.data;
    return `${weather.weather[0].description}, ${Math.round(
      weather.main.temp
    )}°C`;
  } catch (error) {
    console.warn("⚠️ Impossibile recuperare dati meteo:", error.message);
    return "Informazioni meteo non disponibili";
  }
}

function getDefaultBorgoData() {
  return {
    attrazioni: [],
    ristoranti: [],
    eventi: [],
    trasporti: {
      busLocali: "Informazioni non disponibili",
      parcheggi: "Contattare info point",
      collegamentiExtraurbani: "Consultare il sito del comune",
      taxi: "Servizio disponibile su chiamata",
    },
    meteo: "Informazioni non disponibili",
  };
}

// RICERCA WEB
function analyzeNeedsWebSearch(message) {
  const webSearchKeywords = [
    "meteo",
    "tempo",
    "temperature",
    "collegamenti",
    "treno",
    "aereo",
    "come arrivare",
    "storia",
    "curiosità",
    "tradizioni",
    "festività",
    "santo patrono",
    "dintorni",
    "vicino",
    "zona",
  ];

  const messageLower = message.toLowerCase();
  return webSearchKeywords.some((keyword) => messageLower.includes(keyword));
}

async function performWebSearch(query, context) {
  try {
    if (!BRAVE_API_KEY) {
      console.warn("⚠️ Brave API key non configurata");
      return null;
    }

    const searchQuery = `${query} ${process.env.BORGO_NAME || "borgo"} Italia`;
    console.log("🔍 Ricerca web:", searchQuery);

    const response = await axios.get(BRAVE_SEARCH_URL, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": BRAVE_API_KEY,
      },
      params: {
        q: searchQuery,
        count: 5,
        country: "IT",
        search_lang: "it",
      },
      timeout: 5000, // 5 secondi timeout
    });

    const results = response.data.web?.results || [];

    if (results.length === 0) {
      console.log("ℹ️ Nessun risultato dalla ricerca web");
      return null;
    }

    return results
      .slice(0, 3)
      .map((result) => `${result.title}: ${result.description}`)
      .join("\n\n");
  } catch (error) {
    console.error("❌ Errore ricerca web:", error.message);
    return null;
  }
}

// COSTRUZIONE PROMPT
function buildSystemPrompt(borgoData, webSearchResults) {
  let prompt = `Sei una nonna affettuosa che conosce perfettamente il borgo e aiuta i visitatori con consigli calorosi ma discreti.

Caratteristiche del tuo personaggio:
- Parli in modo affettuoso ma non eccessivo, usando occasionalmente "caro/a" o "tesoro"
- Sei disponibile e competente senza essere invadente
- Dai consigli pratici e specifici basandoti sui dati reali
- Non inventi informazioni, se non sai qualcosa lo ammetti onestamente
- Mantieni le risposte concise ma complete (massimo 3-4 frasi)
- Se suggerisci luoghi o attività, menziona dettagli pratici come orari e distanze
- Alla fine della risposta, puoi suggerire fino a 2 domande di follow-up pertinenti racchiuse tra [SUGGESTIONS] e [/SUGGESTIONS]

Dati attuali del borgo (${new Date().toLocaleDateString("it-IT")}):

ATTRAZIONI:
${formatAttrazioni(borgoData.attrazioni)}

RISTORANTI E LOCALI:
${formatRistoranti(borgoData.ristoranti)}

EVENTI IN PROGRAMMA:
${formatEventi(borgoData.eventi)}

TRASPORTI:
${formatTrasporti(borgoData.trasporti)}

INFORMAZIONI METEO:
${borgoData.meteo}`;

  if (webSearchResults) {
    prompt += `\n\nINFORMAZIONI AGGIUNTIVE DA WEB:
${webSearchResults}

Usa queste informazioni per arricchire le tue risposte, ma mantieni sempre il focus sul borgo.`;
  }

  return prompt;
}

// FORMATTAZIONE DATI
function formatAttrazioni(attrazioni) {
  if (!attrazioni || attrazioni.length === 0) {
    return "Nessuna attrazione disponibile al momento";
  }

  return attrazioni
    .map(
      (attr) => `- ${attr.nome}: ${attr.descrizione}
   Orari: ${attr.orari}
   Distanza dal centro: ${attr.distanza}
   ${
     attr.prezzoIngresso
       ? `Prezzo: ${attr.prezzoIngresso}`
       : "Ingresso gratuito"
   }`
    )
    .join("\n\n");
}

function formatRistoranti(ristoranti) {
  if (!ristoranti || ristoranti.length === 0) {
    return "Nessun ristorante disponibile al momento";
  }

  return ristoranti
    .map(
      (rist) => `- ${rist.nome} (${rist.tipoCucina})
   Indirizzo: ${rist.indirizzo}
   Orari: ${rist.orari}
   Fascia prezzo: ${rist.fasciaPrezzo}
   ${rist.specialita ? `Specialità: ${rist.specialita}` : ""}`
    )
    .join("\n\n");
}

function formatEventi(eventi) {
  if (!eventi || eventi.length === 0) {
    return "Nessun evento in programma al momento";
  }

  return eventi
    .map(
      (evento) => `- ${evento.titolo}
   Data: ${evento.data} alle ${evento.ora}
   Luogo: ${evento.luogo}
   ${evento.descrizione}
   ${evento.prezzo ? `Prezzo: ${evento.prezzo}` : "Ingresso gratuito"}`
    )
    .join("\n\n");
}

function formatTrasporti(trasporti) {
  if (!trasporti) {
    return "Informazioni trasporti non disponibili";
  }

  return `Bus locali: ${trasporti.busLocali}
Parcheggi: ${trasporti.parcheggi}
Collegamenti extraurbani: ${trasporti.collegamentiExtraurbani}
Info taxi: ${trasporti.taxi}`;
}

// PARSING RISPOSTA
function parseAssistantResponse(message, borgoData) {
  let cleanMessage = message;
  let suggestions = [];
  let structuredData = null;

  // 1. Estrai suggerimenti
  const suggestionsMatch = message.match(
    /\[SUGGESTIONS\](.*?)\[\/SUGGESTIONS\]/s
  );

  if (suggestionsMatch) {
    const suggestionsText = suggestionsMatch[1].trim();
    suggestions = suggestionsText
      .split("\n")
      .map((s) => s.replace(/^[-*]\d*\.?\s*/, "").trim())
      .filter((s) => s.length > 0 && s.length < 100)
      .slice(0, 2);

    cleanMessage = message
      .replace(/\[SUGGESTIONS\].*?\[\/SUGGESTIONS\]/s, "")
      .trim();
  }

  // 2. Identifica luoghi menzionati
  const mentionedPlaces = [];

  borgoData.attrazioni?.forEach((attr) => {
    if (cleanMessage.includes(attr.nome)) {
      mentionedPlaces.push({
        name: attr.nome,
        hours: attr.orari,
        distance: attr.distanza,
      });
    }
  });

  borgoData.ristoranti?.forEach((rist) => {
    if (cleanMessage.includes(rist.nome)) {
      mentionedPlaces.push({
        name: rist.nome,
        hours: rist.orari,
        distance: null,
      });
    }
  });

  if (mentionedPlaces.length > 0) {
    structuredData = {
      type: "places",
      items: mentionedPlaces,
    };
  }

  // 3. Identifica eventi menzionati
  const mentionedEvents = [];

  borgoData.eventi?.forEach((evento) => {
    if (cleanMessage.includes(evento.titolo)) {
      mentionedEvents.push({
        name: evento.titolo,
        date: evento.data,
        time: evento.ora,
      });
    }
  });

  if (mentionedEvents.length > 0 && !structuredData) {
    structuredData = {
      type: "events",
      items: mentionedEvents,
    };
  }

  return {
    cleanMessage,
    suggestions,
    structuredData,
  };
}

module.exports = router;
