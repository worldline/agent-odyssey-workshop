// Workshop introduction. Reference animations and reveal ideas adapted from the
// user-provided AI for Tech module 9, scenes 05 (tokens/vectors) and 07 (attention).
// The attention illustration here is causal, unlike the unmasked reference.
import { buildLanguageScenes } from './language-scenes.mjs';
import { buildChatScene } from './chat-scene.mjs';
import { buildIDEScene } from './ide-scene.mjs';
import { buildAgentScene } from './agent-scene.mjs';
import { buildHarnessScene, buildHarnessDiagram } from './harness-scene.mjs';
import { buildCLIScene } from './cli-scene.mjs';
import { buildPlatformIcons } from './platform-icons.mjs';

export function buildFoundations({ screen, paragraph, pair, diagram, bullets, code, esc }) {
  const cockpitVisual = (name, description) => `<div class="cockpit-step-visual"><img src="/assets/${name}.png" alt="${esc(description)}"></div>`;
  const chips = (values, kind = '') => `<div class="lesson-tokens ${kind}">${values.map(value => `<span class="lesson-token" data-essential>${esc(value)}</span>`).join('')}</div>`;
  const neuralVisual = `<div class="nn-native-animation" data-native-nn role="img" aria-label="Illustrative network with three inputs, three hidden neurons with activation functions, and two outputs. Only the active path is shown."><svg class="nn-wires" aria-hidden="true"></svg><div class="nn-network">${[
    ['Input','input',[['i0','x₁'],['i1','x₂'],['i2','x₃']]],
    ['Hidden','hidden',[['h0','f(x)'],['h1','f(x)'],['h2','f(x)']]],
    ['Output','output',[['o0','y₁'],['o1','y₂']]],
  ].map(([label,kind,nodes]) => `<div class="nn-layer nn-layer-${kind}"><span class="nn-layer-label">${label}</span><div class="nn-neurons">${nodes.map(([id,text]) => `<span class="nn-neuron" data-nn-node="${id}">${text}</span>`).join('')}</div></div>`).join('')}</div></div>`;
  const deepVisual = `<div class="dl-native-animation" data-native-dl role="img" aria-label="Three illustrative representation layers: simple features, combined features and complex concepts.">${[
    [3,'Complex concepts',['◎','★']],
    [2,'Combined features',['↔','↗','+']],
    [1,'Simple features',['|','—','/']],
  ].map(([level,label,features]) => `<div class="dl-layer" data-dl-level="${level}"><div class="dl-features">${features.map(feature => `<span class="dl-feature">${feature}</span>`).join('')}</div><span class="dl-layer-description">${label}</span></div>`).join('')}</div>`;
  const referenceCard = (name, title, definition) => {
    const visual = name === 'ml'
      ? `<div class="ml-native-animation" data-native-ml role="img" aria-label="Illustrative machine learning classification: training points, decision boundary and predictions."><span class="ml-y-label">Feature 1</span><div class="ml-plot"><div class="ml-data-points"></div><div class="ml-boundary"></div>${[.2,.4,.6,.8].map(value => `<span class="ml-tick ml-tick-x" data-value="${value}"><span>${value}</span></span><span class="ml-tick ml-tick-y" data-value="${value}"><span>${value}</span></span>`).join('')}</div><span class="ml-x-label">Feature 2</span></div>`
      : name === 'nn' ? neuralVisual
      : name === 'dl' ? deepVisual
      : `<iframe data-animation-src="/animations/${name}.html" width="640" height="440" title="${esc(title)} illustration" sandbox="allow-scripts" aria-hidden="true" tabindex="-1"></iframe>`;
    return `<article class="animation-card${name === 'ml' ? ' ml-animation-card' : name === 'nn' ? ' nn-animation-card' : name === 'dl' ? ' dl-animation-card' : ''}"><h2 data-essential>${esc(title)}</h2><p data-essential>${esc(definition)}</p><div class="reference-animation">${visual}</div></article>`;
  };
  const tokens = ['The', 'cat', 'sits', 'on', 'the', 'mat'];
  const vectorRows = `<div class="lesson-vectors">${[
    ['cat', '[0.2, −0.1, 0.8, 0.3, −0.5]'],
    ['sits', '[−0.3, 0.7, 0.1, −0.2, 0.6]'],
    ['mat', '[0.5, 0.2, −0.4, 0.9, 0.1]'],
  ].map(([word, vector]) => `<div class="lesson-vector-row"><span data-essential>ID(${word})</span><span aria-hidden="true">→</span><code data-essential>${vector}</code></div>`).join('')}</div>`;
  const { nlp: nativeNLP } = buildLanguageScenes({ tokens, chips, vectorRows, esc });
  const attention = `<div class="lesson-attention native-attention" data-native-attention><div class="lesson-tokens">${['The','cat','sits','on','the','','','','',''].map((token, index) => `<span class="lesson-token" data-attention-token="${index}" data-essential${index >= 5 ? ' hidden' : ''}>${token}</span>`).join('')}</div><svg class="attention-native-canvas" role="img" aria-label="Causal self-attention: a selected token can attend to earlier and current positions."><g class="attention-native-links"></g><rect class="attention-native-output"/><text class="attention-native-label" text-anchor="middle"></text></svg><p class="attention-native-caption" data-essential></p></div>`;
  return [
    screen('llm-route', 'COURSE · FOUNDATIONS', 'How machines learn?',
      `<div class="animation-cards">${referenceCard('ml', 'Machine Learning', 'Learn patterns from training examples.')}${referenceCard('nn', 'Neural Networks', 'Weighted links + activation f(x).')}${referenceCard('dl', 'Deep Learning', 'Neural networks with many layers.')}</div>`,
      '',
      'Original right-panel animations from AI for Tech module 9, 02/03/04.html. Legends, source content panels and ancillary notes are not displayed. These are illustrative animations, not trained models.'),
    screen('nlp-llm', 'COURSE · FOUNDATIONS', 'Natural Language Processing (NLP)',
      paragraph('Tokenization maps text units to vocabulary IDs. Tokens are not necessarily words; the split depends on the tokenizer.') + nativeNLP,
      'Language modelling turned out to do much more than we expected... #ChatGPT #2022 #OpenAI',
      'Native transparent adaptation of reference 05.html. The split and vectors are illustrative. The LLM card has moved to the first Inside an LLM step.'),
    screen('llm', 'COURSE · OPEN THE HOOD', 'What is a Large Language Model?',
      `<div class="llm-intro-scene"><div class="llm-anatomy-copy">${bullets('A large neural model trained to predict the next token.', 'Training learns parameters.', 'Chat uses them—it does not retrain the model.')}</div></div><img class="llm-anatomy-image" data-anatomy-image src="/assets/llm-mechanic.png" alt="The Argonaut mechanic inspecting the AI robot.">`, '',
      'Opening definition and mechanic image. No diagram-step counter: the following topics are separate slides.'),
    screen('llm-training-scale', 'COURSE · OPEN THE HOOD', 'Training at scale',
      paragraph('Pre-training learns parameters from large text and code corpora by predicting the next token. GPUs make these updates scalable.') + `<div class="llm-reference-space"><div class="llm-reference-animation" data-llm-reference></div></div>`, '',
      'Actual right-panel animation from user-provided 06.html, in scoped Shadow DOM. Infrastructure numbers are hidden rather than asserted as universal LLM specifications. This illustration is not a live training run.'),
    screen('llm-tokenization-embeddings', 'COURSE · OPEN THE HOOD', 'Tokenization and embeddings',
      paragraph('Tokenization yields vocabulary IDs. The learned embedding matrix turns each ID into a vector.') + nativeNLP,
      'The same token ID selects the same initial vector. Model layers contextualize the full sequence.',
      'Reuses the same transparent animation as the NLP slide. Word-level splits and vectors are illustrative.'),
    screen('llm-self-attention', 'COURSE · OPEN THE HOOD', 'Self-attention',
      paragraph('Self-attention combines available token vectors and position information. Contextual representations change; learned weights stay fixed.') + attention, '',
      'The same last token “the” is compared across two conversation contexts. Its initial embedding is unchanged; model layers produce contextual states h_last(A) and h_last(B). The last position can use all available input tokens; future positions are not supplied. This is not measured attention-weight data.'),
    screen('llm-output-prediction', 'COURSE · OPEN THE HOOD', 'Next-token prediction',
      paragraph('The last contextual vector is projected to scores over the model’s vocabulary, then converted into probabilities.') + `<div class="output-head-layout" data-native-prediction><pre class="hero-code" data-essential><code>${['scores = out(h_last)', 'p = softmax(scores)', 'next_id = decode(p)', 'context.append(next_id)'].map((line,index) => `<span class="prediction-code-line" data-prediction-step="${index}">${esc(line)}</span>`).join('\n')}</code></pre><article class="output-probabilities"><h2 data-essential data-prediction-label>Toy scores</h2><dl>${[['mat','−0.36','0.70'],['door','−1.61','0.20'],['panel','−2.30','0.10']].map(([token,score,probability]) => `<div class="prediction-row" data-score="${score}" data-probability="${probability}"><dt>${token}</dt><dd>${score}</dd></div>`).join('')}</dl></article></div>`,
      'Context: <span data-prediction-prefix>The cat sits on the</span> <strong class="prediction-context-word" data-prediction-context>…</strong><br>Append it; repeat until an end token or output limit.',
      'The output head is a learned projection, not a nearest-word lookup. This four-line example is pseudocode; probabilities are illustrative. Stop at an end token or generation limit.'),
    screen('llm-context', 'COURSE · OPEN THE HOOD', 'Context grows with the conversation',
      paragraph('Context is the information available to the model for its current response: instructions, selected conversation history and relevant data.') + `<div class="context-animation" data-native-context><div class="context-frame conversation-context-frame"><div class="context-growth-layout"><article class="context-message"><h3 data-context-speaker>Word-level example · User</h3><p data-essential data-context-message>The cat sits on the …</p></article><div class="context-sequences"><div class="context-sequence-row"><strong>Tokens</strong><div class="context-sequence-track" aria-hidden="true">${Array.from({length:11},(_,i) => `<span data-context-token="${i}"></span>`).join('')}</div><span data-context-token-count>5</span></div><div class="context-sequence-row"><strong>Vectors</strong><div class="context-sequence-track vector-track" aria-hidden="true">${Array.from({length:11},(_,i) => `<span data-context-vector="${i}"></span>`).join('')}</div><span data-context-vector-count>5</span></div></div></div><p class="context-embedding-link" data-essential data-context-embedding>Same ‘the’ ID → same initial embedding.</p></div></div>`,
      'The context grows as the conversation continues: your messages, the model’s replies and tool results are added, within a finite context window.',
      'Illustrative word-level sequence: user asks for a continuation, the reply is added, then the user asks again. Instructions/role tokens are omitted from the visual counts. Learned weights stay fixed; self-attention contextualizes the growing sequence.'),
    screen('chat-harness-opening', 'COURSE · Generative AI in SDLC', 'It started with a prompt.',
      `<div class="section-intro-scene"><div class="section-intro-copy"><p data-essential>Prompting was our first step: asking an LLM in natural language.</p><p class="section-intro-claim" data-essential>It quickly proved useful across the software development lifecycle (SDLC).</p></div></div><img class="section-intro-image" src="/assets/robots-at-work.png" alt="Coordinated AI robots using tools along a chain of workstations, illustrating agentic collaboration.">`,
      'From asking for suggestions to coordinating work.',
      'The image previews coordinated agents; the section traces the path from prompting to tool-enabled execution. Prompting is a starting interaction mode, not a claim that code assistants only appeared after ChatGPT.'),
    screen('chat-cockpit', 'COURSE · Generative AI in SDLC', 'Chat — manual execution', cockpitVisual('cockpit-chat', 'The pilot operates the spacecraft controls manually.'), '',
      'First image in generation order. Visual metaphor: the human applies and verifies chat suggestions. Image mapping awaits presenter visual confirmation.'),
    screen('chat-round-trips', 'COURSE · Generative AI in SDLC', 'Chat is the first way to use an LLM.',
      buildChatScene(esc),
      '',
      'These are assistance use cases, not guarantees. Modern chat applications can also offer tools and agents; the initial chat-only workflow remains a useful comparison.'),
    screen('ide-cockpit', 'COURSE · Generative AI in SDLC', 'IDE — assisted execution', cockpitVisual('cockpit-ide', 'The pilot remains at the windshield and operates a tablet.'), '',
      'Second image in generation order. Visual metaphor for assistance close to the working environment, not a claim that tablet interfaces define an architecture.'),
    screen('ide-context', 'COURSE · Generative AI in SDLC', 'IDE integration: closer to the project',
      buildIDEScene(esc),
      '',
      'Tool and skill support varies by IDE assistant and mode. A skill guides how to perform a task; a tool performs an action. Some IDE assistants already host agent runtimes.'),
    screen('agent-anatomy', 'COURSE · Generative AI in SDLC', 'What is an AI agent?', buildAgentScene(), '',
      'The agent is a goal-directed system, not the model alone. Tool execution, current context, observations and a runtime/control loop support action. Persistent memory and RAG are optional. The brain/limbs analogy is illustrative; long-term memory is not required for every autonomous task. User-generated cutaway is placed under the annotated SVG overlay. Annotation positions follow the requested composition and need presenter visual confirmation; no browser check was run.'),
    screen('harness-cockpit', 'COURSE · Generative AI in SDLC', 'Harness — supervised delegation', cockpitVisual('cockpit-harness', 'The pilot eats lunch away from the front console while supervising delegated work.'), '',
      'Third image in generation order. Visual metaphor for bounded delegation with human oversight, not an autonomous-navigation exercise or a guarantee of unattended AI reliability.'),
    screen('harness', 'COURSE · Generative AI in SDLC', 'Harnesses turn decisions into actions', buildHarnessScene(esc, buildCLIScene()),
      '',
      'Simulated Claude Code CLI usage, not a real tool execution or the scheduled Copilot CLI demo. Claude Code uses CLAUDE.md; other harnesses may use AGENTS.md. Show file operations, human approval, tests and evidence rather than just conversational suggestions.'),
    screen('harness-loop', 'COURSE · Generative AI in SDLC', 'Inside the harness: the agent loop', buildHarnessDiagram(),
      '',
      'Illustrates a harness with agent lifecycle/orchestration support: configure, instantiate, start or reuse agents from definitions. This is not universal to every harness and does not create a new agent for every model call. Instructions are not executable agent definitions. Delegated agents retain their own context, model calls and tool scopes.'),
    screen('agentic-everywhere', 'COURSE · Generative AI in SDLC', 'Agentic is moving into every interface',
      `<div class="agentic-overview"><div class="agentic-platforms">${buildPlatformIcons(esc)}</div>${pair(['Scaling', 'Agent loops multiply calls, latency, cost and concurrency. Set budgets, rate limits and stopping conditions.'], ['Security', 'Tools multiply privileges and data exposure. Use scoped secrets, least privilege, approval gates and isolation.'])}</div>`,
      ''),
  ];
}
