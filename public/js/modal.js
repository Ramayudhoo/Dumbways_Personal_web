document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const description = btn.dataset.description;
      const start = btn.dataset.start;
      const end = btn.dataset.end;
      const image = btn.dataset.image;

      const techString = btn.dataset.technologies || "";
      const techList = techString
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      document.getElementById("editId").value = id;
      document.getElementById("editProjectName").value = name;
      document.getElementById("editDescription").value = description;
      document.getElementById("editStartDate").value = new Date(start)
        .toISOString()
        .split("T")[0];
      document.getElementById("editEndDate").value = new Date(end)
        .toISOString()
        .split("T")[0];

      // set form action
      document.getElementById("editForm").action = `/edit-project/${id}`;

      // preview image lama
      const preview = document.getElementById("currentImagePreview");
      if (image) {
        preview.innerHTML = `<img src="${image}" style="height:100px; object-fit:cover; border-radius:6px;" /> <small class="text-muted d-block mt-1">Image saat ini</small>`;
      } else {
        preview.innerHTML = `<small class="text-muted">Belum ada image</small>`;
      }

      // reset checkbox
      const techMap = {
        "Node.js": "editTech1",
        "React.js": "editTech2",
        "Next.js": "editTech3",
        TypeScript: "editTech4",
        "Vue.js": "editTech5",
        Laravel: "editTech6",
      };
      Object.values(techMap).forEach((id) => {
        document.getElementById(id).checked = false;
      });
      techList.forEach((techName) => {
        const cbId = techMap[techName];
        if (cbId) document.getElementById(cbId).checked = true;
      });

      new bootstrap.Modal(document.getElementById("editModal")).show();
    });
  });
});

function submitEdit() {
  const form = document.getElementById("editForm");

  // validasi
  const projectName = document.getElementById("editProjectName").value.trim();
  const description = document.getElementById("editDescription").value.trim();
  const startDate = document.getElementById("editStartDate").value;
  const endDate = document.getElementById("editEndDate").value;

  if (!projectName || !description || !startDate || !endDate) {
    alert("Semua field wajib diisi");
    return;
  }

  form.submit();
}
