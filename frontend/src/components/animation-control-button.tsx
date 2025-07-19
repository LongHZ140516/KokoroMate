import { useState, useEffect } from 'react';

interface AnimationControlButtonProps {
    sceneBuilder: any; // SceneBuilder 实例
    className?: string;
}

export function AnimationControlButton({ sceneBuilder, className }: AnimationControlButtonProps) {
    const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
    const [selectedAnimation, setSelectedAnimation] = useState<string>('');

    // 获取可用动画列表
    useEffect(() => {
        if (sceneBuilder) {
            const animations = sceneBuilder.getAvailableAnimations();
            setAvailableAnimations(animations);
            if (animations.length > 0) {
                setSelectedAnimation(animations[0]);
            }
        }
    }, [sceneBuilder]);

    // 播放选中的动画
    const handleSetAnimation = () => {
        if (sceneBuilder && selectedAnimation) {
            const success = sceneBuilder.playAnimation(selectedAnimation);
            console.log(success);
            if (success) {
                console.log(`Successfully set animation: ${selectedAnimation}`);
            } else {
                console.error(`Failed to set animation: ${selectedAnimation}`);
            }
        }
    };

    // 动画名称显示映射
    const getDisplayName = (animationName: string) => {
        const nameMap: Record<string, string> = {
            'idle': '待机',
            'motion1': '默认动作',
            'dance': '舞蹈',
            'walk': '走路',
            'wave': '挥手',
            'bow': '鞠躬'
        };
        return nameMap[animationName] || animationName;
    };

    // 如果没有可用动画，显示提示
    if (availableAnimations.length === 0) {
        return (
            <div 
                className={className} 
                style={{ 
                    padding: '12px', 
                    backgroundColor: 'rgba(0,0,0,0.4)', 
                    backdropFilter: 'blur(10px)', 
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}
            >
                <p style={{ color: 'white', fontSize: '14px', margin: 0 }}>
                    动画系统尚未初始化...
                </p>
            </div>
        );
    }

    return (
        <div 
            className={className} 
            style={{ 
                padding: '12px', 
                backgroundColor: 'rgba(0,0,0,0.4)', 
                backdropFilter: 'blur(10px)', 
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}
        >
            <h3 style={{ 
                color: 'white', 
                fontSize: '14px', 
                fontWeight: 'bold', 
                margin: 0 
            }}>
                SetAnimation 控制
            </h3>
            
            {/* 动画选择下拉框 */}
            <select
                value={selectedAnimation}
                onChange={(e) => setSelectedAnimation(e.target.value)}
                style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    fontSize: '12px',
                    outline: 'none'
                }}
            >
                {availableAnimations.map((animationName) => (
                    <option 
                        key={animationName} 
                        value={animationName}
                        style={{ backgroundColor: '#333', color: 'white' }}
                    >
                        {getDisplayName(animationName)}
                    </option>
                ))}
            </select>

            {/* 播放按钮 */}
            <button
                onClick={handleSetAnimation}
                style={{
                    padding: '8px 16px',
                    border: '1px solid #3b82f6',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: 'bold'
                }}
                onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = '#3b82f6';
                }}
            >
                播放动画
            </button>
            
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                选择动画后点击播放按钮
            </div>
        </div>
    );
} 