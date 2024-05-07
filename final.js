

// module aliases
var Engine = Matter.Engine,
    Runner = Matter.Runner,
    //Render = Matter.Render,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Events = Matter.Events,
    MouseConstraint = Matter.MouseConstraint,
    Collision = Matter.Collision,
    Mouse = Matter.Mouse,
    Bounds = Matter.Bounds,
    // Constraint = Matter.Constraint,
    Body = Matter.Body,
    Vector = Matter.Vector,
    Common = Matter.Common


let engine;
let runner;
let world;
let collisionPoint;
let mConstraint;
let ball;
let ground;
let initialHeight;
let initialVelocity = 10; 
let pillarHeight = 60;
let velocityX;
let velocityY;
let gravity;
let path = [];
let mark;
let collided = false;
let collisionTime;
let img;
let collisionX;
let fireButton;
let cannonBody;
let cannonStand;
let pillar;
let angle = -0.453476601140633; // around 26deg
let settingAngle = false;
let settingHeight = false;
let userRotatedAngleInDegree;
let onButtonClickTime;
let onCollisionTime;
let tof;
let minx,maxx;
let miny,maxy;



function CircleBody(x, y, r,isCollided){
    markerOptions = { 
        friction: 0,   
        isStatic: true,
        frictionAir: 0 
    }
    ballOptions = {
        restitution: 0.6, 
        friction: 0,   
        isSensor: true,
        density: 0.04,
        frictionAir: 0 
    }
    this.body = Bodies.circle(x,y,r,isCollided ? markerOptions : ballOptions);

    Composite.add(world, this.body);

    this.show =  function() {
        var pos = this.body.position;

        push();
        translate(pos.x,pos.y);
        fill('yellow');
        noStroke();
        circle(0 , 0 , r * 2);
        pop();
    }
}

function RectangleBody(x, y, w, h){
    this.w =w;
    this.h =h;
    this.body = Bodies.rectangle(x,y,w,h,{
        isStatic: true,     
    });

    Composite.add(world, this.body);

    this.show = function() {
        var bodyPosition = this.body.position;
        fill('black');
        stroke('black');
        rectMode(CENTER);
        rect(bodyPosition.x , bodyPosition.y , this.w, this.h);
        
    }
}

function PillarBody(x, y, w, h){
    this.w =w;
    this.h =h;
    this.body = Bodies.rectangle(x,y,w,h,{
        isStatic: true,     
    });

    Composite.add(world, this.body);

    this.show = function() {
        var pos = this.body.position;
        push();
        translate(pos.x,pos.y)
        fill('gray');
        noStroke();
        rect(0, 0, this.w, this.h);
        pop();
    }
}

function CannonButton(x, y, w, h){
    this.w =w;
    this.h =h;
    this.body = Bodies.rectangle(x,y,w,h,{
        isStatic: true,
        isSleeping: true
    });

    Composite.add(world, this.body);

    this.show = function() {
        var pos = this.body.position;
        // Stroke();
        translate(pos.x,pos.y)
        imageMode(CENTER);
        image(img, 0, 0, this.w, this.h);
    }
}


function CannonStand(x, y, w, h, angle, type){
    this.w =w;
    this.h =h;
    this.body = Bodies.rectangle(x,y,w,h,{
        isStatic: true,
        angle: angle,
    });

    Composite.add(world, this.body);

    this.show = function() {
        var pos = this.body.position;
        var angle = this.body.angle;
        // Stroke();
        push();
        noStroke();
        translate(pos.x, pos.y);
        rotate(angle);
        if(type === 'body'){
            fill('orange')
        }else if(type === 'stand'){
            fill('black');
            rotate(1.5708)
        }
        rect(0, 0, this.w, this.h);
        pop();
    }
}

// 1m = 50px distance scale scale //1200 = 24m y-direction 1m = 50px

// Load the image.
function preload() {
    img = loadImage('./images/cannon.png');
  }
  

function setup(){
    var canvas = createCanvas(1200,600);
    engine = Engine.create();
    world = engine.world;


    ground = new RectangleBody(width/2, height , 1200, 150);
    cannonStand = new CannonStand(100,490,20, 8, 0,'stand');
    fireButton = new CannonButton(100, 570, 60, 60);
    pillar = new PillarBody(100,525 ,90, pillarHeight);
    originball = new CircleBody(100,475, 4, true);
    cannonBody = new CannonStand(100,475,50, 8, angle,'body');
    minx = cannonBody.body.bounds.min.x;
    maxx = cannonBody.body.bounds.max.x;
    miny = cannonBody.body.bounds.min.y;
    maxy = cannonBody.body.bounds.max.y;

    // console.log(pillar.h,cannonStand.h)
    var mouse = Mouse.create(canvas.elt);
    mouse.pixelRatio = pixelDensity();
    var options = {
        mouse: mouse,
    }
    mConstraint = MouseConstraint.create(engine,options);
    Composite.add(world, mConstraint);
    
    
    Events.on(mConstraint, "mouseup", function(){
        settingAngle = false;
        settingHeight = false;
    })

    var mouseClickCord = 0;
    Events.on(mConstraint, "mousedown", function(e){
        // console.log('X',mouseX,'Y',mouseY)
        // console.log('c',cannonBody.body.bounds, 'p', pillar.body.bounds);
        const mousePosition = e.mouse.position;
        const fireButtonClick = Bounds.contains(fireButton.body.bounds, mousePosition)
        // const angleClick = Bounds.contains(cannonBody.body.bounds, mousePosition);
        if((mousePosition.y > cannonBody.body.bounds.min.y && mousePosition.y < cannonBody.body.bounds.max.y) || (mousePosition.x > cannonBody.body.bounds.min.x && mousePosition.x < cannonBody.body.bounds.max.x)){
            angleClick  = true;
        }else{
            angleClick = false;
        }
        const pillarBodyClick = Bounds.contains(pillar.body.bounds, mousePosition);
        // console.log(angleClick);
        if(pillarBodyClick){
            settingHeight = true;
            mouseClickCord = mousePosition.y;
        }else if(fireButtonClick){
            collided = false;
            // console.log(engine.timing.timestamp,'on button click');
            onButtonClickTime = engine.timing.timestamp;
            ball = new CircleBody(100, pillar.body.bounds.min.y - 20, 10,collided);
            Body.setVelocity(ball.body,{x:velocityX, y:velocityY});
            Events.on(engine, 'beforeUpdate', updatePath);
        }else if(angleClick){
            settingAngle = true;
        }
        
    })
    
    Events.on(mConstraint, 'mousemove', function(event) {
        
        const mousePosition = event.mouse.position;
        if(settingAngle){
            
            angle = (Math.atan2(mousePosition.y - cannonBody.body.position.y, mousePosition.x - cannonBody.body.position.x));
            if(angle > 0){
                angle = 0;
                Body.setAngle(cannonBody.body, angle);
                calculateProjectile(initialVelocity,angle);
            }else if(angle < -1.57){
                angle = -1.57;
                Body.setAngle(cannonBody.body, angle);
                calculateProjectile(initialVelocity,angle);
            }else{
                // console.log(cannonBody.body.bounds);
                minx = cannonBody.body.bounds.min.x;
                maxx = cannonBody.body.bounds.max.x + 80;
                miny = cannonBody.body.bounds.min.y - 80;
                maxy = cannonBody.body.bounds.max.y;
                // console.log((Math.abs(Math.round(angle * (180 / Math.PI)))));
                // userRotatedAngleInDegree = Math.abs(Math.round(angle * (180 / Math.PI)));
                Body.setAngle(cannonBody.body, angle);
                calculateProjectile(initialVelocity,angle);

            }
        }else if(settingHeight){
            // console.log(minx,maxx);
            if(mousePosition.y < mouseClickCord ){
                    pillar.body.bounds.min.y = pillar.body.bounds.min.y - 10;
                    originball.body.position.y = pillar.body.bounds.min.y - 20; 
                    cannonBody.body.position.y = pillar.body.bounds.min.y - 20;
                    // cannonBody.body.bounds.min.y = pillar.body.bounds.min.y - 30;
                    // cannonBody.body.bounds.max.y = pillar.body.bounds.min.y;
                    cannonBody.body.bounds.min.y = miny;
                    cannonBody.body.bounds.max.y = maxy;
                    cannonBody.body.bounds.min.x = minx;
                    cannonBody.body.bounds.max.x = maxx;
                    cannonStand.body.position.y = pillar.body.bounds.min.y - 5; 
                    pillar.h = pillar.h + 10;
                    pillarHeight = pillar.h;
                    pillar.body.bounds.min.y = 600 - ((pillarHeight / 2) + 75)
                if(pillarHeight > 700){
                    pillarHeight = 700;
                    pillar.h = pillarHeight
                }
             }else if(mousePosition.y > mouseClickCord){
            // console.log(minx,maxx);

                pillar.body.bounds.min.y = pillar.body.bounds.min.y - 10;
                    originball.body.position.y = pillar.body.bounds.min.y - 10; 
                    cannonBody.body.position.y = pillar.body.bounds.min.y - 10;
                    // cannonBody.body.bounds.min.y = pillar.body.bounds.min.y - 30;
                    // cannonBody.body.bounds.max.y = pillar.body.bounds.min.y;
                    cannonBody.body.bounds.min.y = miny;
                    cannonBody.body.bounds.max.y = maxy;
                    cannonBody.body.bounds.min.x = minx;
                    cannonBody.body.bounds.max.x = maxx;
                    cannonStand.body.position.y = pillar.body.bounds.min.y + 4; 
                    pillar.h = pillar.h - 10;
                    pillarHeight = pillar.h;
                    pillar.body.bounds.min.y = 600 - ((pillarHeight / 2) + 75)
                if(pillarHeight < 60){
                    pillarHeight = 60;
                    pillar.h = pillarHeight
                }
            }  
        }
        
      });
    
    Events.on(engine, 'collisionStart', function(event) {
            const pairs = event.pairs;
            // console.log(event);
            pairs.forEach(function(pair) {
                // console.log(pair)
                // console.log(engine.timing.timestamp);
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                if ((bodyA === ball.body && bodyB === ground.body) || (bodyA === ground.body && bodyB === ball.body)) {
                    collided = true;
                    // console.log(engine.timing.timestamp, 'on collision');
                    onCollisionTime = engine.timing.timestamp;
                    tof = onCollisionTime - onButtonClickTime;
                    collisionX = ball.body.position.x;
                    // console.log('collisionPoint',collisionX)
                    // console.log('Tof', tof);
                    const collisionY = ball.body.position.y;
                    mark = new CircleBody(collisionX,collisionY, 5,collided);
                }
            }); 
        
    });

    calculateProjectile(initialVelocity, angle);

    // Create a slider and place it beneath the canvas.
    slider = createSlider(0, 20, 10);
    slider.position(190, 571);

  // Call repaint() when the slider changes.
    slider.input(repaint);

    // create runner
    var runner = Runner.create();

    // run the engine
    Runner.run(runner, engine);

}

function repaint(e){
    // console.log(e.target.value);
    initialVelocity = e.target.value;
    calculateProjectile(initialVelocity,angle);
}

function calculateProjectile(initialVelocity, angle){
    // console.log(angle);
    velocityX = initialVelocity * Math.cos(Math.abs(angle));
    velocityY = -initialVelocity * Math.sin(Math.abs(angle));
    // console.log(velocityX,velocityY);

}

function updatePath() {
    // Store the current position of the ball in the path array
    path.push(Vector.clone(ball.body.position));

  }
  

function draw(){
    background(51);
    if(ball){
        ball.show();
        //clearing array after collision with ground or ball
        if(ball.body.position.y > height + 100){
            path = [];
        }
    }        
    cannonStand.show();
    pillar.show();
    ground.show();
    cannonBody.show();
    originball.show();
    fill('yellow');
    textSize(18);
    text(`angle: ${Math.round(Math.abs(angle * (180 / Math.PI)))} deg`,50,50);
    text(`initial velocity: ${initialVelocity} m/s`,50,75);
    text(`Height: ${((pillarHeight / 2) + cannonStand.w) / 50} m`, 50, 100); // ?why /100 conversion to meter and half height.
    text(`Horizontal Range: ${((collisionX - 100) / 50 ).toFixed(2)} m`, 50, 125);
    text(`Time of Flight: ${(tof / 1000).toFixed(2)} sec`, 50, 150);
    text('Fire',80,545);
    text('Initial speed',190,545);
    text('0',165,580);
    text('20',320,580);
    if(collided){
        mark.show();
    }
    for(let i =0; i< path.length - 1; i++){
        stroke('white'); 
        line(path[i].x, path[i].y, path[i+1].x, path[i+1].y)
    }
    fireButton.show();
}


















/*
    Events.on(mConstraint, 'mousedown', function(e){
        const mousePosition = e.mouse.mousedownPosition;
        const bodiesUnderMouse = Bounds.contains(fireButton.body.bounds, mousePosition)
        
        if(bodiesUnderMouse){
            console.log('ds0');
            collided = false;
            ball = new CircleBody(100, 300, 10,collided);

            Body.setVelocity(ball.body,{x:velocityX, y:velocityY});
            Events.on(engine, 'beforeUpdate', updatePath);

        }
    });

*/