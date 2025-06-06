const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');

// Flask AI服务的URL
const AI_SERVICE_URL = 'http://localhost:5000';

// 图片生成文案API
router.post('/generate-text', authenticateToken, async (req, res) => {
  try {
    // 检查请求体中是否包含imageData或imagesData
    const { imageData, imagesData } = req.body;
    
    // 处理单张图片的情况
    if (imageData) {
      // 调用Flask AI服务
      const response = await axios.post(`${AI_SERVICE_URL}/api/generate-text`, {
        imageData: imageData
      });
      
      // 返回AI服务的响应结果
      return res.json(response.data);
    }
    
    // 处理多张图片的情况
    if (imagesData && imagesData.length > 0) {
      // 如果有多张图片，只处理第一张图片（当前AI服务只支持单张图片处理）
      const response = await axios.post(`${AI_SERVICE_URL}/api/generate-text`, {
        imageData: imagesData[0]
      });
      
      // 返回AI服务的响应结果
      return res.json(response.data);
    }
    
    // 如果没有提供图片数据
    return res.status(400).json({
      success: false,
      message: '请求中缺少图像数据'
    });
  } catch (error) {
    console.error('图片生成文案失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器处理请求时出错', 
      error: error.message 
    });
  }
});

// 文案生成图片API
router.post('/generate-image', authenticateToken, async (req, res) => {
  try {
    const { textContent } = req.body;
    
    // 这里是模拟AI生成图片的过程
    // 在实际应用中，你可能需要调用第三方AI服务，如OpenAI、百度AI等
    
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 返回模拟的图片URL
    // 这里使用了一个随机图片服务作为示例
    // 在实际应用中，你应该返回真实生成的图片URL或Base64编码
    const randomId = Math.floor(Math.random() * 1000);
    const imageUrl = `https://picsum.photos/800/600?random=${randomId}`;
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      prompt: textContent
    });
  } catch (error) {
    console.error('文案生成图片失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器处理请求时出错', 
      error: error.message 
    });
  }
});

// 训练AI模型API
router.post('/train-model', authenticateToken, async (req, res) => {
  try {
    // 获取训练参数
    const { epochs, batch_size, learning_rate } = req.body;
    
    // 调用Flask AI服务的训练接口
    const response = await axios.post(`${AI_SERVICE_URL}/api/train`, {
      epochs,
      batch_size,
      learning_rate
    });
    
    // 返回训练结果
    res.json(response.data);
  } catch (error) {
    console.error('模型训练失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '模型训练失败', 
      error: error.message 
    });
  }
});

// 加载AI模型API
router.post('/load-model', authenticateToken, async (req, res) => {
  try {
    // 调用Flask AI服务的加载模型接口
    const response = await axios.post(`${AI_SERVICE_URL}/api/load-model`);
    
    // 返回加载结果
    res.json(response.data);
  } catch (error) {
    console.error('模型加载失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '模型加载失败', 
      error: error.message 
    });
  }
});

// 上传数据集API
router.post('/upload-dataset', authenticateToken, async (req, res) => {
  try {
    // 获取数据集
    const { dataset } = req.body;
    
    // 调用Flask AI服务的上传数据集接口
    const response = await axios.post(`${AI_SERVICE_URL}/api/upload-dataset`, {
      dataset
    });
    
    // 返回上传结果
    res.json(response.data);
  } catch (error) {
    console.error('数据集上传失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '数据集上传失败', 
      error: error.message 
    });
  }
});

module.exports = router;