import torch
import warnings
from PIL import Image
import random
from transformers import BlipProcessor, BlipForConditionalGeneration, MarianMTModel, MarianTokenizer
import importlib
import subprocess
import sys

# 忽略特定警告
warnings.filterwarnings("ignore", category=UserWarning, message="TypedStorage is deprecated")
warnings.filterwarnings("ignore", category=UserWarning, message="The parameter 'token_ids_1' is not used by this method")

# 全局变量
blip_processor = None
blip_model = None
translator_tokenizer = None
translator_model = None

# 朋友圈常用表情符号
EMOJIS = [
    "✨", "🌟", "💫", "⭐", "🌈", "🌸", "🌺", "🌼", "🌻", "🌹", 
    "🍀", "🌿", "🍃", "🌱", "🌴", "🌵", "🌲", "🍂", "🍁", "🍄",
    "🌊", "🌅", "🌄", "🌇", "🌆", "🌃", "🌌", "🌉", "🌍", "🌎",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
    "😊", "😃", "😄", "😁", "😆", "😍", "🥰", "😘", "😗", "☺️",
    "🙂", "🤗", "🤔", "🤭", "🤫", "🤥", "😌", "😔", "😪", "🤤",
    "🥳", "🎉", "🎊", "🎈", "🎁", "🎂", "🍰", "🧁", "🍭", "🍬",
    "👏", "👍", "🙌", "🤝", "🫶", "💪", "✌️", "🤞", "🫰", "🤌"
]

# 朋友圈常用标点
PUNCTUATIONS = [
    "~", "!", "?", "...", "…", ".", "，", "。", "！", "？",
    "～", "、", "；", ":", "：", "'", "'", "\"", "\"", "【",
    "】", "「", "」", "『", "』", "（", "）", "(", ")", "[",
    "]", "{", "}", "|" , "｜", "·", "•", "●", "○", "◆",
    "！！！", "？？？", "！！", "？？", "～～", "～～～", "...", "~~~"
]

# 标签到描述的映射
TAGS_MAP = {
    "自然": ["大自然", "风景", "自然风光", "户外", "植物"],
    "城市": ["都市", "街道", "城市景观", "建筑", "现代"],
    "人物": ["人像", "肖像", "表情", "情感", "人物特写"],
    "美食": ["食物", "餐饮", "美味", "烹饪", "甜点"],
    "动物": ["宠物", "野生动物", "可爱", "生物", "动物行为"],
    "艺术": ["创意", "设计", "艺术作品", "抽象", "色彩"],
    "旅行": ["旅游", "探险", "异国风情", "地标", "文化"],
    "日常": ["生活", "日常场景", "家庭", "工作", "休闲"]
}

# 中文朋友圈常用前缀
CHINESE_PREFIXES = [
    "今日份", "分享", "记录", "发现", "偶遇", "邂逅", 
    "享受", "感受", "沉浸在", "被治愈", "遇见", "寻找",
    "品味", "感悟", "探索", "漫步", "静享", "悦享",
    "心动", "心情", "时光", "岁月", "生活", "日常",
    "每日一拍", "随手拍", "打卡", "晒一晒", "深夜独享", "早安",
    "晚安", "周末", "假日", "度假", "旅行", "出游",
    "宝藏", "惊喜", "意外", "幸运", "幸福", "快乐"
]

# 中文朋友圈常用后缀
CHINESE_SUFFIXES = [
    "的瞬间", "的时光", "的美好", "的惊喜", "的心情", 
    "真好", "好开心", "好幸福", "好美", "好赞",
    "的感动", "的温暖", "的治愈", "的记忆", "的味道",
    "的色彩", "的世界", "的旅程", "的故事", "的日子",
    "太美了", "太赞了", "太治愈了", "太幸福了", "太舒服了",
    "超级棒", "超级赞", "超级美", "超级爱", "超级喜欢",
    "绝绝子", "yyds", "太上头了", "太绝了", "爱了爱了",
    "好喜欢呀", "好想要", "好想拥有", "好想去", "好想试试"
]

# 中文朋友圈常用短语
CHINESE_PHRASES = [
    "生活不止眼前的苟且，还有诗和远方",
    "岁月静好，现世安稳",
    "一切都刚刚好",
    "平凡的日子里藏着小确幸",
    "生活虽简单，但处处是美好",
    "愿你眼中有星辰，心中有暖阳",
    "不负韶华，不负自己",
    "人间值得，未来可期",
    "温柔且坚定，勇敢且自由",
    "愿所有的美好如约而至",
    "这世界美好与你环环相扣",
    "人生就是一场说走就走的旅行",
    "所有的相遇都是久别重逢",
    "这里的风景美得让人心醉",
    "今天也是元气满满的一天",
    "生活明朗，万物可爱",
    "人间烟火气，最抚凡人心",
    "这才是我想要的生活啊",
    "今日份快乐已签收",
    "这波绝绝子，无人能敌"
]

# 网络流行语
INTERNET_PHRASES = [
    "绝绝子", "yyds", "真的会谢", "太可了", "笑死", 
    "awsl", "上头", "有被惊艳到", "锁死", "我真的哭死",
    "太欲了", "我酸了", "我哭死", "我真的服了", "爱了爱了",
    "冲鸭", "太香了", "神仙打架", "我都可以", "太顶了"
]

# 情感词汇
EMOTION_WORDS = [
    "感动", "治愈", "温暖", "幸福", "快乐", 
    "惊喜", "惊艳", "震撼", "舒适", "放松",
    "满足", "喜悦", "开心", "欣喜", "愉悦",
    "美好", "美妙", "美丽", "美味", "美景"
]

def check_and_install_dependencies(dependencies):
    """检查并安装缺失的依赖包"""
    missing_deps = []
    for dep in dependencies:
        try:
            importlib.import_module(dep)
            print(f"依赖 {dep} 已安装")
        except ImportError:
            missing_deps.append(dep)
            print(f"依赖 {dep} 未安装")
    
    if missing_deps:
        print(f"正在安装缺失的依赖: {', '.join(missing_deps)}")
        try:
            for dep in missing_deps:
                subprocess.check_call([sys.executable, "-m", "pip", "install", dep])
            print("依赖安装完成")
            return True
        except Exception as e:
            print(f"安装依赖失败: {str(e)}")
            return False
    return True

def load_blip_model():
    """加载BLIP模型"""
    global blip_processor, blip_model
    
    if blip_processor is None or blip_model is None:
        try:
            print("正在加载BLIP模型...")
            # 加载模型
            blip_processor = BlipProcessor.from_pretrained("models/blip-image-captioning-base")
            blip_model = BlipForConditionalGeneration.from_pretrained(
                "models/blip-image-captioning-base",
                torch_dtype=torch.float16  # 使用半精度
                # low_cpu_mem_usage=True     # 减少CPU内存使用
            )
            
            # 将模型移至GPU（如果可用）
            device = "cuda" if torch.cuda.is_available() else "cpu"
            blip_model = blip_model.to(device)
            if device == "cpu":
                # 如果是CPU，使用float32
                blip_model = blip_model.float()
            print(f"BLIP模型已加载到{device}")
        except Exception as e:
            print(f"加载BLIP模型失败: {str(e)}")
            raise e

def generate_blip_caption(image):
    """使用BLIP模型生成图像描述"""
    try:
        # 确保BLIP模型已加载
        try:
            load_blip_model()
        except Exception as e:
            print(f"BLIP模型加载失败: {str(e)}")
            return None
        
        # 准备图像
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # 使用BLIP处理器处理图像
        try:
            inputs = blip_processor(image, return_tensors="pt").to(device, torch.float16)
        except Exception as e:
            print(f"BLIP处理图像失败: {str(e)}")
            return None
        
        # 生成描述
        try:
            with torch.no_grad():
                generated_ids = blip_model.generate(
                    **inputs,
                    max_length=50,
                    num_beams=5,
                    min_length=5,
                    top_p=0.9,
                    repetition_penalty=1.5
                )
                caption = blip_processor.decode(generated_ids[0], skip_special_tokens=True)
            
            return caption
        except Exception as e:
            print(f"BLIP生成描述失败: {str(e)}")
            return None
    except Exception as e:
        print(f"BLIP生成描述过程中发生未知错误: {str(e)}")
        return None

def load_translator_model():
    """加载MarianMT翻译模型（英文到中文）"""
    global translator_tokenizer, translator_model
    
    if translator_tokenizer is None or translator_model is None:
        try:
            print("正在加载翻译模型...")
            # 使用Helsinki-NLP的MarianMT模型（英文到中文）
            model_name = "Helsinki-NLP/opus-mt-en-zh"
            translator_tokenizer = MarianTokenizer.from_pretrained(model_name)
            translator_model = MarianMTModel.from_pretrained(
                model_name,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                low_cpu_mem_usage=True
                # 移除不支持的device_map="auto"参数
            )
            
            # 将模型移至GPU（如果可用）
            device = "cuda" if torch.cuda.is_available() else "cpu"
            translator_model = translator_model.to(device)
            print(f"翻译模型已加载到{device}")
        except Exception as e:
            print(f"加载翻译模型失败: {str(e)}")
            raise e

def translate_text(text, max_length=100):
    """使用MarianMT模型将英文文本翻译成中文"""
    try:
        # 确保翻译模型已加载
        try:
            load_translator_model()
        except Exception as e:
            print(f"翻译模型加载失败: {str(e)}")
            return None
        
        # 准备输入
        device = "cuda" if torch.cuda.is_available() else "cpu"
        inputs = translator_tokenizer([text], return_tensors="pt", padding=True, truncation=True, max_length=max_length)
        inputs = inputs.to(device)
        
        # 生成翻译
        try:
            with torch.no_grad():
                translated_ids = translator_model.generate(
                    **inputs,
                    max_length=max_length,
                    num_beams=4,
                    early_stopping=True,
                    no_repeat_ngram_size=3
                )
                translated_text = translator_tokenizer.batch_decode(translated_ids, skip_special_tokens=True)[0]
            
            return translated_text
        except Exception as e:
            print(f"翻译生成失败: {str(e)}")
            return None
    except Exception as e:
        print(f"翻译过程中发生未知错误: {str(e)}")
        return None

def enhance_with_glm(caption, style="朋友圈"):
    """使用规则增强描述文本（替代原来的GLM模型）"""
    # 直接调用规则增强方法
    return enhance_with_rules(caption, style)

def enhance_with_rules(caption, style="朋友圈"):
    """使用规则增强描述文本"""
    # 简单的文本增强规则
    if style == "朋友圈":
        # 1. 尝试将英文描述翻译成中文
        english_words = ["a", "the", "is", "are", "in", "on", "with", "and", "of"]
        is_english = any(word in english_words for word in caption.lower().split())
        
        if is_english:
            # 使用翻译模型将英文翻译成中文
            translated_text = translate_text(caption)
            if translated_text:
                caption = translated_text
            else:
                # 如果翻译失败，回退到原来的规则替换方法
                if random.random() < 0.3:  # 30%概率使用完整短语
                    return random.choice(CHINESE_PHRASES)
                else:
                    # 70%概率使用前缀+后缀组合
                    return random.choice(CHINESE_PREFIXES) + "，" + random.choice(CHINESE_SUFFIXES)
        
        # 2. 截断长句子
        if len(caption) > 30:
            words = caption.split()
            caption = ' '.join(words[:min(10, len(words))])
        
        # 3. 添加常见的朋友圈表达
        if random.random() < 0.9:  # 提高到90%的概率添加
            choice = random.random()
            if choice < 0.4:  # 40%概率添加前缀
                caption = random.choice(CHINESE_PREFIXES) + "，" + caption
            elif choice < 0.8:  # 40%概率添加后缀
                caption = caption + "，" + random.choice(CHINESE_SUFFIXES)
            else:  # 20%概率同时添加前缀和后缀
                caption = random.choice(CHINESE_PREFIXES) + "，" + caption + "，" + random.choice(CHINESE_SUFFIXES)
        
        # 4. 添加网络流行语
        if random.random() < 0.3:  # 30%概率添加网络流行语
            if random.random() < 0.5:  # 50%概率在开头添加
                caption = random.choice(INTERNET_PHRASES) + "！" + caption
            else:  # 50%概率在结尾添加
                caption = caption + "，" + random.choice(INTERNET_PHRASES) + "！"
        
        # 5. 添加情感词汇
        if random.random() < 0.4:  # 40%概率添加情感词汇
            emotion = random.choice(EMOTION_WORDS)
            if random.random() < 0.5:  # 50%概率作为形容词
                caption = caption.replace("，", "，好" + emotion + "，", 1)
            else:  # 50%概率作为感叹
                caption = caption + "，真是太" + emotion + "了！"
        
        # 6. 随机使用完整短语替换
        if random.random() < 0.15:  # 15%概率完全替换为短语
            return random.choice(CHINESE_PHRASES)
    else:
        # 普通描述，保持原样
        pass
    
    return caption

def add_moments_style(text):
    """添加朋友圈风格元素"""
    # 随机添加表情符号
    if random.random() < 0.95:  # 提高到95%的概率添加表情
        num_emojis = random.randint(1, 4)  # 增加可能的表情数量
        emojis = random.sample(EMOJIS, num_emojis)
        
        # 在文本开头或结尾添加表情，或者同时添加
        choice = random.random()
        if choice < 0.4:  # 40%概率在开头添加
            text = "".join(emojis) + " " + text
        elif choice < 0.8:  # 40%概率在结尾添加
            text = text + " " + "".join(emojis)
        else:  # 20%概率在开头和结尾都添加
            start_emojis = random.sample(EMOJIS, random.randint(1, 2))
            end_emojis = random.sample(EMOJIS, random.randint(1, 2))
            text = "".join(start_emojis) + " " + text + " " + "".join(end_emojis)
    
    # 随机替换标点
    if random.random() < 0.6:  # 提高到60%的概率替换标点
        for punct in ["。", ".", "!", "！"]:
            if punct in text:
                replacement = random.choice(["~", "...", "…", "！", "~", "！！", "！！！", "~~~"])
                text = text.replace(punct, replacement, 1)
    
    # 添加感叹词
    if random.random() < 0.3:  # 30%概率添加感叹词
        exclamations = ["哇", "啊", "嗯", "哦", "呀", "呜", "嘿", "哎呀", "天呐", "我的天"]
        exclamation = random.choice(exclamations) + random.choice(["！", "~", "~~"])
        if random.random() < 0.5:  # 50%概率在开头添加
            text = exclamation + " " + text
        else:  # 50%概率在结尾添加
            text = text + " " + exclamation
    
    return text

def process_image(image):
    """处理图像并生成描述"""
    # 使用BLIP模型生成图像描述
    blip_caption = generate_blip_caption(image)
    
    if not blip_caption:
        return {
            'success': False,
            'message': '图像描述生成失败'
        } 
    
    # 使用规则增强描述
    try:
        enhanced_caption = enhance_with_rules(blip_caption, "朋友圈")
        final_caption = add_moments_style(enhanced_caption)
        
        # 生成相关标签
        suggested_tags = []
        try:
            for category, tags in TAGS_MAP.items():
                if any(keyword.lower() in blip_caption.lower() for keyword in [category.lower()] + [tag.lower() for tag in tags]):
                    suggested_tags.extend(random.sample(tags, min(2, len(tags))))
            
            # 确保标签不重复且数量合适
            suggested_tags = list(set(suggested_tags))[:3]
        except Exception as e:
            print(f"生成标签失败: {str(e)}")
            # 标签生成失败不影响主要功能
        
        return {
            'success': True,
            'generatedText': final_caption,
            'originalCaption': blip_caption,
            'enhancedCaption': enhanced_caption,
            'suggestedTags': suggested_tags,
            'model': 'BLIP+翻译+规则增强'
        }
    except Exception as e:
        print(f"处理图像描述过程中发生错误: {str(e)}")
        # 如果增强失败，返回原始BLIP描述
        try:
            styled_caption = add_moments_style(blip_caption)
        except Exception:
            # 如果风格化也失败，直接返回原始描述
            styled_caption = blip_caption
            
        return {
            'success': True,
            'generatedText': styled_caption,
            'originalCaption': blip_caption,
            'suggestedTags': [],
            'model': 'BLIP',
            'error': str(e)
        }