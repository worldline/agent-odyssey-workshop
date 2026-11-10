// Original 06.html choreography, scoped and lifecycle-controlled.

        class LLMReferenceAnimation {
            constructor(scope) {
                this.scope=scope; this.running=false; this.generation=0; this.timers=new Set();
                this.animationContainer = this.scope.getElementById('animationContainer');
                this.llmVisualization = this.scope.getElementById('llmVisualization');
                this.disclaimerCard = this.scope.getElementById('disclaimerCard');
                
                this.currentPhase = 0;
                

            }

            async init() {
                // Wait for text animations to complete
                
                
                // Show animation elements
                this.showAnimationElements();
                
                // Wait a bit more then start
                
                
                this.startAnimation();
            }

            showAnimationElements() {
                this.animationContainer.classList.add('ready');
                
                this.schedule(() => {
                    this.disclaimerCard.classList.add('ready');
                }, 600);
            }

            async startAnimation() {
                await this.runPhase(0, () => this.showNeuralArchitecture());
                await this.runPhase(1, () => this.showTrainingData());
                await this.runPhase(2, () => this.showInfrastructure());
                await this.runPhase(3, () => this.showParameterWeights());
                await this.runPhase(4, () => this.showNeuralInference());
                
                // Restart animation after delay
                this.schedule(() => {
                    this.restart();
                }, 3000);
            }

            async runPhase(phaseIndex, action) {
                this.currentPhase = phaseIndex;
                
                // Hide previous step
                if (phaseIndex > 0) {
                    await this.hideCurrentStep();
                }
                
                // Show current step
                await action();
                await this.delay(5000); // 5 seconds per step
            }

            hideCurrentStep() {
                return new Promise(resolve => {
                    const visibleStep = this.scope.querySelector('.llm-step.visible');
                    if (visibleStep) {
                        visibleStep.classList.remove('visible');
                        
                        // Hide child elements
                        const elements = visibleStep.querySelectorAll('.visible');
                        elements.forEach(el => {
                            el.classList.remove('visible');
                        });
                    }
                    
                    this.schedule(resolve, 400);
                });
            }

            showNeuralArchitecture() {
                return new Promise(resolve => {
                    const architectureStep = this.scope.getElementById('architecture-step');
                    architectureStep.classList.add('visible');
                    
                    // Show neural network layers
                    this.schedule(() => {
                        const layers = architectureStep.querySelectorAll('.network-layer');
                        layers.forEach((layer, index) => {
                            this.schedule(() => {
                                layer.classList.add('visible');
                            }, index * 200);
                        });
                    }, 500);
                    
                    // Show tech specs
                    this.schedule(() => {
                        const specs = architectureStep.querySelectorAll('.spec-item');
                        specs.forEach((spec, index) => {
                            this.schedule(() => {
                                spec.classList.add('visible');
                            }, index * 300);
                        });
                    }, 1500);
                    
                    this.schedule(resolve, 2500);
                });
            }

            showTrainingData() {
                return new Promise(resolve => {
                    const dataStep = this.scope.getElementById('data-step');
                    dataStep.classList.add('visible');
                    
                    // Show data sources
                    this.schedule(() => {
                        const sources = dataStep.querySelectorAll('.data-source');
                        sources.forEach((source, index) => {
                            this.schedule(() => {
                                source.classList.add('visible');
                            }, index * 300);
                        });
                    }, 500);
                    
                    // Show processing arrow and specs
                    this.schedule(() => {
                        const arrow = dataStep.querySelector('.processing-arrow');
                        arrow.classList.add('visible');
                        
                        this.schedule(() => {
                            const specs = dataStep.querySelectorAll('.spec-item');
                            specs.forEach((spec, index) => {
                                this.schedule(() => {
                                    spec.classList.add('visible');
                                }, index * 200);
                            });
                        }, 300);
                    }, 1800);
                    
                    this.schedule(resolve, 2800);
                });
            }

            showInfrastructure() {
                return new Promise(resolve => {
                    const infrastructureStep = this.scope.getElementById('infrastructure-step');
                    infrastructureStep.classList.add('visible');
                    
                    // Show GPU cluster
                    this.schedule(() => {
                        const cluster = infrastructureStep.querySelector('.gpu-cluster');
                        cluster.classList.add('visible');
                    }, 500);
                    
                    // Show infrastructure stats
                    this.schedule(() => {
                        const stats = infrastructureStep.querySelectorAll('.stat-item');
                        stats.forEach((stat, index) => {
                            this.schedule(() => {
                                stat.classList.add('visible');
                            }, index * 300);
                        });
                    }, 1200);
                    
                    this.schedule(resolve, 2500);
                });
            }

            showParameterWeights() {
                return new Promise(resolve => {
                    const weightsStep = this.scope.getElementById('weights-step');
                    weightsStep.classList.add('visible');
                    
                    // Show weight matrix
                    this.schedule(() => {
                        const matrix = weightsStep.querySelector('.weight-matrix');
                        matrix.classList.add('visible');
                    }, 500);
                    
                    // Show weight info
                    this.schedule(() => {
                        const info = weightsStep.querySelectorAll('.weight-item');
                        info.forEach((item, index) => {
                            this.schedule(() => {
                                item.classList.add('visible');
                            }, index * 300);
                        });
                    }, 1200);
                    
                    this.schedule(resolve, 2500);
                });
            }

            showNeuralInference() {
                return new Promise(resolve => {
                    const inferenceStep = this.scope.getElementById('inference-step');
                    inferenceStep.classList.add('visible');
                    
                    // Show token flow
                    this.schedule(() => {
                        const flow = inferenceStep.querySelector('.token-flow');
                        flow.classList.add('visible');
                    }, 500);
                    
                    // Show probability bars
                    this.schedule(() => {
                        const bars = inferenceStep.querySelector('.probability-bars');
                        bars.classList.add('visible');
                    }, 1000);
                    
                    // Show inference stats
                    this.schedule(() => {
                        const stats = inferenceStep.querySelectorAll('.inference-item');
                        stats.forEach((stat, index) => {
                            this.schedule(() => {
                                stat.classList.add('visible');
                            }, index * 300);
                        });
                    }, 1500);
                    
                    this.schedule(resolve, 2500);
                });
            }

            restart() {
                // Reset all steps
                const steps = this.scope.querySelectorAll('.llm-step');
                steps.forEach(step => {
                    step.classList.remove('visible');
                    
                    // Reset all child elements with visible class
                    const elements = step.querySelectorAll('.visible');
                    elements.forEach(el => {
                        el.classList.remove('visible');
                    });
                });

                // Restart after delay
                this.schedule(() => {
                    this.startAnimation();
                }, 1000);
            }

            delay(ms) {
                return new Promise(resolve => this.schedule(resolve, ms));
            }
        
  schedule(action,delay){const generation=this.generation;const id=setTimeout(()=>{this.timers.delete(id);if(this.running&&generation===this.generation)action()},delay);this.timers.add(id);return id}
  start(){if(this.running)return;this.running=true;this.generation++;this.init()}
  stop(){this.running=false;this.generation++;for(const id of this.timers)clearTimeout(id);this.timers.clear();for(const node of this.scope.querySelectorAll('.visible'))node.classList.remove('visible')}
}

        

class LLMReferenceView {
  constructor(host){
    this.active=false;this.ready=false;this.host=host;host.classList.add('llm-reference-loading');host.setAttribute('aria-busy','true');this.shadow=host.attachShadow({mode:'open'});
    const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='/animations/llm-original.css';
    this.content=document.createElement('div');this.content.className='llm-reference-content';this.content.hidden=true;
    const template=document.createElement('template');template.innerHTML="<div class=\"animation-container\" id=\"animationContainer\">\n                <div class=\"llm-visualization\" id=\"llmVisualization\">\n                    \n                    <!-- Neural Network Architecture -->\n                    <div class=\"llm-step architecture-step\" id=\"architecture-step\">\n                        <div class=\"step-label\">Architecture · example scale</div>\n                        <div class=\"step-content\">\n                            <div class=\"neural-network\">\n                                <div class=\"network-layer\">\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"connection-line\"></div>\n                                </div>\n                                <div class=\"network-layer\">\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"connection-line\"></div>\n                                </div>\n                                <div class=\"network-layer\">\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"connection-line\"></div>\n                                </div>\n                                <div class=\"network-layer\">\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"neuron\"></div>\n                                    <div class=\"connection-line\"></div>\n                                </div>\n                            </div>\n                            <div class=\"tech-specs\">\n                                <div class=\"spec-item\">96 Neural Network Layers</div>\n                                <div class=\"spec-item\">175 Billion Parameters</div>\n                                <div class=\"spec-item\">12,288 Hidden Dimensions</div>\n                            </div>\n                        </div>\n                    </div>\n\n                    <!-- Training Data Pipeline -->\n                    <div class=\"llm-step data-step\" id=\"data-step\">\n                        <div class=\"step-label\">Training data · example volumes</div>\n                        <div class=\"step-content\">\n                            <div class=\"data-pipeline\">\n                                <div class=\"data-source\">\n                                    <div class=\"data-icon\"><svg viewBox=\"0 0 40 40\" width=\"36\" height=\"36\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><path d=\"M6 5h13a5 5 0 0 1 5 5v22H11a5 5 0 0 0-5 5zm28 0H21a5 5 0 0 0-5 5v22h13a5 5 0 0 1 5 5z\"/></svg></div>\n                                    <div class=\"data-text\">Books & Literature</div>\n                                    <div class=\"data-volume\">15TB</div>\n                                </div>\n                                <div class=\"data-source\">\n                                    <div class=\"data-icon\"><svg viewBox=\"0 0 40 40\" width=\"36\" height=\"36\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><circle cx=\"20\" cy=\"20\" r=\"16\"/><path d=\"M4 20h32M20 4c-9 9-9 23 0 32M20 4c9 9 9 23 0 32\"/></svg></div>\n                                    <div class=\"data-text\">Web Content</div>\n                                    <div class=\"data-volume\">20TB</div>\n                                </div>\n                                <div class=\"data-source\">\n                                    <div class=\"data-icon\"><svg viewBox=\"0 0 40 40\" width=\"36\" height=\"36\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><rect x=\"5\" y=\"7\" width=\"30\" height=\"22\" rx=\"2\"/><path d=\"M2 34h36\"/></svg></div>\n                                    <div class=\"data-text\">Code Repositories</div>\n                                    <div class=\"data-volume\">5TB</div>\n                                </div>\n                                <div class=\"data-source\">\n                                    <div class=\"data-icon\"><svg viewBox=\"0 0 40 40\" width=\"36\" height=\"36\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><path d=\"M9 3h16l7 7v27H9zM25 3v8h7M14 18h13M14 24h13\"/></svg></div>\n                                    <div class=\"data-text\">Academic Papers</div>\n                                    <div class=\"data-volume\">5TB</div>\n                                </div>\n                                <div class=\"processing-arrow\">↓</div>\n                                <div class=\"spec-item\">300 Billion Tokens</div>\n                                <div class=\"spec-item\">100+ Languages</div>\n                            </div>\n                        </div>\n                    </div>\n\n                    <!-- GPU infrastructure · example scale -->\n                    <div class=\"llm-step infrastructure-step\" id=\"infrastructure-step\">\n                        <div class=\"step-label\">Distributed Training Infrastructure</div>\n                        <div class=\"step-content\">\n                            <div class=\"infrastructure\">\n                                <div class=\"gpu-cluster\">\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                    <div class=\"gpu-unit\"></div>\n                                </div>\n                                <div class=\"infrastructure-stats\">\n                                    <div class=\"stat-item\">25,000 A100 GPUs</div>\n                                    <div class=\"stat-item\">6 Months Training</div>\n                                    <div class=\"stat-item\">10²³ FLOPs (example)</div>\n                                    <div class=\"stat-item\">Parallel Processing</div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n\n                    <!-- Learned parameters · example model -->\n                    <div class=\"llm-step weights-step\" id=\"weights-step\">\n                        <div class=\"step-label\">Parameter Weights & Learning</div>\n                        <div class=\"step-content\">\n                            <div class=\"weight-visualization\">\n                                <div class=\"weight-matrix\">\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                    <div class=\"weight-cell\"></div>\n                                </div>\n                                <div class=\"weight-info\">\n                                    <div class=\"weight-item\">175B Weight Parameters</div>\n                                    <div class=\"weight-item\">~700 GB weights (FP32)</div>\n                                    <div class=\"weight-item\">Gradient Backpropagation</div>\n                                    <div class=\"weight-item\">Pattern Recognition</div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n\n                    <!-- Neural Inference & Prediction -->\n                    <div class=\"llm-step inference-step\" id=\"inference-step\">\n                        <div class=\"step-label\">Neural Inference & Prediction</div>\n                        <div class=\"step-content\">\n                            <div class=\"inference-process\">\n                                <div class=\"token-flow\">\n                                    <div class=\"token\">Input</div>\n                                    <div class=\"flow-arrow\">→</div>\n                                    <div class=\"token\">Forward</div>\n                                    <div class=\"flow-arrow\">→</div>\n                                    <div class=\"token\">Output</div>\n                                </div>\n                                <div class=\"probability-bars\">\n                                    <div class=\"prob-bar llm-ref-style-0\"></div>\n                                    <div class=\"prob-bar llm-ref-style-1\"></div>\n                                    <div class=\"prob-bar llm-ref-style-2\"></div>\n                                    <div class=\"prob-bar llm-ref-style-3\"></div>\n                                    <div class=\"prob-bar llm-ref-style-4\"></div>\n                                    <div class=\"prob-bar llm-ref-style-5\"></div>\n                                </div>\n                                <div class=\"inference-stats\">\n                                    <div class=\"inference-item\">Token-by-Token Generation</div>\n                                    <div class=\"inference-item\">Probability Distributions</div>\n                                    <div class=\"inference-item\">Context Understanding</div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n\n                </div>\n            </div><div hidden id=\"disclaimerCard\"></div>";
    this.content.append(template.content.cloneNode(true));this.shadow.append(sheet,this.content);
    this.animation=new LLMReferenceAnimation(this.shadow);
    this.stateObserver=new MutationObserver(()=>{
      if(this.ready&&this.active&&this.shadow.querySelector('.llm-step.visible')){this.content.hidden=false;host.classList.remove('llm-reference-loading');host.setAttribute('aria-busy','false')}
    });
    this.stateObserver.observe(this.content,{subtree:true,attributes:true,attributeFilter:['class']});
    sheet.addEventListener('load',()=>{this.ready=true;this.animation.stop();this.setActive(this.active)});
  }
  setActive(active){
    this.active=active;
    if(active&&this.ready&&!this.animation.running){this.content.hidden=true;this.host.setAttribute('aria-busy','true');this.animation.start()}
    else if(!active){this.animation.stop();this.content.hidden=true}
  }
}
