document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      // ambil data dari attribute
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const description = btn.dataset.description;
      const start = btn.dataset.start;
      const end = btn.dataset.end;

      // technologies dari HBS jadi string "Node.js,React.js"
      const techString = btn.dataset.technologies || "";
      const techList = techString
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // isi form modal
      document.getElementById("editId").value = id;
      document.getElementById("editProjectName").value = name;
      document.getElementById("editDescription").value = description;
      document.getElementById("editStartDate").value = new Date(start)
        .toISOString()
        .split("T")[0];
      document.getElementById("editEndDate").value = new Date(end)
        .toISOString()
        .split("T")[0];

      // reset semua checkbox
      for (let i = 1; i <= 6; i++) {
        document.getElementById(`editTech${i}`).checked = false;
      }

      // map nama tech ke id checkbox
      const techMap = {
        "Node.js": "editTech1",
        "React.js": "editTech2",
        "Next.js": "editTech3",
        TypeScript: "editTech4",
        "Vue.js": "editTech5",
        Laravel: "editTech6",
      };

      techList.forEach((techName) => {
        const cbId = techMap[techName];
        if (cbId) document.getElementById(cbId).checked = true;
      });

      new bootstrap.Modal(document.getElementById("editModal")).show();
    });
  });
});

async function submitEdit() {
  const id = document.getElementById("editId").value;

  const techs = [];
  for (let i = 1; i <= 6; i++) {
    if (document.getElementById(`editTech${i}`).checked) {
      techs.push(i);
    }
  }

  // buat form dinamis lalu submit
  const form = document.createElement("form");
  form.method = "POST";
  form.action = `/edit-project/${id}`;

  const fields = {
    projectName: document.getElementById("editProjectName").value,
    description: document.getElementById("editDescription").value,
    startDate: document.getElementById("editStartDate").value,
    endDate: document.getElementById("editEndDate").value,
  };

  // tambah field biasa
  for (const [key, val] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = val;
    form.appendChild(input);
  }

  // tambah technologies
  techs.forEach((t) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "technologies";
    input.value = t;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
