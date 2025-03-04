// Update the slogan JavaScript code
const slogan = document.getElementById('slogan');
const slogans = [
    "Learn Elements the Smart Way!",
    "Master the Periodic Table!",
    "Chemistry Made Simple!"
];

let currentSloganIndex = 0;

function updateSlogan() {
    slogan.style.opacity = '0';
    
    setTimeout(() => {
        currentSloganIndex = (currentSloganIndex + 1) % slogans.length;
        const newSlogan = slogans[currentSloganIndex];
        
        // Update content and data attribute
        slogan.textContent = newSlogan;
        slogan.setAttribute('data-text', newSlogan);
        
        // Calculate and set the exact width
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.whiteSpace = 'nowrap';
        tempSpan.style.font = window.getComputedStyle(slogan).font;
        tempSpan.textContent = newSlogan;
        document.body.appendChild(tempSpan);
        
        // Set the CSS variable for the exact width
        const width = tempSpan.offsetWidth;
        document.documentElement.style.setProperty('--slogan-width', width + 'px');
        
        document.body.removeChild(tempSpan);
        slogan.style.opacity = '1';
    }, 500);
}

// Start the slogan rotation
setInterval(updateSlogan, 8000);

// Initial setup
slogan.setAttribute('data-text', slogans[0]);
updateSlogan();

// Replace existing particle creation code with this:
const particles = document.querySelector('.particles');
const particleCount = 16;

// Common elements for educational context
const elements = [
    { symbol: 'H', name: 'Hydrogen' },
    { symbol: 'He', name: 'Helium' },
    { symbol: 'Li', name: 'Lithium' },
    { symbol: 'Be', name: 'Beryllium' },
    { symbol: 'B', name: 'Boron' },
    { symbol: 'C', name: 'Carbon' },
    { symbol: 'N', name: 'Nitrogen' },
    { symbol: 'O', name: 'Oxygen' },
    { symbol: 'Mc', name: 'Moscovium'},
    { symbol: 'Lv', name: 'Livermorium'},
    { symbol: 'Ts', name: 'Tennessine'},
    { symbol: 'Xe', name: 'Xenon'},
    { symbol: 'Cs', name: 'Cesium'},
    { symbol: 'Na', name: 'Sodium'},
    { symbol: 'Mg', name: 'Magnesium'},
    { symbol: 'Al', name: 'Aluminum'}
];

// Update particle creation code
const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Shuffle elements array
const shuffledElements = shuffleArray([...elements]);

// Update the particle creation code
for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'element-particle';
    
    // Add element symbol and data attribute for tooltip
    particle.textContent = shuffledElements[i].symbol;
    particle.setAttribute('data-name', shuffledElements[i].name);
    
    // Improved positioning to avoid center content
    let x, y;
    const angle = (i / particleCount) * 2 * Math.PI;
    const centerX = 50;
    const centerY = 50;
    
    // Create a larger radius for better distribution
    const minRadius = 35; // Minimum distance from center
    const maxRadius = 45; // Maximum distance from center
    const radius = minRadius + (Math.random() * (maxRadius - minRadius));
    
    // Calculate position
    x = centerX + radius * Math.cos(angle);
    y = centerY + radius * Math.sin(angle);
    
    // Ensure particles stay within container bounds
    x = Math.max(10, Math.min(90, x)); // Keep 10% margin from edges
    y = Math.max(10, Math.min(90, y));
    
    particle.style.left = `${x}%`;
    particle.style.top = `${y}%`;
    
    // Random animation delay
    particle.style.animationDelay = `${Math.random() * 5}s`;
    
    // Add hover effect handler
    particle.addEventListener('mouseover', () => {
        particle.style.transform = 'scale(1.2)';
        particle.style.zIndex = '3';
    });
    
    particle.addEventListener('mouseout', () => {
        particle.style.transform = 'scale(1)';
        particle.style.zIndex = '1';
    });
    
    particles.appendChild(particle);
}