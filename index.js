const G = 6.67 * Math.pow(10, -11);
const simulationSpeed = 5;

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    sub(vector){
        return new Vector(this.x - vector.x, this.y - vector.y);
    }

    add(vector){
        return new Vector(this.x + vector.x, this.y + vector.y)
    }

    normalize(){
        const d = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) )
        return new Vector(this.x/d, this.y/d);
    }

    mult(n){
        return new Vector(this.x * n, this.y * n);
    }

    setMag(n) {
        return this.normalize().mult(n);
    };

    magSq() {
        const x = this.x;
        const y = this.y;
        return x * x + y * y;
    }

    mag() {
        return Math.sqrt(this.magSq());
    }

    dist(vector) {
        return Math.sqrt(Math.pow(this.x - vector.x, 2) + Math.pow(this.y - vector.y, 2) )
    }

    rotate(val) {
        const mag = this.mag();
        const newHeading = this.heading() + val;
        return new Vector(Math.cos(newHeading) * mag, Math.sin(newHeading) * mag)
    }

    heading() {
        return Math.atan2(this.y, this.x);
    };
}

let mousePos = undefined;


function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomG(v = 2){
    let r = 0;
    for(let i = v; i > 0; i --){
        r += Math.random();
    }
    return r / v;
}

class Galaxy {
    constructor(container, starLimit) {
        this.container = container;
        this.sun = {
            pos: new Vector(container.clientWidth / 2, container.scrollHeight / 2),
            mass: 20000000000,
        }
        this._bindEvents();
        this.stars = (new Array(starLimit))
            .fill(undefined)
            .map(() => {
                return new Star(this.sun, this.container);
            });
    }

    display(){
        this.stars.forEach(s => s.display());
    }

    generate(){
        this.container.append(this._createSun(), ...this.stars.map(s => s.createElement()))
        this.stars.forEach(s => s.animate());
    }

    _bindEvents(){
        this.container.addEventListener("mousedown", (e) => {
            this.canMoveStars = true;
        });

        this.container.addEventListener("mouseup", (e) => {
            this.canMoveStars = false;
            mousePos = undefined;
        });

        this.container.onmousemove = (e) => {
            if(!this.canMoveStars) return;
            mousePos = new Vector(e.clientX, e.clientY);
        }

        this.container.addEventListener("touchmove", (e) => {
            mousePos = new Vector(e.touches[0].clientX, e.touches[0].clientY);
        });

        this.container.addEventListener('touchend', () => {
            mousePos = undefined;
        });
    }

    _createSun(){
        const el = document.createElement('div');
        el.classList.add('sun');
        el.style.left = `${(this.container.clientWidth - 20) / 2 }px`;
        el.style.top = `${(this.container.scrollHeight - 20) / 2 }px`;
        return el;
    }
}


class Star {



    static starCount = 0;
    constructor(sun, container) {
        this.container = container
        this.sun = sun;
        this.id = Star.starCount++;
        this.mass = randomNumber(1, 5);
        this.initPos();
    }

    /*
    Black magic here
     */
    initPos(){
        const turbulence = 50
        const r = randomNumber(50 , Math.min(this.container.clientWidth * randomG(), this.container.scrollHeight * randomG()))
        const theta = randomNumber(0, Math.PI * 2 * 100000) / 100000;
        const initialisationVector = new Vector(r*Math.cos(theta), r*Math.sin(theta));
        this.vel = new Vector(
            initialisationVector.x + randomNumber(-turbulence, turbulence),
            initialisationVector.y + randomNumber(-turbulence, turbulence))
            .mult(randomNumber(0,1) === 0 ? -1 : 1);
        this.vel = this.vel.rotate(Math.PI / 2);
        this.vel = this.vel.setMag(Math.sqrt(G * this.sun.mass/initialisationVector.mag()))
        this.pos = new Vector(initialisationVector.x  + this.container.clientWidth/2, initialisationVector.y + this.container.scrollHeight/2)
    }




    display(){
        console.log(`${this.id} --- [${this.posX};${this.posY}] (${this.ttl})`)
    }

    createElement(){
        const el = document.createElement('div');
        el.id = `star-${this.id}`;
        el.classList.add('star');
        this.elementRef = el;
        this.updateElementRef();
        return el;
    }

    updateElementRef(){
        this.elementRef.style.left = `${this.pos.x}px`;
        this.elementRef.style.top = `${this.pos.y}px`;
    }

    async animate() {
        this.isAnimated = true;

        const instance = this;

        async function execute() {
            while (instance.isAnimated) {
                await new Promise(resolve => setTimeout(resolve, 0));
                instance.orbit();
                instance.updateElementRef();
            }
        }

        execute();
    }

    stopAnimation(){
        this.isAnimated = false;
    }

    orbit(){
        // attract
        let force = new Vector(this.sun.pos.x, this.sun.pos.y).sub(this.pos);
        let att = this._attractionForceToElement(this.sun.pos, this.sun.mass)
        const forces = [force.setMag(att)];

        if(mousePos !== undefined){
            let forceM = mousePos.sub(this.pos);
            let attM = this._attractionForceToElement(mousePos, 100000000000)
            forces.push(forceM.setMag(attM));
        }
        this.vel.x += forces.reduce((acc, f) => acc + f.x, 0) / this.mass
        this.vel.y += forces.reduce((acc, f) => acc + f.y, 0) / this.mass

        // move
        this.pos = this.pos.add(this.vel);

    }

    _attractionForceToElement(el, mass) {
        return G * (mass * this.mass) / (this.pos.dist(el) * this.pos.dist(el));
    }
}
