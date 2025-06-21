  /* ===== SCRIPT.JS CONTENT ===== */
        
        // Game state variables
        let gameActive = false;
        let startTime = 0;
        let timeoutId = null;
        let reactionTimes = [];
        let waitingForClick = false;
        
        // DOM elements
        const gameArea = document.getElementById('gameArea');
        const movingBox = document.getElementById('movingBox');
        const startButton = document.getElementById('startButton');
        const resetButton = document.getElementById('resetButton');
        const gameMessage = document.getElementById('gameMessage');
        const lastTimeElement = document.getElementById('lastTime');
        const bestTimeElement = document.getElementById('bestTime');
        const avgTimeElement = document.getElementById('avgTime');
        const attemptsElement = document.getElementById('attempts');

        // Audio context for click sounds
        let audioContext;
        
        // Initialize audio context
        function initAudio() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }

        // Create and play click sound
        function playClickSound() {
            if (!audioContext) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        }

        // Generate random position for the moving box
        function getRandomPosition() {
            const gameAreaRect = gameArea.getBoundingClientRect();
            const boxSize = 60;
            const maxX = gameArea.clientWidth - boxSize;
            const maxY = gameArea.clientHeight - boxSize;
            
            return {
                x: Math.random() * maxX,
                y: Math.random() * maxY
            };
        }

        // Position the moving box at random location
        function positionBox() {
            const position = getRandomPosition();
            movingBox.style.left = position.x + 'px';
            movingBox.style.top = position.y + 'px';
        }

        // Show the moving box after random delay
        function showBox() {
            if (!gameActive) return; // Check if game is still active
            
            const delay = Math.random() * 3000 + 1000; // 1-4 seconds delay
            
            gameMessage.textContent = 'Get ready... Wait for the circle to appear!';
            gameMessage.className = 'message waiting-message';
            
            timeoutId = setTimeout(() => {
                if (!gameActive) return;
                
                positionBox();
                movingBox.style.display = 'block';
                startTime = Date.now();
                waitingForClick = true;
                
                gameMessage.textContent = 'Click the circle NOW!';
                gameMessage.className = 'message';
                
                // Hide box after 2 seconds if not clicked
                const hideTimeout = setTimeout(() => {
                    if (waitingForClick && gameActive) {
                        hideBox();
                        gameMessage.textContent = 'Too slow! Try again.';
                        // Continue the game loop
                        setTimeout(() => {
                            if (gameActive) showBox();
                        }, 1500);
                    }
                }, 2000);
                
                // Store timeout ID for cleanup
                movingBox.hideTimeoutId = hideTimeout;
            }, delay);
        }

        // Hide the moving box
        function hideBox() {
            movingBox.style.display = 'none';
            waitingForClick = false;
        }

        // Handle box click
        function handleBoxClick() {
            if (!waitingForClick || !gameActive) return;
            
            initAudio(); // Initialize audio on first interaction
            playClickSound(); // Play click sound
            
            const endTime = Date.now();
            const reactionTime = endTime - startTime;
            
            // Add clicked animation class
            movingBox.classList.add('clicked');
            setTimeout(() => movingBox.classList.remove('clicked'), 300);
            
            // Store reaction time
            reactionTimes.push(reactionTime);
            
            // Update display
            updateStats(reactionTime);
            
            // Hide box and show next one
            hideBox();
            gameMessage.textContent = `Great! Your reaction time: ${reactionTime}ms`;
            
            // Continue the game loop automatically
            setTimeout(() => {
                if (gameActive) showBox();
            }, 1500);
        }

        // Update game statistics
        function updateStats(lastTime) {
            // Update last time
            lastTimeElement.textContent = lastTime + 'ms';
            
            // Update attempts
            attemptsElement.textContent = reactionTimes.length;
            
            // Update best time
            const bestTime = Math.min(...reactionTimes);
            bestTimeElement.textContent = bestTime + 'ms';
            
            // Update average time
            const avgTime = Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length);
            avgTimeElement.textContent = avgTime + 'ms';
        }

        // Start the game
        function startGame() {
            gameActive = true;
            waitingForClick = false;
            startButton.textContent = 'Stop Game';
            startButton.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a24)';
            
            hideBox();
            showBox();
        }

        // Stop the game
        function stopGame() {
            gameActive = false;
            waitingForClick = false;
            
            // Clear all timeouts
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            
            // Clear hide timeout if exists
            if (movingBox.hideTimeoutId) {
                clearTimeout(movingBox.hideTimeoutId);
                movingBox.hideTimeoutId = null;
            }
            
            hideBox();
            startButton.textContent = 'Start Game';
            startButton.style.background = 'linear-gradient(45deg, #56ab2f, #a8e6cf)';
            gameMessage.textContent = 'Game stopped. Click "Start Game" to play again!';
            gameMessage.className = 'message';
        }

        // Reset game statistics
        function resetStats() {
            reactionTimes = [];
            lastTimeElement.textContent = '--';
            bestTimeElement.textContent = '--';
            avgTimeElement.textContent = '--';
            attemptsElement.textContent = '0';
            gameMessage.textContent = 'Stats reset! Click "Start Game" to begin.';
        }

        // Prevent accidental clicks during waiting period
        function handleEarlyClick(event) {
            // Don't trigger if clicking on the moving box or buttons
            if (event.target === movingBox || event.target === startButton || event.target === resetButton) {
                return;
            }
            
            if (!waitingForClick && gameActive) {
                gameMessage.textContent = 'Too early! Wait for the circle to appear.';
                // Don't stop the game, just show warning
                setTimeout(() => {
                    if (gameActive && !waitingForClick) {
                        gameMessage.textContent = 'Get ready... Wait for the circle to appear!';
                        gameMessage.className = 'message waiting-message';
                    }
                }, 1000);
            }
        }

        // Event listeners
        startButton.addEventListener('click', () => {
            if (gameActive) {
                stopGame();
            } else {
                startGame();
            }
        });

        resetButton.addEventListener('click', resetStats);
        movingBox.addEventListener('click', handleBoxClick);
        gameArea.addEventListener('click', handleEarlyClick);

        // Initialize particles.js
        particlesJS('particles-js', {
            particles: {
                number: {
                    value: 50,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: '#ffffff'
                },
                shape: {
                    type: 'circle',
                    stroke: {
                        width: 0,
                        color: '#000000'
                    }
                },
                opacity: {
                    value: 0.3,
                    random: false,
                    anim: {
                        enable: false,
                        speed: 1,
                        opacity_min: 0.1,
                        sync: false
                    }
                },
                size: {
                    value: 3,
                    random: true,
                    anim: {
                        enable: false,
                        speed: 40,
                        size_min: 0.1,
                        sync: false
                    }
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#ffffff',
                    opacity: 0.2,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: 'none',
                    random: false,
                    straight: false,
                    out_mode: 'out',
                    bounce: false,
                    attract: {
                        enable: false,
                        rotateX: 600,
                        rotateY: 1200
                    }
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: {
                        enable: true,
                        mode: 'repulse'
                    },
                    onclick: {
                        enable: true,
                        mode: 'push'
                    },
                    resize: true
                },
                modes: {
                    grab: {
                        distance: 400,
                        line_linked: {
                            opacity: 1
                        }
                    },
                    bubble: {
                        distance: 400,
                        size: 40,
                        duration: 2,
                        opacity: 8,
                        speed: 3
                    },
                    repulse: {
                        distance: 200,
                        duration: 0.4
                    },
                    push: {
                        particles_nb: 4
                    },
                    remove: {
                        particles_nb: 2
                    }
                }
            },
            retina_detect: true
        });