// Buka modal dan isi data project
function openEditModal(
  id,
  name,
  description,
  startDate,
  endDate,
  technologies,
) {
  document.getElementById("editId").value = id;
  document.getElementById("editProjectName").value = name;
  document.getElementById("editDescription").value = description;
  document.getElementById("editStartDate").value = startDate;
  document.getElementById("editEndDate").value = endDate;

  // reset semua checkbox dulu
  document
    .querySelectorAll("#editModal input[type='checkbox']")
    .forEach((cb) => {
      cb.checked = false;
    });

  // centang yang sesuai
  if (technologies && Array.isArray(technologies)) {
    technologies.forEach((techId) => {
      const cb = document.getElementById("editTech" + techId);
      if (cb) cb.checked = true;
    });
  }

  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

// Submit edit via fetch
async function submitEdit() {
  const id = document.getElementById("editId").value;
  const projectName = document.getElementById("editProjectName").value.trim();
  const description = document.getElementById("editDescription").value.trim();
  const startDate = document.getElementById("editStartDate").value;
  const endDate = document.getElementById("editEndDate").value;

  // validasi
  if (!projectName || !description || !startDate || !endDate) {
    alert("Semua field wajib diisi");
    return;
  }

  // ambil technologies yang dicentang
  const technologies = [];
  document
    .querySelectorAll("#editModal input[type='checkbox']:checked")
    .forEach((cb) => {
      technologies.push(cb.value);
    });

  try {
    const res = await fetch(`/edit-project/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectName,
        description,
        startDate,
        endDate,
        technologies,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      location.reload();
    } else {
      alert(data.message || "Gagal update");
    }
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan");
  }
}
