import os
import base64
import tempfile
import mimetypes
import time
from PIL import Image
from typing import Optional, Union
from pathlib import Path

def image_to_base64(image_input: Union[str, bytes], validate: bool = True) -> Optional[str]:
    """
    将图片转换为 base64 编码字符串（带 data:image 前缀）
    
    支持多种输入方式：
    1. 本地文件路径（字符串）
    2. 图片二进制数据（bytes）
    
    Args:
        image_input: 图片输入，可以是文件路径字符串或图片二进制数据
        validate: 是否验证图片有效性，默认 True
        
    Returns:
        base64 编码的图片字符串，失败时返回 None
    """
    
    def get_mime_type_from_data(data: bytes) -> str:
        """从图片数据中检测 MIME 类型"""
        # 通过文件头信息检测图片类型
        if data.startswith(b'\xff\xd8\xff'):
            return 'jpeg'
        elif data.startswith(b'\x89PNG\r\n\x1a\n'):
            return 'png'
        elif data.startswith(b'GIF87a') or data.startswith(b'GIF89a'):
            return 'gif'
        elif data.startswith(b'RIFF') and data[8:12] == b'WEBP':
            return 'webp'
        elif data.startswith(b'BM'):
            return 'bmp'
        elif data.startswith(b'II') or data.startswith(b'MM'):
            return 'tiff'
        elif data.startswith(b'<?xml') or b'<svg' in data[:100]:
            return 'svg+xml'
        else:
            return 'jpeg'  # 默认返回 jpeg
    
    def validate_image_data(data: bytes) -> bool:
        """验证图片数据是否有效"""
        try:
            # 创建临时文件来验证图片
            with tempfile.NamedTemporaryFile(delete=False, suffix='.tmp') as temp_file:
                temp_file.write(data)
                temp_file.flush()
                
                with Image.open(temp_file.name) as img:
                    img.verify()
                return True
        except Exception as e:
            print(f"错误：图片数据无效: {e}")
            return False
        finally:
            # 清理临时文件
            if 'temp_file' in locals():
                try:
                    os.unlink(temp_file.name)
                except:
                    pass
    
    try:
        # 处理不同类型的输入
        if isinstance(image_input, str):
            # 字符串输入 - 可能是文件路径
            image_path = image_input
            
            # 检查文件是否存在
            if not os.path.exists(image_path):
                print(f"错误：文件不存在 - {image_path}")
                return None
            
            # 检查文件是否为文件（不是目录）
            if not os.path.isfile(image_path):
                print(f"错误：路径不是文件 - {image_path}")
                return None
            
            # 读取文件内容
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
                
            # 获取 MIME 类型
            if validate:
                # 使用文件扩展名获取 MIME 类型
                mime_type, _ = mimetypes.guess_type(image_path)
                if mime_type and mime_type.startswith('image/'):
                    mime_type = mime_type[6:]  # 移除 'image/' 前缀
                else:
                    # 如果无法从扩展名获取，从数据检测
                    mime_type = get_mime_type_from_data(image_data)
            else:
                mime_type = get_mime_type_from_data(image_data)
                
        elif isinstance(image_input, bytes):
            # 二进制数据输入 - 可能是粘贴的图片数据
            image_data = image_input
            mime_type = get_mime_type_from_data(image_data)
            
        else:
            print(f"错误：不支持的输入类型 - {type(image_input)}")
            return None
        
        # 验证图片（如果需要）
        if validate and not validate_image_data(image_data):
            return None
        
        # 编码为 base64
        encoded_bytes = base64.b64encode(image_data)
        encoded_str = encoded_bytes.decode('utf-8')
        
        # 返回完整的 data URL
        return f"data:image/{mime_type};base64,{encoded_str}"
        
    except PermissionError:
        print(f"错误：没有权限读取文件")
        return None
    except IOError as e:
        print(f"错误：读取文件时发生 IO 错误: {e}")
        return None
    except Exception as e:
        print(f"错误：处理图片时发生未知错误: {e}")
        return None

def save_pasted_image(image_data: bytes, output_dir: str = None, filename: str = None) -> Optional[str]:
    """
    保存粘贴的图片数据到本地文件
    
    Args:
        image_data: 图片二进制数据
        output_dir: 输出目录，默认为当前目录
        filename: 文件名，如果不提供则自动生成
        
    Returns:
        保存的文件路径，失败时返回 None
    """
    try:
        # 确定输出目录
        if output_dir is None:
            output_dir = os.getcwd()
        
        # 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)
        
        # 生成文件名
        if filename is None:
            # 从数据检测文件类型
            mime_type = image_to_base64(image_data, validate=False)
            if mime_type:
                # 从 data URL 中提取 MIME 类型
                mime_type = mime_type.split(';')[0].split('/')[-1]
                filename = f"pasted_image_{int(time.time())}.{mime_type}"
            else:
                filename = f"pasted_image_{int(time.time())}.jpg"
        
        # 确保文件名有正确的扩展名
        if not any(filename.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg']):
            # 从数据检测类型并添加扩展名
            mime_type = image_to_base64(image_data, validate=False)
            if mime_type:
                mime_type = mime_type.split(';')[0].split('/')[-1]
                filename = f"{filename}.{mime_type}"
            else:
                filename = f"{filename}.jpg"
        
        # 构建完整路径
        file_path = os.path.join(output_dir, filename)
        
        # 保存文件
        with open(file_path, 'wb') as f:
            f.write(image_data)
        
        print(f"图片已保存到: {file_path}")
        return file_path
        
    except Exception as e:
        print(f"错误：保存图片时发生错误: {e}")
        return None