/* eslint-disable @typescript-eslint/no-explicit-any */
import yaml from 'js-yaml';

export interface CharacterConfig {
    name: string;
    bio: string;
    avatar: string;
    user_avatar: string; // 添加用户头像字段
    model: string;
    prompt: string;
    motion: {
      [key: string]: {
        file_path: string[];
        trigger_condition: string;
      };
    };
    background_image: string[];
}
  
export interface SystemConfig {
    character: CharacterConfig;
    [key: string]: any;
}

// 场景设置所需的配置接口
export interface SceneConfig {
    name: string;
    bio: string;
    modelPath: string;
    motions: { [key: string]: string[] };
    backgroundImage: string;
    backgroundImages: string[];
    avatar: string;
}

/**
 * 从YAML文件加载系统配置
 */
export async function loadConfigFromYaml(): Promise<SystemConfig> {
    try {
        // 读取YAML文件
        const response = await fetch('/default.yaml');
        if (!response.ok) {
            throw new Error(`Failed to fetch config: ${response.statusText}`);
        }
        
        const yamlText = await response.text();
        const config = yaml.load(yamlText) as SystemConfig;
        
        return config;
    } catch (error) {
        console.error('Failed to load config from YAML:', error);
        throw error;
    }
}

/**
 * 转换motion配置格式
 * 从 { motionName: { file_path: [...], trigger_condition: ... } }
 * 转换为 { motionName: [...] }
 */
export function transformMotionConfig(motionConfig: CharacterConfig['motion']): { [key: string]: string[] } {
    const transformedMotion: { [key: string]: string[] } = {};

    for (const [motionName, motionData] of Object.entries(motionConfig)) {
        transformedMotion[motionName] = motionData.file_path;
    }

    return transformedMotion;
}

/**
 * 从系统配置中提取场景设置所需的配置
 */
export function extractSceneConfig(systemConfig: SystemConfig): SceneConfig {
    const character = systemConfig.character;
    
    return {
        name: character.name,
        bio: character.bio,
        modelPath: character.model,
        motions: transformMotionConfig(character.motion),
        backgroundImage: character.background_image[0] || '/assets/bg/bg.jpg', // 使用第一个背景作为默认
        backgroundImages: character.background_image,
        avatar: character.avatar
    };
}

export async function loadSceneConfig(): Promise<SceneConfig> {
    const systemConfig = await loadConfigFromYaml();
    return extractSceneConfig(systemConfig);
}

/**
 * 获取角色配置
 */
export async function getCharacterConfig(): Promise<CharacterConfig> {
    try {
        const systemConfig = await loadConfigFromYaml();
        return systemConfig.character;
    } catch (error) {
        console.error('Failed to get character config:', error);
        throw error;
    }
}

/**
 * 获取用户头像路径
 */
export async function getUserAvatar(): Promise<string> {
    try {
        const characterConfig = await getCharacterConfig();
        return characterConfig.user_avatar || '/avatars/user.png'; // 如果没有配置则使用默认头像
    } catch (error) {
        console.error('Failed to get user avatar:', error);
        return '/avatars/user.png'; // 出错时返回默认头像
    }
}