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
// Progress graphical asset.
var progress;
// Progress text asset.
var progressText;

var eventType = {
    IMMEDIATE: "immediate",
    DELAYED: "delayed"
};

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

    this.view.sprite.on("click", function() {

        me.model.interact({
            immediate: function(callback) {
                me.view.interactAnim(stage, {type: eventType.IMMEDIATE}, callback);
            },
            delayed: function(callback) {
                me.view.interactAnim(stage, {type: eventType.DELAYED}, callback)
            },
            degrade: function() {
                me.view.degradeAnim(stage);
                player.currentSkill.favour += me.model.favour;

                if (me._onDegradeFunc != null && typeof(me._onDegradeFunc) !== 'undefined') {
                    me._onDegradeFunc(stage);
                }

                setTimeout(function() {
                    me.model.reset();
                    me.view.idleAnim(stage);
                }, me.model.getRespawnTime());
            },
            deplete: function() {
                me.view.depleteAnim(stage);

                setTimeout(function () {

                    if (me._onDepleteFunc != null && typeof(me._onDepleteFunc) !== 'undefined') {
                        me._onDepleteFunc(stage);
                    }
                }, me.model.getRespawnTime());
            }
        });
    });

    this.onDegrade = function(onDegradeFunc) {
        this._onDegradeFunc = onDegradeFunc;
    };

    this.onDeplete = function(onDepleteFunc) {
        this._onDepleteFunc = onDepleteFunc;
    }
}

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
    progressText = new createjs.Text("Loading: 0%", "24px Arial", "black");
    progressText.textAlign = "center";
    progressText.textBaseline = "middle";
    progressText.x = 100;
    progressText.y = 50;
    stage.addChild(progressText);
    stage.update();

    loader = new createjs.LoadQueue(false);
    // if(!isMobile) {
    //     loader.installPlugin(createjs.Sound);
    //     createjs.Sound.alternateExtensions = ["wav"];
    // }

    loader.addEventListener("progress", onLoadProgess);
    loader.addEventListener("complete", onLoadFinish);

    var fullManifest = [].concat(getWoodcuttingManifest());//.concat(getFarmingManifest());

    loader.loadManifest(fullManifest);
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

    // Create a button to start the game
    var startButton = new createjs.Text("Start Game", "bold 60px Arial", "black");
    var startButtonHitBox = new createjs.Shape();

    startButtonHitBox.graphics
        .beginFill("#000")
        .drawRect(0, 0, startButton.getMeasuredWidth(), startButton.getMeasuredHeight());

    startButton.hitArea = startButtonHitBox;
    startButton.x = canvas.width / 2;
    startButton.y= canvas.height / 2;

    // Add button to start game.
    stage.addChild(startButton);
    stage.update();

    var gameConfig = {
        woodcutting : getWoodcuttingScreen(loader)

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
    hudView.x = 20;
    hudView.y = 50;

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

    this.interactAnim = function(stage, event, callback) {

        if (notNull(interactAnim)) {
            interactAnim(this.sprite, stage, event, callback);
        }
    }
}

/**
 * A helper class allowing resources to be chained with one another. That is, after a resource is depleted,
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
                stage.removeChild(me.currentResource.view.sprite);
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
            stage.removeChild(me.currentResource.view.sprite);
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

