// Get HTML elements
const canvas = document.getElementById('graphCanvas');
const context = canvas.getContext('2d');
const equationContainer = document.getElementById('equationContainer');
const errorMsg = document.getElementById('errorMsg');

// Array of colors for different equations
const colors = [
    '#ff6b6b',
    '#4dabf7',
    '#51cf66',
    '#ffd43b',
    '#cc5de8',
    '#ff922b',
    '#20c997',
    '#be4bdb',
];

// Graph view settings
let view = {
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
}

// Mouse drag variables
let isDragging = false;
let lastX = 0;
let lastY = 0;

// Array to store ID for each equation
let equationIds = [0];
let nextId = 1;

// Set canvas size and draw initial graph
function setupCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    plotAll()
}

// Convert math coordinates to canvas pixels
function toCanvas(x, y) {
    const xPixel = ((x - view.xMin) / (view.xMax - view.xMin)) * canvas.width;
    const yPixel = canvas.height - ((y - view.yMin) / (view.yMax - view.yMin)) * canvas.height;
    return {x: xPixel, y: yPixel} // Return pixel coordinates
}

// Ensure 1 unit in x equals 1 unit in y visually
function squareGrid() {
    // Calculate aspect ratio of canvas and of current view
    const ratio = canvas.width / canvas.height;
    const viewRatio = (view.xMax - view.xMin) / (view.yMax - view.yMin);

    // Adjust y-range if view is wider than canvas shape
    if (viewRatio > ratio) {
        const centerY = (view.yMin + view.yMax) / 2;
        const newHeight = (view.xMax - view.xMin) / ratio;
        view.yMin = centerY - newHeight / 2;
        view.yMax = centerY + newHeight / 2;
    }

    // Adjust x-range if view is taller than canvas shape
    else {
        const centerX = (view.xMin + view.xMax) / 2;
        const newWidth = (view.yMax - view.yMin) * ratio;
        view.xMin = centerX - newWidth / 2;
        view.xMax = centerX + newWidth / 2;
    }
}

// Draw the background grid and axes
function drawGrid() {
    // Clear canvas and make grid cells squares
    context.clearRect(0, 0, canvas.width, canvas.height);
    squareGrid();

    // Set style
    context.strokeStyle = '#333';
    context.lineWidth = 1;

    // Draw vertical grid lines
    for (let x = Math.ceil(view.xMin); x <= Math.floor(view.xMax); x++) {
        if (x === 0) continue;
        const pos = toCanvas(x, 0);
        context.beginPath()
        context.moveTo(pos.x, 0);
        context.lineTo(pos.x, canvas.height);
        context.stroke();
    }

    // Draw horizontal grid lines
    for (let y = Math.ceil(view.yMin); y <= Math.floor(view.yMax); y++) {
        if (y === 0) continue;
        const pos = toCanvas(0, y);
        context.beginPath()
        context.moveTo(0, pos.y);
        context.lineTo(canvas.width, pos.y);
        context.stroke();
    }

    // Set style for axes
    context.strokeStyle = '#555';
    context.lineWidth = 2;

    // Draw x-axis
    if (view.yMin <=0 && view.yMax >= 0) {
        const pos = toCanvas(0, 0);
        context.beginPath();
        context.moveTo(0, pos.y);
        context.lineTo(canvas.width, pos.y);
        context.stroke();
    }

    // Draw y-axis
    if (view.xMin <=0 && view.xMax >= 0) {
        const pos = toCanvas(0, 0);
        context.beginPath();
        context.moveTo(pos.x, 0);
        context.lineTo(pos.x, canvas.height);
        context.stroke();
    }
}

// Check if user input is a valid math equation
function validateEquation(input) {
    let expression = input.toLowerCase().replace(/y\s*=\s*/g, '').trim();

    if (expression === '') return true;

    if (/^[a-wyz]$/i.test(expression)) {
        return false
    }

    if (/[x\d\)]\s*[\+\-\*\/\^]\s*$/.test(expression)) {
        return false;
    }

    if (/^[\*\/\^]/.test(expression)) {
        return false;
    }

    if (/[\+\-\*\/\^]\s*[\+\-\*\/\^]/.test(expression)) {
        return false;
    }

    if (/\(\)/.test(expression) || /sin\(\)|cos\(\)|tan\(\)|sqrt\(\)/.test(expression)) {
        return false;
    }

    let parenCount = 0;
    for (let char of expression) {
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
        if (parenCount < 0) return false;
    }
    if (parenCount !== 0) return false;

    try {
        const textExpression = parseEquation(expression);
        const testX = 1;
        const testExpressionWithX = textExpression.replace(/x/g, `(${testX})`);
        eval(testExpressionWithX);
    } catch (error) {
        return false;
    }

    return true;
}

// Converts user input to math expression
function parseEquation(input) {
    let expression = input.toLowerCase().replace(/y\s*=\s*/g, '').trim();

    // Default to x if empty
    if (expression === '') expression = 'x';

    // Convert constants
    expression = expression.replace(/pi/g, 'Math.PI');

    // Add multiplication between a number and x: "2x" becomes "2*x"
    expression = expression.replace(/(\d)([a-z\(])/g, '$1*$2');

    // Convert math functions to JS format
    expression = expression.replace(/sin\(/g, 'Math.sin(');   // sin(x) becomes Math.sin(x)
    expression = expression.replace(/cos\(/g, 'Math.cos(');   // cos(x) becomes Math.cos(x)
    expression = expression.replace(/tan\(/g, 'Math.tan(');   // tan(x) becomes Math.tan(x)
    expression = expression.replace(/sqrt\(/g, 'Math.sqrt('); // sqrt(x) becomes Math.sqrt(x)

    // Convert exponent notation: "x^2" becomes "x**2"
    expression = expression.replace(/\^/g, '**');

    return expression;
}

// Draw a single equation on the graph
function plotOne(expression, color, id) {
    // Parse the equation
    const parsed = parseEquation(expression);

    // Set color and thickness for equation
    context.strokeStyle = color;
    context.lineWidth = 2;

    let segments = [];
    let currentSegment = [];
    let lastValidY = null;

    // Plot points across the x-range
    const steps = canvas.width * 2;
    for (let i = 0; i <= steps; i++) {
        // Calculate x value for this point
        const x = view.xMin + (i / steps) * (view.xMax - view.xMin);

        try {
            // Replace 'x' in expression with current x value and evaluate
            const expressionX = parsed.replace(/x/g, `(${x})`);
            const y = eval(expressionX); // Calculate y value

            // Check if result is valid
            if (!isNaN(y) && isFinite(y)) {
                if (lastValidY !== null && Math.abs(y - lastValidY) > 10 * (view.yMax - view.yMin)) {
                    if (currentSegment.length > 0) {
                        segments.push([...currentSegment]);
                        currentSegment = [];
                    }
                }

                const point = toCanvas(x, y);
                currentSegment.push(point);
                lastValidY = y; // Update last valid y
            } else {
                if (currentSegment.length > 0) {
                    segments.push([...currentSegment]);
                    currentSegment = [];
                }
                lastValidY = null;
            }
        } catch {
            if (currentSegment.length > 0) {
                segments.push([...currentSegment]);
                currentSegment = [];
            }
            lastValidY = null;
        }
    }

    if (currentSegment.length > 0) {
        segments.push(currentSegment);
    }

    // Draw all segments
    segments.forEach(segment => {
        if (segment.length > 1) {
            context.beginPath();
            context.moveTo(segment[0].x, segment[0].y);
            for (let i = 1; i < segment.length; i++) {
                context.lineTo(segment[i].x, segment[i].y);
            }
            context.stroke();
        }
    });
}

// Draw all equations on the graph
function plotAll() {
    // Hide any previous error message
    errorMsg.style.display = 'none';

    // Get all equation input elements
    const inputs = document.querySelectorAll('.eq-input');
    const equations = [];

    // Validate each equation
    for (let input of inputs) {
        const expression = input.value.trim();

        if (!validateEquation(expression)) {
            errorMsg.textContent = 'Please enter a valid equation';
            errorMsg.style.display = 'block';
            return;
        }
        equations.push(expression || 'x'); // Add to array
    }

    // Draw the grid background
    drawGrid();

    // Plot each equation with its assigned color
    inputs.forEach((input, index) => {
        const expression = input.value.trim() || 'x'; // Get equation
        const id = parseInt(input.dataset.id || equationIds[index]); // Get equation ID
        const colorIndex = id % colors.length; // Calculate color index based on ID
        plotOne(expression, colors[colorIndex], id); // Plot equation with its color
    });
}

// Creates a new equation input box
function addEquation() {
    // Generate equation ID and add to array
    const id = nextId++;
    equationIds.push(id);
    const colorIndex = id % colors.length; // Calculate color index based on ID

    // Create new equation input HTML
    const div = document.createElement('div');
    div.className = 'mb-2';
    div.innerHTML = `
        <div class="input-group input-group-sm">
            <span class="input-group-text color-${colorIndex} bg-dark border-secondary py-1">y =</span>
            <input type="text" class="form-control eq-input border-secondary py-1"
                   value="x" data-id="${id}">
            <button class="btn btn-outline-danger border-secondary py-1"
                    onclick="removeEquation(this, ${id})">×</button>
        </div>
    `;

    // Add to equation container
    equationContainer.appendChild(div);

    const newInput = div.querySelector('input');
    newInput.focus();
    newInput.select();

    plotAll();
}

// Delete an equation input box
function removeEquation(button, id) {
    // Remove ID from array
    const index = equationIds.indexOf(id);
    if (index > -1) {
        equationIds.splice(index, 1);
    }

    // Remove the equation's HTML element from page
    button.closest('.mb-2').remove();

    plotAll();
}


// Create first equation input
const firstDiv = document.createElement('div');
firstDiv.className = 'mb-2';
firstDiv.innerHTML = `
    <div class="input-group input-group-sm">
        <span class="input-group-text color-0 bg-dark border-secondary py-1">y =</span>
        <input type="text" class="form-control eq-input border-secondary py-1"
               value="x" data-id="0">
        <button class="btn btn-outline-danger border-secondary py-1"
                onclick="removeEquation(this, 0)">×</button>
    </div>
`;
equationContainer.appendChild(firstDiv);


// Add new equation when add button is clicked
document.getElementById('addEquation').addEventListener('click', addEquation);

// Plot all equations when plot button is clicked
document.getElementById('plotEquation').addEventListener('click', plotAll);

// Plot all equations when enter key is pressed
document.addEventListener('keyup', function(e) {
    if (e.key === 'Enter' && e.target.classList.contains('eq-input')) {
        plotAll();
    }
});

// Select all text when an equation input is clicked
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('eq-input')) {
        e.target.select();
    }
});

// Start dragging when mouse is pressed down on canvas
canvas.addEventListener('mousedown', function(e) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

// Pan the graph when mouse moves on canvas while dragging
canvas.addEventListener('mousemove', function(e) {
    if (!isDragging) return;

    // Calculate how much mouse moved
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    // Calculate current graph ranges
    const xRange = view.xMax - view.xMin;
    const yRange = view.yMax - view.yMin;

    // Adjust view based on mouse movement
    view.xMin -= (dx / canvas.width) * xRange; // Move left boundary
    view.xMax -= (dx / canvas.width) * xRange; // Move right boundary
    view.yMin += (dy / canvas.height) * yRange; // Move bottom boundary
    view.yMax += (dy / canvas.height) * yRange; // Move top boundary

    // Update last mouse position
    lastX = e.clientX;
    lastY = e.clientY;

    // Redraw graph with new view
    plotAll();
})


// Stop dragging when mouse button is released or when mouse leaves canvas
canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);


// Zoom in/out when mouse wheel is scrolled on canvas
canvas.addEventListener('wheel', function(e) {
    e.preventDefault(); // Prevent browser scroll

    // Determine zoom direction
    // factor > 1 = zoom out, factor < 1 = zoom in
    const factor = e.deltaY > 0 ? 1.1 : 0.9;

    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouse position to graph coordinates
    const x = view.xMin + (mouseX / canvas.width) * (view.xMax - view.xMin);
    const y = view.yMin + ((canvas.height - mouseY) / canvas.height) * (view.yMax - view.yMin);

    // Zoom on mouse position
    view.xMin = x + (view.xMin - x) * factor;
    view.xMax = x + (view.xMax - x) * factor;
    view.yMin = y + (view.yMin - y) * factor;
    view.yMax = y + (view.yMax - y) * factor;

    // Redraw graph
    plotAll();
});

setupCanvas();

// Adjust canvas and redraw when window is resized
window.addEventListener('resize', setupCanvas);
