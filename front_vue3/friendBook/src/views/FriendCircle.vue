<!-- src/views/FriendCircle.vue -->
<template>
  <div class="friend-circle">
    <!-- 顶部栏 -->
    <nav class="fc-nav">
      <router-link to="/profile" class="nav-link">个人主页</router-link>
      <h1>朋友圈</h1>
      <div class="user-info">
        <span>{{ nickname || username }}</span>
        <img :src="userAvatar" alt="avatar" class="avatar user-avatar">
      </div>
    </nav>

    <!-- 发帖按钮，改为右下角悬浮式设计 -->
    <button class="floating-post-btn fab-btn" @click="togglePostDialog">
      <span class="fab-icon">＋</span>
    </button>

    <!-- 发帖弹窗 -->
    <div v-if="showPostDialog" class="post-dialog-mask" @click.self="closePostDialog">
      <div class="comment-dialog modern-dialog">
        <div class="dialog-header">
          <h3>分享新鲜事</h3>
          <button class="close-btn" @click="closePostDialog">×</button>
        </div>
        <div class="comment-input-section">
          <textarea 
            v-model="newPost" 
            placeholder="分享你的新鲜事..."
            class="post-textarea"
            :class="{ 'has-images': newPostImages.length }"></textarea>
          <div class="tag-input-section">
            <div class="common-tags-section">
              <span class="common-tags-title">常用标签：</span>
              <div class="common-tags-list">
                <span 
                  v-for="(tag, idx) in commonTags" 
                  :key="idx" 
                  class="common-tag-item"
                  :style="{ backgroundColor: tagColors[tag.category] }"
                  @click="quickAddTag(tag.name)">
                  #{{ tag.name }}
                </span>
              </div>
            </div>
            <div class="tag-input-wrapper">
              <input
                v-model="tagInput"
                @keyup="suggestTags"
                @keydown.enter.prevent="addTag"
                @keydown.space.prevent="addTagWithSpace"
                @keydown.comma.prevent="addTagWithComma"
                placeholder="添加标签，回车/空格/逗号确认，如 #美食"
                class="tag-input"
                maxlength="20"
              />
              <div v-if="tagSuggestions.length > 0" class="tag-suggestions">
                <div 
                  v-for="(suggestion, idx) in tagSuggestions" 
                  :key="idx"
                  class="tag-suggestion-item"
                  :style="{ borderLeftColor: tagColors[suggestion.category] }"
                  @click="quickAddTag(suggestion.name)">
                  #{{ suggestion.name }}
                </div>
              </div>
            </div>
            <div class="tag-list" ref="tagList">
              <span 
                v-for="(tag, idx) in newPostTags" 
                :key="idx" 
                class="tag-chip"
                :style="{ backgroundColor: getTagColor(tag) }"
                draggable="true"
                @dragstart="dragStart(idx)"
                @dragover.prevent
                @dragenter.prevent
                @drop="drop(idx)">
                #{{ tag }}
                <button @click="removeTag(idx)" class="remove-tag-btn">×</button>
              </span>
            </div>
          </div>
          <div class="image-upload-section modern-upload">
            <label class="upload-btn modern-upload-btn" :class="{ disabled: newPostImages.length >= 9 }">
              <span class="upload-icon">📷</span> 添加图片
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                @change="handleImageUpload"
                class="hidden-input"
                :disabled="newPostImages.length >= 9">
            </label>
            <span class="image-count" :class="{ warning: newPostImages.length >= 7, error: newPostImages.length >= 9 }">
              已选 {{ newPostImages.length }}/9 张
              <span v-if="newPostImages.length >= 9" class="max-tip">(已达上限)</span>
            </span>
            <!-- 添加AI功能按钮 -->
            <div class="ai-features">
              <button 
                @click="generateTextFromImage" 
                class="ai-btn" 
                :disabled="!newPostImages.length || isGenerating"
                :class="{ disabled: !newPostImages.length || isGenerating }">
                <span class="ai-icon">🤖</span> 图片生成文案
              </button>
              <button 
                @click="generateImageFromText" 
                class="ai-btn" 
                :disabled="!newPost.trim() || isGenerating"
                :class="{ disabled: !newPost.trim() || isGenerating }">
                <span class="ai-icon">🎨</span> 文案生成图片
              </button>
            </div>
            
            <!-- AI生成结果预览组件 -->
            <div v-if="aiResultPreview.show" class="ai-result-preview">
              <div class="ai-result-preview-header">
                <div class="ai-result-preview-title">
                  <span class="ai-icon">{{ aiResultPreview.type === 'text' ? '🤖' : '🎨' }}</span>
                  <span>{{ aiResultPreview.type === 'text' ? 'AI生成文案预览' : 'AI生成图片预览' }}</span>
                </div>
                <button @click="closeAiPreview" class="close-btn">×</button>
              </div>
              <div v-if="aiResultPreview.type === 'text'" class="ai-result-content">
                {{ aiResultPreview.content }}
              </div>
              <div v-else-if="aiResultPreview.type === 'image'" class="ai-result-content">
                <img :src="aiResultPreview.content" class="ai-generated-image" />
              </div>
              <div class="ai-result-actions">
                <button @click="acceptAiResult" class="ai-result-action-btn accept-btn">
                  <span class="ai-success-icon">✓</span> 接受
                </button>
                <button @click="closeAiPreview" class="ai-result-action-btn reject-btn">
                  <span class="ai-error-icon">×</span> 取消
                </button>
              </div>
            </div>
          </div>
          <div v-if="newPostImages.length" class="preview-grid modern-preview-grid">
            <div 
              v-for="(img, idx) in newPostImages" 
              :key="idx"
              class="preview-item modern-preview-item">
              <img :src="img" class="preview-image" />
              <button @click="removeImage(idx)" class="remove-image-btn">&times;</button>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button 
            @click="submitPost" 
            :disabled="!newPost.trim() && !newPostImages.length"
            class="publish-btn modern-publish-btn"
            :class="{ disabled: !newPost.trim() && !newPostImages.length }">
            {{ newPostImages.length ? '发布图文' : '发布文字' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 动态列表 -->
    <div class="post-list">
      <div v-for="post in posts" :key="post.id" class="post-item">
        <div class="post-card">
          <div class="post-header">
            <img :src="post.author.avatar" class="avatar">
            <div class="post-author">
              <span class="author-name">{{ post.author.name }}</span>
              <span class="post-time">{{ formatTime(post.time) }}</span>
            </div>
          </div>
          <div class="post-content">{{ post.content }}</div>
          <!-- 可扩展图片展示区域 -->
          <div v-if="post.tags && post.tags.length" class="post-tags">
            <span v-for="(tag, idx) in post.tags" :key="idx" class="post-tag">#{{ tag }}</span>
          </div>
          <div v-if="post.images && post.images.length" class="post-images">
            <img v-for="(img, idx) in post.images" :key="idx" :src="img" class="post-img" />
          </div>
          <div class="post-actions">
            <button class="like-btn" :class="{ liked: post.liked }" @click="toggleLike(post)">
              <span v-if="post.liked">❤️</span><span v-else>🤍</span> {{ post.likes }}
            </button>
            <button class="comment-btn" @click="showComments(post)">💬 评论</button>
          </div>
        </div>
      </div>
    </div>
    <!-- 评论弹窗预留 -->
    <div v-if="showCommentDialog" class="comment-dialog-mask" @click.self="closeCommentDialog">
      <!-- 更新评论弹窗模板 -->
      <div class="comment-dialog">
        <div class="dialog-header">
          <h3>评论（{{ currentComments.length }}）</h3>
          <button class="close-btn" @click="closeCommentDialog">×</button>
        </div>
        <div class="comment-input-section">
          <textarea v-model="newComment" placeholder="输入评论..." class="comment-textarea"></textarea>
          <button @click="submitComment" class="submit-comment-btn">发布</button>
        </div>
        <ul class="comment-list">
          <li v-for="(comment, idx) in currentComments" :key="idx" class="comment-item">
            <div class="comment-content-wrapper">
              <span class="comment-author">{{ comment.authorName }}：</span>
              <span class="comment-content">{{ comment.content }}</span>
            </div>
            <!-- 只有当评论的userId与当前登录用户的userId匹配时才显示删除按钮 -->
            <button 
              v-if="comment.userId === userId" 
              @click="deleteCommentItem(comment)" 
              class="delete-comment-btn"
              title="删除评论">
              ×
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeMount, onMounted } from 'vue';
import { useRouter } from 'vue-router';
// 移除直接导入axios
// import axios from 'axios';
// 更新导入语句，引入新添加的API方法
import { getUserInfo, getPosts, createPost, likePost, unlikePost, addComment, deleteComment, deletePost, generateTextFromImageAPI, generateImageFromTextAPI } from '../api';

const username = ref(localStorage.getItem('username') || '未登录用户');
const nickname = ref(localStorage.getItem('nickname') || '');
const userAvatar = ref(localStorage.getItem('avatar') || 'https://picsum.photos/50/50');
const router = useRouter();
const userId = ref(localStorage.getItem('userId'));
const token = ref(localStorage.getItem('token'));

// 新增API基础URL
const API_BASE_URL = 'http://localhost:3000';

onBeforeMount(() => {
  if (!localStorage.getItem('token')) {
    router.push('/login');
  }
});

onMounted(() => {
  fetchUserInfo();
  fetchPosts();
});

// 新增获取用户信息的方法
const fetchUserInfo = async () => {
  try {
    const userData = await getUserInfo();
    if (userData) {
      username.value = userData.nickname || userData.username;
      nickname.value = userData.nickname || userData.username;
      // 处理头像URL，确保完整路径
      userAvatar.value = userData.avatar ? `${API_BASE_URL}${userData.avatar}` : 'https://picsum.photos/50/50';
      // 更新localStorage中的用户信息
      localStorage.setItem('username', userData.username);
      localStorage.setItem('nickname', userData.nickname || userData.username);
      localStorage.setItem('avatar', userAvatar.value);
      userId.value = userData._id;
      localStorage.setItem('userId', userData._id);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

// 修改获取帖子列表的方法，使用api.js中的getPosts方法
const fetchPosts = async () => {
  try {
    const postsData = await getPosts();
    
    if (postsData && Array.isArray(postsData)) {
      // 转换后端数据格式为前端显示格式
      posts.value = postsData.map(post => ({
        id: post._id,
        authorId: post.authorId, // 添加作者ID，用于判断是否是自己的帖子
        author: { 
          name: post.authorName || '用户', 
          avatar: post.authorAvatar ? `${API_BASE_URL}${post.authorAvatar}` : 'https://picsum.photos/seed/user/48/48' 
        },
        content: post.content,
        time: post.createdAt,
        likes: post.likes ? post.likes.length : 0,
        liked: post.likes ? post.likes.some(like => like.userId === userId.value) : false,
        images: post.images || [],
        tags: post.tags || [],
        // 修改评论数据结构，保留完整评论对象，包括评论ID和作者信息
        comments: post.comments ? post.comments.map(c => ({
          _id: c._id,
          userId: c.userId,
          content: c.content,
          authorName: c.authorName || '用户', // 添加评论者昵称
          createdAt: c.createdAt
        })) : []
      }));
    }
  } catch (error) {
    console.error('获取帖子失败:', error);
    // 如果获取失败，使用本地模拟数据
    posts.value = [
      {
        id: 1,
        authorId: userId.value, // 设置为当前用户ID
        author: { name: 'Alice', avatar: 'https://picsum.photos/seed/alice/48/48' },
        content: 'Hello world! 这是我的第一条朋友圈。',
        time: new Date(),
        likes: 5,
        liked: false,
        images: ['https://picsum.photos/seed/pic1/200/120'],
        tags: ['生活', '分享'],
        comments: [{
          _id: '1',
          userId: 'other-user-id',
          content: '欢迎！',
          authorName: 'Bob'
        }, {
          _id: '2',
          userId: userId.value,
          content: '很棒~',
          authorName: username.value
        }]
      }
    ];
  }
};

// 添加删除帖子方法
const deletePostItem = async (post) => {
  if (confirm('确定要删除这条帖子吗？')) {
    try {
      await deletePost(post.id);
      // 从列表中移除该帖子
      posts.value = posts.value.filter(p => p.id !== post.id);
    } catch (error) {
      console.error('删除帖子失败:', error);
      alert('删除帖子失败，请稍后再试');
    }
  }
};

// 添加删除评论方法
const deleteCommentItem = async (comment) => {
  if (!currentPost) return;
  
  if (confirm('确定要删除这条评论吗？')) {
    try {
      await deleteComment(currentPost._id, comment._id);
      // 从当前评论列表中移除该评论
      currentComments.value = currentComments.value.filter(c => c._id !== comment._id);
      // 同时更新帖子中的评论列表
      const post = posts.value.find(p => p.id === currentPost._id);
      if (post) {
        post.comments = post.comments.filter(c => c._id !== comment._id);
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      alert('删除评论失败，请稍后再试');
    }
  }
};
</script>

<script>
// 新增时间格式化函数
const formatTime = (date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(date))
}

const newPostTags = ref([])
const tagInput = ref('')
const username = ref(localStorage.getItem('username'))
const userAvatar = ref(localStorage.getItem('avatar') || 'https://picsum.photos/50/50');
const userId = ref(localStorage.getItem('userId'))
const newPost = ref('')
const newPostImages = ref([])
const posts = ref([])

const showPostDialog = ref(false)
const showCommentDialog = ref(false)
const currentComments = ref([])
const newComment = ref('')
let currentPost = null

// 标签相关数据
// const tagInput = ref('')  // 已在上方声明，此处删除重复声明
const tagSuggestions = ref([])
const draggedTagIndex = ref(null)

// 标签分类和颜色系统
const tagColors = {
  生活: '#e6f9f0',
  兴趣: '#fff8e6',
  工作: '#e6f0f9',
  情感: '#f9e6e6',
  学习: '#e6e6f9',
  其他: '#f2f2f2'
}

// 常用标签列表
const commonTags = [
  { name: '生活', category: '生活' },
  { name: '美食', category: '生活' },
  { name: '旅行', category: '兴趣' },
  { name: '电影', category: '兴趣' },
  { name: '音乐', category: '兴趣' },
  { name: '读书', category: '学习' },
  { name: '工作', category: '工作' },
  { name: '心情', category: '情感' }
]

// 所有可用标签（用于建议）
const allTags = [
  ...commonTags,
  { name: '摄影', category: '兴趣' },
  { name: '健身', category: '生活' },
  { name: '编程', category: '工作' },
  { name: '游戏', category: '兴趣' },
  { name: '宠物', category: '生活' },
  { name: '家庭', category: '生活' },
  { name: '时尚', category: '兴趣' },
  { name: '科技', category: '工作' },
  { name: '分享', category: '其他' }
]

// 从内容中智能推荐标签
const suggestTagsFromContent = (content) => {
  // 简单的关键词匹配逻辑
  const keywords = {
    '美食': ['吃', '美食', '好吃', '餐厅', '菜', '食物', '美味', '晚餐', '午餐', '早餐', '甜点', '小吃'],
    '旅行': ['旅行', '旅游', '出行', '景点', '风景', '游玩', '度假', '出游', '自驾', '酒店'],
    '电影': ['电影', '观影', '影院', '电视剧', '剧情', '演员', '导演', '电视', '剧', '片'],
    '音乐': ['音乐', '歌曲', '听歌', '演唱会', '歌手', '乐队', '专辑', '曲', '歌词'],
    '读书': ['书', '阅读', '读书', '小说', '文学', '作者', '书籍', '读完'],
    '工作': ['工作', '加班', '项目', '会议', '同事', '老板', '客户', '职场', '办公室'],
    '学习': ['学习', '考试', '课程', '知识', '学校', '老师', '笔记', '研究', '学院', '大学'],
    '健身': ['健身', '运动', '锻炼', '跑步', '瑜伽', '力量', '肌肉', '减肥', '训练'],
    '摄影': ['摄影', '照片', '拍照', '相机', '风景照', '人像', '构图', '光线'],
    '宠物': ['宠物', '猫', '狗', '喵', '汪', '萌宠', '可爱', '毛孩子'],
    '心情': ['心情', '感觉', '开心', '难过', '焦虑', '压力', '放松', '情绪', '烦恼'],
    '家庭': ['家庭', '家人', '父母', '孩子', '老人', '亲人', '爸爸', '妈妈', '爷爷', '奶奶'],
    '科技': ['科技', '手机', '电脑', '数码', '智能', 'AI', '人工智能', '编程', '软件', '硬件']
  };
  
  const result = [];
  const contentLower = content.toLowerCase();
  
  // 遍历关键词匹配内容
  Object.entries(keywords).forEach(([tagName, keywordList]) => {
    for (const keyword of keywordList) {
      if (contentLower.includes(keyword)) {
        // 查找标签分类
        const tagInfo = allTags.find(t => t.name === tagName) || { name: tagName, category: '其他' };
        result.push(tagInfo);
        break; // 找到一个关键词匹配就添加该标签并跳出循环
      }
    }
  });
  
  return result;
}

// 获取标签颜色
const getTagColor = (tag) => {
  const foundTag = allTags.find(t => t.name === tag)
  return foundTag ? tagColors[foundTag.category] : tagColors.其他
}

// 标签建议功能
const suggestTags = () => {
  const input = tagInput.value.trim();
  if (!input) {
    tagSuggestions.value = [];
    return;
  }
  
  // 移除#号
  const searchTerm = input.startsWith('#') ? input.substring(1) : input;
  
  if (searchTerm.length < 1) {
    tagSuggestions.value = [];
    return;
  }
  
  // 从常用标签和当前帖子内容中推荐标签
  const contentSuggestions = newPost.value ? suggestTagsFromContent(newPost.value) : [];
  const allSuggestions = [...commonTags, ...contentSuggestions];
  
  // 过滤标签
  tagSuggestions.value = allSuggestions
    .filter(tag => 
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
      !newPostTags.value.includes(tag.name)
    )
    // 去重
    .filter((tag, index, self) => 
      index === self.findIndex(t => t.name === tag.name)
    )
    // 最多显示5个建议
    .slice(0, 5);
}

// 快速添加标签
const quickAddTag = (tagName) => {
  if (!newPostTags.value.includes(tagName) && newPostTags.value.length < 5) {
    newPostTags.value.push(tagName)
    tagInput.value = ''
    tagSuggestions.value = []
  } else if (newPostTags.value.length >= 5) {
    alert('最多添加5个标签')
  }
}

// 支持多种方式添加标签
const addTag = () => {
  const tag = tagInput.value.trim().replace(/^#/, '')
  if (tag && !newPostTags.value.includes(tag) && newPostTags.value.length < 5) {
    newPostTags.value.push(tag)
    tagInput.value = ''
    tagSuggestions.value = []
  } else if (newPostTags.value.length >= 5) {
    alert('最多添加5个标签')
  }
}

const addTagWithSpace = () => {
  if (tagInput.value.trim()) {
    addTag()
  } else {
    tagInput.value += ' '
  }
}

const addTagWithComma = () => {
  if (tagInput.value.trim()) {
    addTag()
  } else {
    tagInput.value += ','
  }
}

// 拖拽排序功能
const dragStart = (index) => {
  draggedTagIndex.value = index
}

const drop = (index) => {
  if (draggedTagIndex.value !== null) {
    const draggedTag = newPostTags.value[draggedTagIndex.value]
    newPostTags.value.splice(draggedTagIndex.value, 1)
    newPostTags.value.splice(index, 0, draggedTag)
    draggedTagIndex.value = null
  }
}
// 删除标签方法
const removeTag = (index) => {
  newPostTags.value.splice(index, 1)
}

// 修改显示评论方法，保存完整评论对象
const showComments = (post) => {
  showCommentDialog.value = true
  currentComments.value = post.comments || []
  newComment.value = ''
  // 确保currentPost对象包含_id属性
  currentPost = { ...post, _id: post.id }
}

const closeCommentDialog = () => {
  showCommentDialog.value = false
  currentPost = null
}

// 修改评论提交方法，使用api.js中的addComment方法
const submitComment = async () => {
  if (newComment.value.trim() && currentPost) {
    try {
      // 调用api.js中的addComment方法添加评论
      // 使用currentPost._id而不是currentPost.id
      const result = await addComment(currentPost._id, newComment.value);
      
      // 创建新评论对象，使用后端返回的评论信息
      const newCommentObj = {
        _id: result.comment._id,
        userId: userId.value,
        content: newComment.value,
        authorName: result.comment.authorName || localStorage.getItem('nickname') || username.value, // 确保有作者名称
        createdAt: new Date()
      };
      
      // 更新当前评论列表，但不重复添加到currentPost.comments
      currentComments.value = [...currentComments.value, newCommentObj];
      
      // 更新帖子列表中的评论，但不重复添加
      const post = posts.value.find(p => p.id === currentPost._id);
      if (post) {
        if (!post.comments) post.comments = [];
        post.comments = [...post.comments, newCommentObj];
      }
      
      newComment.value = '';
    } catch (error) {
      console.error('评论提交错误:', error);
      // 离线模式下仍然更新本地数据，但确保显示正确的作者名称
      const newCommentObj = {
        _id: Date.now().toString(), // 临时ID
        userId: userId.value,
        content: newComment.value,
        authorName: localStorage.getItem('nickname') || username.value, // 优先使用nickname
        createdAt: new Date()
      };
      
      // 确保在UI中立即显示评论者名称
      currentComments.value = [...currentComments.value, newCommentObj];
      
      // 更新帖子列表中的评论，确保显示评论者名称
      const post = posts.value.find(p => p.id === currentPost._id);
      if (post) {
        if (!post.comments) post.comments = [];
        post.comments = [...post.comments, newCommentObj];
      }
      
      newComment.value = '';
    }
  }
}

const emojiList = ref(['😀', '😍', '👍', '🎉', '❤️', '🔥', '🤔', '🙏'])
const uploadProgress = ref(0)

const addEmoji = (emoji) => {
  newComment.value += emoji
  document.querySelector('textarea').focus()
}

const handleImageUpload = (e) => {
  if (newPostImages.value.length >= 9) {
    alert('最多只能上传9张图片');
    return;
  }
  uploadProgress.value = 0
  const files = Array.from(e.target.files)
  const remainingSlots = 9 - newPostImages.value.length
  const filesToUpload = files.slice(0, remainingSlots)
  const interval = setInterval(() => {
    uploadProgress.value += Math.floor(Math.random() * 15)
    if (uploadProgress.value >= 95) clearInterval(interval)
  }, 200)

  Promise.all(filesToUpload.map(file => {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = (e) => {
        // 新增：图片压缩/缩放处理
        const img = new window.Image()
        img.onload = () => {
          const maxW = 800, maxH = 800
          let { width, height } = img
          let scale = Math.min(maxW / width, maxH / height, 1)
          const canvas = document.createElement('canvas')
          canvas.width = width * scale
          canvas.height = height * scale
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          // 压缩质量0.85
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
          resolve(dataUrl)
        }
        img.onerror = () => resolve(e.target.result)
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  })).then(results => {
    clearInterval(interval)
    uploadProgress.value = 100
    newPostImages.value.push(...results)
    setTimeout(() => uploadProgress.value = 0, 1000)
  })
}

// 修改点赞方法，使用api.js中的likePost和unlikePost方法
const toggleLike = async (post) => {
  try {
    if (post.liked) {
      // 取消点赞
      await unlikePost(post.id);
    } else {
      // 点赞
      await likePost(post.id);
    }
    
    // 更新本地点赞状态
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
  } catch (error) {
    console.error('点赞操作失败:', error);
    // 离线模式下仍然更新本地状态
  //  post.liked = !post.liked;
  //  post.likes += post.liked ? 1 : -1;
  }
}

const togglePostDialog = () => {
  showPostDialog.value = !showPostDialog.value;
}

const closePostDialog = () => {
  showPostDialog.value = false;
  newPost.value = '';
  newPostImages.value = [];
  newPostTags.value = [];
}

const removeImage = (idx) => {
  newPostImages.value.splice(idx, 1)
}

// 修改创建帖子方法，使用api.js中的createPost方法
const submitPost = async () => {
  if (!newPost.value.trim() && !newPostImages.value.length) return;
  
  try {
    // 准备发送到后端的数据
    const postData = {
      authorId: localStorage.getItem('userId'),
      content: newPost.value,
      images: newPostImages.value,
      tags: newPostTags.value
    };
    
    // 调用api.js中的createPost方法创建帖子
    const newPostData = await createPost(postData);
    
    // 将新创建的帖子添加到列表顶部
    posts.value.unshift({
      id: newPostData._id,
      authorId: userId.value,
      author: {
        name: localStorage.getItem('nickname') || username.value,
        avatar: userAvatar.value
      },
      content: newPost.value,
      time: new Date(),
      likes: 0,
      liked: false,
      images: [...newPostImages.value],
      tags: [...newPostTags.value],
      comments: []
    });
    
    // 清空表单
    newPost.value = '';
    newPostImages.value = [];
    newPostTags.value = [];
    showPostDialog.value = false;
  } catch (error) {
    console.error('创建帖子失败:', error);
    alert('创建帖子失败，请稍后再试');
  }
};

const isGenerating = ref(false); // 添加生成状态变量

// AI结果预览相关状态
const aiResultPreview = ref({
  show: false,
  type: '', // 'text' 或 'image'
  content: '',
  originalData: null // 保存原始数据，用于接受时处理
});

// 关闭AI预览
const closeAiPreview = () => {
  aiResultPreview.value = {
    show: false,
    type: '',
    content: '',
    originalData: null
  };
};

// 接受AI生成结果
const acceptAiResult = () => {
  if (aiResultPreview.value.type === 'text') {
    // 接受文本结果
    if (newPost.value.trim()) {
      newPost.value += '\n' + aiResultPreview.value.content;
    } else {
      newPost.value = aiResultPreview.value.content;
    }
    
    // 添加推荐标签
    if (aiResultPreview.value.originalData && 
        aiResultPreview.value.originalData.suggestedTags && 
        Array.isArray(aiResultPreview.value.originalData.suggestedTags)) {
      const addedTags = new Set();
      aiResultPreview.value.originalData.suggestedTags.forEach(tag => {
        if (!newPostTags.value.includes(tag) && addedTags.size < 3) {
          quickAddTag(tag);
          addedTags.add(tag);
        }
      });
    }
  } else if (aiResultPreview.value.type === 'image') {
    // 接受图片结果
    if (newPostImages.value.length < 9) {
      newPostImages.value.push(aiResultPreview.value.content);
    } else {
      // 显示错误提示
      const errorToast = document.createElement('div');
      errorToast.className = 'ai-loading-toast error';
      errorToast.innerHTML = '<span class="ai-error-icon">!</span><span>已达到图片上限（9张），请先删除一些图片</span>';
      document.body.appendChild(errorToast);
      
      setTimeout(() => {
        if (document.body.contains(errorToast)) {
          document.body.removeChild(errorToast);
        }
      }, 2000);
    }
  }
  
  // 关闭预览
  closeAiPreview();
};

// 图片生成文案功能
const generateTextFromImage = async () => {
  if (!newPostImages.value.length) return;
  
  try {
    isGenerating.value = true;
    
    // 显示加载状态提示
    const loadingToast = document.createElement('div');
    loadingToast.className = 'ai-loading-toast';
    loadingToast.innerHTML = '<div class="ai-loading-spinner"></div><span>AI正在分析图片...</span>';
    document.body.appendChild(loadingToast);
    
    // 获取第一张图片作为分析对象
    const imageData = newPostImages.value[0];
    
    // 调用API进行图像分析
    const result = await generateTextFromImageAPI(imageData);
    
    // 显示AI预览结果
    aiResultPreview.value = {
      show: true,
      type: 'text',
      content: result.generatedText,
      originalData: result
    };
    
    // 移除加载提示
    if (document.body.contains(loadingToast)) {
      document.body.removeChild(loadingToast);
    }
    
  } catch (error) {
    console.error('生成文案失败:', error);
    // 错误处理已在API函数中完成
  } finally {
    isGenerating.value = false;
  }
};

// 文案生成图片功能
const generateImageFromText = async () => {
  if (!newPost.value.trim()) return;
  
  try {
    isGenerating.value = true;
    
    // 显示加载状态提示
    const loadingToast = document.createElement('div');
    loadingToast.className = 'ai-loading-toast';
    loadingToast.innerHTML = '<div class="ai-loading-spinner"></div><span>AI正在生成图片...</span>';
    document.body.appendChild(loadingToast);
    
    // 获取文本内容
    const textContent = newPost.value.trim();
    
    // 调用API生成图片
    const result = await generateImageFromTextAPI(textContent);
    
    // 移除加载提示
    if (document.body.contains(loadingToast)) {
      document.body.removeChild(loadingToast);
    }
    
    // 显示预览
    if (result && result.imageUrl) {
      // 创建一个Image对象来加载图片
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // 处理跨域问题
      
      img.onload = () => {
        // 创建canvas来处理图片
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // 转换为base64格式
        const dataUrl = canvas.toDataURL('image/jpeg');
        
        // 显示预览
        aiResultPreview.value = {
          show: true,
          type: 'image',
          content: dataUrl,
          originalData: result
        };
      };
      
      img.onerror = () => {
        console.error('图片加载失败');
        const errorToast = document.createElement('div');
        errorToast.className = 'ai-loading-toast error';
        errorToast.innerHTML = '<span class="ai-error-icon">!</span><span>图片加载失败，请稍后再试</span>';
        document.body.appendChild(errorToast);
        
        setTimeout(() => {
          if (document.body.contains(errorToast)) {
            document.body.removeChild(errorToast);
          }
        }, 2000);
      };
      
      img.src = result.imageUrl;
    }
    
  } catch (error) {
    console.error('生成图片失败:', error);
    // 错误处理已在API函数中完成
  } finally {
    isGenerating.value = false;
  }
};
</script>

<style scoped>
.friend-circle {
  max-width: 100%;
  margin: 0;
  padding: 0;
  background: #f0f2f5;
  min-height: 100vh;
}
.fc-nav {
  display: flex;
  align-items: center;
  gap: 2.5rem;
  padding: 1.5rem 2.5rem;
  background: #fff;
  border-radius: 0 0 18px 18px;
  margin-bottom: 2.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.nav-link {
  color: #07c160;
  text-decoration: none;
  font-size: 1.25rem;
}
.nav-link:hover {
  text-decoration: underline;
}
.user-info {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e5e5;
  background: #fff;
}
.user-avatar {
  width: 48px;
  height: 48px;
}
.post-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 2rem;
  padding: 0 1.5rem;
  @media (min-width: 1280px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0 1rem;
  }
}

.post-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  animation: cardEnter 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes cardEnter {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
.post-item {
  margin-bottom: 0;
  display: flex;
}
.post-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  padding: 1.8rem 2rem 1.2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
  max-width: 600px;
  margin: 0 auto;
}
.post-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.post-author {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.author-name {
  font-size: 1.18rem;
  color: #222;
  font-weight: 600;
}
.post-time {
  font-size: 1.02rem;
  color: #888;
}
.post-content {
  font-size: 1.15rem;
  color: #333;
  margin: 0.4rem 0 0.7rem 0;
  word-break: break-all;
}
.post-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 10px 0;
}
.post-img {
  width: 100%;
  height: 120px;
  max-width: 100%;
  max-height: 120px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #eee;
  background: #fafafa;
}
.preview-image {
  width: 90px;
  height: 90px;
  max-width: 90px;
  max-height: 90px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #eee;
  background: #fafafa;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.2s ease;
}
.preview-image:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}
.post-actions {
  display: flex;
  gap: 2rem;
  align-items: center;
  margin-top: 0.3rem;
}
.like-btn, .comment-btn {
  background: none;
  border: none;
  color: #07c160;
  cursor: pointer;
  font-size: 1.08rem;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: color 0.2s;
}
.like-btn.liked {
  color: #e64340;
}
.like-btn:hover, .comment-btn:hover {
  text-decoration: underline;
}
.comment-dialog-mask {
  position: fixed;
  background: rgba(0,0,0,0.18);
  animation: popIn 0.18s cubic-bezier(.4,1.4,.6,1);
}

.comment-dialog {
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  background: #fff;
  border-radius: 12px;
}
.modern-dialog {
  animation: popIn 0.18s cubic-bezier(.4,1.4,.6,1);
}
.modern-dialog {
  max-width: 800px;
  width: 98%;
  min-width: 500px;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.13);
  background: #fff;
  padding: 32px;
  margin: 20px;
  overflow: visible;
}
.comment-dialog {
  background: #fff;
  border-radius: 14px;
  padding: 2rem 2.5rem;
  min-width: 400px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.13);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.comment-list {
  list-style: none;
  padding: 0;
  margin: 0 0 0.7rem 0;
  max-height: 180px;
  overflow-y: auto;
}
.comment-list li {
  padding: 0.4rem 0;
  border-bottom: 1px solid #f0f0f0;
  color: #444;
  font-size: 1.08rem;
}

/* 添加评论项样式 */
.comment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid #f0f0f0;
}

.comment-content-wrapper {
  flex: 1;
  overflow: hidden;
}
.comment-dialog input {
  border: 1.5px solid #e5e5e5;
  border-radius: 8px;
  padding: 0.7rem;
  font-size: 1.08rem;
  outline: none;
  background: #f7f7f7;
}
.comment-dialog button {
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.4rem;
  font-weight: bold;
  margin-top: 0.7rem;
  font-size: 1.08rem;
  cursor: pointer;
  transition: background 0.2s;
}
.comment-dialog button:hover {
  background: #059e4b;
}
.submit-comment-btn {
  background: #07c160;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  margin-left: 8px;
}
.dialog-header {
  position: relative;
  padding-right: 40px;
}
.close-btn {
  position: absolute;
  right: 0;
  top: -8px;
  font-size: 24px;
}
.floating-post-btn {
  border: none;
}

/* 统一弹窗遮罩样式 */
.post-dialog-mask, .comment-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* 调整弹窗内容定位 */
.modern-dialog, .comment-dialog {
  position: relative;
  margin: 0;
  max-width: 600px;
  width: 90%;
  transform: translateY(0);
  top: auto;
  left: auto;
}
.floating-post-btn {
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 1000;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #07c160 20%, #059e4b);
  box-shadow: 0 6px 16px rgba(7,193,96,0.3);
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
}
.fab-icon {
  font-size: 28px;
  color: white;
  display: block;
  transform: rotate(0);
  transition: transform 0.2s;
}
.floating-post-btn:hover {
  transform: scale(1.08) translateY(-2px);
  box-shadow: 0 8px 24px rgba(7,193,96,0.4);
}
.floating-post-btn:active {
  transform: scale(0.96);
}

.modern-dialog {
  max-width: 600px;
  width: 90%;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.13);
  background: #fff;
  padding: 24px;
  overflow: hidden;
  animation: popIn 0.18s cubic-bezier(.4,1.4,.6,1) 1;
}
@keyframes popIn {
  0% { transform: scale(0.96); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modern-upload {
  padding: 0 24px 12px;
}
.image-upload-section {
  position: relative;
  margin: 1rem 0;
  .upload-progress {
    height: 4px;
    background: rgba(0,0,0,0.1);
    border-radius: 2px;
    overflow: hidden;
    &::after {
      content: '';
      display: block;
      width: var(--progress);
      height: 100%;
      background: #07c160;
      transition: width 0.3s ease;
    }
  }
  .progress-text {
    position: absolute;
    right: 0;
    bottom: 100%;
    font-size: 12px;
    color: #07c160;
  }
}

.modern-upload-btn {
  transition: all 0.2s ease;
  &:hover {
    background: #07c160;
    color: white;
    box-shadow: 0 4px 12px rgba(7,193,96,0.3);
  }
}

.hidden-input {
  display: none;
}
.modern-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 0 24px 18px;
  margin-top: 8px;
}
.modern-preview-item {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(7,193,96,0.08);
}

.modern-publish-btn {
  background: linear-gradient(135deg, #07c160 20%, #059e4b);
  font-size: 1.08rem;
  font-weight: bold;
  letter-spacing: 1px;
  border-radius: 8px;
  padding: 13px 0;
  margin-top: 0;
  box-shadow: 0 2px 8px rgba(7,193,96,0.18);
}
.publish-btn {
  width: 100%;
  background: linear-gradient(135deg, #07c160 20%, #059e4b);
  color: white;
  padding: 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: opacity 0.2s;
  box-shadow: 0 2px 8px rgba(7,193,96,0.18);
}
.publish-btn.disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
@keyframes heartBlast {
  0% { transform: scale(1); }
  50% { transform: scale(1.4); }
  100% { transform: scale(1); }
}
.liked {
  animation: heartBlast 0.45s ease;
  color: #ff2d55 !important;
}
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}

.dialog-header h3 {
  font-size: 1.4rem;
  color: #1d1d1f;
}

.close-icon {
  font-size: 1.8rem;
  padding: 6px;
  transition: all 0.2s;
}

.close-icon:hover {
  transform: scale(1.1);
  color: #ff453a;
}

.modern-publish-btn {
  padding: 12px 28px;
  font-size: 1.05rem;
}

.modern-publish-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.post-textarea {
  line-height: 1.6;
  min-height: 100px;
  padding: 12px;
}
.tag-input-section {
  margin: 10px 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tag-input-wrapper {
  position: relative;
  width: 100%;
}

.tag-input {
  border: 1.5px solid #e5e5e5;
  border-radius: 8px;
  padding: 5px 6px;
  font-size: 1rem;
  outline: none;
  background: #f7f7f7;
  width: 80%;
  min-height: 60px; /* 减小高度 */
  resize: vertical; /* 允许用户调整高度 */
  transition: border-color 0.2s, box-shadow 0.2s;
  margin-bottom: 10px;
}

.comment-textarea:focus {
  border-color: #07c160;
  box-shadow: 0 0 0 2px rgba(7, 193, 96, 0.2);
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  min-height: 32px;
  padding: 4px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.tag-list.drag-over {
  background-color: rgba(7, 193, 96, 0.1);
}

.tag-chip {
  background: #e6f9f0;
  color: #07c160;
  border-radius: 12px;
  padding: 4px 10px 4px 8px;
  font-size: 0.98rem;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
}

.tag-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.tag-chip.dragging {
  opacity: 0.5;
}

.remove-tag-btn {
  background: none;
  border: none;
  color: #e64340;
  font-size: 1.1rem;
  cursor: pointer;
  margin-left: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.remove-tag-btn:hover {
  background-color: rgba(230, 67, 64, 0.1);
}

/* 常用标签区域样式 */
.common-tags-section {
  margin-bottom: 8px;
}

.common-tags-title {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 6px;
  display: block;
}

.common-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.common-tag-item {
  background: #e6f9f0;
  color: #333;
  border-radius: 12px;
  padding: 4px 10px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.common-tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* 标签建议列表样式 */
.tag-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;
}

.tag-suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
  border-left: 3px solid #07c160;
  transition: background-color 0.2s;
}

.tag-suggestion-item:hover {
  background-color: #f5f5f5;
}

.tag-suggestion-item:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}
.post-tags {
  margin: 0.2rem 0 0.5rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.post-tag {
  background: #f2f2f2;
  color: #07c160;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 0.95rem;
}
.modern-dialog button {
  background: #07c160;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  margin-left: 8px;
}
.dialog-header {
  position: relative;
  padding-right: 40px;
}
.close-btn {
  position: absolute;
  right: 0;
  top: -8px;
  font-size: 24px;
}
.floating-post-btn {
  border: none;
}

/* 统一弹窗遮罩样式 */
.post-dialog-mask, .comment-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* 调整弹窗内容定位 */
.modern-dialog, .comment-dialog {
  position: relative;
  margin: 0;
  max-width: 600px;
  width: 90%;
  transform: translateY(0);
  top: auto;
  left: auto;
}
.floating-post-btn {
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 1000;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #07c160 20%, #059e4b);
  box-shadow: 0 6px 16px rgba(7,193,96,0.3);
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
}
.fab-icon {
  font-size: 28px;
  color: white;
  display: block;
  transform: rotate(0);
  transition: transform 0.2s;
}
.floating-post-btn:hover {
  transform: scale(1.08) translateY(-2px);
  box-shadow: 0 8px 24px rgba(7,193,96,0.4);
}
.floating-post-btn:active {
  transform: scale(0.96);
}

.modern-dialog {
  max-width: 600px;
  width: 90%;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.13);
  background: #fff;
  padding: 24px;
  overflow: hidden;
  animation: popIn 0.18s cubic-bezier(.4,1.4,.6,1) 1;
}
@keyframes popIn {
  0% { transform: scale(0.96); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modern-upload {
  padding: 0 24px 12px;
}
.image-upload-section {
  position: relative;
  margin: 1rem 0;
  .upload-progress {
    height: 4px;
    background: rgba(0,0,0,0.1);
    border-radius: 2px;
    overflow: hidden;
    &::after {
      content: '';
      display: block;
      width: var(--progress);
      height: 100%;
      background: #07c160;
      transition: width 0.3s ease;
    }
  }
  .progress-text {
    position: absolute;
    right: 0;
    bottom: 100%;
    font-size: 12px;
    color: #07c160;
  }
}

.modern-upload-btn {
  transition: all 0.2s ease;
  &:hover {
    background: #07c160;
    color: white;
    box-shadow: 0 4px 12px rgba(7,193,96,0.3);
  }
}

.hidden-input {
  display: none;
}
.modern-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 0 24px 18px;
  margin-top: 8px;
}
.modern-preview-item {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(7,193,96,0.08);
}

.modern-publish-btn {
  background: linear-gradient(135deg, #07c160 20%, #059e4b);
  font-size: 1.08rem;
  font-weight: bold;
  letter-spacing: 1px;
  border-radius: 8px;
  padding: 13px 0;
  margin-top: 0;
  box-shadow: 0 2px 8px rgba(7,193,96,0.18);
}
.publish-btn {
  width: 100%;
  background: linear-gradient(135deg, #07c160 20%, #059e4b);
  color: white;
  padding: 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: opacity 0.2s;
  box-shadow: 0 2px 8px rgba(7,193,96,0.18);
}
.publish-btn.disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
@keyframes heartBlast {
  0% { transform: scale(1); }
  50% { transform: scale(1.4); }
  100% { transform: scale(1); }
}
.liked {
  animation: heartBlast 0.45s ease;
  color: #ff2d55 !important;
}
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}

.dialog-header h3 {
  font-size: 1.4rem;
  color: #1d1d1f;
}

.close-icon {
  font-size: 1.8rem;
  padding: 6px;
  transition: all 0.2s;
}

.close-icon:hover {
  transform: scale(1.1);
  color: #ff453a;
}

.modern-publish-btn {
  padding: 12px 28px;
  font-size: 1.05rem;
}

.modern-publish-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.post-textarea {
  line-height: 1.6;
  min-height: 100px;
  padding: 12px;
}

/* 添加删除按钮样式 */
.delete-btn {
  position: absolute;
  right: 0;
  top: 0;
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  opacity: 1;
  background: rgba(255, 77, 79, 0.1);
}

/* AI功能按钮的CSS样式 */
.ai-features {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.ai-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f0f9f4;
  border: 1px solid #d0e9d9;
  color: #07c160;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.ai-btn:hover:not(.disabled) {
  background: #e0f5e9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(7, 193, 96, 0.15);
}

.ai-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f5f5f5;
  border-color: #e5e5e5;
  color: #999;
}

.ai-icon {
  font-size: 1.2rem;
}

/* AI加载提示样式 */
.ai-loading-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.ai-loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

.ai-loading-toast.success {
  background: rgba(7, 193, 96, 0.9);
}

.ai-loading-toast.error {
  background: rgba(255, 59, 48, 0.9);
}

.ai-success-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.ai-error-icon {
  font-size: 1.2rem;
  font-weight: bold;
  display: inline-block;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  border-radius: 50%;
  background: white;
  color: #ff3b30;
}

/* AI生成结果预览 */
.ai-result-preview {
  margin-top: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

.ai-result-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ai-result-preview-title {
  font-weight: 600;
  color: #07c160;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-result-content {
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #eee;
  margin-bottom: 8px;
}

.ai-result-actions {
  display: flex;
  gap: 8px;
}

.ai-result-action-btn {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.ai-result-action-btn:hover {
  background: #f0f9f4;
  border-color: #07c160;
  color: #07c160;
}

.ai-generated-image {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: block;
  margin: 0 auto;
}

.accept-btn {
  background: #f0f9f4;
  color: #07c160;
  border-color: #d0e9d9;
  display: flex;
  align-items: center;
  gap: 4px;
}

.accept-btn:hover {
  background: #e0f5e9;
  color: #059e4b;
  border-color: #07c160;
}

.reject-btn {
  background: #fff9f9;
  color: #ff3b30;
  border-color: #ffe5e5;
  display: flex;
  align-items: center;
  gap: 4px;
}

.reject-btn:hover {
  background: #fff0f0;
  color: #ff2d2d;
  border-color: #ff3b30;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.delete-comment-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  padding: 0 3px;
  opacity: 0.6;
  transition: all 0.2s;
  margin-left: auto;
}

.delete-comment-btn:hover {
  color: #ff4d4f;
  opacity: 1;
}

/* 添加删除按钮样式 */
.delete-btn {
  position: absolute;
  right: 0;
  top: 0;
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  opacity: 1;
  background: rgba(255, 77, 79, 0.1);
}

/* AI功能按钮的CSS样式 */
.ai-features {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.ai-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f0f9f4;
  border: 1px solid #d0e9d9;
  color: #07c160;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.ai-btn:hover:not(.disabled) {
  background: #e0f5e9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(7, 193, 96, 0.15);
}

.ai-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f5f5f5;
  border-color: #e5e5e5;
  color: #999;
}

.ai-icon {
  font-size: 1.2rem;
}

/* AI加载提示样式 */
.ai-loading-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.ai-loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

.ai-loading-toast.success {
  background: rgba(7, 193, 96, 0.9);
}

.ai-loading-toast.error {
  background: rgba(255, 59, 48, 0.9);
}

.ai-success-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.ai-error-icon {
  font-size: 1.2rem;
  font-weight: bold;
  display: inline-block;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  border-radius: 50%;
  background: white;
  color: #ff3b30;
}

/* AI生成结果预览 */
.ai-result-preview {
  margin-top: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

.ai-result-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ai-result-preview-title {
  font-weight: 600;
  color: #07c160;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-result-content {
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #eee;
  margin-bottom: 8px;
}

.ai-result-actions {
  display: flex;
  gap: 8px;
}

.ai-result-action-btn {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.ai-result-action-btn:hover {
  background: #f0f9f4;
  border-color: #07c160;
  color: #07c160;
}

.ai-generated-image {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: block;
  margin: 0 auto;
}

.accept-btn {
  background: #f0f9f4;
  color: #07c160;
  border-color: #d0e9d9;
  display: flex;
  align-items: center;
  gap: 4px;
}

.accept-btn:hover {
  background: #e0f5e9;
  color: #059e4b;
  border-color: #07c160;
}

.reject-btn {
  background: #fff9f9;
  color: #ff3b30;
  border-color: #ffe5e5;
  display: flex;
  align-items: center;
  gap: 4px;
}

.reject-btn:hover {
  background: #fff0f0;
  color: #ff2d2d;
  border-color: #ff3b30;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* AI功能按钮的CSS样式 */
.ai-features {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.ai-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f0f9f4;
  border: 1px solid #d0e9d9;
  color: #07c160;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.ai-btn:hover:not(.disabled) {
  background: #e0f5e9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(7, 193, 96, 0.15);
}

.ai-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f5f5f5;
  border-color: #e5e5e5;
  color: #999;
}

.ai-icon {
  font-size: 1.2rem;
}

/* AI加载提示样式 */
.ai-loading-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.ai-loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

.ai-loading-toast.success {
  background: rgba(7, 193, 96, 0.9);
}

.ai-loading-toast.error {
  background: rgba(255, 59, 48, 0.9);
}

.ai-success-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.ai-error-icon {
  font-size: 1.2rem;
  font-weight: bold;
  display: inline-block;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  border-radius: 50%;
  background: white;
  color: #ff3b30;
}

/* AI生成结果预览 */
.ai-result-preview {
  margin-top: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

.ai-result-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ai-result-preview-title {
  font-weight: 600;
  color: #07c160;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-result-content {
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #eee;
  margin-bottom: 8px;
}

.ai-result-actions {
  display: flex;
  gap: 8px;
}

.ai-result-action-btn {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.ai-result-action-btn:hover {
  background: #f0f9f4;
  border-color: #07c160;
  color: #07c160;
}

.ai-generated-image {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: block;
  margin: 0 auto;
}

.accept-btn {
  background: #f0f9f4;
  color: #07c160;
  border-color: #d0e9d9;
  display: flex;
  align-items: center;
  gap: 4px;
}

.accept-btn:hover {
  background: #e0f5e9;
  color: #059e4b;
  border-color: #07c160;
}

.reject-btn {
  background: #fff9f9;
  color: #ff3b30;
  border-color: #ffe5e5;
  display: flex;
  align-items: center;
  gap: 4px;
}

.reject-btn:hover {
  background: #fff0f0;
  color: #ff2d2d;
  border-color: #ff3b30;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.modern-dialog button {
  background: #07c160;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  margin-left: 8px;
}
.dialog-header {
  position: relative;
  padding-right: 40px;
}
.close-btn {
  position: absolute;
  right: 0;
  top: -8px;
  font-size: 24px;
}
.floating-post-btn {
  border: none;
}

/* 统一弹窗遮罩样式 */
.post-dialog-mask, .comment-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* 调整弹窗内容定位 */
.modern-dialog, .comment-dialog {
  position: relative;
  margin: 0;
  max-width: 600px;
  width: 90%;
  transform: translateY(0);
  top: auto;
  left: auto;
}
.floating-post-btn {
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 1000;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #07c160 20%, #059e4b);
  box-shadow: 0 6px 16px rgba(7,193,96,0.3);
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
}
.fab-icon {
  font-size: 28px;
  color: white;
  display: block;
  transform: rotate(0);
  transition: transform 0.2s;
}
.floating-post-btn:hover {
  transform: scale(1.08) translateY(-2px);
  box-shadow: 0 8px 24px rgba(7,193,96,0.4);
}
.floating-post-btn:active {
  transform: scale(0.96);
}

.modern-dialog {
  max-width: 600px;
  width: 90%;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.13);
  background: #fff;
  padding: 24px;
  overflow: hidden;
  animation: popIn 0.18s cubic-bezier(.4,1.4,.6,1) 1;
}
@keyframes popIn {
  0% { transform: scale(0.96); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modern-upload {
  padding: 0 24px 12px;
}
.image-upload-section {
  position: relative;
  margin: 1rem 0;
  .upload-progress {
    height: 4px;
    background: rgba(0,0,0,0.1);
    border-radius: 2px;
    overflow: hidden;
    &::after {
      content: '';
      display: block;
      width: var(--progress);
      height: 100%;
      background: #07c160;
      transition: width 0.3s ease;
    }
  }
  .progress-text {
    position: absolute;
    right: 0;
    bottom: 100%;
    font-size: 12px;
    color: #07c160;
  }
}

.modern-upload-btn {
  transition: all 0.2s ease;
  &:hover {
    background: #07c160;
    color: white;
    box-shadow: 0 4px 12px rgba(7,193,96,0.3);
  }
}

.hidden-input {
  display: none;
}
.modern-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 0 24px 18px;
  margin-top: 8px;
}
.modern-preview-item {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(7,193,96,0.08);
}
.auto-tag-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  margin-left: 10px;
}

.auto-tag-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 20px;
}

.auto-tag-switch input:checked + .auto-tag-slider {
  background-color: #07c160;
}

.auto-tag-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.auto-tag-switch input:checked + .auto-tag-slider:before {
  transform: translateX(20px);
}

.auto-tag-label {
  margin-left: 45px;
  font-size: 0.85rem;
  color: #666;
}

.auto-tag-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.common-tags-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
</style>