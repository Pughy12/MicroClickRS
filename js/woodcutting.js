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
            return new Tree("Normal", 10, 2, 1000, 25);
        }
    },
    OAK: {
        id: "tree-2",
        model: function() {
            return new Tree("Oak", 25, 2, 5000, 50);
        }
    },
    WILLOW: {
        id: "tree-3",
        model: function() {
            return new Tree("Willow", 50, 2, 7500, 150);
        }
    },
    YEW: {
        id: "tree-4",
        model: function() {
            return new Tree("Yew", 100, 2, 12000, 250);
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

    const leafImage = loader.getResult('leaf');

    for (var i = 0; i < orderedTrees.length; i++) {
        const tree = orderedTrees[i];

        const image = loader.getResult(tree.id);

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
                return new EventFiringResource(tree.model(), new TreeView(tree, image, leafImage), stage);
            });
        } else {
            woodcuttingChain.chain(new EventFiringResource(tree.model(), new TreeView(tree, image, leafImage), stage));
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
    this._favour = favour;

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
    };

    this.applyFavour = function(player) {
        player.skills.woodcutting.favour += this._favour;
    };
}

/**
 * Get a tree's view object used to manipulate what animations are played for a tree resource
 *
 * @param tree The type of tree to get the view for
 * @param treeImage
 * @param leafImage
 *
 * @constructor
 */
function TreeView(tree, treeImage, leafImage) {
    this.sprite = new createjs.Sprite(tree.spriteSheet, "idle");
    this.cleared = false;
    this._treeImage = treeImage;
    this._leafImage = leafImage;
    this._onScreenLeaves = [];
    this.sprite.scaleX = this.sprite.scaleY = 4;
    const me = this;

    centerOnScreen(this.sprite, 100, 100);

    /**
     * Runs the animation for when this resource is idle
     *
     * @param stage The stage upon which the animation should run
     * @param callback
     */
    this.idleAnim = function(stage, callback) {
        this.sprite.gotoAndPlay("idle");
        safeCall(callback);
    };

    /**
     * Runs the animation for when this resource is degraded
     *
     * @param stage The stage upon which the animation should run
     * @param callback
     */
    this.degradeAnim = function(stage, callback) {
        this.sprite.gotoAndPlay("degrade");
        safeCall(callback);
    };

    /**
     * Runs the animation for when this resource is depleted
     *
     * @param stage The stage upon which the animation should run
     * @param callback
     */
    this.depleteAnim = function(stage, callback) {
        this.sprite.gotoAndPlay("degrade");
        safeCall(callback);
    };

    this.interactAnim = function(stage, event, callback) {
        this.sprite.gotoAndPlay("interact");

        if (!this.cleared) {

            for (var i = 0; i < 2; i++) {
                this._spawnLeaf(stage);
            }
        }
        safeCall(callback);
    };

    this.getOnScreenAssets = function() {
        return [this.sprite].concat(this._onScreenLeaves)
    };

    this._spawnLeaf = function(stage) {
        var leaf = new createjs.Bitmap(this._leafImage);
        leaf.scaleX = leaf.scaleY = 2.5;
        var rand = getRandomInt(0, 3) / 10;
        var direction = getRandomInt(1, 2);

        switch(direction) {
            case 1:
                const startRightX = this.sprite.x + (this._treeImage.width * (0.3 - rand));
                const startRightY = this.sprite.y - (this._treeImage.height * rand);
                this._addLeaf(stage, leaf, startRightX, startRightY);
                createjs.Tween.get(leaf)
                    .to({
                        guide: {
                            path: [
                                startRightX, startRightY,
                                this.sprite.x + (this._treeImage.width * (0.7 + rand)), this.sprite.y - (this._treeImage.height * (0.5 + rand)),
                                canvas.width * (0.9 - rand), canvas.height
                            ]
                        }
                    }, 5000, createjs.Ease.getPowOut(2.5))
                    .call(function() {
                        stage.removeChild(leaf);
                        me._onScreenLeaves.splice(leaf, 1);
                    });
                break;
            case 2:
                const startLeftX = this.sprite.x - (this._treeImage.width * (0.5 - rand));
                const startLeftY = this.sprite.y - (this._treeImage.height * rand);
                this._addLeaf(stage, leaf, startLeftX, startLeftY);
                createjs.Tween.get(leaf)
                    .to({
                        guide: {
                            path: [
                                startLeftX, startLeftY,
                                this.sprite.x - (this._treeImage.width * (1.1 + rand)), this.sprite.y - (this._treeImage.height * (0.5 + rand)),
                                canvas.width * (0.1 + rand), canvas.height
                            ]
                        }
                    }, 5000, createjs.Ease.getPowOut(2.5))
                    .call(function() {
                        stage.removeChild(leaf);
                        me._onScreenLeaves.splice(leaf, 1);
                    });
        }
    };

    this._addLeaf = function(stage, leaf, x, y) {
        leaf.x = x;
        leaf.y = y;
        stage.addChild(leaf);
        this._onScreenLeaves.push(leaf);
    }
}