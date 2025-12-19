document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('activities');
  if (!container) return;

  fetch('/activities')
    .then(res => {
      if (!res.ok) throw new Error('无法获取活动列表');
      return res.json();
    })
    .then(data => renderActivities(container, data))
    .catch(err => {
      container.innerHTML = `<div class="card"><p class="empty">加载活动失败：${escapeHtml(err.message)}</p></div>`;
    });
});

function renderActivities(container, activities) {
  container.innerHTML = '';
  Object.entries(activities).forEach(([name, info]) => {
    const card = document.createElement('article');
    card.className = 'card';

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

    // Participants section
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

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
