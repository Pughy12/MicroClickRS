
function getFarmingManifest() {
    //FIXME PUG PLS
}

var StandardHerb = {
    MARENTILL: {
        model: function() {
            return new Herb("Marentill", 5, 1000, 25, 1000);
        }
    },
    RANARR: {
        model: function() {
            return new Herb("Ranarr", 5, 1000, 25, 1000);
        }
    },
    SNAPDRAGON: {
        model: function() {
            return new Herb("Snapdragon", 5, 1000, 25, 1000);
        }
    },
    DWARF_WEED: {
        model: function() {
            return new Herb("Dwarf Weed", 5, 1000, 25, 1000);
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

    var resourceChain = new ResourceChain();

    for (var i = 0; i < orderedHerbs.length; i++) {
        const herb = orderedHerbs[i];

        var image = loader.getResult(herb.name);

        herb.spriteSheet = new createjs.SpriteSheet({
            images: [image],
            frames: {width: image.width / 5, height: image.height},
            animations: {
                idle: 0,
                degrade: 1
            }
        });

        if (i === (orderedHerbs.length - 1)) {
            resourceChain.chainForever(function() {
                return new EventFiringResource(herb.model(), getTreeView(herb), stage);
            });
        } else {
            resourceChain.chain(new EventFiringResource(herb.model(), getTreeView(herb), stage));
        }
    }

}

/**
 * A herb resource which has the "duck type" of "Resource model" (implementing interact(), getRespawnTime() and reset()
 *
 * @param name The name of the herb
 * @param lives The lives of the herb
 * @param respawnMultiplier The multiplier for respawn times (on degrade, this is the time til respawn,
 *                              on deplete this multiplier is applied to the number of lives)
 * @param favour The amount of favour received for harvesting the herb
 * @param growTime The amount of time it takes this herb to grow
 * @constructor
 */
function Herb(name, lives, respawnMultiplier, favour, growTime) {
    this.name = name;
    this._health = 2;
    this._currentHealth = 2;
    this._lives = lives;
    this._currentLives = lives;
    this._respawnMultiplier = respawnMultiplier;
    this._growTime = growTime;
    this.favour = favour;
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
                }, this._growTime);
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
        this._currentHealth = this._health;
    };
}

/**
 * Get a herb's view object used to manipulate what animations are played for a herb resource
 *
 * @param herb The type of herb to get the view for
 * @param x The x co-ordinate that this view should start in
 * @param y The y co-ordinate that this view should start in
 *
 * @returns {ResourceView} A resource view to call animations on.
 */
function getHerbView(herb, x, y) {
    var sprite = new createjs.Sprite(herb.spriteSheet, "idle");
    sprite.x = x;
    sprite.y = y;

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