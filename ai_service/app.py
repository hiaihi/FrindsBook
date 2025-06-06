from flask import Flask, request, jsonify, render_template
import os
import base64
import io
from PIL import Image
import warnings
import time
import uuid
from model_utils import process_image

# 忽略特定警告
warnings.filterwarnings("ignore", category=UserWarning, message="TypedStorage is deprecated")
warnings.filterwarnings("ignore", category=UserWarning, message="The parameter 'token_ids_1' is not used by this method")

app = Flask(__name__)

# 配置上传文件夹路径
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploaded')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def index():
    """渲染上传页面"""
    return render_template('index.html')

@app.route('/api/generate-text', methods=['POST'])
def generate_text():
    """从图像生成描述文本"""
    try:
        # 获取请求数据
        data = request.json
        if not data:
            return jsonify({
                'success': False,
                'message': '请求中缺少数据'
            }), 400
        
        # 检查图像数据是否存在
        if 'imageData' not in data:
            return jsonify({
                'success': False,
                'message': '请求中缺少图像数据'
            }), 400
            
        # 获取风格设置（如果有）
        style = data.get('style', '朋友圈')
        
        # 处理图像数据
        image_data = data['imageData']
        
        # 移除Base64前缀（如果有）
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # 解码图像数据
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # 保存临时文件（可选）
        temp_filename = f"{uuid.uuid4()}.jpg"
        temp_filepath = os.path.join(UPLOAD_FOLDER, temp_filename)
        image.save(temp_filepath)
        
        # 处理图像并生成描述
        result = process_image(image)
        
        # 返回结果，无论成功与否
        return jsonify(result)
            
    except Exception as e:
        # 捕获所有异常并返回友好的错误信息
        error_message = str(e)
        print(f"生成描述时发生错误: {error_message}")
        
        return jsonify({
            'success': False,
            'message': f'生成描述失败: {error_message}',
            'error_type': type(e).__name__
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'ok',
        'timestamp': time.time()
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
