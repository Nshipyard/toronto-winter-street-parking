"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "en" | "fr";

const en = {
  banner: {
    line: "An open-source civic project by Nshipyard. Not affiliated with the Government of Canada or the City of Toronto.",
    badge: "Open source",
  },
  nav: { explorer: "Streets", concentration: "Concentration", map: "Map", developers: "Developers", data: "Data", back: "All projects" },
  hero: {
    kicker: "Open Nshipyard · Winter street parking",
    title: "Toronto streets by winter parking revenue at risk",
    lead: "10 streets take 15% of Toronto's winter parking tickets. Danforth Ave carries the most meter revenue at risk, $19K to $517K per winter.",
    sub: "Toronto clears snow from its streets all winter, and a metered spot buried in snow earns nothing. This project counts parking tickets street by street for winter (December to March) and summer (June to September), 2023 to 2025, to find where winter street parking activity concentrates and what paid-parking revenue is at risk on the busiest streets. Tickets are a street parking activity proxy: more tickets on a street means more paid-parking activity and more enforcement there. Ticket counts are counted facts. Dollar figures are estimates from a stated model, and the model is written out in full under Methodology.",
    cta1: "See the street ranking",
    cta2: "Read the methodology",
  },
  statsLabels: [
    "winter tickets counted, December to March, 2023 to 2025 (counted)",
    "streets ranked by winter ticket count (counted)",
    "of all winter tickets were written on the 10 busiest streets (counted)",
    "of all winter tickets were written on the 50 busiest streets (counted)",
  ],
  anchor: {
    kicker: "The anchor numbers",
    title: "What one street parking spot is worth, and what one storm cost.",
    items: [
      {
        value: "$3,224 a year",
        body: "That is what one on-street parking space earns in a year on average. Toronto Parking Authority 2026 budget: $67.7 million of on-street revenue over 21,000 spaces. A spot lost to snow for a full year gives up about that much. Fact, from the budget report.",
      },
      {
        value: "47% closed, 371,000 transactions lost",
        body: "In February 2025, snow removal closed 47% of the Toronto Parking Authority on-street inventory, and the city recorded 371,000 fewer parking transactions. Fact, from the same budget report. Winter is when spots are lost; the street ranking below estimates where that loss concentrates.",
      },
      {
        value: "$6 to repaint, $1.50 to $6.75 an hour to park",
        body: "Repainting one parking stall costs about $6, and the City repaints road markings between June 1 and October 31, two coats. On-street hourly rates run from $1.50 to $6.75 depending on the zone. Facts, from the City and the Parking Authority. The expensive part of a street parking spot is not the paint; it is the paid hours the spot sells.",
      },
    ],
  },
  explorer: {
    kicker: "Street ranking",
    title: "Every street, ranked by winter tickets.",
    body: "Search any street, or scan the 50 busiest. Winter is December to March; summer is June to September; both pool 2023 to 2025. The revenue column is an estimate per winter season (one year) from the model in Methodology. It appears only where a street has at least 100 winter meter tickets over the three winters; below that, the sample is too small and the column says so instead of inventing a number.",
    search: "Search streets, e.g. Yonge, Queen, Keele",
    colStreet: "Street",
    colWinter: "Winter tickets",
    colSummer: "Summer tickets",
    colShare: "Share of city winter",
    colMeter: "Winter meter tickets",
    colRevenue: "Revenue at risk per winter (estimate)",
    notEstimable: "Not estimable: fewer than 100 winter meter tickets",
    tagFact: "Counted",
    tagEstimate: "Estimate",
    showing: "streets shown",
    noResult: "Nothing matches. Try a street name such as Yonge or Danforth.",
  },
  concentration: {
    kicker: "Concentration",
    title: "How much of the city's street parking runs on how few streets.",
    body: "A share is the fraction of all tickets in a season that were written on the busiest streets of that season. Winter and summer are ranked separately, so the same street can sit in both lists or only one. The Gini coefficient runs from 0 (tickets spread evenly over all streets) to 1 (all tickets on one street). All figures in this section are counted from the ticket files, not modelled.",
    winter: "Winter (Dec to Mar)",
    summer: "Summer (Jun to Sep)",
    top10: "share on the top 10 streets",
    top50: "share on the top 50 streets",
    gini: "Gini coefficient across streets",
    tickets: "tickets in the season",
    daysWord: "days",
    streets: "streets with at least one ticket",
    rankTitle: "Cumulative share by rank",
    rankBody: "Read across: the share of the season's tickets written on the top N streets of that season.",
    colTopN: "Top N streets",
    colWinterShare: "Winter share",
    colSummerShare: "Summer share",
    lorenzTitle: "Cumulative share curve",
    lorenzBody: "Each line plots the share of a season's tickets held by the top fraction of streets, largest street first. A curve that climbs steeply at the left means a few streets carry the season. The straight line is perfect equality. Winter is the darker line.",
    lorenzWinter: "Winter",
    lorenzSummer: "Summer",
    lorenzX: "Top fraction of streets",
    lorenzY: "Share of tickets",
  },
  mapSection: {
    kicker: "Map",
    title: "Winter tickets by ward.",
    body: "Street-level parking geometry for Toronto is not public: SenSen holds a closed contract with the Toronto Parking Authority to map street parking, and there is no public stall-level inventory. So the map uses wards. Ward counts include only tickets with a house number that matched a City address point, the same matching the reference parking-tickets project used; street-only tickets appear in the street ranking but cannot be placed in a ward.",
    tickets: "winter tickets",
    shareCity: "of city winter tickets (address-matched)",
    winterOfWard: "of this ward's winter-plus-summer tickets fell in winter",
    fewer: "Fewer",
    more: "More winter tickets (log scale)",
  },
  developers: {
    kicker: "For developers",
    title: "Query it from code, or from an agent.",
    body: "Three consumption paths, same canonical data. REST for applications, OpenAPI for integration, MCP tools over streamable HTTP for AI agents.",
    endpoints: "Endpoints",
    tryIt: "Try it",
    openapi: "OpenAPI spec",
  },
  downloads: {
    kicker: "Data",
    title: "Take the files.",
    body: "MIT licensed. street_season.csv carries one row per street with winter and summer ticket counts, winter meter tickets, and the revenue-at-risk range or an explicit not-estimable flag. The per-ticket source files stay with the City of Toronto open data portal.",
    download: "Download",
  },
  methodology: {
    kicker: "Methodology",
    title: "How the numbers were built, and what they cannot say.",
    points: [
      "Slice: City of Toronto open data, Parking Tickets, calendar years 2023 to 2025, retrieved 2026-10-08: 6,454,695 tickets. Winter is the months December, January, February, March (364 days in the slice). Summer is June, July, August, September (366 days). The two seasons differ by two days, so raw counts are compared directly and the day counts are stated wherever totals appear.",
      "Street for each ticket: the ticket field location2 holds either a house number plus street (642 KING ST W) or a street alone (LOWTHER AVE, used at intersections). The script strips any leading house number, normalizes street-type spellings (STREET becomes ST, AVENUE becomes AVE), and counts the ticket to that street. Street-only tickets are included: a ticket at an intersection still records activity on that street. This differs from the reference project, which counted only address-matched tickets, so street totals here are higher than the reference project's totals for the same street. The script is scripts/build_winter.py and its header repeats every rule in this section.",
      "Tickets are a proxy, and the proxy has known flaws. A street can rank high because many drivers park there, because officers patrol there often, or both; the data cannot separate the two. Tickets for parking on private property (infraction code 3, the single largest code citywide) record lot enforcement, not street parking use, and they are included in street ticket counts. That is why dollar estimates below are built only from meter tickets, never from total tickets.",
      "Revenue model, inputs that are facts: the Toronto Parking Authority 2026 Operating Budget report gives on-street revenue of $67.7 million over 21,000 spaces, and a 2025 forecast of $177.3 million on 32.4 million transactions, a blended $5.47 per transaction. Dividing on-street revenue by the blended rate gives about 12.37 million on-street transactions a year. One lost on-street space forgoes $67.7 million divided by 21,000, about $3,224 a year.",
      "Revenue model, input measured from this dataset: meter tickets are infraction codes 207, 312, 313 and 314 (parking machine fee not paid, machine not used, fail to activate machine, not within paid period). The script counts them across all of 2023 to 2025 and divides the on-street transactions above by meter tickets per year. The result, printed in summary.json, is the number of paid on-street sessions standing behind each meter ticket, about 33. Every street estimate scales from its own winter meter tickets using that one conversion.",
      "Revenue model, stated assumptions (judgment calls, set wide on purpose): a paid session lasts 1.0 to 2.0 hours; snow makes 5% to 15% of winter meter-hours unusable on an average street over a full winter (in February 2025 one storm closed 47% of on-street inventory, but a full-winter average is far below a storm peak); the hourly rate spans the full Toronto Parking Authority band, $1.50 to $6.75. Per street and per winter season: low estimate = winter meter tickets per year, times sessions per meter ticket, times 1.0 hour, times 5%, times $1.50. High estimate = the same with 2.0 hours, 15%, and $6.75. The band is wide because the inputs are uncertain; a narrower band would claim precision the data does not have.",
      "Estimability rule: a street needs at least 100 winter meter tickets over the three winters before the conversion is applied. Below that, the dataset reports the street's activity share and marks revenue as not estimable. In the ranking table, 300 streets are listed; the CSV carries every street.",
      "Ward map: tickets with a house number were matched to the City's Address Points file on house number plus normalized street, and the address point supplies the ward. Street-only tickets and addresses the file does not contain cannot be placed, so ward totals are lower than street totals. The match covers the large majority of winter tickets; the exact matched counts are in summary.json.",
      "What this cannot answer: how many physical stalls a street has (no public stall-level inventory exists; SenSen's street parking mapping for the Parking Authority is closed), how much revenue any single street actually collected (the Parking Authority does not publish street-level revenue), or whether clearing a given street first would recover the estimated amounts (that depends on plow routes, parking demand during storms, and enforcement during storms, none of which are in this data). Treat the ranking as a statement about where ticketed street parking activity concentrates in winter, and the dollar bands as the size of paid-parking activity that winter weather puts at risk on those streets, under the stated assumptions.",
    ],
  },
  footer: {
    line: "An open-source civic project by Nshipyard. Not affiliated with the Government of Canada or the City of Toronto.",
    sources: "Ticket source: City of Toronto Open Data (Parking Tickets). Addresses: Address Points (Municipal), Toronto One Address Repository. Boundaries: City of Toronto Open Data (City Wards). Budget figures: Toronto Parking Authority 2026 Operating Budget report (toronto.ca/legdocs/mmis/2025/pa/bgrd/backgroundfile-260741.pdf). Repainting season: toronto.ca pavement markings page.",
  },
  mcp: {
    kicker: "Connect your agent",
    title: "Put this data to work inside your AI tools.",
    body: "Pick your harness, copy the prompt, send it to your agent. Your agent runs the setup itself.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Other" },
    cardTitle: "Copy and send this to {tab}",
    copy: "Copy",
    copied: "Copied",
    chatgptNote: "ChatGPT connects through the documented REST API rather than MCP directly.",
    pChatgpt:
      "I want to use the {displayName} through its API.\n- OpenAPI spec: {origin}/api/openapi.json\n- REST base: {origin}/api/v1\nFirst tell me in two sentences what this API offers, then {exampleLower}, and show me the result.",
    pClaude:
      "In Claude (claude.ai), open Settings, then Connectors, and add a custom connector:\n- Name: {displayName}\n- URL: {origin}/mcp\nThen list the available tools, {exampleLower}, and show me the result.",
    pClaudeCode:
      "Set up the {displayName} MCP server so I can query it from here.\n1. Run: claude mcp add --transport http {slug} {origin}/mcp\n2. Run `claude mcp list` to confirm it connected.\n3. {example}, and show me the result.",
    pCli:
      "# MCP endpoint (streamable HTTP)\n{origin}/mcp\n\n# List the available tools\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Everything else",
    otherBody: "Any harness that speaks MCP over streamable HTTP, or plain REST.",
    mcpEndpoint: "MCP endpoint",
    openapiSpec: "OpenAPI spec",
    restBase: "REST base",
  },
};

export type Dict = typeof en;

const fr: Dict = {
  banner: {
    line: "Un projet civique à code source ouvert par Nshipyard. Sans affiliation avec le gouvernement du Canada ni la Ville de Toronto.",
    badge: "Code source ouvert",
  },
  nav: { explorer: "Rues", concentration: "Concentration", map: "Carte", developers: "Développeurs", data: "Données", back: "Tous les projets" },
  hero: {
    kicker: "Open Nshipyard · Économie du stationnement sur rue",
    title: "Rues de Toronto selon les revenus de stationnement hivernaux à risque",
    lead: "10 rues recueillent 15 % des contraventions de stationnement hivernales de Toronto. Danforth Ave porte le plus de revenus de parcomètres à risque, de 19 000 $ à 517 000 $ par hiver.",
    sub: "Toronto déneige ses rues tout l'hiver, et une place avec parcomètre ensevelie sous la neige ne rapporte rien. Ce projet compte les contraventions de stationnement rue par rue pour l'hiver (décembre à mars) et l'été (juin à septembre), de 2023 à 2025, pour trouver où se concentre l'activité hivernale du stationnement sur rue et quels revenus de stationnement payant sont à risque dans les rues les plus achalandées. Les contraventions sont un indicateur de l'activité de stationnement sur rue : plus il y a de contraventions dans une rue, plus il y a d'activité de stationnement payant et de contrôle. Les comptes de contraventions sont des faits comptés. Les montants en dollars sont des estimations tirées d'un modèle énoncé, décrit en entier dans la section Méthodologie.",
    cta1: "Voir le classement des rues",
    cta2: "Lire la méthodologie",
  },
  statsLabels: [
    "contraventions d'hiver comptées, de décembre à mars, 2023 à 2025 (compté)",
    "rues classées selon leur nombre de contraventions d'hiver (compté)",
    "de toutes les contraventions d'hiver ont été émises dans les 10 rues les plus achalandées (compté)",
    "de toutes les contraventions d'hiver ont été émises dans les 50 rues les plus achalandées (compté)",
  ],
  anchor: {
    kicker: "Les chiffres de référence",
    title: "Ce que vaut une place sur rue, et ce qu'une tempête a coûté.",
    items: [
      {
        value: "3 224 $ par année",
        body: "C'est ce qu'une place de stationnement sur rue rapporte en moyenne en un an. Budget 2026 de la Toronto Parking Authority : 67,7 millions de dollars de revenus sur rue pour 21 000 places. Une place perdue à la neige pour un an entier renonce à environ ce montant. Fait, tiré du rapport budgétaire.",
      },
      {
        value: "47 % fermées, 371 000 transactions perdues",
        body: "En février 2025, le déneigement a fermé 47 % de l'inventaire sur rue de la Toronto Parking Authority, et la ville a enregistré 371 000 transactions de stationnement de moins. Fait, tiré du même rapport budgétaire. C'est l'hiver que les places se perdent; le classement ci-dessous estime où cette perte se concentre.",
      },
      {
        value: "6 $ pour repeindre, 1,50 $ à 6,75 $ l'heure pour stationner",
        body: "Repeindre une case de stationnement coûte environ 6 $, et la Ville repeint le marquage routier entre le 1er juin et le 31 octobre, en deux couches. Les tarifs horaires sur rue vont de 1,50 $ à 6,75 $ selon la zone. Faits, de la Ville et de la Parking Authority. La partie coûteuse d'une place n'est pas la peinture; ce sont les heures payées qu'elle vend.",
      },
    ],
  },
  explorer: {
    kicker: "Classement des rues",
    title: "Chaque rue, classée par contraventions d'hiver.",
    body: "Recherchez une rue, ou parcourez les 50 plus achalandées. L'hiver va de décembre à mars; l'été, de juin à septembre; les deux regroupent 2023 à 2025. La colonne des revenus est une estimation par saison d'hiver (un an) tirée du modèle de la Méthodologie. Elle n'apparaît que lorsqu'une rue compte au moins 100 contraventions liées aux parcomètres en hiver sur les trois hivers; en dessous, l'échantillon est trop petit et la colonne le dit au lieu d'inventer un chiffre.",
    search: "Rechercher une rue, p. ex. Yonge, Queen, Keele",
    colStreet: "Rue",
    colWinter: "Contraventions d'hiver",
    colSummer: "Contraventions d'été",
    colShare: "Part de l'hiver de la ville",
    colMeter: "Contraventions parcomètre (hiver)",
    colRevenue: "Revenu à risque par hiver (estimation)",
    notEstimable: "Non estimable : moins de 100 contraventions parcomètre en hiver",
    tagFact: "Compté",
    tagEstimate: "Estimation",
    showing: "rues affichées",
    noResult: "Aucun résultat. Essayez un nom de rue comme Yonge ou Danforth.",
  },
  concentration: {
    kicker: "Concentration",
    title: "Quelle part du stationnement sur rue tient à combien de rues.",
    body: "Une part est la fraction de toutes les contraventions d'une saison émises dans les rues les plus achalandées de cette saison. L'hiver et l'été sont classés séparément. Le coefficient de Gini va de 0 (contraventions réparties également entre toutes les rues) à 1 (toutes les contraventions dans une seule rue). Tous les chiffres de cette section sont comptés dans les fichiers de contraventions, pas modélisés.",
    winter: "Hiver (déc. à mars)",
    summer: "Été (juin à sept.)",
    top10: "part des 10 premières rues",
    top50: "part des 50 premières rues",
    gini: "Coefficient de Gini entre les rues",
    tickets: "contraventions dans la saison",
    daysWord: "jours",
    streets: "rues avec au moins une contravention",
    rankTitle: "Part cumulative selon le rang",
    rankBody: "À lire en ligne : la part des contraventions de la saison émises dans les N premières rues de cette saison.",
    colTopN: "N premières rues",
    colWinterShare: "Part hiver",
    colSummerShare: "Part été",
    lorenzTitle: "Courbe de part cumulative",
    lorenzBody: "Chaque ligne trace la part des contraventions d'une saison détenue par la fraction supérieure des rues, de la plus grande rue vers le bas. Une courbe qui monte vite à gauche signifie que quelques rues portent la saison. La ligne droite est l'égalité parfaite. L'hiver est la ligne foncée.",
    lorenzWinter: "Hiver",
    lorenzSummer: "Été",
    lorenzX: "Fraction supérieure des rues",
    lorenzY: "Part des contraventions",
  },
  mapSection: {
    kicker: "Carte",
    title: "Contraventions d'hiver par arrondissement.",
    body: "La géométrie des rues de Toronto n'est pas publique : SenSen détient un contrat fermé de cartographie du stationnement sur rue avec la Toronto Parking Authority, et il n'existe aucun inventaire public au niveau de la case. La carte utilise donc les arrondissements. Les comptes par arrondissement ne comprennent que les contraventions avec un numéro civique apparié à un point d'adresse de la Ville, le même appariement que le projet de référence; les contraventions sans numéro figurent au classement des rues mais ne peuvent pas être placées dans un arrondissement.",
    tickets: "contraventions d'hiver",
    shareCity: "des contraventions d'hiver de la ville (appariées à une adresse)",
    winterOfWard: "des contraventions hiver plus été de cet arrondissement sont tombées en hiver",
    fewer: "Moins",
    more: "Plus de contraventions d'hiver (échelle log)",
  },
  developers: {
    kicker: "Pour les développeurs",
    title: "Interrogez-les depuis du code, ou depuis un agent.",
    body: "Trois façons de consommer les mêmes données canoniques. REST pour les applications, OpenAPI pour l'intégration, outils MCP en HTTP continu pour les agents IA.",
    endpoints: "Points de terminaison",
    tryIt: "Essayer",
    openapi: "Spécification OpenAPI",
  },
  downloads: {
    kicker: "Données",
    title: "Prenez les fichiers.",
    body: "Licence MIT. street_season.csv contient une ligne par rue avec les comptes de contraventions d'hiver et d'été, les contraventions parcomètre d'hiver, et la fourchette de revenus à risque ou un marqueur explicite de non-estimabilité. Les fichiers sources par contravention restent sur le portail de données ouvertes de la Ville de Toronto.",
    download: "Télécharger",
  },
  methodology: {
    kicker: "Méthodologie",
    title: "Comment les chiffres ont été construits, et ce qu'ils ne peuvent pas dire.",
    points: [
      "Tranche : données ouvertes de la Ville de Toronto, contraventions de stationnement, années civiles 2023 à 2025, récupérées le 2026-10-08 : 6 454 695 contraventions. L'hiver couvre décembre, janvier, février et mars (364 jours dans la tranche). L'été couvre juin, juillet, août et septembre (366 jours). Les deux saisons diffèrent de deux jours, donc les comptes bruts sont comparés directement et les nombres de jours sont indiqués partout où des totaux apparaissent.",
      "Rue de chaque contravention : le champ location2 contient soit un numéro civique suivi de la rue (642 KING ST W), soit la rue seule (LOWTHER AVE, utilisée aux intersections). Le script retire tout numéro civique initial, normalise l'orthographe des types de rue (STREET devient ST, AVENUE devient AVE), et attribue la contravention à cette rue. Les contraventions sans numéro sont incluses : une contravention à une intersection signale quand même une activité dans cette rue. Cela diffère du projet de référence, qui ne comptait que les contraventions appariées à une adresse, donc les totaux par rue sont ici plus élevés. Le script est scripts/build_winter.py et son en-tête répète chaque règle de cette section.",
      "Les contraventions sont un indicateur, et cet indicateur a des limites connues. Une rue peut arriver en tête parce que beaucoup de conducteurs y stationnent, parce que les agents y patrouillent souvent, ou les deux; les données ne permettent pas de séparer les deux. Les contraventions pour stationnement sur propriété privée (code d'infraction 3, le code le plus fréquent à l'échelle de la ville) relèvent du contrôle des terrains, pas de l'usage du stationnement sur rue, et elles sont incluses dans les comptes par rue. C'est pourquoi les estimations en dollars ci-dessous sont construites uniquement à partir des contraventions liées aux parcomètres, jamais des totaux.",
      "Modèle de revenu, intrants qui sont des faits : le rapport budgétaire 2026 de la Toronto Parking Authority donne des revenus sur rue de 67,7 millions de dollars pour 21 000 places, et une prévision 2025 de 177,3 millions de dollars pour 32,4 millions de transactions, soit 5,47 $ par transaction en moyenne. Diviser les revenus sur rue par ce taux moyen donne environ 12,37 millions de transactions sur rue par année. Une place sur rue perdue renonce à 67,7 millions divisés par 21 000, environ 3 224 $ par année.",
      "Modèle de revenu, intrant mesuré dans ce jeu de données : les contraventions parcomètre sont les codes 207, 312, 313 et 314 (frais de machine non payés, machine non utilisée, défaut d'activation, période payée dépassée). Le script les compte sur 2023 à 2025 et divise les transactions sur rue ci-dessus par les contraventions parcomètre par année. Le résultat, imprimé dans summary.json, est le nombre de sessions payées sur rue derrière chaque contravention parcomètre, environ 33. Chaque estimation par rue part de ses propres contraventions parcomètre d'hiver avec cette seule conversion.",
      "Modèle de revenu, hypothèses énoncées (choix de jugement, volontairement larges) : une session payée dure de 1,0 à 2,0 heures; la neige rend inutilisables de 5 % à 15 % des heures-parcomètre d'hiver dans une rue moyenne sur un hiver complet (en février 2025, une seule tempête a fermé 47 % de l'inventaire sur rue, mais une moyenne sur tout l'hiver est bien en dessous d'un sommet de tempête); le tarif horaire couvre toute la fourchette de la Toronto Parking Authority, de 1,50 $ à 6,75 $. Par rue et par saison d'hiver : estimation basse = contraventions parcomètre d'hiver par année, fois les sessions par contravention, fois 1,0 heure, fois 5 %, fois 1,50 $. Estimation haute = la même chose avec 2,0 heures, 15 % et 6,75 $. La fourchette est large parce que les intrants sont incertains; une fourchette plus étroite prétendrait à une précision que les données n'ont pas.",
      "Règle d'estimabilité : une rue doit compter au moins 100 contraventions parcomètre d'hiver sur les trois hivers avant que la conversion soit appliquée. En dessous, le jeu de données donne la part d'activité de la rue et marque le revenu comme non estimable. Le tableau de classement liste 300 rues; le CSV contient toutes les rues.",
      "Carte des arrondissements : les contraventions avec un numéro civique ont été appariées au fichier des points d'adresse de la Ville sur le numéro civique plus le nom de rue normalisé, et le point d'adresse fournit l'arrondissement. Les contraventions sans numéro et les adresses absentes du fichier ne peuvent pas être placées, donc les totaux par arrondissement sont inférieurs aux totaux par rue. Les comptes appariés exacts sont dans summary.json.",
      "Ce que cela ne peut pas répondre : combien de cases physiques compte une rue (aucun inventaire public au niveau de la case n'existe; la cartographie de SenSen pour la Parking Authority est fermée), combien de revenus une rue donnée a réellement rapportés (la Parking Authority ne publie pas de revenus par rue), ni si déneiger une rue donnée en premier récupérerait les montants estimés (cela dépend des trajets de déneigement, de la demande pendant les tempêtes et du contrôle pendant les tempêtes, dont rien ne figure dans ces données).",
    ],
  },
  footer: {
    line: "Un projet civique à code source ouvert par Nshipyard. Sans affiliation avec le gouvernement du Canada ni la Ville de Toronto.",
    sources: "Source des contraventions : Données ouvertes de la Ville de Toronto (contraventions de stationnement). Adresses : Points d'adresse (municipal), Toronto One Address Repository. Limites : Données ouvertes de la Ville de Toronto (arrondissements). Chiffres budgétaires : rapport du budget de fonctionnement 2026 de la Toronto Parking Authority (toronto.ca/legdocs/mmis/2025/pa/bgrd/backgroundfile-260741.pdf). Saison de repeinture : page du marquage routier de toronto.ca.",
  },
  mcp: {
    kicker: "Connectez votre agent",
    title: "Exploitez ces données dans vos outils d'IA.",
    body: "Choisissez votre plateforme, copiez l'invite, envoyez-la à votre agent. Votre agent exécute la configuration lui-même.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Autre" },
    cardTitle: "Copiez et envoyez ceci à {tab}",
    copy: "Copier",
    copied: "Copié",
    chatgptNote: "ChatGPT se connecte par l'API REST documentée plutôt que par MCP directement.",
    pChatgpt:
      "Je veux utiliser {displayName} par son API.\n- Spécification OpenAPI : {origin}/api/openapi.json\n- Base REST : {origin}/api/v1\nDis-moi d'abord en deux phrases ce que cette API offre, puis {exampleLower}, et montre-moi le résultat.",
    pClaude:
      "Dans Claude (claude.ai), ouvre Paramètres, puis Connecteurs, et ajoute un connecteur personnalisé :\n- Nom : {displayName}\n- URL : {origin}/mcp\nEnsuite, liste les outils disponibles, {exampleLower}, et montre-moi le résultat.",
    pClaudeCode:
      "Configure le serveur MCP {displayName} pour que je puisse l'interroger d'ici.\n1. Exécute : claude mcp add --transport http {slug} {origin}/mcp\n2. Exécute `claude mcp list` pour confirmer la connexion.\n3. {example}, et montre-moi le résultat.",
    pCli:
      "# Point de terminaison MCP (HTTP continu)\n{origin}/mcp\n\n# Lister les outils disponibles\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Tout le reste",
    otherBody: "Toute plateforme qui parle MCP en HTTP continu, ou REST ordinaire.",
    mcpEndpoint: "Point de terminaison MCP",
    openapiSpec: "Spécification OpenAPI",
    restBase: "Base REST",
  },
};

const dicts: Record<Lang, Dict> = { en, fr };

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const Ctx = createContext<LangCtx>({ lang: "en", setLang: () => {}, t: en });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = window.localStorage.getItem("winter-curb-lang");
    if (saved === "fr" || saved === "en") setLangState(saved);
  }, []);
  function setLang(l: Lang) {
    setLangState(l);
    window.localStorage.setItem("winter-curb-lang", l);
  }
  return <Ctx.Provider value={{ lang, setLang, t: dicts[lang] }}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  return useContext(Ctx);
}
