import { Color3,Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { loadSceneConfig } from "../data/config-loader";

export const sceneSetting = {
    model: {
        name: '八重神子',
        bio: '能够与你相识，是神子我的幸运',
        avatar: '/assets/bachongshenzi/bcsz.jpg',
        path: '/assets/bachongshenzi/八重神子.pmx', // mmd model path
        scale: new Vector3(1, 1, 1), // mmd model scale
        position: new Vector3(0, 0, 0), // mmd model position
        rotation: new Vector3(0, -0.2, 0), // mmd model rotation
        visible: true, // mmd model visible
        enabled: true, // mmd model enabled
        isPickable: false, // mmd model is pickable
        motion: {
            'motion1': ['/assets/09_メランコリ・ナイト/メランコリ・ナイト.vmd'],
            'idle': ['/assets/花时来信 神里绫华/表情.vmd','/assets/花时来信 神里绫华/动作.vmd'], // 待机动画
            'dance': ['/assets/花时来信 神里绫华/动作.vmd'], // 舞蹈动画
            'walk': ['/assets/09_メランコリ・ナイト/メランコリ・ナイト.vmd']  // 走路动画
        }
    },
    background: {
        image: ['/assets/bg/bg.jpg','/assets/bg/genshin.jpg', '/assets/bg/liyue.jpg', '/assets/bg/night.jpg'], // background image
        size: 'cover', // background image size
        position: 'center', // background image position
        repeat: 'no-repeat', // background image repeat
    },
    color: { //Set transparent background so CSS background shows through
        clearColor: new Color4(0, 0, 0, 0), 
        ambientColor: new Color3(0.5, 0.5, 0.5), // mmd scale material ambient color to 0.5. for same result, set ambient color to 0.5
    },
    performance: {
        autoClear: false, // Disable auto clear for better performance
        autoClearDepthAndStencil: false, // Disable auto clear depth and stencil
    },
    root: {
        position: new Vector3(0, 0, 10), // mmd root position
        rotation: new Vector3(0, 0, 0), // mmd root rotation
        scale: new Vector3(1, 1, 1), // mmd root scale
    },
    mmdCamera: {
        position: new Vector3(8, 15, 0), // mmd camera position
        rotation: new Vector3(0, 0, 0), // mmd camera rotation
        scale: new Vector3(1, 1, 1), // mmd camera scale
        minZ: 1, // mmd camera minZ
        maxZ: 300, // mmd camera maxZ
        speed: 4, // mmd camera speed
    },
    camera: {
        position: new Vector3(8, 15, 0), // mmd camera position
        rotation: new Vector3(0, 0, 0), // mmd camera rotation
        scale: new Vector3(1, 1, 1), // mmd camera scale
        minZ: 0.1, // mmd camera minZ
        maxZ: 1000, // mmd camera maxZ
        speed: 4, // mmd camera speed
        inertia: 0.8, // mmd camera inertia
        lowerRadiusLimit: 5, // mmd camera lowerRadiusLimit
        upperRadiusLimit: 100, // mmd camera upperRadiusLimit
        lowerAlphaLimit: -Math.PI, // mmd camera lowerAlphaLimit
        upperAlphaLimit: Math.PI, // mmd camera upperAlphaLimit
        lowerBetaLimit: 0.1, // mmd camera lowerBetaLimit
        upperBetaLimit: Math.PI - 0.1, // mmd camera upperBetaLimit
        panningSensibility: 2000, // mmd camera panningSensibility
        panningInertia: 0.8, // mmd camera panningInertia
        panningAxis: new Vector3(1, 1, 0), // mmd camera panningAxis
        wheelPrecision: 100, // mmd camera wheelPrecision
        zoomToMouseLocation: true, // mmd camera zoomToMouseLocation
        angularSensibilityX: 2000, // mmd camera angularSensibilityX
        angularSensibilityY: 2000, // mmd camera angularSensibilityY
    },
    directionalLight: {
        intensity: 2.1, // mmd directionalLight intensity
        direction: new Vector3(0.5, -1, 1), // mmd directionalLight direction
        color: new Color3(1, 1, 1), // mmd directionalLight color
        enabled: true, // mmd directionalLight enabled
        autoCalcShadowZBounds: false, // mmd directionalLight autoCalcShadowZBounds
        autoUpdateExtends: false, // mmd directionalLight autoUpdateExtends
        shadowMaxZ: 20, // mmd directionalLight shadowMaxZ
        shadowMinZ: -20, // mmd directionalLight shadowMinZ
        orthoTop: 18, // mmd directionalLight orthoTop
        orthoBottom: -3, // mmd directionalLight orthoBottom
        orthoLeft: -10, // mmd directionalLight orthoLeft
        orthoRight: 10, // mmd directionalLight orthoRight
        shadowOrthoScale: 0, // mmd directionalLight shadowOrthoScale
    },
    shadowGenerator: {
        size: 512, // 提高阴影质量
        transparencyShadow: true, // 对MMD透明材质更友好
        usePercentageCloserFiltering: true, // 启用PCF以获得更好的阴影质量
        quality: 'medium', // mmd shadowGenerator quality
        forceBackFacesOnly: false, // 对MMD更友好，不强制只渲染背面
        filteringQuality: 'medium', // mmd shadowGenerator filteringQuality
        frustumEdgeFalloff: 0.1, // mmd shadowGenerator frustumEdgeFalloff
    },
    pipeline: {
        samples: 2, // mmd postProcess samples
        bloomEnabled: true, // mmd postProcess bloomEnabled
        chromaticAberrationEnabled: false, // mmd postProcess chromaticAberrationEnabled
        fxaaEnabled: true, // mmd postProcess fxaaEnabled
        imageProcessingEnabled: false, // mmd postProcess imageProcessingEnabled
    }
};

/**
 * 从YAML配置更新场景设置中的特定参数
 * 只更新：model.path, model.motion, background.image
 */
export async function updateSceneSettingFromYaml() {
    try {
        const config = await loadSceneConfig();
        
        // 更新模型路径
        sceneSetting.model.name = config.name;
        sceneSetting.model.bio = config.bio;
        sceneSetting.model.avatar = config.avatar;
        sceneSetting.model.path = config.modelPath;
        
        // 更新动作配置
        Object.assign(sceneSetting.model.motion, config.motions);
        
        // 更新背景图片
        sceneSetting.background.image = config.backgroundImages;
        
        // console.log('Scene setting updated from YAML:', {
        //     name: config.name,
        //     bio: config.bio,
        //     avatar: config.avatar,
        //     modelPath: config.modelPath,
        //     motions: Object.keys(config.motions),
        //     backgroundImages: config.backgroundImages
        // });
        
    } catch (error) {
        console.error('Failed to update scene setting from YAML:', error);
    }
}
