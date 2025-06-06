# 图像描述AI服务使用指南

本文档提供了如何准备数据集、训练模型以及将前端与后端集成的详细说明。

## 1. 系统概述

图像描述AI服务是一个基于深度学习的系统，能够自动为上传的图片生成描述性文本。系统使用ResNet18作为特征提取器，并通过分类器将图像映射到预定义的描述类别。

## 2. 数据集准备

在训练模型之前，需要准备适当的数据集。数据集应包含图像及其对应的标签。

### 2.1 数据集格式

数据集应按以下格式组织：

```
dataset/
  ├── annotations.json  # 包含图像文件名和标签的JSON文件
  └── images/           # 包含所有图像文件的目录
      ├── image1.jpg
      ├── image2.jpg
      └── ...
```

`annotations.json`文件应包含以下格式的数据：

```json
[
  {
    "image_file": "image1.jpg",
    "label_index": 0
  },
  {
    "image_file": "image2.jpg",
    "label_index": 1
  },
  ...
]
```

其中，`label_index`是一个整数，表示图像所属的类别索引（0-9）。

### 2.2 类别定义

系统预定义了10个类别，每个类别包含主题、风格和情感三个属性：

```python
INDEX_TO_CATEGORY = {
    0: {"subject": "自然风光", "style": "色彩鲜明", "feeling": "宁静"},
    1: {"subject": "城市景观", "style": "构图和谐", "feeling": "活力"},
    2: {"subject": "人物肖像", "style": "光影对比强烈", "feeling": "温暖"},
    3: {"subject": "美食", "style": "细节丰富", "feeling": "欢乐"},
    4: {"subject": "动物", "style": "简约清新", "feeling": "可爱"},
    5: {"subject": "建筑", "style": "复古怀旧", "feeling": "神秘"},
    6: {"subject": "日常生活", "style": "黑白经典", "feeling": "怀旧"},
    7: {"subject": "旅行", "style": "锐利清晰", "feeling": "振奋"},
    8: {"subject": "运动", "style": "动感十足", "feeling": "激情"},
    9: {"subject": "艺术作品", "style": "抽象创意", "feeling": "惊奇"}
}
```

### 2.3 数据集上传

可以通过以下API上传数据集：

```
POST /api/upload-dataset
```

请求体应包含以下JSON数据：

```json
{
  "dataset": [
    {
      "image_file": "image1.jpg",
      "label_index": 0
    },
    ...
  ]
}
```

## 3. 模型训练

### 3.1 训练API

可以通过以下API启动模型训练：

```
POST /api/train
```

请求体可以包含以下参数（均为可选）：

```json
{
  "epochs": 10,         // 训练轮数
  "batch_size": 32,    // 批次大小
  "learning_rate": 0.001  // 学习率
}
```

### 3.2 训练过程

训练过程包括以下步骤：

1. 加载数据集
2. 初始化模型
3. 定义损失函数和优化器
4. 训练循环
5. 保存模型

训练完成后，模型将保存在`models/image_caption_model.pth`文件中，同时会生成一个`training_info.json`文件，记录训练参数和时间。

## 4. 模型加载

可以通过以下API加载已训练的模型：

```
POST /api/load-model
```

## 5. 图像描述生成

### 5.1 单张图片描述生成

可以通过以下API为单张图片生成描述：

```
POST /api/generate-text
```

请求体应包含以下JSON数据：

```json
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."  // Base64编码的图像数据
}
```

### 5.2 多张图片描述生成

可以通过以下API为多张图片生成综合描述：

```
POST /api/generate-text
```

请求体应包含以下JSON数据：

```json
{
  "imagesData": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",  // Base64编码的图像数据
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  ]
}
```

## 6. 前端集成

前端应该通过以下步骤与后端集成：

1. 确保AI服务已启动并运行在正确的端口（默认为5000）
2. 在前端代码中，使用适当的API客户端（如axios）向AI服务发送请求
3. 处理API响应并在UI中显示生成的描述

### 6.1 前端集成示例

```javascript
// 图片描述生成
async function generateTextFromImageAPI(imageData) {
  try {
    const response = await axios.post('http://localhost:5000/api/generate-text', {
      imageData: imageData
    });
    return response.data;
  } catch (error) {
    console.error('生成文案失败:', error);
    throw error;
  }
}

// 多张图片描述生成
async function generateTextFromMultipleImagesAPI(imagesData) {
  try {
    const response = await axios.post('http://localhost:5000/api/generate-text', {
      imagesData: imagesData
    });
    return response.data;
  } catch (error) {
    console.error('生成文案失败:', error);
    throw error;
  }
}
```

## 7. 故障排除

### 7.1 模型未加载

如果收到"模型未加载或加载失败"的错误，请确保已经通过`/api/load-model`API加载了模型，或者已经通过`/api/train`API训练了模型。

### 7.2 数据集不存在

如果收到"训练数据集不存在"的错误，请确保已经通过`/api/upload-dataset`API上传了数据集。

### 7.3 图像处理失败

如果收到"图像处理失败"的错误，请检查图像格式是否正确，以及Base64编码是否有效。

## 8. 下一步改进

1. 实现更复杂的图像描述模型，如基于Transformer的模型
2. 添加更多的预训练模型选项
3. 实现在线学习功能，允许系统从用户反馈中学习
4. 添加更多的语言支持
5. 优化模型性能和推理速度