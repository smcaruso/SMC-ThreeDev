// import "./style.css";
import * as THREE from "three";
import { gsap } from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { VRButton } from "three/examples/jsm/webxr/VRButton.js"
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory.js"

import LoadingScreenVertexShader from "/src/shaders/loader/vertex.glsl"
import LoadingScreenFragmentShader from "/src/shaders/loader/fragment.glsl"

//// WINDOW SELECTORS ////

const WindowSizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
const CanvasElement = document.querySelector("canvas.webgl");
const TitleBlock = document.querySelector(".titlebar");

const InfoPanels = document.querySelectorAll(".infopanel");
const AboutSteveInfoPanel = document.querySelector("#AboutSteve");
const AboutThisPageInfoPanel = document.querySelector("#AboutThisPage");
const MacOfBkInfoPanel = document.querySelector("#MacOfBk");
const VirtualRealityInfoPanel = document.querySelector("#VirtualReality");
const InstallationsInfoPanel = document.querySelector("#Installations");
const ExhibitDesignInfoPanel = document.querySelector("#ExhibitDesign");
const MobileVRInfoPanel = document.querySelector("#MobileVR");
const Interactive3DInfoPanel = document.querySelector("#Interactive");
const AugmentedRealityInfoPanel = document.querySelector("#AugmentedReality");
const ContactButton = document.querySelector(".contact");
const ContactInfoPanel = document.querySelector("#Contact");

// Cursor
const ScreenCursorPosition = new THREE.Vector2();
let RaycastActive = false;

// Loading bar

const LoadingBarElement = document.querySelector(".loadingbar")

//// LOADERS & MANAGER ////

const LoadingManager = new THREE.LoadingManager(
    function LoadingComplete() {
        console.log("All assets loaded");
        RemoveLoadingScreen();
        CreateText();
    },
    function LoadingInProgress(AssetURL, NumLoaded, NumTotal) {
        const ProgressRatio = NumLoaded / NumTotal;
        LoadingBarElement.style.transform = `scaleX(${1-ProgressRatio})`;
        console.log(`loading ${AssetURL} in progress`);
    },
    function LoadingError(AssetURL) {
        console.log(`Error loading ${AssetURL}`);
    }
);

const CubeMapLoader = new THREE.CubeTextureLoader(LoadingManager);
const TextureLoader = new THREE.TextureLoader(LoadingManager);
const GLTFModelLoader = new GLTFLoader(LoadingManager);
const FontLoader = new THREE.FontLoader();

//// BASIC SCENE SETUP ////

const Scene = new THREE.Scene();


// Camera setup

const ViewportCamera = new THREE.PerspectiveCamera(45, WindowSizes.width / WindowSizes.height, 0.1, 100);
// ViewportCamera.position.set(-5.6, 1.2, 8);
ViewportCamera.position.set(-5.6, -3, 12.75);
ViewportCamera.layers.enableAll();
Scene.add(ViewportCamera);

// WebGL Renderer

const GLRenderer = new THREE.WebGLRenderer({ canvas: CanvasElement });
GLRenderer.setSize(WindowSizes.width, WindowSizes.height);
GLRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
GLRenderer.setClearColor("rgb(240, 250, 255)"); //c8e0f5
GLRenderer.outputEncoding = THREE.sRGBEncoding;
GLRenderer.shadowMap.enabled = true;
GLRenderer.xr.enabled = true;
GLRenderer.shadowMap.type = THREE.BasicShadowMap;

// WebXR Setup

document.body.appendChild(VRButton.createButton(GLRenderer));

const ControllerModelFactor = new XRControllerModelFactory();
const MotionControllerA = GLRenderer.xr.getControllerGrip(0);
MotionControllerA.add(ControllerModelFactor.createControllerModel(MotionControllerA));

const MotionControllerB = GLRenderer.xr.getControllerGrip(1);
MotionControllerB.add(ControllerModelFactor.createControllerModel(MotionControllerB));

Scene.add(MotionControllerA, MotionControllerB);

// Loading overlay

const LoadingOverlay = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 2, 1),
    new THREE.ShaderMaterial({
        vertexShader: LoadingScreenVertexShader,
        fragmentShader: LoadingScreenFragmentShader,
        uniforms: {
            uAlpha: {value: 1.0 },
            // uTime: { value: 0.0 },
            uMouseX: { value: 0.5 },
            uMouseY: { value: 0.5 },
        },
        transparent: true,
        wireframe: false
    })
);
Scene.add(LoadingOverlay);

// Orbit Controls

const OrbitControlSystem = new OrbitControls(ViewportCamera, CanvasElement);
const OrbitStartTarget = new THREE.Vector3(-0.365, 1.17, 0.54);
OrbitControlSystem.enableDamping = true;
OrbitControlSystem.target = OrbitStartTarget;
OrbitControlSystem.minDistance = 2;
OrbitControlSystem.maxDistance = 18;
OrbitControlSystem.minAzimuthAngle = -Math.PI * 0.5;
OrbitControlSystem.maxAzimuthAngle = Math.PI * 0.025;
OrbitControlSystem.maxPolarAngle = Math.PI * 0.6;
OrbitControlSystem.minPolarAngle = Math.PI * 0.25;

//// LIGHTS ////

const GILight = new THREE.AmbientLight("rgb(255, 240, 240)", 0.5);
const DirLight = new THREE.DirectionalLight("#ffffff", 1);
DirLight.translateX(5);
DirLight.translateZ(3);
DirLight.castShadow = true;

Scene.add(DirLight, DirLight.target, GILight);

const ModernUrbanCubeMap = CubeMapLoader.load([
    '/images/cubemap/px.jpg',
    '/images/cubemap/nx.jpg',
    '/images/cubemap/py.jpg',
    '/images/cubemap/ny.jpg',
    '/images/cubemap/pz.jpg',
    '/images/cubemap/nz.jpg'
]);

ModernUrbanCubeMap.encoding = THREE.sRGBEncoding;
Scene.environment = ModernUrbanCubeMap;

let SceneFog;
if (window.innerWidth < 1000) {
    SceneFog = new THREE.Fog("rgb(240, 250, 255)", 12, 28);

} else {
    SceneFog = new THREE.Fog("rgb(240, 250, 255)", 12, 18);
}
Scene.fog = SceneFog;

// Baked mesh textures

const BakedMaterials = new Array();

const PlatformMaterial = new THREE.MeshBasicMaterial({map: TextureLoader.load("/images/PlatformsBakedFade.jpg")});
const DesktopMaterial = new THREE.MeshBasicMaterial({map: TextureLoader.load("/images/DesktopBaked.jpg")});
const MobileVRMaterial = new THREE.MeshBasicMaterial({map: TextureLoader.load("/images/MobileVRBaked.jpg")});
const WebStreamingMaterial = new THREE.MeshBasicMaterial({map: TextureLoader.load("/images/WebStreamingBaked.jpg")});
const ARMaterial = new THREE.MeshBasicMaterial({map: TextureLoader.load("/images/ARBaked.jpg")});
const ExhibitDesignMaterial = new THREE.MeshBasicMaterial({map: TextureLoader.load("/images/DesignBaked.jpg")});
const KioskMaterial = new THREE.MeshBasicMaterial({map: TextureLoader.load("/images/KioskBaked.jpg")});
const VRMaterial = new THREE.MeshBasicMaterial({map: TextureLoader.load("/images/VRBaked.jpg")});

BakedMaterials.push(
    PlatformMaterial, 
    DesktopMaterial,
    MobileVRMaterial,
    WebStreamingMaterial,
    ARMaterial,
    ExhibitDesignMaterial,
    KioskMaterial,
    VRMaterial
);

for (let material of BakedMaterials) {
    material.map.flipY = false;
    material.map.encoding = THREE.sRGBEncoding;
};

//// OBJECTS ////

const MeshObjects = new THREE.Group();
MeshObjects.name = "Mesh Objects";

const AboutSteveClickArea = new THREE.Mesh(
    new THREE.CylinderBufferGeometry(0.4, 0.4, 1.8, 3, 1),
    new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0
    })
);
AboutSteveClickArea.position.set(0.5, 1.8/2, -0.35);
AboutSteveClickArea.name = "About Steve";
AboutSteveClickArea.infopanel = AboutSteveInfoPanel;
AboutSteveClickArea.textOffset = new THREE.Vector3(0, 1, 0);
MeshObjects.add(AboutSteveClickArea);

GLTFModelLoader.load(
    "/geometry/platforms.glb",
    function(model) {
        for (let child of model.scene.children) {
            child.material = PlatformMaterial;
            child.name = "Platforms";
            // child.layers.set(2);
            child.textOffset = new THREE.Vector3(0, 0, 0);
            MeshObjects.add(child);
        };
    }
);

GLTFModelLoader.load(
    "/geometry/desktop.glb",
    function(model) {
        // model.scene.name = "Macintosh of Brooklyn";
        const StudioItems = [...model.scene.children];
        StudioItems[0].name = "Macintosh of Brooklyn";
        StudioItems[0].infopanel = MacOfBkInfoPanel;
        StudioItems[0].textOffset = new THREE.Vector3(-0.85, 1.55, 1.25);
        StudioItems[0].layers.enable(3);
        StudioItems[1].name = "How does this site work?";
        StudioItems[1].infopanel = AboutThisPageInfoPanel;
        StudioItems[1].textOffset = new THREE.Vector3(-0.5, 0.65, -0.25);
        StudioItems[1].layers.enable(3);
        StudioItems[2].name = "Steven M. Caruso\nDesign Studio";
        // StudioItems[2].layers.set(2);
        StudioItems[2].textOffset = new THREE.Vector3(-0.65, 0.25, -0.45);
        for (let item of StudioItems) {
            item.material = DesktopMaterial;
            MeshObjects.add(item);
        };
    }
);

GLTFModelLoader.load(
    "/geometry/mobilevr.glb",
    function(model) {
        model.scene.children[0].material = MobileVRMaterial;
        model.scene.children[0].name = "Mobile Virtual Reality";
        model.scene.children[0].infopanel = MobileVRInfoPanel;
        model.scene.children[0].textOffset = new THREE.Vector3(-0.05, 0.55, 0.5);
        model.scene.children[0].layers.enable(3);
        MeshObjects.add(model.scene.children[0]);
    }
);

GLTFModelLoader.load(
    "/geometry/webstreaming.glb",
    function(model) {
        model.scene.children[0].material = WebStreamingMaterial;
        model.scene.children[0].name = "Interactive 3D Experiences";
        model.scene.children[0].infopanel = Interactive3DInfoPanel;
        model.scene.children[0].textOffset = new THREE.Vector3(-0.2, 1.5, -0.1);
        model.scene.children[0].layers.enable(3);
        MeshObjects.add(model.scene.children[0]);
    }
);

GLTFModelLoader.load(
    "/geometry/arbeam.glb",
    function(model){
        model.scene.children[0].material = ARMaterial;
        model.scene.children[0].name = "Augmented Reality"
        model.scene.children[0].infopanel = AugmentedRealityInfoPanel;
        model.scene.children[0].textOffset = new THREE.Vector3(-0.2, 0.75, 0);
        model.scene.children[0].layers.enable(3);
        MeshObjects.add(model.scene.children[0]);
    }
);

GLTFModelLoader.load(
    "/geometry/exhibitdesign.glb",
    function(model) {
        model.scene.children[0].material = ExhibitDesignMaterial;
        model.scene.children[0].name = "Exhibit & Experiential Design";
        model.scene.children[0].infopanel = ExhibitDesignInfoPanel;
        model.scene.children[0].textOffset = new THREE.Vector3(-0.25, 1.55, 0.25);
        model.scene.children[0].layers.enable(3);
        MeshObjects.add(model.scene.children[0]);
    }
);

GLTFModelLoader.load(
    "/geometry/kiosk.glb",
    function(model){
        model.scene.children[0].material = KioskMaterial;
        model.scene.children[0].name = "Interactive 3D Installations";
        model.scene.children[0].infopanel = InstallationsInfoPanel;
        model.scene.children[0].textOffset = new THREE.Vector3(-0.35, 2, 0.35);
        model.scene.children[0].layers.enable(3);
        MeshObjects.add(model.scene.children[0]);
    }
);

GLTFModelLoader.load(
    "/geometry/vrsetup.glb",
    function(model) {
        model.scene.children[0].material = VRMaterial;
        model.scene.children[0].name = "Virtual Reality Experiences";
        model.scene.children[0].infopanel = VirtualRealityInfoPanel;
        model.scene.children[0].textOffset = new THREE.Vector3(-0.5, 0.75, 0.45);
        model.scene.children[0].layers.enable(3);
        MeshObjects.add(model.scene.children[0]);
    }
);

Scene.add(MeshObjects);

// Animated self

let AnimationContainer = {};

GLTFModelLoader.load(
    "/geometry/smcanim.glb",
    function(model) {
        const Steve = model.scene.children.find(
            function(child) {
                return child.name === "Armature001";
            }
        );
        AnimationContainer.Steve = Steve;
        for (let i = 0; i < Steve.children.length; i++) {
            if (Steve.children[i].type == "SkinnedMesh") {
                Steve.children[i].material.roughness = 0.7;
                Steve.children[i].material.envMap = ModernUrbanCubeMap;
                Steve.children[i].material.envMapIntensity = 0.5;
                // Steve.children[i].layers.set(2);
            }
        }
        
        AnimationContainer.mixer = new THREE.AnimationMixer( model );
        AnimationContainer.clips = model.animations;
        AnimationContainer.WavingAnimation = AnimationContainer.mixer.clipAction(AnimationContainer.clips[0], Steve);
        AnimationContainer.WavingAnimation.timeScale = 0.0005;
        AnimationContainer.WavingAnimation.play();
        
        Steve.translateX(0.5);
        Steve.translateZ(-0.35);
        Steve.rotateY(Math.PI * -0.4);

        Steve.castShadow = true;
        Steve.receiveShadow = true;

        Scene.add(Steve);
        DirLight.target = Steve;
    }
);

// Headline Selection Volumes

const StudioBlock = new THREE.Group();
StudioBlock.name = "Studio";
StudioBlock.offsetX = -2.4;
StudioBlock.offsetY = 1;
StudioBlock.offsetZ = 2.5;
StudioBlock.targetOffset = new THREE.Vector3(0,0,0);

const StudioBlockVolume = new THREE.Mesh(
    new THREE.BoxBufferGeometry(3, 2, 3),
    new THREE.MeshBasicMaterial({
        color: "rgb(0, 5, 20)",
        transparent: false,
        depthWrite: false,
        opacity: 1,
        wireframe: false,
        fog: false,
        blending: THREE.AdditiveBlending
    })
);

StudioBlock.add(StudioBlockVolume);
StudioBlock.translateY(1.05);

const VirtualBlock = new THREE.Group()
VirtualBlock.name = "Virtual";
VirtualBlock.offsetX = -3;
VirtualBlock.offsetY = 1;
VirtualBlock.offsetZ = 5;
VirtualBlock.targetOffset = new THREE.Vector3(0,-1.5,-1);

const VirtualBlockVolume = new THREE.Mesh(
    new THREE.BoxBufferGeometry(7, 2.75, 3),
    new THREE.MeshBasicMaterial({
        color: "rgb(20, 0, 10)",
        transparent: false,
        depthWrite: false,
        opacity: 1,
        wireframe: false,
        fog: false,
        blending: THREE.AdditiveBlending
    })
);
VirtualBlock.add(VirtualBlockVolume);
VirtualBlock.position.set(-2, 2.925, -4);

const ExperientialBlock = new THREE.Group();
ExperientialBlock.name = "Experiential";
ExperientialBlock.offsetX = -5;
ExperientialBlock.offsetY = -0.25;
ExperientialBlock.offsetZ = 4;
ExperientialBlock.targetOffset = new THREE.Vector3(0,-1,1.5);

const ExpBlockVolume = new THREE.Mesh(
    new THREE.BoxBufferGeometry(3, 3.5, 9),
    new THREE.MeshBasicMaterial({
        color: "rgb(0, 15, 12)",
        transparent: false,
        depthWrite: false,
        opacity: 1,
        wireframe: false,
        fog: false,
        blending: THREE.AdditiveBlending
    })
);
ExperientialBlock.add(ExpBlockVolume);
ExperientialBlock.position.set(4, 4.3, -1);

let StudioText, VirtualText, ExpText;

function CreateText() {
    FontLoader.load(
        "/Poppins_Bold.json",
        function(PoppinsBold) {
            StudioText = new THREE.Mesh(
                new THREE.TextGeometry(
                    "Studio", {
                    font: PoppinsBold,
                    size: .35,
                    height: 0.05
                }),
                new THREE.MeshStandardMaterial({
                color: new THREE.Color("rgb(50,120,255)"),
                fog: false,
            })
            );
            StudioText.geometry.computeBoundingBox();
            StudioText.geometry.translate(
            - StudioText.geometry.boundingBox.max.x * 0.5,
            - StudioText.geometry.boundingBox.max.y * 0.5,
            - StudioText.geometry.boundingBox.max.z * 0.5
                );        
                StudioBlock.add(StudioText);
                
            VirtualText = new THREE.Mesh(
                new THREE.TextGeometry(
                    "Virtual", {
                    font: PoppinsBold,
                    size: .5,
                    height: 0.1
                }),
                new THREE.MeshStandardMaterial({
                    color: new THREE.Color("rgb(255,50,50)"),
                    fog: false
                })
            );
            VirtualText.geometry.computeBoundingBox();
            VirtualText.geometry.translate(
                - VirtualText.geometry.boundingBox.max.x * 0.5,
                - VirtualText.geometry.boundingBox.max.y * 0.5,
                - VirtualText.geometry.boundingBox.max.z * 0.5
            );
            VirtualText.translateZ(1);
            VirtualBlock.add(VirtualText);
            
            ExpText = new THREE.Mesh(
                new THREE.TextGeometry(
                    "Experiential", {
                    font: PoppinsBold,
                    size: .6,
                    height: 0.1
                }),
                new THREE.MeshStandardMaterial({
                    color: new THREE.Color("rgb(50,255,100)"),
                    fog: false
                })
            );
            ExpText.geometry.computeBoundingBox();
            ExpText.geometry.translate(
                - ExpText.geometry.boundingBox.max.x * 0.5,
                - ExpText.geometry.boundingBox.max.y * 0.5,
                - ExpText.geometry.boundingBox.max.z * 0.5
            );
            ExpText.rotateY(-Math.PI * 0.5);
            ExpText.translateZ(1);
            ExperientialBlock.add(ExpText);
            
            const TitleText = new THREE.Group();
            TitleText.name = "Object Title Text";
            const TitleTextMaterial = new THREE.MeshStandardMaterial({
                color: "rgb(15, 10, 10)",
                envMapIntensity: 10
            });
            const LearnMoreMaterial = new THREE.MeshStandardMaterial({
                color: "rgb(2, 20, 100)",
                envMapIntensity: 10
            });
            const LearnMoreGeo = new THREE.TextGeometry("Learn More >", {
                font: PoppinsBold,
                size: 0.05,
                height: 0.02
            });

            for (let i = 0; i < MeshObjects.children.length; i++) {
                TitleText.children.push(new THREE.Mesh(
                    new THREE.TextGeometry(`${MeshObjects.children[i].name}`, {
                        font: PoppinsBold,
                        size: 0.075,
                        height: 0.02
                    }), TitleTextMaterial
                    )); // mesh, .push
                TitleText.children[i].geometry.computeBoundingBox();
                TitleText.children[i].geometry.translate(
                    - TitleText.children[i].geometry.boundingBox.max.x * 0.5,
                    - TitleText.children[i].geometry.boundingBox.max.y * 0.5,
                    - TitleText.children[i].geometry.boundingBox.max.z * 0.5
                );
                TitleText.children[i].position.set(
                    MeshObjects.children[i].position.x + MeshObjects.children[i].textOffset.x,
                    MeshObjects.children[i].position.y + MeshObjects.children[i].textOffset.y,
                    MeshObjects.children[i].position.z + MeshObjects.children[i].textOffset.z,
                );
                
                const LearnMoreText = new THREE.Mesh(LearnMoreGeo, LearnMoreMaterial);
                LearnMoreText.geometry.computeBoundingBox();
                LearnMoreText.position.set(0.15, -0.125, 0);
                TitleText.children[i].add(LearnMoreText);

                TitleText.children[i].setRotationFromEuler(new THREE.Euler(0, Math.PI * 0.125, 0));
                MeshObjects.children[i].TitleText = TitleText.children[i];
                MeshObjects.children[i].TitleText.visible = false;
            }
            Scene.add(TitleText);
        }
    );
} // CreateText

const SelectorBlocks = new THREE.Group();
SelectorBlocks.name = "Selector Blocks";
SelectorBlocks.add(StudioBlock, VirtualBlock, ExperientialBlock);

SelectorBlocks.traverse(function(object) {
    object.layers.enable(3);
});

Scene.add(SelectorBlocks);

const InactiveSelectors = new THREE.Group();
SelectorBlocks.name = "Inactive Selector Blocks";

//// SELECTION  PROCESSING ////

const UIRaycaster = new THREE.Raycaster();
UIRaycaster.layers.set(3);

// GLRenderer.domElement.style.touchAction = "none";
let Intersects = [];
let PointerStart, PointerEnd;

function CheckIntersection() {
    
    if (RaycastActive == false) return;

    UIRaycaster.setFromCamera(ScreenCursorPosition, ViewportCamera);
    Intersects = UIRaycaster.intersectObject(SelectorBlocks, true);

    if (InactiveSelectors.children.length > 0 && Intersects.length == 0) {
        CheckMeshIntersections();
        return;
    }

    ClearSelections();
    
    if (Intersects.length > 0) {
        gsap.to(Intersects[0].object.scale, {
            x: 1.05,
            y: 1.05,
            z: 1.05,
            duration: 0.5
        });
        gsap.to(Intersects[0].object.parent.children[1].position,
            {
                y: 0.25,
                duration: 0.5
        });
        gsap.to(Intersects[0].object.parent.children[1].scale,
            {
                x: 1.25,
                y: 1.25,
                z: 1.25,
                duration: 0.5
        });
        CanvasElement.style.cursor = "pointer";
    }
}

function ClearSelections() {
    CanvasElement.style.cursor = "default";
    for (let SelectorBox of SelectorBlocks.children) {
        gsap.to(SelectorBox.children[0].scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.5
        });
        gsap.to(SelectorBox.children[1].position, {
            y: 0,
            duration: 0.5
        });
        gsap.to(SelectorBox.children[1].scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.5
        });
       }
}

function OnPointerClick(event) {

    InfoPanels.forEach(function(panel) {
        panel.classList.remove("open");
    });

    PointerEnd = new THREE.Vector2(event.clientX, event.clientY);
    if (PointerStart.distanceTo(PointerEnd) > 10) return;

    UIRaycaster.setFromCamera(ScreenCursorPosition, ViewportCamera);
    Intersects = UIRaycaster.intersectObject(SelectorBlocks, true);

    if (InactiveSelectors.children.length && Intersects.length === 0) { ClickMeshObjects(event); }

    if (InactiveSelectors.children.length > 0 && Intersects.length > 0) { RestoreSelectors() }

    ClearSelections();
    RemoveSelector();
    gsap.killTweensOf(ViewportCamera.position)

    if (Intersects.length > 0) {
        gsap.to(OrbitControlSystem.target, {
            x: Intersects[0].object.parent.position.x + Intersects[0].object.parent.targetOffset.x,
            y: Intersects[0].object.parent.position.y + Intersects[0].object.parent.targetOffset.y,
            z: Intersects[0].object.parent.position.z + Intersects[0].object.parent.targetOffset.z,
            duration: 1.5,
        });
        gsap.to(ViewportCamera.position, {
            x: Intersects[0].object.parent.position.x + Intersects[0].object.parent.offsetX,
            y: Intersects[0].object.parent.position.y + Intersects[0].object.parent.offsetY,
            z: Intersects[0].object.parent.position.z + Intersects[0].object.parent.offsetZ,
            duration: 1.5,
        });
    }
}

function ClickMeshObjects(event) {
    UIRaycaster.setFromCamera(ScreenCursorPosition, ViewportCamera);
    const Intersects = UIRaycaster.intersectObject(MeshObjects, true);
    InfoPanels.forEach(function(panel) {
        panel.classList.remove("open");
    });
    if (Intersects.length > 0) {
        Intersects[0].object.infopanel.classList.add("open");
    }

}

function OnPointerDown(event) {
    PointerStart = new THREE.Vector2(event.clientX, event.clientY);
    if (event.pointerType == "touch") {
        OnPointerMove(event);
    }
}

function RemoveSelector() {

    if (Intersects[0] != null) {
        InactiveSelectors.add(Intersects[0].object.parent);
    }

}

function RestoreSelectors() {

    for (let Selector of InactiveSelectors.children) {
        SelectorBlocks.add(Selector);
    }

}

function CheckMeshIntersections() {
    
    UIRaycaster.setFromCamera(ScreenCursorPosition, ViewportCamera);
    const Intersects = UIRaycaster.intersectObject(MeshObjects, true);
    if (Intersects.length > 0) {
        CanvasElement.style.cursor = "pointer";
        Intersects[0].object.material.color = new THREE.Color("rgb(200, 200, 220)");
        Intersects[0].object.TitleText.visible = true;
        if (!gsap.isTweening(Intersects[0].object.TitleText.rotation) 
        && (Intersects[0].object.TitleText.rotation.y - -Math.PI * Intersects[0].object.position.y * 0.1) > 0.0001) {
            gsap.fromTo(Intersects[0].object.TitleText.rotation, {
                y: -Math.PI * 0.125,
            }, {
                y: -Math.PI * Intersects[0].object.position.y * 0.1,
                duration: 1.5,
            });
            gsap.fromTo(Intersects[0].object.TitleText.scale, {
                y: 0,
            }, {
                y: 1,
                duration: 0.125,
            });
        }
        // Scene.add(Intersects[0].object.TitleText)
    } else {
        CanvasElement.style.cursor = "default";
        BakedMaterials.forEach(
            function(item) {
                item.color = new THREE.Color("rgb(255, 255, 255)");
            }
        );
        MeshObjects.children.forEach(
            function(item) {
                item.TitleText.visible = false;
                item.TitleText.rotation.y = -Math.PI * 0.125;
            }
        )
    }
    
}

function OnPointerMove(event) {

    if (event.isPrimary === false) return;

    ScreenCursorPosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    ScreenCursorPosition.y = -(event.clientY / window.innerHeight) * 2 + 1;

    CheckIntersection();

}

function OnOrbit(event) {
    if (ViewportCamera.position.distanceTo(OrbitStartTarget) > 10 && !gsap.isTweening(OrbitControlSystem.target)) {
        RestoreSelectors();
    }

}

function RemoveLoadingScreen() {
    window.setTimeout(function() {
        gsap.to(
            LoadingOverlay.material.uniforms.uAlpha,
            { 
                duration: 2, 
                value: 0
            }
        );
        TitleBlock.innerHTML = `
        <div class="logo"><img src="/images/smclogo.png" width=32em></div>
        <div class="title"><span class="titlename">Steven M. Caruso</span> Design Studio</div>
        `;
        TitleBlock.classList.remove("loading");
        RaycastActive = true;
    }, 1000);
    gsap.to(ViewportCamera.position, {
        x: -5.6,
        y: 1.2,
        z: 8,
        duration: 3
    });
    LoadingOverlay.geometry.dispose();
}

function OpenContact() {
    if (ContactInfoPanel.classList.contains("open")){
        InfoPanels.forEach(function(panel) {
            panel.classList.remove("open");
        });

        return;
    } else {
        InfoPanels.forEach(function(panel) {
            panel.classList.remove("open");
        });
        ContactInfoPanel.classList.add("open");
    }
}

// Event Listeners

GLRenderer.domElement.addEventListener("pointermove", OnPointerMove);
GLRenderer.domElement.addEventListener("pointerup", OnPointerClick);
GLRenderer.domElement.addEventListener("pointerdown", OnPointerDown);
OrbitControlSystem.addEventListener("change", OnOrbit);

window.addEventListener('resize', function(){

    // Update sizes
    WindowSizes.width = window.innerWidth;
    WindowSizes.height = window.innerHeight;

    // Update camera
    ViewportCamera.aspect = WindowSizes.width / WindowSizes.height;
    ViewportCamera.updateProjectionMatrix();

    // Update renderer
    GLRenderer.setSize(WindowSizes.width, WindowSizes.height);
    GLRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

});

ContactButton.addEventListener("pointerup", OpenContact);

// Animation loop

const clock = new THREE.Clock()
let time = Date.now();
let progressRatio = 0;

function Tick() {

    const elapsedTime = clock.getElapsedTime()
    const currentTime = Date.now();
    const deltaTime = currentTime - time;
    time = currentTime;

    // Shader ticks

    LoadingOverlay.material.uniforms.uMouseX.value = ScreenCursorPosition.x;
    LoadingOverlay.material.uniforms.uMouseY.value = ScreenCursorPosition.y;

    // Object ticks
    if(AnimationContainer.mixer) {
        AnimationContainer.mixer.update(deltaTime);
        if (AnimationContainer.Steve.rotation.y == 0) {
            AnimationContainer.Steve.rotateY(Math.PI * -0.4);
        }
    }
    
    // Global ticks

    requestAnimationFrame(Tick);
    OrbitControlSystem.update();
    GLRenderer.render(Scene, ViewportCamera);

    GLRenderer.setAnimationLoop(function() {
        GLRenderer.render(Scene, ViewportCamera);
    });

}

//// SCRIPT ////

Tick();