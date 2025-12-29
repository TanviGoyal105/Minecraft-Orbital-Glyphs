# Minecraft Orbital Glyphs
Minecraft Orbital Glyphs is an interactive, custom data visualization that explores the attributes of Minecraft mobs using radial glyphs. Each mob is represented as a visual “glyph” positioned in an orbital ring corresponding to its introduction era in the game, allowing viewers to compare combat strength, behavior, and progression across versions of Minecraft.

## Overview
This visualization encodes multiple mob attributes into a single composite glyph:
- **Ring position** represents the Minecraft era in which the mob was introduced  
- **Circle size** encodes health points  
- **Arc length** encodes maximum damage  
- **Color** represents mob behavior (hostile, passive, or neutral)

Users can hover to view quick details or click on a glyph to pin more detailed information in a side panel. The layout uses a force-based system to maintain spacing while preserving a structured orbital layout.


## Files in This Repository
- **`index.html`**  
  The main HTML file that defines the page layout, styles, legend, and containers for the visualization and interaction panels.
- **`script.js`**  
  The core D3.js logic that:
  - Loads and preprocesses the dataset  
  - Assigns eras based on Minecraft version numbers  
  - Constructs orbital rings and custom glyphs  
  - Implements force simulation, scaling, and interactions (hover, click, pin)
- **`Mobs.csv`**  
  The dataset containing Minecraft mob attributes, including health points, maximum damage, behavior type, spawn behavior, and version information.

## Methodology
The goal of this project is to explore how complex, multidimensional data can be represented through **custom glyph design** rather than conventional charts.

Key design decisions include:
- Using **radial rings** to communicate temporal progression (game eras)
- Encoding quantitative attributes (health and damage) through **size and arc length**
- Combining force simulation with polar positioning to balance structure and readability
- Prioritizing interpretability while maintaining a visually engaging, exhibit-like aesthetic

This approach encourages viewers to discover patterns, such as how mob difficulty and behavior evolve across Minecraft versions.

## How to Run
### Option 1: Using Python
```bash
python -m http.server
```
Then open your browser and navigate to:
```arduino
http://localhost:8000
```
### Option 2: Using VS Code Live Server
- Install the Live Server extension
- Right-click `index.html`
- Select **"Open with Live Server"**

## Dependencies:
- D3.js v7
  Loaded via CDN:
  ```html
  <script src="https://d3js.org/d3.v7.min.js"></script>
  ```

## Future Improvements: 
Potential extensions for this project include:
- Improve UI
- Filtering mobs by behavior type or era
- Adding a search feature for specific mob names
- Improving force constraints for more uniform spacing
