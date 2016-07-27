/**
 * Created by Mike on 27/07/2016.
 */
/**
 *  Logic for a game inspired by 'Duck Hunt'
 *  that hinges on an in-office joke.
 *
 *  @author  mod_ave
 *  @version 0.6
 */

/* Game objects. */

// Delegate features.
var isMobile;

// The HTML canvas element.
var canvas;
// The Easel element constructed of the canvas.
var stage;

// Splash screen graphic.
var splash;

// Background graphical asset.
var background;
// Foreground graphical asset.
var foreground;
// Gun graphical asset.
var gun;
// Progress graphical asset.
var progress;

// Progress text asset.
var progressText;
// Start game button.
var startGame;

/* Useful constants and globals. */

// Used to preload assets.
var LOAD_MANIFEST = [
    {src: "img/tree-1.png", id: "tree-1"},
    {src: "img/tree-2.png", id: "tree-2"},
    {src: "img/tree-3.png", id: "tree-3"},
    {src: "img/tree-4.png", id: "tree-4"}
];
var loader;

var woodcutting = {
    name: "WoodCutting",
    exp: 0
};

var player = {
    currentSkill: woodcutting,
    skills: {
        woodcutting: woodcutting
    }
};

/**
 *  Initialise loading game objects
 *  and introductory splash screen.
 */
function init() {

    // Check to see if the user is on mobile.
    if (createjs.BrowserDetect.isIOS || createjs.BrowserDetect.isAndroid || createjs.BrowserDetect.isBlackberry) {
        isMobile = true;
    }

    // Get the canvas.
    canvas = document.getElementById("game");
    // Instantiate the stage.
    stage = new createjs.Stage(canvas);

    // Display loading screen splash image.
    // splash = new Image();
    // // splash.src = "img/splash-screen.png";
    // // splash.x = splash.y = 0;
    // splash.onload = function(event) {
    //     splash = new createjs.Bitmap(splash);
    //     stage.addChild(splash);
    //     stage.update();
    // };

    // Display loading screen text.
    progressText = new createjs.Text("Loading: 0%", "bold 60px Arial", "black");
    progressText.textAlign = "center";
    progressText.textBaseline = "middle";
    progressText.x = 1380;
    progressText.y = 780;
    stage.addChild(progressText);
    stage.update();

    loader = new createjs.LoadQueue(false);
    // if(!isMobile) {
    //     loader.installPlugin(createjs.Sound);
    //     createjs.Sound.alternateExtensions = ["wav"];
    // }

    loader.addEventListener("progress", onLoadProgess);
    loader.addEventListener("complete", onLoadFinish);

    loader.loadManifest(LOAD_MANIFEST);

}

/**
 *  Update load progress visual.
 */
function onLoadProgess() {

    // Log loading to console.
    progressText.text = "Loading: " + (loader.progress * 100 | 0) + "%";

    // Refresh the canvas.
    stage.update();

}

/**
 *  Allow the user to start
 *  the game
 */
function onLoadFinish() {

    // Log finished loading to console.
    console.log("Finished loading.");

    var startButton = new createjs.Shape();

    startButton.graphics.beginStroke("black").beginFill("black").drawRect(60, 20, 200, 100);

    // Add button to start game.
    stage.addChild(startButton);
    console.log("HELLO WE DID THE THING");
    stage.update();

    startButton.on("click", function(event) {
        // Start game timer.
        createjs.Ticker.on("tick", tick);
        watchRestart();
    });

}

/**
 *  Fires when player starts
 *  game; initialises main
 *  game loop.
 */
function watchRestart() {

    // Remove loading objects.
    stage.removeAllChildren();

    /* Load stage objects. */
    var background = new createjs.Shape();

    background.graphics.beginStroke("#99D9EA").beginFill("#99D9EA").drawRect(0, 0, canvas.width, canvas.height);

    stage.addChild(background);

    // Add a tree!!!!!
    var spritesheet = new createjs.SpriteSheet({
        images: [loader.getResult("tree-1")],
        frames: {width: 100, height: 160},
        animations: {
            idle: 0,
            broken: 1
        }
    });

    var hudView = new createjs.Text(player.currentSkill.name + " XP: " + player.currentSkill.exp,
        "bold 50px Arial", "black");
    hudView.x = 10;
    hudView.y = 20;

    var hud = {
        update: function() {
            hudView.text = player.currentSkill.name + " XP: " + player.currentSkill.exp;
        }
    };

    var treeState = {
        health: 10,
        hasDied: false,
        lives: 10
    };
    var tree = new createjs.Sprite(spritesheet, "idle");

    tree.x = canvas.width / 2;
    tree.y = canvas.height / 2;

    // Cut the tree down, and fall over when health is 0
    tree.on("click", function(event) {

        if (--treeState.health == 0 && !treeState.hasDied) {
            treeState.hasDied = true;
            tree.gotoAndPlay("broken");
            player.skills.woodcutting.exp += 25;
            hud.update();
            treeState.lives--;

            setTimeout(function() {
                treeState.hasDied = false;
                treeState.health = 10;
                tree.gotoAndPlay("idle");

                if (treeState.lives == 0) {
                    treeState.lives = 10;
                }
            }, treeState.lives == 0 ? 10000 : 1000);
        }
    });

    stage.addChild(hudView);
    stage.addChild(tree);

    // // Lojko.
    // lojkoAnim = new createjs.SpriteSheet({
    //     "images": [loader.getResult("spritesheet-lojko")],
    //     "frames": {width: 384, height: 708},
    //     "animations": {
    //         "run" : [0, 3],
    //         "hit" : [4, 4, "run", 0.5]
    //     },
    //     framerate: 2.5
    // });
    // createjs.SpriteSheetUtils.addFlippedFrames(lojkoAnim, true, false, false);
    //
    // // Foreground.
    // var foregroundAnim = new createjs.SpriteSheet({
    //     "images": [loader.getResult("foreground-1"), loader.getResult("foreground-2")],
    //     "frames": [
    //         [0, 0, 1920, 1080, 0, 0, 0],
    //         [0, 0, 1920, 1080, 1, 0, 0]
    //     ],
    //     "animations": {
    //         "idle" : [0, 1]
    //     },
    //     framerate: .20
    // });
    // foreground = new createjs.Sprite(foregroundAnim, "idle");
    // stage.addChild(foreground);
    //
    // // Progress.
    // var progressAnim = new createjs.SpriteSheet({
    //     "images": [loader.getResult("spritesheet-progress")],
    //     "frames": {width: 504, height: 204, count: 10},
    //     "animations": {
    //         "10" : 0,
    //         "9" : 1,
    //         "8" : 2,
    //         "7" : 3,
    //         "6" : 4,
    //         "5" : 5,
    //         "4" : 6,
    //         "3" : 7,
    //         "2" : 8,
    //         "1" : 9,
    //         "0" : 10
    //     },
    //     framerate: 0.40
    // });
    // progress = new createjs.Sprite(progressAnim, "10");
    // progress.x = (stage.canvas.width / 2) - (progress.getBounds().width / 2);
    // progress.y = stage.canvas.height - (progress.getBounds().height * 1.18);
    // stage.addChild(progress);
    //
    // // Gun.
    // var gunAnim = new createjs.SpriteSheet({
    //     "images": [loader.getResult("spritesheet-gun")],
    //     "frames": {width: 192, height: 564},
    //     "animations": {
    //         "aim": 0,
    //         "reload" : [1, 3, "aim"]
    //     },
    //     framerate: 1.65
    // });
    // gun = new createjs.Sprite(gunAnim, "aim");
    // stage.addChild(gun);
    //
    // // Bullet.
    // bulletAnim = new createjs.SpriteSheet({
    //     "images": [loader.getResult("spritesheet-bullet")],
    //     "frames": {width: 48, height: 108},
    //     "animations": {
    //         "collide" : [1, 3]
    //     },
    //     framerate: 2
    // });

    // Restart (begin) the game.
    // restart();

}

/**
 *  Reset game loop to
 *  try playing again.
 */
function restart() {

    // Reset scores.
    playerScore = 0;
    playerProgress = 10;
    numHit = 0;
    numLojkos = 0;
    hasFailed = false;

    // Position the cursor correctly.
    aim({
        "stageX" : stage.mouseX,
        "stageY" : stage.mouseY
    });

    // Hide the cursor.
    stage.canvas.style.cursor = "none";

    // Play music.
    if(!isMobile) {
        createjs.Sound.play("mainloop", {interrupt: createjs.Sound.INTERRUPT_NONE, loop: -1, volume: 0.3});
    }

    // Add listener to track gun sprite.
    stage.on("stagemousemove", aim);
    // Add listener to track shot.
    stage.on("stagemousedown", shoot);
    // Add listener to track reload.
    gun.on("animationend", gunTrigger);
    // Add listener for user progress.
    progress.on("change", updateProgress);
    progress.on("animationend", fail);

    // Allow user to shoot.
    canShoot = true;

    // Add a Lojko.
    spawnLojko();

}

/**
 *  Update the game's display
 *  based on events.
 */
function tick(event) {

    // Update the stage.
    stage.update(event);

}

/**
 *  Update the player's aim.
 */
function aim(event) {

    // Move the player's gun to match the cursor.
    gun.x = event.stageX - gun.getBounds().width / 2;
    gun.y = event.stageY - gun.getBounds().height / 15;

}

/**
 *  Play gun shooting and reloading animations.
 */
function shoot(event) {

    // Prevent redundant clicks...
    if(canShoot) {

        // Lock this action.
        canShoot = false;

        // Get the X and Y of the mouse (in case it moves).
        var localMouseX = stage.mouseX;
        var localMouseY = stage.mouseY;

        // Check for actual hit.
        for(let e of stage.getObjectsUnderPoint(localMouseX, localMouseY)) {

            if(e.name == "lojko" && !wasBulletBlocked(localMouseX, localMouseY)) {

                if(!isMobile) {
                    createjs.Sound.play("lojkohit");
                }

                // Increment Lojko's hit.
                numHit++;

                // Stop movement.
                createjs.Tween.removeTweens(e);
                // Play hit animation.
                if(Math.random() > 0.5) {
                    e.gotoAndPlay("hit");
                }
                else {
                    e.gotoAndPlay("hit_h");
                }
            }
        }

        // Create a bullet drop.
        spawnBullet(localMouseX, localMouseY);

        // Play the reload animation.
        gun.gotoAndPlay("reload");

        // Play the shoot/reload sound effect.
        if(!isMobile) {
            createjs.Sound.play("reload");
        }

    }

}

/**
 *  Replenish some of the progress bar.
 */
function incrementProgress() {

    // Round up to nearest thousand.
    var nextThousand = Math.ceil(playerScore/1000)*1000;

    // Replenish the progress bar.
    if(playerProgress > 8) {
        playerProgress = 10;
    }
    else {
        playerProgress++;
    }

    progressLock = true;
    progress.gotoAndPlay(10 - playerProgress);

    // Add to user score.
    playerScore = playerScore + SCORE_INCREMENT;

    if(playerScore >= nextThousand && !isMobile) {
        createjs.Sound.play("score");
    }

}

/**
 *  Handle the player failing
 *  the game by removing listeners
 *  and moving to a fail screen.
 */
function fail() {

    // Lock asynchronous background operations.
    hasFailed = true;

    if(!isMobile) {
        createjs.Sound.stop();
        createjs.Sound.play("fail");
    }

    stage.canvas.style.cursor = "default";

    // Remove from stage.
    stage.removeAllChildren();

    // Add the new background.
    var failScreen = new createjs.Bitmap(loader.getResult("fail-screen"));
    stage.addChild(failScreen);
    stage.update();

    // Add the new score.
    var finalScoreField = new createjs.Text("Final Score: " + playerScore, "bold 60px Arial", "#3a8944");
    finalScoreField.maxWidth = 1000;
    finalScoreField.textAlign = "center";
    finalScoreField.textBaseline = "middle";
    finalScoreField.x = 585;
    finalScoreField.y = 705;
    stage.addChild(finalScoreField);

    // Add the retry button.
    var retryButton = new createjs.Bitmap(loader.getResult("retry-button"));
    retryButton.x = 1180;
    retryButton.y = 850;
    stage.addChild(retryButton);
    retryButton.on("click", watchRestart);

    stage.update();

}

/**
 *  Returns a random integer between min (inclusive) and max (inclusive).
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}