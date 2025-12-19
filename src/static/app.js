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
        // Refresh the activities view so the new participant appears without reload
        try {
          const container = document.getElementById('activities');
          if (container) {
            fetch('/activities')
              .then(r => { if (!r.ok) throw new Error('Failed to reload activities'); return r.json(); })
              .then(data => renderActivities(container, data))
              .catch(err => console.error('Error refreshing activities:', err));
          }
        } catch (err) {
          console.error('Error scheduling activities refresh:', err);
        }
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
    .then(data => {
      renderActivities(container, data);

      // Attach click delegation once to the container for remove buttons
      if (!container.__removeListenerAdded) {
        container.addEventListener('click', async (e) => {
          const btn = e.target.closest('.remove-participant');
          if (!btn) return;

          const email = btn.dataset.email;
          const activity = btn.dataset.activity;

          try {
            const res = await fetch(`/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`, {
              method: 'DELETE'
            });

            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              alert(err.detail || 'Failed to remove participant');
              return;
            }

            // Remove the list item from the DOM
            const li = btn.closest('li');
            if (li) li.remove();

            // If the list is empty, replace it with an empty message
            const ul = btn.closest('ul');
            if (ul && ul.querySelectorAll('li').length === 0) {
              const empty = document.createElement('div');
              empty.className = 'empty';
              empty.textContent = 'No participants yet';
              ul.replaceWith(empty);
            }
          } catch (err) {
            console.error(err);
            alert('Failed to remove participant');
          }
        });
        container.__removeListenerAdded = true;
      }
    })
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
      // Create list items with a remove button for each participant
      participants.forEach(p => {
        const li = document.createElement('li');

        const span = document.createElement('span');
        span.className = 'p-email';
        span.textContent = p;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'remove-btn remove-participant';
        btn.dataset.email = p;
        btn.dataset.activity = name;
        btn.setAttribute('aria-label', `Unregister ${p}`);
        btn.textContent = '✖';

        li.appendChild(span);
        li.appendChild(btn);
        ul.appendChild(li);
      });
      partWrap.appendChild(ul);
    }

    card.appendChild(partWrap);
    container.appendChild(card);
  });

  // Note: click delegation is attached once on DOMContentLoaded (see loader below)
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
