document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('activities');

  fetch('/activities')
    .then(res => {
      if (!res.ok) throw new Error('无法获取活动列表');
      return res.json();
    })
    .then(data => renderActivities(container, data))
    .catch(err => {
      container.innerHTML = `<div class="card"><p class="empty">加载活动失败：${err.message}</p></div>`;
    });
});

function renderActivities(container, activities) {
  container.innerHTML = ''; // 清空
  Object.entries(activities).forEach(([name, info]) => {
    const card = document.createElement('article');
    card.className = 'card';

    // 标题与元信息
    const title = document.createElement('h3');
    title.textContent = name;
    card.appendChild(title);

    if (info.instructor) {
      const inst = document.createElement('div');
      inst.className = 'meta';
      inst.textContent = `Instructor: ${info.instructor}`;
      card.appendChild(inst);
    }

    if (info.schedule) {
      const sched = document.createElement('div');
      sched.className = 'meta';
      sched.textContent = `Schedule: ${info.schedule}`;
      card.appendChild(sched);
    }

    if (info.description) {
      const desc = document.createElement('p');
      desc.className = 'desc';
      desc.textContent = info.description;
      card.appendChild(desc);
    }

    // Participants 区块
    const partWrap = document.createElement('div');
    partWrap.className = 'participants';
    const ph = document.createElement('h4');
    ph.textContent = 'Participants';
    partWrap.appendChild(ph);

    const participants = Array.isArray(info.participants) ? info.participants : [];
    if (participants.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'No participants yet';
      partWrap.appendChild(empty);
    } else {
      const ul = document.createElement('ul');
      participants.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        ul.appendChild(li);
      });
      partWrap.appendChild(ul);
    }

    card.appendChild(partWrap);
    container.appendChild(card);
  });
}
