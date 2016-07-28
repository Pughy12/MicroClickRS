/**
 * Get the manifest for woodcutting assets
 *
 * @returns {*[]} An array of assets
 */
function getWoodcuttingManifest() {
    return [
        {src: "img/tree-1.png", id: StandardTree.NORMAL.id},
        {src: "img/tree-2.png", id: StandardTree.OAK.id},
        {src: "img/tree-3.png", id: StandardTree.WILLOW.id},
        {src: "img/tree-4.png", id: StandardTree.YEW.id},
        {src: "img/leaf.png", id: "leaf"}
    ];
}


var StandardTree = {
    NORMAL: {
        id: "tree-1",
        model: function() {
            return new Tree("Normal", 2, 2, 1000, 25)
        }
    },
    OAK: {
        id: "tree-2",
        model: function() {
            return new Tree("Oak", 2, 2, 1000, 50)
        }
    },
    WILLOW: {
        id: "tree-3",
        model: function() {
            return new Tree("Willow", 2, 2, 1000, 150)
        }
    },
    YEW: {
        id: "tree-4",
        model: function() {
            return new Tree("Yew", 2, 2, 1000, 250)
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

        var image = loader.getResult(tree.id);

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
    centerOnScreen(sprite, 100, 100);

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