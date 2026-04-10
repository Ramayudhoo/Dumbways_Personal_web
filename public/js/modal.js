window.openEditModal = function (id, name, desc, start, end, techs) {
  document.getElementById("editId").value = id;
  document.getElementById("editProjectName").value = name;
  document.getElementById("editDescription").value = desc;
  document.getElementById("editStartDate").value = new Date(start)
    .toISOString()
    .split("T")[0];

  document.getElementById("editEndDate").value = new Date(end)
    .toISOString()
    .split("T")[0];

  for (let i = 1; i <= 6; i++) {
    document.getElementById(`editTech${i}`).checked = false;
  }
  if (techs) {
    const arr = techs.split(",");
    for (const tech of arr) {
      document.getElementById(`editTech${tech}`).checked = true;
    }
  }

  new bootstrap.Modal(document.getElementById("editModal")).show();
};

async function submitEdit() {
  const id = document.getElementById("editId").value;

  const techs = [];
  for (let i = 1; i <= 6; i++) {
    if (document.getElementById(`editTech${i}`).checked) {
      techs.push(i);
    }
  }

  const data = {
    projectName: document.getElementById("editProjectName").value,
    description: document.getElementById("editDescription").value,
    startDate: document.getElementById("editStartDate").value,
    endDate: document.getElementById("editEndDate").value,
    technologies: techs,
  };

  const res = await fetch(`/edit-project/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    alert(result.message);
  } else {
    alert(result.message);
    location.reload();
  }
}
