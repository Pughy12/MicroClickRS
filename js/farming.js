
function getFarmingManifest() {
    return [
        {src: "img/herb-1.png", id: StandardHerb.MARENTILL.id},
        {src: "img/herb-2.png", id: StandardHerb.RANARR.id},
        {src: "img/herb-3.png", id: StandardHerb.SNAPDRAGON.id},
        {src: "img/herb-4.png", id: StandardHerb.DWARF_WEED.id},
        {src: "img/herb-patch.png", id: "herb-patch"}
    ];
}

var StandardHerb = {
    MARENTILL: {
        id: "herb-1",
        model: function() {
            return new Herb("Marentill", 20, 1000, 25, 2000, 5000);
        }
    },
    RANARR: {
        id: "herb-2",
        model: function() {
            return new Herb("Ranarr", 20, 3500, 60, 7000, 11000);
        }
    },
    SNAPDRAGON: {
        id: "herb-3",
        model: function() {
            return new Herb("Snapdragon", 15, 7500, 150, 15000, 20000);
        }
    },
    DWARF_WEED: {
        id: "herb-4",
        model: function() {
            return new Herb("Dwarf Weed", 10, 12500, 350, 25000, 35000);
        }
    }
};

function getFarmingScreen(loader) {

    var orderedHerbs = [
        StandardHerb.MARENTILL,
        StandardHerb.RANARR,
        StandardHerb.SNAPDRAGON,
        StandardHerb.DWARF_WEED
    ];

    var herbPatch = new createjs.Bitmap(loader.getResult("herb-patch"));
    centerOnScreen(herbPatch, herbPatch.image.height, herbPatch.image.width);
    herbPatch.scaleX = 1.4;
    herbPatch.scaleY = 1.4;

    herbPatch.on("click", function() {
        console.log("YOU HAVE CLICKED IMAGE LUL");
    });

    var chains = [];

    var xOffset = (herbPatch.image.width / 2);
    var yOffset = (herbPatch.image.height / 2);

    var coords = [
        {x: herbPatch.x, y: herbPatch.y},
        {x: herbPatch.x + xOffset, y: herbPatch.y},
        {x: herbPatch.x - xOffset, y: herbPatch.y},
        {x: herbPatch.x - xOffset, y: herbPatch.y - yOffset},
        {x: herbPatch.x, y: herbPatch.y - yOffset},
        {x: herbPatch.x + xOffset, y: herbPatch.y - yOffset},
        {x: herbPatch.x - xOffset, y: herbPatch.y + yOffset},
        {x: herbPatch.x, y: herbPatch.y + yOffset},
        {x: herbPatch.x + xOffset, y: herbPatch.y + yOffset}
    ];

    for (var i = 0; i < orderedHerbs.length; i++) {
        const herb = orderedHerbs[i];

        var image = loader.getResult(herb.id);
        var singleWidth = image.width / 6;

        herb.spriteSheet = new createjs.SpriteSheet({
            images: [image],
            frames: {width: singleWidth, height: image.height},
            animations: {
                idle: 0,
                water: 1,
                grown: 4,
                grow: [2, 4, "grown", 0.5],
                die: 5
            }
        });

        const regX = singleWidth / 2;
        const regY = image.height / 2;

        for (var coordIndex = 0; coordIndex < coords.length; coordIndex++) {
            const coord = coords[coordIndex];

            if (!notNull(chains[coordIndex])) {
                chains[coordIndex] = new ResourceChain();
            }

            if (i === (orderedHerbs.length - 1)) {
                chains[coordIndex].chainForever(function () {
                    return new EventFiringResource(herb.model(), new HerbView(herb, coord.x, coord.y, regX, regY), stage);
                });
            } else {
                chains[coordIndex].chain(new EventFiringResource(herb.model(), new HerbView(herb, coord.x, coord.y, regX, regY), stage));
            }
        }
    }

    return {
        draw: function(stage) {
            stage.addChild(herbPatch);

            for (var i = 0; i < chains.length; i++) {
                chains[i].draw(stage);
            }
        },
        clear: function(stage) {
            stage.removeChild(herbPatch);

            for (var i = 0; i < chains.length; i++) {
                chains[i].clear(stage);
            }
        }
    };

}

/**
 * A herb resource which has the "duck type" of "Resource model" (implementing interact(), getRespawnTime() and reset()
 *
 * @param name The name of the herb
 * @param lives The lives of the herb
 * @param respawnMultiplier The multiplier for respawn times (on degrade, this is the time til respawn,
 *                              on deplete this multiplier is applied to the number of lives)
 * @param favour The amount of favour received for harvesting the herb
 * @param growMin The minimum amount of time it takes this herb to grow
 * @param growMax The maximum amount of time it takes this herb to grow
 * @constructor
 */
function Herb(name, lives, respawnMultiplier, favour, growMin, growMax) {
    this.name = name;
    this._health = 2;
    this._currentHealth = 2;
    this._lives = lives;
    this._currentLives = lives;
    this._respawnMultiplier = respawnMultiplier;
    this._growMin = growMin;
    this._growMax = growMax;
    this._favour = favour;
    this._isReady = false;

    const me = this;

    /**
     * Water this herb, then harvest this herb     *
     */
    this.interact = function(callbacks) {

        switch(this._currentHealth) {
            case 2:
                this._currentHealth--;
                callbacks.immediate();

                setTimeout(function() {
                    callbacks.delayed(function() {
                        me._isReady = true;
                    });
                }, getRandomInt(this._growMin, this._growMax));
                break;
            case 1:

                if (this._isReady) {
                    this._currentHealth--;

                    if (--this._currentLives == 0) {
                        callbacks.deplete();
                    } else {
                        callbacks.degrade();
                    }
                }
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

    this.reset = function() {
        this._isReady = false;
        this._currentHealth = this._health;
    };

    this.applyFavour = function(player) {
        player.skills.farming.favour += this._favour;
    };
}

/**
 * Get a herb's view object used to manipulate what animations are played for a herb resource
 *
 * @param herb The type of herb to get the view for
 * @param x The x co-ordinate that this view should start in
 * @param y The y co-ordinate that this view should start in
 * @param regX The offset for the position of the image
 * @param regY The offset for the position of the image
 *
 * @constructor
 */
function HerbView(herb, x, y, regX, regY) {
    this.sprite = new createjs.Sprite(herb.spriteSheet, "idle");
    this.cleared = false;
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.regX = regX;
    this.sprite.regY = regY;
    this.sprite.scaleX = this.sprite.scaleY = 2;
    const me = this;

    this.idleAnim = function(stage, callback) {
        this.sprite.gotoAndPlay("idle");

        // Reset the sprite's position since we took it off the screen during a harvest
        this.sprite.x = x;
        this.sprite.y = y;

        if (!this.cleared) {
            stage.addChild(this.sprite);
        }
        safeCall(callback);
    };

    this.degradeAnim = function(stage, callback) {
        createjs.Tween.get(this.sprite).to({x: -regX, y: -regY}, 2000, createjs.Ease.getElasticInOut(2, 5)).call(function() {
            stage.removeChild(me.sprite);
            safeCall(callback);
        });
    };

    this.depleteAnim = function(stage, callback) {
        this.sprite.gotoAndPlay("die");
        callback();
    };

    this.interactAnim = function(stage, event, callback) {

        if (notNull(callback)) {
            this.sprite.on('animationend', function() {
                safeCall(callback)
            }, null, true);
        }

        if (event.type == eventType.IMMEDIATE) {
            this.sprite.gotoAndPlay("water");
        } else if (event.type == eventType.DELAYED) {
            this.sprite.gotoAndPlay("grow");
        }
    };

    this.getOnScreenAssets = function() {
        return [this.sprite];
    }
}