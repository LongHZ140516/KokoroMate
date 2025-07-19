/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// for use loading screen, we need to import following module.
import "@babylonjs/core/Loading/loadingScreen";
// for cast shadow, we need to import following module.
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
// for use WebXR we need to import following two modules.
import "@babylonjs/core/Helpers/sceneHelpers";
import "@babylonjs/core/Materials/Node/Blocks";
// for load .bpmx file, we need to import following module.
// import "babylon-mmd/esm/Loader/Optimized/bpmxLoader";
// if you want to use .pmx file, uncomment following line.
import "babylon-mmd/esm/Loader/pmxLoader";
// if you want to use .pmd file, uncomment following line.
// import "babylon-mmd/esm/Loader/pmdLoader";
// for render outline, we need to import following module.
import "babylon-mmd/esm/Loader/mmdOutlineRenderer";
// for play `MmdAnimation` we need to import following two modules.
import "babylon-mmd/esm/Runtime/Animation/mmdRuntimeCameraAnimation";
import "babylon-mmd/esm/Runtime/Optimized/Animation/mmdWasmRuntimeModelAnimation";

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { Scene } from "@babylonjs/core/scene";
import { ShadowOnlyMaterial } from "@babylonjs/materials/shadowOnly/shadowOnlyMaterial";
import { MmdStandardMaterialBuilder } from "babylon-mmd/esm/Loader/mmdStandardMaterialBuilder";
// import { MmdMaterialRenderMethod } from "babylon-mmd/esm/Loader/materialBuilderBase";
// import { BvmdLoader } from "babylon-mmd/esm/Loader/Optimized/bvmdLoader";
import { VmdLoader } from "babylon-mmd/esm/Loader/vmdLoader";
import { SdefInjector } from "babylon-mmd/esm/Loader/sdefInjector";
// import { StreamAudioPlayer } from "babylon-mmd/esm/Runtime/Audio/streamAudioPlayer";
import { MmdCamera } from "babylon-mmd/esm/Runtime/mmdCamera";
import type { MmdMesh } from "babylon-mmd/esm/Runtime/mmdMesh";
import { MmdWasmAnimation } from "babylon-mmd/esm/Runtime/Optimized/Animation/mmdWasmAnimation";
import { MmdWasmInstanceTypeMPR } from "babylon-mmd/esm/Runtime/Optimized/InstanceType/multiPhysicsRelease";
import { GetMmdWasmInstance } from "babylon-mmd/esm/Runtime/Optimized/mmdWasmInstance";
import { MmdWasmRuntime, MmdWasmRuntimeAnimationEvaluationType } from "babylon-mmd/esm/Runtime/Optimized/mmdWasmRuntime";
import { MmdWasmPhysics } from "babylon-mmd/esm/Runtime/Optimized/Physics/mmdWasmPhysics";
// for use Ammo.js physics engine, uncomment following line.
// import ammoPhysics from "babylon-mmd/esm/Runtime/Physics/External/ammo.wasm";
// import { MmdPlayerControl } from "babylon-mmd/esm/Runtime/Util/mmdPlayerControl";

import type { ISceneBuilder } from "./baseRuntime";
import { sceneSetting } from "./scene_setting";

export class SceneBuilder implements ISceneBuilder {
    private directionalLight?: DirectionalLight;
    private shadowGenerator?: ShadowGenerator;
    private scene?: Scene;
    private mmdMesh?: any; // 移到类的顶部，用于存储MMD模型引用
    private mmdModel?: any; // 存储MMD模型实例
    private mmdWasmAnimations?: Record<string, any>; // 存储所有加载的动画
    private mmdRuntime?: MmdWasmRuntime; // 存储MMD运行时实例

    public async build(canvas: HTMLCanvasElement, engine: AbstractEngine): Promise<Scene> {
        // for apply SDEF on shadow, outline, depth rendering
        // await updateSceneSettingFromYaml();
        SdefInjector.OverrideEngineCreateEffect(engine);

        // Set canvas background from settings
        canvas.style.backgroundImage = `url('${sceneSetting.background.image}')`;
        canvas.style.backgroundSize = sceneSetting.background.size;
        canvas.style.backgroundPosition = sceneSetting.background.position;
        canvas.style.backgroundRepeat = sceneSetting.background.repeat;

        // create mmd standard material builder
        const materialBuilder = new MmdStandardMaterialBuilder();
        // materialBuilder.renderMethod = MmdMaterialRenderMethod.DepthWriteAlphaBlending;
        const scene = new Scene(engine);
        this.scene = scene;
        
        // Set scene colors from settings
        scene.clearColor = sceneSetting.color.clearColor;
        scene.ambientColor = sceneSetting.color.ambientColor;
        
        // Performance optimizations from settings
        scene.autoClear = sceneSetting.performance.autoClear;
        scene.autoClearDepthAndStencil = sceneSetting.performance.autoClearDepthAndStencil;

        // Create MMD root transform node
        const mmdRoot = new TransformNode("mmdRoot", scene);
        mmdRoot.position = sceneSetting.root.position.clone();
        mmdRoot.rotation = sceneSetting.root.rotation.clone();
        mmdRoot.scaling = sceneSetting.root.scale.clone();

        // Create MMD camera from settings
        const mmdCamera = new MmdCamera("mmdCamera", sceneSetting.mmdCamera.position.clone(), scene);
        mmdCamera.maxZ = sceneSetting.mmdCamera.maxZ;
        mmdCamera.minZ = sceneSetting.mmdCamera.minZ;
        mmdCamera.parent = mmdRoot;

        // Create ArcRotate camera from settings
        const camera = new ArcRotateCamera("arcRotateCamera", 0, 0, 45, new Vector3(0, 10, 1), scene);
        camera.maxZ = sceneSetting.camera.maxZ;
        camera.minZ = sceneSetting.camera.minZ;
        camera.setPosition(sceneSetting.camera.position.clone());
        camera.inertia = sceneSetting.camera.inertia;
        camera.speed = sceneSetting.camera.speed;
        camera.parent = mmdRoot;
        
        // Enhanced camera controls from settings
        camera.lowerRadiusLimit = sceneSetting.camera.lowerRadiusLimit;
        camera.upperRadiusLimit = sceneSetting.camera.upperRadiusLimit;
        camera.lowerAlphaLimit = sceneSetting.camera.lowerAlphaLimit;
        camera.upperAlphaLimit = sceneSetting.camera.upperAlphaLimit;
        camera.lowerBetaLimit = sceneSetting.camera.lowerBetaLimit;
        camera.upperBetaLimit = sceneSetting.camera.upperBetaLimit;
        
        // Mouse controls from settings
        camera.attachControl(canvas, true);
        camera.panningSensibility = sceneSetting.camera.panningSensibility;
        camera.panningInertia = sceneSetting.camera.panningInertia;
        camera.panningAxis = sceneSetting.camera.panningAxis.clone();
        camera.wheelPrecision = sceneSetting.camera.wheelPrecision;
        camera.zoomToMouseLocation = sceneSetting.camera.zoomToMouseLocation;
        camera.angularSensibilityX = sceneSetting.camera.angularSensibilityX;
        camera.angularSensibilityY = sceneSetting.camera.angularSensibilityY;
        

        // Create directional light from settings
        const directionalLight = new DirectionalLight("DirectionalLight", sceneSetting.directionalLight.direction.clone(), scene);
        this.directionalLight = directionalLight;
        directionalLight.intensity = sceneSetting.directionalLight.intensity;
        directionalLight.diffuse = sceneSetting.directionalLight.color.clone();
        directionalLight.specular = sceneSetting.directionalLight.color.clone(); // set specular color
        
        // Ensure the light is properly configured from settings
        directionalLight.setEnabled(sceneSetting.directionalLight.enabled);
        
        // Set shadow settings from configuration
        directionalLight.autoCalcShadowZBounds = sceneSetting.directionalLight.autoCalcShadowZBounds;
        directionalLight.autoUpdateExtends = sceneSetting.directionalLight.autoUpdateExtends;
        directionalLight.shadowMaxZ = sceneSetting.directionalLight.shadowMaxZ;
        directionalLight.shadowMinZ = sceneSetting.directionalLight.shadowMinZ;
        directionalLight.orthoTop = sceneSetting.directionalLight.orthoTop;
        directionalLight.orthoBottom = sceneSetting.directionalLight.orthoBottom;
        directionalLight.orthoLeft = sceneSetting.directionalLight.orthoLeft;
        directionalLight.orthoRight = sceneSetting.directionalLight.orthoRight;
        directionalLight.shadowOrthoScale = sceneSetting.directionalLight.shadowOrthoScale;

        // Create shadow generator from settings
        const shadowGenerator = new ShadowGenerator(sceneSetting.shadowGenerator.size, directionalLight, true);
        this.shadowGenerator = shadowGenerator;
        shadowGenerator.transparencyShadow = sceneSetting.shadowGenerator.transparencyShadow;
        shadowGenerator.usePercentageCloserFiltering = sceneSetting.shadowGenerator.usePercentageCloserFiltering;
        shadowGenerator.forceBackFacesOnly = sceneSetting.shadowGenerator.forceBackFacesOnly;
        
        // Set shadow quality from settings
        const qualityMap: { [key: string]: number } = {
            'low': ShadowGenerator.QUALITY_LOW,
            'medium': ShadowGenerator.QUALITY_MEDIUM,
            'high': ShadowGenerator.QUALITY_HIGH
        };
        shadowGenerator.filteringQuality = qualityMap[sceneSetting.shadowGenerator.quality] || ShadowGenerator.QUALITY_MEDIUM;
        shadowGenerator.frustumEdgeFalloff = sceneSetting.shadowGenerator.frustumEdgeFalloff;

        // Create ground with shadow material
        const ground = CreateGround("ground", { width: 100, height: 100, subdivisions: 2, updatable: false }, scene);
        const shadowOnlyMaterial = ground.material = new ShadowOnlyMaterial("shadowOnly", scene);
        shadowOnlyMaterial.activeLight = directionalLight;
        shadowOnlyMaterial.alpha = 0.4;
        ground.receiveShadows = true;
        ground.parent = mmdRoot;

        engine.displayLoadingUI();

        const loadingTexts: string[] = [];
        const updateLoadingText = (updateIndex: number, text: string): void => {
            loadingTexts[updateIndex] = text;
            engine.loadingUIText = "<br/><br/><br/><br/>" + loadingTexts.join("<br/><br/>");
        };
        // Create MMD runtime with physics
        const vmdLoader = new VmdLoader(scene);
        vmdLoader.loggingEnabled = true;

        // Load all animations from settings
        const motionConfig = sceneSetting.model.motion as Record<string, string[]>;
        const animationNames = Object.keys(motionConfig);
        
        // Create MMD runtime with WASM physics and load all animations
        const [[mmdWasmInstance, mmdRuntime], allAnimations, mmdMesh] = await Promise.all([
            (async(): Promise<[typeof mmdWasmInstance, typeof mmdRuntime]> => {
                const mmdWasmInstance = await GetMmdWasmInstance(new MmdWasmInstanceTypeMPR());

                // create mmd runtime with physics
                const mmdRuntime = new MmdWasmRuntime(mmdWasmInstance, scene, new MmdWasmPhysics(scene));

                // In buffered mode, application can perform animation evaluation and rendering in parallel. but animation evaluation is one frame delayed.
                mmdRuntime.evaluationType = MmdWasmRuntimeAnimationEvaluationType.Buffered;

                mmdRuntime.loggingEnabled = true;
                mmdRuntime.register(scene);

                mmdRuntime.playAnimation();
                this.mmdRuntime = mmdRuntime;
                return [mmdWasmInstance, mmdRuntime];
            })(),
            // Load all motion files from settings
            Promise.all(
                animationNames.map(async (animationName, index) => {
                    const animationFile = motionConfig[animationName];
                    // console.log(`Loading animation: ${animationName} from ${animationFile}`);
                    
                    return vmdLoader.loadAsync(
                        animationName, // 使用字段名称作为动画名称
                        animationFile,
                        (event) => updateLoadingText(
                            index, 
                            `Loading ${animationName}... ${event.loaded}/${event.total} (${Math.floor(event.loaded * 100 / event.total)}%)`
                        )
                    );
                })
            ),
            // Load model file from settings
            LoadAssetContainerAsync(sceneSetting.model.path, scene, {
                onProgress: 
                (event) => updateLoadingText(animationNames.length, `Loading model... ${event.loaded}/${event.total} (${Math.floor(event.loaded * 100 / event.total)}%)`),
                pluginOptions: {
                    mmdmodel: {
                        loggingEnabled: true,
                        materialBuilder: materialBuilder
                    }
                }
            }).then((result) => {
                result.addAllToScene();
                return result.rootNodes[0] as MmdMesh;
            })
        ]);

        // Create WASM animations for all loaded animations
        const mmdWasmAnimations: Record<string, any> = {};
        allAnimations.forEach((animation, index) => {
            const animationName = animationNames[index];
            mmdWasmAnimations[animationName] = new MmdWasmAnimation(animation, mmdWasmInstance, scene);
            // console.log(`Created WASM animation: ${animationName}`);
        });
        
        // hide loading screen
        scene.onAfterRenderObservable.addOnce(() => engine.hideLoadingUI());

        mmdRuntime.setCamera(mmdCamera);
        // mmdCamera.addAnimation(mmdWasmAnimation);
        // mmdCamera.setAnimation("motion");

        {
            mmdMesh.parent = mmdRoot;
            this.mmdMesh = mmdMesh;

            for (const mesh of mmdMesh.metadata.meshes) mesh.receiveShadows = true;
            shadowGenerator.addShadowCaster(mmdMesh);

            const mmdModel = mmdRuntime.createMmdModel(mmdMesh);
            this.mmdModel = mmdModel; // 保存模型实例
            this.mmdWasmAnimations = mmdWasmAnimations; // 保存动画映射
            
            // Add all animations to the model
            Object.entries(mmdWasmAnimations).forEach(([animationName, wasmAnimation]) => {
                mmdModel.addAnimation(wasmAnimation);
                // console.log(`Added animation to model: ${animationName}`);
            });
            
            // Set default animation (prefer 'idle', fallback to first animation)
            const defaultAnimationName = animationNames.includes('idle') ? 'idle' : animationNames[0];
            if (defaultAnimationName && mmdWasmAnimations[defaultAnimationName]) {
                // console.log(`Setting default animation: ${defaultAnimationName}`);
                // You can set the default animation here if needed
                mmdModel.setAnimation(defaultAnimationName);
                mmdRuntime.onPauseAnimationObservable.add(() => {
                    if (mmdRuntime.animationFrameTimeDuration === mmdRuntime.currentFrameTime) {
                        mmdRuntime.seekAnimation(0);
                        mmdRuntime.playAnimation().then(() => {
                            mmdRuntime.initializeAllMmdModelsPhysics(true);
                        });
                    }
                });
            }

            // make sure directional light follow the model
            const bodyBone = mmdModel.runtimeBones.find((bone) => bone.name === "センター");
            const boneWorldMatrix = new Matrix();

            scene.onBeforeRenderObservable.add(() => {
                bodyBone!.getWorldMatrixToRef(boneWorldMatrix).multiplyToRef(mmdMesh.getWorldMatrix(), boneWorldMatrix);
                boneWorldMatrix.getTranslationToRef(directionalLight.position);
                directionalLight.position.y -= 10;
            });
        }

         // optimize scene when all assets are loaded (unstable)
        scene.onAfterRenderObservable.addOnce(() => {
            scene.freezeMaterials();

            const meshes = scene.meshes;
            for (let i = 0, len = meshes.length; i < len; ++i) {
                const mesh = meshes[i];
                mesh.freezeWorldMatrix();
                mesh.doNotSyncBoundingInfo = true;
                mesh.isPickable = false;
                mesh.doNotSyncBoundingInfo = true;
                mesh.alwaysSelectAsActiveMesh = true;
            }

            scene.skipPointerMovePicking = true;
            scene.skipPointerDownPicking = true;
            scene.skipPointerUpPicking = true;
            scene.skipFrustumClipping = true;
            scene.blockMaterialDirtyMechanism = true;
        });
        
        // Configure model from settings
        if (mmdMesh) {
            // Store reference for later updates
            this.mmdMesh = mmdMesh;
            
            mmdMesh.position = sceneSetting.model.position.clone();
            mmdMesh.rotation = sceneSetting.model.rotation.clone();
            mmdMesh.scaling = sceneSetting.model.scale.clone();
            mmdMesh.setEnabled(sceneSetting.model.enabled);
            mmdMesh.isVisible = sceneSetting.model.visible;
            mmdMesh.isPickable = sceneSetting.model.isPickable;
            
            if (mmdMesh.metadata && mmdMesh.metadata.meshes) {
                for (const mesh of mmdMesh.metadata.meshes) {
                    mesh.receiveShadows = true;
                    
                    // Ensure all materials are properly configured for lighting
                    if (mesh.material) {
                        mesh.material.markAsDirty(0);
                    }
                }
                shadowGenerator.addShadowCaster(mmdMesh);
            }
        }
        
        // Set VmdLoader
        // const vmdLoader = new VmdLoader(scene);
        // const modelMotion = await vmdLoader.loadAsync("motion1", sceneSetting.model.motion['motion1']);
        // mmdMesh.addAnimation(modelMotion);

        // Ensure camera controls are properly initialized after model loading
        scene.executeWhenReady(() => {
            camera.attachControl(canvas, true);
            
            // Force update all materials to ensure lighting settings are applied
            scene.markAllMaterialsAsDirty(0);
    
        });

        // Set up rendering pipeline from settings
        const defaultPipeline = new DefaultRenderingPipeline("default", true, scene, [mmdCamera, camera]);
        defaultPipeline.samples = sceneSetting.pipeline.samples;
        defaultPipeline.bloomEnabled = sceneSetting.pipeline.bloomEnabled;
        defaultPipeline.chromaticAberrationEnabled = sceneSetting.pipeline.chromaticAberrationEnabled;
        defaultPipeline.fxaaEnabled = sceneSetting.pipeline.fxaaEnabled;
        defaultPipeline.imageProcessingEnabled = sceneSetting.pipeline.imageProcessingEnabled;

        // Enhanced camera switching and controls
        this.setupCameraControls(canvas, scene, camera, mmdCamera);
        
        return scene;
    }

    private setupCameraControls(canvas: HTMLCanvasElement, scene: Scene, camera: ArcRotateCamera, mmdCamera: MmdCamera) {
        let lastClickTime = -Infinity;
        let currentCameraIndex = 0;
        const cameras = [camera, mmdCamera];
        
        // Double click to switch cameras
        canvas.onclick = (): void => {
            const currentTime = performance.now();
            if (500 < currentTime - lastClickTime) {
                lastClickTime = currentTime;
                return;
            }
            lastClickTime = -Infinity;

            currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
            scene.activeCamera = cameras[currentCameraIndex];
        };
    }

    // Method to update scene based on control panel data
    public updateScene(sceneData: any) {
        this.updateBackground(sceneData.background);
        this.updateLighting(sceneData.lighting);
        this.updateModel(sceneData.model);
    }

    // Method to update background
    private updateBackground(backgroundData: any) {
        if (!backgroundData) return;
        
        // Update canvas background
        const canvas = this.scene?.getEngine().getRenderingCanvas() as HTMLCanvasElement;
        if (canvas && backgroundData.image) {
            canvas.style.backgroundImage = `url('${backgroundData.image}')`;
        }
    }

    // Method to update model
    private updateModel(modelData: any) {
        if (!this.scene || !modelData) return;

        // Try to find the MMD mesh if we don't have a reference
        if (!this.mmdMesh) {
            // First try to find the mesh with metadata indicating it's an MMD model
            this.mmdMesh = this.scene.rootNodes.find(node => 
                node.metadata && node.metadata.meshes && node.metadata.meshes.length > 0
            ) as any;
            
            // If still not found, try looking for specific model names
            if (!this.mmdMesh) {
                for (const rootNode of this.scene.rootNodes) {
                    if (rootNode.name.includes('.pmx') || 
                        (rootNode.metadata && rootNode.metadata.meshes)) {
                        this.mmdMesh = rootNode;
                        break;
                    }
                }
            }
        }
        
        if (this.mmdMesh) {
            // Update position
            if (modelData.position) {
                this.mmdMesh.position.x = modelData.position.x;
                this.mmdMesh.position.y = modelData.position.y;
                this.mmdMesh.position.z = modelData.position.z;
            }
            
            // Update rotation
            if (modelData.rotation) {
                this.mmdMesh.rotation.x = modelData.rotation.x;
                this.mmdMesh.rotation.y = modelData.rotation.y;
                this.mmdMesh.rotation.z = modelData.rotation.z;
            }
        } else {
            // console.warn("MMD mesh not found for update. Available root nodes:", 
            //     this.scene.rootNodes.map(n => n.name));
        }

        // 强制更新场景
        // this.scene.markAllMaterialsAsDirty(0);
        // this.scene.render(); // 强制渲染
    }

    // Method to update lighting based on control panel data
    public updateLighting(lightData: any) {
        if (!this.directionalLight || !this.scene) {
            // console.warn("Lighting update failed: directionalLight or scene not available");
            return;
        }

        // Update directional light intensity
        this.directionalLight.intensity = lightData.intensity;
        
        // Update directional light direction
        const newDirection = new Vector3(
            lightData.direction.x,
            lightData.direction.y,
            lightData.direction.z
        ).normalize();
        this.directionalLight.direction = newDirection;

        // Update directional light color
        const lightColor = new Color3(
            lightData.color.r,
            lightData.color.g,
            lightData.color.b
        );
        this.directionalLight.diffuse = lightColor;
        this.directionalLight.specular = lightColor; // 同时更新高光颜色

        // Update ambient light
        this.scene.ambientColor = new Color3(
            lightData.ambientIntensity,
            lightData.ambientIntensity,
            lightData.ambientIntensity
        );

        // Handle shadows based on enabled state
        if (lightData.shadowEnabled) {
            // If shadows are enabled, ensure we have a shadow generator
            if (!this.shadowGenerator) {
                // Create new shadow generator
                let shadowMapSize = 512;
                switch (lightData.shadowQuality) {
                    case 'medium':
                        shadowMapSize = 1024;
                        break;
                    case 'high':
                        shadowMapSize = 2048;
                        break;
                }
                
                this.shadowGenerator = new ShadowGenerator(shadowMapSize, this.directionalLight, true);
                this.shadowGenerator.usePercentageCloserFiltering = true;
                this.shadowGenerator.forceBackFacesOnly = true;
                this.shadowGenerator.frustumEdgeFalloff = 0.1;
                
                // Set quality
                const qualityMap: { [key: string]: number } = {
                    'low': ShadowGenerator.QUALITY_LOW,
                    'medium': ShadowGenerator.QUALITY_MEDIUM,
                    'high': ShadowGenerator.QUALITY_HIGH
                };
                this.shadowGenerator.filteringQuality = qualityMap[lightData.shadowQuality] || ShadowGenerator.QUALITY_MEDIUM;
                
                // Update directional light shadow settings
                this.directionalLight.autoCalcShadowZBounds = sceneSetting.directionalLight.autoCalcShadowZBounds;
                this.directionalLight.autoUpdateExtends = sceneSetting.directionalLight.autoUpdateExtends;
                this.directionalLight.shadowMaxZ = sceneSetting.directionalLight.shadowMaxZ;
                this.directionalLight.shadowMinZ = sceneSetting.directionalLight.shadowMinZ;
                this.directionalLight.orthoTop = sceneSetting.directionalLight.orthoTop;
                this.directionalLight.orthoBottom = sceneSetting.directionalLight.orthoBottom;
                this.directionalLight.orthoLeft = sceneSetting.directionalLight.orthoLeft;
                this.directionalLight.orthoRight = sceneSetting.directionalLight.orthoRight;
                this.directionalLight.shadowOrthoScale = sceneSetting.directionalLight.shadowOrthoScale;
                
                // Add shadow casters and receivers
                if (this.scene) {
                    const meshes = this.scene.meshes;
                    for (const mesh of meshes) {
                        if (mesh.name !== "ground" && mesh.name !== "background") {
                            this.shadowGenerator.addShadowCaster(mesh);
                        }
                        if (mesh.name === "ground") {
                            mesh.receiveShadows = true;
                        }
                    }
                }
            } else {
                // Update existing shadow generator quality if needed
                let shadowMapSize = 512;
                let filteringQuality = ShadowGenerator.QUALITY_LOW;
                
                switch (lightData.shadowQuality) {
                    case 'medium':
                        shadowMapSize = 1024;
                        filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
                        break;
                    case 'high':
                        shadowMapSize = 2048;
                        filteringQuality = ShadowGenerator.QUALITY_HIGH;
                        break;
                }
                
                // If quality changed, recreate shadow generator
                if (this.shadowGenerator.filteringQuality !== filteringQuality) {
                    this.shadowGenerator.dispose();
                    
                    this.shadowGenerator = new ShadowGenerator(shadowMapSize, this.directionalLight, true);
                    this.shadowGenerator.usePercentageCloserFiltering = true;
                    this.shadowGenerator.forceBackFacesOnly = true;
                    this.shadowGenerator.filteringQuality = filteringQuality;
                    this.shadowGenerator.frustumEdgeFalloff = 0.1;
                    
                    // Re-add shadow casters and receivers
                    if (this.scene) {
                        const meshes = this.scene.meshes;
                        for (const mesh of meshes) {
                            if (mesh.name !== "ground" && mesh.name !== "background") {
                                this.shadowGenerator.addShadowCaster(mesh);
                            }
                            if (mesh.name === "ground") {
                                mesh.receiveShadows = true;
                            }
                        }
                    }
                }
            }
        } else {
            // If shadows are disabled, dispose shadow generator
            if (this.shadowGenerator) {
                this.shadowGenerator.dispose();
                this.shadowGenerator = undefined;
                
                // Remove shadows from ground
                if (this.scene) {
                    const ground = this.scene.getMeshByName("ground");
                    if (ground) {
                        ground.receiveShadows = false;
                    }
                }
            }
        }

        // Force scene to update
        // this.scene.markAllMaterialsAsDirty(0);
        // this.scene.render();
    }

    /**
     * 播放指定名称的动画
     * @param animationName 动画名称，对应scene_setting中motion字段的键名
     * @returns boolean 播放是否成功
     */
    public playAnimation(animationName: string): boolean {
        if (!this.mmdModel || !this.mmdWasmAnimations) {
            // console.warn("MMD model or animations not initialized");
            return false;
        }

        if (!this.mmdWasmAnimations[animationName]) {
            // console.warn(`Animation "${animationName}" not found. Available animations:`, Object.keys(this.mmdWasmAnimations));
            return false;
        }

        try {
            // console.log(`Switching to animation: ${animationName}`);
            this.mmdModel.setAnimation(animationName);
            this.mmdRuntime?.playAnimation();
            return true;
        } catch (error) {
            // console.error(`Failed to play animation "${animationName}":`, error);
            return false;
        }
    }

    /**
     * 获取当前可用的动画列表
     * @returns string[] 动画名称数组
     */
    public getAvailableAnimations(): string[] {
        if (!this.mmdWasmAnimations) {
            return [];
        }
        return Object.keys(this.mmdWasmAnimations);
    }

    /**
     * 检查动画是否存在
     * @param animationName 动画名称
     * @returns boolean 动画是否存在
     */
    public hasAnimation(animationName: string): boolean {
        return !!(this.mmdWasmAnimations && this.mmdWasmAnimations[animationName]);
    }
}