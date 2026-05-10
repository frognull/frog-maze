class Maze {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.cells = [];
        this.startX = 0;
        this.startY = 0;
        this.endX = width - 1;
        this.endY = height - 1;
        this.init();
    }

    init() {
        this.cells = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.cells.push({
                    x, y,
                    walls: { top: true, right: true, bottom: true, left: true },
                    visited: false
                });
            }
        }
    }

    getCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return this.cells[y * this.width + x];
    }

    removeWall(cell1, cell2) {
        const dx = cell2.x - cell1.x;
        const dy = cell2.y - cell1.y;
        if (dx === 1) { cell1.walls.right = false; cell2.walls.left = false; }
        if (dx === -1) { cell1.walls.left = false; cell2.walls.right = false; }
        if (dy === 1) { cell1.walls.bottom = false; cell2.walls.top = false; }
        if (dy === -1) { cell1.walls.top = false; cell2.walls.bottom = false; }
    }

    addWall(cell1, cell2) {
        const dx = cell2.x - cell1.x;
        const dy = cell2.y - cell1.y;
        if (dx === 1) { cell1.walls.right = true; cell2.walls.left = true; }
        if (dx === -1) { cell1.walls.left = true; cell2.walls.right = true; }
        if (dy === 1) { cell1.walls.bottom = true; cell2.walls.top = true; }
        if (dy === -1) { cell1.walls.top = true; cell2.walls.bottom = true; }
    }

    getNeighbors(cell, includeVisited = false) {
        const neighbors = [];
        const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        for (const [dx, dy] of dirs) {
            const neighbor = this.getCell(cell.x + dx, cell.y + dy);
            if (neighbor && (includeVisited || !neighbor.visited)) {
                neighbors.push(neighbor);
            }
        }
        return neighbors;
    }

    resetVisited() {
        for (const cell of this.cells) {
            cell.visited = false;
        }
    }

    toJSON() {
        return {
            width: this.width,
            height: this.height,
            startX: this.startX,
            startY: this.startY,
            endX: this.endX,
            endY: this.endY,
            walls: this.cells.map(c => ({
                x: c.x, y: c.y,
                walls: c.walls
            }))
        };
    }

    static fromJSON(data) {
        const maze = new Maze(data.width, data.height);
        maze.startX = data.startX;
        maze.startY = data.startY;
        maze.endX = data.endX;
        maze.endY = data.endY;
        for (let i = 0; i < maze.cells.length; i++) {
            maze.cells[i].walls = data.walls[i].walls;
        }
        return maze;
    }
}

class MazeRenderer {
    constructor(canvas, maze) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.maze = maze;
        this.cellSize = 20;
        this.offsetX = 0;
        this.offsetY = 0;
        this.playerX = 0;
        this.playerY = 0;
        this.solutionPath = [];
        this.animationCells = [];
        this.visitedCells = [];
        this.dpr = window.devicePixelRatio || 1;
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.canvas.width = width * this.dpr;
        this.canvas.height = height * this.dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.calculateSize();
        this.render();
    }

    calculateSize() {
        const logicalWidth = this.canvas.width / this.dpr;
        const logicalHeight = this.canvas.height / this.dpr;
        const drawerWidth = document.getElementById('drawer').classList.contains('collapsed') ? 0 : 320;
        const availableWidth = logicalWidth - drawerWidth - 40;
        const availableHeight = logicalHeight - 40;
        this.cellSize = Math.min(availableWidth / this.maze.width, availableHeight / this.maze.height);
        this.cellSize = Math.max(this.cellSize, 10);
        const totalWidth = this.maze.width * this.cellSize;
        const totalHeight = this.maze.height * this.cellSize;
        this.offsetX = (logicalWidth - drawerWidth - totalWidth) / 2;
        this.offsetY = (logicalHeight - totalHeight) / 2;
    }

    render() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawCells();
        this.drawVisitedCells();
        this.drawWalls();
        this.drawSolutionPath();
        this.drawAnimationCells();
        this.drawStartEnd();
        this.drawPlayer();
    }

    drawCells() {
        for (const cell of this.maze.cells) {
            const x = this.offsetX + cell.x * this.cellSize;
            const y = this.offsetY + cell.y * this.cellSize;
            this.ctx.fillStyle = '#0f3460';
            this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
        }
    }

    drawVisitedCells() {
        for (const cell of this.visitedCells) {
            const x = this.offsetX + cell.x * this.cellSize;
            const y = this.offsetY + cell.y * this.cellSize;
            this.ctx.fillStyle = 'rgba(0, 150, 255, 0.25)';
            this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
        }
    }

    drawWalls() {
        this.ctx.strokeStyle = '#4da6ff';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        for (const cell of this.maze.cells) {
            const x = this.offsetX + cell.x * this.cellSize;
            const y = this.offsetY + cell.y * this.cellSize;
            if (cell.walls.top) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + this.cellSize, y);
                this.ctx.stroke();
            }
            if (cell.walls.right) {
                this.ctx.beginPath();
                this.ctx.moveTo(x + this.cellSize, y);
                this.ctx.lineTo(x + this.cellSize, y + this.cellSize);
                this.ctx.stroke();
            }
            if (cell.walls.bottom) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, y + this.cellSize);
                this.ctx.lineTo(x + this.cellSize, y + this.cellSize);
                this.ctx.stroke();
            }
            if (cell.walls.left) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x, y + this.cellSize);
                this.ctx.stroke();
            }
        }
    }

    drawStartEnd() {
        const size = this.cellSize * 0.6;
        const offset = (this.cellSize - size) / 2;
        const startX = this.offsetX + this.maze.startX * this.cellSize + offset;
        const startY = this.offsetY + this.maze.startY * this.cellSize + offset;
        const endX = this.offsetX + this.maze.endX * this.cellSize + offset;
        const endY = this.offsetY + this.maze.endY * this.cellSize + offset;
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(startX, startY, size, size);
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(endX, endY, size, size);
    }

    drawPlayer() {
        const x = this.offsetX + this.playerX * this.cellSize + this.cellSize / 2;
        const y = this.offsetY + this.playerY * this.cellSize + this.cellSize / 2;
        const radius = this.cellSize * 0.25;
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSolutionPath() {
        if (this.solutionPath.length < 2) return;
        this.ctx.strokeStyle = '#00ffaa';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        const first = this.solutionPath[0];
        this.ctx.moveTo(
            this.offsetX + first.x * this.cellSize + this.cellSize / 2,
            this.offsetY + first.y * this.cellSize + this.cellSize / 2
        );
        for (let i = 1; i < this.solutionPath.length; i++) {
            const cell = this.solutionPath[i];
            this.ctx.lineTo(
                this.offsetX + cell.x * this.cellSize + this.cellSize / 2,
                this.offsetY + cell.y * this.cellSize + this.cellSize / 2
            );
        }
        this.ctx.stroke();
    }

    drawAnimationCells() {
        for (const cell of this.animationCells) {
            const x = this.offsetX + cell.x * this.cellSize;
            const y = this.offsetY + cell.y * this.cellSize;
            this.ctx.fillStyle = cell.color || 'rgba(233, 69, 96, 0.5)';
            this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
        }
    }

    setPlayerPosition(x, y) {
        this.playerX = x;
        this.playerY = y;
    }

    setSolutionPath(path) {
        this.solutionPath = path;
    }

    setAnimationCells(cells) {
        this.animationCells = cells;
    }

    setVisitedCells(cells) {
        this.visitedCells = cells;
    }

    getCellFromPixel(px, py) {
        const x = Math.floor((px - this.offsetX) / this.cellSize);
        const y = Math.floor((py - this.offsetY) / this.cellSize);
        return this.maze.getCell(x, y);
    }

    getWallFromPixel(px, py) {
        const cellX = (px - this.offsetX) / this.cellSize;
        const cellY = (py - this.offsetY) / this.cellSize;
        const x = Math.floor(cellX);
        const y = Math.floor(cellY);
        const cell = this.maze.getCell(x, y);
        if (!cell) return null;
        const localX = cellX - x;
        const localY = cellY - y;
        const threshold = 0.15;
        if (localY < threshold) return { cell, wall: 'top' };
        if (localY > 1 - threshold) return { cell, wall: 'bottom' };
        if (localX < threshold) return { cell, wall: 'left' };
        if (localX > 1 - threshold) return { cell, wall: 'right' };
        return null;
    }
}

class MazeGenerator {
    constructor(maze, renderer, speedCallback) {
        this.maze = maze;
        this.renderer = renderer;
        this.speedCallback = speedCallback;
        this.running = false;
    }

    async generate(algorithm) {
        if (this.running) return;
        this.running = true;
        this.maze.init();
        this.renderer.setSolutionPath([]);
        this.renderer.setAnimationCells([]);
        const algorithms = {
            recursiveBacktrack: () => this.recursiveBacktrack(),
            prim: () => this.prim(),
            kruskal: () => this.kruskal(),
            eller: () => this.eller(),
            recursiveDivision: () => this.recursiveDivision()
        };
        await algorithms[algorithm]();
        this.renderer.setAnimationCells([]);
        this.renderer.render();
        this.running = false;
    }

    delay() {
        return new Promise(resolve => setTimeout(resolve, this.speedCallback()));
    }

    async recursiveBacktrack() {
        const stack = [];
        const start = this.maze.getCell(0, 0);
        start.visited = true;
        stack.push(start);
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.maze.getNeighbors(current, false);
            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.maze.removeWall(current, next);
                next.visited = true;
                stack.push(next);
                this.renderer.setAnimationCells([{ x: next.x, y: next.y, color: 'rgba(255, 204, 0, 0.5)' }]);
                this.renderer.render();
                await this.delay();
            } else {
                stack.pop();
            }
        }
    }

    async prim() {
        const walls = [];
        const start = this.maze.getCell(0, 0);
        start.visited = true;
        const addWalls = (cell) => {
            const neighbors = this.maze.getNeighbors(cell, true);
            for (const n of neighbors) {
                if (!n.visited) walls.push({ cell, neighbor: n });
            }
        };
        addWalls(start);
        while (walls.length > 0) {
            const idx = Math.floor(Math.random() * walls.length);
            const { cell, neighbor } = walls[idx];
            walls.splice(idx, 1);
            if (!neighbor.visited) {
                this.maze.removeWall(cell, neighbor);
                neighbor.visited = true;
                addWalls(neighbor);
                this.renderer.setAnimationCells([{ x: neighbor.x, y: neighbor.y, color: 'rgba(0, 255, 170, 0.5)' }]);
                this.renderer.render();
                await this.delay();
            }
        }
    }

    async kruskal() {
        const sets = new Map();
        const edges = [];
        for (const cell of this.maze.cells) {
            sets.set(`${cell.x},${cell.y}`, new Set([cell]));
            if (cell.x < this.maze.width - 1) edges.push({ cell, dir: 'right' });
            if (cell.y < this.maze.height - 1) edges.push({ cell, dir: 'bottom' });
        }
        for (let i = edges.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [edges[i], edges[j]] = [edges[j], edges[i]];
        }
        const findSet = (cell) => sets.get(`${cell.x},${cell.y}`);
        const union = (set1, set2) => {
            for (const cell of set2) {
                set1.add(cell);
                sets.set(`${cell.x},${cell.y}`, set1);
            }
        };
        for (const { cell, dir } of edges) {
            const dx = dir === 'right' ? 1 : 0;
            const dy = dir === 'bottom' ? 1 : 0;
            const neighbor = this.maze.getCell(cell.x + dx, cell.y + dy);
            const set1 = findSet(cell);
            const set2 = findSet(neighbor);
            if (set1 !== set2) {
                this.maze.removeWall(cell, neighbor);
                union(set1, set2);
                this.renderer.setAnimationCells([
                    { x: cell.x, y: cell.y, color: 'rgba(170, 0, 255, 0.5)' },
                    { x: neighbor.x, y: neighbor.y, color: 'rgba(170, 0, 255, 0.5)' }
                ]);
                this.renderer.render();
                await this.delay();
            }
        }
    }

    async eller() {
        let cellSets = new Map();
        let nextRowSets = new Map();
        let setId = 0;
        for (let x = 0; x < this.maze.width; x++) {
            cellSets.set(x, setId++);
        }
        for (let y = 0; y < this.maze.height; y++) {
            for (let x = 0; x < this.maze.width - 1; x++) {
                const currentSet = cellSets.get(x);
                const nextSet = cellSets.get(x + 1);
                const shouldMerge = y === this.maze.height - 1 ? currentSet !== nextSet : currentSet !== nextSet && Math.random() < 0.5;
                if (shouldMerge) {
                    const cell = this.maze.getCell(x, y);
                    const rightCell = this.maze.getCell(x + 1, y);
                    this.maze.removeWall(cell, rightCell);
                    for (const [idx, s] of cellSets) {
                        if (s === nextSet) cellSets.set(idx, currentSet);
                    }
                }
            }
            if (y < this.maze.height - 1) {
                const setMembers = new Map();
                for (const [x, s] of cellSets) {
                    if (!setMembers.has(s)) setMembers.set(s, []);
                    setMembers.get(s).push(x);
                }
                nextRowSets = new Map();
                for (const [s, members] of setMembers) {
                    const shuffled = [...members].sort(() => Math.random() - 0.5);
                    const downCount = Math.max(1, Math.floor(Math.random() * shuffled.length) + 1);
                    for (let i = 0; i < downCount; i++) {
                        const x = shuffled[i];
                        const cell = this.maze.getCell(x, y);
                        const below = this.maze.getCell(x, y + 1);
                        this.maze.removeWall(cell, below);
                        nextRowSets.set(x, s);
                    }
                }
                for (let x = 0; x < this.maze.width; x++) {
                    if (!nextRowSets.has(x)) {
                        nextRowSets.set(x, setId++);
                    }
                }
                cellSets = nextRowSets;
            }
            const animCells = [];
            for (let x = 0; x < this.maze.width; x++) {
                animCells.push({ x, y, color: 'rgba(0, 170, 255, 0.5)' });
            }
            this.renderer.setAnimationCells(animCells);
            this.renderer.render();
            await this.delay();
        }
    }

    async recursiveDivision() {
        for (const cell of this.maze.cells) {
            cell.walls = { top: false, right: false, bottom: false, left: false };
        }
        for (let x = 0; x < this.maze.width; x++) {
            const top = this.maze.getCell(x, 0);
            const bottom = this.maze.getCell(x, this.maze.height - 1);
            top.walls.top = true;
            bottom.walls.bottom = true;
        }
        for (let y = 0; y < this.maze.height; y++) {
            const left = this.maze.getCell(0, y);
            const right = this.maze.getCell(this.maze.width - 1, y);
            left.walls.left = true;
            right.walls.right = true;
        }
        this.renderer.render();
        await this.divide(0, 0, this.maze.width, this.maze.height);
    }

    async divide(x, y, w, h) {
        if (w <= 1 || h <= 1) return;
        const horizontal = h > w ? true : (w > h ? false : Math.random() < 0.5);
        const animCells = [];
        if (horizontal) {
            const wallY = y + Math.floor(Math.random() * (h - 1));
            const passageX = Math.floor(Math.random() * w);
            for (let i = 0; i < w; i++) {
                if (i === passageX) continue;
                const cell = this.maze.getCell(x + i, wallY);
                const below = this.maze.getCell(x + i, wallY + 1);
                if (cell && below) {
                    cell.walls.bottom = true;
                    below.walls.top = true;
                }
                animCells.push({ x: x + i, y: wallY, color: 'rgba(100, 150, 255, 0.5)' });
            }
            this.renderer.setAnimationCells(animCells);
            this.renderer.render();
            await this.delay();
            await this.divide(x, y, w, wallY - y + 1);
            await this.divide(x, wallY + 1, w, h - (wallY - y + 1));
        } else {
            const wallX = x + Math.floor(Math.random() * (w - 1));
            const passageY = Math.floor(Math.random() * h);
            for (let i = 0; i < h; i++) {
                if (i === passageY) continue;
                const cell = this.maze.getCell(wallX, y + i);
                const right = this.maze.getCell(wallX + 1, y + i);
                if (cell && right) {
                    cell.walls.right = true;
                    right.walls.left = true;
                }
                animCells.push({ x: wallX, y: y + i, color: 'rgba(100, 150, 255, 0.5)' });
            }
            this.renderer.setAnimationCells(animCells);
            this.renderer.render();
            await this.delay();
            await this.divide(x, y, wallX - x + 1, h);
            await this.divide(wallX + 1, y, w - (wallX - x + 1), h);
        }
    }
}

class MazeSolver {
    constructor(maze, renderer, speedCallback) {
        this.maze = maze;
        this.renderer = renderer;
        this.speedCallback = speedCallback;
        this.running = false;
    }

    async solve(algorithm) {
        if (this.running) return;
        this.running = true;
        this.maze.resetVisited();
        this.renderer.setSolutionPath([]);
        this.renderer.setVisitedCells([]);
        this.renderer.setAnimationCells([]);
        this.visitedCells = [];
        this.startTime = Date.now();
        const algorithms = {
            bfs: () => this.bfs(),
            dfs: () => this.dfs(),
            astar: () => this.astar(),
            dijkstra: () => this.dijkstra(),
            wallFollower: () => this.wallFollower()
        };
        const path = await algorithms[algorithm]();
        this.renderer.setVisitedCells(this.visitedCells);
        if (path) {
            this.renderer.setSolutionPath(path);
        }
        this.renderer.render();
        this.running = false;
        const elapsed = Date.now() - this.startTime;
        return {
            path,
            visitedCount: this.visitedCells.length,
            pathLength: path ? path.length : 0,
            elapsed
        };
    }

    addVisitedCell(cell) {
        if (!this.visitedCells.some(c => c.x === cell.x && c.y === cell.y)) {
            this.visitedCells.push({ x: cell.x, y: cell.y });
            this.renderer.setVisitedCells(this.visitedCells);
        }
    }

    delay() {
        return new Promise(resolve => setTimeout(resolve, this.speedCallback()));
    }

    canMove(cell, direction) {
        const dirs = {
            top: { wall: 'top', dx: 0, dy: -1 },
            right: { wall: 'right', dx: 1, dy: 0 },
            bottom: { wall: 'bottom', dx: 0, dy: 1 },
            left: { wall: 'left', dx: -1, dy: 0 }
        };
        const d = dirs[direction];
        if (cell.walls[d.wall]) return null;
        return this.maze.getCell(cell.x + d.dx, cell.y + d.dy);
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        while (cameFrom.has(current)) {
            current = cameFrom.get(current);
            path.unshift(current);
        }
        return path;
    }

    async bfs() {
        const start = this.maze.getCell(this.maze.startX, this.maze.startY);
        const end = this.maze.getCell(this.maze.endX, this.maze.endY);
        const queue = [start];
        const cameFrom = new Map();
        start.visited = true;
        this.addVisitedCell(start);
        while (queue.length > 0) {
            const current = queue.shift();
            this.renderer.setAnimationCells([{ x: current.x, y: current.y, color: 'rgba(0, 200, 255, 0.5)' }]);
            this.renderer.render();
            await this.delay();
            if (current === end) {
                return this.reconstructPath(cameFrom, current);
            }
            const directions = ['top', 'right', 'bottom', 'left'];
            for (const dir of directions) {
                const neighbor = this.canMove(current, dir);
                if (neighbor && !neighbor.visited) {
                    neighbor.visited = true;
                    this.addVisitedCell(neighbor);
                    cameFrom.set(neighbor, current);
                    queue.push(neighbor);
                }
            }
        }
        return null;
    }

    async dfs() {
        const start = this.maze.getCell(this.maze.startX, this.maze.startY);
        const end = this.maze.getCell(this.maze.endX, this.maze.endY);
        const stack = [start];
        const cameFrom = new Map();
        start.visited = true;
        this.addVisitedCell(start);
        while (stack.length > 0) {
            const current = stack.pop();
            this.renderer.setAnimationCells([{ x: current.x, y: current.y, color: 'rgba(0, 200, 255, 0.5)' }]);
            this.renderer.render();
            await this.delay();
            if (current === end) {
                return this.reconstructPath(cameFrom, current);
            }
            const directions = ['top', 'right', 'bottom', 'left'];
            for (const dir of directions) {
                const neighbor = this.canMove(current, dir);
                if (neighbor && !neighbor.visited) {
                    neighbor.visited = true;
                    this.addVisitedCell(neighbor);
                    cameFrom.set(neighbor, current);
                    stack.push(neighbor);
                }
            }
        }
        return null;
    }

    async astar() {
        const start = this.maze.getCell(this.maze.startX, this.maze.startY);
        const end = this.maze.getCell(this.maze.endX, this.maze.endY);
        const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        const inOpenSet = new Set();
        gScore.set(start, 0);
        fScore.set(start, heuristic(start, end));
        openSet.push(start);
        inOpenSet.add(start);
        this.addVisitedCell(start);
        while (openSet.length > 0) {
            let minIdx = 0;
            for (let i = 1; i < openSet.length; i++) {
                if ((fScore.get(openSet[i]) || Infinity) < (fScore.get(openSet[minIdx]) || Infinity)) {
                    minIdx = i;
                }
            }
            const current = openSet[minIdx];
            openSet.splice(minIdx, 1);
            inOpenSet.delete(current);
            closedSet.add(current);
            this.renderer.setAnimationCells([{ x: current.x, y: current.y, color: 'rgba(0, 200, 255, 0.5)' }]);
            this.renderer.render();
            await this.delay();
            if (current === end) {
                return this.reconstructPath(cameFrom, current);
            }
            const directions = ['top', 'right', 'bottom', 'left'];
            for (const dir of directions) {
                const neighbor = this.canMove(current, dir);
                if (!neighbor || closedSet.has(neighbor)) continue;
                const tentativeG = (gScore.get(current) || 0) + 1;
                if (tentativeG < (gScore.get(neighbor) || Infinity)) {
                    cameFrom.set(neighbor, current);
                    gScore.set(neighbor, tentativeG);
                    fScore.set(neighbor, tentativeG + heuristic(neighbor, end));
                    if (!inOpenSet.has(neighbor)) {
                        openSet.push(neighbor);
                        inOpenSet.add(neighbor);
                        this.addVisitedCell(neighbor);
                    }
                }
            }
        }
        return null;
    }

    async dijkstra() {
        const start = this.maze.getCell(this.maze.startX, this.maze.startY);
        const end = this.maze.getCell(this.maze.endX, this.maze.endY);
        const dist = new Map();
        const cameFrom = new Map();
        const unvisited = new Set(this.maze.cells);
        for (const cell of this.maze.cells) {
            dist.set(cell, Infinity);
        }
        dist.set(start, 0);
        this.addVisitedCell(start);
        while (unvisited.size > 0) {
            let current = null;
            let minDist = Infinity;
            for (const cell of unvisited) {
                if (dist.get(cell) < minDist) {
                    minDist = dist.get(cell);
                    current = cell;
                }
            }
            if (!current || minDist === Infinity) break;
            unvisited.delete(current);
            this.addVisitedCell(current);
            this.renderer.setAnimationCells([{ x: current.x, y: current.y, color: 'rgba(0, 200, 255, 0.5)' }]);
            this.renderer.render();
            await this.delay();
            if (current === end) {
                return this.reconstructPath(cameFrom, current);
            }
            const directions = ['top', 'right', 'bottom', 'left'];
            for (const dir of directions) {
                const neighbor = this.canMove(current, dir);
                if (neighbor && unvisited.has(neighbor)) {
                    const alt = dist.get(current) + 1;
                    if (alt < dist.get(neighbor)) {
                        dist.set(neighbor, alt);
                        cameFrom.set(neighbor, current);
                    }
                }
            }
        }
        return null;
    }

    async wallFollower() {
        const start = this.maze.getCell(this.maze.startX, this.maze.startY);
        const end = this.maze.getCell(this.maze.endX, this.maze.endY);
        const cameFrom = new Map();
        const visitedSet = new Set();
        visitedSet.add(`${start.x},${start.y}`);
        this.addVisitedCell(start);
        let current = start;
        let facing = 'right';
        const turnRight = { top: 'right', right: 'bottom', bottom: 'left', left: 'top' };
        const turnLeft = { top: 'left', right: 'top', bottom: 'right', left: 'bottom' };
        const opposite = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' };
        while (current !== end) {
            this.renderer.setAnimationCells([{ x: current.x, y: current.y, color: 'rgba(0, 200, 255, 0.5)' }]);
            this.renderer.render();
            await this.delay();
            let nextDir = turnLeft[facing];
            let next = this.canMove(current, nextDir);
            if (next) {
                facing = nextDir;
            } else {
                next = this.canMove(current, facing);
                if (!next) {
                    nextDir = turnRight[facing];
                    next = this.canMove(current, nextDir);
                    if (next) {
                        facing = nextDir;
                    } else {
                        facing = opposite[facing];
                        next = this.canMove(current, facing);
                        if (!next) {
                            facing = turnRight[facing];
                            next = this.canMove(current, facing);
                        }
                    }
                }
            }
            if (!next) break;
            const prev = current;
            current = next;
            const key = `${current.x},${current.y}`;
            if (!visitedSet.has(key)) {
                visitedSet.add(key);
                this.addVisitedCell(current);
                cameFrom.set(current, prev);
            }
        }
        if (current === end) {
            return this.reconstructPath(cameFrom, current);
        }
        return null;
    }
}

class Fireworks {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.running = false;
        this.dpr = window.devicePixelRatio || 1;
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.canvas.width = width * this.dpr;
        this.canvas.height = height * this.dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    start() {
        this.running = true;
        this.particles = [];
        this.resize();
        this.animate();
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.createExplosion(), i * 300);
        }
        setTimeout(() => this.stop(), 3000);
    }

    stop() {
        this.running = false;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    createExplosion() {
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height * 0.5;
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff6600', '#ff0066'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                life: 1,
                decay: 0.01 + Math.random() * 0.02
            });
        }
    }

    animate() {
        if (!this.running) return;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
        requestAnimationFrame(() => this.animate());
    }
}

class App {
    constructor() {
        this.canvas = document.getElementById('mazeCanvas');
        this.drawer = document.getElementById('drawer');
        this.toggleBtn = document.getElementById('toggleDrawer');
        this.toggleIcon = document.getElementById('toggleIcon');
        this.maze = null;
        this.renderer = null;
        this.generator = null;
        this.solver = null;
        this.fireworks = new Fireworks(document.getElementById('fireworksCanvas'));
        this.mode = 'play';
        this.editType = 'wall';
        this.isGenerating = false;
        this.isSolving = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createMaze();
        window.addEventListener('resize', () => this.handleResize());
    }

    setupEventListeners() {
        this.toggleBtn.addEventListener('click', () => this.toggleDrawer());
        document.getElementById('generateBtn').addEventListener('click', () => this.generateMaze());
        document.getElementById('solveBtn').addEventListener('click', () => this.solveMaze());
        document.getElementById('clearSolutionBtn').addEventListener('click', () => this.clearSolution());
        document.getElementById('playModeBtn').addEventListener('click', () => this.setMode('play'));
        document.getElementById('editModeBtn').addEventListener('click', () => this.setMode('edit'));
        document.getElementById('exportBtn').addEventListener('click', () => this.exportMaze());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('fileInput').click());
        document.getElementById('fileInput').addEventListener('change', (e) => this.importMaze(e));
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            document.getElementById('speedValue').textContent = e.target.value;
        });
        document.querySelectorAll('input[name="editType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.editType = e.target.value;
            });
        });
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    toggleDrawer() {
        this.drawer.classList.toggle('collapsed');
        this.toggleBtn.classList.toggle('collapsed');
        this.toggleIcon.textContent = this.drawer.classList.contains('collapsed') ? '▶' : '◀';
        setTimeout(() => this.handleResize(), 300);
    }

    getSpeed() {
        const sliderValue = parseInt(document.getElementById('speedSlider').value);
        return Math.max(1, 101 - sliderValue);
    }

    createMaze() {
        const width = parseInt(document.getElementById('mazeWidth').value) || 20;
        const height = parseInt(document.getElementById('mazeHeight').value) || 20;
        this.maze = new Maze(width, height);
        this.renderer = new MazeRenderer(this.canvas, this.maze);
        this.generator = new MazeGenerator(this.maze, this.renderer, () => this.getSpeed());
        this.solver = new MazeSolver(this.maze, this.renderer, () => this.getSpeed());
        this.renderer.resize();
    }

    async generateMaze() {
        if (this.isGenerating || this.isSolving) return;
        this.isGenerating = true;
        this.createMaze();
        const algorithm = document.getElementById('generateAlgorithm').value;
        await this.generator.generate(algorithm);
        this.renderer.setPlayerPosition(this.maze.startX, this.maze.startY);
        this.renderer.setVisitedCells([]);
        document.getElementById('solveStats').style.display = 'none';
        this.renderer.render();
        this.isGenerating = false;
    }

    async solveMaze() {
        if (this.isGenerating || this.isSolving) return;
        this.isSolving = true;
        const algorithm = document.getElementById('solveAlgorithm').value;
        const result = await this.solver.solve(algorithm);
        if (result) {
            document.getElementById('solveStats').style.display = 'block';
            document.getElementById('statVisited').textContent = result.visitedCount;
            document.getElementById('statPathLength').textContent = result.pathLength;
            document.getElementById('statTime').textContent = result.elapsed + 'ms';
        }
        this.isSolving = false;
    }

    clearSolution() {
        this.renderer.setSolutionPath([]);
        this.renderer.setAnimationCells([]);
        this.renderer.setVisitedCells([]);
        document.getElementById('solveStats').style.display = 'none';
        this.renderer.render();
    }

    setMode(mode) {
        this.mode = mode;
        document.getElementById('playModeBtn').classList.toggle('active', mode === 'play');
        document.getElementById('editModeBtn').classList.toggle('active', mode === 'edit');
        document.getElementById('editOptions').style.display = mode === 'edit' ? 'block' : 'none';
    }

    handleKeyDown(e) {
        if (this.mode !== 'play' || this.isGenerating || this.isSolving) return;
        const cell = this.maze.getCell(this.renderer.playerX, this.renderer.playerY);
        if (!cell) return;
        let moved = false;
        const keyMap = {
            ArrowUp: 'top',
            ArrowRight: 'right',
            ArrowDown: 'bottom',
            ArrowLeft: 'left',
            w: 'top',
            d: 'right',
            s: 'bottom',
            a: 'left',
            W: 'top',
            D: 'right',
            S: 'bottom',
            A: 'left'
        };
        const dir = keyMap[e.key];
        if (!dir) return;
        const next = this.solver.canMove(cell, dir);
        if (next) {
            this.renderer.setPlayerPosition(next.x, next.y);
            moved = true;
            this.renderer.render();
            if (next.x === this.maze.endX && next.y === this.maze.endY) {
                this.showSuccess();
            }
        }
        if (moved) e.preventDefault();
    }

    handleCanvasClick(e) {
        if (this.mode !== 'edit' || this.isGenerating || this.isSolving) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (this.editType === 'wall') {
            const wall = this.renderer.getWallFromPixel(x, y);
            if (wall) {
                const { cell, wall: wallName } = wall;
                const dirs = { top: [0, -1], right: [1, 0], bottom: [0, 1], left: [-1, 0] };
                const [dx, dy] = dirs[wallName];
                const neighbor = this.maze.getCell(cell.x + dx, cell.y + dy);
                if (neighbor) {
                    if (cell.walls[wallName]) {
                        this.maze.removeWall(cell, neighbor);
                    } else {
                        this.maze.addWall(cell, neighbor);
                    }
                }
            }
        } else if (this.editType === 'start') {
            const cell = this.renderer.getCellFromPixel(x, y);
            if (cell) {
                this.maze.startX = cell.x;
                this.maze.startY = cell.y;
                this.renderer.setPlayerPosition(cell.x, cell.y);
            }
        } else if (this.editType === 'end') {
            const cell = this.renderer.getCellFromPixel(x, y);
            if (cell) {
                this.maze.endX = cell.x;
                this.maze.endY = cell.y;
            }
        }
        this.renderer.render();
    }

    showSuccess() {
        document.getElementById('successModal').classList.add('show');
        this.fireworks.start();
    }

    closeModal() {
        document.getElementById('successModal').classList.remove('show');
    }

    exportMaze() {
        const data = this.maze.toJSON();
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'maze.maze';
        a.click();
        URL.revokeObjectURL(url);
    }

    importMaze(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                this.maze = Maze.fromJSON(data);
                document.getElementById('mazeWidth').value = this.maze.width;
                document.getElementById('mazeHeight').value = this.maze.height;
                this.renderer = new MazeRenderer(this.canvas, this.maze);
                this.generator = new MazeGenerator(this.maze, this.renderer, () => this.getSpeed());
                this.solver = new MazeSolver(this.maze, this.renderer, () => this.getSpeed());
                this.renderer.setPlayerPosition(this.maze.startX, this.maze.startY);
                this.renderer.setVisitedCells([]);
                document.getElementById('solveStats').style.display = 'none';
                this.renderer.resize();
            } catch (err) {
                alert('导入失败：无效的迷宫文件');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    handleResize() {
        if (this.renderer) {
            this.renderer.resize();
        }
    }
}

window.addEventListener('load', () => {
    new App();
});