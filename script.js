function submitCoordinates() {
    const numNodes = parseInt(document.getElementById('numNodes').value);
    const coordinatesInput = document.getElementById('coordinates').value;
    const coordinates = coordinatesInput.split(' ').map(coord => coord.split(',').map(Number));

    if (coordinates.length !== numNodes) {
        alert(`Please enter ${numNodes} coordinates.`);
        return;
    }

    visualizeGraph(coordinates);
    const optimalPath = solveTSP(coordinates);
    displayInstructions(optimalPath, coordinates);
}

function visualizeGraph(coordinates) {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const radius = 8;
    const padding = 50;

    // Calculate scaling factors based on canvas size and coordinate range
    const maxX = Math.max(...coordinates.map(coord => coord[0]));
    const maxY = Math.max(...coordinates.map(coord => coord[1]));
    const minX = Math.min(...coordinates.map(coord => coord[0]));
    const minY = Math.min(...coordinates.map(coord => coord[1]));
    
    const scaleX = (canvas.width - 2 * padding) / (maxX - minX);
    const scaleY = (canvas.height - 2 * padding) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    // Center coordinates in the canvas
    const offsetX = (canvas.width - (maxX - minX) * scale) / 2 - minX * scale;
    const offsetY = (canvas.height - (maxY - minY) * scale) / 2 - minY * scale;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.lineWidth = 1;

    // Draw lines between all coordinates to form a complete graph
    for (let i = 0; i < coordinates.length; i++) {
        for (let j = 0; j < coordinates.length; j++) {
            if (i !== j) {
                ctx.moveTo(coordinates[i][0] * scale + offsetX, coordinates[i][1] * scale + offsetY);
                ctx.lineTo(coordinates[j][0] * scale + offsetX, coordinates[j][1] * scale + offsetY);
            }
        }
    }
    ctx.stroke();
    ctx.closePath();

    // Draw nodes and labels
    ctx.fillStyle = 'blue';
    ctx.strokestyle = 'black';
    coordinates.forEach((coord, index) => {
        ctx.beginPath();
        ctx.arc(coord[0] * scale + offsetX, coord[1] * scale + offsetY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.fillText(index === 0 ? "Starting Point" : `Address ${index}`, 
                     coord[0] * scale + offsetX + 10, coord[1] * scale + offsetY);
    });

    // Calculate optimal path
    const optimalPath = solveTSP(coordinates);
    
    // Draw the optimal path in red
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 99, 132, 1)';
    ctx.lineWidth = 3;

    for (let i = 0; i < optimalPath.length; i++) {
        const start = coordinates[optimalPath[i] - 1];
        const end = coordinates[optimalPath[(i + 1) % optimalPath.length] - 1];
        ctx.moveTo(start[0] * scale + offsetX, start[1] * scale + offsetY);
        ctx.lineTo(end[0] * scale + offsetX, end[1] * scale + offsetY);
    }
    ctx.stroke();
    ctx.closePath();

    // Display optimal path inside the canvas
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    
    // Update the path display to use "Starting Point" for address 0
    const pathText = `Optimal Path: ${optimalPath.map((node, index) => 
        node === 1 ? "Starting Point" : `Address ${node - 1}`
    ).join(' -> ')}`;
    
    // Check the position where the text will be displayed
    ctx.fillText(pathText, padding, canvas.height - padding); // Adjust padding as necessary
}

function solveTSP(coords) {
    const n = coords.length;
    const dist = Array.from(Array(n), () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                dist[i][j] = Math.sqrt(Math.pow(coords[i][0] - coords[j][0], 2) + Math.pow(coords[i][1] - coords[j][1], 2));
            }
        }
    }

    const dp = Array(1 << n).fill(null).map(() => Array(n).fill(Infinity));
    dp[1][0] = 0;

    for (let mask = 1; mask < (1 << n); mask += 1) {
        for (let u = 0; u < n; u++) {
            if (mask & (1 << u)) {
                for (let v = 0; v < n; v++) {
                    if (mask & (1 << v)) continue;
                    dp[mask | (1 << v)][v] = Math.min(dp[mask | (1 << v)][v], dp[mask][u] + dist[u][v]);
                }
            }
        }
    }

    let optimalCost = Math.min(...dp[(1 << n) - 1]);
    let path = findPath(dp, dist, n);
    return path;
}

function findPath(dp, dist, n) {
    let mask = (1 << n) - 1;
    let u = 0;
    let path = [u];

    for (let i = 1; i < n; i++) {
        let v = -1;
        for (let j = 0; j < n; j++) {
            if (mask & (1 << j)) {
                if (v === -1 || dp[mask][j] < dp[mask][v]) {
                    v = j;
                }
            }
        }
        mask ^= (1 << v);
        path.push(v);
    }
    return path.map(index => index + 1);
}

function displayInstructions(optimalPath, coordinates) {
    let totalDistance = 0;
    let instructions = "Instructions:\n";

    for (let i = 0; i < optimalPath.length; i++) {
        const start = optimalPath[i] - 1;
        const end = optimalPath[(i + 1) % optimalPath.length] - 1;
        const distance = Math.sqrt(
            Math.pow(coordinates[start][0] - coordinates[end][0], 2) +
            Math.pow(coordinates[start][1] - coordinates[end][1], 2)
        );

        totalDistance += distance;

        // Set appropriate labels for each step
        if (i === 0) {
            instructions += `1) Start at the Starting Point and head to Address ${optimalPath[i + 1] - 1}\n`;
        } else if (i < optimalPath.length - 1) {
            instructions += `${i + 1}) Go from Address ${optimalPath[i] - 1} to Address ${optimalPath[i + 1] - 1}\n`;
        } else {
            instructions += `${i + 1}) Return to the Starting Point\n`;
        }
    }

    instructions += `\nTotal Distance: ${totalDistance.toFixed(2)} units\n`;
    instructions += `Optimal Path: ${optimalPath.map((node, index) => index === 0 ? "Starting Point" : `Address ${node - 1}`).join(" -> ")}`;

    document.getElementById('result').innerText = instructions;
}
