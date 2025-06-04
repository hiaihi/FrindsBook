<template>
  <div class="friendlist-root">
    <div class="sidebar">
      <div class="search-bar">
        <fluent-search-24-regular class="search-icon" />
        <input v-model="searchQuery" :placeholder="'搜索好友'" @input="onSearch" />
        <div class="tag-list">
          <span v-for="tag in tags" :key="tag" :class="['tag', {active: searchTag===tag}]" @click="toggleTag(tag)">{{ tag }}</span>
        </div>
      </div>
      <div class="group-panel">
        <div v-for="group in groupOrder" :key="group" class="group-block">
          <div class="group-header" :class="{collapsed: !groupState[group]}" @click="toggleGroup(group)" @dragover.prevent @drop="onDropGroup(group)">
            <fluent-chevron-down-24-regular v-if="groupState[group]" class="chevron" />
            <fluent-chevron-right-24-regular v-else class="chevron" />
            <span>{{ group }}</span>
            <span class="group-count">{{ filteredFriendsByGroup(group).length }}</span>
          </div>
          <transition name="fade">
            <div v-show="groupState[group]" class="friend-list">
              <div v-for="friend in filteredFriendsByGroup(group)" :key="friend.id" class="friend-card" :class="{selected: selectedFriend && selectedFriend.id===friend.id}" draggable="true" @dragstart="onDragStart(friend)" @click="selectFriend(friend)" @mouseenter="hoveredFriend=friend.id" @mouseleave="hoveredFriend=null">
                <img :src="friend.avatar" class="avatar" @error="handleImageError" />
                <div class="info">
                  <span class="nickname">{{ friend.nickname }}</span>
                  <span v-if="hoveredFriend===friend.id && friend.remark" class="remark">{{ friend.remark }}</span>
                </div>
                <span class="status-dot" :class="friend.online?'online':'offline'"></span>
                <span v-if="friend.unread>0" class="badge">{{ friend.unread }}</span>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
    <div class="chat-area">
      <div v-if="!selectedFriend" class="brand-placeholder">
        <img src="https://picsum.photos/220/180" class="brand-illustration" alt="brand" />
        <div class="brand-text">选择好友开始畅聊</div>
        <div class="brand-actions">
          <button class="action-btn" @mouseenter="hoverAction=1" @mouseleave="hoverAction=0">
            <fluent-people-add-24-regular />
            <span :class="{fade: hoverAction===1}">查看新请求</span>
          </button>
          <button class="action-btn" @mouseenter="hoverAction=2" @mouseleave="hoverAction=0">
            <fluent-person-search-24-regular />
            <span :class="{fade: hoverAction===2}">探索推荐好友</span>
          </button>
        </div>
      </div>
      <div v-else class="chat-frame">
        <div class="chat-header">
          <img :src="selectedFriend.avatar" class="avatar" />
          <span class="nickname">{{ selectedFriend.nickname }}</span>
          <span v-if="selectedFriend.remark" class="remark">({{ selectedFriend.remark }})</span>
          <span class="status-dot" :class="selectedFriend.online?'online':'offline'"></span>
          <span class="chat-status">{{ selectedFriend.online ? '在线' : '离线' }}</span>
          <div class="chat-tools">
            <fluent-call-24-regular class="tool-icon" title="语音通话" />
            <fluent-video-24-regular class="tool-icon" title="视频通话" />
            <fluent-more-horizontal-24-regular class="tool-icon" title="更多" @click="showSettingPanel = true" />
          </div>
        </div>
        <div v-if="showSettingPanel" class="friend-setting-panel-mask" @click.self="showSettingPanel = false">
          <div class="friend-setting-panel">
            <div class="setting-header">
              好友设置
              <span class="close-btn" @click="showSettingPanel = false">×</span>
            </div>
            <div class="setting-body">
              <div class="setting-item">
                <label>备注名：</label>
                <input v-model="settingRemark" placeholder="请输入备注" />
                <button @click="saveRemark">保存</button>
                <span v-if="remarkSaved" class="save-feedback">已保存</span>
              </div>
              <div class="setting-item">
                <label>分组：</label>
                <select v-model="settingGroup">
                  <option v-for="group in groupOrder" :key="group" :value="group">{{ group }}</option>
                </select>
                <button @click="saveGroup">保存</button>
                <span v-if="groupSaved" class="save-feedback">已保存</span>
              </div>
              <div class="setting-item">
                <label>消息免打扰：</label>
                <input type="checkbox" v-model="settingMute" />
              </div>
              <div class="setting-item">
                <label>拉黑：</label>
                <input type="checkbox" v-model="settingBlock" />
              </div>
              <div class="setting-item danger">
                <button class="delete-btn" @click="deleteFriend">删除好友</button>
                <span v-if="deleteFeedback" class="delete-feedback">已删除（仅前端模拟）</span>
              </div>
            </div>
          </div>
        </div>
        <div class="chat-content" ref="chatContent">
          <div v-if="getChatMessages(selectedFriend.id).length === 0" class="empty-chat">
            <fluent-chat-24-regular class="empty-icon" />
            <span class="empty-tip">暂无消息，快来开启对话吧！</span>
          </div>
          <template v-else>
            <div v-for="(message, index) in getChatMessages(selectedFriend.id)" :key="index" class="message-wrapper">
              <!-- 日期分隔线 -->
              <div v-if="showDateDivider(message, index)" class="date-divider">
                <span>{{ formatMessageDate(message.timestamp) }}</span>
              </div>
              
              <!-- 消息气泡 -->
              <div :class="['message', message.isSelf ? 'self' : 'friend']">
                <template v-if="!message.isSelf">
                  <img :src="selectedFriend.avatar" class="avatar" @error="handleImageError" />
                  <div class="message-content">
                    <div class="message-bubble">
                      <template v-if="message.type === 'text'">
                        <span>{{ message.content }}</span>
                      </template>
                      <template v-else-if="message.type === 'image'">
                        <img :src="message.content" class="message-image" />
                      </template>
                      <template v-else-if="message.type === 'emoji'">
                        <span class="emoji">{{ message.content }}</span>
                      </template>
                    </div>
                    <span class="message-time">{{ formatMessageTime(message.timestamp) }}</span>
                  </div>
                </template>
                <template v-else>
                  <img src="https://picsum.photos/50/50?random=0" class="avatar self" @error="handleImageError" />
                  <div class="message-content">
                    <div class="message-bubble">
                      <template v-if="message.type === 'text'">
                        <span>{{ message.content }}</span>
                      </template>
                      <template v-else-if="message.type === 'image'">
                        <img :src="message.content" class="message-image" />
                      </template>
                      <template v-else-if="message.type === 'emoji'">
                        <span class="emoji">{{ message.content }}</span>
                      </template>
                    </div>
                    <span class="message-time">{{ formatMessageTime(message.timestamp) }}</span>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
        <div class="chat-toolbar">
          <div class="toolbar-icons">
            <fluent-emoji-24-regular class="tool-icon" @click="toggleEmojiPanel" />
            <fluent-image-24-regular class="tool-icon" />
            <fluent-document-24-regular class="tool-icon" />
            <fluent-history-24-regular class="tool-icon" title="聊天记录" />
          </div>
          <div v-if="showEmojiPanel" class="emoji-panel">
            <div v-for="emoji in emojis" :key="emoji" class="emoji-item" @click="insertEmoji(emoji)">
              {{ emoji }}
            </div>
          </div>
        </div>
        <div class="chat-input-bar">
          <textarea 
            v-model="messageInput" 
            class="chat-input" 
            placeholder="输入消息..." 
            @keydown.enter.prevent="sendMessage"
            @focus="showEmojiPanel = false"
          ></textarea>
          <button class="send-btn" :disabled="!messageInput.trim()" @click="sendMessage">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue';
import FluentSearch24Regular from 'virtual:icons/fluent/search-24-regular';
import FluentChevronDown24Regular from 'virtual:icons/fluent/chevron-down-24-regular';
import FluentChevronRight24Regular from 'virtual:icons/fluent/chevron-right-24-regular';
import FluentPeopleAdd24Regular from 'virtual:icons/fluent/people-add-24-regular';
import FluentPersonSearch24Regular from 'virtual:icons/fluent/person-search-24-regular';
import FluentEmoji24Regular from 'virtual:icons/fluent/emoji-24-regular';
import FluentImage24Regular from 'virtual:icons/fluent/image-24-regular';
import FluentDocument24Regular from 'virtual:icons/fluent/document-24-regular';
import FluentHistory24Regular from 'virtual:icons/fluent/history-24-regular';
import FluentCall24Regular from 'virtual:icons/fluent/call-24-regular';
import FluentVideo24Regular from 'virtual:icons/fluent/video-24-regular';
import FluentMoreHorizontal24Regular from 'virtual:icons/fluent/more-horizontal-24-regular';
import FluentChat24Regular from 'virtual:icons/fluent/chat-24-regular';

const tags = ["游戏", "摄影", "北京"];
const groupOrder = ["全部好友", "游戏组", "摄影组", "北京"];
const groupState = reactive({
  "全部好友": true,
  "游戏组": false,
  "摄影组": false,
  "北京": false
});
const friends = ref([
  {id:1, avatar:'https://picsum.photos/50/50?random=1', nickname:'小明', remark:'王小明', online:true, group:'全部好友', tags:['游戏','北京'], unread:2},
  {id:2, avatar:'https://picsum.photos/50/50?random=2', nickname:'小红', remark:'摄影达人', online:false, group:'摄影组', tags:['摄影'], unread:0},
  {id:3, avatar:'https://picsum.photos/50/50?random=3', nickname:'阿伟', remark:'', online:true, group:'游戏组', tags:['游戏'], unread:5},
  {id:4, avatar:'https://picsum.photos/50/50?random=4', nickname:'小芳', remark:'北京老友', online:false, group:'北京', tags:['北京'], unread:0},
  {id:5, avatar:'https://picsum.photos/50/50?random=5', nickname:'老李', remark:'', online:true, group:'全部好友', tags:['摄影'], unread:0}
]);

// 聊天相关数据
const chatMessages = reactive({
  1: [
    { id: 1, content: '你好啊，最近怎么样？', type: 'text', timestamp: Date.now() - 86400000, isSelf: false },
    { id: 2, content: '我很好，谢谢关心！', type: 'text', timestamp: Date.now() - 86000000, isSelf: true },
    { id: 3, content: '周末有空一起打游戏吗？', type: 'text', timestamp: Date.now() - 3600000, isSelf: false },
    { id: 4, content: '当然可以，我已经准备好了！', type: 'text', timestamp: Date.now() - 3500000, isSelf: true },
    { id: 5, content: '😄', type: 'emoji', timestamp: Date.now() - 60000, isSelf: false },
  ],
  3: [
    { id: 1, content: '嘿，新游戏出了，一起玩吗？', type: 'text', timestamp: Date.now() - 172800000, isSelf: false },
    { id: 2, content: '好啊，什么游戏？', type: 'text', timestamp: Date.now() - 172700000, isSelf: true },
    { id: 3, content: 'https://picsum.photos/300/200?random=10', type: 'image', timestamp: Date.now() - 172600000, isSelf: false },
    { id: 4, content: '看起来不错！', type: 'text', timestamp: Date.now() - 172500000, isSelf: true },
  ],
});

const searchQuery = ref('');
const searchTag = ref([]);
const hoveredFriend = ref(null);
const selectedFriend = ref(null);
const hoverAction = ref(0);
let dragFriend = null;

// 聊天相关状态
const messageInput = ref('');
const chatContent = ref(null);
const showEmojiPanel = ref(false);
const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'];

function onSearch() {
  // 仅前端筛选，无需持久化
}

function toggleTag(tag) {
  const index = searchTag.value.indexOf(tag);
  if (index === -1) {
    searchTag.value.push(tag);
  } else {
    searchTag.value.splice(index, 1);
  }
}

function toggleGroup(group) {
  groupState[group] = !groupState[group];
}

function filteredFriendsByGroup(group) {
  let list = friends.value.filter(f => group==='全部好友' || f.group===group);
  if (searchQuery.value) {
    const q = searchQuery.value.trim();
    list = list.filter(f => f.nickname.includes(q) || (f.remark && f.remark.includes(q)) || String(f.id).includes(q));
  }
  if (searchTag.value.length > 0) {
    list = list.filter(f => searchTag.value.every(tag => f.tags.includes(tag)));
  }
  return list;
}

function onDragStart(friend) {
  dragFriend = friend;
}

function onDropGroup(group) {
  if (dragFriend) {
    dragFriend.group = group;
    dragFriend = null;
  }
}

function selectFriend(friend) {
  selectedFriend.value = friend;
  // 清除未读消息
  if (friend.unread > 0) {
    friend.unread = 0;
  }
  // 滚动到最新消息
  nextTick(() => {
    scrollToBottom();
  });
}

const handleImageError = (e) => {
  e.target.src = 'https://cdn.jsdelivr.net/gh/trae-ai/brand-assets/default-avatar.svg';
}

// 聊天相关方法
function getChatMessages(friendId) {
  return chatMessages[friendId] || [];
}

function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  return date.getHours().toString().padStart(2, '0') + ':' + 
         date.getMinutes().toString().padStart(2, '0');
}

function formatMessageDate(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return '今天';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天';
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
}

function showDateDivider(message, index) {
  if (index === 0) return true;
  
  const prevMessage = getChatMessages(selectedFriend.value.id)[index - 1];
  const prevDate = new Date(prevMessage.timestamp).toDateString();
  const currentDate = new Date(message.timestamp).toDateString();
  
  return prevDate !== currentDate;
}

function sendMessage() {
  if (!messageInput.value.trim()) return;
  
  const friendId = selectedFriend.value.id;
  if (!chatMessages[friendId]) {
    chatMessages[friendId] = [];
  }
  
  const newMessage = {
    id: chatMessages[friendId].length + 1,
    content: messageInput.value,
    type: 'text',
    timestamp: Date.now(),
    isSelf: true
  };
  
  chatMessages[friendId].push(newMessage);
  messageInput.value = '';
  
  // 模拟好友回复
  setTimeout(() => {
    const replies = [
      '好的，没问题！',
      '我明白了',
      '稍等，我看看',
      '😄',
      '有空再聊吧',
      '这个想法不错！'
    ];
    
    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    const replyMessage = {
      id: chatMessages[friendId].length + 1,
      content: randomReply,
      type: randomReply.includes('😄') ? 'emoji' : 'text',
      timestamp: Date.now(),
      isSelf: false
    };
    
    chatMessages[friendId].push(replyMessage);
    scrollToBottom();
  }, 1000 + Math.random() * 2000);
  
  nextTick(() => {
    scrollToBottom();
  });
}

function scrollToBottom() {
  if (chatContent.value) {
    chatContent.value.scrollTop = chatContent.value.scrollHeight;
  }
}

function toggleEmojiPanel() {
  showEmojiPanel.value = !showEmojiPanel.value;
}

function insertEmoji(emoji) {
  messageInput.value += emoji;
  showEmojiPanel.value = false;
}

onMounted(() => {
  // 初始化时滚动到底部
  scrollToBottom();
});

//好友设置相关
const showSettingPanel = ref(false);
const settingRemark = ref('');
const settingGroup = ref('');
const settingMute = ref(false);
const settingBlock = ref(false);
const remarkSaved = ref(false);
const groupSaved = ref(false);
const deleteFeedback = ref(false);

const saveRemark = () => {
  if (selectedFriend.value) {
    selectedFriend.value.remark = settingRemark.value;
    remarkSaved.value = true;
    setTimeout(() => remarkSaved.value = false, 2000);
  }
};

const saveGroup = () => {
  if (selectedFriend.value) {
    selectedFriend.value.group = settingGroup.value;
    groupSaved.value = true;
    setTimeout(() => groupSaved.value = false, 2000);
  }
};

const deleteFriend = () => {
  if (selectedFriend.value) {
    friends.value = friends.value.filter(f => f.id !== selectedFriend.value.id);
    deleteFeedback.value = true;
    setTimeout(() => {
      deleteFeedback.value = false;
      selectedFriend.value = null;
      showSettingPanel.value = false;
    }, 2000);
  }
};

const closeSettingPanel = () => {
  showSettingPanel.value = false;
};
</script>

<style scoped>
.friendlist-root {
  display: flex;
  height: 100vh;
  background: #F0F2F5;
}
.sidebar {
  width: 25%;
  min-width: 280px;
  background: #fff;
  box-shadow: 2px 0 12px rgba(88,149,240,0.08);
  display: flex;
  flex-direction: column;
  padding: 0 0.5rem;
}
.search-bar {
  padding: 1rem 0.8rem 0.5rem 0.8rem;
  border-bottom: 1px solid #e5e5e5;
  background: #F0F2F5;
  position: sticky;
  top: 0;
  z-index: 2;
}
.search-bar input {
  width: 80%;
  padding: 0.5rem 1.8rem 0.5rem 1.8rem;
  border-radius: 20px;
  border: none;
  background: #fff;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(88,149,240,0.05);
  outline: none;
  transition: box-shadow 0.2s;
}
.search-bar input:focus {
  box-shadow: 0 4px 16px rgba(88,149,240,0.12);
}
.search-icon {
  position: absolute;
  left: 1.2rem;
  top: 1.4rem;
  color: #5895F0;
  font-size: 1.2rem;
}
.tag-list {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
}
.tag {
  background: #eaf2fd;
  color: #5895F0;
  border-radius: 12px;
  padding: 0.2rem 0.8rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.tag.active, .tag:hover {
  background: #5895F0;
  color: #fff;
}
.group-panel {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}
.group-block {
  margin-bottom: 0.6rem;
}
.group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-weight: bold;
  font-size: 1.05rem;
  background: #f7faff;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 1px 4px rgba(88,149,240,0.04);
  transition: box-shadow 0.2s, background 0.2s;
}
.group-header:hover {
  background: #eaf2fd;
  box-shadow: 0 2px 8px rgba(88,149,240,0.10);
}
.group-header.collapsed {
  background: #f0f2f5;
}
.group-count {
  margin-left: auto;
  color: #5895F0;
  font-size: 0.95rem;
}
.chevron {
  font-size: 1.1rem;
  color: #5895F0;
}
.friend-list {
  padding: 0.2rem 0.5rem 0.2rem 2.2rem;
}
.friend-card {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.5rem 0.7rem;
  margin-bottom: 0.2rem;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(88,149,240,0.04);
  transition: box-shadow 0.2s, transform 0.2s;
  position: relative;
}
.friend-card:hover {
  box-shadow: 0 4px 16px rgba(88,149,240,0.12);
  transform: translateY(-2px) scale(1.03);
}
.friend-card.selected {
  background: #eaf2fd;
  box-shadow: 0 4px 16px rgba(88,149,240,0.18);
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: #f0f2f5;
}
.info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.nickname {
  font-weight: 500;
  color: #222;
  font-size: 1.02rem;
}
.remark {
  font-size: 0.92rem;
  color: #5895F0;
  background: #f0f2f5;
  border-radius: 6px;
  padding: 0.1rem 0.4rem;
  margin-top: 2px;
  transition: opacity 0.2s;
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 0.3rem;
  background: #bbb;
  border: 1.5px solid #fff;
  box-shadow: 0 0 0 2px #f0f2f5;
}
.status-dot.online {
  background: #43d854;
}
.status-dot.offline {
  background: #bbb;
}
.badge {
  position: absolute;
  right: 12px;
  bottom: 8px;
  background: #5895F0;
  color: #fff;
  border-radius: 10px;
  font-size: 0.85rem;
  padding: 0.1rem 0.5rem;
  min-width: 18px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(88,149,240,0.18);
  animation: badge-pop 0.3s;
}
@keyframes badge-pop {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.chat-area {
  width: 70%;
  min-width: 480px;
  background: #F0F2F5;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.brand-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
}
.brand-illustration {
  width: 220px;
  height: 180px;
  margin-bottom: 1.2rem;
  opacity: 0.92;
}
.brand-text {
  font-size: 1.45rem;
  color: #5895F0;
  font-weight: bold;
  margin-bottom: 1.2rem;
}
.brand-actions {
  display: flex;
  gap: 1.5rem;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff;
  color: #5895F0;
  border: none;
  border-radius: 20px;
  padding: 0.6rem 1.3rem;
  font-size: 1.05rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(88,149,240,0.10);
  transition: transform 0.18s, box-shadow 0.18s, color 0.18s;
  position: relative;
  overflow: hidden;
}
.action-btn:hover {
  transform: scale(1.07);
  color: #fff;
  background: #5895F0;
  box-shadow: 0 4px 16px rgba(88,149,240,0.18);
}
.action-btn .fade {
  transition: color 0.18s;
  color: #fff;
}

.chat-frame {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 12px rgba(88,149,240,0.07);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  gap: 0.8rem;
}
.chat-header {
  display: flex;
  align-items: center;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid #eaeaea;
  font-weight: 500;
  color: #222;
  font-size: 1.02rem;
}
.chat-header .avatar {
  margin-right: 0.8rem;
}
.chat-header .nickname {
  font-weight: 600;
  font-size: 1.1rem;
}
.chat-header .remark {
  margin-left: 0.5rem;
}
.chat-status {
  margin-left: 0.5rem;
  font-size: 0.9rem;
  color: #888;
}
.chat-tools {
  margin-left: auto;
  display: flex;
  gap: 1rem;
}
.tool-icon {
  color: #5895F0;
  font-size: 1.2rem;
  cursor: pointer;
  transition: transform 0.2s;
}
.tool-icon:hover {
  transform: scale(1.15);
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0.2rem 1.5rem 0.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #aaa;
  gap: 1rem;
}
.empty-icon {
  font-size: 3rem;
  color: #d0e0ff;
}
.empty-tip {
  font-size: 1.1rem;
  color: #aaa;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.date-divider {
  text-align: center;
  margin: 0.8rem 0;
  position: relative;
}
.date-divider span {
  background: #f0f2f5;
  padding: 0.3rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  color: #888;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.date-divider:before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: #e0e0e0;
  z-index: -1;
}

.message {
  display: flex;
  gap: 0.8rem;
  max-width: 75%;
  margin: 0.3rem 1rem;
}
.message.friend {
  align-self: flex-start;
}
.message.self {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.message-bubble {
  padding: 0.8rem 1.2rem;
  border-radius: 16px;
  position: relative;
  word-break: break-word;
}
.message.friend .message-bubble {
  background: #f0f2f5;
  border-bottom-left-radius: 4px;
}
.message.self .message-bubble {
  background: #5895F0;
  color: white;
  border-bottom-right-radius: 4px;
  margin-bottom: 12px;
}

.message-time {
  font-size: 0.8rem;
  color: #888;
  padding: 0 0.5rem;
}
.message.self .message-time {
  text-align: right;
}

.message-image {
  max-width: 300px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}
.message-image:hover {
  transform: scale(1.03);
}

.emoji {
  font-size: 1.8rem;
  line-height: 1;
}

.chat-toolbar {
  position: relative;
  padding: 0.5rem 0;
}
.toolbar-icons {
  display: flex;
  gap: 1.2rem;
  padding: 0 0.5rem;
}
.emoji-panel {
  position: absolute;
  bottom: 100%;
  left: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.12);
  padding: 1.0rem;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 1rem;
  max-width: 360px;
  z-index: 10;
}
.emoji-item {
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.15rem;
  border-radius: 50%;
  text-align: center;
  transition: background 0.2s, border 0.2s;
}
.emoji-item:hover {
  background: #f0f2f5;
}

.chat-input-bar {
  position: relative;
  display: flex;
  gap: 1.2rem;
  align-items: flex-end;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
  margin-bottom: 1.5rem;
}
.chat-input {
  flex: 1;
  min-height: 72px;
  max-height: 180px;
  padding: 1.2rem 1.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 28px;
  resize: none;
  font-size: 1.18rem;
  line-height: 1.7;
  transition: border-color 0.2s;
}
.chat-input:focus {
  border-color: #5895F0;
  outline: none;
}
.send-btn {
  background: #5895F0;
  color: white;
  border: none;
  border-radius: 22px;
  padding: 0.8rem 2rem;
  font-size: 1.08rem;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
  margin-bottom: 24px;
}
.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.send-btn:not(:disabled):hover {
  transform: scale(1.07);
}

/* 滚动条样式 */
.chat-content::-webkit-scrollbar,
.group-panel::-webkit-scrollbar {
  width: 6px;
}
.chat-content::-webkit-scrollbar-track,
.group-panel::-webkit-scrollbar-track {
  background: rgba(240,242,245,0.5);
}
.chat-content::-webkit-scrollbar-thumb,
.group-panel::-webkit-scrollbar-thumb {
  background: #c1c9d1;
  border-radius: 3px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .friendlist-root {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: 40vh;
  }
  .chat-area {
    width: 100%;
    height: 60vh;
  }
}
.friend-setting-panel {
  background: white;
  border-radius: 16px;
  width: 420px;
  max-width: 90%;
  padding: 24px;
  box-shadow: 0 12px 48px rgba(0,0,0,0.16);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  border: 1px solid rgba(0,0,0,0.08);
  opacity: 0;
  animation: popIn 0.2s ease forwards;
}

.friend-setting-panel-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

@keyframes popIn {
  0% { transform: translate(-50%, -50%) scale(0.96); opacity: 0; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
.setting-header {
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  cursor: pointer;
  font-size: 1.5rem;
  color: #666;
}

.setting-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.setting-item label {
  min-width: 80px;
}

.setting-item input[type='text'],
.setting-item select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.setting-item button {
  padding: 0.5rem 1rem;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.setting-item.danger button {
  background: #e64340;
}

.save-feedback {
  color: #07c160;
  font-size: 0.9rem;
}

.delete-feedback {
  color: #e64340;
  font-size: 0.9rem;
}
</style>
