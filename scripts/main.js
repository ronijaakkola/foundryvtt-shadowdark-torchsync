import { TorchSync } from "./torchsync.js";

Hooks.once("init", () => {
    if (!globalThis.libWrapper) {
        ui.notifications.error(game.i18n.localize("TORCHSYNC.init_libwrapper_error"));
        return;
    }

    // Hook to _gatherLightSources
    libWrapper.register(
        "torchsync-shadowdark",
        "game.system.apps.LightSourceTrackerSD.prototype._gatherLightSources",
        async function (wrapped, ...args) {
            const result = await wrapped.apply(this, args);
            TorchSync.onSDLightSourceChange();
            return result;
        },
        "WRAPPER"
    );

    TorchSync._initiateTorchSyncIcon
});

Hooks.on("renderAmbientLightConfig", async (obj, html) => {
    if (!game.user.isGM) return;
    if (!obj.isEditable) return;

    console.log("TorchSync | renderAmbientLightConfig");

    if (!foundry.utils.hasProperty(obj.document, 'flags.torchsync-shadowdark.enabled')) {
        await obj.document.setFlag('torchsync-shadowdark', 'enabled', false);
    }

    const enabled = obj.document.getFlag("torchsync-shadowdark", "enabled") ?? false;

    const templatePath = "modules/torchsync-shadowdark/templates/light-config.hbs";
    const injection = await renderTemplate(templatePath, { enabled });

    if ($(html).find('.ts-light-config').length === 0) {
        const target = html.querySelector('[data-application-part="advanced"]');
        target.insertAdjacentHTML("afterbegin", injection);
    }
});

Hooks.on("canvasReady", () => {
    if (!game.user.isGM) return;

    TorchSync.syncLightsOnSceneLoad();

    for (const light of canvas.lighting.placeables) {
        const isSynced = light.document.getFlag("torchsync-shadowdark", "enabled");

        if (isSynced) {
            const existingIcon = light.getChildByName("torchsync-icon");
            if (!existingIcon) {
                light.addChild(TorchSync.createTorchSyncIcon());
            }
        }
    }
});

Hooks.on("updateAmbientLight", (doc, changes) => {
    if (!game.user.isGM) return;

    // Only proceed if the flag changed
    const changedFlags = changes.flags?.["torchsync-shadowdark"];
    if (!changedFlags || typeof changedFlags.enabled === "undefined") return;

    const isEnabled = changedFlags.enabled;

    const light = canvas.lighting.placeables.find(l => l.document.id === doc.id);
    if (!light) return;

    const existingIcon = light.getChildByName("torchsync-icon");
    if (existingIcon) {
        light.removeChild(existingIcon);
        existingIcon.destroy();
    }

    if (isEnabled) {
        light.addChild(TorchSync.createTorchSyncIcon());
    }
});
