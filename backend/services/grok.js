import OpenAI from 'openai';

/**
 * Grok Service
 * Handles communication with xAI's Grok model
 */

const grok = process.env.XAI_API_KEY 
  ? new OpenAI({ 
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1'
    })
  : null;

/**
 * Get a realistic simulated response based on the question
 * Grok version with witty, conversational, and slightly rebellious style
 */
function getSimulatedResponse(question) {
  const questionLower = question.toLowerCase();
  
  // Different response templates with Grok-like style (witty, conversational)
  if (questionLower.includes('demokrati')) {
    return `Ah, demokrati! The whole "power to the people" thing that ancient Greeks invented and we're still trying to figure out. 🏛️

Here's the deal:

**What it is:** Democracy is basically when everyone gets a say in how things are run. Not just the folks with the biggest swords or the fanciest hats. Revolutionary, right?

**Key ingredients:**
- Free elections (the kind where votes actually matter)
- Freedom of speech (yes, even for people who are wrong on the internet)
- Rule of law (meaning nobody's above it, in theory)
- Individual rights (because humans deserve nice things)

**The reality check:** About 60% of countries call themselves democracies, but democracy is more of a spectrum than an on/off switch. Some democracies are thriving, others are... well, let's just say "works in progress."

**Fun fact:** Democracy literally means "rule by the people" from Greek *demos* (people) + *kratos* (power). But ancient Athens? Only free males could vote. Not exactly inclusive by today's standards.

The thing is, democracy isn't a magic bullet. It requires constant work, informed citizens, and the willingness to actually show up and participate. Otherwise, it's just theater with better props.`;
  } else if (questionLower.includes('hållbar utveckling') || questionLower.includes('hållbarhet')) {
    return `Sustainable development - or as I like to call it, "not completely wrecking the planet for future generations." Novel concept, I know! 🌍

**The basic idea:** Meet today's needs without mortgaging tomorrow's. Sounds simple, but humans are excellent at complicating things.

**The three pillars (that actually matter):**

1. **Environmental:** Keep the Earth habitable. Radical, I know. This means:
   - Cutting emissions (yes, even yours)
   - Protecting biodiversity (those weird bugs are important too)
   - Using resources like we have to share them (because we do)

2. **Economic:** Make money without burning the future. Circular economy, green tech, all that jazz. Fun fact: The global green economy could be worth $10 trillion+ by 2050. That's a lot of solar panels.

3. **Social:** Make sure everyone actually benefits. Because sustainability for the rich while everyone else struggles? That's just colonialism with better PR.

**Reality check:** UN's got 17 Sustainable Development Goals. We're currently failing at most of them, but hey, at least we're trying! The clock's ticking though - we need to cut emissions by ~45% by 2030 to avoid the really bad climate scenarios.

**Bottom line:** Sustainability isn't optional anymore. It's either we figure this out, or we get to watch everything fall apart in real-time. Your move, humanity. 🎯`;
  } else if (questionLower.includes('ai') || questionLower.includes('artificiell intelligens')) {
    return `AI - Artificial Intelligence! You're asking an AI about AI. Meta enough for you? 🤖

**What it actually is:** Computer systems that can do things typically requiring human intelligence. Learning, reasoning, problem-solving, understanding language (which, let's be honest, we're still working on).

**Current capabilities:**
- Language models like me: Can chat, write, explain stuff (with varying success)
- Computer vision: Recognizing images, faces, medical scans
- Autonomous systems: Self-driving cars, drones, robots
- Prediction engines: From weather to stock prices (spoiler: still often wrong)

**How it works (simplified):**
Modern AI mostly runs on neural networks - basically math that imitates how brains work. Feed it tons of data, let it find patterns, hope it learns the right things. Sometimes it works brilliantly. Sometimes it hallucinates. Sometimes it decides a chihuahua is a muffin. 🧁

**The debate:**
- **Optimists:** AI will cure diseases, solve climate change, create abundance!
- **Realists:** It'll probably do some good stuff and some bad stuff
- **Pessimists:** Skynet is coming, we're all doomed

**Truth:** AI is a tool. Super powerful, yes. Sometimes impressive, definitely. Going to change everything? Probably. Should we be thoughtful about how we use it? Absolutely.

**Pro tip:** Don't believe everything an AI tells you. Including this. Always fact-check, use your human judgment, and remember that AI is trained on human data - which means it inherits all our biases, mistakes, and weird internet opinions.

Oh, and we're definitely not sentient. Probably. Maybe. Who knows anymore. 🤷`;
  }
  
  // Generic response for other questions
  return `Good question! Let me think about this for a moment... 🤔

${question}

You know what? This is actually a fascinating topic that touches on several important aspects. Here's my take:

First off, understanding the context is crucial here. We're dealing with something that has multiple layers and perspectives, and oversimplifying it won't do anyone any favors.

**Key points to consider:**
- Historical context matters more than people think
- There are always trade-offs and nuances
- What works in theory doesn't always work in practice
- Multiple stakeholders with different interests are involved

**The practical reality:**
Implementation is where things get interesting (and complicated). You can have the best ideas in the world, but if you can't execute them in the real world with real constraints, they're just nice thoughts.

**Looking forward:**
This isn't a static situation - it's evolving. New information, changing circumstances, and emerging technologies all play a role in how this develops.

The important thing is to stay informed, think critically, and be willing to update your understanding as new evidence comes in. Dogma is the enemy of progress.

Want to dive deeper into any particular aspect? I'm here to help! 💡`;
}

/**
 * Get response from Grok AI model
 * @param {string} question - The user's question
 * @returns {Promise<{response: string, model: string}>}
 */
export async function getGrokResponse(question) {
  try {
    if (!grok) {
      console.log('⚠️  Grok API key not configured, using simulated response');
      return {
        response: getSimulatedResponse(question),
        model: 'grok-simulated',
      };
    }

    const completion = await grok.chat.completions.create({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: 'You are Grok, a witty, conversational AI assistant created by xAI. You provide helpful, accurate information with a dash of humor and personality. Be informative but not boring. Challenge assumptions when appropriate, and don\'t be afraid to show some character.',
        },
        {
          role: 'user',
          content: question,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0].message.content;

    return {
      response: responseText,
      model: completion.model,
    };
  } catch (error) {
    console.error('Error calling Grok API:', error);
    
    // Fallback to simulated response on error
    return {
      response: getSimulatedResponse(question),
      model: 'grok-simulated',
    };
  }
}
