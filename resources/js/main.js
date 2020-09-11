/* 
    Created on : 11.09.2020, 19:57:52
    Author     : Dennis Lange
    Project    : SNAKE CLONE

    POSSIBLE IMPROVEMENTS 
    - index.html < ugly rn
    - modulize js 
    - refactor js < make usage of more es6 features

    IDEAS:
    - implement bot
    - implement warp 
    - implement bomb
    - implement another snake controlled by bot which tries to steal food and kill player by running infront of its head
    - implement menu for user so he can controll tick / spawn rate of food / bot who plays for him
*/


class Object {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.draw = this.draw.bind(this);
    }

    draw(context) {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.size, this.size);
    }
}

class Food extends Object {
    constructor(x, y, size, color) {
        super(x, y, size, color);
        this.spawn = this.spawn.bind(this);
        this.spawned = false;
    }

    spawn(maxX, maxY, size){
        let maxNumX = maxX / size;
        let maxNumY = maxY / size;
        let randomx = Math.floor(Math.random() * maxNumX + 1) * size;
        let randomy = Math.floor(Math.random() * maxNumY + 1) * size;
        this.x = randomx;
        this.y = randomy;
        this.spawned = true;
        //console.log("Food spawned in location x:" + this.x + " y:" + this.y);
    }
}



class Snake extends Object {
    constructor(x, y, size, color, tailcolor, dir) {
        super(x, y, size, color);
        this.tailcolor = tailcolor;
        // current direction of the head 0 = top; 1 = right; 2 = down; 3 = left (as in css)
        this.dir = dir;
        this.tail = [];
        this.alive = true;
        // bind functions
        this.print = this.print.bind(this);
        this.drawTail = this.drawTail.bind(this);
        this.handleKeyboardInput = this.handleKeyboardInput.bind(this);
        this.doNextMove = this.doNextMove.bind(this);
        this.checkCollision = this.checkCollision.bind(this);
        this.move = this.move.bind(this);
        this.moveTailTowardsHead = this.moveTailTowardsHead.bind(this);
        this.initTail = this.initTail.bind(this);
        // place keydown listener
        document.addEventListener('keydown', this.handleKeyboardInput);
        // spawn tail
        this.initTail();
    }

    // put each tail part behind head 
    initTail(){
        for(let i = 1; i < 4; i++) {
            this.tail[i] = new Object(this.x, this.y - (i * this.size), this.size, this.tailcolor);
        }
    }

    print(ctx) {
        this.drawTail(ctx);
        this.draw(ctx);
    }

    drawTail(ctx){
        this.tail.forEach(part => {
            part.draw(ctx)
        }, ctx); // bind ctx to the inner function
    }

    handleKeyboardInput(keyboardevent) {
        //console.log(keyboardevent);
        switch (keyboardevent.keyCode) {
            // left
            case 37:
                if (this.dir !== 1 ) {
                    //console.log("snake should move to the left now");
                    this.dir = 3;
                }
                break;    
            // up
            case 38: 
                if (this.dir !== 2) {
                    this.dir = 0;
                }
                break;
            // right 
            case 39: 
                if (this.dir !== 3) {
                    this.dir = 1;
                }
                break;    
            // down
            case 40:
                if (this.dir !== 0) {
                    this.dir = 2;
                }
                break;  
        }
    }

    doNextMove() {
        // first move tail
        this.moveTailTowardsHead();
        // than move head into direction
        this.move();
        // check for collision with itself
        this.checkCollision();
    }


    checkCollision(){
        this.tail.forEach(part => {
            if(part.x == this.x && part.y == this.y) {
                this.alive = false;
            }
        });
    }

    // move head into current direction
    move() {
        //console.log("current location: x=" + this.x + " y="+ this.y);
        //console.log("this direction:" + this.dir);
        switch(this.dir) {
            case 0: 
                this.y = this.y - this.size;
                break;
            case 1:
                this.x = this.x + this.size;
                break;
            case 2:
                this.y = this.y + this.size;
                break;
            case 3:
                this.x = this.x - this.size;
                break;
        }
        //console.log("current location: x=" + this.x + " y="+ this.y);
    }

    // move parts of tail - start with first from head and so on oxxx will be xxx (o was head)
    // very first next position will be current head position
    moveTailTowardsHead() {
        var posBefore = {x :this.x, y: this.y};
        this.tail.forEach(part => {
            let temppos = {x: part.x, y: part.y};
            //console.log("moved tail part from: x:" + part.x + "y:"+ part.y + " too x:" + posBefore.x + "y:" + posBefore.y);
            part.x = posBefore.x;
            part.y = posBefore.y;
            posBefore = temppos;
        });
    }

    grow(){
        let currentsize = this.tail.length;
        this.tail[currentsize] = new Object(this.x, this.y, this.size, this.tailcolor);
    }

}

class Board {
    constructor(mx, my, color, tick, elementsize, foodrespawntimer) {
        this.mx = mx;
        this.my = my;
        this.color = color;
        this.tick = tick;
        this.elementsize = elementsize;
        this.foodrespawntimer = foodrespawntimer;

        // generate canvas and append to the dom
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = mx;
        this.canvas.height = my;
        document.body.appendChild(this.canvas);

        // variables to hold info / objects of board
        this.gameOver = false;
        this.initializedGame = false;
        this.foodRespawning = false;
        
        // bind functions
        this.clear = this.clear.bind(this);
        this.gameloop = this.gameloop.bind(this);
        this.handleFood = this.handleFood.bind(this);
    }

    clear() {
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(0, 0, this.mx, this.my);
    }


    startgame() {
        if(!this.initializedGame) {
            this.initializedGame = true;
            // place snake
            this.snake = new Snake(50, 50, this.elementsize, "#FF5D02", "#122E45", 2);
            this.snake.print(this.ctx);
            // place food
            this.food = new Food(0,0,this.elementsize,"#FF0000");
            this.food.spawn(this.mx, this.my, this.elementsize);
            this.food.draw(this.ctx);
            // start loop
            this.gameloop();
        }
    }

    handleFood() {
         // if food exist -> draw it 
         if (this.food.spawned) {
            this.food.draw(this.ctx);
            // check for collision with snake
            if (this.food.x == this.snake.x && this.food.y == this.snake.y) {
                // snake needs to grow -> new tail part will be spawned on current place of head
                this.snake.grow();
                this.food.spawned = false;
            }
        } else {
            // if food not respawning -> set timeout to spawn new one
            if(!this.foodRespawning) {
                this.foodRespawning = true;
                window.setTimeout(function(){
                    this.food.spawn(this.mx, this.my, this.elementsize);
                    this.foodRespawning = false;
                }.bind(this), this.foodrespawntimer);
            }
        }
    }
    handleWall(){
        if (this.snake.x > this.mx || this.snake.x < 0 || this.snake.y > this.my || this.snake.y < 0) {
            this.snake.alive = false;
        }
    }

    gameloop() {
        if(!this.gameOver) {
            this.clear();
            this.snake.doNextMove();
            this.handleWall();
            if (this.snake.alive) {
                this.snake.print(this.ctx);
                this.handleFood();
                window.setTimeout(function(){this.gameloop();}.bind(this), this.tick);
            } else {
                this.gameOver = true;
            }
        }
        // if game is over after snake move > restart it
        if (this.gameOver) {
            this.gameOver = false;
            this.initializedGame = false;
            this.startgame();
        }
    }


}
// need to wait for document to be created
window.onload = function() {
    //sizex, sizey, backgroundcolor, tick, elementsize   
    var board = new Board(500, 500, "#e3e3e3", 50, 10, 500);
    board.startgame();
    window.board = board;
};