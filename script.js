// script.js

var data;
d3.csv("Mobs.csv").then(function(d) {
    data = d;
    // convert numerical data into integers
    d.forEach(p => { 
        p.ID = +p.ID;
        p.healthPoints = +p.healthPoints;
        p.maxDamage = +p.maxDamage;
        delete p.debutDate; // dont need it
    });

    // add era for each data point
    data.forEach(d => {
        d.era = eraFromVersion(d.minecraftVersion || "");
    });

    // draw the actual visualization
    drawVis();
});

// get each mob's era
// divided into debut-era, classic-era, nether-era, and modern-era based on my own preference :)
function eraFromVersion(ver) {
    const v = (ver || "").toString();
    if (v.startsWith("1.16")) return "nether-era";
    if (v.startsWith("1.17") || v.startsWith("1.19") || v.startsWith("1.20")) return "modern-era";
    if (v.startsWith("1.8") || v.startsWith("1.9") || v.startsWith("1.10") || v.startsWith("1.11") || v.startsWith("1.12") || v.startsWith("1.13") || v.startsWith("1.14") || v.startsWith("1.15")) return "classic-era"
    if (v.startsWith("1.0") || v.startsWith("1.1") || v.startsWith("1.2") || v.startsWith("1.4") || v.startsWith("1.6")) return "debut-era";
    return "modern-era";
}

// draw visualization
function drawVis() {
    // compute ring order and radii
    const eras = ["modern-era", "nether-era", "classic-era", "debut-era"]
    const width = 950, height = 750;
    const cx = width/2, cy = height/2;
    const baseRadius = 80;
    const ringGap = 80;
    const ringRadius = new Map();
    eras.forEach((e,i) => ringRadius.set(e, baseRadius + i * ringGap));

    // group data based on era and calculate target angles
    const grouped = d3.groups(data, d => d.era);
    grouped.forEach(([era, items]) => {
        items.sort((a,b) => a.name.localeCompare(b.name));
        items.forEach((it, idx) => {
            it.angle = (idx / items.length) * Math.PI * 2;
            it.ringIndex = idx;
            it.itemsInRing = items.length;
        });
    });

    // hp scale
    const hpExtent = d3.extent(data, d => d.healthPoints);
    const hpRadius = d3.scaleSqrt()
                        .domain(hpExtent)
                        .range([6, 28]);

    // maxDamage scale
    const damageMax = d3.max(data, d => d.maxDamage);
    const damageScale = d3.scaleLinear()
                            .domain([0, damageMax || 1])
                            .range([0, Math.PI * 2]);

    // color scale for mob type
    const colorScale = d3.scaleOrdinal()
                            .domain(["hostile","passive","neutral"])
                            .range(["#7bd389","#ff6b6b","#8ec5ff"]);

    // svg
    const svg = d3.select("#svg-container")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .style("overflow", "visible");
    
    // draw ring elements
    const ringsG = svg.append("g")
                        .attr("transform", `translate(${cx},${cy})`);
    ringsG.selectAll("circle.ring")
            .data(eras)
            .enter()
            .append("circle")
            .classed("ring", true)
            .attr("r", d => ringRadius.get(d))
            .attr("fill","none")
            .attr("stroke","#1f3340")
            .attr("stroke-width",1)
            .attr("opacity",0.9);

    ringsG.selectAll("text.rlabel")
            .data(eras)
            .enter()
            .append("text")
            .classed("ring-label", true)
            .attr("y", d => -ringRadius.get(d) - 25)
            .text(d => {
                if (d === "classic-era") return "classic era";
                if (d === "debut-era") return "debut era";
                if (d === "nether-era") return "nether era";
                return "modern era";
            });

    // define the nodes
    const nodes = data.map(d => {
        const r = ringRadius.get(d.era);    // get radius based on era
        const angle = d.angle;              // get the angle computed before

        // convert polar to Cartesian with tiny randomness
        const startX = cx + Math.cos(angle) * r;
        const startY = cy + Math.sin(angle) * r;

        return {
            ...d,
            rTarget: r,
            angleTarget: angle,
            x: startX,
            y: startY,
            radius: hpRadius(d.healthPoints)
        };
    });

    // TODO: check this, it's not really working as i wanted it to :(
    const simulation = d3.forceSimulation(nodes)
                            .force("towardRing", forceRadialTarget(0.1))
                            .force("collide", d3.forceCollide().radius(d => d.radius + 6).iterations(2))
                            .on("tick", ticked);

    function forceRadialTarget(strength) {
        let allNodes;
        function force(alpha) {
            allNodes.forEach(d => {
                const targetX = cx + Math.cos(d.angleTarget) * d.rTarget;
                const targetY = cy + Math.sin(d.angleTarget) * d.rTarget;

                d.vx += (targetX - d.x) * strength * alpha;
                d.vy += (targetY - d.y) * strength * alpha;
            });
        }

        force.initialize = function(nodes) {
            allNodes = nodes;
        }
        return force;
    }

    // draw the nodes
    const gNodes = svg.append("g");
    const nodeG = gNodes.selectAll("g.node")
                        .data(nodes, d => d.ID)
                        .enter()
                        .append("g")
                        .classed("node", true)
                        .attr("cursor", "pointer")
                        .on("mouseover", handleHover)
                        .on("mousemove", handleMove)
                        .on("mouseout", handleOut)
                        .on("click", handleClick);

    d3.select("body").on("click", handleClickOut);  // if you click outside then deselect

    // draw the arcs for the damage
    const arcGen = d3.arc().startAngle(0);
    nodeG.append("path")
        .classed("damage-arc", true)
        .attr("fill", d => d3.color(colorScale(d.behaviorTypes) || "#aaa").darker(0.6))
        .attr("opacity", 0.95);

    // draw the circles and color based on mob type
    nodeG.append("circle")
        .classed("body", true)
        .attr("stroke-width", 2)
        .attr("stroke", d => d3.color(colorScale(d.behaviorTypes) || "#888").darker(0.8))
        .attr("fill", d => colorScale(d.behaviorTypes) || "#888")
        .style("mix-blend-mode","screen");

    // add text for each mob name
    nodeG.append("text")
        .classed("nlabel", true)
        .attr("text-anchor","middle")
        .attr("font-size",10)
        .attr("dy", d => d.radius + 12)
        .attr("fill","#dbeeff")
        .text(d => d.name.replace(/_/g," "));

    nodeG.attr("transform", d => `translate(${d.x},${d.y})`);
    nodeG.select("circle.body")
            .attr("r", d => d.radius);

    // at each update, used force documentation 
    function ticked() {
        // update positions
        nodeG.attr("transform", d => `translate(${d.x},${d.y})`);

        // update node positions
        nodeG.select("circle.body")
            .attr("r", d => d.radius);

        // update damage arcs
        nodeG.select("path.damage-arc")
            .attr("d", d => {
                const rInner = d.radius + 4;
                const rOuter = d.radius + 9;
                const angle = damageScale(d.maxDamage || 0);    // get the angle based on the scale
                return arcGen({ // create the arc attributes
                    innerRadius: rInner,
                    outerRadius: rOuter,
                    endAngle: angle,
                    startAngle: -angle / 2
                });
            });
    }

    // create tooltip, nothing selected initially
    const tooltip = d3.select("#tooltip");
    let selected = null;

    // hover over node to get tooltip
    function handleHover(e,d) {
        if (selected && selected.ID === d.ID) return;
        tooltip.style("display","block");
        showTooltipContent(d);
    }

    // on mouse move, update tooltip location
    function handleMove(e,d) {
        tooltip.style("left", (e.pageX + 14) + "px")
               .style("top", (e.pageY + 10) + "px");
    }

    // if mouse is outside the node, clear tooltip
    function handleOut(e,d) {
        if (selected && selected.ID === d.ID) return;
        tooltip.style("display","none");
    }

    // if node is clicked on, then show the details in the box
    function handleClick(e,d) {
        selected = d;
        renderDetail(d);
        nodeG.selectAll("circle")
            .attr("opacity", n => n.ID === d.ID ? 1 : 0.35)
            .attr("stroke-width", n => n.ID === d.ID ? 3.2 : 2);
        nodeG.selectAll("path.damage-arc")
            .attr("opacity", n => n.ID === d.ID ? 1 : 0.35)
            .attr("stroke-width", n => n.ID === d.ID ? 3.2 : 2);
    }

    // if you click out which something is selected, deselect
    function handleClickOut(e,d) {
        if (e.target.closest(".node")) return;
        selected = null;

        // reset detail box
        d3.select("#detail-content").html("No mob selected.");

        // reset node visuals
        nodeG.selectAll("circle")
            .attr("opacity", 1)
            .attr("stroke-width", 2);
        nodeG.selectAll("path.damage-arc")
            .attr("opacity", 1)
            .attr("stroke-width", 2);

        // clear tooltip
        tooltip.style("display","none");
    }

    // show tooltip
    function showTooltipContent(d) {
        tooltip.html(`
            <div style="font-weight:600; margin-bottom:6px; font-size:14px">${d.name.replace(/_/g," ")}</div>
            <div><strong>Behavior:</strong> ${d.behaviorTypes}</div>
            <div><strong>Spawn:</strong> ${d.spawnBehavior}</div>
            <div><strong>Health:</strong> ${d.healthPoints}</div>
            <div><strong>Max damage:</strong> ${d.maxDamage}</div>
            ${d.reproductiveRequirement ? `<p><strong>Reproductive Requirement:</strong> ${d.reproductiveRequirement}</p>` : ""}`);     // only show reproductive requirement attribute if its non empty
    }

    // show detail in box
    function renderDetail(d) {
        const el = d3.select("#detail-content");
        el.html("");
        el.append("div").html(`<strong>Name:</strong> ${d.name.replace(/_/g," ")}`);
        el.append("div").html(`<strong>Behavior:</strong> ${d.behaviorTypes}`);
        el.append("div").html(`<strong>Spawn behavior:</strong> ${d.spawnBehavior}`);
        el.append("div").html(`<strong>Health points:</strong> ${d.healthPoints}`);
        el.append("div").html(`<strong>Max damage:</strong> ${d.maxDamage}`);
        el.append("div").html(`<strong>Version:</strong> ${d.minecraftVersion}`);
        el.append("div").html(`${d.reproductiveRequirement ? `<strong>Reproductive Requirement:</strong> ${d.reproductiveRequirement}` : ""}`);     // only show reproductive requirement attribute if its non empty
        el.append("div")    // clear button
            .classed("pin", true)
            .text("Unpin or Clear")
            .on("click", () => {
                selected = null;
                el.html("No mob selected.");
                nodeG.selectAll("circle")
                        .attr("opacity", 1)
                        .attr("stroke-width", 2);
                nodeG.selectAll("path.damage-arc")
                        .attr("opacity", 1)
                        .attr("stroke-width", 2);
                tooltip.style("display","none");    // remove tooltip
            });
    }

    renderDetail(nodes[0]);
}
