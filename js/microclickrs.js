/**
 * Created by Mike on 27/07/2016.
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

var Trees = {
    NORMAL: {
        name: "tree-1",
        model: function() {
            return new Tree(Trees.NORMAL.name, 2, 2, 1000, 25)
        }
    },
    OAK: {
        name: "tree-2",
        model: function() {
            return new Tree(Trees.OAK.name, 2, 2, 1000, 50)
        }
    },
    WILLOW: {
        name: "tree-3",
        model: function() {
            return new Tree(Trees.WILLOW.name, 2, 2, 1000, 150)
        }
    },
    YEW: {
        name: "tree-4",
        model: function() {
            return new Tree(Trees.YEW.name, 2, 2, 1000, 250)
        }
    }
};

var orderedTrees = [
    Trees.NORMAL,
    Trees.OAK,
    Trees.WILLOW,
    Trees.YEW
];

/**
 * A resource and view wrapper which fires events when specific events happen to resource
 *
 * @param model The model resource to fire events for
 * @param view The view associated with the model for display
 * @param stage The stage upon which the view is displayed
 * @constructor
 */
function EventFiringResource(model, view, stage) {
    this.model = model;
    this.view = view;
    this._onDegradeFunc = null;
    this._onDepleteFunc = null;
    const me = this;

    this.view.sprite.x = canvas.width / 2;
    this.view.sprite.y = canvas.height / 2;
    this.view.sprite.on("click", function() {
        me.model.interact();
        me.view.interactAnim();

        if (me.model.isDegraded()) {
            me.view.degradeAnim(stage);
            //TODO This should probably be handled in an event rather than here.
            player.currentSkill.favour += me.model.favour;

            if (me._onDegradeFunc != null && typeof(me._onDegradeFunc) !== 'undefined') {
                me._onDegradeFunc(stage);
            }

            setTimeout(function () {
                me.model.reset();

                if (me.model.isDepleted()) {
                    me.view.depleteAnim(stage);

                    if (me._onDepleteFunc != null && typeof(me._onDepleteFunc) !== 'undefined') {
                        me._onDepleteFunc(stage);
                    }
                } else {
                    me.view.idleAnim(stage);
                }
            }, me.model.getRespawnTime());
        }
    });

    this.onDegrade = function(onDegradeFunc) {
        this._onDegradeFunc = onDegradeFunc;
    };

    this.onDeplete = function(onDepleteFunc) {
        this._onDepleteFunc = onDepleteFunc;
    }
}

// Used to preload assets.
var LOAD_MANIFEST = [
    {src: "img/tree-1.png", id: Trees.NORMAL.name},
    {src: "img/tree-2.png", id: Trees.OAK.name},
    {src: "img/tree-3.png", id: Trees.WILLOW.name},
    {src: "img/tree-4.png", id: Trees.YEW.name}
];
var loader;

var woodcutting = {
    name: "Woodcutting",
    favour: 0
};

var farming = {
    name: "Farming",
    favour: 0
};

var mining = {
    name: "Mining",
    favour: 0
};

var fishing = {
    name: "Fishing",
    favour: 0
};

var player = {
    currentSkill: woodcutting,
    skills: {
        woodcutting: woodcutting,
        farming: farming,
        mining: mining,
        fishing: fishing
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

    var woodcuttingChain = new ResourceChain();

    for (var i = 0; i < orderedTrees.length; i++) {
        const tree = orderedTrees[i];
        console.log(tree);

        var image = loader.getResult(tree.name);

        tree.spriteSheet = new createjs.SpriteSheet({
            images: [image],
            frames: {width: image.width / 2, height: image.height},
            animations: {
                idle: 0,
                degrade: 1
            }
        });

        if (i === (orderedTrees.length - 1)) {
            woodcuttingChain.chainForever(function() {
               return new EventFiringResource(tree.model(), getTreeView(tree), stage);
            });
        } else {
            woodcuttingChain.chain(new EventFiringResource(tree.model(), getTreeView(tree), stage));
        }
    }

    var gameConfig = {
        woodcutting : woodcuttingChain

        // farming: [],
        //
        // fishing: new ResourceChain(),
        //
        // mining: new ResourceChain()
    };

    startButton.on("click", function(event) {
        // Start game timer.
        createjs.Ticker.on("tick", tick);
        watchRestart(gameConfig);
    });
}

/**
 * Get a tree's view object used to manipulate what animations are played for a tree resource
 *
 * @param tree The type of tree to get the view for
 *
 * @returns {ResourceView} A resource view to call animations on.
 */
function getTreeView(tree) {
    return new ResourceView(new createjs.Sprite(tree.spriteSheet, "idle"), function(sprite, stage) { // Idle
        sprite.gotoAndPlay("idle");
    }, function(sprite, stage) { // Degrade
        sprite.gotoAndPlay("degrade");
    }, function(sprite, stage) { // Deplete
        stage.removeChild(sprite);
    }, function(sprite, stage) { // Interact
        // TODO Tree wobble/leaf particles?
    });
}

/**
 *  Fires when player starts
 *  game; initialises main
 *  game loop.
 */
function watchRestart(gameConfig) {

    // Remove loading objects.
    stage.removeAllChildren();

    /* Load stage objects. */
    var background = new createjs.Shape();

    background.graphics.beginStroke("#99D9EA").beginFill("#99D9EA").drawRect(0, 0, canvas.width, canvas.height);

    stage.addChild(background);

    var hudView = new createjs.Text(player.currentSkill.name + " Favour: " + player.currentSkill.favour,
        "bold 50px Arial", "black");
    hudView.x = 10;
    hudView.y = 20;

    hud = new Hud(player, hudView);

    stage.addChild(hudView);
    gameConfig.woodcutting.draw(stage);
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


/**
 * A tree object which has the "duck type" of "Resource model" (implementing interact(), isDegraded(), isDepleted(),
 * getRespawnTime() and reset()
 *
 * @param name The name of the tree
 * @param health The initial health of the tree
 * @param lives The initial number of lives for the tree
 * @param respawnMultiplier The multiplier for respawn times (on degrade, this is the time til respawn,
 *                              on deplete this multiplier is applied to the number of lives)
 * @param favour The amount of favour a player receives for degrading the tree
 * @constructor
 */
function Tree(name, health, lives, respawnMultiplier, favour) {
    this.name = name;
    this._health = health;
    this._currentHealth = health;
    this._lives = lives;
    this._currentLives = lives;
    this._respawnMultiplier = respawnMultiplier;
    this.favour = favour;

    /**
     * Hit this tree
     */
    this.interact = function() {

        if (this._currentHealth > 0) {

            if (--this._currentHealth === 0) {
                this._currentLives--;
            }
        }
    };

    /**
     * Is this tree degraded?
     *
     * @returns {boolean} true if degraded, false if not
     */
    this.isDegraded = function() {
        return this._currentHealth === 0
    };

    /**
     * Is this tree depleted?
     *
     * @returns {boolean} true if depleted, false if not
     */
    this.isDepleted = function() {
        return this._currentLives === 0;
    };

    /**
     * Gets the amount of time to wait before respawning
     *
     * @returns {number} The respawn time in milliseconds
     */
    this.getRespawnTime = function() {
        return !this.isDepleted() ? this._respawnMultiplier : this._respawnMultiplier * this._lives;
    };

    /**
     * Resets this tree after it has been degraded.
     */
    this.reset = function() {
        this._currentHealth = this._health;
    }
}

/**
 * A resource view used to interact directly with a sprite, allowing definition of custom animation routines upon
 * various events.
 *
 * Each animation accepts a function in the form: function(sprite, stage) {}
 *
 * @param sprite The sprite to act upon
 * @param idleAnim The animation for when a resource is idle
 * @param degradeAnim The animation for when a resource is degraded
 * @param depleteAnim The animation for when a resource is depleted
 * @param interactAnim The animation for when a resource is interacted with
 * @constructor
 */
function ResourceView(sprite, idleAnim, degradeAnim, depleteAnim, interactAnim) {
    this.sprite = sprite;

    /**
     * Runs the animation for when this resource is idle
     *
     * @param stage The stage upon which the animation should run
     */
    this.idleAnim = function(stage) {

        if (notNull(idleAnim)) {
            idleAnim(this.sprite, stage);
        }
    };

    /**
     * Runs the animation for when this resource is degraded
     *
     * @param stage The stage upon which the animation should run
     */
    this.degradeAnim = function(stage) {

        if (notNull(degradeAnim)) {
            degradeAnim(this.sprite, stage);
        }
    };

    /**
     * Runs the animation for when this resource is depleted
     *
     * @param stage The stage upon which the animation should run
     */
    this.depleteAnim = function(stage) {

        if (notNull(depleteAnim)) {
            depleteAnim(this.sprite, stage);
        }
    };

    this.interactAnim = function(stage) {

        if (notNull(interactAnim)) {
            interactAnim(this.sprite, stage);
        }
    }
}

/**
 * A helpler class allowing resources to be chained with one another. That is, after a resource is depleted,
 * the next resource in the chain takes its place.
 *
 * @constructor
 */
function ResourceChain() {
    this.currentResource = null;
    this._latestResource = null;
    const me = this;

    /**
     * Add a resource to the chain
     *
     * @param chainedResource The resource to chain
     *
     * @returns {ResourceChain} This chain for fluent chaining
     */
    this.chain = function(chainedResource) {

        if (notNull(this.currentResource)) {
            this._latestResource.onDeplete(function (stage) {
                me.currentResource = chainedResource;
                stage.addChild(chainedResource.view.sprite);
            });
            this._latestResource = chainedResource;
        } else {
            this.currentResource = chainedResource;
            this._latestResource = chainedResource;
        }

        return this;
    };

    /**
     * Chains whatever resource is produced from the factory provided forever.
     *
     * This should be the final call in a chain, calling chain() after this method will negate this method.
     *
     * @param chainedResourceFactory A factory producing a resource
     */
    this.chainForever = function(chainedResourceFactory) {
        this._latestResource.onDeplete(function(stage) {
            me.currentResource = chainedResourceFactory();
            me._latestResource = me.currentResource;
            me.chainForever(chainedResourceFactory);
            stage.addChild(me.currentResource.view.sprite);
        });
    };

    /**
     * Draws the resource chain onto the stage provided
     *
     * @param stage The stage to draw on
     */
    this.draw = function(stage) {
        stage.addChild(this.currentResource.view.sprite);
    }
}

/**
 * The hud for player statistics
 *
 * @param player The player information to query
 * @param hudView The actual view upon which hud information is displayed
 * @constructor
 */
function Hud(player, hudView) {
    this._player = player;
    this._playerFavour = player.currentSkill.favour;
    this._playerSkill = player.currentSkill.name;
    this._hudView = hudView;

    /**
     * Update this hud with the correct player information
     */
    this.update = function() {

        if (this._playerSkill != this._player.currentSkill.name || this._playerFavour != this._player.currentSkill.favour) {
            this._hudView.text = this._getPlayerExpLine();
        }
    };

    this._getPlayerExpLine = function() {
        this._playerSkill = this._player.currentSkill.name;
        this._playerFavour = this._player.currentSkill.favour;
        return this._playerSkill + " Favour: " + this._playerFavour;
    }

}

/**
 * Determines if the object provided is not null
 *
 * @param obj The object to check
 *
 * @returns {boolean} true if null or undefined, false if not
 */
function notNull(obj) {
    return (obj != null) && (typeof(obj) !== 'undefined');
}

