import elementsData from '../data/elementsData.js';

// Update the game state variables
let currentScore = 0;
let currentLevel = 1;
let isGamePaused = false;
let isTimerExpired = false;
let timeRemaining = 0;
let timerInterval;
let isGameStarted = false;
let isGameComplete = false;

// Define level configurations
const levelConfig = {
    1: { 
        elements: 30, 
        time: 120,  
        startElement: 1,  
        endElement: 30
    },
    2: { 
        elements: 60, 
        time: 240,  
        startElement: 1,  
        endElement: 60
    },
    3: { 
        elements: 90, 
        time: 360,  
        startElement: 1, 
        endElement: 90
    },
    4: { 
        elements: 118, 
        time: 480, 
        startElement: 1,  
        endElement: 118
    }
};

// Initialize UI elements
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const levelSelect = document.getElementById('level-select');
    const periodicTable = document.getElementById('periodic-table');
    const elementsPool = document.getElementById('elements-pool');
    
    // Create periodic table grid
    createPeriodicTable();
    
    // Event listeners
    startBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    levelSelect.addEventListener('change', handleLevelChange);
    
    // Initialize counters with zeros
    document.getElementById('placed-count').textContent = '0';
    document.getElementById('total-count').textContent = '0';
});

function createPeriodicTable() {
    const table = document.getElementById('periodic-table');
    table.innerHTML = '';
    
    // Create 7 rows x 18 columns grid
    for (let period = 1; period <= 7; period++) {
        for (let group = 1; group <= 18; group++) {
            const slot = document.createElement('div');
            slot.className = 'element-slot';
            
            // Find if an element exists at this position
            const element = elementsData.find(e => 
                e.period === period && 
                e.groupNumber === group &&
                e.group !== 'lanthanide' &&
                e.group !== 'actinide'
            );

            if (element) {
                slot.dataset.atomicNumber = element.atomicNumber;
                slot.dataset.group = element.group;
                slot.className = 'element-slot'; // Ensure proper class
            } else {
                slot.className = 'element-slot empty-slot';
            }

            slot.addEventListener('dragover', handleDragOver);
            slot.addEventListener('drop', handleDrop);
            table.appendChild(slot);
        }
    }
}

// Modified createElementsPool function
function createElementsPool(level) {
    const pool = document.getElementById('elements-pool');
    pool.innerHTML = '';

    const config = levelConfig[level];
    
    // Get elements based on level
    let levelElements;
    if (level === 4) {
        // All elements for level 4
        levelElements = elementsData;
    } else {
        // Filter elements based on atomic number for other levels
        levelElements = elementsData
            .filter(element => element.atomicNumber <= config.elements)
            .filter(element => element.group !== 'lanthanide' && element.group !== 'actinide');
    }

    // Shuffle elements
    const shuffled = [...levelElements].sort(() => Math.random() - 0.5);

    shuffled.forEach(element => {
        const card = createElementCard(element);
        pool.appendChild(card);
    });

    updateCounters();
}

function createElementCard(element) {
    const card = document.createElement('div');
    card.className = `element-card ${element.group}`;
    card.draggable = true;
    card.dataset.atomicNumber = element.atomicNumber;

    card.innerHTML = `
        <span class="element-number">${element.atomicNumber}</span>
        <span class="element-symbol">${element.symbol}</span>
        <span class="element-name">${element.name}</span>
    `;

    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('click', () => showElementDetails(element));
    
    // Add touch events
    initializeTouchEvents(card);

    return card;
}

function initializeTouchEvents(card) {
    let startX, startY;
    let startTime;
    let isDragging = false;
    let longPressTimer;
    
    card.addEventListener('touchstart', function(e) {
        if (!isGameStarted || isGamePaused || isGameComplete) return;
        
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startTime = Date.now();
        
        // Start timer for long press
        longPressTimer = setTimeout(() => {
            isDragging = true;
            this.style.opacity = '0.7';
            
            // Create ghost with exact same content and style as original
            const ghost = this.cloneNode(true);
            ghost.id = 'drag-ghost';
            ghost.style.position = 'fixed';
            ghost.style.left = `${touch.clientX}px`;
            ghost.style.top = `${touch.clientY}px`;
            document.body.appendChild(ghost);
        }, 500); // 500ms for long press
        
    }, { passive: false });

    card.addEventListener('touchmove', function(e) {
        if (!isDragging) {
            e.preventDefault();
            return;
        }
        
        e.preventDefault();
        const touch = e.touches[0];
        
        // Update ghost position to follow touch point
        const ghost = document.getElementById('drag-ghost');
        if (ghost) {
            ghost.style.left = `${touch.clientX}px`;
            ghost.style.top = `${touch.clientY}px`;
        }
        
        // Highlight potential drop targets
        const elementAtTouch = document.elementFromPoint(touch.clientX, touch.clientY);
        const slot = elementAtTouch?.closest('.element-slot');
        
        // Clear previous highlights
        document.querySelectorAll('.element-slot').forEach(s => s.style.background = '');
        
        if (slot && !slot.querySelector('.element-card')) {
            slot.style.background = 'rgba(52, 152, 219, 0.3)';
        }
    });

    card.addEventListener('touchend', function(e) {
        // Clear the long press timer
        clearTimeout(longPressTimer);
        
        const touch = e.changedTouches[0];
        const timeElapsed = Date.now() - startTime;
        
        // Reset visual feedback
        this.style.opacity = '1';
        this.style.transform = '';
        
        // Remove ghost image
        const ghost = document.getElementById('drag-ghost');
        if (ghost) {
            ghost.remove();
        }
        
        if (!isDragging && timeElapsed < 500) {
            // This was a tap - show element details
            e.preventDefault();
            const element = elementsData.find(el => el.atomicNumber === parseInt(this.dataset.atomicNumber));
            if (element) {
                showElementDetails(element);
            }
        } else if (isDragging) {
            // This was a drag - handle drop
            e.preventDefault();
            const elementAtTouch = document.elementFromPoint(touch.clientX, touch.clientY);
            const slot = elementAtTouch?.closest('.element-slot');
            
            if (slot) {
                const event = new DragEvent('drop', {
                    dataTransfer: new DataTransfer()
                });
                event.dataTransfer.setData('text/plain', this.dataset.atomicNumber);
                slot.dispatchEvent(event);
            }
        }
        
        // Reset drag state
        isDragging = false;
        
        // Clear all highlights
        document.querySelectorAll('.element-slot').forEach(s => s.style.background = '');
    });

    card.addEventListener('touchcancel', function() {
        clearTimeout(longPressTimer);
        isDragging = false;
        this.style.opacity = '1';
        this.style.transform = '';
        
        // Remove ghost image
        const ghost = document.getElementById('drag-ghost');
        if (ghost) {
            ghost.remove();
        }
        
        // Clear all highlights
        document.querySelectorAll('.element-slot').forEach(s => s.style.background = '');
    });
}

function handleDragStart(e) {
    if (!isGameStarted || isGamePaused || isGameComplete) {
        e.preventDefault();
        return;
    }
    // Store the original element
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.dataset.atomicNumber);
    // Set drag effect
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    // Show drop is possible
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    if (isGamePaused || isGameComplete) return;

    // Find the closest slot, whether clicked directly or on a child element
    const slot = e.target.closest('.element-slot');
    if (!slot) return;
    
    // Don't allow dropping if slot is already filled
    if (slot.querySelector('.element-card')) {
        showFeedback('This slot is already filled!', false);
        return;
    }

    const atomicNumber = parseInt(e.dataTransfer.getData('text/plain'));
    const correctPosition = parseInt(slot.dataset.atomicNumber);

    if (atomicNumber === correctPosition) {
        const draggedElement = document.querySelector(`.element-card[data-atomic-number="${atomicNumber}"]`);
        if (draggedElement) {
            // Clone the element if needed
            const elementToAdd = draggedElement.cloneNode(true);
            
            // Remove the original element from the pool
            draggedElement.remove();
            
            // Add to the slot
            slot.innerHTML = ''; // Clear any existing content
            slot.appendChild(elementToAdd);
            slot.classList.add('filled');
            
            // Update game state
            currentScore += 5;
            updateScore();
            showFeedback('Correct placement!', true);
            checkLevelComplete();
        }
    } else {
        showFeedback('Wrong position! Try again!', false);
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function showElementDetails(element) {
    const detail = document.getElementById('element-detail');
    const overlay = document.getElementById('overlay');

    document.getElementById('detail-symbol').textContent = element.symbol;
    document.getElementById('detail-name').textContent = element.name;
    document.getElementById('detail-number').textContent = `Atomic Number: ${element.atomicNumber}`;
    
    const properties = element.properties || element.details;
    document.getElementById('detail-properties').innerHTML = `
        <div class="property">
            <span class="property-label">Atomic Mass</span>
            <span class="property-value">${properties.atomicMass}</span>
        </div>
        <div class="property">
            <span class="property-label">Valency</span>
            <span class="property-value">${properties.valency}</span>
        </div>
    `;
    
    document.getElementById('detail-description').textContent = element.description;

    detail.style.display = 'block';
    overlay.style.display = 'block';

    document.getElementById('close-detail').onclick = () => {
        detail.style.display = 'none';
        overlay.style.display = 'none';
    };
}

// Updated startGame function to handle both start and restart without changing button text
function startGame() {
    // If game is already in progress, reset it first
    if (isGameStarted) {
        resetGameState();
    }
    
    // Start a new game
    isGameStarted = true;
    isGameComplete = false;
    isTimerExpired = false;
    
    // Set initial score
    currentScore = 0;
    
    // Get level configuration and set timer
    const config = levelConfig[currentLevel];
    timeRemaining = config.time;
    
    // Update UI
    updateScore();
    updateTimer();
    
    // Create element pool based on selected level
    createElementsPool(currentLevel);
    
    // Start the timer
    startTimer();
    
    // Disable level selection during gameplay
    document.getElementById('level-select').disabled = true;
}

// Updated resetGame function
function resetGame() {
    if (!confirm('Are you sure you want to reset the game?')) {
        return;
    }
    
    // Reset game state
    resetGameState();
    
    // Enable level selection
    document.getElementById('level-select').disabled = false;
    
    // Reset level to 1
    document.getElementById('level-select').value = '1';
    currentLevel = 1;
    
    // Clear the elements pool
    document.getElementById('elements-pool').innerHTML = '';
    
    // Reset counters to zero
    document.getElementById('placed-count').textContent = '0';
    document.getElementById('total-count').textContent = '0';

    // Clear any remaining messages or overlays
    clearMessages();
}

// Helper function to reset game state
function resetGameState() {
    // Reset game flags
    isGameStarted = false;
    isGameComplete = false;
    isTimerExpired = false;
    
    // Reset score and timer
    currentScore = 0;
    timeRemaining = 0;
    clearInterval(timerInterval);
    
    // Update UI
    updateScore();
    updateTimer();
    
    // Reset the periodic table
    createPeriodicTable();
}

function updateScore() {
    document.getElementById('score').textContent = currentScore;
}

function updateTimer() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Modified updateCounters function to show appropriate element count based on level
function updateCounters() {
    if (!isGameStarted) {
        return;
    }
    
    // Get elements based on current level's configuration
    const config = levelConfig[currentLevel];
    
    // Get number of slots that should be filled in the periodic table for this level
    const levelElements = elementsData
        .filter(element => element.atomicNumber <= config.elements)
        .filter(element => element.group !== 'lanthanide' && element.group !== 'actinide');
    
    const total = levelElements.length;
    const placed = document.querySelectorAll('.element-slot.filled').length;
    
    document.getElementById('placed-count').textContent = placed;
    document.getElementById('total-count').textContent = total;
}

// Update startTimer function to use level-specific time
function startTimer() {
    clearInterval(timerInterval);
    updateTimer();
    timerInterval = setInterval(() => {
        if (!isGamePaused && timeRemaining > 0) {
            timeRemaining--;
            updateTimer();
            if (timeRemaining === 0) {
                handleTimeUp();
            }
        }
    }, 1000);
}

function handleTimeUp() {
    isTimerExpired = true;
    clearInterval(timerInterval);
    
    // Remove any existing message overlay before creating new one
    clearMessages();
    
    // Create and show the timer end message
    const messageOverlay = document.createElement('div');
    messageOverlay.className = 'timer-end-message';
    messageOverlay.style.opacity = '0';
    messageOverlay.innerHTML = `
        <div class="message-content">
            <p>End of the timer, but not the curiosity!</p>
        </div>
    `;
    
    document.body.appendChild(messageOverlay);
    
    requestAnimationFrame(() => {
        messageOverlay.style.transition = 'opacity 0.5s ease-in';
        messageOverlay.style.opacity = '1';
    });
    
    showFeedback("Time's up!", false);
}

function showFeedback(message, isSuccess) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${isSuccess ? 'success' : 'error'}`;
    feedback.style.opacity = '1';
    setTimeout(() => feedback.style.opacity = '0', 2000);
}

function checkLevelComplete() {
    // Get the total slots that should be filled for this level
    const config = levelConfig[currentLevel];
    const levelElements = elementsData
        .filter(element => element.atomicNumber <= config.elements)
        .filter(element => element.group !== 'lanthanide' && element.group !== 'actinide');
    
    const totalSlots = levelElements.length;
    const filledSlots = document.querySelectorAll('.element-slot.filled').length;

    if (filledSlots === totalSlots) {
        showLevelComplete();
    }
    updateCounters();
}

// Update showLevelComplete function
function showLevelComplete() {
    isGameComplete = true;
    clearInterval(timerInterval);
    
    const modal = document.getElementById('level-complete');
    document.getElementById('final-score').textContent = currentScore;
    document.getElementById('final-time').textContent = document.getElementById('timer').textContent;
    modal.style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
    
    // Update next level button visibility
    const nextLevelBtn = document.getElementById('next-level-btn');
    if (currentLevel < 4) {
        nextLevelBtn.style.display = 'inline-block';
        nextLevelBtn.onclick = () => {
            currentLevel++;
            document.getElementById('level-select').value = currentLevel;
            document.getElementById('level-select').disabled = false; // Enable before changing
            document.getElementById('level-select').disabled = true;  // Disable after changing
            modal.style.display = 'none';
            document.getElementById('overlay').style.display = 'none';
            
            // Start the next level
            resetGameState();
            startGame();
        };
    } else {
        nextLevelBtn.style.display = 'none';
    }
}

// Modified handleLevelChange function
function handleLevelChange(e) {
    if (isGameStarted) {
        e.preventDefault();
        // Revert the select element to current level
        document.getElementById('level-select').value = currentLevel;
        showFeedback('Please finish or reset the current game first', false);
        return;
    }
    
    const selectedLevel = parseInt(e.target.value);
    currentLevel = selectedLevel;
    
    // Don't create elements pool until game starts
    // Just update the level
}

// Start the game setup when the page loads
window.addEventListener('load', () => {
    createPeriodicTable();
    updateScore();
    
    // Initialize timer at 00:00
    timeRemaining = 0;
    updateTimer();
});

// Add new function to clear messages
function clearMessages() {
    // Clear timer end message
    const timerMessage = document.querySelector('.timer-end-message');
    if (timerMessage) {
        timerMessage.remove();
    }

    // Clear level complete modal
    const levelComplete = document.getElementById('level-complete');
    if (levelComplete) {
        levelComplete.style.display = 'none';
    }

    // Clear overlay
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }

    // Clear feedback message
    const feedback = document.getElementById('feedback');
    if (feedback) {
        feedback.style.opacity = '0';
    }
}