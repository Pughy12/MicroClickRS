/**
 * Get the manifest for woodcutting assets
 *
 * @returns {*[]} An array of assets
 */
function getWoodcuttingManifest() {
    return [
        {src: "img/tree-1.png", id: StandardTree.NORMAL.name},
        {src: "img/tree-2.png", id: StandardTree.OAK.name},
        {src: "img/tree-3.png", id: StandardTree.WILLOW.name},
        {src: "img/tree-4.png", id: StandardTree.YEW.name}
    ];
}


var StandardTree = {
    NORMAL: {
        name: "tree-1",
        model: function() {
            return new Tree(StandardTree.NORMAL.name, 2, 2, 1000, 25)
        }
    },
    OAK: {
        name: "tree-2",
        model: function() {
            return new Tree(StandardTree.OAK.name, 2, 2, 1000, 50)
        }
    },
    WILLOW: {
        name: "tree-3",
        model: function() {
            return new Tree(StandardTree.WILLOW.name, 2, 2, 1000, 150)
        }
    },
    YEW: {
        name: "tree-4",
        model: function() {
            return new Tree(StandardTree.YEW.name, 2, 2, 1000, 250)
        }
    }
};

function getWoodcuttingScreen(loader) {
    var woodcuttingChain = new ResourceChain();

    var orderedTrees = [
        StandardTree.NORMAL,
        StandardTree.OAK,
        StandardTree.WILLOW,
        StandardTree.YEW
    ];

    for (var i = 0; i < orderedTrees.length; i++) {
        const tree = orderedTrees[i];

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

    return woodcuttingChain;
}

/**
 * A tree resource which has the "duck type" of "Resource model" (implementing interact(), getRespawnTime() and reset()
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
     *
     */
    this.interact = function(callbacks) {

        if (this._currentHealth > 0) {

            if (--this._currentHealth === 0) {

                if (--this._currentLives == 0) {
                    callbacks.deplete();
                } else {
                    callbacks.degrade();
                }
            }
            callbacks.immediate();
        }
    };

    /**
     * Gets the amount of time to wait before respawning
     *
     * @returns {number} The respawn time in milliseconds
     */
    this.getRespawnTime = function() {
        return this._currentLives !== 0 ? this._respawnMultiplier : this._respawnMultiplier * this._lives;
    };

    /**
     * Resets this tree after it has been degraded.
     */
    this.reset = function() {
        this._currentHealth = this._health;
    }
}

/**
 * Get a tree's view object used to manipulate what animations are played for a tree resource
 *
 * @param tree The type of tree to get the view for
 *
 * @returns {ResourceView} A resource view to call animations on.
 */
function getTreeView(tree) {
    var sprite = new createjs.Sprite(tree.spriteSheet, "idle");
    sprite.x = canvas.width / 2;
    sprite.y = canvas.height / 2;

    return new ResourceView(sprite, function(sprite, stage) { // Idle
        sprite.gotoAndPlay("idle");
    }, function(sprite, stage) { // Degrade
        sprite.gotoAndPlay("degrade");
    }, function(sprite, stage) { // Deplete
        sprite.gotoAndPlay("degrade");
    }, function(sprite, stage, callback) { // Interact
        sprite.gotoAndPlay("interact");
    });
}