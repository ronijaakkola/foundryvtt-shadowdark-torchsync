export class TorchSync {
    static previousState;

    /**
     * Checks if there are any active light sources being tracked.
     *
     * This method iterates through the monitored light sources in the 
     * `game.shadowdark.lightSourceTracker` and determines if any of them 
     * have active lights.
     *
     * @returns {boolean} - Returns `true` if at least one light source is active, otherwise `false`.
     */
    static _checkActiveLightSources() {
        const sources = game.shadowdark.lightSourceTracker.monitoredLightSources;

        for (const source of sources) {
            if (source.lightSources && source.lightSources.length > 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Retrieves all light sources on the canvas that have the "torchsync-shadowdark" flag enabled.
     *
     * @returns {Array<Object>} An array of light source objects that are synced with the "torchsync-shadowdark" module.
     */
    static _getSyncedLightSources() {
        return canvas.lighting.objects.children.filter(light => 
            light.document.getFlag("torchsync-shadowdark", "enabled") === true
        );
    }

    /**
     * Toggles the visibility of all synced light sources in the scene.
     *
     * @param {boolean} visible - Determines whether the light sources should be visible.
     *                            Pass `true` to make them visible, or `false` to hide them.
     */
    static _toggleSceneLights(visible) {
        const sources = this._getSyncedLightSources();
        sources.map(light => light.document.update({ hidden: !visible }));
    }

    /**
     * This method will be called when the Shadowdark system updates its light sources.
     */
    static onSDLightSourceChange() {
        const currentState = this._checkActiveLightSources();
        // Debounce if the state has not changed
        if (currentState !== this.previousState) {
            this._toggleSceneLights(currentState);
            this.previousState = currentState;
        }
    }

    /**
     * Handles changes to the ambient light configuration.
     * Toggles the visibility of the light source based on the current state.
     *
     * @param {AmbientLight} light - The ambient light object whose configuration has changed.
     */
    static onAmbientLightConfigChange(light) {
        const currentState = this._checkActiveLightSources();
        light.document.update({ hidden: !currentState });
    }

    /**
     * This method will be called after the scene is loaded.
     * It will check the current state of light sources and toggle visibility accordingly.
     */
    static syncLightsOnSceneLoad() {
        const currentState = this._checkActiveLightSources();
        this._toggleSceneLights(currentState);
        this.previousState = currentState;
    }

    /**
     * Creates a PIXI.Container representing a TorchSync icon.
     * The icon consists of a circular background and a torch sprite.
     *
     * @returns {PIXI.Container} A PIXI.Container containing the TorchSync icon.
     */
    static createTorchSyncIcon() {
        const iconSize = 24;
        const padding = 4;
        const totalSize = iconSize + padding * 2;

        const container = new PIXI.Container();
        container.name = "torchsync-icon";
        container.position.set(30, -30);
        container.zIndex = 100;

        const bg = new PIXI.Graphics();
        bg.beginFill(0x272727);
        bg.lineStyle(2, 0x000000);
        bg.drawCircle(totalSize / 2, totalSize / 2, totalSize / 2);
        bg.endFill();
        bg.pivot.set(totalSize / 2, totalSize / 2);
        container.addChild(bg);

        const sprite = PIXI.Sprite.from("modules/torchsync-shadowdark/assets/icons/sd-torch-icon.svg");
        sprite.width = iconSize - 6;
        sprite.height = iconSize;
        sprite.anchor.set(1);
        sprite.position.set(18 / 2, 24 / 2);
        container.addChild(sprite);

        return container;
    }
}