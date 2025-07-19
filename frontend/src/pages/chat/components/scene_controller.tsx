/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Slider } from '../../../components/ui/slider';
import { Separator } from '../../../components/ui/separator';
import { Switch } from '../../../components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { 
  Sun, 
  Image as ImageIcon,
  Box, 
  Settings,
  EyeOff,
  Palette,
  ChevronDown,
  Moon,
  Sunset,
  CloudHail,
  Rotate3D,
  Move
} from 'lucide-react';
import { HexColorPicker } from "react-colorful";
import { sceneSetting } from '../scene/scene_setting';

// 数据接口定义
export interface BackgroundData {
  image: string;
}

export interface LightingData {
  intensity: number;
  direction: {
    x: number;
    y: number;
    z: number;
  };
  color: {
    r: number;
    g: number;
    b: number;
  };
  ambientIntensity: number;
  shadowEnabled: boolean;
  shadowQuality: 'low' | 'medium' | 'high';
}

export interface ModelData {
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
}

export interface SceneControlData {
  background: BackgroundData;
  lighting: LightingData;
  model: ModelData;
}

interface SceneControllerProps {
  onSceneChange?: (sceneData: SceneControlData) => void;
  className?: string;
}

// 背景预设
const backgroundPresets = [
  {
    name: 'Default',
    image: sceneSetting.background.image[0],
    preview: sceneSetting.background.image[0]
  },
  {
    name: 'Sunset',
    image: sceneSetting.background.image[1],
    preview: sceneSetting.background.image[1]
  },
  {
    name: 'Night',
    image: sceneSetting.background.image[2], 
    preview: sceneSetting.background.image[2]
  },
  {
    name: 'Cloudy',
    image: sceneSetting.background.image[3],
    preview: sceneSetting.background.image[3]
  }
];

// 工具函数：将RGB转换为十六进制
const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// 工具函数：将十六进制转换为RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 1, g: 1, b: 1 };
};

// 背景控制组件
const BackgroundControl: React.FC<{
  data: BackgroundData;
  onChange: (data: BackgroundData) => void;
}> = ({ data, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        <h4 className="font-medium">Background Presets</h4>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {backgroundPresets.map((preset) => (
          <Button
            key={preset.name}
            variant={data.image === preset.image ? "default" : "outline"}
            className="h-16 flex flex-col items-center justify-center relative overflow-hidden group hover:scale-[1.02] transition-transform"
            onClick={() => onChange({ image: preset.image })}
          >
            <div 
              className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
              style={{
                backgroundImage: `url('${preset.preview}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div className="relative z-10 text-center">
              <div className="text-sm font-medium">{preset.name === 'Default' ? <Sun className="h-4 w-4" /> : preset.name === 'Sunset' ? <Sunset className="h-4 w-4" /> : preset.name === 'Night' ? <Moon className="h-4 w-4" /> : <CloudHail className="h-4 w-4" />}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

// 光照控制组件
const LightingControl: React.FC<{
  data: LightingData;
  onChange: (data: LightingData) => void;
}> = ({ data, onChange }) => {
  const [colorHex, setColorHex] = useState(rgbToHex(data.color.r, data.color.g, data.color.b));
  const [showColorPicker, setShowColorPicker] = useState(false);

  // 同步颜色值
  useEffect(() => {
    setColorHex(rgbToHex(data.color.r, data.color.g, data.color.b));
  }, [data.color]);

  const handleColorChange = (hex: string) => {
    setColorHex(hex);
    const rgb = hexToRgb(hex);
    onChange({ ...data, color: rgb });
  };

  const handleDirectionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    onChange({
      ...data,
      direction: { ...data.direction, [axis]: value }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sun className="h-4 w-4" />
        <h4 className="font-medium">Directional Light</h4>
      </div>

      {/* Intensity */}
      <div className="space-y-2">
        <Label className="text-sm">Intensity</Label>
        <div className="flex items-center gap-2 mt-2">
          <Slider
            value={[data.intensity]}
            onValueChange={(value) => {
              onChange({ ...data, intensity: value[0] });
            }}
            max={5}
            min={0}
            step={0.1}
            className="flex-1"
          />
          <span className="text-sm w-12 text-right font-mono">
            {data.intensity.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Ambient Light */}
      <div className="space-y-2">
        <Label className="text-sm">Ambient Light</Label>
        <div className="flex items-center gap-2 mt-2">
          <Slider
            value={[data.ambientIntensity]}
            onValueChange={(value) => {
              onChange({ ...data, ambientIntensity: value[0] });
            }}
            max={1}
            min={0}
            step={0.1}
            className="flex-1"
          />
          <span className="text-sm w-12 text-right font-mono">
            {data.ambientIntensity.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Direction */}
      <div className="space-y-2">
        <Label className="text-sm">Direction</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {(['x', 'y', 'z'] as const).map((axis) => (
            <div key={axis} className="space-y-1">
              <Label className="text-xs text-center block uppercase mb-3">
                {axis}
              </Label>
              <Slider
                value={[data.direction[axis]]}
                onValueChange={(value) => handleDirectionChange(axis, value[0])}
                max={2}
                min={-2}
                step={0.1}
                className="w-full"
              />
              <span className="text-xs text-center block font-mono">
                {data.direction[axis].toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label className="text-sm">Color</Label>
        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-2"
            >
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: colorHex }}
              />
              <Palette className="h-4 w-4" />
              <ChevronDown className={`h-4 w-4 transition-transform ${showColorPicker ? 'rotate-180' : ''}`} />
            </Button>
            <Input
              type="text"
              value={colorHex}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="#ffffff"
              className="flex-1 font-mono text-sm"
            />
          </div>
          
          {showColorPicker && (
            <div className="border rounded-lg p-3 bg-background">
              <HexColorPicker color={colorHex} onChange={handleColorChange} />
            </div>
          )}
        </div>
      </div>

      {/* Shadow */}
      <div className="space-y-3">
        <Label className="text-sm">Shadow</Label>
        
        <div className="flex items-center justify-between mt-2">
          <Label className="text-xs">Enabled</Label>
          <Switch
            checked={data.shadowEnabled}
            onCheckedChange={(checked) => onChange({ ...data, shadowEnabled: checked })}
          />
        </div>

        {data.shadowEnabled && (
          <div className="space-y-2">
            <Label className="text-sm">Quality</Label>
            <Select
              value={data.shadowQuality}
              onValueChange={(value: 'low' | 'medium' | 'high') => 
                onChange({ ...data, shadowQuality: value })
              }
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};

// 模型控制组件
const ModelControl: React.FC<{
  data: ModelData;
  onChange: (data: ModelData) => void;
}> = ({ data, onChange }) => {
  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newData = {
      ...data,
      position: { ...data.position, [axis]: value }
    };
    onChange(newData);
  };

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newData = {
      ...data,
      rotation: { ...data.rotation, [axis]: value }
    };
    onChange(newData);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Box className="h-4 w-4" />
        <h4 className="font-medium">Model</h4>
      </div>

      {/* Position */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Move className="h-4 w-4" />
          <Label className="text-sm">Position</Label>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {(['x', 'y', 'z'] as const).map((axis) => (
            <div key={axis} className="space-y-1">
              <Label className="text-xs text-center block uppercase mb-3">
                {axis}
              </Label>
              <Slider
                value={[data.position[axis]]}
                onValueChange={(value) => handlePositionChange(axis, value[0])}
                max={10}
                min={-10}
                step={0.1}
                className="w-full"
              />
              <span className="text-xs text-center block font-mono">
                {data.position[axis].toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Rotate3D className="h-4 w-4" />
          <Label className="text-sm">Rotation</Label>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {(['x', 'y', 'z'] as const).map((axis) => (
            <div key={axis} className="space-y-1">
              <Label className="text-xs text-center block uppercase mb-3">
                {axis}
              </Label>
              <Slider
                value={[data.rotation[axis]]}
                onValueChange={(value) => handleRotationChange(axis, value[0])}
                max={3.14}
                min={-3.14}
                step={0.1}
                className="w-full"
              />
              <span className="text-xs text-center block font-mono">
                {data.rotation[axis].toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 主控制器组件
const SceneController: React.FC<SceneControllerProps> = ({ 
  onSceneChange, 
  className = "" 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // 使用 scene_setting.ts 中的默认值初始化状态
  const [sceneData, setSceneData] = useState<SceneControlData>({
    background: {
      image: '/assets/bg/bg.jpg'
    },
    lighting: {
      intensity: 2.1,
      direction: { x: 0.5, y: -1, z: 1 },
      color: { r: 1, g: 1, b: 1 },
      ambientIntensity: 0.5,
      shadowEnabled: false,
      shadowQuality: 'medium'
    },
    model: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: -0.2, z: 0 }
    }
  });

  // 应用初始设置 - 确保场景已初始化
  useEffect(() => {
    if (onSceneChange) {
      // 减少延迟时间，因为场景现在应该加载更快
      const timer = setTimeout(() => {
        // console.log("SceneController: Applying initial settings", sceneData);
        onSceneChange(sceneData);
      }, 500); // 减少到0.5秒延迟
      
      return () => clearTimeout(timer);
    }
  }, [onSceneChange]);

  const handleDataChange = (section: keyof SceneControlData, data: any) => {
    const newSceneData = { ...sceneData, [section]: data };
    setSceneData(newSceneData);
    // 立即触发场景更新
    onSceneChange?.(newSceneData);
  };

  const resetToDefault = () => {
    const defaultData: SceneControlData = {
      background: {
        image: '/assets/bg/bg.jpg'
      },
      lighting: {
        intensity: 2.1,
        direction: { x: 0.5, y: -1, z: 1 },
        color: { r: 1, g: 1, b: 1 },
        ambientIntensity: 0.5,
        shadowEnabled: false,
        shadowQuality: 'medium'
      },
      model: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: -0.2, z: 0 }
      }
    };
    setSceneData(defaultData);
    onSceneChange?.(defaultData);
  };

  if (!isVisible) {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="shadow-lg"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed top-4 right-4 z-50 w-80 bg-background border rounded-lg shadow-lg ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <h3 className="font-semibold">Scene Controller</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      </div>

      {/* 内容区域 - 修复滚动问题 */}
      <div className="max-h-[calc(90vh-8rem)] overflow-y-auto">
        <div className="p-4 pb-6 space-y-6">
          {/* 背景控制 */}
          <BackgroundControl
            data={sceneData.background}
            onChange={(data) => handleDataChange('background', data)}
          />

          <Separator />

          {/* 光照控制 */}
          <LightingControl
            data={sceneData.lighting}
            onChange={(data) => handleDataChange('lighting', data)}
          />

          <Separator />

          {/* 模型控制 */}
          <ModelControl
            data={sceneData.model}
            onChange={(data) => handleDataChange('model', data)}
          />

          <Separator />

          {/* 重置按钮 */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={resetToDefault}
              className="flex items-center gap-2"
            >
              <Rotate3D className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SceneController; 