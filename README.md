# Graphing Calculator

[![Live Demo](https://img.shields.io/badge/Live_Demo-Online-green?style=for-the-badge&logo=github)](https://alkhemrt.github.io/Graphing-Calculator/)

<img width="1919" height="914" alt="Screenshot 2026-02-07 164806" src="https://github.com/user-attachments/assets/e01ac9ec-41cf-459c-bda3-89a13a8af578" />

### Description:
A web-based graphing calculator built with HTML, CSS, and JavaScript that allows the user to graph and plot multiple mathematical equations simultaneously.

### Files Structure:
#### 1. **index.html**
The main HTML file that structures the entire application. It creates a two-panel layout where the left panel (25%) contains the equation managment interface and the right panel (75%) houses the canvas element where all the graphing occurs.

#### 2. **style.css**
The custom stylesheet that defines the visual appearance of the graphing calculator. I decided to go with a dark theme for aesthetic reasons.

#### 3. **script.js**
The core JavasScript file that implements all the calculator functionality. It houses the event handlers to manage user interactions as well as the rest of the logic. Its core functions include:

1. `setupCanvas()`: Initializes canvas dimensions and draws initial graph

2. `toCanvas()`: Converts mathematical coordinates to pixel positions

3. `squareGrid()`: Ensures grid cells appear as squares and not rectangles

4. `drawGrid()`: Renders the background grid and coordinate axes

5. `validateEquation()`: Validates user input and makes sure the user typed a valid equation

6. `parseEquation()`: Converts user input to JavaScript-evaluable expressions

7. `plotOne()`: Draws a single equation with proper discontinuity handling

8. `plotAll()`: Manages the complete plotting process

9. `addEquation()`: Creates new equation input fields

10. `removeEquation()`: Deletes equations while preserving other colors

<img width="1919" height="916" alt="Screenshot 2026-02-07 165158" src="https://github.com/user-attachments/assets/358f938b-2b85-46ec-91b9-f03c292d2cc6" />

### Technical Challenges
#### 1. **Maintaining Visual Accuracy with Square Grids**
The initial implementation displayed coordinate grids as rectangles rather than true squares, which fundamentally distorted mathematical visualizations. A curve appeared elliptical, slopes were visually misleading, and you couldn't trust what you were seeing. The challenge was maintaining mathematical accuracy while accommodating various screen sizes and zoom levels.

I implemented the `squareGrid()` function, which continuously monitors and adjusts the view boundaries. The algorithm calculaes the canvas aspect ratio (width / height) and then compares it to the current view's aspect ration (x-range / y-range) and dynamically expands or contracts the y-range to maintain 1:1 unit proportions. This ensures that one unit in x equals one unit in y visually.

#### 2. **Handling Mathematical Discontinuities**
Functions like y = 1/x have asymptotes at x = 0 where the function is undefined. Initially, the graphing algorithm would draw a vertical line at these discontinuities, creating a misleading visual artifact that suggested the function existed at that x-value.

I had to go with a segment-based plotting approach in the `plotOne()` function that monitors y-value changes between consecutive points and detects "jumps" exceeding a threshold (indicating discontinuities) then breaks the line into separate segments at discontinuity boundaries and plots each continuous segment independently. This approach correctly renders functions like 1/x, tan(x), and other discontinuous functions without false vertical connections.

#### 3. **Color Persistence During Equation Management**
When deleting equations, the remaining equations would shift colors unexpectedly. For example, if equation 1 (red) and equation 2 (blue) were plotted, deleting equation 1 would cause equation 2 to turn red. This made it difficult to track specific equations while editing.

To fix this, I gave each equation a unique identifier upon creation and colors are assigned based on this unique ID (`colorIndex = id % colors.length`). When equations are deleted, their IDs are removed from tracking while existing IDs remain unchanged. This ensures equations maintain consistent colors regardless of addition or deletion order.

#### 4. **User-Friendly Equation Parsing**
The initial implementation required users to write equations in JavaScript syntax: `2*x` instead of `2x`, `Math.sin(x)` instead of `sin(x)`. This was simply way too unintuitive to use.

I had to create a parsing system in `parseEquation()` that automatically insets multiplication operators between numbers and variables (`2x` → `2*x`) and converts mathematical shorthand to JavaScript functions (`sin(x)` → `Math.sin(x)`) and handles exponent notation (`x^2` → `x**2`) and recognizes and supports common mathematical constants (`pi` → `Math.PI`).

<img width="1919" height="911" alt="Screenshot 2026-02-07 165547" src="https://github.com/user-attachments/assets/91add910-2314-46e9-98cc-850a23007609" />
