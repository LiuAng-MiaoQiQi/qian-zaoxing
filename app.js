// 统一时间格式：YYYY-MM-DD HH:MM:SS
function getLocalDateTimeStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
// 数据存储：以分为单位避免浮点误差
let members = JSON.parse(localStorage.getItem('hairbook_members')) || [];

function saveData() {
  localStorage.setItem('hairbook_members', JSON.stringify(members));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 获取本地日期字符串 YYYY-MM-DD
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// 渲染会员列表
function renderMemberList(filterText = '') {
  const listEl = document.getElementById('member-list');
  const countEl = document.getElementById('member-count');
  const filter = (filterText || document.getElementById('search-input').value.trim()).toLowerCase();
  
  const filtered = members.filter(m => {
    if (!filter) return true;
    return m.name.toLowerCase().includes(filter) || m.phone.includes(filter);
  });
  
  if (filtered.length === 0) {
    listEl.innerHTML = '<li class="member-item" style="justify-content:center;color:#999">暂无会员</li>';
  } else {
    listEl.innerHTML = filtered.map(m => `
      <li class="member-item" data-id="${m.id}">
        <div class="member-info">
          <div class="member-name">${m.name}</div>
          <div class="member-phone">${m.phone || '无手机号'}</div>
        </div>
        <div class="member-balance">¥${(m.balance / 100).toFixed(2)}</div>
      </li>
    `).join('');
  }
  countEl.textContent = `共有 ${members.length} 名会员`;
  
  document.querySelectorAll('.member-item').forEach(item => {
    item.addEventListener('click', function() {
      showMemberDetail(this.dataset.id);
    });
  });
}

// 显示会员详情
function showMemberDetail(id) {
  const member = members.find(m => m.id === id);
  if (!member) return;
  
  document.getElementById('detail-name').textContent = member.name;
  document.getElementById('detail-balance').textContent = '¥' + (member.balance / 100).toFixed(2);
  
  const recordsEl = document.getElementById('detail-records');
  if (!member.transactions || member.transactions.length === 0) {
    recordsEl.innerHTML = '<li class="record-item">暂无交易记录</li>';
  } else {
    recordsEl.innerHTML = member.transactions.slice().reverse().map(t => `
      <li class="record-item">
        <span>${t.type === 'recharge' ? '💰充值' : '💇消费'} ${t.note ? '- ' + t.note : ''}</span>
        <span class="record-type ${t.type}">${t.type === 'recharge' ? '+' : '-'}¥${(t.amount / 100).toFixed(2)}</span>
        <span style="color:#888; font-size:0.8em;">${t.date}</span>
      </li>
    `).join('');
  }
  
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('member-detail-page').classList.add('active');
  document.getElementById('member-detail-page').dataset.currentMemberId = id;
}

// 返回列表
function goBackToMembers() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('members-page').classList.add('active');
  renderMemberList();
}

// 更新汇总（含明细点击查看详情）
function updateSummary() {
  const totalMembers = members.length;
  const totalBalance = members.reduce((sum, m) => sum + m.balance, 0);
  const todayStr = getTodayStr();
  let todaySpend = 0;
  const todayDetails = [];
  
  members.forEach(m => {
    if (m.transactions) {
      m.transactions.forEach(t => {
        if (t.type === 'consume' && t.date.startsWith(todayStr)) {
          todaySpend += t.amount;
          todayDetails.push({
            memberName: m.name,
            amount: t.amount,
            note: t.note || '无备注',
            time: t.date.slice(11),
            fullDate: t.date,
            type: t.type
          });
        }
      });
    }
  });
  
  document.getElementById('total-members').textContent = totalMembers;
  document.getElementById('total-balance').textContent = '¥' + (totalBalance / 100).toFixed(2);
  document.getElementById('today-spend').textContent = '¥' + (todaySpend / 100).toFixed(2);
  
  const detailList = document.getElementById('today-detail-list');
  if (todayDetails.length === 0) {
    detailList.innerHTML = '<li class="record-item" style="justify-content:center;color:#999">今天还没有消费记录</li>';
  } else {
    detailList.innerHTML = todayDetails.map((d, index) => `
      <li class="record-item clickable" data-index="${index}" style="cursor:pointer;display:flex;flex-wrap:wrap;gap:4px 10px;">
        <span style="font-weight:500;">${d.memberName}</span>
        <span class="record-type consume">-¥${(d.amount / 100).toFixed(2)}</span>
        <span style="color:#888;font-size:0.85em;">${d.note}</span>
        <span style="color:#aaa;font-size:0.7em;margin-left:auto;">${d.time}</span>
      </li>
    `).join('');

    document.querySelectorAll('#today-detail-list .clickable').forEach(el => {
      el.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        const detail = todayDetails[index];
        if (detail) {
          showDetailModal(detail);
        }
      });
    });
  }
}

// 显示交易详情弹窗
function showDetailModal(detail) {
  document.getElementById('detail-modal-title').textContent = '💰 消费详情';
  document.getElementById('detail-member-name').textContent = detail.memberName || '未知会员';
  document.getElementById('detail-type').textContent = detail.type === 'consume' ? '消费' : '充值';
  document.getElementById('detail-amount').textContent = '-¥' + (detail.amount / 100).toFixed(2);
  document.getElementById('detail-note').textContent = detail.note || '无备注';
  document.getElementById('detail-time').textContent = detail.fullDate || detail.time || '未知时间';
  document.getElementById('detail-modal').classList.add('active');
}

// 关闭详情弹窗
document.getElementById('close-detail-modal').addEventListener('click', function() {
  document.getElementById('detail-modal').classList.remove('active');
});

// 添加会员
function addMember(name, phone) {
  const newMember = {
    id: generateId(),
    name,
    phone,
    balance: 0,
    transactions: []
  };
  members.push(newMember);
  saveData();
  renderMemberList();
  updateSummary();
}

// 删除会员
function deleteMember(id) {
  if (!confirm('确定要删除该会员吗？所有记录将丢失。')) return;
  members = members.filter(m => m.id !== id);
  saveData();
  updateSummary();
  goBackToMembers();
}

// 充值
function rechargeMember(id, amountYuan, note) {
  const member = members.find(m => m.id === id);
  if (!member) return false;
  const yuan = parseFloat(amountYuan);
  if (isNaN(yuan) || yuan <= 0) { alert('请输入有效金额'); return false; }
  const fen = Math.round(yuan * 100);
  member.balance += fen;
  member.transactions.push({
    type: 'recharge',
    amount: fen,
    note: note || '',
    date: getLocalDateTimeStr()
  });
  saveData();
  renderMemberList();
  updateSummary();
  showMemberDetail(id);
  return true;
}

// 消费
function consumeMember(id, amountYuan, note) {
  const member = members.find(m => m.id === id);
  if (!member) return false;
  const yuan = parseFloat(amountYuan);
  if (isNaN(yuan) || yuan <= 0) { alert('请输入有效金额'); return false; }
  const fen = Math.round(yuan * 100);
  if (fen > member.balance) { alert('余额不足！'); return false; }
  member.balance -= fen;
  member.transactions.push({
    type: 'consume',
    amount: fen,
    note: note || '',
    date: getLocalDateTimeStr()
  });
  saveData();
  renderMemberList();
  updateSummary();
  showMemberDetail(id);
  return true;
}

// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
  // 底部导航
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      if (tabName === 'members') {
        document.getElementById('members-page').classList.add('active');
        renderMemberList();
      } else {
        document.getElementById('summary-page').classList.add('active');
        updateSummary();
      }
    });
  });

  renderMemberList();
  updateSummary();

  // 添加会员弹窗
  document.getElementById('add-member-btn').addEventListener('click', () => {
    document.getElementById('add-modal').classList.add('active');
    document.getElementById('new-name').value = '';
    document.getElementById('new-phone').value = '';
  });
  document.getElementById('cancel-add').addEventListener('click', () => {
    document.getElementById('add-modal').classList.remove('active');
  });
  document.getElementById('confirm-add').addEventListener('click', () => {
    const name = document.getElementById('new-name').value.trim();
    const phone = document.getElementById('new-phone').value.trim();
    if (!name) { alert('请输入姓名'); return; }
    addMember(name, phone);
    document.getElementById('add-modal').classList.remove('active');
  });

  // 搜索
  document.getElementById('search-input').addEventListener('input', function() {
    renderMemberList(this.value);
  });

  // 返回按钮
  document.querySelector('.back-btn').addEventListener('click', goBackToMembers);

  // 删除会员
  document.getElementById('delete-member-btn').addEventListener('click', () => {
    const id = document.getElementById('member-detail-page').dataset.currentMemberId;
    if (id) deleteMember(id);
  });

  // 充值/消费弹窗
  document.getElementById('recharge-btn').addEventListener('click', () => {
    const modal = document.getElementById('transaction-modal');
    document.getElementById('transaction-title').textContent = '充值';
    modal.dataset.mode = 'recharge';
    document.getElementById('transaction-amount').value = '';
    document.getElementById('transaction-note').value = '';
    modal.classList.add('active');
  });
  document.getElementById('consume-btn').addEventListener('click', () => {
    const modal = document.getElementById('transaction-modal');
    document.getElementById('transaction-title').textContent = '消费';
    modal.dataset.mode = 'consume';
    document.getElementById('transaction-amount').value = '';
    document.getElementById('transaction-note').value = '';
    modal.classList.add('active');
  });
  document.getElementById('cancel-transaction').addEventListener('click', () => {
    document.getElementById('transaction-modal').classList.remove('active');
  });
  document.getElementById('confirm-transaction').addEventListener('click', () => {
    const modal = document.getElementById('transaction-modal');
    const mode = modal.dataset.mode;
    const amount = document.getElementById('transaction-amount').value;
    const note = document.getElementById('transaction-note').value;
    const id = document.getElementById('member-detail-page').dataset.currentMemberId;
    if (!id) return;
    if (mode === 'recharge') {
      if (rechargeMember(id, amount, note)) modal.classList.remove('active');
    } else {
      if (consumeMember(id, amount, note)) modal.classList.remove('active');
    }
  });

  // 点击弹窗外部关闭
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) e.target.classList.remove('active');
  });
});
