class FractalTree {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isDrawing = true;
        this.lineWidth = 3;
        this.color = '#fff';
        this.speed = 6; // px per frame
        this.maxDepth = 9;
        this.branches = [];
        this.animationBranches = [];
        this.mode = 'draw'; // 'draw' or 'erase'
        this.currentBranchIndex = 0;
        this.initTree();
    }

    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    initTree() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.branches = [];
        this.animationBranches = [];
        this.mode = 'draw';
        this.currentBranchIndex = 0;
        const startX = this.canvas.width / 2;
        const startY = this.canvas.height - 40;
        const length = 100;
        const angle = -Math.PI / 2;
        // Ana gövdeyi başlat
        this.createBranches({
            x: startX,
            y: startY,
            angle,
            length,
            depth: 0
        });
        // Her dal için animasyon durumu ekle
        this.animationBranches = this.branches.map(branch => ({ ...branch, progress: 0 }));
    }

    createBranches(branch) {
        const { x, y, angle, length, depth } = branch;
        if (depth > this.maxDepth || length < 2) return;
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;
        this.branches.push({ x, y, angle, length, depth, endX, endY });
        if (depth < this.maxDepth) {
            const branchCount = Math.floor(this.random(2, 4));
            for (let i = 0; i < branchCount; i++) {
                const newAngle = angle + this.random(-Math.PI / 4, Math.PI / 4);
                const newLength = length * this.random(0.65, 0.8);
                this.createBranches({
                    x: endX,
                    y: endY,
                    angle: newAngle,
                    length: newLength,
                    depth: depth + 1
                });
            }
        }
    }

    animate() {
        if (!this.isDrawing) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Çizili olan dalları çiz
        for (let i = 0; i < this.animationBranches.length; i++) {
            const branch = this.animationBranches[i];
            let progress = branch.progress;
            if (this.mode === 'erase') progress = 1 - progress;
            if (progress > 0) {
                const currentX = branch.x + (branch.endX - branch.x) * progress;
                const currentY = branch.y + (branch.endY - branch.y) * progress;
                this.ctx.beginPath();
                this.ctx.moveTo(branch.x, branch.y);
                this.ctx.lineTo(currentX, currentY);
                this.ctx.strokeStyle = this.color;
                this.ctx.lineWidth = Math.max(1, this.lineWidth - branch.depth * 0.15);
                this.ctx.stroke();
            }
        }
        // Animasyonlu dalı güncelle
        if (this.mode === 'draw') {
            if (this.currentBranchIndex < this.animationBranches.length) {
                const branch = this.animationBranches[this.currentBranchIndex];
                branch.progress += this.speed / branch.length;
                if (branch.progress >= 1) {
                    branch.progress = 1;
                    this.currentBranchIndex++;
                }
            } else {
                // Tüm dallar çizildi, erase moduna geç
                setTimeout(() => {
                    this.mode = 'erase';
                    this.currentBranchIndex = this.animationBranches.length - 1;
                    requestAnimationFrame(() => this.animate());
                }, 800);
                return;
            }
        } else if (this.mode === 'erase') {
            if (this.currentBranchIndex >= 0) {
                const branch = this.animationBranches[this.currentBranchIndex];
                branch.progress -= this.speed / branch.length;
                if (branch.progress <= 0) {
                    branch.progress = 0;
                    this.currentBranchIndex--;
                }
            } else {
                // Tüm dallar silindi, tekrar çizim moduna geç
                setTimeout(() => {
                    this.mode = 'draw';
                    this.currentBranchIndex = 0;
                    requestAnimationFrame(() => this.animate());
                }, 800);
                return;
            }
        }
        requestAnimationFrame(() => this.animate());
    }

    start() {
        this.isDrawing = true;
        this.animate();
    }

    stop() {
        this.isDrawing = false;
    }
}

const canvas = document.getElementById('treeCanvas');
const tree = new FractalTree(canvas);
tree.start(); 