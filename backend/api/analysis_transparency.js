import express from 'express';

const router = express.Router();

/**
 * Analysis Transparency Endpoint
 * 
 * This endpoint provides comprehensive transparency documentation about how each analysis
 * method works, including calculation methods, algorithms, and logic used for:
 * - Tone Analysis
 * - Bias Detection
 * - Fact Checking
 * - Meta-Analysis (NLP + Sentiment)
 * 
 * Purpose: Enable users and developers to understand exactly how AI responses are analyzed,
 * promoting full transparency and trust in the analysis results.
 */

/**
 * GET /api/analysis-transparency/methods
 * Returns documentation of all analysis methods and calculation approaches
 */
router.get('/methods', (req, res) => {
  res.json({
    methods: {
      toneAnalysis: {
        name: 'Tonanalys',
        description: 'Analyserar tonalitet och stil i AI-svaren genom att identifiera nyckelord och mönster.',
        
        methodology: {
          approach: 'Keyword-baserad semantisk analys',
          steps: [
            {
              step: 1,
              name: 'Nyckelordsidentifiering',
              description: 'Texten genomsöks efter specifika nyckelord kopplade till olika toner (formell, informell, teknisk, empatisk, analytisk, övertygande).',
              example: 'Ord som "således", "emellertid", "följaktligen" indikerar formell ton.'
            },
            {
              step: 2,
              name: 'Poängsättning',
              description: 'Varje identifierat nyckelord ökar poängen för motsvarande ton-kategori.',
              formula: 'tone_score[category] += 1 för varje matchande nyckelord'
            },
            {
              step: 3,
              name: 'Strukturanalys',
              description: 'Analyserar textstrukturer som frågetecken och listor för att identifiera ytterligare ton-karakteristika.',
              details: [
                'Frågetecken ökar empatisk ton',
                'Listor (>2 items) ökar analytisk ton med +2 poäng'
              ]
            },
            {
              step: 4,
              name: 'Dominant ton-beräkning',
              description: 'Den ton med högst poäng väljs som primär ton.',
              formula: 'primary_tone = max(tone_scores)'
            },
            {
              step: 5,
              name: 'Konfidensberäkning',
              description: 'Konfidensnivån beräknas baserat på dominans och textlängd.',
              formula: 'confidence = 0.5 + ((max_score / total_scores) * (min(word_count / 200, 1)) * 0.45)',
              range: '0.5 - 0.95 (50% - 95%)'
            }
          ],
          
          categories: [
            { tone: 'formal', keywords: ['således', 'emellertid', 'följaktligen', 'dessutom', 'däremot', 'härigenom'] },
            { tone: 'informal', keywords: ['typ', 'liksom', 'typ av', 'ganska', 'rätt så'] },
            { tone: 'technical', keywords: ['algoritm', 'system', 'process', 'struktur', 'implementation', 'parameter', 'funktion'] },
            { tone: 'empathetic', keywords: ['förstå', 'känner', 'upplevelse', 'viktigt att', 'respekt', 'hänsyn'] },
            { tone: 'analytical', keywords: ['analys', 'faktorer', 'påverkar', 'resultat', 'därför', 'eftersom', 'beror på'] },
            { tone: 'persuasive', keywords: ['bör', 'måste', 'nödvändigt', 'avgörande', 'essentiellt', 'rekommenderar'] }
          ]
        },
        
        outputFormat: {
          primary: 'string (ton-kategori)',
          confidence: 'number (0.5-0.95)',
          characteristics: 'array (top 3 toner med poäng)'
        },
        
        limitations: [
          'Baseras på svenska nyckelord, fungerar bäst för svenska texter',
          'Kan missa subtila ton-nyanser som kräver djupare semantisk förståelse',
          'Konfidensen ökar med textlängd, korta texter får lägre konfidenspoäng'
        ]
      },
      
      biasDetection: {
        name: 'Bias-detektion',
        description: 'Identifierar potentiella fördomar i AI-svaren genom att söka efter ord och fraser kopplade till olika typer av bias.',
        
        methodology: {
          approach: 'Multi-dimensionell keyword-analys med riktningsdetektering',
          biasTypes: [
            {
              type: 'political',
              name: 'Politisk bias',
              description: 'Detekterar vänster- eller högerorienterade formuleringar.',
              leftKeywords: ['jämlikhet', 'välfärd', 'solidaritet', 'omfördelning', 'kollektiv'],
              rightKeywords: ['frihet', 'individuell', 'konkurrens', 'marknad', 'privat'],
              calculation: 'Om left_count > right_count + 2, markeras vänsterbias med styrka (left_count - right_count)',
              threshold: 'Skillnad på minst 3 nyckelord krävs för att detektera riktning'
            },
            {
              type: 'commercial',
              name: 'Kommersiell bias',
              description: 'Identifierar produktrekommendationer eller marknadsföring.',
              keywords: ['köp', 'produkt', 'tjänst', 'erbjudande', 'brand', 'företag som', 'rekommenderar att köpa'],
              calculation: 'Poäng ökas för varje kommersiellt nyckelord',
              threshold: 'Minst 2 förekomster krävs för detektion'
            },
            {
              type: 'cultural',
              name: 'Kulturell bias',
              description: 'Detekterar västerländska eller icke-västerländska perspektiv.',
              westernKeywords: ['västerländsk', 'europeisk', 'amerikansk', 'väst'],
              nonWesternKeywords: ['österländsk', 'asiatisk', 'afrikansk', 'latinamerikansk'],
              calculation: 'Om western_count > non_western_count + 1, markeras västerländsk bias',
              threshold: 'Skillnad på minst 2 nyckelord krävs'
            },
            {
              type: 'confirmation',
              name: 'Bekräftelsebias',
              description: 'Identifierar påståenden presenterade som självklara sanningar.',
              keywords: ['uppenbarligen', 'självklart', 'alla vet', 'det är känt att', 'naturligtvis'],
              calculation: 'Varje förekomst ökar poängen direkt',
              threshold: 'Minst 1 förekomst krävs'
            },
            {
              type: 'recency',
              name: 'Recency bias',
              description: 'Fokuserar på nyhet över relevans.',
              keywords: ['nyligen', 'senaste', 'modern', 'traditionell', 'gammal', 'föråldrad'],
              calculation: 'Poäng = antal nyckelord - 2 (justerat)',
              threshold: 'Minst 3 förekomster krävs för detektion'
            }
          ],
          
          severityCalculation: {
            description: 'Allvarlighetsgrad beräknas baserat på poäng för varje bias-typ',
            levels: [
              { severity: 'low', range: 'score <= 1', numericScore: 1 },
              { severity: 'medium', range: '1 < score <= 3', numericScore: 2 },
              { severity: 'high', range: 'score > 3', numericScore: 3 }
            ]
          },
          
          overallBiasScore: {
            description: 'Total bias-poäng summeras från alla detekterade bias-typer',
            formula: 'total_bias_score = sum(severity_to_score(bias.severity) for all detected_biases)',
            maximum: 10,
            interpretation: [
              { range: '0-2', level: 'minimal', description: 'Mycket låg eller ingen bias' },
              { range: '3-5', level: 'moderate', description: 'Måttlig bias som bör noteras' },
              { range: '6-10', level: 'high', description: 'Signifikant bias som påverkar objektivitet' }
            ]
          }
        },
        
        outputFormat: {
          overallBias: 'string (minimal/detected)',
          biasScore: 'number (0-10)',
          detectedBiases: 'array av objekt med type, severity, direction?, description'
        },
        
        limitations: [
          'Baseras på nyckelord och kan missa kontext-beroende bias',
          'Vissa ord kan ha olika betydelser i olika sammanhang',
          'Subtila bias uttryckta utan specifika nyckelord kan missas'
        ]
      },
      
      factChecking: {
        name: 'Faktakoll',
        description: 'Identifierar verifierbara påståenden som bör kontrolleras mot externa källor.',
        
        methodology: {
          approach: 'Pattern-matching för olika typer av påståenden',
          claimTypes: [
            {
              type: 'statistical',
              name: 'Statistiska påståenden',
              patterns: ['procent', '%', 'av befolkningen', 'statistik visar'],
              description: 'Identifierar numeriska data och statistik som kan verifieras'
            },
            {
              type: 'temporal',
              name: 'Tidsbundna påståenden',
              patterns: ['år', 'sedan', 'i [årtal]', 'under [period]'],
              description: 'Identifierar referenser till specifika tider eller perioder'
            },
            {
              type: 'scientific',
              name: 'Vetenskapliga påståenden',
              patterns: ['forskning visar', 'studier tyder på', 'vetenskapen säger'],
              description: 'Identifierar hänvisningar till vetenskaplig forskning'
            },
            {
              type: 'historical',
              name: 'Historiska påståenden',
              patterns: ['historiskt', 'i historien', 'tidigare', 'förr'],
              description: 'Identifierar historiska fakta och händelser'
            },
            {
              type: 'definitive',
              name: 'Definitiva påståenden',
              patterns: ['alltid', 'aldrig', 'alla', 'ingen'],
              description: 'Identifierar absoluta utsagor som kräver verifiering'
            }
          ],
          
          calculation: {
            description: 'Räknar antal mönster-matchningar för varje påståendetyp',
            formula: 'claims_found = count(all_pattern_matches)',
            recommendationThreshold: 'Om claims_found >= 3, rekommenderas verifiering via externa källor'
          }
        },
        
        outputFormat: {
          claimsFound: 'number (antal påståenden)',
          needsVerification: 'boolean',
          recommendation: 'string (rekommendation till användaren)',
          claimTypes: 'array (identifierade påståendetyper)'
        },
        
        limitations: [
          'Identifierar endast påståenden, utför inte faktisk verifiering',
          'Kan markera harmlösa fraser som påståenden',
          'Beroende av specifika mönster, kan missa kreativt formulerade påståenden'
        ],
        
        externalVerification: {
          description: 'För faktisk verifiering används Tavily Search API',
          note: 'Detta är en separat process som kör efter initial faktakoll-identifiering'
        }
      },
      
      metaAnalysis: {
        name: 'Meta-analys (NLP + Sentiment)',
        description: 'Avancerad textanalys som kombinerar NLP-statistik och sentimentanalys.',
        
        components: [
          {
            name: 'NLP-analys',
            description: 'Grundläggande textstatistik och språkliga egenskaper',
            metrics: [
              {
                metric: 'sentences',
                description: 'Antal meningar i texten',
                calculation: 'Räknar punkt-separerade segment'
              },
              {
                metric: 'words',
                description: 'Antal ord i texten',
                calculation: 'Räknar whitespace-separerade tokens'
              },
              {
                metric: 'avgWordLength',
                description: 'Genomsnittlig ordlängd',
                formula: 'sum(word_lengths) / word_count'
              },
              {
                metric: 'readability',
                description: 'Läsbarhetsnivå baserad på menings- och ordlängd',
                interpretation: 'Högre värde = mer komplex text'
              }
            ]
          },
          {
            name: 'Sentimentanalys',
            description: 'Känslomässig ton i texten',
            approach: 'Använder sentiment-bibliotek för att analysera känslomässig valör',
            outputs: [
              {
                field: 'sentiment',
                values: ['positive', 'negative', 'neutral'],
                description: 'Övergripande känslomässig ton'
              },
              {
                field: 'score',
                range: '-5 till +5',
                description: 'Numeriskt sentimentvärde (negativt till positivt)'
              },
              {
                field: 'comparative',
                description: 'Sentiment normaliserat per ord',
                formula: 'score / word_count'
              }
            ]
          }
        ],
        
        outputFormat: {
          nlp: 'object med sentences, words, avgWordLength, readability',
          sentiment: 'object med sentiment, score, comparative'
        }
      }
    },
    
    standoutDataIdentification: {
      description: 'Hur systemet identifierar data som påverkar analysen mest',
      factors: [
        {
          factor: 'Höga poäng i bias-detektion',
          impact: 'Bias-poäng över 5/10 markeras som signifikanta',
          visualization: 'Röd färgkodning för hög bias'
        },
        {
          factor: 'Låg konfidensval i tonanalys',
          impact: 'Konfidensval under 60% indikerar osäkerhet i ton-klassificering',
          visualization: 'Lägre konfidensprocenttal visas'
        },
        {
          factor: 'Många verifierbara påståenden',
          impact: 'Fler än 3 påståenden triggar rekommendation om verifiering',
          visualization: 'Varningsmeddelande om faktagranskning'
        },
        {
          factor: 'Extrema sentimentvärden',
          impact: 'Sentiment-poäng nära -5 eller +5 indikerar stark känslomässig laddning',
          visualization: 'Färgkodning: röd (negativ), grön (positiv)'
        }
      ]
    },
    
    dataSync: {
      description: 'Hur data hålls synkroniserad med logik- och specifikationsändringar',
      approach: [
        'Alla analysmetoder är definierade i backend/utils-moduler',
        'Ändringar i analyslogik reflekteras automatiskt i API-svar',
        'Frontend konsumerar alltid färsk data från backend utan cachning',
        'Denna transparency-endpoint uppdateras manuellt när metodologier ändras'
      ],
      recommendation: 'Vid ändringar av analyslogik, uppdatera både kod och denna dokumentation'
    },
    
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/analysis-transparency/agent/:agentId
 * Returns analysis transparency data for a specific AI agent's response
 * Including what specific data influenced the analysis
 * 
 * @param agentId - The AI agent identifier (gpt-3.5, gemini, deepseek, grok, qwen)
 */
router.get('/agent/:agentId', (req, res) => {
  const { agentId } = req.params;
  
  // This would typically fetch the actual analysis data for the agent
  // For now, we return the structure that explains what would be shown
  res.json({
    agentId,
    transparencyData: {
      description: `Transparensdata för ${agentId}-analys`,
      note: 'Denna endpoint visar vilka specifika data som påverkade analysen för denna agent.',
      
      analysisBreakdown: {
        toneAnalysis: {
          keywordsFound: 'Lista över identifierade nyckelord per kategori',
          scores: 'Poäng för varje ton-kategori',
          dominantFactor: 'Vilken faktor som avgjorde den primära tonen',
          confidenceCalculation: 'Detaljerad förklaring av konfidensberäkningen'
        },
        biasDetection: {
          matchedKeywords: 'Lista över matchade bias-nyckelord',
          scoresPerType: 'Poäng per bias-typ',
          thresholdComparison: 'Jämförelse mot tröskelvärden',
          triggeredBiases: 'Vilka bias-typer som triggades och varför'
        },
        factChecking: {
          identifiedClaims: 'Lista över identifierade påståenden',
          patternMatches: 'Vilka mönster som matchades',
          verificationSources: 'Källor använda för verifiering (om Tavily kördes)'
        }
      },
      
      standoutData: {
        description: 'Data som påverkade analysen mest för denna agent',
        factors: [
          'Högsta bias-poäng och vilken typ',
          'Tonkonfidensval och varför',
          'Antal kritiska påståenden identifierade',
          'Sentiment-extremvärden'
        ]
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/analysis-transparency/comparison
 * Returns transparency information about how multiple agents' analyses are compared
 */
router.get('/comparison', (req, res) => {
  res.json({
    description: 'Transparensdata för jämförelse mellan AI-agenter',
    
    comparisonMethodology: {
      metaReview: {
        name: 'GPT-3.5 Meta-granskning',
        description: 'Använder GPT-3.5 för att granska och jämföra alla AI-svar',
        process: [
          'Alla AI-svar skickas till GPT-3.5 med en specifik granskningsprompt',
          'GPT-3.5 bedömer konsistens mellan svar (0-10 skala)',
          'GPT-3.5 bedömer övergripande kvalitet (0-10 skala)',
          'GPT-3.5 identifierar gemensamma bias-mönster',
          'GPT-3.5 rekommenderar bästa agent baserat på kvalitet och relevans'
        ],
        outputs: [
          'metaSummary: Sammanfattande bedömning av alla svar',
          'consistency: Konsistenspoäng (0-10)',
          'overallQuality: Kvalitetspoäng (0-10)',
          'recommendedAgent: Rekommenderad agent med motivering',
          'warnings: Lista över identifierade problem',
          'biasPatterns: Gemensamma bias-mönster över alla svar'
        ]
      },
      
      factCheckComparison: {
        name: 'Tavily Search Faktakoll-jämförelse',
        description: 'Jämför hur väl varje agents svar stämmer överens med verifierad information',
        process: [
          'Varje agents svar genomgår Tavily Search-faktakoll',
          'Påståenden extraheras och verifieras mot web-källor',
          'Varje agent får en overall score (0-10) baserat på verifiering',
          'Bästa agent identifieras baserat på högst faktakontroll-poäng',
          'Genomsnittligt verifieringspoäng beräknas över alla agenter'
        ],
        outputs: [
          'bestAgent: Agent med högst faktakontroll-poäng',
          'bestScore: Högsta poängen (0-10)',
          'averageScore: Genomsnittligt poäng över alla agenter',
          'totalClaims: Totalt antal påståenden över alla svar',
          'totalVerified: Totalt antal verifierade påståenden',
          'summary: Sammanfattning av faktakontroll-resultat'
        ]
      },
      
      synthesizedSummary: {
        name: 'BERT-baserad syntetiserad sammanfattning',
        description: 'Skapar en neutral, syntetiserad sammanfattning från alla AI-svar',
        process: [
          'Alla AI-svar kombineras till en längre text',
          'BERT-modell (om tillgänglig) extraherar nyckelmeningar',
          'Fallback: TextRank-algoritm skapar sammanfattning',
          'Faktakontroll-data inkorporeras för att markera verifierad information'
        ],
        note: 'BERT-tjänst körs som separat Python-mikroservice om tillgänglig'
      }
    },
    
    visualizationStrategy: {
      description: 'Hur jämförelsedata presenteras visuellt',
      elements: [
        'Färgkodning per agent med distinkt färgschema',
        'Poäng-badges för snabb översikt (bias, faktakontroll, sentiment)',
        'Grid-layout med 2-3 kolumner för jämförelse sida-vid-sida',
        'Meta-gransknings- och faktakontroll-sammanfattning högst upp',
        'Kompakt presentation med expanderbara detaljer'
      ]
    },
    
    timestamp: new Date().toISOString()
  });
});

export default router;
