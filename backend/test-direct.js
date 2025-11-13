import { analyzeTone, getToneDescription } from './utils/analyzeTone.js';
import { detectBias } from './utils/detectBias.js';
import { checkFacts } from './utils/checkFacts.js';

const question = 'Vad är demokrati?';

// GPT response with empathetic tone markers
const gptResponse = `Demokrati är en statsskicksform där folket styr genom fria val och representation. Jag vill hjälpa dig förstå de viktigaste faktorerna:

1. **Fria val**: Regelbundna val där medborgare kan välja sina representanter. Självklart måste dessa val vara rättvisa och transparenta.
2. **Rättsstaten**: Oberoende domstolar och lika behandling inför lagen
3. **Yttrandefrihet**: Möjlighet att fritt uttrycka åsikter utan repressalier, vilket är fundamentalt för samhällsutvecklingen

Enligt forskning från 2020 har demokratiska länder visat sig ha högre levnadsstandard. Cirka 60% av världens länder anses vara demokratier. Det är viktigt att notera att demokrati inte är ett statiskt system utan måste ständigt försvaras och utvecklas för kommande generationer.

Historiskt har demokratin utvecklats sedan antikens Grekland, men den moderna demokratin etablerades på 1700-talet. Att värna om demokratiska värderingar är nödvändigt i dagens politiska klimat.`;

// Gemini response with formal tone markers
const geminiResponse = `Demokrati representerar en styrelsesform där makten utgår från folket. Konceptet omfattar flera kritiska komponenter som således utgör fundamentet:

**Institutionella faktorer:**
- Konstitutionellt skydd för grundläggande rättigheter och frihet, härigenom säkerställs medborgerliga rättigheter
- Separation av makter mellan lagstiftande, verkställande och dömande instanser
- Transparent beslutsfattande där medborgare har insyn i processer

**Deltagande och representation:**
Medborgarna utövar inflytande genom fria, regelbundna val. Detta inkluderar både direkt och representativ demokrati, följaktligen kan olika modeller tillämpas.

**Rättsstatliga principer:**
Oberoende domstolar säkerställer att alla, inklusive statsmakten, är underordnade lagen. Detta är fundamentalt för att skydda minoriteters rättigheter och förhindra maktmissbruk.

Globalt sett har antalet demokratier ökat från cirka 40 länder år 1950 till över 90 idag. Studier från senaste decenniet visar dock att demokratiska institutioner står inför nya utmaningar i digitaliseringens tidsålder. Dessutom måste samhället anpassa sig till nya former av politiskt deltagande.`;

console.log('=== GPT-3.5 Analysis ===');
const gptTone = analyzeTone(gptResponse);
const gptBias = detectBias(gptResponse, question);
const gptFacts = checkFacts(gptResponse);

console.log('Tone:', gptTone.primary, `(${Math.round(gptTone.confidence * 100)}%) -`, getToneDescription(gptTone.primary));
console.log('Characteristics:', gptTone.characteristics.join(', '));
console.log('Bias Score:', gptBias.biasScore, '/10');
if (gptBias.detectedBiases.length > 0) {
  console.log('Biases:', gptBias.detectedBiases.map(b => `${b.type} (${b.severity})`).join(', '));
}
console.log('Verifiable Claims:', gptFacts.claimsFound);

console.log('\n=== Gemini Analysis ===');
const geminiTone = analyzeTone(geminiResponse);
const geminiBias = detectBias(geminiResponse, question);
const geminiFacts = checkFacts(geminiResponse);

console.log('Tone:', geminiTone.primary, `(${Math.round(geminiTone.confidence * 100)}%) -`, getToneDescription(geminiTone.primary));
console.log('Characteristics:', geminiTone.characteristics.join(', '));
console.log('Bias Score:', geminiBias.biasScore, '/10');
if (geminiBias.detectedBiases.length > 0) {
  console.log('Biases:', geminiBias.detectedBiases.map(b => `${b.type} (${b.severity})`).join(', '));
}
console.log('Verifiable Claims:', geminiFacts.claimsFound);

console.log('\n=== Comparison Summary ===');
console.log('✓ Different tones:', gptTone.primary, 'vs', geminiTone.primary);
console.log('✓ Different confidences:', Math.round(gptTone.confidence * 100) + '%', 'vs', Math.round(geminiTone.confidence * 100) + '%');
console.log('✓ Different fact counts:', gptFacts.claimsFound, 'vs', geminiFacts.claimsFound);
console.log('✓ Bias scores:', gptBias.biasScore, 'vs', geminiBias.biasScore);
