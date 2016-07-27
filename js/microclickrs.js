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

var Trees = {
    NORMAL: {
        model: new Tree("tree-1", 2, 2, 1000, 25)
    },
    OAK: {
        model: new Tree("tree-2", 4, 4, 2000, 50)
    },
    WILLOW: {
        model: new Tree("tree-3", 8, 8, 10000, 150)
    },
    YEW: {
        model: new Tree("tree-4", 16, 16, 20000, 250)
    }
};

var orderedTrees = [
    Trees.NORMAL,
    Trees.OAK,
    Trees.WILLOW,
    Trees.YEW
];

// Used to preload assets.
var LOAD_MANIFEST = [
    {src: "img/tree-1.png", id: Trees.NORMAL.model.name},
    {src: "img/tree-2.png", id: Trees.OAK.model.name},
    {src: "img/tree-3.png", id: Trees.WILLOW.model.name},
    {src: "img/tree-4.png", id: Trees.YEW.model.name}
];
var loader;

var woodcutting = {
    name: "Woodcutting",
    exp: 0
};

var player = {
    currentSkill: woodcutting,
    skills: {
        woodcutting: woodcutting
    }
};

var hud;

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

    for (var index in orderedTrees) {
        const treeIndex = parseInt(index);
        const tree = orderedTrees[treeIndex];

        console.log(tree);

        var image = loader.getResult(tree.model.name);

        var spriteMap = new createjs.SpriteSheet({
            images: [image],
            frames: {width: image.width / 2, height: image.height},
            animations: {
                idle: 0,
                break: 1
            }
        });

        tree.view = new createjs.Sprite(spriteMap, "idle");
        tree.view.x = canvas.width / 2;
        tree.view.y = canvas.height / 2;

        tree.view.on("click", function (event) {
            tree.model.hit();
            if (tree.model.isCut()) {
                tree.view.gotoAndPlay("break");
                player.skills.woodcutting.exp += tree.model.exp;
                setTimeout(function () {
                    tree.model.reset();

                    if (tree.model.isDead()) {
                        stage.removeChild(tree.view);
                        var nextIndex = (orderedTrees.length - 1 == treeIndex) ? treeIndex : (treeIndex + 1);
                        console.log(nextIndex);
                        stage.addChild(orderedTrees[nextIndex].view);
                    } else {
                        tree.view.gotoAndPlay("idle");
                    }
                }, tree.model.getRespawnTime());
            }
        });
    }

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

    var hudView = new createjs.Text(player.currentSkill.name + " XP: " + player.currentSkill.exp,
        "bold 50px Arial", "black");
    hudView.x = 10;
    hudView.y = 20;

    hud = new Hud(player, hudView);

    stage.addChild(hudView);
    stage.addChild(Trees.NORMAL.view);
}

/**
 *  Update the game's display
 *  based on events.
 */
function tick(event) {
    hud.update();
    // Update the stage.
    stage.update(event);

}

/**
 *  Returns a random integer between min (inclusive) and max (inclusive).
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Tree(name, health, lives, respawnMultiplier, exp) {
    this.name = name;
    this._health = health;
    this._currentHealth = health;
    this._lives = lives;
    this._currentLives = lives;
    this._respawnMultiplier = respawnMultiplier;
    this.exp = exp;

    this.hit = function() {

        if (this._currentHealth > 0) {

            if (--this._currentHealth === 0) {
                this._currentLives--;
            }
        }
    };

    this.isCut = function() {
        return this._currentHealth === 0
    };

    this.isDead = function() {
        return this._currentLives === 0;
    };

    this.getRespawnTime = function() {
        return !this.isDead() ? this._respawnMultiplier : this._respawnMultiplier * this._lives;
    };

    this.reset = function() {
        this._currentHealth = this._health;
    }
}

function Hud(player, hudView) {
    this._player = player;
    this._playerXp = player.currentSkill.exp;
    this._playerSkill = player.currentSkill.name;
    this._hudView = hudView;

    this.update = function() {

        if (this._playerSkill != this._player.currentSkill.name || this._playerXp != this._player.currentSkill.exp) {
            this._hudView.text = this._getPlayerExpLine();
        }
    };

    this._getPlayerExpLine = function() {
        this._playerSkill = this._player.currentSkill.name;
        this._playerXp = this._player.currentSkill.exp;
        return this._playerSkill + " XP: " + this._playerXp;
    }

}

